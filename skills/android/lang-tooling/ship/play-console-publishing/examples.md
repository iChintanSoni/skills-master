## Flexible in-app update with Kotlin coroutines

Check for an available update at app start and download it in the background. When the download is complete, prompt the user to install without interrupting their current task.

```kotlin
class UpdateManager(
    private val context: Context,
    private val appUpdateManager: AppUpdateManager = AppUpdateManagerFactory.create(context),
) {
    suspend fun checkAndStartFlexibleUpdate(activity: Activity) {
        val appUpdateInfo = appUpdateManager.requestAppUpdateInfo().await()

        if (appUpdateInfo.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE &&
            appUpdateInfo.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE)
        ) {
            appUpdateManager.startUpdateFlowForResult(
                appUpdateInfo,
                activity,
                AppUpdateOptions.newBuilder(AppUpdateType.FLEXIBLE).build(),
                REQUEST_CODE_UPDATE,
            )
        }
    }

    fun registerInstallStateListener(onDownloadComplete: () -> Unit): InstallStateUpdatedListener {
        val listener = InstallStateUpdatedListener { state ->
            if (state.installStatus() == InstallStatus.DOWNLOADED) {
                onDownloadComplete()
            }
        }
        appUpdateManager.registerListener(listener)
        return listener
    }

    fun completeUpdate() {
        appUpdateManager.completeUpdate()
    }

    fun unregisterListener(listener: InstallStateUpdatedListener) {
        appUpdateManager.unregisterListener(listener)
    }

    companion object {
        const val REQUEST_CODE_UPDATE = 1001
    }
}
```

```kotlin
// In your Activity or Composable host
class MainActivity : ComponentActivity() {
    private val updateManager by lazy { UpdateManager(this) }
    private var installListener: InstallStateUpdatedListener? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        installListener = updateManager.registerInstallStateListener {
            showSnackbarForCompleteUpdate()
        }
        lifecycleScope.launch {
            updateManager.checkAndStartFlexibleUpdate(this@MainActivity)
        }
    }

    private fun showSnackbarForCompleteUpdate() {
        Snackbar.make(
            findViewById(android.R.id.content),
            "Update downloaded. Restart to apply.",
            Snackbar.LENGTH_INDEFINITE,
        ).setAction("Restart") {
            updateManager.completeUpdate()
        }.show()
    }

    override fun onDestroy() {
        super.onDestroy()
        installListener?.let { updateManager.unregisterListener(it) }
    }
}
```

---

## In-app review after a meaningful user action

Trigger the Play review sheet after the user completes a task — not on launch and not on every session.

```kotlin
class ReviewRequester(
    context: Context,
    private val reviewManager: ReviewManager = ReviewManagerFactory.create(context),
    private val prefs: SharedPreferences,
) {
    suspend fun requestReviewIfEligible(activity: Activity) {
        val launchCount = prefs.getInt(KEY_LAUNCH_COUNT, 0)
        val alreadyReviewed = prefs.getBoolean(KEY_ALREADY_PROMPTED, false)

        // Only ask after 5+ meaningful uses and only once per install
        if (launchCount < 5 || alreadyReviewed) return

        runCatching {
            val reviewInfo = reviewManager.requestReviewFlow().await()
            reviewManager.launchReviewFlow(activity, reviewInfo).await()
            // RESULT_OK means the flow finished without error, NOT that a review was left
            prefs.edit { putBoolean(KEY_ALREADY_PROMPTED, true) }
        }.onFailure { e ->
            // Non-fatal: Play may have suppressed the sheet due to quota
            Log.d("ReviewRequester", "Review flow suppressed or failed", e)
        }
    }

    companion object {
        private const val KEY_LAUNCH_COUNT = "review_launch_count"
        private const val KEY_ALREADY_PROMPTED = "review_prompted"
    }
}
```

---

## Play Integrity token request and server-side verification

Generate a nonce on the backend, request an integrity token in the app, and verify it server-side before executing a sensitive operation (in-app purchase confirmation, score submission).

```kotlin
// Client — request the integrity token
class IntegrityChecker(context: Context) {
    private val integrityManager = IntegrityManagerFactory.create(context)

    suspend fun getIntegrityToken(nonce: String): String {
        val request = IntegrityTokenRequest.builder()
            .setNonce(nonce)   // base64-encoded, generated server-side
            .build()
        val response = integrityManager.requestIntegrityToken(request).await()
        return response.token()
    }
}
```

```kotlin
// ViewModel — tie nonce fetch + token request + backend call together
class PurchaseViewModel(
    private val integrityChecker: IntegrityChecker,
    private val purchaseApi: PurchaseApi,
) : ViewModel() {

    fun confirmPurchase(purchaseToken: String) {
        viewModelScope.launch {
            try {
                val nonce = purchaseApi.generateNonce()          // server issues a fresh nonce
                val integrityToken = integrityChecker.getIntegrityToken(nonce)
                purchaseApi.confirmPurchase(purchaseToken, integrityToken)  // server verifies
            } catch (e: IntegrityServiceException) {
                handleIntegrityError(e.errorCode)
            }
        }
    }
}
```

---

## Staged rollout with Gradle Play Publisher (CI)

Use the [Gradle Play Publisher](https://github.com/Triple-T/gradle-play-publisher) plugin to automate AAB uploads from CI without opening the Play Console.

```kotlin
// build.gradle.kts (app module)
plugins {
    id("com.android.application")
    id("com.github.triplet.play") version "3.10.1"
}

play {
    serviceAccountCredentials.set(file(System.getenv("PLAY_SERVICE_ACCOUNT_JSON") ?: "play-key.json"))
    track.set("internal")           // promote to "alpha", "beta", or "production" separately
    releaseStatus.set(ReleaseStatus.COMPLETED)
    userFraction.set(0.1)           // 10 % staged rollout when track is "production"
}
```

Then in your CI pipeline:

```bash
./gradlew bundleRelease publishReleaseBundle
```

Promote a build that has already been uploaded to internal testing to production with a 10 % rollout:

```bash
./gradlew promoteArtifact \
  --from-track internal \
  --promote-track production \
  --release-status inProgress \
  --user-fraction 0.1
```
