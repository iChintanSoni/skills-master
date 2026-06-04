---
name: swift-testing
description: Writes tests with the Swift Testing framework — @Test functions, the expect and require macros, parameterized tests, suites, and async/throwing tests. Use when adding or restructuring tests for Apple-platform Swift code, migrating from XCTest, or parameterizing test cases.
---

## When to use

Use when writing or restructuring unit tests for Swift code with Apple's Swift Testing framework (the modern successor to XCTest), or when migrating existing XCTest cases. For UI automation, XCTest's UI testing is still the tool; this skill covers unit/logic tests.

## Core guidance

- Mark a test with the `@Test` macro on a function; there is no required class or `test` name prefix. Give it a clear display name: `@Test("rejects empty input")`.
- Assert with `#expect(...)` for soft checks that let the test continue, and `#require(...)` for preconditions that must hold (it throws and stops the test on failure, and safely unwraps optionals).
- Parameterize with `@Test(arguments:)` to run one function across many inputs instead of copy-pasting cases; each argument set reports as its own case.
- Group related tests in a `struct` or `actor` marked `@Suite`. A fresh suite instance is created per test, so store per-test setup in stored properties and tear down in `deinit` — no shared mutable state across tests.
- Write `async`/`throws` tests directly; `await` the code under test and `try #require` to unwrap. Use traits like `.tags(...)`, `.disabled("reason")`, and `.timeLimit(...)` instead of commenting tests out.

## Platform notes

Swift Testing ships with Swift 6 / Xcode 16 and runs on every Apple platform plus Linux. It coexists with XCTest in the same target, so migrate incrementally — keep XCTest UI tests while moving unit tests over.

## Pitfalls

- Reaching for `#expect` where a precondition is required; if later code dereferences the value, use `#require` so the test stops cleanly.
- Sharing mutable state between tests via `static` — rely on per-test suite instances instead.
- Porting `XCTAssertEqual` mechanically; prefer expressive `#expect(a == b)` which captures both operands on failure.

## References

- **Documentation:** [Swift Testing](https://developer.apple.com/documentation/testing)
- **Documentation:** [Expectations and confirmations](https://developer.apple.com/documentation/testing/expectations)
- **Documentation:** [Migrating a test from XCTest](https://developer.apple.com/documentation/testing/migratingfromxctest)
- **WWDC:** [Meet Swift Testing (WWDC24)](https://developer.apple.com/videos/play/wwdc2024/10179/)
- **WWDC:** [Go further with Swift Testing (WWDC24)](https://developer.apple.com/videos/play/wwdc2024/10195/)

## See also

- Apple: Swift Testing, "Migrating a test from XCTest" (see sources).
