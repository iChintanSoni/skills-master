---
name: screencapturekit
description: "Guidance for capturing screen, window, app, and audio content on macOS with ScreenCaptureKit. Use when building screen recording, screen sharing, video conferencing, or game streaming features, enumerating displays/windows with SCShareableContent, building an SCContentFilter, configuring an SCStream, handling SCStreamOutput samples, presenting the system SCContentSharingPicker, or capturing system and microphone audio."
globs:
  - "**/*.swift"
tags: [macos, screencapture, media, recording, audio]
x-skills-master:
  domain: apple
  class: code
  category: media
  platforms: [macos]
  requires:
    macos: "14"
    swift: "6.0"
  pairs_with: []
  sources:
    - https://developer.apple.com/documentation/screencapturekit/
    - https://developer.apple.com/documentation/screencapturekit/sccontentsharingpicker
    - https://developer.apple.com/documentation/ScreenCaptureKit/capturing-screen-content-in-macos
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

# ScreenCaptureKit

## When to use

Reach for ScreenCaptureKit when an app needs high-performance, low-overhead capture of on-screen content on macOS: screen recorders, screen sharing, video conferencing, remote support, and game streaming. It supersedes the deprecated `CGDisplayStream` and `CGWindowListCreateImage` paths, gives per-window and per-app filtering, delivers frames as `CMSampleBuffer`, and (since macOS 15) records straight to a file and captures the microphone alongside system audio. Use the static screenshot APIs (`SCScreenshotManager`) for single frames instead of spinning up a stream.

## Core guidance

- **Enumerate, then filter.** Fetch the current `SCShareableContent` (async) to list displays, windows, and applications, then build an `SCContentFilter` from your selection — a display-scoped filter with include/exclude lists, or a single-window filter that follows the window across displays.
- **Prefer the system picker** (`SCContentSharingPicker`, macOS 14+). Letting the OS present the chooser hands you back a ready filter, keeps window contents private, and avoids the per-window permission prompts the manual `SCShareableContent` path triggers.
- **Configure deliberately.** Set `width`, `height`, `pixelFormat`, `minimumFrameInterval`, `showsCursor`, and `capturesAudio` on `SCStreamConfiguration`. Match output dimensions to the source to avoid scaling cost; oversized buffers waste GPU and memory.
- **Handle output off the main thread.** Add outputs with `addStreamOutput(_:type:sampleHandlerQueue:)` on a dedicated serial queue. The delegate fires `stream(_:didOutputSampleBuffer:of:)`; switch on the `SCStreamOutputType` (`.screen`, `.audio`, `.microphone`) and validate each buffer before use.
- **Don't block the sample queue.** Copy or enqueue buffers quickly; slow handlers drop frames. For files, prefer the built-in `SCRecordingOutput` (macOS 15+) over hand-rolling an `AVAssetWriter`.
- **Check the attachment for screen frames.** A `.screen` buffer carries an `SCStreamFrameInfo` dictionary; skip frames whose status is not `.complete` (idle/blank/suspended frames arrive too).
- **Clean up.** Call `stopCapture()` and remove outputs on teardown; an orphaned running stream keeps the capture indicator lit and burns power.

```swift
let content = try await SCShareableContent.current
guard let display = content.displays.first else { return }
let filter = SCContentFilter(display: display, excludingWindows: [])
let config = SCStreamConfiguration()
config.width = display.width
config.height = display.height
config.minimumFrameInterval = CMTime(value: 1, timescale: 60)
config.capturesAudio = true
let stream = SCStream(filter: filter, configuration: config, delegate: self)
try stream.addStreamOutput(self, type: .screen, sampleHandlerQueue: sampleQueue)
try await stream.startCapture()
```

## Platform notes

- **macOS 14 (Sonoma):** Baseline public API — streams, filters, single-frame screenshots, and the `SCContentSharingPicker` system picker.
- **macOS 15 (Sequoia):** Adds microphone capture (`captureMicrophone`, `microphoneCaptureDeviceID` plus the `.microphone` output type), HDR stream capture, and the file-based `SCRecordingOutput`. Microphone and system audio arrive on the same delegate but with distinct `CMFormatDescription`s — route them to separate writer inputs.
- **macOS 26:** Adds advanced screenshot output exposing separate SDR and HDR `CGImage`s, plus HDR screenshot configuration presets.
- **Privacy:** Manual capture (filters built from `SCShareableContent`) requires the user to grant Screen Recording in System Settings > Privacy & Security; the first stream start triggers the prompt, and TCC denial surfaces as a stream error. The system picker path generally avoids this for picked content. Microphone capture additionally needs the `NSMicrophoneUsageDescription` Info.plist string and AVFoundation microphone authorization.

## Pitfalls

- Calling `SCShareableContent.current` before Screen Recording is granted returns empty or thrown results — handle the error and guide the user to System Settings.
- Setting `capturesAudio = true` without adding an `.audio` stream output means audio is captured but never delivered.
- Forgetting to inspect the `.screen` frame status leads to recording blank or stale frames during occlusion or display sleep.
- Doing heavy encoding or UI work inside `didOutputSampleBuffer` stalls the queue and drops frames; offload it.
- Assuming microphone capture works on macOS 14 — it is macOS 15+. Gate the API with `if #available`.
- Letting the `SCStream` deallocate without `stopCapture()` can leave system resources and the recording indicator active.

## References

- **Documentation:** [ScreenCaptureKit](https://developer.apple.com/documentation/screencapturekit/)
- **Documentation:** [SCContentSharingPicker](https://developer.apple.com/documentation/screencapturekit/sccontentsharingpicker)
- **Documentation:** [Capturing screen content in macOS](https://developer.apple.com/documentation/ScreenCaptureKit/capturing-screen-content-in-macos)
- **WWDC:** [Meet ScreenCaptureKit (WWDC22)](https://developer.apple.com/videos/play/wwdc2022/10156/)
- **WWDC:** [What's new in ScreenCaptureKit (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10136/)
- **WWDC:** [Capture HDR content with ScreenCaptureKit (WWDC24)](https://developer.apple.com/videos/play/wwdc2024/10088/)

## See also

For encoding captured buffers to disk or a network stream, see a related AVFoundation video writing skill. For requesting and checking the microphone authorization that accompanies audio capture, see an AVCaptureDevice permissions skill. For surfacing capture state and controls in the UI, pair this with a SwiftUI app structure skill.
