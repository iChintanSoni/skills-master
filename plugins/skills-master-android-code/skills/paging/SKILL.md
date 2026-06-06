---
name: paging
description: Covers Paging 3 for Android — PagingSource, RemoteMediator, Pager, PagingData Flow, collectAsLazyPagingItems in Compose, load states and retry, separators and transformations, and combining network with Room as the source of truth. Use when displaying large or infinite scrolling lists from a network API, a local database, or both, in a Jetpack Compose UI.
---

## When to use

Reach for Paging 3 whenever a list could grow large enough that loading everything at once would waste memory, exhaust bandwidth, or visibly stall the UI. Common cases include a social feed, a product catalogue, search results, a message history, or any cursor- or page-keyed API. Paging 3 handles the mechanics of loading, caching, retrying, and combining network with a Room database so the rest of the codebase deals only in typed, reactive `PagingData` flows.

If the total dataset is small and bounded (under a few hundred items), a plain `Flow<List<T>>` from a Room DAO is simpler and requires no paging overhead.

## Core guidance

### PagingSource — network-only data

`PagingSource<Key, Value>` is the fundamental loading unit. Implement `load()` to fetch one page and return a `LoadResult`.

- Use `LoadResult.Page` on success; include `prevKey = null` for the first page.
- Use `LoadResult.Error` to propagate exceptions — Paging surfaces them through load states so the UI can show a retry action.
- `getRefreshKey()` tells Paging where to restart after an invalidation (e.g. a pull-to-refresh). Return the anchor page's key so the list does not snap back to the top.

```kotlin
class ArticlePagingSource(
    private val api: NewsApi,
) : PagingSource<Int, Article>() {

    override fun getRefreshKey(state: PagingState<Int, Article>): Int? =
        state.anchorPosition?.let { anchor ->
            state.closestPageToPosition(anchor)?.run {
                prevKey?.plus(1) ?: nextKey?.minus(1)
            }
        }

    override suspend fun load(params: LoadParams<Int>): LoadResult<Int, Article> {
        val page = params.key ?: 1
        return try {
            val response = api.articles(page = page, pageSize = params.loadSize)
            LoadResult.Page(
                data = response.items,
                prevKey = if (page == 1) null else page - 1,
                nextKey = if (response.items.isEmpty()) null else page + 1,
            )
        } catch (e: Exception) {
            LoadResult.Error(e)
        }
    }
}
```

### Pager and PagingData Flow

`Pager` wires a `PagingSource` factory to a `PagingConfig` and exposes a `Flow<PagingData<T>>`.

- Set `pageSize` to roughly what fits two or three screen-heights — 20–30 items is common.
- Set `prefetchDistance` to trigger loading before the user reaches the last visible item. The default equals `pageSize`.
- `enablePlaceholders = false` is the typical choice in Compose; placeholders require knowing the total count up front.
- Call `.cachedIn(viewModelScope)` in the ViewModel so the `PagingData` survives recomposition and screen rotation without re-fetching.

```kotlin
// In the ViewModel
val articles: Flow<PagingData<Article>> = Pager(
    config = PagingConfig(pageSize = 25, enablePlaceholders = false),
    pagingSourceFactory = { ArticlePagingSource(api) },
).flow
    .cachedIn(viewModelScope)
```

### collectAsLazyPagingItems in Compose

- Call `pagingFlow.collectAsLazyPagingItems()` in the composable to get a `LazyPagingItems<T>`.
- Pass `items` to `LazyColumn`/`LazyVerticalGrid` using the `items(lazyItems)` extension (from `androidx.paging:paging-compose`).
- Drive load-state UI — header/footer spinners and error banners — from `lazyItems.loadState`.

```kotlin
@Composable
fun ArticleFeed(viewModel: ArticleViewModel = hiltViewModel()) {
    val items = viewModel.articles.collectAsLazyPagingItems()

    LazyColumn {
        items(items, key = { it.id }) { article ->
            if (article != null) ArticleCard(article) else ArticlePlaceholder()
        }
        // Append load state footer
        item {
            when (val append = items.loadState.append) {
                is LoadState.Loading -> CircularProgressIndicator(Modifier.fillMaxWidth())
                is LoadState.Error   -> RetryButton(onClick = { items.retry() })
                else                 -> Unit
            }
        }
    }

    // Full-screen refresh error
    if (items.loadState.refresh is LoadState.Error) {
        ErrorScreen(onRetry = { items.refresh() })
    }
}
```

