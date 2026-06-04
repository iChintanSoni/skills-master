---
name: network-framework
description: "Guides direct transport-level networking with Apple's Network framework: NWConnection/NetworkConnection for TLS/TCP/UDP/QUIC clients, NWListener for servers, NWPathMonitor for connectivity changes, and NWParameters protocol options. Use when building custom wire protocols, peer-to-peer links, persistent sockets, or QUIC clients, or when deciding between Network framework and URLSession. Most plain HTTP apps should prefer URLSession instead."
globs:
  - "**/*.swift"
tags: [networking, sockets, tls, quic, connectivity, concurrency]
x-skills-master:
  domain: apple
  class: code
  category: system
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  requires:
    ios: "17"
    swift: "6.0"
  pairs_with: []
  sources:
    - https://developer.apple.com/documentation/network
    - https://developer.apple.com/documentation/network/nwconnection
    - https://developer.apple.com/documentation/network/nwpathmonitor
    - https://developer.apple.com/documentation/technotes/tn3179-understanding-local-network-privacy
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for Network framework when you need raw transport access that `URLSession` cannot give you: a custom binary or text wire protocol, a long-lived bidirectional TCP/TLS stream, UDP datagrams, a QUIC client or QUIC datagram flow, a local server (`NWListener`), or peer-to-peer discovery over Bonjour or Wi-Fi Aware. Also use it to observe connectivity and interface changes with `NWPathMonitor`.

Do not reach for it just to call REST endpoints. For HTTP and HTTPS, `URLSession` already layers HTTP/2, HTTP/3, caching, cookies, redirects, and retry on the same user-space stack, so prefer it for the common case.

## Core guidance

- **Default to URLSession for HTTP.** Only drop to Network framework when you genuinely need TLS/TCP/UDP/QUIC or a custom protocol below the HTTP layer.
- **On iOS 26 / macOS 26, prefer the new Swift-native API.** `NetworkConnection`, `NetworkListener`, and `NetworkBrowser` use async/await and a declarative protocol-stack builder, replacing completion-handler `NWConnection` boilerplate; back-deploy to the classic API when you support older OSes.
- **Build the stack with `NWParameters`, not ad-hoc flags.** Use `.tls`, `.tcp`, `.udp`, or `.quic(alpn:)` factories, then attach protocol options (TLS pinning, keepalive) before starting.
- **Drive state from the handler, not polling.** Set `stateUpdateHandler` and react to `.preparing`, `.ready`, `.waiting(error)`, `.failed`, and `.cancelled`; treat `.waiting` as recoverable, never as terminal.
- **Pump receives in a loop and respect `isComplete`.** Each `receive` call delivers one chunk; re-issue until the peer half-closes, and always `cancel()` to release the connection.
- **Let the framework wait for connectivity.** Keep `waitForConnectivity` enabled so a connection parks in `.waiting` until a path appears instead of failing immediately.
- **Don't hand-roll reachability.** Use `NWPathMonitor` and honor `path.isExpensive` and `path.isConstrained` (cellular, Low Data Mode) before transferring large payloads.

```swift
let conn = NWConnection(host: "example.com", port: 443, using: .tls)
conn.stateUpdateHandler = { state in
    if case .ready = state { conn.send(content: payload, completion: .idempotent) }
}
conn.receiveMessage { data, _, isComplete, error in
    if let data { handle(data) }
    if isComplete || error != nil { conn.cancel() }
}
conn.start(queue: .global())
```

## Platform notes

- **iOS / iPadOS 26+:** The `NetworkConnection` / `NetworkListener` / `NetworkBrowser` family is the recommended entry point. `NetworkBrowser` adds Wi-Fi Aware peer discovery alongside Bonjour.
- **All platforms:** Classic `NWConnection`, `NWListener`, and `NWPathMonitor` ship since iOS 12 / macOS 10.14 and remain fully supported as the back-deployment path.
- **watchOS:** Background execution is tightly limited; expect connections to suspend off-screen and design for resumption from `.waiting`.
- **Local server or peer-to-peer:** `NWListener` and Bonjour discovery on the local network trigger the system permission prompt; you cannot bypass it.

## Pitfalls

- **Local network privacy.** Listening, browsing Bonjour, or any local-subnet traffic requires `NSLocalNetworkUsageDescription`, and Bonjour also needs `NSBonjourServices` listing each service type in `Info.plist`. Without them discovery silently fails. See TN3179.
- **Treating `.waiting` as fatal.** A `.waiting(error)` state means no path yet, not a hard failure; cancelling on it defeats `waitForConnectivity` and connectivity-change recovery.
- **Forgetting to cancel.** Connections, listeners, and path monitors leak resources until you call `cancel()`; tie cancellation to your object's lifecycle.
- **Reading once and assuming a full message.** TCP is a byte stream with no message boundaries; loop receives and frame messages yourself (or use a framer / the iOS 26 `Coder`).
- **Blocking the callback queue.** State and receive handlers run on the queue you pass to `start`; keep them fast and dispatch heavy work elsewhere.

## References

- **Documentation:** [Network framework](https://developer.apple.com/documentation/network)
- **Documentation:** [NWConnection](https://developer.apple.com/documentation/network/nwconnection)
- **Documentation:** [NWPathMonitor](https://developer.apple.com/documentation/network/nwpathmonitor)
- **Documentation:** [TN3179: Understanding local network privacy](https://developer.apple.com/documentation/technotes/tn3179-understanding-local-network-privacy)
- **WWDC:** [Use structured concurrency with Network framework (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/250/)
- **Sample Code:** [Building a custom peer-to-peer protocol](https://developer.apple.com/documentation/network/building-a-custom-peer-to-peer-protocol)

## See also

For ordinary HTTP and HTTPS request/response work, file uploads and downloads, and background transfers, prefer a dedicated URLSession networking skill rather than Network framework. When you layer Swift Codable models or JSON decoding on top of a connection, pair this with a Swift concurrency skill for cancellation and task management, and a Codable/JSON serialization skill for message framing.
