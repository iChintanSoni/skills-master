## Example: Single-activity app with Subspace and Orbiter

A minimal XR-aware `MainActivity` that renders the same `HomeScreen` composable in both 2D (for non-XR devices) and inside a `SpatialPanel` (for XR), with a bottom `Orbiter` carrying the navigation bar.

```kotlin
@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            AppTheme {
                // 2D tree — always visible; handles phones, tablets, and home-space XR
                Scaffold(
                    bottomBar = { AppNavigationBar() }
                ) { padding ->
                    HomeScreen(Modifier.padding(padding))
                }

                // Spatial layer — silently no-ops on non-XR and in home-space
                // when spatialization is unavailable
                Subspace {
                    SpatialPanel(
                        SubspaceModifier
                            .width(1400.dp)
                            .height(900.dp)
                            .resizable()
                            .transformingMovable()
                            .curveRadius(825.dp)
                    ) {
                        // Reuse the same stateless screen composable — no XR-specific code inside
                        HomeScreen(Modifier.fillMaxSize())
                    }

                    // Navigation bar floats below the panel in 3D
                    Orbiter(
                        anchorPoint = OrbiterAnchorPoint.Bottom,
                        offset = DpVolumeOffset(y = 72.dp)
                    ) {
                        Surface(shape = RoundedCornerShape(50)) {
                            AppNavigationBar()
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun AppNavigationBar() {
    NavigationBar {
        NavigationBarItem(
            selected = true,
            onClick = {},
            icon = { Icon(Icons.Default.Home, contentDescription = "Home") },
            label = { Text("Home") }
        )
        NavigationBarItem(
            selected = false,
            onClick = {},
            icon = { Icon(Icons.Default.Search, contentDescription = "Explore") },
            label = { Text("Explore") }
        )
    }
}
```

The `HomeScreen` composable is completely unaware of XR — it is a plain Compose screen driven by a `ViewModel`. The `Scaffold` in the 2D tree handles the phone/tablet case; the `SpatialPanel` + `Orbiter` handle the XR case.

---

## Example: Multi-panel list-detail layout in SpatialRow

Adapting a two-pane list-detail layout to XR by placing the list and detail in side-by-side `SpatialPanel` instances sharing a single `ViewModel`.

```kotlin
@Composable
fun ArticleListDetailSubspace(viewModel: ArticleViewModel) {
    val selectedArticle by viewModel.selectedArticle.collectAsStateWithLifecycle()

    Subspace {
        SpatialRow(
            spatialArrangement = SpatialArrangement.SpacedBy(16.dp)
        ) {
            // List panel — narrower, always visible
            SpatialPanel(
                SubspaceModifier
                    .width(500.dp)
                    .height(900.dp)
                    .resizable()
            ) {
                ArticleListScreen(
                    onArticleSelected = viewModel::selectArticle
                )
            }

            // Detail panel — wider, shows when an article is selected
            SpatialPanel(
                SubspaceModifier
                    .width(900.dp)
                    .height(900.dp)
                    .resizable()
                    .transformingMovable()
            ) {
                if (selectedArticle != null) {
                    ArticleDetailScreen(article = selectedArticle!!)
                } else {
                    EmptyDetailPlaceholder()
                }
            }

            // Action orbiter anchored to the detail panel's bottom edge
            Orbiter(
                anchorPoint = OrbiterAnchorPoint.Bottom,
                offset = DpVolumeOffset(y = 56.dp)
            ) {
                Surface(
                    shape = RoundedCornerShape(50),
                    tonalElevation = 3.dp
                ) {
                    Row(
                        Modifier.padding(horizontal = 24.dp, vertical = 12.dp),
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        FilledTonalIconButton(onClick = viewModel::bookmarkCurrent) {
                            Icon(Icons.Default.BookmarkBorder, "Bookmark")
                        }
                        FilledTonalIconButton(onClick = viewModel::shareCurrent) {
                            Icon(Icons.Default.Share, "Share")
                        }
                    }
                }
            }
        }
    }
}
```

Both panels observe the same `ArticleViewModel` instance. State is not passed directly between panel composables.

---

## Example: Requesting full-space mode with a capability check

An onboarding screen that checks whether full-space mode is available, shows an explanatory prompt, then switches mode on user confirmation.

```kotlin
@Composable
fun ImmersiveModeOnboarding(
    onEnterImmersive: () -> Unit,
    onDismiss: () -> Unit
) {
    val session = LocalSession.current
    val canEnterFullSpace = remember(session) {
        session?.getSpatialCapabilities()
            ?.hasCapability(SpatialCapabilities.CAPABILITY_3D_CONTENT) == true
    }

    if (!canEnterFullSpace) {
        // Device or current context does not support full space — show nothing
        LaunchedEffect(Unit) { onDismiss() }
        return
    }

    SpatialDialog(
        onDismissRequest = onDismiss,
        SpatialDialogProperties(dismissOnBackPress = true)
    ) {
        Column(
            Modifier.padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "Enter immersive mode?",
                style = MaterialTheme.typography.headlineSmall
            )
            Text(
                text = "This hides other apps and fills your view with the experience. " +
                       "You can exit at any time.",
                style = MaterialTheme.typography.bodyMedium
            )
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.End),
                modifier = Modifier.fillMaxWidth()
            ) {
                TextButton(onClick = onDismiss) { Text("Not now") }
                Button(onClick = {
                    // Request happens outside the composable via a callback so
                    // the ViewModel/Activity owns the session reference
                    onEnterImmersive()
                }) {
                    Text("Enter")
                }
            }
        }
    }
}

// In the Activity / ViewModel:
fun requestImmersive(session: Session?) {
    viewModelScope.launch {
        session?.requestFullSpaceMode()
    }
}

fun exitImmersive(session: Session?) {
    viewModelScope.launch {
        session?.requestHomeSpaceMode()
    }
}
```

The capability check uses `SpatialCapabilities` rather than hardcoding device type. `SpatialDialog` falls back to a standard `Dialog` on non-XR devices, so no conditional wrapping is needed.

---

## Example: SpatialElevation and PlanarEmbeddedSubspace for a floating badge

Using `SpatialElevation` to lift a notification badge above a card surface, and `PlanarEmbeddedSubspace` to place a small 3D object that participates in 2D layout constraints.

```kotlin
@Composable
fun SpatialArticleCard(
    article: Article,
    modifier: Modifier = Modifier
) {
    Box(modifier = modifier) {
        // The card itself uses SpatialElevation to lift off the panel surface
        SpatialElevation(
            spatialElevationLevel = SpatialElevationLevel.Level2
        ) {
            Card(
                Modifier
                    .fillMaxWidth()
                    .padding(8.dp)
            ) {
                Column(Modifier.padding(16.dp)) {
                    Text(
                        text = article.title,
                        style = MaterialTheme.typography.titleMedium
                    )
                    Text(
                        text = article.summary,
                        style = MaterialTheme.typography.bodySmall,
                        maxLines = 3,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
        }

        // A "new" badge further elevated above the card using a higher level
        if (article.isNew) {
            SpatialElevation(
                spatialElevationLevel = SpatialElevationLevel.Level4,
                modifier = Modifier.align(Alignment.TopEnd).padding(4.dp)
            ) {
                Surface(
                    shape = CircleShape,
                    color = MaterialTheme.colorScheme.tertiaryContainer
                ) {
                    Text(
                        text = "NEW",
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onTertiaryContainer
                    )
                }
            }
        }
    }
}
```

`SpatialElevation` composables stack correctly within the same panel's depth budget. On non-XR devices they render flat, so the 2D fallback is automatic and correct.
