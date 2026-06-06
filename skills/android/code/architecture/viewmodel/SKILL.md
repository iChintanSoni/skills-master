---
name: viewmodel
description: Covers the ViewModel architecture component — its responsibilities, lifecycle, obtaining instances via viewModel()/hiltViewModel(), scoping to an Activity or nav graph, surviving configuration changes and process death with SavedStateHandle, and exposing UI state. Use when designing the state-holder layer for a Compose screen, wiring a ViewModel to a nav destination, persisting UI state across process death, or debugging why state is lost on rotation.
globs:
  - "**/*.kt"
tags: [viewmodel, architecture, savedstate, hilt, compose]
x-skills-master:
  domain: android
  class: code
  category: architecture
  platforms: ["android", "large-screen"]
  requires: { "android": "16", "kotlin": "2.2", "compose-bom": "2026.05.00" }
  pairs_with: []
  sources:
    - https://developer.android.com/topic/libraries/architecture/viewmodel
    - https://developer.android.com/topic/libraries/architecture/viewmodel/viewmodel-savedstate
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Apply this guidance whenever you need a component that survives configuration changes (rotation, multi-window resize, locale switch), holds and prepares UI state, or bridges a Compose screen to business logic and repositories. ViewModel is the canonical state-holder for any non-trivial screen — reach for it as soon as state must outlive a composable's recomposition or needs to call a suspend function safely.

## Core guidance

**Responsibilities — what belongs in a ViewModel**
- Own and manage screen-level UI state that must survive configuration changes.
- Launch coroutines via `viewModelScope` — it is automatically cancelled when the ViewModel is cleared (i.e. when the associated owner finally finishes).
- Mediate between UI events and the data layer (repositories, use-cases). Keep it free of Android framework types like `Context`, `View`, or `Activity`.
- Expose state to the UI as `StateFlow<UiState>` (or `State<T>` via `collectAsStateWithLifecycle`). Never expose raw mutable flows to composables — back them with `private val _state` and expose only the read-only surface.

**Obtaining a ViewModel**
- Plain Compose: `val vm: MyViewModel = viewModel()` — provided by `androidx.lifecycle:lifecycle-viewmodel-compose`.
- Hilt: `val vm: MyViewModel = hiltViewModel()` — provided by `androidx.hilt:hilt-navigation-compose`. Requires `@HiltViewModel` on the class and `@Inject constructor(...)`.
- Never construct a ViewModel with `MyViewModel()` directly in a composable; doing so bypasses the `ViewModelStore` and the instance will not survive configuration changes.

**Scoping rules**
- Default `viewModel()` call in a composable is scoped to the nearest `ViewModelStoreOwner` — usually the current `NavBackStackEntry` when inside a `NavHost`, otherwise the host `Activity`.
- To share a ViewModel across multiple nav destinations, scope it to a parent nav graph: `val vm: SharedViewModel = hiltViewModel(navController.getBackStackEntry("graph_route"))`. Both destinations read the same instance and it clears when the graph leaves the back stack.
- To scope to the Activity instead of a nav destination (rare — prefer graph-scoped sharing), pass the `Activity` as the owner: `viewModel(LocalContext.current as ComponentActivity)`.

**SavedStateHandle — surviving process death**
- A `SavedStateHandle` injected by the framework holds key-value pairs that survive both configuration changes and process death (they ride the saved-instance-state bundle).
- Store only small, primitive, `Parcelable`/`Serializable` values — never large objects or bitmaps.
- Read values as a `StateFlow` with `savedStateHandle.getStateFlow("key", defaultValue)` so the UI can observe them reactively.
- Write values with `savedStateHandle["key"] = value`; they are persisted automatically before the process dies.
- Nav arguments land in `SavedStateHandle` automatically when the ViewModel is obtained via `hiltViewModel()` inside a nav destination — access them by the arg name declared in the route.

