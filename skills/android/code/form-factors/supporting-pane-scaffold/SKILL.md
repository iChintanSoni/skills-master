---
name: supporting-pane-scaffold
description: Covers SupportingPaneScaffold from the Adaptive Navigation library — primary content pane paired with a contextual supporting pane on medium and expanded windows, the ThreePaneScaffoldNavigator, pane back-stack management, and when to choose SupportingPaneScaffold over ListDetailPaneScaffold. Use when building a feature screen that needs a persistent or slide-in contextual panel (metadata, filters, inspector, help) alongside the main content on large screens while remaining a single-pane layout on compact windows.
globs:
  - "**/*.kt"
tags: [compose, adaptive, large-screen, scaffold, form-factors]
x-skills-master:
  domain: android
  class: code
  category: form-factors
  platforms: ["android", "large-screen", "chromeos"]
  requires: {"android": "16", "kotlin": "2.2", "compose-bom": "2026.05.00"}
  pairs_with: []
  sources:
    - https://developer.android.com/develop/ui/compose/layouts/adaptive/list-detail
    - https://developer.android.com/develop/ui/compose/layouts/adaptive
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Use `SupportingPaneScaffold` whenever a screen has one dominant piece of primary content and a secondary panel that provides context, options, or metadata for that content — such as a document editor with a properties inspector, a map with a place detail card, a chat thread with a member list, or a settings screen with a contextual help panel. The supporting pane is subordinate; it supplements the main pane rather than replacing it, which distinguishes this scaffold from `ListDetailPaneScaffold` where both panes are co-equal hierarchical peers.

Choose `SupportingPaneScaffold` over `ListDetailPaneScaffold` when:

- There is no inherent list-item → detail navigation hierarchy; the supporting content describes or acts on the primary pane as a whole.
- The supporting pane is dismissible or contextually triggered, not always populated.
- A two-pane reveal on expanded windows is the goal but the trailing pane is not driven by row selection.

On compact windows the scaffold renders only one pane at a time and the navigator handles back-stack transitions between them automatically, so the same composable tree works on phones without special-casing.

## Core guidance

### Dependencies

`SupportingPaneScaffold` lives in the `material3-adaptive-navigation-suite` artifact, available through the Compose BOM. No additional version pin is needed:

```kotlin
// build.gradle.kts (module)
implementation("androidx.compose.material3.adaptive:adaptive")
implementation("androidx.compose.material3.adaptive:adaptive-layout")
implementation("androidx.compose.material3.adaptive:adaptive-navigation")
```

### Navigator setup

- Create a `ThreePaneScaffoldNavigator<T>` (where `T` is your content-key type) with `rememberSupportingPaneScaffoldNavigator<T>()`. Pass `null` as the type parameter when no content key is needed.
- The navigator manages which pane is visible on compact windows and owns the back-stack. Store it in a `rememberSaveable`-backed holder or hoist it to your screen-level composable — do not pass it into a ViewModel.
- Wire `BackHandler(navigator.canNavigateBack()) { navigator.navigateBack() }` to ensure the system back gesture pops the scaffold's own pane stack before the activity.

### Showing the supporting pane

- Call `navigator.navigateTo(SupportingPaneScaffoldRole.Supporting)` to bring the supporting pane into view. On expanded windows this is a no-op visually (both panes are already shown); on compact windows it pushes the supporting pane onto the scaffold's back-stack.
- Call `navigator.navigateTo(SupportingPaneScaffoldRole.Main)` or `navigator.navigateBack()` to return to the main pane on compact windows.
- To carry context (e.g., the ID of the item whose metadata is shown), pass a value via the `contentKey` parameter of `navigateTo`.

```kotlin
@Composable
fun DocumentScreen(modifier: Modifier = Modifier) {
    val navigator = rememberSupportingPaneScaffoldNavigator<Long>()

    BackHandler(navigator.canNavigateBack()) {
        navigator.navigateBack()
    }

    SupportingPaneScaffold(
        directive = navigator.scaffoldDirective,
        value = navigator.scaffoldValue,
        mainPane = {
            AnimatedPane {
                DocumentEditorPane(
                    onOpenInspector = { docId ->
                        navigator.navigateTo(
                            SupportingPaneScaffoldRole.Supporting,
                            contentKey = docId,
                        )
                    }
                )
            }
        },
        supportingPane = {
            AnimatedPane {
                val docId = navigator.currentDestination?.contentKey
                if (docId != null) {
                    DocumentInspectorPane(docId = docId)
                }
            }
        },
        modifier = modifier,
    )
}
```

### AnimatedPane

