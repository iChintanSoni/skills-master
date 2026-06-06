## HomeScreen with Loading / Success / Error States

A realistic screen that maps a repository stream to a sealed `UiState`, exposes it via `stateIn`, and collects it with `collectAsStateWithLifecycle`.

```kotlin
// --- domain / data layer ---
data class Article(val id: String, val title: String, val imageUrl: String)

interface ArticleRepository {
    fun articlesStream(): Flow<List<Article>>
    suspend fun refresh()
}

// --- ui state ---
sealed interface ArticlesUiState {
    data object Loading : ArticlesUiState
    data class Success(
        val articles: List<Article>,
        val isRefreshing: Boolean = false,
    ) : ArticlesUiState
    data class Error(val message: String) : ArticlesUiState
}

// --- one-off events ---
sealed interface ArticlesEvent {
    data class ShowSnackbar(val message: String) : ArticlesEvent
}

// --- ViewModel ---
@HiltViewModel
class ArticlesViewModel @Inject constructor(
    private val repo: ArticleRepository,
) : ViewModel() {

    val uiState: StateFlow<ArticlesUiState> = repo.articlesStream()
        .map<List<Article>, ArticlesUiState> { ArticlesUiState.Success(it) }
        .catch { e -> emit(ArticlesUiState.Error(e.localizedMessage ?: "Unknown error")) }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = ArticlesUiState.Loading,
        )

    private val _events = MutableSharedFlow<ArticlesEvent>()
    val events: SharedFlow<ArticlesEvent> = _events.asSharedFlow()

    fun refresh() {
        viewModelScope.launch {
            try {
                repo.refresh()
            } catch (e: Exception) {
                _events.emit(ArticlesEvent.ShowSnackbar("Refresh failed: ${e.localizedMessage}"))
            }
        }
    }
}

// --- Composable screen ---
@Composable
fun ArticlesScreen(
    viewModel: ArticlesViewModel = hiltViewModel(),
    snackbarHostState: SnackbarHostState = remember { SnackbarHostState() },
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    // One-off events: collect inside LaunchedEffect keyed to a stable reference
    LaunchedEffect(viewModel) {
        viewModel.events.collect { event ->
            when (event) {
                is ArticlesEvent.ShowSnackbar -> snackbarHostState.showSnackbar(event.message)
            }
        }
    }

    Scaffold(snackbarHost = { SnackbarHost(snackbarHostState) }) { padding ->
        when (val state = uiState) {
            ArticlesUiState.Loading -> CircularProgressIndicator(Modifier.fillMaxSize().wrapContentSize())
            is ArticlesUiState.Success -> ArticleList(
                articles = state.articles,
                isRefreshing = state.isRefreshing,
                onRefresh = viewModel::refresh,
                modifier = Modifier.padding(padding),
            )
            is ArticlesUiState.Error -> ErrorMessage(
                message = state.message,
                onRetry = viewModel::refresh,
                modifier = Modifier.padding(padding),
            )
        }
    }
}
```

## Combining Multiple Flows into One UiState

When a screen needs data from several repositories, combine them before calling `stateIn`.

```kotlin
data class ProfileUiState(
    val user: User? = null,
    val stats: UserStats? = null,
    val isLoading: Boolean = true,
)

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val userRepo: UserRepository,
    private val statsRepo: StatsRepository,
) : ViewModel() {

    val uiState: StateFlow<ProfileUiState> = combine(
        userRepo.currentUser(),
        statsRepo.statsForCurrentUser(),
    ) { user, stats ->
        ProfileUiState(user = user, stats = stats, isLoading = false)
    }
        .catch { emit(ProfileUiState(isLoading = false)) }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = ProfileUiState(),
        )
}

@Composable
fun ProfileScreen(viewModel: ProfileViewModel = hiltViewModel()) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    if (state.isLoading) {
        LoadingSpinner()
        return
    }

    Column {
        state.user?.let { UserHeader(it) }
        state.stats?.let { StatsSection(it) }
    }
}
```

## Manually-Managed MutableStateFlow with update{}

When the ViewModel drives state imperatively (e.g., user actions, pagination), use a private `MutableStateFlow` and expose it as `StateFlow`.

```kotlin
data class SearchUiState(
    val query: String = "",
    val results: List<SearchResult> = emptyList(),
    val isSearching: Boolean = false,
)

@HiltViewModel
class SearchViewModel @Inject constructor(
    private val searchRepo: SearchRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(SearchUiState())
    val uiState: StateFlow<SearchUiState> = _uiState.asStateFlow()

    private var searchJob: Job? = null

    fun onQueryChanged(query: String) {
        _uiState.update { it.copy(query = query) }
        searchJob?.cancel()
        if (query.isBlank()) {
            _uiState.update { it.copy(results = emptyList(), isSearching = false) }
            return
        }
        searchJob = viewModelScope.launch {
            delay(300) // debounce
            _uiState.update { it.copy(isSearching = true) }
            val results = searchRepo.search(query)
            _uiState.update { it.copy(results = results, isSearching = false) }
        }
    }

    fun clearSearch() {
        searchJob?.cancel()
        _uiState.update { SearchUiState() }
    }
}

@Composable
fun SearchScreen(viewModel: SearchViewModel = hiltViewModel()) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    Column {
        SearchBar(
            query = state.query,
            onQueryChange = viewModel::onQueryChanged,
            onClear = viewModel::clearSearch,
        )
        if (state.isSearching) {
            LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
        }
        SearchResultsList(results = state.results)
    }
}
```

## Large-Screen Two-Pane with Independent StateFlow Collection

On a foldable or tablet, two panes may each observe different parts of a shared ViewModel. Each composable collects independently, so only the relevant pane recomposes on update.

```kotlin
data class MasterDetailUiState(
    val items: List<Item> = emptyList(),
    val selectedItem: Item? = null,
    val isLoading: Boolean = true,
)

@HiltViewModel
class MasterDetailViewModel @Inject constructor(
    private val repo: ItemRepository,
) : ViewModel() {

    val uiState: StateFlow<MasterDetailUiState> = repo.itemsStream()
        .map { MasterDetailUiState(items = it, isLoading = false) }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = MasterDetailUiState(),
        )

    private val _selectedItem = MutableStateFlow<Item?>(null)
    val selectedItem: StateFlow<Item?> = _selectedItem.asStateFlow()

    fun selectItem(item: Item) { _selectedItem.update { item } }
}

@Composable
fun MasterDetailScreen(viewModel: MasterDetailViewModel = hiltViewModel()) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val selectedItem by viewModel.selectedItem.collectAsStateWithLifecycle()

    val windowSize = currentWindowAdaptiveInfo()
    val useTwoPaneLayout = windowSize.windowSizeClass.windowWidthSizeClass ==
        WindowWidthSizeClass.EXPANDED

    if (useTwoPaneLayout) {
        Row(Modifier.fillMaxSize()) {
            ItemList(
                items = uiState.items,
                onItemClick = viewModel::selectItem,
                modifier = Modifier.weight(1f),
            )
            ItemDetail(
                item = selectedItem,
                modifier = Modifier.weight(1f),
            )
        }
    } else {
        if (selectedItem != null) {
            ItemDetail(item = selectedItem, modifier = Modifier.fillMaxSize())
        } else {
            ItemList(
                items = uiState.items,
                onItemClick = viewModel::selectItem,
                modifier = Modifier.fillMaxSize(),
            )
        }
    }
}
```
