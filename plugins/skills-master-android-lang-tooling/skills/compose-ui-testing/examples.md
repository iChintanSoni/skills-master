# compose-ui-testing — examples

## Full screen test with a fake ViewModel

A login screen tested end-to-end using a hand-rolled fake ViewModel, covering idle, loading, and error states.

```kotlin
// Production code — minimal interface for the ViewModel
interface LoginViewModel {
    val uiState: StateFlow<LoginUiState>
    fun onEmailChange(value: String)
    fun onPasswordChange(value: String)
    fun submit()
}

sealed interface LoginUiState {
    data object Idle : LoginUiState
    data object Loading : LoginUiState
    data class Error(val message: String) : LoginUiState
    data object Success : LoginUiState
}

// Test fake — controllable state, no coroutines, no dependencies
class FakeLoginViewModel(
    initialState: LoginUiState = LoginUiState.Idle
) : LoginViewModel {
    private val _uiState = MutableStateFlow<LoginUiState>(initialState)
    override val uiState: StateFlow<LoginUiState> = _uiState

    var lastEmail: String = ""
    var lastPassword: String = ""
    var submitCallCount: Int = 0

    override fun onEmailChange(value: String) { lastEmail = value }
    override fun onPasswordChange(value: String) { lastPassword = value }
    override fun submit() {
        submitCallCount++
        _uiState.value = LoginUiState.Error("Invalid credentials")
    }
}

// Tests
class LoginScreenTest {

    @get:Rule
    val composeRule = createComposeRule()

    @Test
    fun submitButton_click_callsViewModelSubmit() {
        val fake = FakeLoginViewModel()
        composeRule.setContent { LoginScreen(viewModel = fake) }

        composeRule
            .onNodeWithTag(TestTags.EMAIL_FIELD)
            .performTextInput("user@example.com")
        composeRule
            .onNodeWithTag(TestTags.PASSWORD_FIELD)
            .performTextInput("secret")
        composeRule
            .onNodeWithTag(TestTags.SUBMIT_BUTTON)
            .performClick()

        assertThat(fake.submitCallCount).isEqualTo(1)
        assertThat(fake.lastEmail).isEqualTo("user@example.com")
    }

    @Test
    fun errorState_showsBannerWithMessage() {
        val fake = FakeLoginViewModel(initialState = LoginUiState.Error("Invalid credentials"))
        composeRule.setContent { LoginScreen(viewModel = fake) }

        composeRule
            .onNodeWithTag(TestTags.ERROR_BANNER)
            .assertIsDisplayed()
            .assertTextContains("Invalid credentials", substring = true)
    }

    @Test
    fun loadingState_submitButtonIsDisabled() {
        val fake = FakeLoginViewModel(initialState = LoginUiState.Loading)
        composeRule.setContent { LoginScreen(viewModel = fake) }

        composeRule
            .onNodeWithTag(TestTags.SUBMIT_BUTTON)
            .assertIsNotEnabled()
    }
}
```

## Scrollable list with performScrollToKey

Tests a `LazyColumn` where items are only in the semantics tree once rendered, using `performScrollToKey` to reach an off-screen item.

```kotlin
@Test
fun lazyList_scrollsToItemByKey_andAsserts() {
    val items = (1..50).map { "Item $it" }

    composeRule.setContent {
        LazyColumn(modifier = Modifier.fillMaxSize()) {
            items(items = items, key = { it }) { label ->
                Text(
                    text = label,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                        .testTag("item_$label")
                )
            }
        }
    }

    // Item 42 is off-screen; scroll to it by key before asserting
    composeRule
        .onNodeWithTag("item_Item 42")
        .performScrollTo()

    composeRule
        .onNodeWithTag("item_Item 42")
        .assertIsDisplayed()
        .assertTextEquals("Item 42")
}
```

## Clock control for animation-gated state

Demonstrates `mainClock.autoAdvance = false` to precisely step through an animated transition before asserting that a composable has reached its visible state.

```kotlin
@Test
fun animatedVisibility_afterClockAdvance_contentIsDisplayed() {
    var visible by mutableStateOf(false)

    composeRule.setContent {
        AnimatedVisibility(visible = visible) {
            Text(
                text = "Now you see me",
                modifier = Modifier.testTag("animated_text")
            )
        }
    }

    // Pause the Compose clock so we control animation progress
    composeRule.mainClock.autoAdvance = false
    visible = true

    // Mid-animation: node exists but may not be fully visible
    composeRule.mainClock.advanceTimeBy(150)
    composeRule.onNodeWithTag("animated_text").assertExists()

    // Advance past the full animation duration (300 ms default fade)
    composeRule.mainClock.advanceTimeBy(200)
    composeRule.onNodeWithTag("animated_text").assertIsDisplayed()

    // Restore auto-advance for subsequent tests
    composeRule.mainClock.autoAdvance = true
}
```

## Testing a custom stateless composable with merged and unmerged trees

Shows the difference between the merged semantics tree (default) and the unmerged tree, and when to use each.

```kotlin
@Composable
fun IconButton(
    icon: ImageVector,
    contentDescription: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        contentAlignment = Alignment.Center,
        modifier = modifier
            .clickable(onClick = onClick)
            .semantics { this.contentDescription = contentDescription }
    ) {
        Icon(imageVector = icon, contentDescription = null)
    }
}

class IconButtonTest {

    @get:Rule
    val composeRule = createComposeRule()

    private var clickCount = 0

    @BeforeEach
    fun setUp() {
        clickCount = 0
        composeRule.setContent {
            IconButton(
                icon = Icons.Default.Favorite,
                contentDescription = "Favourite",
                onClick = { clickCount++ }
            )
        }
    }

    @Test
    fun mergedTree_findsNodeByContentDescription() {
        // Default merged tree: the Box exposes a single node with contentDescription
        composeRule
            .onNodeWithContentDescription("Favourite")
            .assertIsDisplayed()
            .performClick()

        assertThat(clickCount).isEqualTo(1)
    }

    @Test
    fun unmergedTree_findsIconChildNode() {
        // Unmerged tree: reveals the inner Icon node (contentDescription = null)
        composeRule
            .onNode(
                matcher = hasContentDescription(""),
                useUnmergedTree = true
            )
            .assertExists()
    }
}
```
