## Streaming text summarization in a Compose screen

A complete ViewModel plus UI that summarizes an article, streams tokens live, and gracefully handles the `AVAILABLE_AFTER_DOWNLOAD` case with a download progress indicator.

```kotlin
// SummarizeViewModel.kt
@HiltViewModel
class SummarizeViewModel @Inject constructor(
    @ApplicationContext private val context: Context,
) : ViewModel() {

    sealed interface UiState {
        data object Checking : UiState
        data object Downloading : UiState
        data object Ready : UiState
        data object NotSupported : UiState
        data class Running(val partial: String) : UiState
        data class Done(val result: String) : UiState
        data class Error(val message: String) : UiState
    }

    private val _state = MutableStateFlow<UiState>(UiState.Checking)
    val state: StateFlow<UiState> = _state.asStateFlow()

    private val model = GenerativeModel.getInstance(
        context,
        SummarizationConfig.Builder()
            .setOutputLength(SummarizationConfig.OutputLength.MEDIUM)
            .build()
    )

    init {
        viewModelScope.launch { initModel() }
    }

    private suspend fun initModel() {
        _state.value = UiState.Checking
        when (model.availability()) {
            Availability.AVAILABLE -> _state.value = UiState.Ready
            Availability.AVAILABLE_AFTER_DOWNLOAD -> {
                _state.value = UiState.Downloading
                model.prepareFeature()       // suspends until download completes
                _state.value = UiState.Ready
            }
            else -> _state.value = UiState.NotSupported
        }
    }

    fun summarize(articleText: String) {
        if (_state.value !is UiState.Ready && _state.value !is UiState.Done) return
        viewModelScope.launch {
            _state.value = UiState.Running("")
            val session = model.createSession()
            try {
                session.execute(SummarizationRequest(articleText))
                    .collect { token ->
                        val prev = (_state.value as? UiState.Running)?.partial.orEmpty()
                        _state.value = UiState.Running(prev + token)
                    }
                val summary = (_state.value as? UiState.Running)?.partial.orEmpty()
                _state.value = UiState.Done(summary)
            } catch (e: Exception) {
                _state.value = UiState.Error(e.localizedMessage ?: "Inference failed")
            } finally {
                session.close()
            }
        }
    }
}

// SummarizeScreen.kt
@Composable
fun SummarizeScreen(
    articleText: String,
    viewModel: SummarizeViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        when (val s = state) {
            is SummarizeViewModel.UiState.Checking ->
                LinearProgressIndicator(modifier = Modifier.fillMaxWidth())

            is SummarizeViewModel.UiState.Downloading -> {
                LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
                Text("Downloading Gemini Nano…", style = MaterialTheme.typography.bodySmall)
            }

            is SummarizeViewModel.UiState.Ready ->
                Button(onClick = { viewModel.summarize(articleText) }) {
                    Text("Summarize")
                }

            is SummarizeViewModel.UiState.Running -> {
                Text("Summarizing…", style = MaterialTheme.typography.labelMedium)
                Text(s.partial, style = MaterialTheme.typography.bodyMedium)
            }

            is SummarizeViewModel.UiState.Done ->
                Card {
                    Text(
                        s.result,
                        modifier = Modifier.padding(12.dp),
                        style = MaterialTheme.typography.bodyMedium,
                    )
                }

            is SummarizeViewModel.UiState.NotSupported ->
                Text(
                    "On-device summarization is not available on this device.",
                    color = MaterialTheme.colorScheme.error,
                )

            is SummarizeViewModel.UiState.Error ->
                Text(s.message, color = MaterialTheme.colorScheme.error)
        }
    }
}
```

## Proofreading with diff highlights

A ViewModel that runs the `ProofreadingSession` and exposes per-edit annotations so the UI can highlight corrections inline.