Wrap each pane's content in `AnimatedPane` to get the platform-consistent enter/exit transitions when panes appear or disappear. Skip it only if you are providing entirely custom transitions via `Modifier.animateEnterExit` or the pane never transitions (always-visible supporting pane on expanded).

### Directive and scaffold value

- `navigator.scaffoldDirective` is a `PaneScaffoldDirective` computed from the current `WindowAdaptiveInfo`. It encodes how many panes can be shown simultaneously and whether a pane should be split or stacked.
- `navigator.scaffoldValue` describes which pane is currently expanded, hidden, or in the back-stack.
- Both are read-only; do not construct or modify them manually. Observing these values lets you conditionally hide UI elements that only make sense when the supporting pane is off-screen (e.g., an "Open Inspector" button).

### Detecting whether the supporting pane is currently visible

```kotlin
val isDetailVisible = navigator.scaffoldValue[SupportingPaneScaffoldRole.Supporting] ==
    PaneAdaptedValue.Expanded
```

Use this to hide a toolbar button that opens the supporting pane when that pane is already visible alongside the main pane.

### Content sizing

- The scaffold defaults to a proportional split. Customize via `PaneScaffoldDirective` overrides or by providing `Modifier.preferredWidth` on the supporting pane's root composable.
- The supporting pane is intentionally narrower than the main pane. A 1:2 or 1:3 split (supporting:main) is typical. Avoid widths below 240 dp for the supporting pane.

## Platform notes

- **Phone (compact width):** Only the main pane is visible at launch. `navigator.navigateTo(Supporting)` slides the supporting pane in as a full-width overlay with a back-stack entry. The experience is equivalent to a `ModalBottomSheet` or a secondary screen push.
- **Tablet / large phone landscape (medium width, 600–840 dp):** The scaffold directive may show both panes side by side depending on available width. Test at 720 dp — this is a common foldable width and can be a boundary case where one pane becomes too narrow.
- **Expanded (840 dp+), Chromebook resizable windows:** Both panes are permanently co-visible. Navigation calls that would push/pop on compact are silently ignored or become no-ops; the user sees the content key update in the supporting pane without any transition.
- **Foldables in tabletop posture:** The hinge falls vertically; both panes share horizontal space. Make sure neither pane's minimum width forces the scaffold below its minimum supported size. Test with the foldable emulator in half-open posture.
- **Chromebook:** Windows are freely resizable. The scaffold will continuously re-evaluate the directive as the window resizes. Avoid any logic that caches the "is expanded" state across recompositions — always read from `navigator.scaffoldValue`.

## Pitfalls

- Not wiring `BackHandler` — on compact windows, the system back gesture will close the activity instead of popping back to the main pane. Always guard with `navigator.canNavigateBack()`.
- Storing the navigator in a ViewModel — `ThreePaneScaffoldNavigator` holds Compose state and must live in the composition tree. Hoist it to the screen-level composable, not below the navigation layer.
- Triggering `navigateTo` during initial composition — call navigation only in response to user events or `LaunchedEffect` blocks keyed to stable identifiers, not unconditionally during recompose.
- Comparing `scaffoldValue` against `PaneAdaptedValue.Hidden` to decide whether to show an "open" button, then forgetting the `PaneAdaptedValue.Expanded` counterpart — use a positive check for `Expanded` instead.
- Showing empty or placeholder supporting pane content at launch when the pane is co-visible on expanded windows — always provide a meaningful default state (e.g., a prompt to select an item, or the most-recently viewed metadata).
- Hard-coding `if (windowWidthDp >= 840.dp)` instead of reading from `navigator.scaffoldDirective` — the directive accounts for system bars, window insets, and foldable hinge exclusions that a raw dp check misses.
- Skipping `AnimatedPane` and applying ad-hoc animations — the pane may animate twice (once from `AnimatedPane`, once from your modifier), producing a jank or overshoot.
- Placing a `NavHost` inside the main pane without scoping its back-stack correctly — back presses will compete between the inner `NavHost` and the scaffold navigator. Let `BackHandler` priority resolve this explicitly: scaffold back-stack first, then inner `NavHost`.

## References

- **Documentation:** [SupportingPaneScaffold overview](https://developer.android.com/develop/ui/compose/layouts/adaptive/list-detail)
- **Documentation:** [Build adaptive layouts in Compose](https://developer.android.com/develop/ui/compose/layouts/adaptive)

## See also

For hierarchical list-item-to-detail navigation on large screens, see `list-detail-pane-scaffold`. For window size class detection and the `WindowAdaptiveInfo` API that feeds the scaffold directive, see `adaptive-window-size-classes`. For wiring a `NavigationRail` or `PermanentNavigationDrawer` around the scaffold at expanded widths, see `navigation-compose`. For animating transitions between pane states with shared element or slide animations, see `compose-animation`.
