---
name: core-spotlight
description: "Use when making in-app content searchable from the system Spotlight index on iOS, iPadOS, and macOS. Triggers: indexing records with CSSearchableItem and CSSearchableItemAttributeSet, donating NSUserActivity for search and Handoff, deep-linking back from a Spotlight result, batch reindexing or deletion, or exposing App Intents entities to system search via IndexedEntity."
---

## When to use

Reach for Core Spotlight when individual pieces of your app's content — notes, conversations, recipes, products — should surface in the system search field and deep-link straight back into the right screen. Pick the indexing path that matches your model: `CSSearchableItem` for explicit, persisted content you own; `NSUserActivity` for the screen the user is currently viewing (which also feeds Handoff and Siri Suggestions); and `IndexedEntity` when your App Intents entities should appear in Spotlight and drive Siri and Shortcuts. If you only need launch-from-search without rich metadata, a single eligible `NSUserActivity` is enough.

## Core guidance

- **Do** use stable, app-meaningful `uniqueIdentifier` values (e.g. a record UUID) so reindexing updates an item in place rather than duplicating it; group related items under a shared `domainIdentifier` for bulk deletion.
- **Do** populate `title`, `contentDescription`, `thumbnailData`, and `keywords` on the attribute set — sparse items rank poorly and look broken in results.
- **Do** index off the main actor with the async API, and use `beginBatch()`/`endBatch(clientState:)` to record a sync token so you only push deltas after the first full pass.
- **Don't** assume `userInfo` survives a Spotlight tap: for `CSSearchableItem` results the system delivers only `CSSearchableItemActivityIdentifier`, so re-fetch content from your store by that id.
- **Don't** treat the index as durable storage — reindex after upgrades or when `CSSearchableIndex` reports an `indexingError`; the system can drop the index.
- **Prefer** `IndexedEntity` (iOS 18+) over hand-rolled items for App Intents entities; use `associateAppEntity(_:)` on an existing `CSSearchableItem` only when you already index via Core Spotlight directly.
- **Do** delete on content removal with `deleteSearchableItems(withIdentifiers:)` or `withDomainIdentifiers:`, and call `deleteAllSearchableItems()` on sign-out.

```swift
let attrs = CSSearchableItemAttributeSet(contentType: .text)
attrs.title = note.title
attrs.contentDescription = note.preview
attrs.keywords = note.tags
let item = CSSearchableItem(uniqueIdentifier: note.id.uuidString,
                            domainIdentifier: "notes",
                            attributeSet: attrs)
try await CSSearchableIndex.default().indexSearchableItems([item])
```

## Platform notes

- **iOS / iPadOS**: Deep-link by handling `CSSearchableItemActionType` via SwiftUI's `onContinueUserActivity(_:perform:)`, reading the id from `userInfo[CSSearchableItemActivityIdentifier]`. In UIKit, implement the scene/app delegate `continue userActivity` path.
- **macOS**: Same Core Spotlight APIs index into system search; route the continued activity through your `App` or `NSApplicationDelegate` continuation handler.
- **App Intents**: Conform entities to `IndexedEntity`, call `CSSearchableIndex.default().indexAppEntities(_:)`, and tag properties with `indexingKey` so Spotlight maps them to its semantic keys (expanded at WWDC25).
- **Privacy**: No usage-string entitlement is required, but only index content the signed-in user is entitled to see; the index is on-device and per-user, so clear it on logout.

## Pitfalls

- Reusing the same identifier across distinct items collapses them into one result; conversely, generating a fresh UUID per index pass creates duplicates that never clean up.
- Forgetting to set `isEligibleForSearch` (and a `contentAttributeSet`) on an `NSUserActivity` means it can drive Handoff but never appears in Spotlight.
- Storing large blobs in `thumbnailData` bloats the index; prefer `thumbnailURL` for on-disk images.
- Indexing on the main actor during large imports stalls the UI — batch and `await` off-main, checking `CSSearchableIndex.isIndexingAvailable()` first.
- Expecting indexed content immediately: indexing is asynchronous and ranking warms over time, so don't assert presence in a tight test loop.

## References

- **Documentation:** [CSSearchableItem](https://developer.apple.com/documentation/corespotlight/cssearchableitem)
- **Documentation:** [CSSearchableIndex](https://developer.apple.com/documentation/corespotlight/cssearchableindex)
- **Documentation:** [Making app entities available in Spotlight](https://developer.apple.com/documentation/appintents/making-app-entities-available-in-spotlight)
- **Documentation:** [onContinueUserActivity(_:perform:)](https://developer.apple.com/documentation/swiftui/view/oncontinueuseractivity(_:perform:))
- **WWDC:** [Support semantic search with Core Spotlight (WWDC24)](https://developer.apple.com/videos/play/wwdc2024/10131/)
- **WWDC:** [Explore new advances in App Intents (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/275/)

## See also

Pair this with an app-intents skill when you want the same entities to power Siri, Shortcuts, and Spotlight from a single `IndexedEntity` definition, and with a deep-linking or scene-routing skill to turn a continued `CSSearchableItemActionType` activity into navigation state. A user-activity skill complements the Handoff and Siri Suggestions side of `NSUserActivity` that overlaps with search eligibility.
