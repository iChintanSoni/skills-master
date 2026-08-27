## Checklist

**Variant selection**
- [ ] All text fields in the same form use the same variant (all filled or all outlined) — no mixing.
- [ ] Filled fields are placed on neutral/white surfaces; outlined fields are used inside cards, dialogs, or tinted surfaces.
- [ ] The variant choice reflects surface context, not field priority or importance.

**Labels**
- [ ] Every text field has a non-empty label parameter (drives both visual floating label and TalkBack accessibility description).
- [ ] Labels float upward on focus and input — the floating animation is not suppressed.
- [ ] Placeholder text is used for format hints or examples only, never as a substitute for the label.
- [ ] Required fields are marked consistently (asterisk in the label or a single "* Required fields" note at the top of the form).

**Supporting text and error states**
- [ ] Supporting text is present proactively where format, length, or content rules need communicating before the user types.
- [ ] Error states are triggered only after user action (focus-out on a blank required field, failed submission, or clearly invalid partial input) — never on initial render.
- [ ] Each error message is specific and actionable — it names what is wrong and how to fix it.
- [ ] Error messages and supporting text share the same region; they are designed as complementary pairs, not independent strings.
- [ ] Error state clears as soon as the value passes validation — the field does not remain red after the user has corrected the issue.

**Icons**
- [ ] Leading icons are used only when they communicate the field's purpose at a glance (search, phone, card number).
- [ ] Trailing icons are interactive (clear, visibility toggle, picker opener, error indicator) — no decorative non-tappable trailing icons.
- [ ] All icon touch targets meet the 48 × 48 dp minimum interactive area.
- [ ] Fields with both leading and trailing icons have sufficient horizontal space for comfortable text input at the narrowest expected layout width.

**Character counter**
- [ ] A character counter is only shown when the limit is plausible to reach (typically high-expression fields like bio, caption, or message).
- [ ] The counter appears progressively (around 80–90% of capacity), not always visible from the first character.
- [ ] The counter escalates visually (color change) as the limit approaches and transitions to error color when the limit is reached.
- [ ] A hard character limit is communicated in supporting text ("Max 160 characters") before the user begins typing.

**Control selection**
- [ ] Finite, enumerable choices use a dropdown (`ExposedDropdownMenuBox`) or segmented control, not a free-text field.
- [ ] Multi-value token inputs (tags, recipients) use a chip input pattern, not a comma-delimited text field.
- [ ] Date and time inputs use `DatePicker` / `TimePicker` with a read-only text field trigger, not free-text date entry.
- [ ] Search-first surfaces use `SearchBar` or `DockedSearchBar`, not a `TextField` styled to look like a search bar.
- [ ] Multi-line text fields are reserved for paragraph-scale input; single-line fields are used for short, single-value inputs.

**Keyboard and layout**
- [ ] All forms tested with the software keyboard raised — active fields scroll into view above the keyboard using `imePadding()` or equivalent.
- [ ] Forms tested at 200% text scale — supporting text, error text, and counters wrap gracefully without clipping.
- [ ] On large screens, text field width is constrained to the content column (max ~560–600 dp) rather than stretching edge-to-edge.

**Accessibility**
- [ ] TalkBack tested: field purpose, current value, and error state are all announced when focus lands on each field.
- [ ] Error messages are in the `supportingText` slot so they are semantically associated with the field and read by TalkBack when the error state activates.
- [ ] Color is not the only signal for error state — the error icon and the error message text both supplement the color change.
- [ ] No text field relies solely on placeholder text for its description (placeholder disappears on input and is not a label substitute).
