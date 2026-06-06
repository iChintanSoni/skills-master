---
name: list-detail-pane-scaffold
description: Implements ListDetailPaneScaffold — the canonical two-pane adaptive layout in Jetpack Compose — including ThreePaneScaffoldNavigator for pane navigation, predictive back, single-pane vs dual-pane switching by window size, and preserving selection across config changes. Use when building a list-detail (or similar hierarchical) screen that must adapt between compact phones, large-screen tablets, foldables, and ChromeOS windows.
globs:
  - "**/*.kt"
tags: [compose, adaptive, large-screen, list-detail, form-factors]
x-skills-master:
  domain: android
  class: code
  category: form-factors
  platforms: ["android", "large-screen", "chromeos"]
  requires: { "android": "16", "kotlin": "2.2", "compose-bom": "2026.05.00" }
  pairs_with: [m3-canonical-layouts]
  sources:
    - https://developer.android.com/develop/ui/compose/layouts/adaptive/list-detail
    - https://developer.android.com/develop/ui/compose/layouts/adaptive
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Use this skill whenever a screen is hierarchical — a collection drives selection of a single item — and the app must run well on phones, tablets, foldables, and ChromeOS. Specifically reach for it when:

- You are building or reviewing a screen that maps one-to-one to Material 3's list-detail canonical layout.
- The UI must automatically collapse to a single-pane push-navigation flow on compact phones and expand to a side-by-side view on medium/expanded windows.
- You need `ThreePaneScaffoldNavigator` to manage pane visibility, back-stack depth, and the predictive-back gesture without hand-rolling the logic.
- You need to preserve the selected item across rotation, window resizing, and process death.

Do not use it when all screen widths show the same single-pane layout; in that case, plain `NavHost` is simpler and sufficient.

## Core guidance

### Gradle dependencies

The scaffold lives in the Compose Material 3 Adaptive library, separate from the core Compose BOM. Add both the navigation and layout artifacts:

```kotlin
// build.gradle.kts (app)
dependencies {
    implementation(platform("androidx.compose:compose-bom:2026.05.00"))
    implementation("androidx.compose.material3.adaptive:adaptive")
    implementation("androidx.compose.material3.adaptive:adaptive-navigation")
    implementation("androidx.compose.material3.adaptive:adaptive-layout")
}
```

### Core composable anatomy

`ListDetailPaneScaffold` takes a `ThreePaneScaffoldNavigator<T>` (where `T` is your selection type) and renders one or two visible panes based on available width. At compact widths only one pane is visible at a time; at medium/expanded widths the list and detail appear side by side.

```kotlin
@Composable
fun EmailScreen(viewModel: EmailViewModel = viewModel()) {
    // 1. Create navigator; type param is the "selection" passed to detail pane.
    val navigator = rememberListDetailPaneScaffoldNavigator<EmailId>()

    // 2. Wire predictive back — must be called unconditionally.
    BackHandler(navigator.canNavigateBack()) {
        navigator.navigateBack()
    }

    // 3. Collect state that survives config changes via ViewModel.
    val emails by viewModel.emails.collectAsStateWithLifecycle()

    ListDetailPaneScaffold(
        directive = navigator.scaffoldDirective,
        value = navigator.scaffoldValue,
        listPane = {
            AnimatedPane {
                EmailList(
                    emails = emails,
                    selectedId = navigator.currentDestination
                        ?.takeIf { it.pane == ListDetailPaneScaffoldRole.Detail }
                        ?.content,
                    onEmailClick = { id ->
                        navigator.navigateTo(ListDetailPaneScaffoldRole.Detail, id)
                    },
                )
            }
        },
        detailPane = {
            AnimatedPane {
                val emailId = navigator.currentDestination
                    ?.takeIf { it.pane == ListDetailPaneScaffoldRole.Detail }
                    ?.content
                if (emailId != null) {
                    EmailDetail(emailId = emailId)
                } else {
                    EmailDetailPlaceholder()
                }
            }
        },
    )
}
```

### Navigator and navigation model

- `rememberListDetailPaneScaffoldNavigator<T>()` creates and remembers the navigator, persisting its state across recompositions. Pass `initialDestinationHistory` to open to a specific pane on first launch.
- `navigator.navigateTo(pane, content)` pushes a new destination onto the internal back stack. The scaffold decides which pane to make visible.
- `navigator.navigateBack()` pops the top destination. On compact screens this corresponds to a real back navigation; on two-pane screens it may have no visible effect because both panes remain shown.
- `navigator.canNavigateBack()` returns `true` when there is a back-stack entry to pop. Always guard `BackHandler` with this flag so the system handles the final back press correctly.
- `navigator.scaffoldDirective` and `navigator.scaffoldValue` reflect the current `WindowAdaptiveInfo` and drive the scaffold layout; pass them directly to `ListDetailPaneScaffold`.

### Selection across config changes

- Store the selected item ID in a `ViewModel`, not inside the composable. The navigator itself uses `rememberSaveable` internally, so its back-stack destination survives rotation, but the content it references (your data) must live in the ViewModel.
- Use `SavedStateHandle` in the ViewModel for the selected ID so it also survives process death:

