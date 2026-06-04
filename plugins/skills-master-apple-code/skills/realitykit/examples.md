## Loading a Reality Composer Pro scene with a placeholder

```swift
struct SceneView: View {
    var body: some View {
        RealityView { content in
            if let scene = try? await Entity(named: "Immersive", in: realityKitContentBundle) {
                content.add(scene)
            }
        } placeholder: {
            ProgressView()
        }
    }
}
```

## Placing a USDZ model on a detected horizontal plane (iOS AR)

```swift
RealityView { content in
    let anchor = AnchorEntity(.plane(.horizontal, classification: .table,
                                     minimumBounds: [0.2, 0.2]))
    if let lamp = try? await Entity(contentsOf: lampURL) {
        lamp.generateCollisionShapes(recursive: true)
        anchor.addChild(lamp)
    }
    content.add(anchor)
}
// Requires NSCameraUsageDescription in Info.plist.
```

## Adding a dynamic physics body and observing collisions

```swift
func makeBall(in scene: Scene, store: inout Set<AnyCancellable>) -> ModelEntity {
    let ball = ModelEntity(mesh: .generateSphere(radius: 0.05))
    ball.generateCollisionShapes(recursive: false)
    ball.components.set(PhysicsBodyComponent(massProperties: .default,
                                             material: nil, mode: .dynamic))
    scene.subscribe(to: CollisionEvents.Began.self, on: ball) { event in
        print("hit \(event.entityB.name)")
    }.store(in: &store)
    return ball
}
```

## Attaching a SwiftUI label to an entity (visionOS 26)

```swift
RealityView { content in
    let badge = Entity()
    badge.components.set(ViewAttachmentComponent(rootView: Text("Online").padding()))
    badge.position = [0, 0.15, 0]
    content.add(badge)
}
```
