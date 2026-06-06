---
name: window-manager-foldables
description: Covers Jetpack WindowManager for foldable and dual-screen Android devices — WindowInfoTracker, FoldingFeature, detecting tabletop and book postures, reading hinge bounds and occlusion type, and adapting Compose layouts to avoid or span the fold. Use when building layouts that respond to device fold state, avoiding content under the hinge, splitting UI across panels, or implementing posture-aware interactions on foldable hardware.
globs:
  - "**/*.kt"
tags: [foldables, window-manager, adaptive-layout, compose, large-screen]
x-skills-master:
  domain: android
  class: code
  category: form-factors
  platforms: ["android", "large-screen"]
  requires: { "android": "16", "kotlin": "2.2", "compose-bom": "2026.05.00" }
  pairs_with: []
  sources:
    - https://developer.android.com/guide/topics/large-screens/make-apps-fold-aware
    - https://developer.android.com/jetpack/androidx/releases/window
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Use this skill whenever your app needs to respond to the physical fold or hinge on foldable and dual-screen Android devices. It covers:

- Detecting that the device is in **tabletop posture** (folded horizontally, lower half used as a stand) to move interactive controls below the fold and render media above it.
- Detecting **book posture** (folded vertically, both panels side-by-side in portrait) to mirror a two-pane layout naturally around the hinge.
- Reading the **hinge bounds** in window coordinates to avoid drawing content under an occluding hinge, or to intentionally span a seamless fold.
- Reacting to **occlusion type** (`FULL` vs `NONE`) to decide whether to treat the hinge region as dead space.
- Driving all of this reactively from a Kotlin Flow so Compose state updates automatically when the device posture changes.

This skill does not cover general adaptive layouts (window size classes), navigation rail/drawer patterns, or large-screen tablet optimisations not specific to the fold.

## Core guidance

### Dependency setup

- Add `androidx.window:window` to your module's `build.gradle.kts`. The library is part of Jetpack and ships separately from the Compose BOM.
- No special manifest permissions are required.
- `WindowInfoTracker` is the single entry point; obtain it with `WindowInfoTracker.getOrCreate(activity)`.

### Collecting fold state as a Flow

- Call `windowInfoTracker.windowLayoutInfo(activity)` to get a `Flow<WindowLayoutInfo>`. Collect it from a lifecycle-aware scope (e.g. `lifecycleScope` with `repeatOnLifecycle(STARTED)`), or use `collectAsStateWithLifecycle` in Compose.
- `WindowLayoutInfo.displayFeatures` is a list of `DisplayFeature`. Filter for `FoldingFeature` — it is the only concrete subtype currently defined.
- There may be zero or one `FoldingFeature` per layout info update. Zero means a non-foldable device, or the app is in multi-window mode where the feature is outside the app window.

### Interpreting FoldingFeature

| Property | Values | Meaning |
|---|---|---|
| `state` | `FLAT`, `HALF_OPENED` | `FLAT` = fully open; `HALF_OPENED` = partially folded (tabletop / book) |
| `orientation` | `HORIZONTAL`, `VERTICAL` | Hinge axis direction |
| `occlusionType` | `NONE`, `FULL` | `FULL` = hinge covers pixels; `NONE` = hinge is seamless |
| `isSeparating` | `true` / `false` | `true` when the fold creates logically separate display areas |

**Posture detection rules:**

- **Tabletop**: `state == HALF_OPENED && orientation == HORIZONTAL`
- **Book**: `state == HALF_OPENED && orientation == VERTICAL`
- **Flat / fully open**: `state == FLAT` (treat as a normal tablet or phone)

### Hinge bounds

- `FoldingFeature.bounds` is a `Rect` in window-relative coordinates (pixels). Use these coordinates directly when positioning Compose content with `Modifier.offset` or when excluding hinge insets.
- To convert `bounds` into layout-relative coordinates when the window has an offset (multi-window), subtract the window's current position from the bounds.
- When `occlusionType == FULL`, leave the `bounds` rectangle empty of interactive or important content. When `occlusionType == NONE`, the fold is seamless and you may draw across it freely.

### Compose integration pattern

Use a sealed class or data class hierarchy to model posture, then lift it into a `State<Posture>` that drives your composable tree:

```kotlin
// 1. Model
sealed interface Posture {
    data object Flat : Posture
    data class Tabletop(val hingeY: Int) : Posture   // hinge top edge in window px
    data class Book(val hingeX: Int) : Posture        // hinge left edge in window px
}

// 2. Extension to map FoldingFeature -> Posture
fun FoldingFeature.toPosture(): Posture = when {
    state == FoldingFeature.State.HALF_OPENED &&
        orientation == FoldingFeature.Orientation.HORIZONTAL ->
        Posture.Tabletop(hingeY = bounds.top)
    state == FoldingFeature.State.HALF_OPENED &&
        orientation == FoldingFeature.Orientation.VERTICAL ->
        Posture.Book(hingeX = bounds.left)
    else -> Posture.Flat
}

// 3. ViewModel / Activity — collect and expose as StateFlow
val posture: StateFlow<Posture> = WindowInfoTracker
    .getOrCreate(activity)
    .windowLayoutInfo(activity)
    .map { info ->
        info.displayFeatures
            .filterIsInstance<FoldingFeature>()
            .firstOrNull()
            ?.toPosture()
            ?: Posture.Flat
    }
    .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), Posture.Flat)

// 4. Composable — react to posture
@Composable
fun FoldableScreen(posture: Posture, modifier: Modifier = Modifier) {
    when (posture) {
        is Posture.Tabletop -> TabletopLayout(hingeY = posture.hingeY, modifier = modifier)
        is Posture.Book     -> BookLayout(hingeX = posture.hingeX, modifier = modifier)
        Posture.Flat        -> StandardLayout(modifier = modifier)
    }
}
```

