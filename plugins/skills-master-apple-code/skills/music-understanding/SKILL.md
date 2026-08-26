---
name: music-understanding
description: "Guidance on the Music Understanding framework for on-device musical analysis of audio: the MusicUnderstandingSession actor built over an AVAsset or a streaming buffer provider, the rhythm, key, structure, pace, instrument-activity, and loudness analysis types, TimedValue and RangedValue results keyed to CMTime, the progressive loudnessResults sequence, and Codable results you can precompute and ship. Use when detecting beats, bars, or BPM, finding a track's key or section boundaries, syncing visuals or edits to musical energy, metering perceptual loudness in LUFS, or deciding between this framework, ShazamKit, and MusicKit."
license: MIT
---

> **Emerging** — this covers an API that was pre-1.0, newly shipped, or still moving as of 2026-08-25. Treat the specifics as provisional and confirm against current documentation before relying on them.

## When to use

Reach for Music Understanding when your app needs to know *about* the music it is handling: where the beats and bars fall, what key a track sits in, where the chorus starts, how energetic a passage feels, which instruments are active, and how loud the result actually is. It runs entirely on device, so audio never leaves the user's hardware, and it removes the need to hand-roll DSP or train a model.

Route by the question you are asking. **This framework** answers *what is happening musically inside this audio*. **ShazamKit** answers *which recording is this* by matching against the Shazam catalog or a custom catalog. **SoundAnalysis** answers *what kind of sound is this* across general audio classes. **MusicKit** answers *what does Apple Music know about this item* — catalog metadata, artwork, playback. They compose: identify a track with ShazamKit, fetch its metadata with MusicKit, then analyze the local file with Music Understanding.

## Core guidance

- Create a `MusicUnderstandingSession` from one of two sources. `init(asset:)` takes an `AVAsset & Sendable` and is `async throws`; `init(audioProvider:)` takes any non-throwing `AsyncSequence` whose `Element` is `AVReadOnlyAudioPCMBuffer`, so errors in your audio pipeline must be resolved before the buffers reach the session.
- Ask for only what you need. `analyze(for:)` takes a `Set<AnalysisType>` drawn from `.rhythm`, `.key`, `.structure`, `.pace`, `.instrumentActivity`, and `.loudness`; `analyze()` runs all six. Both are `async throws` and return a `SessionResult` whose per-type properties are `nil` for anything you did not request.
- Treat a session as single-use. Calling `analyze` twice on the same instance throws `sessionInProgress`; `cancel()` ends the run and permanently retires the session. Construct a fresh session for a second pass.
- Read results through the two time containers. `MusicUnderstandingSession.TimedValue<Value>` pairs a value with a `CMTime` instant; `RangedValue<Value>` pairs one with a `CMTimeRange` span. Instantaneous facts (beat positions, instrument activity samples) are timed; facts that hold over a stretch (key, pace) are ranged.
- Know the concrete shapes before you build UI on them: `RhythmResult` exposes `beats: [CMTime]`, `bars: [CMTime]`, and an **optional** `beatsPerMinute: Float?`. `StructureResult` gives `sections`, `segments`, and `phrases` as `[CMTimeRange]`, nesting coarse to fine. `KeyResult.ranges` is `[RangedValue<KeyResult.KeySignature>]` with a `tonic` and a `.major`/`.minor` `mode`. `PaceResult.ranges` is `[RangedValue<Double>]`. `InstrumentActivityResult` is keyed by `Instrument` (`.vocal`, `.drum`, `.bass`, `.other`) into `activity` samples in 0.0–1.0 and detected `ranges`.
- Pick the right structural granularity. A *section* is a distinct part of a song (an intro, verse, or chorus); each section is made of *segments*, and each segment of *phrases*. Cut a montage on sections, quantize a transition on phrases.
- For live metering, iterate `loudnessResults` — a `Sendable` `AsyncSequence` of `LoudnessResult` — from a separate task while `analyze(for: [.loudness])` runs. Streamed results carry a single `momentary`/`shortTerm` sample each; the final `SessionResult` carries the complete arrays plus `integrated` and `peak`.
- Loudness is reported in LUFS against ITU-R BS.1770, so `integrated` is directly comparable to broadcast and streaming normalization targets rather than being an app-specific scale.
- Prefer precise timing when you construct the asset: `AVURLAsset(url:options: [AVURLAssetPreferPreciseDurationAndTimingKey: true])` keeps beat and section timestamps accurate on formats with unreliable headers.
- Every result type is `Codable` and `Sendable`. Analyze once, encode to JSON, and ship or cache the analysis so games, editors, and watch apps can drive behavior without re-running the pipeline.

