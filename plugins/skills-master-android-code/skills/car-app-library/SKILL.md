---
name: car-app-library
description: Covers building in-car experiences with the Jetpack Car App Library — CarAppService and Session lifecycle, the template model (ListTemplate, PaneTemplate, NavigationTemplate, GridTemplate), Screen and ScreenManager navigation, host constraints and template limits, and sharing one codebase between Android Auto and Automotive OS. Use when building any app that must run inside a car head unit, navigate between car screens, present media or point-of-interest lists in the car UI, or add turn-by-turn navigation within a vehicle display.
---

## When to use

Use this skill whenever you must render content on a car head unit — whether the device is a phone running Android Auto or a built-in Automotive OS system. It covers the full Car App Library surface: declaring the `CarAppService`, managing the `Session` and `Screen` stack, building host-rendered templates, respecting per-host template limits, and targeting both deployment targets with a single codebase. It does not cover media apps that use `MediaBrowserServiceCompat` exclusively (no custom UI), or Compose-for-Android UI that runs only on the phone screen.

## Core guidance

**CarAppService and Session**

- Subclass `CarAppService` and declare it in the manifest with `intent-filter` action `androidx.car.app.CarAppService` plus the appropriate category: `androidx.car.app.category.POI`, `.NAVIGATION`, `.PARKING`, or `.EV_CHARGING`. The category controls which features the host exposes and which App Quality tier applies.
- Override `onCreateSession()` to return a `Session` subclass. The `Session` is the entry point; override `onCreateScreen(intent: Intent)` to return the first `Screen`. Never store a `Context` reference beyond the `Session` lifetime.
- Request the minimum API level your app needs with `<meta-data android:name="androidx.car.app.minCarApiLevel" android:value="4" />`. Do not request a level higher than your lowest supported feature.
- Automotive OS hosts the app as a native service; Android Auto projects it over USB/Bluetooth from the phone. The same `CarAppService` serves both — branch on `carContext.hostInfo` only when absolutely necessary.

**Templates**

- Every `Screen` returns exactly one `Template` from `onGetTemplate()`. The host renders the template — your app never draws to the display directly.
- `ListTemplate` — a scrollable list of `Row` items. Use for menus, search results, and any list of destinations or options. Each `Row` can hold a title, up to two lines of metadata, a `CarIcon`, and a `toggle` or `OnClickListener`.
- `PaneTemplate` — a detail view with a header, a `Pane` of up to two `Action`s in a strip, and a body of up to four `Row`s. Use for item detail or confirmation screens.
- `GridTemplate` — a grid of `GridItem`s with images and labels. Use for media category browsing or launcher-style grids.
- `NavigationTemplate` — the fullscreen map canvas template. Required for any turn-by-turn navigation experience; it holds a `NavigationInfo` (routing card) and an `ActionStrip`. Never use this template for non-navigation purposes.
- `MessageTemplate` — ephemeral status or error state. Use for loading screens, empty states, and fatal errors.
- `SearchTemplate` — provides a system-rendered keyboard and input field. Use instead of rolling your own text input; direct keyboard access is prohibited in the car.

**Screen and ScreenManager**

- `ScreenManager` is obtained via `carContext.getCarService(ScreenManager::class.java)`. Push new screens with `screenManager.push(screen)`; pop with `screenManager.pop()` or `screenManager.popToRoot()`.
- Implement `Screen.onGetTemplate()` to build and return the template each time it is called. The host calls this after each `invalidate()` — keep the method fast and free of blocking I/O.
- Call `invalidate()` whenever data driving the screen changes (e.g., after a repository emit). Do not call `invalidate()` from inside `onGetTemplate()`.
- Use `Screen.setResult(result)` and `ScreenManager.pushForResult(screen) { result -> … }` when a child screen needs to return a value to its parent (e.g., a filter picker).

**Host constraints and template limits**

- The host enforces a template backstack limit of **5** screens per task. Exceeding it throws `IllegalStateException` at runtime. Design navigation hierarchies shallowly — a root list → detail → action pattern fits within the limit.
- `Row` text is capped at two metadata lines per item. Long strings are truncated by the host; do not rely on wrapping.
- `Action` strips are limited to **2** actions in `PaneTemplate` and **4** in `NavigationTemplate`. Exceeding the limit throws at the time `Template.build()` is called.
- `GridItem` images must be `CarIcon`s backed by a vector drawable or a remote `IconCompat` loaded via `CarIcon.Builder`. Bitmaps are not accepted directly.
- Always check `carContext.carAppApiLevel` before using features added after the minimum API level. Feature-gate calls with `if (carContext.carAppApiLevel >= CarAppApiLevels.LEVEL_X)` guards.

**One codebase for both targets**

- For Automotive OS, declare `<uses-feature android:name="android.hardware.type.automotive" android:required="false" />` and add a separate `automotive_app_desc.xml` specifying the app category. The phone APK and automotive APK can share the same module; the Automotive OS variant sets `<uses-feature required="true" />`.
- Automotive OS has direct network access; Android Auto relays through the phone. Avoid assumptions about connectivity — use the `carContext` for all resource access, not a captured `applicationContext`.
- Place car-specific `Screen` and `Template` code in a `:car` module that the `:app` and `:automotive` Gradle variants both depend on. This prevents phone-UI code from accidentally depending on car APIs.

