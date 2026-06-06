---
name: performance-profiling
description: Covers profiling and performance analysis on Android — Android Studio Profiler (CPU, memory, energy, network), system tracing with Perfetto, diagnosing jank and slow startup, and a repeatable workflow for finding and fixing hotspots. Use when investigating frame drops, slow app startup, memory growth, excessive battery drain, or unexplained ANRs in an Android Kotlin app.
tags: [android, performance, profiling, jank, startup, tracing]
x-skills-master:
  domain: android
  class: lang-tooling
  category: ship
  platforms: ["android"]
  requires: { "android": "16", "kotlin": "2.2" }
  pairs_with: []
  sources:
    - https://developer.android.com/topic/performance/overview
    - https://developer.android.com/studio/profile
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Use this skill whenever you need to diagnose or fix a performance problem in an Android app: UI jank (dropped frames), slow cold or warm start, memory leaks or excessive allocations, high battery consumption, or slow network responses. It covers the full toolchain — Android Studio Profiler sessions, Perfetto system traces, and the code-level changes that resolve common hotspots.

---

## Core guidance

### The profiling workflow

1. **Reproduce on a real device.** Emulators give misleading CPU and energy numbers. Use a device that matches your lowest-end target.
2. **Use a release-like build.** Profile with `minifyEnabled true` and R8 enabled in a `benchmark` or `releaseDebuggable` build variant; debug builds inflate method counts and disable optimisations that matter in production.
3. **Attach the profiler, not guesswork.** Open **Android Studio → View → Tool Windows → Profiler** and start a session. Let the data direct you to the real bottleneck before touching code.
4. **Isolate one signal at a time.** Fix the CPU hotspot first, then re-measure; fixing several things simultaneously makes causality unclear.
5. **Verify with a macro-benchmark.** After applying a fix, write a `Macrobenchmark` test so the regression cannot silently reappear in CI.

### Android Studio Profiler

The Profiler is the entry point for most investigations. Each track has a distinct use case:

- **CPU Profiler** — records method/function traces or sampled stack traces. Use *System Trace* mode to see which threads are running and where they are blocked. Use *Java/Kotlin Method Trace* to pinpoint slow functions.
- **Memory Profiler** — shows heap allocations over time. Capture a heap dump to find leaked `Activity`/`Fragment` instances or Compose recomposition objects still in memory. The *Allocation* track highlights short-lived objects that pressure GC.
- **Energy Profiler** — aggregates CPU wakelock, network, and GPS usage. Useful when battery reports come in: look for patterns of frequent short wake-locks rather than one large one.
- **Network Profiler** — shows request/response timing and payload sizes per `OkHttp` or `HttpUrlConnection` request. Reveals chattiness or large uncompressed payloads.

**Recording tips:**
- For startup, choose *Profile* → *Add trace* → select your app before it starts, or use the **Startup CPU profiling** configuration.
- Prefer *Callstack Sample* (sampled) over *Java Method Trace* (instrumented) for production-representative timings; instrumentation adds overhead that inflates every frame.
- Save trace files as `.perfetto-trace` or `.trace` and share them; teammates can open them without a live device.

### System tracing with Perfetto

Perfetto is the underlying trace engine for Android 10+. Use it when you need cross-process visibility (SurfaceFlinger, binder calls, kernel scheduler) that the Studio Profiler does not expose.

