---
name: adopting-edge-to-edge-predictive-back
description: Adoption guide for the two modern platform behaviors enforced on Android 16 — going edge-to-edge with correct inset handling and opting into predictive back with animated transitions. Use when planning a migration to full-screen layout enforcement, deciding how to handle window insets in Compose or Views, or enabling predictive back animations for the first time.
---

## When to use

Reach for this skill when your app must comply with the two platform behaviors enforced starting on Android 16: drawing content behind system bars (edge-to-edge) and supporting the predictive back gesture. Both are no longer opt-in — on API 35+ the system forces edge-to-edge layouts, and on API 36+ predictive back is fully enforced. This skill is a migration decision guide; it helps you understand the obligations at each API level, choose the right inset strategy for Compose vs. View-based UIs, and determine how to wire predictive back into your navigation or custom back handlers.

## Core guidance

### Edge-to-edge

**What changed.** Starting with `targetSdk 35`, the platform enforces edge-to-edge: the system ignores `android:windowSoftInputMode` adjustments that formerly resized the window, status bar and navigation bar backgrounds are transparent, and your layout is expected to draw behind them. You no longer call `WindowCompat.setDecorFitsSystemWindows(window, false)` on API 35+ because the system does it for you — calling it explicitly on older targets is still required for backcompat.

**The inset contract.** Edge-to-edge means your UI must consume insets itself; the platform will no longer pad your root view automatically. Consuming insets correctly is the crux of the migration.

- In **Compose**, use `Modifier.windowInsetsPadding(...)`, `Modifier.safeDrawingPadding()`, or `Scaffold`'s built-in content padding. `Scaffold` already distributes `WindowInsets.safeContent` to its slots in Material 3 — prefer it over manual inset wiring at the screen level.
- In **Views**, apply insets via `ViewCompat.setOnApplyWindowInsetsListener`. Prefer `WindowInsetsCompat.Type.systemBars()` over the deprecated `systemWindowInsets`. Jetpack's `WindowInsetsControllerCompat` handles bar appearance (light/dark icons) across API levels.
- Consume insets **once**, at the closest ancestor that owns the padded region. Do not pad both a parent and a child for the same inset type — the system delivers each inset once and consuming it removes it from the chain.

**Practical migration sequence for an existing app.**

1. Set `targetSdk 35` in `build.gradle`.
2. Remove explicit `windowSoftInputMode=adjustResize` workarounds that relied on the old window-resizing behavior; replace with `WindowInsetsCompat.Type.ime()` padding at the scroll root or text field level.
3. Audit every screen for hard-coded top/bottom padding that was added to avoid the status bar or navigation bar — replace with inset padding.
4. Run on a device with gesture navigation (no nav bar buttons) and a device with 3-button nav to validate both layouts.
5. Test landscape on a phone and on a tablet or foldable, where inset geometry differs.

```kotlin
// Compose — let Scaffold handle top/bottom insets automatically
Scaffold(
    topBar = { TopAppBar(title = { Text("Title") }) },
    contentWindowInsets = WindowInsets.safeContent
) { innerPadding ->
    LazyColumn(contentPadding = innerPadding) {
        // items
    }
}

// Compose — manual inset padding when not using Scaffold
Box(
    modifier = Modifier
        .fillMaxSize()
        .windowInsetsPadding(WindowInsets.safeDrawing)
) {
    // content
}
```

### Predictive back

**What it is.** The predictive back gesture (introduced in Android 13, gradually enforced) gives users an animated preview of the destination before they lift their finger: a scaled-down version of the previous screen slides in from the edge. On Android 16 this behavior is expected by default for all apps targeting API 35+.

**The three participation levels.**

| Level | What you need to do | When it wins |
|---|---|---|
| System animations only (back-to-home, cross-task) | Nothing — system handles these automatically from API 33 | All apps, no code required |
| Cross-Activity animations | Set `android:enableOnBackInvokedCallback="true"` in `<application>` in the manifest | Apps using `startActivity` between Activities |
| In-app navigation (cross-fragment / cross-Compose destination) | Opt-in flag + Navigation Component 2.8+ or custom `OnBackPressedCallback` | Apps with custom back stacks |

**Opting in.** Add to your manifest:

```xml
<application
    android:enableOnBackInvokedCallback="true"
    ...>
```

This single flag enrolls your app in predictive back for all system-managed animations. For in-app navigation animations the framework additionally requires your navigation library or custom handler to register on the `OnBackInvokedDispatcher` rather than the legacy `OnBackPressedDispatcher`.

**Navigation Compose.** Navigation Compose 2.8+ handles predictive back natively when the manifest flag is set — no extra code. The `NavHost` registers its back stack on `OnBackInvokedDispatcher` and plays the platform crossfade automatically.

