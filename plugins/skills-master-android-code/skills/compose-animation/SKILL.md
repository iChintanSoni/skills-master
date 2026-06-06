---
name: compose-animation
description: Covers Jetpack Compose animation APIs — animate*AsState, Animatable, updateTransition, AnimatedVisibility, AnimatedContent, Crossfade, rememberInfiniteTransition, Modifier.animateContentSize, animation specs (spring/tween/keyframes/M3 Expressive physics), and shared element transitions via SharedTransitionLayout. Use when adding motion to a Compose UI, transitioning between states or screens, animating visibility or layout changes, or implementing shared element transitions.
---

## When to use

Apply this skill whenever you need motion in a Jetpack Compose UI — fading or sliding content in and out, animating a single value in response to a state change, orchestrating multi-property transitions, running continuous looping animations, crossfading between two composables, growing/shrinking a composable's size smoothly, or implementing shared element transitions across navigation destinations. Use it to pick the right API for the motion's complexity and to tune specs so the result matches Material 3 motion guidelines.

## Core guidance

### Prefer the high-level APIs first

Start with the simplest API that meets the need; drop to lower-level APIs only when the higher ones are insufficient.

| Need | API |
|---|---|
| Single value follows a state | `animate*AsState` |
| Show/hide a composable | `AnimatedVisibility` |
| Swap between two composables | `AnimatedContent` or `Crossfade` |
| Grow/shrink layout size | `Modifier.animateContentSize()` |
| Multi-property, same target state | `updateTransition` |
| Continuous/looping animation | `rememberInfiniteTransition` |
| Imperative control (games, gestures) | `Animatable` |
| Shared element across Nav destinations | `SharedTransitionLayout` + `sharedElement` |

### animate*AsState

- Returns a `State<T>` that smoothly tracks a target value — use `animateFloatAsState`, `animateDpAsState`, `animateColorAsState`, `animateOffsetAsState`, etc.
- Pass `animationSpec` to control the curve; omit it to get the default spring.
- The returned value is read-only; Compose recomposes whenever it ticks.

### AnimatedVisibility

- Wraps content that should appear or disappear. Default is fade + slide; customize via `enter` and `exit` parameters using combinators like `fadeIn() + slideInVertically()`.
- Internally remembers the composable in the tree even during the exit animation — the content is never immediately removed.
- For child-specific animations, use `animateEnterExit` inside the content lambda.

### AnimatedContent

- Transitions between two content slots when `targetState` changes. Supply `transitionSpec` to define a `ContentTransform` (`slideIntoContainer + fadeOut`, etc.).
- Use `SizeTransform` inside the spec to also animate the container's bounds during the swap.
- For a simple fade-only swap, `Crossfade` is lighter.

### updateTransition

- Manages multiple animated properties driven by a single `targetState` enum or sealed type.
- Declare each child animation with `transition.animateFloat`, `transition.animateColor`, etc., inside a composable.
- Keeps all properties in sync — they begin and end together — which manual `animate*AsState` calls cannot guarantee.

### rememberInfiniteTransition

- Produces animations that run forever — pulses, spinning indicators, shimmer effects.
- Declare child animations with `infiniteTransition.animateFloat` / `animateColor` / `animateValue` and provide `initialValue`, `targetValue`, and `animationSpec = infiniteRepeatable(...)`.

### Animatable

- An imperative, coroutine-based handle: call `animatable.animateTo(target)` inside a `LaunchedEffect` or gesture handler.
- Supports `snapTo` for instant jumps and `stop` / `animateDecay` for fling physics.
- Use when gesture velocity must feed directly into the spring, or when animation needs to be cancelled/retargeted mid-flight.

### Modifier.animateContentSize

- Attach to any composable to smoothly transition its measured size when content changes, with no structural change needed.
- Accept an optional `animationSpec` and `finishedListener` lambda.

### Animation specs

- **spring** — physics-based, defined by `dampingRatio` and `stiffness`. Presets: `Spring.DampingRatioMediumBouncy`, `Spring.StiffnessMedium`, etc. The default spec for most Compose APIs.
- **tween** — time-based with an `Easing` curve (`FastOutSlowInEasing`, `LinearEasing`, etc.) and a fixed `durationMillis`.
- **keyframes** — explicit values at explicit timestamps; useful for multi-step choreography.
- **M3 Expressive springs** — Material 3 ships named spring presets aligned to its motion tokens (`MotionScheme.expressive()` / `MotionScheme.standard()`). Prefer these over hand-tuned spring constants for UI that should match the system's motion language. Access them via `MaterialTheme.motionScheme.defaultSpatialSpec()` (spatial movement) or `defaultEffectsSpec()` (fades, color, scale).

