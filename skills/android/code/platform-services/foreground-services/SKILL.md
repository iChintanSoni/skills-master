---
name: foreground-services
description: Covers Android foreground services — declaring service types, posting a required notification, handling background-start restrictions, and managing lifecycle. Use when building features that require long-running, user-visible work such as media playback, navigation, fitness tracking, or file transfers.
globs:
  - "**/*.kt"
tags: [foreground-service, service-types, notification, background-work, lifecycle]
x-skills-master:
  domain: android
  class: code
  category: platform-services
  platforms: ["android", "large-screen"]
  requires: { "android": "16", "kotlin": "2.2" }
  pairs_with: []
  sources:
    - https://developer.android.com/develop/background-work/services/foreground-services
    - https://developer.android.com/develop/background-work/services/fgs/service-types
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Use a foreground service when your app must perform work that:

- Is directly noticeable to the user (media playback, turn-by-turn navigation, ongoing call, active workout).
- Must continue even after the user leaves the app, yet is not deferrable.
- Requires hardware that only the foreground context can sustain (camera, microphone, GPS at high accuracy).

Do **not** reach for a foreground service for deferrable, constraint-based, or periodic work. That class of work belongs to WorkManager. If the work can wait for network, charging, or idle conditions, WorkManager is the correct choice and avoids the notification overhead and system scrutiny that foreground services attract.

## Core guidance

**Declare the service and its type in the manifest**

Every foreground service must declare a `foregroundServiceType` in `AndroidManifest.xml`. Android 14 (API 34) made the type attribute mandatory and rejects services without a recognized type at runtime. Android 15 (API 35) added further enforcement; untyped services started on API 35+ throw a `MissingForegroundServiceTypeException`.

Available types (use the minimum set you need):
- `camera` — sustained camera access
- `connectedDevice` — Bluetooth, USB, NFC device interaction
- `dataSync` — uploading or downloading user data
- `health` — fitness and health sensors
- `location` — sustained GPS or fused-location access
- `mediaPlayback` — audio or video playback
- `mediaProjection` — screen capture via `MediaProjection`
- `microphone` — sustained audio recording
- `phoneCall` — ongoing call or VoIP
- `remoteMessaging` — real-time messaging with remote participants
- `shortService` — brief, time-limited tasks (max ~3 min); no extra permission required
- `specialUse` — for scenarios not covered above; requires justification in a `<property>` element

**Request permissions that match your type**

Each type requires a corresponding `<uses-permission>`. Pair them correctly:

| Type | Permission |
|---|---|
| camera | `FOREGROUND_SERVICE_CAMERA` |
| location | `FOREGROUND_SERVICE_LOCATION` |
| mediaPlayback | `FOREGROUND_SERVICE_MEDIA_PLAYBACK` |
| microphone | `FOREGROUND_SERVICE_MICROPHONE` |
| dataSync | `FOREGROUND_SERVICE_DATA_SYNC` |
| health | `FOREGROUND_SERVICE_HEALTH` |
| shortService | `FOREGROUND_SERVICE_SHORT_SERVICE` |
| (others) | corresponding `FOREGROUND_SERVICE_*` permission |

All `FOREGROUND_SERVICE_*` permissions are normal-level; they are granted at install time without user prompting.

**Post a notification and call `startForeground` promptly**

The service must call `startForeground(id, notification, foregroundServiceType)` within 10 seconds of starting or the system raises an `ANR`. The notification must remain visible for as long as the service runs.

```kotlin
class LocationTrackingService : Service() {

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = buildNotification()
        // API 29+: pass the type flags; must match the manifest declaration
        ServiceCompat.startForeground(
            this,
            NOTIFICATION_ID,
            notification,
            ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION
        )
        startLocationUpdates()
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        stopLocationUpdates()
        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE)
        super.onDestroy()
    }

    private fun buildNotification(): Notification {
        val channel = NotificationChannel(
            CHANNEL_ID, "Location", NotificationManager.IMPORTANCE_LOW
        )
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Tracking your route")
            .setSmallIcon(R.drawable.ic_location)
            .setOngoing(true)
            .build()
    }

    companion object {
        private const val NOTIFICATION_ID = 1001
        private const val CHANNEL_ID = "location_tracking"
    }
}
```

Use `ServiceCompat.startForeground` (from `androidx.core`) — it applies the correct 3-argument vs. 2-argument overload for the running API level automatically.

