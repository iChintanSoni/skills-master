---
name: swiftui-charts
description: "Builds data visualizations with Swift Charts in SwiftUI: Chart plus marks (BarMark, LineMark, PointMark, AreaMark, RuleMark, SectorMark), Plottable data, axes and scales, category styling, selection, and accessibility. Use when adding bar, line, area, scatter, or pie charts to a SwiftUI app, styling marks by category, wiring tap or drag selection, customizing axes, or making charts VoiceOver-friendly."
---

## When to use

Reach for Swift Charts when you want declarative, SwiftUI-native data visualizations: bar, line, area, scatter, range, and pie/donut charts that inherit theming, dark mode, layout, and accessibility automatically. It fits dashboards, trends over time, distributions, and category comparisons. If you only need a sparkline or a single decorative shape, a hand-rolled `Path` or `Canvas` may be lighter. For dense real-time streaming or fully custom rendering you cannot express with marks, drop down to `Canvas`. Swift Charts ships on iOS/iPadOS 16+, macOS 13+, watchOS 9+, tvOS 16+, and visionOS 1+; selection and scrolling modifiers require the iOS 17 generation, and 3D charts arrive in the "26" cycle.

## Core guidance

- Compose a `Chart` from one or more marks driven by `Plottable` data. Pass `.value("Label", keyPath)` so every encoding carries a name that axes, legends, and VoiceOver reuse.
- Do encode categories with `.foregroundStyle(by:)` (and `.symbol(by:)` / `.position(by:)` for grouped or stacked layouts) rather than hard-coding one color per mark; pin the palette with `.chartForegroundStyleScale(_:)`.
- Don't reach for axis or scale modifiers first. Let Swift Charts infer domains, then override only what looks wrong with `.chartXScale`, `.chartYScale`, `.chartXAxis`, or `.chartYAxis { AxisMarks { ... } }`.
- Prefer the binding-based selection modifiers (`chartXSelection(value:)`, `chartYSelection`, `chartAngleSelection`, or the `range:` variants) over manual `chartOverlay` + `GeometryProxy` gesture math; use `chartOverlay` only when you need geometry the bindings cannot give you.
- Do make long series scrollable instead of cramming them: `chartScrollableAxes(.horizontal)` plus `chartXVisibleDomain(length:)`, and snap with `chartScrollTargetBehavior(.valByValue)`.
- Don't skip accessibility. Marks generate an audio-graph and accessibility tree for free, but add `.accessibilityLabel` / `.accessibilityValue` per mark when the inferred description is ambiguous.
- Annotate highlights with `.annotation(position:)` and reference values with `RuleMark`; keep the mark count bounded so rendering and VoiceOver stay responsive.

```swift
Chart(sales) { row in
    BarMark(
        x: .value("Month", row.month),
        y: .value("Revenue", row.revenue)
    )
    .foregroundStyle(by: .value("Region", row.region))
}
.chartForegroundStyleScale(["NA": .blue, "EU": .green])
.chartXSelection(value: $selectedMonth)
```

## Platform notes

- iOS/iPadOS 16, macOS 13, watchOS 9, tvOS 16, visionOS 1: base marks, axes, scales, legends, and automatic accessibility are available.
- iOS 17 / macOS 14 generation: `chartXSelection`/`chartYSelection`/`chartAngleSelection` bindings, `SectorMark` for pie and donut charts, and the scrolling modifiers (`chartScrollableAxes`, `chartXVisibleDomain`, `chartScrollTargetBehavior`).
- iOS 18 / macOS 15 generation: vectorized plots (`LinePlot`, `AreaPlot`, etc.) and function plots that graph a closure instead of a finite data array, useful for large or continuous datasets.
- visionOS and the "26" cycle: `Chart3D` with `SurfacePlot` and Z-axis-aware marks (`PointMark`, `RuleMark`, `RectangleMark`), plus the `chart3DPose` modifier to set the viewing angle; gate these behind availability checks.
- watchOS: keep marks sparse and labels short; small complications and the narrow screen punish dense charts.

## Pitfalls

- Forgetting `.value("Name", ...)` (passing a raw value) strips the label Swift Charts needs for axes, legends, and accessibility, producing blank legends and unhelpful VoiceOver output.
- Coloring with `.foregroundStyle(Color)` instead of `.foregroundStyle(by:)` suppresses the automatic legend; the legend is generated only from `by:` encodings.
- Selection bindings give you the raw axis value (a `Date`, `String`, or number), not a data row. Map it back to your model yourself, and remember category axes return the plotted value, not an index.
- Setting an explicit `chartYScale(domain:)` that excludes data clips marks silently. Validate the domain against your real min/max.
- Reusing `chartOverlay` gesture code from pre-iOS-17 tutorials reinvents what the selection bindings now do and tends to break on resize and Dynamic Type.
- Wrapping iOS 17+ or `Chart3D` APIs without `@available` / `if #available` checks breaks builds and crashes on your stated iOS 16 baseline.

## References

- **Documentation:** [Swift Charts framework](https://developer.apple.com/documentation/charts)
- **Documentation:** [Creating a chart using Swift Charts](https://developer.apple.com/documentation/charts/creating-a-chart-using-swift-charts)
- **Documentation:** [Customizing axes in Swift Charts](https://developer.apple.com/documentation/charts/customizing-axes-in-swift-charts)
- **WWDC:** [Hello Swift Charts (WWDC22)](https://developer.apple.com/videos/play/wwdc2022/10136/)
- **WWDC:** [Explore pie charts and interactivity in Swift Charts (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10037/)
- **WWDC:** [Bring Swift Charts to the third dimension (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/313/)

## See also

Pair this with a general SwiftUI layout skill for sizing charts inside stacks and grids, a SwiftUI state-management skill for driving selection bindings cleanly, and a SwiftUI accessibility skill for tuning VoiceOver and audio-graph output beyond the defaults.
