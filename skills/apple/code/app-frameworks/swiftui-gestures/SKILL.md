---
name: swiftui-gestures
description: "Guides building and composing SwiftUI gestures (tap, long press, drag, magnify, rotate) with @GestureState, priority and composition modifiers, hit testing, and accessibility. Use when adding touch or pointer interactions, combining recognizers, tracking transient gesture state, fixing hit-testing or gesture-conflict bugs, or making custom gestures accessible."
globs:
  - "**/*.swift"
tags: [swiftui, gestures, interaction, accessibility, hit-testing]
x-skills-master:
  domain: apple
  class: code
  category: app-frameworks
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  requires:
    ios: "17"
    swift: "6.0"
  pairs_with: [hig-gestures-design]
  sources:
    - https://developer.apple.com/documentation/swiftui/gestures
    - https://developer.apple.com/documentation/swiftui/composing-swiftui-gestures
    - https://developer.apple.com/documentation/swiftui/gesturestate
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for this skill when a view needs richer interaction than a `Button` provides: dragging, pinch-to-zoom, rotation, press-and-hold, or multi-step combinations. It also applies when two gestures fight each other, when taps land on the wrong area, or when transient drag offsets should snap back on release. For purely activating controls, prefer a standard button or `onTapGesture` — custom gestures add cost and accessibility obligations.

## Core guidance

- **Pick the modern recognizers.** Use `MagnifyGesture` and `RotateGesture` (iOS 17+); the older `MagnificationGesture` and `RotationGesture` are deprecated. Read pinch via `value.magnification` and rotation via `value.rotation` (an `Angle`).
- **Use `@GestureState` for transient, in-flight values.** It updates inside `.updating` and auto-resets to its initial value the instant the gesture ends, so you never leak a half-finished drag. Commit final state to plain `@State` in `.onEnded`.
- **Compose deliberately.** `simultaneously(with:)` runs both at once (pinch + rotate), `sequenced(before:)` requires the first to succeed before the second begins (long-press then drag), and `exclusively(before:)` recognizes only one. Don't nest more than two levels — it gets unreadable fast.
- **Reach for priority modifiers when defaults conflict.** `highPriorityGesture` wins over the view's own gestures (e.g. overriding a `ScrollView`); `simultaneousGesture` lets your gesture coexist with built-in ones rather than blocking them.
- **Make the hit area explicit.** Transparent or empty regions are not tappable by default. Apply `contentShape(.interaction, …)` (or `.contentShape(Rectangle())`) so the whole frame, including padding and clear space, receives touches.
- **Don't read raw frame coordinates without anchoring.** Gesture values report locations in the gesture's coordinate space; convert via `.gesture(..., including:)` and `coordinateSpace` rather than guessing.
- **Always pair a custom gesture with an accessibility action.** A drag or long-press is invisible to VoiceOver; expose the same outcome through `accessibilityAction` so assistive-tech users aren't locked out.

```swift
struct DraggableCard: View {
    @GestureState private var drag: CGSize = .zero
    @State private var offset: CGSize = .zero

    var body: some View {
        RoundedRectangle(cornerRadius: 16)
            .frame(width: 200, height: 120)
            .offset(x: offset.width + drag.width, y: offset.height + drag.height)
            .gesture(
                DragGesture()
                    .updating($drag) { value, state, _ in state = value.translation }
                    .onEnded { offset.width += $0.translation.width
                               offset.height += $0.translation.height }
            )
    }
}
```

## Platform notes

- **iOS / iPadOS:** Multi-touch gestures (`MagnifyGesture`, `RotateGesture`) need two fingers; test on device, not just Simulator pinch emulation. Apple Pencil hover and pointer events flow through the same modifiers on iPadOS.
- **macOS:** Pinch and rotate map to trackpad gestures; many drag interactions also want pointer hover feedback via `contentShape(.hoverEffect, …)` plus `onHover`.
- **watchOS:** Screen real estate is tiny — favor `TapGesture`, `LongPressGesture`, and the Digital Crown over multi-finger gestures, which are impractical.
- **tvOS:** There is no touch surface on the remote; focus-driven interaction and `onMoveCommand`/`onPlayPauseCommand` usually replace direct gestures.
- **visionOS:** Indirect pinch (eyes + hand) drives standard gestures automatically. For spatial input use `SpatialEventGesture`, and prefer hover effects so users know what is targetable before they pinch.

## Pitfalls

- **Forgetting `contentShape` on padded or `Spacer`-filled views**, so taps near the visible content silently miss. Set the interaction shape explicitly.
- **Mutating `@State` directly inside `.updating`.** That closure only writes to the `GestureState` binding; persistent changes belong in `.onEnded`.
- **Letting a custom gesture swallow scrolling.** Adding a `DragGesture` inside a `ScrollView` without `simultaneousGesture` can break scroll; coexist instead of override unless that is the intent.
- **Assuming composition order doesn't matter.** `a.sequenced(before: b)` and `b.sequenced(before: a)` behave very differently; the receiver must recognize first.
- **Shipping gesture-only controls.** Pinch-to-zoom or swipe-to-delete with no `accessibilityAction` equivalent fails VoiceOver and Switch Control users.

## References

- **Documentation:** [Gestures](https://developer.apple.com/documentation/swiftui/gestures)
- **Documentation:** [Composing SwiftUI gestures](https://developer.apple.com/documentation/swiftui/composing-swiftui-gestures)
- **Documentation:** [GestureState](https://developer.apple.com/documentation/swiftui/gesturestate)
- **Documentation:** [MagnifyGesture](https://developer.apple.com/documentation/swiftui/magnifygesture)
- **Human Interface Guidelines:** [Gestures](https://developer.apple.com/design/human-interface-guidelines/gestures)
- **WWDC:** [Meet SwiftUI for spatial computing (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10109/)

## See also

Pair this with a SwiftUI accessibility skill when wiring up `accessibilityAction` equivalents for custom gestures, with a SwiftUI animation skill to spring transient drag and scale values back into place on release, and with a visionOS spatial-interaction skill when moving from indirect pinches to `SpatialEventGesture` and hand tracking.
