---
name: unit-testing-strategy
description: "Guides what to test and how to design Swift code for testability — the test pyramid, isolating logic from UI and I/O via injection and pure functions, test doubles (fakes, stubs, spies), clear naming, and treating coverage as a signal not a target. Use when deciding what is worth testing, structuring a test suite, refactoring untestable code, or reviewing test quality."
globs:
  - "**/*.swift"
tags: [testing, strategy, testability, test-doubles, coverage]
x-skills-master:
  domain: apple
  class: lang-tooling
  category: testing
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  requires:
    xcode: "26"
  pairs_with: []
  sources:
    - https://developer.apple.com/documentation/testing
    - https://developer.apple.com/documentation/xcode/determining-how-much-code-your-tests-cover
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Use when deciding *what* is worth testing rather than *how* to write a test, when a class resists testing because it reaches into the network, clock, or UI, or when reviewing a suite that is slow, flaky, or high-coverage-yet-low-confidence. This is the strategy layer above the `swift-testing` mechanics skill — prefer Swift Testing for new tests, but the principles here apply regardless of framework.

## Core guidance

- Test behavior, not implementation. Assert on observable outputs and effects for a given input; do not pin internal call order or private helpers, or every refactor breaks green tests.
- Favor the pyramid: many fast, isolated unit tests over pure logic; fewer integration tests across real collaborators; very few end-to-end UI tests. Push assertions down to the cheapest layer that can prove the behavior.
- Make logic a pure function of its inputs. Extract decisions out of view models and managers into free functions or small value types that take data and return data — those need no doubles at all.
- Inject the world. Pass clocks, network clients, and stores as protocol or closure dependencies so a test supplies a deterministic substitute. Don't read `Date()`, `URLSession.shared`, or `UserDefaults.standard` from inside the unit.
- Pick the right double for the question: a *stub* returns canned data, a *fake* is a working lightweight implementation (in-memory store), a *spy* records calls you later assert on. Reach for a real object first; mock only at genuine boundaries.
- Name tests as behavior statements — `discountsApplyOnlyAboveThreshold`, not `testCalc1`. The name and the `#expect` should read as a spec sentence.
- Treat coverage as a map of what is unexercised, not a target to chase. 100% of trivial getters proves little; an untested branch in pricing is a real gap.

## Platform notes

These principles are platform-agnostic and apply across iOS, macOS, watchOS, tvOS, and visionOS. The testable seams differ by layer: SwiftUI views are best verified by testing their view models and reducers, since the view body itself is rendered by the framework. Keep platform conditionals (`#if os(...)`) thin and behind injected dependencies so the bulk of logic is tested once on any platform.

```swift
protocol Clock { var now: Date { get } }

struct Subscription {
    let renewal: Date
    func isActive(using clock: Clock) -> Bool { clock.now < renewal }
}

// Test injects a fixed clock — no waiting, no real time.
struct FixedClock: Clock { let now: Date }
@Test func lapsedSubscriptionIsInactive() {
    let sub = Subscription(renewal: .init(timeIntervalSince1970: 0))
    #expect(sub.isActive(using: FixedClock(now: .init(timeIntervalSince1970: 100))) == false)
}
```

## Pitfalls

- Mocking types you own and could just construct. Over-mocking couples tests to call shapes; a real value or in-memory fake is more honest and survives refactors.
- Testing private methods directly. If logic deserves its own test, it deserves to be its own testable type with a clear interface.
- Hidden nondeterminism — real time, random, network, global singletons — causing flaky tests. Inject them or the suite erodes trust.
- Asserting on incidental details (formatted strings, ordering that isn't guaranteed) so cosmetic changes break tests.
- Gaming coverage with tests that execute lines but assert nothing meaningful; the number rises while confidence does not.

## References

- **Documentation:** [Swift Testing](https://developer.apple.com/documentation/testing)
- **Documentation:** [Organizing test functions with suite types](https://developer.apple.com/documentation/testing/organizingtests)
- **Documentation:** [Determining how much code your tests cover](https://developer.apple.com/documentation/xcode/determining-how-much-code-your-tests-cover)
- **Documentation:** [Improving code assessment by organizing tests into test plans](https://developer.apple.com/documentation/xcode/organizing-tests-to-improve-feedback)
- **WWDC:** [Meet Swift Testing (WWDC24)](https://developer.apple.com/videos/play/wwdc2024/10179/)
- **WWDC:** [Go further with Swift Testing (WWDC24)](https://developer.apple.com/videos/play/wwdc2024/10195/)

## See also

For the Swift Testing API itself — `@Test`, `#expect`/`#require`, parameterized cases, suites, and traits — see the Swift Testing skill, which this strategy layer sits on top of. For dependency boundaries, pair this with skills on protocol-oriented design and Swift concurrency when injecting async collaborators.
