---
name: swiftui-drawing-canvas
description: "Guidance for custom 2D drawing in SwiftUI using Shape, Path, built-in shapes, fill/stroke/gradients, and Canvas with GraphicsContext, including TimelineView-driven animation. Use when drawing custom graphics, designing a reusable Shape, deciding between composing shapes and dropping into Canvas, or rendering many primitives or particle effects efficiently."
globs:
  - "**/*.swift"
tags: [swiftui, drawing, canvas, shape, animation]
x-skills-master:
  domain: apple
  class: code
  category: app-frameworks
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  requires:
    ios: "17"
    swift: "6.0"
  pairs_with: []
  sources:
    - https://developer.apple.com/documentation/swiftui/canvas
    - https://developer.apple.com/documentation/swiftui/graphicscontext
    - https://developer.apple.com/documentation/swiftui/drawing-and-graphics
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for this skill when you need custom 2D graphics that the standard view
toolbox cannot express: a bespoke badge outline, a progress ring, a chart
primitive, a signature pad, or a particle field. Two distinct tools cover the
space. Define a `Shape` (or build a `Path`) when the drawing is a discrete,
reusable, animatable view that participates in layout, accessibility, and
gestures. Drop into `Canvas` when you need immediate-mode drawing of many
elements, frame-by-frame redraws, or fine control over blend modes, layers,
and clipping that would be awkward to compose from individual views.

If you only need a rounded rectangle, capsule, gradient fill, or a stroked
border, prefer the built-in shapes and modifiers first — they are cheaper and
more accessible than hand-rolled drawing.

## Core guidance

- Do conform to `Shape` for reusable, animatable geometry: implement
  `path(in rect: CGRect) -> Path` and let SwiftUI supply the final size. Keep
  `path(in:)` pure and cheap — it can be called frequently.
- Do fill and stroke shapes with the view modifiers (`.fill`, `.stroke`,
  `.strokeBorder`) and feed them `Color`, `LinearGradient`, `AngularGradient`,
  or `MeshGradient`. Prefer `.strokeBorder` for outlines that must stay inside
  the shape's bounds rather than straddling the edge.
- Don't subclass or fight `Path` for static art — compose built-in shapes
  (`RoundedRectangle`, `Capsule`, `Circle`, `Ellipse`) in a `ZStack` when each
  piece needs its own fill, hit-testing, or transition.
- Do switch to `Canvas { context, size in ... }` once you are drawing dozens or
  hundreds of primitives, or redrawing every frame; one `Canvas` is a single
  view, so it avoids per-element view overhead.
- Do animate `Canvas` with `TimelineView(.animation)` and derive motion from the
  timeline's `Date`, not from stored mutable state — this keeps redraws driven
  by the display schedule and pauses when off-screen.
- Don't put accessibility-critical or interactive content only inside a
  `Canvas`; it draws pixels, not views. Provide labels via `accessibilityLabel`
  or overlay real views, and pass interactive SwiftUI views in through the
  `symbols` parameter when you need them composited.
- Do animate a custom shape by making a property part of `animatableData` so
  SwiftUI can interpolate the path across frames.

```swift
struct Ring: Shape {
    var progress: Double
    var animatableData: Double {
        get { progress }
        set { progress = newValue }
    }
    func path(in rect: CGRect) -> Path {
        Path { p in
            p.addArc(center: CGPoint(x: rect.midX, y: rect.midY),
                     radius: min(rect.width, rect.height) / 2,
                     startAngle: .degrees(-90),
                     endAngle: .degrees(-90 + 360 * progress),
                     clockwise: false)
        }
    }
}
```

## Platform notes

- `Canvas`, `GraphicsContext`, and `TimelineView` are available across iOS 15+,
  iPadOS, macOS 12+, watchOS 8+, tvOS 15+, and visionOS, so the iOS 17 baseline
  here is comfortable. `MeshGradient` requires the iOS 18 / macOS 15 cycle.
- On watchOS, favor `TimelineView` schedules that align with system refresh
  budgets; continuous `.animation` redraws are throttled when the wrist lowers,
  so design effects that degrade gracefully.
- In `Canvas`, text and images must be resolved against the context first via
  `context.resolve(_:)` (or drawn through `symbols`) so SwiftUI can size and
  color them with the environment in effect.
- On visionOS, custom 2D drawing renders on the window plane; for depth, layer
  drawing with the platform's 3D primitives rather than simulating it in 2D.

## Pitfalls

- Treating `Canvas` like a view tree: children inside a `Canvas` closure are not
  SwiftUI views, so view modifiers, transitions, and gestures do not apply to
  drawn elements. Hit-test with your own geometry or overlay real views.
- Animating a custom shape without `animatableData`: the path will jump between
  states instead of interpolating, because SwiftUI has nothing to tween.
- Doing heavy per-frame work (allocations, parsing, layout) inside the `Canvas`
  closure or `path(in:)`. Precompute and cache; the closure runs on every redraw.
- Stroking with `.stroke` when you meant `.strokeBorder` — `.stroke` centers the
  line on the path, so half the width spills outside the shape and gets clipped.
- Forgetting that `TimelineView(.animation)` keeps redrawing; pause it (switch to
  a static schedule or remove it) when the animation is not visible to save power.
- Reaching for `Canvas` for a handful of static shapes — you lose accessibility
  and layout integration for no performance gain.

## References

- **Documentation:** [Canvas](https://developer.apple.com/documentation/swiftui/canvas)
- **Documentation:** [GraphicsContext](https://developer.apple.com/documentation/swiftui/graphicscontext)
- **Documentation:** [Drawing and graphics](https://developer.apple.com/documentation/swiftui/drawing-and-graphics)
- **Documentation:** [Drawing paths and shapes (tutorial)](https://developer.apple.com/tutorials/swiftui/drawing-paths-and-shapes)
- **WWDC:** [Add rich graphics to your SwiftUI app (WWDC21)](https://developer.apple.com/videos/play/wwdc2021/10021/)
- **WWDC:** [Create custom visual effects with SwiftUI (WWDC24)](https://developer.apple.com/videos/play/wwdc2024/10151/)

## See also

For broader animation timing and transitions beyond drawing, see a SwiftUI
animation skill. For gradient styling and color treatments such as mesh
gradients, see a SwiftUI gradients or visual-effects skill. When custom drawing
needs to integrate charts, prefer a Swift Charts skill over hand-built shapes.
For GPU-bound effects layered on top of drawn content, see a SwiftUI Metal
shader skill.
