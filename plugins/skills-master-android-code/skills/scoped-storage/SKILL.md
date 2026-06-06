---
name: scoped-storage
description: Covers Android scoped storage — app-specific internal and external dirs (no permission required), MediaStore for shared media, the Storage Access Framework for user-chosen documents and trees, FileProvider for sharing files with other apps, and the modern READ_MEDIA_* permission model. Use when reading or writing files on Android 10 and above, sharing a file URI with another app, letting the user pick or save a document, or auditing storage permission usage.
---

## When to use

Reach for this skill whenever your app interacts with the filesystem beyond simple SharedPreferences or DataStore key-value pairs:

- Reading or writing files private to the app (caches, config, downloaded assets).
- Letting the user pick an image, video, audio file, or arbitrary document.
- Letting the user save a document to a location they choose.
- Granting access to an entire directory tree for file-manager-style apps.
- Sharing a file URI with a camera, email, or share-sheet without an exposed absolute path.
- Auditing which storage permissions your app actually needs (often fewer than you think).

Do NOT reach here for simple key-value persistence (use DataStore) or structured relational storage (use Room). For MediaStore query and insert patterns for photos and videos, defer to the mediastore skill — this skill covers the access model and file I/O mechanics.

## Core guidance

### App-specific storage — no permission needed

- **Internal storage** (`context.filesDir`, `context.cacheDir`) is sandboxed, never accessible to other apps, and deleted when the app is uninstalled. Use it for anything private.
- **External app-specific dirs** (`context.getExternalFilesDir(type)`, `context.externalCacheDir`) require no runtime permission on API 19+. They live on the shared volume but are scoped to the package and are wiped on uninstall.
- Prefer `context.cacheDir` for temporary files and set a `FileProvider` cache path rather than hardcoding absolute paths.
- Call `context.getExternalFilesDirs(type)` (plural) to enumerate secondary storage volumes such as SD cards; use the first non-null, non-emulated entry for SD-card use cases.

### Storage Access Framework — user-chosen documents and trees

The SAF hands control to the user. Your app receives a `Uri` with a content scheme, not a file path; treat it as opaque and always resolve via `ContentResolver`.

- **ACTION_OPEN_DOCUMENT** — user picks a single file; persists across reboots when you call `contentResolver.takePersistableUriPermission`.
- **ACTION_CREATE_DOCUMENT** — user names and places a new file; you write to the returned Uri.
- **ACTION_OPEN_DOCUMENT_TREE** — user grants access to a directory tree; required for file-manager-style traversal.
- Always specify `CATEGORY_OPENABLE` so only content that can be opened as a stream is shown.
- Always take persistable permissions immediately after receiving the result or they expire.
- Read/write via `contentResolver.openInputStream(uri)` and `contentResolver.openOutputStream(uri)`. Never call `uri.path` and try to open a `File` — it will fail on scoped storage.

```kotlin
// Register the launchers once (e.g., inside a ViewModel or at screen level)
val openDocument = rememberLauncherForActivityResult(
    contract = ActivityResultContracts.OpenDocument()
) { uri: Uri? ->
    uri ?: return@rememberLauncherForActivityResult
    // Take persistent permission so the Uri survives process death
    val flags = Intent.FLAG_GRANT_READ_URI_PERMISSION
    context.contentResolver.takePersistableUriPermission(uri, flags)
    // Stream the content safely
    context.contentResolver.openInputStream(uri)?.use { stream ->
        processDocument(stream)
    }
}

val createDocument = rememberLauncherForActivityResult(
    contract = ActivityResultContracts.CreateDocument("application/pdf")
) { uri: Uri? ->
    uri ?: return@rememberLauncherForActivityResult
    context.contentResolver.openOutputStream(uri)?.use { stream ->
        writeReport(stream)
    }
}

// Launch from a composable button
Button(onClick = { openDocument.launch(arrayOf("application/pdf", "text/plain")) }) {
    Text("Open Document")
}
Button(onClick = { createDocument.launch("report.pdf") }) {
    Text("Save PDF")
}
```

### FileProvider — sharing app-specific files with other apps

Never pass a `file://` URI to another app on API 24+. The system blocks it with a `FileUriExposedException`. Use `FileProvider` to convert a private file path into a `content://` URI that the receiving app can read with a temporary grant.

1. Declare `FileProvider` in `AndroidManifest.xml` under `<provider>` with `android:exported="false"` and `android:grantUriPermissions="true"`.
2. Create `res/xml/file_paths.xml` and map logical names to physical directories (e.g., `<files-path>`, `<cache-path>`, `<external-files-path>`).
3. Generate the URI: `FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)`.
4. Add `Intent.FLAG_GRANT_READ_URI_PERMISSION` to any Intent that carries the URI.

### Runtime permission model — READ_MEDIA_* vs legacy READ_EXTERNAL_STORAGE

