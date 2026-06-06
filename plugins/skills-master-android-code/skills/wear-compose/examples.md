## Full app scaffold with Wear navigation and two screens

Demonstrates `AppScaffold`, `SwipeDismissableNavHost`, `ScreenScaffold`, `TransformingLazyColumn`, `EdgeButton`, rotary input, and `TimeText` wired together in a minimal but realistic app structure.

```kotlin
// --- WearApp.kt ---

@Composable
fun WearApp() {
    val navController = rememberSwipeDismissableNavController()

    // wear.compose.material3.MaterialTheme — NOT phone MaterialTheme
    MaterialTheme {
        AppScaffold {
            SwipeDismissableNavHost(
                navController = navController,
                startDestination = "workout_list",
            ) {
                composable("workout_list") {
                    WorkoutListScreen(
                        onWorkoutSelected = { id ->
                            navController.navigate("workout_detail/$id")
                        }
                    )
                }
                composable("workout_detail/{workoutId}") { backStack ->
                    val id = backStack.arguments?.getString("workoutId").orEmpty()
                    WorkoutDetailScreen(workoutId = id)
                }
            }
        }
    }
}

// --- WorkoutListScreen.kt ---

@Composable
fun WorkoutListScreen(onWorkoutSelected: (String) -> Unit) {
    val workouts = remember {
        listOf(
            Workout("run", "Outdoor Run"),
            Workout("bike", "Cycling"),
            Workout("swim", "Swimming"),
            Workout("hike", "Hiking"),
        )
    }
    val columnState = rememberTransformingLazyColumnState()
    val focusRequester = rememberActiveFocusRequester()

    ScreenScaffold(scrollState = columnState) {
        TransformingLazyColumn(
            state = columnState,
            modifier = Modifier.rotaryScrollable(
                behavior = rememberTransformingLazyColumnScrollBehavior(columnState),
                focusRequester = focusRequester,
            ),
            contentPadding = PaddingValues(
                top = 40.dp,
                bottom = 56.dp,
                start = 8.dp,
                end = 8.dp,
            ),
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            item {
                Text(
                    text = "Workouts",
                    style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier
                        .fillMaxWidth()
                        .wrapContentWidth(Alignment.CenterHorizontally)
                        .padding(bottom = 8.dp),
                )
            }
            items(workouts, key = { it.id }) { workout ->
                Card(
                    onClick = { onWorkoutSelected(workout.id) },
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Icon(
                            imageVector = Icons.Default.FitnessCenter,
                            contentDescription = null,
                            modifier = Modifier.size(20.dp),
                        )
                        Spacer(Modifier.width(10.dp))
                        Text(text = workout.name, style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }
        }
    }
}

data class Workout(val id: String, val name: String)

// --- WorkoutDetailScreen.kt ---

@Composable
fun WorkoutDetailScreen(workoutId: String) {
    val columnState = rememberTransformingLazyColumnState()
    val focusRequester = rememberActiveFocusRequester()

    ScreenScaffold(scrollState = columnState) {
        TransformingLazyColumn(
            state = columnState,
            modifier = Modifier.rotaryScrollable(
                behavior = rememberTransformingLazyColumnScrollBehavior(columnState),
                focusRequester = focusRequester,
            ),
            contentPadding = PaddingValues(
                top = 40.dp, bottom = 60.dp, start = 8.dp, end = 8.dp
            ),
            verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            item { Text("Workout: $workoutId", style = MaterialTheme.typography.titleSmall) }
            item { Text("Duration: 30 min", style = MaterialTheme.typography.bodyMedium) }
            item { Text("Distance: 5.2 km", style = MaterialTheme.typography.bodyMedium) }
            item { Text("Calories: 320 kcal", style = MaterialTheme.typography.bodyMedium) }
            // EdgeButton sits as the last list item — hugs the round display bottom
            item {
                EdgeButton(
                    onClick = { /* start workout */ },
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Icon(Icons.Default.PlayArrow, contentDescription = "Start")
                    Spacer(Modifier.width(4.dp))
                    Text("Start")
                }
            }
        }
    }
}
```

## Rotary-driven Picker for time selection

Shows a minutes `Picker` wired to crown/bezel input so the physical rotary control drives the selected value, including focus management and a confirm `EdgeButton`.

