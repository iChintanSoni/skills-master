## Animating a single value with animate*AsState

A simple but complete example showing color, size, and alpha responding to a boolean toggle. All properties are independent but each smoothly tracks its target using M3 motion specs.

```kotlin
@Composable
fun StatusBadge(isActive: Boolean, modifier: Modifier = Modifier) {
    val badgeColor by animateColorAsState(
        targetValue = if (isActive) MaterialTheme.colorScheme.primary
                      else MaterialTheme.colorScheme.outline,
        animationSpec = MaterialTheme.motionScheme.defaultEffectsSpec(),
        label = "badgeColor",
    )
    val badgeSize by animateDpAsState(
        targetValue = if (isActive) 48.dp else 32.dp,
        animationSpec = MaterialTheme.motionScheme.defaultSpatialSpec(),
        label = "badgeSize",
    )
    val contentAlpha by animateFloatAsState(
        targetValue = if (isActive) 1f else 0.38f,
        animationSpec = tween(durationMillis = 200),
        label = "contentAlpha",
    )

    Box(
        contentAlignment = Alignment.Center,
        modifier = modifier
            .size(badgeSize)
            .background(color = badgeColor, shape = CircleShape)
            .graphicsLayer { alpha = contentAlpha },
    ) {
        Icon(
            imageVector = if (isActive) Icons.Default.Check else Icons.Default.Close,
            contentDescription = if (isActive) "Active" else "Inactive",
            tint = MaterialTheme.colorScheme.onPrimary,
        )
    }
}
```

## Multi-step keyframe animation with rememberInfiniteTransition

A shimmer loading placeholder that cycles through three brightness values using keyframes and an infinite repeatable spec.

```kotlin
@Composable
fun ShimmerBox(modifier: Modifier = Modifier) {
    val infiniteTransition = rememberInfiniteTransition(label = "shimmer")
    val shimmerAlpha by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 0.9f,
        animationSpec = infiniteRepeatable(
            animation = keyframes {
                durationMillis = 1200
                0.3f at 0 using LinearEasing
                0.9f at 400 using FastOutSlowInEasing
                0.9f at 700 using LinearEasing
                0.3f at 1200 using LinearEasing
            },
            repeatMode = RepeatMode.Restart,
        ),
        label = "shimmerAlpha",
    )

    Box(
        modifier = modifier
            .height(24.dp)
            .fillMaxWidth()
            .clip(RoundedCornerShape(4.dp))
            .background(
                MaterialTheme.colorScheme.surfaceVariant.copy(alpha = shimmerAlpha)
            ),
    )
}

@Composable
fun ShimmerCard(modifier: Modifier = Modifier) {
    Column(
        verticalArrangement = Arrangement.spacedBy(8.dp),
        modifier = modifier
            .padding(16.dp)
            .fillMaxWidth(),
    ) {
        ShimmerBox(Modifier.fillMaxWidth(0.6f))
        ShimmerBox(Modifier.fillMaxWidth())
        ShimmerBox(Modifier.fillMaxWidth(0.8f))
    }
}
```

## Shared element transition between list and detail

A contact list where tapping a row animates the avatar and name into a larger detail screen using `SharedTransitionLayout` with Navigation Compose.

```kotlin
data class Contact(val id: Int, val name: String, val avatarColor: Color)

@Composable
fun ContactsNavGraph(contacts: List<Contact>) {
    val navController = rememberNavController()
    SharedTransitionLayout {
        NavHost(navController = navController, startDestination = "list") {
            composable("list") {
                LazyColumn {
                    items(contacts, key = { it.id }) { contact ->
                        ContactRow(
                            contact = contact,
                            sharedTransitionScope = this@SharedTransitionLayout,
                            animatedVisibilityScope = this@composable,
                            onClick = { navController.navigate("detail/${contact.id}") },
                        )
                    }
                }
            }
            composable(
                route = "detail/{contactId}",
                arguments = listOf(navArgument("contactId") { type = NavType.IntType }),
            ) { backStack ->
                val id = backStack.arguments!!.getInt("contactId")
                val contact = contacts.first { it.id == id }
                ContactDetail(
                    contact = contact,
                    sharedTransitionScope = this@SharedTransitionLayout,
                    animatedVisibilityScope = this@composable,
                    onBack = { navController.popBackStack() },
                )
            }
        }
    }
}

@Composable
fun SharedTransitionScope.ContactRow(
    contact: Contact,
    animatedVisibilityScope: AnimatedVisibilityScope,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = modifier
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 8.dp),
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .sharedElement(
                    state = rememberSharedContentState(key = "avatar-${contact.id}"),
                    animatedVisibilityScope = animatedVisibilityScope,
                )
                .background(contact.avatarColor, shape = CircleShape)
        )
        Spacer(Modifier.width(12.dp))
        Text(
            text = contact.name,
            style = MaterialTheme.typography.bodyLarge,
            modifier = Modifier.sharedElement(
                state = rememberSharedContentState(key = "name-${contact.id}"),
                animatedVisibilityScope = animatedVisibilityScope,
            ),
        )
    }
}

@Composable
fun SharedTransitionScope.ContactDetail(
    contact: Contact,
    animatedVisibilityScope: AnimatedVisibilityScope,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = modifier
            .fillMaxSize()
            .padding(24.dp),
    ) {
        Box(
            modifier = Modifier
                .size(120.dp)
                .sharedElement(
                    state = rememberSharedContentState(key = "avatar-${contact.id}"),
                    animatedVisibilityScope = animatedVisibilityScope,
                )
                .background(contact.avatarColor, shape = CircleShape)
        )
        Spacer(Modifier.height(16.dp))
        Text(
            text = contact.name,
            style = MaterialTheme.typography.headlineMedium,
            modifier = Modifier.sharedElement(
                state = rememberSharedContentState(key = "name-${contact.id}"),
                animatedVisibilityScope = animatedVisibilityScope,
            ),
        )
        Spacer(Modifier.height(24.dp))
        OutlinedButton(onClick = onBack) { Text("Back") }
    }
}
```

## Gesture-driven Animatable with fling physics

A draggable card that snaps back to center using a spring, or flicks away if the user releases with enough velocity, using `Animatable` and `animateDecay`.

```kotlin
@Composable
fun SwipeableCard(
    onDismissed: () -> Unit,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    val offsetX = remember { Animatable(0f) }
    val density = LocalDensity.current
    val dismissThreshold = with(density) { 200.dp.toPx() }
    val decaySpec = rememberSplineBasedDecay<Float>()
    val scope = rememberCoroutineScope()

    Card(
        modifier = modifier
            .offset { IntOffset(offsetX.value.roundToInt(), 0) }
            .pointerInput(Unit) {
                detectHorizontalDragGestures(
                    onDragEnd = {
                        scope.launch {
                            if (kotlin.math.abs(offsetX.value) >= dismissThreshold) {
                                onDismissed()
                            } else {
                                offsetX.animateTo(
                                    targetValue = 0f,
                                    animationSpec = spring(
                                        dampingRatio = Spring.DampingRatioMediumBouncy,
                                        stiffness = Spring.StiffnessLow,
                                    ),
                                )
                            }
                        }
                    },
                    onHorizontalDrag = { _, dragAmount ->
                        scope.launch { offsetX.snapTo(offsetX.value + dragAmount) }
                    },
                )
            },
    ) {
        content()
    }
}
```
