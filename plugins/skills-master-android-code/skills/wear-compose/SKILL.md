---
name: wear-compose
description: Covers Compose for Wear OS — wear.compose.material3 components, TransformingLazyColumn and ScalingLazyColumn for round-screen scrolling, AppScaffold and ScreenScaffold, rotary input via rotaryScrollable, edge-hugging buttons, TimeText, and Wear navigation with SwipeDismissableNavHost. Use when building or modernising Wear OS apps with a Compose-first approach, targeting round and square watch faces with Material 3 Expressive for Wear.
---

## When to use

Apply this guidance when building any Wear OS screen with Jetpack Compose. It covers the full stack: the `wear.compose.material3` component library, the specialised lazy-scroll containers that handle round-display curvature, the scaffold system that hosts time and page indicators, rotary crown/bezel input, and the Wear-specific navigation API. Use it when starting a new Wear OS app, when porting a phone Compose UI to a watch, or when adding crowm-scroll, edge buttons, or animated list effects to an existing Wear screen.

## Core guidance

### Dependencies

- Import from `androidx.wear.compose:compose-material3` (not the phone `material3` artifact). The two share naming conventions but Wear's versions are tuned for small, round displays — do not mix them in the same module.
- Add `androidx.wear.compose:compose-navigation` for `SwipeDismissableNavHost`.
- The Compose BOM does **not** pin wear-compose versions; add an explicit `wear-compose` BOM or pin each artifact independently.

### Scaffold: AppScaffold and ScreenScaffold

- Wrap the entire app in a single `AppScaffold`. It owns the global `TimeText` overlay shown when the screen is idle and the `HorizontalPageIndicator` for pager-based navigation.
- Each individual screen sits inside a `ScreenScaffold`, which manages the `ScrollIndicator` (the arc-shaped scroll bar on round displays) and wires it to the active scroll state.
- Pass the `scrollState` (from `TransformingLazyColumn` or `ScalingLazyColumn`) to `ScreenScaffold` so the scroll indicator and time text offset animate together — do not wire them separately.

```kotlin
@Composable
fun WearApp(navController: SwipeDismissableNavController) {
    MaterialTheme { // wear.compose.material3.MaterialTheme
        AppScaffold {
            SwipeDismissableNavHost(
                navController = navController,
                startDestination = "home",
            ) {
                composable("home") { HomeScreen() }
                composable("detail/{id}") { backStack ->
                    DetailScreen(id = backStack.arguments?.getString("id").orEmpty())
                }
            }
        }
    }
}

@Composable
fun HomeScreen() {
    val columnState = rememberTransformingLazyColumnState()
    ScreenScaffold(scrollState = columnState) {
        TransformingLazyColumn(
            state = columnState,
            contentPadding = PaddingValues(
                top = 32.dp, bottom = 48.dp, start = 8.dp, end = 8.dp
            ),
        ) {
            item { Text("Hello, watch") }
            items(workouts) { workout ->
                Card(onClick = { /* navigate */ }) {
                    Text(workout.name)
                }
            }
            item {
                EdgeButton(onClick = { /* start */ }) {
                    Icon(Icons.Default.PlayArrow, contentDescription = "Start")
                }
            }
        }
    }
}
```

### TransformingLazyColumn (preferred) vs ScalingLazyColumn

- `TransformingLazyColumn` (Wear Compose 1.4+) is the preferred container. It applies a `transformedHeight` and `scrollTransform` to each item as it approaches the top or bottom of the round viewport, creating a curved-perspective effect that matches the display shape. Pair it with `rememberTransformingLazyColumnState()`.
- `ScalingLazyColumn` scales and fades items near the top/bottom edges. It is still supported but `TransformingLazyColumn` supersedes it for new code with M3 Expressive for Wear.
- Both respect `contentPadding` — always set a generous `top` padding (around 32 dp) and `bottom` padding (around 48 dp) so content is not obscured by `TimeText` or cut off by the chin on flat-tire displays.
- Use `ScalingLazyListAnchorType.ItemCenter` on `ScalingLazyColumn` to snap the first visible item to the centre of the screen rather than the top edge.

