---
name: choosing-async-pattern
description: Decision guide for picking an asynchronous pattern in Swift in the 2026 (OS 26, Swift 6.x) cycle — async/await and structured concurrency as the default, AsyncSequence and AsyncStream for value streams, where Combine still earns its place (and that it is legacy-leaning), and completion handlers only at old API boundaries. Use when starting new async code and unsure which tool to reach for, when bridging a callback or Combine API into async/await, when modeling a stream of values over time, or when deciding whether to keep or retire a Combine pipeline.
---

## When to use

Reach for this skill when you are about to write asynchronous code and the right tool is not obvious: a one-shot operation, a stream of values over time, a callback API you must adapt, or an existing Combine pipeline you are deciding whether to keep. It is a routing guide that points you at the right mechanism and explains the tradeoffs — not a tutorial on any one of them. If you already know you want, say, a `TaskGroup`, go straight to the focused concurrency skills.

## Core guidance

- Default to async/await with structured concurrency for single results and for fan-out work. `async let` and `withTaskGroup` give automatic cancellation propagation and scoped lifetimes, so children cannot outlive their parent and leak. Prefer them over unstructured `Task { }` and strongly over `Task.detached`.
- Use `AsyncSequence` when you consume a finite or open-ended sequence of values with a `for await` loop — bytes, notifications, file lines, or anything that arrives over time. It composes with cancellation and back-pressure naturally.
- Reach for `AsyncStream` (or `AsyncThrowingStream`) to bridge a callback- or delegate-based producer into that world. The continuation lets synchronous code yield values and finish; pick a buffering policy deliberately rather than defaulting to unbounded.
- Treat Combine as legacy-leaning: keep it where it already runs well (rich operator chains, multi-subscriber `@Published` pipelines), but do not start new event-stream code in it. Bridge out with a publisher's `.values` property to iterate it as an `AsyncSequence`.
- Use completion handlers only at the boundary of old APIs you do not own. Wrap them once with `withCheckedContinuation` / `withCheckedThrowingContinuation` and resume the continuation exactly once — never zero times (hang) or twice (crash).
- Don't block a thread to await async work (no semaphores around `Task`), and don't reach for `Task.detached` to "escape" an actor; pass explicit isolation or mark work `nonisolated` instead.
- For Combine-style operators over async sequences (debounce, merge, combineLatest), use the `swift-async-algorithms` package rather than keeping Combine alive just for them.

```swift
// Bridge a delegate/callback producer into an AsyncSequence.
func locationUpdates() -> AsyncStream<CLLocation> {
    AsyncStream(bufferingPolicy: .bufferingNewest(1)) { continuation in
        let driver = LocationDriver { location in
            continuation.yield(location)
        }
        continuation.onTermination = { _ in driver.stop() }
        driver.start()
    }
}
```

## Platform notes

- All platforms: structured concurrency, `AsyncSequence`, and `AsyncStream` ship in the Swift standard library and Foundation, so the same decision tree applies on iOS, iPadOS, macOS, watchOS, tvOS, and visionOS.
- SwiftUI: prefer the `.task` modifier over manual `Task { }` in `onAppear` — it cancels automatically when the view disappears, which matters most on memory-tight watchOS and tvOS.
- Swift 6.2 / Xcode 26: with approachable-concurrency settings, code is main-actor by default and moving work off it is opt-in via `@concurrent`; let the compiler guide isolation rather than scattering `Task.detached`.
- Combine remains available everywhere it shipped, but Apple invests new streaming surface (async bytes, notification sequences) in `AsyncSequence`, not in new publishers.

## Pitfalls

- Resuming a checked continuation more than once (crash) or never (permanent hang). Capture it, resume on every path including errors, and verify exactly one resume.
- Wrapping `Task { await … }` in a `DispatchSemaphore.wait()` to "make it synchronous" — this can deadlock the cooperative thread pool. Make the caller async instead.
- Defaulting `AsyncStream` to an unbounded buffer, so a fast producer outpacing a slow consumer grows memory without bound. Choose `.bufferingNewest` or `.bufferingOldest` on purpose.
- Keeping a whole Combine stack alive only for one operator that `swift-async-algorithms` already provides.
- Using `Task.detached` to silence an isolation warning; you lose structured cancellation and priority inheritance and usually reintroduce a data race elsewhere.
- Forgetting that `for await` exits silently on cancellation — clean up producer-side resources in `onTermination`.

## References

- **Documentation:** [Concurrency](https://developer.apple.com/documentation/swift/concurrency)
- **Documentation:** [AsyncSequence](https://developer.apple.com/documentation/swift/asyncsequence)
- **Documentation:** [AsyncStream](https://developer.apple.com/documentation/swift/asyncstream)
- **WWDC:** [Embracing Swift concurrency (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/268/)
- **WWDC:** [Explore structured concurrency in Swift (WWDC21)](https://developer.apple.com/videos/play/wwdc2021/10134/)
- **WWDC:** [Meet AsyncSequence (WWDC21)](https://developer.apple.com/videos/play/wwdc2021/10058/)

## See also

See `swift-concurrency` for the depth treatment of tasks, actors, and isolation once you have chosen async/await, and `swiftui-core` for how the `.task` modifier ties async work to a view's lifetime. When bridging an existing Combine codebase, pair this with the migration guidance in the relevant data-flow skill.
