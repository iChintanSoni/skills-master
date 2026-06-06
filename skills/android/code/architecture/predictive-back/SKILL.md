---
name: predictive-back
description: Covers predictive back gesture integration for Android apps — opt-in via android:enableOnBackInvokedCallback, system back-to-home animations, PredictiveBackHandler and BackHandler in Compose, migration from legacy OnBackPressedCallback, and gesture testing. Use when implementing or migrating back-navigation handling in a Jetpack Compose or hybrid Android app.
globs:
  - "**/*.kt"
tags: [android, navigation, compose, gesture, back-navigation, architecture]
x-skills-master:
  domain: android
  class: code
  category: architecture
  platforms: ["android", "large-screen"]
  requires: { "android": "16", "kotlin": "2.2", "compose-bom": "2026.05.00" }
  pairs_with: [m3-predictive-back]
  sources:
    - https://developer.android.com/guide/navigation/custom-back/predictive-back-gesture
    - https://developer.android.com/develop/ui/compose/system/predictive-back
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Apply this skill whenever you need to handle the system back gesture — from a simple "close a dialog" callback to a fully animated in-app back transition. It is the definitive modern path for back navigation on Android 13+ (API 33+), and the only way to participate in the system's predictive swipe-peek animation. Use it when migrating legacy `onBackPressed()` or `OnBackPressedCallback` code, when adding `BackHandler` in Compose screens, or when you want custom progress-driven animations that respond to the user's swipe before they commit.

## Core guidance

### Opt in at the manifest level

Add the opt-in flag to your `<application>` tag. Without it the predictive system animation never fires, regardless of your runtime code.

```xml
<application
    android:enableOnBackInvokedCallback="true"
    ... >
```

On API 33+ this replaces the legacy dispatcher; on older APIs it is ignored gracefully.

### BackHandler vs PredictiveBackHandler in Compose

- Use `BackHandler(enabled = condition) { /* handle */ }` for simple boolean-gated interception where you do not need to animate the swipe progress.
- Use `PredictiveBackHandler(enabled = condition) { progress -> ... }` when you want to animate UI in response to the in-progress swipe. The lambda receives a `Flow<BackEventCompat>` — collect it to drive animations, then let the flow complete to confirm navigation or cancel to abort.
- Both are composables from `androidx.activity.compose`; they register with the nearest `OnBackPressedDispatcherOwner` automatically.
- Nest handlers correctly — the **innermost enabled** handler wins. Disable outer handlers while an inner one is active.

### PredictiveBackHandler with animated state

```kotlin
@Composable
fun DismissableCard(onDismiss: () -> Unit) {
    var scale by remember { mutableFloatStateOf(1f) }
    var offsetX by remember { mutableFloatStateOf(0f) }

    PredictiveBackHandler(enabled = true) { progressFlow ->
        // Called on the main thread; collect in a try/finally block.
        try {
            progressFlow.collect { backEvent ->
                // backEvent.progress: 0f (gesture start) → 1f (committed)
                // backEvent.touchX / touchY: finger position
                scale = 1f - (backEvent.progress * 0.1f)
                offsetX = backEvent.touchX * backEvent.progress * 0.3f
            }
            // Flow completed → user committed the back gesture.
            onDismiss()
        } finally {
            // Flow cancelled → user released without committing; reset state.
            scale = 1f
            offsetX = 0f
        }
    }

    Card(
        modifier = Modifier
            .graphicsLayer {
                scaleX = scale
                scaleY = scale
                translationX = offsetX
            }
    ) { /* content */ }
}
```

### Migrating from legacy back-handling

| Legacy pattern | Modern replacement |
|---|---|
| `activity.onBackPressed()` | Remove; system handles via dispatcher |
| `OnBackPressedCallback` in Fragment/Activity | `BackHandler` or `PredictiveBackHandler` in Compose; or `OnBackPressedDispatcher.addCallback` with `BackEventCompat` for View-based code |
| `onBackPressed()` override in Activity | Override deprecated — add a disabled-by-default `OnBackPressedCallback` and enable it conditionally |

- Do **not** override `onBackPressed()` on API 33+ — the method is deprecated and bypasses the predictive system.
- Remove all `KeyEvent.KEYCODE_BACK` intercepts in favor of the dispatcher.
- When mixing Compose and Views, register callbacks on the Activity's `onBackPressedDispatcher` directly from the View layer; Compose's `BackHandler` already uses the same dispatcher.

### System back-to-home animation

When no back handler intercepts the gesture, the system plays the built-in cross-task or back-to-home animation automatically once the opt-in flag is set. You do not need to add code for this — the value comes for free.

### Large-screen considerations

On foldables and tablets the back swipe edge may compete with multi-window drag handles. Ensure handlers are disabled when your screen is not the active focus window. Check `WindowInfoTracker` or `onWindowFocusChanged` to gate `enabled`.

## Platform notes

- **API 33 (Android 13):** Predictive back opt-in available; system animations active when opted in.
- **API 34 (Android 14):** In-app animation APIs (`BackEventCompat.progress`, `PredictiveBackHandler`) became stable.
- **API 35+ (Android 15+):** System enforces the new back model more strictly — `onBackPressed` override is fully ignored in some scenarios.
- **Older APIs:** `android:enableOnBackInvokedCallback` is silently ignored; `BackHandler` falls back to `OnBackPressedDispatcher` safely. No special branching needed in Compose.
- **Compose BOM 2026.05.00 / activity-compose 1.10+:** `PredictiveBackHandler` and `BackHandler` are stable; import from `androidx.activity.compose`.

## Pitfalls

- **Forgetting the manifest flag.** The system animation never shows without `android:enableOnBackInvokedCallback="true"`, even if your Compose handlers are correct.
- **Leaving an always-enabled BackHandler at the root.** An unconditionally enabled `BackHandler` swallows all back gestures, including the system back-to-home. Always gate with a meaningful `enabled` condition.
- **Not resetting state in the `finally` block.** If the user cancels mid-swipe, the flow is cancelled — without a `finally` reset your UI stays in an intermediate animated state.
- **Calling suspend functions unsafely inside PredictiveBackHandler.** The lambda is a suspend function scoped to the gesture; avoid launching new coroutines or doing heavy work that outlives the flow collection. Use `Animatable` and `animate*AsState` instead of ad-hoc coroutine launches.
- **Mixing deprecated and modern APIs.** Combining an `onBackPressed()` override with `OnBackPressedDispatcher` callbacks leads to double-handling. Pick one path and remove the other.
- **Multi-back-stack / Navigation Compose.** If you use the Navigation Compose component, its internal `BackHandler` already manages the back stack. Adding a second root-level `BackHandler(enabled = true)` will conflict — only add handlers for app-specific interception (e.g., closing a drawer before popping the stack).

## References

- **Guide — Predictive back gesture:** [Custom back navigation — Predictive back gesture](https://developer.android.com/guide/navigation/custom-back/predictive-back-gesture)
- **Compose integration:** [Predictive back in Compose](https://developer.android.com/develop/ui/compose/system/predictive-back)
- **API reference:** [BackHandler and PredictiveBackHandler (androidx.activity.compose)](https://developer.android.com/reference/kotlin/androidx/activity/compose/package-summary)

## See also

See `swiftui-navigation` for the analogous navigation-stack back-gesture pattern on Apple platforms. For broader navigation architecture decisions, see the `android-navigation-architecture` skill. For handling system window insets alongside back gestures on large screens, see `uikit-auto-layout` patterns adapted to Compose via `WindowInsets`.
