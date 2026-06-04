---
name: swiftui-focus
description: Manages keyboard and focus-engine focus in SwiftUI with the FocusState property wrapper, focused(_:equals:), default focus, focus sections, focusable, and onKeyPress. Use when wiring text-field focus and tab order, dismissing the keyboard programmatically, setting initial focus, grouping focus regions, or building focus-driven navigation on tvOS and visionOS.
---

## When to use

Reach for these APIs when you need to read or move focus rather than just react to it. Common cases: advancing through a login or address form, dismissing the software keyboard from a button or gesture, setting which control is focused when a screen appears, keeping arrow-key and Tab navigation predictable on Mac and iPad with a hardware keyboard, and steering the directional focus engine on tvOS and visionOS. If you only need a single field to become first responder, a one-shot `@FocusState` Bool is enough; reach for an enum once two or more fields compete for focus.

## Core guidance

- Prefer an enum-typed, optional `@FocusState` over several Bool flags. One source of truth (`FocusField?`) makes "who is focused" unambiguous and lets you compare, advance, and clear focus with a single assignment.
- Bind each control with `focused($field, equals: .someCase)`; use the bare `focused($isOn)` overload only for a lone Boolean field. Reading the binding tells you what is focused; writing it moves focus.
- Dismiss the keyboard by setting the state to `nil` (`focusedField = nil`), not by toggling a Bool. Do it inside the relevant action or a `.toolbar` "Done" button rather than fighting the responder chain.
- Set initial focus with `.defaultFocus($field, .username)` on the container, or `onAppear`-assign the state. Avoid assigning focus in `init` or synchronously during the first body pass, where it is unreliable; assignment after appearance is the safe path.
- Group related controls with `.focusSection()` so the focus engine treats them as one cohort. This fixes "focus jumps across the screen" on tvOS and with keyboard navigation, and pairs with `.prefersDefaultFocus(_:in:)` to pick the entry point.
- Make custom views participate via `.focusable()` (optionally `.focusable(interactions:)` for `.activate` and `.edit`), then handle hardware keys with `.onKeyPress`, returning `.handled` to consume the event or `.ignored` to let it propagate.
- Drive focus changes through observable state, and on enum-driven advancement compute the next case explicitly rather than relying on view order.

```swift
enum Field { case email, password }

@FocusState private var focus: Field?

SecureField("Password", text: $password)
    .focused($focus, equals: .password)
    .onSubmit { focus = nil }            // submit dismisses keyboard
    .onKeyPress(.escape) { focus = nil; return .handled }
```

## Platform notes

- iOS / iPadOS: `@FocusState` governs the software keyboard and hardware-keyboard Tab order. Setting state to `nil` resigns first responder and dismisses the keyboard. A `.toolbar { ToolbarItem(placement: .keyboard) }` "Done" button is the idiomatic dismissal affordance.
- macOS: focus follows the key-view loop; `.focusable()` and `.onKeyPress` let custom controls join Tab navigation and respond to keys. Respect the system focus ring unless you intentionally call `.focusEffectDisabled()`.
- tvOS: navigation is the directional focus engine, not taps. `.focusSection()`, `.prefersDefaultFocus(_:in:)`, and `@FocusState` shape where the Siri Remote can move. `.focusable()` is required for non-control views to be reachable.
- visionOS: focus reflects eye gaze and indirect pinch. The same `focused`/`focusSection` vocabulary applies; design so default focus and section boundaries feel natural to look-and-pinch input.
- watchOS: use `@FocusState` to route Digital Crown and field focus; keep the focusable set small given the screen size.

## Pitfalls

- Using a pile of `@FocusState var aFocused: Bool` flags. They drift out of sync and make "move to next field" awkward; consolidate into one optional enum.
- Assigning focus too early (in `init` or the first synchronous body evaluation). Move it to `onAppear` or a state-driven `.task`; otherwise it silently fails to stick.
- Expecting `focused(_:equals:)` to work without the matching `@FocusState`. The binding and the wrapper must share the same type, and every participating control needs its own `focused` modifier.
- Forgetting that `onKeyPress` only fires while the view has focus. Combine it with `.focusable()` (and often an explicit focus assignment) or the key handler appears dead.
- Returning the wrong `KeyPress.Result`: `.ignored` lets the event bubble to ancestors and system shortcuts, `.handled` stops it. Defaulting everything to `.handled` can swallow Tab and arrow navigation.
- Skipping `.focusSection()` on tvOS, then wondering why focus teleports across unrelated controls. Sections (plus `prefersDefaultFocus`) are how you constrain engine movement.

## References

- **Documentation:** [FocusState](https://developer.apple.com/documentation/swiftui/focusstate)
- **Documentation:** [focused(_:equals:)](https://developer.apple.com/documentation/swiftui/view/focused(_:equals:))
- **Documentation:** [onKeyPress(_:action:)](https://developer.apple.com/documentation/swiftui/view/onkeypress(_:action:))
- **Documentation:** [prefersDefaultFocus(_:in:)](https://developer.apple.com/documentation/swiftui/view/prefersdefaultfocus(_:in:))
- **WWDC:** [The SwiftUI cookbook for focus (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10162/)
- **WWDC:** [Direct and reflect focus in SwiftUI (WWDC21)](https://developer.apple.com/videos/play/wwdc2021/10023/)

## See also

Pair this with a forms-and-text-input skill for validation and submit handling around focused fields, a keyboard-and-toolbar skill for the "Done" dismissal affordance and input accessory views, and a tvOS navigation skill for deeper coverage of the focus engine, focus sections, and remote-driven layout. For accessibility-driven focus, see a VoiceOver and accessibility-focus skill covering AccessibilityFocusState.
