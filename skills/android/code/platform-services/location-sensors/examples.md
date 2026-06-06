## Requesting and streaming fine location in a ViewModel

A fitness-tracking screen needs continuous GPS updates while the UI is visible. Permissions are checked before the ViewModel requests updates; updates stop automatically when the collector leaves the composition.

```kotlin
// LocationRepository.kt
class LocationRepository @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    private val client = LocationServices.getFusedLocationProviderClient(context)

    @SuppressLint("MissingPermission")
    val locationUpdates: Flow<Location> = callbackFlow {
        val request = LocationRequest.Builder(
            Priority.PRIORITY_HIGH_ACCURACY,
            2_000L,
        )
            .setMinUpdateIntervalMillis(1_000L)
            .setMinUpdateDistanceMeters(5f)
            .build()

        val callback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                result.lastLocation?.let { trySend(it) }
            }
        }

        client.requestLocationUpdates(request, callback, Looper.getMainLooper())
            .addOnFailureListener { close(it) }

        awaitClose { client.removeLocationUpdates(callback) }
    }.flowOn(Dispatchers.Default)
}

// TrackingViewModel.kt
@HiltViewModel
class TrackingViewModel @Inject constructor(
    private val repo: LocationRepository,
) : ViewModel() {

    val location: StateFlow<Location?> = repo.locationUpdates
        .catch { emit(/* handle error */ return@catch }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)
}

// TrackingScreen.kt
@Composable
fun TrackingScreen(vm: TrackingViewModel = hiltViewModel()) {
    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { /* permission result handled here */ }

    val location by vm.location.collectAsStateWithLifecycle()

    LaunchedEffect(Unit) {
        permissionLauncher.launch(Manifest.permission.ACCESS_FINE_LOCATION)
    }

    Text(
        text = location?.let { "%.5f, %.5f".format(it.latitude, it.longitude) }
            ?: "Waiting for location…"
    )
}
```

---

## Setting up a geofence for a place of interest

A delivery app needs to fire a notification when a driver arrives within 200 m of a pickup location. The geofence persists until explicitly removed and must fire even when the app is in the background.

```kotlin
// GeofenceRepository.kt
class GeofenceRepository @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    private val client = LocationServices.getGeofencingClient(context)

    private val geofencePendingIntent: PendingIntent by lazy {
        val intent = Intent(context, GeofenceBroadcastReceiver::class.java)
        PendingIntent.getBroadcast(
            context, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE,
        )
    }

    @SuppressLint("MissingPermission")
    suspend fun addPickupGeofence(id: String, lat: Double, lng: Double) {
        val geofence = Geofence.Builder()
            .setRequestId(id)
            .setCircularRegion(lat, lng, 200f)
            .setExpirationDuration(Geofence.NEVER_EXPIRE)
            .setTransitionTypes(
                Geofence.GEOFENCE_TRANSITION_ENTER or Geofence.GEOFENCE_TRANSITION_DWELL
            )
            .setLoiteringDelay(30_000)
            .build()

        val request = GeofencingRequest.Builder()
            .setInitialTrigger(GeofencingRequest.INITIAL_TRIGGER_ENTER)
            .addGeofence(geofence)
            .build()

        client.addGeofences(request, geofencePendingIntent).await()
    }

    suspend fun removeGeofence(id: String) {
        client.removeGeofences(listOf(id)).await()
    }
}

// GeofenceBroadcastReceiver.kt
@AndroidEntryPoint
class GeofenceBroadcastReceiver : BroadcastReceiver() {
    @Inject lateinit var notifier: ArrivalNotifier

    override fun onReceive(context: Context, intent: Intent) {
        val event = GeofencingEvent.fromIntent(intent) ?: return
        if (event.hasError()) return
        if (event.geofenceTransition == Geofence.GEOFENCE_TRANSITION_ENTER ||
            event.geofenceTransition == Geofence.GEOFENCE_TRANSITION_DWELL
        ) {
            event.triggeringGeofences?.forEach { notifier.notifyArrival(it.requestId) }
        }
    }
}
```

---

## Reading accelerometer data with a DisposableEffect

A step-counter widget reads the accelerometer directly and renders the most recent acceleration magnitude as a real-time value in Compose. The listener is cleaned up whenever the composable leaves the composition.

```kotlin
@Composable
fun AccelerometerDisplay() {
    val context = LocalContext.current
    val sensorManager = remember {
        context.getSystemService(SensorManager::class.java)
    }
    val accelerometer = remember {
        sensorManager?.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
    }

    var magnitude by remember { mutableFloatStateOf(0f) }

    DisposableEffect(accelerometer) {
        if (accelerometer == null) return@DisposableEffect onDispose {}

        val listener = object : SensorEventListener {
            override fun onSensorChanged(event: SensorEvent) {
                val (x, y, z) = event.values
                magnitude = sqrt(x * x + y * y + z * z)
            }
            override fun onAccuracyChanged(sensor: Sensor, accuracy: Int) = Unit
        }

        sensorManager!!.registerListener(
            listener, accelerometer, SensorManager.SENSOR_DELAY_UI
        )

        onDispose { sensorManager.unregisterListener(listener) }
    }

    Text(
        text = if (magnitude > 0f) "%.2f m/s²".format(magnitude) else "No sensor",
        style = MaterialTheme.typography.displaySmall,
    )
}
```

---

## Activity recognition with the Activity Recognition API

A wellness app wants to automatically pause a workout timer when the user stops walking or running. It uses the high-level Activity Recognition API rather than raw sensors to avoid implementing its own motion classifier.

```kotlin
// ActivityRecognitionRepository.kt
class ActivityRecognitionRepository @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    private val client = ActivityRecognition.getClient(context)

    private val _activity = MutableStateFlow<DetectedActivity?>(null)
    val currentActivity: StateFlow<DetectedActivity?> = _activity.asStateFlow()

    private val pendingIntent: PendingIntent by lazy {
        val intent = Intent(context, ActivityTransitionReceiver::class.java)
        PendingIntent.getBroadcast(
            context, 1, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE,
        )
    }

    @SuppressLint("MissingPermission")
    suspend fun startMonitoring() {
        val transitions = listOf(
            DetectedActivity.WALKING,
            DetectedActivity.RUNNING,
            DetectedActivity.ON_FOOT,
            DetectedActivity.STILL,
        ).flatMap { type ->
            listOf(
                ActivityTransition.Builder()
                    .setActivityType(type)
                    .setActivityTransition(ActivityTransition.ACTIVITY_TRANSITION_ENTER)
                    .build(),
                ActivityTransition.Builder()
                    .setActivityType(type)
                    .setActivityTransition(ActivityTransition.ACTIVITY_TRANSITION_EXIT)
                    .build(),
            )
        }

        val request = ActivityTransitionRequest(transitions)
        client.requestActivityTransitionUpdates(request, pendingIntent).await()
    }

    suspend fun stopMonitoring() {
        client.removeActivityTransitionUpdates(pendingIntent).await()
    }
}
```
