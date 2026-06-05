---
name: hig-toggles
description: "Design-critique guidance for Apple Human Interface Guidelines toggles and switches across iOS, iPadOS, macOS, watchOS, tvOS, and visionOS, covering when a switch fits an immediate on/off setting, clear labeling of what 'on' means, avoiding switches for actions that need confirmation, and the switch-versus-checkbox choice on Mac. Use when critiquing or specifying a settings row, preferences pane, feature toggle, or control panel, judging whether a switch or a button is the right control, reviewing toggle labels, or deciding between switch and checkbox on macOS. Produces UX critique and recommendations, not code."
tags: [toggles, switches, controls, settings, macos, components]
x-skills-master:
  domain: apple
  class: design
  category: components
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  pairs_with: []
  sources:
    - https://developer.apple.com/design/human-interface-guidelines/toggles
    - https://developer.apple.com/design/human-interface-guidelines/buttons
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

- Critiquing a settings row, preferences pane, or control panel where a person flips a single setting on or off.
- Judging whether a switch is the right control, or whether the choice is really an action (a button) or a multi-option pick (segmented control, menu).
- Reviewing toggle labels for whether they make the "on" meaning obvious without reading the state.
- Deciding between a switch and a checkbox on macOS, and where each belongs in a window.

## Core guidance

- Reach for a switch only for a binary on/off **state** that persists, like a real-world light switch. If the control performs a one-time action, runs a process, or doesn't have a meaningful "off," it's a button or a menu item, not a switch.
- Make the switch take effect immediately. A switch with no confirmation is the whole point; if flipping it should pause until the person taps Save, Apply, or OK, you've chosen the wrong control or the wrong screen pattern.
- Never put a switch on a destructive or irreversible action that needs a confirmation step. A switch implies "safe to flick freely"; if you'd want an alert before it commits, use a button that owns its own confirmation instead.
- Label the setting, not the control. The text beside a switch should name the feature (Wi-Fi, Airplane Mode, Low Power Mode) so it reads naturally as "this thing, on or off." Avoid action verbs like "Enable" or "Turn on" — the switch already conveys that.
- Make "on" unambiguous. The label should describe what the on position does, never a neutral or double-negative phrase. Avoid switches that turn a *negative* off (a switch labeled "Disable notifications" forces people to reason backward).
- Keep one switch to one setting. Don't overload a single switch to control several unrelated behaviors, and don't pair it with a second control that contradicts its state.
- Give immediate, legible feedback elsewhere in the UI when the consequence isn't visible at the switch — a status change, an icon, or revealed/hidden rows — so the person sees the result of the flick.

## Platform notes

- iOS, iPadOS: The switch is the default for settings rows in grouped lists; the label sits on the leading edge, the switch trailing. Under the 2025-2026 design, settings live inside Liquid Glass surfaces, but switch behavior is unchanged: instant, no confirmation.
- macOS: Two valid binary controls coexist. Use a **switch** for a prominent, immediately-applied on/off setting (often the lead control of a settings group). Use a **checkbox** for a setting in a list, a multi-select list of independent options, or a choice that's part of a form committed with a button. Don't scatter both styles for the same kind of choice in one window.
- watchOS: Switches appear in lists and take effect immediately; keep labels short enough to read at a glance and ensure the tap target is comfortable on a small display.
- tvOS: A switch is focus-driven and toggled with a click; confirm the state change with clear focus and visual feedback since there's no touch.
- visionOS: Switches render on glass and respond to eye-and-pinch; keep them large enough to target comfortably and make the resulting state change visible.

## Pitfalls

- Using a switch for an action that should ask "Are you sure?" first — confirmation belongs to buttons, not switches.
- A switch that only stages a change and waits for a separate Save/Apply tap.
- Labels with action verbs ("Enable X") or negatives ("Don't show Y") that make the on-state ambiguous.
- One switch wired to several unrelated behaviors, so people can't predict what flipping it does.
- On macOS, mixing switches and checkboxes for the same class of setting, or using a switch inside a long list where a checkbox reads better.
- No visible consequence after the flick, leaving people unsure whether it worked.

## References

- **Human Interface Guidelines:** [Toggles](https://developer.apple.com/design/human-interface-guidelines/toggles)
- **Human Interface Guidelines:** [Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons)
- **Human Interface Guidelines:** [Controls](https://developer.apple.com/design/human-interface-guidelines/controls/)
- **WWDC:** [Get to know the new design system (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/356/)
- **WWDC:** [Meet Liquid Glass (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/219/)
- **Documentation:** [Toggle](https://developer.apple.com/documentation/swiftui/toggle)

## See also

For building these controls — wiring a `Toggle`, choosing its style (`.switch` vs `.checkbox` vs `.button`), and binding it to state — see the SwiftUI and UIKit/AppKit control code skills (`UISwitch`, `NSSwitch`, `NSButton` checkbox). For the rows and panes they sit in, pair with `hig-settings`; for confirmation flows that switches must never own, pair with `hig-feedback` (alerts) and the buttons design skill; for the labels themselves, see `hig-writing`; and for the Liquid Glass surfaces these controls render on, see `hig-materials-liquid-glass`.
