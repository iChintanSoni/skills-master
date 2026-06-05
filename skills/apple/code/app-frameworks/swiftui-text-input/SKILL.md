---
name: swiftui-text-input
description: "Guidance for building SwiftUI text entry with TextField, TextEditor, and SecureField. Use when accepting names, emails, passwords, numbers, dates, or multiline notes; when adding format/parse value binding, validation, focus management, keyboard and content types, submit handling, or text selection. Triggers include keyboardType, textContentType, FocusState, submitLabel, onSubmit, axis vertical, and TextSelection."
globs:
  - "**/*.swift"
tags: [swiftui, textfield, forms, keyboard, focus]
x-skills-master:
  domain: apple
  class: code
  category: app-frameworks
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  requires:
    ios: "17"
    swift: "6.0"
  pairs_with: [hig-text-fields]
  sources:
    - https://developer.apple.com/documentation/swiftui/textfield
    - https://developer.apple.com/documentation/swiftui/texteditor
    - https://developer.apple.com/documentation/swiftui/securefield
    - https://developer.apple.com/documentation/swiftui/textselection
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for this skill whenever a view collects typed input: a single short value (TextField), a private credential (SecureField), or longer freeform prose (TextEditor). It covers binding to a `String` versus binding to a typed value through a format style, validation, keyboard and autofill hints, focus orchestration across several fields, return-key behavior, and reading or writing the user's selection. If you only need read-only selectable display, see the `swiftui-text` skill instead; this skill is about editable input.

## Core guidance

- **Bind to a typed value, not a stringly-typed buffer, when the model is non-text.** `TextField("Price", value: $amount, format: .currency(code: "USD"))` parses and formats for you. The field commits the parsed value on submit or focus loss, and reverts the display if parsing fails, so you avoid hand-rolled number scrubbing.
- **Do drive validation from state, not from mutating the binding inside `onChange`.** Compute a derived `isValid` and surface it (disabled submit, inline message). Re-writing the bound `String` mid-edit fights the cursor and corrupts selection.
- **Always set `textContentType` and `keyboardType` together.** `.emailAddress`, `.username`, `.newPassword` unlock AutoFill and the right keyboard; pair password fields with `.textInputAutocapitalization(.never)` and `.autocorrectionDisabled()`.
- **Manage focus with a single `@FocusState` keyed by an enum**, then advance fields in `onSubmit` by reassigning the focus value. One source of truth beats one `Bool` per field.
- **Use `submitLabel(_:)` to label the return key** (`.next`, `.search`, `.done`) and handle `onSubmit` for commit logic — don't rely on the deprecated `onCommit` closure.
- **Make a growing field with `axis: .vertical`** plus a `lineLimit` range; reach for `TextEditor` only when you need a true scrolling multi-line editor or rich `AttributedString` content.
- **Don't reimplement masking** — `SecureField` already obscures input and disables features that would leak the value.

```swift
enum Field { case email, password }
@FocusState private var focus: Field?

TextField("Email", text: $email)
    .textContentType(.emailAddress)
    .keyboardType(.emailAddress)
    .textInputAutocapitalization(.never)
    .submitLabel(.next)
    .focused($focus, equals: .email)
    .onSubmit { focus = .password }
```

## Platform notes

- **iOS / iPadOS:** Keyboard type, content type, and `submitLabel` shape the on-screen keyboard. The system manages the keyboard avoidance inset; scroll containers reflow automatically.
- **macOS:** `keyboardType` and `submitLabel` are no-ops (hardware keyboard). Tab traversal and pointer-based range selection come for free; `textInputSuggestions` offers inline autocomplete.
- **watchOS / tvOS:** Tapping a field invokes the system text-entry experience (dictation, scribble, grid keyboard) rather than an inline keyboard; keep fields short and lean on content types.
- **visionOS:** Fields summon the floating keyboard; ensure adequate hit targets and avoid cramped multi-field rows.
- **Selection:** binding a `TextSelection` to TextField/TextEditor (read and write the user's selection) requires iOS 18 / macOS 15 or later; gate it with availability if your minimum is iOS 17.

## Pitfalls

- A `value:`/`format:` field shows the *last valid* value after a bad edit — users may not notice their entry was rejected. Surface validity explicitly.
- With `axis: .vertical`, Return inserts a newline, so `onSubmit` never fires from the keyboard; provide an explicit submit affordance.
- Forgetting `.textContentType(.newPassword)` on a sign-up password field disables the strong-password suggestion and reuse warnings.
- Reassigning `@FocusState` inside `onChange(of: text)` mid-keystroke can dismiss the keyboard unexpectedly; only move focus on discrete events.
- `.textInputAutocapitalization` and `.autocorrectionDisabled()` are inheritable view modifiers — applied too high in the tree they silently affect every field below.

## References

- **Documentation:** [TextField](https://developer.apple.com/documentation/swiftui/textfield)
- **Documentation:** [SecureField](https://developer.apple.com/documentation/swiftui/securefield)
- **Documentation:** [TextEditor](https://developer.apple.com/documentation/swiftui/texteditor)
- **Documentation:** [TextSelection](https://developer.apple.com/documentation/swiftui/textselection)
- **Human Interface Guidelines:** [Text fields](https://developer.apple.com/design/human-interface-guidelines/text-fields)
- **WWDC:** [Cook up a rich text experience in SwiftUI with AttributedString (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/280/)
- **Sample Code:** [Building rich SwiftUI text experiences](https://developer.apple.com/documentation/swiftui/building-rich-swiftui-text-experiences)

## See also

For non-editable, selectable text rendering and `AttributedString` styling, see the `swiftui-text` skill. For wrapping fields in a `Form` with validation summaries and sections, see `swiftui-forms`. For the parse/format value pipeline in depth, see `swift-formatstyle`. For coordinating the keyboard and safe-area insets around scrolling input, see `swiftui-keyboard-handling`.
