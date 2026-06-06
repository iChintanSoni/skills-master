---
name: lifecycle
description: Covers lifecycle-aware components in Android — the Lifecycle and LifecycleOwner contract, lifecycle states and events, safe Flow collection with repeatOnLifecycle and flowWithLifecycle, DefaultLifecycleObserver for non-Compose observers, and reacting to lifecycle events in Compose with LifecycleEventEffect. Use when collecting Flows safely across foreground/background transitions, observing lifecycle events outside Compose, or hooking side effects to specific lifecycle states in a composable.
---

## When to use

Apply this guidance whenever code must react to the Android lifecycle safely — starting or stopping work as a screen moves between visible and invisible states. Common triggers: collecting a `Flow` in an `Activity` or `Fragment` without leaking background work, attaching a component that must register and unregister itself cleanly, executing a side effect tied to a specific lifecycle event inside a composable, or auditing existing code that uses the deprecated `LifecycleObserver` annotation processor.

## Core guidance

**Understand the two orthogonal lifecycle axes**
- `Lifecycle.State` — the *current* state of an owner: `INITIALIZED`, `CREATED`, `STARTED`, `RESUMED`, `DESTROYED`. Think of these as rungs on a ladder.
- `Lifecycle.Event` — the *transition* between states: `ON_CREATE`, `ON_START`, `ON_RESUME`, `ON_PAUSE`, `ON_STOP`, `ON_DESTROY`, and `ON_ANY`. Events fire during the transitions, not while in a state.

**Use `repeatOnLifecycle` for safe Flow collection in Activity / Fragment**
- `repeatOnLifecycle(Lifecycle.State.STARTED)` launches the given block each time the lifecycle enters `STARTED` and cancels it when it drops below (enters `STOPPED`). This is the canonical safe collection point — the UI is visible in `STARTED`, and work is cancelled before the screen goes into the background.
- Always call it from a coroutine that is already scoped to the lifecycle owner (e.g. `lifecycleScope.launch` in an `Activity`/`Fragment`). Do not launch it from `GlobalScope` or an arbitrary `CoroutineScope`.
- Prefer `STARTED` over `RESUMED` for most Flow collection: `RESUMED` cancels during transient windows like dialogs or picture-in-picture, causing unnecessary restarts.

**Use `flowWithLifecycle` as an operator alternative**
- `flow.flowWithLifecycle(lifecycle, Lifecycle.State.STARTED)` is the equivalent single-operator form — it returns a new `Flow` that only emits when the lifecycle is at or above the given state.
- Choose `flowWithLifecycle` when you are chaining operators and want to keep the pipeline readable; choose `repeatOnLifecycle` when the block contains multiple `collect` calls or other suspend calls alongside collection.
- Do not combine both in the same pipeline — they solve the same problem and nesting them doubles the overhead.

**Implement `DefaultLifecycleObserver` for non-Compose components**
- `DefaultLifecycleObserver` is the interface-based replacement for the deprecated `@OnLifecycleEvent` annotation API. Override only the methods you need (`onStart`, `onStop`, etc.).
- Register with `lifecycle.addObserver(observer)` in `onCreate` and remove with `lifecycle.removeObserver(observer)` if the component manages its own unregistration. In practice, the `Lifecycle` machinery removes all observers when the owner is destroyed, so manual removal is only necessary to detach early.
- Prefer `DefaultLifecycleObserver` for third-party SDK wrappers, analytics helpers, or any component that must manage its own start/stop independently of the UI layer.

**React to lifecycle events in Compose with `LifecycleEventEffect`**
- `LifecycleEventEffect` (from `androidx.lifecycle:lifecycle-runtime-compose`) is a composable side-effect handler that runs a lambda when the specified `Lifecycle.Event` occurs on the current `LocalLifecycleOwner`. It automatically cleans up when the composable leaves the composition.
- Use it for lightweight side effects like resuming a media player, logging a screen view, or pausing an animation — not for launching coroutines that collect long-lived Flows (use `collectAsStateWithLifecycle` for that).
- Do not use `LifecycleEventEffect` for `ON_DESTROY`; the composition is torn down before `ON_DESTROY` fires in most cases. Use `DisposableEffect` or a `ViewModel`'s `onCleared` callback instead.

