---
name: compose-graphics
description: Custom drawing in Jetpack Compose using Canvas, DrawScope, Brush, Path, Modifier.graphicsLayer, and BlendMode. Use when building custom chart renderers, decorative shapes, image effects, or any UI that cannot be assembled from standard composables alone.
globs:
  - "**/*.kt"
tags: [compose, canvas, graphics, drawing, android]
x-skills-master:
  domain: android
  class: code
  category: compose-ui
  platforms: ["android", "large-screen"]
  requires: { "android": "16", "kotlin": "2.2", "compose-bom": "2026.05.00" }
  pairs_with: []
  sources:
    - https://developer.android.com/develop/ui/compose/graphics/draw/overview
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for custom drawing APIs when standard Compose components cannot produce the visual result — for example a waveform visualizer, sparkline chart, custom progress ring, image blend effect, or a composable that needs per-pixel control. Prefer existing Material 3 components when the shape or visual is already covered; custom drawing has a higher correctness and performance cost.

## Core guidance

### Canvas composable vs Modifier draw extensions

| Situation | Preferred API |
|---|---|
| Drawing IS the content (fills its own space) | `Canvas(modifier)` composable |
| Drawing decorates existing content | `Modifier.drawBehind` or `Modifier.drawWithContent` |
| Drawing that reads/caches expensive objects across recompositions | `Modifier.drawWithCache` |

- **Canvas composable** provides a `DrawScope` lambda and participates in layout; size comes from the modifier.
- **drawBehind** renders beneath the composable's content; does not affect layout size.
- **drawWithContent** lets you interleave custom drawing with `drawContent()`; call `drawContent()` at the right z-order position.
- **drawWithCache** runs an init block only when size changes; use it to create `Path`, `Brush`, or `ImageBitmap` objects once.

### DrawScope primitives

All coordinates are in **pixels** relative to the top-left of the draw area. Key functions: `drawCircle`, `drawRect`, `drawRoundRect`, `drawOval`, `drawArc`, `drawLine`, `drawLines`, `drawPoints`, `drawImage`, `drawPath`, `drawText` (using `TextMeasurer`).

```kotlin
@Composable
fun ActivityRing(progress: Float, modifier: Modifier = Modifier) {
    val strokeWidth = 20.dp
    Canvas(modifier = modifier.size(120.dp)) {
        val stroke = Stroke(
            width = strokeWidth.toPx(),
            cap = StrokeCap.Round
        )
        // Track background
        drawArc(
            color = Color.LightGray,
            startAngle = -90f,
            sweepAngle = 360f,
            useCenter = false,
            style = stroke
        )
        // Filled arc with a sweep brush
        drawArc(
            brush = Brush.sweepGradient(
                colors = listOf(Color(0xFFE91E63), Color(0xFFFF5722))
            ),
            startAngle = -90f,
            sweepAngle = 360f * progress.coerceIn(0f, 1f),
            useCenter = false,
            style = stroke
        )
    }
}
```

### Path

Build complex shapes with `Path()`: `moveTo`, `lineTo`, `cubicTo`, `quadraticBezierTo`, `arcTo`, `close`. Pass a `Path` to `drawPath(path, brush/color, style)`. For fills use `style = Fill`; for outlines use `style = Stroke(width)`.

Use `drawWithCache` to create the `Path` object once per size change rather than on every draw frame.

### Brush gradients

- `Brush.linearGradient(colors, start, end)` — directional gradient.
- `Brush.radialGradient(colors, center, radius)` — radial bloom.
- `Brush.sweepGradient(colors, center)` — conic/sweep gradient.
- All drawing functions accept a `brush` parameter in place of `color`.
- For a shimmer effect, animate `translationX` and use a wide linear gradient clipped to the composable.

### Modifier.graphicsLayer

`graphicsLayer` promotes the composable to an off-screen layer and applies GPU-accelerated transforms. All properties are animatable via `Animatable` or `animateFloatAsState`.

| Property | Effect |
|---|---|
| `alpha` | Opacity; layer-based so blending is correct |
| `scaleX / scaleY` | Scale around `transformOrigin` |
| `rotationX / Y / Z` | 3-D and 2-D rotation |
| `translationX / Y` | Pixel translation (no layout impact) |
| `shadowElevation` | Drop shadow |
| `clip` | Clips to `shape` |
| `renderEffect` | Applies a `RenderEffect` (blur, chain) — API 31+ |

Use `graphicsLayer` instead of individual `alpha`, `scale`, `rotate` modifiers when you need to combine multiple transforms in one layer pass or when blending/compositing must be applied to the entire subtree.

