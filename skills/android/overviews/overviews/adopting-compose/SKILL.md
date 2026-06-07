---
name: adopting-compose
description: Migration guide for moving an existing Android View/XML app to Jetpack Compose incrementally — leaf-first or screen-by-screen — covering ComposeView in XML/Fragments, AndroidView for retained Views, shared ViewModels across the boundary, theme bridging, navigation, and testing. Use when planning or executing a Compose migration on a live app, choosing a migration order, wiring Compose screens into an existing Fragment/Navigation-Component stack, or deciding when to switch fully to Compose navigation.
tags: [compose, migration, interop, material3, viewmodel]
x-skills-master:
  domain: android
  class: overview
  category: overviews
  platforms: ["android", "large-screen"]
  requires: { "android": "16", "kotlin": "2.2" }
  pairs_with: ["android-views-interop"]
  sources:
    - https://developer.android.com/develop/ui/compose/migrate
    - https://developer.android.com/develop/ui/compose/migrate/strategy
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for this skill when migrating an existing Android app from Views/XML to Jetpack Compose and the rewrite cannot happen in one go. It applies when deciding which screens or components to migrate first, how to share a `ViewModel` between a Fragment and a Compose screen, how to keep the app shippable at every step, and when to cut over navigation from Fragments to the Compose-native Navigation component. It is a strategy guide, not a tutorial on individual Compose APIs.

## Core guidance

### Migration philosophy

- Treat the migration as a series of safe, shippable increments rather than a branch that blocks other work. Each increment should leave the app in a releasable state.
- Prefer a **leaf-up** order: migrate small, self-contained leaf components first (buttons, cards, list items), then rows, then full screens, and finally navigation. This keeps risk contained.
- Do not rewrite screens that are stable and have no upcoming changes — migrate when a screen needs a new feature or a significant rework, paying down the cost at the natural change point.

### ComposeView in XML/Fragments (View host → Compose content)

- Add a `ComposeView` to an existing XML layout or return it from `Fragment.onCreateView` to embed Compose UI inside a View hierarchy. This is the primary entry point for incremental adoption.
- Call `setViewCompositionStrategy(ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed)` on the `ComposeView` when hosting inside a Fragment so the composition is disposed at the right lifecycle moment and does not leak.
- Keep the Fragment/Activity thin: it should only create the `ComposeView`, forward arguments, and delegate state to a `ViewModel`. Do not put business logic in the Fragment that should belong to the composable tree.

### AndroidView for retained View components (Compose host → View content)

- Use `AndroidView { context -> MyLegacyView(context) }` inside Compose when a View cannot yet be migrated — maps, camera surfaces, custom `SurfaceView` components, or any third-party View-based widget.
- Put all state reconciliation in the `update` lambda; never recreate the View on every recomposition. Capture state as `rememberUpdatedState` if the lambda needs to read values that change over time.
- Use `AndroidViewBinding` when the retained component is an inflated XML layout with view bindings already in place.

### Sharing ViewModels across the boundary

- A `ViewModel` scoped to an Activity or a Navigation graph is shared naturally between Fragment hosts and Compose screens within the same scope. Both can call `viewModel()` or `activityViewModels()` and receive the same instance.
- Expose state as `StateFlow` or `LiveData` from the `ViewModel` and collect it with `collectAsStateWithLifecycle()` on the Compose side — this respects lifecycle pausing and does not collect in the background.
- Avoid passing Android-framework types (Context, View references) into the `ViewModel`; keep it framework-agnostic so both sides can share it cleanly.

```kotlin
// Fragment hosts Compose and shares its ViewModel
class ProfileFragment : Fragment() {
    private val viewModel: ProfileViewModel by viewModels()

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?
    ) = ComposeView(requireContext()).apply {
        setViewCompositionStrategy(
            ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed
        )
        setContent {
            val uiState by viewModel.uiState.collectAsStateWithLifecycle()
            AppTheme {
                ProfileScreen(
                    state = uiState,
                    onSave = viewModel::save
                )
            }
        }
    }
}
```

### Bridging themes

- Wrap all `ComposeView` content in your `MaterialTheme` so Compose components pick up your brand colors, typography, and shapes rather than falling back to defaults.
- Use `MaterialTheme.colorScheme` values that mirror your existing `colors.xml` values during the transition so both sides look consistent. Tools like the Material Theme Builder can export a Compose `ColorScheme` from your existing brand palette.
- Prefer creating a dedicated `AppTheme` composable that consolidates your `MaterialTheme` configuration; call it once at the root of each `ComposeView.setContent` block.
- Avoid calling `ViewThemeUtils.createMaterialYouColorTheme` or similar compatibility shims for longer than necessary — move toward a canonical Compose `ColorScheme` as soon as both sides can share it.

