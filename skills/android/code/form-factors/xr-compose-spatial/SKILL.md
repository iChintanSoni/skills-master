---
name: xr-compose-spatial
description: Covers Jetpack Compose for XR — Subspace, SpatialPanel, orbiters, spatial elevation, home space vs full space modes, SubspaceModifier, and adapting an existing adaptive app to spatial UI on Android XR. Use when building or adapting an Android app to run on XR headsets or wired XR glasses with spatial panels, 3D layout, floating orbiters, or immersive full-space experiences.
globs:
  - "**/*.kt"
tags: [xr, compose, spatial, jetpack, material3]
x-skills-master:
  domain: android
  class: code
  category: form-factors
  platforms: ["xr"]
  requires: { "android": "16", "kotlin": "2.2", "xr-compose": "1.0" }
  pairs_with: [m3-xr]
  sources:
    - https://developer.android.com/develop/xr/jetpack-xr-sdk/develop-ui
    - https://developer.android.com/develop/xr
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for this skill when you need to surface spatial UI on Android XR headsets or wired XR glasses using Jetpack Compose for XR. It applies when:

- Adding a `Subspace` with `SpatialPanel` to an existing Compose app so 2D content floats in 3D space.
- Arranging multiple panels in 3D with `SpatialRow`, `SpatialColumn`, or `SpatialBox`.
- Attaching contextual controls to a panel using `Orbiter`.
- Promoting UI elements into 3D with `SpatialDialog`, `SpatialPopup`, or `SpatialElevation`.
- Switching the activity between home space (shared 2D environment) and full space (exclusive immersive mode).
- Adapting an existing adaptive Compose app (phone or large-screen) to take advantage of spatial depth without a full rewrite.

For design-level guidance (spacing tokens, depth scale, XR HIG) consult the m3-xr design skill.

## Core guidance

### Architecture of a spatial app

The Jetpack XR SDK layers cleanly on top of a standard single-Activity Compose app:

- A regular `setContent { }` block drives the 2D UI on non-XR devices and in home space.
- A `Subspace { }` block sits alongside the 2D content and adds the 3D spatial layer. On non-XR hardware or when spatialization is disabled, the entire `Subspace` block is silently ignored — no conditional guards needed in most cases.
- `SpatialPanel` and the other subspace composables live exclusively inside a `Subspace`. Spatialized overlays (`SpatialDialog`, `SpatialPopup`, `Orbiter`, `SpatialElevation`) can live inside or alongside regular composables.

Keep the 2D content tree complete and correct on its own. Treat the `Subspace` as an additive layer, not a replacement.

### Subspace and SpatialPanel

- Call `Subspace { }` directly inside `setContent` or at the root of your composable tree. Do not nest `Subspace` inside another `Subspace`; use `PlanarEmbeddedSubspace` when you need a subspace that participates in a 2D layout.
- `SpatialPanel` is the primary surface for placing content in 3D. Give it explicit `width` and `height` via `SubspaceModifier`; the panel renders at those dimensions in the user's space.
- Do not put platform-specific layout logic inside `SpatialPanel`'s content slot. The composable inside it is ordinary Compose — pass a stateless screen composable that works identically on 2D.
- Use `SubspaceModifier.resizable()` to let users resize panels at runtime, and `SubspaceModifier.movable()` or `transformingMovable()` to let them reposition. `transformingMovable()` also scales the panel as it moves away, matching natural perspective.
- Prefer `SubspaceModifier.curveRadius(825.dp)` for wide panels that span the horizontal field of view — curving at 825 dp radius keeps text at a consistent focal distance.

```kotlin
@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            AppTheme {
                // 2D content — renders everywhere
                MainScreen()

                // Spatial layer — silently ignored on non-XR / home space
                Subspace {
                    SpatialRow {
                        SpatialPanel(
                            SubspaceModifier
                                .width(1200.dp)
                                .height(800.dp)
                                .resizable()
                                .transformingMovable()
                        ) {
                            MainScreen()  // reuse the same stateless composable
                        }

                        SpatialPanel(
                            SubspaceModifier
                                .width(400.dp)
                                .height(800.dp)
                        ) {
                            DetailSidePanel()
                        }

                        Orbiter(
                            anchorPoint = OrbiterAnchorPoint.Bottom,
                            offset = DpVolumeOffset(y = 72.dp)
                        ) {
                            BottomNavigationBar()
                        }
                    }
                }
            }
        }
    }
}
```

