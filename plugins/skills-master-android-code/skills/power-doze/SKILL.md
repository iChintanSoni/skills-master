---
name: power-doze
description: Covers Android Doze mode and App Standby buckets, background execution and network restrictions, battery-optimization exemptions, and designing work to survive maintenance windows. Use when building features that schedule background work, send notifications, sync data, or must behave correctly under power-saving constraints.
---

## When to use

Apply this skill whenever a feature relies on background execution, periodic data sync, push messaging, alarms, or any network access that may run while the screen is off or the user has not interacted with the app for an extended period. It is especially relevant when targeting Android 6 (API 23) and above, where Doze and App Standby were introduced, and critical for Android 12+ (API 31) where foreground-service restrictions and exact-alarm permissions tightened further.

## Core guidance

### Doze mode

Doze activates when the device is unplugged, stationary, and screen-off for a sustained period. The system alternates between **maintenance windows** (full network and wake-lock access) and **deep-sleep periods** where nearly all background work is deferred. With each successive Doze cycle the maintenance windows become shorter and further apart.

**Do:**
- Schedule all deferrable work through `WorkManager`. It respects maintenance windows automatically and is re-scheduled after reboots.
- Use `FCM high-priority messages` to wake the app for time-critical user-visible events (incoming calls, chat messages). High-priority FCM is the only reliable way to deliver real-time content to a Doze device without an exemption.
- For user-visible alarms (alarm clocks, calendar reminders) use `AlarmManager.setAlarmClock()` or `setExactAndAllowWhileIdle()` — these fire even in Doze but count against a strict per-app quota.
- Test Doze behaviour with `adb shell dumpsys deviceidle` and the `step` commands to force the device through Doze phases without waiting.

**Don't:**
- Do not assume `setExact()` or `setInexactRepeating()` will fire on schedule during Doze; they are batched.
- Do not acquire partial wake-locks to circumvent Doze — they are ignored during deep sleep.
- Do not poll the network directly from a background thread or `Service` that is not a foreground service; the network interface is disabled during Doze.

### App Standby buckets (API 28+)

The system places each app in one of five buckets based on recency of use: **ACTIVE → WORKING_SET → FREQUENT → RARE → RESTRICTED**. Bucket membership controls how many jobs, alarms, and network calls the system permits per day. An app with no recent user interaction can be demoted to RARE or RESTRICTED, heavily throttling background work.

**Do:**
- Consolidate background work into as few `WorkManager` tasks as possible; redundant jobs accelerate demotion.
- Surface your app through widgets, live tiles, or App Shortcuts to encourage user interaction and maintain a higher bucket.
- Read the current bucket with `UsageStatsManager.getAppStandbyBucket()` if you need to adapt UI messaging (e.g., warn the user that background sync is limited).
- Design sync logic to batch data: when a maintenance window opens, do everything at once rather than scheduling multiple small tasks.

**Don't:**
- Do not use `JobScheduler` with `setPeriodic()` intervals shorter than 15 minutes — the system silently enforces a minimum floor.
- Do not rely on exact timing for any non-user-visible periodic work; treat all intervals as "approximately N minutes, some time in the future."

### Battery-optimization exemptions

`REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` removes the app from Doze and App Standby restrictions entirely. This is a powerful, user-visible opt-out that Google Play scrutinises heavily.

**Do:**
- Request an exemption only for apps with a clear, user-facing justification: VoIP dialers, personal-safety apps, medical-device companions. The Play policy requires this to be the app's core purpose.
- Provide clear in-app explanation before launching the system settings intent (`Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`) so the user understands why.
- Check `PowerManager.isIgnoringBatteryOptimizations(packageName)` before redirecting the user — do not send them to settings if already exempted.

**Don't:**
- Do not request an exemption to work around poor scheduling architecture. Rewrite the sync logic with WorkManager first.
- Do not call `ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` on first launch or in an onboarding flow; explain the need in context.
- Do not use this permission in general-purpose productivity, social, or news apps — Play review will reject or flag the app.

### Designing work to survive maintenance windows

