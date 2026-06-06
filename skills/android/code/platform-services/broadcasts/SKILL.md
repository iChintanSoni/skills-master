---
name: broadcasts
description: Covers Android BroadcastReceiver, context-registered vs manifest-declared receivers, implicit broadcast restrictions, exported flags and RECEIVER_EXPORTED/RECEIVER_NOT_EXPORTED, and modern alternatives like Flow for app-internal events. Use when sending or receiving system or custom broadcasts, or replacing legacy broadcast patterns with coroutines and Flow.
globs:
  - "**/*.kt"
tags: [broadcasts, broadcastreceiver, platform-services, background-work]
x-skills-master:
  domain: android
  class: code
  category: platform-services
  platforms: ["android", "large-screen"]
  requires: { "android": "16", "kotlin": "2.2" }
  pairs_with: []
  sources:
    - https://developer.android.com/develop/background-work/background-tasks/broadcasts
    - https://developer.android.com/reference/android/content/BroadcastReceiver
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Use this skill whenever you need to:

- Receive system-wide events such as connectivity changes, boot completion, or battery status.
- Send or receive custom broadcasts across process boundaries with explicit security controls.
- Audit existing manifest-declared receivers for implicit broadcast restrictions (Android 8+).
- Replace app-internal broadcasts with coroutines/Flow to reduce overhead and improve testability.
- Handle `RECEIVER_EXPORTED` / `RECEIVER_NOT_EXPORTED` flags required from Android 14 (API 34) onward for context-registered receivers.

## Core guidance

### Registration approach

- **Prefer context-registered receivers** over manifest-declared ones. They are automatically unregistered when the host component is destroyed, eliminating leaks.
- **Use manifest-declared receivers only** for the small set of implicit broadcasts still permitted (e.g., `BOOT_COMPLETED`, `ACTION_LOCALE_CHANGED`). Android 8.0+ silently drops most other implicit broadcasts to manifest receivers.
- **Always unregister** in the lifecycle callback symmetric to where you registered (`onPause`/`onResume`, `onStart`/`onStop`, or `onDestroy` for non-UI hosts).

### Export flags (API 34+ mandatory)

From Android 14, `registerReceiver()` requires an explicit exported flag. Omitting it causes an `IllegalArgumentException` at runtime.

- `RECEIVER_NOT_EXPORTED` — for app-internal receivers; blocks external senders entirely.
- `RECEIVER_EXPORTED` — for receivers that must accept broadcasts from other apps; combine with permission checks.

For manifest-declared receivers, set `android:exported="false"` unless cross-app delivery is needed.

### Sending broadcasts

- Use `sendBroadcast(intent)` for unsecured delivery and `sendBroadcast(intent, permission)` or `sendOrderedBroadcast` when you need sender or receiver permission enforcement.
- Prefer `LocalBroadcastManager` replacements (it is deprecated) — use a `SharedFlow` or callback instead.
- Set an explicit component or package on the intent when targeting your own app to avoid interception.

### Modern alternatives for in-process events

Any broadcast where sender and receiver are in the same process should be replaced with a `SharedFlow`. This eliminates serialisation overhead, is type-safe, testable with `turbine`, and integrates naturally with coroutine scopes.

```kotlin
// Shared event bus using StateFlow/SharedFlow — no BroadcastReceiver needed
object AppEvents {
    private val _networkAvailable = MutableStateFlow(true)
    val networkAvailable: StateFlow<Boolean> = _networkAvailable.asStateFlow()

    fun postNetworkState(available: Boolean) {
        _networkAvailable.value = available
    }
}

// Context-registered receiver for a real system broadcast (API 34+)
class NetworkMonitor(private val context: Context) {

    private val receiver = object : BroadcastReceiver() {
        override fun onReceive(ctx: Context, intent: Intent) {
            val noConnectivity = intent.getBooleanExtra(
                ConnectivityManager.EXTRA_NO_CONNECTIVITY, false
            )
            AppEvents.postNetworkState(!noConnectivity)
        }
    }

    fun register() {
        val filter = IntentFilter(ConnectivityManager.CONNECTIVITY_ACTION)
        ContextCompat.registerReceiver(
            context,
            receiver,
            filter,
            ContextCompat.RECEIVER_NOT_EXPORTED   // system broadcast — not exported
        )
    }

    fun unregister() = context.unregisterReceiver(receiver)
}
```

