---
name: game-controller-input
description: Covers game controller support on Android — routing KeyEvent and MotionEvent by InputDevice source, axis and deadzone handling, hot-plug and multiple controllers via InputManager.InputDeviceListener, per-controller rumble through VibratorManager, controller sensors and lights, button glyph conventions across Xbox/Switch/PlayStation styles, switching between touch and controller UI, and the Paddleboat library plus the Play manifest flag. Use when adding or auditing gamepad support in an Android game, including local multiplayer and Play Games large-screen requirements.
license: MIT
---

## When to use

Use this skill when a game must be playable with a physical gamepad: adding controller support to a touch-first title, wiring local multiplayer across several pads, implementing rumble and glyph-correct button prompts, or meeting the Play Games input requirements for large screens and PC. It also covers the touch/controller UI handoff, which is what most controller integrations actually get wrong.

For keyboard, mouse, and stylus on tablets and ChromeOS — a different input surface with different conventions — use `keyboard-mouse-stylus` instead.

## Core guidance

### Declare support so Play can surface it

```xml
<uses-feature android:name="android.hardware.gamepad" android:required="false" />
```

`android:required="false"` is not optional: mark it required and Play filters the game away from every phone without a pad. With the flag declared, the store page gets a Gamepad tag and the game appears in the controller search filter.

The Play Games "Level Up" guidelines go further for games distributed on that platform: the game must be **fully playable** with a controller and with keyboard and mouse on every device where those inputs exist — from first launch through onboarding, gameplay, and settings, with no fallback to touch. A short exemption list exists for mechanics that cannot translate (location/AR, ambient sensors, spatial aiming, rapid multi-touch rhythm); everything else is in scope.

### Route by source, not by device name

Controllers deliver two event types. Buttons arrive as `KeyEvent` through `onKeyDown`/`onKeyUp`; analog sticks, triggers, and many D-pads arrive as `MotionEvent` through `onGenericMotionEvent`. Classify with `event.isFromSource(...)` against `InputDevice.SOURCE_GAMEPAD`, `SOURCE_JOYSTICK`, and `SOURCE_DPAD` — a device advertises several sources at once, so test the one that matches the event you are handling.

- Guard `KeyEvent` handling with `event.repeatCount == 0` unless the action is genuinely a key-repeat.
- Always fall through to `super.onKeyDown(...)` / `super.onGenericMotionEvent(...)` for events you do not consume; the platform's compatibility layers depend on it.
- Never gate behaviour on device name or vendor ID. Layouts vary; sources and keycodes do not.

### The standard mapping

| Control | KeyEvent | MotionEvent axis |
| --- | --- | --- |
| Left stick | `KEYCODE_BUTTON_THUMBL` (click) | `AXIS_X`, `AXIS_Y` |
| Right stick | `KEYCODE_BUTTON_THUMBR` (click) | `AXIS_Z`, `AXIS_RZ` |
| D-pad | `KEYCODE_DPAD_UP`/`DOWN`/`LEFT`/`RIGHT`/`CENTER` | `AXIS_HAT_X`, `AXIS_HAT_Y` |
| Face buttons | `KEYCODE_BUTTON_A`/`B`/`X`/`Y` | — |
| Bumpers | `KEYCODE_BUTTON_L1`/`R1` | — |
| Triggers | `KEYCODE_BUTTON_L2`/`R2` | `AXIS_LTRIGGER`/`AXIS_RTRIGGER` (also reported as `AXIS_BRAKE`/`AXIS_GAS`) |
| Menu | `KEYCODE_BUTTON_START`/`SELECT` | — |

Triggers are the trap: some controllers report them as analog axes, some as buttons, and some as both. Handle both paths and de-duplicate, or a trigger pull fires twice. The same applies to the D-pad — accept hat axes and keycodes.

### Deadzones and sampling

Sticks report noise at rest. Read the device's own flat region rather than inventing a constant:

```kotlin
private fun axis(event: MotionEvent, device: InputDevice, axis: Int, historyPos: Int = -1): Float {
    val range = device.getMotionRange(axis, event.source) ?: return 0f
    val raw = if (historyPos < 0) event.getAxisValue(axis)
              else event.getHistoricalAxisValue(axis, historyPos)
    return if (abs(raw) > range.flat) raw else 0f
}

override fun onGenericMotionEvent(event: MotionEvent): Boolean {
    if (!event.isFromSource(InputDevice.SOURCE_JOYSTICK) ||
        event.action != MotionEvent.ACTION_MOVE) return super.onGenericMotionEvent(event)
    val device = event.device ?: return false
    // Batched samples arrive oldest-first; replay them or fast stick motion looks stepped.
    for (i in 0 until event.historySize) applyStick(axis(event, device, MotionEvent.AXIS_X, i))
    applyStick(axis(event, device, MotionEvent.AXIS_X))
    return true
}
```

### Hot-plug and multiple controllers

Register an `InputManager.InputDeviceListener` and react to `onInputDeviceAdded`, `onInputDeviceChanged`, and `onInputDeviceRemoved`; enumerate what is already attached with `InputManager.getInputDeviceIds()`. Never poll.

Bind players to input with `event.deviceId` — a `SparseArray<Player>` keyed by device id is the idiomatic shape. Device ids are session-scoped and change across a disconnect/reconnect cycle; for identity that survives reconnection (seat assignment, per-pad settings), key on `InputDevice.getDescriptor()`, which is a stable string for the same physical device.

When a pad disappears mid-play, pause and show a reconnect prompt rather than silently dropping that player.

### Rumble, sensors, and lights

