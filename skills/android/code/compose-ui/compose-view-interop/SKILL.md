---
name: compose-view-interop
description: Covers bidirectional Compose/View interoperability — AndroidView and AndroidViewBinding to embed Views in Compose, ComposeView and AbstractComposeView to host Compose in Fragments or XML layouts, ViewCompositionStrategy for lifecycle safety, and cross-boundary state sharing. Use when incrementally migrating a screen, embedding a legacy custom View with no Compose equivalent, or adding Compose islands inside an existing Fragment/View hierarchy.
globs:
  - "**/*.kt"
tags: [compose, interop, migration, androidview, composeview, fragments]
x-skills-master:
  domain: android
  class: code
  category: compose-ui
  platforms: ["android", "large-screen"]
  requires: { "android": "16", "kotlin": "2.2", "compose-bom": "2026.05.00" }
  pairs_with: []
  sources:
    - https://developer.android.com/develop/ui/compose/migrate/interoperability-apis
    - https://developer.android.com/develop/ui/compose/migrate
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

- You have a legacy `View` or custom `ViewGroup` with no Compose equivalent and need to render it inside a Composable (chart library, `MapView`, `SurfaceView`, `WebView`, etc.).
- You are incrementally migrating an existing Fragment-based app to Compose and want to introduce a Compose "island" inside a Fragment's XML layout without a full rewrite.
- A screen is mostly Compose but a single complex View cannot yet be ported.
- You need to share `ViewModel` state or `Flow`s across the Compose/View boundary in a lifecycle-safe way.

Prefer a full migration over long-lived interop — interop adds complexity. Use it as a bridge, not a permanent state.

---

## Core guidance

### AndroidView — embedding a View inside Compose

- Use `AndroidView` when you need a single `View` instance managed by Compose's lifecycle.
- `factory` runs once on initial composition; use it for expensive setup, subscriptions, or imperative configuration that must happen only once.
- `update` runs on every recomposition where captured state changes; keep it idempotent and cheap.
- Capture only stable, snapshot-readable values in `update` to avoid spurious recompositions.
- For complex View hierarchies defined in XML, prefer `AndroidViewBinding` — it inflates the binding once and gives you the typed binding object in `update`.

```kotlin
@Composable
fun LegacyChartView(
    data: List<Float>,
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current

    AndroidView(
        factory = { ctx ->
            MyLegacyChartView(ctx).apply {
                // One-time setup: listeners, attach, etc.
                setOnDataPointClickListener { index ->
                    Log.d("Chart", "Tapped $index")
                }
            }
        },
        update = { view ->
            // Called on recomposition when `data` changes.
            view.submitData(data)
        },
        modifier = modifier
            .fillMaxWidth()
            .height(240.dp),
        onRelease = { view ->
            // Optional: clean up resources when removed from composition.
            view.cleanup()
        }
    )
}

@Composable
fun LegacyToolbarBinding(title: String, modifier: Modifier = Modifier) {
    AndroidViewBinding(
        factory = MyToolbarBinding::inflate,
        modifier = modifier,
    ) {
        toolbarTitle.text = title
    }
}
```

**Key rules**
- Never hold a reference to the `View` outside the `update`/`onRelease` lambdas — Compose owns its lifetime.
- Do not drive View state from `remember { mutableStateOf(...) }` values that are written from `update`; flow state downward from the ViewModel.
- `onRelease` is called when the composable leaves the composition permanently — use it to cancel coroutines started in `factory` or detach listeners.

---

### ComposeView — embedding Compose inside a View/Fragment/XML

- Add a `ComposeView` to your XML layout or create it programmatically; call `setContent { ... }` to supply the composable tree.
- Always call `setViewCompositionStrategy` before `setContent`.

**ViewCompositionStrategy choices**

| Strategy | When to use |
|---|---|
| `DisposeOnViewTreeLifecycleDestroyed` | Default; dispose when the `ViewTreeLifecycleOwner` is destroyed. Correct for most Fragment and Activity cases. |
| `DisposeOnDetachedFromWindowOrReleasedFromPool` | Required when the `ComposeView` lives inside a `RecyclerView` — disposes on detach so it can be reused. |
| `DisposeOnLifecycleDestroyed(lifecycle)` | Use when you have an explicit `Lifecycle` reference and want precise control. |

```kotlin
// Inside a Fragment
override fun onCreateView(...): View {
    return ComposeView(requireContext()).apply {
        setViewCompositionStrategy(
            ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed
        )
        setContent {
            MaterialTheme {
                MyFeatureScreen(viewModel = hiltViewModel())
            }
        }
    }
}
```

