---
name: choosing-background-work
description: Decision router for Android background work strategies in 2026. Use when choosing between WorkManager, foreground services, AlarmManager, and in-process coroutines for a task based on persistence requirements, timing precision, and user visibility.
tags: [workmanager, background, coroutines, foreground-service, alarmmanager]
x-skills-master:
  domain: android
  class: overview
  category: overviews
  platforms: ["android", "large-screen"]
  requires: { "android": "16", "kotlin": "2.2" }
  pairs_with: [workmanager]
  sources:
    - https://developer.android.com/develop/background-work/background-tasks
    - https://developer.android.com/guide/background
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for this skill when deciding how to run a task that should not block the main thread — uploads, syncs, media processing, alarms, downloads, or any long-running operation. It applies to greenfield decisions ("how should I implement this?") and audits of existing code ("why is the OS killing my work?"). It does not cover in-depth API usage for any individual mechanism; those belong in dedicated code skills.

## Core guidance

Android imposes strict limits on background execution to protect battery and memory. Choosing the wrong mechanism leads to work being silently killed, ANRs, or battery abuse flagged by Google Play. The right choice is driven by three questions:

1. **Must the work survive process death or device restart?** If yes, you need a durable mechanism.
2. **Does the work require a precise wall-clock time?** If yes, you need exact scheduling.
3. **Is there an ongoing user-visible operation in progress?** If yes, a foreground service is warranted and is the only way to keep the process alive for an extended period.

### Decision tree

```
Task needs to run in background?
│
├─ Work must complete even if the app is killed or the device reboots?
│   │
│   ├─ YES — needs exact wall-clock timing (calendar alarm, reminder)?
│   │         └─ AlarmManager (setExactAndAllowWhileIdle / setAlarmClock)
│   │
│   ├─ YES — no exact timing required (sync, upload, index, ML inference)?
│   │         └─ WorkManager  ← default choice for durable work
│   │
│   └─ NO — work is bounded by the app's lifetime?
│           │
│           ├─ User is actively watching progress (download bar, recording, navigation)?
│           │         └─ Foreground Service + coroutine scope tied to service
│           │
│           └─ Fire-and-forget while UI is on screen, or short async operation?
│                     └─ Coroutine in viewModelScope / lifecycleScope
```

### WorkManager — durable, constraint-aware work (preferred default)

WorkManager is the correct choice for the majority of background tasks. It is guaranteed to run even after process death, device restart, or OS-imposed process kills, and it negotiates constraints (network, charging, storage) with the OS on behalf of the app.

- Use for: media uploads and downloads, database sync, log flushing, push-driven server sync, on-device ML batch jobs, image compression.
- A `OneTimeWorkRequest` or `PeriodicWorkRequest` is enqueued once; WorkManager owns retry, backoff, and constraint re-evaluation.
- Chain workers with `then()` or `combine()` for pipeline tasks (download → process → upload).
- `expedited()` work (API 31+) gives a best-effort fast lane when the user expects a near-immediate result, while still surviving process death.
- On API 31+ devices, WorkManager can run expedited work via short `ForegroundService` internally — the library handles the details.

```kotlin
val uploadRequest = OneTimeWorkRequestBuilder<UploadWorker>()
    .setExpedited(OutOfQuotaPolicy.RUN_AS_NON_EXPEDITED_WORK_REQUEST)
    .setConstraints(
        Constraints(requiredNetworkType = NetworkType.CONNECTED)
    )
    .build()

WorkManager.getInstance(context).enqueueUniqueWork(
    "photo-upload",
    ExistingWorkPolicy.KEEP,
    uploadRequest
)
```

### Foreground Service — user-visible ongoing operations

Use a foreground service when the user is directly experiencing the work: an active download with a progress bar, a music playback session, a navigation turn-by-turn overlay, screen recording, or a VoIP call. The OS requires a persistent notification so the user knows background work is happening.

- The service keeps the process at elevated priority, preventing the OS from killing it for memory reclamation.
- As of Android 14, foreground service types are mandatory (`android:foregroundServiceType` in the manifest). Declare `dataSync`, `mediaPlayback`, `location`, etc. as appropriate; missing declarations cause a crash on API 34+.
- Pair with a `CoroutineScope` tied to the service's `onDestroy` — launch coroutines from the service, not a `viewModelScope`.
- Do not use a foreground service to keep a process alive for background work that does not have an active user-visible component; this violates Play policy and burns battery.

### AlarmManager — exact wall-clock timing

Use AlarmManager only when the user has explicitly set a time-sensitive event: a calendar alarm, a medication reminder, or a time-bound notification. The `USE_EXACT_ALARM` or `SCHEDULE_EXACT_ALARM` permission (API 31+) is required and must be declared.

