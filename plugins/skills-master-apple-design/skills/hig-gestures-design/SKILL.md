---
name: hig-gestures-design
description: "Design critique and recommendations for gesture interaction on iOS, iPadOS, and visionOS per Apple's Human Interface Guidelines. Use when reviewing or designing touch and spatial gestures, custom swipes, drag, pinch, touch-and-hold, or gaze-and-pinch interactions, or when a screen relies on hidden gestures. Triggers: gesture conflicts with the back swipe or screen edges, undiscoverable custom gestures, missing visible alternatives, accessibility concerns (VoiceOver, AssistiveTouch, Switch Control), or weak gesture feedback. Produces HIG-grounded design guidance, not code."
---

# HIG gestures (design)

Critique gesture interaction so it feels native: lean on standard system gestures, make any custom gesture discoverable and forgiving, never fight system edges or navigation, and always pair gestures with a visible, accessible alternative.

## When to use

- Reviewing a flow that depends on swipe, drag, pinch, rotate, touch-and-hold, or gaze-and-pinch.
- Designing a custom gesture and deciding whether it is justified.
- Diagnosing a gesture that conflicts with the back swipe, Home indicator, Control Center, or Notification Center.
- Auditing whether every gesture-driven action has a non-gesture path for accessibility.
- Checking that gestures give clear, immediate feedback during and after the interaction.

## Core guidance

- **Prefer standard gestures.** Use system gestures the way the system does — tap to activate, swipe to navigate or reveal row actions, double-tap to zoom, touch-and-hold for context menus, pinch/rotate for content. People do not want to relearn familiar actions, so do not reassign a standard gesture to a non-standard result.
- **Justify every custom gesture.** Add one only when no standard gesture fits, when it is the primary interaction of an immersive or content-heavy experience, and when it is easy to perform. Custom gestures are hard to discover and remember, so keep them simple and few.
- **Make custom and hidden gestures discoverable.** Reveal them with onboarding hints, affordances (a peeking edge, a grab handle, a chevron), or a first-run coach mark — never assume people will find an invisible interaction. Treat a hidden gesture as an accelerator, not the only way in.
- **Never block system gestures.** Keep custom gestures away from the screen edges and the Home indicator area where the system owns the swipe (back, App Switcher, Control Center, Notification Center). Only defer system edge gestures in genuinely full-screen, immersive contexts (such as a game), and restore normal behavior immediately afterward.
- **Always provide a visible alternative.** Every gesture-driven action needs an on-screen control or menu item that does the same thing, so it works with VoiceOver, Switch Control, AssistiveTouch, and for people who cannot perform multi-finger or precise gestures. A gesture should accelerate an action, not gate it.
- **Give immediate, proportional feedback.** Show the interface responding as the gesture happens (content tracking the finger, a row sliding, an element scaling) and confirm completion or snap-back on release. Pair visual feedback with appropriate haptics for confirmations, not as decoration.
- **Keep gestures forgiving and reversible.** Provide generous hit areas (target at least 44x44 pt for tappable controls), tolerate imprecise input, and let people cancel a gesture mid-flight by dragging back. Avoid stacking many distinct gestures on one element, which causes accidental triggers.
- **Match the platform's interaction model.** On touch, design around direct manipulation; on visionOS, design around look-then-pinch where the eyes target and a pinch activates, keeping targets comfortably spaced and avoiding gestures that demand sustained or large arm motion.

## Platform notes

- **iOS / iPadOS:** Reserve the left-edge swipe for back navigation — in the current design cycle that gesture can begin from almost anywhere on the screen when no interactive element is under the finger, so custom horizontal swipes inside content are easy to trip. Keep swipe-to-delete and leading/trailing row actions consistent with system behavior. iPadOS also carries pointer and trackpad gestures, so do not rely on touch-only interactions.
- **visionOS:** Eyes are the primary pointer and a pinch is the tap. Space and size targets so gaze can resolve them, give a clear hover/highlight state on look, and prefer indirect pinch-and-drag over gestures requiring people to reach far or hold a pose. Provide alternatives for people who cannot pinch or whose hands are out of view.

## Pitfalls

- Overriding swipe-to-go-back with a custom horizontal gesture, leaving people stranded.
- Burying the primary action behind a gesture with no visible control — invisible to VoiceOver and to first-time users.
- Placing custom gestures in the edge/Home-indicator zone and fighting the system swipe.
- Reassigning a standard gesture to an unexpected result (for example, double-tap that deletes).
- Requiring precise, multi-finger, or sustained gestures with no simpler fallback.
- Gestures that fire with no on-screen response, leaving people unsure anything happened.

## References

- **Human Interface Guidelines:** [Gestures](https://developer.apple.com/design/human-interface-guidelines/gestures)
- **Human Interface Guidelines:** [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- **Human Interface Guidelines:** [Feedback](https://developer.apple.com/design/human-interface-guidelines/feedback)
- **WWDC:** [Meet Liquid Glass (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/219/)
- **Documentation:** [Use VoiceOver gestures on iPhone](https://support.apple.com/guide/iphone/use-voiceover-gestures-iph3e2e2281/ios)
- **Documentation:** [Gestures (SwiftUI)](https://developer.apple.com/documentation/swiftui/gestures)

## See also

- **hig-accessibility-design** for the broader accessibility review (VoiceOver, Switch Control, alternatives to motion-based input) that gesture alternatives feed into.
- **hig-feedback-design** for haptic and visual feedback patterns that confirm gesture results.
- **hig-navigation-design** for how the back swipe and edge gestures interact with navigation structure.
- **swiftui-gestures** (the code skill) for implementing tap, drag, long-press, magnify, rotate, and composed/simultaneous gestures with `Gesture` and `gesture(_:)` once the design is settled.
