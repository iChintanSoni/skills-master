---
name: wear-complications
description: Covers watch face complications on Wear OS from the data-source side — ComplicationDataSourceService subclassing, supported complication types, providing and refreshing complication data, handling permission, and the update lifecycle. Use when building an app that supplies live data to watch face complications on Wear OS 2+.
---

## When to use

Use this skill whenever you are building or updating an app that pushes data into watch face complications — step counts, weather summaries, battery percentages, calendar event countdowns, or any other metric users want to glance at without launching the app. The guidance covers everything from the data-source side: declaring the `ComplicationDataSourceService`, choosing appropriate complication types, constructing `ComplicationData` payloads, responding to activation callbacks, and triggering programmatic refreshes. It does not cover watch face implementation or complication rendering; those are the watch face's responsibility.

## Core guidance

### Roles in the complication ecosystem

- A **complication data source** (your app) is a `Service` subclass that the Wear OS system calls when a watch face slot needs fresh data.
- The **watch face** declares which complication types it accepts per slot. The data source declares which types it can produce. The system matches them.
- The user connects the two in the watch face editor. Your app has no programmatic control over which watch face or slot the user picks.

### Declaring the data source in the manifest

- Extend `ComplicationDataSourceService` and register it as a `<service>` with `android:permission="com.google.android.wearable.permission.BIND_COMPLICATION_PROVIDER"` and `android:exported="true"`.
- Add an `<intent-filter>` for action `android.support.wearable.complications.ACTION_COMPLICATION_UPDATE_REQUEST`.
- Supply a `<meta-data>` element pointing to a companion XML resource that declares `supportedTypes`, `updatePeriodSeconds`, and an optional preview complication type and value for the editor.

```xml
<!-- AndroidManifest.xml (service declaration) -->
<service
    android:name=".StepCountComplicationService"
    android:exported="true"
    android:label="@string/complication_label"
    android:permission="com.google.android.wearable.permission.BIND_COMPLICATION_PROVIDER">
    <intent-filter>
        <action android:name="android.support.wearable.complications.ACTION_COMPLICATION_UPDATE_REQUEST" />
    </intent-filter>
    <meta-data
        android:name="android.support.wearable.complications.COMPLICATION_SUPPORTED_TYPES"
        android:value="SHORT_TEXT,RANGED_VALUE,LONG_TEXT" />
    <meta-data
        android:name="android.support.wearable.complications.UPDATE_PERIOD_SECONDS"
        android:value="300" />
</service>
```

### Choosing supported complication types

Declare only the types that your data source can produce well. Offering too many types dilutes watch face compatibility without adding value.

| Type | Best for |
|---|---|
| `SHORT_TEXT` | A short label with optional icon (steps, temperature) |
| `LONG_TEXT` | A title and body, or an event description |
| `RANGED_VALUE` | Progress ring or arc (battery %, goal progress) |
| `SMALL_IMAGE` | A decorative or informational image without text |
| `MONOCHROMATIC_IMAGE` | Icon-only slot, tinted by the watch face |
| `NO_DATA` | Indicates data is temporarily unavailable |
| `NOT_CONFIGURED` | Data source needs user setup before delivering data |

### Implementing ComplicationDataSourceService

- Override `onComplicationRequest` (suspend-capable via `SuspendingComplicationDataSourceService`) to return a `ComplicationData` object matching the requested `complicationType`. Return `null` only if your source genuinely cannot satisfy the type.
- Override `getPreviewData(type)` to return a hard-coded, non-live sample shown in the watch face editor. Never call network or sensor APIs in `getPreviewData`.
- Override `onComplicationActivated(complicationInstanceId, type)` and `onComplicationDeactivated(complicationInstanceId)` to track active instances. Use instance IDs as the key for any per-complication preferences stored in `DataStore`.

```kotlin
class StepCountComplicationService : SuspendingComplicationDataSourceService() {

    override fun getPreviewData(type: ComplicationType): ComplicationData? =
        when (type) {
            ComplicationType.SHORT_TEXT -> ShortTextComplicationData.Builder(
                text = PlainComplicationText.Builder("8 k").build(),
                contentDescription = PlainComplicationText.Builder("8 000 steps").build()
            ).setMonochromaticImage(
                MonochromaticImage.Builder(
                    Icon.createWithResource(this, R.drawable.ic_steps)
                ).build()
            ).build()
            ComplicationType.RANGED_VALUE -> RangedValueComplicationData.Builder(
                value = 8_000f,
                min = 0f,
                max = 10_000f,
                contentDescription = PlainComplicationText.Builder("Steps goal").build()
            ).setText(PlainComplicationText.Builder("8 k").build()).build()
            else -> null
        }

    override suspend fun onComplicationRequest(
        request: ComplicationRequest
    ): ComplicationData? {
        val steps = StepRepository.todaySteps(applicationContext)  // suspend fun
        return when (request.complicationType) {
            ComplicationType.SHORT_TEXT -> ShortTextComplicationData.Builder(
                text = PlainComplicationText.Builder("${steps / 1000} k").build(),
                contentDescription = PlainComplicationText.Builder("$steps steps today").build()
            ).setMonochromaticImage(
                MonochromaticImage.Builder(
                    Icon.createWithResource(this, R.drawable.ic_steps)
                ).build()
            ).setTapAction(openAppPendingIntent())
            .build()
            ComplicationType.RANGED_VALUE -> RangedValueComplicationData.Builder(
                value = steps.toFloat().coerceAtMost(10_000f),
                min = 0f,
                max = 10_000f,
                contentDescription = PlainComplicationText.Builder("Steps goal").build()
            ).setText(PlainComplicationText.Builder("${steps / 1000} k").build())
            .build()
            else -> null
        }
    }

    private fun openAppPendingIntent(): PendingIntent = PendingIntent.getActivity(
        this,
        0,
        Intent(this, MainActivity::class.java),
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
}
```

