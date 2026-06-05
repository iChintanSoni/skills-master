---
name: hig-popovers
description: "Applies Apple Human Interface Guidelines to popovers — transient, focused content anchored to a control on iPad, Mac, and visionOS, including the pointer arrow, dismissal, sizing, and choosing popover vs sheet vs menu. Use when designing or critiquing a popover, deciding between a popover and a sheet or menu, or reviewing a contextual panel's anchoring and dismissal UX on iPadOS, macOS, or visionOS. Produces design guidance and critique, not code."
tags: [popovers, components, ipados, macos, presentation]
x-skills-master:
  domain: apple
  class: design
  category: components
  platforms: [ipados, macos, visionos]
  pairs_with: []
  sources:
    - https://developer.apple.com/design/human-interface-guidelines/popovers
    - https://developer.apple.com/design/human-interface-guidelines/modality
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Use when designing or reviewing a popover: a transient view that appears above content, anchored to the control or region the person interacted with. Reach for this skill to judge whether a popover is the right container at all, how it should be anchored and sized, how it dismisses, and whether a sheet or a menu would serve better. This is a design-judgment skill — it produces critique and recommendations, not Swift. For implementation, hand off to `swiftui-sheets`, which provides the popover presentation modifier.

## Core guidance

- Use a popover for a **small, focused cluster of options or supporting content** tied to a specific control — a formatting panel, a filter set, a date picker, a detail preview. If the task is a self-contained subtask the person completes and dismisses, prefer a sheet; if it is a flat list of immediate commands, prefer a menu.
- Keep the **arrow pointing as directly as possible at the element that revealed it**, so the connection between trigger and panel reads instantly. Let the system reposition the arrow edge rather than forcing a side that overlaps the anchor or runs off-screen.
- Show **only one popover at a time**. Never cascade or nest popovers so one emerges from another — close the open one before presenting a new one. Layered popovers clutter the screen and lose the anchor relationship.
- Size to the content and **keep it small**. A popover that fills most of the screen should be a sheet; the value of a popover is that it stays lightweight and lets the person see surrounding context.
- Make **dismissal effortless and predictable**: a nonmodal popover dismisses when the person taps or clicks outside it, picks an option, or taps the trigger again. Reserve a modal popover (which requires an explicit action) for genuinely interruptive choices, and always give it a visible way out.
- Don't put **navigation hierarchies or long flows** inside a popover. If the content needs a navigation stack, multiple steps, or scrolling through a lot, it has outgrown the popover — promote it to a sheet or a dedicated screen.
- With Liquid Glass, a popover **morphs out of the glass control that presented it**, preserving visual continuity. Anchor popovers to real controls (toolbar buttons, bar items) so this source-to-overlay transition reads naturally rather than appearing from nowhere.

## Platform notes

Popovers are at home on **iPad and Mac**, where ample space and a pointer make an anchored floating panel natural; on Mac they also back controls like color and font pickers. On **iPhone and other compact widths**, a popover commonly adapts into a sheet automatically — design the content to work in both forms rather than assuming the arrow and anchor will survive. In **visionOS**, contextual panels live in the shared space; keep them shallow and glanceable, and prefer an ornament or sheet for anything that needs to persist. Across platforms, ensure the person can use the popover without needing to see the obscured content behind it.

## Pitfalls

- Cramming a multi-step flow, settings tree, or long scrolling list into a popover instead of using a sheet.
- Popovers so large they cover the anchor and surrounding context, defeating their lightweight purpose.
- Stacking or cascading popovers, or leaving two open at once.
- An arrow that points at empty space or the wrong control because the trigger isn't a real anchored element.
- Relying on popover behavior at compact width without designing the adapted sheet fallback.

## References

- **Human Interface Guidelines:** [Popovers](https://developer.apple.com/design/human-interface-guidelines/popovers)
- **Human Interface Guidelines:** [Modality](https://developer.apple.com/design/human-interface-guidelines/modality)
- **WWDC:** [Build a SwiftUI app with the new design (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/323/)
- **WWDC:** [Build a UIKit app with the new design (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/284/)
- **Documentation:** [popover(isPresented:attachmentAnchor:arrowEdge:content:)](https://developer.apple.com/documentation/swiftui/view/popover(ispresented:attachmentanchor:arrowedge:content:))

## See also

- Implementation: `swiftui-sheets` provides the popover presentation modifier and compact-width sheet adaptation.
- Related design judgment: `hig-sheets` for the sheet alternative, `hig-modality` for modal-versus-nonmodal trade-offs, and `hig-materials-liquid-glass` for the glass morph from the presenting control.
- Apple HIG: Popovers, Modality (see sources).
