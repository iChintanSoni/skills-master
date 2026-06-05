---
name: swift-language-core
description: Practical guidance for everyday Swift language fundamentals in app code — value versus reference types (struct/enum vs class), optionals and optional chaining, let vs var, stored/computed/lazy properties and observers, closures and capture semantics, protocols and extensions, and struct-first design. Use when modeling a new type and choosing struct vs class, taming optionals, deciding where to put behavior with protocol extensions, fixing a closure retain cycle, or reviewing idiomatic Swift in a pull request.
globs:
  - "**/*.swift"
tags: [swift, value-types, optionals, properties, protocols]
x-skills-master:
  domain: apple
  class: lang-tooling
  category: language
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  requires:
    swift: "6.0"
  pairs_with: []
  sources:
    - https://www.swift.org/documentation/articles/value-and-reference-types.html
    - https://docs.swift.org/swift-book/documentation/the-swift-programming-language/protocols/
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for this guidance when modeling a new type and deciding whether it should be a `struct`, `enum`, `class`, or `actor`; when an optional is forcing awkward unwrapping; when behavior could live on a protocol extension instead of a base class; or when a closure is keeping an object alive longer than it should. It also applies during review, to push toward idiomatic, value-first Swift. It is not about concurrency, generics design, or macros — those have their own depth. The aim here is the day-to-day vocabulary of app code: types, optionals, properties, closures, and protocols.

## Core guidance

- Default to a `struct` or `enum`. Value types copy on assignment, so there is no shared mutable state and no aliasing surprises; reach for a `class` only when you genuinely need identity (`===`), inheritance, deinitialization, or a shared mutable instance. Use an `enum` whenever a value is one of a fixed set of cases, and prefer associated values over parallel optionals.
- Prefer `let` over `var` and let the compiler enforce immutability. A method that mutates a struct's stored property must be marked `mutating`; if you find yourself wanting many `mutating` methods on a value type, reconsider whether it should model identity instead.
- Treat optionals as the type-level statement "this may be absent." Unwrap with `if let`, `guard let`, `switch`, or `??`; reserve `!` for genuine programmer-error invariants. Chain with `?.` so a `nil` link short-circuits the whole expression to `nil` rather than crashing.
- Pick the right property kind: a stored property holds a value, a computed property derives one each access (no backing storage), `lazy var` defers expensive setup until first use, and `willSet`/`didSet` observe changes. Don't add a `didSet` to fake a computed property, and remember `lazy` properties are not thread-safe.
- Put shared behavior in protocols with default implementations in extensions, not in a base class. This lets structs and enums share logic too, and composes better than single inheritance. Extend concrete types to add focused, well-named conveniences rather than growing one giant type.
- Mind closure capture. Closures are reference types and capture by reference by default; break `self`-to-closure-to-`self` cycles with `[weak self]` (then unwrap) and use `[unowned self]` only when the closure provably cannot outlive `self`.

```swift
enum Shipment {
    case pending
    case enRoute(carrier: String, eta: Date)
    case delivered(on: Date)
}

struct Order {
    let id: UUID
    var shipment: Shipment = .pending
    var carrier: String? { if case let .enRoute(c, _) = shipment { c } else { nil } }
    mutating func markDelivered(_ date: Date) { shipment = .delivered(on: date) }
}
```

## Platform notes

These fundamentals are pure language and behave identically across iOS, iPadOS, macOS, watchOS, tvOS, and visionOS, and in command-line and server Swift. Under the Swift 6 language mode the same value-versus-reference distinctions also shape data-race safety: value types with `Sendable` members are trivially `Sendable` and cross isolation boundaries freely, whereas a mutable `class` instance is not `Sendable` without manual synchronization — another reason struct-first design pays off. SwiftUI leans hard on value types: `View`, `State` wrappers, and most model data are structs precisely because copy semantics make diffing and updates predictable. Reference-counting cost (and retain-cycle risk) only applies to the reference types — classes, actors, closures — so favoring values also reduces ARC overhead.

## Pitfalls

- Reaching for a `class` by habit when a `struct` would do, then fighting unintended sharing when two references mutate the "same" object.
- Force-unwrapping (`!`) optionals to silence the compiler; this trades a clear compile-time signal for a runtime crash on the first unexpected `nil`.
- Putting expensive or side-effecting work in a computed property's getter — callers assume property access is cheap and may read it repeatedly.
- Expecting `didSet` to fire during initialization (it does not) or when a property is mutated through the same scope's `inout` — observer timing surprises.
- Strong-capturing `self` in a stored closure (a completion handler retained on the instance), creating a retain cycle that leaks the object.
- Overusing protocol extensions with constrained `where` clauses until dispatch becomes hard to predict; a non-`@objc` extension method on the protocol (not a requirement) uses static dispatch, so an override on a conforming type may not be called.

## References

- **Documentation:** [Value and Reference Types](https://www.swift.org/documentation/articles/value-and-reference-types.html)
- **Documentation:** [The Swift Programming Language — Properties](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/properties/)
- **Documentation:** [The Swift Programming Language — Optional Chaining](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/optionalchaining/)
- **Documentation:** [The Swift Programming Language — Closures](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/closures/)
- **Documentation:** [The Swift Programming Language — Protocols](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/protocols/)
- **WWDC:** [Protocol-Oriented Programming in Swift (WWDC15)](https://developer.apple.com/videos/play/wwdc2015/408/)

## See also

For making value and reference types safe to share across tasks, see `swift-concurrency` and its treatment of `Sendable`. For driving SwiftUI views from value-typed models and the observation system, see `observation-observable` and `swiftui-state-management`. For testing the small types and behaviors described here, see `swift-testing`.
