## BookDetail screen with full ViewModel wiring

A realistic nav-destination ViewModel that loads a book by route argument, exposes a sealed UI-state, handles a one-shot "share" event, and persists scroll position across process death.

```kotlin
// --- UiState model ---
sealed interface BookDetailUiState {
    data object Loading : BookDetailUiState
    data class Success(val book: Book) : BookDetailUiState
    data class Error(val message: String?) : BookDetailUiState
}

data class Book(val id: String, val title: String, val author: String)

// --- ViewModel ---
@HiltViewModel
class BookDetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val repo: BookRepository,
) : ViewModel() {

    private val bookId: String = checkNotNull(savedStateHandle["bookId"])

    val scrollPosition: StateFlow<Int> =
        savedStateHandle.getStateFlow("scrollPosition", 0)

    fun onScrollPositionChanged(pos: Int) {
        savedStateHandle["scrollPosition"] = pos
    }

    private val _uiState = MutableStateFlow<BookDetailUiState>(BookDetailUiState.Loading)
    val uiState: StateFlow<BookDetailUiState> = _uiState.asStateFlow()

    // One-shot events: Channel with capacity BUFFERED drops nothing even if UI isn't collecting yet.
    private val _events = Channel<BookDetailEvent>(Channel.BUFFERED)
    val events: Flow<BookDetailEvent> = _events.receiveAsFlow()

    init {
        loadBook()
    }

    fun onShareClicked() {
        val state = _uiState.value
        if (state is BookDetailUiState.Success) {
            viewModelScope.launch {
                _events.send(BookDetailEvent.ShareBook(state.book.title))
            }
        }
    }

    fun retry() = loadBook()

    private fun loadBook() {
        _uiState.value = BookDetailUiState.Loading
        viewModelScope.launch {
            repo.getBook(bookId)
                .catch { _uiState.value = BookDetailUiState.Error(it.message) }
                .collect { _uiState.value = BookDetailUiState.Success(it) }
        }
    }
}

sealed interface BookDetailEvent {
    data class ShareBook(val title: String) : BookDetailEvent
}

// --- Composable ---
@Composable
fun BookDetailScreen(
    vm: BookDetailViewModel = hiltViewModel(),
    onBack: () -> Unit,
) {
    val uiState by vm.uiState.collectAsStateWithLifecycle()
    val scrollPos by vm.scrollPosition.collectAsStateWithLifecycle()
    val context = LocalContext.current

    LaunchedEffect(Unit) {
        vm.events.collect { event ->
            when (event) {
                is BookDetailEvent.ShareBook ->
                    context.startActivity(
                        Intent(Intent.ACTION_SEND)
                            .putExtra(Intent.EXTRA_TEXT, event.title)
                            .setType("text/plain")
                    )
            }
        }
    }

    when (val s = uiState) {
        is BookDetailUiState.Loading -> CircularProgressIndicator()
        is BookDetailUiState.Error   -> ErrorState(s.message, onRetry = vm::retry)
        is BookDetailUiState.Success -> BookContent(
            book = s.book,
            initialScrollPos = scrollPos,
            onScrollPositionChanged = vm::onScrollPositionChanged,
            onShareClicked = vm::onShareClicked,
        )
    }
}
```

## Graph-scoped ViewModel shared across two nav destinations

A checkout flow with a CartViewModel scoped to the "checkout" nav graph so both the cart and the payment screen read the same instance.

