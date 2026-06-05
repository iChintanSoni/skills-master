---
name: hig-sliders-steppers
description: Applies Apple Human Interface Guidelines to sliders and steppers — sliders for continuous ranges, steppers for small discrete increments, showing the current value, sensible min/max/step, labels and tick marks, and accessible alternatives. Use when designing or reviewing a value-adjustment control, choosing between a slider and a stepper, or critiquing how a numeric input is presented. Produces design critique, not code.
---

## When to use

Use when deciding how someone should adjust a numeric value and whether a slider, a stepper, or a different control fits. This is a design-judgment skill: it produces recommendations and do/don't critique, not Swift code. For implementation, hand off to the SwiftUI/UIKit code skills that build `Slider` and `Stepper`.

## Core guidance

- **Pick by range and precision.** Reach for a **slider** when the value lives on a continuous range and approximate, eyeballed adjustment is fine (brightness, opacity, zoom). Reach for a **stepper** when the range is small, the values are discrete, and exactness matters (quantity 1–10, number of guests, minutes). A long discrete range belongs in a picker or a field, not a 0–500 stepper.
- **Always make the current value legible.** A slider's filled track shows rough position, but if the precise number matters, show it nearby (a readout, a paired field, or a value label) — never force people to guess where the thumb sits. A stepper has no built-in label; pair it with adjacent text that shows the value and its units.
- **Set min, max, and step deliberately.** Bound the range to only meaningful values, and choose a step that divides the range evenly so the maximum is actually reachable and increments feel regular. Default to the most likely or safest starting value, not an arbitrary midpoint or zero.
- **Use endpoint cues, not clutter.** A slider can show small icons at the two ends to convey what minimum and maximum *mean* (small/large text, quiet/loud). Add tick marks only when discrete stops genuinely help; dense ticks or numeric labels along the whole track add noise and shrink touch targets.
- **Customize only when it adds meaning.** Track color, thumb, and end icons can match your app, but restyling for decoration alone breaks familiarity and the Liquid Glass look of standard controls. Don't repurpose a slider as a volume control — use the system volume view, which also exposes output-device switching.
- **Give an accessible, exact alternative.** Continuous sliders are hard for low-vision, motor, and switch users to land precisely; pair every consequential slider with a way to type or step to an exact value. Standard `Slider` and `Stepper` ship VoiceOver adjustable actions and announce their value — preserve that by keeping a clear label and units rather than hiding them visually.

## Platform notes

On **iOS/iPadOS** both controls are common in forms and settings rows; keep the stepper's +/- targets and the slider thumb comfortably tappable. On **macOS**, sliders frequently carry tick marks and a stepper almost always sits beside an editable number field — lean into that precision pairing. In **visionOS**, value controls render in glass and respond to eye-and-pinch, so the thumb and stepper buttons need extra size and spacing for reliable targeting; favor steppers or paired fields over fine continuous dragging. On **watchOS** the Digital Crown, not a dragged slider, is the natural fine-adjust input — see `hig-digital-crown`.

## Pitfalls

- Using a slider where the exact number is load-bearing (price, count, duration) without a readout or editable field.
- A stepper bound to a wide range, forcing dozens of taps to reach common values.
- Step sizes that don't divide the range, stranding the maximum or producing uneven jumps.
- Decorative restyling that makes a slider unrecognizable or its thumb hard to target.
- Relying on continuous drag alone, leaving precision out of reach for assistive-technology users.

## References

- **Human Interface Guidelines:** [Sliders](https://developer.apple.com/design/human-interface-guidelines/sliders)
- **Human Interface Guidelines:** [Steppers](https://developer.apple.com/design/human-interface-guidelines/steppers)
- **Human Interface Guidelines:** [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- **WWDC:** [Get to know the new design system (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/356/)
- **Documentation:** [Slider](https://developer.apple.com/documentation/swiftui/slider)
- **Documentation:** [Stepper](https://developer.apple.com/documentation/swiftui/stepper)

## See also

- Implementation: the SwiftUI/UIKit code skills that build `Slider` and `Stepper`.
- Related design: `hig-pickers` (for long discrete ranges), `hig-text-fields-design` and `hig-entering-data` (exact numeric entry), `hig-digital-crown` (watchOS fine adjustment), `hig-accessibility` and `hig-materials-liquid-glass`.
- Apple HIG: Sliders, Steppers (see sources).
