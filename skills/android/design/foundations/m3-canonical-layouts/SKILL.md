---
name: m3-canonical-layouts
description: "Material 3 design guidance for the three canonical adaptive layouts — list-detail, supporting pane, and feed — covering when each fits, how panes compose across window size classes, and how to adapt gracefully from compact phone to large-screen and foldable. Use when designing or critiquing an Android app layout that must scale across screen sizes, choosing between multi-pane and single-pane navigation, or deciding how to surface secondary content alongside a primary view."
tags: [m3, design, layout, adaptive, large-screen]
x-skills-master:
  domain: android
  class: design
  category: foundations
  platforms: ["android", "large-screen"]
  pairs_with: [list-detail-pane-scaffold]
  sources:
    - https://developer.android.com/guide/topics/large-screens/large-screen-canonical-layouts
    - https://developer.android.com/develop/ui/compose/layouts/adaptive
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for this skill whenever a design must work across the full Android device spectrum — compact phones, large phones, foldables in both postures, tablets, and ChromeOS. It answers three recurring structural questions: which of the three canonical layouts (list-detail, supporting pane, or feed) best matches the content model; how the chosen layout should change as the window grows or shrinks; and where pane boundaries, proportions, and navigation elements belong. It also clarifies when a canonical pattern is the wrong choice entirely. Hand the implementation of the resulting pane structure to the compose-layout code skill, which covers `ListDetailPaneScaffold`, `SupportingPaneScaffold`, and the adaptive scaffold APIs.

## Core guidance

### Choosing the right canonical layout

- **Use list-detail when items in a collection each have a dedicated, content-rich destination.** Email, contacts, files, and settings all fit: the list pane holds the scannable collection, the detail pane shows the full item. The relationship is always one-to-one — one selected item, one detail surface. Don't force list-detail onto content that lacks a natural "select item → view item" flow, such as a dashboard or a social feed.

- **Use supporting pane when primary content benefits from a persistent, task-level companion.** A document editor with a comments panel, a map with a search-result drawer, or a media player with a queue fit this shape. The supporting pane augments the primary pane rather than replacing it — both are simultaneously relevant. Avoid the pattern if the secondary content is only occasionally needed; a bottom sheet or dialog is lighter-weight in that case.

- **Use feed when the content itself is the surface.** A grid or staggered layout of articles, photos, or cards that the user scrolls through without a persistent selection belongs in the feed layout. The feed canonical pattern governs how columns multiply as width increases; it does not impose a second pane. Resist adding a persistent detail pane to a feed — it creates cognitive overhead when no item is selected.

### Pane composition and proportions

- **Let window width drive pane count, not device category.** A foldable in portrait may be compact; the same device unfolded is medium or expanded. Design decisions should reference the three width breakpoints — compact (< 600 dp), medium (600–840 dp), and expanded (≥ 840 dp) — rather than phone/tablet labels, because those labels don't map cleanly to size classes.

- **On compact, collapse to a single pane and use standard back-stack navigation between list and detail.** Never show two panes at compact width — the resulting columns are too narrow to be useful and will crowd content.

- **On medium, decide deliberately whether one or two panes fit.** Medium windows are the hardest case. List-detail may show a narrow list alongside a detail, or stay single-pane depending on content density. The supporting pane is often worth showing at medium because the companion context adds direct value. Default to showing the second pane on medium only when both panes can hold at least ~280–300 dp of usable content width.

- **On expanded, always show both panes.** The expanded window has abundant horizontal space; collapsing to single pane wastes the canvas and deprives users of the simultaneous context that large screens are designed for.

- **Respect the recommended pane proportions.** For list-detail, a 1:2 split (list occupies roughly one third, detail two thirds) works well on most expanded windows; equal splits tend to make the list feel over-large. For supporting pane, the supporting pane is secondary — keep it narrower than the primary pane, typically one third to two fifths of total width. Avoid equal splits that give too much visual weight to a supporting surface.

- **Keep pane dividers visually quiet.** A subtle vertical divider or a natural gutter between panes is sufficient. A heavy border or contrasting background on the divider steals attention from content.

### Navigation inside canonical layouts

- **The back gesture on expanded two-pane layouts should navigate within the list, not exit the list-detail screen.** Pressing back on a detail pane should return focus to the list pane (deselect the item), not navigate the user out of the feature. On compact, standard back-stack behavior applies because the detail is a separate screen.

- **Preserve the list selection state visually.** The selected item in the list pane should remain highlighted when the detail pane is showing it. A list that clears its selection styling when a detail opens is disorienting.

- **Do not use a bottom navigation bar inside a pane.** On expanded layouts, the app-level navigation rail or navigation drawer sits outside the multi-pane region. Never repeat navigation chrome inside individual panes.

