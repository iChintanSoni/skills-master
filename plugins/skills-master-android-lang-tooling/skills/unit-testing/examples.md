## Examples

Short, focused snippets showing the most common unit-testing patterns for Android Kotlin code.

### 1. Fake vs mock — prefer a fake for owned interfaces

```kotlin
// Interface owned by the app
interface ItemRepository {
    suspend fun search(query: String): List<Item>
}

// Fake: a working in-memory implementation
class FakeItemRepository : ItemRepository {
    private var items: List<Item> = emptyList()
    fun setItems(list: List<Item>) { items = list }
    override suspend fun search(query: String) = items.filter { it.name.contains(query) }
}

// Test uses the fake — no mocking framework needed
@Test
fun `search returns matching items`() = runTest {
    val repo = FakeItemRepository()
    repo.setItems(listOf(Item("kotlin"), Item("java")))
    assertEquals(listOf(Item("kotlin")), repo.search("kotlin"))
}
```

### 2. MockK for a third-party boundary

```kotlin
// Analytics SDK — not owned, so mocking is appropriate
val analytics = mockk<AnalyticsClient>(relaxed = true)
val tracker = EventTracker(analytics)

tracker.track(Event.Purchase(amount = 9.99))

coVerify(exactly = 1) { analytics.send(match { it.name == "purchase" }) }
```

### 3. ViewModel with `runTest` and `StandardTestDispatcher`

```kotlin
@OptIn(ExperimentalCoroutinesApi::class)
class UserViewModelTest {
    private val testDispatcher = StandardTestDispatcher()

    @Before fun setUp() = Dispatchers.setMain(testDispatcher)
    @After fun tearDown() = Dispatchers.resetMain()

    @Test
    fun `load updates user state after coroutine runs`() = runTest(testDispatcher) {
        val repo = FakeUserRepository(user = User(id = "1", name = "Ada"))
        val vm = UserViewModel(repo)

        vm.loadUser("1")
        advanceUntilIdle()               // let the launched coroutine finish

        assertEquals("Ada", vm.user.value?.name)
    }
}
```

### 4. Testing a `StateFlow` with Turbine

```kotlin
@Test
fun `search flow emits loading then results`() = runTest {
    val vm = SearchViewModel(repo = FakeItemRepository().apply {
        setItems(listOf(Item("flow"), Item("rxjava")))
    })

    vm.uiState.test {
        assertEquals(SearchUiState.Idle, awaitItem())   // initial value

        vm.search("flow")
        assertEquals(SearchUiState.Loading, awaitItem())
        assertEquals(SearchUiState.Results(listOf(Item("flow"))), awaitItem())

        cancelAndIgnoreRemainingEvents()
    }
}
```

### 5. Testing time-based logic (debounce) with virtual time

```kotlin
@Test
fun `debounced search only fires once for rapid inputs`() = runTest {
    val dispatcher = StandardTestDispatcher(testScheduler)
    val repo = FakeItemRepository()
    val vm = DebouncedSearchViewModel(repo, dispatcher)

    vm.onQueryChange("k")
    vm.onQueryChange("ko")
    vm.onQueryChange("kot")

    // Debounce delay is 300 ms — advance just past it
    advanceTimeBy(301)
    runCurrent()

    // Only one search call, with the final query
    assertEquals(1, repo.searchCallCount)
    assertEquals("kot", repo.lastQuery)
}
```

### 6. Parameterized test — boundary cases in one block (JUnit 5)

```kotlin
@ParameterizedTest
@CsvSource("0, false", "1, true", "100, true", "-1, false")
fun `isPositive returns expected result`(input: Int, expected: Boolean) {
    assertEquals(expected, input.isPositive())
}
```
