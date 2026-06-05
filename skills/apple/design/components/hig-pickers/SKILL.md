---
name: hig-pickers
description: "Design critique and recommendations for pickers on Apple platforms, grounded in the Human Interface Guidelines. Use when reviewing or specifying a control that selects one value from a set, choosing between a menu, inline, wheel, segmented, or date/time picker, deciding compact versus expanded presentation, setting a default selection, or judging whether the option set is manageable. Produces UX guidance and critique, not code. Triggers: picker, date picker, time picker, wheel picker, pull-down menu, inline picker, segmented control, dropdown, option selection, choose a value, compact picker."
tags: [pickers, selection, components, date-picker, forms, liquid-glass]
x-skills-master:
  domain: apple
  class: design
  category: components
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  pairs_with: []
  sources:
    - https://developer.apple.com/design/human-interface-guidelines/pickers
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

# HIG Pickers

Critique and shape how a design lets someone pick one value from a known set: the right picker style for the number of options and the space available, a sensible default already selected, and a presentation that stays out of the way until it is needed.

## When to use

- Reviewing a control that selects one value from a fixed list and judging whether the chosen style fits the option count and context.
- Deciding between a menu (pull-down), inline list, scrolling wheel, segmented control, or a dedicated date/time picker.
- Choosing compact (a button that reveals the picker) versus expanded (always-visible) presentation in a form or settings screen.
- Setting the default selection and confirming the option set is short and scannable enough to pick from comfortably.

## Core guidance

- **Match the style to the option count and space.** Use a menu (pull-down) for a longer or label-driven list where the current value should read at a glance; use a segmented control for two-to-five short, mutually exclusive options that benefit from being all visible; reserve the scrolling wheel for large, ordered ranges (like a time) where flicking through values is natural. Don't force a five-item choice into a wheel or a twenty-item list into a segmented control.
- **Keep the set manageable.** A picker is for choosing among distinct, predictable values — not for browsing. If the list is long, unbounded, or needs searching, the design has outgrown a picker: push to a searchable list screen or a text field with suggestions instead.
- **Always arrive with a default selected.** Preselect the most likely or safest value so the control reads as a confirmation, not a blank decision. Never present a picker with nothing chosen when a reasonable default exists, and order options so the default and common choices are easy to reach.
- **Prefer compact presentation until selection is the point.** A button that shows the current value and reveals the picker on tap keeps a form dense and lets people skip fields they don't need to change. Reserve always-expanded inline pickers for screens where making this choice is the primary task (picking a date in a new event, a duration in a timer).
- **Use the right date-and-time style.** Choose compact when space is tight and editing is occasional; choose inline (calendar plus time) when picking the date is the screen's main job; reserve wheels for time-only or countdown entry where the spinning metaphor reads clearly. Don't make people scroll a wheel through hundreds of days when a calendar is faster.
- **Constrain to valid values, and label clearly.** Let the picker present only choices that make sense (disable or omit unavailable dates, sold-out sizes, past times) so people can't pick something the system will reject. Give the control and its current value a clear label, and keep option text short and parallel.
- **Respect the Liquid Glass material, don't fight it.** In the current design system, menus and segmented pickers render in Liquid Glass and animate as they open or during interaction; let that floating, translucent treatment do its work over your content and avoid wrapping pickers in heavy custom backgrounds or competing chrome.

## Platform notes

- **iOS, iPadOS:** Menus and the compact date/time button are the workhorses in dense forms; expand to inline only when the choice is central. Wheels still suit time and countdown entry. On iPad, account for a picker that may surface as a popover anchored to its button rather than a bottom sheet.
- **macOS:** Favor a pop-up menu (the Mac equivalent of a pull-down picker) or a segmented control over wheels, which feel out of place on the desktop. Size the control to its widest value, support keyboard navigation through the options, and use a stepper or combo field when typing the value is faster.
- **watchOS:** Pickers are tuned for the Digital Crown — keep the set short, order it so the likely value is near the default position, and make each item large enough to land on by feel. Long lists are punishing on the wrist; trim before you ship.
- **tvOS:** Selection is remote-driven and distant, so prefer few, large, clearly focused options and avoid fine-grained wheels. Make the focused value unmistakable and the path to confirm short.
- **visionOS:** Position pickers within a comfortable eye-and-pinch zone and keep targets generous; favor menus and segmented choices over precise wheel scrolling, which is fatiguing to dwell on in space.

## Pitfalls

- Reaching for a scrolling wheel when a menu or segmented control would be faster and clearer.
- Cramming a long, searchable, or unbounded list into a picker instead of a list screen.
- Presenting the picker with no default selected, forcing a cold decision.
- Always-expanded inline pickers cluttering a form where the choice is secondary.
- Offering values the system will reject (past dates, unavailable options) rather than constraining the set.
- Wrapping a Liquid Glass picker in custom backgrounds that flatten or fight the material.
- Unlabeled or ambiguous pickers where the current value or its meaning isn't obvious.

## References

- **Human Interface Guidelines:** [Pickers](https://developer.apple.com/design/human-interface-guidelines/pickers)
- **Human Interface Guidelines:** [Menus](https://developer.apple.com/design/human-interface-guidelines/menus)
- **Human Interface Guidelines:** [Segmented controls](https://developer.apple.com/design/human-interface-guidelines/segmented-controls)
- **WWDC:** [Get to know the new design system (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/356/)
- **WWDC:** [Design with iOS pickers, menus and actions (WWDC20)](https://developer.apple.com/videos/play/wwdc2020/10205/)
- **Documentation:** [Picker (SwiftUI)](https://developer.apple.com/documentation/swiftui/picker)

## See also

For building these controls — choosing a `Picker` style, wiring `DatePicker`, segmented pickers, and menu-backed selection — see the `swiftui-forms-controls` code skill. Pair with `hig-entering-data` when the picker is one field among many and the goal is to cut typing, and with `hig-settings` for option-heavy configuration screens where a picker can replace a setup question with a sensible default. See `hig-materials-liquid-glass` for how the picker's glass material should sit over content, and `hig-digital-crown` for tuning watchOS pickers to crown scrolling.
