---
name: wear-data-health
description: Covers the Wearable Data Layer API (MessageClient, DataClient, CapabilityClient) for phone-watch communication and Health Services for low-power sensor and exercise tracking on Wear OS. Use when building Wear OS apps that need to sync data with a paired phone, exchange messages, or read real-time health and sensor data during workouts or ongoing activities.
---

## When to use

Use this skill when your Wear OS app needs to communicate with its paired phone app, push live exercise metrics to a companion app, or read sensor data on-watch. It covers two distinct API families that are frequently combined: the **Wearable Data Layer API** for phone-watch transport, and **Health Services** for low-power exercise and passive sensor access. Reach for this skill when wiring up `DataClient`, `MessageClient`, or `CapabilityClient` on either side of the phone-watch boundary, or when setting up an `ExerciseClient`, `PassiveListenerService`, or `MeasureClient` on the watch.

## Core guidance

### Data Layer API — choosing the right channel

The Wearable Data Layer provides three distinct transports. Pick the one that matches the data's semantics:

- **`DataClient` / `DataItem`** — for replicated, keyed state that must survive reconnections. Both sides subscribe to the same URI-addressed item; the system syncs it automatically when the connection restores. Use for settings, configuration, and any value where only the latest copy matters.
- **`MessageClient`** — for fire-and-forget commands or small payloads (< 100 KB) that need a single, point-in-time delivery. Messages are not queued for offline delivery. Use for "start workout", "stop workout", or RPC-style triggers.
- **`CapabilityClient`** — for capability advertisement and discovery. A watch app declares a capability string in `wear.xml`; the phone discovers it to confirm the companion watch app is installed. Use before sending a message to find the node ID of the watch.

### Setting up the clients

Obtain all three clients through the `Wearable` entry point. The underlying `GoogleApiClient` connection is managed automatically on API 15+:

```kotlin
// Both phone and watch — identical API surface
val dataClient: DataClient = Wearable.getDataClient(context)
val messageClient: MessageClient = Wearable.getMessageClient(context)
val capabilityClient: CapabilityClient = Wearable.getCapabilityClient(context)

// Discover the watch node that advertises a capability
suspend fun findWatchNodeId(): String? {
    val capability = capabilityClient
        .getCapability("my_watch_app", CapabilityClient.FILTER_REACHABLE)
        .await()
    return capability.nodes.firstOrNull { it.isNearby }?.id
}

// Send a message to the watch (suspend extension on Tasks)
suspend fun sendStartCommand(nodeId: String) {
    messageClient.sendMessage(nodeId, "/start-exercise", byteArrayOf()).await()
}

// Write a DataItem — overwrites the previous value at this URI
suspend fun pushHeartRateThreshold(bpm: Int) {
    val request = PutDataMapRequest.create("/config/hr-threshold").apply {
        dataMap.putInt("bpm", bpm)
    }.asPutDataRequest().setUrgent()
    dataClient.putDataItem(request).await()
}
```

### Receiving Data Layer events

Implement `DataClient.OnDataChangedListener` or `MessageClient.OnMessageReceivedListener` in a `WearableListenerService` for background wake-ups, or register/unregister directly in a foreground component:

- Use `WearableListenerService` in the manifest when the watch or phone must wake up to handle events even when the app is not running. This is required for exercise commands sent from the phone while the watch app is in the background.
- When the UI is visible, register a listener in `onResume` / `onPause` (or `LaunchedEffect` scope) so the listener is tied to the component's lifecycle. Remove it in `onPause` to avoid leaking callbacks.
- Both sides of the pair (phone APK and watch APK) should declare a `WearableListenerService`; the system routes events to the correct process.

### Declare the capability on the watch

In the watch module, add `res/xml/wear.xml`:

```xml
<wearableApp package="com.example.watch">
    <capability name="my_watch_app" />
</wearableApp>
```

Reference it in the watch manifest:

```xml
<meta-data
    android:name="com.google.android.wearable.standalone"
    android:value="false" />
<meta-data
    android:name="com.google.android.gms.wearable.DATA_CAPABILITY"
    android:resource="@xml/wear" />
```

### Health Services — exercise tracking on the watch

Health Services runs entirely on the watch. There is no phone equivalent.

- **`ExerciseClient`** — manages an active, timed exercise session. Batches sensor deliveries at a configurable interval; the CPU sleeps between batches.
- **`PassiveMonitoringClient`** — listens for background health metrics (daily steps, resting HR) without a formal session. Delivers data via a `PassiveListenerService`.
- **`MeasureClient`** — real-time, foreground-only readings for a single data type (e.g. live heart rate on a tile). Stop it the moment the screen is off.

### Exercise session lifecycle

- Check `ExerciseClient.getCapabilities()` before starting. Requesting unsupported data types silently drops those metrics from updates — always verify and inform the user if a key metric is unavailable.
- Call `prepareExercise(config)` to warm sensors, then `startExercise(config)`. Skipping prepare causes latency on the first heart-rate sample.
- Register an `ExerciseUpdateCallback` before `startExercise`. Wrap the callback in a `callbackFlow` and collect from a coroutine scope tied to the exercise foreground service, not a `ViewModel`.
- Call `endExercise()` explicitly. Never let a session outlive the foreground service without resuming it.
- On GPS-dependent exercise types, request location permission and set `shouldEnableGps = true` in `ExerciseConfig`. GPS is the single largest battery cost — skip it for indoor activities.

### Ongoing Activity — keeping the watch exercise tile alive

