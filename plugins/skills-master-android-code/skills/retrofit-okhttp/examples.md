## Full repository with sealed result, auth interceptor, and token refresh

A realistic `NewsRepository` backed by a Retrofit service, an `AuthInterceptor` that attaches a Bearer token, and an `Authenticator` that refreshes an expired token before retrying.

```kotlin
// --- Token store (in-memory, replace with EncryptedSharedPreferences in prod) ---
class TokenStore @Inject constructor() {
    @Volatile var accessToken: String = ""
    @Volatile var refreshToken: String = ""
}

// --- Auth interceptor: stamps every outgoing request with the current token ---
class AuthInterceptor @Inject constructor(private val tokens: TokenStore) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val original = chain.request()
        val token = tokens.accessToken
        return if (token.isBlank()) {
            chain.proceed(original)
        } else {
            chain.proceed(
                original.newBuilder()
                    .header("Authorization", "Bearer $token")
                    .build()
            )
        }
    }
}

// --- Authenticator: OkHttp calls this automatically on 401 ---
class TokenAuthenticator @Inject constructor(
    private val tokens: TokenStore,
    private val authApi: AuthService,           // separate Retrofit without auth interceptor
) : Authenticator {
    // Guard against infinite refresh loops
    override fun authenticate(route: Route?, response: Response): Request? {
        if (response.request.header("X-Token-Refreshed") != null) return null
        val newToken = runBlocking {
            runCatching { authApi.refresh(tokens.refreshToken) }.getOrNull()
        } ?: return null
        tokens.accessToken = newToken.accessToken
        tokens.refreshToken = newToken.refreshToken
        return response.request.newBuilder()
            .header("Authorization", "Bearer ${newToken.accessToken}")
            .header("X-Token-Refreshed", "true")
            .build()
    }
}

// --- DTOs ---
@Serializable
data class ArticleDto(
    @SerialName("id") val id: String,
    @SerialName("headline") val headline: String,
    @SerialName("body") val body: String,
    @SerialName("published_at") val publishedAt: String,
)

@Serializable
data class TokenDto(
    @SerialName("access_token") val accessToken: String,
    @SerialName("refresh_token") val refreshToken: String,
)

// --- Service interfaces ---
interface NewsService {
    @GET("articles")
    suspend fun listArticles(
        @Query("page") page: Int,
        @Query("per_page") perPage: Int = 20,
    ): List<ArticleDto>

    @GET("articles/{id}")
    suspend fun getArticle(@Path("id") id: String): Response<ArticleDto>
}

interface AuthService {
    @POST("auth/refresh")
    suspend fun refresh(@Body refreshToken: String): TokenDto
}

// --- Domain model ---
data class Article(val id: String, val headline: String, val body: String)

fun ArticleDto.toDomain() = Article(id, headline, body)

// --- Repository ---
sealed interface NewsResult<out T> {
    data class Success<T>(val data: T) : NewsResult<T>
    data class HttpError(val code: Int, val message: String) : NewsResult<Nothing>
    data object NetworkError : NewsResult<Nothing>
}

class NewsRepository @Inject constructor(private val api: NewsService) {

    suspend fun listArticles(page: Int): NewsResult<List<Article>> =
        safeCall { api.listArticles(page).map { it.toDomain() } }

    suspend fun getArticle(id: String): NewsResult<Article> = safeCall {
        val response = api.getArticle(id)
        if (response.isSuccessful) {
            response.body()?.toDomain() ?: error("Empty body for article $id")
        } else {
            // Manually map so the sealed type is HttpError, not a thrown exception
            return NewsResult.HttpError(response.code(), response.message())
        }
    }

    private inline fun <T> safeCall(block: () -> T): NewsResult<T> =
        try {
            NewsResult.Success(block())
        } catch (e: HttpException) {
            NewsResult.HttpError(e.code(), e.message())
        } catch (e: IOException) {
            NewsResult.NetworkError
        }
}
```

## Disk cache with stale-while-revalidate strategy

Configures an OkHttp disk cache and uses `Cache-Control` headers to serve stale content instantly while a background revalidation happens in parallel.

```kotlin
@Module @InstallIn(SingletonComponent::class)
object NetworkModule {

    private const val CACHE_SIZE = 20L * 1024 * 1024  // 20 MB

    @Provides @Singleton
    fun provideCache(@ApplicationContext ctx: Context): Cache =
        Cache(File(ctx.cacheDir, "http_cache"), CACHE_SIZE)

    @Provides @Singleton
    fun provideOkHttpClient(cache: Cache): OkHttpClient =
        OkHttpClient.Builder()
            .cache(cache)
            // Application interceptor: ask the server to use stale-while-revalidate
            .addInterceptor { chain ->
                chain.proceed(
                    chain.request().newBuilder()
                        .header("Cache-Control", "max-age=60, stale-while-revalidate=300")
                        .build()
                )
            }
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build()
}

// In a repository: force network for pull-to-refresh
class FeedRepository @Inject constructor(
    private val api: FeedService,
    private val okHttp: OkHttpClient,
) {
    // Normal call: respects cache headers
    suspend fun getFeed(): List<FeedItem> = api.getFeed()

    // Force fresh: bypasses cache entirely — used for pull-to-refresh
    suspend fun getFeedFresh(): List<FeedItem> {
        val request = okHttp.newCall(
            Request.Builder()
                .url("https://api.example.com/v1/feed")
                .header("Cache-Control", "no-cache")
                .build()
        ).await()  // OkHttp coroutines extension
        return Json.decodeFromString(request.body!!.string())
    }
}
```

