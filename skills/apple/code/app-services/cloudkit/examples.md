## CloudKit examples

### Check account availability and react to changes

```swift
import CloudKit

func canUseCloud() async -> Bool {
    do {
        return try await CKContainer.default().accountStatus() == .available
    } catch {
        return false
    }
}

// Observe sign-in/out so the UI can refresh.
let token = NotificationCenter.default.addObserver(
    forName: .CKAccountChanged, object: nil, queue: .main
) { _ in
    Task { await reloadIfSignedIn() }
}
```

### Query records asynchronously

```swift
func fetchNotes(in db: CKDatabase, zoneID: CKRecordZone.ID) async throws -> [CKRecord] {
    let query = CKQuery(recordType: "Note",
                        predicate: NSPredicate(format: "isPinned == %@", NSNumber(value: true)))
    query.sortDescriptors = [NSSortDescriptor(key: "modifiedAt", ascending: false)]
    let (matches, _) = try await db.records(matching: query, inZoneWith: zoneID)
    return matches.compactMap { try? $0.1.get() }   // drop per-record failures
}
```

### Merge a server conflict and retry

```swift
func save(_ record: CKRecord, to db: CKDatabase) async throws {
    do {
        let result = try await db.modifyRecords(saving: [record], deleting: [],
                                                savePolicy: .ifServerRecordUnchanged)
        _ = try result.saveResults[record.recordID]?.get()
    } catch let error as CKError where error.code == .serverRecordChanged {
        guard let server = error.serverRecord else { throw error }
        server["title"] = record["title"]          // re-apply your edits onto the server copy
        try await save(server, to: db)              // retry with merged record
    }
}
```

### Set up a custom zone and database subscription for push

```swift
func bootstrapSync(_ db: CKDatabase) async throws {
    let zone = CKRecordZone(zoneName: "Notes")
    _ = try await db.modifyRecordZones(saving: [zone], deleting: [])

    let sub = CKDatabaseSubscription(subscriptionID: "notes-changes")
    let info = CKSubscription.NotificationInfo()
    info.shouldSendContentAvailable = true          // silent background push
    sub.notificationInfo = info
    _ = try await db.modifySubscriptions(saving: [sub], deleting: [])
}
```
