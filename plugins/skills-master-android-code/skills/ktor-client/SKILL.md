---
name: ktor-client
description: Ktor HTTP client for Android and large-screen apps — Use when building type-safe, coroutine-native HTTP networking with content negotiation, auth plugins, and Kotlin Multiplatform compatibility.
---

## When to use

Choose Ktor client when you need a coroutine-native HTTP library that works seamlessly across Android and Kotlin Multiplatform (KMP) targets. It is the right fit when:

- Your project is KMP or you anticipate sharing networking code with iOS, desktop, or server targets.
- You want a plugin-based pipeline (auth, logging, content negotiation) that composes without reflection.
- You need first-class kotlinx.serialization integration with zero boilerplate deserialization.
- You want suspend-function APIs throughout — no callbacks, no RxJava adapters.

Prefer OkHttp/Retrofit if you are in a pure-Android codebase with a large existing Retrofit layer and no multiplatform ambitions.

## Core guidance

**Engine selection**

- Use the `OkHttp` engine on Android (`io.ktor:ktor-client-okhttp`) — it reuses the platform's battle-tested connection pool and TLS stack.
- Use `Darwin` on iOS and `Js`/`WasmJs` on JS targets when sharing a common client in a KMP module.
- Declare the engine in each platform's source set; keep the `HttpClient` construction in `commonMain` behind an `expect`/`actual` or inject via a factory.

**Client construction**

- Create `HttpClient` once, share it (singleton or DI-scoped), and close it only when the app terminates — construction is expensive.
- Configure inside the `HttpClient {}` builder; never mutate the client after construction.
- Enable `expectSuccess = true` to turn non-2xx responses into `ResponseException` automatically.

**Content negotiation**

- Install `ContentNegotiation` with `json()` using a shared `Json` instance that has `ignoreUnknownKeys = true` — APIs evolve.
- Annotate data classes with `@Serializable`; avoid manual `JsonObject` parsing except for truly dynamic payloads.

**Auth**

- Use the `Auth` plugin with `bearer {}` for Bearer token flows; supply `loadTokens` and `refreshTokens` lambdas.
- Never hard-code credentials; load them from an injected token store.
- The plugin handles 401-triggered refresh transparently, including in-flight request replay.

**Request / response pipeline**

- Add `Logging` plugin (with `LogLevel.HEADERS` in debug, `LogLevel.NONE` in release) to observe the pipeline without touching request code.
- Use typed `HttpResponse` and call `.body<T>()` to deserialize; prefer this over deprecated `.receive<T>()`.
- Stream large responses with `prepareGet` / `execute` and read the body as a `ByteReadChannel` to avoid loading everything into memory.

**Error handling**

- Catch `ResponseException` for HTTP errors and `IOException` / `SocketTimeoutException` for transport errors separately.
- Do not swallow `CancellationException` — let it propagate so coroutine cancellation works correctly.

**Timeouts**

- Always install `HttpTimeout` and set `requestTimeoutMillis`, `connectTimeoutMillis`, and `socketTimeoutMillis` explicitly — the defaults are infinite.

```kotlin
// commonMain or androidMain
val json = Json { ignoreUnknownKeys = true; isLenient = true }

val httpClient = HttpClient(OkHttp) {
    expectSuccess = true

    install(ContentNegotiation) {
        json(json)
    }

    install(Auth) {
        bearer {
            loadTokens { BearerTokens(tokenStore.accessToken, tokenStore.refreshToken) }
            refreshTokens {
                val refreshed = client.post("https://api.example.com/auth/refresh") {
                    markAsRefreshTokenRequest()
                    setBody(RefreshRequest(oldTokens?.refreshToken.orEmpty()))
                }.body<TokenResponse>()
                tokenStore.save(refreshed.access, refreshed.refresh)
                BearerTokens(refreshed.access, refreshed.refresh)
            }
        }
    }

    install(HttpTimeout) {
        requestTimeoutMillis = 30_000
        connectTimeoutMillis = 10_000
        socketTimeoutMillis = 15_000
    }

    install(Logging) {
        level = if (BuildConfig.DEBUG) LogLevel.HEADERS else LogLevel.NONE
    }
}

// Usage in a repository
suspend fun fetchUser(id: String): User =
    httpClient.get("https://api.example.com/users/$id").body()
```

