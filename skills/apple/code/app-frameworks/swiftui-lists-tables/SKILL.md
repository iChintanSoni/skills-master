---
name: swiftui-lists-tables
description: "Builds scrollable data UI with SwiftUI List and Table, including ForEach with stable identity, sections, selection, editing, swipe actions, pull-to-refresh, search, and multi-column tables. Use when displaying collections of rows, adding onDelete/onMove or swipeActions, wiring searchable or refreshable onto a list, or presenting tabular data with sortable columns on iPad and Mac."
globs:
  - "**/*.swift"
tags: [swiftui, list, table, collections, editing, search]
x-skills-master:
  domain: apple
  class: code
  category: app-frameworks
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  requires:
    ios: "17"
    swift: "6.0"
  pairs_with: [hig-lists-tables]
  sources:
    - https://developer.apple.com/documentation/swiftui/list
    - https://developer.apple.com/documentation/swiftui/table
    - https://developer.apple.com/documentation/swiftui/tablecolumn
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for `List` whenever you present a vertically scrolling collection of rows: settings screens, feeds, master/detail sidebars, or anything that needs swipe actions, editing, selection, search, or pull-to-refresh. Rows are created lazily, so a `List` scales to large data sets without you managing cell reuse.

Reach for `Table` when each record has several attributes worth showing as discrete, individually sortable columns — think a file browser, an inspector, or a data grid. On iPhone a `Table` collapses to a single-column list, so design the layout to degrade gracefully. On iPad and Mac it renders true multi-column rows with header-driven sorting.

## Core guidance

- **Give every row a stable identity.** Make the model `Identifiable`, or pass a `KeyPath` to a property that is genuinely unique and persistent. Avoid `id: \.self` on mutable values and never use array indices — reordering or deletion then animates the wrong rows and corrupts selection.
- **Attach edit affordances to the `ForEach`, not the `List`.** `onDelete(perform:)` and `onMove(perform:)` live on `DynamicViewContent`. Inside the closure, mutate your source collection; SwiftUI animates the row out for you, so do not also remove a view manually.
- **Bind selection for multi-select and editing.** Pass a `Binding` to a `Set` of element IDs (or a single ID) into `List(selection:)`. An `EditButton` toggles the `editMode` environment value, revealing the move and delete controls.
- **Prefer `swipeActions` over hidden gestures.** Use `swipeActions(edge:allowsFullSwipe:content:)` for custom leading/trailing buttons; tint destructive ones with `.role(.destructive)`. A single trailing destructive button with full swipe enabled mimics the system delete.
- **Put `searchable` and `refreshable` on the `List` (or an ancestor in the navigation stack).** Filter your data from the bound search text yourself — the modifier only supplies the field. `refreshable` takes an `async` action and shows the spinner until it returns.
- **Drive `Table` sorting through `sortOrder`.** Bind an array of `KeyPathComparator` and re-sort your data in `onChange(of:)`; tapping a column header updates that binding automatically.
- **Don't fight laziness.** Keep row views cheap, avoid heavy work in `body`, and let `Table`/`List` build rows on demand rather than wrapping a precomputed `ForEach` in a `ScrollView`.

```swift
List {
    ForEach(items) { item in
        Text(item.title)
            .swipeActions(edge: .trailing) {
                Button(role: .destructive) { delete(item) } label: {
                    Label("Delete", systemImage: "trash")
                }
            }
    }
    .onMove { from, to in items.move(fromOffsets: from, toOffset: to) }
}
.refreshable { await reload() }
```

## Platform notes

- **iOS / iPadOS 26 and macOS 26 (Liquid Glass):** List and other scrollable containers received notable performance work this cycle, especially on Mac. Lists adopt the new material automatically; let the system style sidebars and inset rows rather than hardcoding backgrounds.
- **Search placement:** On iPhone the search field may sit at the bottom; with the redesigned tab bar, `Tab(role: .search)` gives a dedicated search tab. Use `searchToolbarBehavior(_:)` to minimize the field into a toolbar button when space is tight.
- **Table availability:** Multi-column `Table` requires iPadOS 16 / macOS 12 or later; `Section` support inside a `Table` on iPad and Mac arrived with that same generation. On iPhone, tvOS, and watchOS, plan for the single-column fallback.
- **watchOS / tvOS:** Favor `List` with large, focusable rows; swipe actions and full multi-column tables are not the right idiom on these platforms.
- **Column customization:** On Mac, `TableColumnCustomization` lets users hide, reorder, and resize columns; persist that state so it survives relaunch.

## Pitfalls

- **Index-based identity.** `ForEach(items.indices, id: \.self)` breaks animations and selection the moment the array changes length. Iterate over `Identifiable` elements instead.
- **Deleting twice.** Calling `remove(atOffsets:)` and then also returning a different view tree leaves SwiftUI and your data out of sync. Mutate the model once and let the framework animate.
- **Selection type mismatch.** `List(selection:)` binds to the element's `ID`, not the element itself. A `Set<Item>` where the ID is expected silently disables selection.
- **`searchable` filtering nothing.** The modifier does not filter your data — if you forget to derive the displayed collection from the search text, the field appears but does nothing.
- **`onMove` without edit mode.** Reordering needs `editMode` active (via `EditButton`) unless you use a list `editActions` initializer; otherwise the drag handles never appear.
- **Tables that scroll sideways on iPad.** iPad tables don't scroll horizontally, so too many columns get clipped. Keep the column count to what fits, and rely on the iPhone single-column fallback.

## References

- **Documentation:** [List](https://developer.apple.com/documentation/swiftui/list)
- **Documentation:** [Table](https://developer.apple.com/documentation/swiftui/table)
- **Documentation:** [TableColumn](https://developer.apple.com/documentation/swiftui/tablecolumn)
- **Documentation:** [Adding a search interface to your app](https://developer.apple.com/documentation/swiftui/adding-a-search-interface-to-your-app)
- **WWDC:** [What's new in SwiftUI (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/256/)
- **WWDC:** [SwiftUI on iPad: Organize your interface (WWDC22)](https://developer.apple.com/videos/play/wwdc2022/10058/)

## See also

Pair this with a navigation skill for master/detail flows built on `NavigationSplitView`, with a data-modeling skill covering `Observable` and SwiftData so rows stay diffable, and with a Liquid Glass styling skill for adopting the iOS 26 material on sidebars and toolbars. A drag-and-drop skill complements `onMove` when you need cross-container reordering.
