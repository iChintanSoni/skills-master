---
name: compose-state
description: Covers Jetpack Compose state — remember, mutableStateOf variants, state hoisting (state down/events up), stateful vs stateless composables, rememberSaveable with custom Savers, derivedStateOf, snapshot reads, and remember keys. Use when wiring mutable state into a composable, deciding how to hoist or persist state across recomposition or configuration changes, or optimizing with derivedStateOf.
---

## When to use

Use this guidance whenever you add mutable state to a composable, decide who should own a piece of state, choose between `remember` and `rememberSaveable`, or need to derive expensive computed values from existing state. It covers the full lifecycle of state in Compose — what survives recomposition, what survives configuration change, and what requires external persistence — so you can pick the right primitive rather than storing everything in a ViewModel by default or accidentally losing state on rotation.

## Core guidance

### What `remember` does and what it does not

- `remember { … }` runs its initializer once and stores the result in the composition tree, keyed to the call site. The value survives recompositions but is **discarded** when the composable leaves the composition (e.g. navigated away, removed from a `LazyColumn` slot).
- Configuration changes (rotation, locale switch) also tear down and recreate the composition by default, discarding all `remember` values. Use `rememberSaveable` or your ViewModel for anything that must outlive a rotation.
- Process death discards even `rememberSaveable` unless backed by `SavedStateHandle` or another disk store.

### Choosing the right state holder

- `mutableStateOf(value)` — generic observable reference; works for any type.
- `mutableIntStateOf`, `mutableLongStateOf`, `mutableFloatStateOf`, `mutableDoubleStateOf` — specialized primitives that avoid boxing; prefer them over `mutableStateOf<Int>` for tight performance paths.
- `mutableStateListOf` / `mutableStateMapOf` — observable collections; mutations (add, remove, set) trigger recomposition without replacing the list reference.
- Never hold a `List` in a plain `mutableStateOf` and mutate it in-place; Compose won't see the change. Either use `mutableStateListOf` or replace the reference with a new list.

### Stateless vs stateful composables

- A **stateless** composable receives all its data as parameters and raises events via lambdas. It is the composable ideal — reusable, testable, and previewable without a ViewModel.
- A **stateful** composable owns internal state via `remember`; use it only for UI-only ephemeral state (expansion, focus, ripple) that no ancestor cares about. Keep it thin.
- The transition from stateful to stateless is **state hoisting**: move the state and the event lambda up to the nearest common ancestor. This is not a refactor — it is the primary design decision in Compose.

### State hoisting

- Follow the unidirectional data flow (UDF) rule: state flows down as parameters, events flow up as lambdas. A composable never holds state it does not fully own.
- Hoist only as far as necessary — the nearest common ancestor that needs to read or change that piece of state. Over-hoisting into a ViewModel for trivial UI state adds noise.
- Use a plain value + `onValueChange` lambda pair (the "state + event" pattern) rather than exposing a state holder object directly to leaf composables.

### `rememberSaveable` and custom Savers

- `rememberSaveable { mutableStateOf(x) }` survives configuration changes by writing to the `Bundle` (via `SavedStateRegistry`). The stored type must be a `Bundle`-compatible primitive, `Parcelable`, or `Serializable`.
- For complex types, supply a `Saver`: implement `save` (value → saveable representation) and `restore` (back to your type). Wrap it with `rememberSaveable(stateSaver = MySaver) { … }`.
- `listSaver` and `mapSaver` are convenience helpers that let you express save/restore as a list or map of primitives without writing a full `Saver` class.

### `derivedStateOf`

- Use `derivedStateOf { expr }` when a computed value depends on one or more state objects and re-evaluating it on every recomposition would be expensive — or when you want to **debounce recomposition** by only notifying observers when the output actually changes, not every time the inputs do.
- Classic use case: deriving a filtered/sorted list from a search query state so only the rendering composable recomposes on keystroke, not the entire screen.
- Always wrap `derivedStateOf` in `remember`; without `remember` a new derivation is created each recomposition.
- Do not use it for cheap expressions — the overhead of snapshot observation outweighs the savings for simple arithmetic.

### `remember` keys

- `remember(key1, key2) { … }` invalidates and re-runs the initializer when any key changes. Use it when the remembered object must be recreated for a new identity (e.g. a new user ID or a new coroutine scope that depends on an ID).
- A missing or wrong key is a common bug: the composable remembers a stale value even after inputs change.

