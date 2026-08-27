## Minimal bar chart from Plottable data

```swift
import Charts
import SwiftUI

struct Daily: Identifiable {
    let id = UUID()
    let day: String
    let steps: Int
}

struct StepsChart: View {
    let data: [Daily]
    var body: some View {
        Chart(data) { row in
            BarMark(
                x: .value("Day", row.day),
                y: .value("Steps", row.steps)
            )
        }
    }
}
```

## Multi-series line chart styled by category

```swift
Chart(readings) { r in
    LineMark(
        x: .value("Time", r.timestamp),
        y: .value("Temp", r.celsius)
    )
    .foregroundStyle(by: .value("Sensor", r.sensor))
    .symbol(by: .value("Sensor", r.sensor))
}
.chartForegroundStyleScale(["Indoor": .orange, "Outdoor": .teal])
```

## Tap-to-select with an annotation (iOS 17+)

```swift
@State private var picked: Date?

Chart(prices) { p in
    AreaMark(x: .value("Date", p.date), y: .value("Close", p.close))
    if let picked, let hit = prices.first(where: { $0.date == picked }) {
        RuleMark(x: .value("Date", hit.date))
            .annotation(position: .top) {
                Text(hit.close, format: .currency(code: "USD"))
            }
    }
}
.chartXSelection(value: $picked)
```

## Scrollable window over a long series (iOS 17+)

```swift
Chart(history) { h in
    BarMark(x: .value("Week", h.week, unit: .weekOfYear),
            y: .value("Sales", h.sales))
}
.chartScrollableAxes(.horizontal)
.chartXVisibleDomain(length: 3600 * 24 * 7 * 8) // ~8 weeks
.chartScrollTargetBehavior(.valByValue)
```
