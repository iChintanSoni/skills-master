---
name: hig-lists-tables
description: Applies Apple Human Interface Guidelines to lists and tables — organizing rows and sections, choosing plain vs grouped vs inset-grouped styles, selection and edit-mode affordances, swipe actions, disclosure/outline hierarchy, and deciding between a list, a collection/grid, and a true multi-column table. Use when designing or reviewing scrollable row-based UI, picking a list style, critiquing swipe actions or reordering, or choosing the right container for a data set. Produces design critique and recommendations, not code.
---

## When to use

Use when designing or reviewing scrollable, row-based content and deciding how to structure it: which list style fits, how to group rows into sections, how selection and editing should behave, what swipe actions to offer, and whether the data even belongs in a list versus a grid or a multi-column table. This is a design-judgment skill — it produces critique and recommendations, not Swift. For the implementation, hand off to the SwiftUI/UIKit list skill.

## Core guidance

- **Pick the container by data shape, not habit.** A list is for a single column of scannable rows. Reach for a collection/grid when items are visual and comparable (photos, albums, cards) and benefit from a two-dimensional layout. Reserve a true multi-column table for data people compare across attributes (a spreadsheet-like view), primarily on iPad and Mac.
- **Choose the list style for the content's structure.** Plain/continuous suits a long homogeneous feed; grouped (inset-grouped on iOS) suits settings-like content that reads as labelled clusters with headers and footers. With the current design, grouped rows sit in inset capsule-cornered cards — let that rounded geometry breathe rather than fighting it.
- **Use sections to teach structure, not to decorate.** Add a header only when a group needs a name; add a footer only to explain or summarize. Don't fragment a short list into many tiny sections — that adds chrome without meaning.
- **Make swipe actions match risk and reversibility.** Trailing (right-to-left) is the conventional home for destructive or context-ending actions like Delete and Archive; lead with the most important. Leading (left-to-right) is for quick, reversible shortcuts like Pin, Flag, or Mark as Read. Confirm truly destructive actions, and never hide the *only* path to an action behind a swipe.
- **Design selection and editing as distinct modes.** Tapping a row should navigate or act; multi-select for bulk operations belongs in an explicit edit mode. Offer reordering when sequence is meaningful — people value rearranging even when they can't add or remove. Keep edit-mode controls (delete badge, reorder grip) obvious and reversible.
- **Use disclosure to reveal hierarchy, not to hide essentials.** A disclosure triangle/row expands nested children in place (an outline); use it for genuinely hierarchical data. Don't bury primary actions or first-run content behind a collapsed row.
- **Load progressively and keep rows scannable.** Fill visible rows with text immediately and stream slower content (thumbnails, counts) in; show a clear loading state for long fetches and a meaningful empty state when there's nothing yet. Keep row text succinct so it doesn't truncate or wrap awkwardly.

## Platform notes

- **iOS / iPadOS:** Inset-grouped is the default for settings-style screens; plain for feeds. Swipe actions, drag-to-reorder, and an edit mode are core idioms. On iPad, the list is often the sidebar of a split view — pair it with a detail pane rather than deep push stacks, and consider a real multi-column table for data-dense detail.
- **macOS:** Use a source list (sidebar) for navigation and outline views for hierarchy; full multi-column tables with sortable headers are first-class here. Selection is persistent and pointer-driven, with right-click context menus replacing most swipe actions.
- **watchOS:** Lists are the dominant layout — short, vertically stacked, glanceable rows with large tap targets; avoid swipe-heavy interactions and dense multi-column data.
- **tvOS:** Rows and grids are focus-driven; ensure clear focus appearance and generous spacing. Prefer collections for browsable media.
- **visionOS:** Lists and grids float in a window with depth and hover feedback; keep rows shallow and legible, and lean on collections for media-rich browsing.

## Pitfalls

- Forcing tabular, multi-attribute data into a single-column list (or cramming a wide table onto a phone) instead of choosing the right container.
- Over-sectioning a short list, or adding headers/footers that carry no information.
- Putting a destructive swipe action where a reversible one is expected, or making swipe the *only* way to reach an action.
- Conflating navigation taps with multi-select instead of using an explicit edit mode.
- Hiding important content or actions behind collapsed disclosure rows.
- Applying heavy Liquid Glass or custom material to list rows themselves — glass belongs to floating bars and controls above the content, not the scrolling rows.

## References

- **Human Interface Guidelines:** [Lists and tables](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables)
- **Human Interface Guidelines:** [Collections](https://developer.apple.com/design/human-interface-guidelines/collections)
- **Human Interface Guidelines:** [Outline views](https://developer.apple.com/design/human-interface-guidelines/outline-views)
- **Human Interface Guidelines:** [Disclosure controls](https://developer.apple.com/design/human-interface-guidelines/disclosure-controls)
- **WWDC:** [Get to know the new design system (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/356/)
- **WWDC:** [Build a SwiftUI app with the new design (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/323/)

## See also

- Implementation: the SwiftUI/UIKit list skill (e.g. `swiftui-lists-tables`) for `List`, `Table`, sections, swipe actions, and reordering.
- Related design skills: `hig-sheets` for modal detail presentation, `hig-searching` for filtering list content, `hig-drag-and-drop` for reordering and moving rows, `hig-entering-data` for editable rows and forms.
- Apple HIG: Lists and tables, Collections, Outline views (see sources).
