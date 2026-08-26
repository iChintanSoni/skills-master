---
name: visionos-windows-volumes
description: Builds the bounded half of a visionOS app — flat windows versus volumes via windowStyle(.volumetric), physical sizing with defaultSize(_:in:) and PhysicalMetric, ornaments, glassBackgroundEffect, volume baseplates and viewpoints, world alignment and scaling, and the Shared Space rules a 2D iPad-style app must satisfy to feel spatial. Use when bringing an existing SwiftUI app to Apple Vision Pro, deciding whether content belongs in a window or a volume, sizing 3D content in meters, or attaching controls outside a window's bounds.
---

## When to use

Reach for this skill when your visionOS content stays *bounded* — a panel a person can place on a wall, or a box of 3D content sitting on a table. It covers the choice between a plain `WindowGroup` and a volume, how to size either in real-world units, how to hang controls off the edges with ornaments, and what actually changes when you check the visionOS destination on an existing iPad app. Stop here and switch to the immersive-spaces skill the moment content must escape a box, replace passthrough, or read the room. For the generic scene vocabulary — `WindowGroup` versus `Window`, `openWindow`/`dismissWindow`, value-routed windows — defer to the SwiftUI scenes-and-windows skill; this skill only covers what visionOS adds on top.

## Core guidance

- **Start by running unchanged, then earn each spatial affordance.** A compatible iPad or iPhone app runs on visionOS as a single flat window with system-provided glass, hover highlighting, and eye-plus-pinch input, all for free. Recompiling for the visionOS destination is the point at which you get scene styles, ornaments, and volumes. Do the audit first: fixed-width layouts, `UIScreen`-derived sizing, hover-hostile tap targets, and pure-black backgrounds all read badly before you add a single 3D asset.
- **Window for flat, volume for bounded 3D.** `.windowStyle(.volumetric)` (visionOS 1) turns a `WindowGroup` into a volume: a box with depth that people can walk around and view from any side. Use it when the content is an object. Keep flat UI in a default window — a volume whose content is a form or a list wastes depth and gets awkward parallax.
- **Size volumes in physical units, not points.** `defaultSize(_ size: Size3D, in: UnitLength)` and `defaultSize(width:height:depth:in:)` take a `UnitLength`, so a one-meter cube is literally `.defaultSize(width: 1, height: 1, depth: 1, in: .meters)`. This matters because the system renders volumes with fixed scaling rather than the dynamic scaling a flat window gets — a volume should feel like a physical object at a fixed real size, so a value in points produces something wildly wrong.
- **Convert points to meters with `PhysicalMetric`, not arithmetic.** The `@PhysicalMetric(from: .meters)` property wrapper yields the point value that corresponds to a physical measurement in the current scene, and `EnvironmentValues.physicalMetrics` exposes a `PhysicalMetricsConverter` for both directions. Use them whenever a SwiftUI frame has to line up with a real-world dimension or with RealityKit geometry.
- **Put controls in ornaments, not in the content.** `ornament(visibility:attachmentAnchor:contentAlignment:ornament:)` attaches a floating control strip outside the window's bounds, anchored with `OrnamentAttachmentAnchor.scene(_:)` or `.parent(_:)`. Toolbars, playback controls, and mode switches belong there; keeping them out of the content area preserves the content's aspect ratio and keeps the glass panel readable.
- **Let the system own the material.** Windows already carry the glass background. Use `glassBackgroundEffect(displayMode:)` (and `.in:` for a custom shape) to extend it onto a subview or a detached panel; do not paint your own translucent fills. Solid opaque backgrounds and hairline strokes both break the depth cues the system is drawing for you.
- **Configure the volume's spatial behavior explicitly.** `volumeBaseplateVisibility(_:)` controls the floor plate that appears on gaze and during resize; `supportedVolumeViewpoints(_:)` declares which azimuths the window bar and ornaments may occupy; `onVolumeViewpointChange(updateStrategy:initial:_:)` lets you reorient content when someone walks around it; `volumeWorldAlignment(_:)` chooses gravity-aligned versus adaptive placement; `defaultWorldScaling(_:)` picks fixed versus dynamic scaling. All arrived in visionOS 2 and are the difference between a volume that behaves like an object and one that behaves like a floating screenshot.
- **You may request initial geometry; you may not move a window afterward.** `defaultSize` and the `windowResizability(_:)` strategies (`.automatic`, `.contentSize`, `.contentMinSize`) influence what the system opens. After a window appears, position and size belong to the person, and state restoration returns them to where they left it. Design for that rather than fighting it.
- **Everything here lives in the Shared Space.** Windows and volumes coexist with other apps' windows; the app is one participant, not the whole world. Exclusive control of a person's surroundings, room sensing, and hand-position data require an immersive space instead.

