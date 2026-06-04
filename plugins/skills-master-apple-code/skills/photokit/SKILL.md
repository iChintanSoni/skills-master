---
name: photokit
description: "Guides PhotoKit work on Apple platforms: SwiftUI PhotosPicker and UIKit PHPickerViewController for permission-free selection, PHPhotoLibrary read/write and limited-library authorization, fetching with PHAsset and PHFetchResult, loading images via PHImageManager, observing library changes, and editing assets. Use when importing PhotosUI or Photos, presenting a photo picker, requesting photo-library access, querying or displaying user assets, or saving edits back to the library."
---

# PhotoKit

## When to use

Reach for this skill whenever your app needs media from the user's photo library: importing one or a few items, browsing the whole library, displaying thumbnails, observing live updates, or writing edits back. The right tool depends on intent.

- **Just need the user to hand you some pictures?** Use a picker (`PhotosPicker` in SwiftUI, `PHPickerViewController` in UIKit). No authorization, no Info.plist key, no alert — selection runs out of process.
- **Need to query, count, group, or continuously display the library yourself?** Use the full Photos framework (`PHPhotoLibrary`, `PHAsset`, `PHFetchResult`, `PHImageManager`). This requires explicit authorization.
- **Need to save or edit assets?** Use `PHPhotoLibrary.performChanges` with `PHAssetChangeRequest` or content-editing inputs/outputs.

## Core guidance

- **Default to the picker.** If the task is "let me grab some photos," prefer `PhotosPicker`/`PHPickerViewController`. It needs no permission, gives the user a search-capable system UI, and avoids the entire authorization surface. Only escalate to `PHPhotoLibrary` when you genuinely must enumerate or watch the library.
- **Request the narrowest access level.** Call `PHPhotoLibrary.requestAuthorization(for: .readWrite)` (or `.addOnly` if you only save). Always handle `.limited` as a first-class state, not an error — under limited access fetches return only the user-chosen subset.
- **Add the matching Info.plist usage strings.** Full PhotoKit access needs `NSPhotoLibraryUsageDescription`; add-only saving needs `NSPhotoLibraryAddUsageDescription`. The pickers need neither.
- **Load picker results via `Transferable`, not asset identifiers.** `PhotosPickerItem.loadTransferable(type:)` is async and the supported path; don't reach into the file system. Decode off the main actor, then hop back to update UI.
- **Mutate the library only inside `performChanges`.** Never set asset properties directly. Wrap creation, deletion, favoriting, and edits in `PHPhotoLibrary.shared().performChanges`, which runs atomically and reports per-request errors.
- **Observe changes; never poll.** Register a `PHPhotoLibraryChangeObserver`, then in `photoLibraryDidChange(_:)` call `changeDetails(for:)`, swap in `fetchResultAfterChanges`, and apply incremental moves/inserts/removes to your UI on the main actor.
- **Request images sized for the view.** Pass a pixel `targetSize` and `PHImageContentMode` to `PHImageManager`; favor `PHCachingImageManager` for scrolling grids. Treat the result handler as possibly multi-call (a fast degraded image, then the full one) and set `isNetworkAccessAllowed` for iCloud-only originals.

```swift
import Photos

func authorizeReadWrite() async -> PHAuthorizationStatus {
    let current = PHPhotoLibrary.authorizationStatus(for: .readWrite)
    guard current == .notDetermined else { return current }
    return await PHPhotoLibrary.requestAuthorization(for: .readWrite)
}

func favorite(_ asset: PHAsset) async throws {
    try await PHPhotoLibrary.shared().performChanges {
        PHAssetChangeRequest(for: asset).isFavorite = true
    }
}
```

## Platform notes

- **iOS / iPadOS 17+**: `PhotosPicker` supports inline embedding, deselection, and reordering; pair `matching:` filters (e.g. `.images`, `.not(.videos)`) with `preferredItemEncoding` to control transcoding.
- **macOS**: `PhotosPicker` is available; `PHPickerViewController` is not — use the SwiftUI picker or AppKit's open panel for arbitrary files. PhotoKit authorization prompts are system-managed.
- **visionOS / tvOS**: `PhotosPicker` works; design for focus and pointer/gaze interaction. tvOS has no per-user editing affordances, so treat it as read-mostly.
- **Limited library UX**: to let users adjust their limited selection, call `PHPhotoLibrary.shared().presentLimitedLibraryPicker(from:)`. Suppress the automatic per-session limited-access alert with the `PHPhotoLibraryPreventAutomaticLimitedAccessAlert` Info.plist key and present the picker yourself.

## Pitfalls

- **Adding a usage string for the picker.** `PHPickerViewController`/`PhotosPicker` need no `NSPhotoLibraryUsageDescription`; adding one and prompting anyway is a common review rejection and a worse experience.
- **Treating `.limited` like `.denied`.** Apps that bail on limited access break for privacy-conscious users. Fetch and display the selected subset, and offer the limited-library picker to expand it.
- **Touching UI from observer or image callbacks.** `photoLibraryDidChange(_:)` and image result handlers can arrive off the main actor; marshal to `@MainActor` before mutating views. This is a frequent Swift 6 strict-concurrency trap.
- **Ignoring incremental change details.** Replacing your whole data source on every change causes flicker and lost scroll position — apply `removedIndexes`, `insertedIndexes`, and `changedIndexes` instead.
- **Forgetting `adjustmentData` when editing.** A `PHContentEditingOutput` without a valid `PHAdjustmentData` won't be accepted; set it so the edit is reversible and attributable to your app.
- **Assuming originals are local.** iCloud-optimized assets need `isNetworkAccessAllowed = true` and an async download; handle the `info` dictionary's `PHImageResultIsInCloudKey` and error keys.

## References

- **Documentation:** [PhotoKit](https://developer.apple.com/documentation/photokit)
- **Documentation:** [PhotosPicker](https://developer.apple.com/documentation/photosui/photospicker)
- **Documentation:** [Bringing Photos picker to your SwiftUI app](https://developer.apple.com/documentation/photokit/bringing-photos-picker-to-your-swiftui-app)
- **Documentation:** [PHPhotoLibrary.requestAuthorization(_:)](https://developer.apple.com/documentation/photos/phphotolibrary/requestauthorization(_:))
- **WWDC:** [Embed the Photos picker in your app (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10107/)
- **WWDC:** [Handle the Limited Photos Library in your app (WWDC20)](https://developer.apple.com/videos/play/wwdc2020/10641/)

## See also

For broader file-import flows that aren't photo-specific, see the document and file-importer skills. When you display fetched assets in scrolling grids, the SwiftUI lists and lazy-grids skill covers cell reuse and prefetching that complement `PHCachingImageManager`. For saving captured media, pair this with the camera/AVFoundation capture skill. Privacy posture here aligns with the general permissions and Info.plist usage-string skill.
