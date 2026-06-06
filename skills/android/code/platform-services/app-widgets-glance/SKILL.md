---
name: app-widgets-glance
description: Covers home-screen widgets built with Jetpack Glance — GlanceAppWidget and its Compose-style UI API, Glance state and update strategies, actions (actionRunCallback, actionStartActivity), responsive and adaptive sizing, and the boundary with legacy RemoteViews. Use when building or modernizing Android home-screen or lock-screen widgets with a Compose-first approach on Android 16+ or targeting large-screen surfaces.
globs:
  - "**/*.kt"
tags: [glance, widgets, appwidget, compose, home-screen]
x-skills-master:
  domain: android
  class: code
  category: platform-services
  platforms: ["android", "large-screen"]
  requires: { "android": "16", "kotlin": "2.2", "compose-bom": "2026.05.00" }
  pairs_with: [m3-widgets]
  sources:
    - https://developer.android.com/develop/ui/compose/glance
    - https://developer.android.com/develop/ui/views/appwidgets/overview
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Apply this guidance when you need to place interactive, auto-updating UI on the Android home screen, lock screen, or quick-settings surface. Reach for Glance when starting any new widget — it replaces hand-crafted `RemoteViews` XML with a Compose-style declarative API. Also use it when migrating an existing `AppWidgetProvider`-based widget to the modern Jetpack stack, or when widgets need to react to `DataStore`, `Flow`, or `WorkManager` results without boilerplate broadcast receivers.

## Core guidance

**Architecture overview**

- A Glance widget has three moving parts: a `GlanceAppWidget` subclass (holds the UI and state logic), a `GlanceAppWidgetReceiver` subclass (the manifest entry point, zero business logic), and a provider metadata XML file referenced by `<appwidget-provider>`. Keep the receiver a one-liner that just overrides `glanceAppWidget`.
- The `@Composable` content function inside `GlanceAppWidget.Content()` is *not* rendered by the Compose runtime directly — Glance translates it to `RemoteViews` behind the scenes. This means only the Glance composable set (`androidx.glance.*`) is available, not standard Material3 components. Import from `androidx.glance.appwidget.*` and `androidx.glance.layout.*`.
- Widget content runs on a background thread in a coroutine context — it is safe to call `suspend` functions and collect `Flow` inside `provideContent { }`.

**State management**

- Prefer `GlanceStateDefinition` backed by `DataStore` (use the built-in `PreferencesGlanceStateDefinition` for key-value data, or supply a custom `DataStore<T>` for structured data). Avoid in-memory state — the widget process may be killed between updates.
- Observe external state by overriding `update(context, glanceId)` and calling `updateAppWidgetState` to write new values, then `update()` to trigger a re-render. Alternatively, drive updates from a `WorkManager` worker or a `BroadcastReceiver` that calls `MyWidget().update(context, glanceId)`.
- For frequently refreshed data, register a `CoroutineWorker` with a `PeriodicWorkRequest` rather than relying solely on `android:updatePeriodMillis` (which is coerced to a minimum of 30 minutes on the system).

**Actions**

- `actionRunCallback<MyCallback>()` — the lightest option; `MyCallback` implements `ActionCallback` and runs in a coroutine, ideal for toggling state or triggering a short background task without opening the app.
- `actionStartActivity<MyActivity>()` or `actionStartActivity(Intent(...))` — deep-links into the app. Pass extras via `actionParametersOf(...)` to tell the Activity which widget or item was tapped.
- `actionSendBroadcast` and `actionStartService` exist for advanced cases; prefer `actionRunCallback` when the work stays in the widget.

**Sizing and responsive layouts**

- Declare `resizeMode` in the XML metadata and always provide `minWidth`/`minHeight` plus `targetCellWidth`/`targetCellHeight` (API 31+). On Android 12+ the system passes multiple available sizes to the widget at once.
- Override `GlanceAppWidget.sizeMode` to control layout strategy: `SizeMode.Single` (one layout for all sizes), `SizeMode.Exact` (recompose each time the size changes), or `SizeMode.Responsive(setOf(DpSize(...), ...))` (declare breakpoints; Glance picks the closest fit, RemoteViews snapshots are cached per breakpoint).
- Prefer `SizeMode.Responsive` for production widgets — it is the most efficient and avoids re-rendering on every drag resize. Inside `Content()` read the current allocated size with `LocalSize.current` to branch your layout.

**Key do/don'ts**

