---
name: networking-layer
description: "Guidance for building a testable async networking layer with URLSession in Swift 6: endpoint modeling, Codable decoding, typed error handling, retries, timeouts, token refresh, and URLProtocol stubs. Use when designing an API client, wrapping URLSession, decoding JSON responses, adding auth/token refresh, or making network code unit-testable."
globs:
  - "**/*.swift"
tags: [networking, urlsession, async-await, codable, testing]
x-skills-master:
  domain: apple
  class: lang-tooling
  category: architecture
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  requires:
    swift: "6.0"
  pairs_with: []
  sources:
    - https://developer.apple.com/documentation/foundation/urlsession
    - https://developer.apple.com/documentation/foundation/urlprotocol
    - https://developer.apple.com/documentation/foundation/urlsessionconfiguration
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

# Networking layer

A small, owned abstraction over `URLSession` that turns endpoints into typed requests and decoded responses. Keep transport concerns (auth, retries, timeouts, decoding) in one place so feature code stays free of URL plumbing.

## When to use

- You are wrapping `URLSession` into a reusable API client rather than scattering `URLSession.shared` calls across views and view models.
- You need typed errors, Codable decoding, retries, or token refresh in one consistent place.
- You want network code that is unit-testable without hitting a live server.

## Core guidance

- **Do** model each call as a value: an `Endpoint` with path, method, query, body, and a `Response: Decodable` type. Build `URLRequest` from it so call sites never touch raw URLs.
- **Do** use the async methods — `data(for:)`, `bytes(for:)`, `upload(for:from:)` — and check the `HTTPURLResponse.statusCode` yourself; URLSession does not throw on 4xx/5xx.
- **Don't** swallow failures into a single `Error`. Distinguish transport (`URLError`), HTTP status, and decoding errors so callers and tests can branch on them.
- **Do** inject the session behind a protocol (or a `requester` closure) so tests substitute a stub; keep the protocol's surface as small as the calls you actually make.
- **Do** configure timeouts and connectivity on `URLSessionConfiguration` (`timeoutIntervalForRequest`, `waitsForConnectivity`), not per request, and set a shared `JSONDecoder` once (date strategy, key strategy).
- **Don't** retry blindly. Retry only idempotent requests on transient signals (timeouts, 408/429/5xx), with bounded attempts and backoff; honor `Retry-After`.
- **Do** isolate token refresh so concurrent 401s trigger one refresh, not a stampede — gate it through an actor that coalesces in-flight refreshes.

Idiom: keep the decode generic over the endpoint's `Response`, and make the client `Sendable` so it crosses isolation boundaries cleanly.

```swift
struct APIClient: Sendable {
  let session: URLSession
  let decoder: JSONDecoder

  func send<E: Endpoint>(_ endpoint: E) async throws -> E.Response {
    let (data, response) = try await session.data(for: endpoint.urlRequest())
    guard let http = response as? HTTPURLResponse else { throw APIError.nonHTTP }
    guard 200..<300 ~= http.statusCode else {
      throw APIError.status(http.statusCode, data)
    }
    do { return try decoder.decode(E.Response.self, from: data) }
    catch { throw APIError.decoding(error) }
  }
}
```

## Platform notes

- **All platforms:** The async `URLSession` API is available across iOS, iPadOS, macOS, watchOS, tvOS, and visionOS. Prefer it over completion handlers everywhere.
- **watchOS / background:** Long transfers should use background `URLSession` configurations with a delegate; the async data methods are for foreground, in-memory transfers.
- **Concurrency:** Under Swift 6 strict checking, `URLSession` and `URLRequest` are `Sendable`. Make your client and its decoder `Sendable` too; mark mutable shared state (token store, refresh coordinator) as an `actor`.

## Pitfalls

- **Assuming a thrown error means failure to connect.** A 500 is a successful transport with a bad status — you must inspect `statusCode` yourself.
- **One opaque error type.** Collapsing transport, status, and decoding into a single case makes retry logic and tests guess; keep them distinct.
- **Registering `URLProtocol` stubs on `URLSession.shared`.** Use a dedicated configuration (`URLSessionConfiguration.ephemeral`) per test so stubs don't leak between tests.
- **Unbounded retries.** Retrying non-idempotent POSTs, or looping without a cap, can duplicate writes and hammer a struggling server.
- **Refresh stampede.** N concurrent 401s firing N refreshes can invalidate each other's tokens; coalesce through a single actor.
- **Forgetting `finishLoading`/`stopLoading` in a `URLProtocol` stub** leaves the request hanging until timeout.

## References

- **Documentation:** [URLSession](https://developer.apple.com/documentation/foundation/urlsession)
- **Documentation:** [URLProtocol](https://developer.apple.com/documentation/foundation/urlprotocol)
- **Documentation:** [URLSessionConfiguration](https://developer.apple.com/documentation/foundation/urlsessionconfiguration)
- **WWDC:** [Use async/await with URLSession (WWDC21)](https://developer.apple.com/videos/play/wwdc2021/10095/)

## See also

- Pair this with a Codable modeling skill for decoder strategies and nested/optional payloads, and with a Swift concurrency skill for the actor isolation and `Sendable` rules that govern shared token state. A dependency-injection skill covers wiring the session protocol into your app graph for tests.
