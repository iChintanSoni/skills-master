---
name: m3-layout-spacing
description: "Covers Material 3 layout and spacing design judgment — the 4dp/8dp grid, margins, padding, density, whitespace grouping, and rhythm — for Android UI. Use when designing or critiquing screen layouts, reviewing component spacing, or evaluating visual hierarchy and grouping across phone and large-screen form factors."
tags: [m3, design, layout, spacing, foundations, android]
x-skills-master:
  domain: android
  class: design
  category: foundations
  platforms: ["android", "large-screen"]
  pairs_with: []
  sources:
    - https://m3.material.io/foundations/layout/understanding-layout/spacing
    - https://developer.android.com/develop/ui/compose/layouts/basics
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Apply this skill when designing or reviewing any Android screen where spatial relationships matter: placing components on a new layout, auditing visual rhythm in an existing design, deciding how much breathing room to give a content block, or evaluating whether a dense or spacious treatment is appropriate for the context. This skill is also the right reference when a design feels "off" but the issue is harder to name — inconsistent padding, misaligned baselines, or groups that do not visually cohere.

## Core guidance

### The grid and base unit

- **Always snap to the 4dp base unit.** Every margin, padding, gap, and component dimension should be a multiple of 4dp. The most common spacings — 4, 8, 12, 16, 24, 32, 48, 64dp — form a natural vocabulary. Deviating from multiples of 4dp produces sub-pixel misalignment at common densities and makes spacing decisions arbitrary and hard to audit.
- **Prefer 8dp multiples for structural spacing.** While 4dp steps are the floor, major layout decisions (page margins, section gaps, card padding) should step in 8dp increments whenever possible. Reserve 4dp steps for fine-grained internal component spacing (icon-to-label gap, chip padding).
- **Do not mix ad-hoc values into structural gaps.** A layout that uses 16dp page margins but then introduces a 14dp card padding or a 20dp section gap breaks the rhythm. The inconsistency is subtle but accumulates into visual noise.

### Margins and page edges

- **Use 16dp minimum page margins on compact phone screens.** This keeps content clear of the screen edge and provides a consistent left/right anchoring rail. Content that bleeds to within 8dp or less of the edge reads as cramped and can be difficult to reach on curved displays.
- **Scale margins with breakpoint, not just screen width.** At medium (unfolded foldable, small tablet) and expanded (large tablet, desktop) breakpoints, Material 3 specifies 24dp and 24dp+ margins respectively. Increasing margins proportionally preserves the "held" feeling of content on larger canvases rather than just stretching a phone layout.
- **Edge-to-edge content (imagery, hero surfaces) is intentional, not a shortcut.** Full-bleed images or color surfaces that intentionally extend to the device edge are a legitimate choice, but interactive content and text within them still require internal padding at or above the baseline margin so they remain readable and tappable.

### Padding and internal breathing room

- **Distinguish padding from spacing.** Padding is the inset between a container boundary and its content. Spacing (gap) is the distance between sibling elements. Treat them as separate design decisions even when the numeric value happens to be the same.
- **Match internal padding to the weight of the container.** A card with elevation and a prominent surface color warrants 16dp internal padding. A subtle outlined chip warrants 8dp horizontal and 4–6dp vertical. Over-padding lightweight components makes them feel heavy; under-padding prominent containers feels suffocating.
- **Align related elements to a shared baseline or leading edge.** Text in a list row should align on its text baseline or leading edge with adjacent labels and icons. Misaligned baselines are one of the most common polish failures and are immediately visible when several rows are scanned.

### Density and touch targets

- **Minimum touch target is 48dp × 48dp regardless of visual size.** An icon that renders at 24dp must still reserve 48dp of tappable area around it. In Compose, this is what the Material 3 minimum touch target enforcement in composables like IconButton and Checkbox handles — do not suppress it in dense layouts; instead, reconsider the layout.
- **Use increased density only for expert or data-dense contexts.** Tighter row heights (for example 40dp instead of 56dp for a list item) are appropriate in settings panels, data tables, or developer tools where the user is scanning rather than exploring. In consumer or onboarding flows, lean toward the comfortable default density.
- **Never reduce density to fit more content.** If the content does not fit at standard density, the right answer is pagination, scrolling, progressive disclosure, or layout restructure — not compressing touch targets below 48dp.

### Grouping and visual rhythm

