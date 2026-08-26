---
name: choosing-navigation
description: Decision guide for selecting a navigation approach in Android apps — Jetpack Navigation 3 with an app-owned back stack, Navigation Compose with type-safe routes, Fragment-based Navigation, or a lightweight custom solution. Use when starting a new app, adding a multi-screen flow, choosing between Navigation 3 and Navigation Compose, or evaluating a back-stack migration.
license: MIT
tags: [fragments, architecture, routing]
x-skills-master:
  domain: android
  class: overview
  category: overviews
  platforms: ["android", "large-screen"]
  requires: {android: "16", kotlin: "2.2"}
  pairs_with: [navigation3, navigation-compose, android-navigation-architecture]
  sources:
    - https://developer.android.com/guide/navigation
    - https://developer.android.com/develop/ui/compose/navigation
    - https://developer.android.com/guide/navigation/navigation-3
  snapshot_date: "2026-08-25"
  stability: stable
  version: 1.1.0
---

## When to use

Reach for this skill whenever you are choosing or reconsidering how screens connect in an Android app: a new Compose-first project, a feature module that introduces its own navigation graph, or a legacy Fragment app weighing migration. It routes the decision; the implementation details live in the per-topic navigation code skills.

## Core guidance

Four realistic options exist in 2026. For a greenfield Compose app the default is now Jetpack Navigation 3; Navigation Compose remains the right home for established Compose apps.

### Jetpack Navigation 3 — the default for new Compose apps

Navigation 3 (`androidx.navigation3:navigation3-runtime` + `navigation3-ui`, stable since November 2025) is Google's Compose-native navigation model: your code owns the back stack as an observable list of keys, and `NavDisplay` renders it. It exists because the framework-owned `NavController` model fights Compose's state-first architecture.

- **Back stack as state** — push/pop are list mutations; deep links are a list assignment; every navigation decision is testable state logic.
- **Scenes** — the same back stack can render two panes at once on large screens via scene strategies, which matters more now that Android 17 force-resizes apps on big screens.
- **Shared elements and metadata** — 1.1 adds shared-element transitions between scenes and a type-safe `NavMetadata` DSL.

Choose Navigation 3 for new Compose apps, for apps whose navigation is naturally state-driven, and when multi-pane adaptive layouts are on the roadmap. Do not rush to migrate a working Navigation Compose app — migration inverts back-stack ownership and touches every navigation call site; migrate when scenes or state-driven navigation pay for it. Implementation details live in the `navigation3` code skill.

### Navigation Compose with type-safe routes — established Compose apps

Navigation Compose (`androidx.navigation:navigation-compose`) remains fully supported and is the pragmatic choice for apps already built on it. Since Navigation 2.8, routes are defined as `@Serializable` data classes or objects, giving compile-time safety, IDE autocomplete, and argument passing without string formatting or `Bundle` boilerplate.

Key characteristics:

- **Type-safe routes** — a `@Serializable` data class is the route; arguments are constructor parameters. No string keys, no `putInt`/`getInt` mismatch bugs at runtime.
- **`NavHost` + composable destinations** — each screen is a `@Composable` registered with the `NavHost`; no XML nav graph is required.
- **Nested graphs** — group related destinations into a nested `NavHost` call or use `navigation { }` builder blocks to encapsulate feature flows and hide internal routes from the caller.
- **Adaptive navigation** — `NavigationSuiteScaffold` and `ListDetailPaneScaffold` from `androidx.compose.material3.adaptive` plug directly into `NavController`; no manual back-stack logic needed.
- **Deep links** — declared on a `composable { }` destination the same way as in Fragment nav graphs; the system routes intent URIs automatically.
- **Multi-module** — expose a feature's nested graph as an extension function on `NavGraphBuilder` in the feature module; the app module calls it without a direct dependency on any screen composable.

```kotlin
// Type-safe route definitions — shared module or feature-local
@Serializable data object Home
@Serializable data class Detail(val itemId: String)

// App nav graph
NavHost(navController, startDestination = Home) {
    composable<Home> { HomeScreen(onItemClick = { id -> navController.navigate(Detail(id)) }) }
    composable<Detail> { backStackEntry ->
        val args = backStackEntry.toRoute<Detail>()
        DetailScreen(itemId = args.itemId)
    }
}
```

### Fragment-based Navigation — legacy and interop only

The Fragment/XML Navigation Component (`androidx.navigation:navigation-fragment`) remains fully supported and is the correct choice when:

- The app is primarily View/Fragment-based and you are migrating incrementally. Rewriting the backstack in the same PR as migrating screens is high-risk; keep nav stable while the UI migrates.
- A required library or SDK hands back a `Fragment` subclass you do not own (e.g., certain map or payment SDKs). Host it in a Fragment destination; do not try to embed it in a Compose `AndroidView`.
- Your project's minimum SDK or team constraints predate Compose adoption; Fragment nav is stable and well-understood.

