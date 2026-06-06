## Example: Full browse screen with sidebar navigation

A production-style browse screen with a collapsible `NavigationDrawer` sidebar and multiple content rows backed by a Hilt ViewModel.

```kotlin
// BrowseActivity.kt
@AndroidEntryPoint
class TvMainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            AppTvTheme {
                val navController = rememberNavController()
                NavHost(navController = navController, startDestination = Home) {
                    composable<Home> { BrowseScreen(navController = navController) }
                    composable<Detail> { back ->
                        val dest: Detail = back.toRoute()
                        DetailScreen(contentId = dest.contentId, onBack = navController::popBackStack)
                    }
                }
            }
        }
    }
}

@Serializable object Home
@Serializable data class Detail(val contentId: String)

// BrowseScreen.kt
@Composable
fun BrowseScreen(
    navController: NavController,
    viewModel: BrowseViewModel = hiltViewModel()
) {
    val drawerState = rememberDrawerState(DrawerValue.Closed)
    val rows by viewModel.rows.collectAsStateWithLifecycle()

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            AppSidebar(
                navController = navController,
                drawerState = drawerState
            )
        }
    ) {
        TvLazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 48.dp),
            verticalArrangement = Arrangement.spacedBy(32.dp),
            contentPadding = PaddingValues(top = 32.dp, bottom = 64.dp)
        ) {
            item { HeroCarousel(items = viewModel.featured, onSelect = { id ->
                navController.navigate(Detail(id))
            }) }

            items(rows, key = { it.id }) { row ->
                ContentSection(
                    title = row.title,
                    items = row.items,
                    onItemClick = { navController.navigate(Detail(it)) }
                )
            }
        }
    }
}

@Composable
private fun AppSidebar(navController: NavController, drawerState: DrawerState) {
    val sections = listOf("Home", "Movies", "Series", "Kids", "Settings")
    var selected by rememberSaveable { mutableIntStateOf(0) }

    Column(
        modifier = Modifier
            .fillMaxHeight()
            .width(200.dp)
            .background(MaterialTheme.colorScheme.surface)
            .padding(vertical = 24.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        sections.forEachIndexed { index, label ->
            NavigationDrawerItem(
                selected = selected == index,
                onClick = {
                    selected = index
                    // navigate to section or close drawer
                },
                leadingContent = null,
                content = { Text(text = label, style = MaterialTheme.typography.labelLarge) }
            )
        }
    }
}

@Composable
private fun ContentSection(
    title: String,
    items: List<ContentItem>,
    onItemClick: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier) {
        Text(
            text = title,
            style = MaterialTheme.typography.headlineSmall,
            modifier = Modifier.padding(bottom = 12.dp)
        )
        TvLazyRow(
            horizontalArrangement = Arrangement.spacedBy(16.dp),
            pivotOffsets = PivotOffsets(parentFraction = 0.1f),
            contentPadding = PaddingValues(horizontal = 4.dp)
        ) {
            items(items, key = { it.id }) { item ->
                StandardCardContainer(
                    modifier = Modifier.width(180.dp),
                    imageCard = { cardModifier ->
                        Card(
                            onClick = { onItemClick(item.id) },
                            modifier = cardModifier.aspectRatio(16f / 9f)
                        ) {
                            AsyncImage(
                                model = item.thumbnailUrl,
                                contentDescription = item.title,
                                contentScale = ContentScale.Crop,
                                modifier = Modifier.fillMaxSize()
                            )
                        }
                    },
                    title = { Text(item.title, maxLines = 1, overflow = TextOverflow.Ellipsis) }
                )
            }
        }
    }
}
```

## Example: Auto-pausing Carousel with focus awareness

A `Carousel` that auto-advances every 5 seconds but pauses while a D-pad user is actively focused on it, preventing content from changing unexpectedly during navigation.

```kotlin
@Composable
fun HeroCarousel(
    items: List<FeaturedItem>,
    onSelect: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val carouselState = rememberCarouselState()
    var isPaused by remember { mutableStateOf(false) }

    Carousel(
        itemCount = items.size,
        carouselState = carouselState,
        autoScrollDurationMillis = if (isPaused) Long.MAX_VALUE else 5_000L,
        modifier = modifier
            .fillMaxWidth()
            .height(380.dp)
            .onFocusChanged { state -> isPaused = state.hasFocus }
            .focusable(),
        carouselIndicator = {
            CarouselDefaults.IndicatorRow(
                itemCount = items.size,
                activeItemIndex = carouselState.activeItemIndex,
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(16.dp)
            )
        }
    ) { index ->
        val item = items[index]
        Box(modifier = Modifier.fillMaxSize()) {
            AsyncImage(
                model = item.backdropUrl,
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )
            // Gradient overlay for text legibility
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.horizontalGradient(
                            listOf(Color.Black.copy(alpha = 0.7f), Color.Transparent)
                        )
                    )
            )
            Column(
                modifier = Modifier
                    .align(Alignment.CenterStart)
                    .padding(start = 48.dp)
            ) {
                Text(
                    text = item.title,
                    style = MaterialTheme.typography.displaySmall,
                    color = Color.White
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = item.synopsis,
                    style = MaterialTheme.typography.bodyLarge,
                    color = Color.White.copy(alpha = 0.85f),
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.fillMaxWidth(0.5f)
                )
                Spacer(modifier = Modifier.height(24.dp))
                Button(onClick = { onSelect(item.id) }) {
                    Text("Watch Now")
                }
            }
        }
    }
}
```

## Example: Detail screen with focus-restoring action row and related content

