---
name: adopting-swift-6-concurrency
description: "Decision router for moving a codebase to Swift 6 strict concurrency and the Swift 6 language mode, covering whether to migrate now, an incremental per-module sequence, where to start, the cost versus benefit, and how MainActor and Sendable fit in. Use when planning a Swift 6 adoption, weighing strict concurrency checking against deadlines, choosing the first module to migrate, recompiling against the Xcode 26 SDK, or deciding between approachable defaults and full data-race safety."
tags: [swift-6, concurrency, migration, sendable, mainactor]
x-skills-master:
  domain: apple
  class: overview
  category: overviews
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  pairs_with: []
  sources:
    - https://developer.apple.com/documentation/swift/adoptingswift6
    - https://www.swift.org/migration/documentation/swift-6-concurrency-migration-guide/migrationstrategy/
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

# Adopting Swift 6 Concurrency

The Swift 6 language mode turns data-race risks into compile-time errors instead of latent crashes. Adoption is opt-in and incremental: a Swift 6 compiler still builds Swift 5 mode code, and each module advances on its own schedule. This skill routes the *decision* — whether, when, and where to start — and hands the mechanics to the deeper migration skill.

## When to use

- Deciding whether a project should move to Swift 6 mode now or stay in Swift 5 mode with warnings.
- Sequencing a multi-module migration and picking the first target to convert.
- Recompiling an app against the Xcode 26 SDK and reacting to new concurrency diagnostics.
- Explaining the cost/benefit of strict checking to a team weighing it against ship dates.

## Core guidance

- **Do migrate incrementally, bottom-up.** Convert leaf modules and packages with no internal dependencies first, then move up the graph. A whole-app flip drowns you in errors with no safe checkpoint.
- **Do stage with `SWIFT_STRICT_CONCURRENCY` before flipping the language version.** Raise a module from `minimal` to `targeted` to `complete`, clear the *warnings* at each step, then set `SWIFT_VERSION = 6` to promote them to errors. The language mode adds no new diagnostics beyond `complete` — it only enforces them.
- **Don't treat MainActor isolation as a workaround.** Annotating UI-bound types with `@MainActor` is correct design, not an escape hatch. In Xcode 26, new projects default to MainActor isolation, so most app code is single-threaded by default and never sees a data race.
- **Do introduce `Sendable` only at real concurrency boundaries.** A type needs `Sendable` when it actually crosses actors or tasks. Marking everything sendable preemptively creates churn; let the compiler point to the boundaries that matter.
- **Do use `@preconcurrency` to quarantine un-migrated dependencies**, but know it only silences *cross-module compile-time* checks — Swift 6 still enforces isolation at runtime, so a non-`Sendable` escaping closure passed into Swift 5 code can still trap.
- **Don't migrate a module while its dependencies still emit concurrency warnings.** You will re-fix the same boundary twice.
- **Do consider deferring** for stable, low-churn code near a release; the payoff is largest for code under active concurrent development.

## Platform notes

- **Xcode 26 / Swift 6.2:** new projects enable Approachable Concurrency and Default Actor Isolation set to `MainActor`. Existing projects keep their settings — adoption is a deliberate Build Settings change, not automatic on SDK bump.
- **Swift packages:** set the per-target language mode and `swiftSettings` (e.g. `.defaultIsolation(MainActor.self)`) in `Package.swift`; a package and its app target migrate independently.
- **All platforms** share one model — the same `Sendable`, actor, and isolation rules apply identically across iOS, macOS, watchOS, tvOS, and visionOS.

## Pitfalls

- Flipping `SWIFT_VERSION = 6` app-wide first, then trying to triage hundreds of errors with no green checkpoint to fall back to.
- Assuming `@preconcurrency import` removes runtime isolation enforcement; it does not.
- Sprinkling `@unchecked Sendable` to silence the compiler — it disables the very safety you are adopting and reintroduces the race risk.
- Confusing strict concurrency checking levels with the language mode; `complete` checking in Swift 5 mode surfaces the same issues as warnings first.

```text
// Per-module staging in Build Settings (or .xcconfig)
SWIFT_STRICT_CONCURRENCY = complete   // 1. fix warnings here first
SWIFT_VERSION            = 6          // 2. promote to errors once clean
```

## See also

For the step-by-step mechanics once you have chosen a module — annotating actors, resolving `Sendable` errors, and isolating callbacks — route into the swift-6-migration skill. For the underlying model of actors, tasks, and `async`/`await`, see swift-concurrency. For SwiftUI-specific isolation, observation, and `.task` lifecycle, see swiftui-concurrency.

## References

- **Documentation:** [Adopting strict concurrency in Swift 6 apps](https://developer.apple.com/documentation/swift/adoptingswift6)
- **Documentation:** [Swift 6 concurrency migration strategy](https://www.swift.org/migration/documentation/swift-6-concurrency-migration-guide/migrationstrategy/)
- **WWDC:** [Embracing Swift concurrency (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/268/)
- **WWDC:** [Migrate your app to Swift 6 (WWDC24)](https://developer.apple.com/videos/play/wwdc2024/10169/)
- **Sample Code:** [Updating an app to use strict concurrency](https://developer.apple.com/documentation/Swift/updating-an-app-to-use-strict-concurrency)
