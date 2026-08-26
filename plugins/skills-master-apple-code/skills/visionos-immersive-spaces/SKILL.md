---
name: visionos-immersive-spaces
description: Builds the unbounded half of a visionOS app — ImmersiveSpace scenes, the mixed, progressive, and full immersion styles, the openImmersiveSpace and dismissImmersiveSpace environment actions, immersion-change and upper-limb configuration, SpatialEventGesture for direct and indirect pinch input, and the ARKitSession authorization gate for hand tracking and world sensing. Use when content must escape a volume, when replacing passthrough, when opening or closing a space programmatically, or when reasoning about the privacy posture around eye and hand data on Apple Vision Pro.
---

## When to use

Reach for this skill when visionOS content stops being an object in a box and becomes the surroundings: a planetarium, a guided workout, a room-scale game, a viewer that dims the real world. It covers declaring an `ImmersiveSpace`, choosing and changing an immersion style, opening and dismissing the space from SwiftUI, handling the spatial input that arrives once content is unbounded, and the authorization gate you must pass before ARKit hands you hand or world data. For bounded content — panels and volumes in the Shared Space — use the visionOS windows-and-volumes skill instead. For the entities, materials, physics, and gestures *inside* the space, defer to the RealityKit skill; this skill owns the scene, its lifecycle, and its privacy contract.

## Core guidance

- **`ImmersiveSpace` is a `Scene`, and only one can be open.** Declare it in your `App` body like any other scene. Give it an identifier — `ImmersiveSpace(id: "space") { … }` — unless it is the only one, and use the value-carrying initializers (`init(id:for:content:)`) when the space needs a routed payload. The system permits exactly one open immersive space at a time, so dismiss before opening another.
- **Open and dismiss through the environment, and check the result.** `@Environment(\.openImmersiveSpace)` yields an `OpenImmersiveSpaceAction` you call directly and `await`; it returns `OpenImmersiveSpaceAction.Result` with cases `.opened`, `.userCancelled`, and `.error`. Ignoring that result is the single most common bug — the space may not have opened, and your UI still says it did. `@Environment(\.dismissImmersiveSpace)` gives the matching `DismissImmersiveSpaceAction`, which takes no identifier because there is only ever one space.
- **Pick the immersion style deliberately, and declare the full set up front.** `.mixed` (the default) places content in the real surroundings, `.progressive` partially replaces passthrough with a Digital-Crown-adjustable portal, `.full` replaces it entirely. Apply `immersionStyle(selection:in:)` with a `Binding<any ImmersionStyle>` and *every* style you intend to switch to; changing `selection` at runtime only works among the styles listed in the second parameter. `.progressive(_:initialAmount:)` (visionOS 2) takes the immersion range, and `.progressive(aspectRatio:)` (visionOS 26) shapes the portal.
- **Windows do not disappear, but their compositing changes.** Under `.mixed`, virtual content and windows occlude each other naturally. Under progressive and full immersion, windows always render in front of your content so people never lose track of them. Design the transition rather than assuming your scene owns every pixel.
- **Track immersion instead of guessing it.** `onImmersionChange(initial:_:)` (visionOS 2, on both `View` and `Scene`) delivers `ImmersionChangeContext` values whose `amount` is the current immersion — use it to fade audio, dim environment lighting, or swap detail levels as someone turns the Crown. `upperLimbVisibility(_:)` decides whether the person's arms show through during immersion; `immersiveContentBrightness(_:)` and `immersiveEnvironmentBehavior(_:)` (visionOS 26, `.coexist` or `.replace`) control how your space relates to system environments.
- **Launch straight into a space only via Info.plist.** Set `UIApplicationPreferredDefaultSceneSessionRole` to `UISceneSessionRoleImmersiveSpaceApplication` in the scene manifest, and optionally `UISceneInitialImmersionStyle`. There is no code-only way to make an immersive space the launch scene.
- **Input arrives as system events first, raw data second.** The system resolves eye focus and pinch into ordinary taps and gestures — `TapGesture`, `DragGesture`, and `.targetedToAnyEntity()` cover most needs, and `hoverEffect(_:)` gives look-at feedback. When you need per-finger or multi-hand fidelity, use `SpatialEventGesture`, whose `SpatialEventCollection.Event` carries `kind` (`.directPinch`, `.indirectPinch`, `.pointer`, `.touch`, `.pencil`), `chirality`, `location3D`, `selectionRay`, `inputDevicePose`, `phase`, and `targetedEntity`. `handActivationBehavior(_:)` (`.automatic` or `.pinch`) disambiguates a pinch from a hand reaching toward real objects.
- **World and hand data are gated on an open space plus authorization.** Create an `ARKitSession`, then `requestAuthorization(for:)` up front or let `run(_:)` prompt implicitly. `ARKitSession.AuthorizationType` covers `.handTracking`, `.worldSensing`, `.cameraAccess`, and `.accessoryTracking`. Providers: `WorldTrackingProvider` (device pose and world anchors — notably *not* authorization-gated), `PlaneDetectionProvider`, `SceneReconstructionProvider`, `ImageTrackingProvider`, `ObjectTrackingProvider`, `RoomTrackingProvider` (visionOS 2), `HandTrackingProvider`. Check `isSupported` on each, and consume `anchorUpdates` as an async sequence. RealityKit's `SpatialTrackingSession` (visionOS 2) is the lighter-weight path when you only need managed anchoring rather than raw transforms.
- **The privacy posture is the design constraint, not a checkbox.** The system deliberately never tells your app where someone is looking — hover effects are applied out of process. Hand and world data require an immersive space precisely because opening one hides every other app. Ship `NSHandsTrackingUsageDescription` and `NSWorldSensingUsageDescription` strings that say what you do with the data, handle denial and mid-session revocation (`ARKitSession.Event.authorizationChanged`), and provide a working fallback — people using accessibility input may never grant it.

