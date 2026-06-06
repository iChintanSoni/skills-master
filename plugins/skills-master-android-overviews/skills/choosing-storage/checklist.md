## Storage decision checklist

### Choosing the right store

- [ ] Data contains foreign keys, joins, or requires SQL queries → use Room.
- [ ] Data is a list of domain objects that will be filtered, sorted, or paginated → use Room.
- [ ] Data is a small flat set of user/app settings (fewer than ~15 scalar values) → use Preferences DataStore.
- [ ] Settings have grown nested, versioned, or structurally complex → use Proto DataStore.
- [ ] Data is a document, a large blob, or content the user might export or share → use files + kotlinx.serialization.
- [ ] Data is a photo, audio file, or other binary media → use files (filesDir/cacheDir or MediaStore).
- [ ] No new SharedPreferences usage has been introduced; existing usages have a migration plan.

### Room setup

- [ ] A single `RoomDatabase` instance is provided as a singleton via DI — not instantiated per use.
- [ ] All DAO functions are `suspend` or return `Flow`; no synchronous queries on the main thread.
- [ ] A migration strategy is defined: either `addMigrations(...)` for incremental migrations or `fallbackToDestructiveMigration()` (explicitly accepted for dev/test only).
- [ ] Schema changes are accompanied by a new migration and a version bump in `@Database(version = ...)`.
- [ ] Room Flows are collected with `collectAsStateWithLifecycle()` in Compose, not `collectAsState()`, to avoid background collection.
- [ ] Large blob columns (images, serialized JSON) are stored as file paths in Room, not as raw byte arrays.

### DataStore setup

- [ ] A single `DataStore` instance per file is provided via DI — not created per ViewModel call.
- [ ] DataStore is never accessed from the main thread without a coroutine (`suspend` or Flow collection only).
- [ ] `SharedPreferencesMigration` is included in `produceMigrations` if replacing an existing SharedPreferences file.
- [ ] Proto DataStore `.proto` schema and protobuf Gradle plugin are configured only if flat Preferences DataStore is genuinely insufficient.
- [ ] DataStore keys are defined as compile-time constants (`intPreferencesKey`, `booleanPreferencesKey`, etc.), not as raw strings.

### Files + kotlinx.serialization setup

- [ ] Files that must survive cache eviction are in `filesDir`, not `cacheDir`.
- [ ] Large binary content uses a streaming API (`BufferedOutputStream`) rather than loading the full byte array into memory.
- [ ] `@Serializable` data classes are used with `kotlinx.serialization`; no manual JSON construction.
- [ ] Each document file is identified by a stable key (UUID or database row ID) that is also stored in Room for indexing and listing.
- [ ] Searchable fields from document files are indexed in Room, not scanned file-by-file at query time.

### Testing

- [ ] Room databases in tests use `Room.inMemoryDatabaseBuilder` with `allowMainThreadQueries()` scoped to test only.
- [ ] DataStore in tests uses a `TestCoroutineScope` or an in-memory DataStore from the test artifact.
- [ ] File-based tests write to a temporary directory (`TemporaryFolder` rule or a test-scoped `Context.filesDir`) that is cleaned up after each test.
- [ ] Migration tests confirm that each Room schema version migrates correctly without data loss using `MigrationTestHelper`.

### General

- [ ] No storage logic lives in a Composable function body; all reads and writes go through a ViewModel or a Repository.
- [ ] Encryption requirements are identified early: `EncryptedFile` for sensitive blobs, `SupportFactory` for Room, or a key-wrapped DataStore for preferences.
- [ ] The storage choice is documented in the module's architecture decision record so future contributors understand why a given store was selected.
