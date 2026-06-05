---
name: choosing-graphics-tech
description: "Decision router for picking an Apple graphics technology in the 2026 (OS 26) cycle: SwiftUI shapes and Canvas for UI drawing, Core Graphics and Core Image for 2D and image processing, SpriteKit for 2D games, RealityKit for new 3D and AR (SceneKit is now soft-deprecated), and Metal with MetalFX for custom GPU work. Use when starting graphics, drawing, image-processing, game, or 3D work and choosing a framework, when weighing whether to drop from a high-level API to Metal, or when deciding whether to migrate a SceneKit project to RealityKit."
---

## When to use

Reach for this skill when a feature needs drawing, image processing, a 2D game, 3D or AR content, or custom GPU work, and the framework choice is not obvious. It applies when deciding whether SwiftUI alone suffices, when an effect tempts a drop to Metal, and when a SceneKit codebase faces the RealityKit migration question. It routes you to the right code skill rather than teaching any one framework.

## Core guidance

- Start as high as the task allows, then drop down only when the level above cannot meet a concrete requirement. Most "graphics" work is really UI drawing that SwiftUI shapes, gradients, and `Canvas` handle without a heavier framework.
- For dynamic 2D drawing in a SwiftUI view (charts, custom controls, immediate-mode strokes), use `Canvas` or `Shape`; reach for Core Graphics only when you need offscreen rendering, PDF output, or to draw inside a UIKit or AppKit view.
- For image processing (filters, color adjustments, compositing, custom kernels), use Core Image with a Metal-backed `CIContext`. Do not hand-roll pixel loops on the CPU or jump straight to Metal for effects Core Image already ships.
- For 2D games and sprite-based animation with physics and particles, use SpriteKit; it remains supported and is far less code than a Metal renderer. Embed an `SKScene` in SwiftUI via `SpriteView`.
- For new 3D and AR, choose RealityKit. SceneKit is soft-deprecated as of the 26 cycle (critical-bug fixes only, no new features); keep shipping SceneKit apps, but do not start new ones on it.
- Drop to Metal (and `MetalFX` for upscaling) only for custom renderers, real-time GPU compute, or effects no framework provides. Try a SwiftUI Metal shader effect or a Core Image kernel before writing a full pipeline.
- Don't equate "needs the GPU" with "needs Metal": Canvas, Core Image, SpriteKit, and RealityKit are already GPU-accelerated.

```swift
// UI drawing: stay in SwiftUI before reaching for a lower-level framework.
Canvas { context, size in
    var path = Path()
    path.addEllipse(in: CGRect(origin: .zero, size: size))
    context.fill(path, with: .color(.accentColor))
}
.frame(width: 80, height: 80)
```

## Platform notes

- iOS and iPadOS: every layer is available; SpriteKit, Core Image, RealityKit, and Metal all run, and ARKit pairs with RealityKit for world-tracked content.
- macOS: same stack; Core Graphics underpins AppKit drawing, and Metal targets discrete and Apple-silicon GPUs alike.
- visionOS: RealityKit is the 3D engine for volumetric and immersive content; there is no SpriteKit or SceneKit equivalent for spatial scenes. SwiftUI Canvas still drives 2D drawing in windows.
- tvOS: RealityKit now ships here (new in the 25 cycle), so 3D apps and games can target Apple TV; SpriteKit and Metal are also available.
- watchOS: keep it lightweight, SwiftUI shapes and Canvas; the heavier 3D and game frameworks are not the right fit.

## Pitfalls

- Reaching for Metal first. A custom pipeline is weeks of work and easy to get wrong; exhaust Canvas, Core Image, SpriteKit, and RealityKit before committing.
- Starting a new 3D project on SceneKit out of familiarity, then inheriting a soft-deprecated dependency with no roadmap.
- Using Core Graphics for animated per-frame UI drawing where `Canvas` is simpler and already GPU-backed.
- Building a 2D game by compositing SwiftUI views instead of using SpriteKit's scene graph, update loop, and physics.
- Assuming a SceneKit-to-RealityKit port is a rename: the model shifts from a node graph to an entity-component-system, and assets move to USD.

## References

- **Documentation:** [RealityKit](https://developer.apple.com/documentation/realitykit)
- **Documentation:** [SwiftUI drawing and graphics](https://developer.apple.com/documentation/swiftui/drawing-and-graphics)
- **Documentation:** [Core Graphics](https://developer.apple.com/documentation/coregraphics)
- **Documentation:** [SpriteKit](https://developer.apple.com/documentation/spritekit)
- **Documentation:** [Metal](https://developer.apple.com/metal/)
- **WWDC:** [Bring your SceneKit project to RealityKit (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/288/)

## See also

For the chosen path, route into the matching code skill: `swiftui-core` for shapes and Canvas, `core-image` for image filter graphs, `spritekit` for 2D games, `realitykit` for 3D and AR, `scenekit` when maintaining or migrating legacy scenes, and `metal` for custom GPU rendering and compute. See `arkit` when 3D content must track the real world, and `choosing-ui-toolkit` when the question is which UI toolkit owns the surrounding screen.
