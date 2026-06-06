---
name: edge-to-edge-compat
description: Covers API-level compatibility and behavior changes for edge-to-edge display — targetSdk obligations, automatic enforcement on Android 15+, predictive back gesture opt-in, handling deprecated window APIs, and AndroidX compatibility shims. Use when migrating an app to a higher targetSdk, auditing edge-to-edge readiness, enabling predictive back, or resolving inset/gesture regressions introduced by Android 15 behavior changes.
globs:
  - "**/*.kt"
tags: [android, edge-to-edge, compatibility, predictive-back, target-sdk]
x-skills-master:
  domain: android
  class: lang-tooling
  category: ship
  platforms: ["android"]
  requires: { "android": "16", "kotlin": "2.2" }
  pairs_with: []
  sources:
    - https://developer.android.com/develop/ui/views/layout/edge-to-edge
    - https://developer.android.com/about/versions/15/behavior-changes-15
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for this skill when you are raising `targetSdkVersion`, shipping a new app targeting Android 15 (API 35) or later, or triaging visual regressions — content hidden behind system bars, tappable areas clipped by the navigation bar, or translucent scrims that look wrong after an OS upgrade. It explains which behavior changes are automatic at which SDK level, what you must opt into versus what is forced upon you, and how to use the AndroidX `WindowCompat` and `EdgeToEdge` APIs to handle insets consistently from API 21 through Android 16+. Inset handling in Compose (the `WindowInsets` modifiers and `safeDrawing`/`safeContent` padding families) is deferred to the compose-window-insets skill; this skill focuses on the compatibility contract, the opt-in/opt-out surface, and the API-level milestones you must understand before writing a single inset modifier.

## Core guidance

### Edge-to-edge enforcement milestones

- **Android 14 (API 34) and below:** Edge-to-edge is opt-in. Calling `WindowCompat.setDecorFitsSystemWindows(window, false)` draws content behind both the status bar and navigation bar; leaving it at the default (`true`) keeps the system bars opaque and outside your content area. Targeting API 34 or below changes nothing by itself — you must explicitly opt in.
- **Android 15 (API 35) — forced edge-to-edge when targetSdk = 35:** When `targetSdkVersion` reaches 35 the system forcibly makes your app edge-to-edge for every Activity. The navigation bar becomes fully transparent, the status bar becomes transparent, and your content is laid out behind both bars. There is no manifest flag to disable this on API 35 devices. You must handle insets or your UI will be clipped, obscured, or tappable areas unreachable.
- **Android 16 (API 36) — enforcement strengthened:** The edge-to-edge enforcement from API 35 is carried forward and additional gesture-navigation polish requirements apply. Testing against API 36 emulators is required before raising `minSdk` or shipping to Android 16 devices.

### The AndroidX entry point

Always use `androidx.activity:activity` (1.8+) rather than calling raw platform APIs:

```kotlin
// In Activity.onCreate, before setContentView / setContent
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Single call handles status-bar/nav-bar transparency + sets up
        // WindowCompat.setDecorFitsSystemWindows(window, false) internally.
        enableEdgeToEdge()
        setContent {
            MyAppTheme {
                // Inset handling belongs in Compose — see compose-window-insets skill.
                AppNavHost()
            }
        }
    }
}
```

`enableEdgeToEdge()` (from `androidx.activity.EdgeToEdge`) is the canonical, backport-safe replacement for the legacy combination of `window.statusBarColor`, `window.navigationBarColor`, `WindowInsetsControllerCompat`, and `setDecorFitsSystemWindows`. It sets system bar colors to `Color.TRANSPARENT`, reads the theme to detect light/dark, and adjusts icon contrast automatically — all the way back to API 21.

- **Do not** mix `enableEdgeToEdge()` with manual `window.navigationBarColor` assignments; they fight each other.
- **Do not** call `setDecorFitsSystemWindows(window, true)` after `enableEdgeToEdge()` — this re-enables the legacy inset-fitting behavior and cancels the edge-to-edge setup.
- **Do not** set `android:windowDrawsSystemBarBackgrounds` or `android:navigationBarColor` in your theme XML when using `enableEdgeToEdge()`; AndroidX manages those attributes at runtime.

### Predictive back gesture opt-in

Predictive back (the animated preview of the destination during a back swipe) is controlled by a manifest attribute, not solely by targetSdk:

- Add `android:enableOnBackInvokedCallback="true"` to `<application>` in `AndroidManifest.xml` to opt in on API 33+.
- On Android 15 (API 35) devices, the legacy `OnBackPressedDispatcher` remains functional but `OnBackPressedCallback` + `BackHandler` in Compose continue to work correctly — no migration is forced, but you should migrate away from `Activity.onBackPressed()` (deprecated in API 33) before raising targetSdk to 35.
- For Compose-based navigation, use `BackHandler` from `androidx.activity:activity-compose`; it integrates with `OnBackPressedDispatcher` and handles the predictive back animation contract automatically.
- For custom back animations (shared-element return, hero transitions), implement `OnBackAnimationCallback` (API 34+) or use the `PredictiveBackHandler` composable from `activity-compose` 1.8+, which provides a `Flow<BackEventCompat>` for frame-by-frame progress.

### Deprecated APIs and restrictions at API 35

