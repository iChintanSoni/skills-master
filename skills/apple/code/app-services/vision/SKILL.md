---
name: vision
description: "Use when extracting text, detecting faces or barcodes, classifying images, or running a Core ML vision model on still images with Apple's Vision framework. Triggers: OCR, RecognizeTextRequest, DetectFaceRectanglesRequest, ClassifyImageRequest, DetectBarcodesRequest, CoreMLRequest, bounding-box overlays, or migrating off VNImageRequestHandler."
globs:
  - "**/*.swift"
tags: [vision, ocr, coreml, image-analysis, swift-concurrency]
x-skills-master:
  domain: apple
  class: code
  category: app-services
  platforms: [ios, ipados, macos, tvos, visionos]
  requires:
    ios: "18"
    swift: "6.0"
  pairs_with: []
  sources:
    - https://developer.apple.com/documentation/vision
    - https://developer.apple.com/documentation/vision/recognizetextrequest
    - https://developer.apple.com/documentation/vision/normalizedrect/toimagecoordinates(from:imagesize:origin:)
    - https://developer.apple.com/videos/play/wwdc2024/10163/
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for Vision when you analyze a still image or single frame and want structured results: recognized text, face rectangles, scene classification labels, barcodes, or the output of a custom Core ML model. The framework runs on-device, needs no network, and requires no special permission to process an image you already hold. From iOS 18 / macOS 15 onward, prefer the value-type Swift request API (`RecognizeTextRequest`, `ImageRequestHandler`) over the legacy `VNRequest`/`VNImageRequestHandler` classes.

If you need a live camera pipeline, drive Vision from frames you capture yourself and keep analysis off the main actor.

## Core guidance

- **Do** build a request as a `var`, configure it, then `try await request.perform(on:)` an image source (a `CGImage`, `CIImage`, `Data`, `URL`, or pixel buffer). The modern requests are `Sendable` value types — no completion handlers.
- **Do** use `ImageRequestHandler` to run several requests on one image. `perform(_:_:)` returns a typed tuple; `performAll(_:)` yields results as an `AsyncSequence` so you handle each as it finishes.
- **Don't** treat observation `boundingBox` as view coordinates. It is a `NormalizedRect` (0–1, origin lower-left). Convert explicitly before drawing.
- **Do** convert with `toImageCoordinates(_:origin:)`, passing `.upperLeft` to land in SwiftUI/UIKit pixel space; flip the rect's Y only if you skip the origin argument.
- **Do** set `recognitionLevel = .accurate` and explicit `recognitionLanguages` for OCR quality; use `.fast` only for short, latency-sensitive reads.
- **Don't** hop to the main actor inside the analysis loop. Perform off-actor, then publish a value-type result to the UI.
- **Do** wrap a Core ML model in `CoreMLModelContainer` once and reuse it across `CoreMLRequest` invocations rather than rebuilding per frame.

```swift
var request = RecognizeTextRequest()
request.recognitionLevel = .accurate
request.recognitionLanguages = [Locale.Language(identifier: "en-US")]

let observations = try await request.perform(on: cgImage)
for obs in observations {
    let top = obs.topCandidates(1).first?.string ?? ""
    let rect = obs.boundingBox.toImageCoordinates(imageSize, origin: .upperLeft)
    print(top, rect)   // rect is ready for an overlay path
}
```

## Platform notes

- **iOS/iPadOS/macOS/visionOS:** Full Swift API support from iOS 18 / iPadOS 18 / macOS 15 / visionOS 2.
- **tvOS:** Vision is available but lacks a camera; feed it images from assets or the network.
- **Simulator:** Some requests (notably `ClassifyImageRequest` and certain Core ML paths) need a physical device with a Neural Engine; expect failures or empty results in the Simulator.
- **visionOS:** Process snapshots, not the live passthrough scene, which is not exposed to apps.
- **Privacy:** Analyzing an image you already have needs no entitlement. Acquiring it does — add `NSCameraUsageDescription` for live capture and `NSPhotoLibraryUsageDescription` for library access.

## Pitfalls

- Mixing APIs: legacy `VNRecognizeTextRequest` returns `VNRecognizedTextObservation` with a `CGRect` box; the new `RecognizeTextRequest` returns `RecognizedTextObservation` with a `NormalizedRect`. Don't pass one framework's box to the other's converter.
- Forgetting orientation: pass the image's true `CGImagePropertyOrientation` to `perform(on:orientation:)`, or every box will be rotated.
- Drawing flipped boxes: omitting `origin: .upperLeft` leaves results in Vision's lower-left space and overlays appear upside down.
- Blocking the UI: large `.accurate` OCR can take hundreds of milliseconds; never `await` it on the main actor during scroll.
- Assuming text order: observations are not guaranteed reading order. Sort by box position if you need natural flow.

## References

- **Documentation:** [Vision](https://developer.apple.com/documentation/vision)
- **Documentation:** [RecognizeTextRequest](https://developer.apple.com/documentation/vision/recognizetextrequest)
- **Documentation:** [toImageCoordinates(from:imageSize:origin:)](https://developer.apple.com/documentation/vision/normalizedrect/toimagecoordinates(from:imagesize:origin:))
- **WWDC:** [Discover Swift enhancements in the Vision framework (WWDC24)](https://developer.apple.com/videos/play/wwdc2024/10163/)
- **Sample Code:** [Locating and displaying recognized text](https://developer.apple.com/documentation/vision/locating-and-displaying-recognized-text)

## See also

For shipping the Core ML models that back `CoreMLRequest`, see the core-ml skill. When the source is a live camera stream rather than a stored image, the avfoundation-capture skill covers capturing frames to hand to Vision. For drawing the converted bounding boxes as overlays, the swiftui-canvas skill is a natural companion.
