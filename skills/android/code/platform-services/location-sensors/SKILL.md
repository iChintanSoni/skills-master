---
name: location-sensors
description: Covers the Fused Location Provider for current location and updates, location permission tiers (coarse/fine/background/approximate), geofencing, and SensorManager for motion and position sensors including activity recognition. Use when requesting or streaming device location, setting up geofence triggers, reading accelerometer or gyroscope data, or classifying physical activity in an Android app.
globs:
  - "**/*.kt"
tags: [location, sensors, geofencing, fused-location, activity-recognition]
x-skills-master:
  domain: android
  class: code
  category: platform-services
  platforms: ["android", "large-screen"]
  requires: {android: "16", kotlin: "2.2"}
  pairs_with: []
  sources:
    - https://developer.android.com/develop/sensors-and-location/location
    - https://developer.android.com/develop/sensors-and-location/sensors/sensors_overview
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for this skill when any part of your app needs to know where the device is or how it is moving. That includes showing the user's position on a map, triggering actions when they arrive at a place, reading raw accelerometer or gyroscope data for fitness or gaming, or classifying whether the user is walking, running, or in a vehicle. It is also the right reference when reasoning about which permission tier to request and how to handle the runtime permission flow, including approximate-location and background-location edge cases.

## Core guidance

### Location permissions — choose the narrowest tier

- Declare only the permissions your use-case needs. There are four tiers in increasing sensitivity:
  - `ACCESS_COARSE_LOCATION` — city-level, derived from Wi-Fi/cell. Sufficient for weather or nearby content.
  - `ACCESS_FINE_LOCATION` — GPS-level precision. Needed for turn-by-turn or precise mapping.
  - `BACKGROUND_LOCATION` — fine or coarse access while the app is not in the foreground. Requires a separate, subsequent runtime request after the foreground permission is granted; Play policy mandates a disclosure screen before requesting it.
  - On Android 12+ users may grant **approximate** location (`COARSE` resolution even when you requested `FINE`) — always read the granted result and degrade gracefully.
- Request permissions at the point of need, not on app launch. Use `ActivityResultContracts.RequestMultiplePermissions` in a `rememberLauncherForActivityResult` block when in Compose.

### Fused Location Provider (FLP)

- Get an instance via `LocationServices.getFusedLocationProviderClient(context)`. Avoid the legacy `LocationManager` API unless targeting a very specific sensor or system requirement.
- For a **one-shot** current position, call `getLastLocation()` first — it is free and fast. Only fall back to `getCurrentLocation()` (which may wake GPS) when `getLastLocation()` returns `null` or a stale timestamp.
- For **continuous updates**, create a `LocationRequest` with `Priority` and `intervalMillis`. Use `Priority.PRIORITY_BALANCED_POWER_ACCURACY` unless you genuinely need GPS; it balances accuracy against battery.
- Stream updates as a `callbackFlow` wrapping `requestLocationUpdates` so the rest of the app consumes them as a `Flow<Location>`:

```kotlin
@SuppressLint("MissingPermission")
fun FusedLocationProviderClient.locationFlow(
    intervalMs: Long = 5_000L,
    priority: Int = Priority.PRIORITY_BALANCED_POWER_ACCURACY,
): Flow<Location> = callbackFlow {
    val request = LocationRequest.Builder(priority, intervalMs)
        .setMinUpdateIntervalMillis(intervalMs / 2)
        .setWaitForAccurateLocation(false)
        .build()

    val callback = object : LocationCallback() {
        override fun onLocationResult(result: LocationResult) {
            result.lastLocation?.let { trySend(it) }
        }
    }

    requestLocationUpdates(request, callback, Looper.getMainLooper())
        .addOnFailureListener { close(it) }

    awaitClose { removeLocationUpdates(callback) }
}
```

Collect this in a `ViewModel` with `stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)` so updates stop when the UI is off-screen and resume cleanly.

### Geofencing

- Geofences are defined with `Geofence.Builder`: set a `requestId`, `setCircularRegion(lat, lng, radiusMeters)`, the transition types you care about (`GEOFENCE_TRANSITION_ENTER`, `_EXIT`, or `_DWELL`), and an expiration.
- Register via `GeofencingClient.addGeofences(request, pendingIntent)`. The `PendingIntent` points to a `BroadcastReceiver` or a `HiltWorker`-backed `Worker` that handles `GeofencingEvent.fromIntent(intent)`.
- Geofences require `ACCESS_FINE_LOCATION` on all API levels and additionally `ACCESS_BACKGROUND_LOCATION` on Android 10+ if they must fire while the app is in the background.
- Remove geofences when no longer needed with `removeGeofences(listOf(id))` to conserve battery; they do not auto-remove when the process dies (they persist in the system until expiry or explicit removal).
- Limit total registered geofences to 100 per app (system cap). Re-register after device reboots or after the user clears app data — geofences do not survive these events.

