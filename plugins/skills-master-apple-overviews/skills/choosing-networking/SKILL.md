---
name: choosing-networking
description: Decision guide for picking an Apple networking approach. Use when starting networking work, evaluating URLSession vs Network framework, building WebSocket/peer-to-peer/custom-transport features, or deciding whether a third-party HTTP client is justified.
---

## When to use

Reach for this guide before writing a single line of networking code, or when a teammate proposes adding a networking dependency. It maps a use case to the right Apple API so you avoid reinventing transport logic, fighting the wrong abstraction, or pulling in a library you don't need. Apple's own decision tree lives in technote TN3151; this skill distills it and adds the iOS/macOS 26 structured-concurrency story.

## Core guidance

- Default to URLSession for anything HTTP or HTTPS — REST, GraphQL, file download/upload, background transfers. It is the recommended API for HTTP on every Apple platform and handles connect-by-name, Happy Eyeballs, proxies, HTTP/2 and HTTP/3, ATS, and cookies for free.
- Use `async`/`await` on URLSession (`data(for:)`, `bytes(from:)`, `download(from:)`) rather than completion handlers or hand-rolled delegate pipelines for new code; reserve the delegate path for background sessions, auth challenges, and progress.
- Drop to Network framework when you need a raw transport: TCP, UDP, QUIC, custom TLS, or your own protocol over a socket. It is the recommended API for these, not BSD sockets.
- Prefer Network framework for WebSocket in new code — the protocol's bidirectional message framing maps cleanly to a connection, and you get server support and finer transport control. `URLSessionWebSocketTask` is fine for a simple client riding an existing HTTP stack.
- For local peer-to-peer, use Network framework's browser/listener (Bonjour or, new in iOS 26, Wi-Fi Aware) over QUIC or TLS. Treat Multipeer Connectivity as legacy unless its automatic mesh fits exactly.
- Don't reach for BSD sockets, `CFNetwork`, or `CFStream` unless you are doing something genuinely low-level that the framework APIs cannot express; they are the last resort, not a shortcut.
- Justify a third-party HTTP client only by a concrete capability gap (e.g. a specific interceptor model), never by ergonomics alone — modern async URLSession closes most of the convenience gap and avoids a dependency in your security-critical path.

```swift
// HTTP: stay on URLSession + async/await.
let (data, response) = try await URLSession.shared.data(from: feedURL)

// Custom transport: declare a stack with Network framework (iOS/macOS 26).
let connection = NetworkConnection(to: .hostPort(host: "game.example", port: 4433)) {
    QUIC()
}
try await connection.send(Data("hello".utf8))
```

## Platform notes

- iOS/macOS 26 add `NetworkConnection`, `NetworkListener`, and `NetworkBrowser` — Swift-native, structured-concurrency wrappers over the older `NWConnection`/`NWListener`/`NWBrowser`. Use them on the 26 SDKs; fall back to the `NW*` types when you must support earlier OSes.
- Wi-Fi Aware browsing is new in iOS 26 and is the modern path for nearby-device discovery alongside Bonjour.
- watchOS restricts long-lived and background connections; favor URLSession with the watch's managed transfer behavior and keep transports short-lived.
- On every platform, App Transport Security still applies to URLSession HTTP — plan TLS, not exemptions.

## Pitfalls

- Picking Network framework "for performance" on a plain HTTPS API — you lose URLSession's connection reuse, caching, and Happy Eyeballs and rarely gain anything.
- Using `URLSessionWebSocketTask` for a high-reliability, full-duplex channel, then fighting reconnection and framing edge cases that Network framework handles natively.
- Adding a networking library to a new project before measuring what async URLSession already gives you; every networking dependency is attack surface and a migration liability.
- Hand-coding sockets to "discover the device's IP" or build peer-to-peer — use the browser/listener APIs instead.

## References

- **Documentation:** [TN3151: Choosing the right networking API](https://developer.apple.com/documentation/technotes/tn3151-choosing-the-right-networking-api)
- **Documentation:** [URLSession](https://developer.apple.com/documentation/foundation/urlsession)
- **Documentation:** [NWConnection](https://developer.apple.com/documentation/network/nwconnection)
- **Documentation:** [NWProtocolQUIC](https://developer.apple.com/documentation/network/nwprotocolquic)
- **WWDC:** [Use structured concurrency with Network framework (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/250/)
- **WWDC:** [Use async/await with URLSession (WWDC21)](https://developer.apple.com/videos/play/wwdc2021/10095/)

## See also

Pair this overview with a dedicated urlsession-async skill for HTTP request modeling and decoding, and with a network-framework-connections skill for `NetworkConnection`/`NetworkListener` transport details. For real-time channels, see a websockets skill; for nearby-device work, see a peer-to-peer-discovery skill covering Bonjour and Wi-Fi Aware.
