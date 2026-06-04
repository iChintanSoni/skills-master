## Camera position, markers, and tap selection

```swift
import SwiftUI
import MapKit

struct PlacesMap: View {
    @State private var position: MapCameraPosition = .userLocation(fallback: .automatic)
    @State private var selection: MKMapItem?
    let places: [MKMapItem]

    var body: some View {
        Map(position: $position, selection: $selection) {
            UserAnnotation()
            ForEach(places, id: \.self) { place in
                Marker(place.name ?? "Place", systemImage: "fork.knife",
                       coordinate: place.placemark.coordinate)
                    .tag(place)
            }
        }
        .mapControls {
            MapUserLocationButton()
            MapCompass()
            MapScaleView()
        }
    }
}
```

## Search the visible region with MKLocalSearch (async)

```swift
func search(for query: String, in region: MKCoordinateRegion) async throws -> [MKMapItem] {
    let request = MKLocalSearch.Request()
    request.naturalLanguageQuery = query
    request.region = region                 // bias toward what the user sees
    request.resultTypes = .pointOfInterest

    let response = try await MKLocalSearch(request: request).start()
    return response.mapItems
}

// Re-seed the region only when panning settles:
.onMapCameraChange(frequency: .onEnd) { context in
    visibleRegion = context.region
}
```

## A walking route with MKDirections, drawn as a polyline

```swift
@State private var route: MKRoute?

func route(from source: CLLocationCoordinate2D, to destination: MKMapItem) async {
    let request = MKDirections.Request()
    request.source = MKMapItem(placemark: MKPlacemark(coordinate: source))
    request.destination = destination
    request.transportType = .walking
    route = try? await MKDirections(request: request).calculate().routes.first
}

// In the MapContentBuilder:
if let route {
    MapPolyline(route)
        .stroke(.blue, lineWidth: 6)
}
```

## Look Around preview, gated on availability

```swift
@State private var scene: MKLookAroundScene?

func loadLookAround(at coordinate: CLLocationCoordinate2D) async {
    let request = MKLookAroundSceneRequest(coordinate: coordinate)
    scene = try? await request.scene   // nil where Look Around is unavailable
}

var body: some View {
    if let scene {
        LookAroundPreview(initialScene: scene)
            .frame(height: 180)
            .clipShape(.rect(cornerRadius: 12))
    }
}
```