**Background-start restrictions (Android 12+)**

Apps targeting API 31+ cannot start a foreground service while in the background except via a small set of exemptions:

- The app has a visible activity.
- The app received a high-priority FCM message.
- The app has an exact alarm pending (`USE_EXACT_ALARM` / `SCHEDULE_EXACT_ALARM`).
- The app holds `SYSTEM_ALERT_WINDOW`.
- The device is currently charging and the app is on the battery-optimization whitelist.
- Specific Bluetooth and companion-device callbacks.

When none of these apply, use `WorkManager` with a foreground task (`setForeground`) instead of a direct service start. For user-initiated data transfers, use `WorkManager`'s user-initiated jobs (API 34+) which have explicit permission from the user gesture.

**Stopping correctly**

Call `stopForeground(STOP_FOREGROUND_REMOVE)` (or `ServiceCompat.stopForeground`) before `stopSelf()` to remove the notification atomically. Never leave the notification dangling. Prefer wrapping the work inside a coroutine scope tied to the service's lifecycle and cancelling it in `onDestroy`.

**Large-screen considerations**

On foldables and tablets, activities can be in a split-screen state and still count as "visible". Foreground-service start exemptions that depend on a visible activity continue to apply here. If your service manages a media session, update `MediaSession.setPlaybackState` as the screen configuration changes to keep system UI (lock screen, fold-over notification) consistent.

## Platform notes

- **Android 14 (API 34):** `foregroundServiceType` is mandatory; omitting it throws `InvalidForegroundServiceTypeException`. The `shortService` type was introduced here.
- **Android 15 (API 35):** `mediaProcessing` type added; `dataSync` services are now time-limited (6 hours per 24-hour window). Plan uploads/downloads to resume via `WorkManager` if they may exceed that window.
- **Android 16 (API 36, minSdk for this skill):** No additional foreground service type additions at time of writing; verify release notes before targeting.
- The `FOREGROUND_SERVICE` base permission (normal level) is still required in addition to the type-specific permission.
- Notification channels must be created before posting. Use `IMPORTANCE_LOW` or higher; `IMPORTANCE_NONE` silently drops the notification on some OEMs.
- On Wear OS, foreground services are more restricted; prefer `TileService` or `ComplicationDataSourceService` for surface-level updates.

## Pitfalls

- **Missing type permission causes a crash** — `SecurityException` at `startForeground` if the manifest lacks the matching `FOREGROUND_SERVICE_*` permission.
- **Wrong type at runtime** — passing a type flag to `startForeground` that is not declared in the manifest raises `InvalidForegroundServiceTypeException` on API 34+.
- **Background-start crash on API 31+** — calling `startService` / `startForegroundService` from a background context throws `ForegroundServiceStartNotAllowedException`. Guard with the exemption list or migrate to WorkManager.
- **Notification channel not created** — the notification is silently dropped on API 26+; always create the channel before building the notification, even if the channel already exists.
- **Calling `stopSelf` before `startForeground`** — if the work finishes instantly, the system may kill the process before the notification is posted. Always call `startForeground` unconditionally in `onStartCommand`.
- **Using `START_STICKY` without re-delivering intent data** — sticky services are restarted with a null intent; guard against null in `onStartCommand` and re-read any state from persistent storage.
- **Leaking a running service** — if the activity is destroyed without stopping the service, the notification persists and battery drains. Bind or use a broadcast to coordinate shutdown.
- **Skipping `ServiceCompat`** — the raw `startForeground(id, notification, type)` 3-arg overload is API 29+; calling it below that level crashes. `ServiceCompat` handles the conditional for you.

## References

- **Documentation:** [Foreground services](https://developer.android.com/develop/background-work/services/foreground-services)
- **Documentation:** [Foreground service types](https://developer.android.com/develop/background-work/services/fgs/service-types)
- **Reference:** [ServiceCompat (AndroidX Core)](https://developer.android.com/reference/androidx/core/app/ServiceCompat)

## See also

The `background-tasks-workmanager` skill covers WorkManager for deferrable and constraint-based work — the right alternative when a foreground service is not needed. The `user-notifications` skill covers notification channels, styles, and best practices for the required visible notification. The `core-location` skill covers the location permission model and fused-location setup that pairs with the `location` foreground service type.