### Rotary input — rotaryScrollable

- Wear OS devices expose the physical crown (or bezel) as a rotary input device. Wire it with the `rotaryScrollable` modifier on the scrollable container — not on the screen root.
- Call `rememberRotaryScrollableBehavior()` (or `rememberSnapFlingBehavior()` for pagers) and pass it to `Modifier.rotaryScrollable(behavior, focusRequester)`.
- Request focus via `LaunchedEffect(Unit) { focusRequester.requestFocus() }` whenever a screen enters composition — rotary events are only delivered to the focused node.
- On screens with a `Picker` (time, number), use `Modifier.rotaryScrollable` targeted at the picker's `PickerState` so the crown drives picker selection.

```kotlin
@Composable
fun RotaryList(items: List<String>) {
    val columnState = rememberTransformingLazyColumnState()
    val focusRequester = rememberActiveFocusRequester() // wear.compose helper
    ScreenScaffold(scrollState = columnState) {
        TransformingLazyColumn(
            state = columnState,
            modifier = Modifier.rotaryScrollable(
                behavior = rememberTransformingLazyColumnScrollBehavior(columnState),
                focusRequester = focusRequester,
            ),
        ) {
            items(items) { item -> Text(item) }
        }
    }
}
```

### Edge-hugging buttons — EdgeButton

- `EdgeButton` is a wide, rounded button that sits flush with the bottom chin of a round display. Place it as the **last item** inside `TransformingLazyColumn` or at the fixed bottom of `ScreenScaffold` via the `scrollIndicator` slot's sibling.
- Use it for the primary screen action (Start Workout, Confirm, Done). Do not use a standard `Button` at the bottom of round screens — it clips awkwardly inside the circle.
- `EdgeButton` accepts `ButtonSize.Large` (default), `Medium`, and `Small`; pair with an icon-only variant for tighter layouts.

### TimeText

- `AppScaffold` renders `TimeText` automatically when `timeText` is not overridden. Provide a custom `timeText` lambda when you need to show a leading status (e.g. heart rate) alongside the clock.
- On active screens (ongoing workout, stopwatch), hide `TimeText` or replace it with an elapsed-time variant using `TimeText(startTime = startInstant)`.
- `TimeText` is rendered outside the `ScreenScaffold` scroll area — it floats over content. Account for its height when setting `contentPadding.top` on lists.

### Wear Navigation — SwipeDismissableNavHost

- Use `SwipeDismissableNavHost` from `androidx.wear.compose:compose-navigation` instead of the standard `NavHost`. It adds a horizontal swipe-to-dismiss gesture that maps to the hardware back expectation on Wear.
- Create a `SwipeDismissableNavController` with `rememberSwipeDismissableNavController()` and hoist it to the `AppScaffold` scope.
- Route definitions use string routes (not the type-safe `@Serializable` objects from phone Navigation Compose — that extension is not yet available for Wear navigation). Keep routes short and validate arguments defensively.
- Deep-link from a tile or complication by constructing an `Intent` that targets your `WearActivity` with the route as an extra, then calling `navController.navigate(route)` inside `LaunchedEffect`.

### Material 3 Expressive for Wear

- M3 Expressive shapes ship in Wear Compose 1.5 as `MaterialTheme.shapes`. Use `CardDefaults.shape` (a squircle variant) and `ButtonDefaults.shape` for pill shapes — do not hardcode `RoundedCornerShape` values.
- `Card`, `Button`, `IconButton`, `ToggleButton`, and `Chip` all carry M3 Expressive motion specs — prefer them over building custom containers so you get press feedback and spring animations automatically.
- Dynamic color (`MaterialTheme.colorScheme`) adapts to the watch face color on Wear OS 4+. Call `MaterialTheme(colorScheme = dynamicColorScheme(...))` when the platform provides a seed color; fall back to a fixed scheme on older versions.

### Picker and Dialog

