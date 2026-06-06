---
name: robolectric
description: Covers running Android-framework tests on the JVM with Robolectric — shadows, SDK level configuration, and the tradeoffs vs instrumented tests. Use when writing fast local tests that exercise Android APIs (Context, View, Intent, ContentResolver, etc.) without a device or emulator.
globs:
  - "**/*.kt"
tags: [testing, robolectric, android, unit-tests, jvm]
x-skills-master:
  domain: android
  class: lang-tooling
  category: testing
  platforms: ["android"]
  requires: { "android": "16", "kotlin": "2.2" }
  pairs_with: []
  sources:
    - https://developer.android.com/training/testing/local-tests/robolectric
    - https://developer.android.com/training/testing/fundamentals
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Use Robolectric when you need to test code that calls Android framework APIs (e.g., `Context`, `Resources`, `Intent`, `Bundle`, `ContentResolver`, `SharedPreferences`, `View`, `Activity`) but you want the speed of a local JVM test. It is the right layer for ViewModel logic that reads resources, Repository code that parses `Uri`s, or any unit under test whose dependencies include framework types that are impractical to mock by hand.

Do not reach for Robolectric when the test genuinely requires hardware (camera, Bluetooth, GPS), accurate rendering, multi-process boundaries, or production-identical lifecycle behavior — those need instrumented tests running on a device or emulator.

## Core guidance

- Add Robolectric as a `testImplementation` dependency; it is never on the runtime classpath.
- Annotate the test class with `@RunWith(RobolectricTestRunner::class)`. In a project that already uses AndroidJUnit4, switching the runner is the only change required to run the test locally.
- Use `@Config(sdk = [34])` at the class or method level to pin the simulated SDK level. Explicit pinning prevents silent behavior changes when Robolectric's default SDK changes across releases.
- Obtain a `Context` via `ApplicationProvider.getApplicationContext<Context>()` from `androidx.test.core.app`; prefer this over Robolectric's own `RuntimeEnvironment.application` so the code compiles unchanged against instrumented runners.
- Shadows intercept framework calls and replace them with JVM-safe implementations. The built-in shadow library covers the most common classes; use `Shadows.shadowOf(obj)` to obtain the shadow and inspect or drive state that is not accessible through the public API (e.g., `Shadows.shadowOf(looper).idle()` to drain the main thread message queue).
- Robolectric runs tests on its own Looper. Call `ShadowLooper.runUiThreadTasks()` or use `IdlingRegistry` patterns when code posts work back to the main thread.
- For Compose UI tests on the JVM, combine Robolectric with the `compose-ui-test` artifact and the `@RunWith(AndroidJUnit4::class)` runner — Robolectric transparently provides the Android environment compose needs.

```kotlin
// build.gradle.kts (app)
dependencies {
    testImplementation("org.robolectric:robolectric:4.13")
    testImplementation("androidx.test:core-ktx:1.6.1")
    testImplementation("androidx.test.ext:junit-ktx:1.2.1")
    testImplementation("junit:junit:4.13.2")
}

android {
    testOptions {
        unitTests {
            isIncludeAndroidResources = true   // required for resource & manifest access
            isReturnDefaultValues = false       // fail loudly on un-shadowed calls
        }
    }
}
```

```kotlin
// ExampleRobolectricTest.kt
import android.content.Intent
import androidx.test.core.app.ApplicationProvider
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.shadows.ShadowLooper
import kotlin.test.assertEquals

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class NotificationHelperTest {

    private val context = ApplicationProvider.getApplicationContext<android.content.Context>()

    @Test
    fun `buildShareIntent sets correct MIME type`() {
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_TEXT, "Hello")
        }
        assertEquals("text/plain", intent.type)
    }

    @Test
    fun `string resource resolves from manifest`() {
        val appName = context.getString(R.string.app_name)
        assert(appName.isNotBlank())
    }

    @Test
    fun `posted main-thread runnable executes after idle`() {
        var ran = false
        android.os.Handler(android.os.Looper.getMainLooper()).post { ran = true }
        ShadowLooper.runUiThreadTasks()
        assert(ran)
    }
}
```

## Platform notes

- **SDK simulation range** — Robolectric 4.13 supports simulating SDK 19 through 35. Always specify `@Config(sdk = [...])` explicitly rather than relying on the default; CI should test at least the `minSdk` and `targetSdk` values used by your app.
- **`isIncludeAndroidResources = true`** — required to resolve strings, drawables, and layouts from `R`. Without it, resource access silently returns zero/null or throws.
- **Binary resources** — Robolectric downloads pre-built Android framework jars keyed to the requested SDK. Gradle caches them in `~/.m2`; CI pipelines should cache this directory to avoid repeated downloads.
- **Compose on Robolectric** — works with `robolectric-shadows-framework` and `compose-ui-test-manifest`. Set `@Config(instrumentedPackages = ["androidx.loader.content"])` if you encounter class-loading issues with some Compose versions.
- **isReturnDefaultValues** — the Android Gradle Plugin defaults this to `false`, which throws `RuntimeException: Method not mocked` for un-shadowed framework calls. Keep it `false`; fix missing shadows rather than silencing errors.

## Pitfalls

- **Omitting `@Config(sdk = [...])`** — Robolectric's default SDK drifts across versions, making test behavior non-deterministic. Pin explicitly.
- **Using `RuntimeEnvironment.application` instead of `ApplicationProvider`** — the former is Robolectric-specific and breaks when the test is promoted to an instrumented runner; always use `ApplicationProvider.getApplicationContext()`.
- **Not draining the Looper** — code that posts back to `Looper.getMainLooper()` will not run until you call `ShadowLooper.idle()` or `runUiThreadTasks()`. Forgetting this causes tests that pass but never actually exercise the async path.
- **Mocking where shadows suffice** — creating a `mockk<Context>()` or `mock<Resources>()` when Robolectric's real shadow implementation already works correctly leads to fragile tests that break on every API change. Prefer the shadow.
- **Over-relying on Robolectric for integration concerns** — Robolectric cannot replicate multi-process communication, accurate GPU rendering, or real hardware sensors. Tests that depend on these behaviors should be promoted to instrumented tests.
- **Slow test suites from missing parallelism** — Robolectric tests spin up a separate classloader per test class. Enable JUnit parallel test execution (`maxParallelForks`) in `build.gradle.kts` to avoid a growing serial bottleneck.

## References

- **Documentation:** [Run local unit tests with Robolectric](https://developer.android.com/training/testing/local-tests/robolectric)
- **Documentation:** [Fundamentals of testing Android apps](https://developer.android.com/training/testing/fundamentals)
- **Documentation:** [Robolectric configuration reference](https://robolectric.org/configuring/)

## See also

The `unit-testing-strategy` skill explains when to choose Robolectric vs pure JVM vs instrumented tests across the full testing pyramid. For instrumented end-to-end tests that run on a device see the `xctest-ui-automation` analogue on Android (Espresso / UIAutomator). For testing Compose UI layers in isolation see the `compose-ui-testing` skill. Coroutine-heavy code under test pairs well with the `kotlin-coroutines` skill's guidance on `TestCoroutineDispatcher` and `runTest`.
