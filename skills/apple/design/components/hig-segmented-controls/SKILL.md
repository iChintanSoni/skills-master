---
name: hig-segmented-controls
description: "Design-critique guidance for the Apple Human Interface Guidelines segmented control — a small set of mutually exclusive options of similar weight shown as concise, equal-width segments. Use when designing or reviewing a segmented control, deciding between a segmented control and a menu, pop-up button, picker, or tab view, judging how many segments are too many, or critiquing whether labels mix text and symbols. Produces design recommendations and critique, not code."
tags: [hig, segmented-control, controls, selection, ios, macos]
x-skills-master:
  domain: apple
  class: design
  category: components
  platforms: [ios, ipados, macos, tvos, visionos]
  pairs_with: []
  sources:
    - https://developer.apple.com/design/human-interface-guidelines/segmented-controls
    - https://developer.apple.com/design/human-interface-guidelines/selection-and-input
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

# HIG segmented controls

A segmented control is a short linear row of segments, each acting as a button, that presents a small set of mutually exclusive options of similar importance. Critique here judges whether a segmented control is the right control at all (versus a menu, pop-up button, picker, or tab view), whether the option set is small and parallel, and whether the labels are concise and consistent.

## When to use

- Designing or reviewing a control that lets people pick exactly one option from a small, fixed set of peers — filtering a list, switching a view's mode, choosing a unit.
- Deciding between a segmented control and an alternative: a menu or pop-up button for longer or growable sets, a picker for value selection, or a tab view for top-level view switching.
- Judging whether the segment count, label style, and widths read clearly at a glance, including under Dynamic Type and localization.

## Core guidance

- Use a segmented control only for **mutually exclusive options of similar weight and category** — siblings the person scans side by side. If the choices vary in importance, or one is a default people rarely change, prefer a menu or pop-up button.
- Keep the set **small and stable**: aim for no more than about five segments on iPhone and roughly five to seven in a wider layout. If the options can grow, change, or won't fit, switch to a menu or pop-up button rather than cramming or scrolling segments.
- Make every label **concise and parallel**: short noun or verb phrases of comparable length, or symbols — but **not a mix of text and symbols in one control**, which reads as disconnected. Choose one mode for the whole control.
- Favor **equal-width segments** so the control looks balanced and no option appears more prominent; design the labels to the longest term and verify they don't truncate when localized or at larger text sizes.
- When segments use symbols or icons alone, **confirm each meaning is unambiguous**; add introductory text above the control, or a caption under each segment, when the symbols aren't self-evident, and always supply accessibility labels.
- Don't use a segmented control for **primary view switching in the main content area** — that's a tab view's job. Reserve segmented controls for scoping or mode-switching within a view, a toolbar, or an inspector.
- Don't overload segments with **actions that aren't a selection**; if a segment triggers a one-off command rather than choosing a persistent state, a button or toolbar item is clearer.

## Platform notes

- iOS and iPadOS: Common for in-view filtering and scope switching; keep to about five segments on iPhone. Under the Liquid Glass design system, the control renders as its own glass element with a glass selection thumb, so let the system supply the material and selection feedback rather than recoloring it. Don't substitute a segmented control for the floating glass tab bar that handles top-level navigation.
- macOS: A segmented control can offer single or multiple selection and can also act as a grouped set of toolbar buttons; it sits well in a toolbar or inspector. For top-level view switching in the main window, prefer a tab view instead.
- tvOS: Ensure segments are large, legible, and clearly show focus from across the room; avoid long rows that are tedious to traverse with the remote.
- visionOS: Segmented controls appear on glass and respond to gaze and pinch; keep targets generously sized and the option set short so eyes-only scanning stays effortless.

## Pitfalls

- Too many segments, or a set that grows over time, so labels shrink, truncate, or get hard to tap — use a menu or pop-up button instead.
- Mixing text and symbols within one control, producing an inconsistent, confusing row.
- Symbol-only segments with no introductory text, captions, or accessibility labels, leaving meanings to guesswork.
- Using a segmented control for primary, full-screen view switching that belongs in a tab view, or for an action that isn't a persistent selection.
- Unequal-width or unbalanced segments that imply one option matters more than its peers.

## References

- **Human Interface Guidelines:** [Segmented controls](https://developer.apple.com/design/human-interface-guidelines/segmented-controls)
- **Human Interface Guidelines:** [Selection and input](https://developer.apple.com/design/human-interface-guidelines/selection-and-input)
- **Human Interface Guidelines:** [Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
- **WWDC:** [Get to know the new design system (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/356/)
- **WWDC:** [Meet Liquid Glass (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/219/)
- **Documentation:** [Picker](https://developer.apple.com/documentation/swiftui/picker) and [segmented picker style](https://developer.apple.com/documentation/swiftui/pickerstyle/segmented)

## See also

For implementing a segmented control in code, pair this with the SwiftUI `Picker` (segmented picker style) and UIKit `UISegmentedControl` component skills. When the option set is too large, growable, or weighted, see the menu and pop-up button component skills; for top-level view switching, see the tab bar and tab view skills (`hig-searching` covers the related scope-bar pattern). For symbol choices and accessible labeling of icon-only segments, see `hig-typography-sf-symbols` and `hig-accessibility`.
