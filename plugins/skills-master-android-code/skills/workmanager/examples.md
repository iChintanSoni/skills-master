## Scenario 1: Uploading user-generated content with retry and progress

A photo-sharing app needs to upload selected photos to a remote server. Uploads must survive the user switching apps mid-upload, respect network availability, and report progress back to the UI.

```kotlin
// Worker
@HiltWorker
class PhotoUploadWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted params: WorkerParameters,
    private val uploadService: PhotoUploadService,
    private val photoRepository: PhotoRepository,
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val photoId = inputData.getLong("photo_id", -1L)
            .takeIf { it != -1L } ?: return Result.failure()

        val photo = photoRepository.getById(photoId) ?: return Result.failure()

        setProgress(workDataOf("status" to "uploading", "progress" to 0))

        return try {
            val remoteUrl = uploadService.upload(photo) { bytesUploaded, total ->
                // Progress callback — report back to WorkManager observers
                val pct = ((bytesUploaded.toFloat() / total) * 100).toInt()
                setProgressAsync(workDataOf("status" to "uploading", "progress" to pct))
            }
            photoRepository.markUploaded(photoId, remoteUrl)
            Result.success(workDataOf("remote_url" to remoteUrl))
        } catch (e: HttpException) {
            // 4xx — permanent failure, do not retry
            if (e.code() in 400..499) Result.failure(workDataOf("error_code" to e.code()))
            else if (runAttemptCount < 4) Result.retry()
            else Result.failure()
        } catch (e: IOException) {
            if (runAttemptCount < 4) Result.retry() else Result.failure()
        }
    }
}

// Enqueue from ViewModel
fun enqueueUpload(photoId: Long) {
    val request = OneTimeWorkRequestBuilder<PhotoUploadWorker>()
        .setConstraints(
            Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()
        )
        .setInputData(workDataOf("photo_id" to photoId))
        .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 15, TimeUnit.SECONDS)
        .addTag("photo_upload")
        .build()

    workManager.enqueueUniqueWork(
        "upload_photo_$photoId",
        ExistingWorkPolicy.KEEP,
        request,
    )
}

// Observe progress in ViewModel
val uploadProgress: StateFlow<UploadUiState> = workManager
    .getWorkInfosByTagFlow("photo_upload")
    .map { infos ->
        val info = infos.firstOrNull() ?: return@map UploadUiState.Idle
        when (info.state) {
            WorkInfo.State.RUNNING -> {
                val pct = info.progress.getInt("progress", 0)
                UploadUiState.Uploading(pct)
            }
            WorkInfo.State.SUCCEEDED -> UploadUiState.Done(
                info.outputData.getString("remote_url").orEmpty()
            )
            WorkInfo.State.FAILED -> UploadUiState.Failed(
                info.outputData.getInt("error_code", -1)
            )
            else -> UploadUiState.Idle
        }
    }
    .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), UploadUiState.Idle)
```

---

## Scenario 2: Multi-step data pipeline with chaining

A fitness app needs to (1) fetch raw workout data from a wearable API, (2) run a local ML model to score each workout, and (3) sync the results to the cloud. Each step depends on the previous and all must be deferrable.