Modern controllers expose multiple motors, so go through `InputDevice.getVibratorManager()` (API 31) rather than the single-motor `InputDevice.getVibrator()`. Enumerate `vibratorIds`, fetch each with `getVibrator(id)`, and drive them independently with `VibrationEffect.createOneShot(durationMs, amplitude)` so a left/right rumble split works. Requires the `VIBRATE` permission. Cancel explicitly on pause — a motor left running is a support ticket.

`InputDevice.getSensorManager()` (API 29) exposes an integrated IMU where present; request `Sensor.TYPE_ACCELEROMETER` and `Sensor.TYPE_GYROSCOPE` at `SensorManager.SENSOR_DELAY_GAME` for gyro aiming. `InputDevice.getLightsManager()` (API 33) drives a lightbar or player LED: open a session with `openSession()` and submit a `LightsRequest` built from `LightState` objects; this needs the `LIGHTS` permission. All three managers are nullable — every controller lacks something.

### Glyphs and button labels

Three controller styles dominate, and each labels the same physical buttons differently: Xbox-style (LT/RT), Switch-style (ZL/ZR, with the A/B and X/Y label positions swapped relative to Xbox), and PlayStation-style (shape glyphs). Positions are stable even when labels are not — `KEYCODE_BUTTON_A` is always the southmost face button. Detect the style, swap the prompt glyph set, and keep the binding: a player pressing the southmost button expects "confirm" regardless of what the cap says. Ship a remapping screen for anything beyond the defaults, and render prompts from the current binding rather than from hardcoded art.

### Touch and controller in the same session

Track the *last used* input and adapt the HUD to it — hide virtual joysticks and touch buttons the moment a controller event arrives, restore them on the next touch. Do not force a mode choice, do not require a restart, and do not block mixed input: a player holding a pad may still tap the screen. Menus need a focus model with a visible focus ring so D-pad navigation works, since touch UIs typically have none.

### Paddleboat for C/C++ games

Native games can skip the JNI round trip with the Game Controller library (Paddleboat), `androidx.games:games-controller`, linked as `games-controller::paddleboat_static` via `find_package(games-controller REQUIRED CONFIG)`. `Paddleboat_init()` starts it; `Paddleboat_getControllerData()` returns already-normalized state against its bundled device database, and it also surfaces connection callbacks, layout/label style for glyph selection, rumble, lights, motion axes, battery, and mouse input. Documented requirements are Android 4.4 (API 19) and NDK 21 or newer.

## Platform notes

- **Baseline reach:** source constants and the standard keycodes/axes go back to API 12; `InputManager.getInputDeviceIds()`, `InputManager.InputDeviceListener`, and `InputDevice.getDescriptor()` to API 16. The advanced surface is newer — `getSensorManager()` API 29, `getVibratorManager()` API 31, `getLightsManager()` API 33 — so feature-detect rather than gating the whole integration on one level.
- **GameActivity:** the default motion event filter admits touchscreen events only. Call `android_app_set_motion_event_filter(app, nullptr)` (and the key filter) or no controller event reaches native code at all.
- **Play Games on PC** runs in input compatibility mode, converting left-click to touch, and expects keyboard and mouse as first-class inputs; controller behaviour can differ from a physical Android device, so test there separately.
- **Android TV** ships controller-first: the game must be fully navigable from a D-pad, and the system Back/Home semantics differ from handset.
- **Android 17 (API 37)** ignores orientation and resizability locks on `sw >= 600dp` displays once you target 37, so controller-driven layouts must tolerate free window resizing on tablets and desktop-class windows.

## Pitfalls

- **`android:required="true"` on the gamepad feature.** Filters the game off every device without a controller. It must be `false`.
- **Double-firing triggers.** Handling both `AXIS_LTRIGGER` and `KEYCODE_BUTTON_L2` without de-duplication fires the action twice on controllers that send both.
- **Hardcoded deadzones.** A fixed 0.15 threshold feels dead on one pad and drifty on another; use `InputDevice.MotionRange.getFlat()`.
- **Ignoring batched history.** Reading only the final sample of an `ACTION_MOVE` makes fast stick movement look stepped; replay `historySize` samples first.
- **Keying players on device id across reconnects.** Ids are reassigned; use `getDescriptor()` for persistent seat assignment.
- **Assuming a single vibrator.** `getVibrator()` collapses a dual-motor pad to one channel; enumerate `VibratorManager.getVibratorIds()`.
- **Branding prompts by vendor ID.** Detect layout style and let position drive semantics; vendor sniffing breaks on every new pad.
- **Leaving virtual touch controls visible during controller play.** They occlude the game and signal that controller support is bolted on.
- **Menus without a focus model.** A touch-only UI is unreachable from a D-pad, which fails the "fully playable with a controller" requirement outright.
- **Not returning `super` for unhandled events.** Breaks system compatibility layers and swallows Back on some devices.

## References

- **Android Developers:** [Support game controllers](https://developer.android.com/games/sdk/game-controller/overview)
- **Android Developers:** [Handle controller actions](https://developer.android.com/games/sdk/game-controller/controller-input)
- **Android Developers:** [Advanced controller features](https://developer.android.com/games/sdk/game-controller/controller-features)
- **Android Developers:** [Support multiple game controllers](https://developer.android.com/games/sdk/game-controller/multiple-controllers)
- **Android Developers:** [Play Store visibility for controller games](https://developer.android.com/games/sdk/game-controller/visibility)

## See also

`agdk-game-activity` is the paired skill for native games: the same events arrive through GameActivity's input buffers once the motion event filter is cleared, and Paddleboat sits on that runtime. For hardware input on tablets and ChromeOS — physical keyboards, mice, and styluses — see `keyboard-mouse-stylus`. Input latency complaints that survive a correct integration usually turn out to be frame pacing or thermal throttling; `adpf-thermal-performance` covers that side.
