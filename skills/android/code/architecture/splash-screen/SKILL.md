---
name: splash-screen
description: Covers the AndroidX SplashScreen API — installSplashScreen, holding the splash on screen during async initialization with a keep condition, animated icon and window exit animation, and migrating away from a legacy custom splash Activity. Use when adding or updating a launch experience in an Android app, prolonging the splash while data loads, customizing the animated icon or exit transition, or removing an old custom-Activity splash implementation.
globs:
  - "**/*.kt"
tags: [splash-screen, architecture, compose, app-launch, animation]
x-skills-master:
  domain: android
  class: code
  category: architecture
  platforms: ["android", "large-screen"]
  requires: { "android": "16", "kotlin": "2.2", "compose-bom": "2026.05.00" }
  pairs_with: [m3-splash-screen]
  sources:
    - https://developer.android.com/develop/ui/views/launch/splash-screen
    - https://developer.android.com/reference/kotlin/androidx/core/splashscreen/SplashScreen
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Apply this guidance whenever you need to implement or improve the launch experience of an Android app. The SplashScreen API is the only supported path since Android 12 (API 31) — the system displays a launch screen for every cold and warm start regardless of whether you opt in, so failing to integrate the API produces an uncontrolled default appearance. Reach for this skill when:

- Setting up a new app's launch branding (icon, background color, window background).
- Holding the splash visible while data required for the first screen loads asynchronously.
- Adding a custom animated icon or exit animation.
- Migrating a legacy splash `Activity` or `theme-based` window background hack to the modern API.

## Core guidance

**Add the dependency**

- Add `androidx.core:core-splashscreen` to your module's `build.gradle.kts`. The library back-ports the API to API 23+.

**Theme wiring**

- Declare a theme in `res/values/themes.xml` that uses `Theme.SplashScreen` (or `Theme.SplashScreen.IconBackground`) as its parent, then set it as the `windowSplashScreenBackground`, `windowSplashScreenAnimatedIcon`, and optionally `windowSplashScreenBrandingImage` attributes.
- Point your `Activity`'s `android:theme` in the manifest to this splash theme.
- Call `installSplashScreen()` in `Activity.onCreate()` **before** `setContent {}` — it swaps the window to your app theme and returns a `SplashScreen` handle.

**Keeping the splash on screen during initialization**

- The splash dismisses as soon as the first frame of your app's content is drawn. To postpone dismissal while async work (loading prefs, checking auth, fetching remote config) is in progress, call `splashScreen.setKeepOnScreenCondition { isLoading }` where `isLoading` is read from a `StateFlow` or `AtomicBoolean` owned by your `ViewModel` or `Application`.
- The condition lambda is polled before every frame; it must be cheap and non-blocking. As soon as it returns `false` the splash is dismissed.
- Never block the main thread waiting for data — start async loading before or immediately after `installSplashScreen()`, track completion in a `StateFlow<Boolean>`, and expose that to the condition.

**Exit animation**

- Register a custom exit animation with `splashScreen.setOnExitAnimationListener { splashScreenView -> }`. The listener fires when the keep condition first returns `false`.
- Inside the listener call `splashScreenView.iconView.animate()` or `splashScreenView.view.animate()` to drive the transition. Call `splashScreenView.remove()` when your animation completes to hand control to the app.
- If you do not register a listener the system plays its own scale-and-fade exit animation.

```kotlin
// MainActivity.kt
class MainActivity : ComponentActivity() {

    private val viewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        val splashScreen = installSplashScreen()   // call BEFORE setContent

        super.onCreate(savedInstanceState)

        // Hold the splash until initial data is ready.
        splashScreen.setKeepOnScreenCondition {
            viewModel.isLoading.value            // cheap StateFlow read
        }

        // Custom exit: slide the splash icon upward, then remove it.
        splashScreen.setOnExitAnimationListener { splashView ->
            ObjectAnimator.ofFloat(splashView.iconView, View.TRANSLATION_Y, 0f, -200f)
                .apply {
                    duration = 400
                    interpolator = DecelerateInterpolator()
                    doOnEnd { splashView.remove() }
                    start()
                }
        }

        enableEdgeToEdge()
        setContent { AppTheme { MainNavHost(viewModel) } }
    }
}

// MainViewModel.kt — tracks initialization readiness
@HiltViewModel
class MainViewModel @Inject constructor(
    private val authRepository: AuthRepository,
) : ViewModel() {

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    init {
        viewModelScope.launch {
            authRepository.checkSession()      // suspend: network or disk
            _isLoading.value = false           // signals splash to dismiss
        }
    }
}
```

