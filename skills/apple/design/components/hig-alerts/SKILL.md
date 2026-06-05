---
name: hig-alerts
description: "Design critique and recommendations for alerts on Apple platforms, grounded in the Human Interface Guidelines. Use when reviewing or designing an alert, confirmation, or interruption, deciding whether an alert is warranted at all, writing a clear title and concise optional message, choosing one or two buttons and labeling them with specific verbs, emphasizing the safe default action and marking destructive actions, and avoiding alert fatigue. Covers the 26 design cycle with Liquid Glass alerts that morph from their presenting control. Produces UX guidance, not code."
tags: [alerts, modality, confirmation, destructive, components]
x-skills-master:
  domain: apple
  class: design
  category: components
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  pairs_with: []
  sources:
    - https://developer.apple.com/design/human-interface-guidelines/alerts
    - https://developer.apple.com/design/human-interface-guidelines/action-sheets
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

# HIG Alerts

## When to use

Use this skill when critiquing or designing an alert — the small, modal interruption that delivers essential, often risky information and demands an immediate decision. Reach for it during design review to judge whether an alert is justified at all (versus inline feedback, a banner, or an action sheet), how to word its title and message, and how to lay out and label its buttons. This is a design-judgment skill: it produces recommendations and do/don't critique, not Swift code. Name the implementing component (alert, confirmation dialog) in prose and hand off the build to the SwiftUI/UIKit presentation skill.

## Core guidance

- **Reserve alerts for essential, usually consequential information.** An alert is a heavyweight interruption that takes over the screen and blocks the task — earn it. Use one to confirm a destructive or irreversible action, surface a serious error a person must resolve, or request a critical decision. Don't use it for routine confirmations, marketing, tips, or success messages.
- **Write a clear, self-explanatory title.** The title should convey the situation or question on its own; many alerts need nothing more. Make it specific ("Delete this album?") rather than generic ("Are you sure?"), and avoid jargon or error codes the person can't act on.
- **Keep the message short or omit it.** Add a one- to two-sentence message only when the title alone leaves real ambiguity — explain the consequence or what to do next. If the title already says everything, drop the message entirely; never pad it.
- **Prefer one or two buttons; never crowd the alert.** A single OK works for an acknowledgment; two buttons (one safe, one action) cover most decisions. If you find yourself needing three or more choices, you've outgrown an alert — use an action sheet, a menu, or a sheet instead.
- **Emphasize the safe default and mark destructive actions.** Give the preferred, non-destructive choice visual prominence as the default. Style a destructive action with the destructive treatment (the system renders it in red) and always pair it with a clearly labeled Cancel so people can back out safely; don't make destructive the default.
- **Label buttons with specific verbs.** Use the action as the label ("Delete", "Discard", "Keep", "Replace") so the outcome is unambiguous at a glance. Avoid "Yes/No" and vague "OK" for consequential choices, and make sure the Cancel button truly cancels with no side effects.
- **Protect against alert fatigue.** Alerts work only because they're rare; their infrequency is what makes people read them. If your app shows alerts often, people dismiss them reflexively and miss the one that matters. Audit every alert and move non-critical ones to quieter feedback.

## Platform notes

- **iOS / iPadOS:** Alerts are center-screen and modal. In the 26 cycle they adopt Liquid Glass and bolder, left-aligned typography, and the alert morphs out of the control that presented it — preserve that continuity rather than presenting alerts from nowhere. For multiple choices tied to a control, prefer an action sheet (popover on iPad) over a many-buttoned alert.
- **macOS:** Alerts appear as app-modal or window-attached dialogs. Place the default (preferred) button on the trailing side, Cancel to its left, and keep destructive emphasis. Mac users especially resent gratuitous alerts — favor inline validation and undoable actions over confirmation prompts.
- **watchOS:** Keep alerts to a single glanceable question with one or two large buttons; long or multi-part decisions don't belong on the wrist.
- **tvOS:** Make the title readable from across the room and keep buttons few so the focus engine can reach the safe choice and the exit quickly.
- **visionOS:** Present the alert close to its triggering context within the app's space and keep it shallow; avoid pulling attention far from where the decision originated.

## Pitfalls

- Using an alert as a passive notification or success toast, which trains people to dismiss alerts without reading them.
- Vague titles ("Error", "Are you sure?") or messages full of codes that give no actionable guidance.
- Three or more buttons crammed into an alert that should have been an action sheet, menu, or sheet.
- Making the destructive action the default, or omitting a clearly labeled Cancel for a destructive choice.
- Ambiguous button labels ("OK", "Yes") that hide what the action actually does.
- Showing alerts frequently, so the rare critical one is ignored along with the noise.

## References

- **Human Interface Guidelines:** [Alerts](https://developer.apple.com/design/human-interface-guidelines/alerts)
- **Human Interface Guidelines:** [Action sheets](https://developer.apple.com/design/human-interface-guidelines/action-sheets)
- **Human Interface Guidelines:** [Modality](https://developer.apple.com/design/human-interface-guidelines/modality)
- **WWDC:** [Get to know the new design system (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/356/)
- **WWDC:** [Writing great alerts (WWDC17)](https://developer.apple.com/videos/play/wwdc2017/813/)
- **Documentation:** [Modal presentations](https://developer.apple.com/documentation/swiftui/modal-presentations)

## See also

- Implementation: `swiftui-sheets` for building alerts and confirmation dialogs in SwiftUI; pair with the UIKit presentation skill when working in UIKit.
- `hig-modality` for deciding whether to go modal at all and choosing between an alert, action sheet, sheet, or popover.
- `hig-writing` for crafting clear alert titles, messages, and button verbs, and `hig-materials-liquid-glass` for the 26-cycle glass material and morph-from-source behavior.
- Apple HIG: Alerts, Action sheets, Modality (see sources).
