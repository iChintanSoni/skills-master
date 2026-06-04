---
name: swiftui-custom-layout
description: Guidance for building SwiftUI custom layouts with the Layout protocol (sizeThatFits/placeSubviews), layout caches, alignment guides, ViewThatFits, anchors, and coordinate spaces. Use when arranging subviews in a flow, radial, or measurement-driven pattern that nested HStack/VStack/Grid cannot express, when adapting between layouts by available space, or when reading one view's geometry relative to another.
---

## When to use

Reach for a custom `Layout` when the arrangement is genuinely two-pass — children must be measured before any can be placed — or when the same non-trivial pattern (wrapping tag flow, radial dial, masonry, justified row) recurs across screens. Stacks and `Grid` cover the overwhelming majority of UI; a custom layout is a tool for the cases they cannot express without brittle `GeometryReader` plumbing.

Prefer `ViewThatFits` first when you only need to pick between a few prebuilt arrangements based on available space. Prefer alignment guides when stacks already place views correctly and you only need to nudge how they line up. Reserve the `Layout` protocol for when you must own both sizing and placement.

## Core guidance

- Do implement the two required members: `sizeThatFits(proposal:subviews:cache:)` returns the container's size for a `ProposedViewSize`; `placeSubviews(in:proposal:subviews:cache:)` positions each child by calling `subview.place(at:anchor:proposal:)`. Both run many times per layout pass.
- Don't measure children with a fixed size — ask each `LayoutSubview` for `subview.sizeThatFits(proposal)`. Handle the three special proposals: `.zero` (minimum), `.unspecified` (ideal), and `.infinity` (maximum). SwiftUI probes all three.
- Do use a cache for expensive cross-call work (row breaking, total size). Add `makeCache(subviews:)` and `updateCache(_:subviews:)`; they are static. Keep cached values cheap to recompute, because SwiftUI may discard the cache.
- Do read per-subview layout values via the `subviews[i][MyKey.self]` subscript backed by a `LayoutValueKey`, and respect `subview.spacing` / `subview.priority` instead of hardcoding gaps.
- Don't reach for a `Layout` to adapt by size class — wrap alternatives in `ViewThatFits`, or use `AnyLayout` to swap an `HStackLayout` for a `VStackLayout` so the transition animates and view identity is preserved.
- Do confine geometry reads to named coordinate spaces: tag an ancestor with `coordinateSpace(.named(...))` (iOS 17+) and resolve child anchors against it via `GeometryProxy.bounds(of:)` rather than mixing `.global` and `.local`.
- Don't use a custom layout to set a stored property from a measurement during the render pass — that risks update loops; route measurements through preferences or anchors instead.

```swift
struct EqualWidthHStack: Layout {
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout Void) -> CGSize {
        let cellWidth = subviews.map { $0.sizeThatFits(.unspecified).width }.max() ?? 0
        let height = subviews.map { $0.sizeThatFits(.unspecified).height }.max() ?? 0
        let total = cellWidth * CGFloat(subviews.count) + 8 * CGFloat(max(0, subviews.count - 1))
        return CGSize(width: total, height: height)
    }
    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout Void) {
        guard !subviews.isEmpty else { return }
        let cellWidth = (bounds.width - 8 * CGFloat(subviews.count - 1)) / CGFloat(subviews.count)
        var x = bounds.minX
        for subview in subviews {
            subview.place(at: CGPoint(x: x, y: bounds.midY), anchor: .leading,
                          proposal: ProposedViewSize(width: cellWidth, height: bounds.height))
            x += cellWidth + 8
        }
    }
}
```

## Platform notes

- The `Layout` protocol, `ViewThatFits`, `Grid`, and `AnyLayout` are iOS 16 / iPadOS 16 / macOS 13 / tvOS 16 / watchOS 9 and later; visionOS supports them from 1.0.
- Conform a layout container directly and use it like any container — `EqualWidthHStack { ... }` — no wrapper view is needed. A `Layout` is also `Animatable`, so animating its stored parameters animates placement.
- `coordinateSpace(_:)` taking a `NamedCoordinateSpace` (such as `.named(_:)`) is iOS 17+ and supersedes the older string-based `coordinateSpace(name:)`; `frame(in:)` and `GeometryProxy.bounds(of:)` accept the named space.
- On watchOS keep per-pass work minimal and lean on the cache; the layout engine runs the same probing there but on tighter budgets.

## Pitfalls

- Returning a size from `sizeThatFits` that you then ignore in `placeSubviews` produces clipping or overflow — derive placement from the same measurements, and place every child or it will not appear.
- Forcing `.infinity` proposals onto children that report unbounded ideal sizes can yield runaway dimensions; clamp against the incoming proposal.
- Storing mutable layout state outside the cache breaks SwiftUI's assumption that layout is a pure function of inputs and causes flicker or stale frames.
- Overusing `GeometryReader` as a layout primitive forces a greedy parent and discards the proposal system; a custom `Layout` or anchor preference is usually the correct replacement.
- Mixing `.global` reads with `.local` placement makes scroll offsets and transforms drift; pick one named space and resolve everything against it.

## References

- **Documentation:** [Layout](https://developer.apple.com/documentation/swiftui/layout)
- **Documentation:** [Composing custom layouts with SwiftUI](https://developer.apple.com/documentation/swiftui/composing-custom-layouts-with-swiftui)
- **Documentation:** [coordinateSpace(_:)](https://developer.apple.com/documentation/swiftui/view/coordinatespace(_:))
- **Documentation:** [GeometryProxy.bounds(of:)](https://developer.apple.com/documentation/swiftui/geometryproxy/bounds(of:))
- **WWDC:** [Compose custom layouts with SwiftUI (WWDC22)](https://developer.apple.com/videos/play/wwdc2022/10056/)

## See also

Pair this with a skill on SwiftUI stacks and Grid for the cases that do not need a custom layout, and with a SwiftUI animation skill when swapping layouts via `AnyLayout`. A skill on GeometryReader and preferences complements the coordinate-space and anchor guidance here.
