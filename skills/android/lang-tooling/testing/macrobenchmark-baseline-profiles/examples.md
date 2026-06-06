## Cold startup benchmark with profile verification

A complete Macrobenchmark module measuring cold startup, confirming a Baseline Profile was applied, and failing CI if the profile is absent.

```kotlin
// macrobenchmark/src/main/java/com/example/StartupBenchmark.kt
@RunWith(AndroidJUnit4::class)
class StartupBenchmark {

    @get:Rule val rule = MacrobenchmarkRule()

    @Test
    fun coldStartWithProfile() = rule.measureRepeated(
        packageName = "com.example.app",
        metrics = listOf(StartupTimingMetric()),
        iterations = 10,
        startupMode = StartupMode.COLD,
        setupBlock = {
            pressHome()
            killProcess()
        },
    ) {
        startActivityAndWait()
        // Signal content is fully loaded so timeToFullDisplayMs is accurate.
        // The Activity must call reportFullyDrawn() after its content renders.
        device.waitForIdle()
    }

    @Test
    fun warmStart() = rule.measureRepeated(
        packageName = "com.example.app",
        metrics = listOf(StartupTimingMetric()),
        iterations = 10,
        startupMode = StartupMode.WARM,
    ) {
        startActivityAndWait()
        device.waitForIdle()
    }
}
```

```kotlin
// macrobenchmark/src/main/java/com/example/ProfileVerificationBenchmark.kt
@RunWith(AndroidJUnit4::class)
class ProfileVerificationBenchmark {

    @get:Rule val rule = MacrobenchmarkRule()

    @Test
    fun verifyProfileCompiled() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val future = ProfileVerifier.getCompilationStatusAsync()
        val status = future.get(10, TimeUnit.SECONDS)
        assertThat(status.profileInstallResultCode)
            .isEqualTo(ProfileVerifier.CompilationStatus.RESULT_CODE_COMPILED_WITH_PROFILE)
    }
}
```

---

## Scroll jank benchmark for a Compose LazyColumn feed

Measures frame duration percentiles while scrolling a feed, helping catch Compose recomposition regressions.

```kotlin
@RunWith(AndroidJUnit4::class)
class FeedScrollBenchmark {

    @get:Rule val rule = MacrobenchmarkRule()

    @Test
    fun scrollFeedJank() = rule.measureRepeated(
        packageName = "com.example.app",
        metrics = listOf(FrameTimingMetric()),
        iterations = 5,
        startupMode = StartupMode.WARM,
        setupBlock = {
            val intent = Intent()
            intent.action = "com.example.app.OPEN_FEED"
            startActivityAndWait(intent)
        },
    ) {
        val feed = device.findObject(By.res("com.example.app:id/feed_lazy_column"))
            ?: error("Feed list not found — check testTagAsResourceId is enabled")
        feed.setGestureMargin(device.displayWidth / 5)
        repeat(5) {
            feed.fling(Direction.DOWN)
            device.waitForIdle()
        }
        repeat(2) {
            feed.fling(Direction.UP)
            device.waitForIdle()
        }
    }
}
```

In the app module, enable Compose semantic resource IDs so UiAutomator can find composables by test tag:

```kotlin
// app/src/benchmark/res/values/benchmark.xml
// or programmatically in benchmark build type:
// ComposeView.setViewCompositionStrategy is not needed;
// add to your Application class for benchmark builds:
class App : Application() {
    override fun onCreate() {
        super.onCreate()
        if (BuildConfig.BUILD_TYPE == "benchmark") {
            Compose.setViewCompositionStrategy(ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed)
        }
    }
}
```

---

## Baseline Profile generator covering startup and primary journeys

Generates a `baseline-prof.txt` for ART precompilation covering cold start, home screen render, and detail screen navigation.

```kotlin
@RunWith(AndroidJUnit4::class)
class AppBaselineProfileGenerator {

    @get:Rule val rule = BaselineProfileRule()

    @Test
    fun generateBaselineProfile() = rule.collect(
        packageName = "com.example.app",
        profileBlock = {
            // Journey 1: cold start to home screen
            pressHome()
            startActivityAndWait()
            device.waitForIdle()

            // Journey 2: scroll home feed
            device.findObject(By.res("com.example.app:id/home_feed"))?.run {
                setGestureMargin(device.displayWidth / 5)
                repeat(3) { fling(Direction.DOWN) }
            }

            // Journey 3: open a detail screen and navigate back
            device.findObject(By.res("com.example.app:id/first_item"))?.click()
            device.waitForIdle()
            device.pressBack()
            device.waitForIdle()
        },
    )
}
```

Run generation:

```
./gradlew :macrobenchmark:generateBaselineProfile \
  -Pandroid.testInstrumentationRunnerArguments.androidx.benchmark.enabledRules=BaselineProfile
```

The plugin writes `app/src/main/baseline-prof.txt`. Commit the file and ship it in every release build.

---

## CI Gradle workflow snippet (GitHub Actions)

```yaml
# .github/workflows/benchmarks.yml  (excerpt)
- name: Run macrobenchmarks
  run: |
    ./gradlew :macrobenchmark:connectedBenchmarkAndroidTest \
      --rerun-tasks \
      -Pandroid.testoptions.manageddevices.emulator.gpu=swiftshader_indirect
  # On real device runners, omit the gpu flag and lock CPU governor externally.

- name: Upload benchmark results
  uses: actions/upload-artifact@v4
  with:
    name: benchmark-results
    path: macrobenchmark/build/outputs/connected_android_test_additional_output/
```
