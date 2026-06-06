---
name: compose-preview-testing
description: Guidance on using Compose @Preview annotations as a testing tool — PreviewParameterProvider, multipreview annotations, adaptive/dark/font-scale preview variants, and wiring previews into screenshot test pipelines. Use when building a visual regression safety net for Jetpack Compose UIs, parameterizing preview states, scaling coverage across display configurations, or integrating previews with Paparazzi or Roborazzi.
globs:
  - "**/*.kt"
tags: [compose, preview, screenshot-testing, ui-testing, android]
x-skills-master:
  domain: android
  class: lang-tooling
  category: testing
  platforms: ["android"]
  requires: { "android": "16", "kotlin": "2.2" }
  pairs_with: []
  sources:
    - https://developer.android.com/develop/ui/compose/tooling/previews
    - https://developer.android.com/develop/ui/compose/tooling
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Use this skill when you want to catch visual regressions in Jetpack Compose UI components without spinning up an emulator, or when you need to systematically verify a composable across a matrix of states, themes, font scales, and display sizes. It is the right choice when:

- A composable has multiple meaningful states (loading, error, empty, populated) that are tedious to assert property-by-property.
- You need to validate dark mode, dynamic font scaling, RTL layouts, or adaptive window sizes without manual device switching.
- You want to connect Android Studio previews to a screenshot test pipeline (Paparazzi or Roborazzi) so CI catches pixel drift.

It complements, rather than replaces, unit tests and integration tests: previews guard appearance; unit tests guard behavior.

## Core guidance

- **Start with `@Preview` for iterative design, then graduate it to a screenshot test.** A preview you already have is a free test — tools like Paparazzi and Roborazzi can render the same composable off-device and produce reference images that fail CI on drift.
- **Use `PreviewParameterProvider` to enumerate states, not separate functions.** A single parameterized preview reduces boilerplate and keeps state inventory in one place; every state is automatically visible in the Studio preview panel and can be iterated by a screenshot test.
- **Define multipreview annotations for your own design system's matrix.** Rather than stacking four `@Preview` annotations on every composable, create a single `@Multipreview` annotation that encodes your project's required variants (light/dark, compact/medium/expanded, default/large font). Apply it once and get all variants for free.
- **Never encode business logic in a `@PreviewParameterProvider`.** Providers exist only to supply display data; keep them in a `debugImplementation` source set or a `:ui-test-fixtures` module so they are excluded from release builds.
- **Prefer `@PreviewLightDark`, `@PreviewFontScale`, `@PreviewScreenSizes`, and `@PreviewDynamicColors` from the Compose Tooling library** before writing custom multipreview annotations — they cover the most common matrix dimensions without extra code.
- **Pin preview size when wiring into screenshot tests.** Unconstrained composables fill available width, making captures non-deterministic. Pass `widthDp`/`heightDp` in the `@Preview` annotation or wrap the composable in a fixed-size `Box` in the screenshot test.
- **Keep `showBackground = true` and `backgroundColor` consistent across a component's preview family** so diffs are not polluted by transparency changes.
- **Do not use `LocalInspectionMode.current` as a production code path.** The flag is provided so previews can substitute unavailable resources (ViewModels, real images); treat branches guarded by it as dead code in production.

