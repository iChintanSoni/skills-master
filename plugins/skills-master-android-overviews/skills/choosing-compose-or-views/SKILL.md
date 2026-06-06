---
name: choosing-compose-or-views
description: Decision guide for picking Jetpack Compose versus the View/XML system in 2026. Use when starting a new Android UI feature or screen, evaluating a migration path, or weighing tradeoffs between modern declarative UI and an existing View-based codebase.
---

## When to use

Reach for this skill when you need to make a conscious choice about which UI system to use for a screen, a feature, or an entire app — whether that's a greenfield project, a new module dropped into an existing app, or a long-term migration plan. Also useful when onboarding a team to a codebase that mixes both approaches and you need to establish clear conventions.

## Core guidance

### Jetpack Compose — the default for new work

- Start every new app and every new screen in Compose unless a specific blocker applies.
- Compose handles adaptive layouts (phones, tablets, foldables, desktops) cleanly through `WindowSizeClass`, `AdaptiveNavigationSuite`, and the Canonical Layouts catalogue.
- State-driven, unidirectional data flow reduces the category of bugs that stem from view-state drift; no more `notifyDataSetChanged()` footguns.
- Material 3 components are native Compose; achieving full M3 fidelity in Views requires significant manual work.
- Tooling is mature: Layout Inspector, Live Edit, Compose Preview with multi-device mode, and Compose-aware Baseline Profiles all ship in stable Android Studio releases.
- Prefer `@Composable` lambdas over `ViewHolder` patterns for any list or grid; `LazyColumn`/`LazyVerticalGrid` are the idiomatic replacements for `RecyclerView`.
- For large-screen and foldable support, `NavigationSuiteScaffold` and `ListDetailPaneScaffold` from `androidx.compose.material3.adaptive` are Compose-native and have no View counterpart.

### View/XML system — legitimate remaining uses

- Do **not** rewrite working, stable screens in a large legacy app just to use Compose; the risk/reward is poor unless accompanied by a broader refactor.
- Some third-party libraries still ship only as `View` subclasses (custom maps SDKs, certain media players, legacy chart libraries). Wrap them in `AndroidView` or `AndroidViewBinding` rather than waiting.
- `WebView`, `SurfaceView`, `TextureView`, and `MapView` all interop correctly via `AndroidView`; this is not a reason to avoid Compose at the screen level.
- Teams with deep XML/`ConstraintLayout` expertise on a deadline can deliver faster in Views; Compose productivity gains are most visible after onboarding ramp-up.

### Incremental migration path

The two systems interoperate cleanly:

- **Views hosting Compose** — drop a `ComposeView` into any `layout/*.xml` file or create it programmatically in a `Fragment`/`Activity`.
- **Compose hosting Views** — use `AndroidView` (for a single `View`) or `AndroidViewBinding` (for an inflated layout) inside any `@Composable`.
- **Fragment-by-fragment migration** — migrate leaf screens to Compose first, then work inward toward navigation and shared UI chrome; navigation itself can remain `NavController`-based throughout.

```kotlin
// Fragment acting as a Compose host — minimal migration shim
class LegacyScreenFragment : Fragment() {

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ) = ComposeView(requireContext()).apply {
        setViewCompositionStrategy(
            ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed
        )
        setContent {
            MaterialTheme {
                // New Compose screen; existing Fragment nav stack is untouched
                MyNewScreen(
                    onBack = { requireActivity().onBackPressedDispatcher.onBackPressed() }
                )
            }
        }
    }
}

// Compose hosting a View-only third-party widget
@Composable
fun LegacyChartCard(data: List<Float>) {
    AndroidView(
        factory = { ctx -> ThirdPartyChartView(ctx) },
        update = { view -> view.setData(data) },
        modifier = Modifier.fillMaxWidth().height(200.dp)
    )
}
```

### Decision checklist (quick reference)

| Signal | Lean Compose | Lean Views |
|---|---|---|
| Greenfield screen or app | Yes | — |
| Adaptive / large-screen layout | Yes | — |
| Material 3 design system | Yes | — |
| Third-party View-only library | — | Wrap via AndroidView |
| Stable legacy code, no active churn | — | Leave as-is |
| Team onboarding in <2 weeks | Neutral | Slight edge |
| Foldable / WindowSizeClass support | Yes | — |

