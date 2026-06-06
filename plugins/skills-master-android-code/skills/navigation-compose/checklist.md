# navigation-compose — checklist

- [ ] Routes are `@Serializable` data objects (no arguments) or data classes (with arguments) — no raw strings.
- [ ] All `composable<T>` and `navigate<T>()` calls use the type-safe overloads from `androidx.navigation.compose`.
- [ ] Arguments are primitive or serializable properties on the route data class, not whole model objects.
- [ ] Optional/nullable route arguments have default values declared on the data class.
- [ ] `toRoute<T>()` type matches the enclosing `composable<T>` generic exactly.
- [ ] Feature graphs are grouped with `navigation<GraphRoute>(startDestination = ...)` and entered via `navController.navigate(GraphRoute)`.
- [ ] Each route type is registered in at most one `composable<T>` block per graph level.
- [ ] Back-stack manipulation uses `popBackStack()`, `popBackStack<T>()`, or `popUpTo<T>` — not manual state flags.
- [ ] Bottom-nav and rail taps include `launchSingleTop = true` and `restoreState = true` to avoid duplicate entries.
- [ ] Returning results to the previous screen goes through `previousBackStackEntry?.savedStateHandle`, not a shared ViewModel with a global live state field.
- [ ] `NavController` is not passed to or held by a ViewModel or domain layer — navigation commands are emitted as events from the ViewModel and consumed in the UI layer.
- [ ] `navigate()` is called from user-event callbacks or `LaunchedEffect` keyed to stable state, not from composable body scope.
- [ ] Multiple `NavHost` instances are not nested without a deliberate ownership boundary; prefer nested graphs within a single `NavHost`.
- [ ] Adaptive scaffold swaps `BottomNavigation` for `NavigationRail`/`NavigationDrawer` based on `WindowSizeClass`, while keeping the same `NavController` and `NavHost`.
- [ ] Deep-link URI patterns are attached via `deepLinks = listOf(navDeepLink<T> { uriPattern = "..." })` inside the `composable<T>` block.
- [ ] Process-death resilience is verified — back-stack and `SavedStateHandle` data survive app kill and restore.
- [ ] Navigation graph is reviewed for graph entry points that should not be reachable directly (e.g., mid-flow screens) and those are protected by checking prerequisites in the ViewModel.
