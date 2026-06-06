---
name: navigation-compose
description: Covers Navigation Compose — NavController, NavHost, type-safe routes with @Serializable objects, nested graphs, argument passing, back-stack manipulation, returning results, and adaptive navigation patterns. Use when building multi-screen Compose apps, wiring programmatic navigation, passing data between destinations, or structuring nested navigation graphs.
globs:
  - "**/*.kt"
tags: [compose, navigation, jetpack, architecture, type-safe-routes]
x-skills-master:
  domain: android
  class: code
  category: architecture
  platforms: ["android", "large-screen"]
  requires: {android: "16", kotlin: "2.2", compose-bom: "2026.05.00"}
  pairs_with: [m3-navigation]
  sources:
    - https://developer.android.com/develop/ui/compose/navigation
    - https://developer.android.com/guide/navigation/design/type-safety
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for this guidance whenever a Compose app needs to move between more than one screen — whether that is a simple two-screen flow, a deeply nested wizard, or an adaptive layout that switches between a navigation rail and a bottom bar based on window size. It covers the canonical Navigation Compose pattern: `NavController` + `NavHost` + type-safe `@Serializable` route objects, including argument passing, back-stack control, returning results, and nested graphs. Begin here before adding any third-party router.

## Core guidance

### Setup and route definition

- Add `androidx.navigation:navigation-compose` from the Compose BOM; no separate version pin is needed.
- Define routes as `@Serializable` data objects or data classes (for argument-bearing routes). Using sealed hierarchies per feature graph keeps routes organized and avoids string typos.
- Use `composable<T>` (the type-safe overload) in `NavHost` rather than the legacy string-route overloads. Combine with `NavController.navigate<T>()` for a fully type-safe navigation call.

```kotlin
import kotlinx.serialization.Serializable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.toRoute

// Route definitions — no strings, fully type-safe
@Serializable object HomeRoute
@Serializable data class DetailRoute(val itemId: Long)

@Composable
fun AppNavHost(modifier: Modifier = Modifier) {
    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = HomeRoute,
        modifier = modifier,
    ) {
        composable<HomeRoute> {
            HomeScreen(
                onOpenDetail = { id ->
                    navController.navigate(DetailRoute(itemId = id))
                }
            )
        }
        composable<DetailRoute> { backStackEntry ->
            val route: DetailRoute = backStackEntry.toRoute()
            DetailScreen(
                itemId = route.itemId,
                onBack = { navController.popBackStack() }
            )
        }
    }
}
```

### Passing arguments

- Embed arguments as constructor properties on your `@Serializable` data class route — no manual argument type registration needed. Navigation Compose serializes and restores them automatically.
- Nullable or optional arguments should have default values in the data class (`val filter: String? = null`).
- For large objects, pass only an ID and look up the full object from a shared repository in the destination; do not put whole model objects in routes.

### Back-stack control

- `navController.popBackStack()` — pop the top destination; safe to call from any composable that received the `navController`.
- `navController.popBackStack<T>(inclusive = false)` — pop up to (but not including) destination `T`.
- `navController.navigate(SomeRoute) { popUpTo<HomeRoute> { inclusive = false } }` — navigate while clearing intermediate back stack, useful for "done" flows.
- Set `launchSingleTop = true` when re-navigating to a destination that should not be duplicated (e.g., tapping a bottom-nav tab twice).

### Nested navigation graphs

- Extract feature graphs using the `navigation<T>(startDestination)` builder to group related destinations. The type parameter `T` is itself a `@Serializable` object that acts as the graph's route.
- Nested graph start destinations must still be individually reachable — nest composables inside the block just like at the top level.
- Navigate into a nested graph by calling `navController.navigate(SomeGraphRoute)` — Navigation Compose automatically enters at the graph's `startDestination`.

### Retrieving route data with toRoute

- Inside a `composable<T>` block, call `backStackEntry.toRoute<T>()` to deserialize the current entry into the typed route object. The generic can usually be inferred from context.