- Do keep `Content()` fast and side-effect-free — heavy I/O belongs in `update()` or a background worker, not in the composable.
- Do use `GlanceModifier` (not `Modifier`) for all layout and click modifiers inside Glance composables.
- Do not use standard Compose state (`remember`, `mutableStateOf`) inside `Content()` — there is no stateful recomposition loop; the whole widget re-renders when `update()` is called.
- Do not embed Views or complex custom drawing in a Glance widget; `RemoteViews` has hard limits on what can be serialized across process boundaries.
- Do use `CircularProgressIndicator` from `androidx.glance.appwidget.components` (Glance's own component set), not the Material3 one.
- Do test on real devices — the Glance preview (`@GlancePreview`) is useful for quick iteration but does not simulate RemoteViews constraints.

```kotlin
// Receiver — manifest entry point
class StepCounterWidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget = StepCounterWidget()
}

// State key
val stepKey = intPreferencesKey("steps")

// Widget
class StepCounterWidget : GlanceAppWidget() {

    override val sizeMode = SizeMode.Responsive(
        setOf(DpSize(120.dp, 100.dp), DpSize(200.dp, 100.dp))
    )

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        provideContent {
            val prefs = currentState<Preferences>()
            val steps = prefs[stepKey] ?: 0
            val size = LocalSize.current
            StepContent(steps = steps, compact = size.width < 180.dp)
        }
    }
}

@Composable
private fun StepContent(steps: Int, compact: Boolean) {
    Column(
        modifier = GlanceModifier.fillMaxSize().padding(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = if (compact) "$steps" else "$steps steps",
            style = TextStyle(fontSize = if (compact) 22.sp else 18.sp)
        )
        Button(
            text = "Refresh",
            onClick = actionRunCallback<RefreshStepsCallback>()
        )
    }
}

// Action callback
class RefreshStepsCallback : ActionCallback {
    override suspend fun onAction(context: Context, glanceId: GlanceId, parameters: ActionParameters) {
        val newSteps = fetchStepsFromSensor(context)
        updateAppWidgetState(context, glanceId) { it[stepKey] = newSteps }
        StepCounterWidget().update(context, glanceId)
    }
}
```

## Platform notes

- **API level:** Core Glance widget support targets API 23+, but `targetCellWidth`/`targetCellHeight` and multi-size previews require API 31+. With `minSdk 16` (as required here), guard cell-based sizing with a version check in XML via `tools:targetApi` or supply a separate `appwidget-provider` resource for older APIs.
- **Large screens:** On foldables and tablets, widgets may be placed on the lock screen or on the always-on home panel at larger allocated sizes. `SizeMode.Responsive` breakpoints should include at least one size above 300 dp to take advantage of the extra space.
- **Wear OS:** Glance for Wear OS (`androidx.glance:glance-wear-tiles`) has a different composable set and tile update model; do not mix it with app widget code.
- **Android 12 widget enhancements:** The runtime can pass rounded-corner radii via `OPTION_APPWIDGET_HOST_CATEGORY` and automatically applies a rounded background. Set `android:widgetFeatures="reconfigurable|dynamicColors"` in the metadata XML to opt in to dynamic color theming.
- **Dynamic color:** Use `GlanceTheme` from `androidx.glance.material3` with `colors = GlanceTheme.colors` (backed by `DynamicTheme`) to inherit Material You palette when running on Android 12+ devices that support it.

## Pitfalls

- **Using standard Compose APIs in widget Content** — `remember`, `LaunchedEffect`, `Flow.collectAsState()`, `SnapshotStateList`, etc. have no effect or throw at runtime in Glance; the composition runs once per `update()` call. All reactive logic must be external (WorkManager, DataStore, broadcast).
- **Forgetting to call `update()` after writing state** — `updateAppWidgetState` only persists data; it does not trigger a re-render. Always follow it with `widget.update(context, glanceId)` or `GlanceAppWidgetManager.getInstance(context).getGlanceIds(MyWidget::class.java).forEach { widget.update(context, it) }` for a full refresh.
- **Using `SizeMode.Exact` for resize-heavy hosts** — every drag gesture fires a new layout pass; this can thrash the widget host. Use `SizeMode.Responsive` with carefully chosen breakpoints instead.
- **Hardcoding pixel sizes** — Glance layout uses `dp` throughout, but serialization to `RemoteViews` means extreme nesting depth or very large dimension values can cause `TransactionTooLargeException`. Keep hierarchy shallow (< 10 deep) and prefer `fillMaxWidth` over specific large sizes.
- **Not declaring `android:exported="true"` on the receiver** — the home launcher can't bind to the widget without it; the widget silently fails to appear.
- **Treating `AppWidgetProvider` and `GlanceAppWidgetReceiver` as interchangeable** — you cannot extend both. If migrating, replace the receiver class entirely; do not inherit from `AppWidgetProvider` and delegate.
- **Blocking the main thread in `onUpdate()`** — even with `GlanceAppWidgetReceiver`, expensive operations must be dispatched to a coroutine or WorkManager. The 10-second broadcast window still applies.

## References

- **Documentation:** [Build widgets with Glance](https://developer.android.com/develop/ui/compose/glance)
- **Documentation:** [App Widgets overview (RemoteViews reference)](https://developer.android.com/develop/ui/views/appwidgets/overview)

## See also

For composable fundamentals that inform the Glance composable model, see `compose-fundamentals`. For persisting widget state between updates, see the DataStore-backed approach described in `state-flow`. For scheduling periodic widget refresh jobs, see patterns covered in `background-work` (WorkManager). For Material You dynamic color theming that feeds into `GlanceTheme`, see `compose-theming`.
