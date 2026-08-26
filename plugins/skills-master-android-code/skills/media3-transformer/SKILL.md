---
name: media3-transformer
description: Covers Media3 Transformer for on-device video editing and export — single-asset transcode/trim, multi-asset composition, applied effects, and CodecDB's chipset-aware encoding recommendations for export quality. Use when implementing video editing, transcoding, format conversion, applying effects before export, stitching multiple clips into one output, or tuning export encoder settings per device.
license: MIT
---

## When to use

Reach for Media3 Transformer (`androidx.media3:media3-transformer`) whenever the app edits or exports video on device: trimming a clip, transcoding for upload, burning in effects, or composing several assets — the multi-asset composition path matured through the 2026 I/O wave — into a single output file. It shares Media3's `MediaItem` model with ExoPlayer, so the asset you previewed is the asset you export. For playback use `media3-exoplayer`; for generative cleanup effects (enhance, eraser, studio sound) see `media3-ai-effects`.

## Core guidance

- Build exports around `Transformer` and `Composition`: single-asset jobs take a `MediaItem` (optionally wrapped in an `EditedMediaItem` carrying effects and trim), multi-asset jobs assemble `EditedMediaItemSequence`s into a `Composition` — clips in one sequence run back-to-back, parallel sequences overlay (video + separately recorded audio).
- Apply effects at the `EditedMediaItem` level through Media3's effects pipeline rather than pre-processing frames yourself; the pipeline runs on the GPU and composes with trims and speed changes.
- Run exports as interruptible work: a `Transformer` job belongs in a foreground service or WorkManager worker with progress via `Transformer.getProgress`, not on a screen that dies with rotation.
- Let CodecDB steer export settings: it supplies data-driven, chipset-specific encoding recommendations so exports keep visual quality without over-bitrating on weak encoders. Prefer its recommendations over hard-coded bitrate tables; fall back to conservative defaults where no recommendation exists.
- Probe codec capability before promising a format. Android 17 adds encoder/decoder surface the ecosystem has not uniformly adopted (extended xHE-AAC encode, OEM-defined `video/vvc`); query `MediaCodecInfo` rather than assuming.
- Keep an eye on API churn: Transformer's composition APIs are newer than its transcode core and still move between releases — pin the Media3 version and read the release notes on bumps.

## Platform notes

- **Thermals and battery:** multi-asset GPU pipelines are heavy; on sustained exports watch `PerformanceHintManager`/thermal headroom and consider deferring non-urgent exports to charging via WorkManager constraints.
- **Large screens:** editing UIs on tablets typically preview through ExoPlayer while exporting through Transformer; sharing the `MediaItem` graph keeps preview and export consistent.
- **Android 17 codecs:** Eclipsa Video HDR (SMPTE ST 2094-50-based) and RAW14 capture arrive at the platform level; treat them as capture/playback capabilities to probe, not defaults to emit.

## Pitfalls

- **Exporting on the UI thread's lifecycle** — a rotation or back press cancels the job; users lose minutes of work. Host exports in a service/worker with a notification.
- **Hard-coding one bitrate ladder for all devices** — the same 1080p bitrate that looks fine on one chipset's encoder looks blurry on another; that is precisely the problem CodecDB solves.
- **Assuming decoder support implies encoder support** — VVC and xHE-AAC support are asymmetric across devices; check both directions.
- **Rebuilding the effects stack per frame in composition jobs** — effects are declared once on the `EditedMediaItem`; per-frame mutation defeats the pipeline's GPU batching.
- **Ignoring progress and cancellation** — long exports without progress UI and a cancel path read as hangs and earn ANR-adjacent reviews.

## References

- **Guide — Transformer:** [https://developer.android.com/media/media3/transformer](https://developer.android.com/media/media3/transformer)
- **I/O '26 media stack update:** [https://android-developers.googleblog.com/2026/06/building-premium-android-experiences-google-io-26.html](https://android-developers.googleblog.com/2026/06/building-premium-android-experiences-google-io-26.html)

## See also

For playback of the assets being edited, see `media3-exoplayer`. For AI-driven cleanup effects that slot into the same pipeline, see `media3-ai-effects`. For capture, see `camerax`.
