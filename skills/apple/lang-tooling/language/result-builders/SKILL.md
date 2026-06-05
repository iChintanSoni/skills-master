---
name: result-builders
description: "Guidance for designing and using Swift result builders: the @resultBuilder attribute, the buildBlock/buildOptional/buildEither/buildArray transform methods, buildExpression/buildFinalResult/buildLimitedAvailability, and buildPartialBlock for avoiding overload explosion. Use when authoring a declarative DSL, understanding how SwiftUI ViewBuilder or RegexBuilder work, deciding which build methods to implement, or debugging confusing result-builder type errors and missing control-flow support."
globs:
  - "**/*.swift"
tags: [swift, result-builder, dsl, swiftui, metaprogramming]
x-skills-master:
  domain: apple
  class: lang-tooling
  category: language
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  requires:
    swift: "6.0"
  pairs_with: []
  sources:
    - https://docs.swift.org/swift-book/documentation/the-swift-programming-language/advancedoperators/#Result-Builders
    - https://developer.apple.com/documentation/swiftui/viewbuilder
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for this guidance when you want to read or write an embedded DSL in Swift, where a block of statements is rewritten by the compiler into a single composed value. That covers consuming `@ViewBuilder` closures in SwiftUI, building patterns with `RegexBuilder`, and authoring your own builder for HTML, layout, validation rules, or test fixtures. It also applies when a builder rejects a `for` loop or `if`/`switch`, when error messages point at a `buildBlock` overload you never wrote, or when you are deciding the minimum set of transform methods a new builder needs. It is overkill for a value you can express with a plain array literal or a chained initializer.

## Core guidance

- Start minimal. A type annotated `@resultBuilder` only needs one `static func buildBlock(_ components: Component...) -> Component`. Add control-flow methods on demand rather than implementing the whole protocol up front.
- Map each method to the syntax it unlocks: `buildOptional` enables `if` without `else`; `buildEither(first:)` and `buildEither(second:)` enable `if`/`else` and `switch`; `buildArray` enables `for` loops. If a loop or branch fails to compile, the matching method is simply missing.
- Use `buildExpression` to convert leaf expressions into the builder's internal `Component` currency type, and overload it to accept several input types ergonomically. Keep the public element type and the internal accumulation type distinct, then collapse with `buildFinalResult`.
- Prefer `buildPartialBlock(first:)` plus `buildPartialBlock(accumulated:next:)` over many `buildBlock` arities when components carry type parameters. It folds a block one line at a time, which is exactly how `RegexBuilder` avoids a factorial explosion of `buildBlock` overloads for capture arity.
- Add `buildLimitedAvailability` when blocks may contain `if #available`; it erases the branch-specific type so the surrounding block stays well typed.
- Don't smuggle real control flow through a builder. Side effects, early `return`, `throw`, and `guard` are not part of the transform; build the data declaratively, then interpret it in ordinary code.

```swift
@resultBuilder
enum CommandLine {
    static func buildBlock(_ parts: String...) -> [String] { parts }
    static func buildExpression(_ flag: String) -> String { flag }
    static func buildOptional(_ part: [String]?) -> [String] { part ?? [] }
    static func buildEither(first part: [String]) -> [String] { part }
    static func buildEither(second part: [String]) -> [String] { part }
    static func buildArray(_ parts: [[String]]) -> [String] { parts.flatMap { $0 } }
}

func args(verbose: Bool, @CommandLine _ build: () -> [String]) -> [String] { build() }
```

## Platform notes

Result builders are a pure language feature (SE-0289, with `buildPartialBlock` added by SE-0348 in Swift 5.7), so they behave identically across every Apple platform and on Linux and Windows toolchains; nothing here depends on a framework or OS version. What differs is which builders ship in the SDKs you import: `@ViewBuilder` and the scene/commands/toolbar builders come with SwiftUI, and `RegexBuilder` is a standalone standard-library module. Foundation's `#Predicate` and `#Expression` read like DSLs but are macros over closures, not result builders, so the build-method vocabulary in this skill does not apply to them. Under Swift 6 language mode the usual `Sendable` and isolation rules apply to a builder's component and final types; a `@MainActor`-isolated builder closure (as SwiftUI uses) keeps its body on the main actor.

## Pitfalls

- Expecting `for`, `if`-`else`, or `switch` to work before adding `buildArray` or `buildEither`. The diagnostic often surfaces as a vague "closure containing control flow" or missing-method error rather than naming the gap directly.
- Implementing `buildBlock` with a fixed arity and then hitting "extra argument" once a block grows; switch to variadic `buildBlock` or to `buildPartialBlock` for generic components.
- Confusing `buildExpression` (per leaf, lifts into `Component`) with `buildBlock` (per block, combines components). Skipping `buildExpression` forces every leaf to already be a `Component`.
- Relying on side effects or `print` inside a builder body to debug; statements are reordered and wrapped by the transform, so behavior will not match top-to-bottom reading.
- Treating `#Predicate` or `#Expression` as result builders and reaching for `buildOptional` and friends, which do not exist there.
- Over-overloading `buildExpression`, which can blow up type-checking time and produce ambiguous-overload errors; keep the input types few and unambiguous.

## Open question

When components are generic over captured type parameters, you can model a block either as nested `buildPartialBlock` folds that thread an accumulated tuple type, or as a wide family of fixed-arity `buildBlock` overloads. `buildPartialBlock` scales linearly in declarations and is what the standard library chose for `RegexBuilder`, but it produces deeply nested types that can lengthen compile times and worsen error messages; explicit `buildBlock` overloads cap nesting and give cleaner diagnostics at the cost of a combinatorial number of declarations and a hard upper bound on block size. There is no single right answer: weigh expected block width, capture-arity needs, and your tolerance for compile-time cost.

## References

- **Documentation:** [Result Builders (The Swift Programming Language)](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/advancedoperators/#Result-Builders)
- **Documentation:** [ViewBuilder](https://developer.apple.com/documentation/swiftui/viewbuilder)
- **Documentation:** [RegexBuilder](https://developer.apple.com/documentation/regexbuilder)
- **Documentation:** [Result builder methods diagnostics](https://docs.swift.org/compiler/documentation/diagnostics/result-builder-methods/)
- **Documentation:** [SE-0289: Result builders](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0289-result-builders.md)
- **Documentation:** [SE-0348: buildPartialBlock for result builders](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0348-buildpartialblock.md)

## See also

For the most common consumer of result builders, see `swiftui-view-composition` and the view-layout skills that pass `@ViewBuilder` closures. For pattern DSLs built the same way, see the Swift string-processing and `RegexBuilder` material. When a builder's components must cross isolation boundaries under Swift 6, pair this with `swift-concurrency`. If you are tempted to reach for macros instead, compare with `swift-macros` to decide whether a result builder or an expression macro fits the DSL you are designing.
