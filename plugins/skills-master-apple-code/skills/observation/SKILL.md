---
name: observation
description: Guidance on the Observation framework and the Observable macro for SwiftUI reference-type models, including fine-grained per-property view updates, ObservationIgnored, and migration away from ObservableObject. Use when defining a view model or shared model class, choosing between Observable and ObservableObject, deciding which view property wrapper to use, marking properties as non-tracked, or migrating existing Published code to the Observable macro.
---

## When to use

Use this skill when modeling shared, mutable app state in a reference type that SwiftUI views observe. It applies when authoring a view model or domain model class, deciding between the Observable macro and the older ObservableObject protocol, selecting the right view-side property wrapper, suppressing tracking on a stored property, or migrating Published-based code. It does not cover value-type view-local state, which belongs in plain State.

## Core guidance

- Annotate model classes with the Observable macro and drop Published entirely. Plain stored variables become observable automatically, so the model reads like an ordinary class. Prefer `final class` to keep dispatch cheap.
- Rely on access tracking, not declarations. A view re-renders only for the specific properties whose values it actually reads in `body`. Reading one field of a large model does not subscribe the view to unrelated fields, which removes most manual update tuning.
- Match the view-side wrapper to ownership: `@State` when the view creates and owns the instance, `@Bindable` when the view needs two-way bindings to a passed-in model, and `@Environment(MyModel.self)` for instances injected via `environment(_:)`. A child that only reads can take the model as a plain `let` and still receive updates.
- Mark stored properties that must not drive updates with `@ObservationIgnored` — caches, back-references, injected services, or values mutated off the tracked path. The macro emits no runtime cost for ignored properties.
- Keep computed properties tracked implicitly: they observe whichever stored properties they read, so derived state stays correct without extra annotation. Avoid storing redundant copies that can drift.

```swift
@Observable
final class Cart {
    var items: [Item] = []
    @ObservationIgnored var analytics: Analytics?
    var total: Decimal { items.reduce(0) { $0 + $1.price } }
}

struct CartView: View {
    @State private var cart = Cart()
    var body: some View { Text(cart.total, format: .currency(code: "USD")) }
}
```

## Platform notes

- Available from iOS 17, iPadOS 17, macOS 14, watchOS 10, tvOS 17, and on visionOS from its first release; the same macro and wrappers behave identically across all of them.
- Observation integrates with concurrency via `withObservationTracking(_:onChange:)` and async change sequences, letting non-SwiftUI code react to mutations without protocol conformance.
- Under Swift 6 strict concurrency, an Observable model accessed from views is typically isolated to the main actor; annotate it accordingly so mutations and reads stay on the expected actor.

## Pitfalls

- Mutating a property no view currently reads produces no update — by design. If a refresh seems missing, confirm the view's `body` actually reads that property rather than a stale copy captured elsewhere.
- Do not mix the new wrappers with the old ones for the same type. Using StateObject or ObservedObject with an Observable model fails to compile or loses fine-grained tracking; use State, Bindable, and Environment instead.
- Nested reference models are observed through the property that holds them, but a view only tracks the fields it reads on the nested instance; passing the nested object down and reading it there keeps updates precise.
- Collections of value types update when the array property changes; mutating elements in place still notifies because the stored array itself is observed.
- Marking a property ObservationIgnored and then expecting view updates from it is a common mistake — such changes are invisible to SwiftUI.

## See also

See `swiftui-state-data-flow` for choosing among State, Binding, and the environment, and how value-type and reference-type state compose in a view hierarchy.
