---
name: m3-dividers-scaffold
description: "Design guidance for Material 3 dividers and the Scaffold screen skeleton: choosing full-width vs inset dividers, knowing when spacing alone is better, and structuring a screen with the Scaffold composable (top app bar, FAB, bottom bar, content slot). Use when reviewing or designing screen layout, deciding whether a visual separator is needed between list items or sections, or evaluating how the top app bar, floating action button, and navigation bar fit together as a cohesive screen frame."
tags: [m3, design, dividers, scaffold, layout, components]
x-skills-master:
  domain: android
  class: design
  category: components
  platforms: ["android", "large-screen"]
  pairs_with: []
  sources:
    - https://m3.material.io/components/divider/overview
    - https://developer.android.com/develop/ui/compose/components/scaffold
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

- Evaluating whether a list, feed, or content section needs a visual separator at all, or whether whitespace is the right tool.
- Choosing between a full-width divider and an inset (left-aligned) divider in a list context.
- Reviewing whether subheader dividers or section dividers are being used to create meaningful hierarchy, not noise.
- Structuring a new screen or auditing an existing one for how the top app bar, FAB, bottom navigation bar, and main content slot relate inside the Scaffold composable.
- Deciding where to anchor the FAB relative to the navigation bar and bottom bar, especially on large screens and foldables.

## Core guidance

### Dividers

