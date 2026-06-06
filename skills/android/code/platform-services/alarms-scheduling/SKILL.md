---
name: alarms-scheduling
description: Covers AlarmManager scheduling on Android — exact vs inexact alarms, setExactAndAllowWhileIdle, SCHEDULE_EXACT_ALARM permission, Doze interactions, and when alarms beat WorkManager. Use when you need to fire code at a precise wall-clock time that must survive device idle or Doze mode.
globs:
  - "**/*.kt"
tags: [alarms, alarmmanager, scheduling, background-work, doze]
x-skills-master:
  domain: android
  class: code
  category: platform-services
  platforms: ["android", "large-screen"]
  requires: { "android": "16", "kotlin": "2.2" }
  pairs_with: []
  sources:
    - https://developer.android.com/develop/background-work/services/alarms/schedule
    - https://developer.android.com/training/scheduling/alarms
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Use `AlarmManager` when your app must execute code at a specific wall-clock time and the work cannot be deferred — for example, calendar event reminders, medication alerts, or time-sensitive notifications. AlarmManager is the right choice when:

- The trigger must fire within a few seconds of the target time, even if the device is in Doze.
- The target time is defined by the user or an external event, not by a retry/backoff policy.
- A deferrable constraint-based approach (WorkManager) would miss the UX window.

For deferrable, constraint-aware background work (network syncs, periodic jobs, upload retries), prefer WorkManager. AlarmManager bypasses Doze allowances and costs more battery, so reserve it only for truly time-critical cases.

## Core guidance

**Exact vs inexact alarms**

- `set()` / `setInexactRepeating()` — system batches these with other alarms to reduce wake-ups; delivery can be minutes late. Prefer this for periodic, non-urgent work.
- `setExact()` — fires at the requested time but is suppressed during Doze windows.
- `setExactAndAllowWhileIdle()` — fires at the requested time even in Doze. Rate-limited: at most once per 9 minutes (foreground-exempt apps) or once per 15 minutes (background apps). Use sparingly.
- `setAlarmClock()` — visible in system UI as an upcoming alarm; exempt from Doze throttling. Best for user-visible wake-up alarms.

**SCHEDULE_EXACT_ALARM permission**

Starting Android 12 (API 31), `setExact()` and `setExactAndAllowWhileIdle()` require either:
- `SCHEDULE_EXACT_ALARM` (granted by default for calendar/clock apps; user can revoke it in Settings), or
- `USE_EXACT_ALARM` (auto-granted, no user prompt, but restricted to specific use cases — alarms, reminders, timers).

Always check `alarmManager.canScheduleExactAlarms()` before calling exact APIs. If permission is missing, either fall back to inexact scheduling or deep-link the user to `ACTION_REQUEST_SCHEDULE_EXACT_ALARM`.

**BroadcastReceiver pattern**

Alarms deliver to a `BroadcastReceiver`. Keep the receiver lightweight — start a `Service` or enqueue a `WorkManager` one-shot task for anything that takes more than a few milliseconds.

**Rescheduling after reboot**

Alarms do not survive a reboot. Register a `BOOT_COMPLETED` receiver (requires `RECEIVE_BOOT_COMPLETED` permission) to restore active alarms after device restart.

**Cancellation**

Cancel by providing a `PendingIntent` that matches the original (same action, component, and extras used for matching). Use `PendingIntent.FLAG_NO_CREATE` to check whether an alarm is already scheduled without creating a new intent.

```kotlin
@AndroidEntryPoint
class ReminderScheduler @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val alarmManager = context.getSystemService(AlarmManager::class.java)

    fun scheduleReminder(id: Int, triggerAtMillis: Long) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S &&
            !alarmManager.canScheduleExactAlarms()
        ) {
            // Guide user to grant permission instead of crashing.
            context.startActivity(
                Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            )
            return
        }

        val intent = Intent(context, ReminderReceiver::class.java).apply {
            action = "com.example.ACTION_REMINDER"
            putExtra("reminder_id", id)
        }
        val pending = PendingIntent.getBroadcast(
            context, id, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        alarmManager.setExactAndAllowWhileIdle(
            AlarmManager.RTC_WAKEUP,
            triggerAtMillis,
            pending
        )
    }

    fun cancel(id: Int) {
        val intent = Intent(context, ReminderReceiver::class.java).apply {
            action = "com.example.ACTION_REMINDER"
        }
        val pending = PendingIntent.getBroadcast(
            context, id, intent,
            PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
        ) ?: return
        alarmManager.cancel(pending)
    }
}
```

