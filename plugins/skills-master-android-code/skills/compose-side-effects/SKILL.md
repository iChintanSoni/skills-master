---
name: compose-side-effects
description: Covers Jetpack Compose effect APIs — LaunchedEffect, rememberCoroutineScope, rememberUpdatedState, DisposableEffect, SideEffect, produceState, and snapshotFlow — and their key/restart semantics. Use when bridging a composable to coroutines, subscriptions, listeners, or one-shot work that must run on enter or be cleaned up on leave.
---

## When to use

Use this guidance whenever work cannot live in a composable body: launching a coroutine in response to a key change, subscribing to a Flow or callback-based API, cleaning up a resource when a composable leaves the composition, or pushing a non-Compose value (e.g. analytics) after a successful composition. The composable body is for description only — anything with a lifetime, a side channel, or coroutine scope belongs in one of the effect APIs here.

## Core guidance

### The golden rule

A composable body must be idempotent and free of side effects. Recomposition can happen at any time and multiple times. Any work with observable impact — network calls, analytics pings, coroutine launches, listener registration — must live in an effect, not directly in the body.

### LaunchedEffect — coroutines tied to the composition

- Starts a coroutine when it enters the composition and cancels it when it leaves or when any **key** changes.
- Pass every value the lambda reads that should cause a restart as a key. A constant key (`Unit` or `true`) runs exactly once; a changing key restarts on each change.
- The lambda is `suspend`, so `delay`, `collect`, and `await` are all valid inside it.
- Do **not** use `LaunchedEffect(Unit)` to unconditionally fire a side effect on every navigation — use a proper key so the effect is restartable and testable.

```kotlin
@Composable
fun SearchScreen(
    query: String,
    viewModel: SearchViewModel = viewModel()
) {
    // Restart the search whenever `query` changes; cancel the previous in-flight search.
    LaunchedEffect(query) {
        if (query.isNotBlank()) {
            viewModel.search(query)
        }
    }

    // Snapshotting a StateFlow into Compose state — use produceState for cleaner code.
    val results by viewModel.results.collectAsStateWithLifecycle()

    LazyColumn {
        items(results) { result -> SearchResultRow(result) }
    }
}
```

### rememberCoroutineScope — user-event-driven coroutines

- Returns a `CoroutineScope` tied to the current composition point; cancelled when the composable leaves the composition.
- Use it when a coroutine must start in response to a user event (a click, a gesture) rather than a state change — i.e., inside a `Button(onClick = …)` lambda, not at composition time.
- Do **not** call it repeatedly expecting fresh scopes — there is exactly one scope per remember site per composition.

```kotlin
@Composable
fun SaveButton(onSave: suspend () -> Unit) {
    val scope = rememberCoroutineScope()
    Button(onClick = { scope.launch { onSave() } }) {
        Text("Save")
    }
}
```

### rememberUpdatedState — stable reference to a changing value

- Wraps a value in a `State` so that long-running effects (like a `LaunchedEffect(Unit)`) always see the latest version without restarting.
- The canonical use case is a callback passed in from outside — the effect should not restart when the callback reference changes, but it must always call the current version.

```kotlin
@Composable
fun Heartbeat(onTick: () -> Unit) {
    val currentOnTick by rememberUpdatedState(onTick)
    LaunchedEffect(Unit) {            // never restarts
        while (true) {
            delay(1_000)
            currentOnTick()           // always calls the latest lambda
        }
    }
}
```

### DisposableEffect — enter/leave with cleanup

- Runs a block when it enters the composition (or when keys change) and the returned `onDispose` block when it leaves or keys change.
- The `onDispose` block is **required** by the API and is where listener deregistration, resource release, or cancellation logic belongs.
- If no cleanup is needed consider `LaunchedEffect`; `DisposableEffect` is specifically for resources with a paired teardown.

```kotlin
@Composable
fun LifecycleObserver(owner: LifecycleOwner, onResume: () -> Unit) {
    val currentOnResume by rememberUpdatedState(onResume)
    DisposableEffect(owner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) currentOnResume()
        }
        owner.lifecycle.addObserver(observer)
        onDispose { owner.lifecycle.removeObserver(observer) }
    }
}
```

### SideEffect — publish to non-Compose code after every successful composition

- Runs after **every** successful recomposition, synchronously on the main thread.
- Use it to push Compose-managed state into a non-Compose system (e.g. reporting a screen name to an analytics SDK after the composition succeeds).
- It never fires if the composition fails and has no cleanup hook, so it is not for resource management.

