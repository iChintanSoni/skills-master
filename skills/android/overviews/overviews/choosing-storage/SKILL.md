---
name: choosing-storage
description: Decision router for local Android storage — Room, DataStore (Preferences or Proto), and files with kotlinx.serialization — by matching data shape, query needs, and migration cost. Use when designing a new data layer, deciding whether SharedPreferences is worth replacing, or choosing between Room and DataStore for a given data type.
tags: [storage, room, datastore, serialization, persistence]
x-skills-master:
  domain: android
  class: overview
  category: overviews
  platforms: ["android", "large-screen"]
  requires: { "android": "16", "kotlin": "2.2" }
  pairs_with: [room]
  sources:
    - https://developer.android.com/training/data-storage
    - https://developer.android.com/topic/libraries/architecture/datastore
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for this skill at the start of a feature or app when you need to decide where structured data lives on device. It applies when adding a first persistence layer, when a team is debating Room versus DataStore for a new entity type, when auditing `SharedPreferences` usage before migrating it, or when choosing a file format for documents and blobs. This skill routes the decision; the implementation details live in per-API code skills.

## Core guidance

There are four realistic options for local storage on modern Android. Match the option to the shape of your data, not to familiarity or habit.

### Room — relational, queryable, structured

Choose Room when data is naturally relational, when you need to filter, sort, paginate, or join across entities, or when multiple features share an overlapping schema. Key signals:

- Multi-entity data with foreign keys or many-to-many joins (orders, line items, products).
- Features that need SQL-level queries: search across columns, aggregations, range filters.
- Paging with `PagingSource` — Room generates the `PagingSource` for you.
- Data that is displayed in lists sorted or filtered by user-chosen criteria.
- Sync pipelines that need transactional writes (insert N rows atomically, then mark a flag).

Room generates type-safe DAO interfaces at compile time, validates SQL at build time, and exposes results as `Flow<List<T>>` that recompose Compose UIs automatically. Prefer it over raw SQLite for any relational use case.

**What Room is not** — it is heavy ceremony for a handful of scalar settings. Do not model a user-preference like `isDarkMode: Boolean` as a Room entity.

### DataStore — typed settings, user preferences, small config

Choose DataStore when you are storing a small, flat set of values that represent app or user state — not a list of domain objects. DataStore comes in two flavours:

- **Preferences DataStore** (`androidx.datastore:datastore-preferences`) — stores key-value pairs without a schema. Familiar to anyone coming from SharedPreferences but coroutine-native and process-safe. Best for simple toggles, sort orders, onboarding flags, last-selected tab.
- **Proto DataStore** (`androidx.datastore:datastore`) — stores a typed Protocol Buffer message. Best when settings grow complex enough to need nested structure, versioned migrations, or guaranteed type safety across schema changes. Requires a `.proto` schema and the protobuf Gradle plugin.

Both flavours write to disk atomically and expose data as `Flow<Preferences>` or `Flow<T>`, making them safe to observe from a coroutine or Compose. Neither supports relational queries; if you find yourself storing a `Set<String>` of IDs to do a join later, you have outgrown DataStore — move that data to Room.

### Files + kotlinx.serialization — documents and blobs

Choose flat files when the data is document-shaped (one self-contained JSON or binary payload per file), when the user might export or share the file, when the data is large or binary (images, audio, PDFs), or when you do not need to query inside the file.

- Use `kotlinx.serialization` (JSON or CBOR) for structured documents: serialise a `@Serializable` data class to a JSON file in the app's `filesDir` or `cacheDir`.
- Use `ContentResolver` and `MediaStore` for media files that should appear in the system gallery or be accessible to other apps.
- Use `android.content.Context.openFileOutput` / `openFileInput` for private binary blobs.
- For large files that benefit from streaming, prefer `BufferedOutputStream`/`BufferedInputStream` over loading the full byte array into memory.

Files carry no built-in query capability. If you ever need to search or filter across many document files by a field value, that is a signal to index those fields in Room instead and store the raw file as a blob or a path reference.

### SharedPreferences — do not start new work here

SharedPreferences is synchronous, holds data in memory across the process lifetime, and offers no coroutine or Flow integration. Avoid it for new code. The two migration paths are:

- **To Preferences DataStore** — use the `SharedPreferencesMigration` helper included in the DataStore library; it reads existing prefs on first access and copies them automatically.
- **To Room** — if the preference set has grown into a structured record, model it as a small Room entity or as a `@TypeConverted` field on an existing entity.

