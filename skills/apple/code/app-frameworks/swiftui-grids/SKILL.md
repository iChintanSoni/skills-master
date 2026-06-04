---
name: swiftui-grids
description: "Guidance for choosing between SwiftUI's eager Grid/GridRow and lazy LazyVGrid/LazyHGrid, and for sizing tracks with GridItem (fixed, flexible, adaptive). Use when laying out content in rows and columns, building photo galleries or card collections, aligning form-like or spreadsheet content across columns, or deciding which grid container belongs inside a scroll view."
globs:
  - "**/*.swift"
tags: [swiftui, layout, grid, lazyvgrid, griditem]
x-skills-master:
  domain: apple
  class: code
  category: app-frameworks
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  requires:
    ios: "17"
    swift: "6.0"
  pairs_with: []
  sources:
    - https://developer.apple.com/documentation/swiftui/grid
    - https://developer.apple.com/documentation/swiftui/lazyvgrid
    - https://developer.apple.com/documentation/swiftui/griditem
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for a grid when content is genuinely two-dimensional and you want consistent column or row structure rather than nested stacks. The hard choice is which family:

- **Grid / GridRow** — an eager container that measures every cell up front so columns line up across rows, like a spreadsheet, dashboard, or label-and-value form. Best for a bounded, known number of cells.
- **LazyVGrid / LazyHGrid** — lazy containers placed inside a `ScrollView` that build cells only as they scroll into view. Best for large or open-ended collections such as photo galleries and card feeds.

If you only need one axis of repetition, a plain `LazyVStack` or `HStack` is usually simpler than any grid.

## Core guidance

- **Do use Grid for cross-row alignment.** `Grid` sizes a column to its widest cell across all rows, so values align without manual frame widths. `LazyVGrid` cannot do this — it only knows its own column tracks, not what neighbors render.
- **Don't put Grid around hundreds of cells.** It loads and measures everything immediately. Once a collection is long or unbounded, switch to a lazy grid in a `ScrollView` so off-screen cells are never built.
- **Do pick the right GridItem sizing.** `.adaptive(minimum:)` fits as many columns as space allows (responsive galleries); `.flexible()` splits remaining space among a fixed column count; `.fixed()` pins an exact width or height.
- **Don't confuse the two spacings.** `GridItem(spacing:)` controls the gap between tracks on the cross axis; the grid's own `spacing:` argument controls the gap between rows (for `LazyVGrid`) or columns (for `LazyHGrid`).
- **Do span and align cells in Grid with modifiers.** `gridCellColumns(_:)` makes a cell span multiple columns (headers, footers); `gridColumnAlignment(_:)` and `gridCellAnchor(_:)` override per-column alignment.
- **Do set `maximum:` deliberately on adaptive items.** Without a cap, adaptive cells stretch to fill leftover width and can look uneven on wide displays; clamp with `.adaptive(minimum:maximum:)`.

```swift
// Responsive gallery: as many ~120pt columns as fit.
let columns = [GridItem(.adaptive(minimum: 120), spacing: 12)]

ScrollView {
    LazyVGrid(columns: columns, spacing: 12) {
        ForEach(photos) { photo in
            PhotoCell(photo)
        }
    }
    .padding()
}
```

## Platform notes

- **iOS / iPadOS:** Adaptive columns shine across size classes — the same `LazyVGrid` reflows from two columns on iPhone to several on iPad without code changes.
- **macOS:** Wide windows make `.flexible(maximum:)` and adaptive caps important; uncapped cells can grow awkwardly large.
- **watchOS:** Favor `.adaptive` or one to two flexible columns; small displays leave little room for fixed widths.
- **tvOS:** Keep cells focusable and large enough for the focus engine; verify focus traversal order matches reading order.
- **visionOS:** Grids work in windows and volumes, but very deep eager `Grid` content adds layout cost — prefer lazy grids for long collections.

## Pitfalls

- Using `LazyVGrid` and expecting column widths to align with a sibling grid — only `Grid` measures across rows.
- Wrapping a `LazyVGrid` in a `Grid` (or vice versa) hoping to combine behaviors; nest intentionally and sparingly, as the inner container's sizing is independent.
- Forgetting the `ScrollView`: lazy grids do not scroll on their own, and without scrolling their laziness gives no benefit.
- Mixing many `.fixed` items so total width exceeds the container, causing clipping or horizontal overflow.
- Assuming a single `.flexible()` behaves like `.adaptive` — flexible keeps a fixed column count; adaptive changes the count to fit.

## References

- **Documentation:** [Grid](https://developer.apple.com/documentation/swiftui/grid)
- **Documentation:** [LazyVGrid](https://developer.apple.com/documentation/swiftui/lazyvgrid)
- **Documentation:** [GridItem](https://developer.apple.com/documentation/swiftui/griditem)
- **Documentation:** [gridCellColumns(_:)](https://developer.apple.com/documentation/swiftui/view/gridcellcolumns(_:))
- **WWDC:** [Compose custom layouts with SwiftUI (WWDC22)](https://developer.apple.com/videos/play/wwdc2022/10056/)

## See also

For long scrolling collections of cells, pair this with a skill on swiftui-scrollview behavior and one-dimensional swiftui-stacks layout. When a grid drives selection or detail navigation, see a skill on swiftui-navigation. For data-backed lists that resemble single-column grids, compare against a swiftui-lists skill.
