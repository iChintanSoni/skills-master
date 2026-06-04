## RealityKit review checklist

- [ ] Assets load with `try await` (Entity/ModelEntity), never synchronously on the main thread
- [ ] `RealityView` provides a `placeholder:` while content loads
- [ ] SwiftUI state is read in `update:`, scene is built in `make`
- [ ] Reality Composer Pro scenes loaded from `realityKitContentBundle` by name
- [ ] Gesture targets have both `InputTargetComponent` and a generated `CollisionComponent`
- [ ] `generateCollisionShapes` is called before adding any `PhysicsBodyComponent`
- [ ] Physics bodies use the correct mode (`.static`/`.kinematic`/`.dynamic`)
- [ ] Event subscriptions from `scene.subscribe(to:)` are stored to keep `Cancellable` alive
- [ ] World/AR content is wrapped in an appropriate `AnchorEntity`
- [ ] iOS AR target declares `NSCameraUsageDescription` in Info.plist
- [ ] Shared models are cloned with `clone(recursive:)` rather than reused by reference
- [ ] Per-frame logic lives in a registered `System`, not in view code
- [ ] SwiftUI attachments use `ViewAttachmentComponent` (visionOS 26) where available
- [ ] Platform-specific components (hand/scene anchors) are gated to visionOS
