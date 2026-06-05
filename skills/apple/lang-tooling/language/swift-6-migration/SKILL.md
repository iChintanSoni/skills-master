---
name: swift-6-migration
description: "Guides migrating a codebase to the Swift 6 language mode: enabling it per target, resolving strict data-race checking, making types Sendable, applying actor and @MainActor isolation, and fixing global state. Use when turning on complete concurrency checking, adopting Swift 6 mode, fixing Sendable or actor-isolation compiler errors, or planning an incremental module-by-module migration."
globs:
  - "**/*.swift"
tags: [swift6, concurrency, sendable, actors, migration]
x-skills-master:
  domain: apple
  class: lang-tooling
  category: language
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  requires:
    swift: "6.0"
  pairs_with: []
  sources:
    - https://www.swift.org/migration/documentation/swift-6-concurrency-migration-guide/migrationstrategy/
    - https://developer.apple.com/documentation/swift/adoptingswift6
    - https://developer.apple.com/documentation/Swift/updating-an-app-to-use-strict-concurrency
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

# Swift 6 migration

## When to use

Reach for this when you are turning on the Swift 6 language mode and the
compiler starts reporting data-race diagnostics: non-`Sendable` values crossing
isolation boundaries, mutable global or static state flagged as unsafe, or
protocol conformances that clash with actor isolation. It also applies when you
are sequencing the work across a multi-module app and want a low-risk order of
operations. For UI-layer concurrency questions, see swiftui-concurrency instead.

## Core guidance

- **Do** migrate one target at a time. Switch a leaf module (few dependencies)
  to complete checking first, fix it, then move up the dependency graph.
- **Do** stage the change: set strict-concurrency checking to `complete` while
  still in Swift 5 mode so diagnostics arrive as *warnings*, clear them, then
  flip the language version to 6 to make them errors.
- **Do** fix unsafe global state at the root cause — prefer `let`, isolate to
  `@MainActor`, or wrap in an actor. Reserve `nonisolated(unsafe)` for values
  you already protect with an external lock, and comment why.
- **Don't** scatter `@preconcurrency import` or `@unchecked Sendable` to silence
  errors. They suppress checking; treat each as a tracked TODO, not a fix.
- **Do** make a reference type `Sendable` only when it is immutable (all stored
  properties `let` and themselves `Sendable`) or guards its own state.
- **Do** push isolation to the boundary: annotate a whole type or protocol with
  a global actor rather than dusting `@MainActor` over individual members.
- **Don't** capture `self` or non-`Sendable` values in a `Task` from a `deinit`;
  copy out the isolated values you need first.

## Platform notes

Swift 6.2 (Xcode 26) adds *approachable concurrency*: per-module default actor
isolation (SE-0466). New app targets default to `MainActor` isolation, so most
code stays single-threaded until you opt a member out with `nonisolated`. This
collapses many false-positive diagnostics for UI-centric modules — enable it for
your app module and leave library modules `nonisolated` by default. Xcode 26
also ships a migration assistant that applies isolation annotations for you.
All these settings are per target, so platforms and module kinds can adopt at
different speeds.

```swift
// Before: flagged "not concurrency-safe because it is non-isolated
// global shared mutable state"
var sharedCache: [String: Image] = [:]

// After: confine the mutable state to an isolation domain
@MainActor var sharedCache: [String: Image] = [:]
// or, for cross-actor access, model it as an actor:
actor ImageCache { private var storage: [String: Image] = [:] }
```

## Pitfalls

- Reaching for `@unchecked Sendable` to make an error disappear. You have
  promised thread safety the compiler can no longer verify; an unguarded
  mutable property is now a silent data race.
- Annotating a protocol requirement `nonisolated` while the conformer is
  `@MainActor` — the conformance fails. Decide isolation at the protocol level,
  or make the requirement `async`.
- Enabling Swift 6 mode repo-wide in one commit. The error count explodes and
  reviews stall; go module by module on a branch.
- Assuming a dependency is `Sendable`. A pre-Swift-6 package may need a
  `@preconcurrency import` until it migrates — track it, don't forget it.
- Treating `nonisolated(unsafe)` as equivalent to safe. It only mutes the
  diagnostic; correctness is entirely on you.

## References

- **Documentation:** [Migration strategy (Swift.org migration guide)](https://www.swift.org/migration/documentation/swift-6-concurrency-migration-guide/migrationstrategy/)
- **Documentation:** [Adopting strict concurrency in Swift 6 apps](https://developer.apple.com/documentation/swift/adoptingswift6)
- **Documentation:** [Updating an app to use strict concurrency](https://developer.apple.com/documentation/Swift/updating-an-app-to-use-strict-concurrency)
- **Documentation:** [Control default actor isolation (SE-0466)](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0466-control-default-actor-isolation.md)
- **WWDC:** [Migrate your app to Swift 6 (WWDC24)](https://developer.apple.com/videos/play/wwdc2024/10169/)
- **WWDC:** [Embracing Swift concurrency (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/268/)

## See also

Pair this with swiftui-concurrency for view-layer isolation and `@MainActor`
view models, and with swift-concurrency-fundamentals for the actor and async/await
model the migration depends on. When a stubborn dependency blocks a module, the
sendable-and-isolation skill covers `@preconcurrency` and `sending` in depth.