**Dependency setup (libs.versions.toml)**

```toml
[versions]
ktor = "3.1.3"

[libraries]
ktor-client-core        = { module = "io.ktor:ktor-client-core",               version.ref = "ktor" }
ktor-client-okhttp      = { module = "io.ktor:ktor-client-okhttp",             version.ref = "ktor" }
ktor-client-content-neg = { module = "io.ktor:ktor-client-content-negotiation",version.ref = "ktor" }
ktor-serialization-json = { module = "io.ktor:ktor-serialization-kotlinx-json", version.ref = "ktor" }
ktor-client-auth        = { module = "io.ktor:ktor-client-auth",               version.ref = "ktor" }
ktor-client-logging     = { module = "io.ktor:ktor-client-logging",            version.ref = "ktor" }
ktor-client-timeout     = { module = "io.ktor:ktor-client-timeout",            version.ref = "ktor" }
```

## Platform notes

**Android**

- The OkHttp engine inherits Android's `CleartextTraffic` network security policy — always enforce HTTPS in production and configure `network_security_config.xml` accordingly.
- On Android 16+ (API 36+), background network access is further restricted; perform requests inside `WorkManager` or foreground-service scopes, not bare `GlobalScope`.
- Large-screen (tablet/foldable) apps often load more content simultaneously; use `HttpClient` with OkHttp's connection pool limits tuned for higher concurrency (`maxRequests`, `maxRequestsPerHost`).

**Kotlin Multiplatform**

- Put `HttpClient` configuration logic in `commonMain`; inject the engine via constructor or `expect`/`actual` factory.
- Avoid engine-specific classes in `commonMain`; only import `io.ktor:ktor-client-core` there.
- On Wasm/JS targets, use `io.ktor:ktor-client-js`; the fetch-based engine has no socket-level timeout support — rely on `requestTimeoutMillis` only.

## Pitfalls

- **Creating a new client per request** — `HttpClient` construction allocates thread pools and connection pools. Create once, reuse everywhere.
- **Forgetting `expectSuccess`** — without it, a 404 or 500 returns a successful `HttpResponse` and callers must check `status` manually, leading to silent data bugs.
- **Leaking the client** — call `httpClient.close()` when the owning scope (ViewModel, Application) is destroyed; failure causes thread and connection leaks.
- **Deserializing on the wrong dispatcher** — `body<T>()` is a suspend function and already dispatches off the main thread, but ensure the calling coroutine is not on `Dispatchers.Main` with a blocking fallback.
- **Logging in release builds** — `LogLevel.BODY` logs request and response bodies including auth tokens; gate it strictly on `BuildConfig.DEBUG`.
- **Using deprecated `receive<T>()`** — replaced by `.body<T>()` since Ktor 2.x; mixing both in a codebase creates confusion and compilation warnings.
- **Ignoring `CancellationException`** — a broad `catch (e: Exception)` swallows cancellation, preventing cooperative cancellation of coroutines.
- **Sharing `Json` instances carelessly** — `Json` is thread-safe and should be a singleton; creating one per request wastes memory and skips module caching.

## References

- **Documentation:** [Ktor Client — Create and Configure](https://ktor.io/docs/client-create-and-configure.html)
- **Documentation:** [Ktor Welcome / Overview](https://ktor.io/docs/welcome.html)

## See also

Pair this skill with `networking-layer` for repository-layer patterns and error mapping strategies. See `swift-concurrency` (iOS counterpart) when coordinating shared KMP networking logic across platforms. Consider `codable-serialization` for understanding how data modeling differs between Android and Apple targets in a KMP project.
