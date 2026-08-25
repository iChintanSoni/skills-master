---
name: navigation3
description: Covers Jetpack Navigation 3 — the Compose-native navigation library where your code owns the back stack as observable state, with NavDisplay, NavEntry, entryProvider, scene strategies for adaptive multi-pane layouts, shared elements between scenes, and the NavMetadata DSL. Use when starting navigation in a new Compose app, rendering two destinations at once on large screens, driving navigation from state you already own, or weighing a migration from Navigation Compose.
---

## When to use

Reach for Navigation 3 (`androidx.navigation3:navigation3-runtime` + `navigation3-ui`, stable since November 2025) when building navigation for a Compose-first app — especially when you need the things Navigation 2 fights you on: rendering more than one destination at a time (list-detail on a tablet), driving navigation from state your ViewModel already owns, or deep-linking by simply assigning a list. Stay on Navigation Compose (`navigation-compose`) for established apps where it already works — it remains supported — and for Views/Fragment navigation, which Navigation 3 does not target.

## Core guidance

- Own the back stack as state. The stack is a plain observable list of keys you create — typically `remember { mutableStateListOf<Any>(Home) }` or a list hoisted into a ViewModel. Push by `add`, pop by `removeLastOrNull`, deep-link by assigning the whole list. There is no `NavController`; every navigation bug becomes an ordinary state bug you can log and test.
- Keys are your own types — data classes or data objects, kept small and serializable so state restoration works (`SavedStateConfiguration` handles the persistence). One key type per destination, resolved to UI by an `entryProvider`.
- `NavDisplay` renders the stack: give it the back stack, an `onBack` that pops, and an `entryProvider` mapping each key to a `NavEntry` whose content composable renders that destination. Each `NavEntry` retains its own state and ViewModel scope while it remains on the stack (`lifecycle-viewmodel-navigation3` wires the scoping).

```kotlin
data object Home
data class Detail(val id: String)

@Composable
fun App() {
    val backStack = remember { mutableStateListOf<Any>(Home) }
    NavDisplay(
        backStack = backStack,
        onBack = { backStack.removeLastOrNull() },
        entryProvider = entryProvider {
            entry<Home> { HomeScreen(onOpen = { backStack.add(Detail(it)) }) }
            entry<Detail> { key -> DetailScreen(key.id) }
        },
    )
}
```

- Use scene strategies for adaptive layouts instead of duplicating navigation logic per form factor. A `Scene` can lay out several back-stack entries at once — the canonical two-pane list-detail is a scene that shows the top two entries side by side at expanded widths and falls back to single-pane when compact. `NavDisplay` accepts a `List<SceneStrategy>` (since 1.1) tried in order.
- Decorate across scenes with `SceneDecoratorStrategy` (1.1) when chrome or shared state must persist while scenes change — it is deliberately separate from `SceneStrategy` so layout selection and decoration compose independently.
- Shared element transitions between scenes work by passing a `SharedTransitionScope` to `NavDisplay` or `rememberSceneState` (1.1); pair with the `NavMetadataKeys` transition metadata rather than hand-rolling animation state.
- Attach per-destination configuration through the type-safe `NavMetadata` DSL (`MetadataKey`) — this is how an entry tells its parent scene about title bars, panes, or transition preferences without the scene knowing concrete destination types. Metadata can be added dynamically per entry key.
- Predictive back integrates through `androidx.navigationevent:navigationevent-compose`; `OverlayScene.onRemoved` (a suspending callback that runs after key removal but before the composable leaves composition) is the hook for exit animations on dialogs and overlays.

## Platform notes

- **Large screens and foldables:** scenes are the entire point — the same back stack renders single-pane on a phone and two-pane on a tablet, so navigation state never forks by form factor. This matters more since Android 17 force-resizes apps on large screens.
- **Kotlin Multiplatform:** Navigation 3 ships JVM, Native, and Web targets, unlike Navigation 2.
- **minSdk 23**; current stable is 1.1.6 (August 2026) with compileSdk 37.
- **Views/Fragments:** not supported — Navigation 3 is Compose-only. Fragment-based apps stay on Navigation 2.

## Pitfalls

- **Recreating the back stack on every composition** — `mutableStateListOf` must be inside `remember` (or a ViewModel); a bare call resets navigation on recomposition.
- **Fat keys** — putting whole model objects into keys bloats saved state and breaks restoration when models change shape. Keys carry identifiers; screens load their own data.
- **Treating Navigation 3 like Navigation 2** — wrapping the list in a `navigate()`/`popBackStack()` facade rebuilds the abstraction the library removed. Mutate the list where the state lives.
- **One giant `when` instead of `entryProvider`** — the `entryProvider` DSL gives each destination its own retained `NavEntry` scope; a hand-rolled `when` over the top key loses per-entry state retention.
- **Migrating a working app for no feature gain** — the migration inverts back-stack ownership, which touches every navigation call site. Migrate when scenes, multi-pane, or state-driven navigation pay for it, not because Nav2 is "old".

## References

- **Guide — Navigation 3:** [https://developer.android.com/guide/navigation/navigation-3](https://developer.android.com/guide/navigation/navigation-3)
- **Releases — navigation3:** [https://developer.android.com/jetpack/androidx/releases/navigation3](https://developer.android.com/jetpack/androidx/releases/navigation3)
- **Recipes:** [https://github.com/android/nav3-recipes](https://github.com/android/nav3-recipes)
- **Announcement:** [https://android-developers.googleblog.com/2025/11/jetpack-navigation-3-is-stable.html](https://android-developers.googleblog.com/2025/11/jetpack-navigation-3-is-stable.html)

## See also

For the framework-owned NavController model this library replaces, see `navigation-compose`. For deciding between the two on a new project, see `choosing-navigation`. For the architectural principles either library should serve, see `android-navigation-architecture`.
