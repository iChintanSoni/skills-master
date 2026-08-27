## SwiftUI animation review checklist

- [ ] Animation is scoped: `withAnimation` wraps only the intended state mutation, or `.animation(_:value:)` targets one property.
- [ ] No deprecated `.animation(_:)` (without a `value:`) remains in the codebase.
- [ ] Springs are the default; timing curves are reserved for non-physical motion (progress, scrubbing).
- [ ] Every `.transition` is paired with an identity change (`if`, `ForEach`, or `.id`) inside an animated mutation.
- [ ] Insertion and removal use `.asymmetric` where the two directions should differ.
- [ ] `matchedGeometryEffect` source and destination share one `id` in a shared `@Namespace` and never render at the same time.
- [ ] `ForEach` uses stable, unique ids so insert/delete animations target the correct rows.
- [ ] The right multi-step tool is chosen: `PhaseAnimator` for synchronized phases, `KeyframeAnimator` for independent tracks.
- [ ] Custom shapes/modifiers that need interpolation expose `animatableData`.
- [ ] `accessibilityReduceMotion` is read and large translate/scale motion downgrades to a cross-fade or no animation.
- [ ] Chained work that depends on motion fully stopping uses `.removed` completion criteria, not the default `.logicallyComplete`.
- [ ] Long-running loops are avoided or trigger-gated on watchOS/visionOS to limit battery and screen-on time.
