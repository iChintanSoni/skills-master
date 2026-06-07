---
name: system-ui-styling
description: Covers configuring, styling, and toggling system status bars, navigation bars, edge-to-edge display modes, and display cutouts. Use when adjusting screen overlays, managing system visibility, or configuring notch/camera layout overlays.
globs:
  - "**/*.kt"
tags: [system-ui, status-bar, navigation-bar, edge-to-edge, cutout, compose, android]
x-skills-master:
  domain: android
  class: code
  category: compose-ui
  platforms: ["android"]
  requires:
    android: "16"
    kotlin: "2.2"
    compose-bom: "2026.05.00"
  pairs_with: [compose-window-insets, adopting-edge-to-edge-predictive-back]
  sources:
    - https://developer.android.com/develop/ui/views/layout/edge-to-edge
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Apply this skill when designing a full-screen application layout. Use this to style system bars (status and navigation bars), configure immersive modes, hide/show bars on specific screens (e.g. video players, games), and ensure content fits behind display cutouts or notches without clipping UI controls.

## Core guidance

### Edge-to-Edge Setup

- Call `enableEdgeToEdge()` in your Activity's `onCreate()` before setting content. This is the platform standard starting in Android 15.
- Control light/dark system bar content colors using `SystemBarStyle.light()` or `SystemBarStyle.dark()` to match screen themes.

### System Bar Visibility (Immersive Mode)

- To hide status/navigation bars for full-screen immersive media layout, use `WindowInsetsControllerCompat`.
- Set behavior to `BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE` to prevent system bars from overlaying static game layouts permanently.

### Display Cutout Handling

- Configure `window.attributes.layoutInDisplayCutoutMode` in the window attributes.
- Use `LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES` to let background content flow behind notches on landscape view screens, while padding interactive elements.

```kotlin
// Edge-to-edge in Activity
class PlayerActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Go full edge-to-edge
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.auto(Color.TRANSPARENT, Color.TRANSPARENT),
            navigationBarStyle = SystemBarStyle.auto(Color.TRANSPARENT, Color.TRANSPARENT)
        )
        
        setContent {
            PlayerScreen()
        }
    }
}

// Immersive mode controls
fun setImmersiveMode(window: Window, show: Boolean) {
    val windowInsetsController = WindowCompat.getInsetsController(window, window.decorView)
    windowInsetsController.systemBarsBehavior = 
        WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        
    if (show) {
        windowInsetsController.show(WindowInsetsCompat.Type.systemBars())
    } else {
        windowInsetsController.hide(WindowInsetsCompat.Type.systemBars())
    }
}
```

## Platform notes

- **Android 15+ Edge-to-Edge:** Apps targeting Android 15 (API 35) or higher are forced to go edge-to-edge. System bar styling overrides via window flags (e.g. `FLAG_TRANSLUCENT_STATUS`) are ignored by the platform.
- **Display Cutout Modes:** The default mode (`LAYOUT_IN_DISPLAY_CUTOUT_MODE_DEFAULT`) prevents your layout from entering the cutout area in portrait, which can leave a black band. Always override this behavior for canvas drawings or full-screen video players.

## Pitfalls

- **Unreachable Tap Targets:** Placing buttons at the very top or bottom of the screen without inset padding makes them overlap with status icons or navigation gestures. Always pair edge-to-edge with `WindowInsets` wrappers.
- **Low Contrast System Bar Icons:** Setting a white background for an app header while leaving status bar icons white makes battery/wifi icons invisible. Always update `statusBarStyle` light/dark settings dynamically to match current screen headers.

## References

- **Documentation:** [Build apps edge-to-edge](https://developer.android.com/develop/ui/views/layout/edge-to-edge)
- **Documentation:** [Immersive Full-Screen mode](https://developer.android.com/develop/ui/views/layout/immersive)

## See also

See the `compose-window-insets` skill to learn how to apply margins to UI elements. See the `adopting-edge-to-edge-predictive-back` overview skill for migration checklists.
