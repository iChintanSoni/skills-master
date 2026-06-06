---
name: wear-tiles
description: Covers Wear OS Tiles built with TileService and ProtoLayout — the 3-slot layout, Tiles Material components, resource bundles, freshness strategy, and tile previews. Use when building glanceable, always-accessible surfaces that appear in the Wear OS tile carousel without launching a full app.
globs:
  - "**/*.kt"
tags: [wear-os, tiles, protolayout, tileservice, glanceable]
x-skills-master:
  domain: android
  class: code
  category: form-factors
  platforms: ["wear-os"]
  requires: { "android": "16", "kotlin": "2.2", "wear-compose": "1.5" }
  pairs_with: []
  sources:
    - https://developer.android.com/training/wearables/tiles
    - https://developer.android.com/jetpack/androidx/releases/wear-tiles
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Apply this skill when you need a glanceable surface that lives in the Wear OS tile carousel — the swipeable panels users reach from the watch face without opening an app. Tiles are the correct choice when:

- The core information can be read in one or two seconds (step count, heart rate, weather, next calendar event).
- The user should reach it with a single swipe from the watch face rather than navigating an app.
- You need the content to refresh automatically at an interval you control.
- Interactions are minimal (one or two taps that launch the app or toggle a value).

Tiles are not suitable for rich scrolling content, multi-screen flows, or anything requiring persistent UI state. For richer watch-face-adjacent experiences consider Complications; for full interactive watch UIs use Jetpack Compose for Wear OS instead.

## Core guidance

**Project setup**

Add the Tiles and ProtoLayout artifacts alongside Wear Compose:

```kotlin
// build.gradle.kts (app module)
dependencies {
    implementation("androidx.wear.tiles:tiles:1.5.0")
    implementation("androidx.wear.tiles:tiles-material:1.5.0")
    implementation("androidx.wear.protolayout:protolayout:1.3.0")
    implementation("androidx.wear.protolayout:protolayout-material:1.3.0")
    implementation("androidx.wear.protolayout:protolayout-expression:1.3.0")
    // For previews in Android Studio
    debugImplementation("androidx.wear.tiles:tiles-renderer:1.5.0")
    debugImplementation("androidx.wear.tiles:tiles-tooling-preview:1.5.0")
}
```

Declare the service in `AndroidManifest.xml`:

```xml
<service
    android:name=".StepsTileService"
    android:exported="true"
    android:permission="com.google.android.wearable.permission.BIND_TILE_PROVIDER"
    android:label="@string/tile_label"
    android:icon="@drawable/ic_steps">
    <intent-filter>
        <action android:name="androidx.wear.tiles.action.BIND_TILE_PROVIDER" />
    </intent-filter>
    <meta-data
        android:name="androidx.wear.tiles.PREVIEW"
        android:resource="@drawable/tile_preview" />
</service>
```

**TileService lifecycle**

- Extend `ListenableFutureTileService` (preferred with Guava/Coroutines) or the coroutine-friendly `SuspendingTileService` from `androidx.wear.tiles:tiles` 1.4+. Keep `onTileRequest` fast — it runs on a background thread but must not block the main thread.
- Override `onTileRequest` to return a `Tile` containing a `TileTimeline` and override `onResourcesRequest` to supply image resources.
- The system calls `onTileAddEvent` / `onTileRemoveEvent` so you can start or stop background data collection (e.g., Health Services listeners) exactly when needed.
- Call `TileService.getUpdater(context).requestUpdate(MyTileService::class.java)` from outside the service (e.g., from a sensor callback) to push a fresh tile without waiting for the scheduled interval.

**ProtoLayout and the 3-slot layout**

Tiles UIs are built with ProtoLayout, a declarative layout system serialized as protobuf. The idiomatic Wear OS tile pattern is the **PrimaryLayout** — a three-slot arrangement optimized for round and square watch faces:

- **Primary label** (top): one-line summary or metric.
- **Content** (center): the main glanceable value, typically a `CircularProgressIndicator`, large text, or `CompactChip`.
- **Secondary label** (bottom): unit, timestamp, or short context.

