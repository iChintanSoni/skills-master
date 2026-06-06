---
name: camerax
description: Covers CameraX — binding Preview, ImageCapture, ImageAnalysis, and VideoCapture use cases to a lifecycle, choosing CameraController vs ProcessCameraProvider, embedding a Compose camera preview, configuring resolution and aspect ratio, applying Camera Extensions, and requesting camera permissions. Use when adding a camera viewfinder, capturing photos or video, running real-time image analysis, or integrating vendor-specific camera extensions in a Jetpack Compose app.
---

## When to use

Reach for this guidance whenever an Android app needs to open the camera. CameraX is the modern, lifecycle-aware Jetpack camera library that replaces Camera2 for most use cases — it handles device compatibility across thousands of Android devices, manages Surface lifecycle automatically, and exposes a composable-friendly API. Use it for live viewfinders (Preview), single-frame photo capture (ImageCapture), per-frame ML or pixel processing (ImageAnalysis), video capture (VideoCapture), and vendor bokeh/HDR/night mode (Camera Extensions). Prefer CameraX over Camera2 unless you require a feature that CameraX does not yet expose.

## Core guidance

### Dependencies

Add the CameraX BOM to keep all library versions aligned:

```kotlin
// build.gradle.kts
dependencies {
    val cameraxVersion = "1.4.2"
    implementation("androidx.camera:camera-core:$cameraxVersion")
    implementation("androidx.camera:camera-camera2:$cameraxVersion")   // Camera2 back-end
    implementation("androidx.camera:camera-lifecycle:$cameraxVersion") // lifecycle integration
    implementation("androidx.camera:camera-view:$cameraxVersion")      // PreviewView + CameraController
    implementation("androidx.camera:camera-extensions:$cameraxVersion") // Camera Extensions
    // For video capture
    implementation("androidx.camera:camera-video:$cameraxVersion")
}
```

### CameraController vs ProcessCameraProvider

CameraX offers two entry points with different trade-offs:

- **`LifecycleCameraController`** (via `camera-view`) — high-level, opinionated API. Binds all use cases for you, integrates directly with `PreviewView`, supports tap-to-focus, pinch-to-zoom, and `ImageAnalysis`/`ImageCapture`/`VideoCapture` with minimal boilerplate. Choose this for most apps.
- **`ProcessCameraProvider`** — low-level API. Gives full control over which use cases are bound, how surfaces are created, and resolution strategies. Choose this when you need a custom surface (e.g. a `SurfaceView` in a game), unusual use-case combinations, or Camera2 interop via `Camera2CameraControl`.

### Permissions

Declare permissions in `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<!-- Only required for audio in video capture -->
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

Request permissions at runtime with `rememberPermissionState` (Accompanist/Jetpack) or the Activity contracts API before binding any use case. Never attempt to bind the camera before `CAMERA` permission is granted — the library throws if the permission is absent.

### Compose camera preview with CameraController

Embed `PreviewView` inside a Compose hierarchy using `AndroidView`:

```kotlin
@Composable
fun CameraPreview(
    controller: LifecycleCameraController,
    modifier: Modifier = Modifier,
) {
    val lifecycleOwner = LocalLifecycleOwner.current
    AndroidView(
        factory = { context ->
            PreviewView(context).apply {
                scaleType = PreviewView.ScaleType.FILL_CENTER
                implementationMode = PreviewView.ImplementationMode.COMPATIBLE
                this.controller = controller
                controller.bindToLifecycle(lifecycleOwner)
            }
        },
        modifier = modifier,
    )
}
```

Create the controller once, outside composition, so the camera is not re-bound on every recomposition:

```kotlin
val controller = remember {
    LifecycleCameraController(context).apply {
        setEnabledUseCases(
            CameraController.IMAGE_CAPTURE or
            CameraController.IMAGE_ANALYSIS
        )
    }
}
```

### Binding use cases with ProcessCameraProvider

When you need full control, resolve the provider, then bind inside a coroutine or `addListener` callback:

```kotlin
val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
cameraProviderFuture.addListener({
    val cameraProvider = cameraProviderFuture.get()

    val preview = Preview.Builder().build()
    val imageCapture = ImageCapture.Builder()
        .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
        .build()
    val imageAnalysis = ImageAnalysis.Builder()
        .setTargetResolution(Size(1280, 720))
        .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
        .build()

    cameraProvider.unbindAll()
    val camera = cameraProvider.bindToLifecycle(
        lifecycleOwner,
        CameraSelector.DEFAULT_BACK_CAMERA,
        preview,
        imageCapture,
        imageAnalysis,
    )
    preview.setSurfaceProvider(previewView.surfaceProvider)
}, ContextCompat.getMainExecutor(context))
```

### Resolution and aspect ratio

- Set a target aspect ratio or target resolution on each use case builder — not both.
- Use `ResolutionStrategy` (API 33+) or `ResolutionSelector` for fine-grained control over the fallback behavior when the exact size is unavailable.
- `ImageAnalysis` defaults to 640×480; set `setTargetResolution` or `setResolutionSelector` to match your ML model's input size and avoid unnecessary scaling.
- The `Preview` surface size is ultimately determined by the `PreviewView` layout pass — do not hard-code a resolution on `Preview` unless you have a specific reason.

```kotlin
val resolutionSelector = ResolutionSelector.Builder()
    .setAspectRatioStrategy(
        AspectRatioStrategy(AspectRatio.RATIO_16_9, AspectRatioStrategy.FALLBACK_RULE_AUTO)
    )
    .build()

