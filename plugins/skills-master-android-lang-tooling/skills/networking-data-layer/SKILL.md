---
name: networking-data-layer
description: Guidance for structuring the Android data layer — repository pattern, network-to-domain model mapping, single-source-of-truth offline-first caching, typed error modeling with Result and sealed types, and exposing reactive data as Flow. Use when designing a repository, wiring a local cache to a remote API, modeling errors for UI consumption, or deciding where domain mapping belongs.
---

## When to use

- You are introducing or refactoring a repository and need a consistent pattern for combining local and remote data sources.
- You want offline-first behaviour: the app must show stale data and queue writes when there is no network.
- You need a clean model boundary so ViewModels and use-cases never see Room entities or Retrofit DTOs.
- You are deciding how to surface errors from multiple sources (network, database, business logic) to the UI layer in a typed, exhaustive way.
- You want data changes observed reactively via `Flow` rather than polled by callers.

## Core guidance

### Repository as the single source of truth

- **Do** make the repository the only entry point to a data domain (users, orders, products). No ViewModel calls a DAO or an API service directly.
- **Do** expose data as `Flow<T>` or `Flow<Result<T>>` from the repository so the UI observes changes automatically — from Room, you get this for free via `@Query` returning `Flow`.
- **Don't** expose raw Room entities or network DTOs beyond the repository boundary. Map them to domain models at the edge of the data layer.
- **Do** keep repositories focused on one domain aggregate. If mapping feels awkward, it is a sign the repository is too broad.

### Model mapping

- Define three model families: **network DTOs** (serializable, nullable fields, camelCase), **database entities** (Room-annotated, local IDs, timestamps), and **domain models** (plain Kotlin data classes, non-nullable, UI-ready types).
- Map at the data layer boundary: DTO → domain in `RemoteDataSource`, entity → domain in `LocalDataSource` (or in the repository itself). Never let mapping logic leak into ViewModels.
- **Do** write `toDomain()` extension functions on DTOs and entities; avoid constructors that accept the other model type so the models stay decoupled.
- **Don't** reuse a domain model as a network DTO or entity. The cost of one extra class is smaller than the coupling it prevents.

### Offline-first caching

- The canonical pattern: **observe the local cache → refresh from network → write network result to local cache → cache emits the update downstream**.
- Use Room as the single source of truth. Network data is written to Room; the UI observes Room only — it never observes network responses directly.
- For reads, emit cached data immediately, trigger a background refresh, write updated data to Room, and let the downstream `Flow` deliver the new value automatically.
- For writes, apply the change to the local store first (optimistic update), enqueue a remote sync, roll back on terminal failure.
- **Do** use `WorkManager` for durable background sync so writes survive process death and network interruptions.
- **Don't** skip the local cache for "read-only" screens. Even a short TTL (seconds to minutes) prevents redundant network calls during navigation.

### Error modeling

- **Do** wrap repository return types in a sealed `Result` type or use Kotlin's `kotlin.Result` for simple cases. Pick one approach per project and be consistent.
- A sealed `DataResult<T>` with `Success(data: T)`, `Error(cause: DataError)`, and optional `Loading` state is idiomatic for layered apps.
- Model errors exhaustively with a sealed `DataError` hierarchy: `Network.NoConnectivity`, `Network.ServerError(code: Int)`, `Network.Timeout`, `Local.DiskFull`, `Unknown(cause: Throwable)`. Callers can `when`-branch without a catch-all.
- **Don't** propagate raw exceptions from repositories to ViewModels. Catch at the repository boundary, classify, and return a typed error.
- **Do** distinguish recoverable from terminal errors. A 401 may need token refresh; a 404 is terminal for that resource; a timeout is retry-eligible.

### Exposing data as Flow

- Return `Flow<DataResult<T>>` for streams that change over time (list screens, live order status).
- Return `suspend fun` returning `DataResult<T>` for one-shot operations (form submit, delete).
- **Do** use `flowOn(Dispatchers.IO)` inside the repository (or in the data source) so callers do not have to specify a dispatcher.
- **Don't** call `stateIn` or `shareIn` inside the repository; that is the ViewModel's responsibility. Repositories emit cold flows.

