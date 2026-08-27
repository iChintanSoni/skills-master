# swiftdata-modeling — checklist

Run through these before considering a SwiftData model layer done.

## Models
- [ ] Each persistent type is a `final class` annotated with `@Model`, importing only `SwiftData`/`Foundation` and no UI frameworks.
- [ ] Non-persistent or derived state is marked `@Transient`, and any expensive derivation is precomputed into a stored property rather than recomputed on every access.
- [ ] Stored property types are SwiftData-compatible (value types, `Codable` structs/enums, or related `@Model` references); no UIKit/SwiftUI types leak into the schema.

## Relationships and delete rules
- [ ] Every relationship declares its inverse explicitly on one end via `@Relationship(inverse:)` so the framework never has to infer it.
- [ ] Each relationship sets an intentional `deleteRule`: `.cascade` when the parent owns the children, `.nullify` when the reference is shared with other objects.
- [ ] To-one inverse properties are optional (`Trip?`) so a child can exist detached and so deletes/migrations behave predictably.

## Identity and uniqueness
- [ ] Natural keys use `@Attribute(.unique)`, with awareness that a collision performs an upsert (updates the existing row) instead of inserting a duplicate.
- [ ] `@Attribute(.unique)` is removed from any model that will sync through CloudKit, since unique constraints are unsupported on a synced store.

## Container and context
- [ ] Exactly one `ModelContainer` per store is created at launch and injected with `.modelContainer(for:)`.
- [ ] Reads and writes go through the `ModelContext` taken from the environment (`@Environment(\.modelContext)`), and related changes are batched before saving.
- [ ] No single `ModelContext` is shared across threads/actors; cross-boundary work passes `PersistentIdentifier` values and refetches on the destination context/`ModelActor`.

## Schema evolution and sync
- [ ] No non-optional property is added to a shipped model without a migration plan coordinated with the migration skill.
- [ ] If CloudKit sync is in scope, every relationship is optional or defaulted and every non-optional attribute has a default value, designed in from the start.
- [ ] The choice of SwiftData over Core Data or a hand-rolled store was made deliberately (via `choosing-persistence`), not by default.
- [ ] Models are unit-testable in isolation using an in-memory container (`ModelConfiguration(isStoredInMemoryOnly: true)`).
