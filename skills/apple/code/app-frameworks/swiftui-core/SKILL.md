---
name: swiftui-core
description: Covers SwiftUI fundamentals including views as value types, the body computed property, view composition and subview extraction, layout containers (VStack, HStack, ZStack, Grid, and lazy stacks), modifier ordering, ViewBuilder, and previews. Use when building or refactoring SwiftUI view hierarchies, deciding when to extract a subview, reasoning about why modifier order changes layout or appearance, choosing between eager and lazy containers, or wiring up Xcode previews. Excludes navigation and state-flow concerns, which belong to dedicated skills.
globs:
  - "**/*.swift"
tags: [swiftui, views, layout, viewbuilder, composition]
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
    - https://developer.apple.com/documentation/swiftui/view
    - https://developer.apple.com/documentation/swiftui/layout-fundamentals
    - https://developer.apple.com/documentation/swiftui/viewbuilder
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for this skill when composing a SwiftUI view hierarchy from scratch, refactoring an oversized `body`, or debugging why a layout or modifier behaves unexpectedly. It applies whenever a developer is deciding how to split a screen into reusable views, picking a layout container, or reasoning about how SwiftUI re-evaluates `body`. It does not cover routing between screens or where mutable state should live; route those questions to the navigation and state-flow skills referenced below.

## Core guidance

- Treat each view as a lightweight, immutable value type. A `View` is a cheap description of UI that SwiftUI creates and discards freely, so avoid expensive work, side effects, or stored caches in `body`; it may run many times.
- Keep `body` declarative and small. When a closure grows past a screenful or a branch becomes reused, extract a named subview or a `@ViewBuilder` computed property rather than a method returning `some View` with heavy generics.
- Extract subviews to isolate invalidation, not merely for tidiness. A standalone view only re-evaluates when its own inputs change, so factoring a frequently updating fragment into its own type narrows what SwiftUI must recompute.
- Choose containers by intent: stacks for a known, small set of children; `Grid` when cells must align across rows and columns and the full content is cheap to realize; `LazyVStack`, `LazyHStack`, and the lazy grids only inside a scrolling context where deferring off-screen children pays off.
- Remember modifiers wrap, not mutate. Each modifier returns a new view enclosing the prior one, so order is significant: padding before a background fills a larger area than padding after it.
- Use `@ViewBuilder` to author containers and conditional content. It is what lets a closure list several children or contain `if`/`switch` without an explicit return or array.
- Drive previews from realistic sample data and add multiple previews (size classes, color schemes, dynamic type) instead of one default; treat previews as a development surface, not shipped UI.

```swift
struct LabeledValue: View {
    let title: String
    let value: String

    var body: some View {
        HStack {
            Text(title)
                .foregroundStyle(.secondary)
            Spacer()
            Text(value)
                .monospacedDigit()
        }
        .padding(.vertical, 4)
    }
}
```

## Platform notes

- Lazy containers earn their keep on memory-constrained targets such as watchOS and when lists are long; for a handful of children an eager `VStack` is simpler and often faster.
- `Grid` and the `Layout` protocol are available across the supported platforms, but verify alignment behavior on macOS and visionOS where window and volume resizing exercise flexible sizing more aggressively than a fixed phone screen.
- The 2026 system materials (Liquid Glass) are applied through standard background and material modifiers; the same wrapping and ordering rules govern how they composite, so a material placed before or after padding changes the glass extent.
- Previews using the current `Preview` macro render with platform-appropriate chrome; confirm a representative device or simulator for each target rather than assuming the default canvas matches production.

## Pitfalls

- Putting mutating logic, network calls, or `print`-based side effects in `body`; SwiftUI may invoke it repeatedly and in any order.
- Over-extracting trivially small fragments, which scatters layout intent and obscures how a screen reads; extract when a piece is reused or independently invalidating.
- Reading too many properties of an observable model high in the hierarchy, which widens invalidation; pass only the values a subview needs.
- Assuming modifier order is cosmetic. Frame, padding, background, clip shape, and gesture modifiers all compose positionally and produce different results when reordered.
- Reaching for a lazy stack outside a scroll view, where its children never get the chance to defer and it only adds overhead.
- Relying on a single default preview, which hides regressions in dark mode, large dynamic type, or compact width.

## See also

For moving between screens and presenting sheets, see `swiftui-navigation`. For where mutable state belongs and how data flows with the Observation framework, see `swiftui-state-flow`. For building bespoke arrangements beyond the stock containers, see `swiftui-custom-layout`. For list and collection performance at scale, see `swiftui-lists-performance`.
