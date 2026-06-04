---
name: swiftui-forms-controls
description: Use when building data-entry or settings UI in SwiftUI with Form, Section, Toggle, Picker, Slider, Stepper, DatePicker, ColorPicker, LabeledContent, or controlSize. Covers picker style selection, grouping and styling, control sizing, and deciding Form versus a custom layout.
---

## When to use

Reach for `Form` whenever you present grouped settings, preferences, or structured data entry that should feel native and adopt platform conventions automatically. A `Form` styles its rows, inset, and section headers to match the host platform, and embedded controls change appearance and behavior inside it (a `Picker` collapses to a navigable row on iOS, a `Toggle` aligns its label leading and switch trailing). Prefer a custom `VStack`/`ScrollView` layout only when you need bespoke spacing, multi-column arrangements, or visual treatment that the form chrome actively fights.

## Core guidance

- Do group related rows with `Section`, giving each a header and, where helpful, a footer for guidance text; an untitled `Section` still provides visual separation.
- Do pick a `Picker` style intentionally: `.menu` for compact single choices, `.segmented` for two to five short options, `.navigationLink` for long lists inside a `NavigationStack`, and `.wheel` only when continuous scrolling reads well.
- Do not hard-code control sizing per view; apply `.controlSize(_:)` to a `Section` or container so a whole cluster of controls scales together (`.mini` through `.extraLarge`).
- Do use `LabeledContent` for read-only label/value rows and for pairing a custom control with a label, rather than faking it with an `HStack` and `Spacer`.
- Do bind every control to source-of-truth state and keep formatting in the binding or a `format:` parameter; let `DatePicker` and `Stepper` own validation of their ranges via `in:`.
- Do not over-style: set `.formStyle(.grouped)` when you want the inset grouped look explicitly, but trust defaults first so the form tracks OS design changes.
- Do prefer `ColorPicker` and `DatePicker`'s component options (`.date`, `.hourAndMinute`) over building pickers by hand.

```swift
Form {
    Section("Reminder") {
        Toggle("Enabled", isOn: $isEnabled)
        DatePicker("Time", selection: $time, displayedComponents: .hourAndMinute)
        Picker("Repeat", selection: $cadence) {
            ForEach(Cadence.allCases) { Text($0.label).tag($0) }
        }
        LabeledContent("Next fire", value: nextFire, format: .dateTime)
    }
    .controlSize(.large)
}
```

## Platform notes

- iOS/iPadOS 26: controls render on Liquid Glass surfaces; `Slider` shows tick marks automatically when initialized with a `step`, and supports starting its fill from a non-leading neutral value. Bordered buttons default to a capsule shape.
- macOS: `Form` favors `.formStyle(.grouped)` or `.columns`; labels right-align in a leading column, so write concise labels and rely on `LabeledContent` alignment rather than manual padding.
- watchOS: forms scroll vertically with large touch targets; avoid `.segmented` and `.wheel` pickers and prefer `.navigationLink` or `.menu`.
- visionOS/tvOS: focus-driven selection changes which picker styles feel natural; `.navigationLink` and `.menu` are the most reliable, and `controlSize` interplays with the larger focus targets.

## Pitfalls

- Forgetting that a `Picker`'s `selection` type must exactly match each option's `.tag(_:)` type, or selection silently fails to highlight.
- Placing `.navigationLink` pickers outside a `NavigationStack`, which leaves them non-functional.
- Applying `.pickerStyle(.wheel)` to long lists on watchOS or in cramped rows, producing an unusable scroll target.
- Expecting custom backgrounds inside `Form` rows to look right; the grouped style owns row backgrounds, so use `.listRowBackground(_:)` instead of a raw `.background`.
- Nesting heavy custom layouts in a row and then fighting the form's default insets with negative padding.

## References

- **Documentation:** [Form](https://developer.apple.com/documentation/swiftui/form)
- **Documentation:** [Picker](https://developer.apple.com/documentation/swiftui/picker)
- **Documentation:** [LabeledContent](https://developer.apple.com/documentation/swiftui/labeledcontent)
- **Documentation:** [ControlSize](https://developer.apple.com/documentation/swiftui/controlsize)
- **Human Interface Guidelines:** [Toggles](https://developer.apple.com/design/human-interface-guidelines/toggles)
- **WWDC:** [Build a SwiftUI app with the new design (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/323/)

## See also

For navigation containers that host these forms, see the swiftui-navigation-stack skill. For the underlying state bindings driving each control, see the swiftui-state-management skill. For validating and formatting typed input, pair with a swiftui-textfield-input skill.
