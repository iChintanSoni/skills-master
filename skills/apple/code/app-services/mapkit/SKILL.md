---
name: mapkit
description: "Build maps in SwiftUI with the declarative Map view, content builders, camera control, Look Around, search, and directions. Use when adding a map screen, placing markers or overlays, drawing routes, controlling the camera, showing user location, searching places with MKLocalSearch, or computing directions with MKDirections in a SwiftUI app."
globs:
  - "**/*.swift"
tags: [mapkit, swiftui, maps, location, directions]
x-skills-master:
  domain: apple
  class: code
  category: app-services
  platforms: [ios, ipados, macos, tvos, visionos]
  requires:
    ios: "17"
    swift: "6.0"
  pairs_with: []
  sources:
    - https://developer.apple.com/documentation/mapkit/mapkit-for-swiftui
    - https://developer.apple.com/documentation/mapkit/lookaroundpreview
    - https://developer.apple.com/documentation/mapkit/mklookaroundscenerequest
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for SwiftUI MapKit when a screen shows an interactive map and you want to stay
declarative: place pins, draw overlays, follow the user, preview a location, or render a
route. The `Map` view (iOS 17+) replaces the deprecated `Map(coordinateRegion:)` initializer
and the UIKit `MKMapView` bridge for most app UI. Drop to `MKMapView` only for fine-grained
overlay renderers or behaviors the SwiftUI surface does not expose yet.

Searching and routing still use the imperative model types — `MKLocalSearch`, `MKDirections`,
`MKMapItem` — which you call with `async`/`await` and feed back into map content.

## Core guidance

- **Do** drive the camera with a `@State var position: MapCameraPosition` bound to
  `Map(position:)`. Prefer semantic positions (`.automatic`, `.userLocation(fallback:)`,
  `.region`, `.item`) over hand-built `MKCoordinateRegion` math.
- **Do** build content in the trailing `MapContentBuilder` closure: `Marker`, `Annotation`,
  `MapPolyline`, `MapCircle`, `MapPolygon`, and `UserAnnotation`. Tag each selectable item
  with `.tag(_:)` and pass `selection:` to get tap selection for free.
- **Do** observe the camera with `.onMapCameraChange(frequency: .onEnd) { context in … }`
  and throttle network search to `.onEnd`, not `.continuous`.
- **Do** run `MKLocalSearch.start()` and `MKDirections.calculate()` with `await`; they are
  cancellable, so scope them to a `.task` or cancel a stored handle before re-issuing.
- **Don't** spin up a new `MKLocalSearch` per keystroke without debouncing — you will hit
  rate limits and throw `MKError.loadingThrottled`.
- **Don't** assume Look Around exists everywhere; `MKLookAroundSceneRequest.scene` returns
  `nil` for uncovered coordinates. Hide the preview when the scene is absent.
- **Don't** forget map controls: `.mapControls { MapUserLocationButton(); MapCompass() }` and
  always set the location-usage Info.plist string before following the user.

```swift
@State private var position: MapCameraPosition = .automatic
@State private var selection: MKMapItem?

Map(position: $position, selection: $selection) {
    UserAnnotation()
    ForEach(results, id: \.self) { item in
        Marker(item: item.name ?? "", coordinate: item.placemark.coordinate)
            .tag(item)
    }
    if let route { MapPolyline(route).stroke(.blue, lineWidth: 5) }
}
.mapControls { MapUserLocationButton(); MapScaleView() }
```

## Platform notes

- **iOS / iPadOS / visionOS:** full content builder, controls, and Look Around. On visionOS,
  the map renders in a window and respects depth; avoid tiny tap targets.
- **macOS:** `Map` and overlays are supported; `MapUserLocationButton` needs the location
  entitlement and a usage string, and the user grants access via System Settings.
- **tvOS:** `Map` is display-and-pan focused; selection works through the focus engine, and
  user-location controls are unavailable — feed coordinates explicitly.
- **watchOS:** as of the 26 cycle many MapKit APIs reached watchOS, but the rich
  `MapContentBuilder` surface remains thinner than iOS; verify per-symbol availability.
- Following the user requires `NSLocationWhenInUseUsageDescription` in Info.plist and a
  granted `CLLocationManager` authorization; without it `.userLocation` silently shows nothing.

## Pitfalls

- Using the old `Map(coordinateRegion:)` API — it is deprecated; migrate to `Map(position:)`
  with `MapCameraPosition`.
- Mutating `position` inside `.onMapCameraChange` creates a feedback loop that fights the
  user's gestures. Read the context there; write `position` only from explicit actions.
- Passing a `selection` binding whose type does not match your `.tag(_:)` values — selection
  silently never fires. The tag type and binding's `Value` must be identical and `Hashable`.
- Building `MKLocalSearch.Request` without a `region` yields world-wide, low-relevance hits;
  seed it from the visible region in the camera-change context.
- Treating `MKDirections.calculate()` as cheap — it is network-bound and throttled. Cache the
  `MKRoute` and reuse `route.polyline` rather than recomputing on every redraw.

## References

- **Documentation:** [MapKit for SwiftUI](https://developer.apple.com/documentation/mapkit/mapkit-for-swiftui)
- **Documentation:** [LookAroundPreview](https://developer.apple.com/documentation/mapkit/lookaroundpreview)
- **Documentation:** [MKLookAroundSceneRequest](https://developer.apple.com/documentation/mapkit/mklookaroundscenerequest)
- **WWDC:** [Meet MapKit for SwiftUI (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10043/)
- **WWDC:** [Go further with MapKit (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/204/)
- **Sample Code:** [Interacting with nearby points of interest](https://developer.apple.com/documentation/MapKit/interacting-with-nearby-points-of-interest)

## See also

For requesting and observing the device's position to feed `.userLocation` and seed search
regions, see the core-location skill. For presenting a search field that drives
`MKLocalSearch`, pair this with the swiftui-searchable skill. When you outgrow the declarative
surface and need custom overlay renderers, the mapkit-uikit (MKMapView) skill covers the
bridge.
