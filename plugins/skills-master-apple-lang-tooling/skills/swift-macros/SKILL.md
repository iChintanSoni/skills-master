---
name: swift-macros
description: "Guidance for authoring and adopting Swift macros, covering freestanding (#) versus attached (@) macro roles, what each expands to, building a macro plugin with SwiftSyntax and the SwiftPM macro target, testing expansions, and choosing a macro over a function or protocol. Use when writing a custom macro, deciding whether a macro is the right tool, debugging an expansion, wiring up a macro package, or understanding how @Observable and #Preview generate code."
---

## When to use

Reach for this guidance when you need to generate code at compile time that the type system can check, and the same shape repeats across many declarations: synthesized members, boilerplate conformances, repetitive accessors, or a literal that should capture its own source text. It applies when authoring a macro, deciding whether one is justified, fixing a confusing expansion, or reading what library macros like `@Observable`, `@Model`, or `#Preview` produce. It is the wrong tool when a function, generic, or protocol extension would do the job at runtime, or when a one-off code generator (a build phase script) is simpler than a versioned SwiftSyntax plugin.

## Core guidance

- Pick the role by what it produces. Freestanding macros are invoked with `#name(...)`: `@freestanding(expression)` returns a value in place, `@freestanding(declaration)` emits new declarations. Attached macros use `@Name` and play one or more roles — `peer`, `member`, `accessor`, `memberAttribute`, and `extension` (which adds conformances and members in an extension).
- Declare and implement in separate modules. The `macro` declaration lives in your library and points at a type with `#externalMacro(module:type:)`; the implementation lives in a `.macro` plugin target that conforms to a SwiftSyntax protocol such as `ExpressionMacro` or `MemberMacro`. The compiler runs the plugin out of process and splices the returned syntax back in.
- Treat expansion as a pure syntax-to-syntax transform. You receive the attached/invoked node, inspect it with SwiftSyntax, and return new `SyntaxNodeString`/`DeclSyntax` — you cannot read other files, hit the network, or see resolved types, only the source text as written.
- Prefer a function, generic, or protocol first. Choose a macro only when you genuinely need to add declarations, attach attributes, or capture source text — things runtime code cannot do. A macro that merely wraps a call adds a build dependency and toolchain coupling for little gain.
- Pin SwiftSyntax to the major version matching your toolchain (for example `602.x` for Swift 6.2) so the parser tree matches the compiler. Mismatches cause cryptic plugin failures.
- Emit diagnostics, never `fatalError`. Surface bad usage with `context.diagnose(...)` and offer fix-its where you can; that is the difference between a friendly macro and a frustrating one.
- Avoid expanding to names the user wrote. Generate helper symbols with `context.makeUniqueName(_:)` to stay hygienic and prevent collisions.

```swift
// Library: the declaration users import and call.
@freestanding(expression)
public macro stringify<T>(_ value: T) -> (T, String) =
    #externalMacro(module: "MyMacrosPlugin", type: "StringifyMacro")

// Plugin target (depends on SwiftSyntax): the implementation.
public struct StringifyMacro: ExpressionMacro {
    public static func expansion(
        of node: some FreestandingMacroExpansionSyntax,
        in context: some MacroExpansionContext
    ) -> ExprSyntax {
        guard let arg = node.arguments.first?.expression else {
            fatalError("compiler enforces a single argument")
        }
        return "(\(arg), \(literal: arg.description))"
    }
}
```

## Platform notes

Macros require Swift 5.9+ and are fully supported under Swift 6 language mode; they expand at compile time, so they impose no runtime or deployment-target cost and work identically across iOS, macOS, watchOS, tvOS, and visionOS. The plugin itself is built as an executable for the host (build) machine, not the target device. In SwiftPM, add a `.macro` target via `import CompilerPluginSupport`, depending on `SwiftSyntaxMacros` and `SwiftCompilerPlugin` from `swift-syntax`; the plugin's `@main` type conforms to `CompilerPlugin` and lists its macro types. Xcode's "Swift Macro" package template scaffolds the library, plugin, client, and test targets. Compiling external macros runs untrusted plugin code, so Xcode prompts to trust a macro the first time, and CI may need `-skipMacroValidation` or an equivalent trust step. The same machinery backs framework macros you already use: `@Observable` expands to `Observable` conformance plus per-property tracking, and `#Preview` expands to a registered preview.

## Pitfalls

- Trying to read types, symbols, or other source files during expansion. Macros see only the syntax handed to them; design APIs so everything needed is in the invocation.
- Letting SwiftSyntax drift from the toolchain version, which produces obscure "external macro implementation could not be found" or parser errors.
- Reaching for a macro when a result builder, property wrapper, generic, or protocol extension is the idiomatic answer — those are easier to read and debug.
- Expanding to fixed identifiers that shadow or clash with user code instead of using `makeUniqueName`.
- Shipping without expansion tests, then breaking downstream code silently when a SwiftSyntax bump changes node shapes.
- Forgetting an `extension` role must declare the conformances it adds in the macro declaration's `conformances:`/`names:` clauses, or the compiler rejects the new members.

## References

- **Documentation:** [Macros (The Swift Programming Language)](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/macros/)
- **Documentation:** [Applying Macros](https://developer.apple.com/documentation/swift/applying-macros)
- **Documentation:** [SwiftSyntaxMacros](https://swiftpackageindex.com/swiftlang/swift-syntax/documentation/swiftsyntaxmacros)
- **WWDC:** [Write Swift macros (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10166/)
- **WWDC:** [Expand on Swift macros (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10167/)
- **Sample Code:** [swift-syntax: macro examples and test support](https://github.com/swiftlang/swift-syntax)

## See also

For testing expansions and diagnostics with `assertMacroExpansion`, see `swift-testing`. For the `@Observable` macro this machinery generates, see `observation-observable`, and for `@Model` see `swiftdata-modeling`. For packaging a macro plugin and pinning the SwiftSyntax dependency, see `spm`.
