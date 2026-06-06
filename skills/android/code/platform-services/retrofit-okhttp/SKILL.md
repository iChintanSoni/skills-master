---
name: retrofit-okhttp
description: Covers HTTP networking with Retrofit and OkHttp — defining service interfaces, suspend functions and Flow, converters (kotlinx.serialization/Moshi), interceptors and auth, timeouts and caching, and error/exception handling. Use when building or reviewing an Android network layer, wiring a REST API, adding auth headers, handling HTTP errors, or configuring caching and timeouts.
globs:
  - "**/*.kt"
tags: [networking, retrofit, okhttp, kotlin, coroutines]
x-skills-master:
  domain: android
  class: code
  category: platform-services
  platforms: ["android", "large-screen"]
  requires: {android: "16", kotlin: "2.2"}
  pairs_with: [choosing-http-client]
  sources:
    - https://square.github.io/retrofit/
    - https://square.github.io/okhttp/
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Apply this guidance whenever an Android feature needs to talk to a remote HTTP API — retrieving feeds, submitting forms, uploading files, or streaming server-sent events. It covers the full stack from defining a typed Retrofit service interface to wiring OkHttp interceptors, configuring converters, handling errors, and tuning timeouts and disk caching. It does not cover which HTTP library to choose for a greenfield project (see the `choosing-networking` overview for that decision) or advanced streaming patterns beyond basic `Flow` wrapping.

## Core guidance

**Service interface**

- Declare each endpoint as a `suspend fun` returning the response type directly; Retrofit's coroutine adapter eliminates callback boilerplate. Return `Response<T>` when you need the HTTP code or headers; return `T` directly when a non-2xx response should always throw.
- Use `@GET`, `@POST`, `@PUT`, `@DELETE`, `@PATCH` with a relative path. Build base URLs with a trailing slash and keep path segments relative (no leading slash) so Retrofit's resolution works correctly.
- Annotate path variables with `@Path`, query parameters with `@Query`, and request bodies with `@Body`. For file uploads use `@Multipart` with `@Part`.
- Wrap a call in `callbackFlow` or `flow { emit(api.fetch()) }` only when you need a reactive `Flow`; for one-shot calls a plain `suspend fun` is cleaner and easier to test.

**OkHttp client**

- Create a single `OkHttpClient` instance and reuse it — connection pools, thread pools, and caches are per-instance. Construct it in a Hilt/DI module scoped to the app component.
- Add interceptors in order: application interceptors (auth, logging) run first on the way out and last on the way in; network interceptors run closer to the wire and see redirects and retries.
- For auth, add a request interceptor that reads a token from an in-memory holder and attaches it as a header. For token refresh, use an `Authenticator` that OkHttp calls automatically when a 401 is received.
- Set `connectTimeout`, `readTimeout`, and `writeTimeout` explicitly; the defaults (10 s each) are often wrong for slow mobile networks or large uploads.
- Enable `Cache` with a `File` in the app cache directory and a size limit (e.g. 10 MB). Use `Cache-Control` request headers to force network or cache-only when needed.

**Converters**

- Prefer `kotlinx.serialization` with `retrofit2-kotlinx-serialization-converter` for full Kotlin Multiplatform compatibility and compile-time safety. Use Moshi with the Kotlin codegen when migrating a Java codebase. Never mix two JSON converters on the same `Retrofit` instance.
- Mark non-null fields appropriately in your `@Serializable` data classes and use `@SerialName` to decouple wire names from Kotlin identifiers.

**Error handling**

- Catch `HttpException` (non-2xx) and `IOException` (network failures) at the call-site or in a shared repository wrapper. Do not swallow exceptions silently.
- Map errors to a sealed result type (`Result<T>` or a domain-specific `Outcome`) before returning to the ViewModel — keep OkHttp and Retrofit types out of UI layers.
- For `Response<T>` returns, always check `isSuccessful` before accessing `body()`; a 2xx with no body (204) returns `null`.

