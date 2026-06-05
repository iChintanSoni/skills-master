---
name: hig-buttons
description: "Design guidance and critique for buttons on Apple platforms: choosing prominence (prominent/filled vs tinted vs bordered vs plain), button roles (default, destructive, cancel), clear concise labels, sizing and 44-point hit targets, link vs button decisions, and Liquid Glass button treatment. Use when designing or reviewing buttons, call-to-action controls, primary/secondary actions, confirmation dialogs, toolbar and tab-bar controls, or deciding between a link and a button on iOS, iPadOS, macOS, watchOS, tvOS, or visionOS."
tags: [buttons, controls, prominence, liquid-glass, hig, actions]
x-skills-master:
  domain: apple
  class: design
  category: components
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  pairs_with: []
  sources:
    - https://developer.apple.com/design/human-interface-guidelines/buttons
    - https://developer.apple.com/design/human-interface-guidelines/materials
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Use this skill when designing or critiquing any tappable/clickable control that performs an action: primary call-to-action buttons, secondary and tertiary actions, toolbar and tab-bar controls, destructive confirmations, and form submit/cancel pairs. It also helps you decide between a button and a link, set prominence hierarchy, and apply the 2026 Liquid Glass treatment correctly. This is design judgment, not implementation; name the API in prose and hand coding to the code skill.

## Core guidance

- **Make prominence match priority, and use it sparingly.** Reserve the most prominent style (filled/prominent, accent-tinted) for the single most likely or important action on a screen. Use tinted or bordered for secondary actions and plain/borderless for tertiary ones. Two competing filled buttons side by side flatten hierarchy and create decision friction; demote one.

- **Tint to communicate, not to decorate.** Apply accent color or a prominent glass tint only to draw the eye to the primary action. Avoid coloring multiple controls the same accent, and never rely on color alone to convey meaning, e.g., a destructive action needs a clear label and role, not just red.

- **Assign roles, don't fake them with styling.** Mark destructive actions with the destructive role so the system can present them consistently (typically red, often demoted in placement); mark cancel with the cancel role. In alerts and confirmation dialogs, never make a destructive action the default button, and prefer specific verbs ("Delete Draft") over generic "OK/Yes".

- **Write labels as short, title-case verbs that name the outcome.** Prefer "Save", "Send", "Add Account" over vague "OK", "Submit", or "Done" when a more specific verb exists. The label should let someone predict what happens before they tap; keep it to a few words so it fits without truncation across Dynamic Type sizes and locales.

- **Guarantee a comfortable hit target.** Keep tappable areas at least 44x44 pt on touch platforms (and generous focus targets on tvOS/visionOS) even when the visible glyph is smaller; pad icon-only buttons. Leave clear spacing between adjacent controls, especially when a safe action sits next to a destructive one, to prevent mis-taps.

- **Choose link vs button by consequence and context.** Use an inline text link for navigation or supplementary references woven into running text; use a button for actions, commitments, and anything in a toolbar, form, or card. Don't style a real action as a passive link, and don't bury a primary action inside paragraph text where it loses its 44-pt target.

- **Let Liquid Glass float; keep content opaque.** In 2026, fixed navigation controls (tab bars, toolbars) ride in floating Liquid Glass capsules above scrolling content. Use the glass button style for controls in that navigation layer and the prominent glass style for the one primary action; do not apply glass to buttons sitting inside content lists or cards, and remove custom backgrounds so the system material reads correctly.

- **Group and order bar buttons by function and frequency.** In glass toolbars, cluster related controls and place the most-used or most-important action where it's reachable; rely on grouping and spacing rather than dividers or background fills to express structure.

## Platform notes

- **iOS / iPadOS:** Floating Liquid Glass tab bar and toolbars; reserve one prominent glass action per context. iPad pointer interactions still need 44-pt-equivalent targets and clear hover/highlight states.
- **macOS:** Push buttons use a default (return-key) button per window; avoid more than one default. Respect platform conventions for button order in dialogs and keep destructive actions clearly separated from confirm.
- **watchOS:** Favor full-width, tappable buttons sized for a moving wrist; one primary action per screen, minimal stacking, large legible labels.
- **tvOS:** Buttons are driven by focus, not touch; ensure strong focused-state scaling/shadow and labels readable at a distance. Group actions so Siri Remote swipes move predictably.
- **visionOS:** Buttons respond to eye + pinch; provide generous targets and clear hover/highlight feedback. Glass controls sit in the navigation layer; keep primary actions easy to gaze-target.

## Pitfalls

- Two or more equally prominent (filled) buttons competing on one screen.
- Coloring a destructive action red but leaving it as the default/confirm button.
- Generic labels ("OK", "Submit", "Yes") where a specific verb would clarify the outcome.
- Icon-only buttons with a visible glyph smaller than the 44-pt touch target.
- Styling an action as an inline link, or hiding a primary CTA inside paragraph text.
- Applying Liquid Glass to content buttons or stacking glass on glass, reducing legibility and contrast.
- Adding custom backgrounds to toolbars/tab bars that fight the system glass material.

## References

- **Human Interface Guidelines:** [Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons)
- **Human Interface Guidelines:** [Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- **Human Interface Guidelines:** [Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars)
- **WWDC:** [Get to know the new design system (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/356/)
- **WWDC:** [Design foundations from idea to interface (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/359/)
- **Documentation:** [Button | SwiftUI](https://developer.apple.com/documentation/swiftui/button)

## See also

- The SwiftUI button code skill (covering `Button`, `buttonStyle`, the `.glass` and `.glassProminent` styles, and `ButtonRole`) implements the recommendations here; pair this critique skill with it when moving from review to code.
- The Liquid Glass / materials design skill explains the broader material system, navigation-layer philosophy, and scroll edge effects that govern glass button treatment.
- The toolbars and tab bars design skill covers bar-item grouping, the floating glass capsule, and where the prominent action belongs.
- The HIG color and accessibility skills cover accent tinting, contrast, and not relying on color alone for destructive meaning.
