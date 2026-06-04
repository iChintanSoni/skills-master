---
name: app-intents
description: Defining AppIntent and AppEntity, parameters and resolution, AppShortcuts for Siri and Spotlight, intents that power interactive widgets and Controls, and the perform method. Use when exposing app actions or content to Siri, Spotlight, Shortcuts, widgets, Controls, or Apple Intelligence, or when designing AppEntity, AppShortcutsProvider, queries, or donations.
---

## When to use

Reach for App Intents when you want a single declarative definition of an app action or content type that the whole system can drive: Siri and the Action button, Spotlight, the Shortcuts app, interactive widgets, Control Center Controls, Visual Intelligence, and Apple Intelligence. One `AppIntent` describes the action; one `AppEntity` describes a piece of your data; the framework synthesizes the UI, parameter prompting, and discovery.

Prefer App Intents over the legacy `INIntent`/SiriKit Intents framework for any new work. App Intents is pure Swift, has no separate `.intentdefinition` file, and is the only path to interactive snippets, Controls, and Apple Intelligence schemas. If you already ship SiriKit custom intents, the migration target is App Intents.

## Core guidance

- Keep `perform()` fast, idempotent, and `MainActor`-safe only when it must be. It runs in the background even when your app is closed, so do real work there, not in the UI layer, and return an `IntentResult` (a value, a dialog, a snippet view, or `.result()`).
- Make every `AppEntity` cheap to construct and resolvable from an `id` alone. Pair it with an `EntityQuery` (or `EnumerableEntityQuery` for small fixed sets) so the system can resolve, suggest, and disambiguate parameters. Use `@ComputedProperty` and `@DeferredProperty` (iOS 26) to avoid eagerly loading expensive or networked fields.
- Annotate parameters with `@Parameter` and supply a `parameterSummary` so the intent reads as a natural sentence in Shortcuts. Let the framework resolve values; only implement custom resolution when you need validation, disambiguation, or "ask each time" behavior.
- Expose zero-configuration actions through one `AppShortcutsProvider`. Provide several natural-language `phrases` per shortcut and always include the app name token (`\(.applicationName)`); register `AppShortcut`s up front so they appear in Spotlight and Siri without user setup.
- Drive interactive widgets and Controls by passing an intent to SwiftUI `Button`/`Toggle` (widgets) or to `ControlWidgetButton`/`ControlWidgetToggle` (Controls). Conform configurable widgets to `WidgetConfigurationIntent` and Controls to `ControlConfigurationIntent`; keep these intents side-effect-light so the timeline can reload promptly.
- Donate intents after the user performs an equivalent in-app action so the system can predict and surface them later; let App Shortcuts cover the always-available phrases rather than donating those manually.
- Adopt assistant schemas (the `@AppIntent`/`@AppEntity` schema macros) when a concept maps to a known domain so Apple Intelligence can reason about it; do not invent a schema where none fits.

```swift
struct CompleteTaskIntent: AppIntent {
  static let title: LocalizedStringResource = "Complete Task"
  static let openAppWhenRun = false

  @Parameter(title: "Task") var task: TaskEntity

  func perform() async throws -> some IntentResult & ProvidesDialog {
    try await TaskStore.shared.complete(id: task.id)
    return .result(dialog: "Marked \(task.name) as done.")
  }
}
```

## Platform notes

- iOS/iPadOS 16+: full support, including the Action button (iPhone 15 Pro and later) and interactive widgets (iOS 17+). SnippetIntent and interactive snippets are iOS 26.
- macOS 13+: App Shortcuts surface in Spotlight and the Shortcuts app; Controls and the menu-bar surfaces follow the same intent definitions.
- watchOS 10+ and tvOS 16+: intents and App Shortcuts work, but trim parameter-heavy flows; watchOS leans on Siri and complications, tvOS on Shortcuts.
- visionOS 1+: App Intents drive Shortcuts and Siri the same way; widgets gained Control-style surfaces in the 26 cycle.
- Gate iOS 26-only APIs (`SnippetIntent`, `IntentValueQuery`, `UnionValue`, deferred/computed property macros) with availability checks so the intent still builds and runs on the minimum deployment target.

## Pitfalls

- Doing UI work or assuming app foreground state in `perform()`. The process may be a lightweight extension; touch only background-safe APIs and return results instead of presenting view controllers.
- Heavy or failable `AppEntity` initializers. If constructing an entity hits the network or disk for every field, parameter resolution and widget timelines stall — move those fields behind `@DeferredProperty`/`@ComputedProperty`.
- Phrases without the app-name token, or too few of them. The system needs `\(.applicationName)` and natural variants to match speech reliably; vague phrases simply never trigger.
- Forgetting that changing an `AppShortcut`'s phrases or an intent's identifier can break existing user automations and Siri recognition. Treat intent identifiers and phrase sets as a stable contract.
- Returning a generic error from `perform()`. Throw a typed error conforming to `CustomLocalizedStringResourceConvertible` so Siri and Shortcuts show a useful message.
- Expecting `requestConfirmation`/`requestDisambiguation` to work silently in a widget or Control. Those prompts need an interactive surface; design background-triggered intents to either complete or hand off via `needsToContinueInForegroundError`.

## References

- **Documentation:** [App Intents](https://developer.apple.com/documentation/appintents)
- **Documentation:** [App Shortcuts](https://developer.apple.com/documentation/appintents/app-shortcuts)
- **Documentation:** [Adding interactivity to widgets and Live Activities](https://developer.apple.com/documentation/widgetkit/adding-interactivity-to-widgets-and-live-activities)
- **Human Interface Guidelines:** [Siri](https://developer.apple.com/design/human-interface-guidelines/siri)
- **WWDC:** [Get to know App Intents (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/244/)
- **WWDC:** [Explore new advances in App Intents (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/275/)

## See also

Pair this with a dedicated widgetkit skill when building interactive widgets and Controls that host these intents, and with a control-center-controls skill for the Control Center surface. For voice and assistant tuning, a siri-and-assistant-schemas skill covers Apple Intelligence domain mapping, and a shortcuts-automation skill covers authoring and testing user-facing automations built on your App Shortcuts.
