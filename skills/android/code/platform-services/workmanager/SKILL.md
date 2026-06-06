---
name: workmanager
description: Covers WorkManager for deferrable, guaranteed background work — OneTimeWorkRequest, PeriodicWorkRequest, Constraints, CoroutineWorker, input/output Data, chaining and unique work, expedited work, and observing WorkInfo. Use when scheduling background tasks that must survive process death, run under specific device conditions, or chain into multi-step pipelines.
globs:
  - "**/*.kt"
tags: [workmanager, background-work, coroutines, android, jetpack]
x-skills-master:
  domain: android
  class: code
  category: platform-services
  platforms: ["android", "large-screen"]
  requires: { "android": "16", "kotlin": "2.2" }
  pairs_with: [choosing-background-work]
  sources:
    - https://developer.android.com/topic/libraries/architecture/workmanager
    - https://developer.android.com/develop/background-work/background-tasks/persistent/getting-started
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Use WorkManager for any deferred, persistent background task that must run even if the user leaves the app or the process is killed — image uploads, log batching, data sync, cache priming, or report generation. WorkManager is the correct tool when work is non-user-facing, can tolerate latency, and must respect system-imposed constraints (network, charging, storage). For tasks that need to start immediately and run while the app is in the foreground, consider coroutines alone. For API-choice guidance across all background-work options, see the `choosing-background-work` overview skill.

## Core guidance

**Choosing the right request type**
- `OneTimeWorkRequest` — execute once; retry automatically on failure using exponential or linear backoff.
- `PeriodicWorkRequest` — repeat on a defined interval (minimum 15 minutes enforced by the OS); does not support chaining.
- Build requests using the `workRequestOf` convenience function or the `OneTimeWorkRequest.Builder` / `PeriodicWorkRequest.Builder` DSL provided in `work-runtime-ktx`.

**Implementing CoroutineWorker**
- Always extend `CoroutineWorker` rather than the blocking `Worker`. The `doWork` function is a `suspend fun` running on `Dispatchers.Default` by default — switch dispatchers with `withContext` as needed.
- Return `Result.success()`, `Result.failure()`, or `Result.retry()` explicitly. Uncaught exceptions count as failure.
- Access input with `inputData.getString("key")` / `inputData.getInt("key", default)` inside `doWork`.
- Emit output via `Result.success(workDataOf("key" to value))` — downstream workers in a chain receive this as input.
- Call `setProgress(workDataOf(...))` to report intermediate progress observable by the UI.

**Constraints**
- Attach a `Constraints` object to declare prerequisites. Common constraints: `requiresNetworkType(NetworkType.CONNECTED)`, `requiresCharging()`, `requiresBatteryNotLow()`, `requiresStorageNotLow()`.
- WorkManager re-evaluates constraints whenever device conditions change; if constraints are no longer met, work pauses and resumes when they are satisfied again.
- Do not over-constrain periodic work — requiring charging AND WiFi on a periodic sync may cause it to never run on some user devices.

**Unique work — preventing duplicate enqueuing**
- Use `WorkManager.enqueueUniqueWork(name, ExistingWorkPolicy, request)` for one-time unique work.
- Use `enqueueUniquePeriodicWork` for periodic work.
- `ExistingWorkPolicy.KEEP` — do nothing if work with that name is already pending or running (correct for syncs).
- `ExistingWorkPolicy.REPLACE` — cancel and re-enqueue (correct for uploads where only the latest matters).
- `ExistingWorkPolicy.APPEND_OR_REPLACE` — append to an existing chain or replace if the chain is cancelled/failed.

**Chaining**
- `.then(requestB)` chains requests sequentially; the output `Data` of the previous step becomes the input of the next.
- `WorkManager.beginWith(listOf(a, b)).then(c).enqueue()` fans in — work `c` starts only after both `a` and `b` succeed.
- A chain fails fast: if any step returns `Result.failure()`, subsequent steps are skipped unless downstream workers read the output explicitly.

**Expedited work**
- Mark time-sensitive one-time work (user-initiated, must start quickly) by calling `.setExpedited(OutOfQuotaPolicy.RUN_AS_NON_EXPEDITED_WORK_REQUEST)` on the builder and overriding `getForegroundInfo()` in the worker to supply a notification for pre-Android 12 devices.
- Expedited work counts against a per-app quota; do not over-use it.

**Observing WorkInfo**
- `WorkManager.getWorkInfoByIdLiveData(id)` / `getWorkInfoByIdFlow(id)` — observe a single request by UUID.
- `getWorkInfosByTagFlow("tag")` — observe a group tagged at enqueue time with `.addTag("tag")`.
- Collect `WorkInfo.state` to distinguish `ENQUEUED`, `RUNNING`, `SUCCEEDED`, `FAILED`, `CANCELLED`, and `BLOCKED`.
- Read output data from `WorkInfo.outputData` once the state is `SUCCEEDED`.
- Prefer `getWorkInfoByIdFlow` in Compose ViewModels — collect with `collectAsStateWithLifecycle`.

