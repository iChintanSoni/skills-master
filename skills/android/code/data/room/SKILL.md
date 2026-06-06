---
name: room
description: Covers Room persistence — @Entity, @Dao, @Database, queries returning Flow, relations and @Relation, type converters, @Transaction, migrations (auto and manual) and fallback, suspend DAO functions, and Room KMP. Use when implementing a local SQLite database with Jetpack Room, modelling entities with relations, reacting to data changes via Flow, handling schema migrations, or targeting Room KMP for shared Kotlin Multiplatform persistence.
globs:
  - "**/*.kt"
tags: [room, database, persistence, coroutines, flow]
x-skills-master:
  domain: android
  class: code
  category: data
  platforms: ["android", "large-screen"]
  requires: { "android": "16", "kotlin": "2.2" }
  pairs_with: []
  sources:
    - https://developer.android.com/training/data-storage/room
    - https://developer.android.com/training/data-storage/room/migrating-db-versions
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for Room whenever the app must store structured, relational data locally — search history, user-generated content, offline cache, or any dataset too large or too relational for DataStore/Preferences. Room is the right fit when you need SQL-level querying, reactive data streams via `Flow`, foreign-key integrity, or a migration story as the schema evolves. For simple key-value or typed preferences, consider DataStore instead (see the choosing-persistence overview skill).

## Core guidance

**Entities — modelling tables**
- Annotate the class with `@Entity`; every `@Entity` needs exactly one `@PrimaryKey`.
- Prefer `autoGenerate = true` on an `Int`/`Long` primary key for surrogate keys; use explicit string IDs only when they come from an external system.
- Use `@ColumnInfo(name = "snake_case")` to decouple Kotlin property names from DB column names — this insulates schema names from Kotlin refactors.
- Annotate non-primitive fields that Room cannot map natively with a `@TypeConverter`; register converters on `@Database(typeConverters = [...])`.
- Mark fields that should not be persisted with `@Ignore`; nested embedded objects use `@Embedded(prefix = "")`.

**DAOs — queries and mutations**
- Annotate the interface or abstract class with `@Dao`.
- Make all one-shot operations `suspend fun` so the caller decides the dispatcher; `@Query` returning `Flow<T>` is non-suspend — Room emits automatically whenever the underlying table changes.
- Use `@Insert(onConflict = OnConflictStrategy.REPLACE)` for upsert semantics (or the newer `@Upsert` annotation available in Room 2.5+).
- Annotate multi-statement operations (insert + update or multi-table reads) with `@Transaction` to run them atomically inside one SQLite transaction.
- Never access a DAO on the main thread — Room enforces this at runtime by default. Use `Dispatchers.IO` in the repository or rely on `suspend` propagating to the caller's coroutine context.

**Database — wiring it together**
- Annotate the abstract class with `@Database(entities = [...], version = N, exportSchema = true)` and extend `RoomDatabase`.
- Set `exportSchema = true` and commit the generated JSON schema files to source control — they are the basis for validated migrations.
- Expose DAOs as abstract properties or functions; never instantiate a DAO directly.
- Build the singleton via `Room.databaseBuilder(context, MyDatabase::class.java, "db-name").build()` and hold it in a DI module (Hilt `@Singleton`).
- Add `.fallbackToDestructiveMigration(from = intArrayOf(1))` only in development or for truly disposable data — in production, write explicit `Migration` objects.

**Relations — `@Relation` and `@Embedded`**
- Use `@Relation(parentColumn = "id", entityColumn = "owner_id")` inside a data class (the "POJO") returned from a `@Transaction` query; do not fetch relations manually in code.
- Wrap relation queries with `@Transaction` — Room executes two SELECTs (parent + children) and `@Transaction` ensures they read a consistent snapshot.
- For many-to-many, declare a join/cross-reference entity and use `@Relation` with a `Junction`.

**Type converters**
- Write a class with functions annotated `@TypeConverter`; each function converts one way (e.g. `Instant` → `Long` and back).
- Register on the database: `@Database(typeConverters = [InstantConverters::class])`.
- Keep converters simple and lossless — avoid serialising entire JSON blobs through a converter (prefer a dedicated column or a separate table).

**Migrations — keeping data alive**
- Increment `@Database(version = ...)` for every schema change.
- Write an explicit `Migration(from, to)` object with raw SQL for each version bump and add it to `.addMigrations(...)` on the builder.
- Auto-migrations (`@AutoMigration(from = N, to = M)`) handle simple additive changes (new columns with defaults, renamed tables via `@AutoMigration(spec = ...)`) without raw SQL — prefer them for straightforward alterations.
- Always test migrations with `MigrationTestHelper` from `room-testing` to avoid silent data corruption on real devices.

**Room KMP**
- In a Kotlin Multiplatform project, use `androidx.room:room-runtime` as a KMP library (available since Room 2.7). Annotate the common `@Database` class and DAOs in `commonMain`; supply the platform `RoomDatabase.Builder` via `expect/actual`.
- The KSP plugin must run in each source set; add `room.generateKotlin = true` in KSP arguments to emit Kotlin (not Java) implementation files.

