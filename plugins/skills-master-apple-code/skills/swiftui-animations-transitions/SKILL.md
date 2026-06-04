---
name: swiftui-animations-transitions
description: Guides SwiftUI motion design with implicit animation(value:), explicit withAnimation, springs and timing curves, view transitions, matchedGeometryEffect, PhaseAnimator and KeyframeAnimator, custom Animatable conformances, and Reduce Motion support. Use when adding or fixing animations, transitions, hero effects, multi-step or keyframe motion, or when animations stutter, fire unexpectedly, or ignore accessibility.
---

## When to use

Reach for this skill whenever a view should move, fade, scale, or reflow in response to state. That covers four broad jobs:

- **State-driven motion** — a value changes and the affected views should interpolate rather than snap.
- **Insertion and removal** — views appearing or leaving the hierarchy should transition instead of popping.
- **Continuity between layouts** — an element that exists in two places (grid cell to detail, collapsed to expanded) should travel between them.
- **Scripted motion** — self-running loops, attention pulses, or multi-track choreography that does not map to a single boolean.

Use it also when motion misbehaves: animations firing on the wrong property, the whole screen animating because a `withAnimation` is too broad, or motion that disregards the Reduce Motion setting.

## Core guidance

- **Prefer explicit `withAnimation` over implicit `.animation(_:value:)` for clarity.** Wrapping the exact state mutation scopes animation to that change. Reserve implicit `.animation(_:value:)` for a single property you always want animated, and never use the deprecated `.animation(_:)` with no value — it animates indiscriminately.
- **Default to springs.** A bare `withAnimation { ... }` already uses a spring. Tune with the presets `.smooth` (no bounce), `.snappy` (slight bounce), and `.bouncy` (more bounce) before reaching for raw `.spring(duration:bounce:)`. Use timing curves (`.easeInOut`, `.linear`) only for non-physical motion like progress bars.
- **Match transition direction to intent and pair with an identity change.** A `.transition` only runs when the view enters or leaves, which requires an `if`/`ForEach`/`id` change *inside* a `withAnimation`. Use `.asymmetric(insertion:removal:)` when in and out should differ; `.blurReplace` and `.push(from:)` (iOS 17+) read as deliberate swaps.
- **Use `matchedGeometryEffect` for continuity, not for two simultaneous copies.** Give the source and destination the same `id` in a shared `@Namespace`, and ensure only one is present at a time (guarded by `if`/conditional) so SwiftUI interpolates frame and position cleanly.
- **Pick the right multi-step tool.** `PhaseAnimator` cycles discrete phases where every effect animates together per step; `KeyframeAnimator` drives independent tracks with their own timing. Both run continuously or fire on a `trigger`.
- **Animate custom geometry with `Animatable`.** Conform a `Shape` or `ViewModifier` and expose `animatableData` (a `VectorArithmetic`, e.g. `AnimatablePair`) so SwiftUI can interpolate values it otherwise cannot, like an arc sweep or a counter.
- **Respect `accessibilityReduceMotion`.** Read it from the environment and downgrade large translate/scale motion to a cross-fade or no animation rather than disabling feedback entirely.

```swift
@Namespace private var ns
@State private var expanded = false

var body: some View {
    VStack {
        if expanded {
            DetailCard().matchedGeometryEffect(id: "card", in: ns)
        } else {
            Thumbnail().matchedGeometryEffect(id: "card", in: ns)
        }
    }
    .onTapGesture { withAnimation(.snappy) { expanded.toggle() } }
}
```

## Platform notes

- **iOS / iPadOS 17+** — Baseline for `PhaseAnimator`, `KeyframeAnimator`, spring presets, the `Transition` protocol, and `withAnimation(_:completionCriteria:_:completion:)`.
- **macOS** — All APIs are available; favor subtler springs and shorter durations since pointer-driven UIs feel sluggish with bouncy motion. Honor "Reduce motion" in System Settings via the same environment value.
- **watchOS** — Keep motion brief and battery-aware; long-running `PhaseAnimator` loops keep the screen active. Prefer trigger-based animations over perpetual ones.
- **tvOS** — Coordinate animation with the focus engine; animating focused-state changes should complement, not fight, the system focus effect.
- **visionOS** — Depth and scale read strongly; smaller translations feel larger. Test with Reduce Motion, which users enable more often in immersive contexts.

## Pitfalls

- **Animating an identity change without a transition.** Toggling an `if` inside `withAnimation` but giving no `.transition` yields a default fade; conversely, a `.transition` outside any animated state change never runs.
- **Over-broad `withAnimation`.** Wrapping a mutation that touches unrelated state animates everything downstream. Scope mutations tightly or use `.animation(_:value:)` on the specific view.
- **`matchedGeometryEffect` with both views present.** If source and destination render simultaneously you get a jump, not a morph. Keep exactly one visible per state.
- **Mismatched `id`s in `ForEach`.** Reused or index-based ids make SwiftUI animate the wrong rows on insert/delete. Use stable, unique identifiers.
- **Forgetting completion criteria.** `withAnimation`'s default `.logicallyComplete` fires before a spring's settling tail ends; pass `.removed` when chaining work that needs the motion fully stopped.
- **Ignoring Reduce Motion.** Shipping only large-translation transitions can cause discomfort and fails accessibility review.

## References

- **Documentation:** [Animations (SwiftUI)](https://developer.apple.com/documentation/swiftui/animations)
- **Documentation:** [PhaseAnimator](https://developer.apple.com/documentation/swiftui/phaseanimator)
- **Documentation:** [withAnimation(_:completionCriteria:_:completion:)](https://developer.apple.com/documentation/swiftui/withanimation(_:completioncriteria:_:completion:))
- **Human Interface Guidelines:** [Motion](https://developer.apple.com/design/human-interface-guidelines/motion)
- **WWDC:** [Explore SwiftUI animation (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10156/)
- **WWDC:** [Wind your way through advanced animations in SwiftUI (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10157/)

## See also

Pair this with a layout skill for understanding how `matchedGeometryEffect` interacts with stacks and grids, and with an accessibility skill for the broader Reduce Motion, VoiceOver, and Dynamic Type story. A gestures skill complements interactive, drag-driven animations, and a navigation skill is relevant when coordinating hero transitions across pushes and sheet presentations.