### The snapshot system

- Every `State<T>` object participates in Compose's **snapshot system**: reads during composition are automatically tracked, and a write schedules recomposition of only the scopes that read that state.
- Reads outside composition (e.g. in a coroutine) are not tracked by default. Use `snapshotFlow { stateVar }` to convert a state read into a `Flow` for side effects.
- Writes from background threads are allowed but must use `withMutableSnapshot` or be channeled back to the main thread via `State` writes; directly mutating UI state off the main thread without a snapshot transaction is a data race.

```kotlin
@Composable
fun SearchScreen(
    viewModel: SearchViewModel = viewModel()
) {
    var query by rememberSaveable { mutableStateOf("") }
    val results by viewModel.results.collectAsStateWithLifecycle()

    // derivedStateOf: only recomposes this scope when isEmpty flips, not on every keystroke
    val isQueryEmpty by remember { derivedStateOf { query.isEmpty() } }

    Column(modifier = Modifier.fillMaxSize()) {
        SearchBar(
            query = query,
            onQueryChange = { query = it; viewModel.search(it) },
            modifier = Modifier.fillMaxWidth()
        )
        if (isQueryEmpty) {
            EmptyPrompt()
        } else {
            ResultsList(results = results)
        }
    }
}

// Stateless leaf — no state, only params + lambda
@Composable
fun SearchBar(
    query: String,
    onQueryChange: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    OutlinedTextField(
        value = query,
        onValueChange = onQueryChange,
        label = { Text("Search") },
        modifier = modifier
    )
}
```

## Platform notes

- On **large screens** (tablets, foldables) a single `Activity` may host multiple panes. Keep per-pane state hoisted to a pane-level ViewModel or `rememberSaveable`-backed holder, not in a shared activity ViewModel, so each pane survives independent navigation events.
- `rememberSaveable` writes to the host `Activity`'s saved state, which is constrained to ~1 MB (Binder IPC limit). Store only keys or compact primitives in the Bundle; keep large data in the ViewModel or database.
- When using Compose inside a `Fragment`, the composition is hosted by `ComposeView`. The `rememberSaveable` registry is tied to the fragment's lifecycle, so it survives fragment back-stack operations correctly.

## Pitfalls

- Calling `remember` without a key for a value that depends on a parameter — the composable caches the first value and never updates when the parameter changes.
- Using `mutableStateOf` with a mutable collection (`mutableListOf(...)`) then mutating the collection in-place — Compose does not observe inner mutations. Use `mutableStateListOf` or assign a new immutable list.
- Storing large objects (bitmaps, full datasets) in `rememberSaveable` and hitting the Bundle size limit, causing a `TransactionTooLargeException` on configuration change.
- Wrapping every state read in `derivedStateOf` — this adds snapshot overhead and actually increases work for trivially cheap expressions.
- Hoisting state into a ViewModel when it is purely ephemeral UI state (e.g. a dropdown expansion) — this leaks UI mechanics into the business layer and complicates testing.
- Reading state in a composable just to pass it through to a deeply nested child without any intermediate composable needing it — this widens the recomposition scope. Hoist the read into the child or pass a lambda instead.
- Forgetting that `snapshotFlow` is needed to observe `State` objects from coroutines — directly reading a `State` value inside a `collect` lambda does not establish a reactive subscription.

## References

- **Documentation:** [State and Jetpack Compose](https://developer.android.com/develop/ui/compose/state)
- **Documentation:** [State hoisting in Compose](https://developer.android.com/develop/ui/compose/state-hoisting)
- **Documentation:** [rememberSaveable and Savers](https://developer.android.com/develop/ui/compose/state#restore-ui-state)
- **Guide:** [ViewModel and state in Compose](https://developer.android.com/topic/architecture/ui-layer/stateholders)

## See also

For the composable mental model and why recomposition happens at all, see `compose-fundamentals`. For effect APIs that bridge state changes to coroutines and non-Compose code (including `snapshotFlow`), see `compose-side-effects`. For stability annotations and diagnosing excess recomposition caused by unstable state types, see `compose-performance`. For navigation-scoped state and `BackStackEntry`-backed ViewModels, see `compose-navigation`.
