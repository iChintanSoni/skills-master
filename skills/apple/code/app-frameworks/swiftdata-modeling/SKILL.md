---
name: swiftdata-modeling
description: Designs SwiftData models with @Model, relationships, delete rules, and uniqueness for Apple-platform persistence. Use when modeling persistent data, choosing relationship or delete rules, adding @Attribute(.unique), setting up a ModelContainer, or deciding how to shape a SwiftData schema.
globs:
  - "**/*.swift"
tags: [swiftdata, persistence, model, schema, database]
x-skills-master:
  domain: apple
  class: code
  category: app-frameworks
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  requires:
    ios: "17"
    swift: "6.0"
  pairs_with: [choosing-persistence]
  sources:
    - https://developer.apple.com/documentation/swiftdata
    - https://developer.apple.com/documentation/swiftdata/preservingyourappsmodeldata
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Use when defining the persistent shape of an app's data with SwiftData: declaring `@Model` types, modeling relationships and their delete rules, enforcing uniqueness, and wiring up a `ModelContainer`. For querying and migrating an existing store, hand off to the queries/migration skill. To decide whether SwiftData is the right store in the first place, use `choosing-persistence`.

## Core guidance

- Declare a model by annotating a class with `@Model`. Stored properties persist automatically; annotate non-persistent state with `@Transient`.
- Model a relationship as a plain reference between `@Model` types. Declare the inverse explicitly with `@Relationship(inverse:)` on one side so the framework does not have to guess it, and set a `deleteRule` deliberately: `.cascade` for children the parent owns, `.nullify` for references shared with other objects.
- Enforce identity with `@Attribute(.unique)` on natural keys. On a unique collision SwiftData updates the existing row (an upsert) instead of inserting a duplicate.
- Create one `ModelContainer` per store at launch and inject it with the `.modelContainer(for:)` scene/view modifier. Read and write through the `ModelContext` you take from the environment, and batch related changes before saving.
- Keep model types free of UI and import only Foundation, so they remain testable and portable across every platform that ships SwiftData.

See [examples.md](examples.md) for an annotated model graph.

## Platform notes

SwiftData requires iOS 17 / iPadOS 17 / macOS 14 / watchOS 10 / tvOS 17 / visionOS 1 and later. A CloudKit-backed container adds constraints that must be designed in from the start: every relationship must be optional or have a default value, every non-optional attribute needs a default, and `@Attribute(.unique)` is not supported on a synced store. Choose natural keys and optionality with sync in mind before you adopt CloudKit.

## Pitfalls

- Omitting the inverse on a to-many relationship leads to silent inconsistencies; always declare it on one end.
- Adding a non-optional property to a shipped model breaks the existing store unless you provide a migration plan — coordinate schema changes with the migration skill.
- Heavy work inside a `@Model` computed property runs on every access; precompute and store the value instead.
- Sharing one `ModelContext` across threads is unsafe; pass model IDs across actor boundaries and refetch.

## Open question

Whether to use SwiftData at all versus Core Data or a hand-rolled store is a genuine tradeoff, not a settled default. That decision lives in `choosing-persistence`, which weighs maturity, CloudKit needs, and migration cost. This skill assumes SwiftData has already been chosen.

## References

- **Documentation:** [SwiftData](https://developer.apple.com/documentation/swiftdata)
- **Documentation:** [Defining data relationships with enumerations and model classes](https://developer.apple.com/documentation/SwiftData/Defining-data-relationships-with-enumerations-and-model-classes)
- **WWDC:** [Model your schema with SwiftData (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10195/)
- **WWDC:** [SwiftData: Dive into inheritance and schema migration (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/291/)

## See also

- Decision: `choosing-persistence`
- Apple: SwiftData framework reference and "Preserving your app's model data across launches" (see sources).
