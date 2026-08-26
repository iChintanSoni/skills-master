---
name: watchos-complications
description: Builds Apple Watch complications and Smart Stack widgets with WidgetKit and SwiftUI — accessory circular, rectangular, inline, and corner families, widget labels and accented rendering, the watch reload budget, migrating off deprecated ClockKit, and Smart Stack relevance. Use when adding complications to a watchOS app, replacing a CLKComplicationDataSource, laying out an accessoryCorner view, or making a widget surface at the right moment in the Smart Stack.
---

## When to use

Use this skill for the watch-face and Smart Stack surfaces of a watchOS app: complications on the face, and widgets in the Smart Stack you reach by turning the crown from the face. Since watchOS 9 both are WidgetKit widgets written in SwiftUI, so the mechanics — `Widget`, timeline providers, `TimelineEntry` — are the same ones the general WidgetKit skill covers. This skill is the watch-specific layer on top: which families exist, how the corner and label affordances work, what the reload budget really is, how to get off ClockKit, and how relevance drives the Smart Stack.

Reach for it when adding a widget extension to a watch target, when a `CLKComplicationDataSource` stopped being called, when a complication looks wrong on a tinted face, or when a widget never surfaces in the Smart Stack.

## Core guidance

- **Add a watchOS Widget Extension target and write ordinary WidgetKit code.** A complication is a `Widget` whose `body` is a `StaticConfiguration` or `AppIntentConfiguration`. On watchOS the configuration intent is *not* user-facing — it is how your app dynamically configures which complications it offers, so use it when the set is data-driven (per city, per hero, per account) and a `WidgetBundle` of static widgets when it is fixed.
- **Support the accessory families and only the accessory families.** `accessoryCircular`, `accessoryRectangular`, and `accessoryInline` are shared with the iPhone Lock Screen; `accessoryCorner` is watchOS-only. Declare them with `supportedFamilies(_:)` and branch on the `\.widgetFamily` environment value (or `context.family` in the provider) to return a genuinely different layout per family, not one layout that is squeezed.
- **Use the watch-only decoration APIs.** `AccessoryWidgetBackground` gives the standard adaptive backing behind circular and corner content. `widgetLabel(_:)` / `widgetLabel(label:)` adds curved text, a gauge, or a progress view outside the main view — the system renders it on corner complications and along the Infograph bezel for the top circular slot, and silently ignores it everywhere else, so the same code is safe on iPhone. `AccessoryWidgetGroup` (watchOS 11+) packages a label plus three masked content views, with `.circular` or `.roundedSquare` styles.
- **Design for accented rendering first.** Read `\.widgetRenderingMode`; watch faces routinely render complications in `.accented` rather than `.fullColor`. Partition the view with `widgetAccentable(_:)` so the face's tint lands on the right half of your design instead of flattening it.
- **Budget reloads like a watch developer, not a phone developer.** Apple documents roughly 75 timeline reloads per day for a widget-based complication, weighted by how often it is viewed — and a complication installed on the active face always counts as viewed. Return several entries per timeline so a single reload covers hours, and prefer `WidgetCenter.shared.reloadTimelines(ofKind:)` from the app when real data actually changed.
- **Make placeholders and picker snapshots deliberate.** The system redacts everything in `placeholder(in:)` unless you mark it, and shows that placeholder when the watch is locked or in Always On. In `snapshot`, check `context.isPreview` — when it is `true` the entry is being drawn in the complication picker, so return representative sample data rather than a real-but-empty state.
- **Feed the Smart Stack relevance, not noise.** Set `TimelineEntry.relevance` to a `TimelineEntryRelevance(score:duration:)` on a scale you use consistently across all timelines (a score of zero or below means "never rotate me to the top"). On watchOS 11+ also implement the provider's `relevance()` requirement, returning a `WidgetRelevance` built from app intents that conform to `PredictableIntent` and carry a `WidgetRelevanceAttribute` describing time, location, workout, or sleep-schedule conditions — then call `WidgetCenter.shared.invalidateRelevance(ofKind:)` whenever that information changes.
- **Do not assume face complications are interactive.** Apple's ClockKit-migration guidance is explicit that complications are single-frame snapshots: no animation, and a touch launches your app rather than reaching your SwiftUI view. Treat `Button`/`Toggle` App Intents as a Smart Stack affordance and verify on device before depending on them from a watch face.

