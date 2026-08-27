---
name: tvos-media-playback
description: "Covers video playback on Apple TV: AVPlayerViewController as the expected full-screen player, the tvOS-only transport surface (transportBarCustomMenuItems, customInfoViewControllers, contextualActions, customOverlayViewController, unobscuredContentGuide), AVPlayerItem externalMetadata and navigationMarkerGroups, ad and interstitial scheduling with AVPlayerInterstitialEvent, display-mode matching through AVDisplayManager, Picture in Picture, and the tvOS amendments to the HLS authoring spec. Use when building or debugging a video player on tvOS, customizing the transport bar, inserting ads, or matching the TV's refresh rate and dynamic range."
license: MIT
metadata:
  version: "1.0.0"
  snapshot-date: "2026-08-25"
---

## When to use

Use this skill when video is the point of your Apple TV app: a catalog that plays full-screen, a live channel, or anything that needs the system transport bar, ad breaks, chapter navigation, or a "watch next" prompt. It covers what is genuinely different about playback on tvOS — a customization surface on `AVPlayerViewController` that exists on no other platform, a Now Playing story that diverges from iOS, display-mode negotiation with the television, and stream requirements the HLS spec amends specifically for tvOS.

Routing: `avfoundation-playback` owns the player pipeline itself — `AVAsset`, `AVPlayerItem` status, time observers, audio session, background modes — and `now-playing` owns publishing playback to the system. This skill assumes those and adds only the tvOS layer.

## Core guidance

### Use the system player

- **Do** present `AVPlayerViewController` (tvOS 9) for full-screen playback and bridge it with `UIViewControllerRepresentable`. It gives you the Siri Remote transport, scrubbing with thumbnail previews, subtitle and audio selection, and correct focus handling — none of which you should reimplement.
- **Do** use SwiftUI's `VideoPlayer` (tvOS 14) only for inline or preview video. It has no access to the tvOS-only customization properties below, so a primary player built on it will hit a wall.
- **Do** gate the chrome deliberately rather than hiding all of it: `showsPlaybackControls`, `playbackControlsIncludeTransportBar` (tvOS 11), and `playbackControlsIncludeInfoViews` (tvOS 11) are separate switches, so you can keep the scrubber while suppressing the info panel.

### The tvOS transport surface

These properties exist on tvOS (several also on visionOS) and nowhere else:

- `transportBarCustomMenuItems: [UIMenuElement]` (tvOS 15) adds your own actions and submenus beside the default controls — quality selection, "report a problem", episode list.
- `customInfoViewControllers: [UIViewController]` (tvOS 15) adds tabs to the info panel the user swipes down to reveal. `transportBarIncludesTitleView` (tvOS 15) controls the title above the scrubber.
- `contextualActions: [UIAction]` (tvOS 15) surfaces time-sensitive actions during playback — the "Skip Intro" shape.
- `customOverlayViewController` (tvOS 13) draws your own content over the video. Constrain it against `unobscuredContentGuide` (tvOS 11), the layout guide describing the region fixed-position controls do not cover, or the transport bar will sit on top of your UI.
- `contentProposalViewController` with `AVContentProposalViewController` (tvOS 10) drives the end-of-episode "up next" card, including `dateOfAutomaticAcceptance` for auto-advance.
- `skippingBehavior` with `AVPlayerViewControllerSkippingBehavior` (`.default` or `.skipItem`, tvOS 10) plus `isSkipForwardEnabled`/`isSkipBackwardEnabled` decide what a left/right press does. `requiresLinearPlayback` (tvOS 11) blocks skipping entirely for ads or parental restrictions.
- `speeds: [AVPlaybackSpeed]`, `selectedSpeed`, and `selectSpeed(_:)` (tvOS 16) populate the speed control; start from `AVPlaybackSpeed.systemDefaultSpeeds` rather than inventing rates.

### Feed the player its metadata