```kotlin
class EmailViewModel(savedState: SavedStateHandle) : ViewModel() {
    // Survives both rotation and process death.
    private val _selectedId = savedState.getStateFlow<EmailId?>("selected_id", null)
    val selectedId: StateFlow<EmailId?> = _selectedId
    fun select(id: EmailId?) { savedState["selected_id"] = id }
}
```

- Do not duplicate selection state in both the ViewModel and the navigator. Let the navigator own pane visibility; let the ViewModel own which entity is selected.

### Single-pane vs dual-pane behavior

- The scaffold determines visibility automatically from `WindowAdaptiveInfo`. You do not need to branch on `WindowSizeClass` manually inside the scaffold itself.
- At compact width, only the currently active pane is visible. The navigator's back stack drives which pane is shown.
- At medium/expanded width, both panes appear simultaneously. The navigator's back-stack operations still work, but popping back from the detail pane has no visual transition since both remain visible.
- If a specific screen should stay single-pane at medium width (e.g. a settings detail), override by passing a custom `PaneScaffoldDirective` with `maxHorizontalPartitions = 1`.

### AnimatedPane

Wrap each pane's content in `AnimatedPane` to get the built-in enter/exit crossfade when panes appear and disappear on compact screens. It is a thin wrapper; do not add your own `AnimatedVisibility` around it.

### Placeholders and empty state

On two-pane widths, the detail pane is always visible even before the user has selected an item. Always provide a placeholder — a prompt illustration, an empty state message, or auto-select the first item — so the right pane is never blank.

## Platform notes

- **Phones (compact):** Single-pane only. The scaffold animates between list and detail using the back stack. Predictive back gestures preview the list beneath the detail pane automatically when `BackHandler` is wired correctly.
- **Foldables:** The scaffold respects the hinge and will not split a pane across it. On a vertically folded device the layout shifts to avoid placing content over the crease. Test both folded (compact) and fully open (medium/expanded) states.
- **Tablets (medium/expanded):** Both panes are displayed. Test that the detail pane has a sensible max width — a 1200 dp expanded tablet showing a simple email body stretched to full width looks broken. Constrain the detail pane's internal content with `Modifier.widthIn(max = 840.dp)` or a similar cap.
- **ChromeOS (resizable windows):** The window can be resized from phone-narrow to near-fullscreen. The scaffold reacts in real time. Never rely on the window being at a fixed size; test by dragging the window across all widths at runtime. Ensure keyboard and mouse navigation works correctly in the list pane (focus, enter key selection) and that the detail pane responds to pointer events.
- **Landscape phones:** At ~667 dp wide (e.g. Pixel 8 Pro in landscape), `WindowSizeClass` reports medium, so the two-pane layout may appear. This is intentional but can feel cramped. The scaffold handles it; verify your content renders acceptably at narrow pane widths (around 280–320 dp per pane).

## Pitfalls

- Calling `navigator.navigateBack()` inside `BackHandler` without guarding with `navigator.canNavigateBack()` — this causes the navigator to pop below the root destination and results in a blank or crashed screen.
- Not wrapping pane content in `AnimatedPane` — pane transitions appear as instant cuts with no animation, which feels jarring on compact screens.
- Storing selection state only in the navigator's content parameter and not in `SavedStateHandle` — the navigator persists pane identity across rotation but your content type must also survive process death via the ViewModel.
- Leaving the detail pane empty at two-pane widths — always provide a placeholder or auto-select the first item so the scaffold never shows a blank white panel.
- Branching on `WindowSizeClass` inside a composable nested inside the scaffold to decide which pane to show — the scaffold already handles pane visibility. Duplicate branching produces inconsistency when the scaffold directive and your manual check disagree.
- Using a `NavHost` inside the list pane to navigate to the detail pane — this fights the scaffold's own pane-management model. Keep navigation within the pane strictly inside each pane, and use the scaffold navigator for cross-pane transitions.
- Hard-coding `Modifier.fillMaxWidth()` on the detail pane's root content without a max-width cap — on wide expanded screens content stretches uncomfortably. Use `widthIn(max = ...)` or constrain the content column.
- Not testing with the app in a freeform window on ChromeOS — the scaffold continuously reacts to window size; bugs often only appear at non-canonical intermediate widths.

## References

- **Documentation:** [Build a list-detail layout with Compose](https://developer.android.com/develop/ui/compose/layouts/adaptive/list-detail)
- **Documentation:** [Adaptive layouts in Compose](https://developer.android.com/develop/ui/compose/layouts/adaptive)

## See also

For the design-layer counterpart — deciding when to use list-detail vs other canonical layouts, sizing panes, and designing placeholders — see `m3-adaptive-layout`. For the composable primitives (`Row`, `Column`, `BoxWithConstraints`) that implement content within each pane, see `compose-layout`. For managing the `WindowSizeClass` and `WindowAdaptiveInfo` queries that the scaffold relies on, see `compose-layout`. For animating transitions inside a pane (not the pane itself), see `compose-animation`.
