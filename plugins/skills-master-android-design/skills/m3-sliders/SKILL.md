---
name: m3-sliders
description: Design critique and recommendations for Material 3 sliders on Android — covering continuous and range sliders, discrete steps and tick marks, value labels, when a slider is the right control versus a text field or stepper, and accessible adjustment. Use when reviewing or specifying any slider control in an Android app and you need M3-grounded design judgment rather than implementation code.
---

## When to use

Use this skill when designing or reviewing any control that lets the user select a value from a range — volume, brightness, price filter, playback position, opacity, or any similarly continuous spectrum. It applies to both single-thumb (continuous or discrete) sliders and two-thumb range sliders, and it covers the decision of whether a slider is the appropriate control at all. This skill produces design judgment and critique; it names the relevant Jetpack Compose Material 3 composables — `Slider` and `RangeSlider` — in prose and hands implementation to the appropriate code skill.

## Core guidance

### Choosing a slider vs an alternative control

- **Use a slider when approximate value selection within a range is the goal.** Sliders excel when the precise numeric value matters less than the felt effect: turning volume up "about halfway," setting a font size "a bit larger," or cropping a date range to "roughly the last month." If users need to enter an exact number, a text field is almost always more efficient and less error-prone.
- **Prefer a text field when precision is required or the range is large and uneven.** Asking a user to drag to "37" on a range from 1 to 500 is tedious and imprecise. A numeric text field with optional increment/decrement buttons (steppers) gives users direct control and is easier to edit. A slider becomes appropriate again when the number of valid discrete steps is small enough to reliably hit with a thumb drag.
- **Use a stepper (increment/decrement buttons) for small, bounded integer ranges.** If the valid values are 1–10 and each step matters (for example, the number of guests), two tappable buttons are more accurate and faster than a slider. Sliders in this case will feel imprecise because the thumb travel distance per step is short.
- **Use a range slider when users need to define both a lower and an upper bound simultaneously.** A `RangeSlider` with two thumbs is the right choice for a price range filter, a time-of-day selection window, or any scenario where both endpoints of a selection are meaningful. Do not place two independent single-thumb sliders to imply a range — the coupling between them is invisible and users will inevitably create invalid states (lower > upper).
- **Reserve sliders for settings and filtering; avoid them in data entry forms.** In a checkout form where the user must enter a dollar amount, a slider is inappropriate. In a settings panel where the user adjusts display brightness, a slider is natural. The mental model for sliders is "feel-based adjustment," not "typed input."

### Continuous vs discrete sliders

- **Use a continuous slider when the value at any point in the range is valid and differences between adjacent positions are imperceptible.** Audio volume, video scrubbing, and color saturation are canonical continuous controls — no particular stop on the track is more correct than its neighbor, and the user is seeking an approximate perceptual target, not a specific number.
- **Use a discrete slider when the value must land on a defined step and intermediate positions carry no meaning.** Font size in points, zoom level as a percentage, or the number of columns in a layout have finite valid values. Discrete sliders display tick marks along the track to indicate stops, making the available choices legible and giving the thumb a satisfying snapping behavior.
- **Match the number of discrete steps to human legibility.** Tick marks work well when there are 4–10 steps. Fewer than 4 steps should be represented as segmented buttons or a radio group — the spatial mapping adds no value. More than about 15 steps make the tick marks visually noisy and the thumb too hard to position accurately; at that point a continuous slider or a text field is preferable.
- **Do not apply tick marks to a slider that behaves as continuous.** Tick marks communicate "these are the valid stops." Using them as decoration on a smooth slider misleads users into expecting snapping behavior that is absent.

### Value labels

- **Show a value label whenever the numeric value adds meaningful context to the interaction.** A brightness slider that shows "70%" as the user drags communicates the specific setting; a volume slider that shows the dB level provides meaningful feedback to audio-sensitive users. A value label is most useful while the thumb is actively moving — it can disappear when interaction stops.
- **Avoid always-visible labels when the slider is used purely for feel-based adjustment.** If the number "34%" beside a game difficulty slider communicates nothing beyond "a bit more than a third of the way," the label adds clutter without insight. Let the thumb position speak for itself.
- **Never clip or truncate the value label at the track edges.** The label must remain fully visible at the minimum and maximum positions. Verify that the label has sufficient space to render at both extremes of the track, especially when the track spans the full container width.
- **Keep label text brief and formatted consistently with the setting's unit.** "3 km," "50%", "$120" are appropriate; full sentences are not. Use the same unit formatting throughout the label's lifecycle so it does not visually shift during a drag.

### Track, thumb, and visual design

- **Never shorten the track so much that meaningful dragging is impossible.** A slider whose total track length is less than about 120 dp becomes extremely difficult to use — small thumb movements produce large value jumps, and users with motor impairments cannot land on their intended values. On compact phones, sliders typically span the full content column width.
- **Maintain the M3 thumb minimum touch target of 48 dp.** The visible thumb circle in M3 is intentionally smaller than 48 dp, but the interactive touch region must extend to at least 48 x 48 dp to meet accessibility requirements. Do not reduce the touch target to match the visual size.
- **Use the track's filled and unfilled regions to communicate progress and possibility.** The filled (active) portion of the track between the start (or lower thumb in a range slider) and the thumb visually represents the current selection. The unfilled (inactive) track represents the available range. This spatial encoding is the core affordance — do not invert them or use the same color for both.
- **On a range slider, ensure the two thumbs have enough visual and interactive separation.** When the lower and upper thumbs are very close together on a narrow track, they can overlap and become impossible to distinguish or select independently. Consider enforcing a minimum gap between them, and provide visual disambiguation (labels, slightly staggered z-order) when thumbs are near each other.
- **Avoid decorating the track with icons or additional affordances that compete with the thumb.** A single start icon or end icon to indicate the semantic direction (e.g., a small speaker icon at the low end and a louder speaker at the high end) can add useful context for unlabeled sliders. More than two supplemental icons create visual noise and shrink the usable track length.

