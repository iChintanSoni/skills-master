---
name: navigation-suite-scaffold
description: Covers NavigationSuiteScaffold from the Material3 Adaptive Navigation Suite library — an adaptive container that automatically switches between NavigationBar, NavigationRail, and NavigationDrawer based on window size class. Use when building an app with top-level navigation that must adapt seamlessly across phones, tablets, foldables, and ChromeOS windows without manually wiring three separate navigation components.
---

## When to use

Use this skill when an app has 3–7 top-level destinations that need to be reachable at all times and the UI must scale across compact phones (navigation bar at the bottom), medium windows such as foldables and landscape phones (navigation rail on the left), and expanded windows such as tablets and ChromeOS (persistent navigation drawer on the left). It is the right tool whenever you would otherwise have to manually observe `WindowSizeClass` and swap between three separate navigation composables. It also applies when you need to override the automatic type selection for a specific screen or customize individual navigation item indicators, badges, or icons.

## Core guidance

### Dependency setup

The `NavigationSuiteScaffold` API lives in the `androidx.compose.material3.adaptive:adaptive-navigation-suite` artifact, which is included in the `compose-bom`. No version pin is needed beyond the BOM.

```kotlin
// build.gradle.kts
implementation("androidx.compose.material3.adaptive:adaptive-navigation-suite")
// NavHost integration requires:
implementation("androidx.navigation:navigation-compose:2.8.9")
```

### Defining destinations

- Model destinations as a sealed class or enum rather than raw route strings. Each entry carries its `route`, icon, and label, keeping the navigation item list and the `NavHost` in sync automatically.
- Keep destinations as a top-level or `companion object` property, not created inside a composable, to avoid allocating on every recomposition.

### Wiring NavigationSuiteScaffold with NavHost

- `NavigationSuiteScaffold` owns the outer shell — navigation chrome and the content slot. Place the `NavHost` inside the `content` lambda.
- Observe `navController.currentBackStackEntryAsState()` to determine the selected destination and pass it to each `NavigationSuiteItem`'s `selected` parameter.
- Set `onClick` to `navController.navigate(destination.route)` with `launchSingleTop = true` and `restoreState = true` so back-stack entries are reused rather than stacked.

```kotlin
enum class TopDestination(
    val route: String,
    val label: String,
    val icon: ImageVector,
) {
    Home("home", "Home", Icons.Default.Home),
    Search("search", "Search", Icons.Default.Search),
    Library("library", "Library", Icons.Default.LibraryBooks),
}

@Composable
fun AdaptiveApp() {
    val navController = rememberNavController()
    val currentEntry by navController.currentBackStackEntryAsState()
    val currentRoute = currentEntry?.destination?.route

    NavigationSuiteScaffold(
        navigationSuiteItems = {
            TopDestination.entries.forEach { destination ->
                item(
                    icon = { Icon(destination.icon, contentDescription = destination.label) },
                    label = { Text(destination.label) },
                    selected = currentRoute == destination.route,
                    onClick = {
                        navController.navigate(destination.route) {
                            popUpTo(navController.graph.startDestinationId) {
                                saveState = true
                            }
                            launchSingleTop = true
                            restoreState = true
                        }
                    },
                )
            }
        },
    ) {
        NavHost(navController = navController, startDestination = TopDestination.Home.route) {
            composable(TopDestination.Home.route) { HomeScreen() }
            composable(TopDestination.Search.route) { SearchScreen() }
            composable(TopDestination.Library.route) { LibraryScreen() }
        }
    }
}
```

### Automatic navigation type selection

By default `NavigationSuiteScaffold` calls `NavigationSuiteScaffoldDefaults.calculateFromAdaptiveInfo(currentWindowAdaptiveInfo())` to determine the suite type:

- `Compact` width → `NavigationSuiteType.NavigationBar` (bottom bar)
- `Medium` width → `NavigationSuiteType.NavigationRail` (left rail)
- `Expanded` width → `NavigationSuiteType.NavigationDrawer` (persistent left drawer)

You rarely need to change this. If you do need to override — for example, to keep a rail on medium portrait tablets — pass the `layoutType` parameter explicitly:

```kotlin
val adaptiveInfo = currentWindowAdaptiveInfo()
val customType = when {
    adaptiveInfo.windowSizeClass.isWidthAtLeastBreakpoint(WindowSizeClassBreakpoints.MEDIUM) ->
        NavigationSuiteType.NavigationRail
    else -> NavigationSuiteScaffoldDefaults.calculateFromAdaptiveInfo(adaptiveInfo)
}
NavigationSuiteScaffold(layoutType = customType, navigationSuiteItems = { ... }) { ... }
```

