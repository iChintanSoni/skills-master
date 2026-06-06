---
name: app-architecture
description: Covers modern Android layered architecture — UI, domain, and data layers — with unidirectional data flow, single source of truth, and immutable UI state. Use when designing a new Android app, refactoring an existing codebase into layers, deciding where logic belongs, or evaluating UI presentation patterns (MVVM vs. MVI vs. plain UDF) in code review.
globs:
  - "**/*.kt"
tags: [architecture, mvvm, mvi, viewmodel, udf, compose]
x-skills-master:
  domain: android
  class: lang-tooling
  category: architecture
  platforms: ["android"]
  requires: { "android": "16", "kotlin": "2.2" }
  pairs_with: []
  sources:
    - https://developer.android.com/topic/architecture
    - https://developer.android.com/topic/architecture/ui-layer
  snapshot_date: "2026-06-06"
  stability: contested
  version: 1.0.0
---

## When to use

Apply this skill when starting a new Android app and deciding how to partition code into layers, when a screen's ViewModel has grown fat with business logic that should belong elsewhere, when reviewing a pull request that mixes data fetching with UI rendering, or when the team debates whether every screen needs a domain use case. It covers Google's recommended three-layer architecture (UI / Domain / Data), unidirectional data flow (UDF), immutable UI state, and the contested choice between MVVM, MVI, and plain UDF structuring of the UI layer.

## Core guidance

### The three-layer model

- **Data layer** — owns all data sources (Room DAOs, Retrofit services, DataStore, content providers) and the repositories that unify them. Repositories are the single source of truth for each data type; they decide whether to hit the network or return a cached result.
- **Domain layer** — optional. Contains use cases (also called interactors) that encapsulate a single, reusable business operation spanning multiple repositories or requiring non-trivial logic. Each use case is a plain Kotlin class with a single `operator fun invoke` entry point.
- **UI layer** — state holders (ViewModels) that expose immutable UI state to the composable (or Fragment/Activity) tree. The UI renders state and fires events upward; it never pulls data directly.

### Unidirectional data flow (UDF)

- Data flows in one direction: repository → optional use case → ViewModel → UI state → composable.
- User events flow the other direction: composable calls an event handler → ViewModel mutates internal state → new UI state is emitted.
- Never allow the UI to write directly to a repository or mutate shared state outside the ViewModel.

### Immutable UI state

- Model the entire screen's renderable content as a single immutable `data class` (the UI state object).
- Expose it from the ViewModel as a `StateFlow<UiState>` backed by a private `MutableStateFlow`. Never expose `MutableStateFlow` or `MutableLiveData` to the UI layer.
- Collect it with `collectAsStateWithLifecycle()` in Compose so collection pauses when the lifecycle is not at least `STARTED`.
- Use `data class copy()` to derive a new state snapshot; never mutate in place.

### Where logic belongs

- **Formatting, filtering, mapping for display** — ViewModel (presentation logic).
- **Combining data from two or more repositories, or a multi-step business rule reused by multiple screens** — domain use case.
- **Network calls, cache reads/writes, local DB operations** — repository and data sources only; never in a ViewModel or composable.
- **One-off UI effects** (navigation, snackbars, dialogs) — model as a `Channel<UiEffect>` or `SharedFlow<UiEffect>` consumed as a `collectAsEffect` side-channel; do not embed transient effects in the main state snapshot.

### Repository rules

- One `Repository` interface per data domain (e.g., `UserRepository`, `OrderRepository`); implementations live in the data layer.
- Return `Flow<T>` for data that changes over time; suspend functions for one-shot operations.
- Never expose Room entities or Retrofit DTOs above the data layer — map to domain models at the repository boundary.

### ViewModel rules

- Scope each ViewModel to a screen or logical destination, not a reusable component.
- Launch coroutines in `viewModelScope`; cancel automatically on screen destruction.
- Use `stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), initialState)` to convert a cold `Flow` from the repository into a hot `StateFlow` the UI can safely collect.
- Inject dependencies via constructor (Hilt `@HiltViewModel` + `@Inject`); keep no Android framework references inside except `SavedStateHandle`.

```kotlin
// Immutable UI state
data class OrderListUiState(
    val orders: List<OrderSummary> = emptyList(),
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

// ViewModel — thin orchestration, no business logic
@HiltViewModel
class OrderListViewModel @Inject constructor(
    private val getOrders: GetActiveOrdersUseCase   // domain layer
) : ViewModel() {

    private val _uiState = MutableStateFlow(OrderListUiState(isLoading = true))
    val uiState: StateFlow<OrderListUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            getOrders()
                .catch { e ->
                    _uiState.update { it.copy(isLoading = false, errorMessage = e.message) }
                }
                .collect { orders ->
                    _uiState.update {
                        it.copy(orders = orders, isLoading = false, errorMessage = null)
                    }
                }
        }
    }

    fun retry() {
        _uiState.update { it.copy(isLoading = true, errorMessage = null) }
    }
}

// Composable — renders state, fires events
@Composable
fun OrderListScreen(
    viewModel: OrderListViewModel = hiltViewModel(),
    modifier: Modifier = Modifier
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    OrderListContent(
        state = state,
        onRetry = viewModel::retry,
        modifier = modifier
    )
}
```