Use `androidx.wear.protolayout.material.layouts.PrimaryLayout` and the Material components from `protolayout-material` rather than building raw `Box`/`Row`/`Column` trees. The Material layer handles watch-shape adaptation, font scaling, and spacing.

**Key do/don'ts**

- Do use `PrimaryLayout`, `CompactChip`, `Chip`, `CircularProgressIndicator`, and `Text` from `protolayout-material`; they respect Wear OS visual guidelines automatically.
- Do set `Tile.Builder.setFreshnessIntervalMillis()` to control how often the system refreshes the tile (minimum 60 seconds; use longer intervals for infrequently changing data).
- Do provide a meaningful `android:label` and preview drawable so users recognize the tile in the tile picker.
- Do not inflate standard Android `View` hierarchies or Compose content inside a tile — ProtoLayout is the only supported layout system.
- Do not perform network calls inside `onTileRequest`; pre-fetch data in a `WorkManager` worker or a `DataStore` and read it synchronously in the handler.
- Do not store mutable state in the `TileService` instance — the system may destroy and recreate it at any time.

```kotlin
class StepsTileService : SuspendingTileService() {

    override suspend fun resourcesRequest(
        requestParams: ResourcesRequest
    ): Resources = Resources.Builder()
        .setVersion("1")
        // Add image resources here with addIdToImageMapping if needed
        .build()

    override suspend fun tileRequest(
        requestParams: TileRequest
    ): Tile {
        val steps = StepsRepository.getTodaySteps(this)   // reads local cache only
        val goal  = 10_000
        val ratio = (steps.toFloat() / goal).coerceIn(0f, 1f)

        val layout = PrimaryLayout.Builder(requestParams.deviceConfiguration)
            .setPrimaryLabelTextContent(
                Text.Builder(this, "Steps today")
                    .setTypography(Typography.TYPOGRAPHY_CAPTION1)
                    .setColor(argb(MaterialColors.ON_SURFACE_VARIANT))
                    .build()
            )
            .setContent(
                CircularProgressIndicator.Builder()
                    .setProgress(ratio)
                    .setStartAngle(-150f)
                    .setEndAngle(150f)
                    .setContent(
                        Text.Builder(this, steps.toString())
                            .setTypography(Typography.TYPOGRAPHY_DISPLAY1)
                            .setColor(argb(MaterialColors.PRIMARY))
                            .build()
                    )
                    .build()
            )
            .setSecondaryLabelTextContent(
                Text.Builder(this, "Goal $goal")
                    .setTypography(Typography.TYPOGRAPHY_CAPTION1)
                    .setColor(argb(MaterialColors.ON_SURFACE_VARIANT))
                    .build()
            )
            .setPrimaryChipContent(
                CompactChip.Builder(this, "Open", clickable(launchApp()), deviceParams)
                    .build()
            )
            .build()

        return Tile.Builder()
            .setResourcesVersion("1")
            .setTileTimeline(
                Timeline.fromLayoutElement(layout.toLayoutElementProto())
            )
            .setFreshnessIntervalMillis(TimeUnit.MINUTES.toMillis(15))
            .build()
    }

    private fun launchApp() = ActionBuilders.LaunchAction.Builder()
        .setAndroidActivity(
            ActionBuilders.AndroidActivity.Builder()
                .setPackageName(packageName)
                .setClassName("com.example.MainActivity")
                .build()
        ).build()
}
```

**Resources and images**

- Declare image assets in `onResourcesRequest` / `resourcesRequest` using `Resources.Builder().addIdToImageMapping(id, imageResource)`.
- Prefer `ResourceBuilders.AndroidImageResourceByResId` for drawables bundled in the APK.
- Version your resource bundle with a string (e.g., `"1"`) that you change whenever any image changes; mismatched versions cause the system to re-request resources.

**Freshness and timelines**

- `setFreshnessIntervalMillis` tells the Wear OS tile renderer the maximum age of the tile before it proactively requests a new one. Use 0 to indicate the tile never auto-refreshes (update only on demand).
- A `TileTimeline` can contain multiple `TimelineEntry` objects with `TimeInterval` windows, enabling scheduled layout changes (e.g., different content before and after noon) without additional service calls.
- For data that changes more frequently than the freshness interval allows, use dynamic expressions from `protolayout-expression` to bind displayed values to platform data sources (step count, heart rate) directly — no service round-trip needed.