```swift
func beatGrid(for url: URL) async throws -> (bpm: Float?, beats: [CMTime]) {
    let asset = AVURLAsset(url: url,
                           options: [AVURLAssetPreferPreciseDurationAndTimingKey: true])
    let session = try await MusicUnderstandingSession(asset: asset)
    let result = try await session.analyze(for: [.rhythm])
    guard let rhythm = result.rhythm else { return (nil, []) }
    return (rhythm.beatsPerMinute, rhythm.beats)   // session is now spent
}
```

## Platform notes

- Introduced across the 27-generation releases: iOS, iPadOS, Mac Catalyst, macOS, tvOS, visionOS, and watchOS. Gate with an availability check if you also ship to older systems, and keep a fallback path (or precomputed analysis) for them.
- Analysis is local and offline, so it works in airplane mode and carries no per-request cost — but it is real compute. On watchOS and other constrained targets, prefer consuming precomputed `Codable` results over analyzing full tracks on device.
- `init(asset:)` does not accept HLS livestreams; the asset must be a complete local file or otherwise fully available media. For anything continuous, feed the buffer-provider initializer instead.
- Apple ships a multiplatform SwiftUI + Swift Charts sample, Music Understanding Lab, that visualizes all six analysis types — useful for sanity-checking your own rendering of ranges and timed values.

## Pitfalls

- **DRM-protected audio fails.** Initializing a session with a protected `AVAsset` throws `MusicUnderstandingError.hasProtectedContent`. Apple Music catalog streams obtained through MusicKit are not analyzable material; analyze user-owned or app-owned files.
- **Assuming a tempo exists.** `beatsPerMinute` is optional and rubato, ambient, or spoken-word material legitimately yields `nil`. Design the UI for "no stable tempo" rather than force-unwrapping.
- **Confusing pace with BPM.** Pace is a perceptual events-per-minute signal that rises and falls within a track; a fast song can register low pace during a sparse breakdown. Sync energy-driven visuals to pace and metric grids to rhythm.
- **Reusing a session.** `analyze` is once-per-instance and an empty `Set<AnalysisType>` throws `emptyAnalysisSet`. Cache the `SessionResult`, not the session.
- **Comparing keys by raw equality.** `KeySignature.tonic` preserves the original spelling, so enharmonic equivalents such as C♯ and D♭ are distinct cases. Normalize to pitch class yourself before matching or grouping tracks by key.
- **Requesting everything by habit.** `analyze()` runs all six analyses; if you only need beat positions, ask for `.rhythm` and skip the rest of the work.
- **Blocking the main actor.** The session is an `actor` and analysis is genuinely long-running for full tracks. Drive it from a background task, surface progress via `loudnessResults` or your own indicator, and cancel with `cancel()` when the user navigates away.

## References

- **Documentation:** [Music Understanding](https://developer.apple.com/documentation/musicunderstanding)
- **Documentation:** [MusicUnderstandingSession](https://developer.apple.com/documentation/musicunderstanding/musicunderstandingsession)
- **Documentation:** [AnalysisType](https://developer.apple.com/documentation/musicunderstanding/analysistype)
- **Documentation:** [MusicUnderstandingError](https://developer.apple.com/documentation/musicunderstanding/musicunderstandingerror)
- **Sample Code:** [Creating visuals with Music Understanding analysis results](https://developer.apple.com/documentation/musicunderstanding/create-visuals-using-musicunderstanding-analysis-results)
- **WWDC:** [Meet the Music Understanding framework (WWDC26)](https://developer.apple.com/videos/play/wwdc2026/253/)

## See also

Pair this with `musickit` for the catalog metadata, artwork, and playback that analysis results annotate, and with `avfoundation-playback` for the `AVAsset` and `AVPlayer` plumbing that supplies the audio and consumes the resulting beat grid. See `swift-concurrency` for structuring the analysis task, cancellation, and the concurrent `loudnessResults` consumer, and `observation` for publishing results into SwiftUI as they arrive.
