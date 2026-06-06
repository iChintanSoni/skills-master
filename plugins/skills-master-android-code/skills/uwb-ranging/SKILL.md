---
name: uwb-ranging
description: Covers the Jetpack UWB API for centimeter-accurate ranging and direction-finding between Android devices — controller/controlee roles, RangingParameters, RangingResult, session lifecycle, permissions, and hardware availability. Use when building features like spatial device-finding, proximity-gated access, or precise peer-to-peer handoff on UWB-capable hardware.
---

## When to use

Use this skill when you need sub-centimeter-to-centimeter distance and angle measurements between two Android devices (or between a device and a UWB tag/accessory). Typical scenarios include:

- **Device finding** — guide a user toward a lost item or another phone using distance + azimuth + elevation.
- **Proximity-gated features** — unlock a car, open a door, or reveal content only when a trusted device is within a precise range.
- **Spatial handoff** — trigger AirDrop-style content sharing when devices face each other closely.
- **Indoor positioning** — supplement dead-reckoning navigation with anchor-based ranging.

UWB is not a replacement for Bluetooth LE or Wi-Fi; it adds precision. Always design for graceful degradation when UWB hardware is absent.

## Core guidance

### Dependency and permission setup

Add the Jetpack UWB artifact (part of AndroidX Connectivity):

```
// build.gradle.kts (app module)
implementation("androidx.core.uwb:uwb:1.0.0-alpha09")
```

Declare in `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.UWB_RANGING" />
<!-- optional: tells the store the app requires UWB hardware -->
<uses-feature android:name="android.hardware.uwb" android:required="false" />
```

Request `UWB_RANGING` at runtime (it is a normal permission on Android 12+ devices; no user dialog appears, but it must be declared and the device must have compatible hardware).

### Check hardware availability

Always check availability before constructing a session — the API returns `false` on devices that ship without a UWB chip:

```kotlin
val uwbManager = UwbManager.createInstance(context)
val isAvailable = uwbManager.isAvailable() // suspend fun — call from a coroutine
```

Show a graceful fallback (Bluetooth-only distance, or a plain "Not supported" message) when `isAvailable` returns `false`.

### Controller vs. controlee

UWB sessions are asymmetric:

| Role | Responsibility |
|---|---|
| **Controller** | Initiates the session; sets the UWB channel, preamble code, and session ID; hands the `localAddress` to the controlee via an OOB channel. |
| **Controlee** | Joins using the controller-provided parameters; receives ranging results. |

Choose the role that fits your product model. In a phone-to-phone flow, either device can be the controller; in a phone-to-accessory flow, the phone is typically the controller.

### Session lifecycle with Flow

The Jetpack API exposes ranging results as a `Flow<RangingResult>`. Collect it inside a `CoroutineScope` tied to your component's lifecycle to avoid leaks:

```kotlin
@OptIn(ExperimentalUwbApi::class)
class UwbRangingRepository(
    private val context: Context,
    private val oobChannel: OobChannel, // your Bluetooth or Wi-Fi Direct OOB transport
) {

    private val uwbManager = UwbManager.createInstance(context)

    /** Emits [RangingResult] objects until the scope is cancelled. */
    fun rangingResults(): Flow<RangingResult> = flow {
        // 1. Obtain a controller session handle (suspends briefly)
        val controllerSession = uwbManager.controllerSessionScope()

        // 2. Share our local UWB address with the remote device over OOB
        oobChannel.send(controllerSession.localAddress)

        // 3. Wait for the controlee's address over OOB
        val controleeAddress = oobChannel.receive()

        // 4. Build ranging parameters
        val params = RangingParameters(
            uwbConfigType = RangingParameters.UWB_CONFIG_ID_1,      // DS-TWR
            sessionId = 12_345,                                       // shared secret agreed via OOB
            sessionKeyInfo = null,                                    // STS key; null = static STS
            complexChannel = controllerSession.uwbComplexChannel,
            peerDevices = listOf(UwbDevice(controleeAddress)),
            updateRateType = RangingParameters.RANGING_UPDATE_RATE_FREQUENT,
        )

        // 5. Start ranging — collect the flow in the caller's scope
        controllerSession
            .prepareSession(params)
            .collect { result -> emit(result) }
    }
}
```

On the **controlee** side replace `controllerSession` with `uwbManager.controleeSessionScope()` and build `RangingParameters` from the addresses/channel received from the controller over OOB.

### Interpreting RangingResult

