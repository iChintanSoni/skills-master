---
name: hig-action-button
description: Design-critique guidance for the Apple Human Interface Guidelines Action button and Camera Control on iPhone, covering which app actions are appropriate to assign, making each press fast and unambiguous, primary versus secondary actions, light-press and full-press plus swipe behavior on Camera Control, and integrating through App Intents, Controls, and the locked-camera capture experience. Use when reviewing or specifying how an app hooks into the Action button or Camera Control, judging whether an assigned action is suitable, fast, and recoverable, or critiquing whether the hardware button is treated as a shortcut rather than the only path to a feature. Produces design recommendations and critique, not code.
---

# HIG Action button and Camera Control

The Action button and Camera Control are hardware controls on supported iPhone models that give people one fast, eyes-free way to reach a favorite feature. Action-button critique judges whether the action an app offers is worth a dedicated press, whether it fires instantly and predictably, and whether the same feature stays fully reachable for everyone who never assigns the button. Camera Control adds press depth and a swipe surface, so its critique also weighs whether light press, full press, and slide gestures map to actions people can perform confidently without looking.

## When to use

- Reviewing or specifying how an app exposes an action through the Action button, including the label and any subsequent (secondary) press.
- Judging whether a candidate action is appropriate: frequent, valuable, and safe to trigger from a hardware button people often press without looking.
- Critiquing Camera Control behavior: light press, full press (shutter), and swipe-to-adjust mappings, and the locked-camera entry path.
- Evaluating whether the button is a redundant shortcut rather than the sole route to a feature, and whether configuration is discoverable in Settings.

## Core guidance

- Assign actions that are genuinely frequent and valuable enough to earn a dedicated hardware press, and prefer ones that are unambiguous and safe to fire blind; reserve destructive or hard-to-reverse actions for on-screen confirmation, never a single Action-button press.
- Make every press fast and predictable: the result should begin immediately with no setup, modal choice, or ambiguity, since people press eyes-free and expect the same outcome every time. If you offer a secondary press, make it flow logically from the first and read sensibly in the current context.
- Write a short, verb-first action label in title case, present tense, with no articles or prepositions, so the system can describe your action clearly when people pick it.
- Let the system present and configure your action. Surface it through App Intents and an App Shortcut (or a Control) so it appears in Settings where people choose and change the button's function; don't build a bespoke onboarding flow that fights the system picker.
- Treat the button as a shortcut, never the only path: the same feature must remain fully reachable in the app's UI for people who assign the button to something else, who use a non-supporting device, or who rely on assistive technology.
- For Camera Control, map press depth to clear, distinct stages: a light press to surface camera adjustments, a full press to capture, and a swipe to move through a single adjustment (zoom, exposure) at a time. Keep the slider's effect continuous and reversible so a stray swipe is never costly.
- Provide a focused, launch-fast camera experience for Camera Control, including from the Lock Screen via the locked-capture path; defer permission prompts, account setup, and advanced editing to the full app rather than blocking the first shot.
- Don't overload one press with multiple meanings or hidden modes, and don't repurpose the control for actions unrelated to its intent (capture for Camera Control, a single favorite action for the Action button).

## Platform notes

- iPhone: The Action button exists only on supported models and is shared system-wide, so an app competes with every other use (silent mode, flashlight, Shortcuts) and can offer, not claim, an action. Camera Control is specific to iPhone 16 and later; its press-and-swipe surface and Lock Screen launch are unavailable elsewhere, so the underlying feature must work without them. Both controls report through the system's capture-event and App Intents pathways, and people manage assignments in Settings rather than inside any single app.

## Pitfalls

- Assigning a rare, context-dependent, or destructive action to a control people press without looking.
- Inserting a chooser, sign-in, or loading step so the press doesn't act instantly and predictably.
- Making the Action button or Camera Control the only way to reach a feature, stranding users on other devices or with assistive tech.
- Vague or noun-heavy labels that the system can't render into a clear, scannable choice in Settings.
- Building custom setup UI instead of exposing the action through App Intents so the system picker can configure it.
- Treating a Camera Control swipe as a discrete commit, or jamming several adjustments onto one swipe so the gesture feels unpredictable.
- Blocking the first capture behind permission prompts or account setup instead of deferring them to the full app.

## References

- **Human Interface Guidelines:** [Action button](https://developer.apple.com/design/human-interface-guidelines/action-button)
- **Human Interface Guidelines:** [Camera Control](https://developer.apple.com/design/human-interface-guidelines/camera-control)
- **Human Interface Guidelines:** [Controls](https://developer.apple.com/design/human-interface-guidelines/controls)
- **WWDC:** [Enhancing your camera experience with capture controls (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/253/)
- **WWDC:** [Bring your app's core features to users with App Intents (WWDC24)](https://developer.apple.com/videos/play/wwdc2024/10210/)
- **Documentation:** [Creating a camera experience for the Lock Screen](https://developer.apple.com/documentation/LockedCameraCapture/Creating-a-camera-experience-for-the-Lock-Screen)

## See also

For wiring an action into the Action button or Camera Control in code through App Intents, App Shortcuts, Controls, capture-event interactions, and the locked-camera capture extension, pair this with the App Intents and camera-capture code skills. For the on-screen redundant path the same feature still needs, see the button and menu component skills; for keeping every hardware-triggered action reachable by assistive technology, see `hig-accessibility`.
