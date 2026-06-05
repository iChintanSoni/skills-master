---
name: hig-text-fields
description: Design-critique guidance for Apple Human Interface Guidelines on text fields across iOS, iPadOS, macOS, watchOS, tvOS, and visionOS, covering clear labels and purposeful placeholders, matching the keyboard and content type to the field, inline validation and error presentation, clear buttons, secure entry for sensitive data, and minimizing required input. Use when critiquing or specifying a single-line text input, sign-in or password field, search box, address or payment row, or any form field, judging label and placeholder wording, keyboard and AutoFill choices, or how errors and required fields are shown. Produces UX critique and recommendations, not code.
---

# HIG text fields

A text field is a single-line area for a small, specific piece of text — a name, an email, a code, a password. Critiquing one comes down to whether a person instantly understands what to type, can do it with the right keyboard and AutoFill, and learns about any problem in plain language right where it happened. The strongest field barely needs typing at all: it is labeled clearly, pre-filled where possible, and forgiving of how people naturally enter data.

## When to use

- Reviewing a single-line input: a sign-in, name, email, address, phone, amount, search, or code field.
- Judging label clarity, placeholder wording, and whether the two are being confused.
- Critiquing keyboard type, content-type tagging, secure entry, and clear-button behavior.
- Evaluating how a field validates input and presents errors and required-vs-optional state.

## Core guidance

- Label every field clearly, and don't rely on a placeholder as the only label. A persistent label (or a field whose purpose is obvious from context, like a single search box) keeps meaning visible after typing begins; placeholder-only labels vanish on the first keystroke and fail people who lose their place or use VoiceOver.
- Make placeholders purposeful, not decorative. Use them for a short example or format hint ("name@example.com", "MM/YY") that aids entry. Don't restate the label, write instructions that must stay visible, or pad every field with placeholder noise.
- Match the keyboard and content type to the field so the right keys appear on first tap and AutoFill works: email, URL, number pad, phone pad, or decimal — and tag semantic content (name, email, address, username, current vs. new password, one-time code). A generic alphabetic keyboard on an email or numeric field reads as a careless form.
- Use a secure text field for any sensitive data such as a password, and never echo those characters as plain text. Pair it with the correct password content type so the system can suggest, save, and reuse strong credentials instead of forcing memorization.
- Offer a clear button when a field is likely to be re-edited, so people wipe a long entry in one tap instead of holding Delete. Don't add it to fields that are rarely cleared or where an accidental tap is costly.
- Validate inline and forgivingly. Normalize formatting people naturally include (spaces in a card number, parentheses in a phone) rather than rejecting it, confirm a field once it is plausibly complete, and surface the error next to that field in plain language that says how to fix it — not as one vague banner on submit.
- Minimize required input. Ask only for what you truly need, mark required vs. optional consistently, pre-fill sensible defaults and AutoFill values, and prefer a picker, stepper, or toggle over a free-text field whenever the value is bounded.
- Size and place the field to fit its expected content, and give the focused field obvious, legible focus indication — especially over translucent Liquid Glass surfaces where the background shifts.

## Platform notes

- iOS, iPadOS: Choose a hardware-appropriate keyboard and a meaningful return key (Go, Search, Done) per field, and lean on AutoFill and one-time-code suggestions in the QuickType bar. On iPad, support Tab between fields for hardware-keyboard users and account for the floating keyboard.
- macOS: People expect Tab order, full keyboard navigation, and paste to just work; size fields to their content, show a clear focus ring, and prefer pop-up menus, steppers, and pickers over free text for bounded values.
- watchOS: Typing is the last resort — favor dictation, Scribble, preset replies, the digit-entry keypad, and values handed off from iPhone, and keep any field count tiny.
- tvOS: The grid keyboard is slow, so minimize text fields hard; prefer selection, lean on username and password AutoFill, and let people continue on a nearby iPhone.
- visionOS: Avoid long typing in space; favor dictation and selection, place fields where eye-and-pinch targeting is comfortable, and surface AutoFill so a virtual keyboard is rarely needed.

## Pitfalls

- Using placeholder text as the only label, so meaning disappears once typing starts.
- A generic alphabetic keyboard, or untagged content types, so the wrong keys and no AutoFill appear.
- Showing a password in plain text instead of using a secure field with the right content type.
- Rejecting valid input over formatting instead of normalizing it.
- Errors that appear only on submit, use jargon, point nowhere specific, or clear the field.
- A wall of required fields with required-vs-optional left ambiguous, or free text where a picker fits.

## References

- **Human Interface Guidelines:** [Text fields](https://developer.apple.com/design/human-interface-guidelines/text-fields)
- **Human Interface Guidelines:** [Entering data](https://developer.apple.com/design/human-interface-guidelines/entering-data)
- **Human Interface Guidelines:** [Keyboards](https://developer.apple.com/design/human-interface-guidelines/keyboards)
- **WWDC:** [AutoFill everywhere (WWDC20)](https://developer.apple.com/videos/play/wwdc2020/10115/)
- **Documentation:** [TextField (SwiftUI)](https://developer.apple.com/documentation/swiftui/textfield)
- **Documentation:** [UITextField (UIKit)](https://developer.apple.com/documentation/uikit/uitextfield)

## See also

For building these fields — wiring `TextField` and `SecureField`, applying keyboard types and `textContentType`, adding a clear button, and handling submission and focus — see the SwiftUI and UIKit text-input code skills. For the broader form, pair with `hig-entering-data` (minimizing input and AutoFill across a whole form) and `hig-keyboards-design` (hardware keyboard and Tab focus order). For validation and error wording, pair with `hig-feedback`; for a dedicated search box, see `hig-searching`; and for layout of the field within a form, see `hig-layout`.
