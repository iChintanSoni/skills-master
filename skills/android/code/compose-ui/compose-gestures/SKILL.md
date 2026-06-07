---
name: compose-gestures
description: Covers touch interaction processing, drag/tap gesture detection, multitouch zoom/pan configurations, and custom pointer inputs in Jetpack Compose. Use when adding custom drag mechanics, complex swipe actions, or raw touch responders.
tags: [compose, gestures, touch, pointer-input, drag, pinch-zoom, draggable]
x-skills-master:
  domain: android
  class: code
  category: compose-ui
  platforms: ["android", "large-screen"]
  requires:
    android: "16"
    kotlin: "2.2"
    compose-bom: "2026.05.00"
  pairs_with: [keyboard-mouse-stylus]
  sources:
    - https://developer.android.com/develop/ui/compose/touch-input/gestures
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Apply this skill when custom user touch interactions are required. Use this to handle tap gestures (`detectTapGestures`), configure pan/zoom operations (`detectTransformGestures`), implement customized dragging (`detectDragGestures`, `Modifier.draggable`), or wire up advanced swipe actions using the `AnchoredDraggable` API.

## Core guidance

### Gesture Detectors

- Intercept touch inputs using `Modifier.pointerInput(key)`.
- Use specific detector methods (`detectTapGestures`, `detectDragGestures`, `detectHorizontalDragGestures`, `detectTransformGestures`) inside a coroutine scope block.
- Always call `consume()` on pointer change events inside raw loops to prevent input events from propagating further.

### Drag Modifier

- For single-axis dragging (e.g. volume slides), prefer `Modifier.draggable` over raw pointer input blocks. It handles scroll interactions cleanly.

### AnchoredDraggable API

- Use `AnchoredDraggableState` to manage transitions between specific preset physical coordinates (anchors), e.g., swipe-to-dismiss cards or sliding drawers.

```kotlin
// Image Pinch-to-Zoom and Pan Detector
@Composable
fun PinchZoomImage(
    modifier: Modifier = Modifier
) {
    var scale by remember { mutableFloatStateOf(1f) }
    var offset by remember { mutableStateOf(Offset.Zero) }

    Box(
        modifier = modifier
            .fillMaxSize()
            .pointerInput(Unit) {
                detectTransformGestures { _, pan, zoom, _ ->
                    scale = (scale * zoom).coerceIn(1f, 5f)
                    offset = if (scale > 1f) offset + pan else Offset.Zero
                }
            }
    ) {
        Image(
            imageVector = Icons.Default.Image,
            contentDescription = "Zoomable image",
            modifier = Modifier
                .align(Alignment.Center)
                .graphicsLayer(
                    scaleX = scale,
                    scaleY = scale,
                    translationX = offset.x,
                    translationY = offset.y
                )
        )
    }
}
```

## Platform notes

- **Pointer Propagation Phases:** Raw pointer loops process input in three phases: `Initial` (captures event before children), `Main` (normal execution), and `Final` (handles post-consumption status).
- **Nested Scrolling:** Ensure your custom gesture modifiers play nice with system scroll parents by linking them to `NestedScrollConnection` if they control vertical axes.

## Pitfalls

- **Ignoring pointer consumption:** Forgetting to invoke `change.consume()` in custom detectors will cause parent containers (like scroll grids) to react to touch inputs at the same time, producing jittery movements.
- **Direct UI mutations without graphic layers:** Modifying offsets via component layout padding instead of using `graphicsLayer` invalidates composition trees, causing heavy frame drops. Always animate translation offsets via `graphicsLayer`.

## References

- **Documentation:** [Gestures in Compose](https://developer.android.com/develop/ui/compose/touch-input/gestures)
- **API Reference:** [PointerInputScope](https://developer.android.com/reference/kotlin/androidx/compose/ui/input/pointer/PointerInputScope)

## See also

See the `keyboard-mouse-stylus` skill to integrate physical keyboard/mouse controls. See `compose-fundamentals` for general recomposition mechanics.