### Requesting programmatic updates

- Call `ComplicationDataSourceUpdateRequester.create(context, componentName).requestUpdateAll()` from a `WorkManager` worker, a `BroadcastReceiver`, or any coroutine context when underlying data changes. This is the only supported way to push fresh data outside the system's own polling cycle.
- `requestUpdate(complicationInstanceId)` targets a single active instance. Prefer `requestUpdateAll()` unless you track which instance IDs are active and need per-instance control.
- Do not call `requestUpdateAll()` more often than meaningful data changes. The system throttles calls that arrive faster than the `UPDATE_PERIOD_SECONDS` minimum; excessive calls waste battery without delivering additional updates.

```kotlin
// Triggered from a WorkManager CoroutineWorker after a step count change
val updater = ComplicationDataSourceUpdateRequester.create(
    context = appContext,
    complicationDataSourceComponent = ComponentName(appContext, StepCountComplicationService::class.java)
)
updater.requestUpdateAll()
```

### Handling the `RECEIVE_COMPLICATION_DATA` permission

- On Wear OS 3+, your app must hold the `com.google.android.wearable.permission.RECEIVE_COMPLICATION_DATA` permission to receive update callbacks. Declare it in the manifest with `uses-permission` and handle the case where the user has not granted it — return `ComplicationType.NO_PERMISSION` data in `onComplicationRequest` when the permission check fails.
- Guide the user to grant the permission via a `PendingIntent` that opens the complication permission dialog.

### Data construction best practices

- Always set `contentDescription` on every `ComplicationData` type for accessibility. Watch faces read this aloud in screen-reader mode.
- Keep `SHORT_TEXT` values under 7 characters. Longer strings are truncated or overflow on small watch faces. Where possible, abbreviate dynamically (e.g. "10 k" instead of "10,432").
- Attach a `tapAction` `PendingIntent` wherever appropriate so users can deep-link into the relevant app screen.
- Use `TimeFormatComplicationText` or `TimeDifferenceComplicationText` for time-based fields; the watch face can then update the displayed time locally without triggering a full data-source callback on every tick.

## Platform notes

- **Wear OS 2 vs 3+:** Complication data sources work on both, but the permission model tightened in Wear OS 3. On Wear OS 2, `BIND_COMPLICATION_PROVIDER` was sufficient; on Wear OS 3, `RECEIVE_COMPLICATION_DATA` is also required for the service to receive calls.
- **Wear OS Tiles vs Complications:** Tiles are full-screen mini-apps driven by `TileService`; complications are small data slots controlled by the watch face. A data source serves complications only. Do not confuse the update APIs — `TileService.getUpdater` is entirely separate from `ComplicationDataSourceUpdateRequester`.
- **`UPDATE_PERIOD_SECONDS` floor:** The system enforces a minimum of 300 seconds (5 minutes) for the automatic polling interval regardless of the value you declare. For higher-frequency updates, use `requestUpdateAll()` triggered by data events rather than relying on the period.
- **Watch Face Format (WFF) on Wear OS 4+:** Static watch faces built with WFF can bind to your data source using the same complication mechanism. No changes to your data source are required; WFF handles rendering.
- **Background battery constraints:** The system may defer complication update delivery when the watch is in ambient mode or battery is critically low. Design your data to be tolerant of stale values — show the last known value, not an error state.

## Pitfalls

- **Returning `null` from `onComplicationRequest` when only the type is unsupported** — returning `null` removes data from the slot entirely. If the type is simply unrecognised, return `NoDataComplicationData()` to keep the slot occupied with a placeholder rather than going blank.
- **Performing blocking I/O in `getPreviewData`** — this callback is synchronous and called on the main thread by the editor. Always return a hardcoded constant; never hit the network or disk here.
- **Not tracking active instance IDs** — registering a `WorkManager` job to call `requestUpdate(instanceId)` without knowing whether that instance is still active wastes resources. Store active instance IDs in `DataStore` inside `onComplicationActivated` / `onComplicationDeactivated`.
- **Using `FLAG_MUTABLE` on tap-action `PendingIntent`** — tap `PendingIntent` objects must use `FLAG_IMMUTABLE` on API 31+ or the system will reject them.
- **Ignoring `ComplicationType.NOT_CONFIGURED`** — if your complication requires an account login or user preference, return `NotConfiguredComplicationData` with a `PendingIntent` that opens your settings screen. A blank or stub complication frustrates users.
- **Calling `requestUpdateAll()` inside `onComplicationRequest`** — this creates an infinite update loop. Trigger updates from external data change events only.
- **Missing `android:exported="true"` on the service** — the system cannot bind to a non-exported service; the complication silently never delivers data.

## References

- **Documentation — Complication overview:** [Watch face complications](https://developer.android.com/training/wearables/compose)
- **Documentation — Data source implementation:** [Complication data sources](https://developer.android.com/jetpack/androidx/releases/wear-watchface)

## See also

For building the watch face that consumes complication data, see patterns in the Wear OS watch face documentation. For Wear OS Tiles — the full-screen glanceable surface that lives alongside watch faces — the `health-services` skill shows the passive monitoring pattern that feeds tile data. For background scheduling that triggers `requestUpdateAll()` efficiently, consult the `workmanager` and `background-tasks` skills. For persisting active complication instance IDs across process restarts, the DataStore approach in `state-flow` applies directly.
