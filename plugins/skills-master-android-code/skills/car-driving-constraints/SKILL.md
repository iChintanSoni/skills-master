---
name: car-driving-constraints
description: Covers Android Auto and Automotive OS driver-distraction constraints — driving vs parked state detection, template and list limits, task step quotas, CarContext restriction APIs, and Automotive OS vehicle-property access. Use when building Car App Library experiences that must respect system-enforced distraction rules and surface the correct UI based on driving state.
---

## When to use

Use this skill whenever you are building or reviewing a Car App Library session (`Screen`, `Template`, `CarAppService`) that must behave differently while the vehicle is in motion versus parked, enforce Android Auto's template and list quotas, cap multi-step task flows to the system limit, or read vehicle properties on Automotive OS. It does not cover general Compose for Automotive UI, media-session integration, or navigation-template turn-by-turn rendering.

## Core guidance

**Driving vs parked state**

- Query driving state from `CarContext` via `CarContext.getCarService(AppManager::class.java)` and listen to `Session.onCarConfigurationChanged`. For restriction checking, use `CarContext.getCarService(ConstraintManager::class.java)`.
- Call `ConstraintManager.isAppRestricted()` at the top of each `Screen.onGetTemplate()` to decide which template variant to return. Never hard-code a "parked only" assumption — the system can change state mid-session.
- Parked state unlocks `MessageTemplate`, `LongMessageTemplate`, `SearchTemplate`, and arbitrary list lengths. Driving state enforces hard caps enforced by the host; ignore them and the host throws `SecurityException`.
- Never block the main thread waiting for a state change; `onGetTemplate` must return synchronously in the foreground dispatch window.

**Template and content limits**

- `ListTemplate` / `ItemList`: maximum **6 rows** while driving. Keep every `Row` to a single line of primary text plus one secondary text line — additional lines are silently truncated by the host.
- `GridTemplate`: maximum **6 items** while driving; up to 8 when parked.
- `PaneTemplate`: maximum **4 action buttons** total (primary pane actions + FAB). Exceed this and the host clips extras without warning.
- Text in `CarText` is capped at **128 characters** for primary text and **64 characters** for secondary text fields. Provide short, scannable strings; use `CarText.Builder.addVariant()` for screen-reader-only expanded text.
- Images in `CarIcon` must be vector (`IconCompat.createWithResource`) or a bitmap sized to the host's `ConstraintManager.getContentLimit(ConstraintManager.CONTENT_LIMIT_TYPE_GRID)` — query at runtime, never hard-code pixel dimensions.

**Task step limits**

- The Car App Library enforces a maximum of **5 screen stack pushes** per task. `ScreenManager.push()` beyond the limit causes the host to terminate the task.
- Design task flows to complete in ≤ 4 steps so the fifth push is reserved for a confirmation or result screen.
- Use `ScreenManager.popToRoot()` when an in-flow cancel or error should discard the partial task state rather than stacking a new error screen.
- For sub-flows (e.g., disambiguation within a search), replace the current screen with `ScreenManager.pop()` + `ScreenManager.push()` rather than always pushing, to avoid exhausting the step quota.

**CarContext constraint APIs**

- `ConstraintManager.getContentLimit(CONTENT_LIMIT_TYPE_LIST)` — call this each time `onGetTemplate()` runs; the limit can change between driving and parked.
- `ConstraintManager.getContentLimit(CONTENT_LIMIT_TYPE_GRID)` — same pattern.
- `ConstraintManager.isAppRestricted()` — `true` while driving; use to gate parked-only flows.
- Register a `Session.Listener` (or override `Session.onCarConfigurationChanged`) to invalidate the top screen via `Screen.invalidate()` when restriction state changes mid-session; the host will call `onGetTemplate()` again.

**Automotive OS vehicle properties**

- On Automotive OS the Car App Library runs as a native in-process app (no projection). Access vehicle data through the `CarPropertyManager` API via the `android.car` platform library.
- Declare required vehicle permissions in the manifest (e.g., `android.car.permission.CAR_SPEED`, `android.car.permission.CAR_DRIVING_STATE`).
- Read `VehiclePropertyIds.DRIVING_STATUS` (API level via `CarDrivingStateEvent`) to gate parked-only UI in the native Automotive path.
- Use `CarPropertyManager.registerCallback` with `CarPropertyManager.SENSOR_RATE_NORMAL` for driving-state; do not poll — polling at high frequency is a battery and performance hazard.
- On Android Auto (projection), vehicle property access is NOT available; rely exclusively on `ConstraintManager.isAppRestricted()` for restriction state. Gate `android.car` imports with a runtime flag or module split.

