---
name: arkit
description: Use when building augmented reality with ARKit on iOS/iPadOS (ARSession, world/face/body tracking, plane and image/object detection, ARAnchor, raycasting) or spatial tracking on visionOS (ARKitSession with world, hand, scene-reconstruction, and plane providers plus authorization), and when pairing ARKit with RealityKit for rendering.
---

# ARKit

## When to use

Reach for ARKit when you need device-tracked AR anchored to the real world: placing virtual content on detected surfaces, recognizing known images or objects, tracking faces or bodies, or reconstructing scene geometry. On iOS/iPadOS this means the camera-backed `ARSession`; on visionOS the headset-backed `ARKitSession` feeds providers that report world pose, hands, planes, and mesh. ARKit handles sensing and anchoring only — pair it with RealityKit (or a custom Metal renderer) to actually draw content. If you only need to display a model on a surface without bespoke logic, RealityKit's `ARView`/`RealityView` plus a `SpatialTrackingSession` may be enough on its own.

## Core guidance

- **Do** treat the two platforms as different APIs. iOS uses `ARSession` + an `ARConfiguration` subclass (`ARWorldTrackingConfiguration`, `ARFaceTrackingConfiguration`, `ARBodyTrackingConfiguration`); visionOS uses `ARKitSession` plus typed `DataProvider`s. There is no `ARWorldTrackingConfiguration` on visionOS.
- **Do** check capability before running: gate iOS configs on `ARWorldTrackingConfiguration.isSupported` / `ARFaceTrackingConfiguration.isSupported`, and gate visionOS providers on each provider type's `isSupported` (and `requiredAuthorizations`).
- **Do** request authorization explicitly on visionOS with `await session.requestAuthorization(for:)` before `run`, and consume provider output as `AsyncSequence`s (`anchorUpdates`, `handUpdates`) — these never finish, so iterate them inside a `Task`.
- **Prefer** raycasting over the deprecated `hitTest(_:types:)` on iOS. Build a query with `makeRaycastQuery(from:allowing:alignment:)` and feed it to `session.raycast(_:)`, or use `trackedRaycast` for a result that updates as tracking refines.
- **Do** anchor content through `ARAnchor`/`AnchorEntity` (iOS) and `WorldAnchor` (visionOS) rather than caching raw transforms; anchors are re-localized as ARKit refines its map, and visionOS `WorldAnchor`s persist across launches.
- **Don't** run two providers of the same type or restart a running `ARKitSession` config carelessly; monitor `session.events` for `authorizationChanged` and `dataProviderStateChanged` and recover (a provider can stop on permission revocation).
- **Don't** block the main actor parsing anchor streams. Mark provider-driven types `@MainActor` only where you mutate UI/RealityKit state, and hop off otherwise.

```swift
// visionOS: stream plane anchors after authorizing.
let session = ARKitSession()
let planes = PlaneDetectionProvider(alignments: [.horizontal, .vertical])
guard PlaneDetectionProvider.isSupported else { return }
let auth = await session.requestAuthorization(for: [.worldSensing])
guard auth[.worldSensing] == .allowed else { return }
try await session.run([planes])
for await update in planes.anchorUpdates {
    handle(update.event, anchor: update.anchor) // added / updated / removed
}
```

## Platform notes

- **iOS / iPadOS:** Requires an `NSCameraUsageDescription` Info.plist string and the `arkit` device capability if AR is mandatory. The common rendering path is RealityKit's `ARView`, which owns the `ARSession` (set `arView.session.run(config)`); attach content via `AnchorEntity(anchor:)` or `AnchorEntity(.plane:)`. Object detection needs an `ARReferenceObject` (scanned ahead of time); image detection needs `ARReferenceImage`s with known physical size. Face tracking needs a TrueDepth front camera.
- **visionOS:** No camera string is shown; instead add `NSWorldSensingUsageDescription` (world, planes, scene mesh, image tracking) and `NSHandsTrackingUsageDescription` (hand tracking) — if a key is missing, the provider silently yields no data with no error. `AuthorizationType` cases include `.worldSensing`, `.handTracking`, and `.cameraAccess`. For rendering, use SwiftUI `RealityView`; a `SpatialTrackingSession` (RealityKit) covers automatic anchoring, while a dedicated `ARKitSession` is for custom logic over hands, mesh, and world anchors.
- **Scene reconstruction** (`SceneReconstructionProvider` on visionOS, `ARWorldTrackingConfiguration.sceneReconstruction` on LiDAR iPhones/iPads) yields mesh anchors usable for occlusion and physics.

## Pitfalls

- Forgetting visionOS usage strings: providers run but emit nothing, which looks like a tracking bug. Add the keys and handle a `.denied` authorization result.
- Using iOS-only types (`ARWorldTrackingConfiguration`, `ARFaceAnchor`, `hitTest`) in visionOS code, or vice versa — they don't exist cross-platform.
- Iterating `anchorUpdates` without a long-lived `Task`; the sequence is infinite, so a synchronous `for await` will hang the caller.
- Assuming raycasts always hit: `session.raycast(_:)` returns an empty array until planes/feature points exist. Use `.estimatedPlane` targets early, or `trackedRaycast` to upgrade results over time.
- Persisting world transforms by hand instead of using `WorldAnchor` (visionOS) or saved `ARWorldMap` (iOS); manual transforms drift after relocalization.
- Running face + world tracking expecting both — combine only via supported configs (e.g. `userFaceTrackingEnabled` on `ARWorldTrackingConfiguration`), not two sessions.

## References

- **Documentation:** [ARSession](https://developer.apple.com/documentation/arkit/arsession)
- **Documentation:** [ARKitSession (visionOS)](https://developer.apple.com/documentation/arkit/arkitsession)
- **Documentation:** [ARWorldTrackingConfiguration](https://developer.apple.com/documentation/arkit/arworldtrackingconfiguration)
- **WWDC:** [Meet ARKit for spatial computing (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10082/)
- **WWDC:** [Create enhanced spatial computing experiences with ARKit (WWDC24)](https://developer.apple.com/videos/play/wwdc2024/10100/)
- **WWDC:** [Build a spatial drawing app with RealityKit (WWDC24)](https://developer.apple.com/videos/play/wwdc2024/10104/)

## See also

For drawing and anchoring entities once ARKit supplies tracking, see the RealityKit skill; for SwiftUI integration of immersive content and `RealityView`, see the visionOS spatial-UI skill. When persisting and sharing maps across devices, consult the collaborative-session / `ARWorldMap` guidance. For low-level custom rendering instead of RealityKit, pair this with the Metal skill.