### RenderEffect and blur (API 31+)

```kotlin
val blurEffect = BlurMaskFilter(radius = 10f, BlurMaskFilter.Blur.NORMAL) // Paint-level
// Or, on API 31+:
Modifier.graphicsLayer {
    renderEffect = BlurEffect(radiusX = 16f, radiusY = 16f)
}
```

Guard behind `Build.VERSION.SDK_INT >= Build.VERSION_CODES.S` or use `isSupported` where available. Avoid applying blur inside tight animation loops without profiling — it can be expensive on mid-range devices.

### BlendMode

Pass `blendMode = BlendMode.Multiply` (or any `BlendMode`) to drawing functions to control how pixels composite with the layer beneath. Common uses:

- `BlendMode.SrcIn` — mask color into the shape of an existing layer (cookie-cutter effect).
- `BlendMode.Multiply` — darken/tint an image.
- `BlendMode.Screen` — lighten/lighten overlay.

Non-`SrcOver` blend modes require a compositing layer (wrap in `graphicsLayer { }` or use `Canvas` composable, which creates one automatically).

### Canvas composable vs Painter

Use a `Painter` subclass when the drawable needs to be reused across multiple composables or passed to `Image(painter = ...)`. Use the `Canvas` composable when the drawing is self-contained and tied to a specific composable's layout. You cannot embed `Canvas` inside a `Painter`, but a `Painter` can call all the same `DrawScope` primitives.

## Platform notes

- **Large screen / foldable** — `DrawScope.size` reflects actual physical pixel dimensions after density; always derive coordinates from `size.width` / `size.height` rather than hardcoding to avoid incorrect rendering on tablets or in multi-window.
- **Right-to-left layouts** — `DrawScope` does not automatically mirror; check `layoutDirection` (`LocalLayoutDirection.current`) and flip `x` coordinates manually when needed.
- **API 31+ render effects** — `BlurEffect`, `OffsetEffect`, `RenderEffect.createChainEffect` are unavailable below API 31; guard or provide a software fallback.
- **Hardware acceleration** — `BlendMode` values beyond `SrcOver` require a hardware-accelerated canvas; all Compose canvases are hardware-accelerated unless explicitly rendered to a software `ImageBitmap`.

## Pitfalls

- **Allocating in draw lambdas** — Creating `Path`, `Paint`, or `Brush` objects inside `drawBehind`/`Canvas` runs on every frame. Use `drawWithCache` or remember the objects outside the draw lambda.
- **Forgetting `drawContent()`** — When using `drawWithContent`, omitting `drawContent()` makes the composable's children invisible.
- **Off-screen compositing cost** — Every `graphicsLayer` allocates an off-screen buffer. Do not add `graphicsLayer` purely for `alpha = 1f` with no transform; it wastes GPU memory.
- **BlendMode without a layer** — Blend modes other than `SrcOver` applied via `Modifier.graphicsLayer` or `drawBehind` interact with the composable's own layer, not the full screen. Wrap the target in an explicit `graphicsLayer { }` to isolate the compositing surface.
- **Coordinate system confusion** — `DrawScope` origin is always the top-left of the draw area, not the screen. `center` is a convenience property equal to `Offset(size.width / 2, size.height / 2)`.
- **Misusing `Canvas` for simple shapes** — If a standard `Box`, `Surface`, or `Icon` plus a `clip` modifier achieves the result, prefer that; custom drawing bypasses accessibility semantics and recomposition optimizations.
- **Text in Canvas** — Use `rememberTextMeasurer()` and `drawText(textMeasurer, ...)` for text inside `DrawScope`; do not try to place `Text` composables inside a `Canvas` lambda.

## References

- **Documentation:** [Draw in Compose — Overview](https://developer.android.com/develop/ui/compose/graphics/draw/overview)
- **API Reference:** [DrawScope](https://developer.android.com/reference/kotlin/androidx/compose/ui/graphics/drawscope/DrawScope)
- **API Reference:** [Modifier.graphicsLayer](https://developer.android.com/reference/kotlin/androidx/compose/ui/graphics/package-summary#(androidx.compose.ui.Modifier).graphicsLayer(kotlin.Function1))
- **API Reference:** [Brush](https://developer.android.com/reference/kotlin/androidx/compose/ui/graphics/Brush)

## See also

- See `compose-animations-transitions` for animating `graphicsLayer` properties with `Animatable` and `AnimatedContent`.
- See `compose-custom-layout` when you need to control layout measurement in addition to drawing.
- See `compose-state-data-flow` for deriving draw inputs from observable state correctly to avoid unnecessary redraws.
