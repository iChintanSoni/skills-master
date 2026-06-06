---
name: kotlin-flow
description: Covers Kotlin Flow — cold asynchronous streams, builders, intermediate and terminal operators, context and backpressure, combining streams, exception handling, and the relationship to StateFlow/SharedFlow. Use when modeling reactive data pipelines, exposing async data from a repository, collecting events in a ViewModel, or writing tests with Turbine.
---

## When to use

Reach for this skill whenever you need to model a sequence of values produced asynchronously — a repository emitting database rows, a polling loop, a sensor stream, or a search-as-you-type pipeline. Flow is the right tool when the stream is **cold** (work starts on each `collect` call) and the consumer pulls at its own pace. For hot state that survives no-collector periods or broadcasts to many collectors, step up to `StateFlow` or `SharedFlow` (covered in the same skill below).

## Core guidance

### Builders

- `flow { emit(…) }` — the standard cold builder; code inside runs fresh per collector, on the collector's coroutine.
- `flowOf(a, b, c)` — emit a fixed set of values.
- `asFlow()` — convert an `Iterable`, `Sequence`, or `suspend () -> T` into a flow.
- `channelFlow { send(…) }` — use when you need to emit from multiple coroutines (e.g. parallel network calls).

### Intermediate operators

Intermediate operators return a new `Flow<T>` and are lazy — they do nothing until a terminal operator collects.

- `map` / `filter` / `take` — standard transformations; prefer over manual `transform { }` for simple cases.
- `onEach` — side-effect per element (logging, tracing) without changing the type; keep effects minimal.
- `transform` — general-purpose: call `emit` zero or more times per upstream value (replaces `flatMap` for simple cases).
- `distinctUntilChanged` — drop consecutive duplicates; pair with `StateFlow` sources to avoid redundant UI updates.
- `debounce(300)` — delay emission until a quiet period; idiomatic for search-as-you-type in ViewModels.

### Terminal operators

Terminal operators are `suspend` functions that trigger collection.

- `collect { }` — the fundamental terminal; runs until the flow completes or throws.
- `first()` / `firstOrNull()` — collect one item then cancel the flow; efficient for one-shot reads.
- `toList()` / `toSet()` — materialise a finite flow into a collection.
- Never call a terminal operator in a composable body or `Activity.onCreate` directly — always inside a coroutine scope (e.g. `lifecycleScope`, `viewModelScope`).

### Context and `flowOn`

A cold flow runs in the collector's coroutine context by default. Use `flowOn(Dispatchers.IO)` to shift **upstream** emission to a different dispatcher — the operator and everything above it move; `collect` stays on the caller's dispatcher. Call `flowOn` once, as far upstream as needed.

```kotlin
// Repository: build a cold flow that fetches from DB on IO, collect on Main stays implicit
fun searchResults(query: String): Flow<List<Item>> = flow {
    while (true) {
        emit(dao.search(query))   // DB work
        delay(30_000)
    }
}
    .map { items -> items.filter { it.isActive } }   // still on IO
    .flowOn(Dispatchers.IO)                           // shift emission above this line to IO

// ViewModel: expose as StateFlow for Compose
val results: StateFlow<List<Item>> = searchResults(query)
    .stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = emptyList()
    )
```

### Backpressure — buffer, conflate, collectLatest

- `buffer(capacity)` — decouple emitter from collector by queuing elements; use when emission is bursty but every value matters.
- `conflate()` — drop intermediate values when the collector is slow; keep only the latest; good for UI progress updates.
- `collectLatest { }` — cancel and restart the collector block on each new emission; idiomatic for reacting to the latest search query or user action.

### Combining flows

- `combine(flowA, flowB) { a, b -> … }` — emit a new value whenever *either* source emits, using the latest value of both; use for UI state assembled from multiple sources.
- `zip(flowA, flowB) { a, b -> … }` — pair elements one-to-one; useful for synchronised streams of equal length.
- `flatMapLatest { value -> anotherFlow(value) }` — when an upstream value changes, cancel the inner flow and start a new one; the canonical operator for search/navigation transitions.

### Exception transparency and `catch`

A flow must not catch exceptions from downstream (the collector). Use `catch { e -> emit(fallback) }` on the upstream side only — it catches exceptions thrown by emitters and upstream operators, not by `collect { }`. For downstream errors, wrap `collect` in a `try/catch` or use `runCatching`.

