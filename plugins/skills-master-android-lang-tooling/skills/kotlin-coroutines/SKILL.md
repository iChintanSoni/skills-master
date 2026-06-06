---
name: kotlin-coroutines
description: Covers structured concurrency with Kotlin coroutines — CoroutineScope/Job, launch vs async/await, suspend functions, Dispatchers, withContext, cancellation, exception handling, and Android scopes. Use when writing async or concurrent code in an Android app with Kotlin.
---

## When to use

Use this skill whenever you are writing async or concurrent code in an Android Kotlin project — fetching network data, reading a database, doing CPU-heavy work off the main thread, or coordinating multiple concurrent operations. It covers the full coroutines API from basic `launch`/`async` through cancellation and structured exception handling.

---

## Core guidance

### Structured concurrency

Every coroutine lives inside a `CoroutineScope`. When the scope is cancelled, all child coroutines are cancelled automatically. Never launch a coroutine in a raw `GlobalScope` unless you explicitly need application-lifetime work — and even then, prefer a custom scope injected into the relevant component.

- **Do** use `viewModelScope` in `ViewModel` and `lifecycleScope` in `Activity`/`Fragment`/`Composable`.
- **Do** create custom scopes with `CoroutineScope(SupervisorJob() + Dispatchers.Main)` when you need finer control.
- **Don't** retain a `Job` reference and call `cancel()` on individual coroutines unless you have a very specific reason; cancel the scope instead.

### launch vs async

| Builder | Returns | Use for |
|---|---|---|
| `launch` | `Job` | Fire-and-forget side effects |
| `async` | `Deferred<T>` | Concurrent work where you need a result |

Always `await()` a `Deferred` you created; a floating `async` that never `await`s silently swallows its exceptions.

### Dispatchers and withContext

- `Dispatchers.Main` — UI work, reading/writing Compose state.
- `Dispatchers.IO` — network calls, disk I/O. Backed by a large thread pool.
- `Dispatchers.Default` — CPU-intensive work (sorting, parsing, image processing).

Switch contexts with `withContext`, not by launching a new coroutine. Keep suspend functions **main-safe**: any function that touches IO or CPU must switch to the appropriate dispatcher internally.

```kotlin
// Main-safe repository function — callers don't need to know the dispatcher.
class UserRepository(private val api: UserApi, private val dao: UserDao) {

    suspend fun getUser(id: String): User = withContext(Dispatchers.IO) {
        val cached = dao.find(id)
        if (cached != null) return@withContext cached
        val remote = api.fetchUser(id)   // network on IO thread
        dao.insert(remote)
        remote
    }
}

// ViewModel — safely collected on Main.
class UserViewModel(private val repo: UserRepository) : ViewModel() {

    private val _user = MutableStateFlow<User?>(null)
    val user: StateFlow<User?> = _user.asStateFlow()

    fun load(id: String) {
        viewModelScope.launch {                        // Main dispatcher by default
            try {
                _user.value = repo.getUser(id)        // suspends, then resumes on Main
            } catch (e: IOException) {
                // handle domain error — NOT CancellationException
            }
        }
    }

    fun loadParallel(ids: List<String>) {
        viewModelScope.launch {
            val deferred = ids.map { async { repo.getUser(it) } }
            _user.value = deferred.awaitAll().firstOrNull()
        }
    }
}
```

### Cancellation cooperation

Coroutines are cooperative. Long-running CPU work must check for cancellation explicitly with `ensureActive()` or by calling any suspending function that checks it (e.g., `yield()`).

- **Never catch `CancellationException` and swallow it.** It is the mechanism by which structured concurrency tears down a coroutine tree. If you must catch `Throwable` or `Exception`, rethrow `CancellationException` immediately.
- `isActive` is readable inside a coroutine scope for conditional early exit.

```kotlin
// Correct: rethrow CancellationException
try {
    doWork()
} catch (e: CancellationException) {
    throw e          // must propagate
} catch (e: Exception) {
    handleError(e)
}
```

### Exception handling

