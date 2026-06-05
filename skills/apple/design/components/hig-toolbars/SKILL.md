---
name: hig-toolbars
description: "Applies Apple Human Interface Guidelines to toolbars — placement (top vs bottom), grouping related controls, prioritizing the most-used actions, overflow handling, icon-only vs labeled items, and the Liquid Glass toolbar treatment in the 26 design cycle. Use when designing or reviewing a toolbar, deciding which actions earn a spot on the bar, choosing top vs bottom placement, or critiquing a glass toolbar's grouping and hierarchy. Produces design critique, not code."
tags: [hig, design, toolbars, liquid-glass, components]
x-skills-master:
  domain: apple
  class: design
  category: components
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  pairs_with: []
  sources:
    - https://developer.apple.com/design/human-interface-guidelines/toolbars
    - https://developer.apple.com/documentation/TechnologyOverviews/liquid-glass
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Use when designing or reviewing a toolbar — the bar of frequently used, screen-level actions — and deciding what belongs on it, how it is placed, grouped, and prioritized, and how it reads under Liquid Glass. This is a design-judgment skill: it produces recommendations and do/don't critique, not Swift code. For the implementation, hand off to the SwiftUI/UIKit toolbar code skill.

## Core guidance

- **Put screen-level, frequently used actions here — not navigation.** A toolbar holds actions that operate on the current view (share, edit, add, filter). It is distinct from a tab bar (switching sections) and the back/title navigation bar. Don't overload it with destinations.
- **Place by platform convention.** On iPhone the toolbar sits at the **bottom**, within thumb reach. On iPad and Mac it sits at the **top** of the window. Don't relocate a bottom bar to the top on iPhone just to match a Mac layout.
- **Prioritize ruthlessly; aim for a small set.** Keep only the most-used actions on the bar (roughly up to five on a phone-width bar). Push the rest into a **More (ellipsis) overflow menu** rather than cramming the bar.
- **Group related controls and separate concerns.** Keep navigation controls together and set primary actions (Save, Done) apart from secondary ones using spacing. In Liquid Glass, adjacent items share one glass background, so use a **toolbar spacer** to split them into readable clusters instead of one undifferentiated blob.
- **Prefer clear SF Symbols; add labels when meaning is ambiguous.** Liquid Glass emphasizes symbol-based buttons for a cleaner bar, but never sacrifice comprehension — label or use a menu when an icon isn't self-evident, and don't mix labeled and icon-only buttons in the same tight group.
- **Let one action lead.** Tint or use the prominent (glass-prominent) treatment for the single most important action (e.g. a confirmation) so it stands out; keep the rest neutral. Don't tint several items at once — it flattens hierarchy.
- **Remove custom backgrounds and decoration.** Under the 26 design system, drop opaque fills and hairlines from custom bars; let the floating glass material and grouping express hierarchy, and let content scroll legibly beneath it.

## Platform notes

iPhone toolbars are bottom-anchored and not user-customizable; iPad and Mac toolbars are top-anchored and **support reordering, grouping, and user customization** — design a sensible default set and overflow. On Mac, respect the title-bar/toolbar region and standard window controls. In watchOS, space is scarce: surface only one or two essential actions and rely on the navigation stack for the rest. tvOS favors focus-driven navigation over dense bars; keep toolbar actions minimal and focusable. In visionOS, controls float as a glass layer (often an ornament below the window) — keep the action set shallow and glanceable.

## Pitfalls

- Treating the toolbar as a second tab bar by filling it with section destinations.
- Packing more than ~5 items onto a phone bar instead of using a More menu.
- Icon-only buttons whose meaning isn't obvious, with no label or accessible name.
- One giant glass group with no spacers, so primary and secondary actions read as equal.
- Tinting many items at once, leaving no clear primary action.
- Keeping opaque custom backgrounds that fight the floating Liquid Glass material.

## References

- **Human Interface Guidelines:** [Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars)
- **Documentation:** [Liquid Glass](https://developer.apple.com/documentation/TechnologyOverviews/liquid-glass)
- **WWDC:** [Get to know the new design system (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/356/)
- **WWDC:** [Meet Liquid Glass (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/219/)
- **WWDC:** [What's new in SwiftUI (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/256/)

## See also

- Implementation: the SwiftUI/UIKit toolbar code skill that builds the bar, toolbar items, placements, and toolbar spacers.
- Related design skills: `hig-sheets` for toolbar actions inside modal containers; the tab bar design skill for switching sections versus screen-level actions; `hig-typography-sf-symbols` for choosing legible toolbar symbols.
- Apple HIG: Toolbars; Liquid Glass technology overview (see sources).