```kotlin
// Module (Hilt) — wires OkHttpClient, Retrofit, and a typed service
@Module @InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides @Singleton
    fun provideCache(@ApplicationContext ctx: Context): Cache =
        Cache(File(ctx.cacheDir, "http"), 10L * 1024 * 1024)

    @Provides @Singleton
    fun provideOkHttpClient(cache: Cache, authInterceptor: AuthInterceptor): OkHttpClient =
        OkHttpClient.Builder()
            .cache(cache)
            .addInterceptor(authInterceptor)
            .addInterceptor(HttpLoggingInterceptor().apply {
                level = if (BuildConfig.DEBUG) HttpLoggingInterceptor.Level.BODY
                        else HttpLoggingInterceptor.Level.NONE
            })
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build()

    @Provides @Singleton
    fun provideRetrofit(client: OkHttpClient): Retrofit =
        Retrofit.Builder()
            .baseUrl("https://api.example.com/v1/")
            .client(client)
            .addConverterFactory(
                Json { ignoreUnknownKeys = true }
                    .asConverterFactory("application/json".toMediaType())
            )
            .build()

    @Provides @Singleton
    fun provideArticleService(retrofit: Retrofit): ArticleService =
        retrofit.create(ArticleService::class.java)
}

// Service interface
interface ArticleService {
    @GET("articles")
    suspend fun listArticles(@Query("page") page: Int): List<ArticleDto>

    @GET("articles/{id}")
    suspend fun getArticle(@Path("id") id: String): Response<ArticleDto>

    @POST("articles")
    suspend fun createArticle(@Body body: CreateArticleRequest): ArticleDto
}

// Repository — maps to domain, wraps exceptions
class ArticleRepository @Inject constructor(private val api: ArticleService) {
    suspend fun getArticle(id: String): Result<Article> = runCatching {
        val response = api.getArticle(id)
        if (response.isSuccessful) {
            response.body()?.toDomain() ?: error("Empty body for $id")
        } else {
            throw HttpException(response)
        }
    }
}
```

## Platform notes

- On large-screen devices, multiple panes may issue concurrent network requests. Because `OkHttpClient` is thread-safe and uses an internal connection pool, sharing a single instance across the whole app is the correct approach — each pane's ViewModel or repository calls the same client without contention.
- Android 9+ enforces cleartext traffic restrictions; all production URLs must use HTTPS. Use `android:networkSecurityConfig` only for local debug servers, never for production exceptions.
- On Android 14+ the OS may impose additional restrictions on background network access for apps targeting API 34+. Long-running background syncs belong in `WorkManager`, not in foreground coroutines that survive screen rotation.
- When targeting large screens and foldables, be aware that network requests initiated during a configuration change (fold/unfold) are automatically survived if launched from a `ViewModel` — no special handling is needed beyond the standard ViewModel pattern.

## Pitfalls

- **Creating multiple `OkHttpClient` or `Retrofit` instances.** Each instance has its own thread pool and connection pool. Creating one per screen or per request leaks resources, ignores caching, and causes intermittent failures under load.
- **Accessing `response.body()` without checking `isSuccessful`.** A 4xx/5xx response has a null body and a non-null `errorBody()`; accessing `body()!!` on an error response crashes at runtime.
- **Swallowing `IOException` silently.** A socket timeout or connection reset is an `IOException`, not an `HttpException`. Catching only `HttpException` silently drops offline/timeout errors.
- **Leaking `HttpException`, `Response<T>`, or OkHttp types into the ViewModel or UI.** The ViewModel and UI should depend on domain models and `Result<T>`, not on network library types.
- **Logging bodies in production.** `HttpLoggingInterceptor.Level.BODY` logs request and response payloads verbatim — it can expose tokens, passwords, and PII. Gate it strictly on `BuildConfig.DEBUG`.
- **Forgetting a trailing slash on `baseUrl`.** Retrofit resolves relative URLs against the base URL using RFC 3986 rules. A missing trailing slash causes the last path segment to be silently dropped on relative paths.
- **Calling `response.errorBody()?.string()` more than once.** `ResponseBody` is a one-shot stream; the second call returns an empty string. Read and store it once.
- **Using `Dispatchers.Main` for network calls.** Retrofit with `suspend` functions already dispatches to a background executor internally; wrapping in `withContext(Dispatchers.IO)` is harmless but unnecessary. Never call from the main thread without coroutines.

## References

- **Documentation:** [Retrofit — A type-safe HTTP client for Android and Java](https://square.github.io/retrofit/)
- **Documentation:** [OkHttp — An efficient HTTP client for Android and Java](https://square.github.io/okhttp/)
- **Documentation:** [kotlinx.serialization Retrofit converter](https://github.com/JakeWharton/retrofit2-kotlinx-serialization-converter)
- **Documentation:** [Android Network Security Configuration](https://developer.android.com/privacy-and-security/security-tips)

## See also

For choosing between Retrofit, Ktor, and other HTTP clients, see the `choosing-networking` overview. For persisting network responses to a local database, pair this skill with `room-database`. For scheduling periodic background network syncs that survive process death, see `workmanager`. For dependency injection that wires the `OkHttpClient` and `Retrofit` singletons, see `hilt-di`. For exposing network results as reactive state in the UI layer, see `viewmodel` and `state-flow`.
