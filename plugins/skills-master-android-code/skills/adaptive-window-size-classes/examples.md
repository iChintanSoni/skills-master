## Driving navigation chrome from WindowSizeClass

A root composable that switches between bottom bar, navigation rail, and modal navigation drawer based solely on `WindowWidthSizeClass`. No device checks, no pixel queries.

```kotlin
import androidx.compose.material3.adaptive.currentWindowAdaptiveInfo
import androidx.window.core.layout.WindowWidthSizeClass

sealed interface NavType {
    data object BottomBar : NavType
    data object Rail : NavType
    data object Drawer : NavType
}

fun windowWidthToNavType(widthClass: WindowWidthSizeClass): NavType =
    when (widthClass) {
        WindowWidthSizeClass.COMPACT -> NavType.BottomBar
        WindowWidthSizeClass.MEDIUM -> NavType.Rail
        WindowWidthSizeClass.EXPANDED -> NavType.Drawer
        else -> NavType.BottomBar
    }

@Composable
fun AppShell(
    currentDestination: Destination,
    destinations: List<Destination>,
    onDestinationSelected: (Destination) -> Unit,
    content: @Composable (PaddingValues) -> Unit,
) {
    val widthClass = currentWindowAdaptiveInfo().windowSizeClass.windowWidthSizeClass
    val navType = windowWidthToNavType(widthClass)

    val drawerState = rememberDrawerState(DrawerValue.Closed)
    val scope = rememberCoroutineScope()

    when (navType) {
        NavType.Drawer -> {
            PermanentNavigationDrawer(
                drawerContent = {
                    PermanentDrawerSheet {
                        destinations.forEach { dest ->
                            NavigationDrawerItem(
                                label = { Text(dest.label) },
                                selected = currentDestination == dest,
                                onClick = { onDestinationSelected(dest) },
                                icon = { Icon(dest.icon, contentDescription = null) },
                            )
                        }
                    }
                },
            ) {
                Scaffold { padding -> content(padding) }
            }
        }
        NavType.Rail -> {
            Row(Modifier.fillMaxSize()) {
                NavigationRail {
                    destinations.forEach { dest ->
                        NavigationRailItem(
                            selected = currentDestination == dest,
                            onClick = { onDestinationSelected(dest) },
                            icon = { Icon(dest.icon, contentDescription = null) },
                            label = { Text(dest.label) },
                        )
                    }
                }
                Scaffold(Modifier.weight(1f)) { padding -> content(padding) }
            }
        }
        NavType.BottomBar -> {
            Scaffold(
                bottomBar = {
                    NavigationBar {
                        destinations.forEach { dest ->
                            NavigationBarItem(
                                selected = currentDestination == dest,
                                onClick = { onDestinationSelected(dest) },
                                icon = { Icon(dest.icon, contentDescription = null) },
                                label = { Text(dest.label) },
                            )
                        }
                    }
                },
            ) { padding -> content(padding) }
        }
    }
}
```

---

## Two-pane list-detail on expanded windows

A screen that shows a list and a detail panel side-by-side on `Expanded` windows, and single-pane navigation on `Compact` and `Medium`. The adaptive branching is derived from `WindowWidthSizeClass` at the screen root, not inside leaf composables.

```kotlin
import androidx.compose.material3.adaptive.currentWindowAdaptiveInfo
import androidx.window.core.layout.WindowWidthSizeClass

@Composable
fun ArticleListDetailScreen(
    viewModel: ArticleViewModel = hiltViewModel(),
) {
    val widthClass = currentWindowAdaptiveInfo().windowSizeClass.windowWidthSizeClass
    val useListDetail = widthClass == WindowWidthSizeClass.EXPANDED

    val selectedArticle by viewModel.selectedArticle.collectAsStateWithLifecycle()
    val articles by viewModel.articles.collectAsStateWithLifecycle()

    if (useListDetail) {
        Row(Modifier.fillMaxSize()) {
            ArticleList(
                articles = articles,
                selectedId = selectedArticle?.id,
                onSelect = viewModel::selectArticle,
                modifier = Modifier
                    .width(360.dp)
                    .fillMaxHeight(),
            )
            HorizontalDivider(
                Modifier
                    .fillMaxHeight()
                    .width(1.dp)
            )
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxHeight(),
                contentAlignment = Alignment.Center,
            ) {
                if (selectedArticle != null) {
                    ArticleDetail(article = selectedArticle!!)
                } else {
                    Text(
                        text = "Select an article",
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }
    } else {
        // Compact / Medium: single pane, navigate to detail on selection
        val navController = rememberNavController()

        NavHost(navController = navController, startDestination = "list") {
            composable("list") {
                ArticleList(
                    articles = articles,
                    selectedId = null,
                    onSelect = { article ->
                        viewModel.selectArticle(article)
                        navController.navigate("detail")
                    },
                    modifier = Modifier.fillMaxSize(),
                )
            }
            composable("detail") {
                selectedArticle?.let { article ->
                    ArticleDetail(
                        article = article,
                        modifier = Modifier.fillMaxSize(),
                    )
                }
            }
        }
    }
}
```

