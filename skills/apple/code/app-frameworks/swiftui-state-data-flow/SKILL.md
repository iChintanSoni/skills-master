---
name: swiftui-state-data-flow
description: Guidance for managing SwiftUI state and data flow with the Observation framework, covering State for view-owned value data and for Observable reference models, Binding, passing Observable models down the view tree, Environment for dependency injection, and Bindable. Use when deciding which property wrapper owns a piece of state, when a child needs to mutate a parent's value, when injecting a shared model across many screens, or when migrating from the legacy StateObject, ObservedObject, and Published trio to Observable.
globs:
  - "**/*.swift"
tags: [swiftui, observation, state, data-flow, bindable]
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
    - https://developer.apple.com/documentation/swiftui/state-and-data-flow
    - https://developer.apple.com/documentation/swiftui/migrating-from-the-observable-object-protocol-to-the-observable-macro
    - https://developer.apple.com/documentation/swiftui/bindable
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

# SwiftUI state and data flow with Observation

## When to use

Reach for this guidance whenever a view needs to decide who owns a piece of state and how that state reaches other views. It applies when introducing a view-local value, when a model object drives several screens, when a child view must write back into a parent's data, and when threading a dependency through deep view hierarchies. It is also the reference point for converting older `ObservableObject` code to the `@Observable` macro.

## Core guidance

- Use `@State` for the single source of truth that a view *owns*. This covers simple value types (a toggle, a text field's string) and, since the Observation framework, reference-type models marked `@Observable`. SwiftUI keeps the storage alive across body re-evaluations either way.
- Pass an `@Observable` model down by handing the plain object to a child's `let` property. SwiftUI tracks only the fields each view actually reads, so a child re-renders just for the properties it touches. There is no need to re-wrap it in another property wrapper to keep observation working.
- Use `@Binding` when a child must mutate value-type state that a parent owns. Derive it from the parent with the `$` projection, never copy the value down and hope it syncs.
- Use `@Bindable` to get two-way bindings into the *mutable properties* of an `@Observable` model, for example wiring a `TextField` to `model.name`. The model is already a reference, so `@Bindable` is about producing bindings, not about ownership or lifetime.
- Use `@Environment` for dependency injection across many views. Inject a shared `@Observable` model with the `.environment(_:)` modifier and read it back by type; reserve this for genuinely cross-cutting state rather than passing a model only one level down.
- Prefer the modern set over the legacy `@StateObject` / `@ObservedObject` / `@Published` trio. Mark model types `@Observable`, drop `@Published` annotations, and replace `@StateObject` with `@State`, `@ObservedObject` with a plain property, and `@EnvironmentObject` with `@Environment`.

```swift
@Observable final class Counter {
    var value = 0
}

struct CounterScreen: View {
    @State private var counter = Counter()   // owns the model

    var body: some View {
        StepperRow(counter: counter)         // pass the object directly
    }
}

struct StepperRow: View {
    @Bindable var counter: Counter           // bindings into a reference model

    var body: some View {
        Stepper("Count: \(counter.value)", value: $counter.value)
    }
}
```

## Platform notes

- The Observation framework and `@Observable` require iOS 17, iPadOS 17, macOS 14, watchOS 10, tvOS 17, and visionOS 1 or later. Code targeting earlier systems still needs the `ObservableObject` protocol.
- Behavior is consistent across platforms; the same model and wrappers serve a watchOS complication-backed view, a macOS window, and a visionOS volume. Differences are about presentation surfaces, not data flow.
- Under Swift 6 strict concurrency, an `@Observable` model used from the UI is typically `@MainActor`-isolated. Keep mutation on the main actor and hop to background actors only for work that produces values to assign back.

## Pitfalls

- Do not store an `@Observable` model in `@StateObject` or annotate its properties with `@Published`; those belong to the old protocol and produce redundant or conflicting tracking.
- Avoid `@Bindable` when no binding is needed. If a view only reads a model, take it as a plain `let`; adding `@Bindable` implies a write path that does not exist.
- Do not recreate a model inside `body` or in a computed property. Initialize it once in `@State` so its identity and lifetime survive re-renders.
- Reading an `@Environment` value that was never injected yields a default-constructed or empty instance and silent bugs. Inject at a common ancestor and confirm the type matches.
- Computed properties on an `@Observable` model are tracked only through the stored properties they read; a property derived from external, non-observed state will not trigger updates.

## References

- **Documentation:** [Model data](https://developer.apple.com/documentation/swiftui/model-data)
- **Documentation:** [Managing model data in your app](https://developer.apple.com/documentation/swiftui/managing-model-data-in-your-app)
- **WWDC:** [Discover Observation in SwiftUI (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10149/)

## See also

See `observation` for the framework's tracking model, macro expansion, and how change notifications are delivered. See `swiftui-core` for the broader view lifecycle, identity, and body re-evaluation rules that determine when these wrappers actually cause a redraw. For routing models between destinations, see `swiftui-navigation`.