Use `OngoingActivity` to surface a persistent exercise status in the watch's task switcher and complications while the user leaves the app:

- Build an `OngoingActivity` with a `Status` string (elapsed time, HR, pace) and a `PendingIntent` back to the exercise screen.
- Call `apply(context)` on the `OngoingActivity` to register it; call `recoverOngoingActivity(context)` on launch to re-attach after a process restart.
- Update the status by calling `ongoingActivity.update(context, newStatus)` from the exercise update callback — typically every 10–30 seconds.

### Collecting exercise updates with callbackFlow

```kotlin
// In a repository owned by the exercise foreground service
fun exerciseUpdates(exerciseClient: ExerciseClient): Flow<ExerciseUpdate> =
    callbackFlow {
        val callback = object : ExerciseUpdateCallback {
            override fun onExerciseUpdateReceived(update: ExerciseUpdate) {
                trySend(update)
            }
            override fun onLapSummaryReceived(lapSummary: ExerciseLapSummary) = Unit
            override fun onAvailabilityChanged(
                dataType: DataType<*, *>,
                availability: Availability
            ) = Unit
            override fun onRegistered() = Unit
            override fun onRegistrationFailed(throwable: Throwable) {
                cancel(CancellationException("Exercise registration failed", throwable))
            }
        }
        exerciseClient.setUpdateCallback(callback)
        awaitClose { exerciseClient.clearUpdateCallbackAsync(callback) }
    }
```

### Passive monitoring

- Subclass `PassiveListenerService`; declare it in the manifest with `android.permission.BIND_PASSIVE_LISTENER_SERVICE`.
- Keep the `PassiveListenerConfig` data type list as narrow as possible — each extra type increases background sensor cost.
- In `onNewDataPointsReceived`, write data to a local database or publish to Health Connect immediately; the service may be killed before the user opens the app again.

### Battery and power rules

- Use batched delivery intervals of 5–30 seconds for most exercise UI updates. Reserve interval 0 (flush every sample) only for medical-grade requirements.
- Release `MeasureClient` registrations as soon as the screen turns off. Holding a live HR measurement indefinitely drains the watch battery noticeably.
- For tiles showing daily step counts, use `PassiveMonitoringClient` and push tile updates in `onNewDataPointsReceived`. Do not poll a `MeasureClient` in a tile renderer.

## Platform notes

- Health Services is Wear OS only. There is no equivalent on handheld Android — on the phone, use Health Connect or the device's `SensorManager` APIs directly.
- The Wearable Data Layer requires both apps (phone and watch) to share the same `applicationId` prefix and be signed with the same key. Without matching package names the capability lookup returns zero nodes.
- Wear OS 4 requires apps to target API 30 minimum. Wear OS 5 (based on Android 15) is the current flagship and ships on Pixel Watch 3 and Galaxy Watch 7+.
- `WearableListenerService` events are dispatched only to the app whose package matches the sending side. Declaring the service in the phone APK is insufficient if the watch app has a different `applicationId`.
- The `DataLayer` transport is not designed for high-bandwidth streams (audio, large images). Keep individual `DataItem` payloads under 100 KB; use `ChannelClient` for file-sized transfers.
- `OngoingActivity` is a Wear OS API; it is not available on handheld Android. Guard calls with a Wear-OS capability check or module split.

## Pitfalls

- Sending a message without first discovering a reachable node ID causes the call to fail silently. Always query `CapabilityClient` and check `node.isNearby` before calling `sendMessage`.
- Registering a `DataClient.OnDataChangedListener` in `Application.onCreate` on both sides without removing it causes duplicate deliveries and leaks. Scope listener registration to the lifecycle of the component that owns the data.
- Calling `startExercise` without calling `prepareExercise` produces a noticeable delay before the first heart-rate sample arrives. Always call `prepareExercise` first when latency matters.
- Running exercise update collection in a `ViewModel` coroutine scope is incorrect on Wear OS. The `ViewModel` is tied to the UI lifecycle, but the exercise should continue while the screen is off. Keep exercise state in a foreground service.
- Requesting GPS in `ExerciseConfig` for indoor workouts (strength, yoga, swim) dramatically reduces battery life with no benefit. Set `shouldEnableGps = false` for all non-outdoor types.
- Not clearing the `ExerciseUpdateCallback` in `awaitClose` (or `onDestroy`) leaks the registration and prevents the sensor hub from releasing resources. Always pair `setUpdateCallback` with `clearUpdateCallbackAsync`.
- A `DataItem` written without `.setUrgent()` may be delayed up to 30 minutes by the system's power-saving delivery batching. Call `setUrgent()` only for user-initiated state changes; leave it off for ambient background syncs.
- The `WearableListenerService` is killed immediately after `onMessageReceived` returns. Do not launch a coroutine inside the service without tying it to a `ServiceScope`; use `lifecycleScope` (if subclassing `LifecycleService`) or launch a foreground service from within the handler.

## References

- **Documentation — Wearable Data Layer:** [Data Layer API](https://developer.android.com/training/wearables/data-layer)
- **Documentation — Health Services:** [Health Services on Wear OS](https://developer.android.com/health-and-fitness/guides/health-services)

## See also

The `health-services` skill covers `ExerciseClient`, `PassiveMonitoringClient`, and Health Connect in depth including permissions and the shared health datastore. For scheduling deferred work that runs after an exercise session ends (e.g. syncing summary records), see the `workmanager` skill. For building Wear OS tiles that display passive health metrics, see the `app-widgets-glance` skill. For structuring the foreground service that owns the exercise session, see the `foreground-services` skill.
