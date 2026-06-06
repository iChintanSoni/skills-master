## Stable data model with ImmutableList

A realistic message feed where the list parameter is truly stable and the composable can be fully skipped on unrelated state changes.

```kotlin
import androidx.compose.runtime.Immutable
import kotlinx.collections.immutable.ImmutableList
import kotlinx.collections.immutable.toImmutableList

@Immutable
data class Message(
    val id: String,
    val author: String,
    val body: String,
    val timestampMillis: Long,
)

// ViewModel produces an ImmutableList so the composable's parameter is stable.
class InboxViewModel : ViewModel() {
    private val _messages = MutableStateFlow<ImmutableList<Message>>(emptyList<Message>().toImmutableList())
    val messages: StateFlow<ImmutableList<Message>> = _messages.asStateFlow()

    fun load() {
        viewModelScope.launch {
            val fetched = repository.fetchMessages()
            _messages.value = fetched.toImmutableList()
        }
    }
}

@Composable
fun InboxScreen(viewModel: InboxViewModel = viewModel()) {
    val messages by viewModel.messages.collectAsStateWithLifecycle()
    MessageList(messages = messages)
}

// This composable IS skippable — ImmutableList is stable.
@Composable
fun MessageList(messages: ImmutableList<Message>, modifier: Modifier = Modifier) {
    LazyColumn(modifier = modifier) {
        items(messages, key = { it.id }) { message ->
            MessageRow(message = message)
        }
    }
}

// Also skippable — Message is @Immutable, all fields are val primitives/Strings.
@Composable
fun MessageRow(message: Message, modifier: Modifier = Modifier) {
    Column(modifier = modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
        Text(text = message.author, style = MaterialTheme.typography.labelMedium)
        Text(text = message.body, style = MaterialTheme.typography.bodyMedium)
    }
}
```

## Deferring animated state reads to layout phase

An avatar that slides horizontally with an `Animatable` — the entire composition is skipped on every animation frame because the state read is deferred inside `offset { }`.

```kotlin
@Composable
fun SlideInAvatar(
    avatarUrl: String,
    visible: Boolean,
    modifier: Modifier = Modifier,
) {
    val density = LocalDensity.current
    val offsetX = remember { Animatable(if (visible) 0f else -200f) }

    LaunchedEffect(visible) {
        offsetX.animateTo(
            targetValue = if (visible) 0f else -200f,
            animationSpec = tween(durationMillis = 300),
        )
    }

    // offset { } lambda runs during the LAYOUT phase.
    // Composition is never restarted while the animation ticks.
    AsyncImage(
        model = avatarUrl,
        contentDescription = null,
        modifier = modifier
            .size(48.dp)
            .clip(CircleShape)
            .offset { IntOffset(x = offsetX.value.roundToInt(), y = 0) },
    )
}
```

Compare with the naive `offset(x = offsetX.value.dp)` call — that form reads the `State` during composition, forcing the entire `SlideInAvatar` scope (and all parent scopes that haven't isolated the read) to recompose every frame.

## derivedStateOf to decouple high-frequency state

A scroll-to-top FAB that should appear only after the user scrolls past the first item. The scroll offset changes on every pixel of movement; `derivedStateOf` ensures downstream composables only recompose when the boolean result flips.

```kotlin
@Composable
fun ArticleScreen(articles: ImmutableList<Article>) {
    val listState = rememberLazyListState()

    // Without derivedStateOf, every scroll pixel would recompose this whole screen.
    val showScrollToTop by remember {
        derivedStateOf { listState.firstVisibleItemIndex > 0 }
    }

    Box {
        LazyColumn(state = listState) {
            items(articles, key = { it.id }) { article ->
                ArticleRow(article = article)
            }
        }

        AnimatedVisibility(
            visible = showScrollToTop,
            modifier = Modifier.align(Alignment.BottomEnd).padding(16.dp),
        ) {
            val scope = rememberCoroutineScope()
            FloatingActionButton(onClick = { scope.launch { listState.animateScrollToItem(0) } }) {
                Icon(Icons.Default.KeyboardArrowUp, contentDescription = "Scroll to top")
            }
        }
    }
}
```

## @Stable wrapper for a third-party unstable type

A library returns `UserProfile` from its own module — the Compose compiler cannot inspect it, so it is treated as unstable. A thin `@Stable` wrapper restores skippability without rewriting the library class.

```kotlin
// From a third-party / multi-module boundary — compiler sees it as unstable.
// class UserProfile(var displayName: String, var avatarUrl: String)

@Stable
class StableUserProfile(private val delegate: UserProfile) {
    // Expose only val properties. Callers must replace the whole wrapper
    // (triggering recomposition via State) rather than mutating in place.
    val displayName: String get() = delegate.displayName
    val avatarUrl: String get() = delegate.avatarUrl

    override fun equals(other: Any?): Boolean {
        if (other !is StableUserProfile) return false
        return displayName == other.displayName && avatarUrl == other.avatarUrl
    }

    override fun hashCode(): Int = 31 * displayName.hashCode() + avatarUrl.hashCode()
}

// ViewModel converts at the boundary so the UI layer only ever sees stable types.
class ProfileViewModel : ViewModel() {
    private val _profile = MutableStateFlow<StableUserProfile?>(null)
    val profile: StateFlow<StableUserProfile?> = _profile.asStateFlow()

    fun loadProfile() {
        viewModelScope.launch {
            _profile.value = StableUserProfile(repository.fetchProfile())
        }
    }
}

// Fully skippable — StableUserProfile satisfies @Stable contract.
@Composable
fun ProfileHeader(profile: StableUserProfile, modifier: Modifier = Modifier) {
    Row(modifier = modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
        AsyncImage(
            model = profile.avatarUrl,
            contentDescription = null,
            modifier = Modifier.size(40.dp).clip(CircleShape),
        )
        Spacer(Modifier.width(12.dp))
        Text(text = profile.displayName, style = MaterialTheme.typography.titleMedium)
    }
}
```
