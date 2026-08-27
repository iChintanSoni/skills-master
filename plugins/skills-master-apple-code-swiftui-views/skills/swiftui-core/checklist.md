# swiftui-core — checklist

- [ ] `body` is pure: no network calls, mutations, `print`, or cached state — assume it runs many times in any order.
- [ ] Each view stays a small, immutable value type; expensive setup lives outside `body`, not inside it.
- [ ] Oversized closures are split into named subviews or `@ViewBuilder` computed properties, not methods with heavy `some View` generics.
- [ ] Subviews are extracted to isolate invalidation (a frequently updating fragment becomes its own type), not merely for cosmetic tidiness.
- [ ] Trivial one-line fragments are left inline; over-extraction that scatters layout intent is avoided.
- [ ] A subview reads only the model properties it needs, so observation-driven invalidation stays narrow.
- [ ] Container choice matches intent: eager `VStack`/`HStack`/`ZStack` for a small known set; `Grid` for cross-row/column alignment of cheap content.
- [ ] Lazy stacks and lazy grids appear only inside a scrolling context where deferring off-screen children actually pays off.
- [ ] Modifier order is deliberate: padding/background/frame/clipShape/gesture compose positionally and were checked for the intended result.
- [ ] System materials (Liquid Glass) are applied via standard background/material modifiers, with their position relative to padding verified for the right glass extent.
- [ ] `@ViewBuilder` is used for any closure listing multiple children or holding `if`/`switch` content.
- [ ] Previews use realistic sample data, not placeholder strings or empty models.
- [ ] Multiple previews cover dark mode, large Dynamic Type, and compact width rather than a single default canvas.
- [ ] A representative device/simulator is confirmed per target (macOS and visionOS resizing exercises flexible sizing harder than a fixed phone).
- [ ] Layout alignment is re-verified on macOS and visionOS where window and volume resizing stress flexible sizing.