- Launch Perfetto via `adb shell perfetto` or the [Perfetto UI](https://ui.perfetto.dev) for in-browser analysis of saved traces.
- The **Frame Timeline** row in Perfetto shows exactly which frames missed their deadline and whether the miss was in the app, RenderThread, or SurfaceFlinger.
- SQL queries in Perfetto UI let you filter slices: `SELECT ts, dur, name FROM slice WHERE name LIKE 'Choreographer%'` to inspect frame boundaries.

### Adding custom trace markers

Bracket your own work so it appears as named slices in both Perfetto and the Studio CPU Profiler:

```kotlin
import android.os.Trace

// Wrap any block you want to name in a trace.
inline fun <T> trace(label: String, block: () -> T): T {
    Trace.beginSection(label)
    return try {
        block()
    } finally {
        Trace.endSection()
    }
}

// Usage — visible in Perfetto and Android Studio System Trace
class FeedRepository {
    suspend fun loadFeed(): List<Post> = withContext(Dispatchers.IO) {
        trace("FeedRepository.loadFeed") {
            db.postDao().getAll()
        }
    }
}

// Compose: androidx.compose.runtime.trace is a first-party wrapper
@Composable
fun FeedScreen(viewModel: FeedViewModel) {
    androidx.compose.runtime.trace("FeedScreen.recomposition") {
        val posts by viewModel.posts.collectAsStateWithLifecycle()
        LazyColumn {
            items(posts, key = { it.id }) { PostCard(it) }
        }
    }
}
```

For Compose, `androidx.compose.runtime.trace("label") {}` integrates with the Composition trace and appears as named slices automatically — no manual `beginSection` needed.

### Diagnosing jank

- Target 16 ms per frame (60 Hz) or 8 ms (120 Hz). Any composable that causes a recomposition taking more than this budget on the main thread drops frames.
- In Layout Inspector → Recomposition Highlighter, composables that recompose on every frame glow red. Move state reads as deep in the tree as possible so only the smallest subtree recomposes.
- Avoid reading a `StateFlow` at a high level and passing a derived value down; derive the value with `remember { derivedStateOf { … } }` so recomposition is scoped.
- Move image decoding, JSON parsing, or any work over ~1 ms off the main thread with `withContext(Dispatchers.Default)`.

### Diagnosing slow startup

- Measure startup with `Macrobenchmark` + `StartupMode.COLD` or `StartupMode.WARM`; do not rely on Logcat timestamps.
- Trace the startup phase with **Startup CPU profile** in Android Studio; look for time spent in `Application.onCreate` and the first `Activity.onCreate`.
- Defer initialisation that is not needed on the first frame: use `App Startup` library (`androidx.startup`) with lazy `Initializer` implementations, or move work into `lifecycleScope.launch { }` after the first frame.
- Profile with **Baseline Profiles** enabled in production; `profileinstaller` causes the AOT compiler to pre-compile hot methods identified in the baseline profile, reducing JIT overhead on first run.

### Macrobenchmark for regressions

```kotlin
// benchmark/src/androidTest/kotlin/StartupBenchmark.kt
@RunWith(AndroidJUnit4::class)
class StartupBenchmark {
    @get:Rule
    val benchmarkRule = MacrobenchmarkRule()

    @Test
    fun coldStartup() = benchmarkRule.measureRepeated(
        packageName = "com.example.app",
        metrics = listOf(StartupTimingMetric()),
        iterations = 5,
        startupMode = StartupMode.COLD,
    ) {
        pressHome()
        startActivityAndWait()
    }
}
```

Run with `./gradlew :benchmark:connectedReleaseAndroidTest` and publish results to CI artifacts so startup regressions block the build.

---

## Platform notes

- **Android 16 (API 36)** ships with improved frame pacing APIs and a new adaptive refresh rate API. System traces on API 36 devices include `VSync` intervals for all refresh rates; read the `FrameTimeline` track, not raw `Choreographer` callbacks, to determine whether a frame was late.
- **Compose compiler metrics** (enabled via `freeCompilerArgs += "-P", "plugin:androidx.compose.compiler.plugins.kotlin:reportsDestination=..."`) emit `*-composables.csv` files listing inferred stability and skippability for every composable — essential for diagnosing recomposition hot paths without attaching a profiler.
- The `Trace` API (`android.os.Trace`) is a no-op in release builds unless `android:debuggable="true"` is set or the trace category is explicitly enabled, so trace markers have zero production overhead.
- Perfetto's `heapprofd` (heap profiler) runs on-device and captures native allocations without recompiling the app — invoke via `adb shell heap_profile --pid <pid>`.

---

## Pitfalls

- **Profiling a debug build.** Debug builds have interpretation overhead and no R8/ProGuard optimisations. Always benchmark and profile a `releaseDebuggable` or `benchmark` variant; debug results are directionally useful but not representative of production.
- **Trusting Logcat timestamp math for startup.** Manual log timestamps measure only what you log; the system may be spending time in framework code before your log fires. Use `StartupTimingMetric` or the Perfetto `ActivityStart` slice.
- **Fixing allocations before measuring.** Premature micro-optimisation around allocation reduction often does nothing measurable. Profile first; the GC on modern ART is generational and fast for short-lived objects.
- **Blocking the main thread in `ViewModel.init`.** Synchronous disk or network reads in `init` delay the first frame. Trigger loading via `viewModelScope.launch` and emit a loading state.
- **Ignoring recomposition counts.** A composable that recomposes 20 times per second for a UI that never changes is always a bug. Enable the Recomposition Highlighter in Layout Inspector during interactive testing, not just under profiler load.
- **Skipping Baseline Profiles.** Apps without a baseline profile spend the first few minutes of a new install doing JIT compilation, which inflates perceived startup and raises CPU temperature. Generate and ship a profile with every release.
- **Comparing numbers across devices.** An optimization that saves 5 ms on a flagship may save 50 ms on a low-end device. Always validate on your minimum-spec device.

---

## References

- **Android Developers:** [App performance overview](https://developer.android.com/topic/performance/overview)
- **Android Developers:** [Profile your app — Android Studio Profiler](https://developer.android.com/studio/profile)
- **Android Developers:** [Macrobenchmark — measure startup and scrolling](https://developer.android.com/topic/performance/benchmarking/macrobenchmark-overview)

---

## See also

The `kotlin-coroutines` skill covers moving blocking work off the main thread, which resolves many jank and ANR issues surfaced by the profiler. The `kotlin-flow` skill explains how to avoid unnecessary recompositions when collecting flows in Compose. For CI enforcement of performance budgets, see `ci-cd-signing` to understand how to attach Macrobenchmark results to your build pipeline.
