## MapKit for SwiftUI review checklist

- [ ] Uses `Map(position:)` with `MapCameraPosition` (not the deprecated `Map(coordinateRegion:)`).
- [ ] Map content lives in the `MapContentBuilder` closure (`Marker`, `Annotation`, `MapPolyline`, `MapCircle`, `UserAnnotation`).
- [ ] Selectable items are `.tag(_:)`-ed and the `selection:` binding type matches the tag type exactly.
- [ ] `.onMapCameraChange` uses `.onEnd` for network-triggering work; `position` is not written back inside it.
- [ ] `MKLocalSearch.Request.region` is seeded from the visible region; search input is debounced.
- [ ] `MKLocalSearch.start()` / `MKDirections.calculate()` are `await`-ed and scoped so they can cancel.
- [ ] `MKRoute` is cached and reused for the polyline rather than recomputed on redraw.
- [ ] Look Around presence is gated on a non-`nil` `MKLookAroundScene`.
- [ ] `.mapControls { … }` exposes the controls the screen needs (user location, compass, scale).
- [ ] `NSLocationWhenInUseUsageDescription` is set and authorization is requested before following the user.
- [ ] Per-platform availability verified (tvOS has no user-location button; watchOS surface is thinner).
