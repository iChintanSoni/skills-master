## CloudKit review checklist

- [ ] iCloud capability with CloudKit and a container is enabled, plus Push Notifications and Background Modes > Remote notifications.
- [ ] Every write path checks `accountStatus() == .available` and degrades gracefully when it is not.
- [ ] `.CKAccountChanged` is observed so the app reacts to sign-in/out.
- [ ] Records live in a custom `CKRecordZone` (not the default zone) when change tracking, atomic batches, or sharing are needed.
- [ ] Reads and writes use the async `records(matching:)` and `modifyRecords(saving:deleting:...)` APIs, not deprecated operations.
- [ ] `CKError.serverRecordChanged` is handled by merging onto `serverRecord` and retrying.
- [ ] Queryable/sortable fields are indexed in the CloudKit schema; queries do not assume the default zone is populated.
- [ ] A `CKDatabaseSubscription` (or `CKQuerySubscription`) is registered with `shouldSendContentAvailable`, and the push handler fetches deltas rather than reading the payload.
- [ ] Root record and its `CKShare` are saved together in one request; participants and permissions are configured.
- [ ] If using `CKSyncEngine`: `stateSerialization` is persisted on `stateUpdate`, pending batches are returned from the delegate, and `failedRecordSaves` are inspected after `sentRecordZoneChanges`.
- [ ] Sync is verified on a real device or Mac (not the simulator).
