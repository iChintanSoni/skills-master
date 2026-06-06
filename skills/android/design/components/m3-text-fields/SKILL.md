---
name: m3-text-fields
description: "Design critique and guidance for Material 3 text fields on Android — covering filled vs outlined variants, label behavior, placeholder usage, supporting and error text, leading and trailing icons, character counters, and validation feedback patterns. Use when reviewing or specifying text input in a Compose-first Android app, choosing between the two field variants for a surface context, auditing error and validation UX, or determining whether a text field is the right control at all. Produces design judgment and recommendations, not implementation code."
tags: [m3, design, text-fields, input, validation, components]
x-skills-master:
  domain: android
  class: design
  category: components
  platforms: ["android", "large-screen"]
  pairs_with: [compose-text-fields]
  sources:
    - https://m3.material.io/components/text-fields/overview
    - https://developer.android.com/develop/ui/compose/text/user-input
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for this skill when:

- Choosing between a filled text field and an outlined text field for a given surface or form context, and understanding why the choice matters beyond visual preference.
- Critiquing label placement, placeholder copy, and how the label behaves during focus and input — including when a floating label can be removed entirely.
- Designing or auditing validation: what triggers an error state, what the error message says, whether an error icon belongs in the slot, and how the field recovers.
- Deciding whether leading or trailing icons add genuine affordance or clutter a field that should stay clean.
- Adding a character counter and knowing when it helps versus distracts.
- Determining that a text field is the wrong control — and identifying what should replace it (a dropdown, chip input, date picker, or search bar).

This is a design-judgment skill. It names the relevant Jetpack Compose Material 3 composables — `TextField` (filled) and `OutlinedTextField` — in prose. Implementation details belong to the compose-text-fields code skill.

## Core guidance

### Filled vs outlined: choosing the right variant

- **Use filled text fields on neutral, low-elevation surfaces — not on colored or patterned backgrounds.** The filled variant (`TextField` in Compose M3) uses a filled container that inherits its tint from the surface color role. On a white or near-white scaffold background it creates clear visual separation. On a colored card, dialog, or bottom sheet with a tinted surface, the tinted container and the surface compete for dominance. In those contexts, use the outlined variant.
- **Use outlined text fields when the container needs to recede.** `OutlinedTextField` communicates its boundary through a stroke rather than a fill, making it preferable when the field must coexist with other elevated or tinted surfaces without adding visual weight — such as inside a `Card`, a dialog, or a settings pane with an alternate background color.
- **Never mix filled and outlined fields in the same form.** Switching variants mid-form signals an inconsistency in the design system, not an intentional distinction between field types. Pick one and apply it uniformly to all editable inputs in that context.
- **Do not use variant choice to imply priority.** A common misuse is assigning filled to "important" fields and outlined to "optional" ones. The variants communicate surface context, not field importance. Use supporting text, required indicators, or visual grouping to communicate field importance instead.

### Labels and placeholders

- **Every text field must have either a visible label or a clear context that substitutes for one.** A label floating above the cursor — the M3 default behavior — tells the user what the field expects before and after they begin typing. Removing the label entirely is only appropriate when the field's purpose is unambiguous from surrounding context (a single-field inline search, a message reply box directly under a thread).
- **Float the label, do not hide it.** When a user types into a filled or outlined field, the label animates from the center of the field to a floating position above the input area. This M3 behavior is the primary mechanism for reminding users what they entered after focus moves away. Do not suppress this animation or replace the label with a static placeholder that disappears on input — the user loses context the moment they start typing.
- **Use placeholder text for format hints, not for the field's purpose.** Placeholder text (the hint shown inside the field before any input) should clarify format or example values: "e.g. jane@example.com", "DD/MM/YYYY", "City or postcode". Using the field label as the placeholder text — then watching it vanish when the user types — is a well-documented accessibility and usability failure in M3 design.
- **Keep placeholder text brief and secondary.** It should never be relied upon as the primary descriptor; it disappears the moment input begins. If the format hint is critical for correct input, place it in the supporting text region instead, where it persists.
- **Distinguish between "required" and "optional" with a consistent indicator.** M3 recommends marking required fields with an asterisk (*) appended to the label when the form has a mixture. If all fields are required, no indicator is needed — state that once at the top of the form instead of annotating every label.

### Supporting text and the helper region

