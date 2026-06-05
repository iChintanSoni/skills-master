---
name: property-wrappers
description: "Guidance on authoring and using Swift property wrappers: @propertyWrapper, wrappedValue, projectedValue via $, initialization, composition, and how SwiftUI's @State/@Binding/@Environment relate to the @Observable macro. Use when writing a custom @propertyWrapper, debugging $-projection or init order, deciding wrapper vs macro, or migrating ObservableObject models to @Observable."
globs:
  - "**/*.swift"
tags: [swift, property-wrappers, macros, swiftui, observation]
x-skills-master:
  domain: apple
  class: lang-tooling
  category: language
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  requires:
    swift: "6.0"
  pairs_with: []
  sources:
    - https://docs.swift.org/swift-book/documentation/the-swift-programming-language/properties/
    - https://developer.apple.com/documentation/Observation
    - https://developer.apple.com/documentation/observation/observable()
    - https://developer.apple.com/documentation/SwiftUI/Migrating-from-the-observable-object-protocol-to-the-observable-macro
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for this skill when you author a `@propertyWrapper` to factor out repeated get/set logic (validation, clamping, persistence, thread confinement), when `$`-projection or wrapper initialization order surprises you, or when you must decide between a hand-written wrapper and a compiler macro. It also covers how SwiftUI's built-in wrappers (`@State`, `@Binding`, `@Environment`) sit alongside the `@Observable` macro so you keep view state and model observation in the right tools.

## Core guidance

- A property wrapper is a type annotated `@propertyWrapper` with a stored or computed `wrappedValue`. The annotated property is rewritten by the compiler into a hidden `_name` instance plus an accessor that reads/writes `wrappedValue`.
- Expose an auxiliary API through `projectedValue`; callers reach it with the `$` prefix. Return whatever is useful — a `Binding`, a publisher, the wrapper itself — not necessarily the same type as `wrappedValue`.
- Control initialization with `init(wrappedValue:)`, `init()`, or extra labeled arguments. `@Clamped(0...10) var x = 3` calls `init(wrappedValue:_:)`; mismatched signatures cause confusing "missing argument" errors, so provide the inits your call sites need.
- Don't reach for a wrapper when behavior is a one-off — a computed property or `didSet` is simpler. Don't store reference semantics in a wrapper applied to a `struct` expecting value copies; the underlying instance is shared.
- Compose wrappers by nesting (`@A @B var v`), but only when each wrapper's `wrappedValue` is itself a valid wrapped type for the next; order matters and the outermost wraps the result of the inner.
- In SwiftUI, `@State` owns local, view-private state (including an `@Observable` model instance); `@Binding` borrows a two-way reference; `@Environment` reads injected dependencies. These remain wrappers.
- `@Observable` is a macro, not a wrapper: it rewrites a `class` so per-property reads are tracked automatically — no `@Published`, no `ObservableObject`. Prefer it for shared model objects; keep `@State` for ownership and ephemeral UI state.

```swift
@propertyWrapper
struct Clamped<Value: Comparable> {
    private var value: Value
    private let range: ClosedRange<Value>

    init(wrappedValue: Value, _ range: ClosedRange<Value>) {
        self.range = range
        self.value = min(max(wrappedValue, range.lowerBound), range.upperBound)
    }

    var wrappedValue: Value {
        get { value }
        set { value = min(max(newValue, range.lowerBound), range.upperBound) }
    }
    var projectedValue: ClosedRange<Value> { range }   // accessed via $volume
}

struct Mixer { @Clamped(0...11) var volume = 5 }       // $volume == 0...11
```

## Platform notes

- Wrapper vs macro: a property wrapper transforms one property's storage and access; a macro can generate members, conformances, and code across a whole type. Use a wrapper for reusable per-property behavior; use a macro (like `@Observable`) when you need synthesized members or cross-property tracking. They are not interchangeable.
- `@Observable` requires the Observation framework (iOS 17 / macOS 14 and later, and all 26-cycle OSes). On older deployment targets you still write `ObservableObject` + `@StateObject`/`@ObservedObject`. The migration guide maps `@StateObject` → `@State`, drops `@Published`, and keeps `@Binding`/`@Environment`.
- Wrappers on `actor`-isolated or `Sendable` types must respect Swift 6 concurrency: a wrapper holding mutable reference state is not automatically `Sendable`. Mark storage appropriately or confine it to an actor.

## Pitfalls

- Forgetting that `$value` is the *projected* value, not the wrapper instance. The wrapper itself is `_value`; only `projectedValue` is surfaced by `$`.
- Property wrappers can't be applied to `lazy`, `weak`, `unowned`, or computed properties, nor (with restrictions) to top-level/local variables before Swift relaxed some cases — verify for your target.
- Mixing `@State` with a `class` that isn't `@Observable`: changes won't trigger view updates. Either adopt `@Observable` or use `@StateObject` with `ObservableObject`.
- Over-nesting wrappers obscures init resolution; the synthesized `init(wrappedValue:)` chain is easy to get wrong. Keep composition shallow.
- Assuming `projectedValue` must mirror `wrappedValue`'s type — it is independent, and shipping the wrong projection (e.g., returning the value instead of a `Binding`) breaks call sites silently.

## References

- **Documentation:** [Properties — Property Wrappers (The Swift Programming Language)](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/properties/)
- **Documentation:** [Observation framework](https://developer.apple.com/documentation/Observation)
- **Documentation:** [Observable() macro](https://developer.apple.com/documentation/observation/observable())
- **Documentation:** [Migrating from the Observable Object protocol to the Observable macro](https://developer.apple.com/documentation/SwiftUI/Migrating-from-the-observable-object-protocol-to-the-observable-macro)
- **WWDC:** [Discover Observation in SwiftUI (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10149/)

## See also

For choosing where state lives in a view tree and wiring `@Binding`/`@Environment`, see the SwiftUI state-management and data-flow skills. For the broader macro authoring story (attached vs freestanding macros, expansion), see the Swift macros skill, which complements the wrapper-vs-macro decision covered here.
