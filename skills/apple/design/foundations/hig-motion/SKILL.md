---
name: hig-motion
description: "Design critique for motion and animation in Apple apps, grounded in the Human Interface Guidelines. Use when reviewing transitions, animated feedback, navigation/scroll motion, parallax, or Liquid Glass effects, or when a design feels gratuitous, disorienting, or fails Reduce Motion. Produces UX/design guidance on purposeful motion, continuity, hierarchy, and accessibility-safe animation, not code."
tags: [motion, animation, accessibility, liquid-glass, transitions, hig]
x-skills-master:
  domain: apple
  class: design
  category: foundations
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  pairs_with: []
  sources:
    - https://developer.apple.com/design/human-interface-guidelines/motion
    - https://developer.apple.com/design/human-interface-guidelines/accessibility
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

# hig-motion

Critique and recommend motion that communicates meaning — hierarchy, continuity, and feedback — rather than decoration. Use this when evaluating a design's animations, transitions, and the way the Liquid Glass material moves, and when judging whether motion stays comfortable for everyone.

## When to use

- Reviewing screen transitions, push/present/dismiss flows, or shared-element animations for continuity and context.
- Evaluating animated feedback (loading, success, state changes) for clarity vs. distraction.
- Judging scroll-driven effects, parallax, zoom, scaling, or spinning that might disorient.
- Assessing how Liquid Glass controls and bars morph, float, and respond to interaction or device motion.
- Checking whether a design degrades gracefully under Reduce Motion and other accessibility settings.

## Core guidance

- **Make motion purposeful, not decorative.** Animate to show cause and effect, reveal hierarchy, or guide attention. If an animation does not help someone understand a change, cut it. Favor brief, precise motion that conveys information without calling attention to itself.
- **Preserve continuity and context across transitions.** Move elements along coherent paths so a tap visibly originates from its source and the destination feels connected. Avoid hard cuts or full-screen replacements that lose the user's place; let shared elements carry the eye between states.
- **Match motion to spatial structure.** Direction and depth should reinforce navigation — forward goes one way, back reverses it; modals rise above content. Inconsistent or contradictory directions break the mental model of where things live.
- **Keep timing tight and interruptible.** Short durations and natural easing feel responsive; long or stiff animations make an app feel slow. Let users interrupt or skip motion (e.g., tap through) rather than waiting for it to finish.
- **Never make motion the only signal.** Some people will not perceive an animation, so pair it with a persistent visual change, label, or haptic. Important status must survive without the movement.
- **Avoid known discomfort triggers by default.** Large-scale scaling, zooming, spinning, bouncing, and broad peripheral or parallax motion can cause dizziness or nausea. Use them sparingly, keep them small, and make intense effects optional.
- **Treat Reduce Motion as a first-class design, not a fallback.** Define what each animation becomes when Reduce Motion is on — typically a cross-fade or instant change that still communicates the same outcome. Do not simply leave the screen static where meaning was carried only by movement.
- **Let Liquid Glass move with restraint.** Its specular highlights, refraction, and elastic morph are most effective on navigation-layer controls reacting to touch and scroll. Reserve fluid glass motion for genuine interaction; avoid stacking glass-on-glass or animating it continuously, which competes with content and amplifies motion intensity.

## Platform notes

- **iOS / iPadOS:** Liquid Glass controls and bars morph and float during interaction; keep these animations driven by real gestures. Reduce Motion lowers effect intensity and disables elastic glass behavior — verify the design still reads.
- **macOS:** Motion is typically subtler; prefer quick, functional transitions over expressive flourishes. Respect that pointer-driven interaction tolerates less ambient motion than touch.
- **watchOS:** Motion must be extremely brief and glanceable; long animations waste the short interaction window and battery. Lean on quick state changes and haptics.
- **tvOS:** Focus-driven motion (scaling, parallax on focused content) is core to the experience but should stay gentle and consistent across a room-scale viewing distance.
- **visionOS:** Spatial motion can induce discomfort fast; keep movement within comfortable bounds, avoid pulling content rapidly toward or past the viewer, and honor the system's reduce-motion controls for head- and device-relative effects.

## Pitfalls

- Animating everything, so motion becomes ambient noise and nothing stands out as meaningful.
- Transitions that replace the whole screen abruptly, leaving users unsure how they got there or how to return.
- Relying on a single animation to convey success/error without a lasting visual or haptic backup.
- Full-screen parallax, zoom, or auto-playing motion that triggers nausea and has no opt-out.
- Treating Reduce Motion as "turn animations off" and accidentally removing the only cue for a state change.
- Continuous or layered Liquid Glass motion that draws focus from content and intensifies overall on-screen movement.

## References

- **Human Interface Guidelines:** [Motion](https://developer.apple.com/design/human-interface-guidelines/motion)
- **Human Interface Guidelines:** [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- **Human Interface Guidelines:** [Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- **WWDC:** [Meet Liquid Glass (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/219/)
- **WWDC:** [Get to know the new design system (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/356/)
- **Documentation:** [Reduced Motion evaluation criteria (App Store Connect)](https://developer.apple.com/help/app-store-connect/manage-app-accessibility/reduced-motion-evaluation-criteria/)

## See also

- **hig-accessibility** — broader accessibility critique, including how motion interacts with Reduce Motion, Reduce Transparency, and other settings.
- **hig-liquid-glass** — design judgment for the Liquid Glass material itself: layering, hierarchy, and where glass belongs.
- **hig-foundations** — overarching design principles (clarity, deference, depth) that purposeful motion supports.
- The SwiftUI animation/transition code skill (e.g. **swiftui-animation**) implements these recommendations with the animation, transition, matchedGeometryEffect, and accessibilityReduceMotion APIs.
