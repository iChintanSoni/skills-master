---
name: compose-fundamentals
description: Covers Jetpack Compose fundamentals — composable functions, declarative UI, the recomposition mental model, the composition, layout, and drawing phases, and stateless versus stateful composables. Use when starting a Compose UI, reasoning about why a composable recomposes or skips, breaking a screen into small composables, or setting up previews.
---

## When to use

Reach for this guidance when writing or restructuring any Jetpack Compose UI, and especially when reasoning about *why* something redraws, flickers, or fails to update. It is the mental model that underlies every other Compose skill: what a composable is, when it re-runs, what the framework does in each frame, and where state belongs. Start here before debugging recomposition, extracting subcomposables, or wiring previews.

## Core guidance

- Treat a `@Composable` function as a description of UI for the current state, not a one-time builder. Compose calls it, then *re-calls* it (recomposes) whenever state it read changes. Functions must be idempotent and side-effect free in their body — no network calls, no mutation of external vars, no `Log` in the hot path.
- Name composables that emit UI as nouns in PascalCase (`MessageRow`), return `Unit`, and accept data as parameters. Composables that *return* a value (helpers) follow normal camelCase.
- Drive UI from state with unidirectional data flow: state flows down as parameters, events flow up as lambdas. Prefer **stateless** composables (all input via parameters) and hoist state to the caller; keep **stateful** wrappers thin. This makes composables reusable, testable, and previewable.
- Understand the three frame phases and that each can run independently: **composition** (run composables to build the UI tree), **layout** (measure and place), **drawing** (render). Reading state as late as possible — in layout or draw via lambda-based modifiers like `offset { }` or `drawBehind { }` — lets Compose skip recomposition and re-run only a later phase.
- Recomposition is *smart*: Compose skips composables whose inputs are unchanged, and can restart only the smallest affected scope. This only works when parameter types are **stable** (see `compose-performance`); unstable inputs force the whole scope to recompose.
- Keep composables small and single-purpose. Extracting a subcomposable narrows the recomposition scope and clarifies the state each part needs — it is the primary structural tool, not just stylistic.
- Assume composables run **in any order** and **in parallel**, and may be skipped or re-run frequently; never rely on execution order or one-shot behavior in the function body. For things that must happen on enter/leave or off the composition, use the effect APIs (see `compose-side-effects`).

```kotlin
@Composable
fun Counter(count: Int, onIncrement: () -> Unit, modifier: Modifier = Modifier) {
    // Stateless: renders `count`, raises an event. The caller owns the state.
    Button(onClick = onIncrement, modifier = modifier) {
        Text("Clicked $count times")
    }
}

@Preview(showBackground = true)
@Composable
private fun CounterPreview() {
    var count by remember { mutableIntStateOf(0) }
    MaterialTheme { Counter(count = count, onIncrement = { count++ }) }
}
```

## Platform notes

- The same composable model powers handset, large-screen, Wear OS, TV, and XR — the differences are component libraries and input, not the fundamentals. Use `material3` on most surfaces, `wear.compose.material3` on Wear, and `tv.material3` on TV.
- `@Preview` renders in the IDE without a device and supports parameters like `widthDp`, `uiMode` for dark theme, `fontScale`, and `device=` for form-factor frames — preview adaptive layouts at several sizes rather than one.
- Compose interops both directions with the View system; when embedding into an existing app see `compose-view-interop` rather than rewriting screens wholesale.

## Pitfalls

- Putting logic with side effects (I/O, mutating a shared variable, launching coroutines) directly in a composable body — it re-runs on every recomposition. Move it into `LaunchedEffect`, `remember`, or an event lambda.
- Reading state at the top of a large composable when only a leaf needs it, widening the recomposition scope. Push the read down into the smallest child, or defer it to a lambda-based modifier.
- Assuming a composable runs once or in source order; relying on that produces bugs that appear only under recomposition or when scrolling.
- Creating new lambdas/objects as parameters every recomposition in a way that defeats skipping — combined with unstable types, this silently disables Compose's main optimization (covered in `compose-performance`).
- Confusing recomposition with re-layout or redraw: a state change that only affects position or color need not recompose at all if read in the right phase.

## References

- **Documentation:** [Thinking in Compose](https://developer.android.com/develop/ui/compose/mental-model)
- **Documentation:** [Jetpack Compose phases](https://developer.android.com/develop/ui/compose/phases)
- **Documentation:** [Lifecycle of composables](https://developer.android.com/develop/ui/compose/lifecycle)
- **Documentation:** [Preview your UI with composable previews](https://developer.android.com/develop/ui/compose/tooling/previews)

## See also

For where mutable state lives and how to hoist and remember it, see `compose-state`. For the effect APIs that bridge composables to coroutines and non-Compose code, see `compose-side-effects`. For stability, skipping, and diagnosing over-recomposition, see `compose-performance`. For arranging composables on screen, see `compose-layout`. For embedding Compose in or alongside Views, see `compose-view-interop`.
