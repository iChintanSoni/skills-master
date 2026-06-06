---
name: choosing-http-client
description: Decision guide for selecting an HTTP client library on Android in 2026. Use when starting a new network layer, evaluating Retrofit vs Ktor client vs raw OkHttp, or deciding whether Cronet/QUIC is warranted for a production app.
---

## When to use

Reach for this guide before writing a single HTTP request, when evaluating whether a library dependency is justified, or when an existing network layer is causing pain. It routes decisions between the four realistic options in a modern Kotlin/Compose Android project — Retrofit + OkHttp, Ktor Client, raw OkHttp, and Cronet/QUIC — and explains which axes matter for the choice. Implementation details (interceptors, serialisation, error handling) belong in a dedicated code skill, not here.

## Core guidance

### The four options and what they are

**Retrofit + OkHttp** — the dominant, stable combination. Retrofit turns an annotated Kotlin interface into a fully wired HTTP client; OkHttp is its transport. Together they handle connection pooling, transparent gzip, cookie management, and a pluggable interceptor chain. Kotlin coroutines support is built into Retrofit via `suspend` functions. Both libraries are actively maintained by Square and are the de-facto standard in the Android ecosystem.

**Ktor Client (Kotlin Multiplatform)** — a coroutine-native, multiplatform HTTP client from JetBrains. On Android it delegates to OkHttp (or CIO) under the hood. Its primary advantage is sharing a single typed network layer across Android, iOS, desktop, and server targets in a Kotlin Multiplatform project. On a pure-Android project it adds complexity without a proportional gain.

**Raw OkHttp** — using OkHttp's `OkHttpClient` and `Request`/`Response` API without Retrofit. Appropriate when the endpoint interface is so minimal (one or two requests) that a Retrofit interface adds ceremony, or when you need fine-grained control over request construction that Retrofit's annotation layer makes awkward.

**Cronet / QUIC** — the Chromium network stack, available via `com.google.android.gms:play-services-cronet` or bundled via `org.chromium.net:cronet-embedded`. Adds HTTP/3 (QUIC), 0-RTT reconnect, and congestion-control tuned for mobile. Meaningful only when measured performance data shows that connection establishment or head-of-line blocking is a bottleneck (e.g. video streaming, real-time data feeds). OkHttp can be bridged to Cronet via the `okhttp-cronet` transport, keeping your Retrofit layer intact.

### Decision table

| Signal | Recommended option |
|---|---|
| New Android-only app, typical REST/GraphQL API | Retrofit + OkHttp |
| Kotlin Multiplatform project sharing network layer | Ktor Client |
| One or two fire-and-forget requests, no endpoint interface | Raw OkHttp |
| Streaming, QUIC/HTTP3 perf gain measured | OkHttp + Cronet transport |
| Need request/response interceptors, auth token refresh | Retrofit + OkHttp (OkHttp interceptors) |
| Server-Sent Events or chunked streaming body | OkHttp `EventSource` or Ktor streaming |

### Recommended default

**Retrofit + OkHttp** is the correct default for the vast majority of Android apps. The combination is battle-tested, has the largest community and third-party converter ecosystem (Moshi, kotlinx.serialization, Gson), and integrates naturally with coroutines. Do not abandon it for Ktor unless shared KMP code is genuinely on the roadmap — the multiplatform flexibility is Ktor's core value proposition, not its Android story alone.

Choose Ktor Client when a KMP shared module already exists or is planned; use it there and let platform apps consume the shared layer.

Add Cronet only after profiling shows connection-level latency as the bottleneck, not after assuming QUIC will help. The integration effort and operational complexity are real; the gains are situational.

Raw OkHttp is the honest choice for a utility module, a small CLI tool, or a build plugin that needs one HTTPS call and where pulling in Retrofit's annotation processing is disproportionate.

