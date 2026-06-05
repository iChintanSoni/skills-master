---
name: widgetkit
description: "Use when building or refreshing Home Screen, Lock Screen, StandBy, or watch widgets with WidgetKit and SwiftUI. Triggers: creating a Widget/WidgetConfiguration, writing a TimelineProvider or AppIntentTimelineProvider, choosing reload policies and widget families, adding interactive Button/Toggle App Intents, applying containerBackground, or wiring push-based widget updates."
globs:
  - "**/*.swift"
tags: [widgetkit, widgets, swiftui, app-intents, timeline]
x-skills-master:
  domain: apple
  class: code
  category: app-frameworks
  platforms: [ios, ipados, macos, watchos]
  requires:
    ios: "17"
    swift: "6.0"
  pairs_with: [hig-widgets-design]
  sources:
    - https://developer.apple.com/documentation/widgetkit
    - https://developer.apple.com/documentation/widgetkit/keeping-a-widget-up-to-date
    - https://developer.apple.com/documentation/widgetkit/adding-interactivity-to-widgets-and-live-activities
    - https://developer.apple.com/documentation/widgetkit/updating-widgets-with-widgetkit-push-notifications
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for WidgetKit when you ship glanceable, non-interactive-by-default UI that lives outside your app: Home Screen and Lock Screen widgets, StandBy on iPhone, Apple Watch complications, and the macOS desktop. A widget is a SwiftUI view plus a timeline of dated entries that the system renders on your behalf; your extension is woken briefly to produce entries, not to run continuously.

Use a widget when the content is summarizable in a single static frame and updates on a predictable cadence (minutes to hours). If you need second-by-second live updates tied to an event, use ActivityKit Live Activities instead; if you need a Control Center / Lock Screen toggle, reach for a Control Widget. WidgetKit also backs interactive controls (Button, Toggle) that fire App Intents, so small actions like marking a task done can happen without launching the app.

## Core guidance

- Pick the configuration type up front: `StaticConfiguration` for widgets with no user options, `AppIntentConfiguration` (backed by an `AppIntentTimelineProvider`) when users customize the widget via a `WidgetConfigurationIntent`. Prefer App Intents over legacy SiriKit `INIntent` for any new widget.
- Always declare `supportedFamilies(...)` and provide a layout for each. System families (`systemSmall/Medium/Large/ExtraLarge`) cover Home Screen and Mac; accessory families (`accessoryCircular/Rectangular/Inline`, plus `accessoryCorner` on watchOS) cover Lock Screen, StandBy, and complications.
- Drive every refresh through the timeline. Return entries plus a `TimelineReloadPolicy`: `.atEnd` to refresh after the last entry, `.after(date)` for a specific time, `.never` when only your app or a push should trigger reloads. Treat these as the earliest possible time; the system meters reloads against a per-app budget.
- Never paint to the view's edges. Wrap content in `containerBackground(for: .widget)` so the system can inset, mask, and place the widget correctly across StandBy, the Mac, and removable-background contexts. Read `\.widgetRenderingMode` to support accented and tinted modes.
- Make widgets interactive with `Button`/`Toggle` initialized with an `AppIntent`; only these two controls are interactive, and a reload triggered by an interaction is guaranteed to run. Keep intent `perform()` fast and update shared state your provider reads.
- Refresh from your app with `WidgetCenter.shared.reloadTimelines(ofKind:)` after data changes, and adopt WidgetKit push updates (`WidgetPushHandler` + `pushHandler`) for server-driven or cross-device sync rather than burning timeline budget on polling.
- Render placeholders deterministically (`placeholder(in:)`) and never fetch network or secure data during snapshot/placeholder; redact sensitive values when `\.widgetRenderingMode` indicates a non-fullColor context.

```swift
struct StatusProvider: AppIntentTimelineProvider {
    func placeholder(in context: Context) -> StatusEntry { .preview }
    func snapshot(for configuration: StatusConfig, in context: Context) async -> StatusEntry {
        await StatusEntry.current(for: configuration)
    }
    func timeline(for configuration: StatusConfig, in context: Context) async -> Timeline<StatusEntry> {
        let entry = await StatusEntry.current(for: configuration)
        return Timeline(entries: [entry], policy: .after(.now.addingTimeInterval(900)))
    }
}
```

## Platform notes

- iOS/iPadOS 26: accented and tinted rendering modes affect Home Screen widgets; branch on `\.widgetRenderingMode` and mark images with `widgetAccentedRenderingMode(_:)`. StandBy uses system small / accessory families, so verify those layouts. CarPlay now surfaces widgets across supported vehicles.
- watchOS 26: relevance drives the Smart Stack. Use `RelevanceConfiguration` / `WidgetRelevance` so a widget surfaces by time, location, or routine, and design for accessory families and `accessoryCorner`.
- macOS Tahoe (26): widgets appear on the desktop and Notification Center; ensure tinted/desaturated treatments read well and that `containerBackground` is present, since the Mac inset differs from iOS.
- visionOS 26: existing iOS-compatible WidgetKit + SwiftUI widgets render automatically with depth treatments; you can opt into mounting styles and textures, and adapt with `\.levelOfDetail`.
- WidgetKit push updates are available across all platforms that support WidgetKit; add the push entitlement to the widget extension and treat pushes as budgeted, not guaranteed real-time.

## Pitfalls

- Forgetting `containerBackground` makes widgets fail validation in removable-background contexts and look wrong on Mac/StandBy. It is effectively required for modern targets.
- Returning a single entry with `.never` and expecting the system to keep it fresh — it will not. Pair `.never` with explicit `reloadTimelines` or push.
- Doing network I/O or heavy work in `placeholder`/`snapshot`; these must be instant and side-effect free for the gallery and previews.
- Assuming interaction reloads are free: `Button`/`Toggle` App Intents reload immediately, but ordinary timeline reloads are budgeted and may be deferred.
- Sharing data via `UserDefaults(suiteName:)` / an App Group but forgetting the entitlement on both the app and the extension, so the widget reads stale or empty state.
- Over-supplying families you do not actually lay out for; every entry in `supportedFamilies` must render correctly or the widget is rejected at review.

## References

- **Documentation:** [WidgetKit](https://developer.apple.com/documentation/widgetkit)
- **Documentation:** [Keeping a widget up to date](https://developer.apple.com/documentation/widgetkit/keeping-a-widget-up-to-date)
- **Documentation:** [Adding interactivity to widgets and Live Activities](https://developer.apple.com/documentation/widgetkit/adding-interactivity-to-widgets-and-live-activities)
- **Documentation:** [Updating widgets with WidgetKit push notifications](https://developer.apple.com/documentation/widgetkit/updating-widgets-with-widgetkit-push-notifications)
- **Human Interface Guidelines:** [Widgets](https://developer.apple.com/design/human-interface-guidelines/widgets)
- **WWDC:** [What's new in widgets (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/278/)
- **WWDC:** [Bring widgets to life (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10028/)

## See also

Pair this with the hig-widgets-design skill for layout, density, and rendering-mode design decisions. For event-driven, frequently updating UI, see a Live Activities / ActivityKit skill; for Control Center and Lock Screen toggles, see a Control Widget skill; and for the customization intents behind `AppIntentConfiguration`, see an App Intents skill.
