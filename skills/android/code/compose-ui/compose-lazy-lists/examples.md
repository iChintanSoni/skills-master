## Basic LazyColumn with keys and animations

A simple news feed demonstrating per-item keys, `contentType` for heterogeneous rows, and `Modifier.animateItem()`.

```kotlin
@Composable
fun ArticleFeed(viewModel: ArticleViewModel = hiltViewModel()) {
    val articles by viewModel.articles.collectAsStateWithLifecycle()

    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        items(
            items = articles,
            key = { it.id },
            contentType = { article ->
                when {
                    article.isBanner -> "banner"
                    article.isSponsored -> "sponsored"
                    else -> "default"
                }
            },
        ) { article ->
            when {
                article.isBanner -> BannerCard(article, Modifier.animateItem())
                article.isSponsored -> SponsoredRow(article, Modifier.animateItem())
                else -> ArticleRow(article, Modifier.animateItem())
            }
        }
    }
}
```

## Programmatic scroll with derivedStateOf scroll-to-top button

```kotlin
@Composable
fun ProductList(products: List<Product>) {
    val listState = rememberLazyListState()
    val coroutineScope = rememberCoroutineScope()

    // derivedStateOf prevents recomposition on every scroll pixel
    val isScrolled by remember {
        derivedStateOf { listState.firstVisibleItemIndex > 0 }
    }

    Scaffold(
        floatingActionButton = {
            AnimatedVisibility(visible = isScrolled) {
                SmallFloatingActionButton(
                    onClick = {
                        coroutineScope.launch {
                            listState.animateScrollToItem(index = 0)
                        }
                    }
                ) {
                    Icon(Icons.Filled.KeyboardArrowUp, contentDescription = "Back to top")
                }
            }
        }
    ) { innerPadding ->
        LazyColumn(
            state = listState,
            contentPadding = innerPadding,
            verticalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.fillMaxSize(),
        ) {
            items(products, key = { it.sku }) { product ->
                ProductCard(product = product, modifier = Modifier.animateItem())
            }
        }
    }
}
```

## Adaptive grid for large-screen support

Uses `LazyVerticalGrid` with `Adaptive` columns, sticky section headers inside a grid via `span`, and `WindowSizeClass` awareness.

```kotlin
@Composable
fun PhotoGallery(
    photos: List<Photo>,
    windowSizeClass: WindowSizeClass,
) {
    val minCellSize = if (windowSizeClass.widthSizeClass >= WindowWidthSizeClass.Expanded) {
        200.dp
    } else {
        150.dp
    }

    LazyVerticalGrid(
        columns = GridCells.Adaptive(minSize = minCellSize),
        contentPadding = PaddingValues(8.dp),
        horizontalArrangement = Arrangement.spacedBy(4.dp),
        verticalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        // Full-width section label
        item(span = { GridItemSpan(maxLineSpan) }) {
            Text(
                text = "Recents",
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            )
        }

        items(photos, key = { it.uri.toString() }) { photo ->
            AsyncImage(
                model = photo.uri,
                contentDescription = photo.caption,
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .aspectRatio(1f)
                    .clip(RoundedCornerShape(8.dp))
                    .animateItem(),
            )
        }
    }
}
```

## Paging 3 integration with load-state handling

```kotlin
@Composable
fun PaginatedSearchResults(viewModel: SearchViewModel = hiltViewModel()) {
    val pagingItems = viewModel.searchResults.collectAsLazyPagingItems()

    LazyColumn(
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        // Initial full-screen loading
        when (val refresh = pagingItems.loadState.refresh) {
            is LoadState.Loading -> item { FullScreenLoader() }
            is LoadState.Error -> item {
                ErrorMessage(
                    message = refresh.error.localizedMessage ?: "Unknown error",
                    onRetry = { pagingItems.retry() },
                )
            }
            is LoadState.NotLoading -> Unit
        }

        items(
            count = pagingItems.itemCount,
            key = pagingItems.itemKey { it.id },
            contentType = pagingItems.itemContentType { "result" },
        ) { index ->
            val item = pagingItems[index]
            if (item != null) {
                SearchResultRow(item = item, modifier = Modifier.animateItem())
            } else {
                SearchResultPlaceholder()
            }
        }

        // Append spinner at list bottom
        when (pagingItems.loadState.append) {
            is LoadState.Loading -> item { Box(Modifier.fillMaxWidth()) { CircularProgressIndicator(Modifier.align(Alignment.Center)) } }
            is LoadState.Error -> item {
                TextButton(onClick = { pagingItems.retry() }, Modifier.fillMaxWidth()) {
                    Text("Retry")
                }
            }
            is LoadState.NotLoading -> Unit
        }
    }
}
```