```kotlin
// Route graph declaration
const val CHECKOUT_GRAPH = "checkout"
const val CART_ROUTE = "cart"
const val PAYMENT_ROUTE = "payment"

@HiltViewModel
class CartViewModel @Inject constructor(
    private val cartRepo: CartRepository,
) : ViewModel() {
    private val _items = MutableStateFlow<List<CartItem>>(emptyList())
    val items: StateFlow<List<CartItem>> = _items.asStateFlow()

    init {
        viewModelScope.launch {
            cartRepo.observeItems().collect { _items.value = it }
        }
    }

    fun removeItem(id: String) {
        viewModelScope.launch { cartRepo.remove(id) }
    }
}

// NavGraph setup
fun NavGraphBuilder.checkoutGraph(navController: NavHostController) {
    navigation(startDestination = CART_ROUTE, route = CHECKOUT_GRAPH) {
        composable(CART_ROUTE) { backStackEntry ->
            // Scope the VM to the parent graph entry — both screens share one instance.
            val graphEntry = remember(backStackEntry) {
                navController.getBackStackEntry(CHECKOUT_GRAPH)
            }
            val vm: CartViewModel = hiltViewModel(graphEntry)
            CartScreen(vm = vm, onProceed = { navController.navigate(PAYMENT_ROUTE) })
        }
        composable(PAYMENT_ROUTE) { backStackEntry ->
            val graphEntry = remember(backStackEntry) {
                navController.getBackStackEntry(CHECKOUT_GRAPH)
            }
            val vm: CartViewModel = hiltViewModel(graphEntry)
            PaymentScreen(items = vm.items.collectAsStateWithLifecycle().value)
        }
    }
}
```

## SavedStateHandle for search query that survives process death

A search screen that persists the user's typed query so it is restored after the OS kills the process.

```kotlin
@HiltViewModel
class SearchViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val searchRepo: SearchRepository,
) : ViewModel() {

    // Query is wired directly through SavedStateHandle — survives process death.
    val query: StateFlow<String> = savedStateHandle.getStateFlow("query", "")

    private val _results = MutableStateFlow<List<SearchResult>>(emptyList())
    val results: StateFlow<List<SearchResult>> = _results.asStateFlow()

    init {
        viewModelScope.launch {
            query
                .debounce(300)
                .distinctUntilChanged()
                .collectLatest { q ->
                    if (q.isBlank()) {
                        _results.value = emptyList()
                    } else {
                        _results.value = searchRepo.search(q)
                    }
                }
        }
    }

    fun onQueryChanged(newQuery: String) {
        savedStateHandle["query"] = newQuery
    }
}

@Composable
fun SearchScreen(vm: SearchViewModel = hiltViewModel()) {
    val query by vm.query.collectAsStateWithLifecycle()
    val results by vm.results.collectAsStateWithLifecycle()

    Column {
        TextField(
            value = query,
            onValueChange = vm::onQueryChanged,
            placeholder = { Text("Search...") },
        )
        LazyColumn {
            items(results, key = { it.id }) { result ->
                Text(result.title, modifier = Modifier.fillMaxWidth().padding(16.dp))
            }
        }
    }
}
```

## ViewModel factory pattern without Hilt (assisted injection)

When Hilt is unavailable, use `viewModelFactory` (Lifecycle 2.8+) to pass runtime parameters without writing a custom `ViewModelProvider.Factory`.

```kotlin
class NoteEditorViewModel(
    private val noteId: String,
    private val repo: NoteRepository,
) : ViewModel() {

    private val _note = MutableStateFlow<Note?>(null)
    val note: StateFlow<Note?> = _note.asStateFlow()

    init {
        viewModelScope.launch {
            _note.value = repo.getNote(noteId)
        }
    }

    fun save(content: String) {
        viewModelScope.launch { repo.save(noteId, content) }
    }

    companion object {
        fun factory(noteId: String, repo: NoteRepository): ViewModelProvider.Factory =
            viewModelFactory {
                initializer { NoteEditorViewModel(noteId, repo) }
            }
    }
}

@Composable
fun NoteEditorScreen(
    noteId: String,
    repo: NoteRepository,       // obtained from a CompositionLocal or manual DI
    vm: NoteEditorViewModel = viewModel(factory = NoteEditorViewModel.factory(noteId, repo)),
) {
    val note by vm.note.collectAsStateWithLifecycle()
    note?.let { Text(it.content) }
}
```
