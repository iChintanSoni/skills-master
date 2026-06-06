---
name: macrobenchmark-baseline-profiles
description: Covers performance measurement and startup optimisation using Macrobenchmark and Baseline Profiles — measuring startup, scroll, and jank with MacrobenchmarkRule, generating and shipping Baseline/Startup Profiles to precompile hot code paths, and verifying improvements in CI. Use when you need to quantify app performance regressions, reduce cold-start time, or eliminate first-draw jank in a Jetpack Compose Android app.
globs:
  - "**/*.kt"
tags: [performance, benchmarking, baseline-profiles, startup, testing]
x-skills-master:
  domain: android
  class: lang-tooling
  category: testing
  platforms: ["android"]
  requires: { "android": "16", "kotlin": "2.2" }
  pairs_with: []
  sources:
    - https://developer.android.com/topic/performance/baselineprofiles/overview
    - https://developer.android.com/topic/performance/benchmarking/macrobenchmark-overview
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Use when you need empirical data about your app's startup speed, scroll smoothness, or frame jank — rather than guessing. The workflow has two complementary halves:

- **Measure** with Macrobenchmark: write tests that run your app in a controlled way, collect precise timing data, and surface regressions in CI before they reach users.
- **Accelerate** with Baseline Profiles: generate a profile of the code paths exercised during those benchmarks, ship the profile in your APK/AAB, and let the Android Runtime precompile those paths at install time so the first run is as fast as a warm run.

Both tools belong in a dedicated `:macrobenchmark` Gradle module that targets a release build variant of your app module.

---

## Core guidance

### Module and dependency setup

Create a separate `:macrobenchmark` module so benchmarks never ship in production and can target a `benchmark`-signed release build.

```kotlin
// macrobenchmark/build.gradle.kts
plugins {
    alias(libs.plugins.android.test)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "com.example.macrobenchmark"
    compileSdk = 36
    targetProjectPath = ":app"
    experimentalProperties["android.experimental.self-instrumenting"] = true

    defaultConfig {
        minSdk = 28        // Macrobenchmark requires API 28+
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        create("benchmark") {
            isDebuggable = false
            signingConfig = signingConfigs.getByName("debug")
            matchingFallbacks += "release"
        }
    }
}

dependencies {
    implementation(libs.androidx.benchmark.macro.junit4)
    implementation(libs.androidx.test.ext.junit)
    implementation(libs.androidx.test.uiautomator)
}
```

In the `:app` module, add a `benchmark` build type that mirrors `release` and sets `profileable = true`:

```kotlin
// app/build.gradle.kts  (excerpt)
buildTypes {
    create("benchmark") {
        initWith(getByName("release"))
        isDebuggable = false
        isProfileable = true  // enables profiling without full debug overhead
        signingConfig = signingConfigs.getByName("debug")
        matchingFallbacks += "release"
    }
}
```

### Writing a startup benchmark

- Use `MacrobenchmarkRule` with `StartupMode.COLD` to flush app state and measure full cold start including class loading.
- The `measureRepeated` lambda runs in release-build process; interact through `UiAutomator`.
- Call `pressHome()` and `killProcess()` in `setupBlock` to guarantee cold conditions for each iteration.

```kotlin
@RunWith(AndroidJUnit4::class)
class StartupBenchmark {

    @get:Rule
    val rule = MacrobenchmarkRule()

    @Test
    fun startupCold() = rule.measureRepeated(
        packageName = "com.example.app",
        metrics = listOf(StartupTimingMetric()),
        iterations = 5,
        startupMode = StartupMode.COLD,
    ) {
        pressHome()
        startActivityAndWait()   // blocks until first fully-drawn frame
    }

    @Test
    fun startupWarm() = rule.measureRepeated(
        packageName = "com.example.app",
        metrics = listOf(StartupTimingMetric()),
        iterations = 5,
        startupMode = StartupMode.WARM,
    ) {
        startActivityAndWait()
    }
}
```

### Measuring scroll smoothness and jank

- Use `FrameTimingMetric` (and optionally `JankMetric` for legacy) to capture frame duration percentiles.
- Drive the UI with `UiAutomator` gestures. For Compose lazy lists, wait for the list to appear before scrolling.

```kotlin
@Test
fun scrollFeed() = rule.measureRepeated(
    packageName = "com.example.app",
    metrics = listOf(FrameTimingMetric()),
    iterations = 5,
    startupMode = StartupMode.WARM,
    setupBlock = { startActivityAndWait() },
) {
    val list = device.findObject(By.res("com.example.app:id/feed_list"))
    list.setGestureMargin(device.displayWidth / 5)
    repeat(3) {
        list.fling(Direction.DOWN)
        device.waitForIdle()
    }
}
```

### Generating a Baseline Profile

The Baseline Profile generator is a specialised Macrobenchmark that records which classes and methods are exercised, then writes a human-readable `baseline-prof.txt` into your `:app` module.

- Annotate the generator class with `@OptIn(ExperimentalBaselineProfilesApi::class)` if on older library versions.
- Cover the critical user journeys: startup, first meaningful interaction, primary screen scrolling.
- Run generation with `./gradlew :macrobenchmark:generateBaselineProfile -Pandroid.testInstrumentationRunnerArguments.androidx.benchmark.enabledRules=BaselineProfile`.

```kotlin
@RunWith(AndroidJUnit4::class)
class AppBaselineProfileGenerator {

    @get:Rule
    val rule = BaselineProfileRule()

    @Test
    fun generateBaselineProfile() = rule.collect(
        packageName = "com.example.app",
    ) {
        pressHome()
        startActivityAndWait()                     // captures startup path

        // Scroll main feed to capture layout + composition hot paths
        val feed = device.findObject(By.res("com.example.app:id/feed_list"))
        feed?.let {
            it.setGestureMargin(device.displayWidth / 5)
            repeat(3) { _ -> it.fling(Direction.DOWN) }
        }
    }
}
```

