---
name: swiftui-documents
description: Builds document-based SwiftUI apps with DocumentGroup and the iOS 27 observable document family — Document, ReadableDocument, WritableDocument, DocumentReader, DocumentWriter — plus DocumentGroupLaunchScene and DocumentCreationSource for the launch experience. Use when creating or migrating a document-based app, routing between the deprecated FileDocument/ReferenceFileDocument protocols and the new reference-type model, implementing custom readers and writers with background file access and progress reporting, or customizing the document launch screen and creation sources.
license: MIT
metadata:
  version: "1.0.0"
  snapshot-date: "2026-08-25"
---

> **Emerging** — this covers an API that was pre-1.0, newly shipped, or still moving as of 2026-08-25. Treat the specifics as provisional and confirm against current documentation before relying on them.

## When to use

Reach for this skill when an app opens, edits, and saves user-owned files through `DocumentGroup` — and especially when deciding between the deprecated value-type protocols (`FileDocument`, `ReferenceFileDocument`) and the observable document family introduced in the 27 SDK (`Document`, `ReadableDocument`, `WritableDocument`, `DocumentReader`, `DocumentWriter`). It also covers the designed launch experience: `DocumentGroupLaunchScene`, `NewDocumentButton`, and `DocumentCreationSource`. For the surrounding scene topology (`WindowGroup`, `Window`, multi-window), see `swiftui-scenes-windows`.

## Core guidance

### Routing between the old and new document APIs

- **Deployment target is the 27 SDKs or later:** adopt the new family. `FileDocument` and `ReferenceFileDocument` are deprecated as of iOS 27 / macOS 27, along with `DocumentGroup(newDocument:editor:)` and `DocumentGroup(viewing:viewer:)`.
- **Still supporting earlier OS versions:** stay on `FileDocument` / `ReferenceFileDocument`. Deprecated is not removed, and the new protocols do not exist below the 27 releases — a hybrid codebase needs availability-gated scene declarations.
- **SwiftData-backed documents** are a third track: `DocumentGroup(editing:contentType:editor:prepareDocument:)` and its migration-plan sibling are separate from both families and are not deprecated.
- **Editor vs viewer:** a read-write document conforms to `Document` (shorthand for `ReadableDocument & WritableDocument`) and mounts via `DocumentGroup(allowCreating:editor:makeDocument:)`. A read-only viewer conforms to `ReadableDocument` alone, mounts via `DocumentGroup(viewer:makeReadableDocument:)`, and sets `CFBundleTypeRole` to `Viewer` in Info.plist.

### The observable document model

- New document types are **reference types** annotated `@Observable`, so SwiftUI tracks per-property edits and keeps a stable identity across updates — the opposite of `FileDocument`'s `Sendable` value snapshotting.
- Reading is a pipeline: your `reader(configuration:)` returns a `DocumentReader`, whose `read(from:progress:)` runs `@concurrent` in the background with coordinated file access; the decoded snapshot is delivered to `apply(snapshot:previous:)` on the main actor.
- Writing mirrors it: `snapshot(contentType:)` captures state on the main actor, then the `DocumentWriter`'s `write(snapshot:to:previous:progress:)` runs in the background. Both directions report incremental progress through Foundation's `Subprogress`.
- Prefer the built-in `FileWrapperDocumentReader` / `FileWrapperDocumentWriter` when file-wrapper serialization is enough; implement a custom `DocumentReader` / `DocumentWriter` only when a framework needs the URL directly (Core Graphics, AVFoundation, PDFKit) or you stream large content.
- Register undo actions with the environment `UndoManager` — that registration is how SwiftUI detects unsaved changes and schedules autosave.