## Multipart file upload with progress tracking

Uploads a user-selected image as a multipart form, tracking upload progress via a custom `RequestBody` wrapper.

```kotlin
// --- Progress-tracking RequestBody wrapper ---
class ProgressRequestBody(
    private val delegate: RequestBody,
    private val onProgress: (Int) -> Unit,
) : RequestBody() {
    override fun contentType() = delegate.contentType()
    override fun contentLength() = delegate.contentLength()

    override fun writeTo(sink: BufferedSink) {
        val total = contentLength()
        var uploaded = 0L
        val countingSink = object : ForwardingSink(sink) {
            override fun write(source: Buffer, byteCount: Long) {
                super.write(source, byteCount)
                uploaded += byteCount
                val percent = if (total > 0) (uploaded * 100 / total).toInt() else 0
                onProgress(percent)
            }
        }
        delegate.writeTo(countingSink.buffer())
    }
}

// --- Service ---
interface MediaService {
    @Multipart
    @POST("media/upload")
    suspend fun upload(
        @Part("description") description: RequestBody,
        @Part image: MultipartBody.Part,
    ): UploadResponseDto
}

@Serializable
data class UploadResponseDto(@SerialName("media_url") val mediaUrl: String)

// --- Usage in ViewModel ---
@HiltViewModel
class UploadViewModel @Inject constructor(
    private val api: MediaService,
) : ViewModel() {

    private val _progress = MutableStateFlow(0)
    val progress: StateFlow<Int> = _progress.asStateFlow()

    private val _result = MutableStateFlow<String?>(null)
    val uploadedUrl: StateFlow<String?> = _result.asStateFlow()

    fun upload(uri: Uri, context: Context) {
        viewModelScope.launch {
            val bytes = context.contentResolver.openInputStream(uri)!!.use { it.readBytes() }
            val rawBody = bytes.toRequestBody("image/*".toMediaType())
            val progressBody = ProgressRequestBody(rawBody) { pct -> _progress.value = pct }
            val part = MultipartBody.Part.createFormData("image", "upload.jpg", progressBody)
            val description = "User photo".toRequestBody("text/plain".toMediaType())
            val response = api.upload(description, part)
            _result.value = response.mediaUrl
        }
    }
}
```

## Paginated Flow with Paging 3 and a Retrofit PagingSource

Wires a `PagingSource` backed by a Retrofit endpoint into a `Pager` exposed as a `Flow<PagingData<Article>>`.

```kotlin
// --- PagingSource ---
class ArticlePagingSource(
    private val api: NewsService,
    private val query: String,
) : PagingSource<Int, Article>() {

    override fun getRefreshKey(state: PagingState<Int, Article>): Int? =
        state.anchorPosition?.let { anchor ->
            state.closestPageToPosition(anchor)?.prevKey?.plus(1)
                ?: state.closestPageToPosition(anchor)?.nextKey?.minus(1)
        }

    override suspend fun load(params: LoadParams<Int>): LoadResult<Int, Article> {
        val page = params.key ?: 1
        return try {
            val items = api.searchArticles(query, page, params.loadSize)
            LoadResult.Page(
                data = items.map { it.toDomain() },
                prevKey = if (page == 1) null else page - 1,
                nextKey = if (items.isEmpty()) null else page + 1,
            )
        } catch (e: HttpException) {
            LoadResult.Error(e)
        } catch (e: IOException) {
            LoadResult.Error(e)
        }
    }
}

// --- Repository ---
class PagedNewsRepository @Inject constructor(private val api: NewsService) {
    fun searchArticles(query: String): Flow<PagingData<Article>> =
        Pager(
            config = PagingConfig(pageSize = 20, prefetchDistance = 5),
            pagingSourceFactory = { ArticlePagingSource(api, query) },
        ).flow
}

// --- ViewModel ---
@HiltViewModel
class SearchNewsViewModel @Inject constructor(
    private val repo: PagedNewsRepository,
) : ViewModel() {

    private val _query = MutableStateFlow("")

    val articles: StateFlow<PagingData<Article>> = _query
        .debounce(300)
        .distinctUntilChanged()
        .flatMapLatest { query -> repo.searchArticles(query) }
        .cachedIn(viewModelScope)
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), PagingData.empty())

    fun onQueryChanged(q: String) { _query.value = q }
}

// --- Composable ---
@Composable
fun SearchNewsScreen(vm: SearchNewsViewModel = hiltViewModel()) {
    val query by vm._query.collectAsStateWithLifecycle()
    val articles = vm.articles.collectAsLazyPagingItems()

    Column {
        TextField(value = query, onValueChange = vm::onQueryChanged, label = { Text("Search") })
        LazyColumn {
            items(articles, key = { it.id }) { article ->
                article?.let { Text(it.headline, modifier = Modifier.fillMaxWidth().padding(16.dp)) }
            }
            if (articles.loadState.append is LoadState.Loading) {
                item { CircularProgressIndicator(modifier = Modifier.fillMaxWidth().padding(8.dp)) }
            }
        }
    }
}
```
