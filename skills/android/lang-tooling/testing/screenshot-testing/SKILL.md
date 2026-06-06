---
name: screenshot-testing
description: Covers visual regression testing for Jetpack Compose and View-based Android UIs using Compose Preview Screenshot Testing, Roborazzi, and Paparazzi — capturing baselines, diffing renders, and gating UI regressions in CI. Use when adding screenshot coverage to a Compose-first project, choosing between JVM-rendered and device-rendered screenshot strategies, wiring baseline capture into a Gradle task, or enforcing that a PR cannot merge if a visual diff exceeds threshold.
globs:
  - "**/*.kt"
tags: [testing, screenshot, compose, regression, roborazzi]
x-skills-master:
  domain: android
  class: lang-tooling
  category: testing
  platforms: ["android"]
  requires: { "android": "16", "kotlin": "2.2" }
  pairs_with: []
  sources:
    - https://developer.android.com/studio/preview/compose-screenshot-testing
    - https://developer.android.com/develop/ui/compose/testing
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for screenshot testing when the rendered appearance of a composable or View is the contract — card layouts, design-system tokens, typography, theming variants, and small leaf components that would take dozens of property assertions to cover. A single reference image captures color, spacing, font, and shape decisions at once and fails loudly when any of them drift.

Screenshot tests are not a replacement for behavior tests (`@Test` with `composeTestRule.onNode`). Use them alongside unit and integration tests: behavior assertions on logic, screenshot assertions on pixels. Skip screenshot tests for screens that contain frequently changing dynamic content (live timestamps, random avatars) unless you inject fully deterministic fixtures.

Three strategies exist at different levels of fidelity and speed:

- **Compose Preview Screenshot Testing** (official Gradle plugin, AGP 8.5+) — renders `@Preview` composables on the JVM via a Robolectric-backed pipeline; fastest, no emulator required, deeply integrated with Android Studio's preview workflow.
- **Roborazzi** — open-source JVM screenshot library that can render Compose and Views via Robolectric; richer assertion API, per-file HTML diff report, configurable per-pixel thresholds.
- **Paparazzi** — Square's JVM rendering library; renders Compose and Views without any Android SDK device; fastest cold-start, well-suited for pure Compose design-system libraries.

## Core guidance

- **Commit reference images as reviewed source.** Treat a changed `.png` exactly like changed code — every unexplained update is a potential regression that slipped through.
- **Record baselines in CI, not on developer machines.** Font hinting, display scale, and GPU antialiasing differ across machines. Pin one Linux runner image and capture there; check those files in; developers regenerate locally only to preview.
- **Keep composables small and inject deterministic data.** Extract leaf components from screen-level composables; pass fixed strings, fixed colors, and fake images. Tests that receive real URLs or `System.currentTimeMillis()` will be flaky by construction.
- **Cover multiple themes in one test file.** A single component should be captured in light, dark, and at least one non-default `FontScale` so theme regressions surface immediately.
- **Do not lower thresholds to silence flakiness.** A loose `changeRatioThreshold` hides real visual regressions. Fix the root cause (non-deterministic input, wrong font injection) instead.
- **Run baseline generation as a separate Gradle task, gated in CI.** Never let the record step run in the verify step; accidentally committed "record mode" passes every test forever.

### Compose Preview Screenshot Testing (recommended starting point)

Add the plugin in `build.gradle.kts` and annotate previews as normal; the plugin generates a `updateDebugScreenshotTest` task to capture and a `validateDebugScreenshotTest` task to diff:

```kotlin
// build.gradle.kts
plugins {
    id("com.android.application") // or library
    id("org.jetbrains.kotlin.android")
    id("com.android.compose.screenshot") version "0.0.1-alpha08"
}

android {
    experimentalProperties["android.experimental.enableScreenshotTest"] = true
}

dependencies {
    screenshotTestImplementation("androidx.compose.ui:ui-tooling")
}

// --- component under test ---
// src/main/kotlin/com/example/ui/PriceBadge.kt
@Composable
fun PriceBadge(amount: Double, label: String) {
    Surface(shape = MaterialTheme.shapes.small, color = MaterialTheme.colorScheme.primaryContainer) {
        Text(
            text = "$${"%.2f".format(amount)} · $label",
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
            style = MaterialTheme.typography.labelLarge,
        )
    }
}

// --- screenshot test ---
// src/screenshotTest/kotlin/com/example/ui/PriceBadgeScreenshot.kt
class PriceBadgeScreenshots {
    @Preview(name = "Light", uiMode = Configuration.UI_MODE_NIGHT_NO)
    @Preview(name = "Dark",  uiMode = Configuration.UI_MODE_NIGHT_YES)
    @Preview(name = "Large font", fontScale = 1.5f)
    @Composable
    fun PriceBadgePreview() {
        AppTheme {
            PriceBadge(amount = 19.99, label = "Pro plan")
        }
    }
}
```

Run `./gradlew updateDebugScreenshotTest` once to record baselines into `src/debug/screenshotTest/reference/`. Thereafter `./gradlew validateDebugScreenshotTest` fails the build when pixel content changes.

