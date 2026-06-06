---
name: haptics-vibration
description: Covers Android haptic feedback via VibratorManager and VibrationEffect — Use when adding tactile reinforcement to UI interactions, custom vibration patterns, or Compose haptic feedback in Android apps.
globs:
  - "**/*.kt"
tags: [haptics, vibration, ux, platform-services, compose]
x-skills-master:
  domain: android
  class: code
  category: platform-services
  platforms: ["android", "large-screen"]
  requires: {android: "16", kotlin: "2.2"}
  pairs_with: [m3-haptics-sound]
  sources:
    - https://developer.android.com/develop/ui/views/haptics
    - https://developer.android.com/develop/ui/views/haptics/custom-haptic-effects
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Apply this skill when you need tactile feedback to reinforce UI state changes — button presses, toggles, long-press confirmation, drag-and-drop milestones, errors, or notifications. Also use it when building custom haptic sequences with `VibrationEffect.Composition`, or when wiring Jetpack Compose's `HapticFeedback` API into gestures and interactions.

## Core guidance

**Setup — always use VibratorManager on API 31+, fall back to Vibrator on older devices.**

- Retrieve `VibratorManager` via `context.getSystemService(VibratorManager::class.java)` (API 31+); for API 26–30 use the deprecated `Vibrator` service directly.
- Call `vibrator.hasVibrator()` before any effect, and `vibrator.areEffectsSupported(...)` / `vibrator.arePrimitivesSupported(...)` before relying on specific effects.
- Declare `<uses-permission android:name="android.permission.VIBRATE" />` in the manifest; it is a normal permission — no runtime grant needed.

**VibrationEffect — prefer predefined constants over raw timing arrays.**

- `VibrationEffect.createPredefined(VibrationEffect.EFFECT_CLICK)` — crisp tap; appropriate for button presses.
- `VibrationEffect.createPredefined(VibrationEffect.EFFECT_TICK)` — lighter, for selection changes or scrolling.
- `VibrationEffect.createPredefined(VibrationEffect.EFFECT_HEAVY_CLICK)` — weighted confirmation or toggle.
- `VibrationEffect.createPredefined(VibrationEffect.EFFECT_DOUBLE_CLICK)` — two-pulse emphasis.
- Use `VibrationEffect.createOneShot(durationMs, amplitude)` for simple single pulses; use `VibrationEffect.EFFECT_STRENGTH_MEDIUM` as amplitude when you do not have a specific value.
- Use `VibrationEffect.createWaveform(timings, amplitudes, repeat)` for looping patterns (alerts); always cancel via `vibrator.cancel()` when the pattern is no longer relevant.

**VibrationEffect.Composition — for nuanced, expressive haptics on supported hardware (API 30+).**

- Build a `VibrationEffect.startComposition()` chain; call `.addPrimitive(primitive, scale, delayMs)` for each step; call `.compose()` to obtain the `VibrationEffect`.
- Scale is `0f–1f`; use `0.5f` for subtle, `1f` for full intensity.
- Always gate the entire composition block behind `vibrator.arePrimitivesSupported(...)` to avoid silent no-ops.

**Jetpack Compose — use HapticFeedback for standard interactions.**

- Obtain `val haptic = LocalHapticFeedback.current` inside a composable.
- Call `haptic.performHapticFeedback(HapticFeedbackType.LongPress)` inside gesture callbacks; `HapticFeedbackType.TextHandleMove` for drag handles.
- For non-standard moments (toggle, error), fall through to the platform `Vibrator`/`VibratorManager` from `LocalContext.current`.

**Respect user preferences — mandatory.**

- Check `Settings.System.getInt(resolver, Settings.System.HAPTIC_FEEDBACK_ENABLED, 1)` before firing custom effects; skip if `0`.
- On wearables and large-screen form factors (foldables, tablets), call `vibrator.hasVibrator()` — many tablets have no vibrator motor.
- Never vibrate during audio playback without a deliberate UX reason; haptics must complement, not compete with, sound.

