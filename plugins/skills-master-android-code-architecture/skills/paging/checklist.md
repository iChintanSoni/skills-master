## Paging implementation checklist

### PagingSource
- [ ] `getRefreshKey()` returns the anchor page key, not always `null` (to avoid scroll-to-top on refresh)
- [ ] `load()` returns `LoadResult.Error(e)` in the catch block rather than re-throwing
- [ ] `prevKey` is `null` for the first page only
- [ ] `nextKey` is `null` when the response is empty (signals end of pagination)
- [ ] The factory lambda passed to `Pager` creates a **new** `PagingSource` instance each call

### Pager and Flow setup
- [ ] `PagingConfig(pageSize = ...)` is tuned to roughly 2–3 screen heights of content
- [ ] `enablePlaceholders = false` unless total count is known
- [ ] `.cachedIn(viewModelScope)` is called in the ViewModel, not in the composable
- [ ] All `map`/`filter`/`insertSeparators` transformations appear **before** `cachedIn`

### RemoteMediator (when used)
- [ ] `@OptIn(ExperimentalPagingApi::class)` present on the class
- [ ] `LoadType.PREPEND` returns `MediatorResult.Success(endOfPaginationReached = true)` immediately if the API does not support it
- [ ] `LoadType.REFRESH` clears both the entity table and the remote-key row inside a single `db.withTransaction { }` block
- [ ] Remote keys are stored in a separate Room table, not in-memory
- [ ] `MediatorResult.Error(e)` is returned from the catch block

### Compose UI
- [ ] `collectAsLazyPagingItems()` is called at the composable level, not inside a `remember` block
- [ ] `items(lazyItems, key = { it.stableId })` provides a stable key lambda
- [ ] `contentType` is supplied when mixing sealed UI item types (headers, items, placeholders)
- [ ] Refresh load state (`loadState.refresh is LoadState.Loading`) drives a full-screen skeleton or spinner on first load only (also check `items.itemCount == 0`)
- [ ] Append error state (`loadState.append is LoadState.Error`) shows a footer retry button calling `items.retry()`
- [ ] Pull-to-refresh calls `items.refresh()`

### Separators and transformations
- [ ] Separator logic uses a sealed `UiItem` hierarchy, not nullable items
- [ ] `insertSeparators` lambda returns `null` when no separator is needed
- [ ] Separator items have distinct `contentType` values to avoid Compose recycling row views into headers

### Large-screen / adaptive
- [ ] `LazyVerticalGrid` with `GridCells.Adaptive` is used on wide windows; `prefetchDistance` is scaled up accordingly
- [ ] The paging `ViewModel` is scoped to the list destination back-stack entry (via `hiltViewModel()`), not the host Activity, in a multi-pane layout