- `retry(n) { cause -> cause is IOException }` — re-subscribe on matching exceptions; pair with exponential back-off via `delay` inside the predicate or a custom retry operator.
- Keep error handling close to the source: a repository flow should `catch` I/O errors and emit a `Result.Failure`; the ViewModel decides what the UI shows.

### StateFlow and SharedFlow

`StateFlow<T>` and `SharedFlow<T>` are **hot** flows — they emit regardless of collectors.

- `StateFlow` holds a single current value, replays it to new collectors, and skips duplicate values. Expose it from `ViewModel` for UI state. Create with `MutableStateFlow(initial)` or `flow.stateIn(scope, started, initial)`.
- `SharedFlow` is a general hot broadcast channel with configurable replay and extra buffer. Use for one-shot events (snackbar, navigation) via `replay = 0`, and a `SharingStarted` strategy that fits the use case.
- Prefer `SharingStarted.WhileSubscribed(5_000)` over `Eagerly` in ViewModels — it tears down upstream collection 5 seconds after the last UI subscriber disappears (handles process death and configuration change efficiently).

### Testing with Turbine

Turbine is the community-standard library for unit-testing flows. Call `flow.test { }` to collect items in a deterministic, assertion-friendly DSL without manual coroutine wiring.

- Use `awaitItem()` to receive the next emission, `awaitComplete()` for completion, `awaitError()` for exceptions.
- Combine with `TestScope` + `StandardTestDispatcher` (from `kotlinx-coroutines-test`) to control virtual time for `delay`-based operators like `debounce`.

## Platform notes

- On Android, always tie collection to a lifecycle-aware scope. Use `repeatOnLifecycle(Lifecycle.State.STARTED)` (or `flowWithLifecycle`) in Fragments and Activities to automatically pause collection when the app goes to the background. In Compose, prefer `collectAsStateWithLifecycle()` from `androidx.lifecycle:lifecycle-runtime-compose` over the plain `collectAsState()`.
- `viewModelScope` is cancelled when the ViewModel is cleared — use it for `stateIn`/`shareIn` and for collection that should stop with the ViewModel.
- For Compose UI, the typical pattern is: repository exposes `Flow<T>`, ViewModel converts it to `StateFlow<UiState>` via `stateIn`, composable reads it with `collectAsStateWithLifecycle()`.

## Pitfalls

- Calling `collect` inside a `LaunchedEffect` without a stable key — a recomposition restarts the effect and re-subscribes to the flow each time. Either hoist to the ViewModel or pass a stable key that does not change with recomposition.
- Using `GlobalScope` or a manually created `CoroutineScope` for flow collection — leaks the coroutine when the screen is destroyed. Always bind collection to a lifecycle-scoped or ViewModel-scoped coroutine scope.
- Placing `flowOn` after `collect` — `flowOn` only shifts the context of operators *above* it (upstream). Putting it after a terminal operator has no effect.
- Sharing a cold `flow { }` builder with multiple collectors directly — each collector triggers separate execution (separate network calls, separate DB reads). Convert to `SharedFlow`/`StateFlow` via `shareIn`/`stateIn` when the upstream work should be shared.
- Throwing exceptions inside `catch { }` — this violates the exception-transparency contract and can propagate unexpectedly. Emit an error sentinel value or re-throw only when appropriate.
- Using `flatMapMerge` for UI queries without bounding concurrency — it launches an unbounded number of inner coroutines. For search, `flatMapLatest` (cancel-and-restart) is almost always correct; `flatMapMerge(concurrency = N)` is for bounded parallel work.
- Forgetting that `conflate` and `collectLatest` can silently drop values — only appropriate when losing intermediate emissions is acceptable (UI render frames, progress percentages).

## References

- **Documentation:** [Kotlin flows on Android](https://developer.android.com/kotlin/flow)
- **Documentation:** [Asynchronous Flow — Kotlin language docs](https://kotlinlang.org/docs/flow.html)
- **Documentation:** [StateFlow and SharedFlow](https://developer.android.com/kotlin/flow/stateflow-and-sharedflow)
- **Library:** [Turbine — Flow testing library](https://github.com/cashapp/turbine)

## See also

For coroutine fundamentals and structured concurrency that Flow builds on, see `swift-concurrency` equivalent patterns in the Android world — the entry point is `kotlin-coroutines`. For how to wire a `StateFlow` from a ViewModel into Compose UI state, see `compose-state`. For triggering one-shot side effects (navigation, snackbars) from a `SharedFlow`, see `compose-side-effects`. For architectural patterns around ViewModel and repository layers that own the flows, see `swiftui-app-architecture` parallel — look for `android-app-architecture`.
