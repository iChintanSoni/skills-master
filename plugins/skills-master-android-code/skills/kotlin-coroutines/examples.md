## Fetching data with error handling in a ViewModel

A realistic ViewModel that loads a paginated list, handles errors distinctly from cancellation, and exposes a `UiState` sealed class to the UI layer.

```kotlin
sealed interface UsersUiState {
    data object Loading : UsersUiState
    data class Success(val users: List<User>) : UsersUiState
    data class Error(val message: String) : UsersUiState
}

class UsersViewModel(
    private val repository: UserRepository,
    private val dispatchers: CoroutineDispatchers = DefaultDispatchers,
) : ViewModel() {

    private val _uiState = MutableStateFlow<UsersUiState>(UsersUiState.Loading)
    val uiState: StateFlow<UsersUiState> = _uiState.asStateFlow()

    init {
        loadUsers()
    }

    fun loadUsers() {
        viewModelScope.launch(dispatchers.main) {
            _uiState.value = UsersUiState.Loading
            try {
                val users = repository.getUsers()   // suspends on IO internally
                _uiState.value = UsersUiState.Success(users)
            } catch (e: CancellationException) {
                throw e                             // never swallow
            } catch (e: HttpException) {
                _uiState.value = UsersUiState.Error("Server error: ${e.code()}")
            } catch (e: IOException) {
                _uiState.value = UsersUiState.Error("Network unavailable")
            }
        }
    }
}

// Dispatcher abstraction for testability
interface CoroutineDispatchers {
    val main: CoroutineDispatcher
    val io: CoroutineDispatcher
    val default: CoroutineDispatcher
}

object DefaultDispatchers : CoroutineDispatchers {
    override val main = Dispatchers.Main
    override val io = Dispatchers.IO
    override val default = Dispatchers.Default
}
```

---

## Parallel independent API calls with supervisorScope

Load a user profile and their recent activity concurrently. Either result can be absent if that individual call fails — the UI degrades gracefully rather than showing a full error.

```kotlin
data class ProfileScreenData(
    val profile: UserProfile?,
    val activity: List<ActivityItem>,
)

class ProfileViewModel(
    private val userApi: UserApi,
    private val activityApi: ActivityApi,
) : ViewModel() {

    private val _data = MutableStateFlow<ProfileScreenData?>(null)
    val data: StateFlow<ProfileScreenData?> = _data.asStateFlow()

    fun load(userId: String) {
        viewModelScope.launch {
            val result = supervisorScope {
                val profileDeferred = async(Dispatchers.IO) {
                    userApi.getProfile(userId)
                }
                val activityDeferred = async(Dispatchers.IO) {
                    activityApi.getRecent(userId)
                }
                ProfileScreenData(
                    profile = runCatching { profileDeferred.await() }.getOrNull(),
                    activity = runCatching { activityDeferred.await() }.getOrDefault(emptyList()),
                )
            }
            _data.value = result
        }
    }
}
```

---

## CPU-bound work with cancellation cooperation

Process a large in-memory list on `Dispatchers.Default`, checking for cancellation at each chunk boundary so the coroutine responds promptly when the user navigates away.

```kotlin
suspend fun processLargeDataset(items: List<RawRecord>): List<ProcessedRecord> =
    withContext(Dispatchers.Default) {
        val results = mutableListOf<ProcessedRecord>()
        val chunkSize = 500
        for (chunk in items.chunked(chunkSize)) {
            ensureActive()          // throws CancellationException if scope was cancelled
            results += chunk.map { record ->
                ProcessedRecord(
                    id = record.id,
                    normalized = record.value.trim().lowercase(),
                    score = computeScore(record),
                )
            }
        }
        results
    }

private fun computeScore(record: RawRecord): Double {
    // Purely CPU work — no suspension needed here
    return record.metrics.sumOf { it.weight * it.value } / record.metrics.size
}
```

---

## Lifecycle-aware Flow collection in a Composable

Collect a `StateFlow` from the ViewModel only while the screen is at least `STARTED`, avoiding background processing when the app is paused.

```kotlin
@Composable
fun UsersScreen(viewModel: UsersViewModel = viewModel()) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    when (val state = uiState) {
        is UsersUiState.Loading -> CircularProgressIndicator()
        is UsersUiState.Error -> ErrorBanner(message = state.message, onRetry = viewModel::loadUsers)
        is UsersUiState.Success -> UserList(users = state.users)
    }
}

// Imperative collection in a Fragment (non-Compose)
class UsersFragment : Fragment() {
    private val viewModel: UsersViewModel by viewModels()

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.uiState.collect { state ->
                    renderState(state)
                }
            }
        }
    }
}
```