```kotlin
when (val r = result) {
    is RangingResult.RangingResultPosition -> {
        val distanceM = r.position.distance?.value          // meters, Float?
        val azimuthDeg = r.position.azimuth?.value          // degrees, Float?
        val elevationDeg = r.position.elevation?.value      // degrees, Float?
        // Update UI — distance is always present; angle only on AoA-capable hardware
    }
    is RangingResult.RangingResultPeerDisconnected -> {
        // The remote peer dropped out; surface an error state
    }
}
```

Distance is present in every successful result. Azimuth and elevation (Angle-of-Arrival) are only populated when both devices support AoA; treat them as nullable and degrade gracefully.

### OOB channel design

UWB has no built-in device discovery — a separate out-of-band (OOB) channel must exchange the controller's `localAddress`, the session ID, and the `uwbComplexChannel` before the UWB session can start. Common OOB transports:

- **Bluetooth GATT** — use a custom characteristic; reliable and widely available.
- **Wi-Fi Aware** (NAN) — higher throughput, useful when the OOB payload is large.
- **NFC** — tap-to-pair pattern; zero-setup UX but range is limited to the tap moment.

Keep the OOB exchange as brief as possible; every extra round trip delays the first ranging result.

### Lifecycle and cancellation

Wrap collection in `viewModelScope` or a `LifecycleScope` so that the flow is automatically cancelled when the user navigates away:

```kotlin
viewModelScope.launch {
    repository.rangingResults()
        .catch { e -> _uiState.update { it.copy(error = e.message) } }
        .collect { result -> _uiState.update { it.copy(result = result) } }
}
```

Never hold a `RangingSession` reference across `onStop` without a deliberate background-service strategy; the chip consumes measurable battery during active ranging.

## Platform notes

- **Minimum hardware** — UWB is available on Pixel 6 Pro and later, Samsung Galaxy S21 Ultra and later, and selected other flagships. The `uses-feature` tag with `required="false"` keeps your app installable on all devices.
- **Android API level** — `UwbManager` was introduced in Android 12 (API 31). The Jetpack library adds a compatibility layer but the chip must exist; set `minSdk` appropriately or guard with `Build.VERSION.SDK_INT >= 31`.
- **Large-screen / foldables** — UWB antenna placement can vary across form factors; ranging accuracy may differ when the device is folded. Test on both folded and unfolded states if AoA is part of your UX.
- **Foreground requirement** — On most devices UWB ranging is suspended when the app is fully backgrounded (similar to Bluetooth scanning). Use a foreground service with type `connectedDevice` to sustain ranging in the background.
- **Thread safety** — The Jetpack `Flow`-based API is safe to collect on any dispatcher; avoid blocking the main thread with the older imperative callbacks.

## Pitfalls

- **Skipping OOB** — The most common mistake is assuming UWB can self-discover peers. It cannot; the controller address and session parameters must always be exchanged over a separate channel before ranging begins.
- **Ignoring `isAvailable`** — Crashing or hanging on UWB-less devices is the second-most-common bug. Always guard session construction with an availability check.
- **Holding the session open indefinitely** — Active ranging drains battery. Cancel the coroutine scope (and therefore the flow) as soon as the ranging result is no longer needed.
- **Treating AoA as guaranteed** — Not all UWB chips implement Angle-of-Arrival. Always null-check `azimuth` and `elevation`; build your core feature around `distance` alone.
- **Reusing session IDs** — A `sessionId` must be unique per concurrent session. If you restart a session after failure, generate a fresh ID (or coordinate a new one over OOB) rather than reusing the previous value, which can leave stale hardware state.
- **Wrong ranging config type** — `UWB_CONFIG_ID_1` (DS-TWR) suits phone-to-phone; `UWB_CONFIG_ID_3` adds AoA support on compatible hardware. Pick the correct config and test on target hardware, not just the emulator (which does not emulate UWB).
- **Leaking the session scope** — Forgetting to cancel the `UwbControllerSessionScope` after collection ends can leave the UWB subsystem in an active state. The `flow { }` builder tied to a `CoroutineScope` handles this automatically.

## References

- **Developer guide — UWB overview:** [Ultra-wideband (UWB)](https://developer.android.com/develop/connectivity/uwb)
- **Developer guide — UWB connectivity details:** [UWB connectivity guide](https://developer.android.com/guide/topics/connectivity/uwb)
- **Jetpack UWB artifact:** [androidx.core.uwb](https://developer.android.com/jetpack/androidx/releases/core-uwb)

## See also

The `core-bluetooth` skill covers Bluetooth GATT, which is the most common OOB channel for UWB session setup. The `network-framework` skill covers Wi-Fi Aware (NAN) for higher-bandwidth OOB scenarios. The `background-tasks` skill explains foreground service types needed to sustain ranging while the app is not in the foreground.
