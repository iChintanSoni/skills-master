---
name: choosing-dependency-injection
description: "Decision router for wiring dependencies in a Swift app — initializer injection, the SwiftUI Environment, Observable model ownership, closure and protocol seams for testability, and whether a third-party container is warranted at all. Use when deciding how a new app or module supplies its collaborators, when a team asks which DI framework to adopt, when singletons have made code untestable, or when weighing a container against explicit wiring."
license: MIT
tags: [architecture, testing]
x-skills-master:
  domain: apple
  class: overview
  category: overviews
  platforms: [apple, ios, macos]
  pairs_with: [dependency-injection, swiftui-environment-preferences, swiftui-app-architecture]
  sources:
    - https://developer.apple.com/documentation/swiftui/environment
    - https://developer.apple.com/documentation/swiftui/managing-model-data-in-your-app
    - https://developer.apple.com/documentation/observation
  snapshot_date: "2026-08-25"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for this skill when deciding how an app or module will supply its collaborators — at project start, when a package needs to stay free of app-level wiring, when a team is evaluating a DI library, or when `.shared` singletons have made a type impossible to test. It routes the decision; `dependency-injection` covers the mechanics of each approach.

## Core guidance

Start from a fact that reframes the whole question: **Apple ships no dependency injection container.** There is no first-party equivalent of Hilt or Dagger, no annotation processor, no registry. What the platform gives you is the Swift initializer, the SwiftUI `Environment`, and Observation's model-ownership rules. Every container in the ecosystem is a third-party choice layered on top of those.

That makes "no framework" the default branch rather than the fallback. Move off it only for a named reason.

### The axes that decide it

- **Graph depth** — how many layers sit between where a service is created and where it is used.
- **Repetition** — how many call sites construct the same object with the same arguments.
- **Shape** — whether the consumers are SwiftUI views (which have `Environment`) or plain Swift types (which do not).
- **Swap point** — whether the substitute is chosen at compile time (tests, previews) or at runtime (feature flags, multi-tenant builds).
- **Blast radius** — whether a wiring mistake should be a build error or a runtime crash.

### Routing

1. **Plain initializer injection — the default.** Pass collaborators through `init` and store them in `let`. The compiler proves every dependency is supplied, the graph is readable in one file, and nothing resolves at runtime. This covers most apps outright and is the only correct choice inside a reusable Swift package, which must not take a dependency on the host app's wiring.
2. **A closure seam — when the dependency is one operation.** A stored `() -> Date` or `(URLRequest) async throws -> Data` is lighter than a protocol plus a production conformance plus a stub. Use it for clocks, UUID generation, single-call services, and analytics fire-and-forget.
3. **A protocol — when the dependency is a role.** Once a collaborator has several related methods, more than one real implementation, or a name a domain expert would recognize, a narrow protocol beats a bag of closures. Keep it to the methods this caller actually uses.
4. **A struct of closures ("protocol witness") — when you want a value-typed stub.** Instead of a protocol with class conformances, a `struct` whose properties are closures gives per-test mutation, a `.live` and a `.preview` static instance, and no inheritance. This is the shape most Swift DI libraries formalize; you can adopt the pattern without adopting the library.
5. **The SwiftUI `Environment` — for cross-cutting services read deep in a view tree.** When a service is needed five levels down and threading it through every intermediate view is the real pain, `Environment` is the right tool. The `@Entry` macro generates the key and accessor in modern SwiftUI; `EnvironmentKey` is the longhand that still works when the deployment target predates the macro. Reserve it for a handful of app-wide services, not for every model.
6. **Observable model ownership — for view-facing state.** With `@Observable`, *who owns the model* is the wiring decision. `@State` at the owning view establishes lifetime; `@Environment(Model.self)` reads it further down; an initializer parameter passes a model a child genuinely owns. Getting ownership right is more of the DI story on Apple platforms than any container is.
7. **A third-party container — only with a named justification.** `swift-dependencies`, `Factory`, and `Swinject` are the ones a team is most likely to encounter; they differ substantially in philosophy (compile-time-ish key lookup, property-wrapper registration, and a classic runtime container respectively). None is endorsed here. They earn their keep when many modules each need the same broad set of services, when tests need scoped overrides without rewriting every initializer, or when a team already has the convention and the migration cost outweighs the theoretical purity.