```swift
@Observable
final class LogbookDocument: Document {
    static let readableContentTypes: [UTType] = [.plainText]
    static let writableContentTypes: [UTType] = [.plainText]
    var entries = ""

    func reader(configuration: sending ReadConfiguration)
        -> sending FileWrapperDocumentReader<String> {
        FileWrapperDocumentReader(configuration) { wrapper in
            guard let data = wrapper.regularFileContents else {
                throw CocoaError(.fileReadCorruptFile)
            }
            return String(decoding: data, as: UTF8.self)
        }
    }

    @MainActor
    func apply(snapshot: sending String, previous: sending String?) async throws {
        entries = snapshot
    }

    @MainActor
    func snapshot(contentType: UTType) async throws -> sending String { entries }

    func writer(configuration: sending WriteConfiguration)
        -> sending FileWrapperDocumentWriter<String> {
        FileWrapperDocumentWriter(configuration) { snapshot, _ in
            FileWrapper(regularFileWithContents: Data(snapshot.utf8))
        }
    }
}

@main
struct LogbookApp: App {
    var body: some Scene {
        DocumentGroup { document in
            LogbookEditor(document: document)
        } makeDocument: { configuration, context in
            LogbookDocument()
        }
        DocumentGroupLaunchScene("Logbook") {
            NewDocumentButton("New Logbook")
        }
    }
}
```

### Launch experience

- `DocumentGroupLaunchScene` supplies the designed launch screen — title, background style or view, accessory views, and action buttons. Omit the title and it shows the app name; omit the actions builder and it shows a default Create Document action.
- The launch scene's document browser opens content types from every `DocumentGroup` in the app, and new documents are created with the **first** content type the app can create and write — order the writable types deliberately.
- Declare distinct creation flows with `DocumentCreationSource(id:)` extensions and one `NewDocumentButton(_:source:)` per source; branch inside the editor on `configuration.creationSource` (exposed by `URLDocumentConfiguration` and `FileDocumentConfiguration`).

## Platform notes

- **iOS / iPadOS:** `DocumentGroupLaunchScene` is available from iOS 18 and is the expected front door for a document app; custom `DocumentCreationSource` declarations are an iOS-side feature. The new protocol family requires iOS 27.
- **macOS:** the observable document family lands in macOS 27, but `DocumentGroupLaunchScene` does not exist on macOS — document apps keep the standard open/save panels, File menu, and Open Recent behavior.
- **visionOS:** the launch scene is available from visionOS 2; the new document protocols from visionOS 27.
- **watchOS / tvOS:** `DocumentGroup` and the document protocols are not part of these platforms; keep document editing on the other platforms.

## Pitfalls

- Declaring the document class without `@Observable` — the protocols only constrain to `AnyObject`, so nothing forces observation, and the editor UI silently stops refreshing on edits.
- Skipping `UndoManager` registration, which leaves SwiftUI unaware of dirty state so autosave never fires.
- Doing heavy parsing or encoding in `apply(snapshot:previous:)` or `snapshot(contentType:)` — both run on the main actor. Keep them cheap and push decode/encode work into the reader/writer, which run in the background.
- Choosing a snapshot type that shares mutable storage with the live document. Snapshots are `sending` values handed to a background writer; capture value data, not the observable object.
- Mixing families: keeping a `FileDocument` conformance while switching to the new `DocumentGroup` initializers, or referencing the new protocols without an availability gate in a multi-OS target.
- Shipping a read-only viewer without setting `CFBundleTypeRole` to `Viewer`, or expecting `DocumentGroupLaunchScene` to appear on macOS.

## References

- **Documentation:** [WritableDocument](https://developer.apple.com/documentation/swiftui/writabledocument)
- **Documentation:** [ReadableDocument](https://developer.apple.com/documentation/swiftui/readabledocument)
- **Documentation:** [DocumentGroup](https://developer.apple.com/documentation/swiftui/documentgroup)
- **Documentation:** [DocumentGroupLaunchScene](https://developer.apple.com/documentation/swiftui/documentgrouplaunchscene)
- **Documentation:** [DocumentCreationSource](https://developer.apple.com/documentation/swiftui/documentcreationsource)
- **WWDC:** [WWDC26 SwiftUI guide](https://developer.apple.com/wwdc26/guides/swiftui/)

## See also

Pair with `swiftui-scenes-windows` for how `DocumentGroup` and `DocumentGroupLaunchScene` sit alongside `WindowGroup`, `Window`, and the rest of the scene topology. For SwiftData-backed documents, route model-container questions through the SwiftData persistence guidance rather than treating them as file documents.
