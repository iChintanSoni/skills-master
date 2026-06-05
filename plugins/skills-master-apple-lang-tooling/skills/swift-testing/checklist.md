# swift-testing — checklist

- [ ] Each test is a function marked `@Test` with a descriptive display name, e.g. `@Test("rejects empty input")` — no `test` prefix or `XCTestCase` subclass required.
- [ ] Soft assertions use `#expect(a == b)` so the test keeps running and both operands are captured on failure.
- [ ] Preconditions that must hold (and optional unwraps) use `try #require(...)`, which stops the test cleanly instead of crashing later.
- [ ] Tests that touch async code are `async` and `await` the code under test; throwing paths are `throws` with `try #require`/`try`.
- [ ] Repeated cases are collapsed into one `@Test(arguments:)` parameterized function rather than copy-pasted bodies; each argument reports as its own case.
- [ ] Multi-input combinations use `@Test(arguments: zip(...))` for paired inputs (not the full cross-product) when only matched pairs are valid.
- [ ] Related tests are grouped in a `struct` or `actor` annotated `@Suite` (the annotation is implicit when any `@Test` lives inside, but name it for clarity).
- [ ] Per-test setup lives in stored properties / the suite `init`; teardown lives in `deinit` — relying on a fresh suite instance per test, not shared state.
- [ ] No `static` or otherwise shared mutable state is used to pass data between tests.
- [ ] Error cases are asserted with `#expect(throws:)` or `#expect(throws: MyError.self)` instead of manual do/catch.
- [ ] Tests are skipped with `.disabled("reason")` (or `.enabled(if:)`) and bounded with `.timeLimit(...)` — never commented out.
- [ ] Tests are categorized with `.tags(...)` using a shared `@Tag` declaration so the IDE/CLI can filter by tag.
- [ ] Confirmations (`await confirmation { ... }`) verify callbacks/notifications fire the expected number of times instead of sleeping.
- [ ] Suites or tests that must not overlap shared resources are marked `.serialized`; otherwise tests are assumed to run in parallel.
- [ ] When coexisting with XCTest in the same target, unit logic uses Swift Testing while XCTest is kept only for UI automation; no `XCTAssert*` is mixed into `@Test` functions.
- [ ] Builds clean under Swift 6 strict concurrency — suite types and shared values are `Sendable` where the compiler requires it.
