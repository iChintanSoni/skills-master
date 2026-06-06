## Compose migration review checklist

- [ ] Every `ComposeView` inside a Fragment calls `setViewCompositionStrategy(ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed)`.
- [ ] All `ComposeView.setContent { }` blocks are wrapped in the app's `AppTheme` composable.
- [ ] `AppTheme` uses a `ColorScheme` that mirrors `colors.xml` brand values so migrated and legacy screens look consistent.
- [ ] `StateFlow` is collected with `collectAsStateWithLifecycle()`, not `collectAsState()`, to avoid background collection.
- [ ] `AndroidView` update lambdas mutate the existing View instance — they do not inflate or construct a new View on each recomposition.
- [ ] `rememberUpdatedState` is used inside `AndroidView` lambdas that capture values that can change between recompositions.
- [ ] ViewModels shared across the Fragment/Compose boundary contain no Android framework types (no `Context`, no `View` references).
- [ ] Navigation arguments carry only primitives or `@Serializable` data classes — no raw `Parcelable` objects that could break on process death.
- [ ] Screen-level composables are stateless (state hoisted to the ViewModel), making them independently testable with `ComposeTestRule`.
- [ ] `ComposeTestRule` tests replace Espresso tests for each migrated screen; Espresso tests are removed once the screen no longer uses Views.
- [ ] The migration leaves the app shippable after each screen increment — no long-running Compose-only branches that cannot be merged.
- [ ] Navigation Compose (`NavHost`) is not introduced until the majority of destination screens are Compose-native.
- [ ] Type-safe routes (`@Serializable` destinations) are used with Navigation Compose 2.8+ rather than string-based route constants.
- [ ] Large-screen adaptive layouts use `WindowSizeClass` or `NavigableListDetailPaneScaffold` where appropriate rather than mirroring the handset layout.
- [ ] Screenshot or snapshot tests are in place at screen boundaries to catch visual regressions introduced during migration.
- [ ] Compose BOM version is pinned in `libs.versions.toml` so all Compose library versions stay in sync without manual coordination.
- [ ] `enableEdgeToEdge()` is called in `Activity.onCreate` before `setContent` so Compose content draws behind system bars correctly.