### 3D layout composables

- `SpatialRow` / `SpatialColumn` / `SpatialBox` arrange child panels in 3D space with a default angular gap between them. They accept the same conceptual semantics as their 2D counterparts but operate in a volume.
- `SpatialSpacer` inserts empty depth between panels, useful for keeping related panels visually separated.
- Panels inside a `SpatialRow` or `SpatialColumn` do not share a 2D coordinate system — each panel is an independent surface. Pass data between them via a shared `ViewModel`, not composable state.

### Orbiters

- `Orbiter` anchors a 2D composable to the nearest parent spatial entity (typically a `SpatialPanel`). It floats relative to an `OrbiterAnchorPoint` (`Top`, `Bottom`, `Start`, `End`).
- Use orbiters for bottom navigation bars, toolbars, and FABs. This keeps the main panel content clean while contextual controls stay spatially associated.
- In non-spatial environments, `Orbiter` is ignored and its content does not render. Ensure the same controls are accessible via the 2D layout as well.
- Wrap orbiter content in a `Surface` with `CircleShape` or `RoundedCornerShape` to match the Material 3 for XR visual style.

### Spatialized overlays

- `SpatialDialog` and `SpatialPopup` are drop-in replacements for `Dialog` and `Popup`. They render with z-elevation when spatialization is active and fall back to flat 2D equivalents otherwise — no conditional branching needed.
- `SpatialElevation(spatialElevationLevel = SpatialElevationLevel.Level3)` wraps a regular composable and lifts it off the panel surface. Use it for cards, sheets, or interactive elements that benefit from depth cues.
- Prefer `SpatialDialog` over raw `Dialog` in all XR-aware screens so that dialogs appear correctly elevated in 3D.

### Home space and full space

- By default an activity runs in **home space**: the system launcher is visible, other apps can coexist, and spatialization is limited. The `Subspace` still renders panels, but full immersive capabilities may not be available.
- **Full space** mode grants exclusive control of the environment. All other apps are hidden. Request it with:

```kotlin
val session = LocalSession.current
LaunchedEffect(Unit) {
    session?.requestFullSpaceMode()   // switches to full space
    // To return: session?.requestHomeSpaceMode()
}
```

- Check `SpatialCapabilities` on the session before requesting mode changes or before rendering capabilities that require full space (e.g., environment skybox, passthrough control):

```kotlin
val session = LocalSession.current
val isSpatialEnabled = session?.getSpatialCapabilities()
    ?.hasCapability(SpatialCapabilities.CAPABILITY_3D_CONTENT) == true
```

- Never request full space automatically on app launch without a user-initiated action or a clear onboarding screen explaining the mode switch. The system may deny the request in some contexts.
- Provide a visible affordance to exit full space — users expect a reliable path back to home space.

### Adapting an existing adaptive app

- Start with the 2D adaptive layout unchanged. Verify it compiles and renders correctly with no XR dependencies — it will continue to run on phones and tablets.
- Add the `androidx.xr:compose` dependency and wrap the existing root composable in a `Subspace` alongside the 2D tree. Use a single shared `ViewModel` for both.
- Promote the primary content pane to a `SpatialPanel` and move secondary panes (detail, sidebar) to additional panels in a `SpatialRow`. The list-detail pattern maps naturally to two side-by-side panels.
- Move navigation controls into an `Orbiter` anchored to the bottom of the primary panel, mirroring the `NavigationBar` in the 2D layout.
- Test the 2D fallback path continuously. Every change inside `Subspace` must have no effect on non-XR builds.

### SubspaceModifier cheatsheet