val imageCapture = ImageCapture.Builder()
    .setResolutionSelector(resolutionSelector)
    .build()
```

### ImageCapture

```kotlin
// Capture to a file
val outputOptions = ImageCapture.OutputFileOptions.Builder(file).build()
imageCapture.takePicture(
    outputOptions,
    ContextCompat.getMainExecutor(context),
    object : ImageCapture.OnImageSavedCallback {
        override fun onImageSaved(output: ImageCapture.OutputFileResults) { /* notify UI */ }
        override fun onError(exception: ImageCaptureException) { /* handle */ }
    }
)
```

### ImageAnalysis

Set `STRATEGY_KEEP_ONLY_LATEST` so the analyzer always sees the newest frame, dropping frames it cannot keep up with. Call `image.close()` at the end of every analysis pass — failing to do so blocks the pipeline.

```kotlin
imageAnalysis.setAnalyzer(cameraExecutor) { imageProxy ->
    // Run ML inference or pixel work here
    val bitmap = imageProxy.toBitmap()
    // ...
    imageProxy.close() // MUST be called
}
```

### VideoCapture with Recorder

Use `Recorder` as the output target of `VideoCapture`. Recording requires `RECORD_AUDIO` permission if audio is included.

```kotlin
val recorder = Recorder.Builder()
    .setQualitySelector(QualitySelector.from(Quality.HIGHEST))
    .build()
val videoCapture = VideoCapture.withOutput(recorder)
// Start recording
val recording = videoCapture.output
    .prepareRecording(context, MediaStoreOutputOptions.Builder(
        contentResolver, MediaStore.Video.Media.EXTERNAL_CONTENT_URI
    ).build())
    .withAudioEnabled()
    .start(ContextCompat.getMainExecutor(context)) { event ->
        if (event is VideoRecordEvent.Finalize && !event.hasError()) {
            // saved
        }
    }