**Clock types**

- `RTC_WAKEUP` — wall-clock time (UTC milliseconds), wakes device.
- `RTC` — wall-clock time, fires only when device is already awake.
- `ELAPSED_REALTIME_WAKEUP` — time since boot; use for intervals relative to "now" to avoid drift across timezone changes.
- `ELAPSED_REALTIME` — same, no wake.

**Repeating alarms**

Avoid `setRepeating()` with short intervals (< 60 s) — the system enforces a minimum interval of 60 seconds since API 19. For truly periodic work, chain one-shot alarms: reschedule from inside the `BroadcastReceiver` or use WorkManager's `PeriodicWorkRequest` for anything deferrable.

## Platform notes

**Large-screen / multi-window:** AlarmManager behavior is identical on tablets and foldables. There are no multi-window-specific alarm APIs; however, ensure your receiver-launched UI targets the correct display if needed.

**Doze and App Standby:** Doze restricts alarms during maintenance windows. `setExactAndAllowWhileIdle()` punches through Doze but is rate-limited. Apps in the `RARE` standby bucket face additional quota limits on exact alarms. Battery-optimized apps in restricted standby may see alarms deferred indefinitely — inform users if your app requires disabling battery optimization for reliable delivery.

**Android 14+ (API 34) background restriction:** Apps targeting API 34+ that call `setExactAndAllowWhileIdle()` while in the background without `USE_EXACT_ALARM` will throw a `SecurityException` if `SCHEDULE_EXACT_ALARM` was revoked. Guard every exact alarm call with `canScheduleExactAlarms()`.

**Testing:** Use `adb shell cmd alarm set` to inject test alarms without waiting for real time. Use `adb shell dumpsys alarm` to inspect scheduled alarms. For Doze simulation, run `adb shell dumpsys deviceidle force-idle`.

## Pitfalls

- **Mutability flag omission** — `PendingIntent` created without `FLAG_IMMUTABLE` (or `FLAG_MUTABLE` when required) throws on API 31+. Always specify one.
- **Missing permission check** — calling `setExact()` on API 31+ without `canScheduleExactAlarms()` guard causes a `SecurityException` crash.
- **Alarm lost on reboot** — forgetting `BOOT_COMPLETED` means alarms silently disappear after restart.
- **Wakelock not held** — the system holds a wakelock only until your `BroadcastReceiver.onReceive()` returns. Async work started inside the receiver (coroutines, callbacks) will run without a wakelock. Use `goAsync()` or delegate to a foreground service.
- **Large PendingIntent extras** — alarm intents are stored in system memory; keep extras small. For complex payloads, store state in a database and pass only an ID.
- **Timezone drift with RTC** — if the user changes timezone, `RTC_WAKEUP` alarms still fire at the original UTC millisecond. Recalculate and reschedule after `ACTION_TIMEZONE_CHANGED`.
- **Overusing exact alarms** — exact alarms prevent the system from batching and increase battery drain. Use inexact whenever user experience tolerates a few minutes of jitter.

## References

- **Documentation:** [Schedule alarms — Android Developers](https://developer.android.com/develop/background-work/services/alarms/schedule)
- **Training guide:** [Scheduling alarms — Android Developers](https://developer.android.com/training/scheduling/alarms)

## See also

- **background-tasks** — use WorkManager's `PeriodicWorkRequest` or `OneTimeWorkRequest` for deferrable, constraint-aware background work instead of AlarmManager.
- **user-notifications** — pair alarm delivery with the notifications skill to post visible, actionable alerts when the alarm fires.
- **foreground-services** — when alarm-triggered work exceeds a few seconds, hand off to a foreground service to retain the wakelock and avoid ANR.
