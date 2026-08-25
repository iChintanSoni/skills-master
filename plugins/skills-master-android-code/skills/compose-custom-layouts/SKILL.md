---
name: compose-custom-layouts
description: Covers designing custom layouts, subcomposition, and intrinsic measurements in Jetpack Compose. Use when building non-standard layout containers, custom flow layouts, or dynamic sizing components.
---

## When to use

Apply this skill when standard Compose containers (`Row`, `Column`, `Box`, `Lazy*`) are insufficient. Use this to construct bespoke layouts (like custom cascading lists, radial menus, or auto-wrapping grids), compute child coordinates programmatically, execute deferred measurement loops via `SubcomposeLayout`, or query intrinsic sizes.

## Core guidance

### Layout Interface Implementation

- Build a custom layout by calling the `Layout` composable function.
- Provide a `MeasurePolicy` containing a single `measure(measurables, constraints)` logic.
- Measure each child exactly once. **Single Measurement Constraint:** Re-measuring children in a single layout pass will throw an error to enforce performance.
- Position elements within `layout(width, height) { ... }` block by calling `placeable.place(x, y)` or `placeRelative(x, y)` (preferred for RTL compatibility).

### Subcomposition (SubcomposeLayout)

- Use `SubcomposeLayout` when child layouts are conditionally composed depending on parent sizing measurements (e.g. infinite lists, tabs fitting to width).
- Avoid overuse of `SubcomposeLayout` as it delays composition passes and impacts frame rendering performance.

### Intrinsic Measurements

- Implement custom intrinsic overrides (`minIntrinsicWidth`, `maxIntrinsicHeight`, etc.) if parent layout components need to query children size parameters prior to their formal measurement pass.

```kotlin
// Custom Layout that places children horizontally with uniform spacing
@Composable
fun UniformHorizontalLayout(
    spacing: Dp,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    Layout(
        content = content,
        modifier = modifier
    ) { measurables, constraints ->
        // Measure children
        val spacingPx = spacing.roundToPx()
        val placeables = measurables.map { it.measure(constraints) }

        // Determine container dimensions
        val totalSpacing = if (placeables.isNotEmpty()) (placeables.size - 1) * spacingPx else 0
        val width = placeables.sumOf { it.width } + totalSpacing
        val height = placeables.maxOfOrNull { it.height } ?: 0

        // Position children
        layout(width, height) {
            var xPosition = 0
            placeables.forEach { placeable ->
                placeable.placeRelative(x = xPosition, y = 0)
                xPosition += placeable.width + spacingPx
            }
        }
    }
}
```

### Compose 1.12 (BOM 2026.08.00)

- An experimental non-lazy Grid layout gains named areas: declare semantic regions with `area(id, row, column, rowSpan, columnSpan)` inside `GridConfigurationScope` and place children with `Modifier.gridItem(areaId = ...)` — CSS-grid-style template layouts without a hand-rolled `Layout`. Experimental: expect API movement before pinning a design system to it.

## Platform notes

- **Lookahead Scope:** Modern Jetpack Compose supports dynamic animations during layout size changes via `LookaheadScope`. Utilize `Modifier.approachLayout` to define custom transition behaviors when parent dimensions change.

## Pitfalls

- **Re-measuring Children:** Attempting to query child measurements twice in a single pass throws a runtime `IllegalStateException`. Cache size computations instead.
- **Neglecting placeRelative:** Using `place` instead of `placeRelative` ignores layout direction, which breaks Right-to-Left (RTL) localization mirrors.
- **Heavy Allocations:** Allocating temporary lists or parsing layout parameters inside the `measure` block triggers garbage collection spikes. Reuse arrays and helper objects.

## References

- **Documentation:** [Custom layouts in Compose](https://developer.android.com/develop/ui/compose/layouts/custom)
- **Documentation:** [Intrinsic measurements guide](https://developer.android.com/develop/ui/compose/layouts/intrinsic-measurements)

## See also

See `compose-layout` for standard Compose containers usage. See `compose-performance` for layout optimization checklists.
