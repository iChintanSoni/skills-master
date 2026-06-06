## CameraController with Compose viewfinder, photo capture, and front/back switch

A complete camera screen backed by a ViewModel, using `LifecycleCameraController` for the preview and capture, with a button to flip between lenses.

```kotlin
// CameraViewModel.kt
class CameraViewModel(application: Application) : AndroidViewModel(application) {
    private val _lensFacing = MutableStateFlow(CameraSelector.LENS_FACING_BACK)
    val lensFacing: StateFlow<Int> = _lensFacing.asStateFlow()

    fun flipLens() {
        _lensFacing.update { current ->
            if (current == CameraSelector.LENS_FACING_BACK)
                CameraSelector.LENS_FACING_FRONT
            else
                CameraSelector.LENS_FACING_BACK
        }
    }
}

// CameraScreen.kt
@Composable
fun CameraScreen(
    viewModel: CameraViewModel = viewModel(),
    onPhotoCaptured: (Uri) -> Unit,
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val lensFacing by viewModel.lensFacing.collectAsStateWithLifecycle()

    // Controller created once; survives recomposition
    val controller = remember {
        LifecycleCameraController(context).apply {
            setEnabledUseCases(CameraController.IMAGE_CAPTURE)
        }
    }

    // Update the lens selector when the user flips
    LaunchedEffect(lensFacing) {
        controller.cameraSelector = CameraSelector.Builder()
            .requireLensFacing(lensFacing)
            .build()
    }

    Box(modifier = Modifier.fillMaxSize()) {
        CameraPreview(
            controller = controller,
            lifecycleOwner = lifecycleOwner,
            modifier = Modifier.fillMaxSize(),
        )

        Row(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 32.dp),
            horizontalArrangement = Arrangement.spacedBy(24.dp),
        ) {
            IconButton(onClick = viewModel::flipLens) {
                Icon(Icons.Default.FlipCameraAndroid, contentDescription = "Flip camera")
            }
            FloatingActionButton(onClick = {
                val file = File(context.filesDir, "${System.currentTimeMillis()}.jpg")
                val options = ImageCapture.OutputFileOptions.Builder(file).build()
                controller.takePicture(
                    options,
                    ContextCompat.getMainExecutor(context),
                    object : ImageCapture.OnImageSavedCallback {
                        override fun onImageSaved(output: ImageCapture.OutputFileResults) {
                            output.savedUri?.let(onPhotoCaptured)
                        }
                        override fun onError(e: ImageCaptureException) {
                            Log.e("Camera", "Capture failed", e)
                        }
                    }
                )
            }) {
                Icon(Icons.Default.CameraAlt, contentDescription = "Take photo")
            }
        }
    }
}

@Composable
private fun CameraPreview(
    controller: LifecycleCameraController,
    lifecycleOwner: LifecycleOwner,
    modifier: Modifier = Modifier,
) {
    AndroidView(
        factory = { ctx ->
            PreviewView(ctx).apply {
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

## Real-time ImageAnalysis with ML Kit barcode scanning

A screen that continuously decodes barcodes from camera frames, deduplicating rapid repeated detections, and shows the last scanned value in an overlay.

```kotlin
@Composable
fun BarcodeScannerScreen() {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current

    var lastBarcode by remember { mutableStateOf<String?>(null) }

    val barcodeScanner = remember {
        BarcodeScanning.getClient(
            BarcodeScannerOptions.Builder()
                .setBarcodeFormats(Barcode.FORMAT_ALL_FORMATS)
                .build()
        )
    }

    val cameraExecutor = remember { Executors.newSingleThreadExecutor() }
    DisposableEffect(Unit) { onDispose { cameraExecutor.shutdown() } }

    val controller = remember {
        LifecycleCameraController(context).apply {
            setEnabledUseCases(CameraController.IMAGE_ANALYSIS)
            setImageAnalysisBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
            setImageAnalysisAnalyzer(cameraExecutor) { imageProxy ->
                val mediaImage = imageProxy.image
                if (mediaImage != null) {
                    val inputImage = InputImage.fromMediaImage(
                        mediaImage, imageProxy.imageInfo.rotationDegrees
                    )
                    barcodeScanner.process(inputImage)
                        .addOnSuccessListener { barcodes ->
                            barcodes.firstOrNull()?.rawValue?.let { value ->
                                if (value != lastBarcode) lastBarcode = value
                            }
                        }
                        .addOnCompleteListener { imageProxy.close() }
                } else {
                    imageProxy.close()
                }
            }
        }
    }

    Box(Modifier.fillMaxSize()) {
        AndroidView(
            factory = { ctx ->
                PreviewView(ctx).apply {
                    scaleType = PreviewView.ScaleType.FILL_CENTER
                    this.controller = controller
                    controller.bindToLifecycle(lifecycleOwner)
                }
            },
            modifier = Modifier.fillMaxSize(),
        )
        lastBarcode?.let { value ->
            Surface(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(16.dp),
                color = MaterialTheme.colorScheme.primaryContainer,
                shape = MaterialTheme.shapes.medium,
            ) {
                Text(
                    text = value,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                    style = MaterialTheme.typography.bodyLarge,
                )
            }
        }
    }
}
```

## VideoCapture with start/stop recording

A recording screen that uses `ProcessCameraProvider` for explicit use-case control, saving video to `MediaStore` with audio.

```kotlin
@Composable
fun VideoRecordScreen() {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current

    var isRecording by remember { mutableStateOf(false) }
    val recordingRef = remember { mutableStateOf<Recording?>(null) }

    // Build use cases eagerly
    val recorder = remember {
        Recorder.Builder()
            .setQualitySelector(QualitySelector.from(Quality.HD))
            .build()
    }
    val videoCapture = remember { VideoCapture.withOutput(recorder) }
    val preview = remember { Preview.Builder().build() }

    val previewView = remember { mutableStateOf<PreviewView?>(null) }

    // Bind once
    LaunchedEffect(lifecycleOwner) {
        val provider = ProcessCameraProvider.getInstance(context).await()
        provider.unbindAll()
        val camera = provider.bindToLifecycle(
            lifecycleOwner,
            CameraSelector.DEFAULT_BACK_CAMERA,
            preview,
            videoCapture,
        )
        previewView.value?.let { preview.setSurfaceProvider(it.surfaceProvider) }
    }

    Box(Modifier.fillMaxSize()) {
        AndroidView(
            factory = { ctx ->
                PreviewView(ctx).also {
                    previewView.value = it
                    preview.setSurfaceProvider(it.surfaceProvider)
                }
            },
            modifier = Modifier.fillMaxSize(),
        )

        FloatingActionButton(
            onClick = {
                if (isRecording) {
                    recordingRef.value?.stop()
                    recordingRef.value = null
                    isRecording = false
                } else {
                    val contentValues = ContentValues().apply {
                        put(MediaStore.Video.Media.DISPLAY_NAME, "VID_${System.currentTimeMillis()}")
                        put(MediaStore.Video.Media.MIME_TYPE, "video/mp4")
                    }
                    val options = MediaStoreOutputOptions.Builder(
                        context.contentResolver,
                        MediaStore.Video.Media.EXTERNAL_CONTENT_URI,
                    ).setContentValues(contentValues).build()

                    recordingRef.value = videoCapture.output
                        .prepareRecording(context, options)
                        .withAudioEnabled()
                        .start(ContextCompat.getMainExecutor(context)) { event ->
                            if (event is VideoRecordEvent.Finalize && event.hasError()) {
                                Log.e("Camera", "Video error: ${event.cause}")
                            }
                        }
                    isRecording = true
                }
            },
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 32.dp),
            containerColor = if (isRecording) MaterialTheme.colorScheme.error
            else MaterialTheme.colorScheme.primary,
        ) {
            Icon(
                imageVector = if (isRecording) Icons.Default.Stop else Icons.Default.FiberManualRecord,
                contentDescription = if (isRecording) "Stop" else "Record",
            )
        }
    }
}
```

## Camera Extensions — night mode with availability check

Enabling the NIGHT extension where supported and gracefully falling back to the default camera selector.

```kotlin
@Composable
fun NightModeCamera() {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    var extensionAvailable by remember { mutableStateOf(false) }

    val preview = remember { Preview.Builder().build() }
    val imageCapture = remember { ImageCapture.Builder().build() }

    LaunchedEffect(Unit) {
        val cameraProvider = ProcessCameraProvider.getInstance(context).await()
        val extensionsManager = ExtensionsManager.getInstanceAsync(context, cameraProvider).await()

        val nightAvailable = extensionsManager.isExtensionAvailable(
            CameraSelector.DEFAULT_BACK_CAMERA,
            ExtensionMode.NIGHT,
        )
        extensionAvailable = nightAvailable

        val cameraSelector = if (nightAvailable) {
            extensionsManager.getExtensionEnabledCameraSelector(
                CameraSelector.DEFAULT_BACK_CAMERA,
                ExtensionMode.NIGHT,
            )
        } else {
            CameraSelector.DEFAULT_BACK_CAMERA
        }

        cameraProvider.unbindAll()
        cameraProvider.bindToLifecycle(
            lifecycleOwner, cameraSelector, preview, imageCapture
        )
    }

    Box(Modifier.fillMaxSize()) {
        AndroidView(
            factory = { ctx ->
                PreviewView(ctx).also { pv ->
                    preview.setSurfaceProvider(pv.surfaceProvider)
                }
            },
            modifier = Modifier.fillMaxSize(),
        )
        if (extensionAvailable) {
            Badge(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(16.dp),
            ) {
                Text("Night Mode")
            }
        }
    }
}
```
