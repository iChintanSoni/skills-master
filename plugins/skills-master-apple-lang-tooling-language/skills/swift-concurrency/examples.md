# swift-concurrency — examples

## Structured parallelism with `async let`

```swift
func loadProfile(id: User.ID, api: API) async throws -> Profile {
    // Both requests run concurrently; the scope awaits and cancels together.
    async let details = api.userDetails(id)
    async let avatar  = api.avatar(id)
    return try await Profile(details: details, image: avatar)
}
```

## Actor isolating shared state

```swift
actor RequestCounter {
    private var counts: [String: Int] = [:]

    func record(_ path: String) -> Int {
        // Serialized automatically; no lock, no `await` inside the body.
        counts[path, default: 0] += 1
        return counts[path]!
    }
}
```

## Dynamic fan-out with a task group

```swift
func sizes(of urls: [URL], using fetch: @Sendable (URL) async throws -> Int)
    async throws -> Int {
    try await withThrowingTaskGroup(of: Int.self) { group in
        for url in urls { group.addTask { try await fetch(url) } }
        return try await group.reduce(0, +) // cancels siblings on first throw
    }
}
```

## Bridging a callback API to async

```swift
func currentLocation(_ manager: LocationManager) async throws -> Location {
    try await withCheckedThrowingContinuation { continuation in
        manager.requestLocation { result in
            continuation.resume(with: result) // resume exactly once
        }
    }
}
```
