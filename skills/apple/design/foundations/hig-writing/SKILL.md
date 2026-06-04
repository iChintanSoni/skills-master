---
name: hig-writing
description: "Critiques and improves UX writing for Apple platform apps using Human Interface Guidelines: voice and tone, concise button and label text, capitalization (title-style vs sentence-style), helpful alerts and error messages, and inclusive language. Use when reviewing or writing interface copy, button titles, labels, alert and error wording, empty states, permission prompts, onboarding text, or notifications; when copy feels wordy, jargony, or off-brand; or when checking capitalization and inclusive-language choices. Produces design guidance and copy critique, not code."
tags: [writing, ux-writing, content, foundations, hig, inclusion]
x-skills-master:
  domain: apple
  class: design
  category: foundations
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  pairs_with: []
  sources:
    - https://developer.apple.com/design/human-interface-guidelines/writing
    - https://developer.apple.com/design/human-interface-guidelines/inclusion
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

# HIG Writing

Interface copy is part of the design. Clear, concise, on-brand writing helps people move through a flow without friction; vague or wordy text creates hesitation. Use this skill to critique and rewrite button titles, labels, alerts, errors, empty states, and onboarding copy against Apple's writing guidance.

## When to use

- Reviewing or drafting button titles, menu items, labels, or section headers.
- Writing or auditing alerts, error messages, permission prompts, and confirmation dialogs.
- Establishing a consistent voice and situational tone for an app or game.
- Checking capitalization style and inclusive, people-first language.
- Tightening copy that feels wordy, jargony, repetitive, or too clever.

## Core guidance

- **Lead with the why, then the action.** State the benefit before the request so the value is clear: prefer "To get reservation updates, enter your phone number" over the reverse. People decide faster when the payoff comes first.
- **Use verbs for buttons and links; be specific.** A button title should name its outcome ("Delete Draft", "Save to Library"), not a generic "OK" or "Confirm". Specific, action-oriented labels let people navigate without reading surrounding text.
- **Cut fillers and repetition.** Remove "simply", "quickly", "easily", "please", and interjections like "oops". Don't restate the same fact across title, message, and button. Economy of language reads as confidence, not curtness.
- **Capitalize consistently per platform convention.** Use title-style for buttons, menu items, and most controls (capitalize words except short prepositions/articles, but always the first and last word); use sentence-style for longer text like alert messages and body copy. Pick one style per element type and hold it throughout.
- **Write alerts that are helpful, not just present.** A good alert says what happened and what to do next; the title can pose the choice, the message adds only necessary context, and buttons restate the actions. Reserve alerts for confirming consequential or destructive actions, not routine feedback.
- **Make errors actionable and blameless.** Explain what went wrong and the next step, in plain language, without blaming the person or exposing internal codes. Prefer "Couldn't connect. Check your network and try again." over "Error 503".
- **Set a voice, then vary tone by moment.** Decide what your app would and wouldn't say (trustworthy, playful, calm), then adjust tone to context: celebratory for an achievement, neutral and reassuring for an interruption or failure. Use exclamation points sparingly.
- **Write inclusively and people-first.** Use plain, jargon-free language everyone can parse; describe a person before any disability, never use a disability as a negative metaphor, and check how a community self-identifies. Avoid idioms and culture-specific humor that resist localization.

## Platform notes

- **iOS, iPadOS:** Title-style for buttons and bars; keep labels short for narrow widths and Dynamic Type. Permission prompts must state a concrete reason people understand.
- **macOS:** Menus, buttons, and titles use title-style; a menu item or button that opens a further dialog ends with an ellipsis. Window and document titles tend to be more verbose than touch UI.
- **watchOS:** Severely limited space rewards the shortest accurate phrasing; favor glanceable verbs and front-load the most important word.
- **tvOS:** Copy is read at a distance, often aloud-feeling; keep titles brief and unambiguous, and avoid dense paragraphs in focus-driven UI.
- **visionOS:** Text floats in shared space, so keep strings short and high-contrast in meaning; the same voice and capitalization rules apply.

## Pitfalls

- Generic "OK"/"Cancel"/"Confirm" buttons that force people to read the message to know what each does.
- Stuffing the alert message with text already implied by the title, or with internal error codes.
- Mixing title-style and sentence-style within the same control type, creating an inconsistent feel.
- Cleverness over clarity — puns and whimsy in empty states or errors that obscure the next step.
- Disability-as-insult metaphors, idioms, or humor that break in translation or exclude readers.
- Over-punctuating with exclamation points so genuine moments of delight lose impact.

## References

- **Human Interface Guidelines:** [Writing](https://developer.apple.com/design/human-interface-guidelines/writing)
- **Human Interface Guidelines:** [Inclusion](https://developer.apple.com/design/human-interface-guidelines/inclusion)
- **WWDC:** [Writing for interfaces (WWDC22)](https://developer.apple.com/videos/play/wwdc2022/10037/)
- **WWDC:** [Add personality to your app through UX writing (WWDC24)](https://developer.apple.com/videos/play/wwdc2024/10140/)
- **WWDC:** [Make a big impact with small writing changes (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/404/)

## See also

- **hig-alerts** (or the alerts/dialogs design skill) for when an alert is the right container and how to structure its choices.
- **hig-accessibility** and **hig-inclusion** for accessibility labels, VoiceOver phrasing, and broader inclusive-design judgment that complements inclusive copy.
- **hig-onboarding** for first-run and empty-state copy strategy.
- The SwiftUI/UIKit text-and-controls code skill (e.g. **swiftui-text-and-labels**) implements these strings via `Text`, `Button`, `Label`, `Alert`/`alert(_:)`, and localized `String` catalogs.
