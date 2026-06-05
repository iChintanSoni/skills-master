# swiftui-state-data-flow — checklist

- [ ] Confirm the deployment target is iOS 17 / iPadOS 17 / macOS 14 / watchOS 10 / tvOS 17 / visionOS 1 or later before relying on `@Observable`; older targets still need `ObservableObject`.
- [ ] Mark every UI-driving model type with `@Observable` and remove all `@Published` annotations from its stored properties.
- [ ] Own each model with `@State private var model = Model()` — never `@StateObject` for an `@Observable` type.
- [ ] Pass an `@Observable` model into a child as a plain `let` (or `var`); do not re-wrap it in another property wrapper just to keep tracking working.
- [ ] Use `@Binding` only for value-type state a parent owns; derive it with the `$` projection instead of copying the value down.
- [ ] Add `@Bindable` only when you actually need two-way bindings into a reference model's mutable properties (e.g. `$model.name`); a read-only view takes a plain `let`.
- [ ] Inject genuinely cross-cutting models with `.environment(_:)` and read them back by type via `@Environment`; don't use Environment to pass a model one level down.
- [ ] Verify every `@Environment(Type.self)`-read model is injected at a common ancestor — an un-injected read silently yields a default/empty instance.
- [ ] Initialize models once in `@State`; never construct a model inside `body` or a computed property where it would be recreated each re-render.
- [ ] Replace legacy wrappers during migration: `@StateObject` → `@State`, `@ObservedObject` → plain property, `@EnvironmentObject` → `@Environment`.
- [ ] Ensure computed properties on a model derive only from its stored (observed) properties, so changes actually propagate to dependent views.
- [ ] Under Swift 6 strict concurrency, keep model mutation on `@MainActor`; hop to background actors only to compute values you assign back on the main actor.
- [ ] Use `@State` defaults for the optional binding shorthand (e.g. `Binding($optional)`) and confirm the binding's lifetime matches the parent's ownership.
- [ ] Build with strict concurrency checking enabled and confirm no data-race or actor-isolation warnings around model access.
