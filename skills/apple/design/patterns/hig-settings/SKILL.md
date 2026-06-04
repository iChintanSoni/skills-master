---
name: hig-settings
description: "Design critique and recommendations for app settings and configuration on Apple platforms, grounded in the Human Interface Guidelines. Use when reviewing or designing a settings screen, deciding between in-app settings and the system Settings app, choosing sensible defaults, grouping and labeling options, or trimming options the app could decide itself. Produces UX guidance and critique, not code. Triggers: settings screen, preferences pane, configuration, onboarding setup choices, defaults, options grouping, Settings bundle, settings app."
tags: [settings, configuration, defaults, patterns, hig, onboarding]
x-skills-master:
  domain: apple
  class: design
  category: patterns
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  pairs_with: []
  sources:
    - https://developer.apple.com/design/human-interface-guidelines/settings
    - https://developer.apple.com/design/human-interface-guidelines/onboarding
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

# HIG Settings

Critique and shape an app's settings so people get a great experience with little or no setup, and find the few options they do need exactly where they expect them.

## When to use

- Reviewing a settings or preferences screen and judging whether each option earns its place.
- Deciding what belongs in in-app settings versus the system Settings app (or a macOS Settings window).
- Choosing defaults, or replacing a setup question with a sensible inferred default.
- Organizing, grouping, and labeling options so they are scannable and unambiguous.
- Pruning configuration the app could reasonably decide on its own.

## Core guidance

- **Minimize the number of settings.** Every option is a decision you push onto the person. Default to fewer, well-chosen settings; an app that works well immediately beats one that demands setup first. Treat each new toggle as a design failure to justify, not a feature.
- **Infer instead of asking.** Before adding a setting, ask whether the system already knows the answer — locale, time zone, region, appearance, accessibility preferences, device capabilities, account state. Query the system rather than making people re-enter what the device can supply.
- **Don't surface choices the app can make itself.** If one option is right for nearly everyone, just pick it. Reserve settings for genuine preferences where reasonable people differ; avoid exposing internal implementation toggles or rarely-touched edge cases.
- **Pick a strong default for every setting.** Defaults should suit most people so the screen works untouched. Make the default the safest, most private, and least surprising choice, and order options so the common case reads first.
- **Place options by how often they change.** Put frequently adjusted controls in context on the main UI; move occasional ones to a secondary screen; keep rarely changed, app-wide preferences (interface style, alternate icon) in the app's settings area or the system Settings app.
- **Group and label for fast scanning.** Cluster related options under clear section headers, use plain nouns and verbs over jargon, and prefer a single clear control to several overlapping ones. State what each option does, not how it is implemented.
- **Respect system-level settings — don't duplicate them.** Honor Dark Mode, Dynamic Type, Reduce Motion, and notification permissions rather than re-creating parallel app-only toggles that can drift out of sync with the system.

## Platform notes

- **iOS, iPadOS:** Favor in-app settings for anything people adjust while using the app; reserve the system Settings app (a Settings bundle) for rarely changed, set-and-forget preferences. Don't split related settings across both places.
- **macOS:** Provide a dedicated Settings window reached via the app menu and Command-comma. Use tabbed panes only when categories are distinct; title an untabbed window "App Name Settings" and keep the window compact and resizable to its content.
- **visionOS, tvOS, watchOS:** Input is costly here — lean even harder on inferred defaults and minimal options. On tvOS and watchOS, surface only essentials in-app and push the rest to the companion or system Settings. In visionOS, avoid burying choices that disrupt an immersive experience.
- **Liquid Glass (26 cycle):** Let standard settings components adopt the system's Liquid Glass material automatically; don't hand-tint list rows or controls in ways that fight legibility or the platform's grouped-list styling.

## Pitfalls

- Asking setup questions at first launch that the app could answer by inference or sensible defaults.
- A long flat list of toggles with no grouping, vague labels, or implementation-flavored wording.
- Duplicating system preferences (appearance, text size, notifications) as app-only switches that desync.
- Scattering related settings between in-app screens and the system Settings app.
- Exposing a setting "just in case" instead of choosing a good default — every option dilutes focus.
- Defaults that favor the developer (maximal data sharing, opt-in marketing) rather than the person.

## References

- **Human Interface Guidelines:** [Settings](https://developer.apple.com/design/human-interface-guidelines/settings)
- **Human Interface Guidelines:** [Onboarding](https://developer.apple.com/design/human-interface-guidelines/onboarding)
- **WWDC:** [App essentials in SwiftUI (WWDC20)](https://developer.apple.com/videos/play/wwdc2020/10037/)
- **Documentation:** [Settings (SwiftUI scene)](https://developer.apple.com/documentation/swiftui/settings)

## See also

- The SwiftUI/UIKit code skill that implements a settings scene and Settings bundle, which turns these decisions into a `Settings` scene, grouped `Form`/`List` controls, and `UserDefaults`-backed values.
- The onboarding design skill, for deciding which choices belong in first-run setup versus deferred to settings.
- The HIG accessibility skill, for honoring Dynamic Type, Reduce Motion, and appearance rather than rebuilding them as app settings.
