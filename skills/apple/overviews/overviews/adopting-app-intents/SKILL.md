---
name: adopting-app-intents
description: Decision router for exposing app functionality through the App Intents framework across Siri, Shortcuts, Spotlight, interactive widgets, Controls, the Action button, and Visual Intelligence. Use when deciding which app actions and content to surface as intents, evaluating whether a feature is worth modeling as an intent, planning a phased adoption path, or routing into App Intents implementation work.
tags: [app-intents, siri, shortcuts, spotlight, widgets]
x-skills-master:
  domain: apple
  class: overview
  category: overviews
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  pairs_with: []
  sources:
    - https://developer.apple.com/documentation/appintents
    - https://developer.apple.com/documentation/appintents/making-actions-and-content-discoverable-and-widely-available
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

# Adopting App Intents

App Intents is the framework that publishes an app's actions ("verbs") and content ("nouns") to the system, so people can use core features outside the app. A single intent declaration can light up many surfaces at once. This skill helps decide *what* to expose and in *what order*; it routes into the implementation skill rather than teaching every API.

## When to use

- Deciding which app capabilities deserve to become intents and which should stay in-app only.
- Planning where exposed functionality should appear: Siri, the Shortcuts app, Spotlight, interactive widgets and Controls, the Action button, or Visual Intelligence.
- Sequencing adoption so early effort yields the broadest reach for the least code.

## Core guidance

- Model verbs as intents and nouns as entities. An `AppIntent` is a discrete action with a `perform()`; an `AppEntity` is a referenceable piece of content with a stable `id` and a query. Expose entities so intents can take real app objects as parameters instead of opaque strings.
- One declaration, many surfaces. The same intent can power a Shortcuts action, a Spotlight result, an interactive widget button, a Control, an Action-button assignment, and a Siri request. Build the intent once and let surfaces opt in, rather than writing per-surface plumbing.
- Pick *good* intents: frequent, self-contained, fast, and meaningful on their own. "Start a timer," "log water," "open today's note" make great intents; multi-step flows that demand heavy on-screen context usually do not.
- Promote the few that matter with `AppShortcut`. App Shortcuts are zero-setup phrases that appear in Spotlight, Siri, and the Action button automatically. Reserve them for a handful of headline actions; don't flood the system with every intent.
- Do return a result the surface can use. Provide a dialog and, where it adds value, a snippet view so Siri and Spotlight can show the outcome inline without launching the app. Don't force `openAppWhenRun` unless the task genuinely requires the full UI.
- Don't gate routine actions behind authentication you can avoid, and mark anything sensitive or destructive so the system can confirm before running it.

```swift
struct LogWaterIntent: AppIntent {
    static let title: LocalizedStringResource = "Log Water"

    @Parameter(title: "Amount") var milliliters: Int

    func perform() async throws -> some IntentResult & ProvidesDialog {
        try await HydrationStore.shared.add(milliliters)
        return .result(dialog: "Logged \(milliliters) ml.")
    }
}
```

## Platform notes

- The Action button (iPhone 15 Pro and later) and Apple Pencil Pro squeeze both bind to App Shortcuts, so a well-named shortcut becomes hardware-triggerable for free.
- Controls (Control Center, Lock Screen, Action button) are backed by intents; an action you expose can become a tappable Control with minimal extra code.
- Interactive widgets run intents directly from the widget without opening the app, so design those intents to complete quickly and update the timeline.
- On macOS, Spotlight can run your intents and Apple Intelligence can compose them via the Shortcuts "Use Model" action, raising the value of exposing entities cleanly.
- visionOS, watchOS, and tvOS share the same intent declarations; verify that any snippet or dialog reads well on each form factor.

## Pitfalls

- Exposing too much. Hundreds of intents with no App Shortcuts add maintenance cost without discoverability; curate a small, high-value surface.
- Weak entity identity. Non-stable IDs break Shortcuts that reference your content and degrade Siri parameter resolution; give entities durable identifiers and a real query.
- Treating intents as a thin RPC into existing view code. Intents run outside the app's normal lifecycle, so keep their logic in a shared layer that doesn't assume a live UI.
- Skipping result dialogs and snippets, which forces an app launch for actions the system could have completed in place.
- Forgetting localization and natural phrasing for App Shortcuts, which makes Siri invocation unreliable across the markets you ship to.

## References

- **Documentation:** [App Intents](https://developer.apple.com/documentation/appintents)
- **Documentation:** [Making actions and content discoverable and widely available](https://developer.apple.com/documentation/appintents/making-actions-and-content-discoverable-and-widely-available)
- **Documentation:** [Integrating actions with Siri and Apple Intelligence](https://developer.apple.com/documentation/appintents/integrating-actions-with-siri-and-apple-intelligence)
- **WWDC:** [Get to know App Intents (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/244/)
- **WWDC:** [Develop for Shortcuts and Spotlight with App Intents (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/260/)
- **WWDC:** [Explore new advances in App Intents (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/275/)
- **Human Interface Guidelines:** [Siri](https://developer.apple.com/design/human-interface-guidelines/siri)

## See also

- See `app-intents` for implementing intents, entities, queries, App Shortcuts, and interactive snippets in code.
- See `widgetkit` and `controls-widgets` for wiring exposed intents into interactive widgets and Control Center.