| Modifier | Purpose |
|---|---|
| `.width(dp)` / `.height(dp)` | Explicit panel dimensions |
| `.offset(x, y, z)` | 3D position relative to parent |
| `.movable()` | User can reposition panel |
| `.resizable()` | User can resize panel |
| `.transformingMovable()` | Move + auto-scale with distance |
| `.curveRadius(dp)` | Curve wide panel around user |
| `.rotate(quaternion)` | Static rotation |
| `.rotateToLookAtUser(…)` | Billboard — always faces user |
| `.alpha(float)` | Panel opacity (SpatialPanel only) |
| `.scale(float)` | Uniform scale |
| `.testTag(tag)` | For spatial UI testing |

## Platform notes

- **Non-XR devices:** All `Subspace` content is compiled normally but produces no rendering output. `Orbiter` and spatial overlays also no-op. Maintain the full 2D UI tree as the primary user interface.
- **Home space:** `Subspace` renders panels, but capabilities like environment control and passthrough manipulation are not available. `SpatialCapabilities` always reflects the current capability set — query it rather than inferring from mode.
- **Full space:** The activity has exclusive control. The system UI chrome is hidden. Ensure the app provides full navigation (including back/home equivalent) within the Compose tree.
- **PlanarEmbeddedSubspace:** Use this when a 3D element (e.g., a floating badge or a 3D object preview) needs to participate in 2D layout sizing — its width and height are constrained by the parent 2D composable. A top-level `Subspace` ignores the 2D layout entirely.
- **Display glasses (Glimmer):** Jetpack Compose Glimmer is a separate toolkit optimized for the very small displays of audio/display glasses. The spatial Compose APIs documented here target headsets and wired XR glasses, not Glimmer devices.
- **`WindowSizeClass` and adaptive layout:** `WindowSizeClass` still works inside a `SpatialPanel`'s content. Use it to keep the panel's internal layout responsive if the user resizes the panel via `SubspaceModifier.resizable()`.

## Pitfalls

- Placing 2D-only content exclusively inside `Subspace` without a 2D fallback, leaving the app unusable on phones and tablets.
- Forgetting that `Orbiter` renders nothing on non-XR devices. Navigation controls inside an `Orbiter` must also appear in the 2D layout.
- Using hard-coded pixel or meter values for panel dimensions without accounting for the user's environment. Prefer `dp`-based dimensions and allow resizing.
- Calling `requestFullSpaceMode()` without a user gesture or onboarding explanation — this is disorienting and may be denied by the system.
- Not querying `SpatialCapabilities` before using advanced features. Capabilities differ by device SKU and by current mode (home vs full space).
- Sharing composable state between `SpatialPanel` instances directly. Each panel has its own composition scope. Share state through a `ViewModel`.
- Nesting `Subspace` inside another `Subspace` — use `PlanarEmbeddedSubspace` for nested spatial content that must participate in a 2D layout.
- Forgetting `enableEdgeToEdge()` before `setContent`. On XR, panels fill their bounds without system bar insets by default, but neglecting this call causes layout bugs on non-XR form factors sharing the same Activity.
- Using `Dialog` instead of `SpatialDialog` in XR-aware screens — the fallback behavior is identical, but `Dialog` will not elevate in 3D.
- Applying 2D `Modifier` on subspace composables. `SpatialPanel` takes `SubspaceModifier`, not `Modifier`. Mixing them causes compile errors.

## References

- **Documentation:** [Develop UI with Jetpack Compose for XR](https://developer.android.com/develop/xr/jetpack-xr-sdk/develop-ui)
- **Documentation:** [Android XR developer overview](https://developer.android.com/develop/xr)
- **API reference:** [androidx.xr.compose.spatial package](https://developer.android.com/reference/kotlin/androidx/xr/compose/spatial/package-summary)
- **API reference:** [androidx.xr.compose.subspace package](https://developer.android.com/reference/kotlin/androidx/xr/compose/subspace/package-summary)

## See also

For the Material 3 design language on XR — depth tokens, spatial elevation scale, and component adaptation guidance — see the `m3-xr` design skill. For building the 2D adaptive layout that the spatial layer wraps, see `compose-window-insets` and the large-screen adaptive layout skills. For adding immersive 3D models and stereoscopic video surfaces within a `Subspace`, see `xr-scenecore`. For App Intents and Shortcuts that launch directly into full-space mode, see `app-intents`.
