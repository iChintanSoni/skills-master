---
name: crash-anr-vitals
description: Covers diagnosing crashes and ANRs on Android — reading stack traces and traces, applying the main-thread responsibility rule, identifying common ANR causes, and monitoring Android vitals in Play Console. Use when investigating stability regressions, integrating a crash reporter, or reducing crash/ANR rates to meet Play Store thresholds.
---

## When to use

Apply this skill when a release shows elevated crash or ANR rates in Play Console, when integrating a crash-reporting SDK (Firebase Crashlytics, Sentry, etc.), when investigating a `StrictMode` ANR violation locally, or when reviewing code for work performed on the main thread. Also applies when reading a tombstone, `traces.txt`, or a bugreport to diagnose a production incident.

## Core guidance

### The main-thread responsibility rule

The Android UI thread renders frames and dispatches input events. Any work that blocks it for more than **5 seconds** triggers an ANR dialog; any unhandled exception on any thread terminates the process.

- **Never** perform network I/O, disk I/O, database queries, or long-running computation on the main thread.
- Use `Dispatchers.IO` or `Dispatchers.Default` for off-thread work; switch back to `Dispatchers.Main` only to update UI.
- Enable `StrictMode.ThreadPolicy` in debug builds to catch main-thread violations before they reach production.

```kotlin
// build.gradle.kts — keep StrictMode in debug builds only
// Application.onCreate()
class App : Application() {
    override fun onCreate() {
        super.onCreate()
        if (BuildConfig.DEBUG) {
            StrictMode.setThreadPolicy(
                StrictMode.ThreadPolicy.Builder()
                    .detectAll()
                    .penaltyLog()
                    .penaltyDeath() // fail fast locally
                    .build()
            )
            StrictMode.setVmPolicy(
                StrictMode.VmPolicy.Builder()
                    .detectLeakedSqlLiteObjects()
                    .detectLeakedClosableObjects()
                    .penaltyLog()
                    .build()
            )
        }
    }
}

// ViewModel — correct dispatcher usage
class OrderViewModel(
    private val repo: OrderRepository
) : ViewModel() {
    private val _orders = MutableStateFlow<List<Order>>(emptyList())
    val orders: StateFlow<List<Order>> = _orders.asStateFlow()

    fun load() {
        viewModelScope.launch {
            // withContext moves work off Main automatically
            val result = withContext(Dispatchers.IO) { repo.fetchOrders() }
            _orders.value = result
        }
    }
}
```

### ANR causes and detection

**Common triggers:**

- Synchronous network or database call on the main thread.
- Deadlock between the main thread and a background lock (e.g., `synchronized` block held by a background thread while the main thread is waiting).
- `BroadcastReceiver.onReceive()` taking longer than 10 seconds (foreground) or 60 seconds (background).
- `Service.onCreate()` or `onStartCommand()` blocking the main thread before returning.
- `ContentProvider.query()` executing a slow query synchronously from the calling thread.

**Local detection workflow:**

1. Enable `StrictMode` (see above); violations are logged with a stack trace.
2. Run the scenario; watch Logcat for `StrictMode policy violation` or the ANR dialog.
3. Pull the latest trace with `adb pull /data/anr/traces.txt` or use Android Studio's "ANR report" in the App Inspection panel.

**Reading `traces.txt` / tombstones:**

- Find the thread named `main` (or `Thread-1`); its stack is the call in progress when the ANR fired.
- Look for `MONITOR` or `LOCK HELD` lines indicating a deadlock — another thread holds a lock the main thread is waiting on.
- Tombstone files (`/data/tombstones/tombstone_XX`) contain the native signal, fault address, and C++ / JNI backtrace. Symbolicate with `ndk-stack` or Android Studio's native debugger.

### Crash reporting integration

- Integrate a crash SDK (Crashlytics, Sentry) early; both automatically capture uncaught exceptions and ANR-like freezes via `ApplicationExitInfo`.
- Use `ActivityManager.getHistoricalProcessExitReasons()` (API 30+) to programmatically retrieve exit reasons, including ANR, crash, and OOM, on next launch.
- Set a custom `Thread.setDefaultUncaughtExceptionHandler` only when you genuinely need pre-crash logic (flush logs, write breadcrumbs); always re-throw or call the previous handler to avoid suppressing crashes.
- Tag crashes with user-visible context (screen name, feature flag values) as custom keys so clusters in the dashboard map directly to code paths.

### Android vitals in Play Console

