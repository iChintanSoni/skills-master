---
name: compose-window-insets
description: Covers window insets and edge-to-edge layout in Jetpack Compose — Use when building screens that draw behind system bars, handle the soft keyboard, or need correct safe-area padding on phones and large screens.
---

## When to use

Apply this skill whenever a screen must draw content beneath the status bar, navigation bar, or display cutout; whenever a text field needs to scroll clear of the soft keyboard; or whenever a large-screen layout must respect split-screen or taskbar insets. It is essential for any app targeting Android 15+, where edge-to-edge is enforced by default.

## Core guidance

### Enabling edge-to-edge

Call `enableEdgeToEdge()` in `Activity.onCreate`, before `setContent`. On Android 15+ the system enforces edge-to-edge regardless, so this call also normalises behaviour on older API levels.

```kotlin
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()          // must come before setContent
        super.onCreate(savedInstanceState)
        setContent {
            AppTheme {
                MainScaffold()
            }
        }
    }
}

@Composable
fun MainScaffold() {
    Scaffold(
        topBar = { TopAppBar(title = { Text("Home") }) },
        bottomBar = { BottomNavigationBar() },
        contentWindowInsets = WindowInsets.safeDrawing   // (1)
    ) { innerPadding ->
        // innerPadding already includes safeDrawing insets from the Scaffold
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = innerPadding               // (2) consume them here
        ) {
            items(100) { index -> ListRow(index) }
        }
    }
}
```

**(1)** Passing `contentWindowInsets` to `Scaffold` tells it which inset type to use when computing `innerPadding`.
**(2)** Use `innerPadding` exactly once — on the scrollable container or the outermost composable — to avoid double-applying it.

---

### WindowInsets types — pick the right one

| Type | Use when |
|---|---|
| `WindowInsets.systemBars` | Padding only around status bar and nav bar |
| `WindowInsets.safeDrawing` | System bars + display cutouts + rounded corners — preferred for most UI |
| `WindowInsets.safeContent` | `safeDrawing` minus tappable-element exclusions (rare) |
| `WindowInsets.ime` | Raise content above the soft keyboard |
| `WindowInsets.safeDrawingWithoutIme` | Stable layout anchor unaffected by keyboard open/close |

---

### Modifier helpers

- `Modifier.windowInsetsPadding(insets)` — general-purpose; adds padding equal to the given inset values.
- `Modifier.safeDrawingPadding()` — shorthand for `windowInsetsPadding(WindowInsets.safeDrawing)`.
- `Modifier.imePadding()` — animates layout upward as the keyboard appears; pair with `Modifier.imeNestedScroll()` on a scroll container so the list can be scrolled further to dismiss the keyboard.
- `Modifier.statusBarsPadding()` / `Modifier.navigationBarsPadding()` — fine-grained control when a surface must ignore one side.

---

### IME (keyboard) handling

- Use `Modifier.imePadding()` on the root Column/Box of a form screen so the focused field scrolls into view automatically.
- Add `Modifier.imeNestedScroll()` to the enclosing `ScrollableColumn` / `LazyColumn` so a downward fling can dismiss the keyboard.
- Set `WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = true/false` if you need to adapt icon colours to a custom status-bar background — but prefer the `statusBarColor` / `navigationBarColor` slots in your `enableEdgeToEdge` overload instead.

---

### Consuming insets — avoid double padding

Compose insets are consumed as they flow down the composition tree. Once a composable calls `windowInsetsPadding` (or a Scaffold does it via `contentWindowInsets`), the same inset values are zeroed out for all descendants.

- **Do** pass `innerPadding` from `Scaffold` into a single child.
- **Do not** call both `Modifier.safeDrawingPadding()` on a parent and then re-apply `innerPadding` from a Scaffold — the insets will double up.
- If a child needs access to raw inset values (e.g., to size a spacer), read `WindowInsets.safeDrawing.asPaddingValues()` before the parent has consumed them, or use `LocalWindowInsets`.

---

### Android 15+ enforcement

From API 35, the system forces edge-to-edge regardless of `windowSoftInputMode` or legacy flags. Apps that were relying on the system drawing a coloured status bar will see content bleed behind it. Audit all screens and ensure every top-level composable or Scaffold passes appropriate insets down to its scrollable content.

---

## Platform notes

**Phones:** `WindowInsets.systemBars` is sufficient for portrait layouts without cutouts. Prefer `safeDrawing` as the safe default.

**Foldables / large screens:** On a device in split-screen or with a taskbar, `WindowInsets.systemGestures` and `WindowInsets.mandatorySystemGestures` describe gesture exclusion zones; avoid placing swipeable UI (e.g., carousels) at screen edges without exclusion rects.

**Tablets:** The navigation bar may appear on the side in landscape. `safeDrawing` handles this automatically; `navigationBarsPadding()` alone does not account for cutouts.

**Display cutouts:** `WindowInsets.displayCutout` is included in `safeDrawing`. Do not add it separately unless you are building a fully custom layout that explicitly omits `safeDrawing`.

## Pitfalls

- **Calling `enableEdgeToEdge()` after `setContent`** — the Activity window flags are read before the first frame; placing it after causes a visible layout jump.
- **Double-consuming insets** — applying both `Scaffold(contentWindowInsets = ...)` and `Modifier.safeDrawingPadding()` on the same subtree produces too much padding on API 35+.
- **Ignoring IME animation** — using a fixed bottom padding instead of `imePadding()` causes abrupt layout jumps when the keyboard opens. `imePadding()` interpolates smoothly via `WindowInsetsAnimation`.
- **Hard-coded status bar height** — never use `25.dp` or a resources dimension for status bar height; use `WindowInsets.statusBars` so the value adapts to device and API level.
- **Forgetting `imeNestedScroll`** — without it, a LazyList does not dismiss the keyboard on downward fling, frustrating users in chat or feed screens.
- **Mixing View-based inset handling with Compose** — if the activity or a Fragment uses `ViewCompat.setOnApplyWindowInsetsListener`, it may consume insets before Compose sees them. Remove legacy listeners or bridge them with `rememberWindowInsetsController`.

## References

- **Documentation:** [Compose layouts — Insets](https://developer.android.com/develop/ui/compose/layouts/insets)
- **Documentation:** [Edge-to-edge in Compose](https://developer.android.com/develop/ui/views/layout/edge-to-edge)
- **API Reference:** [WindowInsets (Compose Foundation)](https://developer.android.com/reference/kotlin/androidx/compose/foundation/layout/WindowInsets)

## See also

Use `compose-scaffold-slots` for the full Material 3 `Scaffold` surface and slot API. See `compose-state` for managing keyboard visibility as observable state. For large-screen adaptive patterns that depend on safe insets, see `adaptive-layout`.
