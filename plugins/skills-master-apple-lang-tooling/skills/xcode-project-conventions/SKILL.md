---
name: xcode-project-conventions
description: Conventions for structuring Xcode projects so they stay reviewable and reproducible — targets versus schemes versus build configurations, xcconfig files, Info.plist and entitlements, asset catalogs, low project-file churn, and modularization with local Swift packages. Use when setting up a new Xcode project, deciding where a build setting belongs, taming noisy pbxproj diffs, splitting an app into feature modules, or onboarding a team to a shared project layout.
---

## When to use

Reach for these conventions when standing up a new Xcode project, when a team keeps colliding on `project.pbxproj` merge conflicts, or when build settings have drifted into a tangle that nobody can audit. They also apply when deciding whether a new bit of behavior belongs in a target, a scheme, or a configuration, and when an app has grown large enough that a single app target is slowing builds and blurring ownership boundaries.

## Core guidance

- Keep the three axes distinct. A *target* produces one product (app, framework, test bundle) and owns its build settings. A *configuration* (Debug, Release, and any custom variants) is a named set of build-setting values applied across targets. A *scheme* selects which targets to build and which configuration each action (Run, Test, Profile, Archive) uses. Do not encode environment differences by duplicating targets when a configuration plus an xcconfig will do.
- Move build settings out of the project file and into `.xcconfig` files. Text-based settings diff cleanly, compose through `#include`, and let one shared base file feed every target, which kills most pbxproj churn. Reserve the build-settings editor for discovery, then lift the value into the xcconfig.
- Respect the resolution order. Settings resolve from SDK defaults up through project-level xcconfig, project settings, target-level xcconfig, and finally target settings. Define common values low (project base) and override sparingly higher up; reference inherited values with `$(inherited)` rather than retyping lists.
- Treat Info.plist as data, not a settings dump. Drive values like version and bundle id from build settings (`$(MARKETING_VERSION)`, `$(PRODUCT_BUNDLE_IDENTIFIER)`) so one xcconfig change updates every reference. Keep entitlements in the `.entitlements` file and add capabilities through the Signing and Capabilities tab so the matching provisioning requirements are generated.
- Use asset catalogs for images, colors, symbols, and app icons; reference named assets in code and let the catalog pick the right variant per device and appearance. One catalog per module keeps ownership clear.
- Modularize with local Swift packages before reaching for extra Xcode targets. A package keeps its sources, resources, and dependencies in a `Package.swift` that diffs as plain text, builds and tests in isolation, and shrinks the app target to a thin shell. Feature packages also enforce boundaries the compiler can check.

```swift
// Package.swift for a local feature module
let package = Package(
    name: "Onboarding",
    products: [.library(name: "Onboarding", targets: ["Onboarding"])],
    targets: [
        .target(name: "Onboarding", resources: [.process("Media.xcassets")]),
        .testTarget(name: "OnboardingTests", dependencies: ["Onboarding"]),
    ]
)
```

## Platform notes

- Bundle identifiers and entitlements differ per platform; drive them from per-configuration or per-platform xcconfig values rather than branching in the project file.
- Local package resources are accessed through `Bundle.module`; the generated resource bundle is named for the package and target, so avoid hardcoding bundle paths.
- App icons and accent colors live in the asset catalog and are selected through build settings (`ASSETCATALOG_COMPILER_APPICON_NAME`); multiplatform apps can keep platform-specific icon sets in one catalog.
- Test plans replace per-scheme test lists for projects that run the same tests under several configurations or destinations.

## Pitfalls

- Storing secrets or signing identities in xcconfig committed to source control. Keep credentials out of the repo and inject them through the environment or a local, ignored xcconfig.
- Letting Xcode auto-reformat or reorder `project.pbxproj` on save, which produces giant unreviewable diffs. Lifting settings into xcconfig and code into packages removes most reasons to touch the file at all.
- Cloning a whole target to ship a staging build. That doubles maintenance forever; use a configuration plus an xcconfig instead.
- Setting a value in the editor on top of an xcconfig that already sets it, creating an invisible override. Check the Levels view before assuming a setting is taking effect.
- Over-modularizing into dozens of tiny packages, which can slow resolution and clutter the workspace; group by feature ownership, not by file.

## See also

For authoring and depending on Swift packages in depth, see `spm`. For turning these targets and configurations into signed archives and store submissions, see `build-sign-distribute`.
