## Example: ComposeView in a Fragment with shared ViewModel

A Fragment that hosts Compose content while sharing a ViewModel scoped to the Activity, allowing the Compose screen and any sibling Fragment to observe the same state.

```kotlin
// Shared ViewModel — no Android framework types, pure state + events
@HiltViewModel
class OrderViewModel @Inject constructor(
    private val repo: OrderRepository
) : ViewModel() {
    val uiState: StateFlow<OrderUiState> = repo.orders
        .map { orders -> OrderUiState(orders = orders) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), OrderUiState())

    fun cancelOrder(id: String) {
        viewModelScope.launch { repo.cancel(id) }
    }
}

// Fragment shell — thin; only wires Compose to the ViewModel
@AndroidEntryPoint
class OrderListFragment : Fragment() {
    // activityViewModels shares the same instance with sibling Fragments
    private val viewModel: OrderViewModel by activityViewModels()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ) = ComposeView(requireContext()).apply {
        // Critical: avoids leaking composition on back-stack pop
        setViewCompositionStrategy(
            ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed
        )
        setContent {
            val state by viewModel.uiState.collectAsStateWithLifecycle()
            AppTheme {
                OrderListScreen(
                    state = state,
                    onCancelOrder = viewModel::cancelOrder
                )
            }
        }
    }
}

@Composable
fun OrderListScreen(
    state: OrderUiState,
    onCancelOrder: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    LazyColumn(modifier = modifier.fillMaxSize()) {
        items(state.orders, key = { it.id }) { order ->
            OrderRow(order = order, onCancel = { onCancelOrder(order.id) })
        }
    }
}
```

## Example: AndroidView for a retained legacy Map widget

Wrapping a custom `LegacyMapView` that has no Compose equivalent yet, reconciling its state in the `update` lambda rather than rebuilding it.

```kotlin
@Composable
fun LegacyMapContainer(
    markers: List<LatLng>,
    cameraTarget: LatLng,
    modifier: Modifier = Modifier
) {
    // rememberUpdatedState ensures the update lambda always reads the latest value
    // without re-creating the AndroidView on each recomposition
    val currentMarkers by rememberUpdatedState(markers)
    val currentTarget by rememberUpdatedState(cameraTarget)

    AndroidView(
        factory = { context ->
            LegacyMapView(context).also { map ->
                map.initialize()
            }
        },
        update = { map ->
            // Reconcile — mutate, do not replace
            map.setMarkers(currentMarkers)
            map.animateTo(currentTarget)
        },
        modifier = modifier.fillMaxSize()
    )
}
```

## Example: Bridging a Material View theme to MaterialTheme

Creating a Compose `AppTheme` whose `ColorScheme` mirrors the app's existing `colors.xml` palette so that Compose screens look consistent with legacy View screens during the transition.

```kotlin
// theme/AppTheme.kt
private val LightColorScheme = lightColorScheme(
    primary = Color(0xFF1565C0),       // same hex as @color/primary in colors.xml
    onPrimary = Color(0xFFFFFFFF),
    primaryContainer = Color(0xFFD1E4FF),
    secondary = Color(0xFF535F70),
    background = Color(0xFFFAFCFF),
    surface = Color(0xFFFAFCFF),
    error = Color(0xFFBA1A1A),
)

private val DarkColorScheme = darkColorScheme(
    primary = Color(0xFF9ECAFF),
    onPrimary = Color(0xFF003063),
    primaryContainer = Color(0xFF234777),
    secondary = Color(0xFFBBC8DA),
    background = Color(0xFF1A1C1E),
    surface = Color(0xFF1A1C1E),
    error = Color(0xFFFFB4AB),
)

@Composable
fun AppTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    MaterialTheme(
        colorScheme = colorScheme,
        typography = AppTypography,   // defined separately, mirrors textAppearance styles
        content = content
    )
}
```

Each `ComposeView.setContent { }` block wraps its content in `AppTheme { ... }` so the brand palette applies uniformly across all migrated screens.

## Example: Cutting over to Navigation Compose after screen migration

Replacing a Fragment-based `NavHost` with `navigation-compose` once the target screens are Compose-native. Destinations use type-safe routes via `@Serializable`.

```kotlin
// navigation/AppDestinations.kt
@Serializable object Home
@Serializable data class OrderDetail(val orderId: String)
@Serializable object Settings

// MainActivity.kt — single Activity hosts Compose NavHost
@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            AppTheme {
                val navController = rememberNavController()
                NavHost(navController = navController, startDestination = Home) {
                    composable<Home> {
                        HomeScreen(onOrderClick = { id ->
                            navController.navigate(OrderDetail(id))
                        })
                    }
                    composable<OrderDetail> { backStackEntry ->
                        val dest: OrderDetail = backStackEntry.toRoute()
                        OrderDetailScreen(
                            orderId = dest.orderId,
                            onBack = navController::popBackStack
                        )
                    }
                    composable<Settings> { SettingsScreen() }
                }
            }
        }
    }
}
```

This pattern replaces all `FragmentTransaction` calls with `navController.navigate(...)`. The `orderId` is a primitive so it survives process death and deep links without custom `Parcelable` logic.