| Mechanism | Scope | When to use |
|---|---|---|
| `try/catch` around `await()` | `async` result site | Catch expected errors at the call site |
| `CoroutineExceptionHandler` | `launch` root | Last-resort logging; does NOT prevent propagation in child coroutines |
| `supervisorScope` / `SupervisorJob` | parent scope | Let sibling coroutines continue when one child fails |

`supervisorScope` is the idiomatic way to fan out work where individual failures should not kill the whole batch. With a regular `Job`, any child failure cancels the parent and all siblings.

```kotlin
viewModelScope.launch {
    supervisorScope {
        val a = async { repo.getUser("a") }
        val b = async { repo.getUser("b") }
        val userA = runCatching { a.await() }.getOrNull()
        val userB = runCatching { b.await() }.getOrNull()
        display(userA, userB)
    }
}
```

`CoroutineExceptionHandler` only handles uncaught exceptions from `launch` (not `async`). Install it on a root coroutine, not a child:

```kotlin
val handler = CoroutineExceptionHandler { _, throwable ->
    Log.e("App", "Unhandled", throwable)
}
viewModelScope.launch(handler) { ... }
```

### Android scopes

- `viewModelScope` — cancelled when `ViewModel.onCleared()` fires. The right place for nearly all data-loading coroutines.
- `lifecycleScope` — cancelled when the `Lifecycle` is destroyed. Use `repeatOnLifecycle(Lifecycle.State.STARTED)` to collect flows only while the screen is visible.
- `rememberCoroutineScope()` (Compose) — tied to the composition. Use for event-driven launches (button clicks) inside a composable.

---

## Platform notes

- On Android, `Dispatchers.Main` is backed by the main `Looper`. It is safe to update UI and `StateFlow` values from it.
- `Dispatchers.IO` uses a shared thread pool capped at `max(64, CPU cores)` threads. For `Room` and `Retrofit`, this pool is appropriate.
- Starting with Kotlin 2.x, the coroutines library ships a new `kotlinx-coroutines-core` with improved performance. Ensure your `kotlinx-coroutines-android` version aligns with the BOM.
- `Flow` collection in Compose should use `collectAsStateWithLifecycle()` (from `lifecycle-runtime-compose`) rather than `collectAsState()` to respect the lifecycle automatically.

---

## Pitfalls

- **Swallowing `CancellationException`.** Catching broad `Exception` or `Throwable` without rethrowing `CancellationException` breaks cancellation propagation, causing coroutines to hang and scopes to never fully cancel.
- **Blocking calls on `Dispatchers.Main`.** Any `Thread.sleep`, synchronous I/O, or blocking SDK call on the main thread causes jank or ANRs. Wrap with `withContext(Dispatchers.IO)`.
- **Using `GlobalScope`.** Leaks work beyond the lifecycle of the feature it belongs to; impossible to test cleanly.
- **Forgetting to `await` a `Deferred`.** The exception is silently stored in the `Deferred` and never surfaced unless you call `await()`.
- **Not using `supervisorScope` for parallel fan-out.** One failure in a group of parallel `async` blocks cancels all siblings if no supervisor is present.
- **Launching in `init {}` of a ViewModel with a hardcoded dispatcher.** Inject `CoroutineDispatcher` to make the ViewModel testable with `UnconfinedTestDispatcher`.
- **Collecting a `SharedFlow`/`StateFlow` outside `repeatOnLifecycle`.** The collector keeps running in the background, wasting resources and potentially processing stale events.

---

## References

- **Documentation:** [Kotlin coroutines on Android — Android Developers](https://developer.android.com/kotlin/coroutines)
- **Documentation:** [Coroutines Guide — Kotlin](https://kotlinlang.org/docs/coroutines-guide.html)
- **Guide:** [Best practices for coroutines in Android](https://developer.android.com/kotlin/coroutines/coroutines-best-practices)

---

## See also

Pair this skill with `kotlin-flow` for reactive streams built on coroutines. For testing coroutines, see `testing-async-code`. For architectural wiring of coroutines in ViewModels and repositories, see `swiftui-app-architecture`'s Android counterpart once available. For dependency injection of dispatchers and scopes, see `dependency-injection`.
