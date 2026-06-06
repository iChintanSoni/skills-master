---
name: compose-performance
description: Covers Jetpack Compose performance — stability contracts, @Stable and @Immutable annotations, strong skipping mode, deferring state reads to layout/draw phases, remember for expensive work, stable keys in lazy lists, avoiding backwards writes, and diagnosing over-recomposition with Layout Inspector and compiler metrics. Use when profiling UI jank, cutting unnecessary recompositions, annotating model classes, or setting up baseline profiles.
---

## When to use

Apply this guidance whenever Compose UI drops frames, animates sluggishly, or a profiling session reveals composables recomposing far more often than state changes warrant. It is also the right reference when designing or annotating data model classes that will be passed to composables, enabling or troubleshooting strong skipping mode, writing lazy list code, or setting up a baseline profile to cut startup and scroll jank.

## Core guidance

### The central goal: make skipping work

Compose skips recomposing a composable when all its inputs are equal to the previous call. For skipping to fire, every parameter must be **stable** — its type must guarantee that `equals()` reliably reports whether the value changed. When Compose cannot prove stability, it pessimistically recomposes. The job is to give Compose the guarantees it needs.

**Stability rules**

- Primitive types (`Int`, `String`, `Boolean`, `Float`, etc.) are always stable.
- Kotlin `data class` with only stable fields is inferred as stable by the compiler plugin — you need no annotation.
- A class with a `var` field, or any mutable backing, is **unstable** unless you annotate it.
- A class from an external module the compiler plugin cannot inspect (e.g. a third-party library model) is treated as unstable. Wrap it in a stable holder or annotate the wrapper.
- `List<T>`, `Map<K,V>`, and `Set<T>` from `kotlin.collections` are **unstable** (they have mutable subtypes). Use `kotlinx.collections.immutable` (`ImmutableList<T>`, `PersistentList<T>`) or wrap in a `@Stable` holder.

**Annotation guide**

- `@Immutable` — promise that ALL fields are immutable and will never change after construction. The compiler trusts you; lying causes silent correctness bugs.
- `@Stable` — weaker contract: mutable fields are allowed, but mutations always trigger recomposition (notified via `State`). Use for observable holders. Interfaces can be `@Stable`.
- Prefer letting the compiler infer stability from `data class` with immutable fields; reserve annotations for cases where inference fails.

**Strong skipping mode**

Enable in `composeOptions` (Compose compiler Gradle plugin) with `strongSkipping = true`. Under strong skipping, lambdas are automatically remembered so they never look "new" on each recomposition, and unstable parameter types no longer unconditionally disable skipping — the composable is restartable but still skippable when the runtime detects no change. This is now the recommended default for new projects.

```kotlin
// build.gradle.kts — enable strong skipping
composeCompiler {
    featureFlags = setOf(ComposeFeatureFlag.StrongSkipping)
}
```

**Deferring state reads to layout or draw**

Reading a `State` value inside a lambda modifier (layout phase) or a `Canvas`/`drawBehind` block (draw phase) confines invalidation to that phase only — recomposition is completely skipped.

```kotlin
@Composable
fun BouncingBox(offsetY: State<Float>, modifier: Modifier = Modifier) {
    // BAD — reads state during composition, forces recomposition on every frame
    // Box(modifier = modifier.offset(y = offsetY.value.dp))

    // GOOD — reads state during layout only; composition is never restarted
    Box(
        modifier = modifier.offset {
            IntOffset(x = 0, y = offsetY.value.toInt())
        }
    )
}
```

The same pattern applies to `graphicsLayer { }`, `drawBehind { }`, and `drawWithContent { }`.

**`remember` for expensive work**

- Wrap any non-trivial computation with `remember(key1, key2) { ... }`. Compose re-runs the block only when a key changes, not on every recomposition.
- For work that depends on a derived `State`, prefer `remember { derivedStateOf { ... } }` — it only invalidates observers when the computed result actually changes, decoupling high-frequency state from downstream composables.
- Do not pass a lambda-keyed `remember` when the key itself is a new object every frame; make the key stable (see stability rules above).

**Stable keys in lazy lists**

- Always pass a stable, unique `key` to `items { }` inside `LazyColumn`/`LazyRow`. Without a key, Compose uses position — insertions and deletions recompose and re-animate every visible item.
- The key must be saveable (primitive, `String`, `Parcelable`, or a `data class` of saveables) if `rememberLazyListState` needs to survive process death.