```kotlin
// CarAppService entry point
class MyCarAppService : CarAppService() {
    override fun createHostValidator() = HostValidator.ALLOW_ALL_HOSTS_VALIDATOR

    override fun onCreateSession(): Session = MySession()
}

class MySession : Session() {
    override fun onCreateScreen(intent: Intent): Screen =
        PlaceListScreen(carContext)
}

// A list screen showing nearby places
class PlaceListScreen(carContext: CarContext) : Screen(carContext) {
    private var places: List<Place> = emptyList()

    init {
        // Observe repository; invalidate on change
        lifecycleScope.launch {
            PlaceRepository.nearby().collect { result ->
                places = result
                invalidate()
            }
        }
    }

    override fun onGetTemplate(): Template {
        val rows = ItemList.Builder()
        places.take(6).forEach { place ->
            rows.addItem(
                Row.Builder()
                    .setTitle(place.name)
                    .addText(place.distanceText)
                    .setOnClickListener {
                        screenManager.push(PlaceDetailScreen(carContext, place))
                    }
                    .build()
            )
        }
        return ListTemplate.Builder()
            .setTitle(carContext.getString(R.string.nearby_places))
            .setSingleList(rows.build())
            .setHeaderAction(Action.APP_ICON)
            .build()
    }
}
```

## Platform notes

- **Android Auto** runs in a restricted projection mode over USB or wireless; the host is the Android Auto app on a compatible head unit. The phone's audio focus, sensor state, and network connection are used. Apps are sandboxed to the phone process.
- **Automotive OS** runs natively on the in-dash system. The app runs as a first-class process on the vehicle's Android system; no phone is required. Direct camera, audio, and sensor access follows normal Android permissions, but driving-safety restrictions still apply.
- **API levels vs. Android OS versions** — Car App Library API levels (1–7+) are independent of Android SDK levels. Level 1 maps to Android Auto baseline; Level 4 introduced `Alert`; Level 6 added `LongMessageTemplate`. Always test the minimum API level you declare.
- **Driving restrictions** — The host automatically disables input and limits content when the vehicle is in motion (`ParkedOnlyOnClickListener` vs `OnClickListener`). Always pair interactive actions with a `ParkedOnlyOnClickListener` when they are unsafe while driving, and provide a driving-safe fallback (e.g., muted state).
- **Dark/light themes** — The car head unit controls the theme. Use `carContext.isDarkMode` to adapt `CarColor` choices if needed; do not rely on Android resource qualifiers for the car UI.
- **Automotive OS permissions** — Declare permissions for automotive in the shared manifest. Some automotive-specific permissions (e.g., `android.car.permission.CAR_ENERGY`) are not available on the phone APK; guard them in the `:automotive` source set.

## Pitfalls

- Calling blocking I/O or heavy computation inside `onGetTemplate()` causes ANR-like delays — the host expects a template immediately. Move all async work into coroutines that call `invalidate()` when complete.
- Returning a different `Template` type on a subsequent `onGetTemplate()` call for the same screen is illegal once the host has rendered the first type. If you need to switch template types, push a new `Screen` instead.
- Exceeding the 5-screen backstack limit at runtime throws `IllegalStateException`; this is not caught by lint. Draw the navigation graph on paper and count the maximum depth before building.
- Using `Action.BACK` without a real back destination will call `screenManager.pop()` on the root screen, causing the session to end. Guard with `if (screenManager.stackSize > 1)` or use `Action.APP_ICON` on root screens.
- Hard-coding `Action` counts beyond the per-template limit (`2` for `PaneTemplate`, `4` for `NavigationTemplate`) causes `IllegalArgumentException` at template build time, not at render time — this will crash in production if the build path is conditional.
- Storing a reference to `CarContext` or `Screen` beyond its lifecycle causes memory leaks. Pass `carContext` through constructors only; never store it in a singleton or `companion object`.
- `GridItem` image loading is asynchronous; passing a large bitmap directly (instead of a `CarIcon` backed by a vector or a `Uri`) causes silent failures or degraded rendering on some hosts.
- Forgetting to declare the `<service>` entry with the correct `intent-filter` and `<meta-data>` for `minCarApiLevel` results in the app never appearing in the head unit app launcher.
- Testing only on the Desktop Head Unit (DHU) emulator is insufficient — always test on a real Automotive OS device or a real Android Auto connection before shipping; template rendering differences exist.
- Omitting `createHostValidator()` override (or using an insecure allow-all validator in production) can expose the service to untrusted hosts. For production, use `HostValidator.Builder` with the known host package names and certificate digests.

## References

- **Documentation:** [Build car apps](https://developer.android.com/training/cars/apps)
- **Release notes:** [Car App Library releases](https://developer.android.com/jetpack/androidx/releases/car-app)

## See also

The `m3-cars` design skill covers visual and interaction guidelines for in-car UI including safe driving typography and touch target sizing. For background work that must continue while the car app session is inactive, consult the `workmanager` skill. If your car app is media-playback-focused and relies on `MediaBrowserServiceCompat`, pair with the `media-audio` skill. For permissions that differ between the phone and Automotive OS variants, the `runtime-permissions` skill covers the request flow.
