---
name: media3-ai-effects
description: Covers the Media3 AI Effects library announced at I/O 2026 — a unified interface for image and video enhance, magic eraser, and studio sound that routes each effect to the most efficient path available on the device. Use when adding AI-driven media cleanup to capture or editing flows, removing objects from user photos or video, denoising voice recordings, or deciding how to ship premium media effects across a heterogeneous device fleet.
---

> **Emerging** — this covers an API that was pre-1.0, newly shipped, or still moving as of 2026-08-25. Treat the specifics as provisional and confirm against current documentation before relying on them.

## When to use

Reach for Media3 AI Effects when the product calls for the class of cleanup features users know from first-party camera apps — **Image and Video Enhance**, **Magic Eraser**-style object removal, and **Studio Sound** voice denoising — without building per-device ML pipelines yourself. The library's value is the routing: one interface per effect, with the implementation resolved to the most efficient and reliable path the device offers. It was announced at I/O 2026 as part of the media lifecycle toolkit; treat the API surface as young and verify current status against the Media3 release notes before committing a roadmap to it.

## Core guidance

- Integrate effects as a post-capture or edit-time step in the same Media3 pipeline that handles your editing and export — the library is designed to compose with Transformer's `EditedMediaItem` effects model rather than as a detached filter pass.
- Treat availability as per-device and per-effect: the routing layer picks the best path, but a low-end device may support enhancement and not eraser-class editing. Feature-gate UI on a capability check, never on device model lists.
- Budget for latency honestly: enhancement of a long video is a job, not a tap — run it like an export (service/worker, progress, cancel), and preview on a short segment before offering the full-length operation.
- Keep originals: destructive AI edits to user media are trust-sensitive. Write results to a new file and let the user compare and revert.
- Watch quality expectations by surface: eraser-style edits that look fine at feed resolution can show artifacts at full zoom — expose them where output resolution matches the use.
- Pin versions and read release notes on every bump; effect quality and device coverage will shift release-to-release while the library matures.

## Platform notes

- **Device fleet reality:** the routing exists precisely because premium effects are chipset-dependent; the same call may run on an NPU on one device and a slower fallback on another — measure on representative low-end hardware before setting product expectations.
- **Interaction with capture:** pairing with CameraX 1.5 capture (see `camerax`) keeps the capture → clean-up → export chain inside Google's supported media toolkit.
- **On-device vs. offloaded execution** is an implementation detail of the routing layer; do not promise "fully on-device" in product copy unless you have verified the path for your effect set on your supported devices.

## Pitfalls

- **Shipping the feature as universally available** — capability varies per effect and device; gate on runtime checks or ship a degraded tier knowingly.
- **Running long enhancements inside a composable's lifecycle** — same failure mode as exports: rotation kills the job. Use a worker.
- **Overwriting the user's original media** — irreversible AI edits generate support tickets and one-star reviews; always write to a copy.
- **Treating announcement-stage APIs as settled** — validate the current artifact status before building load-bearing flows; keep the integration behind an interface you can re-implement.
- **Ignoring the editing pipeline** — bolting a standalone effect pass outside Media3 loses composition with trims, speed, and export settings that Transformer manages.

## References

- **I/O '26 media stack update:** [https://android-developers.googleblog.com/2026/06/building-premium-android-experiences-google-io-26.html](https://android-developers.googleblog.com/2026/06/building-premium-android-experiences-google-io-26.html)
- **Media3 home:** [https://developer.android.com/media/media3](https://developer.android.com/media/media3)

## See also

For the editing/export pipeline these effects compose with, see `media3-transformer`. For capture, see `camerax`. For on-device generative APIs beyond media cleanup, see `gemini-nano-aicore`.