- **Thresholds (2026):** crash rate bad behaviour threshold is ~1.09 % of daily active users; ANR rate threshold is ~0.47 %. Exceeding these triggers Play Store demotion.
- Navigate to Play Console > Android vitals > Crashes & ANRs to see clustered stack traces ranked by impact, OS version breakdowns, and 28-day trend lines.
- Use the "Affected users" sort (not "occurrences") to prioritise fixes — a rare crash in a tight loop reports many occurrences but affects few users.
- Cross-reference vitals clusters with your crash SDK's release comparison feature to attribute a regression to a specific version.

### Structured error handling and crash prevention

- Use `runCatching {}` or explicit `try/catch` at async boundaries; surface structured errors via `Result<T>` or a sealed `UiState`.
- Never swallow exceptions silently (`catch (e: Exception) { }`) — at minimum log them; better, propagate or transform to a typed error state.
- Validate external data (JSON, deep-link parameters, IPC bundles) at the entry boundary; assume all inputs can be malformed.
- Guard `Fragment` back-stack and `NavController` calls; `IllegalStateException` from post-`onSaveInstanceState` state changes is one of the most common crash clusters.

## Platform notes

- **`ApplicationExitInfo` (API 30+)** provides a `REASON_ANR` exit code and a trace input stream identical to `traces.txt`; use it to upload ANR reports from within the app on next launch without ADB.
- **Foreground vs background ANR timeouts** differ: input dispatch timeout is 5 s, broadcast timeout is 10 s (foreground) / 60 s (background), service start timeout is 20 s. Know which applies when reading a report.
- **Strict mode penalties in release** — `penaltyDeath()` must not reach release builds; gate it on `BuildConfig.DEBUG`. `penaltyDropBox()` writes to the system DropBox and is safe in all builds.
- **Native crashes (JNI/NDK)** produce tombstones, not Java stack traces. Symbolicate with `ndk-stack -sym <symbol-dir> < tombstone` or upload symbol files to Play Console / Crashlytics to get human-readable frames.
- **Kotlin coroutine cancellation** — a `CancellationException` thrown inside a coroutine is not a crash; it is normal cooperative cancellation and must not be swallowed or re-thrown to a user-visible error handler.
- **Proguard/R8 obfuscation** — upload a mapping file (`app/build/outputs/mapping/release/mapping.txt`) to Play Console and your crash SDK after every release so stack frames deobfuscate correctly.

## Pitfalls

- **Blocking `suspend` functions** — calling a blocking API (e.g., `OkHttpClient.execute()`, JDBC) inside a `suspend` function without `withContext(Dispatchers.IO)` still blocks the coroutine's dispatcher thread; if that dispatcher is `Main`, an ANR follows.
- **Lock contention on main thread** — using `synchronized` or `ReentrantLock` from the main thread risks priority inversion; prefer `Mutex` from `kotlinx.coroutines` for coroutine-scoped exclusion.
- **Suppressed crash in `onReceive`** — silently catching all exceptions in a `BroadcastReceiver` masks crashes that are still ANR candidates if the receiver stalls; always let the exception propagate or log it explicitly.
- **Mis-reading ANR clusters** — the topmost frame in `traces.txt` is where execution was at trigger time, not necessarily the root cause; read the full call stack for the main thread and any lock-holding threads.
- **Missing mapping files** — publishing without uploading a mapping file makes every crash cluster show obfuscated frames; automate the upload as part of the release pipeline.
- **`Fragment` commit after `onSaveInstanceState`** — calling `commitAllowingStateLoss()` suppresses the `IllegalStateException` but silently drops the transaction; diagnose the root cause (late async callback) instead of masking it.
- **`Handler.post` from background threads** — posting UI work via a stale `Handler` reference from a destroyed `Activity` causes `NullPointerException` or `IllegalStateException`; use `lifecycleScope` or `repeatOnLifecycle` instead.

## References

- **Official guide:** [Android vitals](https://developer.android.com/topic/performance/vitals)
- **Official guide:** [ANRs](https://developer.android.com/topic/performance/vitals/anr)

## See also

The `kotlin-coroutines` skill covers correct dispatcher selection and structured concurrency, which is the primary mechanism for keeping work off the main thread. The `instruments-profiling` Apple skill is the conceptual counterpart for native profiling; on Android use the CPU Profiler in Android Studio and Perfetto for systrace-level ANR investigation. The `build-sign-distribute` skill covers mapping file generation and upload as part of the release pipeline.
