---
name: tv-focus-input
description: Covers Jetpack Compose for TV focus management — focusRestorer, focus groups, D-pad key event handling, focused-state visuals, and predictable directional navigation. Use when building or debugging navigation on Android TV with Compose for TV, ensuring D-pad users can traverse every interactive element in a logical, predictable order.
---

## When to use

Apply this skill when writing any screen that will run on Android TV using Jetpack Compose for TV (`androidx.tv:tv-compose`). It is the primary reference for:

- Connecting rows, grids, and custom containers so D-pad left/right/up/down always land on the expected item.
- Restoring focus to the previously focused item when the user returns to a surface (back navigation, tab switch, dialog dismiss).
- Grouping focusable children so focus enters and exits the group as a unit.
- Reacting to D-pad Center (OK), Back, and directional key events in composables that need bespoke behaviour.
- Styling the focused state so users always know where they are.

Do not apply this to handset-only apps; on touch-primary surfaces most of this is invisible. Pair it with the `compose-accessibility` skill when keyboard / Switch Access support is also required.

## Core guidance

### Make every interactive element focusable

- Mark non-standard interactive composables with `Modifier.focusable()` so they receive D-pad events. Components from `androidx.tv.material3` (e.g., `Button`, `Card`, `NavigationDrawerItem`) are already focusable.
- Avoid relying on `clickable` alone on TV; it makes an element reachable by touch but not by D-pad unless you also apply `focusable`.
- Set `Modifier.focusTarget()` only when you are building a fully custom low-level focusable that handles its own key events via `onKeyEvent`.

### Set a predictable initial focus and restore it on return

Use `Modifier.focusRestorer()` on the container of a row or grid so that when the user navigates back into the surface the cursor lands on whichever item had focus before, not always the first element.

```kotlin
@Composable
fun CatalogRow(
    items: List<Movie>,
    onSelect: (Movie) -> Unit,
    modifier: Modifier = Modifier,
) {
    val focusRequester = remember { FocusRequester() }

    TvLazyRow(
        modifier = modifier.focusRestorer { focusRequester },
    ) {
        itemsIndexed(items) { index, movie ->
            val itemModifier = if (index == 0) {
                Modifier.focusRequester(focusRequester)
            } else {
                Modifier
            }
            MovieCard(
                movie = movie,
                modifier = itemModifier.focusable(),
                onClick = { onSelect(movie) },
            )
        }
    }
}
```

- `focusRestorer { focusRequester }` is a TV-Compose API (`androidx.tv.foundation.lazy.list`). Pass a `FocusRequester` anchored to the first (or previously saved) item.
- When using `TvLazyRow` / `TvLazyColumn` from `androidx.tv.foundation`, `focusRestorer` participates in the focus-restoration chain automatically.
- For a custom container, use `Modifier.focusGroup()` to declare a logical group and `FocusManager.moveFocus(FocusDirection.*)` to implement custom traversal.

### Handle D-pad key events

- Intercept D-pad presses with `Modifier.onKeyEvent { keyEvent -> … }`. Return `true` to consume the event, `false` to let the framework continue normal traversal.
- Use `KeyEvent.key` against `Key.DirectionUp`, `Key.DirectionDown`, `Key.DirectionLeft`, `Key.DirectionRight`, and `Key.DirectionCenter` (OK button).
- For Back, prefer `BackHandler` rather than `onKeyEvent`; it integrates with `androidx.activity`.
- Process events on `KeyEvent.type == KeyEventType.KeyDown` to avoid double-firing; ignore `KeyUp` unless you need press-and-hold.

```kotlin
@Composable
fun PlayerControls(
    onPlayPause: () -> Unit,
    onSeekForward: () -> Unit,
    onSeekBack: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier
            .focusable()
            .onKeyEvent { event ->
                if (event.type != KeyEventType.KeyDown) return@onKeyEvent false
                when (event.key) {
                    Key.DirectionCenter -> { onPlayPause(); true }
                    Key.DirectionRight  -> { onSeekForward(); true }
                    Key.DirectionLeft   -> { onSeekBack(); true }
                    else -> false
                }
            }
    ) {
        // player overlay content
    }
}
```

### Visualise the focused state clearly

