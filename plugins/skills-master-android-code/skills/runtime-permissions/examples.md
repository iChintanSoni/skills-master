# runtime-permissions — examples

## Single permission with full rationale and Settings fallback

```kotlin
// PermissionState.kt
enum class CameraPermissionState {
    NotRequested,
    ShowRationale,
    Granted,
    PermanentlyDenied,
}

// CameraViewModel.kt
@HiltViewModel
class CameraViewModel @Inject constructor(
    private val prefs: DataStore<Preferences>,
) : ViewModel() {

    private val _permissionState = MutableStateFlow(CameraPermissionState.NotRequested)
    val permissionState: StateFlow<CameraPermissionState> = _permissionState.asStateFlow()

    private val hasAskedKey = booleanPreferencesKey("camera_permission_asked")

    fun onResumeCheck(context: Context) {
        val granted = ContextCompat.checkSelfPermission(
            context, Manifest.permission.CAMERA
        ) == PackageManager.PERMISSION_GRANTED
        if (granted) _permissionState.value = CameraPermissionState.Granted
    }

    fun onCameraGranted() {
        _permissionState.value = CameraPermissionState.Granted
    }

    fun onCameraDenied(canShowRationale: Boolean) {
        viewModelScope.launch {
            val hasAsked = prefs.data.first()[hasAskedKey] ?: false
            _permissionState.value = when {
                canShowRationale -> CameraPermissionState.ShowRationale
                hasAsked -> CameraPermissionState.PermanentlyDenied
                else -> CameraPermissionState.NotRequested
            }
            prefs.edit { it[hasAskedKey] = true }
        }
    }

    fun onRationaleDismissed() {
        _permissionState.value = CameraPermissionState.PermanentlyDenied
    }
}

// CameraScreen.kt
@Composable
fun CameraScreen(viewModel: CameraViewModel = hiltViewModel()) {
    val context = LocalContext.current
    val activity = context as Activity
    val permissionState by viewModel.permissionState.collectAsStateWithLifecycle()

    val launcher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) {
            viewModel.onCameraGranted()
        } else {
            val canShowRationale = ActivityCompat.shouldShowRequestPermissionRationale(
                activity, Manifest.permission.CAMERA
            )
            viewModel.onCameraDenied(canShowRationale = canShowRationale)
        }
    }

    // Re-check on resume (handles one-time grant expiry and Settings grant)
    LifecycleEventEffect(Lifecycle.Event.ON_RESUME) {
        viewModel.onResumeCheck(context)
    }

    Scaffold { padding ->
        Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
            when (permissionState) {
                CameraPermissionState.Granted -> CameraPreviewContent()
                CameraPermissionState.ShowRationale -> CameraRationaleCard(
                    onAllow = { launcher.launch(Manifest.permission.CAMERA) },
                    onDecline = { viewModel.onRationaleDismissed() },
                )
                CameraPermissionState.PermanentlyDenied -> SettingsRedirectCard(
                    message = "Camera access is blocked. Enable it in Settings.",
                    onOpenSettings = {
                        val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                            data = Uri.fromParts("package", context.packageName, null)
                        }
                        context.startActivity(intent)
                    },
                )
                CameraPermissionState.NotRequested -> Button(
                    onClick = { launcher.launch(Manifest.permission.CAMERA) }
                ) { Text("Enable Camera") }
            }
        }
    }
}
```

## Multiple permissions — microphone and camera for a video call

```kotlin
private val VIDEO_CALL_PERMISSIONS = arrayOf(
    Manifest.permission.CAMERA,
    Manifest.permission.RECORD_AUDIO,
)

@Composable
fun VideoCallScreen(onCallReady: () -> Unit) {
    val context = LocalContext.current
    val activity = context as Activity

    var deniedPermissions by rememberSaveable { mutableStateOf<List<String>>(emptyList()) }
    var permanentlyDenied by rememberSaveable { mutableStateOf(false) }

    val launcher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { result ->
        val denied = result.filterValues { !it }.keys.toList()
        if (denied.isEmpty()) {
            onCallReady()
        } else {
            val anyPermanent = denied.none { perm ->
                ActivityCompat.shouldShowRequestPermissionRationale(activity, perm)
            }
            permanentlyDenied = anyPermanent
            deniedPermissions = denied
        }
    }

    // Check if already granted — skip the dialog
    LaunchedEffect(Unit) {
        val allGranted = VIDEO_CALL_PERMISSIONS.all { perm ->
            ContextCompat.checkSelfPermission(context, perm) == PackageManager.PERMISSION_GRANTED
        }
        if (allGranted) onCallReady()
    }

    Column(
        Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        when {
            permanentlyDenied -> {
                Text("Camera and microphone access is required for video calls.")
                Spacer(Modifier.height(16.dp))
                Button(onClick = {
                    context.startActivity(
                        Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                            data = Uri.fromParts("package", context.packageName, null)
                        }
                    )
                }) { Text("Open Settings") }
            }
            deniedPermissions.isNotEmpty() -> {
                val labels = deniedPermissions.joinToString(" and ") { perm ->
                    if (perm == Manifest.permission.CAMERA) "camera" else "microphone"
                }
                Text("$labels access is needed to join the call.")
                Spacer(Modifier.height(16.dp))
                Button(onClick = { launcher.launch(VIDEO_CALL_PERMISSIONS) }) {
                    Text("Grant Access")
                }
            }
            else -> {
                Text("This call requires camera and microphone access.")
                Spacer(Modifier.height(16.dp))
                Button(onClick = { launcher.launch(VIDEO_CALL_PERMISSIONS) }) {
                    Text("Start Video Call")
                }
            }
        }
    }
}
```

