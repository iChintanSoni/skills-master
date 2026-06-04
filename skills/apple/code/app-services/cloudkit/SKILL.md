---
name: cloudkit
description: "Use when storing app data in iCloud with CloudKit: CKContainer and private/public/shared CKDatabase, CKRecord and CKReference, async saving and querying, record zones, push subscriptions, CKShare sharing, and offline-first sync with CKSyncEngine, including account checks and conflict handling."
globs:
  - "**/*.swift"
tags: [cloudkit, icloud, sync, sharing, push]
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
    - https://developer.apple.com/documentation/cloudkit/ckcontainer
    - https://developer.apple.com/documentation/cloudkit/cksyncengine-5sie5
    - https://developer.apple.com/documentation/cloudkit/ckshare
    - https://developer.apple.com/documentation/cloudkit/ckerror/serverrecordchanged
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for CloudKit when you want to store a user's data in their iCloud account and sync it across their devices, share records between iCloud users, or back a public dataset — without running your own server. Choose the right database scope: the private database holds the signed-in user's data, the public database is readable by everyone, and the shared database surfaces records others share with the user. If you bring your own local store and want offline-first sync, prefer `CKSyncEngine` over hand-rolling change-token bookkeeping. If you persist with Core Data or SwiftData, use their built-in CloudKit mirroring instead of the raw API.

## Core guidance

- **Do** gate every operation on `try await container.accountStatus()`; only `.available` means you can write to the private or shared database. Observe `Notification.Name.CKAccountChanged` to react when the user signs in or out.
- **Do** use the async record APIs: `database.modifyRecords(saving:deleting:savePolicy:atomically:)` to write and `database.records(matching:)` (a `CKQuery`) to read, rather than the deprecated completion-handler operations.
- **Do** create a custom `CKRecordZone` in the private database before syncing — custom zones enable change tracking, atomic batch writes, and sharing; the default zone supports none of these well.
- **Don't** trust push payloads to carry your data. Subscriptions are coalesced hints; on wake, fetch deltas with change tokens (or let `CKSyncEngine` do it). Register `CKDatabaseSubscription` (private/shared) or `CKQuerySubscription` (public/private) and send silent, content-available pushes.
- **Don't** ignore `CKError.serverRecordChanged`. Merge your edits onto the server copy from `serverRecord` (the `CKRecordChangedErrorServerRecordKey` userInfo entry) and retry; merging onto your client or ancestor copy just conflicts again.
- **Do** model relationships with `CKRecord.Reference` and set `.deleteSelf` for owned children so deletes cascade; use `CKAsset` for large binary blobs instead of inline `Data`.
- **Do** drive offline sync with `CKSyncEngine`: persist `stateSerialization` from the `stateUpdate` event, return pending batches from the `nextRecordZoneChangeBatch` delegate callback, and apply server deltas from `fetchedRecordZoneChanges`.

```swift
let container = CKContainer.default()
guard try await container.accountStatus() == .available else { return }
let db = container.privateCloudDatabase
let record = CKRecord(recordType: "Note", recordID: .init(zoneID: zone.zoneID))
record["title"] = "Groceries"
let result = try await db.modifyRecords(
    saving: [record], deleting: [], savePolicy: .ifServerRecordUnchanged
)
_ = try result.saveResults[record.recordID]?.get()  // throws serverRecordChanged on conflict
```

## Platform notes

- **Entitlements:** add the iCloud capability with CloudKit and a container, plus Push Notifications. The build needs `com.apple.developer.icloud-services` containing `"CloudKit"`. There is no Info.plist usage string, but CloudKit requires a real Apple Developer team — the simulator cannot register for remote pushes, so test sync on a device or Mac.
- **Background pushes:** enable Background Modes > Remote notifications to receive silent subscription notifications; implement `application(_:didReceiveRemoteNotification:)` and call your fetch (or `CKSyncEngine.fetchChanges()`).
- **watchOS/tvOS/visionOS:** all share the same framework. `UICloudSharingController` is UIKit-only (iOS/iPadOS); on macOS use `NSSharingService`, and in SwiftUI wrap the controller or use the `cloudSharingControls`/share sheet bridge.
- **CKSyncEngine** requires iOS 17 / iPadOS 17 / macOS 14 / watchOS 10 / tvOS 17 / visionOS 1 or later; the rest of CloudKit goes back much further.

## Pitfalls

- Querying the default zone without first creating records, or using a `CKQuery` with a field that lacks a queryable index in the CloudKit schema — both yield empty results or errors. Mark fields queryable/sortable in the dashboard.
- Treating `recordName` as mutable: a `CKRecord.ID` is permanent. Generate stable IDs client-side so you can reference and dedupe records.
- Saving a parent and its `CKShare` in separate requests. Save the root record and its share together in one `modifyRecords` call so the share's hierarchy is consistent.
- Assuming a successful local write is durable in iCloud. Until `modifyRecords` returns success (or `CKSyncEngine` reports `sentRecordZoneChanges` with no `failedRecordSaves`), the change is not committed server-side.
- Forgetting that public-database writes require a `.userDiscoverable` or signed-in account and are subject to server-side security roles; anonymous users can read but not always write.

## References

- **Documentation:** [CKContainer](https://developer.apple.com/documentation/cloudkit/ckcontainer)
- **Documentation:** [CKSyncEngine](https://developer.apple.com/documentation/cloudkit/cksyncengine-5sie5)
- **Documentation:** [CKShare](https://developer.apple.com/documentation/cloudkit/ckshare)
- **Documentation:** [CKError.serverRecordChanged](https://developer.apple.com/documentation/cloudkit/ckerror/serverrecordchanged)
- **WWDC:** [Sync to iCloud with CKSyncEngine (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10188/)
- **Sample Code:** [CloudKit sync engine sample](https://github.com/apple/sample-cloudkit-sync-engine)
- **Sample Code:** [CloudKit sharing sample](https://github.com/apple/sample-cloudkit-sharing)

## See also

For app-managed persistence that mirrors to CloudKit automatically, see the SwiftData and Core Data skills. For delivering and handling the silent and visual notifications CloudKit subscriptions produce, see the user-notifications skill. For presenting share invitations and the share sheet, see the share-sheet skill.