- On API 33+ (Android 13), `READ_EXTERNAL_STORAGE` is no longer granted. Declare the granular media permissions you actually need:
  - `READ_MEDIA_IMAGES` for photos.
  - `READ_MEDIA_VIDEO` for videos.
  - `READ_MEDIA_AUDIO` for audio files.
- On API 34+ (Android 14), if you need partial access (photo picker vs full media library), declare `READ_MEDIA_VISUAL_USER_SELECTED` in addition to the image/video permissions.
- For the Android Photo Picker (`ActivityResultContracts.PickVisualMedia`), no media permission is needed at all — it is always permission-free.
- If your `targetSdkVersion` is 32 or below, you still need `READ_EXTERNAL_STORAGE` for older devices; include both the old and new permissions with `<uses-permission android:maxSdkVersion="32">` gating.
- Do NOT declare `WRITE_EXTERNAL_STORAGE` for API 30+; it has no effect. Writing to shared storage is handled via MediaStore insert or SAF.
- Never request `MANAGE_EXTERNAL_STORAGE` unless your app is a genuine file manager; Google Play restricts this permission to approved use cases and will reject apps that request it unnecessarily.

### Key do/don't checklist

- **Do** use `context.contentResolver.openInputStream/openOutputStream` for all `content://` URIs.
- **Do** call `takePersistableUriPermission` for documents the user will revisit.
- **Do** declare `FileProvider` with a meaningful authority and `exported="false"`.
- **Do** use `ActivityResultContracts.PickVisualMedia` for photo/video pickers — no permission needed.
- **Don't** parse a `content://` URI as a file path or call `.path` on it.
- **Don't** expose `file://` URIs in Intents on API 24+.
- **Don't** store `content://` URIs from SAF across reboots without calling `takePersistableUriPermission`.
- **Don't** request `MANAGE_EXTERNAL_STORAGE` unless your Play listing explicitly justifies it.

## Platform notes

- **Phones:** The standard scoped storage model applies. Validate `file_paths.xml` cache paths match exactly — a mismatch causes `FileProvider` to throw `IllegalArgumentException` at runtime, not build time.
- **Large-screen / tablets:** Foldable and tablet users often work in multi-window. SAF `ACTION_OPEN_DOCUMENT_TREE` is especially useful here as users expect file-manager-style access. Multi-window does not affect URI grants, but be aware the result Activity may return while your app is not in the foreground.
- **Wear OS:** No shared external storage; use internal dirs or Health Platform for structured data.
- **Android TV / Google TV:** Storage access on TV is limited — users don't interact with file pickers in the same way; prefer cloud or MediaStore for content delivery.

## Pitfalls

- **Stale SAF Uri after reboot without persistent grant.** You stored a Uri in a preference but forgot `takePersistableUriPermission`. On the next launch, opening the stream throws `SecurityException`. Always pair Uri persistence with permission persistence.
- **`file://` URI in an Intent.** Sharing a camera photo via `file://` URI crashes on API 24+ with `FileUriExposedException`. Wrap with `FileProvider.getUriForFile` and add the read flag.
- **`file_paths.xml` path mismatch.** The logical path in `file_paths.xml` must match the actual subdirectory you create inside `filesDir` or `cacheDir`. "file_paths" is a common misconfiguration source because the XML attribute uses the relative path from the root, not an absolute path.
- **Calling `cursor.getString(DATA)` on API 30+.** The `_data` column is redacted for scoped storage. Use `openFileDescriptor` via `ContentResolver` instead.
- **Forgetting `CATEGORY_OPENABLE` in SAF Intents.** Without it, the picker may show virtual files (Google Docs) that cannot be opened as a byte stream, and your `openInputStream` call will return null.
- **Requesting legacy `READ_EXTERNAL_STORAGE` on API 33+.** The permission is simply not granted and your app silently gets no access. Declare `READ_MEDIA_IMAGES`/`READ_MEDIA_VIDEO`/`READ_MEDIA_AUDIO` for the actual media types you access.
- **Nesting too deeply in ACTION_OPEN_DOCUMENT_TREE.** Iterating the full `DocumentFile` tree recursively on the main thread blocks the UI. Do all tree traversal in a coroutine on `Dispatchers.IO`.

## References

- **Documentation:** [Data and file storage overview](https://developer.android.com/training/data-storage)
- **Documentation:** [Access documents and other files from shared storage](https://developer.android.com/training/data-storage/shared/documents-files)

## See also

For querying and inserting shared photos, videos, and audio via MediaStore — including bulk operations and EXIF metadata — see the mediastore skill. For saving user preferences and lightweight structured data without filesystem concerns, see the datastore skill. For caching network responses to disk in a format that survives process death, consider the okhttp-caching or room skill depending on whether you need structured queries.
