---
name: compose-foundation
description: Covers the Compose Foundation layer — clickable/combinedClickable, scroll and scrollable, BasicText/BasicTextField, focus management, MutableInteractionSource, and low-level pointer gestures. Use when building custom components that need raw gesture handling, custom indication, or text primitives without Material 3 opinionated styling.
---

## When to use

Reach for `androidx.compose.foundation` — rather than Material 3 equivalents — when:

- You need a **fully custom visual style** that Material's `Button`, `TextField`, or `Card` would fight against.
- You need **fine-grained pointer input** (multi-pointer tracking, drag thresholds, combined tap/long-press/double-tap in one gesture detector).
- You need **custom focus traversal** or focus-driven keyboard navigation on large-screen or TV surfaces.
- You need **custom scroll physics** or a scrollable that is not `LazyColumn`/`LazyRow`.
- You need to expose or observe `InteractionSource` events from a component you are composing yourself.

Do NOT drop to Foundation just to avoid theming. If Material 3 tokens can be overridden via `LocalContentColor`, `MaterialTheme.colorScheme`, or `CompositionLocal`, prefer staying in Material.

## Core guidance

### clickable and combinedClickable

- Use `Modifier.clickable` for simple tap actions; use `Modifier.combinedClickable` when you also need `onLongClick` or `onDoubleClick`.
- Always supply a `MutableInteractionSource` and `Indication` explicitly rather than relying on defaults — it gives you control over ripple scope, and avoids hidden allocation surprises.
- Pass `role = Role.Button` (or `Role.Checkbox`, etc.) to satisfy accessibility semantics.
- `clickable` already merges descendants into one semantics node; add `Modifier.semantics(mergeDescendants = true)` explicitly only when `clickable` is absent but you still want merging.

### scroll and scrollable

- `Modifier.verticalScroll(rememberScrollState())` is for simple column content that fits in memory.
- `Modifier.scrollable(state, Orientation.Vertical)` gives raw scroll delta callbacks — use it when you manage the scroll offset yourself (e.g., parallax, custom snap).
- Nest `nestedScroll` at the container level to propagate fling and scroll events to parent coordinators such as `TopAppBar` collapse.
- Do NOT combine `verticalScroll` with `LazyColumn` — the lazy layout needs unbounded height measurements and scroll will conflict.

### BasicText and BasicTextField

- `BasicText` renders text with zero Material decoration; wire your own `LocalTextStyle` if needed.
- `BasicTextField` is the correct choice for fully custom text inputs — it exposes `decorationBox` to wrap arbitrary content around the cursor/selection, unlike `TextField` which enforces Material slots.
- Pass a `TextFieldState` (the modern stateful API) or use the `value`/`onValueChange` overload for incremental migration.
- For large-screen: `BasicTextField` with `KeyboardOptions(imeAction = ImeAction.Next)` integrates cleanly with hardware keyboards and focus traversal.

### Indication and MutableInteractionSource

- Create `MutableInteractionSource` with `remember { MutableInteractionSource() }` and share it between `Modifier.clickable` and any indication-observing composable.
- Use `rememberRipple()` (foundation layer, not Material) to attach a ripple without a Material theme dependency; or implement `IndicationNodeFactory` for a fully custom press effect.
- Collect `interactionSource.interactions` as a `Flow` in a `LaunchedEffect` to drive custom animations based on press/hover/focus state.

### pointerInput — detectTapGestures and detectDragGestures

- `Modifier.pointerInput(key)` gives you a coroutine-based `PointerInputScope`. Restart it when `key` changes.
- Inside the block, call **only one** top-level detector (`detectTapGestures`, `detectDragGestures`, `detectTransformGestures`, etc.) — each call consumes the gesture stream. Chain multiple behaviours with `awaitEachGesture` / `awaitPointerEventScope` manually.
- `detectTapGestures` supports `onTap`, `onDoubleTap`, `onLongPress`, and `onPress`; prefer this over `clickable` only when you need `onPress` with a custom coroutine body or multi-pointer logic.
- Cancel-safe drag: `detectDragGestures` gives `onDragStart`, `onDrag`, `onDragEnd`, `onDragCancel` — always handle `onDragCancel` to reset transient state.

