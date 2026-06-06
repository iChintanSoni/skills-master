---
name: ml-kit
description: Covers ML Kit on-device vision and language APIs (barcode scanning, text recognition, face detection, image labeling, translation, smart reply) — use when adding turnkey ML features to an Android app without building or hosting custom models.
---

## When to use

Use this skill when you need on-device ML inference without writing or hosting a custom model — barcode scanning, OCR, face detection, image classification, language identification, on-device translation, or smart reply. ML Kit is the right choice when latency, privacy, or offline requirements rule out a cloud API, and when one of the built-in feature sets matches the task.

Do not reach for ML Kit when you need custom model inference (use TensorFlow Lite / LiteRT directly), when you need server-side batch processing, or when a feature is only available in the Cloud ML Kit variant and on-device is a hard requirement.

## Core guidance

**Bundled vs unbundled models**

- Bundled models are compiled into the APK — instant availability, larger APK. Suitable for features that are core to the app experience and must work immediately after install.
- Unbundled models are downloaded from Google Play Services on first use. Smaller APK, but must handle the case where the model is not yet available. Call `RemoteModelManager` or check `isModelDownloaded` before first use and show a loading state.
- Prefer unbundled for optional or infrequently used features; prefer bundled only when offline-first and immediate availability justify the APK size cost.

**Gradle dependencies**

Each ML Kit feature ships as its own artifact. Add only what you need.

```kotlin
// build.gradle.kts (app)
dependencies {
    // Bundled barcode scanning
    implementation("com.google.mlkit:barcode-scanning:17.3.0")
    // Unbundled text recognition (downloads via Play Services)
    implementation("com.google.android.gms:play-services-mlkit-text-recognition:19.0.1")
    // On-device translation (unbundled by default)
    implementation("com.google.mlkit:translate:17.0.3")
}
```

**Creating and reusing detectors**

- Detectors and scanners are heavyweight — create them once (e.g., in a `ViewModel` or a singleton) and reuse across frames.
- Always call `close()` when the detector is no longer needed to release native resources.

**Feeding CameraX frames to an analyzer**

The most common integration pattern is a CameraX `ImageAnalysis` use case with a custom `ImageAnalysis.Analyzer`. ML Kit accepts `InputImage.fromMediaImage(mediaImage, rotationDegrees)`.

```kotlin
class BarcodeAnalyzer(
    private val onBarcodeDetected: (List<Barcode>) -> Unit
) : ImageAnalysis.Analyzer {

    private val scanner: BarcodeScanner = BarcodeScanning.getClient(
        BarcodeScannerOptions.Builder()
            .setBarcodeFormats(Barcode.FORMAT_QR_CODE, Barcode.FORMAT_EAN_13)
            .build()
    )

    @androidx.camera.core.ExperimentalGetImage
    override fun analyze(proxy: ImageProxy) {
        val mediaImage = proxy.image ?: run { proxy.close(); return }
        val inputImage = InputImage.fromMediaImage(mediaImage, proxy.imageInfo.rotationDegrees)

        scanner.process(inputImage)
            .addOnSuccessListener { barcodes ->
                if (barcodes.isNotEmpty()) onBarcodeDetected(barcodes)
            }
            .addOnCompleteListener {
                // MUST close the proxy so CameraX can deliver the next frame
                proxy.close()
            }
    }
}
```

Bind the analyzer in your Composable or Fragment using `ProcessCameraProvider`:

```kotlin
val imageAnalysis = ImageAnalysis.Builder()
    .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
    .build()
    .also { it.setAnalyzer(cameraExecutor, BarcodeAnalyzer { barcodes -> /* handle */ }) }
```

**Backpressure — always use `STRATEGY_KEEP_ONLY_LATEST`**

ML Kit processing is slower than camera frame delivery. `STRATEGY_KEEP_ONLY_LATEST` drops stale frames and keeps the pipeline from queuing up.

**Text recognition**

Use `TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)` for Latin scripts. For CJK or Devanagari scripts use the dedicated script-specific recognizer artifact and options class.

**Face detection**

Enable only the landmark and classification modes you actually need — enabling all modes costs latency. Set `setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_FAST)` for real-time preview use cases.

**On-device translation**

