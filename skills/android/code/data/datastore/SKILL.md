---
name: datastore
description: Covers Jetpack DataStore for persistent key-value and typed proto storage — Preferences DataStore, Proto DataStore, reading preferences as a Flow, edit transactions, error handling, and migrating from SharedPreferences. Use when replacing SharedPreferences, persisting typed user settings, or streaming preference changes reactively in an Android app.
globs:
  - "**/*.kt"
tags: [android, datastore, preferences, persistence, flow]
x-skills-master:
  domain: android
  class: code
  category: data
  platforms: ["android", "large-screen"]
  requires: {android: "16", kotlin: "2.2"}
  pairs_with: []
  sources:
    - https://developer.android.com/topic/libraries/architecture/datastore
    - https://developer.android.com/codelabs/android-proto-datastore
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Use this skill whenever you need to persist small amounts of data on device — user preferences, onboarding flags, theme selections, session tokens, or feature toggles. DataStore is the official replacement for `SharedPreferences`. Its asynchronous, Flow-based API eliminates the StrictMode violations, ANRs, and inconsistent reads that plagued SharedPreferences.

Choose **Preferences DataStore** when your data is a flat set of typed key-value pairs and you do not need a schema. Choose **Proto DataStore** when you want a strongly typed schema (via Protocol Buffers), guaranteed migration safety, or nested objects. Both variants expose reads as a `Flow` and writes as a suspend function — they are first-class coroutine citizens.

Do not use DataStore for large datasets or relational data; use Room instead.

## Core guidance

### Add dependencies

```kotlin
// build.gradle.kts — Preferences DataStore
implementation("androidx.datastore:datastore-preferences:1.1.2")

// Proto DataStore (in addition to a proto-generated class)
implementation("androidx.datastore:datastore:1.1.2")
```

### Preferences DataStore

- Create exactly **one** `DataStore<Preferences>` instance per file path, application-wide. Use the `by preferencesDataStore` property delegate at the top level of a file — not inside a class — to guarantee singleton semantics.
- Define keys outside of functions to avoid recreating them per call.
- Read with `dataStore.data` (a `Flow<Preferences>`). Transform or filter with standard Flow operators.
- Write with `dataStore.edit { prefs -> prefs[KEY] = value }` — `edit` is a suspend function that applies atomically.
- The `data` Flow emits the current snapshot immediately on collection, then re-emits whenever any preference changes. Use `map` to project to the type you care about.

```kotlin
// AppPreferences.kt  — singleton delegate
private val Context.dataStore: DataStore<Preferences>
        by preferencesDataStore(name = "app_prefs")

// Key definitions
private object PrefKeys {
    val THEME          = stringPreferencesKey("theme")
    val NOTIFICATIONS  = booleanPreferencesKey("notifications_enabled")
    val LAUNCH_COUNT   = intPreferencesKey("launch_count")
}

// Repository — inject Context (application context only)
class AppPreferencesRepository(private val dataStore: DataStore<Preferences>) {

    // Typed read — emits immediately and on every change
    val themeFlow: Flow<String> = dataStore.data
        .catch { cause ->
            // dataStore.data throws IOException on disk errors; emit defaults
            if (cause is IOException) emit(emptyPreferences())
            else throw cause
        }
        .map { prefs -> prefs[PrefKeys.THEME] ?: "system" }

    val notificationsEnabled: Flow<Boolean> = dataStore.data
        .catch { if (it is IOException) emit(emptyPreferences()) else throw it }
        .map { it[PrefKeys.NOTIFICATIONS] ?: true }

    // Atomic write
    suspend fun setTheme(theme: String) {
        dataStore.edit { prefs -> prefs[PrefKeys.THEME] = theme }
    }

    // Read-modify-write in a single transaction
    suspend fun incrementLaunchCount() {
        dataStore.edit { prefs ->
            prefs[PrefKeys.LAUNCH_COUNT] = (prefs[PrefKeys.LAUNCH_COUNT] ?: 0) + 1
        }
    }
}
```

### Proto DataStore

- Define your schema in a `.proto` file; the Protobuf plugin generates a Kotlin class (e.g. `UserSettings`).
- Create a `Serializer<T>` that implements `readFrom` and `writeTo`, plus a `defaultValue`.
- Instantiate via `dataStore<T>(fileName, serializer)` at the application Context level with the same singleton pattern.
- Update with `dataStore.updateData { current -> current.toBuilder().setFoo(x).build() }` — returns the new value and applies atomically.
- Prefer Proto DataStore when you have nested structures, versioning requirements, or want compile-time type safety on field names.