```swift
@main
struct AtlasApp: App {
    var body: some Scene {
        WindowGroup { LibraryView() }              // flat panel, Shared Space

        WindowGroup(id: "globe") {                 // bounded 3D object
            GlobeView()
                .volumeBaseplateVisibility(.hidden)
                .ornament(attachmentAnchor: .scene(.bottom)) {
                    GlobeControls().glassBackgroundEffect()
                }
        }
        .windowStyle(.volumetric)
        .defaultSize(width: 0.6, height: 0.6, depth: 0.6, in: .meters)
        .volumeWorldAlignment(.gravityAligned)
    }
}

struct RulerOverlay: View {
    @PhysicalMetric(from: .centimeters) private var tenCentimeters = 10
    var body: some View { Rectangle().frame(width: tenCentimeters, height: 2) }
}
```

## Platform notes

- **visionOS only.** `.volumetric`, `defaultSize(_:in:)`, `PhysicalMetric`, `glassBackgroundEffect`, and the ornament modifiers are visionOS-exclusive. Guard them with `#if os(visionOS)` in shared code rather than assuming the compiler will elide them; several have no counterpart on iOS or macOS.
- **Availability floors.** `.volumetric`, `defaultSize(_:in:)`, `PhysicalMetric`, `glassBackgroundEffect`, and ornaments are visionOS 1. The volume-behavior family — `volumeBaseplateVisibility`, `supportedVolumeViewpoints`, `onVolumeViewpointChange`, `volumeWorldAlignment`, `defaultWorldScaling` — is visionOS 2. `SpatialContainer` (3D-aligned overlapping layout) and `EnvironmentValues.surfaceSnappingInfo` (whether the scene is snapped to a real surface, and to what) are visionOS 26.
- **Multi-window rules still apply.** `openWindow` no-ops on visionOS unless `UIApplicationSupportsMultipleScenes` is true in Info.plist — the same trap as iPad. `Settings` and `MenuBarExtra` are ignored.
- **Volumes gained presentations in visionOS 26.** Sheets, popovers, and alerts can now appear within a volume, so a volume no longer has to punt modal UI to a separate window.
- **Compatible-mode apps have a lower ceiling.** An unmodified iPad build cannot open a volume, add ornaments, or apply glass effects; those require the visionOS destination. Decide early whether compatibility mode is a shipping state or a stepping stone.

## Pitfalls

- Passing points where a `UnitLength` overload is available, producing a volume that is centimeters or kilometers across instead of the intended size.
- Reaching for `.volumetric` for a control panel: depth on flat UI adds parallax and occlusion problems without adding information.
- Trying to reposition or resize a window after it appears — the API deliberately does not allow it, and workarounds fight state restoration.
- Painting an opaque background over the system glass, which flattens the panel and kills the depth and lighting cues.
- Putting toolbars inside the content instead of in an ornament, so controls compete with the content for the volume's fixed bounds.
- Leaving the baseplate and viewpoint defaults untouched on a volume the user is meant to walk around, then discovering the window bar sits behind the object from half the angles.
- Assuming `.contentSize` resizability tracks content that grows later; it locks to the ideal size at presentation.
- Expecting hand or room data from a window or volume — those are only available from an immersive space, by design.
- Shipping tap targets sized for a fingertip on glass; visionOS targeting is eye-driven, so small or tightly packed controls are much harder to hit than on iPad.

## References

- **Documentation:** [Positioning and sizing windows](https://developer.apple.com/documentation/visionos/positioning-and-sizing-windows)
- **Documentation:** [Presenting windows and spaces](https://developer.apple.com/documentation/visionos/presenting-windows-and-spaces)
- **Documentation:** [WindowStyle.volumetric](https://developer.apple.com/documentation/swiftui/windowstyle/volumetric)
- **Documentation:** [PhysicalMetric](https://developer.apple.com/documentation/swiftui/physicalmetric)
- **Documentation:** [OrnamentAttachmentAnchor](https://developer.apple.com/documentation/swiftui/ornamentattachmentanchor)
- **Human Interface Guidelines:** [Designing for visionOS](https://developer.apple.com/design/human-interface-guidelines/designing-for-visionos)
- **WWDC:** [Set the scene with SwiftUI in visionOS (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/290/)

## See also

Pair this with the visionOS immersive-spaces skill for everything unbounded — `ImmersiveSpace`, immersion styles, hand input, and world sensing — and with the visionOS design skill for spatial layout, comfort, and depth critique before you commit to a scene shape. The SwiftUI scenes-and-windows skill owns the cross-platform scene vocabulary this skill builds on; a RealityKit skill covers the entities and materials that fill a volume once you have sized it.
