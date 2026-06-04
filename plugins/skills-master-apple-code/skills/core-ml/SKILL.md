---
name: core-ml
description: "Use when integrating a trained model into an Apple app with Core ML: loading the Xcode-generated model class, running sync/async/batch predictions, tuning MLModelConfiguration compute units for the Neural Engine, converting models with Core ML Tools, or wrapping image models in Vision. Triggers on .mlpackage/.mlmodel files, generated prediction classes, MLModelConfiguration, VNCoreMLModel, or CoreMLRequest."
---

## When to use

Reach for Core ML when you ship a trained model that must run on-device for
privacy, latency, or offline reasons. Add an `.mlpackage` (ML Program) to the
Xcode target and Xcode synthesizes a Swift class named after the file, with a
typed `prediction(...)` method, a generated `Input`/`Output` pair, and an
`init(configuration:)`. For vision tasks (classification, detection, feature
extraction on images), prefer wrapping the model in the Vision framework so it
handles cropping, scaling, and pixel-format conversion. If you have not yet
picked a framework, see the choosing-ml-approach skill first.

## Core guidance

- **Do** drag the `.mlpackage` into the target and use the generated class
  rather than `MLModel(contentsOf:)` — you get compile-time-checked inputs and
  outputs instead of stringly-typed `MLFeatureValue` dictionaries.
- **Do** create one model instance and reuse it; loading compiles the model and
  warms the Neural Engine. Reloading per prediction is the most common cause of
  jank.
- **Do** leave `computeUnits` at `.all` (CPU + GPU + Neural Engine) unless
  profiling shows a reason to pin it; `.cpuAndNeuralEngine` excludes the GPU,
  `.cpuOnly` is for debugging numerical parity.
- **Do** call the async `prediction(from:)` for single inputs so inference runs
  off the main actor, and `predictions(from:)` (batch) when you have many inputs
  — batching amortizes setup and keeps the Neural Engine fed.
- **Don't** mutate an `MLModelConfiguration` after the model loads; it is read
  at init only. Build it first, then construct the model.
- **Don't** convert models by hand — use Core ML Tools (`coremltools`, 9.x as of
  late 2025) to convert PyTorch/TensorFlow to an ML Program, applying weight
  palettization or quantization there to shrink size and speed up the ANE.
- **Don't** assume Neural Engine execution; it falls back to GPU/CPU per layer.
  Verify with the Performance report in Xcode (Core ML Instruments template).

```swift
let config = MLModelConfiguration()
config.computeUnits = .all                 // CPU + GPU + Neural Engine

let classifier = try MNISTClassifier(configuration: config)
let output = try await classifier.prediction(from: .init(image: pixelBuffer))
print(output.classLabel, output.classLabelProbs)
```

## Platform notes

- **All platforms (iOS/iPadOS 17+, macOS 14+, tvOS, visionOS):** the generated
  class and async `prediction(from:)` are available. `MLTensor` (a NumPy-like
  multidimensional array for stitching pre/post-processing onto a model) and
  stateful models arrived in the iOS 18 / macOS 15 cycle and remain current.
- **Vision (iOS 18+):** prefer the modern Swift API — `CoreMLRequest` with
  `request.perform(on:)` returning observations via async/await, replacing the
  `VN`-prefixed `VNCoreMLRequest` completion-handler pattern. Older `VN` types
  still work where you support earlier OSes.
- **Privacy:** Core ML itself needs no entitlement, but image models usually
  pair with camera or photo access. Add `NSCameraUsageDescription` and/or
  `NSPhotoLibraryUsageDescription` to Info.plist and request authorization
  before capturing input.

## Pitfalls

- Calling `prediction` on the main actor blocks the UI for large models; use the
  async overload or hop to a background actor.
- Passing a `CVPixelBuffer` whose size or pixel format differs from the model's
  expected input silently degrades accuracy — let Vision resize, or match the
  model's documented size and `kCVPixelFormatType_32BGRA`/grayscale exactly.
- The `.mlmodel` source format is legacy; convert to ML Program (`.mlpackage`)
  to get the modern runtime, fp16 weights, and ANE optimizations.
- `MLModel` instances are not free to share across threads carelessly — confine
  one to an actor, or create per-actor instances, rather than racing one model
  from many tasks.
- Quantizing aggressively (e.g. 4-bit) can crater accuracy; validate against a
  held-out set after each compression step in Core ML Tools.

## References

- **Documentation:** [Core ML](https://developer.apple.com/documentation/coreml)
- **Documentation:** [MLModelConfiguration.computeUnits](https://developer.apple.com/documentation/coreml/mlmodelconfiguration/computeunits)
- **Documentation:** [MLTensor](https://developer.apple.com/documentation/coreml/mltensor)
- **Documentation:** [Core ML Tools — Guide](https://apple.github.io/coremltools/docs-guides/)
- **WWDC:** [Improve Core ML integration with async prediction (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10049/)
- **WWDC:** [Deploy machine learning and AI models on-device with Core ML (WWDC24)](https://developer.apple.com/videos/play/wwdc2024/10161/)
- **Sample Code:** [Classifying Images with Vision and Core ML](https://developer.apple.com/documentation/coreml/model_integration_samples/classifying_images_with_vision_and_core_ml)

## See also

Start with the choosing-ml-approach skill to decide between Core ML, the Vision
built-in requests, Create ML, and the Foundation Models on-device LLM. For
camera or photo input feeding an image model, lean on the relevant capture and
photos skills to acquire and authorize pixel buffers before prediction.
