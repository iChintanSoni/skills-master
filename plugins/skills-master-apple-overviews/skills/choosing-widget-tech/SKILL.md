---
name: choosing-widget-tech
description: "Decision guide for picking a glanceable extension on iPhone and iPad: home/Lock Screen widgets, Live Activities with the Dynamic Island, Control widgets, or App Intents and App Shortcuts. Use when deciding how to surface app content or actions outside the app, when a feature needs a static glance, an ongoing event, a quick toggle, or a system-wide action, or when unsure which WidgetKit, ActivityKit, or App Intents API fits."
---

## When to use

Reach for this guide before committing to an extension target. The four
technologies overlap in tooling (SwiftUI, App Intents) but differ sharply in
lifecycle, placement, and update model. Pick by the *shape of the data* and the
*kind of interaction*, not by which API you saw first.

| Use case | Best fit | Why |
| --- | --- | --- |
| Static glance that updates periodically | Widget (home/Lock Screen) | Timeline-driven, persistent |
| Ongoing event with a start and end | Live Activity | Real-time, dismisses itself |
| One-tap toggle or action in system surfaces | Control widget | Lives in Control Center, Lock Screen, Action button |
| Action exposed to Siri, Spotlight, Shortcuts | App Intent + App Shortcut | No on-screen real estate needed |

## Core guidance

- **Do** use a **widget** for content with no fixed lifespan: weather, a
  to-do count, next calendar event. Timelines refresh on a schedule; from
  iOS/iPadOS 18 widgets can also be driven by APNs push for server data.
- **Do** use a **Live Activity** only for an event with a discrete start and
  end (a ride, a delivery, a live score, a workout). It owns the Dynamic
  Island and a Lock Screen banner, and updates in near real time via
  ActivityKit or push. Keep total state under 4 KB.
- **Do** use a **Control widget** for a single discrete action or boolean
  toggle that belongs in Control Center, on the Lock Screen, or on the Action
  button — back it with an App Intent, not custom UI.
- **Do** use an **App Intent + App Shortcut** when the value is the *action*
  itself and it should be reachable from Siri, Spotlight, and Shortcuts with
  no widget surface at all.
- **Don't** fake an ongoing event with a frequently refreshed widget — widget
  timelines are budgeted and throttled; Live Activities exist for this.
- **Don't** put rich interactive UI in a Control widget; a control is a button
  or a toggle, full stop.
- **Idiom:** every interactive element — widget `Button`/`Toggle`, control
  action, Live Activity button — runs through the same `AppIntent.perform()`.
  Write the intent once and reuse it across all four surfaces.

```swift
import AppIntents

struct ToggleTimerIntent: AppIntent {
    static let title: LocalizedStringResource = "Toggle Timer"
    func perform() async throws -> some IntentResult {
        await TimerStore.shared.toggle()
        return .result()   // reused by a Control, a widget Button, and Siri
    }
}
```

## Platform notes

- **iOS / iPadOS:** All four are available. The Dynamic Island is
  iPhone-only hardware; on iPad a Live Activity shows on the Lock Screen and
  notification banner but has no Dynamic Island presentation.
- **Controls** debuted in iOS 18 / iPadOS 18. Live Activities require iOS 16.1+;
  the Dynamic Island needs iPhone 14 Pro or later.
- **Reach beyond iPhone (context for cross-platform apps):** in the 26 cycle a
  Live Activity can surface in CarPlay (using the small activity family) and on
  a paired Mac, and Controls and widgets extend to watchOS, but those targets
  are out of scope here — design the intent and state to travel.
- One App Intent definition can power a widget, a control, a Live Activity
  button, and an App Shortcut simultaneously; share it via a framework target.

## Pitfalls

- **Choosing a Live Activity for open-ended state.** If there is no natural end,
  the user must dismiss it manually and it feels like clutter — use a widget.
- **Reaching for a custom UIView/SwiftUI surface in a control.** Controls render
  as a system button or toggle only; custom layouts are rejected at build time.
- **Forgetting target membership.** An App Intent used by a widget or control
  must belong to *both* the app and the extension target, or actions that open
  the app silently fail.
- **Over-refreshing widgets.** Tight timeline reload policies get throttled by
  the system budget; for live data prefer push updates or a Live Activity.
- **Skipping App Shortcuts.** If an action deserves a control, it almost always
  also deserves a zero-cost App Shortcut phrase for Siri and Spotlight.

## References

- **Documentation:** [WidgetKit](https://developer.apple.com/documentation/widgetkit)
- **Documentation:** [ActivityKit](https://developer.apple.com/documentation/ActivityKit)
- **Documentation:** [Creating controls to perform actions across the system](https://developer.apple.com/documentation/WidgetKit/Creating-controls-to-perform-actions-across-the-system)
- **Documentation:** [App Shortcuts](https://developer.apple.com/documentation/appintents/app-shortcuts)
- **WWDC:** [What's new in widgets (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/278/)
- **WWDC:** [Extend your app's controls across the system (WWDC24)](https://developer.apple.com/videos/play/wwdc2024/10157/)

## See also

For implementation depth once you have chosen a path, see the widget-focused
skills on building timeline providers and interactive widgets, the Live
Activity and Dynamic Island skills under ActivityKit, the Control widget
authoring skill, and the App Intents and App Shortcuts skills that explain
exposing actions to Siri, Spotlight, and the Shortcuts app.