```kotlin
LazyColumn {
    items(messages, key = { it.id }) { message ->
        MessageRow(message)
    }
}
```

**Avoiding backwards writes**

A backwards write — mutating a `State` that was already read in the current composition pass — forces an immediate second composition of the same scope, burning frame budget. It surfaces as a crash in debug builds ("State written but was already read"). Never write state inside the body of a composable; write only from event lambdas, `LaunchedEffect`, or `SideEffect`.

### Diagnosing recomposition

**Layout Inspector recomposition counts** — In Android Studio, attach the Layout Inspector to a running device and enable "Recomposition Counts". The overlay shows, per composable, how many times it has recomposed and how many times it was skipped. A composable that recomposes constantly and never skips is the first thing to fix.

**Compose compiler metrics** — Add the metrics flags to the Compose compiler plugin to emit per-composable reports:

```kotlin
// build.gradle.kts
composeCompiler {
    reportsDestination = layout.buildDirectory.dir("compose_reports")
    metricsDestination = layout.buildDirectory.dir("compose_reports")
}
```

Run `./gradlew assembleRelease` (or the build variant you care about). Inspect `*-composables.txt` for lines marked `restartable skippable` (good) versus `restartable` with no `skippable` qualifier (this composable cannot be skipped — check parameter types for unstable ones listed in the same file).

**Baseline profiles** — A baseline profile pre-compiles hot code paths with ART ahead-of-time, cutting first-frame latency and scroll jank. Generate one with the `BaselineProfileRule` from the `androidx.benchmark` library and ship it alongside your APK/AAB. Even without customization, the profile distributed with Compose itself reduces cold-start jank.

### Quick do/don't checklist

- Do use immutable `data class` or `ImmutableList` for list parameters in composables.
- Do enable strong skipping for new projects.
- Do read animated/rapidly-changing state inside `offset { }`, `graphicsLayer { }`, or `drawBehind { }`.
- Do give every lazy list item a stable `key`.
- Do wrap expensive computations in `remember(key)`.
- Don't use `kotlin.collections.List` as a composable parameter without wrapping it.
- Don't read state at the top of a large composable when only a leaf widget needs it.
- Don't write state inside a composable body (backwards write).
- Don't skip compiler metrics — they identify every unstable parameter explicitly.

## Platform notes

- On **large screens** (tablets, foldables), adaptive layouts often recompose more screens simultaneously during fold/unfold or orientation change. Apply the deferral and stability patterns to every adaptive pane, not just the primary screen.
- Strong skipping mode requires Compose compiler 1.5.4 or later (included in BOM 2026.05.00).
- The `kotlinx-collections-immutable` library is a separate dependency (`org.jetbrains.kotlinx:kotlinx-collections-immutable`); it is not bundled in the Compose BOM.
- Baseline profiles require `androidx.benchmark:benchmark-macro-junit4` and an emulator or physical device during generation; CI baseline-profile generation is supported via the `baselineprofile` Gradle plugin.

## Pitfalls

- Annotating a `data class` that has a mutable `var` field with `@Immutable` — the compiler trusts the annotation and skips recomposition even when the value changes, producing invisible stale UI.
- Using `List<T>` from Kotlin stdlib as a composable parameter and wondering why the composable never skips — switch to `ImmutableList<T>` or wrap in a `@Stable` class.
- Calling `remember { expensiveWork() }` with no keys when the work actually depends on inputs that change — the result is stale. Always pass the relevant keys.
- Reading a scroll position or animation value directly in composable body (not in a lambda modifier) — this forces every composable in the scope to recompose every frame, destroying frame rate.
- Trusting that "it looks fast enough" without measuring: subtle over-recomposition accumulates, especially in lists. Always validate with Layout Inspector recomposition counts and compiler reports before shipping.
- Forgetting to regenerate the baseline profile after significant code changes — a stale profile may not cover new hot paths, silently regressing startup time.

## References

- **Documentation:** [Compose performance overview](https://developer.android.com/develop/ui/compose/performance)
- **Documentation:** [Stability in Compose](https://developer.android.com/develop/ui/compose/performance/stability)
- **Documentation:** [Compose compiler metrics](https://developer.android.com/develop/ui/compose/performance/stability/diagnose)

## See also

For the foundational mental model of composables and recomposition, see `compose-fundamentals`. For managing mutable state and deriving state efficiently, see `compose-state`. For side effects that must not run in the composable body, see `compose-side-effects`. For lazy list architecture beyond keying, see `compose-lists-grids`.