```kotlin
@Composable
fun DurationPickerScreen(onDurationConfirmed: (Int) -> Unit) {
    val minuteOptions = remember { (1..60).toList() }
    val pickerState = rememberPickerState(initialNumberOfOptions = minuteOptions.size)
    val focusRequester = rememberActiveFocusRequester()

    ScreenScaffold {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .rotaryScrollable(
                    behavior = rememberPickerScrollBehavior(pickerState),
                    focusRequester = focusRequester,
                ),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            Text(
                text = "Duration",
                style = MaterialTheme.typography.titleSmall,
                modifier = Modifier.padding(bottom = 8.dp),
            )
            Picker(
                state = pickerState,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(100.dp),
                contentDescription = "Minutes",
            ) { index ->
                val minutes = minuteOptions[index]
                Text(
                    text = "$minutes min",
                    style = MaterialTheme.typography.displaySmall,
                )
            }
            Spacer(Modifier.height(12.dp))
            EdgeButton(
                onClick = {
                    onDurationConfirmed(minuteOptions[pickerState.selectedOption])
                },
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Confirm")
            }
        }
    }
}
```

## Confirmation dialog flow with AlertDialog

Demonstrates the Wear-specific `AlertDialog` flow that fits the round viewport, triggered from a list screen, with dismiss-on-swipe and crown-back support.

```kotlin
@Composable
fun WorkoutReadyScreen(
    workoutName: String,
    onStartConfirmed: () -> Unit,
    onCancel: () -> Unit,
) {
    var showDialog by remember { mutableStateOf(false) }
    val columnState = rememberTransformingLazyColumnState()

    ScreenScaffold(scrollState = columnState) {
        TransformingLazyColumn(
            state = columnState,
            contentPadding = PaddingValues(top = 40.dp, bottom = 60.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            item {
                Text(
                    text = workoutName,
                    style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.fillMaxWidth().wrapContentWidth(Alignment.CenterHorizontally),
                )
            }
            item {
                Text(
                    text = "Warm up complete. Ready to begin your session?",
                    style = MaterialTheme.typography.bodySmall,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(horizontal = 16.dp),
                )
            }
            item {
                EdgeButton(
                    onClick = { showDialog = true },
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text("Begin")
                }
            }
        }
    }

    if (showDialog) {
        AlertDialog(
            title = { Text("Start $workoutName?") },
            message = { Text("This will begin tracking your session.") },
            onDismissRequest = { showDialog = false },
            confirmButton = {
                Button(onClick = {
                    showDialog = false
                    onStartConfirmed()
                }) {
                    Text("Start")
                }
            },
            dismissButton = {
                OutlinedButton(onClick = {
                    showDialog = false
                    onCancel()
                }) {
                    Text("Cancel")
                }
            },
        )
    }
}
```

## Custom TimeText with live heart rate status

Replaces the default clock overlay with a leading heart rate reading during an active workout, using `TimeTextDefaults` composables to stay on brand while injecting dynamic content.

```kotlin
@Composable
fun ActiveWorkoutApp(heartRateBpm: Int) {
    MaterialTheme {
        AppScaffold(
            timeText = {
                TimeText(
                    leadingLinearContent = {
                        // Shown on square displays and as ambient fallback
                        Text(
                            text = "$heartRateBpm bpm",
                            style = TimeTextDefaults.timeTextStyle(),
                        )
                    },
                    leadingCurvedContent = {
                        // Shown on round displays in ambient-aware curved arc
                        curvedText(
                            text = "$heartRateBpm bpm",
                            style = CurvedTextStyle(
                                fontSize = 14.sp,
                                color = MaterialTheme.colorScheme.primary,
                            ),
                        )
                    },
                )
            },
        ) {
            val navController = rememberSwipeDismissableNavController()
            SwipeDismissableNavHost(
                navController = navController,
                startDestination = "active",
            ) {
                composable("active") {
                    ActiveWorkoutScreen(heartRateBpm = heartRateBpm)
                }
            }
        }
    }
}

@Composable
private fun ActiveWorkoutScreen(heartRateBpm: Int) {
    val columnState = rememberTransformingLazyColumnState()
    ScreenScaffold(scrollState = columnState) {
        TransformingLazyColumn(
            state = columnState,
            contentPadding = PaddingValues(top = 48.dp, bottom = 64.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            item {
                Text(
                    text = "$heartRateBpm",
                    style = MaterialTheme.typography.displayLarge,
                    modifier = Modifier.fillMaxWidth().wrapContentWidth(Alignment.CenterHorizontally),
                )
            }
            item {
                Text(
                    text = "BPM",
                    style = MaterialTheme.typography.labelMedium,
                    modifier = Modifier.fillMaxWidth().wrapContentWidth(Alignment.CenterHorizontally),
                )
            }
            item {
                EdgeButton(
                    onClick = { /* end workout */ },
                    modifier = Modifier.fillMaxWidth(),
                    buttonSize = ButtonSize.Small,
                ) {
                    Icon(Icons.Default.Stop, contentDescription = "Stop")
                    Spacer(Modifier.width(4.dp))
                    Text("End")
                }
            }
        }
    }
}
```
