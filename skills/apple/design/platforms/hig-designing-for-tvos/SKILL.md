---
name: hig-designing-for-tvos
description: Design guidance and critique for tvOS apps grounded in Apple's Human Interface Guidelines. Use when designing or reviewing an Apple TV interface, evaluating focus and Siri Remote navigation, the 10-foot living-room viewing distance, large legible type and imagery, the top shelf, layered parallax/focus effects, or the tvOS 26 Liquid Glass look. Produces design recommendations and critique, not code.
tags: [tvos, hig, focus, top-shelf, parallax]
x-skills-master:
  domain: apple
  class: design
  category: platforms
  platforms: [tvos]
  pairs_with: []
  sources:
    - https://developer.apple.com/design/human-interface-guidelines/designing-for-tvos
    - https://developer.apple.com/design/human-interface-guidelines/focus-and-selection
    - https://developer.apple.com/design/human-interface-guidelines/remotes
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Use this skill when you are designing or critiquing a tvOS app and need to judge whether it fits the living-room, 10-foot, focus-driven model. Typical triggers: deciding how content is laid out for a large screen viewed from across the room; reviewing whether every interactive element is reachable and clearly highlighted by the focus engine; designing imagery, app icons, or top-shelf content; or evaluating whether the interface reads well under tvOS 26's Liquid Glass material. Pair it with the focus-and-selection and remotes input skills for interaction detail.

## Core guidance

- **Design for the focus model, not a pointer.** People navigate by moving focus with directional swipes or clicks on the Siri Remote, then select. Ensure every actionable element can receive focus and that the focused item is unmistakable — tvOS lifts, brightens, and applies a subtle parallax tilt. Never leave a screen where focus can land nowhere or gets trapped.
- **Make focus movement predictable and spatial.** Lay elements on a clean grid so a swipe right moves focus to the visually adjacent item. Avoid gaps, orphaned controls, or diagonal jumps that make the highlight feel like it teleports. Set a sensible default focus when a screen appears so people start in the right place.
- **Respect the 10-foot distance.** Use large type, generous spacing, and high contrast so everything is legible from a couch. Favor a small number of large, tappable targets over dense tables of small controls; detail that works on a phone becomes unreadable on a wall-mounted TV.
- **Let imagery lead.** tvOS is a content-first, edge-to-edge canvas. Use large, high-resolution artwork (the Apple TV app favors portrait posters) and keep chrome minimal so media stays the star. Keep critical content inside the safe area away from screen edges, since TVs may overscan and crop the outer margins.
- **Design layered art for app icon and top shelf.** The app icon must be a layered image (2–5 layers) that animates with parallax on focus; build a safe-zone border into every layer so the foreground is not clipped as it shifts, and keep the background layer opaque. Treat the top shelf as a premium showcase for featured or continue-watching content, not a static banner.
- **Use parallax and motion as feedback, not decoration.** The lift-and-tilt of a focused card tells people where they are; keep it consistent so the effect reads as a system behavior. Don't add competing motion that fights the focus animation or makes the highlighted item hard to track.
- **Lean into Liquid Glass for system surfaces.** In tvOS 26, Control Center, the media transport, and navigation use translucent Liquid Glass that refracts the content behind it. Keep your own toolbars and overlays light and let content show through; avoid heavy opaque panels that block the cinematic backdrop.

## Platform notes

- **tvOS only.** There is no touch screen and no cursor; the remote (and optional game controller or keyboard) drives focus. Design assuming shared, lean-back viewing where multiple people may watch and one person controls.
- **Tab bars sit at the top** of the screen in tvOS and reveal on demand; keep to roughly 3–7 destinations. Under Liquid Glass these float as translucent bars rather than solid strips.
- **Hardware tiers matter for Liquid Glass.** The full glass material requires Apple TV 4K (2nd generation) or later; ensure the layout still reads cleanly on older models that fall back to flatter surfaces.

## Pitfalls

- Porting an iOS or web layout directly — small controls, dense grids, and tap-only affordances break the focus-and-distance model.
- Elements that can't take focus, or a screen with no default focus, leaving users stuck or disoriented.
- Critical text or logos pushed to the very edge where overscan crops them, or layered-image content that clips during the parallax shift.
- Relying on hover or precise pointing; the remote is directional, so destinations must be reachable by predictable up/down/left/right moves.
- Over-busy backgrounds behind Liquid Glass surfaces that reduce legibility, or custom motion that competes with the focus animation.

## References

- **Human Interface Guidelines:** [Designing for tvOS](https://developer.apple.com/design/human-interface-guidelines/designing-for-tvos)
- **Human Interface Guidelines:** [Focus and selection](https://developer.apple.com/design/human-interface-guidelines/focus-and-selection)
- **Human Interface Guidelines:** [Remotes](https://developer.apple.com/design/human-interface-guidelines/remotes)
- **Human Interface Guidelines:** [App icons](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- **WWDC:** [Build SwiftUI apps for tvOS (WWDC20)](https://developer.apple.com/videos/play/wwdc2020/10042/)
- **Apple Newsroom:** [Apple introduces a delightful and elegant new software design](https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/)

## See also

- **hig-focus-and-selection** — focus states, default focus, and selection mechanics that drive every tvOS interaction.
- **hig-remotes** — Siri Remote swipe-and-click gestures and game-controller input the focus model depends on.
- **hig-app-icons** — layered-image and parallax requirements for the tvOS icon and other focusable art.
- **hig-liquid-glass** — the translucent material behavior to apply to tvOS toolbars, transport, and navigation.
- The SwiftUI tvOS implementation skill that realizes focus, card buttons, and top-shelf content in code.