```kotlin
// Activity: safely collect a Flow only while the screen is visible.
class HomeActivity : ComponentActivity() {
    private val viewModel: HomeViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        lifecycleScope.launch {
            // Block restarts each time lifecycle >= STARTED, cancels on STOP.
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.uiState.collect { state ->
                    // update UI — only runs while screen is foregrounded
                }
            }
        }

        setContent {
            // In Compose, collectAsStateWithLifecycle wraps the same mechanism.
            val uiState by viewModel.uiState.collectAsStateWithLifecycle()
            HomeScreen(
                uiState = uiState,
                onResume = viewModel::onScreenResumed,
            )
        }
    }
}

// Composable: react to a specific lifecycle event.
@Composable
fun HomeScreen(uiState: HomeUiState, onResume: () -> Unit) {
    LifecycleEventEffect(Lifecycle.Event.ON_RESUME) {
        onResume()
    }
    // ... rest of UI
}

// Non-Compose component: observe lifecycle events via interface.
class AnalyticsTracker(private val screenName: String) : DefaultLifecycleObserver {
    override fun onStart(owner: LifecycleOwner) = Analytics.trackScreenView(screenName)
    override fun onStop(owner: LifecycleOwner) = Analytics.trackScreenExit(screenName)
}
// In Activity.onCreate: lifecycle.addObserver(AnalyticsTracker("Home"))
```

## Platform notes

- **Large-screen / multi-window:** Each window pane backed by a `NavBackStackEntry` has its own `LifecycleOwner`. When two panes are simultaneously visible, each `repeatOnLifecycle` block runs independently, so data is collected for every visible pane. Design ViewModel state to be safely shared without double-emission side effects.
- **Foldable screen transitions:** Folding or unfolding can trigger configuration changes that recreate the `Activity`, cycling through `STOPPED` → `DESTROYED` → `CREATED` → `STARTED`. Ensure any cleanup in `onStop` / `DefaultLifecycleObserver.onStop` is idempotent.
- **Predictive Back:** When the user initiates a predictive back gesture, the destination's lifecycle drops to `CREATED` before the gesture resolves. If you use `STARTED` as the minimum state, collection pauses during the preview. This is intentional — avoid starting new work during back-gesture previews.
- **`ProcessLifecycleOwner`:** Use `ProcessLifecycleOwner.get().lifecycle` to observe app-level foreground/background transitions (it fires `ON_STOP` only after all Activities are stopped, not per-Activity). Prefer it for app-wide analytics or session tracking rather than per-screen observers.

## Pitfalls

- **Calling `lifecycleScope.launch { flow.collect { } }` directly** — this collects indefinitely even when the screen is backgrounded. Always nest inside `repeatOnLifecycle` or use `flowWithLifecycle` / `collectAsStateWithLifecycle`.
- **Using `RESUMED` as the minimum state** — `RESUMED` drops to `PAUSED` on any overlapping window (dialog, permission sheet, notification shade), causing collection to restart far more often than needed. Use `STARTED` unless the work truly requires the screen to be fully interactive.
- **Calling `repeatOnLifecycle` inside a Fragment's `onCreateView`** — the view's lifecycle (`viewLifecycleOwner`) is the correct owner for view-related flows; using the Fragment's own `lifecycle` can collect even after the view is destroyed while the fragment is on the back stack. Always use `viewLifecycleOwner.lifecycleScope` and `viewLifecycleOwner.repeatOnLifecycle` in Fragments.
- **Stacking `repeatOnLifecycle` and `flowWithLifecycle` on the same flow** — both operators guard against the same lifecycle drop, so nesting them is redundant and creates double cancellation overhead. Pick one.
- **Using deprecated `@OnLifecycleEvent` annotations** — annotation-based observation requires `lifecycle-compiler` kapt/ksp and is removed from the core API surface. Switch to `DefaultLifecycleObserver`.
- **Reacting to `ON_DESTROY` in `LifecycleEventEffect`** — the composable may leave the tree before `ON_DESTROY` fires, making the effect unreliable. Use `DisposableEffect` for cleanup that must run when a composable exits.
- **Holding a strong reference to a `LifecycleOwner` inside an observer** — `DefaultLifecycleObserver` receives the owner as a parameter in each callback; do not store it as a field, which risks leaking the `Activity` or `Fragment`.

## References

- **Documentation:** [Lifecycle-aware components](https://developer.android.com/topic/libraries/architecture/lifecycle)
- **Documentation:** [Coroutines and lifecycle — repeatOnLifecycle and flowWithLifecycle](https://developer.android.com/topic/libraries/architecture/coroutines)

## See also

For lifecycle-safe `StateFlow` collection in Compose using `collectAsStateWithLifecycle`, see `state-flow`. For coroutine scoping with `viewModelScope` and structured concurrency in a ViewModel, see `viewmodel`. For `LaunchedEffect` and `DisposableEffect` side-effect APIs within Compose, consult the Compose side-effects skill.
