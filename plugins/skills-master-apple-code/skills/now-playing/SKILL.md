---
name: now-playing
description: "Guidance on the Now Playing framework for publishing playback to the Lock Screen, Control Center, and connected accessories including CarPlay: an Observable model conforming to MediaSessionRepresentable that supplies content, playbackSnapshot, and commands, MediaSession activation through requestToBecomeApplicationPrimary and requestToBecomeSystemPrimary, typed content such as MusicContent and PodcastContent, size-driven Artwork providers, MediaCommand handlers, and RemoteMediaSession extensions driven by push for external devices. Use when surfacing metadata and transport controls outside your app, keeping the scrubber accurate, wiring remote commands, publishing artwork, or choosing between this framework and MPNowPlayingInfoCenter."
license: MIT
metadata:
  version: "1.0.0"
  snapshot-date: "2026-08-25"
---

> **Emerging** — this covers an API that was pre-1.0, newly shipped, or still moving as of 2026-08-25. Treat the specifics as provisional and confirm against current documentation before relying on them.

## When to use

Use this skill when playback that happens inside your app has to appear outside it: on the Lock Screen, in Control Center, and on connected accessories including CarPlay and AirPlay-capable devices. It covers publishing the right metadata, keeping the scrubber honest, declaring which transport controls you support, supplying artwork the system can size, and representing playback that is actually running on a *different* device.

Routing: `avfoundation-playback` owns the player itself (`AVPlayer`, audio session, background modes) — Now Playing is the layer that describes that player to the system. `musickit` already drives the shared Now Playing session when you use `SystemMusicPlayer`, so you publish your own session only for playback your app owns. Below the 27-generation floor, `MPNowPlayingInfoCenter` plus `MPRemoteCommandCenter` remain the (non-deprecated) MediaPlayer path; keep them behind an availability check rather than running both for the same playback.

## Core guidance

- Model the session, don't push updates. Conform an `@Observable` `@MainActor` type to `MediaSessionRepresentable` and expose four members: `id`, `content`, `playbackSnapshot`, and `commands`. The framework observes your model and syncs every system surface — there is no "refresh now" call to remember.
- Wrap the model in `MediaSession(model)` and call `try await session.requestToBecomeApplicationPrimary()` to start publishing. Hold the session for as long as playback matters and set your reference to `nil` to tear it down.
- Describe content with the type that matches the medium: `MusicContent`, `PodcastContent`, `MovieContent`, `TVShowContent`, `BookContent`, `RadioContent`, `HomeMediaContent`, or `GenericContent`. Each takes core metadata in its initializer and exposes extra mutable fields (`isExplicit`, `genre`, `composer`, `isrc`) you set before returning the value.
- State duration honestly with `MediaDuration`: `.finite(_:)` for known-length media, `.live` for broadcasts, `.continuous` for endless content with no defined end. This is what decides whether the system draws a scrubber at all.
- Return a `MediaPlaybackSnapshot(state:elapsedTime:timestamp:)` whose `state` is `.playing(rate:)`, `.paused`, `.buffering`, `.interrupted`, or `.stopped`. The system extrapolates position from `elapsedTime` **as of** `timestamp`, so recompute both together at every transition.
- Declare capability, not just handlers. Each `MediaCommand` is a static factory taking an async throwing closure — `.play`, `.pause`, `.stop`, `.togglePlayPause`, `.next`, `.previous`, `.skipForward(preferredIntervals:)`, `.skipBackward(preferredIntervals:)`, `.seekToPosition`, `.seekForward`/`.seekBackward`, `.changePlaybackRate(supported:)`, `.changeRepeatMode`, `.changeShuffleMode`, and `.feedback`. Chain `.enabled(_:)` to grey a control out without removing it.
- Supply artwork lazily. `Artwork(id:artworkProvider:)` hands your closure the exact size a surface needs and expects an `ArtworkRepresentation`; the `id` is the system's cache key, so keep it stable per image and change it only when the artwork itself changes. `AnimatedArtwork` adds preview and video providers with declared `supportedAspectRatios`.
- Configure audio *before* activating: set the `AVAudioSession` category to `.playback` and `setActive(true)`, then request primary. On teardown call `setActive(false, options: .notifyOthersOnDeactivation)` so other apps resume.

