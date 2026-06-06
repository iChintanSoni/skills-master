---
name: telecom-calls
description: Building a calling app with Jetpack Telecom (CallsManager) and self-managed ConnectionService — covers call registration, audio routing, call state management, and system dialer integration. Use when implementing VoIP, SIP, or any in-app calling feature that must coexist correctly with the Android telecom stack.
globs:
  - "**/*.kt"
tags: [telecom, voip, calls, audio-routing, connectionservice]
x-skills-master:
  domain: android
  class: code
  category: platform-services
  platforms: ["android", "large-screen"]
  requires: { "android": "16", "kotlin": "2.2" }
  pairs_with: []
  sources:
    - https://developer.android.com/develop/connectivity/telecom
    - https://developer.android.com/guide/topics/connectivity/telecom/selfManaged
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Apply this skill when your app needs to place or receive phone-like calls — VoIP, SIP, or any real-time communication feature — and must integrate correctly with the Android telecom system rather than running as an isolated media session. Specifically use it when:

- Building a calling SDK or feature that must respect and not interrupt ongoing calls from other apps (GSM, other VoIP apps).
- You need system UI affordances such as the in-call notification, Bluetooth/wired/speaker audio routing, or the lock-screen answer UI.
- You want your calls to appear in the device's recent calls log via the managed path, or to stay fully private via the self-managed path.
- You are migrating from the legacy `android.telecom.ConnectionService` approach to the Jetpack Telecom `CallsManager` API introduced in `androidx.core:core-telecom`.

## Core guidance

### Jetpack Telecom vs raw ConnectionService

- **Prefer `androidx.core:core-telecom` (`CallsManager`)** for all new calling features. It wraps `ConnectionService` and the newer `android.telecom.CallControl` / `TransactionalCall` APIs behind a single Kotlin-coroutine-friendly interface and backports call control down to API 23.
- Use the raw `ConnectionService` only when you have a hard requirement for a managed call that is visible in the system dialer's recents list and `CallsManager` does not yet satisfy that requirement.
- Never mix direct `TelecomManager.addNewOutgoingCall` invocations with `CallsManager` registrations for the same call — you will end up with duplicate system entries.

### Registering your app with the telecom stack

- Call `CallsManager.registerAppWithTelecom(capabilities)` once, typically in `Application.onCreate`. The capabilities flag (`CAPABILITY_SUPPORTS_CALL_STREAMING`, `CAPABILITY_SUPPORTS_VIDEO_CALLING`) must match what the call later advertises.
- Declare `<uses-permission android:name="android.permission.MANAGE_OWN_CALLS" />` in the manifest for self-managed flows. Managed calls additionally require `READ_PHONE_STATE` and `CALL_PHONE`.
- Declare a `<service>` entry pointing at your `CallsManager`-backed service with `android:permission="android.permission.BIND_TELECOM_CONNECTION_SERVICE"` and the matching intent filter so the system can bind it.

### Adding and controlling calls

- Call `CallsManager.addCall(callAttributes, onAnswer, onDisconnect, onSetActive, onSetInactive)` from a coroutine. Each lambda receives a `CallControlScope` — use it to update state rather than holding a reference to any `Connection` object.
- `CallAttributes` requires a display name (`Uri`), direction (`DIRECTION_INCOMING` / `DIRECTION_OUTGOING`), and call type (`CALL_TYPE_AUDIO_CALL` / `CALL_TYPE_VIDEO_CALL`). Match these to what you advertised during registration.
- Transition state via `CallControlScope.setActive()`, `setInactive()` (holds), and `disconnect(DisconnectCause)`. Each returns `Boolean` — check it; the system can reject transitions if another call is in a conflicting state.
- Surface `currentCallEndpoint` (a `Flow<CallEndpoint>`) to let users choose audio routes; call `requestEndpointChange(endpoint)` in response to user action rather than routing audio yourself.

### Audio routing

- Enumerate available endpoints with `availableEndpoints: Flow<List<CallEndpoint>>` inside `CallControlScope`.
- `CallEndpoint.endpointType` is one of `TYPE_EARPIECE`, `TYPE_BLUETOOTH`, `TYPE_WIRED_HEADSET`, `TYPE_SPEAKER`, `TYPE_STREAMING`. Reflect the active type in your UI so the user always knows where audio is going.
- Do NOT manipulate `AudioManager` focus or routing directly while a call is registered with telecom — the system manages audio focus on your behalf and direct manipulation will produce audio glitches or dropped sessions.

### Self-managed calls (private, no system dialer integration)

- Self-managed calls are appropriate when you want full UI control and calls must not appear in the system's recent calls. Use `CallAttributes.DIRECTION_*` flags exactly the same as managed calls; the distinction is made at registration time via capabilities.
- You are responsible for displaying your own in-call UI, but you MUST still request `MANAGE_OWN_CALLS` and register with `CallsManager` so the system can coordinate audio with GSM and other VoIP apps.
- Handle the `onSetInactive` callback — the system fires it when a higher-priority call (incoming GSM) arrives. Pause media, mute mic, and update your UI. Resuming after the interruption happens through `setActive()` when the GSM call ends.

### Short Kotlin example — outgoing VoIP call via CallsManager