### Permissions and security

- Declare a custom permission with `protectionLevel="signature"` to restrict who can send to your exported receiver.
- Always validate `intent.action` inside `onReceive` — malicious apps can send arbitrary extras.
- Never perform long-running work inside `onReceive`; it runs on the main thread with a ~10-second deadline. For deferrable work, enqueue a `WorkManager` job immediately.

### Ordered broadcasts

Use `sendOrderedBroadcast` when receivers must process an event in priority order and may abort delivery. Avoid it for performance-sensitive paths; prefer direct API calls or WorkManager instead.

### goAsync()

When you need slightly more time than the synchronous `onReceive` window (but still bounded), call `goAsync()` to obtain a `PendingResult`, then complete the result on a coroutine and call `pendingResult.finish()`. Do not use this as an excuse for unbounded background work.

## Platform notes

### Large-screen / multi-window

On foldables and tablets, an Activity may be visible but not focused. If you register in `onResume`/`onPause` and the user is in split-screen, the receiver may unexpectedly drop events when the adjacent window takes focus. Register in `onStart`/`onStop` for components that must stay active while visible.

### Android 8.0+ (API 26)

The majority of implicit broadcasts are blocked for manifest receivers. Audit every `<receiver>` in your manifest against the [exemption list](https://developer.android.com/develop/background-work/background-tasks/broadcasts#implicit-explicit-broadcasts). If you cannot use an explicit broadcast, migrate to JobScheduler, WorkManager, or a push notification.

### Android 9+ (API 28)

`NETWORK_STATE_CHANGED_ACTION` is no longer delivered to manifest receivers; use the `ConnectivityManager.NetworkCallback` API instead.

### Android 14+ (API 34)

Context-registered receivers without an explicit export flag throw at runtime. Use `ContextCompat.registerReceiver()` from `androidx.core:core:1.13+` to write backward-compatible code without SDK version guards.

### Android 16 (API 36)

No new broadcast restrictions in this release, but health restrictions from the Android 15 foreground service changes indirectly reduce receiver lifetime in background processes. Confirm your use-case does not rely on a backgrounded process staying alive to receive sticky broadcasts.

## Pitfalls

- **Forgetting to unregister** — leaks the receiver and the enclosing Activity context, causing memory leaks and potential `IntentReceiver not registered` crashes on re-registration.
- **Heavy work in onReceive** — the system ANRs the app if `onReceive` blocks beyond ~10 seconds. Always delegate to WorkManager or a coroutine scope, not `GlobalScope`.
- **Missing export flag on API 34+** — `registerReceiver` throws `IllegalArgumentException`; use `ContextCompat.registerReceiver` for safe backport.
- **Relying on `LocalBroadcastManager`** — it was deprecated in `androidx.localbroadcastmanager:1.1.0`. Replace with `SharedFlow` or callbacks.
- **Sending implicit broadcasts to your own receivers** — always use an explicit intent (set component or package) to avoid leaking events to other apps and to comply with API 26 restrictions.
- **Trusting intent extras without validation** — an external sender can craft any extras. Validate type and range before use, especially in exported receivers.
- **Using sticky broadcasts** — `sendStickyBroadcast` is deprecated and requires `BROADCAST_STICKY` permission. Replace with a `StateFlow` holding the last-known value.

## References

- **Broadcasts overview:** [Android Broadcasts](https://developer.android.com/develop/background-work/background-tasks/broadcasts)
- **Sending broadcasts:** [Sending Broadcasts](https://developer.android.com/reference/android/content/BroadcastReceiver)

## See also

- `background-tasks` — for migrating broadcast-triggered work to WorkManager.
- `network-framework` — covers `ConnectivityManager.NetworkCallback` as a modern replacement for network-state broadcasts.
- `kotlin-coroutines-flow` — SharedFlow and StateFlow patterns for in-process event buses.
- `user-notifications` — push-based alternatives when background broadcast delivery is restricted.