**Custom back handlers.** Replace `activity.onBackPressedDispatcher.addCallback(...)` with `BackHandler` in Compose or with `OnBackInvokedCallback` in Views when you need custom behavior (confirm dialogs, multi-step forms). Use the `PredictiveBackHandler` composable (from `androidx.activity:activity-compose`) when you want to animate your own UI in sync with the gesture progress.

```kotlin
// Compose — custom animated back with gesture progress
PredictiveBackHandler(enabled = showConfirmation) { progress ->
    // progress is a Flow<BackEventCompat> with touchX, touchY, swipeEdge, progress
    progress.collect { backEvent ->
        // animate your UI using backEvent.progress (0f → 1f)
    }
    // Flow completion means the user committed — perform the actual back action
    showConfirmation = false
}
```

**Removing legacy back interception.** Any call to `onBackPressed()` override or `KeyEvent.KEYCODE_BACK` interception must be migrated to `OnBackPressedCallback` or `OnBackInvokedCallback`. Legacy intercepts silently disable predictive back for the entire Activity on API 33+.

### Choosing what to tackle first

If your app uses Navigation Compose with Material 3 `Scaffold`, the majority of both features require only: setting `targetSdk 35`, adding `enableOnBackInvokedCallback="true"`, and fixing inset consumption at your scroll roots and bottom sheets. That is the highest-value, lowest-effort path.

If your app has View-based UIs, custom back logic, or Activity-to-Activity flows, the inset audit and back handler migration require more screen-by-screen work. Prioritize screens with bottom sheets, IME-attached text inputs, and non-standard navigation patterns first.

## Platform notes

**Large screens and foldables.** Inset geometry is more complex on tablets and foldables — the navigation bar can appear on the side rather than the bottom, and the inset type changes accordingly. Use `WindowInsetsCompat.Type.systemBars()` rather than `navigationBars()` alone to cover all orientations. Test with the Resizable Emulator in tabletop and book postures.

**Gesture vs. 3-button nav.** Gesture navigation delivers a non-zero `systemGestureInsets` on the sides for the back swipe zones; do not place interactive targets in these regions. `WindowInsetsCompat.Type.systemGestures()` exposes the exclusion rects — call `ViewCompat.setSystemGestureExclusionRects(view, rects)` (or `Modifier.systemGestureExclusion()` in Compose) for any custom swipe components that conflict.

**IME handling.** The old `adjustResize` window soft input mode is deprecated under edge-to-edge. Animate your layout to slide above the keyboard using `WindowInsetsAnimationCompat` (Views) or `Modifier.imePadding()` (Compose). The `WindowInsetsAnimation` approach avoids layout janks caused by window resize events.

**Android TV and Automotive.** Neither enforces edge-to-edge; skip this migration for those form factors unless you explicitly target large-display experiences.

## Pitfalls

- Applying inset padding at both a parent and a child container. The inset is consumed by the first view that calls `consumeWindowInsets`; the child receives zero and the padding doubles up visually. Consume once at the right level.
- Removing the status bar and navigation bar background colors in `themes.xml` without actually handling insets in the layout, leaving touch targets obscured by system bars.
- Overriding `onBackPressed()` in an Activity without migrating to `OnBackPressedCallback`. The override silently disables predictive back for the whole Activity on API 33+, with no warning or crash.
- Forgetting to add `android:enableOnBackInvokedCallback="true"` after migrating all callbacks. Without the manifest flag, the platform predictive back animation does not trigger even if the callbacks are correct.
- Using `WindowInsets.systemBars` in Compose across recompositions with a remembered but non-updated value. WindowInsets in Compose are snapshot-state backed — read them in the composition directly rather than caching in `remember { }` across configuration changes.
- Hard-coding `paddingBottom = 56.dp` to avoid a navigation bar. This value varies by device and collapses to zero under gesture navigation, leaving either too much or too little space.
- Using `PredictiveBackHandler` with `enabled = true` unconditionally. An always-enabled back handler consumes the back gesture even when no custom navigation should occur, breaking the system back stack.

## References

- **Developer Guide:** [Go edge-to-edge in your app](https://developer.android.com/develop/ui/views/layout/edge-to-edge)
- **Developer Guide:** [Predictive back gesture](https://developer.android.com/guide/navigation/custom-back/predictive-back-gesture)

## See also

For structuring the Compose navigation graph and using `NavHost` with the back stack, see `navigation-architecture`. For Scaffold, `TopAppBar`, and Material 3 layout shells that encapsulate inset handling, see the Compose Material 3 design skill. For adopting Compose incrementally in a View-based app that needs both edge-to-edge and predictive back migrations at the same time, see `adopting-compose`.