```kotlin
// Domain model — plain, non-nullable, UI-ready
data class Article(val id: String, val title: String, val body: String)

// Typed error hierarchy
sealed interface DataError {
    sealed interface Network : DataError {
        data object NoConnectivity : Network
        data class ServerError(val code: Int) : Network
        data object Timeout : Network
    }
    data object Unknown : DataError
}

// Result wrapper
sealed interface DataResult<out T> {
    data class Success<T>(val data: T) : DataResult<T>
    data class Error(val error: DataError) : DataResult<Nothing>
}

// Repository — single source of truth via Room + remote refresh
class ArticleRepositoryImpl(
    private val local: ArticleDao,
    private val remote: ArticleRemoteSource,
) : ArticleRepository {

    override fun observeArticles(): Flow<DataResult<List<Article>>> =
        local.observeAll()                          // Room Flow, emits on every DB change
            .map { entities -> DataResult.Success(entities.map { it.toDomain() }) }
            .onStart { refreshArticles() }          // kick a background refresh on first collect
            .flowOn(Dispatchers.IO)

    private suspend fun refreshArticles() {
        runCatching { remote.fetchArticles() }
            .onSuccess { dtos -> local.upsertAll(dtos.map { it.toEntity() }) }
            .onFailure { /* log; Room Flow still delivers cached data */ }
    }
}
```

## Platform notes

- **Android 16+ / AGP 9:** Strict background restrictions mean synchronous network on the main thread throws `NetworkOnMainThreadException` even in tests. Always dispatch data-layer work on `Dispatchers.IO`.
- **Room + Kotlin 2.2:** Room's `@Query` returning `Flow<List<T>>` now uses coroutines natively. The `@Transaction` annotation is safe with `suspend` functions; avoid mixing Java-style callbacks.
- **WorkManager for durable sync:** Use `CoroutineWorker` with `setExpedited` for user-triggered syncs and standard constraints (`NetworkType.CONNECTED`) for background refresh. Pass minimal input data (IDs only) to keep payloads serializable.
- **Paging 3:** For list screens backed by a `PagingSource`, the repository still owns data access; return `Pager(…).flow` from the repository and let the ViewModel call `cachedIn(viewModelScope)`.

## Pitfalls

- **Mapping in the ViewModel.** ViewModels should receive domain models. Placing `toDomain()` calls in a ViewModel couples it to the data layer and makes the logic untestable in isolation.
- **Leaking Room entities or Retrofit DTOs as domain models.** A `@Entity` class annotated with `@SerializedName` fields is a maintenance trap: schema migrations and API changes collide.
- **Returning `Flow<T>` from a repository that can fail silently.** If the remote refresh fails and you swallow the exception, the UI shows stale data with no indication of the failure. Return `Flow<DataResult<T>>` or emit an error state explicitly.
- **Calling `collect` inside a repository.** Repositories produce flows; they do not collect them internally. Collecting a flow inside another flow creates resource leaks and breaks cancellation.
- **One-to-one coupling between API endpoints and repositories.** Group by domain, not by endpoint. An `OrderRepository` may call multiple API services internally.
- **Forgetting `flowOn`.** Without `flowOn(Dispatchers.IO)`, Room and network calls run on the collector's dispatcher, which for a ViewModel is `Main`. Room will throw; network will crash.
- **No local cache at all.** A "load from network, show result" approach breaks offline, causes spinner re-flashes on back navigation, and defeats Compose's recomposition model. Even a 30-second in-memory cache helps.
- **Using `LiveData` at the repository boundary.** `LiveData` is a UI layer concern. Repositories return `Flow`; ViewModels convert to `StateFlow` or `LiveData` as needed for the presentation layer.

## References

- **Guide to app architecture — data layer:** [https://developer.android.com/topic/architecture/data-layer](https://developer.android.com/topic/architecture/data-layer)
- **Offline-first apps:** [https://developer.android.com/topic/architecture/data-layer/offline-first](https://developer.android.com/topic/architecture/data-layer/offline-first)

## See also

The `kotlin-flow` skill covers Flow operators, context, and backpressure in depth — essential for understanding `flowOn`, `onStart`, and combining streams inside a repository. The `kotlin-coroutines` skill covers structured concurrency and cancellation that underpins suspend functions at the data layer boundary. For client mechanics (Retrofit, OkHttp, Ktor setup, interceptors, auth), defer to a dedicated HTTP client skill. The `swiftdata-modeling` and `core-data` skills in the Apple domain are analogous persistence concerns for reference.