- **Use supporting text proactively, not only reactively.** The supporting text region sits below the field and is visible at all times. Use it to communicate format expectations, constraints, or tips before the user makes an error: "Must be at least 8 characters", "Use your registered email address". Proactive guidance reduces errors rather than describing them after the fact.
- **Reserve the error state for actual validation failures, not for guidance.** Displaying the supporting text in red (the M3 error state) before the user has had a chance to input anything is anxiety-inducing and confusing. Trigger the error state only after a failed submission attempt, after focus leaves the field with invalid content, or in real-time only when the format error is unambiguous (e.g., a character that cannot appear in an email address).
- **Keep error messages specific and actionable.** "Invalid input" tells the user nothing. "Enter a password with at least 8 characters" tells them exactly what to fix. The error string should complete the sentence "To fix this, you need to…" in as few words as possible.
- **Error messages replace, do not stack on top of, supporting text.** In M3, the supporting text and the error message share the same region. When the error state is active, the error message replaces any prior supporting text. Design these two strings as a pair — the supporting text describing the rule, and the error string describing the violation of that rule.
- **Do not clear supporting text or error messages abruptly.** Abrupt removal of guidance is disorienting. The error message should persist until the value passes validation; the supporting text should persist until focus leaves a successfully validated field.

### Error states and validation feedback

- **Validate at the right moment for the interaction.** For short, simple fields (email, zip code), validate on focus-out (blur). For fields with complex rules (passwords, payment codes), consider deferred validation only on form submission. Real-time validation on every keystroke is acceptable when the feedback is positive (a green check as the password reaches sufficient strength) but should be avoided for negative feedback — typing partial words into a name field should not immediately surface an error.
- **Use the error trailing icon to reinforce — not replace — the error message.** An error icon in the trailing slot (typically an exclamation mark using the M3 error color) adds visual emphasis and draws the eye, but it conveys no information about what is wrong. It supplements a well-written error message; it does not substitute for one. Never rely on the icon alone to signal an error state.
- **Distinguish between error, warning, and informational states.** M3 natively supports the error state. If your design genuinely needs a "warning" (valid but potentially problematic input) or "informational" state (neutral in-progress guidance), communicate these through the supporting text and a distinct icon color — do not use the error state for non-error conditions, as it trains users to treat errors as normal.
- **Ensure the field recovers gracefully.** When the user corrects a validation error, the error state should clear as soon as the corrected value passes validation. A field that remains red after the user has typed a valid email address is a serious trust failure.

### Leading and trailing icons

- **Use a leading icon only when it meaningfully communicates the field type at a glance.** A magnifying glass before a search field, a phone handset before a phone number field, and a credit card icon before a card number field are recognizable semantic shortcuts. A generic "pen" icon before every editable field adds noise without meaning.
- **Use a trailing icon for interactive affordances, not decoration.** The trailing slot in M3 text fields is conventionally reserved for actions: a visibility toggle on a password field, a clear-all button (×) for resettable fields, a calendar icon to open a date picker, or — during error state — an error indicator icon. Do not place a decorative icon in the trailing slot that does nothing when tapped.
- **Ensure all icon slots meet the 48 dp touch target minimum.** Icons embedded in text fields tend to shrink to fit the field's visual size; verify the tappable area extends at least 48 × 48 dp even when the visual icon is 24 dp.
- **A field with both leading and trailing icons must still have a comfortable input area.** On compact phone widths, two icons flanking a narrow field leave minimal horizontal space for the actual input. Audit this at the smallest expected content scale and under large-font accessibility settings.

### Character counters

- **Show a character counter only when the limit is likely to be reached or when approaching the limit meaningfully changes behavior.** A 1 000-character limit on a short biography field warrants a counter. A 255-character limit on a first-name field does not — users will virtually never reach it, and displaying the counter adds visual noise without benefit.
- **Display the counter before the limit is reached, not only when it is exceeded.** Reveal the counter when the user is within a meaningful threshold of the limit — the M3 guideline suggests surfacing it around 80–90% of capacity. Waiting until the user is at 300/300 and cannot type further is a surprise failure, not a graceful constraint.
- **Combine the counter with an error state if the limit is a hard constraint.** When the user reaches or exceeds a hard maximum, the counter should transition to the error color and the field should communicate what happens (truncation, block, submission failure). If the field allows overage and truncates on submission, say so in supporting text before the user types.

### When a text field is the wrong control

