---
name: litert-mediapipe
description: Guides on-device ML on Android using LiteRT (formerly TensorFlow Lite) for custom model inference and MediaPipe Tasks for streaming perception pipelines. Use when you need to run custom .tflite models locally, configure GPU or NNAPI delegates, or build real-time vision/audio pipelines without a network round-trip.
globs:
  - "**/*.kt"
tags: [android, machine-learning, litert, mediapipe, on-device-ml]
x-skills-master:
  domain: android
  class: code
  category: media-camera-ml
  platforms: ["android", "large-screen"]
  requires: {android: "16", kotlin: "2.2"}
  pairs_with: []
  sources:
    - https://ai.google.dev/edge/litert
    - https://ai.google.dev/edge/mediapipe/solutions/guide
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Choose LiteRT when you have a custom `.tflite` model trained in TensorFlow, JAX, or PyTorch (via conversion) and need full control over the inference loop — input pre-processing, delegate selection, output post-processing, or batching. Choose MediaPipe Tasks when you need a ready-made, streaming-capable perception pipeline (object detection, pose estimation, hand landmark tracking, image segmentation, audio classification, etc.) and want a high-level Task API that handles camera frame delivery, threading, and result callbacks for you.

Prefer ML Kit over both when your use-case maps exactly to an ML Kit feature (barcode scanning, face detection, language ID) and you have no need to swap models or tune inference — ML Kit is simpler to integrate and delegates to Play Services. Use LiteRT or MediaPipe when you need custom models, offline guarantees, deterministic latency, or streaming graph control.

## Core guidance

**LiteRT — custom model inference**

- Add the dependency: `implementation("com.google.ai.edge.litert:litert:2.x.y")`. Add a delegate artifact separately (`litert-gpu`, `litert-nnapi`) — never bundle delegates you do not need, as they inflate APK size.
- Pack the `.tflite` file in `src/main/assets/`; access it at runtime with `FileUtil.loadMappedFile(context, "model.tflite")` from `com.google.ai.edge.litert.support.common.FileUtil`. Memory-mapping avoids a heap copy.
- Create one `Interpreter` per inference session and **reuse it** — construction is expensive. Close it in `onCleared()` / `onDestroy()` to free native memory.
- Pre-allocate input and output `ByteBuffer`s outside the inference loop. Use `ByteBuffer.allocateDirect` with `order(ByteOrder.nativeOrder())`.
- GPU delegate runs on the GL thread; never call it from a background coroutine unless you created the delegate on that thread. NNAPI delegate is safe across threads but has a higher warm-up cost.
- Enable `Interpreter.Options.setUseXNNPack(true)` (default on modern runtimes) for CPU path; it typically beats un-accelerated inference 2–4x.
- Use `allowFp16PrecisionForFp32 = true` on the GPU delegate to trade marginal accuracy for lower latency and memory bandwidth.

**MediaPipe Tasks — streaming pipelines**

- Depend on the specific task artifact only, e.g., `implementation("com.google.mediapipe:tasks-vision:0.10.x")`. Each task pulls in exactly what it needs.
- Instantiate a `*Options` builder once — these objects are immutable and thread-safe after `build()`. Run the task in `LIVE_STREAM` mode when processing camera frames; use `IMAGE` mode for single-shot inference on bitmaps.
- In `LIVE_STREAM` mode supply a `ResultListener` and a monotonically increasing `timestampMs` — MediaPipe uses it for frame ordering. Derive it from `SystemClock.elapsedRealtime()` or the `ImageProxy` timestamp.
- For CameraX integration, connect the `ImageAnalysis` use case and call `task.detectAsync(mpImage, timestampMs)` from the analyzer callback. `MpImage` wraps `ImageProxy` zero-copy with `BitmapImageBuilder` or `MediaImageBuilder`.
- Destroy the task with `task.close()` when the lifecycle owner is destroyed; hold the task in a `ViewModel` tied to the screen lifecycle.
- Large-screen / foldable: check display rotation and recompute canvas overlays when `WindowSizeClass` changes — landmark coordinates are relative to the input frame, not the display.

