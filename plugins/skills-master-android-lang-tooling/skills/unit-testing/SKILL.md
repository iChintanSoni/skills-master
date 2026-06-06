---
name: unit-testing
description: Covers JVM unit testing for Android — JUnit 5 structure, test naming, fakes vs mocks with MockK, testing coroutines with runTest and TestDispatchers, testing Flow with Turbine, and deciding what belongs in a local JVM test versus an instrumented test. Use when writing or reviewing unit tests for Android Kotlin code, choosing test doubles, or testing coroutine and Flow-based logic without a device.
---

## When to use

Reach for this skill when writing or reviewing unit tests for Android Kotlin code that runs in a local JVM — no emulator or device required. It applies whenever you need to test a `ViewModel`, repository, use case, or domain model that involves suspend functions, `Flow`, or injected dependencies. It also helps you decide the right kind of test double and what to push down to a local test versus leave for an instrumented test.

## Core guidance

### Local JVM tests vs instrumented tests

- **Local tests** run on the JDK in `src/test/`. They are fast, need no device, and cover the vast majority of logic: ViewModels, repositories, use cases, domain classes, pure functions, and any code that either does not touch Android framework classes or whose Android dependencies can be faked via Robolectric or constructor injection.
- **Instrumented tests** run on a device or emulator in `src/androidTest/`. Reserve them for things a JVM cannot simulate: Room queries against a real SQLite engine, `ContentProvider` behavior, `WorkManager` integration, or UI-level Compose tests. Every test that can be local should be.
- The deciding question: does the test need a real `Context`, a real database file, or a real `Activity`? If no, keep it local.

### JUnit structure and naming

- Use JUnit 4 (`@Test` from `org.junit`) for most Android projects — it is the default in AGP's test task. JUnit 5 is supported via the `junit-vintage-engine` or the `junit-jupiter` engine added to Gradle; use it for new modules when the team has opted in, since it offers better parameterisation and extension APIs.
- Nest related tests inside inner `@Nested` classes (JUnit 5) or separate classes named after the scenario (JUnit 4) to keep test files readable.
- Name tests as behavior sentences: `givenExpiredSubscription_whenCheckingIsActive_thenReturnsFalse` or the flat `expiredSubscriptionIsInactive`. The name should read as a specification without looking at the body.
- One logical assertion per test. Multiple `assert` calls for the same logical outcome are fine; testing multiple independent behaviors in one test obscures the failure.
- Use `@Before`/`@BeforeEach` to set up fresh state — never share mutable state between test methods.

### Fakes vs mocks

Prefer fakes over mocks for collaborators you own:

