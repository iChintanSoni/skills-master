---
name: mediastore
description: Covers MediaStore queries, inserts, edits, and deletions for images/video/audio, relative path usage, RecoverableSecurityException handling, and the photo picker as a permission-free alternative. Use when reading or writing shared media files on Android, presenting a file picker for images or video, or managing app-contributed media.
globs:
  - "**/*.kt"
tags: [mediastore, photo-picker, storage, media, permissions]
x-skills-master:
  domain: android
  class: code
  category: data
  platforms: ["android", "large-screen"]
  requires: { "android": "16", "kotlin": "2.2" }
  pairs_with: []
  sources:
    - https://developer.android.com/training/data-storage/shared/media
    - https://developer.android.com/training/data-storage/shared/photopicker
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Use this skill whenever your app needs to:

- Read images, video, or audio files from shared device storage without knowing their exact paths.
- Write app-produced media (photos, recordings, downloads) into a shared MediaStore collection so other apps and the gallery can see them.
- Edit or delete media files your app did not originally create — you need the RecoverableSecurityException flow.
- Offer a file-selection experience for images or video — use the Photo Picker first; fall back to MediaStore only when you need audio, custom filtering, or must target Android 12 and below without the backport.

Do **not** use MediaStore for files private to your app; use internal storage or the app-specific external directory instead.

## Core guidance

**Prefer the Photo Picker over READ_MEDIA_IMAGES/READ_MEDIA_VIDEO for selection tasks.** The photo picker requires zero permissions on Android 13+ (and backports to API 21 via `androidx.activity:activity` 1.7+). It gives the user a sandboxed view of their media and returns content URIs your app can read immediately.

**Use collection constants that match the API level.** `MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL)` is the right call for reading across all shared volumes. For inserts on API 29+, use `MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)` and set `RELATIVE_PATH` to a subdirectory under `Environment.DIRECTORY_PICTURES`.

**Never request `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE` on API 33+.** Use the granular `READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO`, and `READ_MEDIA_AUDIO` permissions instead. On API 34+ the system also offers `READ_MEDIA_VISUAL_USER_SELECTED` for a partial-access grant.

**Open file descriptors, not file paths.** Resolve a content URI with `contentResolver.openFileDescriptor(uri, "r")` or `openInputStream(uri)`. Never assume a real filesystem path from `DATA` column — it may be null or inaccessible.

**Wrap edits and deletes in a RecoverableSecurityException catch block** when modifying media you did not create:

```kotlin
// Composable-friendly wrapper — call from a CoroutineScope on the main dispatcher.
suspend fun deleteMedia(
    context: Context,
    uri: Uri,
    activityResultLauncher: ActivityResultLauncher<IntentSenderRequest>,
) {
    withContext(Dispatchers.IO) {
        try {
            context.contentResolver.delete(uri, null, null)
        } catch (e: RecoverableSecurityException) {
            // System shows a dialog asking the user to grant permission for this file.
            val intentSender = e.userAction.actionIntent.intentSender
            val request = IntentSenderRequest.Builder(intentSender).build()
            withContext(Dispatchers.Main) {
                activityResultLauncher.launch(request)
            }
        }
    }
}

// Querying images — always project only the columns you need.
fun queryImages(context: Context): List<Uri> {
    val uris = mutableListOf<Uri>()
    val projection = arrayOf(MediaStore.Images.Media._ID)
    val sortOrder = "${MediaStore.Images.Media.DATE_ADDED} DESC"
    context.contentResolver.query(
        MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL),
        projection, null, null, sortOrder
    )?.use { cursor ->
        val idCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media._ID)
        while (cursor.moveToNext()) {
            val id = cursor.getLong(idCol)
            uris += ContentUris.withAppendedId(
                MediaStore.Images.Media.EXTERNAL_CONTENT_URI, id
            )
        }
    }
    return uris
}

// Inserting a new image (API 29+).
fun insertImage(context: Context, displayName: String): Uri? {
    val values = ContentValues().apply {
        put(MediaStore.Images.Media.DISPLAY_NAME, displayName)
        put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg")
        put(MediaStore.Images.Media.RELATIVE_PATH, "${Environment.DIRECTORY_PICTURES}/MyApp")
        put(MediaStore.Images.Media.IS_PENDING, 1)
    }
    val collection = MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
    val uri = context.contentResolver.insert(collection, values) ?: return null
    // Write bytes, then clear IS_PENDING so the file is visible to other apps.
    context.contentResolver.openOutputStream(uri)?.use { /* write bytes here */ }
    values.clear()
    values.put(MediaStore.Images.Media.IS_PENDING, 0)
    context.contentResolver.update(uri, values, null, null)
    return uri
}
```