- `setExactAndAllowWhileIdle` delivers in Doze; `setAlarmClock` appears in the system clock UI and is never batched.
- AlarmManager does not retry on failure; if the system is under load when the alarm fires, your `BroadcastReceiver` gets a short window — enqueue a `WorkRequest` from the receiver if non-trivial work is needed.
- Do not use AlarmManager for repeating background sync; WorkManager's `PeriodicWorkRequest` is the correct replacement.

### Coroutines in-process — ephemeral work tied to the app

For work that is inherently scoped to a UI component's lifetime, structured concurrency with `viewModelScope` or `lifecycleScope` is the right choice.

- Use for: loading data to display, user-triggered operations that show progress in the current screen, real-time subscription while the app is in the foreground.
- Work is automatically cancelled when the ViewModel is cleared or the lifecycle owner is destroyed — this is a feature, not a limitation.
- Do not use `GlobalScope`; it has no structured cancellation and leaks coroutines.
- If the operation must survive configuration change but not process death, `viewModelScope` is correct. If it must survive process death, use WorkManager instead.

### Comparison at a glance

| Mechanism | Survives process death | Exact timing | Needs notification | Best for |
|---|---|---|---|---|
| `viewModelScope` / `lifecycleScope` | No | No | No | In-app async, data loading |
| WorkManager | Yes | No (batched) | No (unless expedited) | Durable deferred tasks |
| Foreground Service | Yes (while running) | N/A | Yes (required) | Ongoing user-visible ops |
| AlarmManager | Yes | Yes | No | Exact user-set alarms |

**Recommended default:** WorkManager. Choose an alternative only when the specific signal above applies.

## Platform notes

**Battery restrictions** — Android 16 tightens background limits further. Apps on the restricted standby bucket get very few WorkManager windows per day; apps in the active bucket run normally. Avoid keeping a foreground service alive when the user is not actively engaged — Google Play now automatically detects foreground service abuse and can reject updates.

**Large screens and foldables** — background work APIs are identical across form factors. However, if a foreground service is displaying a notification and the user is on a tablet in split-screen, consider that the notification surface is compact — keep notification text short and action-focused.

**API 34+ foreground service types** — `ForegroundServiceStartNotAllowedException` is thrown if `startForeground` is called from a context that is no longer eligible (e.g., from a `BroadcastReceiver` after a while-idle alarm when the app is not in the foreground). Catch and gracefully degrade, or migrate to WorkManager expedited work for those cases.

**WorkManager and exact constraints** — `PeriodicWorkRequest` has a minimum interval of 15 minutes. If you need something more frequent, reconsider whether the task belongs in a foreground service instead.

## Pitfalls

- **Using `GlobalScope` for background work** — coroutines in `GlobalScope` are not cancelled when the component is destroyed and cannot be supervised, leading to silent memory leaks and duplicate work.
- **Using AlarmManager as a recurring sync scheduler** — AlarmManager does not adapt to Doze or battery state. WorkManager's `PeriodicWorkRequest` handles this automatically and is the correct tool.
- **Starting a foreground service for non-visible work** — Play policy prohibits using foreground services to keep the process alive for work the user has no visibility into. This leads to Play enforcement actions.
- **Forgetting `foregroundServiceType` in the manifest** — on API 34+ this causes `MissingForegroundServiceTypeException` at runtime, not at compile time. Test on an API 34+ device before shipping.
- **Enqueuing WorkManager tasks without `enqueueUniqueWork`** — without uniqueness constraints, duplicate enqueueing (e.g., on every Activity resume) accumulates redundant queued work.
- **Holding a `WakeLock` manually** — WorkManager and foreground services handle wake lock acquisition internally. Manual `WakeLock` management is error-prone and almost never necessary; a leaked lock drains the battery and triggers ANRs.
- **Neglecting network-type constraints on uploads** — uploading on metered connections without declaring `NetworkType.UNMETERED` in constraints surprises users on limited data plans. Always declare the minimum network requirement explicitly.

## References

- **Developer Guide:** [Background tasks overview](https://developer.android.com/develop/background-work/background-tasks)
- **Developer Guide:** [Background work guide](https://developer.android.com/guide/background)

## See also

For WorkManager API depth (chaining, periodic work, `ListenableWorker`, testing), see `workmanager` in the Android code skills. For foreground service setup and notification channel wiring, see `foreground-services`. For coroutine lifecycle scopes and structured concurrency in ViewModels, see `swift-concurrency` as a conceptual parallel or the Android-specific `coroutines` code skill. For battery and performance profiling of background tasks, see `instruments-profiling` as a conceptual reference, and the Android `android-performance` skill for Macrobenchmark and battery historian guidance.
