---
name: compose-modifiers
description: Covers Modifier chains in Jetpack Compose — order semantics, scoped modifiers, common modifiers, reusable extraction, and custom Modifier.Node. Use when building or reviewing Composable layout/decoration/interaction code that relies on padding, size, background, clip, clickable, or scope-specific modifiers like weight and align.
---

## When to use

Apply this skill whenever you write, review, or debug layout code in Jetpack Compose that uses any `Modifier` — from a simple `padding` call to a multi-step chain involving clipping, sizing, and interaction. Also apply it when extracting reusable modifier recipes, when resolving unexpected visual results caused by wrong chain order, or when building a custom `Modifier.Node` for performance-sensitive decoration or measurement logic.

## Core guidance

### What a Modifier chain is

A `Modifier` is an immutable, ordered list of `Modifier.Element` values built with the dot-extension pattern. Each call appends a new element to the right of the chain. Compose applies elements **left to right**, meaning each element wraps the content that follows it — exactly like nested layout wrappers, but expressed linearly.

```
Modifier.padding(16.dp).background(Color.Red).size(64.dp)
// ↑ Padding is the outermost wrapper; size is the innermost.
```

### Order matters — critical rules

- **padding before background** — the padding is transparent (shows the parent's background).
- **background before padding** — the background fills the padded area plus the padding itself.
- **clickable before padding** — touch target equals the raw content size.
- **padding before clickable** — touch target includes the padding, which is almost always correct for accessibility.
- **clip before shadow** — `shadow` draws outside bounds; `clip` must come *after* `shadow` if you want both, or *before* if you only want clipping.

### Scoped modifiers

Certain modifiers are only available inside a specific layout scope and carry layout-level meaning:

| Scope | Modifier | Effect |
|---|---|---|
| `RowScope` | `Modifier.weight(1f)` | Distributes remaining width proportionally |
| `ColumnScope` | `Modifier.weight(1f)` | Distributes remaining height proportionally |
| `BoxScope` | `Modifier.align(Alignment.Center)` | Positions child within the Box |

The Kotlin type system enforces these at compile time — you cannot use `weight` outside a `Row` or `Column`.

### Common modifiers quick reference

- `padding(all)` / `padding(horizontal, vertical)` / `padding(start, top, end, bottom)` — add spacing.
- `size(dp)` / `width` / `height` / `fillMaxWidth()` / `fillMaxHeight()` / `fillMaxSize()` — control dimensions.
- `wrapContentWidth()` / `wrapContentHeight()` — shrink to content, optionally with alignment bias.
- `background(color)` / `background(brush)` — fill with color or gradient.
- `clip(shape)` — clip drawing to a shape (use *after* `shadow` if shadow is present).
- `border(width, color, shape)` — draw a border without clipping content.
- `clickable { }` / `combinedClickable { }` — add semantics + ripple + gesture.
- `semantics { }` — attach accessibility metadata independently of interaction.
- `offset(x, y)` — shift the composable visually without affecting layout.
- `zIndex(z)` — control drawing order among siblings.
- `alpha(fraction)` — set overall opacity.

### Extracting reusable modifiers

Extract shared modifier chains into extension functions on `Modifier` so call sites stay readable and chains remain composable:

```kotlin
// Reusable card-surface modifier
fun Modifier.cardSurface(
    shape: Shape = MaterialTheme.shapes.medium,
    elevation: Dp = 2.dp,
): Modifier = this
    .shadow(elevation = elevation, shape = shape)
    .clip(shape)
    .background(MaterialTheme.colorScheme.surface)

// Consistent accessible tap target
fun Modifier.accessibleTap(onClick: () -> Unit): Modifier = this
    .padding(4.dp)                   // expand touch target
    .clickable(onClick = onClick)
    .padding(horizontal = 12.dp, vertical = 8.dp)  // inner visual spacing

// Usage
Box(
    modifier = Modifier
        .cardSurface()
        .padding(16.dp)
) {
    Text("Hello", modifier = Modifier.align(Alignment.Center))
}
```

Key rules for reusable modifiers:
- Always start the chain with `this` so callers can prepend their own modifiers.
- Keep each extension focused on one visual concern.
- Do not call `@Composable` functions inside a modifier extension — use `composed { }` (deprecated in favor of `Modifier.Node`) or a proper `Modifier.Node` instead.

### Custom Modifier.Node (advanced)

For performance-sensitive or stateful decoration, implement `Modifier.Node` rather than `composed { }`. The Node approach avoids recomposition overhead because it operates in the layout/draw phase:

- Implement `DrawModifierNode` to do custom `Canvas` drawing.
- Implement `LayoutModifierNode` to participate in measurement.
- Implement `SemanticsModifierNode` to attach accessibility info.
- Use `ModifierNodeElement` as the factory that Compose diffs across recompositions.

Prefer the built-in modifiers first; reach for `Modifier.Node` only when profiling confirms a measurable gain or when no built-in modifier covers the requirement.

### Do / Don't

- **Do** put `clickable` after any padding that should be part of the touch target.
- **Do** use `fillMaxWidth()` inside a `Column` rather than setting an explicit width that breaks on large screens.
- **Do** extract multi-step chains used in more than two places.
- **Don't** use `composed { }` for new code — it causes unnecessary recomposition; use `Modifier.Node`.
- **Don't** apply `clip` before `shadow` if you need a visible shadow (shadow is painted outside the clip region).
- **Don't** rely on default parameter ordering to infer which overload of `padding` is called — be explicit with named arguments.

## Platform notes

**Large screens and foldables** — Avoid hardcoded `dp` sizes in modifiers when targeting tablets and foldables. Prefer `fillMaxWidth(fraction)` or adaptive layout logic driven by `WindowSizeClass`. Use `Modifier.weight` inside `Row`/`Column` to let content scale naturally across breakpoints.

**Minimum touch target** — Material 3 specifies a 48×48 dp minimum touch target. Use `Modifier.minimumInteractiveComponentSize()` (available from Compose Foundation 1.5+) to enforce this automatically instead of hardcoding padding values.

**RTL layouts** — Use `start`/`end` instead of `left`/`right` in `padding` and `offset` calls so the UI mirrors correctly in right-to-left locales.

**Large-screen sidebar patterns** — When building adaptive two-pane layouts, scoped modifiers (`weight`, `fillMaxHeight`) are preferable to fixed widths so both panes scale correctly across form factors.

## Pitfalls

- **Wrong clip/shadow order** — placing `clip` before `shadow` hides the shadow entirely because the shadow is drawn outside the clip boundary.
- **Padding doubling** — applying padding in both the parent composable and the child modifier leads to unintended spacing; keep padding ownership at one level.
- **Using `composed { }` in new code** — this API triggers full recomposition on every frame; migrate to `Modifier.Node`.
- **Forgetting `this` in extension functions** — omitting `this` makes the extension ignore any modifiers the caller already attached.
- **Hardcoded touch targets** — manually adding 4 dp padding and assuming it is enough may not satisfy the 48 dp minimum; use `minimumInteractiveComponentSize()` instead.
- **Overloaded `padding` confusion** — `padding(8.dp, 16.dp)` maps to `(horizontal, vertical)`, not `(start, top)`; name your arguments to avoid subtle layout bugs.
- **`offset` vs `padding`** — `offset` shifts drawing but does not affect measurement, so siblings do not respond to the shifted position; use `padding` when you need layout impact.

## References

- **Documentation:** [Compose Modifiers](https://developer.android.com/develop/ui/compose/modifiers)
- **Documentation:** [Modifiers List](https://developer.android.com/develop/ui/compose/modifiers-list)
- **Guide:** [Custom Modifier.Node](https://developer.android.com/develop/ui/compose/custom-modifiers)

## See also

For state-driven modifier changes see `compose-state`. For gesture handling beyond `clickable` see `swiftui-gestures` (iOS) or the Compose pointer-input APIs covered in the gestures skill. For accessibility semantics wired through modifiers see `swiftui-accessibility`. For layout primitives that define the scopes in which scoped modifiers work see `compose-layout`.