A detail screen with a blurred background, metadata card, an action button row that restores focus correctly on re-entry, and a lazy row of related titles.

```kotlin
@Composable
fun DetailScreen(
    contentId: String,
    onBack: () -> Unit,
    viewModel: DetailViewModel = hiltViewModel()
) {
    val detail by viewModel.detail.collectAsStateWithLifecycle()
    val related by viewModel.related.collectAsStateWithLifecycle()

    BackHandler(onBack = onBack)

    Box(modifier = Modifier.fillMaxSize()) {
        // Full-bleed backdrop
        detail?.let {
            AsyncImage(
                model = it.backdropUrl,
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.55f))
            )
        }

        TvLazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 64.dp),
            contentPadding = PaddingValues(vertical = 48.dp),
            verticalArrangement = Arrangement.spacedBy(32.dp)
        ) {
            item {
                detail?.let { d ->
                    Column {
                        Text(
                            text = d.title,
                            style = MaterialTheme.typography.displaySmall,
                            color = Color.White
                        )
                        Spacer(Modifier.height(8.dp))
                        Text(
                            text = "${d.year}  •  ${d.rating}  •  ${d.runtime}",
                            style = MaterialTheme.typography.bodyMedium,
                            color = Color.White.copy(alpha = 0.7f)
                        )
                        Spacer(Modifier.height(16.dp))
                        Text(
                            text = d.synopsis,
                            style = MaterialTheme.typography.bodyLarge,
                            color = Color.White.copy(alpha = 0.85f),
                            maxLines = 4,
                            modifier = Modifier.fillMaxWidth(0.55f)
                        )
                        Spacer(Modifier.height(24.dp))
                        // Focus-restoring action row
                        ActionRow(
                            onWatch = { viewModel.play(d.id) },
                            onAddToList = { viewModel.addToList(d.id) },
                            onTrailer = { viewModel.playTrailer(d.id) }
                        )
                    }
                }
            }

            if (related.isNotEmpty()) {
                item {
                    Text(
                        text = "More Like This",
                        style = MaterialTheme.typography.headlineSmall,
                        color = Color.White,
                        modifier = Modifier.padding(bottom = 12.dp)
                    )
                    TvLazyRow(
                        horizontalArrangement = Arrangement.spacedBy(16.dp),
                        contentPadding = PaddingValues(horizontal = 4.dp)
                    ) {
                        items(related, key = { it.id }) { item ->
                            StandardCardContainer(
                                modifier = Modifier.width(160.dp),
                                imageCard = { cardMod ->
                                    Card(
                                        onClick = { viewModel.navigateTo(item.id) },
                                        modifier = cardMod.aspectRatio(2f / 3f)
                                    ) {
                                        AsyncImage(
                                            model = item.posterUrl,
                                            contentDescription = item.title,
                                            contentScale = ContentScale.Crop,
                                            modifier = Modifier.fillMaxSize()
                                        )
                                    }
                                },
                                title = { Text(item.title, maxLines = 1) }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ActionRow(
    onWatch: () -> Unit,
    onAddToList: () -> Unit,
    onTrailer: () -> Unit
) {
    // focusRestorer() ensures D-pad re-entry returns to the last focused button
    Row(
        modifier = Modifier.focusRestorer(),
        horizontalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Button(onClick = onWatch) { Text("Watch Now") }
        OutlinedButton(onClick = onAddToList) { Text("Add to List") }
        OutlinedButton(onClick = onTrailer) { Text("Trailer") }
    }
}
```

## Example: Migrating a Leanback BrowseSupportFragment to Compose

Step-by-step replacement of a Leanback Fragment with a Compose browse screen, keeping the rest of the app intact during the transition.

```kotlin
// Before: Leanback Fragment (being removed)
// class LeanbackBrowseFragment : BrowseSupportFragment() { ... }

// After Step 1: thin Fragment shell that hosts Compose (transitional)
@AndroidEntryPoint
class BrowseFragment : Fragment() {
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ) = ComposeView(requireContext()).apply {
        setViewCompositionStrategy(
            ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed
        )
        setContent {
            AppTvTheme {
                BrowseScreen(
                    navController = findNavController()
                )
            }
        }
    }
}

// After Step 2 (final): replace Activity setContent directly, no Fragment
@AndroidEntryPoint
class TvMainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // No Leanback theme required; use standard AppCompat or Material3
        setContent {
            AppTvTheme {
                val navController = rememberNavController()
                NavHost(navController, startDestination = Home) {
                    composable<Home> { BrowseScreen(navController) }
                    composable<Detail> { back ->
                        DetailScreen(
                            contentId = back.toRoute<Detail>().contentId,
                            onBack = navController::popBackStack
                        )
                    }
                }
            }
        }
    }
}

// AppTvTheme — wraps tv-material MaterialTheme
@Composable
fun AppTvTheme(
    isInDarkTheme: Boolean = true, // TV almost always uses dark theme
    content: @Composable () -> Unit
) {
    // androidx.tv.material3.MaterialTheme, not phone Material3
    MaterialTheme(
        colorScheme = if (isInDarkTheme) darkColorScheme(
            primary = Color(0xFF90CAF9),
            onPrimary = Color(0xFF003258),
            background = Color(0xFF121212),
            surface = Color(0xFF1E1E1E)
        ) else lightColorScheme(),
        content = content
    )
}
```

Remove the Leanback dependency from `build.gradle.kts` once all Fragments have been replaced:

```kotlin
// Remove when migration is complete:
// implementation("androidx.leanback:leanback:1.2.0")

// Keep (TV Compose):
implementation("androidx.tv:tv-material:1.0.0")
```
