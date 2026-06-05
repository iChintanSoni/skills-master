---
name: testing-async-code
description: "Guidance for testing async, concurrent, and time-based Swift code with Swift Testing: async test functions, confirmations for callbacks and streams, time limits, actor and MainActor isolation, and injected clocks. Use when writing or reviewing tests that await results, exercise AsyncStream or completion handlers, hit flaky sleeps, or need deterministic timing."
---

## When to use

Reach for this skill when a test must `await` a result, observe a callback or
`AsyncStream` that fires an unknown number of times, exercise an `actor` or
`@MainActor`-isolated type, or pin time-dependent behavior (debounce, retry,
timeout) without waiting on the wall clock. It applies to any Swift Testing
target on the 26 toolchain. If you are still on XCTest expectations, the same
principles map onto a migration.

## Core guidance

- Mark the test `async` and `await` directly — `@Test func loads() async throws { let v = try await sut.load(); #expect(v.isReady) }`. No wrapper, no expectation object.
- Use `confirmation` for events you cannot await: callbacks, delegate methods, and streams. Call the confirm closure each time the event fires; the count is checked when the body returns.
- Set `expectedCount` deliberately. Default is `1`; pass a `ClosedRange` (Swift 6.1+) like `expectedCount: 1...4` for variable streams, and `expectedCount: 0` to assert an event never happens.
- Don't sleep to "wait" for async work — `Task.sleep` makes tests slow and flaky. Bridge a single completion handler with `withCheckedContinuation` and assert before resuming.
- Bound runaway work with `.timeLimit(.minutes(1))` on a `@Test` or `@Suite`. Granularity is whole minutes; the shortest applicable limit wins and a breach fails as `timeLimitExceeded`. It is a safety net, not a way to test fast timeouts.
- Add `@MainActor` to a test or suite when the system under test is main-actor isolated; tests otherwise run in parallel on arbitrary tasks. Use `.serialized` only when shared mutable state forces ordering.
- Inject a `Clock` instead of calling `ContinuousClock` or `Task.sleep` inside production code. In tests drive a controllable clock and `advance(by:)` to make timers deterministic.

## Platform notes

Swift Testing ships in Xcode 26 across all Apple platforms and runs tests in
parallel — including on physical devices — by default. With Swift 6.2 default
actor isolation enabled, code (and tests) may default to `@MainActor`; verify
where your async work actually runs before assuming a background context.
`async` tests are first class on every platform, so prefer them over
continuation gymnastics whenever the API already exposes `async`.

## Pitfalls

- Confirming inside a detached `Task` that outlives the `confirmation` body: the count is read when the closure returns, so unawaited work is missed. Await the task first.
- Treating `.timeLimit` as a per-assertion deadline — it only cancels the whole test, and only at minute granularity.
- Forgetting that a failed `#expect` inside a continuation's callback still needs the continuation resumed, or the test hangs until the time limit fires.
- Sharing one `actor` instance across parallel tests; create fresh state per test to avoid cross-test races.
- Using `expectedCount: 1` for an `AsyncStream` that emits a variable number of values — use a range so a legitimate extra emission does not fail.

## Core idiom

```swift
@MainActor
@Test func streamEmitsBetweenOneAndThreeValues() async throws {
    let monitor = TemperatureMonitor(clock: testClock)
    await confirmation("reading received", expectedCount: 1...3) { received in
        for await _ in monitor.readings.prefix(3) {
            received()              // fires once per emitted value
        }
    }
}
```

## References

- **Documentation:** [Testing asynchronous code](https://developer.apple.com/documentation/testing/testing-asynchronous-code)
- **Documentation:** [Expectations and confirmations](https://developer.apple.com/documentation/testing/expectations)
- **Documentation:** [timeLimit(_:) trait](https://developer.apple.com/documentation/testing/trait/timelimit(_:))
- **WWDC:** [Go further with Swift Testing (WWDC24)](https://developer.apple.com/videos/play/wwdc2024/10195/)
- **WWDC:** [Meet Swift Testing (WWDC24)](https://developer.apple.com/videos/play/wwdc2024/10179/)

## See also

Pair this with the Swift Testing fundamentals skill for `#expect`/`#require`
basics and parameterized tests, the structured-concurrency skill for designing
the `async` and `actor` APIs you are testing, and the clock-and-duration skill
for injecting `Clock` dependencies that make time-based tests deterministic.
