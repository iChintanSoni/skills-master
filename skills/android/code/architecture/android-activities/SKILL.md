---
name: android-activities
description: Covers Activities, lifecycles, launch modes, task state restoration, and inter-activity intent-driven navigation. Use when building activity controllers, handling launch options, managing task affinities, or handling process death recreation.
globs:
  - "**/*Activity.kt"
tags: [activities, lifecycle, task-affinity, launchmode, state-restoration, android]
x-skills-master:
  domain: android
  class: code
  category: architecture
  platforms: ["android"]
  requires:
    android: "16"
    kotlin: "2.2"
  pairs_with: []
  sources:
    - https://developer.android.com/guide/components/activities/intro-activities
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Apply this skill when setting up Activity entry points, configuring task behavior via launch modes and intent flags, handling configuration changes, or restoring UI state across system-initiated process death.

## Core guidance

### Activity Lifecycle

- Respect the lifecycle transitions: `onCreate`, `onStart`, `onResume`, `onPause`, `onStop`, `onDestroy`.
- Perform UI initialization, View binding, and flow setup in `onCreate`.
- Resume interactive updates, sensors, or lightweight background tasks in `onResume` (or `onStart`) and release them in `onPause` (or `onStop`).

### Launch Modes

Configure launch modes using `android:launchMode` in the manifest or via `Intent` flags:
- `standard` (default) — Creates a new instance of the Activity every time.
- `singleTop` — Reuses the instance if it is already at the top of the stack; calls `onNewIntent` instead of launching a new instance.
- `singleTask` — Creates the activity at the root of a new task or reuses an existing task with the activity; clears all activities on top of it.
- `singleInstance` — Like `singleTask`, but no other activities can be launched into its task.

### State Restoration

- Save minimal, transient UI state in `onSaveInstanceState(outState: Bundle)` (e.g. user input, scroll position, selected item ID) to handle system-initiated process death.
- Restore the state in `onCreate` or `onRestoreInstanceState`.
- For Jetpack Compose, use `rememberSaveable` to persist screen-level compose variables automatically across configuration changes and process death.

```kotlin
class DetailActivity : ComponentActivity() {

    private var itemId: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Restore state if process death occurred
        itemId = savedInstanceState?.getString(KEY_ITEM_ID) 
            ?: intent.getStringExtra(EXTRA_ITEM_ID)

        setContent {
            DetailScreen(itemId = itemId)
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        outState.putString(KEY_ITEM_ID, itemId)
    }

    companion object {
        private const val KEY_ITEM_ID = "item_id_key"
        const val EXTRA_ITEM_ID = "item_id_extra"
    }
}
```

## Platform notes

- **Activity Results:** Avoid using the deprecated `startActivityForResult`. Use the modern `registerForActivityResult(contract, callback)` API to launch activities and collect results.
- **Process Death:** To test state restoration, put the app in the background and terminate the process from Android Studio / terminal, then relaunch to confirm the correct state was restored.

## Pitfalls

- **Leaking Context:** Storing references to the Activity context in singletons or repositories causes memory leaks. Always use `applicationContext` for long-lived components.
- **Too much data in Bundle:** Storing large bitmaps or collections in `onSaveInstanceState` throws a `TransactionTooLargeException`. Store only identifiers (IDs) and fetch the full data from the repository during initialization.
- **Blocking onCreate:** Performing slow I/O or network calls directly on the main thread during lifecycle callbacks will trigger an Application Not Responding (ANR) error. Use Kotlin coroutines to execute work asynchronously.

## References

- **Documentation:** [Introduction to Activities](https://developer.android.com/guide/components/activities/intro-activities)
- **Documentation:** [Activity lifecycle](https://developer.android.com/guide/components/activities/activity-lifecycle)
- **Documentation:** [Tasks and back stack](https://developer.android.com/guide/components/activities/tasks-and-back-stack)

## See also

See the `lifecycle` skill for managing lifecycle transitions. For persisting UI state, see the `compose-state` and `saved-state` skills.
