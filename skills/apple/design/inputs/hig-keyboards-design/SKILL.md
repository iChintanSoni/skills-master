---
name: hig-keyboards-design
description: "Design critique and HIG guidance for hardware keyboard support: keyboard shortcuts, the hold-Command shortcut overlay on iPad, focus order, Full Keyboard Access, and standard key behaviors. Use when reviewing or designing how an iPad, Mac, or visionOS app responds to a physical keyboard, when deciding which actions deserve shortcuts, when auditing Tab focus order or motor accessibility, or when a design must work without a pointer. Produces UX recommendations, not code."
tags: [keyboards, shortcuts, accessibility, focus, inputs]
x-skills-master:
  domain: apple
  class: design
  category: inputs
  platforms: [ios, ipados, macos, visionos]
  pairs_with: []
  sources:
    - https://developer.apple.com/design/human-interface-guidelines/keyboards
    - https://developer.apple.com/design/human-interface-guidelines/focus-and-selection
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

# HIG Keyboards (Design)

Critique and recommendations for supporting hardware keyboards: shortcuts, discoverability, focus order, and Full Keyboard Access — grounded in Apple's Human Interface Guidelines.

## When to use

- Reviewing how an iPad, Mac, or visionOS app responds to a connected physical keyboard.
- Deciding which actions deserve custom shortcuts and how to organize them in the hold-Command overlay.
- Auditing Tab focus order, focus rings, and motor accessibility (Full Keyboard Access).
- Ensuring a flow is fully operable without a pointer or touch.

## Core guidance

- **Respect standard shortcuts everywhere.** People expect Command-C/V/X, Command-Z, Command-F, Command-W, and Return/Escape to behave consistently regardless of app. Never repurpose a system shortcut for a non-standard action — it breaks muscle memory and trust.
- **Add custom shortcuts only for frequent, primary actions.** A handful of well-chosen shortcuts speeds up power users; a flood of them clutters the iPad shortcut overlay and makes the app feel hard to learn. If an action is rare, leave it to menus and buttons.
- **Make shortcuts discoverable, not memorized.** On iPad the hold-Command overlay reveals available commands grouped into familiar menu categories (File, Edit, View). Organize commands so users can browse and learn them; don't hide capability behind undocumented key combos.
- **Mirror the menu structure.** The iPad shortcut interface should read like a Mac menu bar — same groupings, same wording. Consistency across the overlay, on-screen menus, and any Mac version lowers the learning curve.
- **Let the system localize and mirror shortcuts.** Don't hard-design a layout that assumes a US English keyboard; primary and modifier keys adapt to the connected hardware and language, including right-to-left mirroring.
- **Design a deliberate focus order.** As people press Tab, focus should move in reading order — leading to trailing, top to bottom — and group related controls so focus flows logically rather than jumping around the screen. Use focus groups for sidebars, toolbars, and grids.
- **Keep the focused element obvious and on-screen.** Every focusable control needs a clear, high-contrast focus indication, and focus must auto-scroll into view. Don't let focus land on something invisible or off-screen.
- **Only let focus reach interactive elements.** Decorative or read-only content marked for VoiceOver should be skipped by keyboard/Full Keyboard Access focus. Verify that every reachable item actually does something, and that Return/Space activates and Escape dismisses.

## Platform notes

- **iPadOS:** The hold-Command overlay is the primary discovery surface — design command names and grouping for it. Support arrow-key and Tab navigation in lists, sidebars, and grids so the app is usable on a Magic Keyboard without touching the screen.
- **macOS:** Shortcuts belong in the menu bar where they're discoverable and editable in System Settings. Full Keyboard Access expands Tab navigation to nearly every control; verify your custom views participate.
- **visionOS:** A connected keyboard drives both shortcuts and focus-based navigation; ensure focus order and shortcut behavior match the iPad/Mac mental model.
- **Liquid Glass (26 cycle):** Focus rings and shortcut overlays render over translucent Liquid Glass surfaces — confirm focus indication stays legible against shifting backgrounds and meets contrast needs.

## Pitfalls

- Overriding a standard shortcut for an app-specific action.
- Defining dozens of shortcuts, cluttering the overlay and burying the useful ones.
- Focus order that follows view-hierarchy or creation order instead of visual reading order.
- A focus ring that is invisible, low-contrast, or clipped at a container edge.
- Focus stopping on decorative content, or interactive items that Tab can never reach.
- Assuming a US keyboard layout and breaking localized or RTL mirroring.

## References

- **Human Interface Guidelines:** [Keyboards](https://developer.apple.com/design/human-interface-guidelines/keyboards)
- **Human Interface Guidelines:** [Focus and selection](https://developer.apple.com/design/human-interface-guidelines/focus-and-selection)
- **WWDC:** [Support hardware keyboards in your app (WWDC20)](https://developer.apple.com/videos/play/wwdc2020/10109/)
- **WWDC:** [Support Full Keyboard Access in your iOS app (WWDC21)](https://developer.apple.com/videos/play/wwdc2021/10120/)
- **WWDC:** [Focus on iPad keyboard navigation (WWDC21)](https://developer.apple.com/videos/play/wwdc2021/10260/)
- **Documentation:** [Navigate your Mac using Full Keyboard Access](https://support.apple.com/guide/mac-help/navigate-your-mac-using-full-keyboard-access-mchlc06d1059/mac)

## See also

- **hig-focus-and-selection-design** — deeper design guidance on focus appearance, selection, and reading order.
- **hig-menus-and-actions-design** — shaping the menu structure that the iPad shortcut overlay mirrors.
- **swiftui-keyboard-shortcuts** — the SwiftUI/UIKit code skill that implements keyboard shortcuts, key commands, and the focus engine in code.
- **hig-accessibility-design** — motor-accessibility context for Full Keyboard Access and Switch Control.