- **Do** set `AVPlayerItem.externalMetadata` to an array of `AVMetadataItem` values (title, artwork, description, rating). This is what the tvOS info panel and title view render, and it supplements or replaces whatever is embedded in the asset.
- **Do** populate `AVPlayerItem.navigationMarkerGroups` with AVKit's `AVNavigationMarkersGroup` (tvOS 9) for chapters and scene markers — build one from `init(title:timedNavigationMarkers:)` over an array of `AVTimedMetadataGroup`, or the `dateRangeNavigationMarkers` variant for live content. Both the property and the type are tvOS-only, and they drive the chapter list in the info views.
- **Don't** look for `AVPlayerViewController.updatesNowPlayingInfoCenter` on tvOS: it is declared for iOS, iPadOS, Mac Catalyst, and visionOS only. `MPNowPlayingInfoCenter` and `MPRemoteCommandCenter` themselves are available on tvOS, so populate them yourself if you need system-level Now Playing state; see the `now-playing` skill for the modern framework.

```swift
func makeItem(for video: Video) -> AVPlayerItem {
    let item = AVPlayerItem(url: video.streamURL)
    item.externalMetadata = [
        metadataItem(.commonIdentifierTitle, value: video.title),
        metadataItem(.commonIdentifierDescription, value: video.summary),
    ]
    item.navigationMarkerGroups = [
        AVNavigationMarkersGroup(title: nil, timedNavigationMarkers: video.chapterMarkers)
    ]
    return item
}
```

### Ads and interstitials

- **Do** schedule client-side breaks with `AVPlayerInterstitialEventController(primaryPlayer:)` (tvOS 15), assigning `AVPlayerInterstitialEvent` values to its `events`. Each event names a `primaryItem`, a `time` or `date`, `templateItems` for the interstitial content, `restrictions`, `resumptionOffset`, and `playoutLimit`; `cue` (tvOS 16) schedules to a predefined position instead of an explicit time.
- **Do** observe with `AVPlayerInterstitialEventMonitor(primaryPlayer:)` — `currentEvent`, plus `currentEventDidChangeNotification`, `interstitialEventDidFinishNotification`, and `currentEventSkippedNotification` — when the stream itself carries the breaks rather than your code scheduling them.
- **Do** drive skippability from the event: `skipControlTimeRange` and `SkippableEventState` describe when a skip control is legitimate, and the controller's `skipCurrentEvent()` and `cancelCurrentEvent(withResumptionOffset:)` act on it. Set `requiresLinearPlayback` on the view controller while an unskippable break plays instead of trying to intercept remote presses.
- **Do** publish `MPNowPlayingInfoPropertyAdTimeRanges` so the system knows which parts of the timeline are advertising.

### Match the television

- **Do** let AVKit negotiate the display mode by setting `appliesPreferredDisplayCriteriaAutomatically` (tvOS 11.2) — the TV switches to the content's native frame rate and dynamic range, which removes judder on 24 fps film.
- **Do** take manual control through `UIWindow.avDisplayManager` (tvOS 11.2) when you need it: set `preferredDisplayCriteria` to an `AVDisplayCriteria(refreshRate:formatDescription:)`, check `isDisplayCriteriaMatchingEnabled` (the user can disable it in Settings), and watch `isDisplayModeSwitchInProgress` or the `AVDisplayManagerModeSwitchStart`/`End` notifications so you do not start playback mid-switch.
- **Do** enable Picture in Picture with `allowsPictureInPicturePlayback` (tvOS 14), or drive it directly with `AVPictureInPictureController` (tvOS 14). Implement the `AVPlayerViewControllerDelegate` PiP lifecycle methods — particularly `playerViewControllerShouldAutomaticallyDismissAtPictureInPictureStart(_:)` and the restore callback — so returning from PiP does not leave a duplicate player on screen.

### Stream delivery

