## Static widget with a container background

A minimal Home Screen widget. The `containerBackground` is required so the system can inset and mask correctly across contexts.

```swift
struct StatusEntry: TimelineEntry { let date: Date; let count: Int }

struct StatusView: View {
    var entry: StatusEntry
    var body: some View {
        VStack { Text("\(entry.count)").font(.largeTitle.bold()); Text("active") }
            .containerBackground(.fill.tertiary, for: .widget)
    }
}

struct StatusWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "Status", provider: StatusProvider()) { StatusView(entry: $0) }
            .configurationDisplayName("Status")
            .supportedFamilies([.systemSmall, .accessoryRectangular])
    }
}
```

## Timeline with a per-entry reload policy

Generate a short sequence of future entries and tell WidgetKit to ask for more after the last one.

```swift
struct StatusProvider: TimelineProvider {
    func placeholder(in: Context) -> StatusEntry { StatusEntry(date: .now, count: 0) }
    func getSnapshot(in: Context, completion: @escaping (StatusEntry) -> Void) {
        completion(StatusEntry(date: .now, count: 3))
    }
    func getTimeline(in: Context, completion: @escaping (Timeline<StatusEntry>) -> Void) {
        let now = Date.now
        let entries = (0..<4).map { StatusEntry(date: now.addingTimeInterval(Double($0) * 1800), count: $0) }
        completion(Timeline(entries: entries, policy: .atEnd))
    }
}
```

## Interactive Toggle backed by an App Intent

`Toggle(isOn:intent:)` runs the intent on tap; the reload that follows is guaranteed.

```swift
struct ToggleFavorite: AppIntent {
    static var title: LocalizedStringResource = "Toggle Favorite"
    @Parameter(title: "Item ID") var itemID: String
    func perform() async throws -> some IntentResult {
        Store.shared.toggleFavorite(itemID)   // update App Group state
        return .result()
    }
}

struct Row: View {
    let item: Item
    var body: some View {
        Toggle(isOn: item.isFavorite, intent: ToggleFavorite(itemID: item.id)) {
            Text(item.name)
        }
    }
}
```

## Configurable widget via AppIntentConfiguration

Let users pick options in the gallery with a `WidgetConfigurationIntent` and an `AppIntentTimelineProvider`.

```swift
struct CityConfig: WidgetConfigurationIntent {
    static var title: LocalizedStringResource = "Choose City"
    @Parameter(title: "City") var city: CityEntity?
}

struct WeatherWidget: Widget {
    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: "Weather", intent: CityConfig.self, provider: WeatherProvider()) {
            WeatherView(entry: $0)
        }
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
```
