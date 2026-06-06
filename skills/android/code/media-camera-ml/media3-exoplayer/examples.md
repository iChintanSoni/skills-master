## Adaptive HLS playlist with live progress tracking

```kotlin
// Demonstrates multi-item HLS playlist, playback state observation, and
// a Compose progress bar that updates at ~200 ms without hammering recomposition.

@HiltViewModel
class StreamViewModel @Inject constructor(
    @ApplicationContext private val context: Context
) : ViewModel() {

    val player: ExoPlayer = ExoPlayer.Builder(context)
        .setAudioAttributes(
            AudioAttributes.Builder()
                .setUsage(C.USAGE_MEDIA)
                .setContentType(C.AUDIO_CONTENT_TYPE_MOVIE)
                .build(),
            /* handleAudioFocus = */ true
        )
        .build()

    private val _isPlaying = MutableStateFlow(false)
    val isPlaying: StateFlow<Boolean> = _isPlaying.asStateFlow()

    private val _positionMs = MutableStateFlow(0L)
    val positionMs: StateFlow<Long> = _positionMs.asStateFlow()

    private val _durationMs = MutableStateFlow(0L)
    val durationMs: StateFlow<Long> = _durationMs.asStateFlow()

    private val listener = object : Player.Listener {
        override fun onIsPlayingChanged(isPlaying: Boolean) {
            _isPlaying.value = isPlaying
        }
        override fun onPlaybackStateChanged(state: Int) {
            if (state == Player.STATE_READY) {
                _durationMs.value = player.duration.coerceAtLeast(0L)
            }
        }
        override fun onPlayerError(error: PlaybackException) {
            // Log errorCode for diagnostics; surface friendly message to UI
            Log.e("StreamVM", "Playback error ${error.errorCode}: ${error.message}")
        }
    }

    init {
        player.addListener(listener)
        val items = listOf(
            "https://example.com/stream1/master.m3u8",
            "https://example.com/stream2/master.m3u8"
        ).map { MediaItem.fromUri(it) }
        player.setMediaItems(items)
        player.prepare()
    }

    fun startPositionPolling(scope: CoroutineScope) {
        scope.launch {
            while (isActive) {
                if (player.isPlaying) {
                    _positionMs.value = player.currentPosition
                }
                delay(200)
            }
        }
    }

    override fun onCleared() {
        player.removeListener(listener)
        player.release()
    }
}

@Composable
fun StreamScreen(viewModel: StreamViewModel = hiltViewModel()) {
    val isPlaying by viewModel.isPlaying.collectAsStateWithLifecycle()
    val positionMs by viewModel.positionMs.collectAsStateWithLifecycle()
    val durationMs by viewModel.durationMs.collectAsStateWithLifecycle()
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        viewModel.startPositionPolling(scope)
    }

    Column(modifier = Modifier.fillMaxSize()) {
        AndroidView(
            factory = { ctx ->
                PlayerView(ctx).apply {
                    player = viewModel.player
                    resizeMode = AspectRatioFrameLayout.RESIZE_MODE_FIT
                    useController = true
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(16f / 9f)
        )
        if (durationMs > 0) {
            LinearProgressIndicator(
                progress = { (positionMs.toFloat() / durationMs).coerceIn(0f, 1f) },
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp)
            )
        }
        Text(
            text = if (isPlaying) "Playing" else "Paused",
            modifier = Modifier.padding(16.dp)
        )
    }
}
```

## Widevine DRM with custom licence headers

```kotlin
// Shows building a DRM-protected MediaItem, attaching licence headers, and
// handling DRM-specific PlaybackExceptions with a user-visible error state.

data class DrmPlaybackState(
    val isReady: Boolean = false,
    val errorMessage: String? = null
)

class DrmViewModel(application: Application) : AndroidViewModel(application) {

    val player: ExoPlayer = ExoPlayer.Builder(application).build()

    private val _state = MutableStateFlow(DrmPlaybackState())
    val state: StateFlow<DrmPlaybackState> = _state.asStateFlow()

    private val listener = object : Player.Listener {
        override fun onPlaybackStateChanged(playbackState: Int) {
            if (playbackState == Player.STATE_READY) {
                _state.update { it.copy(isReady = true, errorMessage = null) }
            }
        }

        override fun onPlayerError(error: PlaybackException) {
            val msg = when (error.errorCode) {
                PlaybackException.ERROR_CODE_DRM_LICENSE_ACQUISITION_FAILED ->
                    "Could not acquire DRM licence. Check your connection."
                PlaybackException.ERROR_CODE_DRM_CONTENT_ERROR ->
                    "This content cannot be played on this device."
                PlaybackException.ERROR_CODE_DRM_SYSTEM_ERROR ->
                    "A DRM system error occurred."
                else -> "Playback failed (${error.errorCode})"
            }
            _state.update { it.copy(errorMessage = msg) }
        }
    }

    fun loadProtectedStream(contentUri: String, licenceUrl: String, token: String) {
        val drmConfig = DrmConfiguration.Builder(C.WIDEVINE_UUID)
            .setLicenseUri(licenceUrl)
            .setLicenseRequestHeaders(mapOf("X-Auth-Token" to token))
            .build()

        val item = MediaItem.Builder()
            .setUri(contentUri)
            .setDrmConfiguration(drmConfig)
            .build()

        player.setMediaItem(item)
        player.playWhenReady = true
        player.prepare()
    }

    override fun onCleared() {
        player.removeListener(listener)
        player.release()
    }
}

@Composable
fun DrmPlayerScreen(viewModel: DrmViewModel = viewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    LaunchedEffect(Unit) {
        viewModel.loadProtectedStream(
            contentUri = "https://example.com/protected/content.mpd",
            licenceUrl = "https://drm.example.com/widevine",
            token = "Bearer eyJ..."
        )
    }

    Box(modifier = Modifier.fillMaxSize()) {
        AndroidView(
            factory = { ctx ->
                PlayerView(ctx).apply {
                    player = viewModel.player
                    useController = true
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(16f / 9f)
                .align(Alignment.Center)
        )

        state.errorMessage?.let { msg ->
            Card(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(16.dp)
            ) {
                Text(
                    text = msg,
                    modifier = Modifier.padding(16.dp),
                    color = MaterialTheme.colorScheme.error
                )
            }
        }
    }
}
```