### Navigation during migration

- Keep Fragment-based Navigation Component (`androidx.navigation:navigation-fragment`) as the shell during early migration stages. Navigate between Fragments as before; individual screens just render their content with Compose internally.
- Once the majority of screens are in Compose, cut over to `androidx.navigation:navigation-compose` for the migrated set. Route definitions replace Fragment transactions, and the back stack is managed by `NavHost`.
- A hybrid approach — where some destinations are Fragments and others are Compose `NavHost` composables — is supported but adds complexity; prefer completing screen-level Compose migration before switching the nav host.
- Pass only primitives and IDs as navigation arguments. Retrieve full objects from the `ViewModel` or repository inside the destination, not via `Parcelable` bundles across a nav boundary.

### Migration order (recommended)

1. **Build foundation first** — add Compose BOM and Material 3 dependencies, create `AppTheme`, set up baseline `ComposeView` in one low-risk screen.
2. **Leaf components** — migrate shared atoms like buttons, chips, cards that appear across many screens.
3. **Individual screens, highest churn first** — screens actively being developed benefit most from the migration; stable legacy screens can wait.
4. **Navigation shell** — cut over to Navigation Compose once most screens are Compose-native.
5. **Migrate last** — complex dialogs, custom Views with intricate drawing logic, third-party View SDKs without Compose wrappers.

### Testing

- Unit-test `ViewModel` logic independently; it is UI-toolkit-agnostic and requires no change during migration.
- Use `ComposeTestRule` (`createComposeRule` / `createAndroidComposeRule`) for composable-level tests. These replace Espresso for migrated screens.
- Keep Espresso tests for any screen still running in Views, and remove them as those screens migrate.
- Write screenshot or snapshot tests at screen boundaries to catch visual regressions across the migration — compare before-and-after.

## Platform notes

- On **large screens** (tablets, foldables), Compose's adaptive layout utilities (`WindowSizeClass`, `NavigableListDetailPaneScaffold`) pay dividends earlier than on handsets. Migrate large-screen layouts first if they are actively being improved.
- The interop path is identical on **ChromeOS** (Android apps running in a resizable window); test that `ComposeView` inside Activities handles window size changes correctly.
- `Navigation Compose` 2.8+ supports type-safe routes via `@Serializable` data classes — prefer this over string-based routes in new navigation wiring.

## Pitfalls

- Neglecting `setViewCompositionStrategy` on Fragments. Without it, the composition is disposed and recreated on back-stack navigation, causing unnecessary work and potential bugs.
- Putting theme setup inside individual composables instead of at the `setContent` root, leading to Compose components rendering with Material default colors rather than your brand theme.
- Inflating a new View on every `AndroidView` update lambda instead of mutating the existing instance, causing flicker and bypassing View recycling.
- Migrating navigation too early, while many screens are still Fragment-based, creating a brittle hybrid where destinations must carry both Fragment and Compose implementations.
- Sharing complex `Parcelable` objects through navigation arguments; deep links and process death break if arguments cannot be reconstructed from primitives alone.
- Collecting `StateFlow` with `collectAsState()` instead of `collectAsStateWithLifecycle()`, which continues collection while the app is backgrounded and wastes battery.
- Assuming a big-bang rewrite is faster. In practice, large Compose rewrites done off-branch delay shipping, accumulate merge conflicts, and skip the feedback loop that incremental migration provides.

## References

- **Documentation:** [Migrate to Jetpack Compose](https://developer.android.com/develop/ui/compose/migrate)
- **Documentation:** [Compose migration strategy](https://developer.android.com/develop/ui/compose/migrate/strategy)
- **Documentation:** [ComposeView interop API](https://developer.android.com/develop/ui/compose/migrate/interoperability-apis/compose-in-views)
- **Documentation:** [AndroidView — Views in Compose](https://developer.android.com/develop/ui/compose/migrate/interoperability-apis/views-in-compose)

## See also

For the composable mental model, recomposition rules, and the three rendering phases, see `compose-fundamentals`. For collecting `StateFlow` safely with lifecycle awareness, see `compose-state`. For Material 3 theming and `ColorScheme` setup in Compose, see `compose-material3-theming`. For structuring the navigation graph with Navigation Compose, see `compose-navigation`.
