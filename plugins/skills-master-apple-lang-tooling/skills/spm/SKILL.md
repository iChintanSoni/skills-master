---
name: spm
description: Guidance on authoring Swift Package Manager manifests, including products and targets, dependency version rules, local packages for app modularization, test targets, bundled resources, and platform-conditional build settings. Use when creating or editing a Package.swift file, splitting an app into local feature packages, adding or pinning third-party dependencies, declaring resources or test targets in a package, or resolving version-resolution and platform-condition issues.
---

# spm

## When to use

Reach for this guidance when authoring or revising a `Package.swift` manifest, carving an application into local feature packages, adding or pinning external dependencies, or wiring up test targets, resources, and platform-conditional settings. It assumes a Swift 6 toolchain and the `PackageDescription` API exposed by Xcode 26.

## Core guidance

- Pin the manifest's capability with the first line, `// swift-tools-version: 6.0`, before any other text. It selects which `PackageDescription` API and language features the manifest may use, and is independent of the `platforms` floor that gates the products at build time.
- Keep the manifest declarative. The top-level `Package` value lists `products` (what consumers import), `targets` (where the code lives), and `dependencies` (other packages). A target compiles a directory under `Sources/`; a product groups one or more targets into a `.library` or `.executable` that others can depend on.
- Prefer `.upToNextMajor(from: "1.2.0")` for external dependencies; it accepts compatible updates while excluding the next breaking major. Use `.upToNextMinor` only when a library treats minors as breaking, an exact `"1.2.0"` for reproducible pins, and a branch or commit revision only as a temporary measure, never for a shipping release.
- Reference internal targets by `.target(name:)` and cross-package products by `.product(name:package:)`. Within one package, a test target depends on the target it exercises; nothing depends back on the test target.
- Modularize an app with local packages added by `.package(path: "../FeatureKit")`. Local paths resolve before the registry, ignore version rules, and let a feature build and test in isolation, which shortens incremental builds and clarifies module boundaries.
- Declare bundled assets explicitly with `resources:`. Use `.process(_:)` so the toolchain can optimize and flatten files, and reserve `.copy(_:)` for content whose directory layout must survive verbatim. Access them through the generated `Bundle.module`.

```swift
.target(
    name: "FeatureKit",
    dependencies: [
        .product(name: "Algorithms", package: "swift-algorithms")
    ],
    resources: [.process("Resources")],
    swiftSettings: [
        .define("PREMIUM", .when(platforms: [.iOS, .macOS]))
    ]
)
```

## Platform notes

- The package-wide `platforms: [.iOS("26.0"), .macOS("26.0")]` sets the minimum deployment floor for every target; individual source files still guard newer symbols with `@available` and `if #available`.
- Gate dependencies and build settings per platform with `.when(platforms:)`, for example a dependency that only links on Linux or a `swiftSettings` flag scoped to Apple platforms. Conditions compose with the resolved configuration.
- A package declaring only Apple platforms in `platforms` is still parsed on other hosts; wrap platform-only imports in `#if canImport(UIKit)` rather than assuming the manifest excludes them.
- From tools-version 6.0, two packages may depend on each other so long as their targets form no dependency cycle, which eases gradual extraction of shared modules.

## Pitfalls

- Omitting or lowering `swift-tools-version` silently disables newer manifest API and can flip default language-mode behavior; treat it as load-bearing.
- Pinning a dependency to a branch or commit breaks semantic resolution for everyone downstream and is rejected by some registries; convert to a tagged version before merging.
- Forgetting `resources:` ships a target with missing assets that fail only at runtime; the build itself stays green.
- Letting a non-test target depend on a test target, or importing `@testable` across package boundaries, produces resolution and visibility errors that are easy to misread.
- Editing the committed `Package.resolved` by hand defeats its purpose; regenerate it through resolution so the recorded revisions stay consistent.

## References

- **Documentation:** [PackageDescription](https://developer.apple.com/documentation/packagedescription)
- **Documentation:** [Swift packages](https://developer.apple.com/documentation/xcode/swift-packages)
- **WWDC:** [Creating Swift Packages (WWDC19)](https://developer.apple.com/videos/play/wwdc2019/410/)

## See also

See `xcode-project-conventions` for how local packages, schemes, and the surrounding Xcode project fit together, including which targets a workspace should own versus delegate to packages.