```kotlin
@Composable
fun HapticButton(onClick: () -> Unit) {
    val context = LocalContext.current
    val haptic = LocalHapticFeedback.current

    fun vibrateConfirm() {
        val vibratorManager = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            context.getSystemService(VibratorManager::class.java)?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Vibrator::class.java)
        } ?: return

        if (!vibratorManager.hasVibrator()) return

        val resolver = context.contentResolver
        val hapticsEnabled = Settings.System.getInt(
            resolver, Settings.System.HAPTIC_FEEDBACK_ENABLED, 1
        )
        if (hapticsEnabled == 0) return

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q &&
            vibratorManager.arePrimitivesSupported(
                VibrationEffect.Composition.PRIMITIVE_CLICK
            ).all { it == Vibrator.VIBRATION_EFFECT_SUPPORT_YES }
        ) {
            val effect = VibrationEffect.startComposition()
                .addPrimitive(VibrationEffect.Composition.PRIMITIVE_CLICK, 0.8f)
                .compose()
            vibratorManager.vibrate(effect)
        } else {
            val effect = VibrationEffect.createPredefined(VibrationEffect.EFFECT_CLICK)
            vibratorManager.vibrate(effect)
        }
    }

    Button(onClick = {
        haptic.performHapticFeedback(HapticFeedbackType.LongPress)
        vibrateConfirm()
        onClick()
    }) {
        Text("Confirm")
    }
}
```

**Amplitude control**

- `VibrationEffect.DEFAULT_AMPLITUDE` defers to system-level amplitude; prefer it over hard-coded `255`.
- Amplitude-capable devices are reported by `vibrator.hasAmplitudeControl()`; without it, any non-zero amplitude behaves as on/off.

**Large-screen and foldable notes**

- On foldables in table-top or book posture, haptic feedback from the hinge vibrator is available through `VibratorManager.getVibratorIds()` — enumerate all vibrators for multi-actuator effects only when the experience specifically calls for it.
- Tablets commonly omit vibrators; always guard with `hasVibrator()`.

## Platform notes

- `VibratorManager` is required for API 31+ multi-vibrator access; the single `Vibrator` service is deprecated at that level.
- `VibrationEffect.Composition` and its primitives (`PRIMITIVE_CLICK`, `PRIMITIVE_TICK`, `PRIMITIVE_THUD`, etc.) were introduced at API 30; composition support varies by OEM — always check `arePrimitivesSupported`.
- Predefined effects (`EFFECT_CLICK` etc.) landed at API 29.
- `createOneShot` and `createWaveform` are available from API 26.
- Automotive targets running Android Auto may route haptics differently; test on real hardware.
- Wear OS exposes haptics through `WearableHapticFeedbackConstants` rather than raw `VibrationEffect`; that surface is out of scope here.

## Pitfalls

- **Calling vibrate without checking `hasVibrator()`** — crashes are avoided but you waste resources; tablets silently skip, giving no feedback when users expect some.
- **Ignoring `HAPTIC_FEEDBACK_ENABLED`** — violates user preference; accessibility users who disable haptics to avoid sensory overload will be affected.
- **Using raw `createWaveform` for simple taps** — predefined constants and compositions produce richer, hardware-tuned sensations; raw waveforms sound mechanical.
- **Forgetting `cancel()` on repeating waveforms** — if the triggering condition resolves (notification dismissed, call ended) and you never cancel, the device vibrates indefinitely.
- **Hard-coding amplitude to `255`** — on devices without amplitude control, this is identical to `1`; on capable devices it is maximum intensity regardless of system volume. Prefer `DEFAULT_AMPLITUDE`.
- **Running haptic calls on the main thread with long durations** — `vibrate()` itself is non-blocking, but wrapping it in slow synchronous `Settings.System` reads on every frame hurts performance; cache the preference and observe `ContentObserver` for changes.
- **Not gating composition primitives** — calling `startComposition().addPrimitive(...).compose()` on a device that lacks support results in a silent no-op; always check `arePrimitivesSupported` and fall back gracefully.

## References

- **Documentation:** [Haptics overview](https://developer.android.com/develop/ui/views/haptics)
- **Documentation:** [Custom haptic effects with VibrationEffect.Composition](https://developer.android.com/develop/ui/views/haptics/custom-haptic-effects)

## See also

Pair this skill with **swiftui-gestures** conventions when porting cross-platform touch interactions, and with **controls-widgets** for widget-level touch handling patterns. For the design rationale behind when and how often to apply haptics, consult the `hig-feedback` and `hig-gestures-design` sibling skills in the design domain.