### SensorManager and motion sensors

- Obtain the manager via `context.getSystemService(SensorManager::class.java)`. Check for sensor availability with `getDefaultSensor(Sensor.TYPE_*)` — it returns `null` when the hardware is absent; never assume presence.
- Register a `SensorEventListener` with the appropriate reporting rate: use `SENSOR_DELAY_NORMAL` for UI-driven displays, `SENSOR_DELAY_GAME` for interactive apps, and `SENSOR_DELAY_FASTEST` only when you can process every sample.
- Always unregister in the corresponding lifecycle callback (`onPause` / `onStop`) to prevent battery drain. In Compose, use a `DisposableEffect(Unit)` keyed on the sensor to register and unregister.
- For high-level activity classification (walking, running, cycling, vehicle) prefer the **Activity Recognition API** (`ActivityRecognitionClient.requestActivityUpdates`) over raw sensor fusion — it is lower power and returns probability-weighted `DetectedActivity` results.
- Batch sensor events using `registerListener(listener, sensor, delay, maxReportLatencyUs)` when real-time latency is not required; the system delivers events in larger batches while keeping the processor asleep longer.

### Battery and power hygiene

- Remove location callbacks and sensor listeners when the app goes to background unless foreground-service or background-location is explicitly granted and declared.
- Throttle FLP updates in foreground by setting `setMinUpdateDistanceMeters` so you only receive a callback when the device has actually moved.
- Prefer `getLastLocation` and event-driven geofences over polling an active `LocationRequest` when real-time position is not needed on-screen.

## Platform notes

- On **large-screen** devices (tablets, foldables), the same permission model and FLP APIs apply. Location updates collected in a `ViewModel` survive configuration changes gracefully, which matters because foldables trigger configuration changes on fold/unfold.
- Sensor axis orientation is relative to the device's natural orientation. On landscape-native tablets, the X/Y axes differ from a portrait phone — use `SensorManager.remapCoordinateSystem` when computing absolute orientation so your code works across form factors.
- ChromeOS passes through location from the underlying platform; the same APIs work but accuracy depends on connected networks rather than GPS hardware.
- On **Android 14+**, the system enforces that background-location permission is requested in a separate dialog from foreground permission — apps that attempt to request both in one call see the background-location request silently dropped.

## Pitfalls

- Requesting `ACCESS_BACKGROUND_LOCATION` at the same time as foreground location on Android 11+ causes a silent denial. Request foreground first, confirm it is granted, then request background if genuinely needed.
- Ignoring `null` from `getLastLocation()` and crashing or showing stale coordinates. The last-known location can be `null` on freshly rebooted devices or after clearing app data.
- Holding a `LocationCallback` reference in a `Fragment` or `Activity` without removing it in `onStop` — the system continues to wake the app even when the UI is invisible.
- Registering a `SensorEventListener` at `SENSOR_DELAY_FASTEST` and not processing events off the main thread — high-frequency sensor callbacks can saturate the main thread and cause jank.
- Relying on geofence transitions to arrive immediately. The system batches geofence checks to save power; transitions can arrive minutes after the actual boundary crossing, especially in low-power mode.
- Requesting fine location for a use-case that only needs coarse accuracy. This increases user concern during the permission dialog and risks rejection during Play policy review.
- Not removing geofences on sign-out or feature opt-out, leaving orphaned system callbacks that may be attributed to your app and confuse users.

## References

- **Documentation:** [Location overview](https://developer.android.com/develop/sensors-and-location/location)
- **Documentation:** [Sensors overview](https://developer.android.com/develop/sensors-and-location/sensors/sensors_overview)
- **Documentation:** [Request location permissions](https://developer.android.com/develop/sensors-and-location/location/permissions)
- **Documentation:** [Create and monitor geofences](https://developer.android.com/develop/sensors-and-location/location/geofencing)

## See also

For requesting runtime permissions in a Compose-idiomatic way using the `ActivityResultContracts` API, see `compose-side-effects`. For running background location work safely within battery restrictions, consider `background-tasks`. For displaying location data on a map surface, see `mapkit` (iOS analogue) or the Maps SDK guidance in your project. For wiring sensor data into a `ViewModel` and exposing it as `StateFlow`, see `state-flow` and `viewmodel`.
