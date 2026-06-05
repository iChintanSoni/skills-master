---
name: swiftui-sheets
description: Implements modal sheets in SwiftUI with .sheet, presentation detents, and programmatic dismissal. Use when presenting a sheet, setting partial/large detents, driving presentation from optional item state, or wiring a Cancel/Done flow. Pairs with the HIG sheets design skill.
globs:
  - "**/*.swift"
tags: [swiftui, sheets, modal, presentation, detents]
x-skills-master:
  domain: apple
  class: code
  category: app-frameworks
  platforms: [ios, ipados, macos, visionos]
  requires:
    ios: "16"
    swift: "6.0"
  pairs_with: [hig-sheets]
  sources:
    - https://developer.apple.com/documentation/swiftui/view/sheet(ispresented:ondismiss:content:)
    - https://developer.apple.com/documentation/swiftui/presentationdetent
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Use when implementing a modal sheet in SwiftUI — presenting it, sizing it with detents, and dismissing it. For the design judgment of *whether* a sheet is the right container and how it should behave, use the paired `hig-sheets` skill first.

## Core guidance

- Present from a `Bool` with `.sheet(isPresented:)` for a single fixed sheet; present from optional model state with `.sheet(item:)` when the sheet's content depends on which object was selected. Prefer `item:` for data-driven sheets so the content always matches the selection.
- Dismiss from inside the sheet with `@Environment(\.dismiss)` rather than flipping the binding from afar; it keeps the sheet self-contained.
- Offer partial heights with `.presentationDetents([.medium, .large])`, and bind `.presentationDetents(_, selection:)` when you need to read or drive the current detent.
- For a form-style sheet, wrap content in a `NavigationStack` and put Cancel/Done in the toolbar; confirm before discarding unsaved edits instead of relying on swipe-to-dismiss.
- Keep sheet content in its own `View`; pass in only what it needs so it stays previewable and testable.

## Platform notes

`.sheet` and `presentationDetents` are available iOS 16+/macOS 13+. On macOS a sheet attaches to its window; on iPad and Mac, consider whether a popover or separate window fits better (the design call lives in `hig-sheets`). visionOS renders sheets within the scene — keep them shallow.

## Pitfalls

- Driving a data-dependent sheet from a `Bool` and a separate `selected` variable, which races and shows stale content; use `.sheet(item:)`.
- Mutating the presentation binding from the parent to dismiss, instead of `@Environment(\.dismiss)`.
- Forgetting that swipe-to-dismiss can drop unsaved work — gate it with a confirmation.

## References

- **Documentation:** [presentationDetents(_:)](https://developer.apple.com/documentation/swiftui/view/presentationdetents(_:))
- **Documentation:** [sheet(isPresented:onDismiss:content:)](https://developer.apple.com/documentation/swiftui/view/sheet(ispresented:ondismiss:content:))
- **Human Interface Guidelines:** [Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets)
- **WWDC:** [What's new in SwiftUI (WWDC22)](https://developer.apple.com/videos/play/wwdc2022/10052/)

## See also

- Design: `hig-sheets`
- Apple: `View.sheet(isPresented:...)`, `presentationDetents` (see sources).