- **Wrap top-level navigation in a NavigationDrawer (expanded) or NavigationRail (medium/compact) rather than a BottomNavigationBar on large screens.** The canonical layouts assume that the navigation chrome occupies the left edge and is factored out of pane width calculations.

### Pane content design

- **Design each pane to stand alone at its minimum size.** A detail pane may be displayed full-screen on compact or half-screen on expanded; the content must be legible and actionable in both contexts. Avoid designing only for the wide layout and then shrinking it.

- **Avoid content that relies on pane adjacency to be comprehensible.** Each pane should have a coherent headline and primary action. If the detail pane only makes sense when seen alongside the list, that is a sign the layout is working too hard to compensate for a content model that needs rethinking.

- **Use adaptive content within panes, not just adaptive pane count.** Inside a detail pane, a wide view might show metadata alongside the primary content in a two-column grid; a narrow view stacks them. Pane-level and content-level adaptation are complementary.

- **For the feed layout, add a column as width increases rather than stretching existing cards.** On compact, one column. On medium, two. On expanded, three or more. Stretching cards beyond roughly 320–400 dp makes them read as banners rather than cards, degrading visual hierarchy.

### Foldable-specific guidance

- **Treat the fold as a natural pane boundary when the device is unfolded in book posture.** The hinge creates a physical split; aligning pane boundaries with the fold avoids content being occluded or awkwardly bisected. The `FoldingFeature` API surfaces the hinge bounds; use those bounds to position pane separators.

- **Respect the table-top posture.** When a foldable is set on a surface with the fold running horizontally, the top half is a natural viewing area and the bottom half is a natural control surface. Content in the top half should be readable passively; interactive controls belong in the bottom half.

## Platform notes

On compact phones the canonical layouts collapse entirely to single-pane navigation. The design priority shifts to making transitions between list and detail fast and clear — prioritize meaningful shared element transitions and keep the back gesture obvious.

On medium-width windows (many foldables in portrait, large phones in landscape) the layout is genuinely ambiguous. Prefer showing two panes when the app's primary use case is comparative or context-dependent (e.g. email) and staying single-pane when the detail is immersive (e.g. full-screen article reading). Document the decision and test both postures with real content.

On expanded windows (tablets, foldables open, ChromeOS) the two-pane arrangement is always the right default. Navigation rails become navigation drawers when width permits a persistent label. Keyboard and mouse users expect direct click-to-select in the list pane without a transition animation; reserve slide transitions for compact back-stack navigation.

On Wear OS and TV the canonical layouts do not apply — Wear uses a scrolling tile/card model and TV uses a D-pad-driven leanback layout. Do not reference these canonical patterns for those platforms.

## Pitfalls

- Designing only the compact layout and then scaling up linearly — large-screen designs need intentional structure, not stretched phone layouts.
- Using device type ("tablet", "phone") rather than window width breakpoints as design tokens, leading to incorrect behavior on foldables and ChromeOS.
- Showing a two-pane layout at medium width when the resulting panes are too narrow to hold meaningful content (under ~280 dp per pane).
- Treating the canonical layouts as templates to fill mechanically rather than as structural starting points — not every screen fits a canonical pattern, and forcing it produces worse UX than a purpose-built layout.
- Bisecting content with the hinge on a foldable by failing to align the pane boundary with the fold location.
- Repeating app-level navigation chrome inside individual panes, creating duplicate navigation affordances.
- Losing the list selection state when detail is shown, so the user loses their place in the list.
- Stretching feed cards to fill expanded-width columns instead of adding more columns, producing oversized, low-density cards.
- Designing detail panes that only make sense when adjacent to the list pane, resulting in a broken experience when the pane is shown full-screen on compact.

## References

- **Material 3 Guidelines:** [Canonical layouts overview](https://developer.android.com/guide/topics/large-screens/large-screen-canonical-layouts)
- **Material 3 Guidelines:** [Understanding layout](https://developer.android.com/guide/topics/large-screens/support-different-screen-sizes)
- **Material 3 Guidelines:** [Applying layout](https://developer.android.com/develop/ui/compose/layouts/adaptive)
- **Documentation:** [Adaptive layouts in Jetpack Compose](https://developer.android.com/develop/ui/compose/layouts/adaptive)

## See also

The compose-layout code skill covers the Jetpack Compose implementation of these patterns, including `ListDetailPaneScaffold`, `SupportingPaneScaffold`, `NavigationSuiteScaffold`, and the `WindowSizeClass` API. The m3-navigation-design skill covers the choice between bottom navigation bar, navigation rail, and navigation drawer that frames canonical layouts on large screens. The m3-motion-design skill addresses the shared-element and container-transform transitions that animate between panes on compact.