### RemoteMediator — network plus Room as source of truth

`RemoteMediator` sits between the network and the Room database: it fetches pages from the API, writes them to Room, and lets a Room-backed `PagingSource` drive the UI. This gives offline support and a single source of truth for free.

- Override `load(loadType: LoadType, state: PagingState<Key, Value>)`.
- `LoadType.REFRESH` means the user is starting fresh (app launch or pull-to-refresh); `APPEND` / `PREPEND` mean the list is scrolling toward the end or beginning.
- Return `MediatorResult.Success(endOfPaginationReached = ...)` or `MediatorResult.Error(throwable)`.
- Store the remote key (next cursor or next page number) in a separate Room table keyed by the entity type so it survives process death.
- In `Pager`, supply the `remoteMediator` parameter alongside the Room-backed `pagingSourceFactory`.

```kotlin
@OptIn(ExperimentalPagingApi::class)
class ArticleRemoteMediator(
    private val api: NewsApi,
    private val db: AppDatabase,
) : RemoteMediator<Int, ArticleEntity>() {

    override suspend fun load(
        loadType: LoadType,
        state: PagingState<Int, ArticleEntity>,
    ): MediatorResult {
        val page = when (loadType) {
            LoadType.REFRESH  -> 1
            LoadType.PREPEND  -> return MediatorResult.Success(endOfPaginationReached = true)
            LoadType.APPEND   -> {
                val remoteKey = db.remoteKeyDao().getKey("articles")
                    ?: return MediatorResult.Success(endOfPaginationReached = true)
                remoteKey.nextPage
            }
        }
        return try {
            val response = api.articles(page = page, pageSize = state.config.pageSize)
            db.withTransaction {
                if (loadType == LoadType.REFRESH) {
                    db.articleDao().clearAll()
                    db.remoteKeyDao().clearKey("articles")
                }
                db.articleDao().insertAll(response.items.map { it.toEntity() })
                db.remoteKeyDao().insert(
                    RemoteKey(label = "articles", nextPage = if (response.items.isEmpty()) null else page + 1)
                )
            }
            MediatorResult.Success(endOfPaginationReached = response.items.isEmpty())
        } catch (e: Exception) {
            MediatorResult.Error(e)
        }
    }
}

// Pager with RemoteMediator
val articles: Flow<PagingData<Article>> = Pager(
    config = PagingConfig(pageSize = 25, enablePlaceholders = false),
    remoteMediator = ArticleRemoteMediator(api, db),
    pagingSourceFactory = { db.articleDao().pagingSource() },
).flow.cachedIn(viewModelScope)
```

The Room DAO returns the `PagingSource` directly:

```kotlin
@Dao
interface ArticleDao {
    @Query("SELECT * FROM articles ORDER BY publishedAt DESC")
    fun pagingSource(): PagingSource<Int, ArticleEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(articles: List<ArticleEntity>)

    @Query("DELETE FROM articles")
    suspend fun clearAll()
}
```

### Separators and header/footer transformations

Use `PagingData.insertSeparators` to inject synthetic items (section headers, date dividers) between real items — no changes to the data layer needed.

```kotlin
val withDateHeaders: Flow<PagingData<ArticleUiItem>> = articles
    .map { pagingData ->
        pagingData
            .map { ArticleUiItem.Item(it) }
            .insertSeparators { before, after ->
                if (after == null) return@insertSeparators null  // end of list
                if (before == null || before.article.date != after.article.date)
                    ArticleUiItem.Header(after.article.date)
                else null
            }
    }
    .cachedIn(viewModelScope)
```

Use a sealed class for `ArticleUiItem` so `LazyColumn` can render both rows and headers with `key` and `contentType` parameters to aid Compose's diffing.

### Load states and retry

`LazyPagingItems.loadState` is a `CombinedLoadStates` with three typed slots:

| Slot | When |
|---|---|
| `refresh` | Initial load or pull-to-refresh |
| `append`  | Loading the next page at the bottom |
| `prepend` | Loading the previous page at the top |

- Check `loadState.refresh is LoadState.Loading` for a full-screen skeleton or spinner on first load.
- Check `loadState.append is LoadState.Error` to show a footer retry button.
- `items.retry()` retries the last failed load; `items.refresh()` triggers a full refresh from page one.
- Avoid checking `loadState.source` vs `loadState.mediator` individually unless you need to distinguish network errors from local cache errors in a `RemoteMediator` flow.

### Transformations

All `PagingData` transformations must happen in the `ViewModel` (before `cachedIn`) or in a `map` on the flow — never inside the composable. Transformations after `cachedIn` are not cached.

- `pagingData.map { it.toUiModel() }` — per-item mapping.
- `pagingData.filter { it.isVisible }` — item filtering (use sparingly; filtered pages may appear short and trigger spurious appends).
- `pagingData.insertHeaderItem(TerminalSeparatorType.FULLY_COMPLETE, UiItem.Banner)` — add a static header above all pages.

## Platform notes

- **Large screen / foldable:** On wide layouts, `LazyVerticalGrid` with `GridCells.Adaptive(minSize = 200.dp)` works directly with `items(lazyPagingItems)` using the same extension. No special paging changes are needed — the grid simply shows more items per row. Prefetch distance should be increased proportionally (set `prefetchDistance` to `pageSize * 2`).
- **Multi-pane layouts:** When a list and a detail pane are visible simultaneously, scope the `ViewModel` to the `NavBackStackEntry` of the list destination via `hiltViewModel()` so the `PagingData` flow is not recreated when the detail pane updates.
- **Memory pressure:** On low-memory devices, Paging 3's `maxSize` config parameter caps how many items are kept in memory. Set it to `pageSize * 5` or higher to balance smooth scrolling with GC pressure.

## Pitfalls

- **Not calling `.cachedIn(viewModelScope)`** — without it, every new collector (every recomposition or screen rotation) triggers fresh network requests from page one. Always cache.
- **Applying transformations after `cachedIn`** — `map`/`filter`/`insertSeparators` applied downstream of `cachedIn` are not cached and run on every collection. Apply all transformations before the `cachedIn` call.
- **Using a static `PagingSource` instance in `pagingSourceFactory`** — the factory lambda must create a new instance each time it is called. Capturing and reusing one instance prevents Paging from invalidating and reloading correctly.
- **Ignoring `LoadType.PREPEND` in `RemoteMediator`** — most feed APIs do not support prepend; return `MediatorResult.Success(endOfPaginationReached = true)` immediately for `PREPEND` to avoid unnecessary network calls.
- **Missing `@Transaction` in Room when clearing and reinserting on refresh** — a non-atomic clear/insert can leave the database momentarily empty, causing a brief empty-list flash in the UI. Wrap both operations in `db.withTransaction { }`.
- **Using `items.itemCount` to infer end-of-list** — item count changes asynchronously. Rely on `loadState.append.endOfPaginationReached` instead.
- **Not providing a `key` lambda in `items(lazyPagingItems, key = { it.id })`** — without stable keys, Compose cannot correctly animate insertions and deletions and may re-render the entire visible list on each append.
- **Checking `loadState.refresh is LoadState.NotLoading` to detect an empty result** — this fires every time; also check `items.itemCount == 0` to distinguish an empty result from the initial not-yet-loaded state.
- **`@OptIn(ExperimentalPagingApi::class)` missing on `RemoteMediator`** — `RemoteMediator` is still experimental API; without the opt-in the build will fail.

## References

- **Documentation:** [Paging 3 overview](https://developer.android.com/topic/libraries/architecture/paging/v3-overview)
- **Documentation:** [Load and display paged data](https://developer.android.com/topic/libraries/architecture/paging/v3-paged-data)

## See also

For the local database backing a `RemoteMediator`, see the `room` skill. For injecting `ViewModel` instances that expose the paging flow into Compose screens, see `hilt-di`. For overall architecture of repositories and data layers, see the `networking-layer` skill. For adaptive grid and list layouts that consume `LazyPagingItems`, see the `adaptive-layouts` skill.