After generation, the plugin writes `app/src/main/baseline-prof.txt`. Commit this file. The `androidx.profileinstaller` library (added to `:app`) reads it at install time and triggers AOT compilation of the listed methods.

### Startup Profiles

A Startup Profile is a stricter subset: only methods needed before the first frame. Generate it the same way — the toolchain emits both files. Startup Profiles ship in the same `baseline-prof.txt` but are tagged with a `S` flag internally. The Android Runtime uses them to prioritise which methods to precompile when install-time compilation budget is constrained.

To manually annotate critical startup code (and allow the compiler to find it even when full profile generation is not run):

```kotlin
// In app startup path — marks this call graph for ART precompilation.
ProfileVerifier.getCompilationStatusAsync()   // optional: verify profile was applied
```

### Verifying profiles are applied

After installing a profiled build, confirm ART compiled the methods:

```kotlin
class ProfileVerificationTest {
    @Test
    fun profileIsCompiled() {
        val status = runBlocking {
            ProfileVerifier.getCompilationStatusAsync().await()
        }
        assertThat(status.profileInstallResultCode)
            .isEqualTo(ProfileVerifier.CompilationStatus.RESULT_CODE_COMPILED_WITH_PROFILE)
    }
}
```

### CI integration

- Run benchmarks on a physical device or a rooted emulator; benchmarks on non-rooted emulators produce unreliable numbers due to missing CPU governor access.
- In CI, use the `benchmark` build type and pass `--rerun-tasks` to avoid caching stale results.
- Capture the JSON output from `build/outputs/connected_android_test_additional_output/` and track metrics over time. Alert on regressions exceeding a threshold (e.g., `timeToFullDisplayMs` p50 increasing by more than 15 %).
- Regenerate `baseline-prof.txt` on every significant code change affecting startup or primary journeys — treat it as a source artifact, not a build artifact.

---

## Platform notes

- Baseline Profiles require `minSdk = 28` (API 28) to take full effect; on older devices the profile is ignored gracefully.
- `MacrobenchmarkRule` requires a physical device or a rooted emulator. Non-rooted emulators can run the test but results are not reliable enough for regression tracking.
- The `profileinstaller` library (required for side-loading profiles in debug/test scenarios) must be added to the `:app` module: `implementation(libs.androidx.profileinstaller)`.
- From Android 9 (API 28) onward, ART can compile profiles at install time. From Android 12 (API 31) onward, the platform also supports Cloud Profiles from Play, which complement but do not replace shipped Baseline Profiles.
- When using the AGP Baseline Profile Gradle plugin (`com.android.tools.build:gradle` 8.x+), the `generateBaselineProfile` task is built in — no separate plugin is needed.
- `FrameTimingMetric` reports `frameDurationCpuMs` percentile data. Target: p99 < 16 ms for 60 Hz, p99 < 8 ms for 120 Hz.
- `StartupTimingMetric` reports `timeToInitialDisplayMs` (first frame drawn) and `timeToFullDisplayMs` (content fully loaded). Use `reportFullyDrawn()` in your `Activity` or Compose code to mark the latter accurately.

---

## Pitfalls

- **Running on non-rooted emulators.** CPU frequency scaling is not locked, producing high variance. Use a physical device or a Gradle-managed device with root access for CI benchmarks.
- **Forgetting `isDebuggable = false` on the benchmark build type.** Debug builds disable JIT and AOT, making measurements 2–5x slower than release; the benchmark build type must be a release-equivalent.
- **Not calling `reportFullyDrawn()`.** Without it, `timeToFullDisplayMs` falls back to a heuristic that often fires too early, understating real startup latency.
- **Ignoring iteration count.** Five iterations is a minimum; ten or more produce more stable p50/p90/p99 estimates. Fewer iterations mask outliers.
- **Committing a stale `baseline-prof.txt`.** After large refactors or Compose upgrades, the hot paths shift. A stale profile may still help, but regenerating periodically captures new hot paths and removes obsolete ones.
- **Using `StartupMode.COLD` without `pressHome()` + `killProcess()` in setupBlock.** Without explicitly killing the process, the OS may keep it alive in the background, making "cold" measurements actually warm.
- **Not adding `profileinstaller` to the app module.** Without it, the profile is never installed in non-Play-distributed builds (debug APKs, test builds), so you cannot verify profile application locally.
- **Measuring with too broad a Baseline Profile scope.** Profiling every code path negates compile-time budget savings. Focus profile generation on startup journeys and the top two or three primary screens.
- **Assuming Baseline Profiles fix underlying algorithmic slowness.** They precompile existing code; they do not reduce inherent work. Always fix algorithmic bottlenecks first, then apply Baseline Profiles to eliminate remaining JIT overhead.

---

## References

- **Documentation:** [Baseline Profiles overview — Android Developers](https://developer.android.com/topic/performance/baselineprofiles/overview)
- **Documentation:** [Macrobenchmark overview — Android Developers](https://developer.android.com/topic/performance/benchmarking/macrobenchmark-overview)

---

## See also

`compose-performance` covers Compose-specific optimisations (stable types, `remember`, `derivedStateOf`, skippability) that complement profile-driven precompilation. `kotlin-coroutines` is relevant when benchmarking async startup paths driven by coroutines. For understanding when to reach for different performance and testing strategies, see the `choosing-testing-strategy` overview.
