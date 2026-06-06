## Examples

Minimal, original snippets showing the layered architecture in practice, contrasting MVVM and MVI in the UI layer, and illustrating the domain layer boundary.

### 1. Data layer — repository with mapping

```kotlin
// Domain model — no Room annotations, no Retrofit annotations
data class Order(val id: String, val total: Money, val status: OrderStatus)

// Repository interface lives in the domain/data boundary
interface OrderRepository {
    fun getActiveOrders(): Flow<List<Order>>
    suspend fun cancelOrder(id: String)
}

// Implementation in the data layer
class OrderRepositoryImpl @Inject constructor(
    private val dao: OrderDao,
    private val api: OrderApi
) : OrderRepository {

    override fun getActiveOrders(): Flow<List<Order>> =
        dao.observeActiveOrders()
            .map { entities -> entities.map(OrderEntity::toDomain) }

    override suspend fun cancelOrder(id: String) {
        api.cancel(id)
        dao.markCancelled(id)
    }
}
```

### 2. Domain layer — use case that earns its keep

```kotlin
// Combines two repositories; reused by OrderListScreen and OrderDashboardScreen
class GetActiveOrdersUseCase @Inject constructor(
    private val orders: OrderRepository,
    private val user: UserRepository
) {
    operator fun invoke(): Flow<List<OrderSummary>> =
        combine(orders.getActiveOrders(), user.getProfile()) { orderList, profile ->
            orderList
                .filter { it.status != OrderStatus.CANCELLED }
                .map { OrderSummary(it, profile.currency) }
        }
}
```

### 3. MVVM — direct event-handler functions

The ViewModel exposes named functions; the composable calls them directly.

```kotlin
@HiltViewModel
class OrderListViewModel @Inject constructor(
    private val getOrders: GetActiveOrdersUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(OrderListUiState(isLoading = true))
    val uiState: StateFlow<OrderListUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            getOrders()
                .catch { e -> _uiState.update { it.copy(isLoading = false, errorMessage = e.message) } }
                .collect { orders -> _uiState.update { it.copy(orders = orders, isLoading = false) } }
        }
    }

    fun onRetry() { _uiState.update { it.copy(isLoading = true, errorMessage = null) } }
    fun onCancelOrder(id: String) { viewModelScope.launch { /* … */ } }
}

@Composable
fun OrderListScreen(vm: OrderListViewModel = hiltViewModel()) {
    val state by vm.uiState.collectAsStateWithLifecycle()
    OrderListContent(state = state, onRetry = vm::onRetry, onCancel = vm::onCancelOrder)
}
```

### 4. MVI — sealed intent, single entry point

The sealed `UiIntent` documents every interaction; the reducer is easy to unit-test.

```kotlin
sealed interface OrderListIntent {
    data object Retry : OrderListIntent
    data class CancelOrder(val id: String) : OrderListIntent
}

@HiltViewModel
class OrderListMviViewModel @Inject constructor(
    private val getOrders: GetActiveOrdersUseCase,
    private val cancelOrder: CancelOrderUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(OrderListUiState(isLoading = true))
    val uiState: StateFlow<OrderListUiState> = _uiState.asStateFlow()

    fun processIntent(intent: OrderListIntent) {
        when (intent) {
            is OrderListIntent.Retry -> loadOrders()
            is OrderListIntent.CancelOrder -> cancelOrder(intent.id)
        }
    }

    private fun loadOrders() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            getOrders()
                .catch { e -> _uiState.update { it.copy(isLoading = false, errorMessage = e.message) } }
                .collect { orders -> _uiState.update { it.copy(orders = orders, isLoading = false) } }
        }
    }

    private fun cancelOrder(id: String) {
        viewModelScope.launch { cancelOrder(id) }
    }
}

@Composable
fun OrderListScreenMvi(vm: OrderListMviViewModel = hiltViewModel()) {
    val state by vm.uiState.collectAsStateWithLifecycle()
    OrderListContent(
        state = state,
        onRetry = { vm.processIntent(OrderListIntent.Retry) },
        onCancel = { id -> vm.processIntent(OrderListIntent.CancelOrder(id)) }
    )
}
```

### 5. One-off UI effects via Channel

Navigation and snackbars should not be modeled in the main state snapshot because they are consumed once.

```kotlin
sealed interface OrderEffect {
    data class ShowSnackbar(val message: String) : OrderEffect
    data class NavigateToDetail(val id: String) : OrderEffect
}

// In ViewModel
private val _effects = Channel<OrderEffect>(Channel.BUFFERED)
val effects = _effects.receiveAsFlow()

fun onOrderClicked(id: String) {
    viewModelScope.launch { _effects.send(OrderEffect.NavigateToDetail(id)) }
}

// In composable
val navController = rememberNavController()
LaunchedEffect(Unit) {
    vm.effects.collect { effect ->
        when (effect) {
            is OrderEffect.NavigateToDetail -> navController.navigate(OrderDetail(effect.id))
            is OrderEffect.ShowSnackbar -> snackbarHostState.showSnackbar(effect.message)
        }
    }
}
```
