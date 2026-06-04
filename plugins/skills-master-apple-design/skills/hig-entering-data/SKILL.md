---
name: hig-entering-data
description: Design-critique guidance for Apple Human Interface Guidelines on entering data across iOS, iPadOS, macOS, watchOS, tvOS, and visionOS, covering minimizing typing, matching the keyboard to the content, AutoFill and one-time codes, sensible defaults and formatting, inline validation, and reducing required fields. Use when critiquing or specifying a form, sign-in, sign-up, checkout, or settings screen, reviewing whether a design asks for too much manual input, judging keyboard and AutoFill choices, or evaluating how errors and required fields are presented. Produces UX critique and recommendations, not code.
---

# HIG entering data

Critique of data entry judges one thing above all: how little a person has to do to give you what you need without making a mistake. The best form is one that is mostly already filled in. A strong design gathers what it can automatically, offers AutoFill at every field, picks the right keyboard, formats and validates gently, and asks only for what is genuinely required — so a sign-in or checkout feels like confirming rather than typing.

## When to use

- Reviewing a form, sign-in, sign-up, checkout, onboarding, or settings screen for input burden.
- Judging whether a design gathers information automatically rather than asking people to type it.
- Critiquing keyboard type, content-type tagging, and AutoFill behavior across fields.
- Evaluating default values, formatting, inline validation, and which fields are marked required.

## Core guidance

- Pre-gather everything you reasonably can. Don't ask for data the system already has — location, contacts, calendar, device settings, or a prior entry — when AutoFill or a permission prompt can supply it. Treat every manual keystroke you remove as a win.
- Match the keyboard to the content type so the right keys are present from the first tap: email, URL, number pad, phone pad, decimal, or a full-screen digit-entry view for PINs. Don't show the default alphabetic keyboard for an email, amount, or code field.
- Enable AutoFill on every relevant field by tagging its semantic content (name, email, address, username, new vs. current password, one-time code). Don't leave a sign-in or address form untagged — AutoFill that doesn't appear reads as a broken form, not a private one.
- Support one-time codes as a glance-and-tap, not a memory test. The system surfaces an SMS or authenticator code in the QuickType bar or suggestion strip; design the field to accept that single tap and never force people to switch apps and transcribe digits.
- Prefill sensible defaults and let the data shape itself. Offer reasonable preselected values to cut decisions, and format as people type (phone, card, currency, dates) instead of demanding a rigid pattern or rejecting punctuation they naturally include.
- Validate inline and forgivingly. Confirm a field as soon as it's plausibly complete, place the error next to the offending field in plain language that says how to fix it, and don't block submission with a single vague banner or wipe what they typed.
- Cut required fields to the true minimum and make optionality legible. Mark what's optional (or required) consistently, defer nice-to-have questions until they're needed, and never gate progress on data you could collect later or infer.
- Choose the right control for the job: pickers, steppers, toggles, and segmented choices for constrained values beat a free-text field that invites typos and then needs validation.

## Platform notes

- iOS, iPadOS: Lean on AutoFill for contacts, addresses, passwords, and codes; pick a hardware-appropriate virtual keyboard and a meaningful return key (Go, Search, Done) per field. On iPad, account for the floating and split keyboard and for hardware-keyboard users who expect Tab to move between fields.
- macOS: People expect full keyboard navigation, Tab order, and paste to just work; size fields to their expected content, and prefer steppers, pop-up menus, and pickers over free text for bounded values.
- watchOS: Typing is the last resort. Favor dictation, Scribble, preset replies, the digit-entry keypad, and values handed off from iPhone; keep any form to a few essential fields.
- tvOS: On-screen keyboards are slow and remote-driven, so minimize text entry hard — prefer selection, lean on username and password AutoFill, and let people continue setup on a nearby iPhone where possible.
- visionOS: Avoid long typing in space; favor dictation and selection, position input where eye-and-pinch targeting is comfortable, and surface AutoFill and one-time codes so people rarely reach for a virtual keyboard.

## Pitfalls

- Asking people to type information the device already knows or could AutoFill.
- A generic alphabetic keyboard on email, numeric, phone, or code fields.
- Untagged fields, so AutoFill and one-time-code suggestions never appear.
- Rejecting valid input over formatting (spaces in a card number, parentheses in a phone) instead of normalizing it.
- Error handling that surfaces only on submit, uses jargon, points nowhere specific, or clears the form.
- A wall of required fields, with required versus optional left ambiguous.

## References

- **Human Interface Guidelines:** [Entering data](https://developer.apple.com/design/human-interface-guidelines/entering-data)
- **Human Interface Guidelines:** [Keyboards](https://developer.apple.com/design/human-interface-guidelines/keyboards)
- **Human Interface Guidelines:** [Text fields](https://developer.apple.com/design/human-interface-guidelines/text-fields)
- **Human Interface Guidelines:** [Digit entry views](https://developer.apple.com/design/human-interface-guidelines/digit-entry-views)
- **WWDC:** [AutoFill everywhere (WWDC20)](https://developer.apple.com/videos/play/wwdc2020/10115/)
- **Documentation:** [UITextContentType](https://developer.apple.com/documentation/uikit/uitextcontenttype)

## See also

For building these forms — wiring `TextField` and secure fields, applying keyboard types and `textContentType`, handling one-time codes, and submission flow — see the SwiftUI and UIKit text-input code skills. For the validation and error-presentation language, pair with `hig-feedback` (alerts and inline messaging); for sign-in specifically, pair with the authentication and Sign in with Apple skills; and for layout of the form itself, see `hig-layout`.
