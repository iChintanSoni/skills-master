---
name: adaptive-window-size-classes
description: Covers WindowSizeClass computation via currentWindowAdaptiveInfo() and calculateWindowSizeClass(), the compact/medium/expanded width and height breakpoints, and driving adaptive decisions — navigation type, pane count, column count — from size class rather than device type. Use when building layouts that must adapt to phones, tablets, foldables, and ChromeOS windows without hard-coded device checks.
globs:
  - "**/*.kt"
tags: [adaptive, window-size-classes, large-screen, compose, material3]
x-skills-master:
  domain: android
  class: code
  category: form-factors
  platforms: ["android", "large-screen", "chromeos"]
  requires: { "android": "16", "kotlin": "2.2", "compose-bom": "2026.05.00" }
  pairs_with: [m3-large-screens]
  sources:
    - https://developer.android.com/develop/ui/compose/layouts/adaptive/use-window-size-classes
    - https://developer.android.com/develop/ui/compose/layouts/adaptive
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Apply this skill whenever your app must present different navigation chrome, pane counts, or content structures depending on the available window width or height — for example, switching from a `BottomNavigationBar` on compact phones to a `NavigationRail` on medium tablets and a persistent `NavigationDrawer` on expanded desktop-class windows, or moving from a single-pane list to a two-pane list-detail layout. Use it instead of querying `Build.MODEL`, screen DPI buckets, or `Configuration.smallestScreenWidthDp` directly.

## Core guidance

### Breakpoints

`WindowWidthSizeClass` and `WindowHeightSizeClass` each have three values:

| Class | Width breakpoint | Typical form factor |
|---|---|---|
| `Compact` | < 600 dp | Portrait phone |
| `Medium` | 600 – 839 dp | Large phone landscape, small tablet, foldable open |
| `Expanded` | >= 840 dp | Tablet, ChromeOS, large foldable |

Height follows the same three names with different thresholds (Compact < 480 dp, Medium 480–899 dp, Expanded >= 900 dp). Most adaptive decisions are driven by **width**; height class matters for tall content such as a scrollable form where you want to reveal more rows at once.

### Computing the size class in Compose

Prefer `currentWindowAdaptiveInfo()` — it is a Compose-native API that reads the current window's adaptive information including `WindowSizeClass`, and recomposes automatically when the window resizes:

```kotlin
@Composable
fun MyApp() {
    val adaptiveInfo = currentWindowAdaptiveInfo()
    val widthClass = adaptiveInfo.windowSizeClass.windowWidthSizeClass
    val heightClass = adaptiveInfo.windowSizeClass.windowHeightSizeClass

    val showNavRail = widthClass != WindowWidthSizeClass.COMPACT
    val useListDetail = widthClass == WindowWidthSizeClass.EXPANDED

    Scaffold(
        bottomBar = {
            if (!showNavRail) {
                MyBottomBar()
            }
        },
    ) { innerPadding ->
        Row(Modifier.padding(innerPadding).fillMaxSize()) {
            if (showNavRail) {
                MyNavRail()
            }
            if (useListDetail) {
                ListDetailPane(Modifier.weight(1f))
            } else {
                SinglePaneContent(Modifier.fillMaxSize())
            }
        }
    }
}
```

- Do **not** call `calculateWindowSizeClass(activity)` from inside a composable — it is a View-system API intended for use before Compose is hoisted, or in hybrid View+Compose screens. Prefer `currentWindowAdaptiveInfo()` for fully Compose apps.
- Do **not** pass raw `WindowSizeClass` objects down through every composable. Hoist the class at the screen level, derive a small set of booleans or a sealed `AdaptiveLayout` type, and pass those instead.
- Do **not** branch on `WindowWidthSizeClass.MEDIUM` and `EXPANDED` separately if the only distinction is "rail vs. no rail" — treat Medium and Expanded together to keep logic simple.
- Do **not** substitute `BoxWithConstraints.maxWidth` comparisons for `WindowSizeClass` at the screen level. `BoxWithConstraints` is a local measure-time tool; `WindowSizeClass` encodes the system's authoritative breakpoints and survives config changes and multi-window resizing correctly.

### Driving navigation type

