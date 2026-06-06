---
name: m3-lists
description: "Material 3 design guidance for list components on Android — one-, two-, and three-line items with leading and trailing elements, dividers and grouping, density, selection, swipe actions, and when lists beat grids or cards. Use when designing or critiquing any scrollable list surface in an Android app that follows Material You / M3 Expressive."
tags: [m3, design, lists, android, material-you, components]
x-skills-master:
  domain: android
  class: design
  category: components
  platforms: ["android", "large-screen"]
  pairs_with: [compose-lazy-lists]
  sources:
    - https://m3.material.io/components/lists/overview
    - https://developer.android.com/develop/ui/compose/lists
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Use this skill when designing or reviewing any vertically scrolling collection of repeated, homogeneous rows in an Android app — contact directories, settings pages, messaging threads, search results, file browsers, or any data table where each entry shares the same structure. It is also the right skill for deciding whether a list, a grid, or a card surface better serves the content, and for evaluating list density, grouping, leading/trailing elements, swipe actions, and selection states.

---

## Core guidance

### Choosing line density: one, two, or three lines

- **One-line items** are for the simplest, most scannable contexts — a single label with an optional leading icon or avatar. Prefer this when the label alone tells the user everything needed to act (e.g. a settings toggle, a navigation destination).
- **Two-line items** add a supporting body line for secondary context (sender + preview, file name + size, contact + number). This is the M3 default for most list surfaces. The headline should always be the primary affordance; the supporting text should genuinely help the user decide, not just repeat it.
- **Three-line items** accommodate a longer supporting excerpt (email preview, article summary). Use them only when the extra line changes a user's decision — a list of short messages does not benefit from three lines. Limit the supporting text to two visible lines; longer content belongs on the detail view, not the list.
- **Do not mix line densities within a single list** unless the content structure genuinely varies (e.g. a mixed-type inbox with pinned items). Inconsistent row height increases cognitive load and breaks scannability.

### Leading elements: icons, avatars, and images

- **Lead with a visual only when it adds distinct information.** A monochrome icon repeated identically on every row adds decoration, not signal; prefer text-only rows in that case.
- **Avatars and thumbnail images** communicate identity or content type quickly and are appropriate in contact, media, or messaging lists. Crop images to the standard 40 dp circle (avatar) or a fixed 56 dp square (video/article thumbnail) to maintain rhythm.
- **Use outlined or filled icons** from the Material Symbols set at 24 dp; never scale custom icons beyond 40 dp in a list leading slot, or they overwhelm the supporting text.
- **Preserve a consistent leading slot width.** Mixing items with and without leading icons in the same list causes headline text to misalign and breaks visual flow. If some items lack a meaningful icon, provide a placeholder or remove icons from the entire list.

### Trailing elements: metadata, actions, and controls

- **Trailing metadata** (date, count, price) should be secondary text in `labelSmall` or `bodySmall` at medium emphasis. Never let trailing text compete with the headline.
- **Trailing action icons** (more-options menu, share, chevron-forward) are appropriate for revealing secondary actions, not primary ones. A list item whose primary action is "delete" should expose that via swipe or contextual selection, not a visible trailing icon button.
- **Trailing controls** (Switch, Checkbox, Radio) are the correct pattern for settings and preference lists. A Switch belongs in the trailing slot; do not place it as a leading element or in the supporting text region.
- **Avoid combining both a trailing icon and a trailing control** in the same item — it creates two competing affordances and confuses assistive technology about which element to focus.

### Dividers and grouping

- **Inset dividers** — dividers that start at the headline text baseline, not the far left edge — are the M3 default. They preserve the visual association between leading elements and their rows while still separating items.
- **Full-bleed dividers** are appropriate only at section breaks, not between every item. Over-dividing adds visual noise and makes each row feel isolated.
- **Subheaders** group related rows under a short label rendered in `labelMedium` at secondary emphasis, aligned with the leading indent. Keep subheader labels concise (one to three words). Do not use subheaders for single-item groups.
- **Avoid combining both dividers and cards** as row containers in the same list. If items are already card-elevated, a divider between them is redundant — the card boundary already separates them.

### Selection and multi-select

- **Single selection** transforms the row's leading element into a filled Radio Button or highlights the entire row with a `secondaryContainer` surface tint. Never rely on color alone to signal selection; pair it with an icon state change or a visible checkmark.
- **Multi-select** (contextual action bar pattern): on long-press, the leading element converts to a Checkbox with a checked animation, and the top app bar transitions to a contextual action bar showing bulk actions. This is the canonical M3 multi-select pattern — do not introduce a separate selection mode toggle in the toolbar.
- **Indicate selection count** in the contextual action bar's title so users know how many items are affected before confirming a bulk action.
- **Do not allow swipe-to-select;** swipe is reserved for primary row actions like delete or archive.