```kotlin
// Step 1 — fetch raw data, output a database row ID
class FetchWorkoutWorker(ctx: Context, params: WorkerParameters) : CoroutineWorker(ctx, params) {
    override suspend fun doWork(): Result {
        return try {
            val rowId = wearableApi.fetchLatest().let { workoutDb.insert(it) }
            Result.success(workDataOf("workout_row_id" to rowId))
        } catch (e: IOException) {
            if (runAttemptCount < 3) Result.retry() else Result.failure()
        }
    }
}

// Step 2 — score workout; reads row ID from upstream output
class ScoreWorkoutWorker(ctx: Context, params: WorkerParameters) : CoroutineWorker(ctx, params) {
    override suspend fun doWork(): Result {
        val rowId = inputData.getLong("workout_row_id", -1L)
            .takeIf { it >= 0 } ?: return Result.failure()
        val workout = workoutDb.get(rowId) ?: return Result.failure()
        val score = mlModel.score(workout)
        workoutDb.updateScore(rowId, score)
        return Result.success(workDataOf("workout_row_id" to rowId))
    }
}

// Step 3 — cloud sync
class SyncWorkoutWorker(ctx: Context, params: WorkerParameters) : CoroutineWorker(ctx, params) {
    override suspend fun doWork(): Result {
        val rowId = inputData.getLong("workout_row_id", -1L)
            .takeIf { it >= 0 } ?: return Result.failure()
        val workout = workoutDb.get(rowId) ?: return Result.failure()
        return try {
            api.syncWorkout(workout)
            Result.success()
        } catch (e: IOException) {
            if (runAttemptCount < 2) Result.retry() else Result.failure()
        }
    }
}

// Chain and enqueue — unique by design so only one pipeline runs at a time
fun scheduleWorkoutPipeline(workManager: WorkManager) {
    val networkConstraint = Constraints.Builder()
        .setRequiredNetworkType(NetworkType.CONNECTED)
        .build()

    val fetch = OneTimeWorkRequestBuilder<FetchWorkoutWorker>().build()
    val score = OneTimeWorkRequestBuilder<ScoreWorkoutWorker>().build()
    val sync  = OneTimeWorkRequestBuilder<SyncWorkoutWorker>()
        .setConstraints(networkConstraint)
        .build()

    workManager
        .beginUniqueWork("workout_pipeline", ExistingWorkPolicy.APPEND_OR_REPLACE, fetch)
        .then(score)
        .then(sync)
        .enqueue()
}
```

---

## Scenario 3: Periodic background sync with ExistingWorkPolicy.KEEP

A news reader app performs a background feed refresh every 4 hours when on an unmetered network. The schedule is established at app startup and must not accumulate duplicates across restarts.

```kotlin
fun scheduleFeedRefresh(workManager: WorkManager) {
    val constraints = Constraints.Builder()
        .setRequiredNetworkType(NetworkType.UNMETERED)
        .setRequiresBatteryNotLow(true)
        .build()

    val request = PeriodicWorkRequestBuilder<FeedRefreshWorker>(4, TimeUnit.HOURS)
        .setConstraints(constraints)
        .setBackoffCriteria(BackoffPolicy.LINEAR, 10, TimeUnit.MINUTES)
        .addTag("feed_refresh")
        .build()

    // KEEP: if a periodic request with this name already exists, leave it in place
    workManager.enqueueUniquePeriodicWork(
        "feed_refresh",
        ExistingPeriodicWorkPolicy.KEEP,
        request,
    )
}

// Worker
class FeedRefreshWorker(ctx: Context, params: WorkerParameters) : CoroutineWorker(ctx, params) {
    override suspend fun doWork(): Result {
        return try {
            val freshArticles = feedApi.fetchLatest()
            articleDb.upsertAll(freshArticles)
            Result.success(workDataOf("refreshed_count" to freshArticles.size))
        } catch (e: Exception) {
            Result.retry()
        }
    }
}
```

---

## Scenario 4: Expedited work for a user-initiated action

A document editor allows the user to explicitly export a PDF. The export must start immediately and should be treated as expedited work because it was directly triggered by a user tap.

```kotlin
class PdfExportWorker(ctx: Context, params: WorkerParameters) : CoroutineWorker(ctx, params) {
    override suspend fun doWork(): Result {
        val docId = inputData.getString("doc_id") ?: return Result.failure()
        return try {
            val path = pdfRenderer.render(docId)
            Result.success(workDataOf("export_path" to path))
        } catch (e: Exception) {
            Result.failure()
        }
    }

    // Required on Android < 12 when work runs as a foreground service
    override suspend fun getForegroundInfo(): ForegroundInfo {
        val notification = NotificationCompat.Builder(applicationContext, "export_channel")
            .setContentTitle("Exporting PDF…")
            .setSmallIcon(R.drawable.ic_export)
            .setOngoing(true)
            .build()
        return ForegroundInfo(NOTIFICATION_ID, notification)
    }

    companion object { private const val NOTIFICATION_ID = 42 }
}

fun exportPdfNow(workManager: WorkManager, docId: String) {
    val request = OneTimeWorkRequestBuilder<PdfExportWorker>()
        .setExpedited(OutOfQuotaPolicy.RUN_AS_NON_EXPEDITED_WORK_REQUEST)
        .setInputData(workDataOf("doc_id" to docId))
        .addTag("pdf_export")
        .build()

    workManager.enqueueUniqueWork(
        "export_pdf_$docId",
        ExistingWorkPolicy.KEEP,
        request,
    )
}
```
