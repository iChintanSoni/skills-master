---
name: swiftui-accessibility
description: "Covers SwiftUI accessibility modifiers in code: labels, values, hints, traits, grouping with accessibilityElement(children:), hiding, custom actions, sort priority, and Dynamic Type. Use when adding or auditing VoiceOver/assistive-technology support, fixing mis-read controls, grouping or hiding elements, exposing custom actions, or making text and metrics scale."
---

## When to use

Reach for these modifiers when a SwiftUI control reads incorrectly under VoiceOver, Voice Control, or Switch Control, or when the layout produces too many separate swipe stops. Typical triggers: an icon-only button announces nothing, a custom rating view exposes five taps instead of one summary, a card's pieces should be read as a sentence, decorative chrome interrupts navigation, or text and spacing fail to grow at large Dynamic Type sizes. The goal is a clean accessibility tree where every meaningful element has a label, a role, and—where relevant—a value and an action.

## Core guidance

- Do label by meaning, not appearance. Give image-only and shape-based controls an `accessibilityLabel` that says what they do ("Add to favorites"), and reserve `accessibilityValue` for the changing state (a slider's current number, a toggle's on/off). Keep labels terse; assistive tech adds the role itself.
- Do put intent in the label and consequences in the hint. `accessibilityHint` is spoken after a delay and is easily disabled by users, so never hide essential information there. Skip the hint entirely when the label already makes the action obvious.
- Do collapse compound views with `accessibilityElement(children: .combine)` so a stack reads as one element, or `.ignore` plus your own label/value/traits when you want full manual control. Use `.contain` (the default) only when each child is independently meaningful.
- Don't fake roles with text. Add `accessibilityAddTraits(.isButton)`, `.isHeader`, `.isToggle`, or `.isSelected` so navigation rotors and gestures behave correctly, and remove inherited traits with `accessibilityRemoveTraits` when you replace a control's semantics.
- Do hide purely decorative views with `accessibilityHidden(true)`, and surface non-visual operations through `accessibilityAction(named:)` rather than requiring a drag or long-press that assistive users cannot perform.
- Do let text scale: prefer semantic fonts over fixed point sizes, drive custom paddings and image dimensions with `@ScaledMetric`, and read `dynamicTypeSize` from the environment to switch to a stacked layout at accessibility sizes instead of clipping.
- Don't reorder reading flow with layout hacks; set `accessibilitySortPriority` (higher reads first within a container) when visual order and logical order diverge.

```swift
HStack {
    Image(systemName: "bell.badge.fill")
    Text("Alerts")
    Spacer()
    Text("3 new")
}
.accessibilityElement(children: .combine)
.accessibilityAddTraits(.isButton)
.accessibilityHint("Opens your notifications")
.accessibilityAction(named: "Mark all read") { markAllRead() }
```

## Platform notes

- VoiceOver is the reference reader on every platform, but interaction differs: tvOS adds focus-driven navigation, watchOS leans on the Digital Crown and rotor, and visionOS surfaces elements for eyes-and-hands plus VoiceOver, so verify custom actions are reachable without a pointer.
- On macOS the same modifiers feed VoiceOver and Full Keyboard Access; ensure focusable custom controls expose `.isButton`/`.isToggle` traits so keyboard users get correct activation.
- Dynamic Type ranges up to the accessibility sizes on iOS, iPadOS, and watchOS; design and test against `.accessibility5`. Use `dynamicTypeSize(...partialRangeFrom:)` to clamp a floor only when truncation is genuinely unavoidable, never to cap growth across the whole UI.
- visionOS and Catalyst inherit SwiftUI's accessibility tree, but re-test grouped elements there because hit regions and hover translate differently than on touch.

## Pitfalls

- Combining or ignoring children silently drops the labels of any child you didn't account for; after using `.combine`/`.ignore`, sweep the view with VoiceOver to confirm nothing important went missing.
- Putting critical text in `accessibilityHint` or in a `help(...)` tooltip means many users never hear it—hints are delayed and optional.
- Forgetting `accessibilityRemoveTraits` when you re-skin a control leaves stale roles (an old "button" trait on something that is now a header), confusing rotor navigation.
- Hard-coded frames, fixed-point fonts, and `lineLimit(1)` on body text clip at large Dynamic Type sizes; pair size limits with `minimumScaleFactor` or an adaptive layout instead.
- Over-applying `accessibilityHidden(true)` to a container hides its children too—hide only the decorative leaf, not the element a user needs to reach.
- A high `accessibilitySortPriority` only reorders within the same container, so wrap the relevant subviews in one accessibility container before expecting the order to change.

## References

- **Documentation:** [SwiftUI accessibility modifiers](https://developer.apple.com/documentation/swiftui/view-accessibility)
- **Documentation:** [Accessibility fundamentals](https://developer.apple.com/documentation/swiftui/accessibility-fundamentals)
- **Documentation:** [Accessible descriptions (labels, values, hints)](https://developer.apple.com/documentation/swiftui/accessible-descriptions)
- **Documentation:** [DynamicTypeSize](https://developer.apple.com/documentation/swiftui/dynamictypesize)
- **Human Interface Guidelines:** [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- **WWDC:** [Catch up on accessibility in SwiftUI (WWDC24)](https://developer.apple.com/videos/play/wwdc2024/10073/)

## See also

Pair this with the hig-accessibility design skill for the perceivable/operable principles, contrast, and motion guidance that inform which labels and structure to expose. The swiftui-layout-fundamentals and swiftui-text-and-typography skills cover the adaptive layouts and semantic fonts that make Dynamic Type support hold up at large sizes.