Translation models must be explicitly downloaded before use. Check `isModelDownloaded` and trigger `downloadModelIfNeeded` in the background (e.g., when connected to Wi-Fi). Wrap the async `Task` API in a suspending helper using `kotlinx.coroutines.tasks.await()` from `org.jetbrains.kotlinx:kotlinx-coroutines-play-services`.

```kotlin
suspend fun ensureModelReady(translator: Translator) {
    val conditions = DownloadConditions.Builder().requireWifi().build()
    translator.downloadModelIfNeeded(conditions).await()
}
```

**Smart Reply**

Smart Reply works on a `List<TextMessage>` representing a conversation. Messages must be in chronological order, and the final message must be from the remote participant for the API to generate reply suggestions. Cap the conversation history to the last 10 messages to control latency.

**Error handling**

`Task` failures surface as `MlKitException`. Check `MlKitException.getErrorCode()` — `MODEL_NOT_DOWNLOADED` requires a retry after ensuring the model is present. `NOT_ENOUGH_CONTEXT` from Smart Reply is not an error — simply show no suggestions.

**Testing**

- Use `FakeImageProxy` (from `camera-testing`) or synthetic `Bitmap`-backed `InputImage` instances in unit tests.
- For integration tests, provide a known test image from `androidTest/assets` and assert on the detector output.

## Platform notes

**Large screens and foldables**

On foldable devices, re-bind the CameraX use cases inside `Lifecycle.Event.ON_RESUME` or respond to `WindowLayoutInfo` changes, because the active camera and sensor orientation may change when the device folds or unfolds. Pass the updated `rotationDegrees` from `ImageProxy.imageInfo` — do not hard-code a rotation value.

On large screens the camera preview may be displayed at a non-default orientation. Always derive rotation from `Display.getRotation()` when constructing `InputImage` from a `Bitmap` rather than from a CameraX `ImageProxy`.

**Minimum SDK**

All ML Kit vision features require API 21 or higher at runtime. The `requires.android: "16"` entry in this skill reflects the project-level minimum, but ML Kit will not function below API 21 — gate feature availability with a runtime check if your `minSdk` is below 21.

**Play Services availability**

Unbundled models depend on Google Play Services. On devices without Play Services (some enterprise/OEM builds) the download will fail. Provide a graceful fallback or disable the feature on those devices by catching `ApiException` with status code `ConnectionResult.SERVICE_MISSING`.

## Pitfalls

- **Forgetting `proxy.close()`** — if `ImageProxy.close()` is not called in `addOnCompleteListener`, CameraX stalls and delivers no further frames.
- **Creating a new detector per frame** — constructing `BarcodeScanning.getClient(...)` inside `analyze()` allocates native resources on every call and causes severe GC pressure.
- **Using `STRATEGY_BLOCK_PRODUCER`** — this strategy causes frame queuing that results in increasing latency under continuous detection workloads.
- **Assuming model availability on first launch** — unbundled models are not present immediately after install. Guard with an `isModelDownloaded` check and communicate loading state to the user.
- **Enabling all face detector options** — enabling contours, landmarks, and classifications together multiplies latency; enable only what the feature requires.
- **Blocking the main thread** — ML Kit `Task` callbacks are delivered on the main thread by default; do not perform heavy work inside `addOnSuccessListener` without dispatching to a background coroutine.
- **Hardcoding image rotation** — rotation must come from `ImageProxy.imageInfo.rotationDegrees`; hardcoding 0 breaks detection on landscape or foldable device orientations.
- **Mixing bundled and unbundled artifacts for the same feature** — for example, adding both `mlkit:barcode-scanning` (bundled) and `play-services-mlkit-barcode-scanning` (unbundled) will cause duplicate class conflicts at build time.

## References

- **Documentation:** [ML Kit for Firebase — Overview](https://developers.google.com/ml-kit)
- **Documentation:** [ML Kit Vision APIs](https://developers.google.com/ml-kit/vision)
- **Library:** [kotlinx-coroutines-play-services](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-play-services/)

## See also

The `avfoundation-capture` skill covers equivalent camera pipeline patterns on Apple platforms. For custom on-device model inference beyond ML Kit's built-in features, see the `core-ml` skill (Apple) or consult the TensorFlow Lite / LiteRT documentation directly. The `camerax` and `permissions` skills are natural complements when setting up the camera pipeline and requesting `CAMERA` permission.
