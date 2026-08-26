---
name: background-assets
description: "Guidance on the Background Assets framework for shipping large app content outside the binary: managed asset packs via the AssetPackManager actor, essential/prefetch/on-demand download policies, Apple-hosted asset packs up to 200 GB through App Store Connect, self-hosted managed packs, the legacy BADownloaderExtension path, localized packs, and StoreKit-gated unlock of purchasable content. Use when slimming an app or game binary, downloading level packs or media before first launch or on demand, adopting Apple hosting, delivering per-language assets, or gating premium asset packs behind an in-app purchase."
globs:
  - "**/*.swift"
tags: [backgroundassets, asset-packs, downloads, app-size, storekit, ios26]
x-skills-master:
  domain: apple
  class: code
  category: system
  platforms: [ios, ipados, macos, tvos, visionos]
  requires:
    ios: "16"
    swift: "6.0"
  pairs_with: [storekit, background-tasks]
  sources:
    - https://developer.apple.com/documentation/backgroundassets
    - https://developer.apple.com/documentation/backgroundassets/downloading-apple-hosted-asset-packs
    - https://developer.apple.com/documentation/backgroundassets/creating-managed-asset-packs
  snapshot_date: "2026-08-25"
  stability: emerging
  version: 1.0.0
---

## When to use

Use this skill when app content is too big or too optional to ship inside the binary: game levels, textures, media packs, tutorial assets, on-device model files, or purchasable expansions. Background Assets downloads that content as versioned asset packs — before first launch, right after install, or on demand — with the system handling scheduling, resumption, and updates. It replaces On-Demand Resources and hand-rolled CDN download pipelines for bulk app content. It is not for per-user file transfers (use a background `URLSession`) or for scheduled background work (use BackgroundTasks).

## Core guidance

- Prefer **managed asset packs** (the iOS 26-generation model): you describe each pack in a JSON manifest and the system owns download scheduling, updates, and storage. The manifest's `downloadPolicy` is `essential` (fetched as part of installation, before first launch), `prefetch` (starts after install without blocking launch), or `onDemand` (fetched when the app asks); essential and prefetch declare `installationEventTypes` such as `firstInstallation` and `subsequentUpdate`.
- Choose hosting deliberately. **Apple-hosted** packs are uploaded to App Store Connect, served by Apple for App Store and TestFlight distribution, and include up to 200 GB per app with the Developer Program membership — no CDN to run. **Self-hosted managed** packs keep the same client API but serve from your own server. Set `BAUsesAppleHosting` accordingly.
- Drive everything in-app through the `AssetPackManager` actor: look up a pack with `assetPack(withID:)`, make sure it is on device with `ensureLocalAvailability(of:)`, watch `statusUpdates(forAssetPackWithID:)` (an async sequence) to render progress, and read files with `contents(at:searchingInAssetPackWithID:)` or `descriptor(for:searchingInAssetPackWithID:)`.
- Declare the framework's Info.plist contract: `BAHasManagedAssetPacks` to opt into system management and `BAAppGroupID` for the app-group container shared with the downloader extension. The managed extension conforms to `ManagedDownloaderExtension` and mostly delegates to the system implementation — keep custom logic out of it.
- Reach for the **unmanaged** path (`BADownloaderExtension`, `BADownloadManager`, `BAURLDownload`) only when you must control scheduling yourself or support the pre-26 floor (iOS 16+); it is more code and more failure modes.
- For purchasable content, treat StoreKit as the **entitlement gate, not the transport**: verify the transaction with StoreKit 2, then call `ensureLocalAvailability(of:)` for the matching pack, and reveal the content only once both the entitlement and local availability hold.
- Localize heavy audio/video per market with **localized asset packs** (iOS 27): give each pack a `language` in its manifest and the system downloads only the user's preferred language, falling back to the closest match.
- Build packs with the `xcrun ba-package` tool (it can also `convert` Steam depot definitions into asset-pack manifests when porting a game).

```swift
func ensureLevelPack(_ id: String) async throws -> Data {
    let manager = AssetPackManager.shared
    let pack = try await manager.assetPack(withID: id)
    try await manager.ensureLocalAvailability(of: pack)   // returns once the pack is on device
    return try await manager.contents(at: "levels/world-2.json",
                                      searchingInAssetPackWithID: id)
}
```

## Platform notes

- The framework itself reaches back to iOS/iPadOS 16, macOS 13, tvOS 18.4, and visionOS 2.4, but managed asset packs and Apple hosting require the 26-generation OS releases; localized packs and the StoreKit unlock flow arrive with the 27 generation. Gate with availability checks if you support older systems via the unmanaged API.
- Apple-hosted packs are configured and uploaded in App Store Connect and are delivered to TestFlight builds as well as App Store installs, so beta testers exercise the real pipeline.
- Test locally before submitting: Xcode provides a local mock-server workflow for exercising pack download, update, and failure paths without App Store Connect (see "Testing asset packs locally" in the framework docs).
- Game pipelines get first-party help at WWDC26: a Background Assets plug-in for Unity and a Steam Asset Converter feed the same asset-pack format.

## Pitfalls

- Downloader extensions are short-lived, memory-constrained processes. Schedule and hand off; never unzip, transcode, or post-process assets inside the extension — do that lazily in the app.
- Missing or mismatched Info.plist keys (`BAHasManagedAssetPacks`, `BAAppGroupID`) mean the system never discovers your packs or the extension cannot share state with the app; verify both against the app group entitlement.
- Prefetch does not mean present: a `prefetch` pack can still be in flight at first launch. Always route access through `ensureLocalAvailability(of:)` instead of assuming a policy already ran.
- Treat local availability as a cache, not a fact you record once — storage pressure and reinstalls can remove packs, so re-check at use time and be ready to show progress UI again.
- On purchase-gated packs, unlocking on `purchase()` success alone shows broken content while the download runs; conversely, keeping content after a refund leaks it. Recompute from `Transaction.currentEntitlements` and pair every grant with an availability check.
- Testing only through App Store builds makes iteration glacial; wire up the local testing flow early and keep pack IDs stable between manifest revisions so installed users update instead of re-downloading.

## References

- **Documentation:** [Background Assets](https://developer.apple.com/documentation/backgroundassets)
- **Documentation:** [Downloading Apple-hosted asset packs](https://developer.apple.com/documentation/backgroundassets/downloading-apple-hosted-asset-packs)
- **Documentation:** [Creating managed asset packs](https://developer.apple.com/documentation/backgroundassets/creating-managed-asset-packs)
- **Documentation:** [Downloading essential assets in the background](https://developer.apple.com/documentation/backgroundassets/downloading-essential-assets-in-the-background)
- **WWDC:** [Discover Apple-Hosted Background Assets (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/325/)
- **WWDC:** [Unlock in-game content with StoreKit and Background Assets (WWDC26)](https://developer.apple.com/videos/play/wwdc2026/378/)

## See also

See `storekit` for the purchase, verification, and entitlement flow that gates premium packs, and `background-tasks` for the background `URLSession` transfers and scheduled work that Background Assets deliberately replaces for bulk content.
