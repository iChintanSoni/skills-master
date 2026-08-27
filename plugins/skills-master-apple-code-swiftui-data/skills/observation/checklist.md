# observation — checklist

- [ ] Model classes are annotated with `@Observable` and declared `final class`; no `ObservableObject` conformance remains.
- [ ] All `@Published` and `objectWillChange` usage has been removed — plain `var` properties are tracked automatically.
- [ ] View-side wrapper matches ownership: `@State` for views that create the instance, `@Bindable` for two-way bindings to a passed-in model, `@Environment(MyModel.self)` for injected instances.
- [ ] Read-only child views take the model as a plain `let` rather than wrapping it unnecessarily.
- [ ] No `@StateObject`/`@ObservedObject`/`@EnvironmentObject` is paired with an `@Observable` type (these break fine-grained tracking or fail to compile).
- [ ] Properties that must NOT drive view updates (caches, back-references, injected services, IDs) are marked `@ObservationIgnored`.
- [ ] Derived state is expressed as computed properties (tracked implicitly via the stored properties they read) instead of stored redundant copies that can drift.
- [ ] Each view's `body` actually reads the properties it expects to refresh on — a missing update usually means the value was read off a stale captured copy.
- [ ] Under Swift 6 strict concurrency, models accessed from views are isolated to the main actor (e.g. `@MainActor`) so reads and mutations stay on the expected actor.
- [ ] Models injected into the environment use `.environment(model)`; consumers use `@Environment(MyModel.self)` and unwrap correctly.
- [ ] Two-way bindings are created with the `$` prefix on a `@Bindable` (or `@State`) value, e.g. `$model.field`.
- [ ] Nested reference models are passed down and read where they are used so each view tracks only the fields it reads.
- [ ] Non-SwiftUI observers use `withObservationTracking(_:onChange:)` (re-registered per change) or an async change stream rather than KVO/Combine.
- [ ] Minimum deployment target supports Observation (iOS 17 / iPadOS 17 / macOS 14 / watchOS 10 / tvOS 17 / visionOS 1).