- A **fake** is a lightweight working implementation (in-memory list instead of a database, deterministic clock instead of `System.currentTimeMillis()`). It survives refactoring, requires no framework, and runs with zero overhead.
- A **mock** (via MockK) is appropriate at genuine external boundaries — third-party SDKs, Android framework classes you cannot subclass, or collaborators so complex that a fake would duplicate too much production logic.
- A **stub** (MockK's `every { } returns`) is appropriate when you just need a collaborator to return a value and you do not care how many times it was called. Keep `verify` calls to a minimum; asserting on call counts couples tests to internal call shapes.
- Never mock types you could just construct with sensible defaults.

### MockK essentials

- Add `io.mockk:mockk` to `testImplementation`. Use `mockk<T>()` for interface or open-class mocks, and `spyk(realInstance)` when you need a partial mock of a concrete class (sparingly).
- Use `coEvery { … } returns …` and `coVerify { … }` for suspend functions.
- Prefer `relaxed = true` for secondary collaborators whose return values the test does not care about, so you avoid stubbing every function signature.
- Use `MockKAnnotations.init(this)` or `@ExtendWith(MockKExtension::class)` (JUnit 5) to reduce boilerplate.

### Testing coroutines with `runTest`

`kotlinx-coroutines-test` provides `runTest`, `TestScope`, and two standard dispatchers:

- **`StandardTestDispatcher`** — does not run coroutines eagerly. Advance virtual time explicitly with `advanceUntilIdle()`, `advanceTimeBy(ms)`, or `runCurrent()`. Use this when you need fine-grained control over ordering or timing (debounce, retry with delay).
- **`UnconfinedTestDispatcher`** — runs coroutines eagerly as they are launched, in the current thread. Simpler for ViewModels that just launch-and-collect, but hides ordering bugs.

Always inject `CoroutineDispatcher` or `TestScope` into your ViewModels and repositories so tests can swap dispatchers. Never hardcode `Dispatchers.IO` or `Dispatchers.Main` inside a class constructor or `init` block.

```kotlin
// ViewModel under test — dispatcher is injected
class SearchViewModel(
    private val repo: ItemRepository,
    private val ioDispatcher: CoroutineDispatcher = Dispatchers.IO,
) : ViewModel() {
    private val _results = MutableStateFlow<List<Item>>(emptyList())
    val results: StateFlow<List<Item>> = _results.asStateFlow()

    fun search(query: String) {
        viewModelScope.launch(ioDispatcher) {
            _results.value = repo.search(query)
        }
    }
}

// Test
class SearchViewModelTest {
    private val testDispatcher = StandardTestDispatcher()
    private val repo = FakeItemRepository()

    @Test
    fun `search emits results for matching query`() = runTest(testDispatcher) {
        val vm = SearchViewModel(repo, testDispatcher)
        repo.setItems(listOf(Item("kotlin"), Item("java")))

        vm.search("kotlin")
        advanceUntilIdle()

        assertEquals(listOf(Item("kotlin")), vm.results.value)
    }
}
```

- Use `Dispatchers.setMain(testDispatcher)` / `Dispatchers.resetMain()` in `@Before`/`@After` (or via `@Rule`/`@Extension`) when the ViewModel internally launches on `Dispatchers.Main` through `viewModelScope`.
- `runTest` automatically skips `delay()` calls by advancing virtual time; real wall-clock time is never spent.

### Testing Flow with Turbine

Turbine (from Cash App) is the idiomatic library for asserting on `Flow` emissions without manual coroutine wiring:

- Call `flow.test { }` inside a `runTest` block. The lambda receives a `TurbineReceiver`.
- `awaitItem()` — suspend until the next emission and return it.
- `awaitComplete()` — assert the flow completed.
- `awaitError()` — assert the flow threw.
- `cancelAndIgnoreRemainingEvents()` — stop collection on a hot flow (e.g. `StateFlow`) without asserting on remaining items.
- For multiple concurrent flows, use `turbineScope { val t1 = flow1.testIn(this); val t2 = flow2.testIn(this) }` to collect in parallel without one blocking the other.

```kotlin
@Test
fun `results flow emits filtered list then completes`() = runTest {
    val flow = flowOf(Item("a"), Item("b"), Item("c"))
        .filter { it.name != "b" }

    flow.test {
        assertEquals(Item("a"), awaitItem())
        assertEquals(Item("c"), awaitItem())
        awaitComplete()
    }
}
```

### What belongs where — quick reference

| Scenario | Local JVM test | Instrumented test |
|---|---|---|
| ViewModel + fake repository | Yes | No |
| Use case / domain logic | Yes | No |
| Coroutine + Flow pipeline | Yes (runTest + Turbine) | No |
| Room DAO queries | No (unless Robolectric) | Yes |
| WorkManager workers | No | Yes |
| Compose UI rendering | No | Yes |
| Custom `View` rendering | No | Yes |
| `ContentProvider` | No | Yes |

## Platform notes

- `viewModelScope` uses `Dispatchers.Main.immediate` internally. Tests that exercise `viewModelScope` must install a test main dispatcher with `Dispatchers.setMain(testDispatcher)` before running.
- AGP 8+ uses JUnit 4 by default for local tests. To use JUnit 5 (Jupiter) add the `de.mannodermaus.android-junit5` Gradle plugin and the `junit-jupiter-api`/`junit-jupiter-engine` dependencies; it works alongside JUnit 4 tests via the vintage engine.
- Robolectric allows a subset of Android framework classes to run on the JVM. Use it only for code where a real `Context` is unavoidable but the logic belongs in a local test (e.g. `SharedPreferences` wrappers, simple `Intent` construction). Do not use it as a substitute for proper injection.
- `kotlinx-coroutines-test` version must match `kotlinx-coroutines-core`. Use the Kotlin BOM or pin both to the same version to avoid subtle `TestCoroutineScheduler` conflicts.
- MockK 1.13+ has first-class support for Kotlin 2.x value classes and `inline` functions; update if you see `ClassCastException` in mocks of value-class parameters.

## Pitfalls

- **Hardcoding dispatchers.** A ViewModel that calls `withContext(Dispatchers.IO)` internally and never accepts a dispatcher parameter cannot be tested without installing `Dispatchers.setMain`. Inject dispatchers from the outside.
- **Using `runBlocking` instead of `runTest`.** `runBlocking` does not skip delays or use a test scheduler; a `delay(5_000)` in the code under test blocks the test thread for five real seconds.
- **Not resetting `Dispatchers.Main`.** Forgetting `Dispatchers.resetMain()` in teardown causes the test dispatcher to leak into subsequent tests, producing order-dependent failures.
- **Asserting on `StateFlow.value` immediately after launching.** With `StandardTestDispatcher`, coroutines do not run until you advance. Check after `advanceUntilIdle()` or switch to `UnconfinedTestDispatcher` only when ordering does not matter.
- **Over-mocking.** Mocking a class you own — one you could instantiate with a few parameters — couples the test to the current call signature. A fake that implements the same interface survives refactoring far better.
- **Calling `verify` on every mock.** Verifying calls asserts on internal implementation details. Assert on observable state or return values; only verify interactions at genuine boundaries (e.g. confirming a fire-and-forget analytics call was sent).
- **Sharing a single mock across test methods.** MockK state (recorded calls, stubbing) accumulates. Create fresh mocks per test or call `clearMocks(mock)` in `@Before`.
- **Turbine `awaitItem()` hanging forever.** If the flow never emits, `awaitItem()` suspends indefinitely. Add a `timeout` parameter or ensure the flow under test actually emits under the test conditions.

## References

- **Documentation:** [Build local unit tests — Android Developers](https://developer.android.com/training/testing/local-tests)
- **Documentation:** [Fundamentals of testing Android apps](https://developer.android.com/training/testing/fundamentals)
- **Library:** [kotlinx-coroutines-test](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-test/)
- **Library:** [Turbine — Flow testing by Cash App](https://github.com/cashapp/turbine)
- **Library:** [MockK — mocking library for Kotlin](https://mockk.io)

## See also

For coroutine fundamentals and structured concurrency the test patterns here build on, see `kotlin-coroutines`. For Flow operators and `StateFlow`/`SharedFlow` semantics, see `kotlin-flow`. For Compose UI-level tests that run on a device, pair with a future `compose-ui-testing` skill. For dependency injection patterns that make code testable via constructor injection, pair with a `dependency-injection` skill.
