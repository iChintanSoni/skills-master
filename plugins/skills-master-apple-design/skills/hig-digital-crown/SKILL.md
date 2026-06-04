---
name: hig-digital-crown
description: Applies Apple Human Interface Guidelines to the Digital Crown on Apple Watch — precise scrolling, value adjustment, haptic detents, and keeping Crown input paired with on-screen focus. Use when designing or reviewing a watchOS screen that scrolls, paginates, or adjusts a value with the Crown, choosing whether the Crown or touch drives an interaction, or critiquing whether the Crown is overloaded. Produces design critique and recommendations, not code.
---

## When to use

Use when designing or reviewing a watchOS screen where the Digital Crown scrolls a list, paginates, or adjusts a value (timer, volume, a picker, a zoom level), and you need to judge whether the Crown is the right input, how its feedback should feel, and whether it stays in sync with what's on screen. This is a design-judgment skill: it produces recommendations and do/don't critique, not Swift code. For the implementation, hand off to the watchOS SwiftUI input skill that wires `digitalCrownRotation` and `focusable`.

## Core guidance

- **Make the Crown the primary way to navigate and adjust, but always back it up with touch.** People should never be forced to use the Crown; every Crown-driven scroll, paginate, or value change must also work by swiping or tapping. The Crown's advantage is that it adjusts without a finger occluding the small display.
- **Track the person's speed.** Turning the Crown is expected to feel precise — map the rotation speed to how fast values change so a slow turn nudges by one and a fast spin moves quickly. A fixed step per detent feels broken when the person flicks the Crown.
- **Always give visible feedback that moves with the Crown.** The value, selection, or scroll position must update in real time as the Crown turns. A Crown turn with no on-screen response reads as a dead control.
- **Keep on-screen focus paired with the Crown.** The Crown drives whatever element currently has focus, so make focus obvious and move it deliberately — don't leave the person turning the Crown with no idea which control they're changing.
- **Use haptic detents to reinforce meaning, not decoration.** The system gives linear "tick" detents by default; keep them when each tick maps to a real increment (a list row, a minute, a step). Switch to content-aligned detents or quieten them when linear ticks fight your content's natural stops — mismatched haptics feel noisy.
- **Mark the edges.** Provide a distinct response at minimum and maximum values so people feel they've hit a boundary instead of assuming the control is stuck.
- **Don't overload the Crown.** Give it one clear job per screen — scroll *or* adjust a value, not both at once in a way the person can't predict. Never design around a Crown *press*: the system reserves presses for going Home and invoking Siri.
- **Respect the person's haptics setting.** Crown Haptics can be turned off in Settings, so never rely on a tap as the only confirmation that a value changed — pair it with the visual update.

## Platform notes

The Digital Crown is unique to Apple Watch (and the comparable control on Apple Vision Pro); this guidance targets watchOS. Haptic detents require Apple Watch Series 4 and later, so the visual feedback must stand on its own for earlier hardware and for people who disable Crown Haptics. In watchOS, the Crown is the backbone of navigation — anchor scrolling and precise adjustment to it, while keeping touch as the equal, redundant path.

## Pitfalls

- Designing an interaction that *only* works with the Crown, with no touch equivalent.
- A Crown turn that produces no visible change, or where focus is ambiguous so the person can't tell what they're adjusting.
- Stepping by a fixed amount per detent regardless of how fast the person turns.
- Leaving loud linear detents on content whose real stops don't align with them, or treating the haptic tap as the only confirmation.
- Assigning meaning to a Crown press — the system owns it.

## References

- **Human Interface Guidelines:** [Digital Crown](https://developer.apple.com/design/human-interface-guidelines/digital-crown)
- **Human Interface Guidelines:** [Designing for watchOS](https://developer.apple.com/design/human-interface-guidelines/designing-for-watchos)
- **WWDC:** [Design and build apps for watchOS 10 (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10138/)
- **Documentation:** [digitalCrownRotation(_:)](https://developer.apple.com/documentation/swiftui/view/digitalcrownrotation(_:))

## See also

- Implementation: the watchOS SwiftUI input skill that wires `digitalCrownRotation` and `focusable`.
- Apple HIG: Digital Crown, Designing for watchOS (see sources); related foundations skill `hig-accessibility` for ensuring the touch path and visual feedback serve everyone.