### Returning results to the previous destination

- Retrieve the previous back-stack entry via `navController.previousBackStackEntry` and write to its `savedStateHandle`:
  ```kotlin
  navController.previousBackStackEntry
      ?.savedStateHandle
      ?.set("picked_date", selectedDate)
  navController.popBackStack()
  ```
- In the caller, observe with `navController.currentBackStackEntry?.savedStateHandle?.getStateFlow("picked_date", null)?.collectAsStateWithLifecycle()`.
- Prefer this over shared ViewModels for transient, screen-scoped results.

### Adaptive navigation

- On large screens, swap the `NavHost` host container for an adaptive scaffold: expose `NavController` to both a `NavigationRail` (or `NavigationDrawer`) and the `NavHost` content area. The `NavController` is unaffected by the surrounding chrome.
- Use `WindowSizeClass` to decide between `BottomNavigation` (compact width) and `NavigationRail` / `NavigationDrawer` (medium or expanded), keeping `NavHost` shared. See `adaptive-layouts` for details.

### Deep links

Navigation Compose supports URL-pattern deep links via `deepLinks = listOf(navDeepLink<T> { uriPattern = "..." })` inside a `composable<T>` block. This topic is covered in detail in `navigation-deep-links`; keep deep-link wiring close to the composable declaration rather than in a separate manifest-only approach.

## Platform notes

- **Phone (compact):** `BottomNavigation` + `NavHost` is the standard layout. Keep the tab count between 3 and 5 destinations.
- **Large-screen / foldable (medium/expanded):** Replace `BottomNavigation` with `NavigationRail` or `PermanentNavigationDrawer`. The `NavHost` and `NavController` remain identical — only the wrapping scaffold changes.
- **Multi-pane:** On expanded windows, consider a two-pane layout where tapping an item in the list updates the detail pane without a back-stack push. This is an architectural choice that diverges from pure NavHost; `navigation-adaptive` covers the trade-offs.
- **Process death:** `NavController` state (back stack and saved state handles) survives process death automatically when created with `rememberNavController` inside a `ViewModel`-backed scope or via `NavHostFragment`'s saved-state mechanism.

## Pitfalls

- Using legacy string-based `composable("route")` — it compiles but bypasses type safety, loses argument validation, and is harder to refactor. Always use `composable<T>`.
- Calling `navController.navigate()` from inside a `LaunchedEffect` or callback that fires during composition — gate navigation on user events or `LaunchedEffect` keyed to stable state, not on every recompose.
- Hoisting `NavController` into a ViewModel or Domain layer — it is a UI concern and holds references to composables. Pass it only within the UI layer, or emit navigation events from the ViewModel and observe them in the NavHost scope.
- Registering the same route type in multiple `composable<T>` blocks within the same graph — the first wins silently; make route types unique per graph level.
- Nesting `NavHost` instances without a clear ownership boundary causes back-press conflicts. Prefer nested graphs within a single `NavHost` over multiple `NavHost` composables.
- Calling `toRoute<T>()` with the wrong type — it throws at runtime. Match the type to the enclosing `composable<T>` generic.
- Forgetting `launchSingleTop = true` on bottom-nav tab taps, which re-pushes the same destination and creates duplicate back-stack entries.

## References

- **Documentation:** [Navigation with Compose](https://developer.android.com/develop/ui/compose/navigation)
- **Documentation:** [Type-safe navigation with Compose](https://developer.android.com/guide/navigation/design/type-safety)
- **Documentation:** [Adaptive navigation layouts](https://developer.android.com/develop/ui/compose/layouts/adaptive)

## See also

For handling deep links via URI patterns and intent filters, see `navigation-deep-links`. For adaptive scaffold patterns (NavigationRail, NavigationDrawer, two-pane) on large screens, see `adaptive-layouts`. For structuring ViewModels and state scoping per navigation destination, see `compose-viewmodel`. For the Compose state and side-effect APIs used inside navigation destinations, see `compose-state` and `compose-side-effects`.
