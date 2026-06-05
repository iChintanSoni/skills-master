---
name: modularization-local-spm
description: "Guides modularizing an app into local Swift packages with clean public interfaces, inward-flowing dependencies, faster builds, and a thin app target. Use when extracting feature or core modules, designing module boundaries, speeding up build and test cycles, or deciding how far to split a monolithic app."
globs:
  - "**/*.swift"
tags: [spm, modularization, architecture, build-times, swift6]
x-skills-master:
  domain: apple
  class: lang-tooling
  category: architecture
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  requires:
    swift: "6.0"
  pairs_with: []
  sources:
    - https://developer.apple.com/documentation/xcode/organizing-your-code-with-local-packages
    - https://docs.swift.org/swiftpm/documentation/packagemanagerdocs/
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for local Swift packages when a single app target has grown slow to build, hard to test in isolation, or tangled enough that unrelated features touch the same files. Extracting modules pays off when teams want to work in parallel, when you need to share code with app extensions, widgets, or a watch app, or when you want fast unit tests that exercise a feature without launching the whole app. If the app is small and builds quickly, stay in one target — modularization adds manifests, boundaries, and ceremony that only earn their keep at scale.

## Core guidance

- **Layer by dependency direction, not by file type.** Group into a few tiers: leaf `Core`/`Foundation` modules (models, networking, design system), `Feature` modules above them, and a thin app target on top. Dependencies always flow inward toward leaves; a `Core` module must never import a feature.
- **Keep the app target thin.** It should mostly wire features together, own the app lifecycle, and inject dependencies. Move screens, view models, and logic into packages so the app target compiles in seconds.
- **Make interfaces deliberate.** Default to `internal`; mark only what callers need as `public`. Use the `package` access level (SE-0386) to share helpers across targets within the same package without leaking them to consumers.
- **Break feature-to-feature coupling with interface targets.** When feature A must trigger feature B, depend on a small `BInterface` (protocols, plain types) rather than B's implementation. This keeps the build graph wide and parallel and avoids rebuild cascades.
- **Do test inside the package.** Each target gets its own test target, so logic is verified without the app — fast, hermetic, and runnable from the command line.
- **Don't over-modularize.** Dozens of micro-packages multiply manifests, slow dependency resolution, and create circular-import headaches. Start with a handful of coarse modules and split only when a boundary clearly hurts.
- **Don't put shared mutable singletons in a `Core` module.** Pass dependencies explicitly; under Swift 6 strict concurrency, global mutable state needs isolation or `Sendable` conformance anyway.

```swift
// Packages/Feature/Sources/Profile/ProfileView.swift
import CoreModels        // leaf module, no UI
import DesignSystem      // leaf module, shared styling

public struct ProfileView: View {                 // only the entry point is public
    @State private var model: ProfileModel        // internal by default
    public init(user: User) { _model = State(initialValue: ProfileModel(user: user)) }
    public var body: some View { /* ... */ Text(model.displayName).font(.appTitle) }
}
```

## Platform notes

- **All platforms:** Add a local package with File > Add Package Dependencies > Add Local, or drag the package folder into the project; Xcode links its products to the target. One `Package.swift` can serve every platform — set `platforms:` only when a feature needs a minimum OS above the defaults.
- **Xcode 26 / explicitly built modules:** Builds coordinate module compilation through the build system, so parallelism and incremental rebuilds across packages improve. Unify build settings across targets to reduce duplicate module variants and keep the win.
- **Extensions and companions:** Putting features in packages lets a widget, share extension, or watchOS app reuse the same module without copying files, as long as the module avoids APIs unavailable on that platform.

## Pitfalls

- A feature importing another feature's implementation creates a rebuild cascade and risks a cycle; route through an interface target instead.
- Over-using `public` freezes your API surface and invites unwanted coupling; prefer `internal` and `package`.
- Resources (asset catalogs, localizations) need `resources:` in the target and access via `Bundle.module`; forgetting this yields missing assets at runtime.
- Divergent Swift language modes or `-D` flags per target spawn extra module variants and erode the build-time gains from modularization.
- Splitting too early bakes in boundaries you'll fight later; let real friction drive each split.

## References

- **Documentation:** [Organizing your code with local packages](https://developer.apple.com/documentation/xcode/organizing-your-code-with-local-packages)
- **Documentation:** [Swift Package Manager](https://docs.swift.org/swiftpm/documentation/packagemanagerdocs/)
- **Documentation:** [SE-0386: New access modifier `package`](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0386-package-access-modifier.md)
- **WWDC:** [Demystify explicitly built modules (WWDC24)](https://developer.apple.com/videos/play/wwdc2024/10171/)
- **WWDC:** [Creating Swift Packages (WWDC19)](https://developer.apple.com/videos/play/wwdc2019/410/)

## See also

Pair this with a Swift package manifest skill for the details of declaring targets, products, and dependencies, and with a strict-concurrency skill for handling shared state and `Sendable` across module boundaries. A unit-testing skill complements the per-module test targets described here.
