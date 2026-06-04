---
name: uikit-collection-views
description: "Builds modern UICollectionView screens with compositional layout, diffable data sources, cell registrations, and content configurations. Use when laying out grids, lists, or outlines in UIKit, when sections need different layouts, when migrating off flow layout or register(_:forCellWithReuseIdentifier:), or when async data updates must animate safely off the main thread's reload path."
globs:
  - "**/*.swift"
tags: [uikit, collectionview, compositional-layout, diffable, lists]
x-skills-master:
  domain: apple
  class: code
  category: app-frameworks
  platforms: [ios, ipados, tvos, visionos]
  requires:
    ios: "17"
    swift: "6.0"
  pairs_with: []
  sources:
    - https://developer.apple.com/documentation/uikit/implementing-modern-collection-views
    - https://developer.apple.com/documentation/uikit/uicollectionviewcompositionallayout
    - https://developer.apple.com/documentation/uikit/uicollectionviewdiffabledatasource-9tqpa
    - https://developer.apple.com/documentation/uikit/uicollectionlayoutlistconfiguration
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for this skill whenever you present scrollable, sectioned, or multi-column content in UIKit and want the layout and data plumbing to stay declarative and crash-resistant. It covers four pillars that compose into one screen: compositional layout (item -> group -> section), a diffable data source driven by snapshots, cell registrations that replace string reuse identifiers, and content configurations for cell styling. Use it for grids, carousels, table-like lists, expandable outlines, and any view where sections differ from one another. If your UI is entirely SwiftUI, prefer `List`/`Grid` instead; this skill is for UIKit screens or UIKit islands embedded via `UIHostingConfiguration`.

## Core guidance

- **Build layout bottom-up.** Define an `NSCollectionLayoutItem` with a size, wrap it in an `NSCollectionLayoutGroup`, then an `NSCollectionLayoutSection`. Prefer `.fractionalWidth`/`.fractionalHeight` for responsive sizing and `.estimated` for self-sizing text; avoid `.absolute` except for fixed chrome.
- **Vary layout per section** with the section-provider initializer of `UICollectionViewCompositionalLayout`. Switch on your section enum so a grid and a list can coexist; do not force one geometry across unlike content.
- **Drive every visual change through snapshots.** Apply an `NSDiffableDataSourceSnapshot` of `Hashable` section and item identifiers; never mutate a backing array and call `reloadData()`. Use `apply(_:animatingDifferences:)` and let the diff compute inserts, deletes, and moves.
- **Identify items by stable identity, not by value.** Snapshot generics should be lightweight IDs (or value types whose `Hashable` is identity-stable). On iOS 15+, call `reconfigureItems(_:)` to refresh content in place without losing cell state; reserve `reloadItems(_:)` for identity-preserving full rebuilds.
- **Register cells with `UICollectionView.CellRegistration`** and dequeue inside the data source's `cellProvider`. This eliminates string reuse identifiers and `register(_:forCellWithReuseIdentifier:)`, and gives the configuration closure the index path and item.
- **Style via content configurations.** Take `defaultContentConfiguration()` (or `UIListContentConfiguration.cell()`), mutate it, assign to `cell.contentConfiguration`, and set `cell.backgroundConfiguration` separately. Update appearance in `configurationUpdateHandler` keyed on cell state rather than in delegate callbacks.
- **Get table-like lists for free** with `UICollectionLayoutListConfiguration`, which yields a section you return from the layout provider. It brings swipe actions, separators, headers/footers, and outline disclosure without a custom layout.

```swift
let reg = UICollectionView.CellRegistration<UICollectionViewListCell, Item> {
    cell, _, item in
    var content = cell.defaultContentConfiguration()
    content.text = item.title
    content.secondaryText = item.subtitle
    cell.contentConfiguration = content
    cell.accessories = [.disclosureIndicator()]
}
dataSource = .init(collectionView: cv) { cv, indexPath, id in
    cv.dequeueConfiguredReusableCell(using: reg, for: indexPath, item: store[id])
}
```

## Platform notes

- **iOS / iPadOS 17+:** Full support for compositional layout, list configuration, and `reconfigureItems(_:)`. On iPad, lean on fractional groups and `UICollectionViewCompositionalLayoutConfiguration` interItem/section spacing so the same layout adapts across split-view widths.
- **visionOS:** Collection views render in 2D windows; use list and grid configurations as on iOS. Favor generous spacing and hover-aware accessories, and rely on system content configurations to pick up the platform's vibrancy and focus treatment.
- **tvOS:** Focus engine drives selection. Use cell `configurationUpdateHandler` with `cell.configurationState.isFocused` to reflect focus styling instead of hand-managing `didUpdateFocus`. Estimated sizes interact with focus growth, so test self-sizing under focus.
- **Mac Catalyst:** Behaves like iPad; pointer interactions and right-click context menus work, but verify list separators and swipe actions under pointer rather than touch.

## Pitfalls

- **Calling `apply` off the main thread inconsistently.** Always apply from the same context. Diffable data source is safe to apply on a background queue only if you do so consistently; mixing main and background applies causes corruption. The safest default is main-actor application.
- **Snapshotting full value objects.** If item identifiers carry mutable data, an unchanged item can diff as changed (or fail to refresh). Use ID-based snapshots plus `reconfigureItems(_:)` for content updates.
- **Returning unequal identifiers for equal items.** Duplicate or non-unique `Hashable` identifiers trigger a runtime crash on `apply`. Guarantee uniqueness across the whole snapshot, not just per section.
- **Sizing groups wrong.** A group whose height is `.fractionalHeight(1.0)` inside a section without a bounded height collapses. Anchor the outermost dimension explicitly or use `.estimated`.
- **Mutating `contentConfiguration` after assignment.** Configurations are value types; editing a copy after assigning it does nothing. Re-assign the modified configuration to the cell.
- **Mixing legacy `register`/`dequeueReusableCell` with registrations.** Pick one path per cell type; the string-identifier API and `CellRegistration` should not target the same cell class interchangeably.

## References

- **Documentation:** [Implementing modern collection views](https://developer.apple.com/documentation/uikit/implementing-modern-collection-views)
- **Documentation:** [UICollectionViewCompositionalLayout](https://developer.apple.com/documentation/uikit/uicollectionviewcompositionallayout)
- **Documentation:** [UICollectionViewDiffableDataSource](https://developer.apple.com/documentation/uikit/uicollectionviewdiffabledatasource-9tqpa)
- **Documentation:** [UICollectionLayoutListConfiguration](https://developer.apple.com/documentation/uikit/uicollectionlayoutlistconfiguration)
- **WWDC:** [Lists in UICollectionView (WWDC20)](https://developer.apple.com/videos/play/wwdc2020/10026/)
- **WWDC:** [Make blazing fast lists and collection views (WWDC21)](https://developer.apple.com/videos/play/wwdc2021/10252/)

## See also

Pair this with a SwiftUI-interop skill when embedding SwiftUI cells through `UIHostingConfiguration`, and with a UIKit navigation or scene-architecture skill for wiring selection into routing. A diffable-data-source modeling skill complements the snapshot and identifier patterns described here, and a list-and-table design skill covers the Human Interface Guidelines side of list presentation.
