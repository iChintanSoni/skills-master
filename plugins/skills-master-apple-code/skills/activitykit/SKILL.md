---
name: activitykit
description: Builds ActivityKit Live Activities that surface live data on the Lock Screen and in the Dynamic Island via a widget extension. Use when starting, updating, or ending an Activity, modeling ActivityAttributes and ContentState, laying out compact/minimal/expanded Dynamic Island regions, driving updates with push or broadcast channels, or managing the update budget and stale dates.
---

## When to use

Reach for ActivityKit when your app tracks a short-lived, time-bound event the user wants to glance at without opening the app: a food delivery, a rideshare, a sports score, a workout, or a countdown. A Live Activity renders on the Lock Screen and in the Dynamic Island, and on iOS 26 also flows into the Apple Watch Smart Stack and CarPlay.

Do not use it for ambient, non-event data (use a widget) or for urgent, interruptive prompts (use a notification or AlarmKit). A Live Activity is supplemental, read-mostly context with light interactivity, not a primary surface.

## Core guidance

- Define a single `ActivityAttributes` type. Put values fixed for the whole session (order number, route) directly on the attributes, and the changing values inside the nested `ContentState`. Keep `ContentState` small and `Codable` — it travels over push, so trim it to the few fields the UI actually reads.
- Gate every entry point on `ActivityAuthorizationInfo().areActivitiesEnabled` and start activities only from the foreground. Wrap `Activity.request` in a `do/catch`; it throws when disabled, unsupported, or over the active-activity limit.
- Always pass an `ActivityContent` with a realistic `staleDate` and a `relevanceScore`. The stale date tells the system when content is no longer trustworthy; the score ranks which activity wins the Dynamic Island when several are live.
- Build the UI in a widget extension with `ActivityConfiguration`, supplying both a Lock Screen view and a `DynamicIsland` with `compactLeading`, `compactTrailing`, `minimal`, and `expanded` regions. The same SwiftUI code drives every presentation, so design for the smallest size first.
- For server-driven updates, request with `.pushType: .token` and forward `activity.pushToken` updates to your server; for one-to-many events use `.channel(_:)` broadcast push so one APNs request fans out to every subscriber without you tracking tokens.
- Respect the update budget. Mark non-urgent pushes `apns-priority: 5`, reserve `10` for time-critical ones, and adopt `NSSupportsLiveActivitiesFrequentUpdates` only when the event genuinely needs frequent ticks — check `frequentPushesEnabled` before relying on it.
- End activities deliberately with a `dismissalPolicy`: `.default` keeps the final state briefly, `.immediate` removes it now, and `.after(_:)` pins it until a deadline. Never leave a finished event lingering.

```swift
let attributes = DeliveryAttributes(orderNumber: "A17")
let state = DeliveryAttributes.ContentState(status: .enRoute, etaMinutes: 12)
let content = ActivityContent(state: state, staleDate: .now.addingTimeInterval(900))
do {
    let activity = try Activity.request(
        attributes: attributes, content: content, pushType: .token)
    for await token in activity.pushTokenUpdates {
        await sendToServer(token.map { String(format: "%02x", $0) }.joined())
    }
} catch { log.error("Live Activity request failed: \(error)") }
```

## Platform notes

- **iOS / iPadOS 16.1+:** Baseline support. The Dynamic Island is iPhone-only hardware; on devices without it, compact and minimal presentations are absent, so the Lock Screen view must stand alone.
- **iOS 17+:** Interactive Live Activities via `Button`/`Toggle` backed by App Intents, plus `staleDate` and the `frequentPushesEnabled` authorization signal.
- **iOS 18 / watchOS 11:** Broadcast `.channel(_:)` push for one-to-many updates, and automatic Smart Stack appearance on Apple Watch. Add `supplementalActivityFamilies` to tailor the small (`activityFamily: .small`) watch and CarPlay layout.
- **iOS 26:** Live Activities extend to CarPlay; if you have not implemented the small activity family, CarPlay falls back to your Dynamic Island compact leading/trailing views.

## Pitfalls

- Oversized `ContentState`: heavy payloads get rejected over push and bloat updates. Send derived display values, not raw models or images.
- Forgetting the stale date, leaving stale data on screen indefinitely with no visual signal that it is outdated.
- Assuming the Dynamic Island always exists — guard for hardware that only shows the Lock Screen presentation.
- Hammering `update` or sending every push at priority `10`; the system throttles or drops updates once the budget is spent, and high-frequency pushes need the frequent-updates entitlement plus user opt-in.
- Updating UI from outside the widget extension target — `ActivityConfiguration` views must live in the extension, sharing the attributes type with the app.
- Never calling `end`, so a completed delivery or finished game stays pinned to the Lock Screen.

## References

- **Documentation:** [ActivityKit](https://developer.apple.com/documentation/activitykit)
- **Documentation:** [Displaying live data with Live Activities](https://developer.apple.com/documentation/activitykit/displaying-live-data-with-live-activities)
- **Documentation:** [Starting and updating Live Activities with ActivityKit push notifications](https://developer.apple.com/documentation/activitykit/starting-and-updating-live-activities-with-activitykit-push-notifications)
- **Human Interface Guidelines:** [Live Activities](https://developer.apple.com/design/human-interface-guidelines/live-activities)
- **WWDC:** [Meet ActivityKit (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10184/)
- **WWDC:** [Broadcast updates to your Live Activities (WWDC24)](https://developer.apple.com/videos/play/wwdc2024/10069/)

## See also

Pair this with the hig-live-activities-design skill for layout, content, and presentation guidance across the Lock Screen and Dynamic Island. For the shared SwiftUI rendering model and timeline concepts, lean on the widgetkit skill, and for the App Intents that power interactive buttons and toggles, see the appintents skill. When server-driven updates expand into general remote notifications, cross-reference a push-notifications skill.