- **Prefer whitespace over dividers as a first instinct.** A divider should earn its place. When generous padding and grouping already communicate item boundaries, adding a line creates visual clutter without adding clarity. Try removing a divider and checking whether the layout still reads correctly before putting it back.
- **Use full-width dividers at section boundaries, not item boundaries.** A full-width HorizontalDivider spanning the entire container signals a hard structural break — between a list and a summary area, between a settings group header and its items, or between page-level zones. Avoid repeating full-width dividers between every item in a list; they create a prison-bar effect and compete with content.
- **Use inset dividers inside lists to reinforce item separation without harshness.** An inset divider (with a leading indent matching the list item's avatar or icon) maintains flow while distinguishing rows. In Compose, the HorizontalDivider composable accepts a `startIndent` parameter to align the line with item content rather than the screen edge. Match the indent to the icon/thumbnail width so the line visually belongs to the text, not the container.
- **Omit dividers on the last item in a group.** A trailing divider at the bottom of the final list item, immediately before the next section, doubles the visual weight of the gap and is redundant with the spacing that follows.
- **Keep divider color subtle — use the default `onSurfaceVariant` token at reduced opacity.** Dividers are structural, not decorative. Custom bold or tinted dividers draw attention to themselves and disrupt content scannability. If you feel a divider needs emphasis to be noticed, that is a signal that whitespace or a subheader would do a better job.
- **Vertical dividers are for side-by-side zone splits, not inline text.** A VerticalDivider makes sense between panes in a two-panel layout or between chips in a tightly packed row. Placing vertical dividers between text or action items within a card usually indicates a layout problem that restructuring would solve.
- **Subheader rows can replace dividers in long lists.** When a list has natural categories, a sticky or plain subheader communicates structure while providing a content label — a divider alone gives the eye a barrier but no meaning. Prefer subheaders when the list has five or more items per group and the category name helps users navigate.
- **Never use dividers inside cards or dialogs to separate sections.** The card or dialog surface itself provides the container boundary; internal dividers fragment the surface and work against the elevation-based hierarchy Material 3 uses.

### Scaffold

- **Treat Scaffold as the screen's single source of slot truth.** The Scaffold composable provides dedicated slots — `topBar`, `bottomBar`, `floatingActionButton`, `snackbarHost`, and the `content` lambda — that handle inset handling, FAB docking, and snackbar positioning automatically. Replicating this with nested Columns or Boxes means taking on that inset and overlap logic manually, which consistently produces misaligned FABs and content cut off by system bars.
- **Fill the `topBar` slot with a TopAppBar variant, not a plain Row.** Material 3 defines small, center-aligned, medium, and large TopAppBar composables that respond to scroll behavior, handle safe area insets, and apply the correct color and elevation tokens. Custom Rows miss the scroll-collapsing, inset handling, and token consistency those composables provide.
- **Choose the FAB size and shape based on action importance and screen density.** A standard FAB (56dp) suits the primary action on most screens. A large FAB (96dp) is appropriate only when the action is the dominant purpose of the screen and the layout has room — a photo capture or compose screen, not a settings screen. The small FAB (40dp) is for secondary supplementary actions, not the primary one. The extended FAB (text + icon) is appropriate when the label meaningfully clarifies an ambiguous icon.
- **Anchor the FAB to the bottom-end of the content area, accounting for the bottom bar.** When a `bottomBar` is present, Scaffold automatically raises the FAB so it sits above the bar rather than behind it. Do not manually add bottom padding to the FAB to compensate; let Scaffold's slot system do the work. The FAB should never overlap the navigation bar's touch targets.
- **Reserve the bottom bar slot for navigation destinations, not actions.** NavigationBar in the `bottomBar` slot communicates "where you can go." Placing action buttons there confuses navigation hierarchy. If you need actions near the bottom, a BottomAppBar (which can host the FAB inline) is the correct composable; it semantically separates navigation from actions.
- **Pass window insets through Scaffold, not through each composable individually.** Scaffold accepts a `contentWindowInsets` parameter and applies insets to the content slot so scrollable children do not need to duplicate the padding. Applying `statusBarsPadding()` or `navigationBarsPadding()` manually inside content when using Scaffold leads to double-padded or incorrectly padded layouts.
- **Do not nest Scaffolds.** Nested Scaffolds produce double inset application and stacked FABs. If a subordinate screen needs its own app bar or FAB, use a nested NavHost destination with its own Scaffold, not a Scaffold inside the content slot of a parent Scaffold.
- **Limit the `snackbarHost` to one, at the Scaffold level.** Snackbars are global feedback signals. Creating separate SnackbarHost instances inside content or dialogs fragments feedback and breaks the Material 3 prescription that snackbars appear above the FAB and bottom bar.

## Platform notes

- **Compact phones (< 600dp width):** Full-width dividers spanning the screen can feel heavy on narrow layouts; prefer inset dividers or spacing between list items. The standard FAB sits bottom-end; the bottom navigation bar uses NavigationBar with three to five destinations.
- **Medium screens / foldables (600–840dp width):** Consider moving navigation from a bottom NavigationBar to a side NavigationRail; the Scaffold `bottomBar` slot then becomes empty or holds a BottomAppBar with actions. The FAB may move to the rail's bottom or remain in the content area. Dividers gain importance in two-pane layouts to separate list and detail panes.
- **Large screens / tablets (> 840dp width):** NavigationDrawer often replaces NavigationBar entirely. The Scaffold's FAB can be relocated to the drawer or into an adjacent panel; confirm the slot strategy still produces correct inset handling. Avoid full-width dividers that span both panes in a side-by-side layout — they merge what should be structurally separate surfaces. Use a VerticalDivider or elevation change to separate panes instead.
- **Wear OS:** Scaffold and dividers as described here are Android phone/tablet concepts. Wear OS uses ScalingLazyColumn and its own layout framework; these guidelines do not apply there.

## Pitfalls

- Using a divider between every list item, producing a dense grid-like appearance that obscures the content hierarchy.
- Setting a custom divider color that is too saturated or too dark, drawing more attention to the separator than to the items it separates.
- Overlapping the FAB with bottom navigation tap targets by not relying on Scaffold's automatic FAB elevation handling.
- Nesting a second Scaffold inside the `content` slot of an outer Scaffold, causing duplicated insets and layout glitches.
- Using full-width dividers inside Cards or Dialogs, fragmenting a surface that M3 intends to read as a unified container.
- Skipping Scaffold entirely and manually managing insets with padding modifiers, leading to content hidden behind system bars or the navigation bar.
- Placing a large FAB on every screen for consistency rather than only on screens where the primary action deserves maximum visual weight.
- Treating the `bottomBar` slot as a generic action tray and mixing navigation destinations with context-sensitive action buttons.

## References

- **Material 3 Guidelines:** [Divider overview](https://m3.material.io/components/divider/overview)
- **Android Documentation:** [Scaffold composable](https://developer.android.com/develop/ui/compose/components/scaffold)

## See also

- The compose-layout code skill covers implementing Scaffold slots, inset handling with `contentWindowInsets`, and correct FAB positioning in Jetpack Compose code.
- The compose-lazy-lists code skill covers how to embed HorizontalDivider within LazyColumn item content and use `startIndent` for inset dividers.
- The m3-navigation-bars and m3-top-app-bars design skills address the specific composables and design judgment for the content that fills Scaffold's `topBar` and `bottomBar` slots.
- The m3-fab design skill covers FAB size, shape, and label choices in more depth.
