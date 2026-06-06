---
name: compose-layout
description: Covers Jetpack Compose layout primitives — Row, Column, Box, weight/fill modifiers, BoxWithConstraints, intrinsic measurements, the single-pass constraints model, custom Layout composables, and SubcomposeLayout for measure-dependent content. Use when arranging composables on screen, building adaptive UIs, implementing a custom layout algorithm, or needing slot-driven measurement.
globs:
  - "**/*.kt"
tags: [compose, layout, jetpack-compose, ui, custom-layout]
x-skills-master:
  domain: android
  class: code
  category: compose-ui
  platforms: ["android", "large-screen"]
  requires: { "android": "16", "kotlin": "2.2", "compose-bom": "2026.05.00" }
  pairs_with: []
  sources:
    - https://developer.android.com/develop/ui/compose/layouts/basics
    - https://developer.android.com/develop/ui/compose/layouts/custom
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Apply this skill whenever you are placing composables relative to each other — stacking items vertically or horizontally, layering content, or building a fully custom layout that none of the standard slots handle. It is also the reference when you need to respond to the parent's available space at measure time (`BoxWithConstraints`), enforce equal height or width across siblings via intrinsics, write a `Layout` composable that positions children without a second measurement pass, or build slot-driven layouts with `SubcomposeLayout`.

## Core guidance

### Standard containers

- **Row** arranges children along the horizontal axis. Use `horizontalArrangement` for spacing between children (`Arrangement.SpaceBetween`, `spacedBy(8.dp)`, etc.) and `verticalAlignment` for cross-axis positioning (`Alignment.CenterVertically`).
- **Column** is the vertical equivalent. Use `verticalArrangement` and `horizontalAlignment` the same way.
- **Box** layers children on top of each other. The last child draws on top. Align individual children with `Modifier.align(Alignment.BottomEnd)` inside the `BoxScope`.
- None of these scroll by default — wrap with `verticalScroll` / `horizontalScroll` or replace with `LazyColumn` / `LazyRow` for long lists.

### Spacing: Spacer vs padding

- Prefer `Modifier.padding()` to add space *around* a composable. It shrinks the composable's draw area.
- Use `Spacer(Modifier.height(8.dp))` or `Spacer(Modifier.width(8.dp))` to insert *rigid gap* between siblings inside Row/Column — it occupies space without drawing anything.
- `Arrangement.spacedBy(dp)` distributes equal gaps between children automatically and is cleaner than inserting multiple `Spacer`s by hand.

### Weight and fill

- `Modifier.weight(1f)` inside a Row/Column makes the child take the remaining space after fixed-size siblings are measured. Multiple weighted children share leftover space proportionally.
- `Modifier.fillMaxWidth()` / `fillMaxHeight()` / `fillMaxSize()` expand a composable to the incoming maximum constraint. Use `fillMaxWidth(fraction)` to cap at a percentage.
- Do not apply `weight` outside a `RowScope` or `ColumnScope`; the compiler reports an error.

### Constraints model

Compose measures in a single pass. A parent hands each child a `Constraints` object with `minWidth`, `maxWidth`, `minHeight`, `maxHeight`. The child picks a size within those bounds and reports back — no remeasurement. Breaking this contract (e.g. forcing a child bigger than `maxWidth`) results in a runtime crash in debug builds.

### BoxWithConstraints

Use `BoxWithConstraints` when a composable must branch its structure — not just its style — based on available space. It defers composition of its content until the constraints are known, then exposes `maxWidth` and `maxHeight` as `Dp` values in the `BoxWithConstraintsScope`.

```kotlin
@Composable
fun AdaptiveCard(modifier: Modifier = Modifier) {
    BoxWithConstraints(modifier = modifier.fillMaxWidth()) {
        if (maxWidth >= 600.dp) {
            // Landscape / large-screen: two-column arrangement
            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                ArticleImage(Modifier.weight(1f))
                ArticleBody(Modifier.weight(2f))
            }
        } else {
            // Compact: single-column stack
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                ArticleImage(Modifier.fillMaxWidth())
                ArticleBody(Modifier.fillMaxWidth())
            }
        }
    }
}
```

Avoid `BoxWithConstraints` for purely stylistic changes (font size, padding) — those belong in `WindowSizeClass` logic above the composable or in a regular `Box` with `Modifier.onSizeChanged`.

### Intrinsic measurements