- **Do** deliver HLS and read the "Amended requirements for tvOS" section of the authoring specification, which overrides the general rules rather than adding to them: H.264 profile and level must be at or below High Profile Level 5.1 on tvOS (the general recommendation is 4.1), HDR content must also provide frame rates at or below 30 fps, and the lowest 145 kbit/s variant should be omitted.
- **Do** validate ladders with Apple's HLS tools before shipping; a ladder that plays on iPhone can stall on a 4K television that immediately reaches for the top rendition.
- **Do** restrict subtitle options with `allowedSubtitleOptionLanguages` and force display with `requiresFullSubtitles` when licensing demands it, rather than filtering media selection groups by hand.

## Platform notes

- **tvOS only.** Every property in "The tvOS transport surface" is unavailable on iOS and macOS; `navigationMarkerGroups` is declared for tvOS alone. Code that compiles for both targets needs the tvOS customization behind `#if os(tvOS)`.
- **Deployment floors.** `AVContentProposalViewController` and `skippingBehavior` tvOS 10; `unobscuredContentGuide`, `playbackControlsIncludeTransportBar`, `requiresLinearPlayback`, `AVDisplayManager` tvOS 11; `customOverlayViewController` tvOS 13; Picture in Picture tvOS 14; the transport-bar menu items, custom info view controllers, contextual actions, and interstitial events tvOS 15; playback speeds and interstitial cues tvOS 16.
- **Focus inside the player.** The transport bar owns focus while it is visible. Content in `customOverlayViewController` and `customInfoViewControllers` participates in the normal focus engine, so the rules in `tvos-focus-engine` apply — including setting a sensible default focus when an overlay appears.
- **Audio session.** tvOS has `AVAudioSession`; configure `.playback` with `.moviePlayback` and declare the audio background mode as on iOS. Picture in Picture requires that background mode too.

## Pitfalls

- Building a custom transport bar from scratch. It costs weeks, loses scrubbing previews and focus correctness, and users notice — extend the system player through the customization properties instead.
- Placing overlay content without `unobscuredContentGuide`, so the transport bar covers your buttons whenever the user wakes the controls.
- Expecting `updatesNowPlayingInfoCenter` to exist on tvOS and silently shipping a player that never publishes Now Playing state.
- Leaving `appliesPreferredDisplayCriteriaAutomatically` off and rendering 24 fps film at 60 Hz, which produces visible judder on large screens.
- Fighting an ad break with press interception rather than `requiresLinearPlayback` plus the interstitial event's own skip state — the former can be worked around, the latter cannot.
- Scheduling interstitials but never observing the monitor's notifications, so your UI and analytics do not know a break started, finished, or was skipped.
- Reusing an iOS HLS ladder unchanged and hitting the tvOS amendments — especially the profile/level ceiling and the HDR frame-rate rule.
- Starting playback while `isDisplayModeSwitchInProgress` is true, which drops the first seconds of content behind a black screen.

## References

- **Documentation:** [AVPlayerViewController](https://developer.apple.com/documentation/avkit/avplayerviewcontroller)
- **Documentation:** [AVPlayerInterstitialEvent](https://developer.apple.com/documentation/avfoundation/avplayerinterstitialevent)
- **Documentation:** [AVDisplayManager](https://developer.apple.com/documentation/avkit/avdisplaymanager)
- **Documentation:** [AVPictureInPictureController](https://developer.apple.com/documentation/avkit/avpictureinpicturecontroller)
- **Documentation:** [HLS authoring specification for Apple devices](https://developer.apple.com/documentation/http-live-streaming/hls-authoring-specification-for-apple-devices)
- **Documentation:** [HTTP Live Streaming](https://developer.apple.com/documentation/http-live-streaming)

## See also

- **avfoundation-playback** — the player pipeline underneath: assets, item status, time observation, audio session, and background audio.
- **now-playing** — publishing playback state and transport commands to the system, which tvOS does not do for you from the player view controller.
- **tvos-focus-engine** — focus behavior for overlays and info-panel content that sit inside the player.
- **tvos-app-structure** — the catalog screens that push into this player.