```kotlin
class MyScreen(carContext: CarContext) : Screen(carContext) {

    private val constraints: ConstraintManager =
        carContext.getCarService(ConstraintManager::class.java)

    override fun onGetTemplate(): Template {
        val isRestricted = constraints.isAppRestricted()
        val maxItems = constraints.getContentLimit(ConstraintManager.CONTENT_LIMIT_TYPE_LIST)

        val rows = buildRows(isRestricted, maxItems) // honours the runtime cap

        return if (isRestricted) {
            // Driving: lean ItemList, no long text, no parked-only actions
            ListTemplate.Builder()
                .setTitle(carContext.getString(R.string.app_name))
                .setSingleList(rows)
                .build()
        } else {
            // Parked: can show a richer LongMessageTemplate or full list
            ListTemplate.Builder()
                .setTitle(carContext.getString(R.string.app_name))
                .setSingleList(rows)
                .setActionStrip(parkingActionStrip())
                .build()
        }
    }

    private fun buildRows(restricted: Boolean, limit: Int): ItemList {
        val builder = ItemList.Builder()
        val items = dataSource.getItems()
            .take(limit)          // never exceed host cap
        for (item in items) {
            builder.addItem(
                Row.Builder()
                    .setTitle(item.title.take(128))
                    .addText(item.subtitle.take(64))
                    .setOnClickListener { onItemClicked(item) }
                    .build()
            )
        }
        return builder.build()
    }

    private fun onItemClicked(item: Item) {
        // Each push counts against the 5-step task limit
        screenManager.push(DetailScreen(carContext, item))
    }
}
```

## Platform notes

- **Android Auto (projection):** The host runs on the phone inside the Android Auto app and projects to the head unit. The Car App Library host enforces all template, row, and step limits on the phone side. Vehicle properties are not available; use `ConstraintManager` exclusively for restriction state.
- **Automotive OS (native):** The Car App Library host runs on the head unit itself. Apps can additionally access `CarPropertyManager` and `CarDrivingStateManager` via the `android.car` platform APIs to react to fine-grained vehicle signals (speed, gear, driving state). These APIs are not available on Android Auto projection paths.
- **Dual-deployment:** A single Car App Library app can target both Android Auto and Automotive OS by declaring both `<uses-feature android:name="android.hardware.type.automotive"/>` and the `androidx.car.app.CarAppService` intent filter. Gate `android.car` usage with `packageManager.hasSystemFeature(PackageManager.FEATURE_AUTOMOTIVE)`.
- **Configuration changes:** Head-unit display size or dark/light mode can change while the app is running (e.g., tunnel entry). Override `Session.onCarConfigurationChanged` and call `Screen.invalidate()` on all screens that depend on configuration — the host will pull fresh templates.
- **API level:** `CarContext.getCarApiLevel()` returns the Car App Library API level negotiated with the host, which may be lower than the library version compiled against. Guard newer template types (e.g., `MapWithContentTemplate`, added in API level 7) with a runtime check.

## Pitfalls

- Returning a template with more rows or grid items than `ConstraintManager.getContentLimit()` does not throw immediately on all hosts — some silently truncate, others crash the session on stricter validation. Always slice to the limit.
- Calling `ConstraintManager.isAppRestricted()` once at session start and caching the result is dangerous — driving state can change (e.g., the driver pulls over) mid-session. Re-query in every `onGetTemplate()` call.
- Pushing more than 5 screens in a task terminates the task on production hosts. Unit tests with `TestCarContext` do not enforce this limit, so the bug only appears on a device or emulator.
- Using `CarText` longer than 128/64 characters does not throw — the text is silently clipped, causing truncated or empty labels on the head unit. Validate string lengths before building templates.
- Accessing `android.car` APIs on a non-Automotive device (e.g., a phone running Android Auto) causes `ClassNotFoundException` at runtime. Always guard with `PackageManager.FEATURE_AUTOMOTIVE`.
- `Row.Builder.addText()` called more than twice on some host versions silently drops the third line. Design layouts for a maximum of one primary text plus one secondary text line.
- Registering `CarPropertyManager` callbacks without unregistering them in `Session.onDestroy` causes a native listener leak on Automotive OS. Unregister all callbacks in the session lifecycle teardown.
- Ignoring the `CarAppPermissionException` thrown when a required car permission has not been granted causes silent failures. Request permissions through `CarContext.requestPermissions()` (not the standard Activity API) and handle the denial gracefully.

## References

- **Documentation:** [Build car apps](https://developer.android.com/training/cars/apps)
- **Design guidance:** [Design for cars](https://developer.android.com/design/ui/cars)

## See also

The `user-notifications` skill covers how to surface heads-up alerts correctly on Android Auto — media and messaging notifications follow different distraction rules than in-app templates. For Media session integration on the car head unit, the `avfoundation-playback` analog on Android is `MediaSessionCompat` combined with `MediaBrowserServiceCompat`, which are prerequisites for a media car app. For deep-linking from a car template into a phone-side activity (Android Auto only), consult the `android-navigation-architecture` skill for back-stack management.
