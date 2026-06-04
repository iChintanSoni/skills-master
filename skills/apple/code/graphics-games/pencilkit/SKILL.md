---
name: pencilkit
description: "Build Apple Pencil drawing and annotation features with PencilKit on iOS, iPadOS, and visionOS. Use when adding a PKCanvasView, presenting the PKToolPicker, capturing or rendering a PKDrawing, persisting strokes, handling Apple Pencil hover, double-tap, or squeeze via UIPencilInteraction, or wrapping the canvas in SwiftUI. Triggers: PKCanvasView, PKToolPicker, PKDrawing, drawingPolicy, dataRepresentation, PKToolPickerCustomItem, pencilInteraction didReceiveSqueeze."
globs:
  - "**/*.swift"
tags: [pencilkit, apple-pencil, drawing, swiftui, canvas]
x-skills-master:
  domain: apple
  class: code
  category: graphics-games
  platforms: [ios, ipados, visionos]
  requires:
    ios: "17"
    swift: "6.0"
  pairs_with: []
  sources:
    - https://developer.apple.com/documentation/pencilkit/pkcanvasview
    - https://developer.apple.com/documentation/PencilKit/drawing-with-pencilkit
    - https://developer.apple.com/documentation/uikit/uipencilinteraction
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for PencilKit when you want a low-latency, system-quality drawing or
annotation surface backed by Apple Pencil and finger input. `PKCanvasView`
gives you the inking engine, `PKToolPicker` the floating palette of pens,
markers, erasers, color, ruler, and undo/redo, and `PKDrawing` a serializable
model you can persist, render to an image, or rebuild stroke by stroke. It is
the right choice for note-taking, signature capture, markup over images or PDFs,
and sketch tools. If you only need a vector canvas without the Pencil-tuned ink
or the system tool palette, a plain Core Graphics or SwiftUI `Canvas` view may
fit better.

## Core guidance

- **Drive the picker through the responder chain.** Create one `PKToolPicker()`,
  call `setVisible(true, forFirstResponder: canvas)`, `addObserver(canvas)`,
  then `canvas.becomeFirstResponder()`. The picker follows the active first
  responder, so multiple canvases can share it.
- **Set `drawingPolicy` deliberately.** The default lets Pencil draw and fingers
  scroll. Use `.anyInput` to allow finger drawing (good for Pencil-less devices)
  and `.pencilOnly` to reserve fingers for navigation.
- **Treat `PKDrawing` as your source of truth.** Persist
  `canvas.drawing.dataRepresentation()` (a versioned `Data` blob), not a
  flattened image; reload with `try PKDrawing(data:)`.
- **Render on demand, don't store bitmaps.** Call
  `drawing.image(from: drawing.bounds, scale: displayScale)` for thumbnails or
  export; recompute when the drawing changes.
- **Observe edits via `PKCanvasViewDelegate`.** `canvasViewDrawingDidChange(_:)`
  is your save trigger — debounce it rather than writing on every stroke.
- **Don't reach into stroke internals to undo.** Use the canvas's
  `undoManager`; the tool picker's undo/redo buttons drive the same manager.
- **Keep heavy work off the main actor.** Serialize, diff, or composite drawings
  on a background task and hop back to set `canvas.drawing`.

```swift
let canvas = PKCanvasView()
canvas.drawingPolicy = .anyInput
canvas.delegate = self

let picker = PKToolPicker()
picker.setVisible(true, forFirstResponder: canvas)
picker.addObserver(canvas)
canvas.becomeFirstResponder()

// Persist, then later restore.
let data = canvas.drawing.dataRepresentation()
canvas.drawing = (try? PKDrawing(data: data)) ?? PKDrawing()
```

## Platform notes

- **SwiftUI needs a bridge.** `PKCanvasView` is a `UIScrollView` subclass, so wrap
  it in `UIViewRepresentable` and configure the picker inside `makeUIView`. Defer
  `becomeFirstResponder()` to a `DispatchQueue.main.async` block so the view is in
  the window hierarchy first. There is still no first-party SwiftUI canvas type.
- **Apple Pencil interactions are UIKit.** Attach a `UIPencilInteraction` to your
  view and implement `pencilInteraction(_:didReceiveTap:)` (iOS 12.1+) and
  `pencilInteraction(_:didReceiveSqueeze:)` (iOS 17.5+, Apple Pencil Pro). Read
  `UIPencilInteraction.preferredTapAction` to honor the user's Settings choice;
  both events can carry a `hoverPose` for cursor positioning.
- **Custom tools (iOS 18 / iPadOS 18 / visionOS 2).** `PKToolPickerCustomItem`
  with its `Configuration` lets you add bespoke tools to the picker; PencilKit
  renders the swatch from an image closure it calls when width, color, or opacity
  changes.
- **Privacy.** PencilKit input needs no permission and no Info.plist usage string.
  If you let users insert photos to annotate, that import path has its own
  photo-library requirements.

## Pitfalls

- **Tool picker never appears.** Almost always the canvas is not first responder,
  or you forgot `setVisible(true, forFirstResponder:)`. Verify the canvas is in a
  window before calling `becomeFirstResponder()`.
- **Saving an image instead of the drawing.** Bitmaps lose vector strokes,
  pressure, and editability. Persist `dataRepresentation()` and render images only
  for display or export.
- **Blank export.** `drawing.bounds` is empty for an empty drawing; guard it, and
  pass the real `displayScale` so thumbnails are not blurry or zero-sized.
- **Coordinating zoom by hand.** `PKCanvasView` is a scroll view — set
  `minimumZoomScale`/`maximumZoomScale` and `contentSize` rather than transforming
  content yourself, or ink alignment drifts.
- **Squeeze handling on unsupported hardware.** Older Pencils never send squeeze;
  always provide an alternate control and don't gate core features on it.

## References

- **Documentation:** [PKCanvasView](https://developer.apple.com/documentation/pencilkit/pkcanvasview)
- **Documentation:** [PKToolPickerCustomItem](https://developer.apple.com/documentation/pencilkit/pktoolpickercustomitem)
- **Documentation:** [UIPencilInteraction](https://developer.apple.com/documentation/uikit/uipencilinteraction)
- **WWDC:** [Squeeze the most out of Apple Pencil (WWDC24)](https://developer.apple.com/videos/play/wwdc2024/10214/)
- **WWDC:** [Inspect, modify, and construct PencilKit drawings (WWDC20)](https://developer.apple.com/videos/play/wwdc2020/10148/)
- **Sample Code:** [Drawing with PencilKit](https://developer.apple.com/documentation/PencilKit/drawing-with-pencilkit)

## See also

For matching the system gestures and on-screen affordances that users expect from
Pencil-enabled apps, see a hig-apple-pencil skill. To wire the canvas and the
`UIPencilInteraction` delegate into a SwiftUI view, see a swiftui-uikit-interop
skill on `UIViewRepresentable` and coordinators. For debouncing
`canvasViewDrawingDidChange(_:)` saves off the main actor, see a swift-concurrency
skill. When persisting drawing blobs alongside other model data, a data-modeling
or persistence skill covers storing the `Data` representation durably.
