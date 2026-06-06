---
name: m3-haptics-sound
description: "Design critique and guidance for haptic and sound feedback in Material 3 Android apps — when tactile and audio signals reinforce interactions, how to match haptic weight to visual events, choosing predefined versus custom effects, maintaining restraint to avoid sensory noise, and respecting system and accessibility preferences. Use when reviewing or designing interaction feedback that involves vibration, touch response, or sound cues, or when auditing whether haptic and audio signals are consistent, proportionate, and accessible."
tags: [m3, design, haptics, sound, feedback, accessibility]
x-skills-master:
  domain: android
  class: design
  category: technologies
  platforms: ["android", "large-screen"]
  pairs_with: [haptics-vibration]
  sources:
    - https://developer.android.com/develop/ui/views/haptics
    - https://developer.android.com/design/ui/mobile
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

- Reviewing interactive components — buttons, toggles, sliders, checkboxes, drag handles, FABs — to decide whether each warrants haptic feedback and at what intensity.
- Auditing a screen or flow for over-vibration: too many haptic events desensitize users and drain battery.
- Deciding whether sound cues (confirmation tones, error chimes, ambient audio) add meaning or create noise.
- Evaluating a design for users who have disabled haptics or sounds in system settings, or who use accessibility features that affect sensory output.
- Matching the weight of a tactile response to the visual and semantic weight of the interaction (tap vs. long press vs. destructive action).
- Considering how haptic and audio feedback differ across phones, foldables, large-screen tablets, and Wear OS.

## Core guidance

- **Use haptics to confirm, not to decorate.** Haptic feedback earns its place when it confirms that an action has registered or that a state boundary has been crossed — a button pressed, a toggle switched, a drag milestone reached. Decorative vibration on hover or passive scroll adds noise without meaning and trains users to ignore all feedback.

- **Match haptic weight to interaction weight.** Material 3 defines a hierarchy of touch moments: a lightweight tap warrants a crisp, brief pulse (equivalent to `EFFECT_CLICK` or `PRIMITIVE_CLICK`); a toggle or selection change calls for a medium confirmation (equivalent to `EFFECT_TICK` or `EFFECT_HEAVY_CLICK`); a destructive or irreversible action warrants a heavier, double-beat or thud to signal consequence. When the visual affordance escalates — from icon button to FAB to destructive dialog confirm — the haptic should escalate proportionally.

- **Align the haptic moment precisely with the visual event.** A haptic that fires 80–200 ms before or after its corresponding visual change feels disconnected. The tactile pulse should coincide with the frame on which the visual state commits — not on gesture down, not on gesture up, unless that is exactly when the action completes. Sloppy timing is often more distracting than no feedback at all.

- **Prefer predefined system effects over custom waveforms for standard interactions.** Android's predefined constants (`EFFECT_CLICK`, `EFFECT_TICK`, `EFFECT_HEAVY_CLICK`, `EFFECT_DOUBLE_CLICK`) are hardware-tuned by each OEM to feel correct on their actuator. Custom `createOneShot` or `createWaveform` patterns can feel mechanical, especially on devices with limited actuator fidelity. Reserve composition primitives (`PRIMITIVE_CLICK`, `PRIMITIVE_TICK`, `PRIMITIVE_THUD`, `PRIMITIVE_SPIN`) for genuinely expressive, unique moments — a game event, a biometric scan completion, or a branded onboarding beat.

- **Design sound as a complement to haptics, not a substitute.** Sound adds reinforcement when the device is unmuted and the context supports it (gaming, playback, notification). Because Android users frequently operate in silent or vibrate mode, every meaningful moment that uses sound must also communicate through visuals or haptics independently. Never design a flow where the only confirmation of a critical action is an audio chime.

- **Pair sensory feedback with a visible state change.** A haptic pulse felt while watching an unchanged screen reads as a bug. Every haptic or audio signal must correspond to a concurrent, perceivable visual transition — a color change, an icon swap, an element appearing or disappearing. This also ensures meaning survives for users who have haptics disabled.

- **Keep the total feedback count low per session.** Each new vibration in a session competes with all the ones before it. A checkout flow that vibrates on every field focus, every validation pass, every scroll stop, and every button tap has taught the user that vibration means nothing. Reserve tactile feedback for the three to five highest-value moments in the flow.

- **Do not stack haptic, sound, and visual simultaneously for routine events.** Triple-channel feedback (vibration + chime + bouncing animation) is appropriate for a meaningful climactic moment — a successful payment, a first-time goal completion. A routine toggle state change needs only one or two channels. More channels do not equal more clarity; they equal more noise.

- **Respect system haptic and sound preferences unconditionally.** Before firing any custom vibration, verify that the system `HAPTIC_FEEDBACK_ENABLED` setting is on. Before playing any UI sound, check that the device is not in silent or Do Not Disturb mode. Users disable these settings deliberately; overriding them is a serious trust violation and an accessibility failure for users with sensory sensitivities.

