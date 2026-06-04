---
name: core-data
description: "Use when persisting an object graph with Apple's Core Data stack: setting up NSPersistentContainer, separating view and background contexts, writing fetch requests and predicates, running batch insert/delete/update, performing lightweight or staged migrations, enforcing perform-based concurrency, or mirroring a store to iCloud with NSPersistentCloudKitContainer. Also use when deciding between Core Data and SwiftData."
globs:
  - "**/*.swift"
tags: [core-data, persistence, cloudkit, concurrency, migration]
x-skills-master:
  domain: apple
  class: code
  category: app-services
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  requires:
    ios: "17"
    swift: "6.0"
  pairs_with: []
  sources:
    - https://developer.apple.com/documentation/coredata/nspersistentcontainer
    - https://developer.apple.com/documentation/coredata/nspersistentcloudkitcontainer
    - https://developer.apple.com/documentation/coredata/staged-migrations
    - https://developer.apple.com/documentation/coredata/batch-processing
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for Core Data when you need a mature, SQLite-backed object graph with fine-grained control: multi-store stacks, CloudKit sharing, change history, custom migrations, or an existing codebase you do not want to rewrite. Prefer SwiftData for new, Swift-first apps with simple schemas — but stay on Core Data when you require CloudKit record sharing between users, public-database sync, or migration tooling SwiftData does not yet expose. The two stacks can coexist over the same store while you transition incrementally.

## Core guidance

- **Do** own a single `NSPersistentContainer` (or `NSPersistentCloudKitContainer`) per store. Set `viewContext.automaticallyMergesChangesFromParent = true` so UI reflects background writes.
- **Do** confine the `viewContext` to the main actor and do all writes on a `newBackgroundContext()`; never pass `NSManagedObject` instances across contexts — pass `NSManagedObjectID` instead.
- **Do** wrap every access to a context's objects in `await context.perform { }` (or the throwing variant). Avoid `performAndWait` from async code; it blocks and invites deadlocks.
- **Do** type fetch requests and bound them: set `fetchLimit`, `fetchBatchSize`, and a `propertiesToFetch` when you only need scalars.
- **Don't** load thousands of rows to mutate them. Use `NSBatchInsertRequest`, `NSBatchUpdateRequest`, or `NSBatchDeleteRequest`; they run in the store and skip the row cache, but bypass validation, relationships, and the context — merge the returned IDs back in.
- **Don't** hand-write mapping models for additive schema changes. Enable lightweight migration; reach for staged migrations (`NSStagedMigrationManager`) only when a step is non-inferable.
- **Don't** ship a release without a `loadPersistentStores` error path — a corrupt or migration-failed store should surface, not silently swallow.

```swift
let context = container.newBackgroundContext()
try await context.perform {
    let request = Article.fetchRequest()
    request.predicate = NSPredicate(format: "isUnread == YES AND feed.title == %@", title)
    request.fetchLimit = 50
    for article in try context.fetch(request) { article.isUnread = false }
    try context.save()                       // changes merge into viewContext
}
```

## Platform notes

- **iCloud sync:** `NSPersistentCloudKitContainer` requires the CloudKit and Background Modes (remote notifications) capabilities, an iCloud container in your entitlements, and a schema that is CloudKit-compatible — every relationship must be optional and no attribute may be unique-constrained. Initialize the schema in development with `initializeCloudKitSchema(options:)`.
- **History tracking:** enable `NSPersistentHistoryTrackingKey` on the store description before syncing or sharing; CloudKit mirroring depends on it.
- **watchOS/tvOS:** keep stores small and lean on batch operations; both platforms are memory-constrained.
- **App groups:** to share a store with an extension, place the store in the app group container URL and coordinate writes through history tracking.

## Pitfalls

- Reading `managedObject.value` off the context's own queue is undefined behavior; the multi-threading assertion (`-com.apple.CoreData.ConcurrencyDebug 1`) catches it during development.
- Batch requests do not update in-memory objects or fire `NSManagedObjectContextDidSave`; without merging the result IDs your `viewContext` shows stale data.
- A `viewContext` with unsaved changes can lose them when CloudKit merges remote updates — keep the view context read-mostly.
- Setting a store as CloudKit-mirrored after data already violates CloudKit constraints (non-optional relationships, unique attributes) fails at load time, not compile time.
- Forgetting `automaticallyMergesChangesFromParent` leaves the UI stale after background saves even though the data is on disk.

## References

- **Documentation:** [NSPersistentContainer](https://developer.apple.com/documentation/coredata/nspersistentcontainer)
- **Documentation:** [Migrating your data model automatically](https://developer.apple.com/documentation/coredata/migrating-your-data-model-automatically)
- **Documentation:** [Staged migrations](https://developer.apple.com/documentation/coredata/staged-migrations)
- **Documentation:** [Setting up Core Data with CloudKit](https://developer.apple.com/documentation/coredata/setting-up-core-data-with-cloudkit)
- **WWDC:** [Bring Core Data concurrency to Swift and SwiftUI (WWDC21)](https://developer.apple.com/videos/play/wwdc2021/10017/)
- **WWDC:** [Evolve your Core Data schema (WWDC22)](https://developer.apple.com/videos/play/wwdc2022/10120/)
- **Sample Code:** [Loading and Displaying a Large Data Feed](https://developer.apple.com/documentation/coredata/loading_and_displaying_a_large_data_feed)

## See also

For new Swift-first persistence without the boxing ceremony, see the swift-data skill, which shares concepts here but uses macros and `@Model`. When configuring iCloud entitlements and record sharing, pair this with a cloudkit skill. For surfacing fetched results in SwiftUI, see a swiftui-data-flow skill covering `@FetchRequest` and observation.
