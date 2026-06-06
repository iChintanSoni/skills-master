## Scenario 1: New social app — deciding where user profiles, posts, and draft settings live

A team is building a social reading app. Users follow other readers, save posts to a reading list, and configure notification and display preferences. There is no server sync in v1; everything lives on device.

**Data inventory:**

- `User` (id, displayName, avatarUri) — one row per followed account, up to hundreds
- `Post` (id, userId FK, title, bodyMarkdown, savedAt) — potentially thousands of rows
- `ReadingListEntry` (postId FK, addedAt) — join table
- Notification preferences: `notifyNewFollowerPost: Boolean`, `quietHoursStart: Int`, `quietHoursEnd: Int`
- Display preferences: `fontSize: Float`, `theme: String` (light/dark/system)

**Decision:**

- `User`, `Post`, `ReadingListEntry` → **Room**. There are foreign keys, the reading list requires a join, and the app needs to query posts sorted by `savedAt` or filtered by `userId`. Room generates a type-safe DAO and a `Flow<List<Post>>` that Compose collects automatically.
- Notification and display preferences → **Preferences DataStore**. These are five flat scalars — no joins, no filtering, no list semantics. A `DataStore<Preferences>` injected as a singleton is sufficient. The team avoids SharedPreferences because they want `Flow`-based observation and process-safe writes.

**How they wire it:**

```kotlin
// Room: one database, two DAOs
@Database(entities = [User::class, Post::class, ReadingListEntry::class], version = 1)
abstract class AppDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
    abstract fun postDao(): PostDao
}

// DataStore: single instance via DI module
val Context.preferencesStore: DataStore<Preferences> by preferencesDataStore(name = "user_prefs")

val FONT_SIZE = floatPreferencesKey("font_size")
val THEME     = stringPreferencesKey("theme")
```

Both are injected into the relevant ViewModels. The Room DAO returns `Flow<List<Post>>` collected with `collectAsStateWithLifecycle()` in Compose; the DataStore Flow feeds a `SettingsUiState` in a separate `SettingsViewModel`.

---

## Scenario 2: Offline-capable forms app — deciding how to persist draft documents

A construction inspection app lets field workers fill in inspection reports offline. Each report is a structured form with nested sections, photos, and a GPS coordinate. Reports are submitted when connectivity returns.

**Data inventory:**

- Each draft report is ~50 KB of structured JSON with nested sections
- Photos are JPEGs captured from the camera (1–5 MB each)
- A list of all drafts (id, title, lastModifiedAt, status) must be shown in a sortable list

**Decision:**

- **Photos** → **files** in `filesDir`. Large binary blobs belong on the filesystem, not in a database. Each photo is saved as a JPEG by file name, keyed by a UUID.
- **Report list metadata** (id, title, lastModifiedAt, status, photoFilePaths) → **Room**. The inspector sorts and filters the list; Room provides the SQL needed for `ORDER BY lastModifiedAt DESC` and `WHERE status = 'draft'`. Photo paths are stored as a `@TypeConverted` `List<String>` column.
- **Draft body JSON** → **files + kotlinx.serialization**. The full nested report JSON is a document, not relational. It is stored as a `.json` file per report (keyed by report ID) next to the photos. Room holds only the path; the ViewModel fetches the full JSON on demand.

```kotlin
// kotlinx.serialization for the document body
@Serializable
data class InspectionReport(val sections: List<Section>, val gpsCoord: GpsCoord, ...)

suspend fun saveDraft(report: InspectionReport, id: String, filesDir: File) {
    val file = File(filesDir, "$id.json")
    file.writeText(Json.encodeToString(report))
}
```

This avoids inflating multiple MB of JSON into Room's query engine and keeps the database fast for the list view.

---

## Scenario 3: Migrating SharedPreferences to DataStore in an existing app

An established app stores twelve settings keys in SharedPreferences spread across three `getSharedPreferences` call sites. A new requirement demands observing theme changes in real time using a Flow without polling.

**Assessment:**

- All twelve settings are flat scalars (booleans, strings, ints) — no nesting, no list semantics.
- The largest group has six keys in one file, the others two and four.

**Decision:** migrate to **Preferences DataStore** using the built-in `SharedPreferencesMigration`. Proto DataStore is unnecessary — the schema is flat and stable.

**Migration path:**

1. Create a single `DataStore<Preferences>` per existing SharedPreferences file name, passing `SharedPreferencesMigration(context, "settings_prefs")` in the `produceMigrations` block.
2. On first DataStore read, the migration copies all existing keys automatically. No manual copy loop needed.
3. Replace all `prefs.getBoolean(KEY, false)` call sites with `dataStore.data.map { it[KEY] ?: false }` and collect the Flow in the ViewModel.
4. Remove the old `SharedPreferences` injection from the DI graph once all call sites are migrated.

```kotlin
val Context.settingsStore: DataStore<Preferences> by preferencesDataStore(
    name = "settings_prefs",
    produceMigrations = { context ->
        listOf(SharedPreferencesMigration(context, "settings_prefs"))
    }
)
```

The migration is transparent to users — their saved settings carry over automatically on first launch after the update.