### Shared element transitions

- Wrap both origin and destination screens inside a `SharedTransitionLayout`.
- Tag content with `Modifier.sharedElement(sharedTransitionScope.rememberSharedContentState(key), animatedVisibilityScope)` using a matching `key`.
- For content that should be invisible during the transition (to avoid overlay duplication) use `Modifier.sharedBounds` for containers and `Modifier.sharedElement` for leaves.
- Typically combined with `AnimatedContent` or `AnimatedVisibility`; works with Navigation Compose's `NavHost` via `rememberAnimatedNavController()`.

```kotlin
@Composable
fun ExpandableCard(expanded: Boolean, onToggle: () -> Unit) {
    val transition = updateTransition(targetState = expanded, label = "card")
    val elevation by transition.animateDp(label = "elevation") { state ->
        if (state) 8.dp else 2.dp
    }
    val backgroundColor by transition.animateColor(label = "bg") { state ->
        if (state) MaterialTheme.colorScheme.primaryContainer
        else MaterialTheme.colorScheme.surface
    }

    Card(
        onClick = onToggle,
        elevation = CardDefaults.cardElevation(defaultElevation = elevation),
        colors = CardDefaults.cardColors(containerColor = backgroundColor),
        modifier = Modifier
            .fillMaxWidth()
            .animateContentSize(
                animationSpec = MaterialTheme.motionScheme.defaultSpatialSpec()
            )
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text("Title", style = MaterialTheme.typography.titleMedium)
            AnimatedVisibility(
                visible = expanded,
                enter = fadeIn() + expandVertically(),
                exit = fadeOut() + shrinkVertically(),
            ) {
                Text(
                    "Expanded detail content goes here.",
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.padding(top = 8.dp),
                )
            }
        }
    }
}
```

## Platform notes

- On large screens (tablets, foldables), users perceive longer transitions more acutely because more surface area changes at once — use shorter `durationMillis` or higher spring stiffness for pane-level transitions.
- Shared element transitions across navigation destinations on large screens often span split panes; ensure the `SharedTransitionLayout` wraps the entire scaffold, not just one pane, or the transition will clip at pane boundaries.
- On devices running Android 12+ (API 31+), the system's predictive back gesture can be integrated with `AnimatedContent` or custom `BackHandler` to preview the destination before the user commits.
- Avoid running `rememberInfiniteTransition` animations in content that may be off-screen but still composed (e.g., pager pages). Pair with `produceState` or lifecycle checks to pause when not visible.

## Pitfalls

- Using `AnimatedContent` when `Crossfade` is enough — `Crossfade` is simpler and sufficient for pure fade swaps; save `AnimatedContent` for directional slides or size-aware transitions.
- Launching `Animatable.animateTo` directly in a composable body instead of inside `LaunchedEffect` — it will re-launch on every recomposition, causing stuttering or infinite loops.
- Forgetting `label` parameters on `updateTransition` child animations — the labels are displayed in the Animation Inspector in Android Studio and are essential for debugging choreography.
- Passing a new `animationSpec` lambda instance on every recomposition — capture it with `remember` or use a top-level val to avoid defeating spec equality checks.
- Animating layout-affecting properties (size, padding) via `animate*AsState` + direct modifier assignment instead of `animateContentSize` or `AnimatedContent with SizeTransform` — direct assignment snaps instantly; the dedicated APIs interpolate bounds correctly.
- Hard-coding spring constants instead of using Material 3 motion tokens — the tokens keep motion consistent with system components and adapt to future theme updates.
- Using `Modifier.sharedElement` without a `SharedTransitionLayout` ancestor — this compiles but produces no transition, failing silently.
- Overusing bounce springs (`DampingRatioHighBouncy`) on functional UI elements; reserve bouncy springs for playful, expressive moments (image reveals, hero elements) and use critically-damped springs for navigation and layout shifts.

## References

- **Documentation:** [Animation in Compose — Introduction](https://developer.android.com/develop/ui/compose/animation/introduction)
- **Documentation:** [Compose animation quick guide](https://developer.android.com/develop/ui/compose/animation/quick-guide)
- **Documentation:** [Shared element transitions in Compose](https://developer.android.com/develop/ui/compose/animation/shared-elements)

## See also

For understanding when animated values cause recomposition versus skipping layout, see `compose-fundamentals`. For state that drives animation targets, see `compose-state` (sibling skill). For gesture-integrated fling and drag physics using `Animatable`, see `compose-gestures`. For using `LaunchedEffect` to safely launch animation coroutines, see `compose-side-effects`.