### Accessible adjustment

- **Ensure keyboard and assistive technology users can adjust the slider.** On Android, TalkBack allows users to swipe to adjust a slider value. The slider must have an accurate and consistently updated `contentDescription` or `stateDescription` so TalkBack announces the current value on each change. A slider with no semantic label is inaccessible.
- **Announce units, not just numbers.** TalkBack reading "47" is less useful than "47 percent" or "47 decibels." Include the unit in the accessibility description so the announced value is self-explanatory without seeing the screen.
- **Do not rely on slider position alone to communicate a setting.** For users who cannot see or cannot perceive fine spatial differences, a visible numeric value label (or accessible equivalent) is essential. Position on a track is a spatial metaphor; the actual value must be exposed textually.
- **Provide an alternative input method for sliders used in accessibility-critical flows.** In settings that directly affect a user's accessibility configuration — such as font size or display brightness — consider pairing the slider with text input or stepper buttons so users who struggle with drag interactions can still reach precise values.
- **Never disable a slider silently.** A disabled `Slider` must appear visually distinct (reduced opacity in M3) and must have an accessible description that explains why adjustment is unavailable, or must be hidden until the condition enabling it is met.

## Platform notes

**Compact phones:** Sliders typically occupy the full content column width. Padding on either side of the track should be consistent with the layout grid — 16 dp on standard layouts. Avoid placing a slider inside a dense list item where vertical space is insufficient for the 48 dp touch target; use a dedicated settings row with comfortable vertical breathing room.

**Large screens and foldables:** On expanded layouts with two-pane configurations, a slider spanning the full window width can travel hundreds of dps and feel loose — small value changes require precise micro-movements. Constrain slider width to the content column (typically 360–480 dp) rather than the window edge. On split-screen or multi-pane layouts where the slider controls settings in one pane, center it within that pane, not across the full display.

**Landscape compact:** Landscape orientation on compact phones shrinks vertical space significantly. Sliders remain horizontally oriented; ensure the row containing the slider has sufficient height (at least 48 dp) even in landscape. Consider using a dialog or sheet to host a slider in landscape when vertical space is extremely constrained.

**Tablets in accessibility mode:** Large-screen devices running with high font scale or large pointer sizes can cause value labels to overlap the thumb or extend beyond the track bounds. Test slider layouts at the system's largest font and pointer settings.

## Pitfalls

- **Using a slider for precise numeric entry.** When the user must hit a specific value (e.g., entering "37 km"), a slider is the wrong tool — the thumb is difficult to position exactly, and users will overshoot and undershoot repeatedly.
- **Using two independent single sliders to represent a range.** This obscures the coupling between lower and upper bounds and allows users to set a lower value above the upper, creating invalid states. Use `RangeSlider` instead.
- **Applying tick marks to a continuous slider.** Tick marks signal discrete stops; using them as decoration on a smooth-scrolling track creates a broken promise — users expect snapping that never occurs.
- **Too many discrete steps for a slider.** More than about 15 tick marks makes the track look like a barcode and the thumb impossible to position accurately. Reduce steps or switch to a continuous slider or text field.
- **Too few discrete steps for a slider.** Fewer than 4 valid options are better expressed as a radio group, segmented button, or stepper — the spatial metaphor of a slider adds nothing.
- **Clipping the value label at track extremes.** A label that disappears behind the edge of the screen at the minimum or maximum position leaves users without feedback at the most critical settings.
- **Insufficient track length.** A track shorter than roughly 120 dp makes accurate positioning nearly impossible and increases the difficulty for users with motor impairments.
- **Missing accessibility description or unit.** TalkBack announcing "47" instead of "47 percent brightness" provides incomplete information and fails users who rely on audio feedback.
- **Relying on position alone for accessibility.** Screen reader users cannot perceive spatial metaphors; the current value must be exposed via semantic text.
- **Placing a slider in a dense list row without enough vertical space.** The 48 dp touch target requirement cannot be met in a compact list row without additional vertical padding, resulting in miss-taps and frustration.
- **Disabling the slider without explanation.** Users encountering a greyed-out, unresponsive slider with no context cannot understand what is blocking them and cannot recover without leaving the screen.

## References

- **Material 3 Guidelines:** [Sliders overview](https://m3.material.io/components/sliders/overview)
- **Documentation:** [Compose UI components](https://developer.android.com/develop/ui/compose/components)

## See also

The `Slider` and `RangeSlider` composables in Jetpack Compose implement this guidance — the compose-forms-controls code skill covers parameter details, step configuration, value callbacks, and custom thumb and track drawing. For deciding between a slider, a text field, and stepper buttons for a specific data entry context, the m3-text-fields design skill covers text input design considerations. For the broader question of which input control fits a given setting type, see the m3-forms-controls design skill. For touch target and TalkBack semantic requirements that apply to all interactive controls, see the accessibility guidance referenced in the compose-accessibility code skill.