```swift
struct ImmersiveToggle: View {
    @Environment(\.openImmersiveSpace) private var openSpace
    @Environment(\.dismissImmersiveSpace) private var dismissSpace
    @State private var isOpen = false

    var body: some View {
        Button(isOpen ? "Exit" : "Enter") {
            Task {
                if isOpen {
                    await dismissSpace()
                    isOpen = false
                } else if case .opened = await openSpace(id: "observatory") {
                    isOpen = true          // only trust an explicit .opened
                }
            }
        }
    }
}

@main
struct ObservatoryApp: App {
    @State private var style: ImmersionStyle = .mixed
    var body: some Scene {
        WindowGroup { ImmersiveToggle() }
        ImmersiveSpace(id: "observatory") { SkyView() }
            .immersionStyle(selection: $style, in: .mixed, .progressive, .full)
            .upperLimbVisibility(.hidden)
    }
}
```

## Platform notes

- **visionOS only, with two macOS exceptions.** `ImmersiveSpace` itself is visionOS 1+. `ImmersionStyle`, `immersionStyle(selection:in:)`, `OpenImmersiveSpaceAction`, and `ImmersionChangeContext` also carry macOS 26 availability because of `RemoteImmersiveSpace` — a macOS-only scene that renders immersive content to a connected Vision Pro. Do not read that as iOS support; there is none.
- **Availability floors.** `ImmersiveSpace`, `immersionStyle(selection:in:)`, `.mixed`/`.full`, `upperLimbVisibility`, `immersiveContentBrightness`, `SpatialEventGesture`, `HandActivationBehavior`, `WorldTrackingProvider`, `PlaneDetectionProvider`, `SceneReconstructionProvider`, and `HandTrackingProvider` are visionOS 1. `immersiveSpaceDisplacement` is visionOS 1.1. `.progressive(_:initialAmount:)`, `onImmersionChange`, `RoomTrackingProvider`, and `SpatialTrackingSession` are visionOS 2. `.progressive(aspectRatio:)` and `ImmersiveEnvironmentBehavior` are visionOS 26.
- **`SpatialEventGesture` is cross-platform, its meaning is not.** The type is available on iOS 18, macOS 15, and watchOS 11 as well, but only on visionOS do you see `.directPinch` and `.indirectPinch` kinds with real chirality and pose. Branch on `kind` rather than assuming.
- **Fully immersive content needs an exit.** Progressive immersion keeps the Digital Crown as an escape hatch; full immersion does not change that, but your app should still offer an obvious in-content way back. Comfort guidance (motion, horizon stability, session length) lives in the visionOS design skill.
- **RealityKit or Metal, your choice.** An immersive space hosts a `RealityView` for entity-based content or a `CompositorLayer` for a custom Metal renderer. The scene lifecycle, immersion styles, and authorization rules in this skill apply identically to both.

## Pitfalls

- Treating `await openImmersiveSpace(...)` as infallible and never matching on `.opened` — `.userCancelled` and `.error` leave your state machine lying.
- Opening a second space without dismissing the first; the system allows only one and the request fails.
- Listing one style in `immersionStyle(selection:in:)` and then binding `selection` to another — the switch silently does nothing.
- Calling ARKit providers from a window or volume. Data flows only while an immersive space is presented, so a session started from the main window never delivers anchors.
- Reaching for `HandTrackingProvider` when `TapGesture`, `DragGesture`, or `SpatialEventGesture` already covers the interaction — it costs an authorization prompt, a denial path, and user trust for nothing.
- Assuming world tracking needs the same authorization as world sensing; device pose and world anchors do not prompt, plane and mesh data do.
- Ignoring `ARKitSession.Event.authorizationChanged`, so a permission revoked in Settings mid-session leaves stale anchors on screen.
- Expecting gaze data. The system will not provide it, and building a feature that assumes it is a dead end.
- Forgetting that other apps are hidden while your space is open — background-ish behavior like leaving a full space open during a long idle period is hostile.
- Skipping the `Info.plist` launch configuration and then wondering why the space will not open at startup.

## References

- **Documentation:** [ImmersiveSpace](https://developer.apple.com/documentation/swiftui/immersivespace)
- **Documentation:** [ImmersionStyle](https://developer.apple.com/documentation/swiftui/immersionstyle)
- **Documentation:** [Immersive spaces](https://developer.apple.com/documentation/swiftui/immersive-spaces)
- **Documentation:** [Setting up access to ARKit data](https://developer.apple.com/documentation/visionos/setting-up-access-to-arkit-data)
- **Documentation:** [Adopting best practices for privacy and user preferences](https://developer.apple.com/documentation/visionos/adopting-best-practices-for-privacy)
- **Documentation:** [SpatialEventGesture](https://developer.apple.com/documentation/swiftui/spatialeventgesture)
- **WWDC:** [Set the scene with SwiftUI in visionOS (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/290/)

## See also

Pair this with the visionOS windows-and-volumes skill for the bounded scenes an immersive experience launches from and returns to, and with the RealityKit skill for the entities, anchors, materials, and gesture components that populate the space. An ARKit skill goes deeper on providers, anchor types, and scene reconstruction than the authorization overview here; a visionOS design skill covers comfort, immersion pacing, and when full immersion is the wrong answer.
