# swiftdata-queries-migration — checklist

- [ ] View reads use `@Query` (with a `filter`/`sort` keypath or a full `FetchDescriptor`) so results stay live, instead of fetching inside `body`.
- [ ] Filters are built with the `#Predicate` macro so conditions are type-checked and translated to the store engine, not evaluated as in-memory Swift.
- [ ] Predicate bodies stay limited to comparisons, `contains`, and boolean logic; no instance-method calls, formatters, or other non-translatable Swift inside the closure.
- [ ] Variables referenced by a predicate are captured into locals first, since the macro captures by value and restricts member access on `self`.
- [ ] nil handling in predicates is checked explicitly; optional and relationship-count semantics differ from regular Swift.
- [ ] Imperative reads build a `FetchDescriptor<T>` and call `context.fetch(_:)`; paging uses `fetchLimit` and `fetchOffset`.
- [ ] Counting uses `fetchCount(_:)` and existence checks set `fetchLimit = 1`, rather than fetching an array and counting it.
- [ ] `propertiesToFetch` and `relationshipKeyPathsForPrefetching` are set where they meaningfully trim or prefetch loaded data.
- [ ] Off the main actor, a fresh `ModelContext` from the container or a `ModelActor` is used; no context is shared across actors.
- [ ] Every breaking schema change is pinned behind a `VersionedSchema` enum that freezes its own copies of the model types for that release.
- [ ] Ordered versions and stages are wired into a `SchemaMigrationPlan` attached to the `ModelContainer`; no intermediate version is skipped or reordered.
- [ ] Additive or rename-only changes use a lightweight `MigrationStage`; value-reshaping changes (split/merge/derive/dedupe) use a custom stage.
- [ ] Custom stages do data work in `willMigrate` through the old types and call `save()` before returning; `didMigrate` only touches new types.
- [ ] CloudKit-backed schemas keep relationships optional or defaulted and avoid unique constraints, matching what a lightweight stage can express.
- [ ] Migration path is tested by opening a store seeded at the oldest supported version and upgrading across every release without a gap.
