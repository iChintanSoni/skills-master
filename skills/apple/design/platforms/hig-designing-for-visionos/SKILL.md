---
name: hig-designing-for-visionos
description: "Design critique and recommendations for visionOS spatial apps grounded in Apple's Human Interface Guidelines. Use when designing or reviewing Apple Vision Pro experiences, choosing between windows, volumes, and immersive spaces, planning spatial layout and depth, designing eyes-and-hands interactions and comfortable target sizes, applying glass materials for legibility against passthrough, or auditing a layout for ergonomic comfort and fatigue. Produces UX guidance and HIG-based critique, not code."
tags: [visionos, spatial, hig, accessibility, immersion]
x-skills-master:
  domain: apple
  class: design
  category: platforms
  platforms: [visionos]
  pairs_with: []
  sources:
    - https://developer.apple.com/design/human-interface-guidelines/designing-for-visionos
    - https://developer.apple.com/design/human-interface-guidelines/eyes
    - https://developer.apple.com/design/human-interface-guidelines/immersive-experiences
    - https://developer.apple.com/design/human-interface-guidelines/spatial-layout
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

# Designing for visionOS

## When to use
- Designing or critiquing an Apple Vision Pro app and deciding how it should occupy space.
- Choosing between a window, a volume, or an immersive space for a given task.
- Reviewing eyes-and-hands interaction targets, glass legibility, or ergonomic comfort.
- Auditing a layout for fatigue, depth misuse, or content placed outside the comfortable field of view.

## Core guidance
- **Start in the Shared Space, earn full immersion.** Default to windows that coexist with the person's surroundings; reserve a Full Space (progressive or fully immersive) for focused tasks where blocking reality genuinely serves the experience, and always offer an obvious way back to passthrough. Use the Digital Crown affordance to let people dial immersion themselves rather than forcing it.
- **Pick the right container.** Use a window for primarily 2D content and controls; use a volume only when bounded 3D content is the experience (a model, a board game, a 3D chart) — a volume is not a window with an object dropped in. Don't scatter many small windows; consolidate so people don't have to look around to find your UI.
- **Design for eyes-and-hands first.** The primary input is look-then-pinch (eyes target, a pinch confirms) with hands resting comfortably in the lap. Avoid requiring raised-arm reaches or direct touch as the only path — "gorilla arm" fatigue is real. Make every interactive element generously sized and well separated so gaze can resolve it reliably; treat roughly 60 pt as a practical minimum hit target.
- **Place content where the head doesn't have to move.** Anchor primary content ahead at eye level, within a comfortable field of view (roughly 30 degrees up/down and ~left/right of center). Keep frequently used controls near the content they affect, and let windows recenter to the person rather than fixing them to world positions that drift behind them.
- **Use depth with restraint and meaning.** Subtle depth, shadow, and separation communicate hierarchy and focus; large or fast depth changes, content rushing toward the face, or layers that occlude each other cause discomfort. Keep text and crucial controls on a single readable plane rather than staggered in Z.
- **Let glass do the legibility work.** Standard system materials (the visionOS glass that inspired Liquid Glass) adapt to whatever passthrough is behind them — use them instead of hardcoded backgrounds so text stays legible over any room. Prefer vibrant system text and standard components; avoid pure-white fills, heavy custom colors, or low-contrast overlays that fight the adaptive material.
- **Engineer against fatigue.** Minimize sustained bright fields and rapid motion in the periphery; avoid forcing long fixed gaze on one spot. Respect comfort and motion accommodations, keep sessions interruptible, and never tie essential actions to sustained physical effort.

## Platform notes
- **visionOS 26 / the "26" cycle:** Spatial widgets can be anchored in the room (on a wall, in a frame, or as a portal) and persist across sessions — design them to read at a glance from across the space and to sit gracefully against real surfaces. Wide and ultrawide virtual displays and shared spatial experiences (multiple people in one space) raise the bar on legibility at distance and on not crowding shared sightlines.
- **Liquid Glass lineage:** visionOS materials are the origin of the system-wide Liquid Glass language; lean on the standard glass and ornament chrome rather than inventing custom translucency, so your app feels native and stays legible.
- **Ornaments and chrome:** Place secondary controls in ornaments attached to a window's edge rather than floating loose; this keeps the main surface clean and controls predictably reachable by gaze.

## Pitfalls
- Launching straight into full immersion with no clear exit, trapping the person away from their surroundings.
- Treating a volume as decoration — wrapping flat UI in 3D when a window would be clearer and more comfortable.
- Tiny or tightly packed targets that gaze can't disambiguate, or requiring precise pointing.
- Content or controls placed high, low, or far to the sides, forcing repeated head and neck movement.
- Hardcoded opaque or bright backgrounds that ignore passthrough and become unreadable in some rooms.
- Aggressive depth animation, looming content, or strobing motion that triggers discomfort and fatigue.

## References
- **Human Interface Guidelines:** [Designing for visionOS](https://developer.apple.com/design/human-interface-guidelines/designing-for-visionos)
- **Human Interface Guidelines:** [Eyes](https://developer.apple.com/design/human-interface-guidelines/eyes)
- **Human Interface Guidelines:** [Immersive experiences](https://developer.apple.com/design/human-interface-guidelines/immersive-experiences)
- **Human Interface Guidelines:** [Spatial layout](https://developer.apple.com/design/human-interface-guidelines/spatial-layout)
- **Human Interface Guidelines:** [Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- **WWDC:** [Principles of spatial design (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10072/)
- **WWDC:** [Design for spatial input (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10073/)
- **WWDC:** [Design considerations for vision and motion (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10078/)
- **Documentation:** [What's new in visionOS](https://developer.apple.com/visionos/whats-new/)

## See also
- For building these surfaces in code, see the SwiftUI spatial skills covering windows, volumes (volumetric scenes), and immersive spaces, plus the ornament and RealityKit content skills.
- Pairs conceptually with the immersive-experiences and spatial-layout design skills, the materials/glass design skill (shared lineage with Liquid Glass), and the accessibility skill for motion and comfort accommodations.
- Relate to the general HIG materials and Liquid Glass design skills, since visionOS glass is the origin of that system-wide language.