```kotlin
// LiteRT: minimal GPU-accelerated custom model runner
class TfliteClassifier(context: Context) : AutoCloseable {
    private val interpreter: Interpreter

    init {
        val model = FileUtil.loadMappedFile(context, "classifier.tflite")
        val gpuDelegate = GpuDelegate(
            GpuDelegate.Options().apply { isPrecisionLossAllowed = true }
        )
        val options = Interpreter.Options().apply {
            addDelegate(gpuDelegate)
            numThreads = 2
        }
        interpreter = Interpreter(model, options)
    }

    /** Input: RGB float32 tensor [1, 224, 224, 3]. Output: float32 [1, numClasses]. */
    fun classify(inputBuffer: ByteBuffer): FloatArray {
        val output = Array(1) { FloatArray(NUM_CLASSES) }
        interpreter.run(inputBuffer, output)
        return output[0]
    }

    override fun close() = interpreter.close()

    companion object { private const val NUM_CLASSES = 1000 }
}
```

**Threading model**

- Run inference on a `Dispatchers.Default` coroutine; never block the main thread.
- For MediaPipe `LIVE_STREAM`, the result listener fires on an internal MediaPipe thread — marshal UI updates with `withContext(Dispatchers.Main)` or post to a `StateFlow`.
- Avoid launching a new coroutine per frame from `ImageAnalysis.Analyzer` — use a `conflated` channel or `MutableStateFlow.update` to naturally drop stale frames when inference is slower than capture rate.

**Model management**

- Store large models in the `assets` folder for bundled delivery, or download them via `DownloadManager` / Firebase ML model serving for over-the-air updates.
- Verify model SHA-256 after download before loading; reject tampered files.
- Use `MetadataExtractor` from the LiteRT Support Library to read tensor metadata embedded in the model rather than hard-coding input shapes.

## Platform notes

- **API 16+ (minSdk):** LiteRT runs on API 21+; GPU delegate requires API 24+; NNAPI delegate requires API 27+. Gate delegate creation with `Build.VERSION.SDK_INT` checks.
- **Large screens / foldables:** When the device folds or the app moves to a larger display, `Activity.onConfigurationChanged` fires. Recreate overlays and recompute aspect-ratio correction matrices. MediaPipe `ObjectDetector` results carry normalized coordinates — scale them against the current `View` dimensions captured inside `doOnLayout`, not at task creation time.
- **x86_64 emulators:** LiteRT ships `.so` files for `arm64-v8a`, `armeabi-v7a`, and `x86_64`. Include all three ABI splits in debug builds or use universal APKs during development to avoid `UnsatisfiedLinkError`.
- **ProGuard / R8:** Add the LiteRT keep rules from the official AAR or copy them into your `proguard-rules.pro`. Missing rules silently break model loading with a cryptic native crash.

## Pitfalls

- **Reusing an interpreter concurrently:** `Interpreter` is not thread-safe. Synchronize access or create one instance per inference thread.
- **Forgetting to close delegates:** Native GPU delegate memory leaks if the delegate object is GC'd without explicit `close()`. Always hold a reference and close it after the interpreter.
- **Pixel format mismatch:** Camera2 / CameraX delivers `YUV_420_888`; most models expect RGB or BGR float tensors. Use `ImageOperations` from the LiteRT support library or `Bitmap`-based conversion — but never allocate a new `Bitmap` on every frame.
- **Timestamp regression in MediaPipe:** Passing a non-monotonic or duplicate timestamp causes the pipeline to silently drop the frame. Guard with a `@Volatile var lastTimestamp` check.
- **Output tensor shape assumption:** After a model update the shape may change. Always read output tensor count and shape from `interpreter.getOutputTensor(i).shape()` rather than hard-coding indices.
- **NNAPI fallback silent failures:** When an op is unsupported, NNAPI falls back to CPU silently. Enable `Interpreter.Options.setAllowNnApiCpuBackend(false)` during QA to surface unsupported op combinations.
- **Bloated binary from unused tasks:** Importing `tasks-vision` pulls landmark models into the binary even if unused. Depend only on the sub-artifact you need and enable resource shrinking.

## References

- **Documentation:** [LiteRT for Android](https://ai.google.dev/edge/litert)
- **Documentation:** [MediaPipe Solutions Guide](https://ai.google.dev/edge/mediapipe/solutions/guide)
- **Guide:** [CameraX ImageAnalysis](https://developer.android.com/training/camerax/analyze)

## See also

Use `core-ml` (Apple sibling) for context on iOS-equivalent on-device ML patterns. For integrating the camera feed that feeds these models, see `avfoundation-capture` on iOS or consult the CameraX documentation linked above. If your use-case is satisfied by a built-in API surface (barcode, face, text recognition), evaluate `vision` (iOS) or ML Kit before reaching for LiteRT.
