---
name: realitykit
description: "Builds 3D and AR experiences with RealityKit's Entity-Component-System model, RealityView in SwiftUI, USDZ and Reality Composer Pro scenes, anchors, materials, animations, physics, and SwiftUI attachments. Use when adding 3D content, rendering models, placing AR anchors, handling collisions, or attaching SwiftUI views to entities on iOS, iPadOS, macOS, or visionOS."
globs:
  - "**/*.swift"
tags: [realitykit, swiftui, visionos, ar, 3d, ecs]
x-skills-master:
  domain: apple
  class: code
  category: graphics-games
  platforms: [ios, ipados, macos, visionos]
  requires:
    ios: "18"
    swift: "6.0"
  pairs_with: []
  sources:
    - https://developer.apple.com/documentation/realitykit
    - https://developer.apple.com/documentation/RealityKit/RealityView
    - https://developer.apple.com/documentation/realitykit/anchorentity
    - https://developer.apple.com/documentation/realitykit/presentation-views-and-attachments
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for RealityKit when you need real-time 3D rendering, physically based materials, spatial audio, or augmented reality and want it to live inside a SwiftUI app. It is the right tool for placing virtual content in the real world on iPhone and iPad, for windowed/volumetric/immersive 3D on visionOS, and for in-window 3D on macOS and tvOS. Use `RealityView` (iOS 18 / iPadOS 18 / macOS 15 / visionOS 2 and later) as the bridge from SwiftUI; on visionOS use `Model3D` for a quick single-asset preview without a full scene. Reach elsewhere for flat 2D charts (Swift Charts), Metal-only custom pipelines, or legacy SceneKit projects you are not yet migrating.

## Core guidance

- **Model content as Entity + Components, behavior as Systems.** An `Entity` is just an identity plus a bag of components; data lives in components (`ModelComponent`, `Transform`, `PhysicsBodyComponent`), and per-frame logic lives in a `System` registered once via `System.registerSystem()`. Favor composition over subclassing entities.
- **Load assets asynchronously.** Use `try await Entity(named:in:)` against `realityKitContentBundle` for Reality Composer Pro scenes, or `Entity(contentsOf: url)` for USDZ. Do loading inside the `RealityView` `make` closure (it is async) — never block the main thread with synchronous loads.
- **Drive the scene from the right closure.** `RealityView { content in … }` builds content once; the optional `update:` closure runs when observed SwiftUI state changes. Read SwiftUI values in `update`, not `make`. Entities now conform to `Observable`, so observing entity properties in a SwiftUI view works directly.
- **Anchor before you place.** Wrap world-tracked content in an `AnchorEntity(.plane(...))`, `.image`, `.head`, or `.world` and add the anchor to `content`. On visionOS prefer the system-managed anchoring; on iOS pair with ARKit through `SpatialTrackingSession` when you need raw anchor transforms.
- **For interaction, require two components.** Any gesture target needs both `InputTargetComponent` and a `CollisionComponent` (call `entity.generateCollisionShapes(recursive:)`). Then attach `.gesture(... .targetedToAnyEntity())`, or in visionOS 26 add a `GestureComponent`/`ManipulationComponent` directly to the entity.
- **Attach SwiftUI with `ViewAttachmentComponent`.** Declare UI inline on an entity instead of the older upfront `attachments` builder; it returns an entity you transform like any other. Use `PresentationComponent` for popovers/sheets anchored to entities.
- **Don't forget physics setup order.** Generate collision shapes first, then add `PhysicsBodyComponent` (mode `.static`, `.kinematic`, or `.dynamic`) and optionally `PhysicsMotionComponent`. Keep `Cancellable` subscriptions from `scene.subscribe(to:)` alive in a stored set or events stop firing.

```swift
RealityView { content in
    guard let robot = try? await Entity(named: "Robot", in: realityKitContentBundle)
    else { return }
    robot.components.set(InputTargetComponent())
    robot.generateCollisionShapes(recursive: true)
    content.add(robot)
} update: { content in
    content.entities.first?.scale = .init(repeating: scale)
}
.gesture(TapGesture().targetedToAnyEntity().onEnded { $0.entity.spin() })
```

## Platform notes

- **iOS / iPadOS 18+:** AR uses the rear camera; add an `NSCameraUsageDescription` string to Info.plist or the session fails to start. `RealityView` replaces the older `ARView` for SwiftUI apps. Some immersive-only components (hand/scene-understanding anchors) are visionOS-only.
- **visionOS 2 / 26:** Full immersive spaces, hand and world anchoring, hover effects, and `ManipulationComponent` object manipulation. visionOS 26 adds `GestureComponent`, `PresentationComponent`, and inline `ViewAttachmentComponent`.
- **macOS 15+ / tvOS:** `RealityView` renders in a window; AR world tracking is unavailable, so use it for product viewers, configurators, and previews. RealityKit gained tvOS support in the 26 cycle.
- **Reality Composer Pro:** Author materials (MaterialX/Shader Graph), animations, and component setups visually in the bundled Xcode tool, then load the package as `realityKitContentBundle`.

## Pitfalls

- Calling `generateCollisionShapes` after meshes load but forgetting `InputTargetComponent` — taps silently do nothing.
- Doing heavy `Entity` loading synchronously, hitching the UI; always `await` and show the `RealityView` placeholder while loading.
- Letting `Cancellable` event subscriptions deallocate, which silently cancels collision/animation callbacks.
- Adding a `PhysicsBodyComponent` without a collision shape, so the body never participates in simulation.
- Expecting `update:` to run on entity-internal changes — it only re-runs on SwiftUI state changes that it reads.
- Reusing one `Entity` instance in two places; clone with `entity.clone(recursive:)` instead of sharing references.

## References

- **Documentation:** [RealityKit](https://developer.apple.com/documentation/realitykit)
- **Documentation:** [RealityView](https://developer.apple.com/documentation/RealityKit/RealityView)
- **Documentation:** [AnchorEntity](https://developer.apple.com/documentation/realitykit/anchorentity)
- **Documentation:** [Views and attachments](https://developer.apple.com/documentation/realitykit/presentation-views-and-attachments)
- **WWDC:** [What's new in RealityKit (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/287/)
- **WWDC:** [Better together: SwiftUI and RealityKit (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/274/)

## See also

Pair this with a SwiftUI fundamentals skill for the surrounding app shell and state management, an ARKit skill when you need raw anchor transforms or scene reconstruction beyond RealityKit's managed anchoring, and a USDZ/Reality Composer Pro asset-pipeline skill for authoring models, materials, and animations consumed here. For spatial-audio detail, defer to a dedicated audio skill.
