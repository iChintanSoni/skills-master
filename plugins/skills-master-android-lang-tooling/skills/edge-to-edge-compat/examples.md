## Scenario 1: Raising targetSdk from 34 to 35 — fixing a nav bar coverage regression

An app ships with `targetSdkVersion 34`. After bumping to 35, testers report that the bottom navigation bar's last tab is hidden behind the gesture navigation indicator on Pixel phones.

**Root cause:** Android 15 forces edge-to-edge when targetSdk = 35. The navigation bar becomes transparent and content is drawn behind it. The `BottomNavigation` composable's last item sits exactly where the gesture indicator overlaps.

**Fix:** Call `enableEdgeToEdge()` in `MainActivity.onCreate` before `setContent`, then add inset-based padding to the bottom of the navigation host. Do not hard-code padding; read the actual inset at runtime.

```kotlin
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge() // must come before setContent
        setContent {
            MyAppTheme {
                AppScaffold()
            }
        }
    }
}
```

The `AppScaffold` then passes `WindowInsets.navigationBars` as bottom padding to the Scaffold's `contentWindowInsets` parameter (see compose-window-insets skill). The result: the bottom nav is padded above the gesture indicator on API 35+ and remains unchanged on older devices where the nav bar was opaque.

**What not to do:** Setting `android:navigationBarColor="@android:color/black"` in the theme to restore the opaque bar "while we fix insets properly later". On API 35 devices targeting API 35 the setter is ignored — the bar stays transparent and the workaround silently fails, delaying the real fix.

---

## Scenario 2: Enabling predictive back in a Compose app

An app has multiple nested destinations using Compose Navigation. Users on Android 13+ see a plain back-swipe with no preview. The team wants the animated destination preview introduced in Android 14.

**Step 1 — manifest opt-in:**

```xml
<application
    android:enableOnBackInvokedCallback="true"
    ... >
```

This single attribute activates the predictive back framework on API 33+ without changing any Kotlin code. Compose Navigation's `NavController` wires to `OnBackPressedDispatcher` automatically — the animations work with no additional code for standard push/pop transitions.

**Step 2 — custom back animation for a bottom sheet:**

A custom bottom-sheet destination needs to slide down as the user drags during a predictive back gesture. Use `PredictiveBackHandler` from `activity-compose`:

```kotlin
@Composable
fun BottomSheetDestination(onDismiss: () -> Unit) {
    var offsetFraction by remember { mutableFloatStateOf(0f) }

    PredictiveBackHandler { backEvents: Flow<BackEventCompat> ->
        try {
            backEvents.collect { event ->
                // event.progress goes 0.0 → 1.0 as the user drags
                offsetFraction = event.progress
            }
            // Gesture committed — run dismiss animation
            onDismiss()
        } catch (e: CancellationException) {
            // Gesture cancelled — snap back to 0
            offsetFraction = 0f
            throw e  // always rethrow
        }
    }

    Box(
        Modifier
            .fillMaxWidth()
            .graphicsLayer { translationY = offsetFraction * size.height }
    ) {
        SheetContent()
    }
}
```

`PredictiveBackHandler` handles the API-level check internally: on API 33 devices it acts like a normal `BackHandler`; on API 34+ it streams progress events. No `Build.VERSION.SDK_INT` branch needed in your code.

---

## Scenario 3: Migrating away from deprecated systemUiVisibility flags

A legacy Activity sets system bar appearance using the old bitmask API:

```kotlin
// BEFORE — deprecated, broken on API 35 targets
window.decorView.systemUiVisibility =
    View.SYSTEM_UI_FLAG_LAYOUT_STABLE or
    View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or
    View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
```

On API 35 with targetSdk 35 these flags are no-ops. The status bar icons remain dark regardless of the theme, and the layout insets are wrong.

**Migration:**

```kotlin
// AFTER — works API 21 through 36+
enableEdgeToEdge()  // handles layout flags and icon contrast

// If you need to force light-on-dark icons regardless of theme:
WindowCompat.getInsetsController(window, window.decorView).apply {
    isAppearanceLightStatusBars = false  // white icons on dark background
    isAppearanceLightNavigationBars = false
}
```

`WindowInsetsControllerCompat` (from `androidx.core`) is the sole correct API for controlling icon appearance from API 21 onward. `systemUiVisibility` should be removed entirely — no gradual deprecation path needed, just replace every usage before targeting API 35.
