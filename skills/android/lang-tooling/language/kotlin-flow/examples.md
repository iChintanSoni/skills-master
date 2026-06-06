## Search-as-you-type pipeline

A realistic ViewModel that debounces a query `StateFlow`, switches to the latest search flow via `flatMapLatest`, handles I/O errors in the repository, and exposes a sealed `UiState` to Compose.

```kotlin
// domain/model
sealed interface SearchUiState {
    data object Idle : SearchUiState
    data object Loading : SearchUiState
    data class Success(val items: List<Item>) : SearchUiState
    data class Error(val message: String) : SearchUiState
}

// data/ItemRepository.kt
class ItemRepository(private val api: ItemApi) {
    fun search(query: String): Flow<List<Item>> = flow {
        emit(api.search(query))
    }
        .retry(2) { cause -> cause is IOException }
        .catch { cause -> throw cause }   // propagate after retries exhausted
        .flowOn(Dispatchers.IO)
}

// ui/SearchViewModel.kt
@HiltViewModel
class SearchViewModel @Inject constructor(
    private val repository: ItemRepository
) : ViewModel() {

    private val _query = MutableStateFlow("")
    val query: StateFlow<String> = _query.asStateFlow()

    val uiState: StateFlow<SearchUiState> = _query
        .debounce(300)
        .distinctUntilChanged()
        .flatMapLatest { q ->
            if (q.isBlank()) {
                flowOf(SearchUiState.Idle)
            } else {
                flow {
                    emit(SearchUiState.Loading)
                    emitAll(
                        repository.search(q)
                            .map { SearchUiState.Success(it) }
                            .catch { e -> emit(SearchUiState.Error(e.message ?: "Unknown error")) }
                    )
                }
            }
        }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = SearchUiState.Idle
        )

    fun onQueryChange(query: String) { _query.value = query }
}
```

## Combining multiple upstream flows into a single UI state

Use `combine` to merge a user preferences flow and a content flow into one `UiState`, so the screen re-renders whenever either source changes.

```kotlin
data class FeedUiState(
    val items: List<FeedItem> = emptyList(),
    val showImages: Boolean = true,
    val isLoading: Boolean = false
)

@HiltViewModel
class FeedViewModel @Inject constructor(
    private val feedRepo: FeedRepository,
    private val prefRepo: UserPrefsRepository
) : ViewModel() {

    val uiState: StateFlow<FeedUiState> = combine(
        feedRepo.feedItems(),          // Flow<List<FeedItem>>
        prefRepo.showImagesEnabled()   // Flow<Boolean>
    ) { items, showImages ->
        FeedUiState(items = items, showImages = showImages, isLoading = false)
    }
        .onStart { emit(FeedUiState(isLoading = true)) }
        .catch { emit(FeedUiState()) }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = FeedUiState(isLoading = true)
        )
}
```

## One-shot events via SharedFlow

Use a `SharedFlow` with `replay = 0` for navigation or snackbar events — values must not be replayed to late collectors.

```kotlin
sealed interface NavEvent {
    data class GoToDetail(val id: String) : NavEvent
    data object GoBack : NavEvent
}

@HiltViewModel
class DetailListViewModel @Inject constructor(
    private val repo: ItemRepository
) : ViewModel() {

    private val _navEvents = MutableSharedFlow<NavEvent>(
        replay = 0,
        extraBufferCapacity = 1,
        onBufferOverflow = BufferOverflow.DROP_OLDEST
    )
    val navEvents: SharedFlow<NavEvent> = _navEvents.asSharedFlow()

    fun onItemClick(id: String) {
        viewModelScope.launch {
            _navEvents.emit(NavEvent.GoToDetail(id))
        }
    }
}

// In Compose:
@Composable
fun DetailListScreen(viewModel: DetailListViewModel, navController: NavController) {
    val lifecycleOwner = LocalLifecycleOwner.current
    LaunchedEffect(viewModel, lifecycleOwner) {
        viewModel.navEvents
            .flowWithLifecycle(lifecycleOwner.lifecycle)
            .collect { event ->
                when (event) {
                    is NavEvent.GoToDetail -> navController.navigate("detail/${event.id}")
                    NavEvent.GoBack -> navController.popBackStack()
                }
            }
    }
    // ... rest of UI
}
```

## Testing a Flow with Turbine and virtual time

Test `debounce` and error handling without real delays using `TestScope` and `StandardTestDispatcher`.

```kotlin
class SearchViewModelTest {

    private val testDispatcher = StandardTestDispatcher()

    @Test
    fun `debounced query triggers search and emits Success`() = runTest(testDispatcher) {
        val fakeRepo = FakeItemRepository(resultsFor = mapOf("kotlin" to listOf(Item("1", "Kotlin"))))
        val vm = SearchViewModel(fakeRepo)

        vm.uiState.test {
            // Initial state
            assertIs<SearchUiState.Idle>(awaitItem())

            vm.onQueryChange("kotlin")

            // Before debounce fires — still Idle (no new emissions yet)
            expectNoEvents()

            // Advance past the 300ms debounce
            advanceTimeBy(400)

            assertIs<SearchUiState.Loading>(awaitItem())
            val success = awaitItem()
            assertIs<SearchUiState.Success>(success)
            assertEquals("Kotlin", success.items.first().title)

            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `repository error emits Error state`() = runTest(testDispatcher) {
        val fakeRepo = FakeItemRepository(throwFor = "bad")
        val vm = SearchViewModel(fakeRepo)

        vm.uiState.test {
            awaitItem() // Idle

            vm.onQueryChange("bad")
            advanceTimeBy(400)

            awaitItem() // Loading
            assertIs<SearchUiState.Error>(awaitItem())

            cancelAndIgnoreRemainingEvents()
        }
    }
}
```