```kotlin
// Worker
class SyncWorker(ctx: Context, params: WorkerParameters) : CoroutineWorker(ctx, params) {
    override suspend fun doWork(): Result {
        val userId = inputData.getString("userId") ?: return Result.failure()
        return try {
            val count = syncRepository.syncForUser(userId)
            Result.success(workDataOf("synced_count" to count))
        } catch (e: IOException) {
            if (runAttemptCount < 3) Result.retry() else Result.failure()
        }
    }
}

// Enqueue unique, constrained, one-time work
fun scheduleSyncIfNeeded(workManager: WorkManager, userId: String) {
    val constraints = Constraints.Builder()
        .setRequiredNetworkType(NetworkType.CONNECTED)
        .setRequiresBatteryNotLow(true)
        .build()

    val request = OneTimeWorkRequestBuilder<SyncWorker>()
        .setConstraints(constraints)
        .setInputData(workDataOf("userId" to userId))
        .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
        .addTag("sync")
        .build()

    workManager.enqueueUniqueWork(
        "user_sync_$userId",
        ExistingWorkPolicy.KEEP,
        request,
    )
}

// Observe in ViewModel
val syncState: StateFlow<WorkInfo?> = workManager
    .getWorkInfosByTagFlow("sync")
    .map { it.firstOrNull() }
    .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)
```

**Input/output Data limits**
- `Data` objects are capped at 10 KB serialised. Store large payloads in a database or file and pass only IDs through WorkManager `Data`.
- Use `workDataOf(vararg pairs: Pair<String, Any?>)` from `work-runtime-ktx` for concise construction.

**Hilt integration**
- Annotate the worker with `@HiltWorker` and its constructor with `@AssistedInject`. Declare `@Assisted context: Context` and `@Assisted params: WorkerParameters` as the first two parameters.
- Install a `HiltWorkerFactory` by calling `WorkManager.initialize(context, config)` manually (disable default initializer in `AndroidManifest.xml`) and binding the factory.

## Platform notes

- **Large-screen / ChromeOS:** WorkManager runs identically on tablets and ChromeOS; constraint evaluation (network, charging) reflects the device's actual state. Avoid assuming plug-in charging is common — on ChromeOS devices that are always plugged in, `requiresCharging()` is trivially satisfied.
- **Doze and App Standby:** WorkManager uses `JobScheduler` on API 23+ and correctly defers work to Doze maintenance windows. You do not need to handle Doze yourself; do not bypass it with `AlarmManager` for deferrable tasks.
- **Background process limits (Android 12+):** Foreground service restrictions tightened in Android 12. Expedited work is the correct replacement for short foreground-service tasks started from the background.
- **Battery optimisation:** Huawei, Xiaomi, and OPPO/Vivo OEMs apply aggressive battery optimization that can prevent background work from running unless the user whitelists the app. Document this known limitation for QA; WorkManager cannot override OEM restrictions.

## Pitfalls

- Returning `Result.retry()` unconditionally — the default backoff caps at 5 hours; work will keep retrying forever. Always check `runAttemptCount` and fall back to `Result.failure()` after a reasonable bound.
- Enqueuing the same work repeatedly without using unique work — each call creates an independent request, leading to duplicate executions.
- Passing large objects via `Data` — the 10 KB cap is enforced at runtime; exceeding it throws `IllegalStateException`. Store payloads in Room or a file; pass the row ID.
- Calling blocking network or database APIs inside a `Worker` (non-coroutine) on the main thread — extend `CoroutineWorker` and use `withContext(Dispatchers.IO)` for blocking I/O.
- Ignoring the return value of `doWork` — any exception not caught by the worker framework is treated as `Result.failure()`, which may surprise callers expecting a retry.
- Using `PeriodicWorkRequest` with a period shorter than 15 minutes — the OS silently raises it to 15 minutes. Design accordingly.
- Observing `getWorkInfosByTagFlow` and expecting exactly one emission per run — the flow emits on every state transition (`ENQUEUED` → `RUNNING` → `SUCCEEDED`). Filter by state before acting on output.
- Forgetting to disable the default `WorkManagerInitializer` content provider in the manifest when using `HiltWorkerFactory` — leaving both active causes a crash on startup.

## References

- **Documentation:** [WorkManager overview](https://developer.android.com/topic/libraries/architecture/workmanager)
- **Documentation:** [Getting started with WorkManager](https://developer.android.com/develop/background-work/background-tasks/persistent/getting-started)

## See also

For choosing between WorkManager, coroutines, foreground services, and `AlarmManager` for a given background task, see `choosing-background-work`. For coroutine dispatcher selection and structured concurrency inside `CoroutineWorker`, see `kotlin-coroutines`. For exposing `WorkInfo` state as `StateFlow` to a Compose screen, see `state-flow` and `viewmodel`. For Hilt wiring of `HiltWorkerFactory`, see `hilt-di`.
