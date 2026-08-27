# swiftdata-modeling — examples

Original, minimal snippets illustrating the idioms in SKILL.md. They are written
from first principles to demonstrate the API shape, not copied from Apple sample
projects.

## A model graph with an owned to-many relationship

```swift
import SwiftData

@Model
final class Trip {
    @Attribute(.unique) var id: UUID
    var name: String
    var startDate: Date

    // The parent owns its items: deleting a Trip deletes its BucketListItems.
    @Relationship(deleteRule: .cascade, inverse: \BucketListItem.trip)
    var items: [BucketListItem] = []

    init(name: String, startDate: Date, id: UUID = UUID()) {
        self.id = id
        self.name = name
        self.startDate = startDate
    }
}

@Model
final class BucketListItem {
    var title: String
    var isDone: Bool
    var trip: Trip?            // inverse side; optional so the item can exist detached

    init(title: String, isDone: Bool = false) {
        self.title = title
        self.isDone = isDone
    }
}
```

## Wiring the container and writing through a context

```swift
@main
struct TripsApp: App {
    var body: some Scene {
        WindowGroup { ContentView() }
            .modelContainer(for: Trip.self)
    }
}

struct AddItem: View {
    @Environment(\.modelContext) private var context

    func add(to trip: Trip, title: String) {
        let item = BucketListItem(title: title)
        item.trip = trip
        context.insert(item)
        // SwiftData autosaves, but call try? context.save() when you need a checkpoint.
    }
}
```

## A non-persistent, derived value

```swift
@Model
final class Invoice {
    var lineTotals: [Decimal]

    @Transient
    var total: Decimal { lineTotals.reduce(0, +) }  // computed, never stored

    init(lineTotals: [Decimal]) { self.lineTotals = lineTotals }
}
```