```swift
@Observable @MainActor
final class TrackPlayer: MediaSessionRepresentable {
    let id = "com.example.player.audio"
    private var session: MediaSession<TrackPlayer>?
    var track: Track?
    var isPlaying = false
    var elapsed: TimeInterval = 0
    var capturedAt: Date = .now

    var content: (any MediaContentRepresentable)? {
        track.map { t in
            MusicContent(id: t.id, songTitle: t.title, artistName: t.artist,
                         albumName: t.album, type: .audio,
                         duration: .finite(t.duration),
                         artwork: Artwork(id: t.coverID) { size in
                             try ArtworkRepresentation(data: await t.coverData(fitting: size))
                         })
        }
    }

    var playbackSnapshot: MediaPlaybackSnapshot? {
        MediaPlaybackSnapshot(state: isPlaying ? .playing() : .paused,
                              elapsedTime: elapsed, timestamp: capturedAt)
    }

    var commands: [MediaCommand] {
        [.play { self.resume() },
         .pause { self.suspend() },
         .next { self.advance() }.enabled(track?.hasSuccessor == true)]
    }

    func begin() async throws {
        let session = MediaSession(self)
        self.session = session
        try await session.requestToBecomeApplicationPrimary()
    }
}
```

## Platform notes

- The framework ships on iOS, iPadOS, Mac Catalyst, macOS, tvOS, visionOS, and watchOS in the 27 generation. `requestToBecomeSystemPrimary()` is narrower — iOS, iPadOS, and Mac Catalyst only — and requires your app to be in the **foreground**; from the background the request silently has no effect.
- Local playback rarely needs `requestToBecomeSystemPrimary()`. Use it only to take over the system slot from another session, and mirror what your own UI is prominently showing. Reflect the outcome by observing `isApplicationPrimary` and `isSystemPrimary` rather than assuming success.
- An app may own several sessions (a music player and a podcast player, say). Each observes its own representable; `requestToBecomeApplicationPrimary()` picks which one speaks for the app.
- Background audio still comes from the player layer, not this framework: the `audio` value in `UIBackgroundModes` plus an active `.playback` audio session are what keep playback — and therefore the published session — alive on lock.
- **Remote sessions** represent playback on a speaker, streaming stick, or TV. They use an app extension conforming to `RemoteMediaSessionExtension`, declared with an `EXExtensionPointIdentifier` of `com.apple.nowplaying.remote-media`. Your app starts one with `RemoteMediaSession.start(attributes:)`, pushes state via `update(_:)`, and ends it with `end()`; a server can drive the same lifecycle over APNs using the `pushToStartToken` your app registers.

## Pitfalls

- **Stale snapshots.** Returning a cached `timestamp` (or `.now` computed at a moment other than when `elapsedTime` was sampled) makes the Lock Screen scrubber drift or jump. Capture elapsed time and its timestamp as one atomic update on every play, pause, seek, and rate change.
- **Declaring commands you cannot serve.** A command in the array is a promise the control works. Remove commands the medium never supports, and use `.enabled(false)` for the transient cases — an unavailable command still appears, but its handler is not invoked.
- **Oversized or churning artwork.** The provider is called per requested size, so return an image scaled to that size instead of a full-resolution master. Changing the `Artwork` `id` on every render defeats the system cache and causes visible reload flicker; changing content without changing the id shows the previous image.
- **Wrong audio session shape.** Requesting primary before `setCategory(.playback)` / `setActive(true)`, using a mixable or ambient category, or skipping `.notifyOthersOnDeactivation` on teardown produces controls that appear but do not behave — no background continuation, no accessory response, and other apps that never resume.
- **Never releasing the session.** Keeping the `MediaSession` alive after playback ends leaves a ghost entry in Control Center; drop the reference (or let the model deinit) when the queue finishes.
- **Publishing twice.** Driving both a `MediaSession` and `MPNowPlayingInfoCenter` for the same playback duplicates state and lets the two disagree. Pick one per OS version and branch on availability.
- **Modeling remote playback as local.** If the audio is coming out of another device, a local `MediaSession` misreports routing and volume. Use `RemoteMediaSession` with `MediaDevice` capabilities so the volume slider drives the real device.

## References

- **Documentation:** [Now Playing](https://developer.apple.com/documentation/nowplaying)
- **Documentation:** [Publishing media sessions](https://developer.apple.com/documentation/nowplaying/publishing-media-sessions)
- **Documentation:** [Playback commands](https://developer.apple.com/documentation/nowplaying/playback-commands)
- **Documentation:** [Content types and metadata](https://developer.apple.com/documentation/nowplaying/content-types-and-metadata)
- **Documentation:** [Publishing remote media sessions](https://developer.apple.com/documentation/nowplaying/publishing-remote-media-sessions)
- **WWDC:** [Meet the Now Playing framework (WWDC26)](https://developer.apple.com/videos/play/wwdc2026/312/)

## See also

Pair this with `avfoundation-playback` for the `AVPlayer`, audio session, and background-mode setup that Now Playing describes, and with `musickit` when Apple Music content supplies the metadata or `SystemMusicPlayer` already owns the system session. See `observation` for the `@Observable` model the framework watches, and `user-notifications` for the APNs plumbing behind push-driven remote sessions.
