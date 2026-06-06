---
name: android-navigation-architecture
description: Covers Android navigation architecture — where navigation logic lives, a single NavController as source of truth, type-safe routes with Navigation 2.x Kotlin DSL, decoupling destinations from feature modules, deep-link strategy, and testing navigation graphs. Use when designing app-wide navigation, choosing a single- vs multi-graph structure, wiring feature modules to a nav graph, handling deep links, or writing navigation unit tests.
---

## When to use

Apply this skill when designing or refactoring app-wide navigation on Android. Concretely: you are deciding where the `NavController` should live and who may call it; you want type-safe routes rather than stringly-typed `Route("detail/{id}")`; you are splitting screens into feature modules and need a clean contract for each module's destinations; you must handle deep links or web URLs without scattering URI parsing across the codebase; or you need to write unit or instrumented tests that verify your navigation graph without running a full UI. Navigation Compose composable mechanics (NavHost, composable destinations, animated transitions) are deferred to the `navigation-compose` skill.

## Core guidance

- **Do** keep exactly one `NavController` per back stack. In a single-Activity app that means one per `NavHost`. Never pass `NavController` down into nested composables — pass lambdas (`onNavigate: () -> Unit`) or an abstracted `Navigator` interface instead.
- **Do** define routes as a typed Kotlin class hierarchy (sealed classes or `@Serializable` data objects/classes) and use Navigation 2.x type-safe APIs (`NavController.navigate<RouteType>(args)`). This eliminates runtime `IllegalArgumentException` from misspelled route strings.
- **Do** own navigation logic in the ViewModel or a dedicated navigator, not in composables. A composable calls `viewModel.onDetailClicked(id)`, the ViewModel emits a navigation event, and the hosting composable observes it and calls the controller. This keeps composables testable without a `NavController`.
- **Do** design the nav graph in layers: a top-level app graph owns the primary destinations; each feature module exposes a `NavGraphBuilder` extension function (`fun NavGraphBuilder.featureGraph(...)`) that the app graph calls. The feature module never imports the app module.
- **Do** declare deep-link URI patterns on each destination at the graph level. Parse incoming `Intent`/`Uri` to a typed route in one place (e.g., a `DeepLinkHandler` invoked from `Activity.onCreate` and `onNewIntent`), then call `navController.navigate(route)`. Keep URI-to-route mapping in a single file.
- **Don't** store `NavController` in a ViewModel, `Application`, or any object that outlives the composable scope. `NavController` holds a reference to the `FragmentManager`/composition and will leak.
- **Don't** nest `NavHost` composables that share a back stack. Independent nested stacks (e.g., bottom-nav tabs) are fine; sharing state between them should go through a shared ViewModel in a common scope, not cross-controller navigation calls.
- **Don't** use `popBackStack` + `navigate` to simulate replacing the current destination; use `NavOptions` with `popUpTo` and `launchSingleTop` to keep the back stack clean.
- **Don't** hard-code route strings in tests. Reference the same typed route objects your production code uses.

```kotlin
// routes.kt — shared between :app and :feature modules via :navigation module
@Serializable data object HomeRoute
@Serializable data class DetailRoute(val id: String)
@Serializable data object SettingsRoute

// feature/detail/src/.../DetailNavGraph.kt
fun NavGraphBuilder.detailGraph(
    onBack: () -> Unit,
) {
    composable<DetailRoute> { backStackEntry ->
        val route: DetailRoute = backStackEntry.toRoute()
        DetailScreen(id = route.id, onBack = onBack)
    }
}

// app/src/.../AppNavHost.kt
@Composable
fun AppNavHost(navController: NavHostController) {
    NavHost(navController, startDestination = HomeRoute) {
        composable<HomeRoute> {
            HomeScreen(
                onOpenDetail = { id ->
                    navController.navigate(DetailRoute(id))
                }
            )
        }
        detailGraph(onBack = { navController.popBackStack() })
        composable<SettingsRoute> { SettingsScreen() }
    }
}
```

## Platform notes

- **Single Activity:** The Jetpack Navigation component is designed for a single-`Activity` host. Multiple activities are supported but require separate `NavController` instances and explicit handoffs via `Intent` extras.
- **Bottom navigation / top-level destinations:** Use `navController.navigate(route) { popUpTo(startDestination) { saveState = true }; launchSingleTop = true; restoreState = true }` to preserve each tab's back stack and avoid creating duplicate destinations.
- **Adaptive layouts (foldables, tablets):** On wide screens, `NavigationSuiteScaffold` / two-pane layouts may maintain two simultaneous back stacks. Model this with a detail route that is `null`-able in the list-detail ViewModel rather than separate controllers.
- **Deep links from the web:** Declare `<intent-filter>` with `android:autoVerify="true"` in the manifest and publish a `/.well-known/assetlinks.json` on your domain for App Links. Route the verified `Uri` through `DeepLinkHandler` the same way as custom-scheme links — same typed-route output, same `navigate()` call.
- **Process death / state restoration:** `NavController` automatically saves and restores the back-stack entry list. Arguments are re-delivered from the saved state bundle, so `@Serializable` route types restore correctly without extra work. Non-serializable objects must be stored in `SavedStateHandle`.

## Pitfalls

- **Passing NavController into feature modules.** Feature modules should not depend on `NavController` directly; use lambda callbacks or a thin `Navigator` interface defined in a shared `:navigation` module. This keeps features independently buildable and testable.
- **Multiple navigate() calls on the same event.** A button tap that triggers recomposition before the navigation commits can fire `navigate()` twice. Guard with `launchSingleTop = true` on the `NavOptions`, or check `currentBackStackEntry?.destination` before navigating.
- **Back-stack inflation with nested graphs.** Each call to `navController.navigate(nestedGraphRoute)` adds the start destination of that graph to the stack. Use `popUpTo` with `inclusive = true` when the entry point into a sub-flow should not remain when the flow is done.
- **URI collision across deep links.** Two destinations declaring the same URI pattern cause silent ambiguity — the first registered destination wins. Use distinct path segments and always test with `adb shell am start -W -a android.intent.action.VIEW -d "yourscheme://..."`.
- **Skipping the dedicated :navigation module.** Putting route classes in `:app` forces feature modules to depend upward, breaking modular build parallelism. Always place shared routes in a `:navigation` (or `:core:navigation`) module that has no Android framework dependencies.
- **Testing with a real NavController in unit tests.** Prefer extracting navigation logic (event emission, route construction) into ViewModels tested with `TestCoroutineScheduler` and a fake navigator. Reserve `TestNavHostController` for instrumented tests that verify the graph topology.

## References

- **Guide:** [Navigation overview](https://developer.android.com/guide/navigation)
- **Guide:** [Principles of navigation](https://developer.android.com/guide/navigation/principles)

## See also

The `navigation-compose` sibling skill covers `NavHost`, `composable<T>`, animated transitions, and `BackHandler` mechanics. The `dependency-injection` skill explains how to scope ViewModels to nav graph entries with Hilt's `@HiltViewModel` and `hiltViewModel()` so that a sub-flow's shared ViewModel is automatically cleared when its nested graph is popped. The `swiftui-app-architecture` analog on the Apple side covers the same single-source-of-truth navigation state principle for iOS.
