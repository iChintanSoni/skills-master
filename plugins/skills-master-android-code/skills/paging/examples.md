### Example 1 — Network-only infinite scroll

A news feed that pages through an API with no local cache.

```kotlin
// build.gradle.kts (app)
// implementation("androidx.paging:paging-runtime:3.3.6")
// implementation("androidx.paging:paging-compose:3.3.6")

// --- API model ---
data class Article(val id: Long, val title: String, val date: LocalDate)

// --- PagingSource ---
class ArticlePagingSource(private val api: NewsApi) : PagingSource<Int, Article>() {
    override fun getRefreshKey(state: PagingState<Int, Article>): Int? =
        state.anchorPosition?.let { anchor ->
            state.closestPageToPosition(anchor)?.run {
                prevKey?.plus(1) ?: nextKey?.minus(1)
            }
        }

    override suspend fun load(params: LoadParams<Int>): LoadResult<Int, Article> {
        val page = params.key ?: 1
        return try {
            val items = api.articles(page = page, pageSize = params.loadSize)
            LoadResult.Page(
                data = items,
                prevKey = if (page == 1) null else page - 1,
                nextKey = if (items.isEmpty()) null else page + 1,
            )
        } catch (e: Exception) {
            LoadResult.Error(e)
        }
    }
}

// --- ViewModel ---
@HiltViewModel
class ArticleViewModel @Inject constructor(
    private val api: NewsApi,
) : ViewModel() {
    val articles: Flow<PagingData<Article>> = Pager(
        config = PagingConfig(pageSize = 25, enablePlaceholders = false),
        pagingSourceFactory = { ArticlePagingSource(api) },
    ).flow.cachedIn(viewModelScope)
}

// --- Compose UI ---
@Composable
fun ArticleFeed(vm: ArticleViewModel = hiltViewModel()) {
    val items = vm.articles.collectAsLazyPagingItems()

    if (items.loadState.refresh is LoadState.Loading && items.itemCount == 0) {
        FullScreenLoading()
        return
    }

    LazyColumn {
        items(items, key = { it.id }) { article ->
            article?.let { ArticleRow(it) }
        }
        item {
            when (val state = items.loadState.append) {
                is LoadState.Loading -> LinearProgressIndicator(Modifier.fillMaxWidth())
                is LoadState.Error   -> TextButton(onClick = { items.retry() }) {
                    Text("Retry")
                }
                else -> Unit
            }
        }
    }
}
```

### Example 2 — Offline-first with RemoteMediator and Room

A product catalogue that stores pages in Room so the list is available offline, and fetches fresh data from the network in the background.

```kotlin
// --- Room entities and DAOs ---
@Entity(tableName = "products")
data class ProductEntity(
    @PrimaryKey val id: Long,
    val name: String,
    val price: Double,
)

@Entity(tableName = "remote_keys")
data class RemoteKey(
    @PrimaryKey val label: String,
    val nextPage: Int?,
)

@Dao
interface ProductDao {
    @Query("SELECT * FROM products ORDER BY name ASC")
    fun pagingSource(): PagingSource<Int, ProductEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(products: List<ProductEntity>)

    @Query("DELETE FROM products")
    suspend fun clearAll()
}

@Dao
interface RemoteKeyDao {
    @Query("SELECT * FROM remote_keys WHERE label = :label")
    suspend fun getKey(label: String): RemoteKey?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(key: RemoteKey)

    @Query("DELETE FROM remote_keys WHERE label = :label")
    suspend fun clearKey(label: String)
}

// --- RemoteMediator ---
@OptIn(ExperimentalPagingApi::class)
class ProductRemoteMediator(
    private val api: ProductApi,
    private val db: AppDatabase,
) : RemoteMediator<Int, ProductEntity>() {

    override suspend fun load(
        loadType: LoadType,
        state: PagingState<Int, ProductEntity>,
    ): MediatorResult {
        val page = when (loadType) {
            LoadType.REFRESH  -> 1
            LoadType.PREPEND  -> return MediatorResult.Success(endOfPaginationReached = true)
            LoadType.APPEND   -> db.remoteKeyDao().getKey("products")?.nextPage
                ?: return MediatorResult.Success(endOfPaginationReached = true)
        }
        return try {
            val items = api.products(page = page, pageSize = state.config.pageSize)
            db.withTransaction {
                if (loadType == LoadType.REFRESH) {
                    db.productDao().clearAll()
                    db.remoteKeyDao().clearKey("products")
                }
                db.productDao().insertAll(items.map { it.toEntity() })
                db.remoteKeyDao().insert(
                    RemoteKey("products", if (items.isEmpty()) null else page + 1)
                )
            }
            MediatorResult.Success(endOfPaginationReached = items.isEmpty())
        } catch (e: Exception) {
            MediatorResult.Error(e)
        }
    }
}

// --- ViewModel ---
@HiltViewModel
class ProductViewModel @Inject constructor(
    private val api: ProductApi,
    private val db: AppDatabase,
) : ViewModel() {
    @OptIn(ExperimentalPagingApi::class)
    val products: Flow<PagingData<ProductEntity>> = Pager(
        config = PagingConfig(pageSize = 30, enablePlaceholders = false),
        remoteMediator = ProductRemoteMediator(api, db),
        pagingSourceFactory = { db.productDao().pagingSource() },
    ).flow.cachedIn(viewModelScope)
}
```

### Example 3 — Separators and sealed UI model

Inserting date-section headers between articles without touching the data layer.

```kotlin
sealed class ArticleUiItem {
    data class Item(val article: Article) : ArticleUiItem()
    data class Header(val date: LocalDate) : ArticleUiItem()
}

// In ViewModel — transform before cachedIn
val articlesWithHeaders: Flow<PagingData<ArticleUiItem>> = Pager(
    config = PagingConfig(pageSize = 25, enablePlaceholders = false),
    pagingSourceFactory = { ArticlePagingSource(api) },
).flow
    .map { pagingData ->
        pagingData
            .map { ArticleUiItem.Item(it) as ArticleUiItem }
            .insertSeparators { before, after ->
                if (after == null) null
                else if (before == null || (before as? ArticleUiItem.Item)?.article?.date != (after as ArticleUiItem.Item).article.date)
                    ArticleUiItem.Header(after.article.date)
                else null
            }
    }
    .cachedIn(viewModelScope)

// In Compose
LazyColumn {
    items(
        items = lazyItems,
        key = { item -> when (item) {
            is ArticleUiItem.Item   -> "item-${item.article.id}"
            is ArticleUiItem.Header -> "header-${item.date}"
        }},
        contentType = { item -> item::class },
    ) { item ->
        when (item) {
            is ArticleUiItem.Item   -> ArticleRow(item.article)
            is ArticleUiItem.Header -> DateHeader(item.date)
            null                    -> ArticlePlaceholder()
        }
    }
}
```