```kotlin
data class ProofreadResult(
    val correctedText: String,
    val edits: List<ProofreadEdit>,
)

data class ProofreadEdit(
    val original: String,
    val replacement: String,
    val reason: String,
)

@HiltViewModel
class ProofreadViewModel @Inject constructor(
    @ApplicationContext private val context: Context,
) : ViewModel() {

    sealed interface UiState {
        data object Idle : UiState
        data object Unavailable : UiState
        data object Running : UiState
        data class Done(val result: ProofreadResult) : UiState
        data class Error(val message: String) : UiState
    }

    private val _state = MutableStateFlow<UiState>(UiState.Idle)
    val state: StateFlow<UiState> = _state.asStateFlow()

    private val model = GenerativeModel.getInstance(
        context,
        ProofreadingConfig.Builder().build()
    )

    init {
        viewModelScope.launch {
            val avail = model.availability()
            if (avail == Availability.AVAILABLE_AFTER_DOWNLOAD) model.prepareFeature()
            if (avail == Availability.NOT_SUPPORTED) _state.value = UiState.Unavailable
        }
    }

    fun proofread(text: String) {
        if (_state.value is UiState.Running) return
        viewModelScope.launch {
            _state.value = UiState.Running
            val session = model.createSession()
            try {
                // ProofreadingSession returns a single response object, not a streamed flow.
                val response = session.execute(ProofreadingRequest(text))
                _state.value = UiState.Done(
                    ProofreadResult(
                        correctedText = response.correctedText,
                        edits = response.corrections.map {
                            ProofreadEdit(it.originalText, it.correctedText, it.reason)
                        },
                    )
                )
            } catch (e: Exception) {
                _state.value = UiState.Error(e.localizedMessage ?: "Proofreading failed")
            } finally {
                session.close()
            }
        }
    }
}

@Composable
fun ProofreadScreen(
    draftText: String,
    viewModel: ProofreadViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    Column(
        modifier = Modifier.fillMaxWidth().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Button(
            onClick = { viewModel.proofread(draftText) },
            enabled = state !is ProofreadViewModel.UiState.Running &&
                      state !is ProofreadViewModel.UiState.Unavailable,
        ) {
            Text("Proofread")
        }

        when (val s = state) {
            is ProofreadViewModel.UiState.Done -> {
                Text("Corrected:", style = MaterialTheme.typography.labelMedium)
                Text(s.result.correctedText)
                if (s.result.edits.isNotEmpty()) {
                    Spacer(Modifier.height(8.dp))
                    Text("Edits (${s.result.edits.size}):", style = MaterialTheme.typography.labelMedium)
                    s.result.edits.forEach { edit ->
                        Text(
                            "\"${edit.original}\" → \"${edit.replacement}\": ${edit.reason}",
                            style = MaterialTheme.typography.bodySmall,
                        )
                    }
                }
            }
            is ProofreadViewModel.UiState.Unavailable ->
                Text("Not supported on this device.", color = MaterialTheme.colorScheme.error)
            is ProofreadViewModel.UiState.Error ->
                Text(s.message, color = MaterialTheme.colorScheme.error)
            else -> Unit
        }
    }
}
```

## On-device image description for accessibility alt text

A screen that captures a photo from the gallery, passes the bitmap to `ImageDescriptionSession`, and surfaces the generated description for use as an accessibility label.

```kotlin
@HiltViewModel
class ImageDescriptionViewModel @Inject constructor(
    @ApplicationContext private val context: Context,
) : ViewModel() {

    sealed interface UiState {
        data object Idle : UiState
        data object NotSupported : UiState
        data class Running(val partial: String) : UiState
        data class Done(val description: String) : UiState
        data class Error(val message: String) : UiState
    }

    private val _state = MutableStateFlow<UiState>(UiState.Idle)
    val state: StateFlow<UiState> = _state.asStateFlow()

    private val model = GenerativeModel.getInstance(
        context,
        ImageDescriptionConfig.Builder().build()
    )

    init {
        viewModelScope.launch {
            val avail = model.availability()
            if (avail == Availability.AVAILABLE_AFTER_DOWNLOAD) model.prepareFeature()
            if (avail == Availability.NOT_SUPPORTED) _state.value = UiState.NotSupported
        }
    }

    fun describe(bitmap: Bitmap) {
        if (_state.value is UiState.Running) return
        viewModelScope.launch {
            _state.value = UiState.Running("")
            val session = model.createSession()
            try {
                session.execute(ImageDescriptionRequest(bitmap))
                    .collect { token ->
                        val prev = (_state.value as? UiState.Running)?.partial.orEmpty()
                        _state.value = UiState.Running(prev + token)
                    }
                val desc = (_state.value as? UiState.Running)?.partial.orEmpty()
                _state.value = UiState.Done(desc)
            } catch (e: Exception) {
                _state.value = UiState.Error(e.localizedMessage ?: "Description failed")
            } finally {
                session.close()
            }
        }
    }
}

@Composable
fun ImageDescriptionScreen(viewModel: ImageDescriptionViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    var selectedBitmap by remember { mutableStateOf<Bitmap?>(null) }

    val launcher = rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri ->
        uri ?: return@rememberLauncherForActivityResult
        // Decode the bitmap off the main thread in the ViewModel in a real app.
        // Simplified here for illustration.
        selectedBitmap = MediaStore.Images.Media.getBitmap(
            LocalContext.current.contentResolver, uri
        )
    }

    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Button(onClick = { launcher.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)) }) {
            Text("Pick Image")
        }

        selectedBitmap?.let { bmp ->
            Image(
                bitmap = bmp.asImageBitmap(),
                contentDescription = null,
                modifier = Modifier.fillMaxWidth().aspectRatio(16f / 9f).clip(MaterialTheme.shapes.medium),
            )
            Button(onClick = { viewModel.describe(bmp) }) {
                Text("Generate Description")
            }
        }

        when (val s = state) {
            is ImageDescriptionViewModel.UiState.Running ->
                Text("Describing… ${s.partial}", style = MaterialTheme.typography.bodyMedium)
            is ImageDescriptionViewModel.UiState.Done ->
                Card(modifier = Modifier.fillMaxWidth()) {
                    Text(
                        s.description,
                        modifier = Modifier.padding(12.dp),
                        style = MaterialTheme.typography.bodyMedium,
                    )
                }
            is ImageDescriptionViewModel.UiState.NotSupported ->
                Text("Image description is not supported on this device.", color = MaterialTheme.colorScheme.error)
            is ImageDescriptionViewModel.UiState.Error ->
                Text(s.message, color = MaterialTheme.colorScheme.error)
            else -> Unit
        }
    }
}
```