Intrinsics let a parent ask a child "how tall/wide would you be at a hypothetical size?" before actual measurement. Use them when siblings need to be the same size but that size is driven by content.

- `Modifier.height(IntrinsicSize.Min)` / `IntrinsicSize.Max` on a Row forces all children to the min/max intrinsic height of the tallest child.
- Intrinsics are expensive: each intrinsic query causes a full measure traversal of the subtree. Avoid them inside `LazyColumn` items or hot recomposition paths.
- Prefer `Modifier.fillMaxHeight()` inside a `Row` (with a known height) before reaching for intrinsics.

### Custom Layout composable

`Layout` lets you position children with full control in a single measurement pass. Implement `MeasurePolicy`:

1. Measure each `Measurable` by calling `it.measure(constraints)` to get a `Placeable`.
2. Choose a layout size by calling `layout(width, height)`.
3. Inside the `layout` block, place each `Placeable` with `placeable.placeRelative(x, y)` (RTL-aware) or `place(x, y)`.

Never measure a child more than once — Compose enforces the single-pass contract and will throw if violated.

### SubcomposeLayout

`SubcomposeLayout` allows composing content *during* measurement, so the structure of children can depend on measured sizes of other children. The canonical example is `Scaffold` measuring the top bar and bottom bar first, then measuring the content slot with the remaining height.

- Call `subcompose(slotId, content)` inside the measure lambda to compose and measure a slot on-demand.
- Use distinct, stable `slotId` values (an enum or sealed object) to let Compose reuse compositions across recompositions.
- `SubcomposeLayout` is substantially more expensive than `Layout` because it runs composition inside measure. Use it only when the content's structure genuinely depends on measured sizes, not just appearance.

## Platform notes

- On **large screens** (600 dp+), use `BoxWithConstraints` or `WindowSizeClass` from the `adaptive` library to switch between compact and expanded layouts rather than hard-coding `dp` breakpoints throughout your code.
- `WindowSizeClass.computeFromActivity()` (or the Compose-native `currentWindowAdaptiveInfo()`) should be your primary breakpoint source above the composable tree; `BoxWithConstraints` is for local, leaf-level adaptations.
- Avoid deeply nested Rows/Columns on large screens — a `FlowRow` / `FlowColumn` from `accompanist` or the Compose foundation library handles wrapping layouts that need to redistribute children when width changes.
- On **foldables**, use `WindowLayoutInfo` to detect the hinge position and split content accordingly in a custom `Layout`.

## Pitfalls

- Wrapping a `Column` in a `verticalScroll` and then placing a `LazyColumn` inside it — `LazyColumn` needs an unbounded height, but `verticalScroll` provides exactly that, causing a crash or zero-height layout. Use a single `LazyColumn` with `item` / `items` sections instead.
- Placing `Modifier.fillMaxSize()` on a child inside a `ScrollableColumn`/`Row` — it will try to fill infinite space. Use a concrete `height()` or let content size itself.
- Forgetting that `padding` *shrinks* the available space for the composable's children. A composable that is `fillMaxSize()` inside a padded parent will not bleed outside the padding; that is the correct and intentional behavior.
- Measuring children multiple times inside a custom `Layout` — use intrinsic queries or `SubcomposeLayout` instead.
- Branching on pixel values from `LocalDensity` instead of `Dp` — always convert with `with(LocalDensity.current) { px.toDp() }` before comparing to breakpoints.
- Calling `BoxWithConstraints` for every minor style variation; it defers composition and has overhead. Reserve it for structural branching.
- Using `Modifier.size()` with a hard-coded value on a component that should adapt — prefer `fillMaxWidth(fraction)` or `weight()` so the layout responds to its container.

## References

- **Documentation:** [Compose layout basics](https://developer.android.com/develop/ui/compose/layouts/basics)
- **Documentation:** [Custom layouts in Compose](https://developer.android.com/develop/ui/compose/layouts/custom)
- **Documentation:** [Adaptive layouts](https://developer.android.com/develop/ui/compose/layouts/adaptive)

## See also

For the composable lifecycle and recomposition mental model that underpins every layout decision, see `compose-fundamentals`. For managing the state that drives layout changes, see `compose-state`. For lazy, scrolling lists built on the same constraints model, see `compose-lazy-lists`. For modifier chains, drawing, and the three frame phases, see `compose-modifiers`. For animating layout transitions, see `compose-animations`.