- Use `tv.material3` components; they render a focused border via `ClickableSurfaceDefaults.border` / `CardDefaults.border` that satisfies TV design requirements out of the box.
- For custom composables, read focus state with `Modifier.onFocusChanged { state -> isFocused = state.isFocused }` and drive visual changes (scale, border, elevation) with Compose animation APIs.
- Never rely solely on colour to indicate focus — use both a border/scale change and a colour shift together to meet TV HIG contrast requirements.
- Minimum touch-target rules do not apply to TV, but keep focusable items large enough (at least 48 × 48 dp equivalent at the TV viewing distance ratio) and far enough apart that the D-pad cursor does not skip items.

### Directional focus customisation

- When the default spatial algorithm sends focus to the wrong neighbour, override it with `Modifier.focusProperties { next = otherRequester }` or the direction-specific variants (`right = …`, `down = …`, `up = …`, `left = …`).
- Provide bidirectional overrides: if A says `right = B`, make sure B says `left = A`; asymmetric overrides cause focus traps.
- Avoid hard-coding absolute pixel positions for focus searching; use `FocusRequester` references instead, which survive layout changes.
- Wrap a modal overlay (dialog, bottom sheet) in `FocusScope` (via `Modifier.focusGroup()`) and request focus into it on open; release it on close so focus returns to the trigger element.

### Request focus programmatically

- Call `FocusRequester.requestFocus()` inside a `LaunchedEffect` or event handler, never directly in a composable body.
- Save and restore the `FocusRequester` for the active item across config changes by hoisting it to a `ViewModel` or a `rememberSaveable`-backed state object.

## Platform notes

- **TV-Compose vs. standard Compose.** `androidx.tv:tv-compose` re-exports Compose Foundation primitives and adds TV-specific components (`TvLazyRow`, `TvLazyColumn`, `NavigationDrawer`, `Carousel`). Always import from `androidx.tv.*`; the generic Compose `LazyRow` does not propagate `focusRestorer` correctly on TV.
- **Leanback legacy.** If the app mixes Leanback `Fragment`-based screens with Compose screens, focus handoff at the boundary must be managed explicitly. Prefer a full Compose migration over Leanback interop for new screens.
- **API 16 minimum, TV profile.** The `tv-compose` library targets `minSdk = 21` in practice; declaring `android: "16"` in `requires` reflects the project-level minimum. TV devices ship API 21+ but testing on API 21 emulators is valid.
- **HDMI-CEC remotes** may send different key codes than the Android TV remote — test with a real device. The `KeyEvent.key` API normalises most D-pad events, but media keys (`Key.MediaPlayPause`, etc.) arrive separately.

## Pitfalls

- **No explicit `focusable()` on custom components.** Tapping works; D-pad silently skips the item. Always call `focusable()` or `focusTarget()` on anything a user must reach with a remote.
- **Forgetting `focusRestorer`.** Without it, every navigation back to a row resets focus to item 0. Users lose their place in long carousels, which is a major TV UX problem.
- **One-sided `focusProperties` overrides.** Setting `right = nextRequester` without setting `nextRequester.left = thisRequester` creates a directional trap; the user cannot navigate back.
- **Calling `requestFocus()` in composition.** This runs on every recomposition. Always place it inside `LaunchedEffect(Unit) { … }` or an event callback.
- **Consuming all key events.** Returning `true` from `onKeyEvent` for unhandled keys blocks system navigation (Home, Back). Always include a default `else -> false` branch.
- **Relying on touch-based interaction patterns.** Long-press context menus, swipe-to-dismiss, and multi-touch gestures do not exist on TV. Expose all actions via D-pad-reachable buttons or focus-triggered menus.
- **Not testing with a physical remote or D-pad emulation.** The Android Emulator's D-pad is sufficient for basic traversal, but HDMI-CEC remote key codes and repeat-key behaviour differ and must be verified on device.

## References

- **Documentation:** [Design navigation for TV](https://developer.android.com/training/tv/start/navigation)
- **Documentation:** [Focus in Jetpack Compose](https://developer.android.com/develop/ui/compose/touch-input/focus)

## See also

For general Compose semantics and assistive-technology support (including Switch Access, which shares focus traversal logic with D-pad), see `compose-accessibility`. For animating the focused-state scale and border transitions smoothly, see `compose-animation`. For building the lazy rows and grids that host focusable TV cards, see `compose-lazy-lists`.
