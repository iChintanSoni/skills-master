---
name: scenekit
description: "Builds 3D scenes with SceneKit: SCNScene node graphs, geometry, materials, lights, cameras, asset loading, physics, animation, and hit testing, embedded in UIKit/AppKit or SwiftUI. Use when adding lightweight 3D content, viewers, or simple games on Apple platforms, working with .scn/.dae/USDZ assets via SceneKit, or deciding whether to stay on SceneKit or migrate to RealityKit."
---

## When to use

Reach for SceneKit when you need lightweight 3D content inside an otherwise 2D app: a product viewer, a simple game, data visualization, or an interactive model. It is a high-level, retained-mode scene graph, so you describe *what* the scene contains rather than issuing draw calls. It excels at quick results from `.scn`, `.dae`, or USDZ assets with built-in physics, animation, and physically based materials.

Be aware of its status. As of the 26 cycle SceneKit is in maintenance mode — it still ships and runs everywhere, but receives critical-bug fixes only and gains no new features. For greenfield work that targets visionOS, wants an entity-component architecture, or needs SwiftUI-native 3D, prefer RealityKit. Choose SceneKit when you already have SceneKit assets/code or need a small, self-contained 3D surface on iOS/macOS/tvOS.

## Core guidance

- **Build a tree of `SCNNode`s.** Every node owns a `transform` (position/rotation/scale) and may attach one of `geometry`, `light`, or `camera`. Add to `scene.rootNode`; child transforms compose with the parent.
- **Load, don't hand-build, art.** Use `SCNScene(named:)` for a bundled asset, or `SCNReferenceNode` to defer loading a sub-scene. Reserve programmatic primitives (`SCNBox`, `SCNSphere`) for placeholders and gizmos.
- **Materials live on geometry.** Set `material.lightingModel = .physicallyBased` and feed `diffuse`/`metalness`/`roughness/normal` contents (color, image, or `SCNMaterialProperty`). Don't expect realistic results from the default `.blinn` model.
- **Always add light.** A scene with no lights renders flat or black except for `.constant` materials. Add a `.directional` or `.omni` light node plus the scene's ambient, or set `autoenablesDefaultLighting` on the view while prototyping.
- **Don't animate `transform` in a tight loop.** Prefer `SCNAction`, implicit `SCNTransaction` animations, or `CAAnimation`; SceneKit interpolates on the render thread. Use the per-frame `SCNSceneRendererDelegate` only for game logic.
- **Hit test through the renderer, not geometry.** Convert a gesture point and call `hitTest(_:options:)` on the `SCNView`; read the first `SCNHitTestResult.node`. Don't walk the node tree yourself.
- **Mutate the graph on the main thread.** Node, geometry, and physics changes are not thread-safe; wrap background-built results in a `SCNTransaction` or hop to the main actor before inserting.

```swift
// Minimal viewer node: PBR material + a light, ready to add to rootNode.
let node = SCNNode(geometry: SCNSphere(radius: 0.5))
let mat = node.geometry!.firstMaterial!
mat.lightingModel = .physicallyBased
mat.diffuse.contents = UIColor.systemTeal
mat.roughness.contents = 0.3

let light = SCNNode()
light.light = SCNLight()
light.light!.type = .directional
light.eulerAngles = SCNVector3(-Float.pi / 3, 0, 0)
scene.rootNode.addChildNode(node)
scene.rootNode.addChildNode(light)
```

## Platform notes

- **iOS/iPadOS/tvOS:** Render with `SCNView` (a `UIView`). It is the standard surface and supports gesture-driven `hitTest`.
- **macOS:** `SCNView` is an `NSView`; the same API applies. `allowsCameraControl` gives free trackpad/mouse orbit for inspectors.
- **SwiftUI:** SwiftUI's `SceneView` is deprecated. The current idiom is to wrap `SCNView` in a `UIViewRepresentable`/`NSViewRepresentable`, which also restores full hit-testing and delegate access.
- **visionOS:** SceneKit renders only to a 2D window via `SCNView`; it does not place content in volumes or immersive spaces. For spatial/immersive 3D on visionOS use RealityKit with `RealityView`.
- **Physics:** Attach an `SCNPhysicsBody` (`.static`, `.dynamic`, or `.kinematic`) and category/collision bit masks; observe contacts via `SCNPhysicsContactDelegate`.
- **Permissions:** SceneKit itself needs no usage strings. If you place SceneKit content over a camera feed (ARKit), add `NSCameraUsageDescription` to Info.plist.

## Pitfalls

- **Forgetting a camera or light.** With neither a camera node nor `pointOfView` set, you see nothing; with no light, PBR/standard surfaces are black.
- **Coordinate confusion.** SceneKit is right-handed, +Y up, meters; imported `.dae`/USDZ axes or scale may differ. Normalize on import rather than scattering scale factors.
- **Leaking via delegates.** `SCNSceneRendererDelegate` and physics delegates are not weak; a node strongly retaining the controller creates a cycle. Use `weak` references.
- **Doing heavy work in `renderer(_:updateAtTime:)`.** This runs every frame on the render thread — keep it allocation-free and offload parsing/IO elsewhere.
- **Expecting visionOS spatial output.** SceneKit will not project into an immersive space; assuming it does is a common migration blocker.
- **Treating SceneKit as future-proof.** It is stable but frozen; budget a RealityKit migration path for long-lived apps that need new rendering features.

## References

- **Documentation:** [SceneKit](https://developer.apple.com/documentation/scenekit)
- **Documentation:** [SCNScene](https://developer.apple.com/documentation/scenekit/scnscene)
- **Documentation:** [SCNNode](https://developer.apple.com/documentation/scenekit/scnnode)
- **Documentation:** [Bringing your SceneKit projects to RealityKit](https://developer.apple.com/documentation/RealityKit/bringing-your-scenekit-projects-to-realitykit)
- **WWDC:** [Bring your SceneKit project to RealityKit (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/288/)
- **Sample Code:** [Fox 2: SceneKit game sample](https://developer.apple.com/library/archive/samplecode/scenekit-2017/Introduction/Intro.html)

## See also

For modern, entity-component 3D and visionOS spatial scenes, see the RealityKit skill, which is Apple's recommended successor and the target of any SceneKit migration. When overlaying SceneKit on a camera feed for augmented reality, see the ARKit skill for session and tracking setup. For wrapping `SCNView` inside a SwiftUI hierarchy, see the SwiftUI interoperability skill covering `UIViewRepresentable`/`NSViewRepresentable`. For 2D game content or sprite overlays alongside 3D, see the SpriteKit skill.