```swift
struct HydrationComplication: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "Hydration", provider: HydrationProvider()) { entry in
            ZStack {
                AccessoryWidgetBackground()
                Gauge(value: entry.fraction) { Image(systemName: "drop.fill") }
                    .gaugeStyle(.accessoryCircularCapacity)
            }
            .widgetLabel { Text(entry.goal, format: .measurement(width: .abbreviated)) }
        }
        .configurationDisplayName("Hydration")
        .supportedFamilies([.accessoryCircular, .accessoryCorner, .accessoryInline])
    }
}
```

### watchOS 27 (WWDC 2026)

- The relevance-driven widget shape introduced in watchOS 26 is still the current one: configure a widget with `RelevanceConfiguration(kind:provider:content:)` and a `RelevanceEntriesProvider` (`placeholder(context:)`, `entry(configuration:context:)`, `relevance()`) so the Smart Stack can show several context-matched instances. Tie it back to your timeline widget with `associatedKind(_:)` so one can replace the other instead of both competing for stack space, and use `disfavoredLocations(_:for:)` to keep a family out of a surface it was not designed for.

## Platform notes

- **ClockKit is deprecated from watchOS 10** and complications built on it are legacy. Keep a `CLKComplicationDataSource` only to serve watchOS 8 and earlier; the moment your widget extension ships a complication, the system stops calling ClockKit for timeline entries (it may still wake the data source to migrate installed complications). Do not add new ClockKit code.
- **Family count collapses.** WidgetKit's four accessory families replace ClockKit's twelve, and watchOS 9 and later no longer render the old modular/utilitarian/extra-large ClockKit families on watch faces. Expect to redesign, not to map one-to-one.
- **Relevance clues need permission.** Location, workout, and sleep-schedule clues only work if the app *and* the widget extension have the corresponding authorization. Without it the clue is inert and the widget simply never surfaces.
- **Smart Stack behaviour differs by platform.** On iPhone and iPad the system leans on donated app intents and entry relevance scores; the provider's `relevance()` callback exists everywhere for code sharing but only watchOS acts on it, and `RelevanceConfiguration` is watchOS-only.
- **Testing.** Enable WidgetKit Developer Mode in Settings > Developer on the watch to bypass the normal rate limit on Smart Stack rotations and suggestions; otherwise you will wait a long time to see your own widget promoted.

## Pitfalls

- Shipping a widget extension while leaving ClockKit code in place and then debugging "why is my data source never called" — the presence of the widget disables it by design.
- Declaring `accessoryCorner` and rendering the same view as `accessoryCircular`; the corner slot has a curved label region and a very different aspect, and an unadapted layout gets clipped.
- Ignoring `\.widgetRenderingMode` so an accented face renders your carefully coloured design as a single flat tint.
- Building a one-entry timeline with a short reload policy and burning the daily budget by lunchtime.
- Fetching from the network in `placeholder` or `snapshot` — these must be instant and side-effect free, and the picker calls them.
- Setting relevance scores on an inconsistent scale across widgets, which makes the relative comparison WidgetKit performs meaningless.
- Forgetting the App Group entitlement on both the watch app and the widget extension, so the complication renders stale or empty shared state.
- Assuming a watch complication can animate or handle a tap in-place; it renders one or two frames and hands the tap to your app.

## References

- **Documentation:** [Creating accessory widgets and watch complications](https://developer.apple.com/documentation/widgetkit/creating-accessory-widgets-and-watch-complications)
- **Documentation:** [Migrating ClockKit complications to WidgetKit](https://developer.apple.com/documentation/widgetkit/converting-a-clockkit-app)
- **Documentation:** [Increasing the visibility of widgets in Smart Stacks](https://developer.apple.com/documentation/widgetkit/widget-suggestions-in-smart-stacks)
- **Documentation:** [WidgetFamily](https://developer.apple.com/documentation/widgetkit/widgetfamily)
- **Human Interface Guidelines:** [Complications](https://developer.apple.com/design/human-interface-guidelines/complications)
- **WWDC:** [Design widgets for the Smart Stack on Apple Watch (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10309/)

## See also

Pair this with the `widgetkit` skill for the shared timeline, reload-policy, and App Intents mechanics this skill deliberately does not restate, and with `watchos-app-structure` for the app the complication deep-links into. Use `hig-designing-for-watchos` and `hig-widgets-design` for layout and density judgment, and the `watchos-connectivity` skill when a companion iPhone app is the source of the data a complication displays.