**Previewing tiles**

- Add `debugImplementation("androidx.wear.tiles:tiles-tooling-preview:1.5.0")` and annotate a `@Composable` preview function with `@Preview` and `@WearDevices.SMALL_ROUND` / `@WearDevices.SQUARE`.
- Use `TileLayoutPreview` from the tooling library as the preview host, passing your layout element to render it in Android Studio without a physical device.
- Always test on a real device or Wear OS emulator with API 30+ before release — font scaling, ambient mode, and round-shape clipping differ from the preview.

## Platform notes

- **API level:** `SuspendingTileService` and `protolayout-material` layouts target Wear OS 3 (API 30 / Wear OS platform version 3). The older `TileService` base class with Guava futures runs on Wear OS 2 (API 26+), but ProtoLayout Material components are not fully supported there.
- **Round vs square:** `PrimaryLayout` internally adapts spacing and padding for round (most modern watches) vs square form factors using `DeviceParameters` passed in `TileRequest`. Always pass `requestParams.deviceConfiguration` rather than hard-coding padding values.
- **Ambient mode:** Tiles are not displayed in ambient mode — the watch face takes over. You do not need to handle ambient transitions inside a tile.
- **Health Services integration:** When your tile displays live health metrics, start a `PassiveListenerService` or `PassiveMonitoringClient` session in `onTileAddEvent` and stop it in `onTileRemoveEvent` to minimize battery drain.
- **Dynamic expressions (protolayout-expression):** Platform data sources like `PlatformHealthSources.DynamicFloat.HEART_RATE_BPM` update the displayed value directly in the renderer without waking the service. Use them for live metrics to reduce CPU overhead.
- **Tile picker icon and label:** The `android:icon` and `android:label` on the `<service>` are shown in the Wear OS companion app tile picker. Supply a 96 x 96 dp vector drawable for the icon; the preview drawable (`tiles.PREVIEW` meta-data) should be a representative screenshot at watch resolution.

## Pitfalls

- **Blocking `onTileRequest` with I/O** — the method is called on a background thread but is still subject to ANR-like timeouts (a few seconds). Cache all remote data locally beforehand and only read the cache synchronously here.
- **Using Compose or View hierarchies inside tiles** — ProtoLayout is a completely separate rendering system. Compose for Wear OS and standard Views have no place inside a `Tile`; mixing them causes runtime crashes.
- **Forgetting `setResourcesVersion`** — if the tile layout references image IDs but `resourcesVersion` on the `Tile` does not match the version returned by `resourcesRequest`, the system will keep requesting resources or show broken images. Change the version string whenever image assets change.
- **Over-refreshing with a very short freshness interval** — intervals below one minute are silently coerced upward by the platform. Aggressively short intervals drain the battery; use dynamic expressions or `requestUpdate` for truly live data instead.
- **Not handling `onTileAddEvent` / `onTileRemoveEvent`** — neglecting these callbacks means your background data listeners (Health Services, sensors) run even when the user has removed the tile from their carousel, wasting battery.
- **Ignoring `DeviceParameters`** — constructing `PrimaryLayout` without the actual device configuration produces layouts with incorrect padding on round or large watches.
- **Assuming interactive Compose gestures work in tiles** — tiles support only taps on `Clickable` elements (chips, buttons). Swipe gestures, long-press, and complex navigation are not available.

## References

- **Documentation:** [Wear OS Tiles overview](https://developer.android.com/training/wearables/tiles)
- **Documentation:** [Build a Wear OS Tile](https://developer.android.com/jetpack/androidx/releases/wear-tiles)

## See also

For full interactive watch UIs built with Jetpack Compose, see the `compose-fundamentals` and `compose-layout` skills. For home-screen widgets on phones and tablets that share a similar "glanceable update" pattern, see `app-widgets-glance`. For background data collection that feeds tile content without blocking `onTileRequest`, see patterns covered in the `workmanager` skill. For Health Services sensor APIs used alongside Tiles, see `health-services`.
