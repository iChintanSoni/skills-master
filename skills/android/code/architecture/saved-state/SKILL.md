---
name: saved-state
description: Covers preserving UI state across configuration changes and process death using SavedStateHandle in ViewModel, rememberSaveable in Compose, and custom Savers. Use when building screens that must restore scroll position, text input, selections, or other transient UI state after rotation, backgrounding, or system-initiated process termination.
globs:
  - "**/*.kt"
tags: [savedstate, viewmodel, compose, architecture, lifecycle]
x-skills-master:
  domain: android
  class: code
  category: architecture
  platforms: ["android", "large-screen"]
  requires: { "android": "16", "kotlin": "2.2", "compose-bom": "2026.05.00" }
  pairs_with: []
  sources:
    - https://developer.android.com/topic/libraries/architecture/saving-states
    - https://developer.android.com/guide/components/activities/activity-lifecycle
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Use this skill whenever a screen manages transient UI state that must survive:

- **Configuration changes** (rotation, font scale, window resize on large screens) — the process stays alive but the Activity and its Composables are recreated.
- **Process death** (system kills the app while it is in the background) — the process is gone but the user navigates back expecting their context to be intact.
- **Navigating away and back** within the same back stack entry.

Do not use saved state as a general persistence layer. It is sized for small, serialisable UI state (< ~1 MB total). Large datasets belong in a Room database, DataStore, or a repository cache.

---

## Core guidance

### Survival matrix

| Event | `remember {}` | `rememberSaveable {}` | `SavedStateHandle` | Room / DataStore |
|---|---|---|---|---|
| Recomposition | yes | yes | yes | yes |
| Config change | **no** | yes | yes | yes |
| Process death | **no** | **no** | yes | yes |
| Cross-session | **no** | **no** | **no** | yes |

### SavedStateHandle in a ViewModel

- **Do** inject `SavedStateHandle` via Hilt's `@HiltViewModel` or the standard `viewModel()` delegate — it is provided automatically.
- **Do** use `saveable<T>()` delegate (or `getStateFlow`) so the handle participates in the ViewModel's saved-state bundle.
- **Do** keep values small and `Parcelable` / primitive. Use `@Parcelize` for domain objects that must round-trip through process death.
- **Don't** store large lists or bitmaps in the handle. Store only identifiers; reload data from the repository.
- **Don't** call `SavedStateHandle.set()` from a coroutine after the ViewModel is cleared — the write is silently dropped.

```kotlin
@HiltViewModel
class SearchViewModel @Inject constructor(
    private val repo: SearchRepository,
    savedState: SavedStateHandle,
) : ViewModel() {

    // Survives process death; backed by the saved-state bundle.
    var query by savedState.saveable { mutableStateOf("") }
        private set

    val results: StateFlow<List<Result>> = snapshotFlow { query }
        .debounce(300)
        .flatMapLatest { repo.search(it) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    fun onQueryChange(value: String) { query = value }
}
```

### rememberSaveable in Compose

- **Do** use `rememberSaveable` for any state that is purely UI-owned (transient selection, toggle state, field text not yet committed to the ViewModel).
- **Do** provide a custom `Saver` when the type is not natively supported by `Bundle` (e.g., a `Color`, a sealed class, a complex data class).
- **Don't** duplicate state between `rememberSaveable` and a ViewModel StateFlow — pick one owner. Prefer the ViewModel for state that must survive process death or be shared across screens.
- **Don't** use `rememberSaveable` for state that derives entirely from stable repository data — just recompute it.

```kotlin
// Custom Saver for a non-Parcelable type.
val ColorSaver = Saver<Color, Int>(
    save   = { it.toArgb() },
    restore = { Color(it) },
)

@Composable
fun ColorPicker(onPick: (Color) -> Unit) {
    var selected by rememberSaveable(stateSaver = ColorSaver) {
        mutableStateOf(Color.Red)
    }
    // ... picker UI
}
```

### Restoring scroll position

`LazyListState` and `LazyGridState` are internally backed by `rememberSaveable`, so they survive configuration changes automatically when you use `rememberLazyListState()`. For process death, persist the first-visible-item index in `SavedStateHandle`.

```kotlin
// In the ViewModel:
var firstVisibleItem by savedState.saveable { mutableIntStateOf(0) }

// In the Composable:
val listState = rememberLazyListState(initialFirstVisibleItemIndex = firstVisibleItem)

LaunchedEffect(listState) {
    snapshotFlow { listState.firstVisibleItemIndex }
        .collect { viewModel.firstVisibleItem = it }
}
```

### Restoring text input and selection

`TextField` with a `TextFieldState` (the modern API) stores both text content and cursor/selection. Wrap it with `rememberTextFieldState()` — it is already `rememberSaveable`-backed. For legacy `String`-based fields, hold the value in a `rememberSaveable { mutableStateOf("") }` or a ViewModel property.

### Navigation and SavedStateHandle

When using Navigation Compose, each `NavBackStackEntry` provides its own `SavedStateHandle`. Hilt injects the correct handle into the ViewModel scoped to that entry. Pop-result passing (e.g., returning a picked item from a dialog destination) uses `currentBackStackEntry.savedStateHandle["result"] = value` and is read with `getStateFlow("result", null)` in the receiving ViewModel.

---

## Platform notes

- **Large screens / foldables** — configuration changes are more frequent (posture changes, window size class transitions). Rely on `SavedStateHandle` for anything the user typed; never assume the Activity will not be recreated on a fold/unfold.
- **Multi-window** — each task has its own saved-state bundle. State is not shared between windows.
- **Android 16 predictive back** — when the user gestures back, the system may briefly show the previous screen before finishing the current one. Ensure state is written synchronously (not in a coroutine) before `onStop`.

---

## Pitfalls

- **Exceeding the bundle size limit.** The system limits the saved-state bundle. Storing bitmaps, large collections, or full API responses causes a `TransactionTooLargeException` at process death, silently dropping all saved state on some OEM firmwares. Profile with Android Studio's App Inspection > Background Task Inspector.
- **Non-Parcelable types in SavedStateHandle.** Placing a type that is neither primitive nor `Parcelable`/`Serializable` into the handle compiles fine but crashes at process-death restore. Annotate data classes with `@Parcelize` or write explicit `Saver` / custom parceling.
- **Hoisting state too high.** Storing ephemeral highlight state (e.g., a hovered row) in the ViewModel pollutes the saved-state bundle. Keep truly transient state in `remember {}` and only promote it when survival is required.
- **Forgetting `savedState.saveable` vs `savedState.get/set`.** The `saveable` delegate from `lifecycle-viewmodel-savedstate` integrates with Compose `MutableState`; bare `get/set` does not observe changes automatically. Use the right tool for the context.
- **Race conditions on restoration.** Do not launch work that depends on restored state before `SavedStateHandle` values are read. The handle is populated before `ViewModel.init {}` runs, so reading in `init` is safe.

---

## References

- **Saving UI state (official guide)** — https://developer.android.com/topic/libraries/architecture/saving-states
- **Activity lifecycle** — https://developer.android.com/guide/components/activities/activity-lifecycle

---

## See also

The `swiftui-state-data-flow` skill covers analogous state restoration patterns on Apple platforms. Within Android, pair this skill with the navigation-architecture skill for back-stack-scoped ViewModels, and with the swiftdata-queries-migration skill's Android counterpart (Room / DataStore) when persistent cross-session storage is also needed.