```kotlin
// 1. Multipreview annotation — define once, reuse everywhere
@Preview(name = "Light", uiMode = Configuration.UI_MODE_NIGHT_NO)
@Preview(name = "Dark",  uiMode = Configuration.UI_MODE_NIGHT_YES)
@Preview(name = "Large font", fontScale = 1.5f)
@Preview(name = "Compact", widthDp = 360, heightDp = 640)
annotation class AllVariantPreviews

// 2. PreviewParameterProvider — enumerate states in one place
class FeedItemPreviewProvider : PreviewParameterProvider<FeedItem> {
    override val values = sequenceOf(
        FeedItem(title = "Short title", body = ""),
        FeedItem(title = "A much longer title that may wrap to two lines", body = "Body text."),
        FeedItem(title = "Error state", isError = true, body = ""),
    )
}

// 3. Composable with parameterized preview
@AllVariantPreviews
@Composable
fun FeedItemCardPreview(
    @PreviewParameter(FeedItemPreviewProvider::class) item: FeedItem,
) {
    AppTheme {
        FeedItemCard(item = item)
    }
}

// 4. Roborazzi screenshot test — reuses the same preview
@RunWith(ParameterizedRobolectricTestRunner::class)
class FeedItemCardScreenshotTest(private val item: FeedItem) {
    companion object {
        @JvmStatic
        @ParameterizedRobolectricTestRunner.Parameters
        fun items() = FeedItemPreviewProvider().values.toList()
    }

    @Test
    fun snapshot() {
        val composeRule = createComposeRule()
        composeRule.setContent { AppTheme { FeedItemCard(item = item) } }
        composeRule.onRoot().captureRoboImage()
    }
}
```

## Platform notes

- **Adaptive layouts:** use `@PreviewScreenSizes` (compact, medium, expanded) to verify `WindowSizeClass`-driven layouts without a device. If your layout uses `LocalWindowSizeClass`, supply a fake via `CompositionLocalProvider` in the preview body.
- **Dark mode:** `@PreviewLightDark` renders both `UI_MODE_NIGHT_NO` and `UI_MODE_NIGHT_YES` in a single annotation. If your app uses dynamic color (Material You), add `@PreviewDynamicColors` to cover wallpaper-derived palettes.
- **Font scale:** `@PreviewFontScale` renders the nine standard font scales from 0.85× to 1.8×. This is the fastest way to catch truncation and overflow bugs in text-heavy components.
- **Paparazzi vs Roborazzi:** Paparazzi renders composables via LayoutLib entirely on the JVM without Robolectric; it is faster and needs no `testInstrumentationRunner` change. Roborazzi wraps Robolectric and can exercise click interactions before capturing; prefer it when state changes must be verified visually. Both support reusing `@Preview`-annotated composables as test subjects.
- **CI reference images:** record references in CI (not on a developer machine) to avoid font-rendering differences between JDK and OS versions. Store them in version control and review `.png` diffs in PRs the same way you review code changes.

## Pitfalls

- **Forgetting to wrap the composable in the app theme.** A preview that omits `AppTheme { }` silently applies the default Material baseline rather than project colors and typography, so colors and typography look correct in the preview but wrong in the screenshot test.
- **Using `@Preview` without `showBackground` on components that rely on surface color.** A transparent background makes the preview look fine in dark Studio themes but fails screenshot comparisons when the surrounding background changes.
- **Sharing `PreviewParameterProvider` instances between preview and test without a shared source set.** Duplication causes state lists to diverge; put providers in a `:ui-test-fixtures` module or a `debugImplementation` source set consumed by both.
- **Leaving record mode enabled in CI.** Both Paparazzi and Roborazzi support a record flag that overwrites reference images and makes every test pass. Gate record mode behind a local Gradle property and assert in CI that the property is not set.
- **Capturing unconstrained root composables.** When `widthDp`/`heightDp` are not specified, the rendered width depends on the test harness's default window width, which varies across tool versions and causes spurious diffs.
- **Animating content inside previews.** Infinite animations, shimmer effects, and `AnimatedVisibility` transitions produce non-deterministic frames. Either disable animations via `LocalInspectionMode` or advance the animation clock to a fixed frame before capturing.
- **Over-testing whole screens.** Large composite screen previews fail for unrelated reasons and produce noise-heavy diffs. Screenshot-test leaf components; cover full screens with a small number of smoke captures.

## References

- **Documentation:** [Compose previews](https://developer.android.com/develop/ui/compose/tooling/previews)
- **Documentation:** [Compose tooling](https://developer.android.com/develop/ui/compose/tooling)

## See also

The unit-testing and instrumented-testing skills cover behavior-level assertions that previews intentionally skip. For layout correctness beyond visual inspection, pair with the Compose semantics and accessibility testing guidance. If your screenshot pipeline uses Paparazzi, the build-and-packaging skill covers Gradle module setup for `debugImplementation` source sets.
