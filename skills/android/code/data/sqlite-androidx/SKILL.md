---
name: sqlite-androidx
description: AndroidX SQLite and raw SQL access on Android — Use when you need direct SQLite control below Room, including the androidx.sqlite driver API, bundled SQLite, raw SQL execution, and tradeoffs vs Room.
globs:
  - "**/*.kt"
tags: [sqlite, database, data, androidx]
x-skills-master:
  domain: android
  class: code
  category: data
  platforms: ["android", "large-screen"]
  requires: {android: "16", kotlin: "2.2"}
  pairs_with: []
  sources:
    - https://developer.android.com/training/data-storage/sqlite
    - https://developer.android.com/jetpack/androidx/releases/sqlite
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for raw AndroidX SQLite when:

- You are migrating a legacy `SQLiteOpenHelper` codebase and cannot yet adopt Room.
- You need full control over SQL — custom triggers, virtual tables (FTS5, R*Tree), `ATTACH DATABASE`, or `PRAGMA` sequences not supported by Room's generated code.
- You ship a pre-populated, read-only database bundled as an asset and Room's migration machinery is unwanted overhead.
- You are writing a lower-level data layer or library that other components consume, and you want to avoid pulling in Room's annotation processor.
- You need to target the **bundled SQLite** variant (androidx.sqlite.bundled) to guarantee a specific SQLite version regardless of the device's system library.

Prefer Room in all other cases. Room adds compile-time query verification, automatic migrations, coroutine/Flow integration, and LiveData support at essentially no runtime cost.

## Core guidance

**Driver selection**

- Use `BundledSQLiteDriver` when you need SQLite 3.x features unavailable on older API levels (e.g. `STRICT` tables, `RETURNING` clause). Add `implementation("androidx.sqlite:sqlite-bundled:<version>")`.
- Use `AndroidSQLiteDriver` for the system SQLite — lighter binary, sufficient for API 26+.
- Both implement `SQLiteDriver`, so you can swap without changing query code.

**Opening and managing connections**

- Prefer `SQLiteConnection` (from the `androidx.sqlite` driver API) over `SQLiteDatabase` for new code; it is lifecycle-safe and closes automatically via `use {}`.
- Always open connections on a background dispatcher — never on the main thread.
- Use `connection.execSQL(...)` for DDL and DML without results; use `connection.prepare(sql).use { stmt -> ... }` for queries.

**Executing SQL safely**

- Bind all user-supplied values with positional parameters (`?`). Never concatenate strings into SQL.
- Call `statement.bindText(index, value)` / `bindLong` / `bindDouble` / `bindBlob` / `bindNull` — indices are 1-based.
- Step through results with `statement.step()` returning `true` while rows remain; read columns via `statement.getText(0)`, `getLong(1)`, etc. (0-based column indices).

**Transactions**

- Wrap multi-statement writes in explicit transactions: `connection.execSQL("BEGIN IMMEDIATE")` … `COMMIT` or `ROLLBACK` on exception.
- For read workloads on WAL-mode databases, `BEGIN DEFERRED` allows concurrent readers.

**Bundled SQLite setup**

- Add the `androidx.sqlite.bundled` artifact and use `BundledSQLiteDriver` — no extra permissions or native `.so` management required; the library ships a prebuilt AAR.
- Enable WAL mode and set `synchronous = NORMAL` after opening for best write throughput on bundled builds.

**Pre-populated databases**

- Copy the asset to the app's database directory on first launch, then open it read-only or read-write as needed.
- Check a version sentinel (e.g. a `user_version` PRAGMA or a metadata table) before copying to avoid overwriting user data on upgrade.