```kotlin
@Composable
fun SwipeableCard(onDismiss: () -> Unit) {
    val offsetX = remember { Animatable(0f) }
    val interactionSource = remember { MutableInteractionSource() }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(80.dp)
            .clickable(
                interactionSource = interactionSource,
                indication = rememberRipple(),
                role = Role.Button,
                onClick = { /* normal tap */ }
            )
            .pointerInput(Unit) {
                detectDragGestures(
                    onDragEnd = {
                        if (offsetX.value > 200f) onDismiss()
                        else launch { offsetX.animateTo(0f) }
                    },
                    onDragCancel = { launch { offsetX.animateTo(0f) } },
                    onDrag = { change, dragAmount ->
                        change.consume()
                        launch { offsetX.snapTo(offsetX.value + dragAmount.x) }
                    }
                )
            }
            .offset { IntOffset(offsetX.value.roundToInt(), 0) }
            .background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(12.dp))
    ) {
        BasicText(
            text = "Swipe to dismiss",
            modifier = Modifier.align(Alignment.CenterStart).padding(16.dp),
            style = MaterialTheme.typography.bodyLarge
        )
    }
}
```

### Focus management

- `Modifier.focusable()` makes a non-interactive composable reachable via keyboard/D-pad.
- Use `FocusRequester` + `Modifier.focusRequester(focusRequester)` to programmatically request focus; call `focusRequester.requestFocus()` inside `LaunchedEffect` or an event handler.
- `Modifier.focusProperties { next = otherRequester }` overrides default traversal order — essential for custom form layouts on large screens.
- Observe focus state with `onFocusChanged` or by collecting `interactionSource.interactions` for `FocusInteraction`.
- On foldable/large-screen, always verify focus moves correctly across panes in two-pane layouts.

## Platform notes

**Large-screen and foldable:** Foundation scrollables respond correctly to mouse scroll wheel and trackpad via `Modifier.scrollable` when `flingBehavior` is provided. `pointerInput` receives `PointerType.Mouse` events — gate drag-to-dismiss gestures on `PointerType.Touch` if needed. Focus management is critical: hardware keyboards demand logical focus traversal through every interactive element.

**Minimum API 16:** Foundation APIs compile down to API 16 via `minSdk 16`; no conditional guards needed for the APIs covered here.

**Compose BOM 2026.05.00:** `IndicationNodeFactory` is the stable API for custom indications (replacing the deprecated `Indication` interface). `TextFieldState` + `BasicTextField` (the state-hoisted overload) is the recommended text input path.

## Pitfalls

- **Gesture conflict between `clickable` and `pointerInput`:** Both consume events. Put `pointerInput` after `clickable` in the modifier chain so `clickable` gets first refusal on tap events, or use `awaitEachGesture` manually to share the stream.
- **Restarting `pointerInput` on every recomposition:** Using a captured lambda value as the key causes unnecessary restarts. Use `Unit` or a stable identity key.
- **Sharing `InteractionSource` incorrectly:** Passing a new `MutableInteractionSource()` on every composition (without `remember`) means the indication never sees press events.
- **`verticalScroll` + `LazyColumn` crash:** The lazy list must measure at infinity internally; combining them produces `IllegalStateException`. Use only one.
- **`BasicTextField` decoration box sizing:** If `decorationBox` does not call `innerTextField()`, the cursor is invisible. Always invoke the provided lambda.
- **Focus not moving on large-screen:** Forgetting `Modifier.focusable()` on custom drawn elements means keyboard/D-pad users cannot reach them at all.
- **Long-press delay with `clickable` + `combinedClickable` together:** Do not stack both modifiers on the same element; `combinedClickable` is a superset.

## References

- **Pointer input guide:** [Compose touch-input and pointer-input](https://developer.android.com/develop/ui/compose/touch-input/pointer-input)
- **Focus guide:** [Compose focus handling](https://developer.android.com/develop/ui/compose/touch-input/focus)
- **Foundation library overview:** [androidx.compose.foundation](https://developer.android.com/jetpack/androidx/releases/compose-foundation)

## See also

Gesture work on scrollable containers often pairs with `compose-lazy-lists` for lazy layout specifics. Text input built on `BasicTextField` frequently needs `compose-state` for `TextFieldState` and derived state patterns. Custom component theming sits alongside `compose-material3-theming`. For large-screen layout decisions that affect focus traversal and pane structure, see `adaptive-layout`.