// Stop
recording.stop()
```

### Camera Extensions

Extensions add vendor-specific effects (BOKEH, HDR, NIGHT, FACE_RETOUCH, AUTO) where supported:

```kotlin
val extensionsManager = ExtensionsManager.getInstanceAsync(context, cameraProvider).await()
if (extensionsManager.isExtensionAvailable(CameraSelector.DEFAULT_BACK_CAMERA, ExtensionMode.BOKEH)) {
    val extendedCameraSelector = extensionsManager.getExtensionEnabledCameraSelector(
        CameraSelector.DEFAULT_BACK_CAMERA, ExtensionMode.BOKEH
    )
    cameraProvider.bindToLifecycle(lifecycleOwner, extendedCameraSelector, preview, imageCapture)
}
```

Always check availability before selecting an extension — it may not be present on the device.

### Key do/don't guidance

- Do create `LifecycleCameraController` or `ProcessCameraProvider` outside the composable body (in a `ViewModel` or a `remember` block at the top of the screen) so the camera is not torn down and re-bound on recomposition.
- Do call `unbindAll()` before binding a new set of use cases when switching cameras or modes.
- Do set `setBackpressureStrategy(STRATEGY_KEEP_ONLY_LATEST)` on `ImageAnalysis` to prevent frame queuing from stalling the camera pipeline.
- Do close every `ImageProxy` in `setAnalyzer` — a missing `close()` is the most common cause of camera pipeline stalls.
- Don't bind more use cases than the device supports simultaneously. Most devices support Preview + ImageCapture + ImageAnalysis together; adding VideoCapture on top may require dropping one.
- Don't read camera permission state inside the use-case binding callback — do it before and gate binding behind a confirmed grant.
- Don't call `bindToLifecycle` on a background thread; the method must be called on the main thread.

## Platform notes

- On **large-screen** devices (foldables, tablets), the camera may change physical sensor when the fold state changes. Observe `WindowInfoTracker` fold state and re-bind the camera if the active sensor should switch.
- Foldable devices often have cameras on both the inner and outer displays; expose a camera selector that accounts for the fold posture.
- `PreviewView` renders via `SurfaceView` (default, lower power) or `TextureView` (`COMPATIBLE` mode, needed when the preview is in a scrollable or partially overlapping container). Use `COMPATIBLE` mode inside a `LazyColumn` or any container that clips or transforms the view.
- On Android 16+, the Camera Restrictions APIs may limit concurrent use cases when another app holds the camera. Observe `CameraState` and show a graceful "camera in use" message.
- For large screens running in multi-window mode, the camera lifecycle follows the app's window focus, not the device screen state — bind to `LocalLifecycleOwner` which respects this correctly.

## Pitfalls

- Creating a new `LifecycleCameraController` inside the composable body without `remember` — the controller is re-created every recomposition, which restarts the camera and causes a viewfinder flicker.
- Forgetting `imageProxy.close()` in the `ImageAnalysis` analyzer — the camera pipeline queues frames waiting for the buffer to be released, eventually blocking capture.
- Using both `setTargetResolution` and `setAspectRatioStrategy` on the same use case builder — these conflict; choose one approach.
- Not checking extension availability before calling `getExtensionEnabledCameraSelector` — the method throws if the extension is unavailable on the device.
- Holding a reference to the `Camera` object returned by `bindToLifecycle` in a ViewModel field without clearing it — this can outlive the lifecycle and leak the camera resource.
- Binding use cases after the `Lifecycle` is already in `DESTROYED` state — always guard with `lifecycleOwner.lifecycle.currentState.isAtLeast(CREATED)`.
- Using `ImageCapture.CAPTURE_MODE_MAXIMIZE_QUALITY` for continuous capture — this significantly increases latency; prefer `MINIMIZE_LATENCY` unless the user explicitly requests high quality.

## References

- **Documentation:** [CameraX overview](https://developer.android.com/media/camera/camerax)
- **Documentation:** [CameraX architecture](https://developer.android.com/media/camera/camerax/architecture)
- **Documentation:** [ImageCapture](https://developer.android.com/media/camera/camerax/take-photo)
- **Documentation:** [ImageAnalysis](https://developer.android.com/media/camera/camerax/analyze)
- **Documentation:** [VideoCapture](https://developer.android.com/media/camera/camerax/video-capture)
- **Documentation:** [Camera Extensions](https://developer.android.com/media/camera/camerax/extensions-api)

## See also

For requesting runtime permissions before binding the camera, see `permissions` (if available) or the Accompanist permissions library. For running on-device ML on the `ImageProxy` frames produced by `ImageAnalysis`, see `core-ml` or the ML Kit integration guide. For embedding non-Compose views like `PreviewView` inside a Compose hierarchy more broadly, see `compose-view-interop`. For displaying captured images or video thumbnails, see `compose-images`.
