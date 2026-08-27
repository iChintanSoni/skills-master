## Android unit-testing checklist

- [ ] All logic that does not require a real device or `Context` lives in `src/test/` as a local JVM test.
- [ ] `CoroutineDispatcher` is injected into every class that launches coroutines, not hardcoded as `Dispatchers.IO` or `Dispatchers.Default`.
- [ ] `runTest` (not `runBlocking`) is used for every coroutine test so that `delay` calls skip virtual time.
- [ ] `Dispatchers.setMain(testDispatcher)` is called in `@Before` and `Dispatchers.resetMain()` is called in `@After` for every test class that exercises a ViewModel using `viewModelScope`.
- [ ] `advanceUntilIdle()` or `advanceTimeBy()` is called before asserting on state changed by a launched coroutine when using `StandardTestDispatcher`.
- [ ] Owned interfaces are doubled with fakes (in-memory implementations) rather than mocks where practical.
- [ ] MockK is used only at genuine external boundaries (third-party SDKs, Android framework classes); owned interfaces have hand-written fakes.
- [ ] `coEvery`/`coVerify` is used for stubbing and verifying suspend functions in MockK; plain `every`/`verify` is not applied to `suspend` calls.
- [ ] Fresh mock/fake instances are created per test method; no mutable state is shared between test methods.
- [ ] `verify` calls are kept to a minimum — only at fire-and-forget event boundaries, not to check that internal methods were called.
- [ ] Turbine's `flow.test { }` is used for asserting on `Flow` and `StateFlow` emissions; manual `launch`/channel collection is not used.
- [ ] `cancelAndIgnoreRemainingEvents()` is called at the end of Turbine blocks collecting a hot `StateFlow` to prevent unexpected-event failures.
- [ ] Test names read as behavior sentences (what the system does under what condition), not implementation names like `testMethod1`.
- [ ] Each test asserts one logical behavior; independent behaviors are split into separate test functions.
- [ ] Room DAO tests, `WorkManager` integration tests, and Compose UI tests are in `src/androidTest/` and NOT in `src/test/`.
- [ ] The `kotlinx-coroutines-test` version matches `kotlinx-coroutines-core` (aligned via the Kotlin BOM or explicit version pinning).