- **Use whitespace as a grouping signal before using dividers or color.** Elements closer together are perceived as related; elements farther apart as separate. Doubling the gap between two sections (for example 32dp between sections, 8dp within a section) communicates hierarchy without adding visual weight from a divider line.
- **Consistent rhythmic spacing reads as crafted; inconsistent spacing reads as broken.** A layout where every section gap is 24dp and every item gap is 8dp has implicit rhythm. A layout where gaps are 18dp, 22dp, 10dp, and 16dp in no discernible pattern feels amateurish even if no individual value is "wrong."
- **Align related content across columns when the layout has multiple columns.** In a two-column grid on a tablet, the top edge of cards in the same row should align. Mixed-height cards in a staggered (masonry) grid are an intentional exception, but staggering purely because alignment was not considered is not.

### Alignment

- **Left-align body text and labels in LTR layouts; right-align in RTL.** Centered body text (beyond a single short headline) creates ragged edges that slow reading. Reserve centered alignment for short decorative text, empty states, and single-line section headers.
- **Align icons and text to a shared imaginary rail.** In a navigation rail or list, the leading icon and the label should both align to the same horizontal axis. Even a 2dp misalignment is visible at a glance.

## Platform notes

### Compact phone

The single-column layout with 16dp page margins and 8dp item gaps is the baseline. All guidance above applies directly. Avoid layouts that require horizontal scrolling of primary content — this is almost always a sign of insufficient margin or an incorrectly sized component.

### Medium (unfolded foldable, small tablet, ~600–840dp)

At this breakpoint, Material 3 recommends considering a two-pane layout or widened single column rather than simply stretching a phone layout. Page margins expand to 24dp. List items may adopt wider internal padding. A navigation rail replaces the bottom navigation bar, which also changes the horizontal layout budget.

### Expanded (large tablet, Chromebook, 840dp+)

Page margins are typically 24dp with an additional 8dp+ inset for large surfaces, or layouts employ a fixed maximum content width with centering. Using the full screen width for a single column of text at 840dp+ creates extremely long line lengths that are uncomfortable to read. Constrain text content to a maximum width (typically 720–840dp for body) even when the screen is wider.

### Wear OS

The circular canvas demands radically different spacing — content must be inset well beyond a 4dp grid to avoid the rounded edges. The concept of a page margin here is best thought of as a minimum safe inset, and spacing between elements must be even more generous because the targets are navigated by rotating the crown, not tapping precisely. This skill's phone guidance does not transfer directly.

### TV

Overscan-safe areas historically required large margins; modern TV guidelines suggest a minimum 48dp margin. Remote control navigation favors generous spacing between focusable elements to make the selected state obvious. Dense layouts are inappropriate on TV.

## Pitfalls

- **Hardcoding pixel values instead of dp.** Pixel values do not scale with display density, producing layouts that are cramped on high-density screens and enormous on low-density ones. Always design in dp.
- **Treating spacing as an afterthought.** Adding padding "until it looks right" without anchoring to the 4dp grid produces values that are visually similar but numerically inconsistent, making future edits unpredictable.
- **Using dividers to compensate for poor spatial grouping.** A proliferation of divider lines is usually a sign that the spacing does not clearly distinguish groups. Remove dividers first and see if increased gap spacing achieves the same grouping more cleanly.
- **Ignoring the effect of elevation on perceived spacing.** Elevated surfaces (cards, sheets) optically appear closer to the viewer. Increasing their internal padding slightly relative to flat-surface peers preserves the proportional feeling of breathing room.
- **Stretching a phone layout to fill large screens.** A 360dp-wide layout stretched to 1200dp looks sparse and unbalanced. Spacing increases should be deliberate and proportional, not a side-effect of the layout filling available width.
- **Centering everything.** Center alignment for multi-line body content, long lists, or complex forms creates visual imbalance and slower reading. Reserve centering for short, decorative, or celebratory moments.

## References

- **Material 3 Guidelines:** [Understanding Layout — Spacing](https://m3.material.io/foundations/layout/understanding-layout/spacing)
- **Documentation:** [Compose Layouts Basics](https://developer.android.com/develop/ui/compose/layouts/basics)
- **Material 3 Guidelines:** [Applying Layout](https://developer.android.com/develop/ui/compose/layouts/adaptive)
- **Material 3 Guidelines:** [Spacing Tokens](https://developer.android.com/develop/ui/compose/layouts/basics)

## See also

This skill pairs naturally with the m3-adaptive-navigation design skill when considering how navigation chrome (bottom bar vs. rail vs. drawer) affects the horizontal layout budget. For decisions about surface color, elevation, and tonal layering that interact with spacing perception, see the m3-elevation-color design skill. For type scale and baseline grid alignment, see the m3-typography design skill. The Compose layouts basics code skill implements the spacing and layout patterns described here using Compose primitives such as Column, Row, Box, Spacer, and Modifier.padding — hand implementation there.
