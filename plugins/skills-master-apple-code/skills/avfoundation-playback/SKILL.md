---
name: avfoundation-playback
description: Guides media playback with AVPlayer/AVPlayerItem, SwiftUI VideoPlayer and AVKit AVPlayerViewController, audio session setup, and Now Playing integration. Use when playing audio or video, observing player status/time, enabling background audio, or wiring lock-screen and remote controls on Apple platforms.
---

## When to use

Reach for this skill when you stream or play local audio/video, need to react to buffering and readiness, present native playback UI, keep audio alive in the background, or surface controls on the Lock Screen, Control Center, and CarPlay. It covers the AVPlayer pipeline plus the AVKit and MediaPlayer glue that turns a raw player into a polished experience.

## Core guidance

- **Do** separate the pieces: an `AVAsset`/`AVURLAsset` describes the source, an `AVPlayerItem` tracks one item's timing and status, and `AVPlayer` drives transport. Reuse one player; swap items with `replaceCurrentItem(with:)` or use `AVQueuePlayer`.
- **Do** observe readiness on the *item*, not the player. Watch `AVPlayerItem.status` for `.readyToPlay`/`.failed`, and use `AVPlayer.timeControlStatus` to distinguish `.playing`, `.paused`, and `.waitingToPlayAtSpecifiedRate` (network stall) — that last case is why a `rate` of nonzero does not mean frames are flowing.
- **Do** drive UI scrubbing with `addPeriodicTimeObserver(forInterval:queue:using:)` on the main queue, and always retain the returned token to remove it later. Prefer `for await` over `currentItem?.asset` async properties (e.g. `load(.duration)`) instead of legacy synchronous accessors.
- **Don't** poll `currentTime()` in a render loop or load asset properties synchronously — both block. Load metadata, tracks, and duration with `load(_:)`.
- **Do** call `seek(to:toleranceBefore:toleranceAfter:)` with `.zero` tolerances only when frame accuracy matters; loose tolerances are faster.
- **Don't** forget to set `automaticallyWaitsToMinimizeStalling` thoughtfully — leave it `true` for adaptive streaming, set `false` plus a known `rate` only for tightly controlled local files.
- **Do** prefer the highest-level UI that fits: SwiftUI `VideoPlayer` for simple cases, `AVPlayerViewController` (via `UIViewControllerRepresentable`) when you need Picture in Picture, transport bars, speed menus, or external metadata.

```swift
let item = AVPlayerItem(url: streamURL)
let player = AVPlayer(playerItem: item)

let statusTask = Task {
    for await status in item.publisher(for: \.status).values {
        if status == .readyToPlay { player.play() }
        else if status == .failed { print(item.error ?? "playback failed") }
    }
}
// Cancel statusTask and removeTimeObserver(token) on teardown.
```

## Platform notes

- **Background audio (iOS/iPadOS/tvOS/visionOS):** configure the shared `AVAudioSession` with `setCategory(.playback, mode: .moviePlayback)` then `setActive(true)`, and add the `audio` value to the `UIBackgroundModes` array in Info.plist (Background Modes capability → "Audio, AirPlay, and Picture in Picture"). Without both, audio stops on lock or app backgrounding. macOS has no `AVAudioSession`.
- **Now Playing & remote controls:** populate `MPNowPlayingInfoCenter.default().nowPlayingInfo` (title, artwork, `MPMediaItemPropertyPlaybackDuration`, `MPNowPlayingInfoPropertyElapsedPlaybackTime`) and enable handlers on `MPRemoteCommandCenter.shared()` (play, pause, togglePlayPause, changePlaybackPosition). Return an `MPRemoteCommandHandlerStatus` from each handler. Remote commands require an active, non-mixable audio session.
- **visionOS:** `VideoPlayer` and AVKit deliver an immersive, system-styled player; avoid custom overlays that fight the system chrome.
- **tvOS:** `AVPlayerViewController` is the expected full-screen player and handles focus and the Siri Remote transport for you.
- **Picture in Picture** is available through `AVPlayerViewController` or `AVPictureInPictureController`, and also requires the background audio mode.

## Pitfalls

- Letting the `AVPlayer` or time-observer token deallocate mid-playback silently stops playback or leaks observers — own them for the player's lifetime.
- Treating `status == .readyToPlay` as "buffered enough to play smoothly"; it only means metadata is loaded. Watch `timeControlStatus` and `isPlaybackLikelyToKeepUp` for stalls.
- Forgetting `setActive(true)` (or activating it too early and interrupting other apps) — defer activation until playback begins.
- Updating `nowPlayingInfo` only once: refresh `MPNowPlayingInfoPropertyElapsedPlaybackTime` and `MPNowPlayingInfoPropertyPlaybackRate` whenever you play, pause, or seek, or the Lock Screen scrubber drifts.
- Mutating player state off the main actor; AVPlayer playback control and SwiftUI updates belong on the main thread.

## References

- **Documentation:** [Media playback](https://developer.apple.com/documentation/avfoundation/media-playback)
- **Documentation:** [Controlling the transport behavior of a player](https://developer.apple.com/documentation/avfoundation/media_playback/controlling_the_transport_behavior_of_a_player)
- **Documentation:** [VideoPlayer (AVKit)](https://developer.apple.com/documentation/avkit/videoplayer)
- **Documentation:** [AVAudioSession](https://developer.apple.com/documentation/avfaudio/avaudiosession)
- **Documentation:** [MPNowPlayingInfoCenter](https://developer.apple.com/documentation/mediaplayer/mpnowplayinginfocenter)
- **WWDC:** [Create a great video playback experience (WWDC22)](https://developer.apple.com/videos/play/wwdc2022/10147/)

## See also

Pair this with an asset-loading skill when sourcing remote HLS streams or `AVAsset` metadata, an audio-session skill for fine-grained interruption and route-change handling, and a SwiftUI lifecycle skill to scope player creation and teardown to view appearance. For recording or capture rather than playback, consult an AVFoundation capture skill instead.