### Tabletop layout

- Divide the screen horizontally at `hingeY`. Render the primary content (video, map, camera preview) in the upper pane and controls or supplementary content in the lower pane.
- Use `BoxWithConstraints` or a custom `Layout` with a hard split at `hingeY` rather than a 50/50 weight split, because the fold is not always centred.
- Do not place touch targets inside the hinge bounds when `occlusionType == FULL`.

### Book layout

- Divide the screen vertically at `hingeX`. The natural split mimics a two-page book or a list-detail layout.
- This posture pairs well with `NavigationSuiteScaffold` and a list-detail arrangement driven by `ListDetailPaneScaffold` from `androidx.compose.material3.adaptive`.
- Avoid placing a scrollable list edge precisely at `hingeX`; add padding equal to `bounds.width()` on the adjacent sides so content is never obscured.

### Avoiding content under a full-occlusion hinge

- Retrieve `FoldingFeature.bounds` in window coordinates and convert them to the local composable coordinate space using `LocalDensity` and the composable's on-screen position (`LayoutCoordinates`).
- For a simpler approach, pass `bounds.height()` (tabletop) or `bounds.width()` (book) as padding to the respective pane, pushing content clear of the hinge.

### Testing without physical hardware

- Use the **Android Emulator** foldable AVD profiles (Pixel Fold, generic 7.6-inch foldable). The emulator supports hinge angle simulation via the Virtual Sensors panel.
- Use `FoldingFeature`-aware test helpers from `androidx.window:window-testing`: `TestWindowLayoutInfoPublisherRule` lets you push synthetic `WindowLayoutInfo` values in unit and integration tests without a physical device.

## Platform notes

- `WindowInfoTracker` is available on all Android versions but only returns meaningful `FoldingFeature` data on devices that declare fold support (typically Android 10+ hardware with the appropriate OEM driver).
- On Android 16 (API 36), the Window Extensions API is standardised across OEMs — prior to Android 12 some OEMs shipped proprietary equivalents (Samsung Flex Mode, Microsoft Surface Duo SDK). Prefer `androidx.window` for all new code; it routes to the right implementation automatically.
- When your app runs in multi-window or split-screen mode, `displayFeatures` may be empty even on a foldable if the fold is outside your window bounds. Always handle the empty list as a valid state equivalent to `Posture.Flat`.
- `WindowInfoTracker.windowLayoutInfo` requires an `Activity` context, not an `Application` context. Do not call it from a `Service` or non-UI context.
- Compose integration via `collectAsStateWithLifecycle` (from `androidx.lifecycle:lifecycle-runtime-compose`) is the idiomatic approach; it automatically stops collection when the composable leaves the composition.

## Pitfalls

- **Collecting on the wrong lifecycle**: collecting `windowLayoutInfo` in `onCreate` without `repeatOnLifecycle(STARTED)` causes updates to be missed when the app goes to background and returns. Always use `repeatOnLifecycle` or `collectAsStateWithLifecycle`.
- **Hardcoding a 50/50 split**: the hinge is not always at the exact centre of the display. Always use `FoldingFeature.bounds` to determine the true split position.
- **Ignoring `isSeparating`**: when `isSeparating` is `false`, the fold does not logically separate the display (it may just be a slight curvature). Do not apply a two-pane layout in this case; treat it like `Posture.Flat`.
- **Drawing interactive controls inside `FULL` occlusion bounds**: touch events in the hinge area on occluded hinges are dropped by the system. Verify hinge bounds and exclude them from tappable regions.
- **Using pixel bounds without density conversion**: `FoldingFeature.bounds` is in raw pixels. When computing `Dp` offsets for Compose, divide by `LocalDensity.current.density`.
- **Not testing the empty-features case**: `displayFeatures` is empty on non-foldable devices and in multi-window. Code that calls `.first()` without a null check will crash. Always use `.firstOrNull()`.
- **Leaking the Activity reference in ViewModel**: passing an `Activity` to a `ViewModel` for `WindowInfoTracker` creates a leak. Instead, use `ActivityWindowInfoTrackerHandlerAdapter` or collect in the Activity/Fragment and expose a `StateFlow` from the ViewModel.

## References

- **Jetpack WindowManager — foldables guide**: https://developer.android.com/guide/topics/large-screens/make-apps-fold-aware
- **Jetpack WindowManager release notes**: https://developer.android.com/jetpack/androidx/releases/window
- **Window testing artifact**: https://developer.android.com/reference/androidx/window/testing/layout/package-summary

## See also

The `compose-layout` skill covers `BoxWithConstraints` and custom `Layout` composables useful for building the split-pane arrangements described here. The `compose-window-insets` skill explains how to handle system bar insets that interact with fold-aware padding. For general adaptive UI across all screen sizes (not just folds), see the window size classes and `ListDetailPaneScaffold` guidance in the adaptive layout skills.