```kotlin
// In your calling service / ViewModel, after registering the app once:
class CallRepository(
    private val callsManager: CallsManager,
    private val scope: CoroutineScope,
) {
    fun startOutgoingCall(displayName: String, handle: Uri) {
        val attrs = CallAttributes(
            displayName = displayName,
            address = handle,
            direction = CallAttributes.DIRECTION_OUTGOING,
            callType = CallAttributes.CALL_TYPE_AUDIO_CALL,
            callCapabilities = CallAttributes.SUPPORTS_SET_INACTIVE,
        )

        scope.launch {
            callsManager.addCall(
                callAttributes = attrs,
                onAnswer = { /* not triggered for outgoing */ },
                onDisconnect = { cause -> handleDisconnect(cause) },
                onSetActive = { updateCallState(CallState.ACTIVE) },
                onSetInactive = { updateCallState(CallState.HOLDING) },
            ) {
                // CallControlScope — call is now registered
                setActive()

                availableEndpoints.collect { endpoints ->
                    _audioEndpoints.value = endpoints
                }
            }
        }
    }

    fun routeToSpeaker(endpoints: List<CallEndpoint>) {
        val speaker = endpoints.firstOrNull {
            it.endpointType == CallEndpoint.TYPE_SPEAKER
        } ?: return
        scope.launch { currentCallScope?.requestEndpointChange(speaker) }
    }
}
```

### Incoming calls

- For push-notification-driven VoIP, call `CallsManager.addCall` with `DIRECTION_INCOMING` from a `FirebaseMessagingService` or `CallStyle` notification action before displaying any UI.
- Provide an `onAnswer` lambda that transitions the call to `setActive()` when the user accepts — do NOT assume acceptance until the system calls this lambda.
- Display the incoming call UI via a high-priority `Notification` using `NotificationCompat.CallStyle.forIncomingCall(person, declineIntent, answerIntent)`. This is required on API 31+ to show the call chip in the status bar.

## Platform notes

**Large screens and foldables** — calls registered with `CallsManager` automatically participate in the system's picture-in-picture and call continuation UX on Android 15+. Provide a `PendingIntent` pointing to your in-call `Activity` in `CallAttributes` so the system can return the user to your UI from multitasking surfaces.

**API level nuances** — `CallsManager` (Jetpack Telecom) targets API 26+ internally but the library backfills behaviour to API 23 via compatibility shims. Below API 26, the `TransactionalCall` path is unavailable; the library falls back to the legacy `ConnectionService` binding path automatically. Test both paths if your `minSdk` is below 26.

**Bluetooth and Wired Headsets** — audio routing to Bluetooth SCO is managed by telecom, not by `AudioManager.startBluetoothSco()`. Calling `startBluetoothSco()` while a call is registered will conflict. Stick to `requestEndpointChange`.

**Wear OS / Automotive** — `core-telecom` is not supported on Wear OS or Android Automotive. On Automotive, use the platform's `CarAudioManager` and `ConnectionService` directly per the Car App Library guidance.

## Pitfalls

- **Skipping `registerAppWithTelecom`** — adding a call without prior registration causes a silent failure or an `IllegalStateException` at runtime. Register eagerly in `Application.onCreate`.
- **Ignoring the return value of `setActive()` / `disconnect()`** — these suspend functions return `Boolean`. A `false` means the system rejected the transition (e.g., another call holds focus). Handle this by reflecting the unchanged state back in your UI rather than assuming success.
- **Direct `AudioManager` manipulation** — once a call is registered, audio focus belongs to telecom. Calling `requestAudioFocus`, `setMode(MODE_IN_CALL)`, or routing APIs directly breaks Bluetooth SCO handshake and can silence the remote party.
- **Holding a strong reference to `CallControlScope`** — the scope is only valid for the lifetime of the call's `addCall` block. Storing it in a field and calling it after the block exits throws. Use a `MutableStateFlow` of a nullable scope reference and guard every access.
- **Not handling `onSetInactive`** — the OS interrupts self-managed calls during GSM calls, alarm focus events, and incoming higher-priority calls. Failing to pause your media pipeline in `onSetInactive` results in two audio streams mixing audibly.
- **`CallStyle` notification omission on API 31+** — without a `CallStyle` notification, the system does not display the persistent call chip and your incoming call may not appear on lock screen. Always pair `CallsManager` with a matching `CallStyle` notification.
- **Missing manifest `<service>` declaration** — telecom requires the system to be able to bind your service even when the process is stopped (for incoming calls). An absent or misconfigured `<service>` element causes binding failures that are only visible in logcat as telecom system-level errors, not exceptions in your app.

## References

- **Official Guide:** [Telecom overview](https://developer.android.com/develop/connectivity/telecom)
- **Official Guide:** [Self-managed calls with ConnectionService](https://developer.android.com/guide/topics/connectivity/telecom/selfManaged)

## See also

For notification construction required alongside calls, see `user-notifications`. For audio focus and media session patterns outside of telecom-registered calls, see `avfoundation-playback` as a conceptual parallel from the Apple domain. For Compose UI patterns to build an in-call screen, see `compose-foundation` for custom gesture and focus handling, and `compose-side-effects` for managing coroutine lifecycles that drive call state.