- In XML, declare `<androidx.compose.ui.platform.ComposeView android:id="@+id/compose_view" .../>` and call `binding.composeView.setContent { ... }` from `onViewCreated`.
- Do not call `setContent` more than once; instead, hoist state to a `ViewModel` so the composable re-renders reactively.

---

### AbstractComposeView — custom View subclass hosting Compose

Use `AbstractComposeView` when you need a reusable component that is a `View` from the outside (e.g., for use in a `ViewGroup` that you do not own, or when building a shared UI component library):

```kotlin
class ComposeProgressBar @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyle: Int = 0,
) : AbstractComposeView(context, attrs, defStyle) {

    var progress by mutableFloatStateOf(0f)

    @Composable
    override fun Content() {
        LinearProgressIndicator(
            progress = { progress },
            modifier = Modifier.fillMaxWidth(),
        )
    }
}
```

- Expose state as `var` properties backed by `mutableStateOf` / `mutableFloatStateOf` — changes propagate into Compose automatically.
- `AbstractComposeView` wires up its own lifecycle; do not set a `ViewCompositionStrategy` manually unless you have an unusual lifecycle.

---

### Sharing state across the boundary

- **ViewModel as the single source of truth** — both the Fragment/Activity (View side) and Composables observe the same `ViewModel`. Use `collectAsStateWithLifecycle()` in Compose; use `lifecycleScope.launchWhenStarted` or `repeatOnLifecycle` on the View side.
- Avoid passing `MutableState` references across the Compose/View boundary — it creates implicit coupling.
- For event channels (clicks, form submit), use `SharedFlow` or callbacks passed into the composable as lambdas.
- Theming: wrap `ComposeView` content in `MaterialTheme` (or your app theme) so Material 3 tokens (color, typography, shapes) are consistent with any existing Compose screens.

---

## Platform notes

**Large screen / multi-window**
- `ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed` correctly handles configuration changes from window resizing — do not use `DisposeOnDetachedFromWindowOrReleasedFromPool` outside RecyclerView; it will dispose prematurely during split-screen transitions.
- When hosting `ComposeView` inside a `MotionLayout` or constraint-driven layout, ensure the `ComposeView` has an explicit size; `wrap_content` can cause measurement loops.

**RecyclerView cells containing Compose**
- Set `DisposeOnDetachedFromWindowOrReleasedFromPool` so the composition is discarded when the item scrolls off and reused in a different position.
- If you use `AbstractComposeView` as a cell, the same strategy applies — call `setViewCompositionStrategy` in the constructor.

---

## Pitfalls

- **Missing `ViewCompositionStrategy`** — the default strategy is `DisposeOnDetachedFromWindowOrReleasedFromPool`. In a Fragment, this disposes Compose when the Fragment goes to the back stack and detaches, then recreates it on return — causing visible flicker and lost ephemeral UI state. Always set `DisposeOnViewTreeLifecycleDestroyed` for Fragment use.
- **Calling `setContent` from the wrong thread** — `setContent` must be called on the main thread; do not call it from a background coroutine.
- **Leaking the View from `factory`** — storing the View in a variable outside `AndroidView` lambdas means it outlives the composition slot and will not be released.
- **Nested `ComposeView` in `AndroidView`** — this creates a second separate composition context with its own `CompositionLocal` tree. Locals like `LocalContext` and `LocalLifecycleOwner` are typically re-provided correctly, but custom locals will not propagate — explicitly pass required values.
- **Incorrect `onRelease` vs `onReset`** — `onRelease` fires on permanent removal; there is no `onReset` for `AndroidView`. If you use the view inside a `LazyColumn`, each item gets its own factory call; this is usually correct but can be expensive for heavy views — consider caching with `key`.
- **Theming mismatch** — a `ComposeView` without `MaterialTheme` will use default Material 3 tokens, which may look inconsistent with the rest of the app. Always wrap with your `AppTheme`.

---

## References

- **Interoperability APIs:** [Compose interoperability APIs](https://developer.android.com/develop/ui/compose/migrate/interoperability-apis)
- **Migration guide:** [Migrate to Jetpack Compose](https://developer.android.com/develop/ui/compose/migrate)
- **ViewCompositionStrategy:** [ViewCompositionStrategy reference](https://developer.android.com/reference/kotlin/androidx/compose/ui/platform/ViewCompositionStrategy)

---

## See also

See `compose-state` for state hoisting patterns that make cross-boundary data flow cleaner. See `uikit-swiftui-interop` for the analogous pattern on iOS. For Fragment-level architecture decisions, see `android-navigation-architecture`.