```kotlin
import androidx.sqlite.SQLiteConnection
import androidx.sqlite.bundled.BundledSQLiteDriver
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

data class Product(val id: Long, val name: String, val price: Double)

class ProductStore(private val dbPath: String) {

    private val driver = BundledSQLiteDriver()

    suspend fun initialize() = withContext(Dispatchers.IO) {
        driver.open(dbPath).use { conn ->
            conn.execSQL("PRAGMA journal_mode=WAL")
            conn.execSQL("""
                CREATE TABLE IF NOT EXISTS products (
                    id    INTEGER PRIMARY KEY,
                    name  TEXT    NOT NULL,
                    price REAL    NOT NULL
                )
            """.trimIndent())
        }
    }

    suspend fun insertProduct(name: String, price: Double) = withContext(Dispatchers.IO) {
        driver.open(dbPath).use { conn ->
            conn.execSQL("BEGIN IMMEDIATE")
            try {
                conn.prepare("INSERT INTO products(name, price) VALUES (?, ?)").use { stmt ->
                    stmt.bindText(1, name)
                    stmt.bindDouble(2, price)
                    stmt.step()
                }
                conn.execSQL("COMMIT")
            } catch (e: Exception) {
                conn.execSQL("ROLLBACK")
                throw e
            }
        }
    }

    suspend fun queryAll(): List<Product> = withContext(Dispatchers.IO) {
        driver.open(dbPath).use { conn ->
            conn.prepare("SELECT id, name, price FROM products ORDER BY name").use { stmt ->
                buildList {
                    while (stmt.step()) {
                        add(Product(stmt.getLong(0), stmt.getText(1), stmt.getDouble(2)))
                    }
                }
            }
        }
    }
}
```

**Flow / reactive reads**

- The driver API is synchronous. Wrap query calls in `flow { emit(queryAll()) }` combined with `conflatedBroadcastChannel` or a `MutableStateFlow` that you update after each write, rather than polling.
- For reactive data with SQLite as backend, strongly consider Room — it provides `@Query` returning `Flow<List<T>>` with automatic invalidation.

**WAL and PRAGMA best practices**

- Enable `PRAGMA journal_mode=WAL` once on database creation; it persists.
- Set `PRAGMA foreign_keys=ON` per connection — it does not persist across connections.
- Avoid `PRAGMA synchronous=OFF` in production; prefer `NORMAL` for the performance/durability balance.

## Platform notes

**Large-screen / multi-window**

- Multiple Activity instances can run concurrently on large screens. Do not hold a single static `SQLiteConnection` — connections are not thread-safe. Use a connection pool or open/close per operation on a serial coroutine dispatcher.
- On ChromeOS, the database path from `Context.getDatabasePath()` is correct; no additional path handling is required.

**API level considerations**

- `BundledSQLiteDriver` works from API 16 and packages its own SQLite, bypassing system library quirks seen on older OEMs.
- `AndroidSQLiteDriver` delegates to the framework's `android.database.sqlite` classes; behavior differences exist below API 26 (e.g. WAL concurrency limits).
- The `androidx.sqlite` driver layer was stabilized in androidx.sqlite 2.5.x; prefer that or later.

**Assets database**

- Use `Context.assets.open("mydb.db")` to copy; close the stream and the destination `FileOutputStream` in `finally` blocks or use Kotlin's `use {}`.
- Do not open the asset stream and an `SQLiteConnection` to the same path simultaneously.

## Pitfalls

- **String interpolation in SQL** — always use `?` placeholders. Interpolating user input is a SQL injection vector.
- **Opening connections on the main thread** — `SQLiteDriver.open()` performs I/O. Always dispatch to `Dispatchers.IO` or a dedicated database dispatcher.
- **Forgetting `PRAGMA foreign_keys=ON`** — the default is OFF per SQLite spec; this surprises developers coming from other databases.
- **Holding connections open indefinitely** — connection objects hold native resources. Always close via `use {}` or explicit `.close()`.
- **Mismatched bind/column indices** — bind parameters are 1-based; column reads are 0-based. Mixing these up causes silent data corruption or crashes.
- **Skipping WAL mode** — the default rollback journal serialises all reads and writes. Enable WAL for any concurrent workload.
- **Not versioning pre-populated databases** — shipping an updated asset without a version check overwrites user data on reinstall or upgrade.
- **Using `execSQL` for queries** — `execSQL` discards result sets; always use `prepare().use { stmt -> stmt.step() }` to read data.

## References

- **Documentation:** [Save data using SQLite](https://developer.android.com/training/data-storage/sqlite)
- **Release notes:** [AndroidX SQLite releases](https://developer.android.com/jetpack/androidx/releases/sqlite)

## See also

The `room` skill covers the recommended ORM layer built on top of SQLite for most persistence needs. For key-value and preference storage without SQL, see the `datastore` skill. For encrypted databases, pair this skill with SQLCipher, which implements the same `SQLiteDriver` interface.