```swift
struct ProfileDependencies: Sendable {
    var now: @Sendable () -> Date = Date.init
    var loadProfile: @Sendable (User.ID) async throws -> Profile
}

@Observable @MainActor
final class ProfileModel {
    private let deps: ProfileDependencies
    init(deps: ProfileDependencies) { self.deps = deps }   // one seam, no container
}
```

### The honest case against a container

A container adds a runtime resolution step to code that had none, moves wiring errors from the build to the app, and puts a third-party dependency on the critical path of every module. On Apple platforms the graph is usually shallow — a network client, a store, a clock, an analytics sink — and a single composition root in the `App` type wires it in twenty lines. If a team cannot articulate which of the three justifications above applies, the answer is initializer injection.

## Platform notes

- **SwiftUI (all platforms):** `Environment` is available everywhere SwiftUI is, so this branch is not iOS-specific. Always supply a default value that is safe in a preview and in a detached view — a missing injection reads the default silently rather than failing loudly.
- **UIKit and AppKit:** initializer injection works for controllers created in code. Storyboard- and XIB-instantiated controllers have a fixed `init`, so inject through properties immediately after instantiation, in the composition root.
- **Swift 6 concurrency:** mark injected service abstractions `Sendable` so they cross actor boundaries, and let `@MainActor` models hold them without warnings. A container that vends non-`Sendable` values from a global becomes a concurrency problem, not just an architecture one.
- **Swift packages:** a local package must expose its dependencies as initializer parameters and let the app supply them. A package that imports a DI library forces that library on every consumer — the same layering mistake as a library depending on an app framework.
- **Previews and tests are two composition roots.** Whatever approach you pick has to make both cheap. If constructing a view for a preview requires standing up a container, the design has failed regardless of which library it uses.

## Pitfalls

- **A service locator wearing a DI costume.** Calling `Container.resolve(Foo.self)` inside a model is the same untestable coupling as `Foo.shared`; the dependency still does not cross a boundary you control.
- **`Environment` as a junk drawer.** Dozens of unrelated services injected through the view tree make dependencies invisible and ordering fragile.
- **Missing `Environment` defaults.** A value read before it is injected quietly uses the placeholder, producing empty screens rather than a clear failure.
- **Recreating an `@Observable` model on every render** by constructing it in a computed property or `body` instead of owning it with `@State`. That is a lifetime bug that looks like a DI bug.
- **Adopting a container before the graph justifies it,** then discovering that the setup, the property wrappers, and the test scoping cost more than the wiring they replaced.
- **Protocolizing everything.** Value types and pure functions do not need a protocol to be testable; abstractions are for genuinely swappable behavior.
- **Choosing a library for its test ergonomics alone** when a `struct` of closures with `.live` and `.preview` statics would have delivered the same ergonomics with no dependency.

## References

- **Documentation:** [Environment](https://developer.apple.com/documentation/swiftui/environment)
- **Documentation:** [Managing model data in your app](https://developer.apple.com/documentation/swiftui/managing-model-data-in-your-app)
- **Documentation:** [Observation](https://developer.apple.com/documentation/observation)
- **Documentation:** [Entry() macro](https://developer.apple.com/documentation/swiftui/entry())
- **WWDC:** [Discover Observation in SwiftUI (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10149/)

## See also

- Implementation depth: `dependency-injection` for initializer, protocol, and Environment mechanics.
- `swiftui-environment-preferences` for custom Environment values and preference propagation.
- `observation` and `swiftui-state-data-flow` for model ownership and lifetime, which decide most view-layer wiring.
- `swiftui-app-architecture` for where the composition root belongs, and `modularization-local-spm` for keeping packages free of app wiring.
- `unit-testing-strategy` and `swift-testing` for the stub and fake construction that any of these approaches must make cheap.
