---
name: hig-apple-pencil
description: "Design-critique guidance for Apple Human Interface Guidelines on Apple Pencil and Scribble, covering low-latency drawing and handwriting, hover feedback, double-tap and squeeze (Pencil controls), roll and barrel-tip expression, Scribble for text entry, palm-rejection expectations, and always offering equivalent touch alternatives. Use when reviewing or designing an iPadOS or visionOS drawing, note-taking, markup, or handwriting feature, judging Pencil gesture and hover affordances, evaluating Scribble in text fields, or deciding whether a Pencil-only interaction needs a non-Pencil fallback. Produces UX recommendations, not code."
tags: [apple-pencil, scribble, hig, ipados, inputs, design]
x-skills-master:
  domain: apple
  class: design
  category: inputs
  platforms: [ipados, visionos]
  pairs_with: []
  sources:
    - https://developer.apple.com/design/human-interface-guidelines/apple-pencil-and-scribble
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

# HIG Apple Pencil and Scribble

## When to use

Reach for this when critiquing or designing an iPadOS or visionOS experience where Apple Pencil is an input: a canvas for drawing or painting, a note-taking or markup surface, handwriting-to-text in forms, or any view that exposes hover, double-tap, squeeze, roll, or Scribble. Use it to judge whether Pencil interactions feel immediate and natural, whether they respect the user's system settings, and whether everything reachable with the Pencil is also reachable by touch.

## Core guidance

- Make marking feel instantaneous. Drawing and handwriting must track the tip with imperceptible latency; any visible lag breaks the illusion of ink and is the single most damaging flaw in a Pencil experience. Prefer the system drawing surface (PencilKit) before building a custom canvas, since it inherits Apple's low-latency rendering, palm rejection, and tool picker for free.
- Treat double-tap and squeeze as user-owned, not app-owned. People assign these in Settings to actions like switching tools, showing the color palette, or revealing ink attributes. Honor the chosen action, surface a quick visual confirmation of what happened, and never silently repurpose the gesture or make it the only way to reach a function.
- Use hover to preview, not to commit. Show where the tip will land and what the active tool will do (size, color, a soft shadow), so users aim before they touch down. Keep hover feedback lightweight and reversible; nothing should change state until the Pencil actually contacts the screen.
- Support the full expressive range of the hardware where it matters: pressure and tilt for stroke weight and shading, and barrel roll on Pencil Pro to rotate flat or chisel tips. Map these to creative output, and pair meaningful moments (squeeze, snap-to, tool change) with the system's Pencil haptics so feedback feels physical rather than decorative.
- Make Scribble available everywhere text is entered. It should work in every standard field without forcing people to tap or focus the field first; let them just start writing. Support the natural gestures (scratch out to delete, draw a vertical line to insert space) and keep behavior consistent with the system so muscle memory carries over.
- Keep the writing surface still. While someone writes into a field, do not scroll, reflow, or reposition it; movement mid-stroke makes input feel out of control. If a layout shift is unavoidable, defer it until the person pauses.
- Assume the device handles palm rejection and design to reinforce it: give a comfortable margin so resting a hand near the edge never triggers controls, and avoid placing destructive or easily-mistapped actions where a planted palm or wrist would sit.
- Never require the Pencil. Every Pencil action needs an equivalent path by touch (and, in visionOS, by eyes-and-hands or pointer), because not everyone has a Pencil, has it charged, or can use one. Pencil should accelerate and enrich, never gate.

## Platform notes

- iPadOS: The primary surface for Pencil. Pressure, tilt, hover, and double-tap span recent Pencil generations; squeeze, barrel roll, and the on-screen hover preview are Pencil Pro features, so degrade gracefully when they are absent and never assume a specific model.
- visionOS: Apple Pencil pairs with iPad-style canvases brought into the spatial environment; do not assume on-glass hover or squeeze, and ensure the same content is fully operable with the platform's native eyes-and-hands input and any connected pointer.

## Pitfalls

- Visible ink lag or a custom canvas that drops the system's low-latency path and palm rejection.
- Overriding the user's chosen double-tap or squeeze action, or hiding a feature behind a gesture with no menu or button equivalent.
- Hover affordances that mutate state or feel heavy, instead of a calm preview of where the tip will land.
- Text fields that jump, scroll, or steal focus while someone is writing with Scribble.
- Requiring a tap to focus a custom field before Scribble works, or omitting scratch-to-delete so correction feels foreign.
- Placing controls or destructive actions in the natural palm-rest zone near the screen edge.
- Pencil-only interactions with no touch fallback, locking out anyone without a working Pencil.

## References

- **Human Interface Guidelines:** [Apple Pencil and Scribble](https://developer.apple.com/design/human-interface-guidelines/apple-pencil-and-scribble)
- **WWDC:** [Squeeze the most out of Apple Pencil (WWDC24)](https://developer.apple.com/videos/play/wwdc2024/10214/)
- **Documentation:** [PencilKit](https://developer.apple.com/documentation/pencilkit)
- **Documentation:** [Apple Pencil interactions (UIKit)](https://developer.apple.com/documentation/uikit/apple-pencil-interactions)
- **Documentation:** [Adopting hover support for Apple Pencil](https://developer.apple.com/documentation/uikit/adopting-hover-support-for-apple-pencil)

## See also

For the implementing canvas, tool picker, and gesture APIs, pair this critique with the `pencilkit` code skill. For text-entry context around Scribble fields, see typography and input guidance in `hig-typography-sf-symbols`. Always cross-check Pencil-only flows against `hig-accessibility` to confirm touch and assistive-input equivalents, and apply `hig-materials-liquid-glass` when canvas chrome and tool palettes use system materials.
