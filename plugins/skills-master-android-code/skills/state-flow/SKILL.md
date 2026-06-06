---
name: state-flow
description: Covers exposing observable UI state from a ViewModel using StateFlow and SharedFlow — MutableStateFlow with immutable backing, stateIn with WhileSubscribed, collecting with collectAsStateWithLifecycle, the single UiState pattern, and modeling one-off events. Use when designing the state contract between a ViewModel and a Compose screen, choosing between StateFlow, SharedFlow, and LiveData, or wiring lifecycle-aware collection to avoid leaking background work.
---

## When to use

Use this skill when wiring a ViewModel to a Compose screen and deciding how to expose state and events. It covers the full pattern from mutable state inside the ViewModel to lifecycle-aware collection in the composable. Apply it when choosing between `StateFlow`, `SharedFlow`, and `LiveData`; when modeling a screen's state as a single sealed class or data class; when you need one-off navigation or snackbar events; or when you want to confirm you are not leaking coroutines during the background/stopped lifecycle.

## Core guidance

**Prefer StateFlow over LiveData for new code.** `StateFlow` is a Kotlin-native cold-hot hybrid: it has a current value, replays the latest item to new collectors, and integrates cleanly with coroutines. `LiveData` remains viable in View-based UIs but adds no value inside Compose.

**Expose an immutable `StateFlow` from the ViewModel.**
Back it with a private `MutableStateFlow`, update via `update {}` or assignment, and expose only the read-only interface. Never expose `MutableStateFlow` to the UI layer.

**Use a single `UiState` data class per screen.** Merge all screen-specific state into one type so a composable can destructure exactly what it needs. Avoid a bag of separate `StateFlow` properties — they require synchronized collection and can drift out of sync.

**Use `stateIn` to convert upstream cold `Flow` into a hot `StateFlow`.**
Always pass `SharingStarted.WhileSubscribed(5_000)` and an `initialValue`. The 5-second timeout keeps the `Flow` alive during configuration changes (the ViewModel survives, but the UI momentarily unsubscribes and re-subscribes), while still canceling background work after the app is truly backgrounded.

```kotlin
val uiState: StateFlow<HomeUiState> = repository.homeStream()
    .map { data -> HomeUiState(items = data.items, isLoading = false) }
    .stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = HomeUiState(isLoading = true),
    )
```

**Collect with `collectAsStateWithLifecycle` in Compose, never `collectAsState`.**
`collectAsStateWithLifecycle` (from `androidx.lifecycle:lifecycle-runtime-compose`) automatically suspends collection when the `Lifecycle` drops below `Lifecycle.State.STARTED`, preventing background CPU and network work from running while the screen is invisible.

```kotlin
@Composable
fun HomeScreen(viewModel: HomeViewModel = hiltViewModel()) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    HomeContent(uiState = uiState, onRetry = viewModel::retry)
}
```

**Model one-off events with `SharedFlow`, not `StateFlow`.**
`StateFlow` replays its last value to every new collector, so a navigation event or snackbar would replay on re-subscription. Use a `MutableSharedFlow(replay = 0)` for fire-and-forget events and collect it with `LaunchedEffect` in the composable.

```kotlin
// ViewModel
private val _events = MutableSharedFlow<HomeEvent>()
val events: SharedFlow<HomeEvent> = _events.asSharedFlow()

fun onItemDeleted() {
    viewModelScope.launch { _events.emit(HomeEvent.ShowUndoSnackbar) }
}

// Composable
LaunchedEffect(viewModel) {
    viewModel.events.collect { event ->
        when (event) {
            HomeEvent.ShowUndoSnackbar -> snackbarHostState.showSnackbar("Deleted")
        }
    }
}
```

**Avoid `repeatOnLifecycle` / `flowWithLifecycle` directly in Compose.** These are the correct lifecycle-aware collection APIs for the View system (`Activity`/`Fragment`). Inside a composable, use `collectAsStateWithLifecycle` instead — it wraps the same mechanism but fits the Compose idiom.