**Animated icon**

- Supply an `AnimatedVectorDrawable` (AVD) as `windowSplashScreenAnimatedIcon` in your splash theme. The system plays the animation while the splash is shown.
- The icon renders at 240 dp inside a 288 dp circular region on API 31+; ensure artwork has adequate padding.
- On API 30 and below (with the compat library) the static fallback frame of the AVD is shown — test both.

**Migrating away from a custom splash Activity**

- Remove the dedicated splash `Activity` from your manifest entirely.
- Remove any `android:windowBackground` tricks in the main `Activity` theme that simulated a splash.
- Replace with the theme-and-`installSplashScreen` approach described above. The system now owns the initial frame, which eliminates the visual jump that occurred when the old Activity launched a new one.
- If the old splash Activity drove navigation (e.g. "go to login vs. home"), move that logic into the main `Activity`'s `ViewModel` and drive it from the keep condition result.

## Platform notes

- **API 31+ (Android 12+):** The system forces a splash screen for every app cold/warm start. Without the compat library the system falls back to a plain white screen with your launcher icon. With the library, the themed values are respected.
- **API 23–30:** `core-splashscreen` emulates the splash by briefly showing a `SplashScreenView` over the window before your content draws. Keep conditions and exit animations are supported.
- **Large-screen / foldables:** Ensure the keep condition resolves promptly; prolonged splash screens on large-screen devices that multi-task are visually disruptive. The splash is per-`Activity` so secondary displays or multi-window modes each trigger their own launch sequence.
- **Edge-to-edge:** Call `enableEdgeToEdge()` after `installSplashScreen()` and before `setContent {}` to avoid a brief inset flash when the splash exits.
- **Dark mode:** Provide `res/values-night/themes.xml` with a dark splash background and icon tint so the launch screen respects the user's theme setting.

## Pitfalls

- Calling `installSplashScreen()` after `setContent {}` — the splash is never shown and the method has no effect. It must be the first call in `onCreate`, before `super.onCreate` is optional but before `setContent` is mandatory.
- Forgetting to call `splashView.remove()` in the `OnExitAnimationListener` — the splash view stays on screen permanently after the animation ends, blocking all interaction.
- Blocking the main thread inside the keep condition lambda — the lambda is called on the main thread before every frame draw. Any blocking I/O will freeze rendering.
- Extending the splash indefinitely — if the async work can fail or hang, add a timeout (e.g., `withTimeout`) in the `ViewModel` coroutine and force `_isLoading.value = false` so the user is not trapped on the splash forever.
- Using `windowSplashScreenAnimatedIcon` with a plain `VectorDrawable` on API 31+ — the system will show a static icon, which is correct, but if you intend animation you must use an `AnimatedVectorDrawable`; a static drawable silently produces no animation.
- Keeping a custom splash `Activity` alongside `installSplashScreen()` — the system splash appears before your Activity, so users see two sequential splash experiences. Remove the legacy Activity entirely.
- Not handling the night-mode theme variant — the system uses the activity's theme attributes; without a night variant the splash will be white in dark mode.

## References

- **Guide:** [Splash screens](https://developer.android.com/develop/ui/views/launch/splash-screen)
- **API reference:** [SplashScreen (androidx.core.splashscreen)](https://developer.android.com/reference/kotlin/androidx/core/splashscreen/SplashScreen)

## See also

For design guidance on splash screen branding, icon sizing, and motion principles, see the `m3-splash-screen` design skill. For the ViewModel pattern used to track initialization state and drive the keep condition, see `viewmodel`. For edge-to-edge window configuration that must be coordinated with the splash exit, see the `edge-to-edge` skill.
