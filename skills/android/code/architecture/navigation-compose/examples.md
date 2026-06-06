# navigation-compose — examples

## End-to-end type-safe app with nested graphs

```kotlin
// routes.kt
import kotlinx.serialization.Serializable

// Top-level graphs
@Serializable object AuthGraph
@Serializable object MainGraph

// Auth destinations
@Serializable object LoginRoute
@Serializable object SignUpRoute

// Main destinations
@Serializable object FeedRoute
@Serializable data class ArticleRoute(val articleId: String)
@Serializable object ProfileRoute

// AppNavHost.kt
@Composable
fun AppNavHost(
    isLoggedIn: Boolean,
    modifier: Modifier = Modifier,
) {
    val navController = rememberNavController()
    val startGraph = if (isLoggedIn) MainGraph else AuthGraph

    NavHost(
        navController = navController,
        startDestination = startGraph,
        modifier = modifier,
    ) {
        navigation<AuthGraph>(startDestination = LoginRoute) {
            composable<LoginRoute> {
                LoginScreen(
                    onLoginSuccess = {
                        navController.navigate(MainGraph) {
                            popUpTo<AuthGraph> { inclusive = true }
                        }
                    },
                    onGoToSignUp = { navController.navigate(SignUpRoute) }
                )
            }
            composable<SignUpRoute> {
                SignUpScreen(
                    onSignUpSuccess = {
                        navController.navigate(MainGraph) {
                            popUpTo<AuthGraph> { inclusive = true }
                        }
                    }
                )
            }
        }

        navigation<MainGraph>(startDestination = FeedRoute) {
            composable<FeedRoute> {
                FeedScreen(
                    onOpenArticle = { id ->
                        navController.navigate(ArticleRoute(articleId = id))
                    },
                    onOpenProfile = {
                        navController.navigate(ProfileRoute) { launchSingleTop = true }
                    }
                )
            }
            composable<ArticleRoute> { backStackEntry ->
                val route: ArticleRoute = backStackEntry.toRoute()
                ArticleScreen(
                    articleId = route.articleId,
                    onBack = { navController.popBackStack() }
                )
            }
            composable<ProfileRoute> {
                ProfileScreen()
            }
        }
    }
}
```

## Returning a result from a picker screen

```kotlin
@Serializable object DatePickerRoute

@Composable
fun BookingScreen(navController: NavController) {
    // Observe the result left by DatePickerScreen
    val savedStateHandle = navController.currentBackStackEntry?.savedStateHandle
    val pickedDate by savedStateHandle
        ?.getStateFlow<String?>("picked_date", null)
        ?.collectAsStateWithLifecycle()
        ?: remember { mutableStateOf(null) }

    Column {
        Text(text = pickedDate ?: "No date selected")
        Button(onClick = { navController.navigate(DatePickerRoute) }) {
            Text("Pick a date")
        }
    }
}

@Composable
fun DatePickerScreen(navController: NavController) {
    var selectedDate by remember { mutableStateOf("") }

    Column {
        // ... date picker UI ...
        Button(onClick = {
            navController.previousBackStackEntry
                ?.savedStateHandle
                ?.set("picked_date", selectedDate)
            navController.popBackStack()
        }) {
            Text("Confirm")
        }
    }
}
```

## Adaptive navigation scaffold (phone vs. large screen)

```kotlin
@Composable
fun AdaptiveScaffold(windowSizeClass: WindowSizeClass) {
    val navController = rememberNavController()
    val isExpandedWidth = windowSizeClass.widthSizeClass == WindowWidthSizeClass.Expanded

    val topLevelRoutes = listOf(
        TopLevelRoute("Feed", FeedRoute, Icons.Default.Home),
        TopLevelRoute("Profile", ProfileRoute, Icons.Default.Person),
    )

    val currentEntry by navController.currentBackStackEntryAsState()

    if (isExpandedWidth) {
        Row {
            NavigationRail {
                topLevelRoutes.forEach { item ->
                    NavigationRailItem(
                        selected = currentEntry?.destination?.hasRoute(item.route::class) == true,
                        icon = { Icon(item.icon, contentDescription = item.label) },
                        label = { Text(item.label) },
                        onClick = {
                            navController.navigate(item.route) {
                                popUpTo(navController.graph.startDestinationId) { saveState = true }
                                launchSingleTop = true
                                restoreState = true
                            }
                        }
                    )
                }
            }
            MainNavHost(navController, Modifier.weight(1f))
        }
    } else {
        Scaffold(
            bottomBar = {
                NavigationBar {
                    topLevelRoutes.forEach { item ->
                        NavigationBarItem(
                            selected = currentEntry?.destination?.hasRoute(item.route::class) == true,
                            icon = { Icon(item.icon, contentDescription = item.label) },
                            label = { Text(item.label) },
                            onClick = {
                                navController.navigate(item.route) {
                                    popUpTo(navController.graph.startDestinationId) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            }
                        )
                    }
                }
            }
        ) { innerPadding ->
            MainNavHost(navController, Modifier.padding(innerPadding))
        }
    }
}

private data class TopLevelRoute<T : Any>(
    val label: String,
    val route: T,
    val icon: ImageVector,
)

@Composable
private fun MainNavHost(navController: NavController, modifier: Modifier = Modifier) {
    NavHost(navController = navController as NavHostController, startDestination = FeedRoute, modifier = modifier) {
        composable<FeedRoute> { FeedScreen(onOpenArticle = { navController.navigate(ArticleRoute(it)) }) }
        composable<ArticleRoute> { ArticleScreen(articleId = it.toRoute<ArticleRoute>().articleId, onBack = { navController.popBackStack() }) }
        composable<ProfileRoute> { ProfileScreen() }
    }
}
```

## ViewModel-driven navigation events

```kotlin
// Emit navigation events from the ViewModel instead of passing NavController into it
sealed interface FeedNavEvent {
    data class OpenArticle(val articleId: String) : FeedNavEvent
    data object OpenProfile : FeedNavEvent
}

class FeedViewModel : ViewModel() {
    private val _navEvents = Channel<FeedNavEvent>(Channel.BUFFERED)
    val navEvents = _navEvents.receiveAsFlow()

    fun onArticleTapped(id: String) {
        viewModelScope.launch { _navEvents.send(FeedNavEvent.OpenArticle(id)) }
    }

    fun onProfileTapped() {
        viewModelScope.launch { _navEvents.send(FeedNavEvent.OpenProfile) }
    }
}

@Composable
fun FeedScreen(
    navController: NavController,
    viewModel: FeedViewModel = viewModel(),
) {
    LaunchedEffect(Unit) {
        viewModel.navEvents.collect { event ->
            when (event) {
                is FeedNavEvent.OpenArticle -> navController.navigate(ArticleRoute(event.articleId))
                FeedNavEvent.OpenProfile -> navController.navigate(ProfileRoute) { launchSingleTop = true }
            }
        }
    }

    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    FeedContent(
        uiState = uiState,
        onArticleTapped = viewModel::onArticleTapped,
        onProfileTapped = viewModel::onProfileTapped,
    )
}
```
