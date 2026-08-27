## Swift Charts review checklist

- [ ] Every encoding uses `.value("Label", ...)` so axes, legends, and VoiceOver have names.
- [ ] Category color/shape comes from `.foregroundStyle(by:)` / `.symbol(by:)`, not a fixed `Color`, so the legend renders.
- [ ] The palette is pinned with `.chartForegroundStyleScale(_:)` for stable, brand-correct colors.
- [ ] Axis/scale overrides are added only where the inferred result is wrong; explicit `domain` ranges include the real data min/max.
- [ ] Selection uses `chartXSelection`/`chartYSelection`/`chartAngleSelection` bindings, and the raw value is mapped back to a data row.
- [ ] Long series use `chartScrollableAxes` + `chartXVisibleDomain` instead of an unreadable squeeze.
- [ ] Marks needing context have `.accessibilityLabel` / `.accessibilityValue`; tested once with VoiceOver and the audio graph rotor.
- [ ] iOS 17+ APIs (selection, scrolling, `SectorMark`) and any `Chart3D`/`SurfacePlot` use are guarded with `@available` / `if #available` against the iOS 16 baseline.
- [ ] Mark count stays bounded; dense data is sampled, aggregated, or moved to a vectorized/function plot.
- [ ] Chart verified in light and dark mode and at a large Dynamic Type size.