There is no reason to add new `SharedPreferences` usage in a Kotlin 2.2 / API-16 baseline codebase. Leave existing SharedPreferences in place only if touching it would introduce regression risk on an otherwise stable screen.

### Decision matrix

| Signal | Room | Preferences DataStore | Proto DataStore | Files |
|---|---|---|---|---|
| Relational data with joins | Yes | — | — | — |
| SQL queries, filters, sorts | Yes | — | — | — |
| Paginated lists | Yes | — | — | — |
| Transactional multi-row writes | Yes | — | — | — |
| Small flat settings / toggles | — | Yes | — | — |
| Settings with nested structure | — | — | Yes | — |
| Versioned settings schema | — | — | Yes | — |
| Document-shaped or exportable | — | — | — | Yes |
| Large binary / media | — | — | — | Yes |
| New SharedPreferences usage | Never | Prefer | Prefer | — |

**Recommended default for a new app:** start with Preferences DataStore for user settings and Room for domain data. Add Proto DataStore only when the settings schema outgrows key-value pairs. Reach for files when the data unit is a document or a blob.

## Platform notes

**Large screens and foldables** — storage choice does not change on large screens, but the data layer design does. Dual-pane layouts often display list and detail simultaneously, which means the Room query backing the list and the query backing the detail run concurrently. Design DAOs accordingly; avoid blocking queries on the main thread.

**Work with WorkManager** — background sync jobs (WorkManager workers) should write to Room or DataStore; never pass large data payloads through `Data` (the 10 KB limit applies). Pass only IDs and let the worker fetch from the store.

**Encrypted storage** — `EncryptedSharedPreferences` (Jetpack Security) is the legacy encrypted option. For new work, use the `EncryptedFile` API for file blobs, or enable SQLCipher / Room's `SupportFactory` for encrypted Room databases. DataStore does not yet have a first-party encrypted implementation; wrap writes manually with the Jetpack Security `MasterKey` + `EncryptedFile` if encryption is required for preferences.

**Testing** — Room ships an in-memory database builder (`Room.inMemoryDatabaseBuilder`) useful in unit and instrumentation tests. DataStore exposes a `DataStore<Preferences>` constructor that accepts a `TestCoroutineScope` and an in-memory `InMemoryDataStore` in the test artifact. File-based tests should use a temporary directory created from `Context.filesDir` in an instrumented test or a `TemporaryFolder` JUnit rule.

## Pitfalls

- **Storing lists in DataStore** — `Preferences.Key<Set<String>>` works for a flat set of primitives, but storing serialised JSON strings in a Datastore key is a code smell. Once you need list semantics on domain objects, move to Room.
- **Blocking database calls on the main thread** — Room will throw a `IllegalStateException` if you call a `suspend` DAO function from the main thread without a coroutine. Always collect Room Flows in a `ViewModel` with `viewModelScope` and expose state to Compose via `StateFlow`.
- **One DataStore per file** — creating multiple `DataStore` instances for the same file causes corruption. Create a single instance per file (typically via a `Singleton` in a DI module) and share it via injection.
- **Treating files as a query target** — iterating all JSON files in a directory to filter by a field inside each file is O(n) disk I/O. Index searchable fields in Room; keep files as opaque blobs referenced by a Room row.
- **Forgetting migrations** — Room requires a migration strategy (`addMigrations(...)` or `fallbackToDestructiveMigration()`) when the schema changes. Proto DataStore requires updating the `.proto` schema and writing a migration transform. Omitting both causes crashes or data loss on update.
- **Over-engineering with Proto DataStore** — if settings are fewer than ~10 flat fields with primitive types, Proto DataStore's `.proto` schema and build plugin overhead is not worth it. Stay on Preferences DataStore.
- **SharedPreferences in a coroutine context** — calling `SharedPreferences.edit().apply()` from a coroutine does not make it coroutine-safe; it still writes on a background thread managed by the framework, with no backpressure or Flow integration. Migrate rather than wrap.

## References

- **Documentation:** [Data and file storage overview](https://developer.android.com/training/data-storage)
- **Documentation:** [DataStore](https://developer.android.com/topic/libraries/architecture/datastore)

## See also

For implementing Room entities, DAOs, and migrations, see `room` (Android code skill). For DataStore setup with DI and Flow collection, see `datastore`. For Paging with Room-backed `PagingSource`, see `paging`. For encrypted file storage patterns, see `keychain-security` on the Apple side as a conceptual reference, or the Jetpack Security documentation directly.