- Do not hard-code `NavigationSuiteType` constants based on device type or screen inches — always derive them from adaptive info or window size class.
- Do not pass `layoutType` unless you have a specific UX requirement; the default calculation is well-tested and keeps behavior consistent with system expectations.

### Customising item appearance

- Use `NavigationSuiteItemColors` via `NavigationSuiteDefaults.itemColors(...)` to override icon, label, and indicator colours without subclassing.
- Add `badge` content to an `item` to show a `BadgedBox` notification count; the badge layout adapts correctly to bar, rail, and drawer contexts.
- Avoid adding more than 7 destinations. The navigation bar physically fits 5 items comfortably; beyond that the label text clips. Promote overflow items into a secondary drawer or a separate settings screen.

### Content slot insets

- `NavigationSuiteScaffold` applies the correct window insets for each navigation type automatically. Do not apply `navigationBarsPadding()` or `systemBarsPadding()` to the `content` lambda; doing so double-pads on phones.
- Do apply insets to individual screens inside the `NavHost` content if they use top app bars or floating action buttons — `Scaffold` inside each screen handles per-screen insets correctly.

## Platform notes

- **Phones (compact):** The navigation bar renders at the bottom. On gesture-navigation phones the bar sits above the gesture zone; `NavigationSuiteScaffold` accounts for this automatically.
- **Foldables (medium when open):** A navigation rail appears on the left. Verify that the rail does not overlap the hinge by testing with the `FoldingFeature` APIs; `NavigationSuiteScaffold` does not split around the hinge automatically.
- **Tablets and large phones in landscape (expanded):** A persistent navigation drawer is shown. The drawer is always visible and does not require a hamburger toggle. Content area shrinks accordingly; verify that the remaining width is comfortable for your layout.
- **ChromeOS resizable windows:** The window size class changes as the user resizes the window. Compose recomposes and the navigation type transitions live without any additional work. Test at intermediate window widths, not only at breakpoint boundaries.
- **Multi-window on tablets:** The window size class reflects the app's window, not the screen. A phone layout can appear on a tablet in split-screen; the bar/rail/drawer choice automatically matches the actual available width.

## Pitfalls

- Using `NavigationBar`, `NavigationRail`, and `NavigationDrawer` composables directly and switching between them with an `if`/`when` block — this duplicates logic that `NavigationSuiteScaffold` encapsulates. Prefer the scaffold.
- Placing `NavigationSuiteScaffold` inside a `Scaffold` that already applies `paddingValues` from its `content` slot — the outer `Scaffold` insets conflict with the scaffold's own inset handling. Use `NavigationSuiteScaffold` as the outermost shell and place `Scaffold` instances per-screen inside the `NavHost`.
- Not setting `launchSingleTop = true` in nav options — tapping the already-selected destination creates a duplicate back-stack entry and breaks state restoration.
- Calling `currentWindowAdaptiveInfo()` inside a non-composable function — it must be called from within the composition. Store the result in a variable at the top of a `@Composable` function and pass it down.
- Animating the transition between navigation types manually with `AnimatedContent` wrapped around the scaffold — the scaffold handles the structural switch; adding an extra animation layer can cause janky frame timing.
- Forgetting `restoreState = true` in nav options when `saveState = true` is set in `popUpTo` — without it, state saved on the back stack is discarded and the saved scroll position or form input is lost.
- Hard-coding icon sizes inside navigation items — the navigation suite adjusts icon sizing automatically per navigation type. Supplying `Modifier.size(...)` on the icon overrides this and can make icons look out of proportion in the rail or drawer.

## References

- **Documentation:** [Build adaptive navigation with NavigationSuiteScaffold](https://developer.android.com/develop/ui/compose/layouts/adaptive/build-adaptive-navigation)
- **Documentation:** [Adaptive layouts in Compose](https://developer.android.com/develop/ui/compose/layouts/adaptive)

## See also

For the broader adaptive layout system, window size classes, and list-detail pane scaffolding that sits alongside navigation, see `compose-layout`. For styling the colours, typography, and shape tokens that apply to navigation components, see `compose-theming`. For deep-link handling and type-safe routes inside the `NavHost` that `NavigationSuiteScaffold` hosts, see the navigation architecture skill in `lang-tooling`. For Material 3 design-level guidance on when to use a bar versus a rail versus a drawer, see `m3-adaptive-layout`.