- **Consider accessibility: haptics as alternative channel.** For users with visual impairments, haptic feedback on TalkBack-activated elements can reinforce successful activation without requiring audio. However, some users with vestibular or sensory processing conditions disable vibration specifically to reduce overstimulation — treat haptics as opt-in ambient enhancement, not a required channel for conveying information.

- **Never make information available exclusively through haptics or sound.** A user in silent mode, a tablet without a vibrator, and a user with Reduce Animations active must all receive the same informational outcome from every interaction. Haptics and sound are progressive enhancements on top of a visual baseline, not the primary communication layer.

## Platform notes

**Compact phones** are the primary haptics target. Most flagship and mid-range Android phones include an amplitude-capable linear resonant actuator (LRA); budget devices may have only simple eccentric rotating mass (ERM) motors that respond to on/off rather than amplitude. Design for the lower bound: a heavy click that becomes an on/off buzz must still feel intentional, not broken.

**Foldables and dual-screen devices** may expose multiple vibrators through `VibratorManager`. Multi-actuator choreography (each half vibrating at a different moment) is an advanced enhancement for flagship experiences. For typical product work, default to the single default vibrator and treat multi-actuator as a progressive enhancement.

**Large-screen tablets** frequently omit vibrators entirely. Any design that treats haptics as a required feedback channel will produce silent, unresponsive-feeling interactions on tablets. Always design the visual-only path as the primary experience.

**Wear OS** uses `WearableHapticFeedbackConstants` rather than raw `VibrationEffect`, and the watch's small LRA produces noticeably different sensation from a phone. Haptic patterns designed for phone feel wrong on wrist. Wear haptics follow a separate design vocabulary; brief, distinct, low-repetition pulses are strongly preferred.

**Android TV and large-screen desktop modes** have no vibration hardware. Sound feedback (focus change tones, confirmation cues) is the available sensory channel beyond visuals, but even that must be restrained and respect system audio settings.

**Accessibility services:** TalkBack and Switch Access can consume or reinterpret haptic events. Test feedback behavior with TalkBack enabled to ensure custom vibrations do not collide with TalkBack's own confirmation pulses.

## Pitfalls

- **Vibrating on every touch event, including drags and scrolls.** Continuous haptic output during gesture tracking is draining, disorienting, and fights the user's natural sense of texture from the gesture itself.

- **Using the same haptic weight for all interactions.** A light text cursor tap and a destructive delete confirmation should not feel identical. Undifferentiated feedback collapses the communicative value of the entire system.

- **Firing custom vibrations that override HAPTIC_FEEDBACK_ENABLED.** This is the most common haptics accessibility violation. Some accessibility profiles, sensory processing accommodations, and user preferences depend on this flag being honored.

- **Timing the haptic to gesture down rather than state commit.** Pressing a toggle on gesture down and then completing or cancelling the gesture on release means the haptic fires before the outcome is known. Time haptics to the commit point.

- **Sound as the only error signal.** An error chime that plays when a form submits incorrectly — with no inline error label, color change, or icon — leaves silent-mode users with no feedback and fails all users if they miss the audio.

- **Forgetting to cancel repeating vibration patterns.** A looping waveform for a loading or alert state must be cancelled the moment that state resolves. Missed cancellations produce indefinitely vibrating devices.

- **Designing expressive custom effects without fallback.** `VibrationEffect.Composition` primitives are unsupported on many devices. A design that is critically dependent on a nuanced `PRIMITIVE_THUD` followed by `PRIMITIVE_SPIN` will silently fall back to nothing on non-capable hardware; the design must work without those primitives.

- **Treating haptics as a brand differentiator on all surfaces.** Bespoke vibration patterns can feel playful and distinctive in the right context, but applying them to every standard interaction (checkbox tap, menu dismiss, bottom-sheet drag) fragments the system's coherent feedback language. Brand-level haptic identity should be reserved for unique moments.

## References

- **Documentation:** [Haptics overview](https://developer.android.com/develop/ui/views/haptics)
- **Material Design for Mobile:** [Android design guidance](https://developer.android.com/design/ui/mobile)
- **Material 3 Guidelines:** [Motion and feedback](https://m3.material.io/foundations/interaction/states/overview)
- **Material 3 Guidelines:** [Accessibility foundations](https://m3.material.io/foundations/overview)

## See also

The `haptics-vibration` code skill in the `platform-services` category covers the implementation side of this design guidance — `VibratorManager`, `VibrationEffect` predefined constants and `Composition` primitives, `HapticFeedback` in Jetpack Compose, amplitude control, and the `HAPTIC_FEEDBACK_ENABLED` preference check. For interaction-state design (the visual events that haptics should reinforce), see the `m3-interaction-states` design skill. For broader sensory accessibility considerations — reducing motion, not relying on color alone, and respecting system preferences — see the `m3-accessibility` design skill. The `m3-motion` design skill covers the animated visual transitions that haptic timing should align with.
