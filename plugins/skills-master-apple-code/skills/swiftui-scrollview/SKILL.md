---
name: swiftui-scrollview
description: "Builds modern SwiftUI scrolling with ScrollView, scroll target behaviors, scroll position binding, transitions, and content margins. Use when implementing carousels, paged or snapping scroll, programmatic scroll-to, parallax/fade scroll effects, or reacting to scroll offset and visibility. Triggers: scrollTargetBehavior, viewAligned, paging, scrollPosition, scrollTransition, contentMargins, scrollIndicators, ScrollViewReader."
---

## When to use

Reach for these APIs whenever a plain `ScrollView` is not enough: you need content to snap to pages or to child views, you want to read or drive the current scroll position from state, you want per-item effects (fade, scale, parallax) as views enter and leave the viewport, or you need to inset content independently from the scroll indicators. On iOS 17+ the declarative scroll modifiers replace most reasons to reach for `ScrollViewReader`, `GeometryReader` offset hacks, or `UIScrollView` bridging. Prefer them for new code targeting iOS 17 and later; keep `ScrollViewReader` only for back-deployment or anchored `scrollTo` inside `List`.

## Core guidance

- Do pair `scrollTargetLayout()` on the lazy stack with `scrollTargetBehavior(.viewAligned)` on the `ScrollView`; the behavior snaps to whichever laid-out subview is nearest its alignment, so omitting `scrollTargetLayout()` silently disables snapping.
- Do use `.paging` for full-container pages and `.viewAligned` for carousels; for peeking neighbors, add `safeAreaPadding` or `contentMargins` rather than padding each cell, which would break alignment.
- Do bind state with `scrollPosition(_:anchor:)` and the `ScrollPosition` type (iOS 18+): it both reports the top item and lets you set an id, an edge (`.scrollTo(edge:)`), or a raw point. On iOS 17 use the `scrollPosition(id:)` overload bound to an optional id.
- Don't change content size inside `scrollTransition` — animate `opacity`, `scale`, `blur`, or `offset`/`rotation` via the supplied `phase`, never frame or padding, or layout will thrash.
- Do prefer `contentMargins(_:for:)` over wrapping padding so indicators stay flush to the edge; scope it with the `placement` parameter (`.scrollContent` vs `.scrollIndicators`).
- Don't poll offset in a `GeometryReader`; use `onScrollGeometryChange(for:of:)`, `onScrollPhaseChange`, or `onScrollVisibilityChange` (iOS 18+) for offset, phase, and on-screen reactions.
- Do set `scrollIndicators(.hidden)` deliberately; the default already hides them for trackpad input and shows them for a mouse.

```swift
ScrollView(.horizontal) {
    LazyHStack(spacing: 16) {
        ForEach(cards) { card in
            CardView(card)
                .scrollTransition { content, phase in
                    content
                        .opacity(phase.isIdentity ? 1 : 0.4)
                        .scaleEffect(phase.isIdentity ? 1 : 0.92)
                }
        }
    }
    .scrollTargetLayout()
}
.scrollTargetBehavior(.viewAligned)
.contentMargins(.horizontal, 24, for: .scrollContent)
```

## Platform notes

- iOS/iPadOS 17 introduced the snapping, position, transition, margin, and indicator modifiers; iOS 18 added the `ScrollPosition` value type plus `onScrollGeometryChange`, `onScrollPhaseChange`, and `onScrollVisibilityChange`.
- macOS supports the same modifiers; pointer-driven scrolling means `viewAligned` snapping can feel stiff with a mouse wheel — test both input devices.
- watchOS honors these modifiers but Digital Crown rotation drives scrolling; validate paging against crown detents and keep targets large.
- tvOS scrolling is focus-driven; snapping interacts with focus movement, so verify that focus and the snapped target stay in sync.
- visionOS scrolls in a windowed plane; verify content margins and transitions read well at depth and that effects don't fight the system's hover state.

## Pitfalls

- Forgetting `scrollTargetLayout()` on the lazy container: the `scrollTargetBehavior` compiles and runs but never snaps.
- Adding per-cell padding for a peek effect instead of `contentMargins`/`safeAreaPadding`, which offsets the alignment math and makes snapping land off-center.
- Mutating layout-affecting modifiers inside `scrollTransition`, causing jitter or content-size feedback loops.
- Assuming the `ScrollPosition`-based `scrollPosition(_:anchor:)` works on iOS 17 — that value-type overload is iOS 18+; back-deploy with the id-based overload or `ScrollViewReader`.
- Driving scroll from a `GeometryReader` offset preference key when `onScrollGeometryChange` already delivers offset, container size, and content size without an extra reader.
- Expecting `scrollPosition` to update on every pixel; it tracks the topmost target view's identity, not a continuous offset — use scroll geometry for continuous values.

## References

- **Documentation:** [ScrollTargetBehavior](https://developer.apple.com/documentation/swiftui/scrolltargetbehavior)
- **Documentation:** [ScrollPosition](https://developer.apple.com/documentation/swiftui/scrollposition)
- **Documentation:** [scrollTransition(\_:axis:transition:)](https://developer.apple.com/documentation/swiftui/view/scrolltransition(_:axis:transition:))
- **Documentation:** [scrollPosition(\_:anchor:)](https://developer.apple.com/documentation/swiftui/view/scrollposition(_:anchor:))
- **WWDC:** [Beyond scroll views (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10159/)
- **WWDC:** [What's new in SwiftUI (WWDC24)](https://developer.apple.com/videos/play/wwdc2024/10144/)

## See also

Pair this with a SwiftUI layout skill for `LazyVStack`/`LazyHGrid` sizing inside scroll containers, a SwiftUI list-and-collections skill for `List` scroll position and section behavior, and a SwiftUI animation skill for tuning the `phase`-driven effects used in `scrollTransition`. For programmatic navigation that scrolls a freshly pushed screen, combine with a navigation-stack skill.
