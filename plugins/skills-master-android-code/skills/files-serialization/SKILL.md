---
name: files-serialization
description: Covers app-specific file I/O, cache vs files directory, streaming large files, and persisting structured data with kotlinx.serialization to disk. Use when you need lightweight structured persistence without a full database, or when storing binary/text blobs in internal storage.
---

## When to use

Use file-based persistence when your data is:

- A single structured object or a small list that rarely changes schema (settings snapshot, cached API response, export bundle).
- A binary blob, image, or document that a database BLOB column would bloat.
- A large sequential dataset that benefits from streaming reads/writes rather than random-access queries.
- Temporary data that should be evicted under storage pressure (cache dir) rather than preserved indefinitely.

Skip files in favor of Room or DataStore when you need indexed queries, reactive observation of individual fields, or multi-process consistency.

## Core guidance

### Choosing the right directory

- **`context.filesDir`** — internal, private, never cleared by the system. Use for data the user would lose if deleted.
- **`context.cacheDir`** — internal, private, cleared by the system when storage is low. Use for derived or re-fetchable data.
- **`context.getExternalFilesDir(type)`** — external storage scoped to your app; survives uninstall only if the user explicitly saves it. Requires `READ_EXTERNAL_STORAGE` only on API < 19.
- Never construct paths by string concatenation. Use `File(dir, name)` or `Path` APIs.
- Prefer `Context.openFileOutput` / `openFileInput` for single files; use `filesDir` + `File` for hierarchical layouts.

### Structured data with kotlinx.serialization

- Add `org.jetbrains.kotlinx:kotlinx-serialization-json` and the Kotlin serialization plugin to your build.
- Annotate data classes with `@Serializable` — no reflection at runtime, KSP-generated code only.
- Decode/encode via `Json { ignoreUnknownKeys = true }` so adding new fields to the model never breaks existing files.
- For large payloads, prefer `Json.decodeFromStream` / `encodeToStream` so the full JSON string is never held in memory.

### Streaming large files

- Always wrap streams in `bufferedReader()` / `bufferedWriter()` — the default 8 KB buffer avoids per-byte syscalls.
- Use `use { }` (Kotlin's `Closeable.use`) to guarantee streams are closed even on exceptions.
- Perform all I/O on `Dispatchers.IO`; never block the main thread.
- For incremental writes (logs, exports), open in append mode: `FileOutputStream(file, true)`.

### Atomic writes

- Write to a temp file in the same directory, then `renameTo(target)` — a single rename is atomic on most filesystems and prevents corrupt half-written files from surviving a crash.

```kotlin
@Serializable
data class UserPrefs(
    val theme: String = "system",
    val notificationsEnabled: Boolean = true,
    val lastSyncMs: Long = 0L,
)

private val json = Json { ignoreUnknownKeys = true; prettyPrint = false }

suspend fun Context.savePrefs(prefs: UserPrefs) = withContext(Dispatchers.IO) {
    val target = File(filesDir, "user_prefs.json")
    val tmp = File(filesDir, "user_prefs.json.tmp")
    tmp.outputStream().buffered().use { out ->
        json.encodeToStream(prefs, out)
    }
    tmp.renameTo(target)   // atomic on ext4 / F2FS
}

suspend fun Context.loadPrefs(): UserPrefs = withContext(Dispatchers.IO) {
    val file = File(filesDir, "user_prefs.json")
    if (!file.exists()) return@withContext UserPrefs()
    file.inputStream().buffered().use { input ->
        json.decodeFromStream(input)
    }
}
```

### Cache management

- Store re-fetchable thumbnails and decoded responses in `cacheDir`. Set a size cap via `DiskLruCache` or Coil/OkHttp's built-in cache rather than unbounded growth.
- Query `context.cacheDir.totalSpace` and `cacheDir.freeSpace` before writing large files; handle `IOException` when space is exhausted.

### File I/O and large screens

- On large-screen devices (tablets, foldables), the app may be visible to the user while a background coroutine writes. Communicate progress via `StateFlow` rather than blocking the UI.
- Avoid `context.openFileOutput(name, MODE_WORLD_READABLE)` — it was deprecated in API 17 and raises `SecurityException` on modern releases.

## Platform notes

- **API 16+**: `filesDir`, `cacheDir`, and `getExternalFilesDir` are all available. No permissions needed for internal storage.
- **API 26+**: Use `java.nio.file.Path` and `Files` for atomic moves (`Files.move(tmp, target, ATOMIC_MOVE)`) — more reliable than `File.renameTo` across filesystems.
- **API 29+ (Scoped Storage)**: External storage access is scoped. For sharing files with other apps, use `FileProvider` or the MediaStore API instead of raw external paths.
- **Large-screen / multi-window**: Multiple windows may share the same process. Coroutine-based I/O on `Dispatchers.IO` is safe across all window configurations.
- **kotlinx.serialization** requires the `kotlin("plugin.serialization")` Gradle plugin applied to the module — not just the runtime dependency.

## Pitfalls

- **Reading on the main thread** — even a small file read can ANR on slow storage. Always dispatch to `Dispatchers.IO`.
- **Skipping `ignoreUnknownKeys`** — adding a field to a serialized class and deploying an update will throw `SerializationException` on devices that load an old file unless you set `ignoreUnknownKeys = true`.
- **Using `MODE_PRIVATE` with `openFileOutput` then manually deleting and recreating** — prefer `File` APIs directly for predictable path control.
- **Unbounded cache growth** — writing to `cacheDir` without eviction logic can fill the device; the system evicts files only under extreme pressure.
- **`File.renameTo` across mount points** — on some devices, `cacheDir` and `filesDir` may be on different filesystems; an API 26+ `Files.move(ATOMIC_MOVE)` throws a descriptive error instead of silently returning `false`.
- **Storing sensitive data unencrypted** — internal storage is private to your app but not encrypted. For credentials or PII, use `EncryptedFile` from Jetpack Security Crypto instead of plain `FileOutputStream`.
- **Mixing `@Serializable` with polymorphism** without registering a `SerializersModule` — sealed hierarchies require explicit registration or `@JsonClassDiscriminator`.

## References

- **Documentation:** [App-specific storage — Android Developers](https://developer.android.com/training/data-storage/app-specific)
- **Documentation:** [kotlinx.serialization — Kotlin](https://kotlinlang.org/docs/serialization.html)
- **Library:** [kotlinx.serialization GitHub](https://github.com/Kotlin/kotlinx.serialization)

## See also

- `core-data` (Apple analog) for contrast with a full ORM approach.
- `swiftdata-modeling` is the Apple equivalent; on Android prefer `room` skill when you need relational queries over the same structured data.
- `networking-layer` for combining OkHttp's disk cache with manual file writes.
- `swift-concurrency` parallels `Dispatchers.IO` patterns if porting iOS code to Android.
