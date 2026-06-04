---
name: hig-feedback
description: "Design critique and recommendations for feedback and status across Apple platforms: progress, success/confirmation, error and empty states, haptics and sound, and keeping people informed without interrupting. Use when reviewing or designing loading and progress UI, success or error messaging, empty states, alerts, toasts/banners, or haptic and sound feedback, or when judging whether feedback is too noisy, too quiet, or interrupts unnecessarily. Produces HIG-grounded design guidance, not code."
tags: [feedback, status, haptics, alerts, progress]
x-skills-master:
  domain: apple
  class: design
  category: patterns
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  pairs_with: []
  sources:
    - https://developer.apple.com/design/human-interface-guidelines/feedback
    - https://developer.apple.com/design/human-interface-guidelines/loading
    - https://developer.apple.com/design/human-interface-guidelines/alerts
    - https://developer.apple.com/design/human-interface-guidelines/playing-haptics
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

# HIG feedback & status

Critique how an interface communicates what is happening, what succeeded or failed, and what to do next — matching the weight of each message to its importance, and keeping people informed without breaking their flow.

## When to use

- Reviewing loading, progress, or "working…" UI and deciding between determinate vs. indeterminate indicators.
- Critiquing success, confirmation, error, or empty-state designs for clarity and tone.
- Judging whether an alert, toast, banner, haptic, or sound is warranted — or is interrupting unnecessarily.
- Deciding where status should live so people can find it without being interrupted.

## Core guidance

- **Match interruption to importance.** Reserve alerts for critical, ideally actionable information; route routine outcomes to inline status, a transient banner, or a subtle state change. Too many low-value alerts train people to dismiss the next important one.
- **Confirm success quietly, signal failure clearly.** A completed action usually needs only a brief inline cue (a checkmark, an updated value, a short banner). Errors deserve more prominence, plain-language cause, and a concrete next step — never a raw code or jargon.
- **Show progress honestly.** Use a determinate bar when you can estimate completion; use an indeterminate spinner only when you genuinely cannot. Don't fake a progress bar, and don't leave a blank screen — reflect that work is underway within a beat.
- **Prefer placeholder content over blocking spinners.** Show the expected screen immediately with skeleton/placeholder shapes, then fill it in. Avoid making people stare at a full-screen loader before they see structure they recognize.
- **Make empty states do work.** Treat an empty list, search, or first-run view as an opportunity: explain why it's empty and offer the action or path that fills it. Avoid bare "No items" with no direction.
- **Use haptics and sound to reinforce, not replace.** Pair sensory feedback with a visible change so meaning survives silent mode, Reduce Motion, or a glance away. Keep it sparse and consistent — overused haptics feel like noise; map success/warning/error patterns to their real meaning.
- **Keep status discoverable, not in the way.** Surface ongoing state (syncing, recording, download progress) in a persistent, glanceable spot people can check on demand, rather than repeatedly interrupting them to report it.
- **Don't double-report.** One clear signal per outcome. Avoid stacking a haptic, a sound, a banner, and an alert for the same event.

## Platform notes

- **iOS / iPadOS:** Lean on system feedback affordances — toolbars and status surfaces rendered in Liquid Glass keep status legible over content. Use standard alert button roles so destructive and cancel actions read correctly.
- **watchOS:** Glanceability and haptics carry most feedback. Favor short, decisive cues; long determinate progress and verbose errors fit poorly on the wrist.
- **macOS:** Prefer inline and sheet-level feedback over modal alerts; reserve alerts for app-wide or data-loss situations. Progress belongs near the affected content or in a toolbar, not always center-screen.
- **tvOS:** No haptics and a 10-foot context — feedback must be large, focus-driven, and visual; avoid relying on subtle motion or sound alone.
- **visionOS:** Position status and progress within comfortable gaze range and avoid sudden, attention-grabbing motion in the periphery; let feedback feel ambient rather than intrusive.

## Pitfalls

- Modal alerts for routine outcomes ("Saved!") that interrupt and get reflexively dismissed.
- Indeterminate spinners standing in for operations whose progress is actually measurable.
- Error messages that state what failed but not what to do next, or that expose technical codes.
- Empty states that read as broken instead of guiding the next action.
- Haptic or sound feedback as the only signal, defeated by silent mode, Reduce Motion, or accessibility settings.
- Redundant feedback (haptic + sound + banner + alert) for one event, creating noise.

## References

- **Human Interface Guidelines:** [Feedback](https://developer.apple.com/design/human-interface-guidelines/feedback)
- **Human Interface Guidelines:** [Loading](https://developer.apple.com/design/human-interface-guidelines/loading)
- **Human Interface Guidelines:** [Alerts](https://developer.apple.com/design/human-interface-guidelines/alerts)
- **Human Interface Guidelines:** [Playing haptics](https://developer.apple.com/design/human-interface-guidelines/playing-haptics)
- **WWDC:** [Practice audio haptic design (WWDC21)](https://developer.apple.com/videos/play/wwdc2021/10278/)
- **Documentation:** [SensoryFeedback (SwiftUI)](https://developer.apple.com/documentation/swiftui/sensoryfeedback)

## See also

- Pair this critique with the SwiftUI/UIKit feedback implementation skill that wires up progress views, sensory feedback, and alerts in code.
- Relates to the HIG patterns skills for alerts and modality (when interruption is justified) and for loading and launch experiences.
- Complements writing/UX-writing guidance for phrasing error, empty-state, and confirmation copy.
