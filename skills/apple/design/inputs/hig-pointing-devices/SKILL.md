---
name: hig-pointing-devices
description: "Design-critique guidance for Apple Human Interface Guidelines pointing-device support on iPadOS and macOS, covering pointer shapes, hover and highlight effects, the iPadOS 26 precise 1:1 pointer with its Liquid Glass highlight, hit regions and target sizing, and secondary (right) click actions. Use when reviewing or specifying how an iPad or Mac interface responds to a trackpad or mouse, judging hover feedback and pointer effects on controls, evaluating whether targets are large and precise enough to point at, or critiquing right-click and shortcut-menu behavior. Produces design recommendations, not code."
tags: [hig, pointer, ipados, macos, inputs]
x-skills-master:
  domain: apple
  class: design
  category: inputs
  platforms: [ipados, macos]
  pairs_with: []
  sources:
    - https://developer.apple.com/design/human-interface-guidelines/pointing-devices
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

# HIG pointing devices

Pointing-device critique judges whether an iPad or Mac interface feels precise and responsive under a trackpad or mouse: the pointer changes shape over the right things, controls give clear hover feedback, targets are easy to land on, and secondary click reveals the actions people expect. On iPad the pointer complements touch rather than replacing it, so a design must read well for fingers, the pointer, and any mix of the two.

## When to use

- Reviewing how an iPad or Mac screen responds to trackpad or mouse input: pointer shape changes, hover feedback, and precision.
- Judging whether interactive elements show appropriate highlight, lift, or hover effects and feel reachable.
- Evaluating target sizing and hit regions for accurate pointing, especially after the iPadOS 26 precise pointer removed magnetism.
- Critiquing secondary (right) click, Control-click, and shortcut-menu behavior, or specifying pointer intent before engineering builds it.

## Core guidance

- Treat the pointer as an additional input on iPad, never a substitute for touch: every action reachable by pointer must also work by finger, and controls should stay comfortably tappable rather than shrinking to mouse-only sizes.
- Let the pointer signal interactivity by changing over actionable content. Use the I-beam over text and a system or custom shape over specialized regions, but keep the default precise pointer over plain content so shape changes stay meaningful.
- Apply effects to match an element's role: highlight (now a Liquid Glass platter that materializes over the hovered control) for bars and small controls, lift for app icons and larger tappable tiles, and a hover-shape change for fine targets like text. Don't pile multiple effects on one element.
- Design for the iPadOS 26 precise pointer that tracks input 1:1 with no magnetism or rubber-banding. Because nothing pulls the pointer toward a target, make targets genuinely large and well-spaced rather than relying on the pointer to snap into place.
- Give hover its own clear, reversible feedback that previews an action without committing to it; hover should never trigger destructive or irreversible behavior, since touch users never see it.
- Provide secondary-click (right-click / Control-click) shortcut menus wherever a selection or object has contextual actions, and keep those actions as redundant paths, not the only way to reach a feature, so touch and keyboard users aren't stranded.
- Keep pointer behavior consistent with the system: respect standard gestures, the shake-to-locate gesture, and platform conventions so the same trackpad action does the same thing across apps.

## Platform notes

- iPadOS: The pointer adapts to context and is meant to enhance, not replace, touch. As of iPadOS 26 it has a new precise shape, tracks 1:1 without magnetism, and shows a Liquid Glass highlight that bends and refracts the control beneath it; revalidate hover states and target sizes against this behavior rather than the older blob-and-magnetism model.
- macOS: People expect full pointer precision, dense layouts, and rich hover and secondary-click affordances by default. Use familiar pointer shapes (arrow, I-beam, resize, open/closed hand) in their conventional roles, and surface contextual actions through shortcut menus that mirror what's in the menu bar.

## Pitfalls

- Shrinking controls to pointer-only hit sizes so they become hard to tap or to land on without magnetism.
- Designing hover-only affordances or instructions that touch users can never discover or reach.
- Overusing custom pointer shapes or stacking effects until shape changes lose their meaning as interactivity cues.
- Carrying over iPadOS magnetism and rubber-band assumptions, or sparse targets that depended on the pointer snapping into place.
- Hiding an essential action behind secondary click with no equivalent path for touch or keyboard users.
- Triggering navigation or destructive actions on hover instead of on an explicit click.

## References

- **Human Interface Guidelines:** [Pointing devices](https://developer.apple.com/design/human-interface-guidelines/pointing-devices)
- **Human Interface Guidelines:** [Menus](https://developer.apple.com/design/human-interface-guidelines/menus)
- **WWDC:** [Elevate the design of your iPad app (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/208/)
- **WWDC:** [Design for the iPadOS pointer (WWDC20)](https://developer.apple.com/videos/play/wwdc2020/10640/)
- **Documentation:** [Integrating pointer interactions into your iPad app](https://developer.apple.com/documentation/uikit/integrating-pointer-interactions-into-your-ipad-app)

## See also

For implementing pointer styles, hover effects, and shortcut menus in code, pair this with the SwiftUI and UIKit input skills that cover pointer interactions. For the Liquid Glass material that the iPadOS 26 highlight effect is built from, see `hig-materials-liquid-glass`; for keeping every pointer action reachable by touch and keyboard, see `hig-accessibility`; and for laying out targets at precise yet tappable sizes, see `hig-layout`.
