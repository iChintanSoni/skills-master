---
name: choosing-persistence
description: Helps choose a persistence approach on Apple platforms — SwiftData, Core Data, files/Codable, or CloudKit — by weighing maturity, sync needs, and migration cost. Use when starting a new data layer, deciding between SwiftData and Core Data, or adding cross-device sync.
tags: [persistence, swiftdata, core-data, cloudkit, decision]
x-skills-master:
  domain: apple
  class: overview
  category: overviews
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  pairs_with: [swiftdata-modeling]
  sources:
    - https://developer.apple.com/documentation/swiftdata
    - https://developer.apple.com/documentation/coredata
    - https://developer.apple.com/documentation/cloudkit
  snapshot_date: "2026-05-30"
  stability: contested
  version: 1.0.0
---

## When to use

Use at the start of a data layer, or when a project is weighing one store against another. This skill routes a decision; the implementation details live in the per-framework code skills (for example `swiftdata-modeling`).

## Core guidance

Match the store to the data and the constraints, not to novelty:

- **Files + Codable** — best for small, document-shaped, or export-friendly data with no relational queries. Lowest ceremony, no schema engine.
- **SwiftData** — the modern, Swift-native object store. Choose it for new apps that want `@Model`, value-typed queries, and tight SwiftUI integration, and whose deployment target is iOS 17+ across the board.
- **Core Data** — the mature, battle-tested object graph. Choose it when you need capabilities SwiftData has not yet matched (complex fetched-results edge cases, fine-grained migration control, long-standing production schemas) or must support OS versions below the SwiftData baseline.
- **CloudKit** — layer it under SwiftData or Core Data for cross-device sync, or use it directly for shared/public databases. It imposes schema constraints (optional relationships, defaults, no unique attributes) that you must design for up front.

A practical default for a brand-new iOS 17+ app with simple sync needs is SwiftData backed by CloudKit; a large existing Core Data app should usually stay on Core Data until SwiftData clearly covers its needs.

## Platform notes

SwiftData requires the iOS 17 / macOS 14 era and later. If you must run on older systems, Core Data (or files) is the only option. CloudKit availability and quotas apply equally regardless of the object layer above it.

## Pitfalls

- Picking SwiftData for an app that must ship to pre-iOS-17 devices.
- Adopting CloudKit after the schema is fixed, then discovering it forbids your `.unique` keys and non-optional relationships.
- Treating "newer" as "better" — Core Data still wins on migration control and edge-case maturity.

## Open question

SwiftData versus Core Data is genuinely contested as of 2026 and the right answer is project-specific. SwiftData is the strategic direction and the better default for greenfield iOS 17+ work, but Core Data remains the safer choice for complex migrations and mature schemas. This skill presents the tradeoffs rather than prescribing one; record the decision (and its date) in your project so it can be revisited as SwiftData matures.

## See also

- Implementation: `swiftdata-modeling`
- Apple: SwiftData, Core Data, and CloudKit framework references (see sources).