### Swipe actions

- **Swipe-to-dismiss or swipe-to-archive** are reserved for destructive or high-frequency actions. Reveal the action with a colored background and a clear icon (e.g. a trash icon on a red surface) so users understand the consequence before releasing.
- **Limit swipe to one or two actions per direction.** A full-width swipe revealing four actions is overwhelming; move secondary actions to the item's overflow menu.
- **Always provide an undo** for destructive swipe actions (using a Snackbar with an action). Silent deletion is a critical UX failure.
- **Do not swipe-enable read-only or navigational rows** (e.g. settings entries that open a destination). Users will accidentally trigger swipe when they meant to tap.

### List versus grid versus cards

- **Use a list** when items are primarily distinguished by text metadata (name, date, status), when rows need a leading identity element (avatar, icon), or when the content benefits from a dense, scannable vertical rhythm. Lists are also the right choice for sequential or ordered data.
- **Use a grid** when items are primarily visual and roughly equal in importance — photos, products, album art. Grids establish visual parity and invite browsing rather than reading.
- **Use cards** when each item is a self-contained, high-value object with heterogeneous content — an article with a hero image, summary, and metadata that differs per item. Cards imply independence; list rows imply set membership.
- **Avoid cards inside a lazy scrolling list if each card has identical structure.** This is a common over-design: a card's elevation and rounded corners add visual weight that is only justified when items are truly standalone. Prefer a flat list row with an inset divider.

---

## Platform notes

### Compact phone (portrait)

The standard M3 list item works at 56 dp (one-line), 72 dp (two-line), and 88 dp (three-line) item heights. These are minimum touch targets — do not reduce height below 48 dp for interactive rows. On narrow screens, truncate trailing metadata before truncating headline text.

### Large screens and foldables (600 dp+)

On tablets and foldables in expanded window-width class, a full-width single-column list stretched to 900+ dp becomes a reading and scanning problem — lines of text grow excessively long. Apply a maximum content width constraint (typically 840 dp) centered in the pane, or adopt a two-pane layout where the list occupies the leading pane and detail opens alongside it. The `ListDetailPaneScaffold` composable implements this pattern — for implementation, defer to the compose-lazy-lists and compose-layout code skills. On large screens, consider promoting to a two-column list if item content is short (one-line items) and screen width comfortably allows it.

### Wear OS

Standard M3 list items are not used on Wear OS. That platform uses `TransformingLazyColumn` with its own item scaling and opacity curves. Do not apply phone list guidance directly to Wear surfaces.

### TV

TV uses `TvLazyColumn` and focus-state highlighting. M3 phone list density and touch-target guidance does not translate — TV items need larger typography, generous focus rings, and no swipe affordances.

---

## Pitfalls

- **Three-line items for short content.** Forcing a three-line layout when only one meaningful line of supporting text exists produces awkward whitespace and a padded, unfinished look. Audit whether the second supporting line earns its vertical space.
- **Icon decoration on every row.** Repeating the same icon across all rows provides no differentiation and wastes leading slot space. Use distinct icons that encode meaning, or omit them.
- **Relying on row color alone for selection.** A tinted row with no icon state change is invisible to users with color vision deficiency and inaccessible to screen readers.
- **Swipe actions on navigational rows.** Users attempting to scroll horizontally past a navigational row accidentally trigger the swipe action. Gate swipe actions on rows that represent editable or deletable content.
- **Using cards when a flat list suffices.** Card elevation creates visual noise at scale. Reserve card containers for heterogeneous, high-value objects.
- **Mixing leading slot widths.** Alternating between rows with 40 dp avatars and rows with no leading element causes headline text to misalign across the list, breaking the rhythm that makes scanning fast.
- **No undo for swipe-to-delete.** Silent destruction violates both M3 guidance and basic user trust. Always pair a destructive swipe action with a Snackbar undo.
- **Subheaders without meaningful grouping.** A subheader over a single item, or subheaders that restate the app section title, add noise without aiding navigation.
- **Full-bleed dividers between every item.** M3 recommends inset or no dividers at all for closely related items. Dense dividers make a list feel tabular and heavy rather than fluid.

---

## References

- **Material 3 Guidelines:** [Lists overview](https://m3.material.io/components/lists/overview)
- **Documentation:** [Lists and grids — Jetpack Compose](https://developer.android.com/develop/ui/compose/lists)

---

## See also

The **compose-lazy-lists** code skill implements the scrolling containers (`LazyColumn`, `LazyRow`, item keys, sticky headers, and `LazyListState`) that back any M3 list surface — hand all implementation work there. For two-pane large-screen layouts, consult the **compose-layout** code skill. For the visual theming of list item surfaces and color roles, see the **compose-theming** code skill. For accessible selection state announcements, see the **compose-accessibility** code skill.