```kotlin
// WorkManager periodic sync that respects power constraints
class DataSyncWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        // Network is available during a maintenance window; do all work here.
        return try {
            val repository = ServiceLocator.provideRepository(applicationContext)
            // Batch everything: fetch + write + notify
            val data = repository.fetchPendingUpdates()
            repository.persistLocally(data)
            notifyUiIfActive()
            Result.success()
        } catch (e: IOException) {
            // Retry — WorkManager will wait for the next window
            if (runAttemptCount < 3) Result.retry() else Result.failure()
        }
    }
}

// Schedule: requires network, prefers charging, 1-hour flex
fun scheduleDailySync(context: Context) {
    val constraints = Constraints.Builder()
        .setRequiredNetworkType(NetworkType.CONNECTED)
        .setRequiresBatteryNotLow(true)
        .build()

    val request = PeriodicWorkRequestBuilder<DataSyncWorker>(
        repeatInterval = 6, repeatIntervalTimeUnit = TimeUnit.HOURS,
        flexTimeInterval = 60, flexTimeIntervalUnit = TimeUnit.MINUTES
    )
        .setConstraints(constraints)
        .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 15, TimeUnit.MINUTES)
        .build()

    WorkManager.getInstance(context).enqueueUniquePeriodicWork(
        "data_sync",
        ExistingPeriodicWorkPolicy.KEEP,
        request
    )
}
```

### Foreground services and exact alarms (API 31+)

Android 12 introduced `SCHEDULE_EXACT_ALARM` and Android 13 added `USE_EXACT_ALARM`. Only request these for user-visible scheduling features (alarms, reminders, calendar). Starting with Android 14, long-running foreground services must declare a `foregroundServiceType`; omitting it causes a crash.

**Do:**
- Check `AlarmManager.canScheduleExactAlarms()` at runtime before calling `setExact*`. If false, direct the user to the special exact-alarm settings screen.
- Declare `<uses-permission android:name="android.permission.USE_EXACT_ALARM" />` only for calendar/reminder/alarm-clock apps; all other apps must use `SCHEDULE_EXACT_ALARM` and handle the revocable grant.

**Don't:**
- Do not silently swallow the `SecurityException` thrown when exact alarms are not permitted; fall back to an inexact alarm or WorkManager.

## Platform notes

**Large-screen / foldables:** App Standby bucket behaviour is identical to phones. However, large-screen devices are more likely to be plugged in (desk use, docks), keeping Doze inactive. Do not use this as an excuse to skip proper scheduling — users also use these devices away from power.

**Android 6–8:** Doze applies only while stationary (accelerometer-gated). From Android 8 onward, Doze "light" mode activates even while the device is moving but screen-off, imposing network restrictions sooner.

**Android 14 (API 34):** Background `BroadcastReceiver` registrations for a growing list of implicit actions are disallowed; move to `JobScheduler` or WorkManager triggers.

**Android 15+ (API 35):** The RESTRICTED bucket gains stricter enforcement; apps with no user interaction for 30+ days may be placed there automatically and have background jobs limited to once per day.

## Pitfalls

- **Assuming FCM is unrestricted:** FCM normal-priority messages are also deferred by Doze. Only high-priority messages bypass it — and Google Play monitoring may demote your app if it over-uses high-priority pushes for non-urgent content.
- **Ignoring `setRequiresBatteryNotLow`:** Jobs without this constraint run during maintenance windows even if battery is critically low, draining the device faster.
- **Calling `setExactAndAllowWhileIdle` for recurring work:** Each call counts against a per-app per-day quota. Exceeding the quota silently converts exact alarms to inexact ones.
- **Not testing Doze explicitly:** Unit tests and Robolectric cannot simulate Doze state. Always test on a real device using `adb shell dumpsys deviceidle force-idle`.
- **Requesting `WAKE_LOCK` permission without a foreground service:** Partial wake-locks are released automatically during Doze deep sleep regardless of the lock; code that depends on them will silently do nothing.
- **Forgetting to re-enqueue work after data-clear / app reinstall:** `WorkManager` handles reboots automatically but not force-stops or data clears. Enqueue on first-launch and in any `BOOT_COMPLETED` receiver.

## References

- **Documentation:** [Optimize for Doze and App Standby](https://developer.android.com/training/monitoring-device-state/doze-standby)
- **Documentation:** [Power management overview](https://developer.android.com/topic/performance/power)
- **API reference:** [WorkManager](https://developer.android.com/reference/androidx/work/WorkManager)

## See also

Use alongside **background-tasks** for a full picture of WorkManager, `JobScheduler`, and foreground-service lifecycle. The **network-framework** skill covers how to structure network calls that tolerate deferred execution gracefully. For apps that surface data on the home screen, see **controls-widgets** — widgets keep the app in a higher App Standby bucket.