**Never call `collect` in a composable body.** Collection is a suspending, potentially infinite operation. Always place it inside `LaunchedEffect` or convert to state with `collectAsStateWithLifecycle`. Calling it bare in the body triggers a compile error from Compose, but the underlying error is architectural.

**Keep the UiState sealed or data-class, not a union of nullable fields.**

```kotlin
sealed interface HomeUiState {
    data object Loading : HomeUiState
    data class Success(val items: List<Item>) : HomeUiState
    data class Error(val message: String) : HomeUiState
}
```

This makes `when` expressions exhaustive and eliminates impossible states like `isLoading = true && items != null`.

## Platform notes

- On large-screen devices and foldables a single screen may host multiple panes; each ViewModel-backed pane collects its own `StateFlow` independently. Use `collectAsStateWithLifecycle` in each pane composable rather than sharing a single collection point.
- `collectAsStateWithLifecycle` uses the `LocalLifecycleOwner` composition local. In multi-pane layouts wired with `NavHost`, each back-stack entry has its own `LifecycleOwner`, so collection automatically follows pane visibility.
- On API 26+ `WhileSubscribed(5_000)` interacts well with Android's app standby buckets; the 5-second window absorbs most configuration-change latency without fighting the OS.

## Pitfalls

- **Using `collectAsState` instead of `collectAsStateWithLifecycle`.** The plain variant does not respect `Lifecycle.State.STARTED`, keeping upstream `Flow`s running while the app is backgrounded and wasting battery or triggering background task violations.
- **Exposing `MutableStateFlow` from the ViewModel.** The UI can then call `value = ...` directly, bypassing business logic. Always expose `StateFlow` via `asStateFlow()` or a typed property with a narrower interface.
- **Putting navigation targets inside `UiState`.** Mixing transient events (navigate, show snackbar) with persistent state in the same `StateFlow` causes them to replay on resubscription. Use a separate `SharedFlow` for one-shot events.
- **Sharing started with `Eagerly` or `Lazily` in a ViewModel.** `Eagerly` starts upstream immediately and never stops — leaks during backgrounding. `Lazily` never stops after the first subscriber — same problem. `WhileSubscribed` is almost always the right choice for UI state.
- **Calling `stateIn` inside a composable.** This creates a new `StateFlow` and upstream subscription on every recomposition. Always call `stateIn` in the ViewModel's `init` block or as a property initializer.
- **Updating `MutableStateFlow` from a non-main thread without `update {}`.** Direct `value =` assignment is not atomic; prefer the `update { copy(...) }` extension to avoid lost updates under concurrent emissions.
- **Omitting `initialValue` in `stateIn`.** Without it, `stateIn` returns `StateFlow<T?>` (nullable), which forces null checks everywhere. Always provide a meaningful loading or empty initial state.

## References

- **Documentation:** [StateFlow and SharedFlow](https://developer.android.com/kotlin/flow/stateflow-and-sharedflow)
- **Documentation:** [UI layer — Android Architecture](https://developer.android.com/topic/architecture/ui-layer)
- **Documentation:** [collectAsStateWithLifecycle API](https://developer.android.com/reference/kotlin/androidx/lifecycle/compose/package-summary#(kotlinx.coroutines.flow.StateFlow).collectAsStateWithLifecycle(androidx.lifecycle.LifecycleOwner,androidx.lifecycle.Lifecycle.State,kotlin.coroutines.CoroutineContext))
- **Guide:** [Kotlin flows on Android](https://developer.android.com/kotlin/flow)

## See also

For coroutine scoping and `viewModelScope` usage, see `swift-concurrency` (Android equivalent: the `coroutines` skill). For how Compose reacts to state changes and the recomposition model, see `compose-fundamentals`. For the broader ViewModel and screen architecture, see the `android-navigation-architecture` skill.