**Never hold Context or Views**
- A ViewModel outlives the `Activity` that created it; holding a reference to `Context`, `View`, or any Activity-owned resource causes memory leaks.
- If you need a `Context` for resource resolution, inject `@ApplicationContext Context` via Hilt or use `AndroidViewModel` (prefer the Hilt approach to keep the constructor testable).
- If a composable needs to perform a UI action (show a `Snackbar`, navigate), surface it as a one-shot event through a `Channel<Event>` or `SharedFlow` — do not call UI APIs from the ViewModel.

```kotlin
@HiltViewModel
class BookDetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val repo: BookRepository,
) : ViewModel() {

    // Nav arg "bookId" is injected automatically by hiltViewModel() inside the nav graph.
    private val bookId: String = checkNotNull(savedStateHandle["bookId"])

    // Surviving process death: last scroll position persisted in the bundle.
    val scrollPosition: StateFlow<Int> =
        savedStateHandle.getStateFlow("scrollPosition", 0)

    fun onScrollPositionChanged(pos: Int) {
        savedStateHandle["scrollPosition"] = pos
    }

    private val _uiState = MutableStateFlow<BookDetailUiState>(BookDetailUiState.Loading)
    val uiState: StateFlow<BookDetailUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            repo.getBook(bookId)
                .catch { _uiState.value = BookDetailUiState.Error(it.message) }
                .collect { _uiState.value = BookDetailUiState.Success(it) }
        }
    }
}
```

## Platform notes

- **Large-screen / multi-window:** An Activity can be recreated independently in each window pane; always rely on the ViewModel, not the Activity lifecycle, to persist state across those events. Use graph-scoped ViewModels to share state between panes rendered in the same `NavHost`.
- **Predictive Back:** When a user swipes back, the destination is partially destroyed before the gesture completes. Avoid emitting destructive one-shot events from `viewModelScope` on `onCleared` if the back gesture might be cancelled.
- **Process death vs. configuration change:** Configuration changes recreate the Activity but keep the `ViewModelStore` alive — ViewModel fields survive with no extra work. Process death wipes all in-memory state; only `SavedStateHandle` values are restored. Design accordingly — keep the full dataset in the repository and use `SavedStateHandle` only for the keys needed to re-query it.

## Pitfalls

- Injecting `Activity` or `Fragment` context into the ViewModel constructor — the ViewModel outlives both. Use `@ApplicationContext` if a context is truly required.
- Calling `viewModel()` or `hiltViewModel()` outside of a composable context (e.g. in a regular function or `remember` block without a `ViewModelStoreOwner`) — the call site needs a live `ViewModelStoreOwner` in the composition.
- Storing large serialisable objects in `SavedStateHandle` — the bundle has a size limit (~1 MB total for all saved state). Store IDs, not data.
- Sharing a ViewModel by scoping it to the Activity when a nav-graph scope is cleaner — Activity-scoped VMs live for the entire session, leaking state from previous destinations.
- Using `viewModelScope.launch` and then ignoring the returned `Job`, making it impossible to cancel or test individual operations — keep a reference if cancellation is needed.
- Exposing `MutableStateFlow` or `MutableLiveData` publicly — the UI can mutate state and bypass validation logic. Always expose only the read-only interface.
- Forgetting `asStateFlow()` when exposing a `MutableStateFlow` — without it the cast back to `MutableStateFlow` is trivial and the encapsulation is nominal.

## References

- **Documentation:** [ViewModel overview](https://developer.android.com/topic/libraries/architecture/viewmodel)
- **Documentation:** [ViewModel and SavedStateHandle](https://developer.android.com/topic/libraries/architecture/viewmodel/viewmodel-savedstate)
- **Documentation:** [ViewModel APIs with Compose](https://developer.android.com/develop/ui/compose/libraries#viewmodel)

## See also

For how to model and expose the `UiState` sealed class and collect `StateFlow` in a lifecycle-safe way, see `state-flow`. For the Hilt dependency injection wiring that enables `@HiltViewModel`, see `hilt-inject`. For navigation graph scoping and passing arguments through routes, see `compose-navigation`. For side effects like one-shot navigation events emitted from a ViewModel, see `compose-side-effects`.