## Hybrid on-device / cloud rewrite with transparent fallback

A ViewModel that tries Gemini Nano first and silently falls back to a Retrofit cloud endpoint when the device does not support AICore, keeping the UI API identical in both cases.

```kotlin
interface RewriteRepository {
    suspend fun rewrite(text: String, style: RewriteStyle): Flow<String>
}

enum class RewriteStyle { SHORTEN, ELABORATE, FORMAL }

// On-device implementation
class OnDeviceRewriteRepository(
    context: Context,
) : RewriteRepository {
    private val model = GenerativeModel.getInstance(
        context,
        RewritingConfig.Builder().build()
    )

    override suspend fun rewrite(text: String, style: RewriteStyle): Flow<String> {
        val nanoStyle = when (style) {
            RewriteStyle.SHORTEN   -> RewritingStyle.SHORTEN
            RewriteStyle.ELABORATE -> RewritingStyle.ELABORATE
            RewriteStyle.FORMAL    -> RewritingStyle.FORMAL
        }
        val session = model.createSession()
        return session.execute(RewritingRequest(text, nanoStyle))
            .onCompletion { session.close() }
    }
}

// Cloud fallback implementation (simplified — uses a hypothetical Retrofit service)
class CloudRewriteRepository(
    private val api: RewriteApi,
) : RewriteRepository {
    override suspend fun rewrite(text: String, style: RewriteStyle): Flow<String> =
        flow { emit(api.rewrite(text, style.name.lowercase())) }
}

// Factory that picks the right implementation at startup
class RewriteRepositoryFactory @Inject constructor(
    @ApplicationContext private val context: Context,
    private val cloudRepo: CloudRewriteRepository,
) {
    suspend fun create(): RewriteRepository {
        val model = GenerativeModel.getInstance(context, RewritingConfig.Builder().build())
        return when (model.availability()) {
            Availability.AVAILABLE -> OnDeviceRewriteRepository(context)
            Availability.AVAILABLE_AFTER_DOWNLOAD -> {
                model.prepareFeature()
                OnDeviceRewriteRepository(context)
            }
            else -> cloudRepo
        }
    }
}

@HiltViewModel
class RewriteViewModel @Inject constructor(
    private val factory: RewriteRepositoryFactory,
) : ViewModel() {

    private val _output = MutableStateFlow("")
    val output: StateFlow<String> = _output.asStateFlow()

    private var repository: RewriteRepository? = null

    init {
        viewModelScope.launch {
            repository = factory.create()
        }
    }

    fun rewrite(text: String, style: RewriteStyle) {
        val repo = repository ?: return
        viewModelScope.launch {
            _output.value = ""
            repo.rewrite(text, style).collect { token ->
                _output.value += token
            }
        }
    }
}
```