```kotlin
// Retrofit + OkHttp — the standard setup (Kotlin 2.2 / coroutines)
val okHttpClient = OkHttpClient.Builder()
    .addInterceptor(AuthInterceptor(tokenStore))
    .build()

val retrofit = Retrofit.Builder()
    .baseUrl("https://api.example.com/")
    .client(okHttpClient)
    .addConverterFactory(Json.asConverterFactory("application/json".toMediaType()))
    .build()

interface FeedApi {
    @GET("v1/articles")
    suspend fun articles(@Query("page") page: Int): ArticlePage
}

val api: FeedApi = retrofit.create()
```

## Platform notes

**Large screens and foldables** — the HTTP client choice is orthogonal to screen size. However, large-screen apps often need to handle parallel data loads for split-pane layouts; OkHttp's connection pool (5 connections per host by default) handles this well without tuning.

**Background and WorkManager jobs** — OkHttp is safe to reuse as a singleton across foreground and background work. Do not create a new `OkHttpClient` per `Worker`; inject a shared instance.

**Android 16 minimum** — Android 16 ships with modern TLS defaults (TLS 1.3 preferred, TLS 1.2 fallback). OkHttp 4.x and Cronet respect these; no extra configuration is needed for standard APIs.

**Cronet availability** — the GMS-backed Cronet may not be present on devices without Google Play Services (AOSP, some Chinese OEMs). Use `CronetEngine.Builder.createCronetEngine()` with a fallback check, or prefer `cronet-embedded` if guaranteed availability matters.

**R8 / ProGuard** — Retrofit and OkHttp each ship consumer ProGuard rules. kotlinx.serialization requires the `@Serializable` annotation processor; add its R8 rules explicitly when using it as a converter.

## Pitfalls

- **Creating a new `OkHttpClient` per request or ViewModel** — each instance owns a thread pool and connection pool. A single app-scoped singleton (injected via Hilt or Koin) is the correct pattern.
- **Using Ktor Client on Android-only to "future-proof" for KMP** — if a KMP module is not actually planned, you inherit Ktor's larger API surface, less community tooling, and no concrete benefit. Future-proofing is not a reason to deviate from the ecosystem default.
- **Assuming Cronet always wins on latency** — QUIC benefits are most pronounced on lossy or high-latency links. On a stable Wi-Fi connection, HTTP/2 over OkHttp and QUIC over Cronet are often indistinguishable. Measure before adopting.
- **Blocking the main thread with `execute()` instead of `enqueue()` or `suspend`** — OkHttp's synchronous `execute()` call on the main thread causes `StrictMode` violations and ANRs. Always use `suspend` functions with Retrofit or `enqueue` for raw OkHttp calls that are not already on a background dispatcher.
- **Trusting all certificates in development and forgetting to remove it** — a common shortcut that ships to production. Use a network security config file to pin or trust test certificates per-build-variant instead.
- **Skipping connection-level error handling** — `IOException` from OkHttp and HTTP error codes from Retrofit are distinct failure modes; handle both explicitly, especially for retry logic and user-facing error states.

## References

- **Developer Guide:** [Connect to the network](https://developer.android.com/develop/connectivity/network-ops/connecting)
- **Developer Guide:** [Network operations overview](https://developer.android.com/develop/connectivity/network-ops)
- **Library:** [Retrofit (Square)](https://square.github.io/retrofit/)
- **Library:** [OkHttp (Square)](https://square.github.io/okhttp/)
- **Library:** [Ktor Client (JetBrains)](https://ktor.io/docs/client-create-new-application.html)
- **Library:** [Cronet for Android](https://developer.android.com/develop/connectivity/cronet)

## See also

For the coroutine and Flow patterns that consume network results, see `swift-concurrency` as a conceptual parallel or the Android `networking-layer` code skill for implementation patterns. For dependency injection wiring of the HTTP client singleton, see `dependency-injection`. For handling background sync and periodic fetch jobs that call the network layer, see `background-tasks`. For certificate pinning and secure transport configuration, see `network-framework` (Apple conceptual reference) and the Android `entitlements-capabilities` skill for network security config.