### Roborazzi (richer control, HTML diffs)

Roborazzi integrates with `ComposeTestRule` and Robolectric, producing per-test HTML reports that show baseline, actual, and diff side by side — valuable for code review:

```kotlin
// build.gradle.kts (test dependencies)
testImplementation("io.github.takahirom.roborazzi:roborazzi:1.32.3")
testImplementation("io.github.takahirom.roborazzi:roborazzi-compose:1.32.3")
testImplementation("org.robolectric:robolectric:4.14.1")
testImplementation("androidx.compose.ui:ui-test-junit4")

// --- test ---
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = RobolectricDeviceQualifiers.Pixel6)
class PriceBadgeRoborazziTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun priceBadge_lightTheme() {
        composeTestRule.setContent {
            AppTheme(darkTheme = false) { PriceBadge(amount = 19.99, label = "Pro plan") }
        }
        composeTestRule.onRoot()
            .captureRoboImage("src/test/snapshots/PriceBadge_light.png")
    }
}
```

Generate with `./gradlew recordRoborazziDebug`; verify with `./gradlew verifyRoborazziDebug`.

### Paparazzi (no SDK device, design-system libraries)

Paparazzi renders entirely on the JVM without Robolectric and is ideal for standalone design-system modules:

```kotlin
// build.gradle.kts
plugins { id("app.cash.paparazzi") version "1.3.5" }

// --- test ---
class PriceBadgePaparazziTest {
    @get:Rule
    val paparazzi = Paparazzi(
        deviceConfig = DeviceConfig.PIXEL_6,
        theme = "android:Theme.Material3.DayNight.NoActionBar",
    )

    @Test
    fun priceBadge_light() {
        paparazzi.snapshot { PriceBadge(amount = 19.99, label = "Pro plan") }
    }
}
```

## Platform notes

- **AGP 8.5+ required** for the official Compose Screenshot Testing plugin. Projects on older AGP must use Roborazzi or Paparazzi.
- **Robolectric native graphics mode** (`@GraphicsMode(NATIVE)`) is required for accurate Compose rendering in Roborazzi tests; the default software renderer produces different antialiasing.
- **Fonts in CI** — Robolectric uses bundled fonts; Paparazzi ships its own; neither matches a physical device pixel-for-pixel. Accept a small per-pixel delta only as large as rendering noise (< 0.1 % difference ratio), never higher.
- **Dark theme variants** — pass `uiMode = Configuration.UI_MODE_NIGHT_YES` to `@Preview` or set `darkTheme = true` in the composable's `AppTheme` call; do not rely on the device default.
- **Dynamic colors (Material You)** — `dynamicColorScheme` pulls wallpaper colors at runtime; always inject a fixed `ColorScheme` in screenshot tests so baselines are wallpaper-independent.
- **Large screens / foldables** — capture at a minimum of `W600dp` and `W840dp` breakpoints for any adaptive composable; a phone-only baseline will miss layout regressions on tablets.

## Pitfalls

- **Committing references recorded locally** — local machine rendering (font hinting, DPI, OS version) differs from CI; baselines committed from a developer's Mac will fail on a Linux CI runner. Always capture baselines on the same environment that runs verification.
- **Leaving record mode enabled** — Roborazzi's `roborazzi.test.record=true` system property or Paparazzi's `@get:Rule val paparazzi = Paparazzi(record = true)` overwrites every reference and makes the suite permanently green. Gate the record Gradle task behind a dedicated CI job that only runs on deliberate baseline-update PRs.
- **Screenshot-testing screen-level composables** — full-screen composables pull in many dependencies, produce massive reference files, and fail for unrelated reasons. Screenshot only leaf or small section-level components; compose behavior coverage up the tree with logic unit tests.
- **Non-deterministic inputs** — `remember { UUID.randomUUID() }`, `LocalDateTime.now()`, `AsyncImage(url)` with real network, and `LaunchedEffect`-driven animation all produce different pixels across runs. Inject fixed fakes; use `coil-test` or similar to return deterministic bitmaps.
- **Ignoring diff reports** — both Roborazzi and the official plugin generate HTML and image diffs; teams that auto-approve reference updates without reading the diff let genuine regressions through. Add a required PR reviewer step for any reference change.
- **Skipping font-scale coverage** — most teams capture only 1.0x font scale; real accessibility regressions (clipped text, broken layouts) appear at 1.3x and 1.5x. Add at least one large-font preview variant for every component.

## References

- **Documentation:** [Compose Preview Screenshot Testing](https://developer.android.com/studio/preview/compose-screenshot-testing)
- **Documentation:** [Compose Testing — UI tests and semantics](https://developer.android.com/develop/ui/compose/testing)

## See also

For behavior-level Compose tests (node finders, semantic assertions, interaction simulation) pair this with the `compose-testing` skill. The `compose-state` skill covers how to model deterministic state that makes screenshot tests stable. For accessibility-specific assertions layered on top of screenshot coverage, see `compose-accessibility`. The `hilt-di` skill shows how to inject test fakes into composables so screenshot tests receive predictable data.
