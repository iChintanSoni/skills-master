## Full list-detail screen with ViewModel and predictive back

A complete, production-ready email client list-detail screen. The ViewModel owns the data and selected ID (survives process death via `SavedStateHandle`); the navigator owns pane visibility.

```kotlin
// EmailId.kt
@Parcelize
@JvmInline
value class EmailId(val value: String) : Parcelable

// Email.kt
data class Email(
    val id: EmailId,
    val subject: String,
    val preview: String,
    val body: String,
    val sender: String,
)

// EmailViewModel.kt
class EmailViewModel(private val savedState: SavedStateHandle) : ViewModel() {

    private val _emails = MutableStateFlow<List<Email>>(emptyList())
    val emails: StateFlow<List<Email>> = _emails.asStateFlow()

    val selectedId: StateFlow<EmailId?> =
        savedState.getStateFlow("selected_id", null)

    init {
        viewModelScope.launch {
            // Simulate repository load
            _emails.value = generateSampleEmails()
        }
    }

    fun selectEmail(id: EmailId?) {
        savedState["selected_id"] = id
    }

    private fun generateSampleEmails() = (1..20).map { i ->
        Email(
            id = EmailId("email-$i"),
            subject = "Subject line $i",
            preview = "Preview of email number $i...",
            body = "Full body of email number $i. This is longer content.",
            sender = "sender$i@example.com",
        )
    }
}

// EmailScreen.kt
@Composable
fun EmailScreen(
    viewModel: EmailViewModel = viewModel(),
) {
    val navigator = rememberListDetailPaneScaffoldNavigator<EmailId>()
    val emails by viewModel.emails.collectAsStateWithLifecycle()
    val selectedId by viewModel.selectedId.collectAsStateWithLifecycle()

    BackHandler(navigator.canNavigateBack()) {
        navigator.navigateBack()
        // Clear selection when returning to list on compact screens.
        if (!navigator.scaffoldValue.primary.isVisible) {
            viewModel.selectEmail(null)
        }
    }

    ListDetailPaneScaffold(
        directive = navigator.scaffoldDirective,
        value = navigator.scaffoldValue,
        listPane = {
            AnimatedPane {
                EmailListPane(
                    emails = emails,
                    selectedId = selectedId,
                    onEmailClick = { email ->
                        viewModel.selectEmail(email.id)
                        navigator.navigateTo(
                            pane = ListDetailPaneScaffoldRole.Detail,
                            content = email.id,
                        )
                    },
                )
            }
        },
        detailPane = {
            AnimatedPane {
                val email = emails.find { it.id == selectedId }
                if (email != null) {
                    EmailDetailPane(email = email)
                } else {
                    EmailDetailEmptyState()
                }
            }
        },
    )
}

@Composable
private fun EmailListPane(
    emails: List<Email>,
    selectedId: EmailId?,
    onEmailClick: (Email) -> Unit,
    modifier: Modifier = Modifier,
) {
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(vertical = 8.dp),
    ) {
        items(emails, key = { it.id.value }) { email ->
            val isSelected = email.id == selectedId
            ListItem(
                headlineContent = { Text(email.subject) },
                supportingContent = { Text(email.preview, maxLines = 1) },
                leadingContent = {
                    Icon(Icons.Default.Email, contentDescription = null)
                },
                modifier = Modifier
                    .clickable { onEmailClick(email) }
                    .background(
                        if (isSelected) MaterialTheme.colorScheme.secondaryContainer
                        else Color.Transparent
                    ),
            )
            HorizontalDivider()
        }
    }
}

@Composable
private fun EmailDetailPane(
    email: Email,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .widthIn(max = 840.dp)
            .padding(24.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Text(email.subject, style = MaterialTheme.typography.headlineSmall)
        Text("From: ${email.sender}", style = MaterialTheme.typography.labelMedium)
        HorizontalDivider()
        Text(email.body, style = MaterialTheme.typography.bodyLarge)
    }
}

@Composable
private fun EmailDetailEmptyState(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Icon(
                imageVector = Icons.Outlined.Email,
                contentDescription = null,
                modifier = Modifier.size(64.dp),
                tint = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Text(
                text = "Select an email to read",
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}
```

---

## Deep-link and initial destination

Opening the scaffold directly to the detail pane — for example when the app is launched from a notification — by providing an `initialDestinationHistory`.