### Domain layer — when to add it

- Add a use case when the same multi-repository operation is needed by two or more screens, or when the logic is complex enough to warrant isolated unit testing without a ViewModel.
- A use case that only calls `repository.getX()` and returns the result adds no value; skip it and call the repository directly from the ViewModel.
- Use cases must be pure Kotlin — no Android framework imports, no ViewModel, no Compose.

## Platform notes

- **Hilt** is the recommended DI framework on Android; it integrates with `@HiltViewModel` to inject repositories and use cases with zero boilerplate scoping.
- **Large screens and multi-pane layouts** — when a screen has a list-detail layout (e.g., `ListDetailPaneScaffold`), scope the shared ViewModel to the navigation graph rather than a single composable destination so both panes observe the same state.
- **Process death** — `SavedStateHandle` in the ViewModel persists selected IDs and small primitives across process death. Repositories backed by Room survive naturally; in-memory state in `MutableStateFlow` does not. Design UI state so that a cold restart from a saved ID rehydrates correctly.
- **Navigation Compose 2.8+** — type-safe routes with `@Serializable` destinations replace string route constants. Pass only IDs through navigation; rehydrate full objects from the repository inside the destination ViewModel.
- **Baseline Profiles and startup** — the data layer initializes lazily via DI; avoid blocking I/O on the main thread during `Application.onCreate`. Use `WorkManager` or background coroutines for prefetch.

## Pitfalls

- **Logic in the composable** — business decisions (filtering, sorting, combining) inside a composable skip the testability of the ViewModel and the domain layer.
- **Mutable UI state** — exposing `MutableStateFlow` or a `var` field directly to the UI allows the UI to write state, breaking UDF and making state transitions hard to trace.
- **Intermediate list or entity leaking across layers** — passing a Room entity to the composable couples the UI to the database schema; a schema change forces UI changes. Map at the repository boundary.
- **Fat repositories** — a repository that orchestrates multiple other repositories or contains conditional branching across many concerns should be split into domain use cases instead.
- **Collecting with `collectAsState()` instead of `collectAsStateWithLifecycle()`** — the plain variant continues collecting while the app is backgrounded, wasting CPU and battery.
- **`stateIn` with `SharingStarted.Eagerly`** — starts the upstream flow even before any subscriber exists; prefer `WhileSubscribed(5_000)` so upstream is cancelled when the UI is gone.
- **One ViewModel per composable component** — ViewModels should be scoped to screens (navigation destinations), not to small reusable composables that should receive state as parameters.
- **Skipping the domain layer wholesale** — in large apps, ViewModel constructors fill with ten-plus repository dependencies; extracting use cases restores single-responsibility and makes tests maintainable.

## Open question

**MVVM vs. MVI vs. plain UDF** — Google's official guidance specifies UDF and immutable state but does not mandate a specific presentation pattern. Three approaches are in active use and each has legitimate advocates.

- **MVVM (Model-View-ViewModel):** the ViewModel exposes a `StateFlow<UiState>` and individual event-handler functions (e.g., `fun onRetry()`, `fun onItemClicked(id)`). The composable calls functions directly. This is what Google's own architecture samples use. Advantages: easy to read, minimal ceremony, Compose tooling integrates naturally. Criticism: with many handlers, it is not obvious at a glance what all the possible transitions are; there is no enforced contract between the UI and the ViewModel.
- **MVI (Model-View-Intent):** the UI fires sealed `Intent` or `Action` objects into a single `fun processIntent(intent: UiIntent)` entry point, and the ViewModel reduces them to state. State transitions are exhaustive and traceable; the sealed intent hierarchy documents every interaction the screen can trigger. Advantages: traceability, testability of the reducer, explicit contract. Criticism: more boilerplate; every tiny interaction (focus change, scroll offset) becomes a sealed subtype; the pattern is more at home in complex screens than simple forms.
- **Plain UDF without strict MVVM or MVI:** a composable state holder (`rememberXxxState`) handles purely local presentation state (animation offsets, expanded/collapsed) while the screen-level ViewModel handles async and business state. Some screens do not need a ViewModel at all if they are purely stateless or receive all state as parameters from a parent. Advantages: avoids over-engineering simple screens. Criticism: inconsistency across the codebase if applied without clear team guidelines.

There is no universally correct answer. The choice that matters most is picking one approach and applying it consistently within a codebase. Teams coming from reactive/Redux backgrounds often find MVI natural; teams following Google samples find MVVM sufficient. The decisive question in either case is the same: is UI state immutable, does data flow in one direction, and is logic testable without rendering UI?

## References

- **Documentation:** [Guide to app architecture](https://developer.android.com/topic/architecture)
- **Documentation:** [UI layer](https://developer.android.com/topic/architecture/ui-layer)
- **Documentation:** [Data layer](https://developer.android.com/topic/architecture/data-layer)
- **Documentation:** [Domain layer](https://developer.android.com/topic/architecture/domain-layer)

## See also

For collecting `StateFlow` with lifecycle awareness in Compose, see the `kotlin-flow` skill. For coroutine scoping inside ViewModels and structured concurrency, see `kotlin-coroutines`. For dependency injection with Hilt and `@HiltViewModel`, see the DI skill. For type-safe Navigation Compose routing, see the navigation-architecture skill.