## Manual track selection (audio language switching)

```kotlin
// Demonstrates reading available audio tracks from currentTracks and
// switching language at runtime without recreating the player.

@Composable
fun TrackSelectorDemo(player: ExoPlayer) {
    var availableLanguages by remember { mutableStateOf<List<String>>(emptyList()) }
    var selectedLanguage by remember { mutableStateOf("") }

    // Capture available audio tracks whenever tracks change
    DisposableEffect(player) {
        val listener = object : Player.Listener {
            override fun onTracksChanged(tracks: Tracks) {
                val langs = mutableListOf<String>()
                for (group in tracks.groups) {
                    if (group.type == C.TRACK_TYPE_AUDIO) {
                        for (i in 0 until group.length) {
                            val format = group.getTrackFormat(i)
                            format.language?.let { langs.add(it) }
                        }
                    }
                }
                availableLanguages = langs.distinct()
            }
        }
        player.addListener(listener)
        onDispose { player.removeListener(listener) }
    }

    Column(modifier = Modifier.padding(16.dp)) {
        Text("Audio language", style = MaterialTheme.typography.labelLarge)
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            availableLanguages.forEach { lang ->
                FilterChip(
                    selected = lang == selectedLanguage,
                    onClick = {
                        selectedLanguage = lang
                        player.trackSelectionParameters = player.trackSelectionParameters
                            .buildUpon()
                            .setPreferredAudioLanguage(lang)
                            .build()
                    },
                    label = { Text(lang.uppercase()) }
                )
            }
        }
    }
}
```

## Picture-in-Picture on large screens and foldables

```kotlin
// Integrates PiP with ExoPlayer in a Compose-based Activity, observing
// WindowSizeClass to decide when to offer PiP and handling lifecycle correctly.

class PlayerActivity : ComponentActivity() {

    private lateinit var player: ExoPlayer

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        player = ExoPlayer.Builder(this)
            .setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(C.USAGE_MEDIA)
                    .setContentType(C.AUDIO_CONTENT_TYPE_MOVIE)
                    .build(),
                true
            )
            .build()
            .also {
                it.setMediaItem(MediaItem.fromUri("https://example.com/video.m3u8"))
                it.playWhenReady = true
                it.prepare()
            }

        setContent {
            MaterialTheme {
                val windowSizeClass = calculateWindowSizeClass(this)
                PlayerWithPip(
                    player = player,
                    onEnterPip = { enterPipIfSupported() },
                    isCompact = windowSizeClass.widthSizeClass == WindowWidthSizeClass.Compact
                )
            }
        }
    }

    private fun enterPipIfSupported() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val params = PictureInPictureParams.Builder()
                .setAspectRatio(Rational(16, 9))
                .build()
            enterPictureInPictureMode(params)
        }
    }

    override fun onUserLeaveHint() {
        if (player.isPlaying) enterPipIfSupported()
    }

    override fun onStop() {
        super.onStop()
        if (!isInPictureInPictureMode) {
            player.pause()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        player.release()
    }
}

@Composable
fun PlayerWithPip(
    player: ExoPlayer,
    onEnterPip: () -> Unit,
    isCompact: Boolean
) {
    Column(modifier = Modifier.fillMaxSize()) {
        AndroidView(
            factory = { ctx ->
                PlayerView(ctx).apply {
                    this.player = player
                    resizeMode = if (isCompact)
                        AspectRatioFrameLayout.RESIZE_MODE_FIT
                    else
                        AspectRatioFrameLayout.RESIZE_MODE_ZOOM
                    useController = true
                }
            },
            modifier = if (isCompact)
                Modifier.fillMaxWidth().aspectRatio(16f / 9f)
            else
                Modifier.fillMaxWidth().weight(1f)
        )
        if (!isCompact) {
            Button(
                onClick = onEnterPip,
                modifier = Modifier.padding(16.dp)
            ) {
                Text("Picture in Picture")
            }
        }
    }
}
```
