---
name: swift-generics-protocols
description: Guidance for protocol-oriented and generic Swift, covering generic functions and types, associated types with where clauses, protocol composition, primary associated types, and choosing between opaque results (some) and existentials (any) by their performance and type-identity tradeoffs. Use when designing a protocol or generic API, deciding between some, any, or a generic parameter, constraining associated types, fixing protocol-as-type or associated-type errors, or replacing hand-written type erasure.
---

## When to use

Reach for this guidance when you are shaping an API around a protocol or a generic, and need to decide how callers refer to abstract types. It applies when picking between a generic parameter, an opaque `some` return, and a boxed `any` value; when a protocol with associated types triggers "can only be used as a generic constraint" errors; when constraining associated types with `where` clauses or primary associated types; and when you are tempted to write a manual `AnyFoo` wrapper. It is less relevant for concrete, non-abstracted code where a single type already does the job — generics there add ceremony without payoff.

## Core guidance

- Start concrete, abstract only when a second caller or type appears. Reach for a generic parameter `<T: P>` when the caller picks the type and you want full static typing and specialization; reach for `some P` when *you* pick and hide the return type; reach for `any P` only when the type must vary at runtime, such as a heterogeneous array.
- Prefer `some` over `any` for parameters and returns. `some P` is an opaque type with a single fixed underlying type per call site, so the compiler keeps full type information, can specialize, and dispatches statically with near-zero overhead. `func make() -> some Shape` lets you change the concrete return without breaking callers.
- Treat `any P` as a deliberate cost. An existential boxes the value (small payloads fit a 3-word inline buffer; larger ones heap-allocate) and dispatches through a witness table. It also erases identity: you cannot use `any Equatable` where a same-type relationship is required.
- Constrain associated types with primary associated types instead of free-standing `where` clauses where you can: declare `protocol Container<Item>` and then write `some Container<Int>` or `any Container<Int>`. This was the chief reason hand-written type erasure largely disappeared.
- Compose, do not inherit. Combine capabilities with `P & Q` (and a class bound like `AnyObject & P`) rather than fattening one protocol. Use `where` clauses to relate associated types: `func merge<C: Collection>(_:_:) where C.Element: Equatable`.
- Don't over-generify. If a function has one caller and one type, a plain concrete signature is clearer. Avoid `any` in hot paths and tight loops; reserve it for genuinely heterogeneous storage.

```swift
protocol Cache<Value> {
    associatedtype Value
    func value(for key: String) -> Value?
}

// Hides the concrete cache type; callers keep full static typing.
func makeImageCache() -> some Cache<Image> { MemoryCache() }

// Heterogeneous storage genuinely needs an existential.
var registry: [String: any Cache<Data>] = [:]
```

## Platform notes

These are language features, so they behave identically across iOS, macOS, watchOS, tvOS, visionOS, and on Linux/Windows with the open-source toolchain; the platform only affects which SDK protocols you adopt. Primary associated types (`some Collection<Int>`) and lightweight same-type constraints landed in Swift 5.7 and are the standard idiom in Swift 6. Variadic generics via parameter packs (`each T`) let one generic abstract over an arbitrary number of type parameters, replacing the old overload-per-arity boilerplate. Under Swift 6 language mode the compiler may require an explicit `any` keyword where a bare protocol name was previously accepted as a type, surfacing the existential cost at the point you opt into it. Many SwiftUI and standard-library APIs already vend `some View`, `some Collection`, and similar opaque types, so adopting `some` in your own surface keeps your code consistent with the frameworks.

## Pitfalls

- Returning `any P` from a factory when every call site yields one fixed type — you pay boxing and lose specialization for nothing; use `some P`.
- Trying to store a protocol-with-associated-types in a property or array without `any` (or without a primary associated type to pin it), then fighting "protocol can only be used as a generic constraint" errors.
- Assuming `some P` lets the underlying type vary per call: a single function returning `some P` must return the *same* concrete type on every path; branches returning different types need `any P` or a generic.
- Comparing or relating two `any P` values that rely on a `Self` or same-type requirement — existentials erase identity, so the operation won't type-check; thread a generic `<T: P>` through instead.
- Adding a manual `AnyFoo` type eraser out of habit when a primary associated type plus `any Foo<…>` already expresses the same thing.
- Over-constraining with deep `where` chains that read worse than splitting the protocol or using composition; complexity should buy real reuse.

## References

- **Documentation:** [Generics](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/generics/)
- **Documentation:** [Opaque and Boxed Protocol Types](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/opaquetypes/)
- **Documentation:** [Protocols](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/protocols/)
- **WWDC:** [Embrace Swift generics (WWDC22)](https://developer.apple.com/videos/play/wwdc2022/110352/)
- **WWDC:** [Design protocol interfaces in Swift (WWDC22)](https://developer.apple.com/videos/play/wwdc2022/110353/)
- **WWDC:** [Generalize APIs with parameter packs (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10168/)

## See also

For concurrency constraints like `Sendable` and actor isolation that often appear alongside generic bounds, see `swift-concurrency`. For observable model types that conform to framework protocols, see `observation-observable`. For exercising generic and protocol-based code with parameterized tests, see `swift-testing`. For package boundaries where `some`/`any` choices affect your public API surface, see `spm`.
