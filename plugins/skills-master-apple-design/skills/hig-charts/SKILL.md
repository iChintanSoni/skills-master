---
name: hig-charts
description: Applies Apple Human Interface Guidelines to charts and data visualization — choosing the right chart type, labeling axes and values, accessible color that doesn't rely on hue alone, selection and interaction, and chart-versus-table judgment. Use when designing or reviewing a chart, picking a visualization, critiquing a dashboard, or auditing chart accessibility. Produces design critique and recommendations, not code.
---

## When to use

Use when designing or reviewing a chart and deciding whether a chart is even the right answer, which type to use, how to label and color it, and how people interact with it. This is a design-judgment skill: it produces critique and recommendations, not Swift code. For implementation with the Swift Charts framework, hand off to `swiftui-charts`.

## Core guidance

- **Decide chart vs. table first.** Charts excel at trends, comparisons, and shape over time; tables win when people need to read exact values, scan many discrete rows, or copy figures. If the only honest takeaway is "look up the number," a table or a labeled stat beats a chart.
- **Match the chart type to the question.** Line for change over time, bar for comparing discrete categories, area for cumulative magnitude, scatter/heatmap for correlation and density. Reserve pie/donut for part-to-whole with very few slices. Don't pick a type for novelty — the shape should make the insight obvious at a glance.
- **Lead with one clear takeaway.** Give the chart a descriptive title and a summary that states the point ("Sales up 12%, totaling 1,234 this month"), not a bare label. A glanceable chart on Watch or a widget should communicate the headline before any interaction.
- **Label axes and values so they can be estimated.** Include axis lines, ticks, and units; show value labels where precision matters. Avoid truncating or starting a bar axis above zero, which exaggerates differences and misleads.
- **Never carry meaning by color alone.** Pair color with shape, position, direct labels, patterns, or a legend so the chart reads for color-blind and low-vision users. Use a restrained, distinguishable palette, ensure sufficient contrast against the background, and let semantic color (red/green) reinforce — not replace — labeled values.
- **Make interaction reveal detail, not hide the point.** Selection, scrubbing, and tooltips should expose exact values and let people focus on a range; the resting state must still tell the story without tapping. Keep targets large enough for touch and Watch.
- **Design for assistive technology from the start.** Provide a chart description and per-series/axis descriptions so VoiceOver can speak the data, and support audio graphs so people can hear the trend. Treat this as a design requirement, not a later patch.

## Platform notes

On iPhone and Apple Watch, favor a single focused chart with a strong summary; small screens punish clutter and tiny tap targets. On iPad and Mac, you can show denser, multi-series charts, richer legends, and pointer hover for detail. In the 2025–2026 Liquid Glass system, charts often sit beneath floating glass tab bars and toolbars — keep critical marks and labels clear of those translucent overlays and verify legibility against the blurred, adapting background. In visionOS, give charts depth-appropriate spacing and ensure they remain readable at varying viewing distances. On tvOS, size everything for the 10-foot experience and focus-based navigation.

## Pitfalls

- Using a chart where an exact figure or a small table would serve people better.
- Distinguishing series by hue only, with no legend, labels, or shape backup.
- Misleading axes: non-zero bar baselines, inconsistent scales, or dual y-axes that imply false correlation.
- Cramming too many series or slices into one chart so no single insight survives.
- Shipping interaction-only detail with a resting state that communicates nothing, or omitting VoiceOver/audio-graph descriptions.

## References

- **Human Interface Guidelines:** [Charting data](https://developer.apple.com/design/human-interface-guidelines/charting-data)
- **WWDC:** [Design an effective chart (WWDC22)](https://developer.apple.com/videos/play/wwdc2022/110340/)
- **WWDC:** [Design app experiences with charts (WWDC22)](https://developer.apple.com/videos/play/wwdc2022/110342/)
- **Documentation:** [Swift Charts](https://developer.apple.com/documentation/charts)
- **Documentation:** [Representing chart data as an audio graph](https://developer.apple.com/documentation/accessibility/representing-chart-data-as-an-audio-graph)

## See also

- Implementation: `swiftui-charts` (build the chart with the Swift Charts framework).
- Related design skills: `hig-color` and `hig-accessibility-design` for palette and inclusive-design judgment; `hig-widgets` for glanceable chart summaries.
- Apple HIG: Charting data (see sources).