```kotlin
@Composable
fun AnalyticsScreen(screenName: String, analytics: Analytics) {
    SideEffect { analytics.logScreen(screenName) }
    // … composable content …
}
```

### produceState — convert non-Compose sources to State

- Provides a coroutine scope (and access to `awaitDispose` for cleanup) and returns a `State<T>`. The producer can collect flows, poll a callback-based API, or await a future.
- Cleaner than a `LaunchedEffect` + `remember { mutableStateOf(…) }` pair when the whole purpose is to expose an async value as Compose state.

```kotlin
@Composable
fun networkImagePainter(url: String): State<Painter?> = produceState<Painter?>(
    initialValue = null,
    key1 = url
) {
    value = loadImageSuspend(url)   // suspends; updates `value` when ready
}
```

### snapshotFlow — convert Compose State to a Flow

- Turns any Compose snapshot state reads inside its block into a cold `Flow`, useful for debouncing, combining with other flows, or observing state in a `LaunchedEffect`.
- Only re-emits when the value of the read state actually changes (equality check), filtering redundant emissions.

```kotlin
LaunchedEffect(listState) {
    snapshotFlow { listState.firstVisibleItemIndex }
        .drop(1)
        .collect { index -> analyticsLogger.logScrolled(index) }
}
```

### Choosing the right API

| Need | API |
|---|---|
| Coroutine triggered by state/key | `LaunchedEffect` |
| Coroutine triggered by user event | `rememberCoroutineScope` |
| Always-current callback in long-lived effect | `rememberUpdatedState` |
| Register/unregister a listener | `DisposableEffect` |
| Push value to non-Compose system post-composition | `SideEffect` |
| Async/callback source → Compose `State` | `produceState` |
| Compose `State` → `Flow` | `snapshotFlow` |

## Platform notes

- On **large screens**, `LaunchedEffect` and `DisposableEffect` respect configuration changes triggered by window-size-class transitions. Keep keys driven by the current state, not device geometry literals, so effects naturally restart on orientation change.
- `rememberCoroutineScope` uses `Dispatchers.Main.immediate` by default; override the dispatcher on the `launch` call if moving work off the main thread — do not change the scope's dispatcher globally.
- Effects run in the context of the composition, so they are cancelled and restarted in lock step with the composable's lifecycle in the back stack — no extra lifecycle observer is needed in most navigation scenarios.

## Pitfalls

- Launching a coroutine directly in the composable body (e.g. `scope.launch { … }` at top level) instead of inside `LaunchedEffect` — it fires a new coroutine on *every* recomposition, potentially spawning hundreds of concurrent jobs.
- Using `LaunchedEffect(Unit)` when the lambda reads a parameter that changes — the lambda captures a stale value after the first composition. Either add the parameter as a key or wrap it with `rememberUpdatedState`.
- Forgetting `onDispose` leaves dangling listeners. Android's `LifecycleOwner`, sensors, and broadcast receivers all need explicit removal — `DisposableEffect` enforces this at compile time.
- Calling `SideEffect` for work that must run only once or only on specific state changes — it fires after *every* recomposition, producing redundant calls.
- Misusing `rememberUpdatedState` as a general-purpose equality shortcut. It is for values that must *not* be keys but must always be current; using it on keys you do want to restart on is a logic error.
- Leaking coroutine scope by storing `rememberCoroutineScope()` in a long-lived object outside the composition — the scope is cancelled on leave, so callers holding a reference will silently drop work.
- Converting a hot `StateFlow` with `produceState` without handling `awaitDispose` — the `collect` call will keep the flow subscription alive; use `awaitDispose` or a structured `launch` with cancellation.

## References

- **Documentation:** [Side-effects in Compose](https://developer.android.com/develop/ui/compose/side-effects)
- **Documentation:** [Compose API guidelines — effects](https://android.googlesource.com/platform/frameworks/support/+/refs/heads/androidx-main/compose/docs/compose-api-guidelines.md)

## See also

For the composable body rules that motivate keeping effects separate, see `compose-fundamentals`. For owning and hoisting the state that effects read or write, see `compose-state`. For collecting `StateFlow` and `SharedFlow` in Compose with lifecycle awareness, see `compose-state`. For diagnosing unexpected recompositions that re-trigger effects, see `compose-performance`.
