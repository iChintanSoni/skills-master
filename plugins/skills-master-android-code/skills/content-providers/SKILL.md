---
name: content-providers
description: Covers authoring and consuming Android ContentProviders — content URIs, MIME types, ContentResolver, URI permission grants, and cross-app data sharing. Use when an app needs to expose structured data to other apps, integrate with system providers (contacts, media), or share files across process boundaries with fine-grained permission control.
---

## When to use

Use a `ContentProvider` when:

- Another app or system component must query, insert, update, or delete your app's data — the provider becomes the process boundary.
- You need to expose files (images, documents) to third-party apps with temporary, revocable URI permissions instead of broad storage grants.
- You integrate with system providers such as `ContactsContract`, `MediaStore`, or `CalendarContract` and need the standard cursor-based or `openFile` protocol.
- A `SyncAdapter` or `SearchSuggestionProvider` requires it — both mandate a provider as their backing contract.

Do NOT write a provider if all data access is internal to your app. Room, DataStore, or a repository class is simpler and faster inside a single process.

## Core guidance

### Authority and URI design

- Define your authority as a compile-time constant equal to your package name or a sub-path (`com.example.app.provider`). Declare it in `AndroidManifest.xml` under `<provider android:authorities="...">`.
- Model URIs hierarchically: `content://authority/table` for a collection, `content://authority/table/id` for a single row.
- Use `UriMatcher` to map URI patterns to integer codes — check the match result in every CRUD method and throw `IllegalArgumentException` for unrecognised URIs.
- Never hard-code the authority string in more than one place; expose it from a `Contract` object consumed by both the provider and its callers.

### MIME types

- Collections return `vnd.android.cursor.dir/vnd.<authority>.<type>`.
- Single rows return `vnd.android.cursor.item/vnd.<authority>.<type>`.
- Override `getType(Uri)` and return the correct type — system components rely on this for intent resolution.

### Implementing CRUD

- Run all database work on the calling thread; the system already dispatches provider calls on a Binder thread pool — do not block the main thread in the caller, not here.
- Return a `MatrixCursor` or a Room-backed `Cursor`; set `setNotificationUri(contentResolver, uri)` on every cursor you return so observers auto-refresh.
- Call `context.contentResolver.notifyChange(uri, null)` after every mutating operation so `ContentObserver` and `CursorLoader` wake up.
- Wrap multi-step mutations in `applyBatch` using `ContentProviderOperation` to make them atomic.

### Permissions and URI grants

- Declare `android:readPermission` and `android:writePermission` (or a single `android:permission`) on `<provider>` for persistent grants.
- For one-shot file sharing, grant a temporary URI permission: add `FLAG_GRANT_READ_URI_PERMISSION` or `FLAG_GRANT_WRITE_URI_PERMISSION` to an `Intent`, then call `grantUriPermission`. Revoke with `revokeUriPermission` when done.
- Set `android:grantUriPermissions="true"` on the provider, or use `<grant-uri-permission>` child elements to limit which URI subtrees can be granted.
- Prefer `FileProvider` (from `androidx.core`) over a custom provider for file sharing — it handles path mapping, permission flags, and the `content://` URI automatically.

### Consuming other providers

- Obtain a `ContentResolver` from `context.contentResolver`; it routes calls across processes.
- Always close cursors in a `use {}` block.
- Project only the columns you need — wide projections waste IPC memory.
- Run all `ContentResolver` calls from a coroutine dispatched on `Dispatchers.IO`.

```kotlin
// Contract object — shared between provider and callers
object NoteContract {
    const val AUTHORITY = "com.example.app.provider"
    val BASE_URI: Uri = Uri.parse("content://$AUTHORITY")

    object Notes : BaseColumns {
        val CONTENT_URI: Uri = Uri.withAppendedPath(BASE_URI, "notes")
        const val TABLE = "notes"
        const val COL_TITLE = "title"
        const val COL_BODY = "body"
        // MIME types
        const val MIME_DIR = "vnd.android.cursor.dir/vnd.$AUTHORITY.note"
        const val MIME_ITEM = "vnd.android.cursor.item/vnd.$AUTHORITY.note"
    }
}

class NoteProvider : ContentProvider() {
    private lateinit var db: NoteDatabase

    private val matcher = UriMatcher(UriMatcher.NO_MATCH).apply {
        addURI(NoteContract.AUTHORITY, "notes", CODE_DIR)
        addURI(NoteContract.AUTHORITY, "notes/#", CODE_ITEM)
    }

    override fun onCreate(): Boolean {
        db = NoteDatabase.getInstance(context!!)
        return true
    }

    override fun getType(uri: Uri) = when (matcher.match(uri)) {
        CODE_DIR -> NoteContract.Notes.MIME_DIR
        CODE_ITEM -> NoteContract.Notes.MIME_ITEM
        else -> throw IllegalArgumentException("Unknown URI: $uri")
    }

    override fun query(
        uri: Uri, projection: Array<String>?, selection: String?,
        selectionArgs: Array<String>?, sortOrder: String?
    ): Cursor {
        val cursor = when (matcher.match(uri)) {
            CODE_DIR -> db.noteDao().queryCursor(projection, selection, selectionArgs, sortOrder)
            CODE_ITEM -> db.noteDao().querySingleCursor(ContentUris.parseId(uri))
            else -> throw IllegalArgumentException("Unknown URI: $uri")
        }
        cursor.setNotificationUri(context!!.contentResolver, uri)
        return cursor
    }

    override fun insert(uri: Uri, values: ContentValues?): Uri? {
        if (matcher.match(uri) != CODE_DIR) throw IllegalArgumentException("Unknown URI: $uri")
        val id = db.noteDao().insert(values!!)
        context!!.contentResolver.notifyChange(uri, null)
        return ContentUris.withAppendedId(NoteContract.Notes.CONTENT_URI, id)
    }

    override fun update(uri: Uri, values: ContentValues?, sel: String?, args: Array<String>?): Int {
        val rows = when (matcher.match(uri)) {
            CODE_DIR -> db.noteDao().update(values!!, sel, args)
            CODE_ITEM -> db.noteDao().updateById(ContentUris.parseId(uri), values!!)
            else -> throw IllegalArgumentException("Unknown URI: $uri")
        }
        if (rows > 0) context!!.contentResolver.notifyChange(uri, null)
        return rows
    }

    override fun delete(uri: Uri, sel: String?, args: Array<String>?): Int {
        val rows = when (matcher.match(uri)) {
            CODE_DIR -> db.noteDao().delete(sel, args)
            CODE_ITEM -> db.noteDao().deleteById(ContentUris.parseId(uri))
            else -> throw IllegalArgumentException("Unknown URI: $uri")
        }
        if (rows > 0) context!!.contentResolver.notifyChange(uri, null)
        return rows
    }

    companion object {
        private const val CODE_DIR = 1
        private const val CODE_ITEM = 2
    }
}
```