```kotlin
// --- Type converter ---
class InstantConverters {
    @TypeConverter fun fromInstant(value: Instant?): Long? = value?.toEpochMilli()
    @TypeConverter fun toInstant(value: Long?): Instant? = value?.let(Instant::ofEpochMilli)
}

// --- Entity ---
@Entity(tableName = "notes")
data class NoteEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    @ColumnInfo(name = "title") val title: String,
    @ColumnInfo(name = "body") val body: String,
    @ColumnInfo(name = "created_at") val createdAt: Instant,
)

// --- DAO ---
@Dao
interface NoteDao {
    @Query("SELECT * FROM notes ORDER BY created_at DESC")
    fun observeAll(): Flow<List<NoteEntity>>          // non-suspend; emits on changes

    @Query("SELECT * FROM notes WHERE id = :id")
    suspend fun getById(id: Long): NoteEntity?

    @Upsert
    suspend fun upsert(note: NoteEntity): Long

    @Delete
    suspend fun delete(note: NoteEntity)
}

// --- Database ---
@Database(
    entities = [NoteEntity::class],
    version = 2,
    exportSchema = true,
    autoMigrations = [AutoMigration(from = 1, to = 2)],
)
@TypeConverters(InstantConverters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun noteDao(): NoteDao
}

// --- Hilt module ---
@Module @InstallIn(SingletonComponent::class)
object DatabaseModule {
    @Provides @Singleton
    fun provideDatabase(@ApplicationContext ctx: Context): AppDatabase =
        Room.databaseBuilder(ctx, AppDatabase::class.java, "app.db")
            .addMigrations(MIGRATION_2_3)   // explicit migration for version 3+
            .build()

    @Provides fun provideNoteDao(db: AppDatabase): NoteDao = db.noteDao()
}
```

## Platform notes

- **Large-screen / multi-window:** Multiple Activity windows can share the same database singleton without issue — the `RoomDatabase` is thread-safe. Prefer injecting it as a `@Singleton` via Hilt so all windows/processes share one connection pool.
- **WAL mode:** Room enables Write-Ahead Logging by default on API 16+, which allows concurrent reads while a write is in progress. Do not disable WAL unless targeting a scenario with extremely constrained storage.
- **Background execution:** Room requires a background thread for writes and non-Flow queries; with coroutines and `Dispatchers.IO` this is handled automatically. Avoid `allowMainThreadQueries()` outside of tests.
- **KMP targets:** Room KMP currently supports Android and JVM (desktop). iOS support uses SQLite via `NativeSQLiteDriver` (SQLiter under the hood); ship the appropriate driver via `expect/actual` in the platform source set.

## Pitfalls

- Returning a plain `List<T>` from a `@Query` instead of `Flow<List<T>>` — the one-shot suspend version only reads once and will not react to subsequent inserts or updates.
- Forgetting `@Transaction` on a `@Relation` query — without it, the parent and children SELECTs run independently and can return an inconsistent view if a write occurs between them.
- Calling `fallbackToDestructiveMigration()` unconditionally in production — this silently drops all user data when the version bumps without a matching migration. Restrict to dev builds or use `fallbackToDestructiveMigrationFrom(vararg startVersions)` for specific known-safe versions.
- Not exporting the schema (`exportSchema = false`) and then attempting to write auto-migrations — Room requires the schema JSON history to generate migration code.
- Registering `@TypeConverter` classes on the DAO or entity instead of on `@Database` — converters must be declared at the database level to be applied globally.
- Storing complex serialised blobs (JSON strings) in a single column via a type converter when the data is actually relational — use child entities and `@Relation` instead to keep queries efficient and indexable.
- Using `REPLACE` conflict strategy on an entity with foreign keys — `REPLACE` deletes the old row before inserting the new one, which can cascade delete child rows unexpectedly. Prefer `@Upsert` or an explicit check-then-update pattern.
- Holding a reference to a `Cursor` or raw `SupportSQLiteDatabase` after the enclosing `@Transaction` block ends — the cursor is closed when the transaction commits.
- In KMP projects, forgetting to add `room.generateKotlin = true` to the KSP arguments — without it, Room generates Java implementation files that will not compile for non-JVM targets.

## References

- **Documentation:** [Save data in a local database using Room](https://developer.android.com/training/data-storage/room)
- **Documentation:** [Migrating Room database versions](https://developer.android.com/training/data-storage/room/migrating-db-versions)

## See also

For choosing between Room, DataStore, and file-based storage, see the `choosing-persistence` overview skill. For wiring the database singleton and DAOs via Hilt, see `hilt-di`. For collecting `Flow` queries in a lifecycle-safe manner inside a ViewModel, see `state-flow` and `viewmodel`. For offline-first repository patterns built on top of Room, see `networking-layer`.