- **Replace a text field with a dropdown or exposed menu when the set of valid values is finite and enumerable.** If the answer is always one of five countries, six font sizes, or three currencies, a text field forces the user to discover and type the correct string. An `ExposedDropdownMenuBox` (M3's dropdown text field variant) provides the same visual footprint as a text field while restricting input to valid values.
- **Replace a text field with a chip input when the user must supply multiple discrete values.** Email recipients, tags, and ingredient lists involve an unbounded number of short tokens. A text field that accumulates comma-separated values is error-prone and hard to edit; a chip input pattern allows adding, removing, and reviewing each token independently.
- **Replace a text field with a date or time picker for calendar and time inputs.** Typed dates and times are fraught with locale, format, and validation complexity. M3's `DatePicker` and `TimePicker` components resolve all of these issues with a standard interaction model. Use a text field date trigger (a read-only outlined field with a calendar icon that opens the picker) rather than a fully editable free-text date input.
- **Replace a free-text search field with a dedicated search bar when search is the screen's primary function.** M3's search bar (`SearchBar` and `DockedSearchBar`) is purpose-built for this interaction, with built-in suggestions, history, and focus management. A generic text field pressed into service as a search bar misses the structural and accessibility affordances of the dedicated component.
- **Avoid using a multi-line text field when a single-line field will do.** Multi-line fields imply open-ended, paragraph-scale input. Using them for short, single-value inputs (a city name, a username) signals incorrect affordance and wastes vertical space. Only expand to multi-line when the user is expected to write one or more complete sentences.

## Platform notes

### Compact phones
Text fields are the dominant input surface on phones. Pay close attention to keyboard displacement: when the software keyboard appears, fields near the bottom of the screen may be obscured. Use `WindowCompat.setDecorFitsSystemWindows(window, false)` combined with `imePadding()` modifiers in Compose to ensure the active field scrolls into view above the keyboard. Test all forms at both default and maximum text size accessibility settings — field heights expand at larger type scales and icon slots must remain proportionate.

### Large screens and foldables
On tablets and foldables in expanded window configurations, forms should constrain text fields to a maximum content width (typically 560–600 dp) and align them to the content column rather than stretching edge-to-edge. A text field that spans a 900 dp tablet layout is visually unmoored. Consider a two-column form layout for long forms, grouping related fields in each column and maintaining consistent variant (filled or outlined) throughout. Verify that IME (keyboard) behavior works correctly on foldables, where the keyboard may appear as a floating or split keyboard that does not fully displace the layout.

### Accessibility
All text fields must have a non-empty `label` parameter so that TalkBack can announce the field's purpose when it receives focus. The label parameter drives both the visual floating label and the accessibility description — removing it to rely solely on placeholder text leaves TalkBack users with no field identification. Ensure that error messages are also announced; M3's `TextField` exposes `isError` and the `supportingText` slot, which should contain the error string so it is semantically associated with the field and read aloud when the error state activates.

### Wear OS
Standard `TextField` and `OutlinedTextField` composables are not appropriate on Wear OS. The watch's small circular display and the absence of a physical keyboard mean input is typically delegated to the paired phone or to voice. If text entry is genuinely required on-device, use the Wear Compose input components from the `androidx.wear.compose:compose-material3` library, which are designed for the constrained display.

## Pitfalls

- **Using placeholder text as a substitute for a label.** The placeholder disappears when the user types, leaving the field with no description. This is a persistent and well-documented accessibility and usability failure — every text field needs a label.
- **Triggering error states before the user has had a chance to input.** Showing a red field and an error message on screen load is alarming and confusing. Error states must follow user action.
- **Displaying a vague error message.** "Invalid" and "Error" are not actionable. The message must tell the user what is wrong and how to fix it.
- **Mixing filled and outlined variants in the same form.** Creates the impression of design inconsistency and is not a sanctioned M3 differentiation pattern.
- **Placing a decorative, non-interactive icon in the trailing slot.** Users tap trailing icons expecting an action (clear, reveal, open picker). A tappable-looking icon that does nothing on tap breaks the interaction contract.
- **Not testing with the keyboard raised.** Fields that are obscured by the software keyboard and cannot scroll into view are effectively inaccessible on compact phones. This is one of the most common and most avoidable text-input bugs.
- **Neglecting large-text-scale testing.** At 200% font scale, supporting text, counter, and error text expand significantly, often wrapping to multiple lines. Verify that the field's bottom region does not clip or overlap adjacent elements.
- **Using a text field for finite, enumerable choices.** If the valid answers are known and limited, a dropdown or segmented control removes ambiguity and validation complexity.
- **Displaying a character counter for limits the user will never approach.** Adds visual noise without benefit and implies incorrectly that the limit might matter for this input.
- **Over-using real-time validation for negative feedback.** Marking a partially typed email address as invalid while the user is still typing disrupts flow and is technically incorrect — the string is incomplete, not wrong.

## References

- **Material 3 Guidelines:** [Text fields overview](https://m3.material.io/components/text-fields/overview)
- **Documentation:** [User input in Jetpack Compose](https://developer.android.com/develop/ui/compose/text/user-input)
- **Material 3 Guidelines:** [Date pickers](https://m3.material.io/components/date-pickers/overview)
- **Material 3 Guidelines:** [Menus](https://m3.material.io/components/menus/overview)
- **Material 3 Guidelines:** [Search](https://m3.material.io/components/search/overview)

## See also

The compose-text-fields code skill covers implementing `TextField`, `OutlinedTextField`, `ExposedDropdownMenuBox`, keyboard options (`KeyboardOptions`, `KeyboardActions`), input transformations, and focus management in Jetpack Compose. For the design of forms as complete surfaces — grouping fields, structuring multi-step flows, and managing submission states — see the m3-forms design skill. For choosing between a text field, a chip input, and other selection controls, the m3-chips and m3-segmented-buttons design skills are relevant. For designing accessible label, error, and hint copy that TalkBack reads correctly, see the m3-writing design skill and the compose-accessibility code skill.
