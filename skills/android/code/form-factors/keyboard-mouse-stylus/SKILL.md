---
name: keyboard-mouse-stylus
description: Covers hardware input on large-screen and ChromeOS surfaces — physical keyboard shortcuts (onKeyEvent, KeyboardShortcutGroup), pointer hover and right-click, mouse/trackpad scrolling, and stylus/pen input including low-latency rendering and motion prediction. Use when building apps that must feel native on tablets, foldables, or ChromeOS where keyboard, mouse, and stylus are primary input methods.
globs:
  - "**/*.kt"
tags: [keyboard, stylus, mouse, large-screen, chromeos, pointer-input]
x-skills-master:
  domain: android
  class: code
  category: form-factors
  platforms: ["android", "large-screen", "chromeos"]
  requires: { "android": "16", "kotlin": "2.2", "compose-bom": "2026.05.00" }
  pairs_with: [compose-gestures]
  sources:
    - https://developer.android.com/develop/ui/compose/touch-input
    - https://developer.android.com/develop/ui/compose/touch-input/stylus-input
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Apply this skill when your app targets tablets, foldables, or ChromeOS and users may interact primarily through:

- A **physical keyboard** — shortcuts, modifier keys, focus-driven navigation.
- A **mouse or trackpad** — hover states, right-click context menus, precision scrolling.
- A **stylus or digital pen** — inking, pressure-sensitive drawing, low-latency canvas rendering.

Do NOT use this skill for touch-only phone layouts or for IME/soft-keyboard input (see `compose-text-fields` instead). The APIs here assume a large-screen or ChromeOS deployment context where `WindowSizeClass` is at least `Medium`.

## Core guidance

### Physical keyboard shortcuts

- Intercept key events with `Modifier.onKeyEvent` or `Modifier.onPreviewKeyEvent`. Use `onPreviewKeyEvent` when you need to capture before child composables consume.
- Always check `keyEvent.type == KeyEventType.KeyDown` before acting — key-up events fire too and can double-trigger actions.
- Declare discoverable shortcuts via `KeyboardShortcutGroup` supplied to `ComponentActivity.setKeyboardShortcutsProvider`. The system renders these in the shortcut helper panel (long-press Meta).
- Map common system shortcuts (`Ctrl+Z` for undo, `Ctrl+S` for save) first; override only when semantics are context-specific.
- Use `Key` constants from `androidx.compose.ui.input.key` — do NOT hardcode key codes as integers.
- For navigation shortcuts (arrow keys, Tab), rely on Compose focus traversal first (`focusProperties`, `FocusDirection`); add `onKeyEvent` only for actions that are not focus movement.

```kotlin
@Composable
fun EditorCanvas(onUndo: () -> Unit, onSave: () -> Unit) {
    val focusRequester = remember { FocusRequester() }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .focusRequester(focusRequester)
            .focusable()
            .onKeyEvent { event ->
                if (event.type != KeyEventType.KeyDown) return@onKeyEvent false
                when {
                    event.isCtrlPressed && event.key == Key.Z -> {
                        onUndo(); true
                    }
                    event.isCtrlPressed && event.key == Key.S -> {
                        onSave(); true
                    }
                    else -> false
                }
            }
    ) {
        DrawingContent()
    }

    LaunchedEffect(Unit) { focusRequester.requestFocus() }
}

// Activity — register discoverable shortcut groups
class EditorActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setKeyboardShortcutsProvider {
            listOf(
                KeyboardShortcutGroup(
                    "Editor",
                    listOf(
                        KeyboardShortcutInfo("Undo", KeyEvent.KEYCODE_Z, KeyEvent.META_CTRL_ON),
                        KeyboardShortcutInfo("Save", KeyEvent.KEYCODE_S, KeyEvent.META_CTRL_ON),
                    )
                )
            )
        }
        setContent { EditorCanvas(onUndo = ::undo, onSave = ::save) }
    }
}
```

### Pointer hover and right-click

- Use `Modifier.pointerInput(Unit)` with `awaitPointerEventScope` to distinguish `PointerType.Mouse` from `PointerType.Touch` and `PointerType.Stylus`.
- Implement hover state with `Modifier.hoverable(interactionSource)` — it automatically emits `HoverInteraction.Enter/Exit`. Collect these to drive tooltip visibility or highlight effects.
- Right-click maps to a `PointerEvent` where `button == PointerButtons.Secondary`. Show a `DropdownMenu` anchored to the pointer position; pass `offset` obtained from `event.changes.first().position`.
- Do NOT rely on long-press alone for context menus on large-screen — mouse users expect right-click; both code paths must exist.
- `Modifier.contextMenuArea` (from `androidx.compose.ui.platform`) is the highest-level API for unified right-click and long-press context menus — prefer it over manual pointer detection.

### Mouse and trackpad scrolling

- Compose `ScrollState`/`LazyListState` scroll wheels and trackpad flings automatically when the composable is inside `Modifier.verticalScroll` or a `Lazy*` layout — no extra wiring needed.
- For custom scrollable surfaces (e.g., canvas-based panning), consume `PointerEventType.Scroll` inside `awaitPointerEventScope`. Use `event.changes.first().scrollDelta` for the delta vector (x horizontal, y vertical).
- Respect `LocalViewConfiguration.current` for scroll thresholds — do not hard-code pixel values.
- On ChromeOS, horizontal trackpad swipe maps to `scrollDelta.x`; implement two-axis panning in drawing canvases.
- Never swallow scroll events without consuming them; propagate unhandled deltas up with `nestedScroll` so parent coordinators (collapsing toolbars, pager) still work.