---

## Adaptive grid column count

A content grid that adjusts its column count purely from `WindowWidthSizeClass`, ensuring consistent visual density across all window sizes.

```kotlin
import androidx.compose.material3.adaptive.currentWindowAdaptiveInfo
import androidx.window.core.layout.WindowWidthSizeClass

fun columnCountForWidth(widthClass: WindowWidthSizeClass): Int =
    when (widthClass) {
        WindowWidthSizeClass.COMPACT -> 1
        WindowWidthSizeClass.MEDIUM -> 2
        WindowWidthSizeClass.EXPANDED -> 3
        else -> 1
    }

@Composable
fun ProductGrid(
    products: List<Product>,
    onProductClick: (Product) -> Unit,
    modifier: Modifier = Modifier,
) {
    val widthClass = currentWindowAdaptiveInfo().windowSizeClass.windowWidthSizeClass
    val columns = columnCountForWidth(widthClass)

    LazyVerticalGrid(
        columns = GridCells.Fixed(columns),
        contentPadding = PaddingValues(16.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        modifier = modifier.fillMaxSize(),
    ) {
        items(products, key = { it.id }) { product ->
            ProductCard(
                product = product,
                onClick = { onProductClick(product) },
            )
        }
    }
}
```

---

## Foldable posture + size class combined

A composable that layers `WindowPosture` on top of `WindowWidthSizeClass` to handle tabletop (half-open foldable) and flat expanded states differently. Demonstrates that size class and posture are independent signals that compose together.

```kotlin
import androidx.compose.material3.adaptive.currentWindowAdaptiveInfo
import androidx.window.core.layout.WindowWidthSizeClass
import androidx.window.layout.FoldingFeature

@Composable
fun CameraPreviewScreen(
    previewContent: @Composable () -> Unit,
    controlsContent: @Composable () -> Unit,
) {
    val adaptiveInfo = currentWindowAdaptiveInfo()
    val widthClass = adaptiveInfo.windowSizeClass.windowWidthSizeClass
    val posture = adaptiveInfo.windowPosture

    // Tabletop posture: device is half-open on a table, hinge is horizontal.
    val isTabletop = posture is androidx.window.layout.WindowInfoTracker
        // Use the FoldingFeature state from WindowLayoutInfo in production:
        // posture.isTabletop (available via material3-adaptive WindowPosture wrapper)
        || false  // placeholder — replace with actual posture check

    when {
        isTabletop -> {
            // Split vertically at the hinge: preview on top, controls on bottom.
            Column(Modifier.fillMaxSize()) {
                Box(Modifier.weight(1f).fillMaxWidth()) { previewContent() }
                HorizontalDivider()
                Box(Modifier.weight(1f).fillMaxWidth()) { controlsContent() }
            }
        }
        widthClass == WindowWidthSizeClass.EXPANDED -> {
            // Wide flat layout: preview on left, controls on right.
            Row(Modifier.fillMaxSize()) {
                Box(Modifier.weight(2f).fillMaxHeight()) { previewContent() }
                VerticalDivider()
                Box(Modifier.weight(1f).fillMaxHeight()) { controlsContent() }
            }
        }
        else -> {
            // Compact / medium flat: stacked single column.
            Column(Modifier.fillMaxSize()) {
                Box(Modifier.weight(1f).fillMaxWidth()) { previewContent() }
                controlsContent()
            }
        }
    }
}
```