- `Window.setStatusBarColor()` and `Window.setNavigationBarColor()` are deprecated at API 35. The system ignores color values set by these methods on API 35+ devices when the app targets API 35. Use `enableEdgeToEdge()` or `WindowInsetsControllerCompat` instead.
- `Window.setDecorFitsSystemWindows(false)` is still the underlying mechanism on pre-35 devices; `enableEdgeToEdge()` calls it for you.
- `View.SYSTEM_UI_FLAG_*` flags (the old `systemUiVisibility` bitmask API) are removed at API 35. Any code that sets `View.SYSTEM_UI_FLAG_LAYOUT_STABLE`, `SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN`, or `SYSTEM_UI_FLAG_LIGHT_STATUS_BAR` will have no effect and produces a lint warning. Migrate to `WindowInsetsControllerCompat`.
- The `android:windowSoftInputMode="adjustResize"` behavior changes on Android 15: the resize now accounts for the insets of the edge-to-edge layout. If you see keyboard overlap regressions, verify that your Activity or the specific composable handles `WindowInsets.ime` correctly rather than relying on the legacy window resize.

### AndroidX backward compatibility shim map

| Goal | API 21–28 | API 29–34 | API 35+ |
|---|---|---|---|
| Go edge-to-edge | `enableEdgeToEdge()` | `enableEdgeToEdge()` | Automatic; `enableEdgeToEdge()` still required for correct icon contrast |
| Read insets | `ViewCompat.setOnApplyWindowInsetsListener` | same | same |
| Control bar appearance | `WindowInsetsControllerCompat` | same | same |
| Back interception | `OnBackPressedCallback` | same + predictive preview | same |

Always add `androidx.core:core-ktx` and `androidx.activity:activity-ktx` (or `activity-compose`) to the dependency block; these pull in the shims that abstract the platform version differences.

## Platform notes

**Gesture navigation vs. three-button navigation:** Edge-to-edge is most visually impactful in gesture navigation mode (Android 10+), where the navigation bar shrinks to a thin gesture indicator. In three-button mode the bar remains taller. Your inset-handling code must accommodate both; never hard-code a navigation bar height.

**Cutouts (notches, punch-holes, camera islands):** The `DisplayCutoutCompat` API (via `WindowInsetsCompat.getDisplayCutout()`) returns safe areas around cutout regions. On API 35+ in edge-to-edge mode, content behind a cutout is clipped by default unless you set `layoutInDisplayCutoutMode` to `SHORT_EDGES` or `ALWAYS`. For full-screen immersive content (video, games), use `LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS`; for regular app UI, `SHORT_EDGES` (the default on API 35+) is safer.

**Foldables:** On foldable devices, hinge occlusion is exposed as a `FoldingFeature` via Jetpack WindowManager, not via `WindowInsets`. Do not conflate inset handling with hinge avoidance — they are separate APIs.

**Wear OS, TV, Auto:** Edge-to-edge enforcement is phone/tablet only. Wear OS uses a round-display inset model; TV has no system bars in the traditional sense; Auto has its own `CarAppService` layout contract. This skill applies to handheld and tablet form factors only.

## Pitfalls

- Raising `targetSdkVersion` to 35 without calling `enableEdgeToEdge()` or handling insets — the system forces edge-to-edge, the nav bar becomes transparent, and bottom content is immediately obscured.
- Calling `enableEdgeToEdge()` but retaining `android:navigationBarColor` in the theme XML — the XML value wins on some API levels and produces an opaque bar with incorrect icon tinting.
- Using `window.statusBarColor = Color.TRANSPARENT` instead of `enableEdgeToEdge()` — this works on some API levels but not on API 35+ where the setter is deprecated and does nothing.
- Catching `CancellationException` broadly in back-handler callbacks — `OnBackPressedCallback` uses coroutine scopes internally in newer AndroidX versions; always rethrow `CancellationException`.
- Implementing predictive back animations but not providing a no-animation fallback — `OnBackAnimationCallback` is API 34+; use `BackEventCompat` via AndroidX for backward compatibility on API 33.
- Assuming a fixed navigation bar height constant (48 dp, 56 dp, etc.) instead of reading the actual inset — device OEMs customise bar heights and gesture-mode bars are much shorter.
- Setting `android:windowSoftInputMode="adjustNothing"` as a quick fix for keyboard overlap — this hides the regression rather than fixing inset handling, and breaks accessibility for keyboard users.
- Forgetting to call `enableEdgeToEdge()` before `setContent {}` in Compose-only Activities — calling it after `setContent` can cause a layout flash on the first frame.
- Not testing on a real gesture-navigation device or emulator configured to gesture mode — three-button emulators mask most edge-to-edge regressions.
- Mixing `WindowInsetsCompat` and raw `WindowInsets` (the platform type) in the same path — always use the `WindowInsetsCompat` wrapper from `androidx.core` to avoid API-level branches.

## References

- **Android Developers:** [Go edge-to-edge](https://developer.android.com/develop/ui/views/layout/edge-to-edge)
- **Android Developers:** [Android 15 behavior changes for apps targeting API 35](https://developer.android.com/about/versions/15/behavior-changes-15)

## See also

The compose-window-insets skill covers the Compose-side consumption of insets — `WindowInsets.safeDrawing`, `safeContent`, `ime`, the `Modifier.windowInsetsPadding` family, and `consumeWindowInsets`. The predictive-back skill covers `PredictiveBackHandler`, `OnBackAnimationCallback`, and building custom shared-element back transitions. The entitlements-capabilities skill is unrelated but the build-sign-distribute skill covers the `targetSdkVersion` / `compileSdkVersion` bump process and the review checklist when raising SDK levels.
