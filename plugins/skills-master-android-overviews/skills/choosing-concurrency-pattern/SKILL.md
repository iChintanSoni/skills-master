---
name: choosing-concurrency-pattern
description: Decision router for asynchrony in Android apps. Use when choosing between coroutines, Flow, StateFlow, SharedFlow, LiveData, RxJava, or raw callbacks for a new feature, reviewing legacy async code, or mapping a specific need (one-shot call, stream, UI state) to the right tool.
---

## When to use

Reach for this skill when deciding which async primitive to use for a new feature, evaluating whether existing LiveData or RxJava code should be migrated, or mapping a concrete need — a network call, a database stream, a one-way UI event, a hot UI state — to the correct Kotlin construct. Also useful when onboarding teammates who come from an RxJava or callback background and need a mental model for modern Kotlin async.

## Core guidance

### The default: coroutines + Flow

Kotlin coroutines are the canonical async foundation for all new Android code in 2026. Structured concurrency ties every async operation to a `CoroutineScope` (typically `viewModelScope` or `lifecycleScope`), which means cancellation and resource cleanup are automatic rather than manual. Flow is the coroutine-native stream type; it composes with the same suspension model, shares the same `CoroutineScope` ownership rules, and integrates directly with Jetpack Compose via `collectAsStateWithLifecycle`.

Start here for every new feature. Only reach for an alternative when a specific constraint applies.

### Mapping needs to tools

**One-shot async operation** — a network request, a database write, a file read that produces a single result.

Use a `suspend fun`. Call it from `viewModelScope.launch { }` in a ViewModel or from `lifecycleScope.launch { }` in a Composable host. This is the simplest possible unit; no stream, no backpressure, no observable — just a function that can be suspended and resumed.

**Continuous or reactive stream** — database rows changing over time, sensor data, paginated content, a series of values from a remote source.

Use `Flow<T>`. Produce it with `flow { }`, `callbackFlow { }`, or Room/DataStore's built-in Flow APIs. Collect it in the ViewModel layer and expose the result as `StateFlow` (see below). Raw `Flow` is cold by default — it only runs when collected and stops when the collector cancels.

**UI state — a single source of truth the UI observes**

Use `StateFlow<UiState>`. Back it with `MutableStateFlow` inside the ViewModel and expose the read-only `StateFlow` to the UI. `StateFlow` is always hot, always has a current value, and replays the latest state to new collectors — exactly the semantics needed for composable UI. Collect it with `collectAsStateWithLifecycle()` (from `androidx.lifecycle:lifecycle-runtime-compose`) so the collection respects the Compose lifecycle and does not waste work when the screen is in the background.

**One-time UI events** — navigation triggers, snackbar dismissals, modal open/close — that must not replay to new collectors.

Use `SharedFlow` with `replay = 0`. Unlike `StateFlow`, it has no stored value, so a navigation event is not re-delivered when the ViewModel survives a configuration change and the screen recomposes. Model these as `Channel` or `SharedFlow` and channel them through the ViewModel rather than storing them in UI state. Avoid sending events directly to the composable; keep them in the ViewModel and consume them from the UI layer.

**Combining, transforming, or debouncing streams**

Use Flow operators: `map`, `filter`, `flatMapLatest`, `combine`, `debounce`, `distinctUntilChanged`. These compose without ceremony and are structured — no separate subscriptions to manage. Convert a hot upstream to a ViewModel-scoped StateFlow with `stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), initialValue)`.

### LiveData — legacy UI-layer glue

`LiveData` predates coroutines and Flow. Its lifecycle awareness solved a real problem in 2018, but `StateFlow` + `collectAsStateWithLifecycle` solves the same problem with better composability, no Android-framework dependency, and cleaner testability. In new code, do not introduce `LiveData`. In existing code, leave stable `LiveData` in place until the screen is actively reworked; then migrate to `StateFlow`. Use `liveData { }` or `asLiveData()` only as a bridge when a View-based UI layer requires `LiveData` from a repository that already exposes Flow.

### RxJava — legacy reactive streams

RxJava is fully capable but carries real costs in 2026: a large dependency footprint, a separate threading model (`Schedulers`), a different error-propagation surface, and no native integration with Kotlin suspend functions or Compose. New screens and new data-layer APIs should not use RxJava. Migration from RxJava to Flow is mechanical for most patterns: `Observable` → `Flow`, `Single` → `suspend fun`, `BehaviorSubject` → `MutableStateFlow`, `PublishSubject` → `MutableSharedFlow`. Interop is available via `kotlinx-coroutines-rx3` if you need to bridge during an incremental migration.

### Raw callbacks — do not originate; wrap when required