### File sharing with FileProvider

Declare in `AndroidManifest.xml`:
```xml
<provider
    android:name="androidx.core.content.FileProvider"
    android:authorities="${applicationId}.fileprovider"
    android:exported="false"
    android:grantUriPermissions="true">
    <meta-data
        android:name="android.support.FILE_PROVIDER_PATHS"
        android:resource="@xml/file_paths" />
</provider>
```

Then share a file:
```kotlin
val file = File(context.cacheDir, "export.pdf")
val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
val intent = Intent(Intent.ACTION_VIEW).apply {
    setDataAndType(uri, "application/pdf")
    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
}
context.startActivity(intent)
```

## Platform notes

**Large screens / multi-window:** When your app runs alongside another in split-screen or a floating window, both processes may query your provider concurrently. Ensure the backing database layer (Room, SQLite WAL mode) is safe for concurrent reads.

**Android 11+ package visibility:** To query another app's provider by authority you must declare a `<queries>` element in your manifest listing the target package or provider authority. Without it `ContentResolver.query` returns `null` silently.

**Scoped storage (Android 10+):** Direct file paths are restricted. Use `MediaStore` APIs or `FileProvider` for all file access — never pass raw `File` paths across app boundaries.

**Runtime permissions:** `READ_EXTERNAL_STORAGE` and `WRITE_EXTERNAL_STORAGE` are deprecated on Android 13+. Use `READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO`, `READ_MEDIA_AUDIO`, or the photo picker instead.

**Content URI security:** A `content://` URI carries no inherent authentication. Always validate that the calling app holds the correct permission before returning data; use `checkCallingPermission` or rely on the `<provider>` permission attributes.

## Pitfalls

- **Forgetting `notifyChange`** — callers with `ContentObserver` or `LiveData`/`Flow` wrappers never update if you skip this call after mutations.
- **Blocking IO on the wrong thread** — the provider's CRUD methods run on Binder threads, not the main thread, but callers must still dispatch `ContentResolver` calls to `Dispatchers.IO` to avoid ANRs.
- **Returning a cursor from a closed database** — if the provider is destroyed or the database is closed while a caller still holds the cursor, you get `IllegalStateException`. Use Room's cursor support carefully and consider `MatrixCursor` for small result sets that survive provider lifecycle.
- **Hardcoding the authority string** — any rename or flavour suffix causes silent failures. Always derive it from `BuildConfig` or the contract object.
- **Exporting the provider unintentionally** — `android:exported="true"` without permissions makes data public. Default to `false`; only export when cross-app access is the explicit goal.
- **Leaking cursors** — always wrap `ContentResolver.query` results in `.use {}` or close in `finally`; leaked cursors cause `CursorWindowAllocationException` under memory pressure.
- **Ignoring `applyBatch` atomicity** — individual `insert`/`update` calls interleaved with other clients produce inconsistent state. Use `applyBatch` with `ContentProviderOperation` for multi-row transactions.

## References

- **Documentation:** [Content providers overview](https://developer.android.com/guide/topics/providers/content-providers)
- **Documentation:** [Creating a content provider](https://developer.android.com/guide/topics/providers/content-provider-creating)
- **Documentation:** [FileProvider](https://developer.android.com/reference/androidx/core/content/FileProvider)

## See also

For persistence backing the provider, see `room-database` and `swiftdata-modeling` (iOS counterpart). For scoped file access patterns, see `photokit`. For exposing data as a search suggestion source, pair with the `app-search` skill if available.
