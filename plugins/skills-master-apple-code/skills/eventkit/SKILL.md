---
name: eventkit
description: "Access Calendar events and Reminders with EventKit and EventKitUI on Apple platforms. Use when creating, editing, or querying EKEvent or EKReminder, requesting calendar/reminders authorization, building recurrence rules, or presenting EKEventEditViewController. Triggers: EKEventStore, requestFullAccessToEvents, write-only access, predicateForEvents, EKRecurrenceRule, calendar permission strings."
---

## When to use

Reach for EventKit when your app reads or writes the user's Calendar events
(`EKEvent`) or Reminders (`EKReminder`) through a shared `EKEventStore`. Use it
for scheduling features, syncing app data to calendars, surfacing due reminders,
or building recurring entries. Pair it with EventKitUI when you want Apple's
system editor sheet rather than a hand-built form. If you only need a one-off
"add to calendar" gesture, prefer the editor sheet — it sidesteps the permission
flow entirely.

## Core guidance

- **Pick the narrowest scope.** Since iOS 17 there are two event scopes:
  write-only (you can add events you created but not read the calendar) and
  full. Reminders only offers full access — there is no write-only variant.
- **Request, then branch on status.** Call the matching async request method,
  then read `EKEventStore.authorizationStatus(for:)`, which returns
  `.fullAccess`, `.writeOnly`, `.denied`, `.notDetermined`, or `.restricted`.
  Treat `.writeOnly` as "can save, cannot fetch."
- **Don't re-prompt.** A request after a denial returns immediately without UI;
  route the user to Settings instead of looping the request.
- **Reuse one store.** Keep a single long-lived `EKEventStore`; creating many is
  expensive and detaches fetched objects from their store.
- **Always set a calendar before saving.** Assign `event.calendar` (often
  `store.defaultCalendarForNewEvents`) or `save` throws.
- **Persist with `commit: true`** so writes flush immediately, and observe
  `.EKEventStoreChanged` to refetch after external edits.
- **Recurrence via `EKRecurrenceRule`** — never duplicate events by hand.

```swift
let store = EKEventStore()
guard try await store.requestWriteOnlyAccessToEvents() else { return }
let event = EKEvent(eventStore: store)
event.title = "Design review"
event.startDate = .now
event.endDate = .now.addingTimeInterval(3600)
event.calendar = store.defaultCalendarForNewEvents
event.recurrenceRules = [EKRecurrenceRule(recurrenceWith: .weekly, interval: 1, end: nil)]
try store.save(event, span: .futureEvents, commit: true)
```

## Platform notes

- **Info.plist usage strings are mandatory.** Add
  `NSCalendarsWriteOnlyAccessUsageDescription` and/or
  `NSCalendarsFullAccessUsageDescription` for events, and
  `NSRemindersFullAccessUsageDescription` for reminders. The legacy
  `NSCalendarsUsageDescription` / `NSRemindersUsageDescription` keys act only as
  fallbacks on older OSes. Missing a required key crashes on first request.
- **EKEventEditViewController runs out of process on iOS 17+,** so presenting it
  to add or edit an event needs no authorization and no usage string. Bridge it
  into SwiftUI with `UIViewControllerRepresentable` plus a `Coordinator`
  conforming to `EKEventEditViewDelegate`.
- **watchOS** supports EventKit but not EventKitUI; build your own UI there.
- **macOS** uses the same APIs; sandboxed Mac apps still require the usage keys.

## Pitfalls

- **Assuming write-only can fetch.** `events(matching:)` and `calendars(for:)`
  return empty or fail under `.writeOnly`; gate read paths on `.fullAccess`.
- **Fetching without a predicate.** Build one with
  `predicateForEvents(withStart:end:calendars:)`, then call `events(matching:)`;
  there is no "all events" call, and unbounded ranges are slow.
- **Editing one occurrence with the wrong span.** Choose `.thisEvent` vs
  `.futureEvents` deliberately when saving or removing recurring events.
- **Ignoring `.EKEventStoreChanged`.** Cached `EKEvent` objects can go stale;
  refetch after the notification or after `reset()`.
- **Setting `dueDateComponents` without a calendar component** leaves reminders
  without an alarmable date.

## References

- **Documentation:** [TN3153: Adopting API changes for EventKit](https://developer.apple.com/documentation/technotes/tn3153-adopting-api-changes-for-eventkit-in-ios-macos-and-watchos)
- **Documentation:** [requestFullAccessToEvents(completion:)](https://developer.apple.com/documentation/eventkit/ekeventstore/requestfullaccesstoevents(completion:))
- **Documentation:** [EKAuthorizationStatus](https://developer.apple.com/documentation/EventKit/EKAuthorizationStatus)
- **WWDC:** [Discover Calendar and EventKit (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10052/)
- **Sample Code:** [Accessing Calendar using EventKit and EventKitUI](https://developer.apple.com/documentation/EventKit/accessing-calendar-using-eventkit-and-eventkitui)

## See also

For the system event editor sheet and other interop patterns, see a
swiftui-uikit-interop skill on bridging `UIViewControllerRepresentable`. For
deferring or batching calendar writes off the main actor, see a
swift-concurrency skill. When surfacing reminder due dates as alerts, a
user-notifications skill covers the complementary local-notification path.