## Location with precise vs approximate handling

```kotlin
@Composable
fun NearbyPlacesScreen(onLocationReady: (precise: Boolean) -> Unit) {
    val context = LocalContext.current
    val activity = context as Activity

    var showRationale by remember { mutableStateOf(false) }
    var permanentlyDenied by remember { mutableStateOf(false) }

    val launcher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { result ->
        val fine = result[Manifest.permission.ACCESS_FINE_LOCATION] == true
        val coarse = result[Manifest.permission.ACCESS_COARSE_LOCATION] == true
        when {
            fine || coarse -> onLocationReady(fine) // coarse-only: degrade gracefully
            ActivityCompat.shouldShowRequestPermissionRationale(
                activity, Manifest.permission.ACCESS_COARSE_LOCATION
            ) -> showRationale = true
            else -> permanentlyDenied = true
        }
    }

    if (showRationale) {
        AlertDialog(
            onDismissRequest = { showRationale = false },
            title = { Text("Location needed") },
            text = { Text("Nearby Places uses your location to show relevant results. Precise location gives the best results, but approximate also works.") },
            confirmButton = {
                TextButton(onClick = {
                    showRationale = false
                    launcher.launch(
                        arrayOf(
                            Manifest.permission.ACCESS_FINE_LOCATION,
                            Manifest.permission.ACCESS_COARSE_LOCATION,
                        )
                    )
                }) { Text("Continue") }
            },
            dismissButton = {
                TextButton(onClick = { showRationale = false }) { Text("Not now") }
            },
        )
    }

    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        when {
            permanentlyDenied -> Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("Location access is blocked in Settings.")
                Spacer(Modifier.height(8.dp))
                OutlinedButton(onClick = {
                    context.startActivity(
                        Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                            data = Uri.fromParts("package", context.packageName, null)
                        }
                    )
                }) { Text("Open Settings") }
            }
            else -> Button(onClick = {
                launcher.launch(
                    arrayOf(
                        Manifest.permission.ACCESS_FINE_LOCATION,
                        Manifest.permission.ACCESS_COARSE_LOCATION,
                    )
                )
            }) { Text("Find Nearby Places") }
        }
    }
}
```

## POST_NOTIFICATIONS on Android 13+ with version guard

```kotlin
@Composable
fun NotificationOptInBanner(
    onGranted: () -> Unit,
    onDismiss: () -> Unit,
) {
    // No-op on Android 12 and below — permission is auto-granted
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
        LaunchedEffect(Unit) { onGranted() }
        return
    }

    val context = LocalContext.current
    val activity = context as Activity

    val alreadyGranted = ContextCompat.checkSelfPermission(
        context, Manifest.permission.POST_NOTIFICATIONS
    ) == PackageManager.PERMISSION_GRANTED

    if (alreadyGranted) {
        LaunchedEffect(Unit) { onGranted() }
        return
    }

    val launcher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) onGranted() else onDismiss()
    }

    Card(
        modifier = Modifier.fillMaxWidth().padding(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer),
    ) {
        Row(
            Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(Icons.Default.Notifications, contentDescription = null)
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text("Stay updated", style = MaterialTheme.typography.titleSmall)
                Text(
                    "Allow notifications to get reminders and alerts.",
                    style = MaterialTheme.typography.bodySmall,
                )
            }
            Spacer(Modifier.width(8.dp))
            TextButton(onClick = { launcher.launch(Manifest.permission.POST_NOTIFICATIONS) }) {
                Text("Allow")
            }
            IconButton(onClick = onDismiss) {
                Icon(Icons.Default.Close, contentDescription = "Dismiss")
            }
        }
    }
}
```