- `Picker` with `PickerState` handles single-dimension selection (hours, minutes, quantities). Wire rotary input to `PickerState.scrollToOption()` via `rotaryScrollable`.
- `AlertDialog` and `ConfirmationDialog` from `wear.compose.material3` fit the round viewport. Avoid phone-style `AlertDialog` — it renders incorrectly outside the Material3 phone theme.
- Use `Dialog(showDialog = ..., onDismissRequest = ...)` as the host when the system back gesture or crown press should close it.

## Platform notes

- **Round vs square displays:** Most modern Wear OS devices are round. Use `LocalConfiguration.current.isScreenRound` to branch layout only when absolutely necessary — prefer components designed for both (EdgeButton, TransformingLazyColumn). Square devices are legacy (some Fossil/Mobvoi).
- **Screen density:** Wear displays range from ~300 dpi on entry-level to ~450 dpi on premium. Use `sp` for text and `dp` for layout — never hardcode pixel values.
- **Ambient mode:** Wear OS handles ambient mode separately from the Compose layer. For always-on displays use `AmbientLifecycleObserver` and provide a simplified low-burn ambient layout, not the full interactive UI.
- **Tiles and Complications:** Compose-for-Wear handles the interactive app UI. Tiles use `androidx.wear.protolayout` (not Compose). If your app provides both, keep the Compose layer and the tile layer in separate modules to prevent dependency bleed.
- **Minimum API:** Wear OS 3 maps to API 30; Wear OS 4 is API 33. The skill requires Android 16 (API 36) which aligns with Wear OS 5+. Wear Compose 1.5 and the M3 Expressive components require at minimum Wear OS 3 (API 30) with degraded theming, and full M3 Expressive on Wear OS 4+.
- **Performance:** Wear CPUs and RAM are constrained. Apply the same `compose-performance` discipline: stable parameters, `key` on list items, `derivedStateOf` for scroll-derived state. Prefer `TransformingLazyColumn` over `LazyColumn` — the latter lacks the curvature transform and wastes layout passes on round screens.

## Pitfalls

- Using `androidx.compose.material3` components (phone-tier) instead of `androidx.wear.compose.material3` — they look wrong on small round displays and carry unneeded font, shape, and motion overhead.
- Forgetting to call `focusRequester.requestFocus()` in a `LaunchedEffect` — rotary input silently stops working on that screen without any error.
- Omitting `contentPadding` top/bottom on `TransformingLazyColumn` — items render behind `TimeText` at the top or are clipped by the chin/bezel at the bottom.
- Using `SwipeDismissableNavHost` without `AppScaffold` — `TimeText` is not positioned and the swipe gesture conflicts with system-level back navigation.
- Placing `EdgeButton` in the middle of a list rather than last — it loses its display-edge alignment and defeats the design intent.
- Placing a `Button` at a fixed bottom position using `Box` alignment instead of using `EdgeButton` as a list tail item — it clips inside the circular viewport on round devices.
- Applying `Modifier.rotaryScrollable` to the wrong node (e.g. the `ScreenScaffold` or the screen root) — the modifier must be on the scrollable container itself.
- Using `ScalingLazyColumn` with the default `ScalingLazyListAnchorType.ItemStart` anchor — the first item snaps to the top rather than the centre, misaligning the curved perspective on round screens.
- Starting with standard Navigation Compose (`NavHost` + type-safe routes) and then switching to Wear — `SwipeDismissableNavHost` does not accept the same nav graph builder extensions; plan the navigation layer early.
- Loading heavy bitmaps synchronously in a list item composable — always use `coil-compose` or `AsyncImage` with a `transformations` size limit appropriate for the small display.

## References

- **Documentation:** [Compose for Wear OS](https://developer.android.com/training/wearables/compose)
- **Documentation:** [Navigation in Compose for Wear OS](https://developer.android.com/training/wearables/compose/navigation)

## See also

For the foundational Compose mental model (composables, recomposition, phases), see `compose-fundamentals`. For list performance and item keys on any Compose surface, see `compose-lazy-lists`. For Compose navigation on phone (type-safe routes, NavHost), see `navigation-compose`. For scheduling background updates on Wear (tile refresh, sensor polling), see `health-services` and `background-tasks`. For building Wear tiles with ProtoLayout instead of Compose, see the `controls-widgets` skill.