## Platform notes

**Large screens and foldables** — Compose's `material3-adaptive` artefacts (`NavigationSuiteScaffold`, `ListDetailPaneScaffold`) are the canonical path for adaptive UIs in 2026. The equivalent View-based approaches require manual window-size breakpoint logic and lack the same first-party guidance.

**Android TV / Automotive** — Compose for TV (`androidx.tv:tv-compose`) and Automotive are available but less mature than the phone/tablet stack. Evaluate library coverage before committing greenfield TV/Auto projects entirely to Compose.

**Minimum API** — Compose requires `minSdk 21`; if your app targets devices below API 21, Views remain mandatory for those code paths.

**Baseline Profiles** — Compose startup and jank can be significantly reduced with Baseline Profiles (generated via Macrobenchmark). This is Compose-specific overhead that Views do not carry; account for it in performance-sensitive shipping apps.

## Pitfalls

- **Mixing state models** — holding `MutableLiveData` in a ViewModel observed by both a View and a Compose sibling creates dual sources of truth. Unify on `StateFlow`/`collectAsStateWithLifecycle` as you migrate.
- **Premature full rewrites** — replacing a large, stable `RecyclerView`-backed screen in one PR introduces regression risk without proportional product value. Prefer incremental fragment-by-fragment migration.
- **Ignoring interop lifecycle** — `ComposeView` inside a `Fragment` needs `ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed`; omitting it leaks the composition until the fragment is destroyed, not just paused.
- **Over-relying on `AndroidView` for performance** — `AndroidView` incurs extra measure/layout passes. If a View widget has a Compose equivalent, prefer the Compose version.
- **Theme mismatch** — running Compose inside a `MaterialComponents` XML theme without wrapping content in `MaterialTheme {}` produces unstyled or crash-prone components. Always provide a Compose `MaterialTheme` at the Compose root.
- **Assuming Views are "safer"** — View code carries its own maintenance costs (custom `Drawable` states, `RecyclerView.Adapter` boilerplate, manual diff logic). Perceived safety from familiarity is not the same as lower risk.

## Open question

**Should a team migrate an actively developed legacy View codebase to Compose in 2026?**

There is no universally correct answer, and reasonable Android teams disagree.

**Arguments for migrating aggressively**

Compose is Google's stated direction; new Jetpack APIs, Material 3 components, and adaptive layout building blocks are Compose-native. Teams that delay migration may find the gap widening — more new APIs to back-port or miss, and growing difficulty hiring developers who primarily know Compose. Developer productivity studies (including Google's internal data on apps like Play Store and Drive) suggest significant reduction in code volume and test surface over time.

**Arguments for migrating conservatively**

A stable, revenue-generating View-based codebase is not broken. Migrations introduce regression risk, consume engineering capacity that could ship features, and require team upskilling. Incremental interop means there is rarely an urgent forcing function; the two systems can coexist indefinitely. Some teams report that mixed Compose/View codebases are harder to reason about during the transition period than either pure approach.

**The honest middle ground**

Most teams land on: Compose-first for all *new* screens and features, Views left in place for *stable* existing screens, with opportunistic migration during natural refactors (redesigns, major feature changes) rather than dedicated migration sprints. Where you draw that line depends on codebase size, team experience, and business priorities — not a framework recommendation alone.

## References

- **Developer Guide:** [Android UI Development](https://developer.android.com/develop/ui)
- **Official Blog:** [Android UI Development is Compose-First](https://developer.android.com/blog/posts/android-ui-development-is-compose-first)
- **Migration Guide:** [Interoperability APIs](https://developer.android.com/develop/ui/compose/migrate/interoperability-apis)

## See also

For hands-on Compose patterns, see `swiftui-core` (conceptual parallels for developers coming from iOS). For adaptive layout specifics, see `hig-designing-for-ipados` as a conceptual reference, and within the Android skill set see `navigation-architecture` for how Compose's `NavHost` and the legacy `NavController`/Fragment backstack can coexist. For state management patterns that underpin the Compose-first model, see `swiftui-state-data-flow` for iOS conceptual reference or the Compose-specific `observation` patterns in the Apple domain as a structural parallel.
