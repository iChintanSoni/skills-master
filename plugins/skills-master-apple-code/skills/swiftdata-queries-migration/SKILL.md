---
name: swiftdata-queries-migration
description: Guidance on reading and evolving a SwiftData store, covering the Query macro with the Predicate macro, sort descriptors, FetchDescriptor for imperative fetches, fetching through the model context, and schema migration with VersionedSchema and SchemaMigrationPlan stages. Use when filtering or sorting persisted models, paging large result sets, fetching outside a view, designing versioned schemas, or planning lightweight versus custom migrations between store versions.
---

## When to use

Reach for this guidance when reading models out of a SwiftData store or evolving its shape over time. That includes filtering and sorting query results in a view, running an imperative fetch from a background task or repository type, paging through a large table without loading everything, and planning how the persistent schema changes across app releases. It applies whenever the model layout in code no longer matches the layout already on disk and existing user data must survive the upgrade.

## Core guidance

- Prefer the Query macro for view-driven reads so results stay live and re-fetch automatically when the model context changes. Pass a filter and `sort` keypath, or supply a full `FetchDescriptor`, rather than fetching manually inside `body`.
- Build filters with the Predicate macro so conditions are type-checked against the model and translated to the store's native query engine. Keep predicate bodies to comparisons, `contains`, and boolean logic; arbitrary Swift calls inside a predicate cannot be translated and will trap at runtime.
- For imperative reads, construct a `FetchDescriptor` and call `modelContext.fetch(_:)`. Use `fetchLimit` and `fetchOffset` for paging, `fetchCount(_:)` when only a tally is needed, and `propertiesToFetch` or `relationshipKeyPathsForPrefetching` to trim or prefetch what loads.
- Capture predicate variables in locals first, because the macro captures by value and member access on `self` or captured objects is restricted. Reference relationship counts and optionals carefully, since nil handling differs from in-memory Swift.
- Version every breaking change behind a `VersionedSchema` enum that pins the exact model types for that release, then wire the ordered versions and stages into a `SchemaMigrationPlan` attached to the `ModelContainer`.
- Use a lightweight `MigrationStage` for additive or renaming changes the store can infer on its own, and a custom stage only when data must be transformed, deduplicated, or backfilled between versions.

```swift
@Query(sort: \Trip.startDate, order: .reverse) private var trips: [Trip]

func upcoming(after date: Date, in context: ModelContext) throws -> [Trip] {
    var descriptor = FetchDescriptor<Trip>(
        predicate: #Predicate { $0.startDate > date && !$0.isArchived },
        sortBy: [SortDescriptor(\.startDate)]
    )
    descriptor.fetchLimit = 50
    return try context.fetch(descriptor)
}
```

## Platform notes

- Lightweight stages handle adding or removing properties, renaming via the rename attribute, changing a relationship's delete rule, and adding attributes such as unique, external storage, or cloud-encryption flags. Anything that reshapes existing values needs a custom stage.
- A custom stage exposes `willMigrate` and `didMigrate` closures. Fetch and edit data through the old types in `willMigrate`, calling `save()` before returning; use `didMigrate` for work that needs the new types. Avoid touching old types from `didMigrate`.
- The model context that backs the Query macro is the main-actor context from the SwiftUI environment. Off the main actor, create a `ModelContext` from the container or use a `ModelActor`, and never share a context across actors.
- CloudKit-backed stores constrain the schema: relationships must be optional or have defaults, and unique constraints are unavailable, which limits what a lightweight stage can express.
- Predicate translation and supported operators have broadened across the 26 cycle, but the safe baseline remains simple, store-expressible expressions rather than rich Swift logic.

## Pitfalls

- Putting non-translatable Swift into a Predicate macro body, such as calling an instance method or formatting a value, compiles but fails when the store evaluates it. Reduce to comparable stored properties.
- Skipping the version pin: a `VersionedSchema` must freeze its model types as nested copies. Pointing a past version at the current live models defeats migration and corrupts the upgrade path.
- Treating every change as lightweight. Splitting a field, merging duplicates, or deriving a new value requires a custom stage; relying on inference silently drops or mangles data.
- Fetching everything to count or to find one row. Use `fetchCount(_:)` or set `fetchLimit` to 1 instead of loading and counting an array.
- Reordering stages or omitting an intermediate version so a user upgrading across several releases hits a gap, which leaves the store unopenable.

## References

- **Documentation:** [SwiftData](https://developer.apple.com/documentation/swiftdata)
- **Documentation:** [Filtering and sorting persistent data](https://developer.apple.com/documentation/swiftdata/filtering-and-sorting-persistent-data)
- **Documentation:** [SchemaMigrationPlan](https://developer.apple.com/documentation/swiftdata/schemamigrationplan)
- **WWDC:** [SwiftData: Dive into inheritance and schema migration (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/291/)
- **WWDC:** [Model your schema with SwiftData (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10195/)

## See also

See `swiftdata-modeling` for designing the model types, relationships, and attributes that these queries and migrations operate on. Related navigation and view-state concerns are covered by `swiftui-navigation` and `swift-observation`.