```kotlin
@Composable
fun EmailScreenWithDeepLink(
    deepLinkEmailId: EmailId?,         // null when launched normally
    viewModel: EmailViewModel = viewModel(),
) {
    // Build initial history so the back stack starts at detail when deep-linked.
    val initialHistory = remember(deepLinkEmailId) {
        if (deepLinkEmailId != null) {
            listOf(
                ThreePaneScaffoldDestinationItem(ListDetailPaneScaffoldRole.List),
                ThreePaneScaffoldDestinationItem(
                    pane = ListDetailPaneScaffoldRole.Detail,
                    content = deepLinkEmailId,
                ),
            )
        } else {
            listOf(ThreePaneScaffoldDestinationItem(ListDetailPaneScaffoldRole.List))
        }
    }

    val navigator = rememberListDetailPaneScaffoldNavigator<EmailId>(
        initialDestinationHistory = initialHistory,
    )

    val emails by viewModel.emails.collectAsStateWithLifecycle()

    BackHandler(navigator.canNavigateBack()) {
        navigator.navigateBack()
    }

    LaunchedEffect(deepLinkEmailId) {
        if (deepLinkEmailId != null) {
            viewModel.selectEmail(deepLinkEmailId)
        }
    }

    ListDetailPaneScaffold(
        directive = navigator.scaffoldDirective,
        value = navigator.scaffoldValue,
        listPane = {
            AnimatedPane {
                EmailListPane(
                    emails = emails,
                    selectedId = deepLinkEmailId,
                    onEmailClick = { email ->
                        viewModel.selectEmail(email.id)
                        navigator.navigateTo(
                            pane = ListDetailPaneScaffoldRole.Detail,
                            content = email.id,
                        )
                    },
                )
            }
        },
        detailPane = {
            AnimatedPane {
                val targetId = navigator.currentDestination
                    ?.takeIf { it.pane == ListDetailPaneScaffoldRole.Detail }
                    ?.content
                val email = emails.find { it.id == targetId }
                if (email != null) {
                    EmailDetailPane(email = email)
                } else {
                    EmailDetailEmptyState()
                }
            }
        },
    )
}
```

---

## Forcing single-pane with a custom directive

When business logic requires single-pane mode regardless of window size (e.g. a guided wizard inside a sheet), supply a custom `PaneScaffoldDirective`.

```kotlin
@Composable
fun ForcedSinglePaneWizard(steps: List<WizardStep>) {
    val navigator = rememberListDetailPaneScaffoldNavigator<Int>()

    // Override: always single pane, regardless of window size.
    val singlePaneDirective = PaneScaffoldDirective(
        maxHorizontalPartitions = 1,
        horizontalPartitionSpacerSize = 0.dp,
        maxVerticalPartitions = 1,
        verticalPartitionSpacerSize = 0.dp,
        defaultPanePreferredWidth = 360.dp,
        excludedBounds = emptyList(),
    )

    BackHandler(navigator.canNavigateBack()) {
        navigator.navigateBack()
    }

    ListDetailPaneScaffold(
        directive = singlePaneDirective,            // force single pane
        value = navigator.scaffoldValue,
        listPane = {
            AnimatedPane {
                WizardStepList(
                    steps = steps,
                    onStepSelected = { index ->
                        navigator.navigateTo(
                            pane = ListDetailPaneScaffoldRole.Detail,
                            content = index,
                        )
                    },
                )
            }
        },
        detailPane = {
            AnimatedPane {
                val stepIndex = navigator.currentDestination
                    ?.takeIf { it.pane == ListDetailPaneScaffoldRole.Detail }
                    ?.content
                if (stepIndex != null && stepIndex in steps.indices) {
                    WizardStepDetail(step = steps[stepIndex])
                }
            }
        },
    )
}
```

---

## Testing pane state with ComposeTestRule

Unit-testing which pane is visible and that selection state is preserved after simulated rotation.

```kotlin
class EmailScreenTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun selectingEmail_showsDetailPane() {
        val emails = listOf(
            Email(EmailId("1"), "Hello", "Preview", "Body", "a@b.com"),
        )
        composeTestRule.setContent {
            MaterialTheme {
                // Provide a pre-populated ViewModel via factory or test double.
                EmailScreen(viewModel = fakeViewModelWith(emails))
            }
        }

        // Initially, detail is empty.
        composeTestRule.onNodeWithText("Select an email to read").assertIsDisplayed()

        // Tap the first list item.
        composeTestRule.onNodeWithText("Hello").performClick()

        // Detail pane now shows the body.
        composeTestRule.onNodeWithText("Body").assertIsDisplayed()
    }

    @Test
    fun backPress_returnsToListOnCompactScreen() {
        composeTestRule.setContent {
            // Simulate compact width by constraining layout.
            Box(Modifier.requiredWidth(360.dp)) {
                EmailScreen()
            }
        }

        composeTestRule.onNodeWithText("Subject line 1").performClick()
        composeTestRule.onNodeWithText("Full body of email number 1").assertIsDisplayed()

        composeTestRule.activity.onBackPressedDispatcher.onBackPressed()

        // Should be back on list.
        composeTestRule.onNodeWithText("Subject line 1").assertIsDisplayed()
    }
}
```
