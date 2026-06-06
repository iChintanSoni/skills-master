---
name: m3-button-groups
description: "Design guidance and critique for Material 3 Expressive button groups on Android: choosing connected vs standard groups, orchestrating coordinated interactions and shape morphing, sizing and target rules, and knowing when to group related actions into a single expressive unit instead of placing buttons separately. Use when designing or reviewing toolbars, segmented action sets, filter bars, media controls, or any screen where two or more related actions belong side by side in a cohesive visual cluster."
---

## When to use

Use this skill when deciding whether related actions should be collected into a button group, which group variant to choose, and how to apply M3 Expressive shape morphing and coordinated interaction patterns. It covers connected button groups (actions fused into a single pill-shaped container) and standard button groups (actions spaced together without shared containment), along with the rules that govern their layout, sizing, and expressive behavior.

This is design judgment, not implementation. The Jetpack Compose Material 3 composables involved — `ButtonGroup` and its connected/standard modes — are named in prose; hand the actual coding to the corresponding code skill.

## Core guidance

- **Group only actions that are genuinely related.** A button group asserts a semantic relationship. If the actions do not belong to the same task or object, placing them in a group creates false coupling and confuses users about why the controls share a container. Separate unrelated primaries instead.

- **Use a connected group when actions operate on a shared subject as a set.** Connected button groups fuse buttons into a continuous container with shared corner radii, visually communicating that the options are co-dependent alternatives or complementary controls (e.g., Bold / Italic / Underline, Play / Pause / Skip, or a set of filter chips that all affect the same list). Use a standard group when the actions are related but independent enough to stand apart without a shared boundary.

- **Let shape morphing reinforce state — do not suppress it.** M3 Expressive button groups animate corner radii when an item is pressed or selected: the active item's corners sharpen while neighbors' adjacent corners broaden, creating a fluid organic transition. This is a core expressive signal, not a decoration. Maintain enough container height and width per item so the morph is perceptible and not clipped; never flatten all radii to zero or lock them static.

- **Coordinate interaction across the group, not just within one button.** When a button is pressed, neighboring buttons respond with a subtle positional or shape shift. This coordinated response is how M3 Expressive communicates that the controls share a relationship. Ensure touch targets remain correct throughout the animation so a fast tap on an adjacent control does not misfire.

- **Size buttons within a group consistently.** All items in a connected group should share the same height. Icon-only items may be narrower than labeled items, but mixing tall and short buttons inside a single connected group breaks the shared container silhouette. If one action is substantially more important than the others, consider a standalone button plus a standard group, not a lopsided connected group.

- **Maintain a 48 dp minimum touch target for every item.** Connected groups look compact, but the interactive area of each button must still meet the 48 dp recommendation. Use internal padding to satisfy this while keeping the visible surface compact; do not shrink the visible button below legibility in pursuit of density.

- **Apply the appropriate emphasis level across the group.** In a connected group, you can mix fills — for example one filled (primary) item flanked by tonal or outlined items — to express a default or recommended action. Avoid making every item equally filled, which collapses visual hierarchy inside the group. In a standard group, button styles should generally be consistent unless a clear primary action exists.

- **Limit connected groups to roughly two to five items.** Fewer than two is not a group. More than five items in a single connected group creates a dense, hard-to-target strip; split long sets into a scrollable row, a chip group, or a segmented layout.

- **Prefer icon-only or short-label buttons inside groups.** Long text in a connected group forces the container to span the full screen width, reducing the perceptual benefit of grouping. Use icons (with accessible content descriptions) or concise one-word labels. Reserve full-label buttons for standard groups where width flexibility is higher.

- **Do not nest button groups or place a group inside another group.** Nesting breaks the shape morph logic and creates ambiguous touch regions. If two clusters of related actions need to coexist on a surface, use spacing and visual hierarchy to separate them rather than recursive containment.

- **Reserve button groups for persistent or frequent actions.** Groups are prominent UI elements. Placing a group for a seldom-used or context-specific action draws unwarranted attention; use an overflow menu, a bottom sheet action list, or contextual toolbars for infrequent actions.

## Platform notes

**Compact phones (portrait):** Connected groups work well across the bottom of the screen or embedded in a bottom app bar, since touch is the primary input and fingers naturally curve toward the center. Limit width to a comfortable one-handed reach zone; avoid groups that require a two-handed stretch to reach the far button.

**Large screens and foldables (expanded / medium breakpoints):** On tablets and foldables, button groups can sit in a persistent side rail or within a pane rather than the bottom of a full-width layout. At wider widths the connected group does not need to span the full column; constrain it to a comfortable reading width. With mouse or stylus input the shape morph on hover and press is still valuable — do not hide it behind a "touch-only" assumption.

**Wear OS:** Button groups as defined in M3 Expressive are designed for phone and tablet form factors. Wear OS has its own compact action patterns; do not adapt connected groups onto a watch screen without specific platform guidance.

**Android TV / large displays:** Focus-driven navigation means individual buttons in a group must have clear, distinct focus states. Ensure the shape morph is visible at TV viewing distances and that D-pad navigation moves predictably from one button in the group to the next.

## Pitfalls

- Grouping actions that are not semantically related just to achieve a visual cluster effect.
- Suppressing or disabling the shape morph animation, which removes the primary expressive feedback mechanism.
- Using more than five items in a single connected group, causing a dense unreadable strip.
- Making every item in the group the same emphasis level, which eliminates internal hierarchy.
- Placing long text labels in a connected group that forces the group to span the full viewport width.
- Allowing the visible tap target to shrink below 48 dp because the container looks compact.
- Nesting button groups or wrapping a group inside another grouping container.
- Using a connected group for infrequent or context-specific actions that do not warrant persistent prominence.
- Ignoring coordinated neighbor interaction, which makes the group feel like a row of isolated buttons rather than a cohesive unit.

## References

- **Material 3 Guidelines:** [Button groups overview](https://m3.material.io/components/button-groups/overview)
- **Documentation:** [Jetpack Compose UI components](https://developer.android.com/develop/ui/compose/components)
- **Material 3 Guidelines:** [Buttons overview](https://m3.material.io/components/buttons/overview)
- **Material 3 Guidelines:** [Motion — Expressive](https://m3.material.io/styles/motion/overview)

## See also

- The M3 buttons design skill covers standalone button prominence, roles, labels, and when a lone primary action is preferable to a group.
- The M3 segmented buttons design skill handles the selection-state variant where buttons act as exclusive or multi-select toggles within a shared container — a close cousin of the connected group.
- The M3 chip groups design skill is relevant when the actions are filter-like or tag-like in nature rather than imperative commands.
- The Jetpack Compose Material 3 code skill covering `ButtonGroup` implements the design decisions described here; pair this critique with it when moving from design review to code.
- The M3 motion / expressive animation design skill explains the broader shape-morph system that underlies the coordinated interaction behavior.