**Always set IS_PENDING = 1 during writes and clear it when done.** This prevents other apps from reading an incomplete file and is required for correct MediaStore behavior.

**Run all ContentResolver I/O on Dispatchers.IO.** Even simple queries can block; never call them on the main thread or inside a Composable body.

**Use `cursor.use { }` to guarantee closure.** Leaked cursors cause ANRs and memory pressure.

**Do not hard-code volume names.** Use `MediaStore.VOLUME_EXTERNAL` for reads across all volumes and `MediaStore.VOLUME_EXTERNAL_PRIMARY` for writes.

**For the Photo Picker, register an `ActivityResultLauncher` before the Composable reaches the `Started` state.**

```kotlin
// In a ViewModel or hoisted Composable host:
val pickMedia = rememberLauncherForActivityResult(
    ActivityResultContracts.PickVisualMedia()
) { uri: Uri? ->
    uri?.let { handleSelection(it) }
}

// Pick a single image:
pickMedia.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))

// Pick a single image or video:
pickMedia.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageAndVideo))
```

Use `PickMultipleVisualMedia(maxItems = N)` to allow multi-selection. The returned URIs are readable without any storage permission.

## Platform notes

**Large screens and foldables.** The photo picker and MediaStore APIs behave identically on tablets and foldables. Be aware that a large-screen app may be shown alongside a file manager; do not assume exclusive storage access. Use `persistablePermission` grants (`takePersistableUriPermission`) if you need to reopen a URI across app restarts without re-querying.

**Android 16 (API 36).** The `READ_MEDIA_VISUAL_USER_SELECTED` permission (introduced in API 34) remains the recommended path for image/video access when you cannot use the photo picker. The system presents a partial-selection sheet; query only the URIs the user granted. Avoid full `READ_MEDIA_IMAGES` unless your feature genuinely requires it — review rejections cite over-broad media access frequently.

**Scoped Storage (API 29+).** `WRITE_EXTERNAL_STORAGE` is a no-op on API 30+. You do not need any permission to insert media into the shared store if your app is the contributor. You only need `READ_MEDIA_*` to read media contributed by other apps.

**Pre-API 29 (API 16–28).** `RELATIVE_PATH` is not available; use the `DATA` column to specify the full path. Request `WRITE_EXTERNAL_STORAGE` at runtime. These devices represent a very small fraction of active installs; consider a minimum SDK of 26 or higher to simplify the code path.

**Audio.** The `READ_MEDIA_AUDIO` permission is separate from image/video grants. Query `MediaStore.Audio.Media.EXTERNAL_CONTENT_URI`. The photo picker does not cover audio — use a plain `Intent(Intent.ACTION_OPEN_DOCUMENT)` with `audio/*` MIME type when you need a user-selected audio file.

## Pitfalls

- **Forgetting IS_PENDING on inserts.** Skipping this flag causes other apps to read a partial file. Always set it before opening the output stream and clear it after.
- **Querying on the main thread.** Even small MediaStore queries can stall for hundreds of milliseconds. Always dispatch to `Dispatchers.IO`.
- **Using the DATA column as a file path.** On API 29+ this column may be null or point to a path your process cannot open. Use `openInputStream`/`openFileDescriptor` instead.
- **Not handling RecoverableSecurityException.** Deleting or editing media you did not create throws this exception on API 29+. Without the catch block your app crashes silently.
- **Requesting broad permissions when the photo picker suffices.** Requesting `READ_MEDIA_IMAGES` just to let users pick a profile photo is an unnecessary permission that the Play Store policy team flags. Launch the photo picker instead.
- **Holding a cursor reference across suspension points.** Close the cursor inside `use { }` before suspending; cursors are not thread-safe and must not cross coroutine context switches.
- **Ignoring the `takePersistableUriPermission` call.** A URI returned by `ACTION_OPEN_DOCUMENT` or `ACTION_GET_CONTENT` is only valid for the current session unless you call `contentResolver.takePersistableUriPermission(uri, FLAG_GRANT_READ_URI_PERMISSION)`.

## References

- **Documentation:** [Access media files from shared storage](https://developer.android.com/training/data-storage/shared/media)
- **Documentation:** [Photo picker](https://developer.android.com/training/data-storage/shared/photopicker)

## See also

Use **core-location** if your app geotags media before inserting it into MediaStore. Pair with **network-framework** when uploading media URIs to a remote service. If you store references to media URIs in a local database, see **swiftdata-modeling** (iOS) or the Room-equivalent Android skill for persistence patterns.
