---
name: health-services
description: Covers Health Services on Wear OS for low-power sensor and exercise tracking, and Health Connect as the on-device health datastore and cross-app sharing layer including permissions. Use when building fitness or health features on Wear OS with real-time sensor data, or when reading/writing health records from a phone or watch app via Health Connect.
---

## When to use

Use this skill when your Wear OS app needs real-time sensor readings (heart rate, calories, steps, pace, distance) during an active workout session, or when you want to read and write health records — sleep, nutrition, blood pressure, weight — that persist beyond a single session. The two APIs complement each other: Health Services streams live data on-watch with minimal battery drain, while Health Connect is a durable store that your phone, watch, and third-party apps all read from and write to. Consult this skill before wiring up any `ExerciseClient`, `PassiveMonitoringClient`, or `HealthConnectClient` call.

## Core guidance

### Health Services — three client types

- `ExerciseClient` — tracks an active workout session (running, cycling, swimming, etc.). It batches sensor samples and delivers them at a cadence you choose, keeping the CPU asleep between deliveries.
- `PassiveMonitoringClient` — listens for background health metrics (daily steps, resting heart rate) without starting a formal exercise. Delivers data via a `BroadcastReceiver` or a `Service` so the system can launch your component on demand.
- `MeasureClient` — low-latency, foreground-only reading of a single metric. Use it when the user is looking at a real-time heart rate tile; dismiss it when the screen turns off.

### Exercise session lifecycle

- Call `prepareExercise(config)` before `startExercise(config)`. The prepare phase warms sensors so the first sample arrives faster.
- Always register an `ExerciseUpdateCallback` before calling `startExercise`. Updates arrive on the callback thread — use a `callbackFlow` wrapper or a `Channel` to bridge to coroutines.
- Call `endExercise()` or `pauseExercise()` in response to user actions; never let a session leak across process death without resuming it.
- Check `ExerciseCapabilities` to verify the device supports the requested metrics before starting. Requesting unavailable data types silently drops those metrics.

### Collecting exercise data with Flow

```kotlin
// In a repository bound to a Wear OS service
fun exerciseUpdates(): Flow<ExerciseUpdate> = callbackFlow {
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
            cancel(CancellationException("Registration failed", throwable))
        }
    }
    exerciseClient.setUpdateCallback(callback)
    awaitClose { exerciseClient.clearUpdateCallbackAsync(callback) }
}
```

### Passive monitoring

- Declare a `PassiveListenerService` subclass and register it in the manifest with the `BIND_PASSIVE_LISTENER_SERVICE` permission.
- Specify the data types and health events you want in `PassiveListenerConfig`. Keep the list narrow — each extra data type increases sensor polling cost.
- In `onNewDataPointsReceived`, persist data to Health Connect immediately; the service may be killed before the user opens the app.

### Health Connect — the shared health store

- Add the `health-connect-client` Jetpack artifact and declare the `<uses-permission>` entries for each record type your app reads or writes (e.g. `READ_HEART_RATE`, `WRITE_STEPS`).
- Gate every call on `HealthConnectClient.sdkStatus(context)`. If the result is `SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED`, prompt the user to update Health Connect from the Play Store; it is a separate APK on Android 13 and below and built into the OS from Android 14+.
- Always request permissions at runtime via `PermissionController.createRequestPermissionResultContract()` before reading or writing. Do not assume permissions from a previous session are still granted.
- Batch inserts with `insertRecords(listOf(...))` for efficiency. Prefer a single batch call over multiple individual inserts.
- Use `readRecords(ReadRecordsRequest(...))` with a `TimeRangeFilter` and a page token for paginated reads. Never pull an unbounded time range in one call.
- Subscribe to changes with `getChangesToken` and `getChanges` to sync only deltas, not the full dataset, on subsequent launches.

### Permissions and privacy rules

- Each record type requires its own read and write permission. Request only the types your feature actively uses — reviewers and users both scrutinize health permissions.
- Health Connect displays a unified permissions UI that shows every app's access in one place. Your app cannot override or hide this.
- On Wear OS, Health Services permissions (body sensors) and Health Connect permissions are separate. A watch app may hold both; handle each independently.
- Never cache raw health data in your own database beyond what the user's feature needs. Store aggregates or derived values; leave the authoritative copy in Health Connect.

### Low-power best practices

- For always-on metrics on a watch tile, use `PassiveMonitoringClient` and update the tile in `onNewDataPointsReceived`. Avoid holding a `MeasureClient` alive when the tile is not interactive.
- Request `ExerciseConfig.shouldEnableGps` only when the exercise type genuinely requires it (outdoor running, cycling). GPS is the single largest battery drain.
- Prefer batched delivery intervals of 5–30 seconds for most UI updates. Only use interval 0 (flush every sample) for medical-grade scenarios.

## Platform notes

- Health Services is Wear OS only. There is no phone equivalent — on a phone, use Health Connect directly or the device's built-in sensor APIs.
- Health Connect is available on Android 8.0+ (API 26+) with the companion APK, and natively from Android 14 (API 34). The Jetpack client handles both transparently.
- Wear OS 4+ ships Health Connect on-watch, enabling a watch app to write records locally without a paired phone. Check `HealthConnectClient.sdkStatus` on the watch separately from the phone.
- The `READ_HEALTH_DATA_IN_BACKGROUND` permission is required to read Health Connect records when your app is not in the foreground. Request it only if your use case genuinely needs background reads.
- For apps targeting the Play Store, include a `health_permissions` XML resource and a privacy policy URL in your manifest; Health Connect enforces this at review time.

## Pitfalls

- Calling `startExercise` without `prepareExercise` causes noticeable startup latency on heart rate. Always call `prepareExercise` first.
- Forgetting to clear the `ExerciseUpdateCallback` leaks the registration and wastes battery. Use `clearUpdateCallbackAsync` in `awaitClose` or `onDestroy`.
- Requesting an exercise data type the device does not support does not throw — it silently drops that data type from updates. Always check `ExerciseCapabilities` and inform the user if a key metric is unavailable.
- Writing duplicate records to Health Connect with overlapping time windows causes `DuplicateDataException`. Use record `clientRecordId` for idempotent writes: identical `clientRecordId` values overwrite the previous record instead of creating duplicates.
- Accessing `HealthConnectClient` without checking `sdkStatus` first will throw on devices where Health Connect is not installed. Never skip the status check.
- Collecting PassiveMonitoring data in a `ViewModel` coroutine scope is incorrect — the ViewModel may be alive on the phone but the Wear service is not bound. Keep passive data collection in a `PassiveListenerService`.
- Do not request health permissions in the foreground-service permission request flow. Health Connect permissions must go through the dedicated `PermissionController` contract.

## References

- **Documentation — Health Services:** [Health Services on Wear OS](https://developer.android.com/health-and-fitness/guides/health-services)
- **Documentation — Health Connect:** [Health Connect guide](https://developer.android.com/health-and-fitness/guides/health-connect)

## See also

For Wear OS tile and complication data presentation, see `controls-widgets` and `widgetkit`-adjacent patterns. For background work scheduling that pairs with passive monitoring, see the `background-tasks` skill. For structuring the repository layer that bridges Health Services callbacks to coroutines, consult `swift-concurrency` equivalents in the `state-flow` and `viewmodel` skills.
