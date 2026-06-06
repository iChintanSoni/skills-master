## Compose for XR — spatial UI review checklist

### Subspace and SpatialPanel setup
- [ ] A complete 2D UI tree exists inside `setContent` that works correctly on phones, tablets, and in home space without any `Subspace` content.
- [ ] `Subspace { }` is a sibling of the 2D content, not a replacement — removing the `Subspace` block leaves the app fully functional.
- [ ] `SpatialPanel` composables have explicit `width` and `height` set via `SubspaceModifier`. No panel relies on wrap-content sizing.
- [ ] Composables placed inside `SpatialPanel` content slots are stateless, driven by a `ViewModel` or hoisted state, and are reused from the 2D tree where possible.
- [ ] `SubspaceModifier` is used for panel modifiers (not `Modifier`). The two types are not mixed.
- [ ] Wide panels that span the horizontal field of view use `SubspaceModifier.curveRadius(825.dp)` to maintain a consistent focal distance.

### Orbiters and spatialized overlays
- [ ] Every `Orbiter` containing navigation controls has a corresponding control in the 2D layout (e.g., `NavigationBar` in a `Scaffold`). Orbiter-only controls are invisible on non-XR devices.
- [ ] `SpatialDialog` is used instead of `Dialog` in all XR-aware screens.
- [ ] `SpatialPopup` is used instead of `Popup` in all XR-aware screens.
- [ ] `SpatialElevation` levels are assigned consistently — lower-level elements (cards) use lower levels; transient overlays (badges, tooltips) use higher levels.
- [ ] Orbiter content is wrapped in a `Surface` with an appropriate shape so it visually matches the Material 3 for XR component style.

### Layout and multi-panel
- [ ] Multi-panel layouts use `SpatialRow`, `SpatialColumn`, or `SpatialBox` rather than manually offsetting individual panels.
- [ ] Data shared between multiple `SpatialPanel` instances flows through a shared `ViewModel`, not composable state or composition locals.
- [ ] `SpatialSpacer` is used to add consistent visual separation between panels in a row or column.
- [ ] `PlanarEmbeddedSubspace` is used (instead of a top-level `Subspace`) wherever a 3D element must participate in 2D layout size constraints.

### Home space vs full space
- [ ] Full-space mode is only requested as a result of an explicit user action (button tap, onboarding confirmation), never automatically on app launch.
- [ ] `SpatialCapabilities.hasCapability(SpatialCapabilities.CAPABILITY_3D_CONTENT)` (or the appropriate capability flag) is checked before requesting full-space mode or using features that require it.
- [ ] A visible in-app affordance lets users exit full space and return to home space — the app does not rely solely on the system gesture.
- [ ] `session?.requestHomeSpaceMode()` is called when the user navigates to areas of the app that do not need full space (e.g., settings, onboarding).

### Adaptive app adaptation
- [ ] The existing `WindowSizeClass`-based adaptive layout still functions inside `SpatialPanel` when the panel is resizable — content responds to panel size changes, not just device window size.
- [ ] The list-detail two-pane pattern (where applicable) maps to two side-by-side `SpatialPanel` instances in a `SpatialRow`, with the detail panel showing a placeholder when no item is selected.
- [ ] `SubspaceModifier.resizable()` is applied to panels that users should be able to resize; the content composable inside handles variable dimensions gracefully.
- [ ] `SubspaceModifier.transformingMovable()` is applied to primary panels to give users natural repositioning with perspective scaling.

### Testing and non-XR fallback
- [ ] `SubspaceModifier.testTag(...)` is applied to spatial panels and orbiters that need to be targeted in UI tests.
- [ ] The app is tested with spatialization disabled (home space, non-XR emulator) to confirm the 2D fallback renders correctly.
- [ ] No code inside `Subspace` is assumed to run on non-XR devices — side effects (analytics events, data loads) are driven from the 2D ViewModel layer, not from within the subspace composable tree.
- [ ] `enableEdgeToEdge()` is called before `setContent` in the Activity to ensure correct inset handling on non-XR form factors.

### Dependencies and build
- [ ] `androidx.xr:compose` and `androidx.xr:scenecore` are declared in the version catalog and kept in sync with the Jetpack XR BOM.
- [ ] The XR dependencies are not added to modules that do not target XR; the feature is isolated behind a dedicated Gradle module or feature flag where appropriate.
- [ ] `minSdk` is set to 16 (as required by the Jetpack XR SDK baseline) and the XR capability check handles lower-capability devices at runtime.