Callback-based APIs (e.g. older SDK listeners, Java-based SDKs, some network libraries) remain common. Do not design new APIs with callbacks. Wrap existing callback APIs using `suspendCancellableCoroutine { }` for one-shot results or `callbackFlow { }` for streams, and expose the result as a suspend function or Flow. This brings callback sources into the structured concurrency graph and makes them testable and cancellable.

### Decision table

| Need | Tool | Notes |
|---|---|---|
| Single async result | `suspend fun` | Simplest unit; use `viewModelScope.launch` |
| Reactive stream from a source | `Flow<T>` (cold) | Room, DataStore, network with polling |
| UI state the composable observes | `StateFlow<UiState>` | `stateIn(WhileSubscribed(5_000))` pattern |
| One-time UI event (no replay) | `SharedFlow(replay=0)` or `Channel` | Avoid storing events in state |
| Transform / combine streams | Flow operators | `combine`, `flatMapLatest`, `debounce` |
| Legacy View UI, interop needed | `LiveData` via `asLiveData()` | Bridge only; do not start new LiveData |
| Existing RxJava codebase | Migrate incrementally | `kotlinx-coroutines-rx3` for bridging |
| Callback SDK | `suspendCancellableCoroutine` / `callbackFlow` | Always wrap; never propagate callbacks upward |

## Platform notes

**Jetpack Compose** — `collectAsStateWithLifecycle()` is the correct collection point in any `@Composable`. It pauses collection when the lifecycle drops below `STARTED`, preventing wasted work and reducing battery impact on backgrounded screens. Do not use `collectAsState()` without a lifecycle parameter in production code; it does not respect the Android lifecycle.

**Large screens and multi-resume** — on foldables and tablets, multiple activities or composables may be simultaneously resumed. `WhileSubscribed(5_000)` on `stateIn` ensures the upstream Flow stops 5 seconds after the last collector unsubscribes (surviving configuration changes) rather than immediately. This timeout is the recommended default for production ViewModels.

**Testing** — coroutines and Flow are straightforward to test with `kotlinx-coroutines-test` and `Turbine`. `TestCoroutineScheduler` and `runTest` replace real time with virtual time. `StateFlow` and `SharedFlow` are testable without Android instrumentation. LiveData and RxJava require additional test rules (`InstantTaskExecutorRule`, `RxImmediateSchedulerRule`) and cannot be tested as cleanly in unit tests without the Android framework.

**Background work** — for deferrable, guaranteed background work (sync, upload, housekeeping) that must survive process death, use WorkManager. WorkManager is not a replacement for coroutines in the UI or domain layers; it is the right tool specifically for persistent, system-managed background tasks. WorkManager workers can themselves use coroutines via `CoroutineWorker`.

## Pitfalls

- **Collecting Flow in a plain `launch` without lifecycle awareness** — using `lifecycleScope.launch { viewModel.uiState.collect { } }` instead of `collectAsStateWithLifecycle()` will keep collecting even when the screen is in the background, wasting CPU and battery. Use the lifecycle-aware collector.
- **Storing one-time events in `StateFlow`** — navigation events replayed to late collectors cause double-navigation bugs after configuration changes. Use `SharedFlow(replay=0)` or a `Channel` for events, and `StateFlow` only for durable state.
- **Launching on `GlobalScope`** — `GlobalScope` is not bound to any lifecycle; cancelled screens will continue running async work. Always use `viewModelScope`, `lifecycleScope`, or a custom scope tied to a clear owner.
- **Forgetting structured cancellation in `callbackFlow`** — omitting `awaitClose { listener.unregister() }` will leak the callback registration after the Flow collector cancels. Always clean up in `awaitClose`.
- **Mixing threading models** — calling `withContext(Dispatchers.IO)` inside an RxJava chain or vice versa creates untraceable async graphs. Choose one model per module boundary during migration; do not interleave.
- **Using `MutableStateFlow.value = ...` from a background thread without synchronization in Kotlin/JVM** — while `MutableStateFlow` is thread-safe for atomic updates, complex read-modify-write patterns (`value = value.copy(...)`) are not atomic. Use `update { it.copy(...) }` to avoid race conditions.
- **Blocking the main thread with `runBlocking`** — `runBlocking` is for tests and top-level entry points only. Never call it on the Android main thread; it will cause ANRs.

## References

- **Developer Guide:** [Kotlin coroutines on Android](https://developer.android.com/kotlin/coroutines)
- **Architecture Guide:** [UI layer — state and events](https://developer.android.com/topic/architecture/ui-layer)

## See also

For deeper patterns around ViewModel and state holder design, see `swiftui-concurrency` as a conceptual iOS parallel. For data-layer repositories that produce Flow, see `choosing-persistence`. For the networking layer that feeds suspend functions and Flow into the domain layer, see `choosing-networking`. For testing coroutines and Flow in unit tests, see `testing-async-code`. For how state flows from the domain into Compose UI, see `swiftui-state-data-flow` as a structural reference from the iOS domain.
