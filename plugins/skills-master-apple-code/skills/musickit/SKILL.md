---
name: musickit
description: Guidance on integrating Apple Music with MusicKit in Swift, covering MusicAuthorization, catalog search via MusicCatalogSearchRequest, the user library, ApplicationMusicPlayer versus SystemMusicPlayer, playback queues, subscription and capability checks, artwork, and the MusicKit SwiftUI views. Use when requesting Apple Music access, searching the catalog or library, building a player or queue, gating playback on a subscription, presenting a subscription offer, or showing artwork in SwiftUI.
---

## When to use

Use this skill when an app needs to find or play Apple Music content. It applies to requesting authorization, searching the catalog with a typed request, reading the user's own library, building a playback queue, choosing between the app-scoped and system players, confirming the user can stream catalog tracks, presenting a subscription upsell, and rendering artwork. It does not cover the server-to-server Apple Music API for backends, nor low-level audio with AVFoundation.

## Core guidance

- Request access with `await MusicAuthorization.request()` from the main actor before any catalog or library call, and branch on the returned status. Read `MusicAuthorization.currentStatus` to avoid re-prompting; the system shows the prompt only once per install.
- Build typed requests and `await` their `response()`: `MusicCatalogSearchRequest(term:types:)` returns a `MusicCatalogSearchResponse` whose collections (`.songs`, `.albums`) you read directly. Use `MusicLibraryRequest` (or the recommended catalog requests) for the user's saved content; do not hand-roll URLs.
- Pick the right player. `ApplicationMusicPlayer.shared` owns a private queue local to your app and never disturbs the Music app. `SystemMusicPlayer.shared` drives the shared Now Playing session, so its state survives your app and surfaces in Control Center.
- Set the queue as completely as you can, then `await player.play()` — it is `async throws` and prepares implicitly, so an explicit `prepareToPlay()` is rarely needed. Append later entries by mutating `player.queue.entries`.
- Gate catalog playback on `MusicSubscription`. Read `for await subscription in MusicSubscription.subscriptionUpdates` and check `canPlayCatalogContent`; when it is false and `canBecomeSubscriber` is true, surface an offer rather than failing silently.
- Render artwork with the SwiftUI `ArtworkImage(artwork, width:)` view (not a manual `AsyncImage`) so caching and color come for free; list rows can use `MusicItemCell`.
- Don't block the UI: every request and the player calls are async and can throw, so handle errors and run them off `body`.

```swift
func searchSongs(_ term: String) async throws -> MusicItemCollection<Song> {
    guard await MusicAuthorization.request() == .authorized else { return [] }
    var request = MusicCatalogSearchRequest(term: term, types: [Song.self])
    request.limit = 25
    let response = try await request.response()
    return response.songs
}
```

## Platform notes

- Available on iOS 15+, but this skill targets iOS 17 / Swift 6 idioms; the same APIs run on iPadOS, macOS, tvOS, and visionOS. Some surfaces (for example certain SwiftUI cells) vary by platform, so guard with `#available` when reaching for newer additions.
- Enable the **MusicKit** service for your App ID in Certificates, Identifiers & Profiles. This grants automatic developer-token management so device requests just work; only the server-side Apple Music API needs you to mint tokens yourself.
- `SystemMusicPlayer` integrates with the shared Now Playing system, so playback continues in the background and is controllable from the Lock Screen and Control Center given the audio background mode.

## Pitfalls

- **Missing Info.plist string.** MusicKit presents the consent alert for you, but you must add `NSAppleMusicUsageDescription` (Privacy - Media Library Usage Description) or the app crashes on first request.
- **Querying before authorization.** Catalog and library requests made while status is `.notDetermined` or `.denied` return empty or throw; always check or request first.
- **Assuming the user can stream.** Authorization is not a subscription. A user can grant access yet have `canPlayCatalogContent == false`; calling `play()` then errors. Check `MusicSubscription` first.
- **Wrong player for the goal.** Using `SystemMusicPlayer` for an in-app, ephemeral preview hijacks the user's Music session; using `ApplicationMusicPlayer` when you wanted Lock Screen control leaves no system Now Playing entry.
- **Treating `MusicItemCollection` as a full list.** Responses are paginated; honor `limit`/`offset` and fetch more pages instead of expecting every match at once.

## References

- **Documentation:** [MusicKit](https://developer.apple.com/documentation/musickit)
- **Documentation:** [MusicAuthorization](https://developer.apple.com/documentation/musickit/musicauthorization)
- **Documentation:** [MusicSubscription](https://developer.apple.com/documentation/musickit/musicsubscription)
- **Documentation:** [ArtworkImage](https://developer.apple.com/documentation/musickit/artworkimage)
- **WWDC:** [Meet MusicKit for Swift (WWDC21)](https://developer.apple.com/videos/play/wwdc2021/10294/)
- **WWDC:** [Explore more content with MusicKit (WWDC22)](https://developer.apple.com/videos/play/wwdc2022/110347/)

## See also

See `observation` for modeling the player and subscription state in an Observable view model that SwiftUI tracks, and `swiftui-state-data-flow` for wiring the async request results and a `musicSubscriptionOffer` presentation binding through the view hierarchy.