```kotlin
sealed interface NavType {
    data object BottomBar : NavType
    data object Rail : NavType
    data object Drawer : NavType
}

fun windowWidthToNavType(widthClass: WindowWidthSizeClass): NavType =
    when (widthClass) {
        WindowWidthSizeClass.COMPACT -> NavType.BottomBar
        WindowWidthSizeClass.MEDIUM -> NavType.Rail
        WindowWidthSizeClass.EXPANDED -> NavType.Drawer
        else -> NavType.BottomBar
    }
```

### Driving column count and pane count

- `Compact` — single column, single pane.
- `Medium` — two columns in a grid, or one pane with a persistent side panel.
- `Expanded` — three or more columns, or a canonical two-pane list-detail.

Compute column count as a pure function of `WindowWidthSizeClass` and pass it as an `Int` into your grid composable. This keeps the composable testable without an Activity.

### Testing

Inject a `WindowSizeClass` instance via a constructor or parameter rather than reading `currentWindowAdaptiveInfo()` directly in a unit test. The `material3-adaptive` library provides `WindowSizeClass.calculateFromSize(DpSize(...))` for constructing arbitrary test values:

```kotlin
val compactClass = WindowSizeClass.calculateFromSize(DpSize(400.dp, 800.dp))
val expandedClass = WindowSizeClass.calculateFromSize(DpSize(1200.dp, 900.dp))
```

Pass these into your screen-level composable in a `@Composable` test to verify the correct layout branch renders.

## Platform notes

- **Foldables:** On a foldable in the folded state the window is `Compact`; when open it is typically `Medium` or `Expanded`. `currentWindowAdaptiveInfo()` also exposes `windowPosture` (`Tabletop`, `Book`, `Normal`) — use this in addition to size class to decide whether to split content at the hinge.
- **ChromeOS:** Apps run in resizable windows that can cross every size-class boundary. `currentWindowAdaptiveInfo()` recomposes as the user drags the window edge, so adaptive layouts update live without any extra work.
- **Multi-window / split-screen:** The window your app occupies is smaller than the physical screen. Always derive breakpoints from the window size, never from `DisplayMetrics` or `Resources.getDisplayMetrics()`.
- **Activity recreation vs. recomposition:** In Compose, `currentWindowAdaptiveInfo()` survives recomposition on resize without recreating the Activity (on API 24+ with `android:configChanges="screenSize|smallestScreenSize|orientation|screenLayout"` declared). Declare those config changes to prevent unnecessary recreation on orientation and resize events.

## Pitfalls

- **Checking `Build.MODEL` or `PackageManager.hasSystemFeature(FEATURE_WATCH)`** to branch layouts — always use `WindowSizeClass` instead; a Pixel phone in landscape and a small tablet share the same `Medium` class and deserve the same layout.
- **Hardcoding `600.dp` thresholds inside composables** — this duplicates the platform-defined breakpoints. Extract a `windowWidthToNavType()` helper that takes `WindowWidthSizeClass` so there is a single source of truth.
- **Passing `WindowSizeClass` as a `@Stable` class through dozens of composables** — derive booleans (`val showRail`, `val twoPane`) at the screen root and pass only what each composable needs.
- **Reading `currentWindowAdaptiveInfo()` inside a `ViewModel`** — it is a `@Composable` function. Collect it in the composable layer and pass the derived layout type into the ViewModel if needed, or handle it entirely in the composable.
- **Ignoring the `else` branch in a `when` on `WindowWidthSizeClass`** — the enum is not sealed; new values may be added in future SDK releases. Always include an `else` fallback.
- **Using `WindowWidthSizeClass.COMPACT.ordinal` or comparing by name string** — compare with the named constants (`WindowWidthSizeClass.COMPACT`, `.MEDIUM`, `.EXPANDED`) only.
- **Forgetting to add `android:configChanges`** — without it the Activity recreates on every orientation or resize event on some devices, causing visible recomposition jank and reset of scroll state.

## References

- **Guide — Use window size classes:** [https://developer.android.com/develop/ui/compose/layouts/adaptive/use-window-size-classes](https://developer.android.com/develop/ui/compose/layouts/adaptive/use-window-size-classes)
- **Guide — Adaptive layouts overview:** [https://developer.android.com/develop/ui/compose/layouts/adaptive](https://developer.android.com/develop/ui/compose/layouts/adaptive)

## See also

For placing composables and using `BoxWithConstraints` for local leaf-level adaptations, see `compose-layout`. For the Navigation component patterns that pair with nav rail and drawer switching, see the navigation-architecture skill. For WindowPosture foldable hinge detection layered on top of size classes, consult the adaptive layouts overview linked in References above.