### Stylus and pen input

- Detect stylus via `PointerType.Stylus` on any `PointerInputChange`. Query pressure (`change.pressure`), tilt (`change.tilt`), and orientation from the raw `MotionEvent` if needed (`(LocalView.current as? View)` event dispatch or `pointerInput` block).
- For inking, enable **low-latency rendering** by using `MotionEventCompat` alongside `Canvas.drawLine` in a `View`-based overlay, or integrate `androidx.input:input-motionprediction` for motion prediction that reduces perceived latency by extrapolating stylus position.
- Request the `STYLUS_HANDWRITING` capability flag in your manifest if using system handwriting recognition. Let the IME handle handwriting — do not reimplement recognition.
- Use `PointerInteropFilter` (`Modifier.pointerInteropFilter`) to access raw `MotionEvent` objects when you need historical batched samples (`event.historySize`, `event.getHistoricalX()`); historical samples are essential for smooth ink paths.
- Separate stylus from finger/palm: check `event.getToolType(pointerIndex) == MotionEvent.TOOL_TYPE_STYLUS` and reject `TOOL_TYPE_FINGER` while the stylus is hovering (palm rejection).
- Prefer `FrontBufferRenderer` (from `androidx.graphics:graphics-core`) for the active stroke layer — it composites a front-buffer canvas on top of the main surface for sub-frame latency, then commits the final stroke to the main canvas on lift.

## Platform notes

**ChromeOS:** Apps run in a resizable window. Physical keyboard shortcuts must not assume full-screen; `WindowSizeClass.Compact` can occur in a split-window. ALT+F4 to close is handled by the system — never intercept it. Trackpad tap-to-click produces `PointerType.Mouse` events (not `Touch`); design hover states accordingly.

**Foldables and tablets (Android 16+):** `WindowInfoTracker` provides `WindowLayoutInfo` to detect hinge position. When the keyboard is attached (Bluetooth or cover keyboard), `InputDevice.SOURCE_KEYBOARD` is available; verify with `InputDevice.getDeviceIds()` if you need to show/hide keyboard shortcut hints.

**Stylus low-latency (API 33+):** `MotionEvent.FLAG_CANCELED` and the `TOOL_TYPE_PALM` tool type are available since API 33. `FrontBufferRenderer` requires `androidx.graphics:graphics-core:1.0+`. Motion prediction via `androidx.input:input-motionprediction` is API-level-agnostic (library handles fallback).

**Compose BOM 2026.05.00:** `hoverable`, `contextMenuArea`, and `PointerType` are stable. `PointerButtons` secondary detection is stable since Compose Foundation 1.6.

## Pitfalls

- **`onKeyEvent` returns `false` by default:** If you forget to return `true` after handling, the event propagates further and may trigger unintended actions in a parent composable.
- **Missing `focusable()` on the canvas:** `onKeyEvent` only fires on focused composables. A drawing canvas that never calls `focusable()` or requests focus will silently drop all keyboard events.
- **Ignoring `KeyEventType.KeyDown` check:** Acting on `KeyUp` means every shortcut fires twice. Always guard with `if (event.type != KeyEventType.KeyDown) return@onKeyEvent false`.
- **Right-click without hover support:** Mouse users expect hover feedback before right-clicking. Implementing right-click context menus but not hover highlight feels unpolished on ChromeOS.
- **Blocking parent scroll with custom scroll delta handling:** Consuming `PointerEventType.Scroll` without feeding unhandled deltas to the `NestedScrollConnection` breaks collapsing app bars and pagers.
- **Not using historical samples for ink:** Only reading the final `PointerInputChange` position produces jagged strokes at high stylus speeds. Always iterate `event.historySize` to capture all batched samples.
- **Palm rejection absent:** Without checking `TOOL_TYPE_FINGER` while a stylus is active, the side of the hand dragging across the screen draws unintended strokes.
- **`setKeyboardShortcutsProvider` not called:** Shortcuts work silently without registration, but users have no way to discover them. Always register a `KeyboardShortcutGroup` for every non-obvious shortcut.
- **Hardcoding scroll direction:** Do not assume vertical-only scrolling on large screens. Trackpad and stylus users commonly pan both axes simultaneously.

## References

- **Keyboard input guide:** [Compose keyboard input](https://developer.android.com/develop/ui/compose/touch-input)
- **Stylus input guide:** [Compose stylus input](https://developer.android.com/develop/ui/compose/touch-input/stylus-input)

## See also

For focus traversal and `FocusRequester` patterns that complement keyboard shortcuts, see `compose-foundation`. Low-latency drawing canvases often need `compose-graphics` for custom `DrawScope` work. Apps deploying on ChromeOS or foldables that also adapt layout should pair this skill with `adaptive-layout` for `WindowSizeClass` and two-pane navigation patterns. Text fields that accept stylus handwriting input connect to `compose-text-fields` for IME configuration and `TextFieldState` management.
