---
name: dependency-injection
description: "Guidance on dependency injection in Swift apps: initializer injection, injecting collaborators through the SwiftUI Environment, protocol abstractions for testability, when a lightweight container helps versus when it hurts, and replacing singletons. Use when wiring services into types, making code testable, swapping real implementations for mocks or previews, or untangling global shared state."
---

# Dependency injection

## When to use

Reach for explicit dependency injection (DI) whenever a type talks to something
it does not own: a network client, a database, a clock, an analytics logger, or
another model. Inject those collaborators instead of constructing or fetching
them internally. Do this when you want unit tests to run without the network,
when SwiftUI previews need fake data, when a feature must work against more than
one backend, or when a global singleton has made a type impossible to test in
isolation. DI is simply the discipline of *passing* dependencies in rather than
reaching out for them.

## Core guidance

- **Prefer initializer injection.** Pass dependencies through `init`, store them
  in `let` properties. They become explicit, immutable, and impossible to forget
  — the compiler enforces that every dependency is supplied.
- **Depend on protocols, not concretions.** Type the stored property as a
  protocol (`HTTPClient`) so tests and previews can substitute a stub. Keep the
  protocol narrow — only the methods this caller actually uses.
- **Use the SwiftUI Environment for cross-cutting services**, not for passing
  every model. Define a custom value with the `@Entry` macro and inject it once
  high in the tree; descendants read it with `@Environment`. Reserve initializer
  args for the dependencies a view genuinely owns.
- **Default the easy path, override the hard one.** Give protocol-typed
  parameters a sensible default (`init(client: HTTPClient = URLSessionClient())`)
  so production call sites stay clean while tests pass a fake.
- **Don't reach for a heavyweight container reflexively.** Plain initializers and
  a small composition root cover most apps. A container earns its keep only when
  graphs get deep or wiring is duplicated widely.
- **Replace singletons by injecting them.** Keep a shared instance if you must,
  but pass it through `init` or the Environment rather than calling `.shared`
  inside business logic — that one change restores testability.
- **Build the graph at the edges.** Assemble concrete types in one composition
  root (`App`, scene, or a factory); leave the rest of the code depending only on
  abstractions.

```swift
protocol WeatherService: Sendable {
    func current(for city: String) async throws -> Forecast
}

@Observable @MainActor
final class WeatherModel {
    private let service: WeatherService
    var forecast: Forecast?

    init(service: WeatherService) { self.service = service }

    func load(_ city: String) async {
        forecast = try? await service.current(for: city)
    }
}
```

## Platform notes

- **SwiftUI (all platforms):** Custom Environment values use the `@Entry` macro
  inside an `EnvironmentValues` extension — it generates the key and accessor, so
  no `EnvironmentKey` boilerplate. Provide a default that is safe in previews.
  Use `@Environment(MyService.self)` to read an injected `@Observable` reference
  type, and `@State` at the root to own its lifetime.
- **Swift 6 concurrency:** Mark injected service protocols `Sendable` so they
  cross actor boundaries cleanly. `@MainActor`-isolated models can hold a
  `Sendable` dependency without warnings. Avoid capturing non-`Sendable`
  singletons across tasks.
- **UIKit / AppKit:** Initializer injection works for controllers you create in
  code; for storyboard-instantiated controllers, use property injection right
  after instantiation in the composition root, since `init` is fixed.
- **Testing:** Swift Testing and XCTest both benefit identically — construct the
  system under test with stub conformances. No mocking framework required.

## Pitfalls

- **Hidden singletons defeat DI.** A type that injects nothing but calls
  `Analytics.shared` inside a method is still untestable. The dependency must
  enter through the boundary you control.
- **God containers and registries** that resolve by type string lose
  compile-time safety, hide the graph, and crash at runtime when a registration
  is missing. Prefer explicit wiring you can read.
- **Over-abstracting value types.** Don't hide a plain `struct` model or pure
  function behind a protocol just to inject it — protocols are for *swappable*
  behavior, not everything.
- **Environment as a junk drawer.** Injecting dozens of unrelated services
  through the Environment makes dependencies invisible and ordering fragile. Use
  it for a handful of app-wide services.
- **Missing Environment defaults** crash or misbehave when a value is read in a
  preview or detached view. Always supply a default the harness can rely on.
- **Stateful shared mocks** that leak between tests cause flakiness. Build a
  fresh stub per test.

## References

- **Documentation:** [Environment](https://developer.apple.com/documentation/swiftui/environment)
- **Documentation:** [Entry() macro](https://developer.apple.com/documentation/swiftui/entry())
- **Documentation:** [Managing model data in your app](https://developer.apple.com/documentation/swiftui/managing-model-data-in-your-app)
- **WWDC:** [Discover Observation in SwiftUI (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10149/)
- **WWDC:** [Data Essentials in SwiftUI (WWDC20)](https://developer.apple.com/videos/play/wwdc2020/10040/)

## See also

Pair this with a protocol-design skill when shaping narrow service abstractions,
and with a Swift-Testing or unit-testing skill for constructing stubs and fakes.
For the reference-type models you inject through the Environment, the Observation
and SwiftUI state-management skills cover lifetime and update semantics; a
SwiftUI-previews skill shows how to wire fake dependencies for preview providers.