Fragment nav and Navigation Compose share the same `NavController` abstraction and deep-link model, so a Fragment-nav app can migrate destinations one at a time using a `ComposeView` inside each Fragment host.

### Lightweight custom backstack — only for tiny apps

A manual backstack (a `mutableStateListOf<Screen>()` in a ViewModel, navigated with `push`/`pop`) is exactly the model Navigation 3 formalizes — with restoration, predictive back, and adaptive scenes done for you. If you are reaching for a hand-rolled stack, that is the signal to adopt Navigation 3 instead: you keep the ownership model and shed the maintenance liability. A fully custom stack is defensible only in a throwaway prototype.

### Decision summary

| Signal | Navigation 3 | Navigation Compose | Fragment Nav |
|---|---|---|---|
| Greenfield Compose app | Yes | OK | — |
| Established Navigation Compose app | Migrate only for cause | Yes | — |
| Multi-pane / adaptive scenes | Yes (scene strategies) | Scaffold-level only | Manual |
| Navigation driven from owned state | Yes | Workarounds | — |
| Multi-module feature nav | Yes (entryProvider per module) | Yes (NavGraphBuilder ext) | Yes |
| Existing Fragment-based app, no active rewrite | — | — | Yes |
| SDK hands back a Fragment you do not own | — | — | Yes |
| Kotlin Multiplatform | Yes | — | — |

## Platform notes

**Large screens and foldables** — `NavigationSuiteScaffold` (bottom bar on phone, rail on tablet, drawer on desktop) and `ListDetailPaneScaffold` (detail pane on wide screens, stacked nav on phones) are Compose-native. Both consume a `NavController` and react to `WindowAdaptiveInfo` automatically. The Fragment equivalents require manual breakpoint logic and have no maintained scaffold abstraction.

**Multi-module navigation** — in Navigation Compose, each feature module adds its destinations via a `NavGraphBuilder` extension function and owns its route types. The app module depends only on that extension function, not on internal composables. Combined with sealed interfaces for cross-module navigation events (passed up to the app-level `NavHost` via a shared event bus or ViewModel), this keeps module boundaries clean.

**Nested graphs** — use nested `navigation { }` blocks to scope a feature's internal backstack and expose a single entry-point route. The host graph navigates to the entry point; the feature manages its own internal routes without leaking them upward. This is the idiomatic pattern for auth flows, onboarding wizards, and checkout screens.

**Process death and state restoration** — Navigation Compose restores the backstack from the `SavedStateHandle` automatically when the system kills the process. Custom backstacks must implement this manually; it is the most common omission that makes them inappropriate at scale.

**Back gesture** — predictive back animations (Android 14+) are supported natively in Navigation Compose destinations. Fragment nav destinations also support predictive back. Custom backstacks require manual `OnBackPressedCallback` integration and additional animation work.

## Pitfalls

- **String routes in Navigation Compose** — using the older string-based `composable("route/{arg}")` API loses type safety and IDE navigation. Always use `@Serializable` route objects with Navigation 2.8+.
- **ViewModel scoping confusion** — a `ViewModel` obtained with `hiltViewModel()` or `viewModel()` inside a composable destination is scoped to that destination's backstack entry, not to the whole `NavHost`. To share state across destinations, scope the ViewModel to the parent `NavBackStackEntry` (the nested graph or the activity).
- **Navigating from outside the composition** — call `navController.navigate(...)` only from within event handlers or `LaunchedEffect`, never directly during composition. Navigating during recomposition causes unpredictable behavior.
- **Nested NavHosts for adaptive layouts** — do not create a second `NavHost` inside a `ListDetailPaneScaffold`'s detail pane just to handle back. Use `ThreePaneScaffoldNavigator` from `material3-adaptive-navigation-suite`; it manages the pane stack and the system back gesture for you.
- **Premature custom backstack** — a hand-rolled `mutableStateListOf` looks simpler on day one and becomes a maintenance liability the moment deep links, process death, or a second entry point appear. Default to Navigation Compose even for small apps.
- **Exposing internal routes across module boundaries** — if a feature module's route data class leaks into the app module's nav graph declaration, you have a hidden coupling. Keep internal routes `internal`; expose only the entry-point route and the `NavGraphBuilder` extension.

## References

- **Developer Guide:** [Navigation overview](https://developer.android.com/guide/navigation)
- **Developer Guide:** [Navigation Compose](https://developer.android.com/develop/ui/compose/navigation)

## See also

For UI system selection (Compose versus Views) see `choosing-compose-or-views`. For the app-owned back stack model see `navigation3`; for the NavController model see `navigation-compose`. For the architectural principles either should serve — single source of truth for the stack, module boundaries, deep-link strategy — see `android-navigation-architecture`.