### Migrating from SharedPreferences

- Pass a `SharedPreferencesMigration` to the `dataStore` delegate to automatically copy existing SharedPreferences values on first access.
- The migration runs once, atomically, before the first `data` emission. After migration the original SharedPreferences file is **not** deleted automatically — remove it yourself if desired.

```kotlin
private val Context.dataStore by preferencesDataStore(
    name = "app_prefs",
    produceMigrations = { context ->
        listOf(
            SharedPreferencesMigration(
                context,
                sharedPreferencesName = "legacy_prefs",
                keysToMigrate = setOf("theme", "notifications_enabled"),
            )
        )
    }
)
```

### Injecting DataStore with Hilt

- Bind `DataStore<Preferences>` in a `@Singleton` Hilt module so every repository receives the same instance.
- Never pass `Activity` context to a DataStore provider — always application context.

### Reading in a ViewModel

- Collect `Flow<T>` from the repository inside `viewModelScope` using `stateIn` to convert to `StateFlow` for the UI.
- Prefer `SharingStarted.WhileSubscribed(5_000)` to keep the flow alive briefly across configuration change, avoiding a redundant disk read.

## Platform notes

- DataStore writes are **main-safe** — `edit` and `updateData` dispatch I/O internally; do not wrap them in `withContext(Dispatchers.IO)`.
- On large-screen (tablet/foldable) configurations the same DataStore instance is shared across split-screen windows because the process is shared. Preferences changes are reflected in all windows simultaneously via the Flow — no extra coordination needed.
- DataStore uses the file system, not a SQLite database. Backup rules (`android:allowBackup`) apply to the `datastore/` directory under your app's files directory; add `<exclude domain="file" path="datastore/" />` in your backup rules if the data is device-specific.
- `DataStore` is not thread-safe for concurrent `edit` calls from multiple coroutines: while calls are serialized internally, callers must not cache a `Preferences` reference across `edit` lambda boundaries.
- DataStore is process-local. If you use multiple processes (e.g. `:remote` service), use `MultiProcessDataStore` from the `datastore-multiprocess` artifact instead.

## Pitfalls

- **Multiple instances for the same file.** Creating two `DataStore` instances pointing to the same file path causes data corruption. The `by preferencesDataStore` delegate enforces the singleton per-`Context`; do not use `PreferenceDataStoreFactory.create` ad-hoc inside functions.
- **Ignoring IOException.** The `data` Flow throws `IOException` on disk read failures. Not catching it causes the collector to crash. Always add a `.catch` operator that emits `emptyPreferences()` (or your proto default) for `IOException` and rethrows everything else.
- **Using runBlocking in production.** Calling `runBlocking { dataStore.data.first() }` on the main thread defeats the purpose of DataStore and risks ANRs. Collect from a coroutine scope only.
- **Reading SharedPreferences after migration.** Once `SharedPreferencesMigration` has run, the migrated keys are locked in DataStore. Reading the legacy SharedPreferences afterward gives stale or empty values — transition all code to DataStore before shipping.
- **Storing large blobs.** DataStore is not designed for binary assets or large serialized objects. It writes the entire Preferences/proto snapshot on every edit; large payloads degrade write performance. Use Room or a file for anything beyond a few kilobytes.
- **Leaking Activity context.** DataStore provider functions must use `applicationContext`. Passing an Activity context as the receiver of `preferencesDataStore` causes a memory leak and may produce multiple instances.
- **Not using `stateIn` for UI.** Collecting `Flow` directly in a composable via `collectAsStateWithLifecycle` works but re-triggers a disk read on every recomposition restart. Convert to `StateFlow` with `stateIn` in the ViewModel so the latest value is always immediately available.

## References

- **Documentation:** [DataStore — Android Developers](https://developer.android.com/topic/libraries/architecture/datastore)
- **Codelab:** [Android Proto DataStore — Android Developers Codelabs](https://developer.android.com/codelabs/android-proto-datastore)

## See also

Pair this skill with `kotlin-flow` for operators used when transforming `dataStore.data` streams. For larger relational datasets that outgrow DataStore see `room`. For dependency injection wiring of the `DataStore` singleton see `hilt-di`. For background work that reads or writes preferences outside a ViewModel lifecycle see `kotlin-coroutines`.
