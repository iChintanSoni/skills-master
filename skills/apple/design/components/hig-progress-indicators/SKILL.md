---
name: hig-progress-indicators
description: "Applies Apple Human Interface Guidelines to progress indicators and gauges — choosing a determinate bar when completion is estimable versus an indeterminate activity spinner, using gauges for levels within a range, giving the wait meaningful context, and not flashing an indicator for near-instant work. Use when designing or reviewing a download, export, sync, upload, or any wait that shows a bar, spinner, or gauge, or when critiquing whether the indicator type, accuracy, and placement are right. Produces design critique and recommendations, not code."
tags: [progress, status, gauges, components, feedback, loading]
x-skills-master:
  domain: apple
  class: design
  category: components
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  pairs_with: []
  sources:
    - https://developer.apple.com/design/human-interface-guidelines/progress-indicators
    - https://developer.apple.com/design/human-interface-guidelines/gauges
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Use when designing or reviewing any visible wait or level readout: a download or export bar, a sync or search spinner, an upload, or a gauge showing battery, storage, or signal. This is a design-judgment skill — it produces do/don't critique on indicator type, accuracy, context, and placement, not Swift. For the implementation, hand off to the SwiftUI skill that covers progress views and gauges.

## Core guidance

- **Prefer a determinate bar whenever completion is estimable.** If the work is quantifiable (download, file conversion, export, copy), show a determinate progress bar so people can decide whether to wait, multitask, or abandon. Reserve the indeterminate activity spinner for unquantifiable work — syncing, searching, contacting a server — where you genuinely can't predict the end.
- **Report progress honestly.** Never inch a bar forward just to look busy, and never let it park at 99%. Be as accurate as you can, and even out the pace so the rate feels trustworthy rather than lurching. If you start indeterminate and the duration becomes calculable, switch to determinate — but don't ricochet between bar and spinner styles, which reads as instability.
- **Don't flash an indicator for near-instant work.** For sub-second operations, an indicator that appears and vanishes is jarring visual noise that makes the app feel slower and busier. Show nothing, or briefly disable the control. Add a delay so the indicator only appears if the wait actually exceeds a perceptible threshold.
- **Give the wait meaningful context — or none.** A short, specific label ("Importing 240 photos", "Step 2 of 4") helps; vague words like "Loading…" or "Please wait" add nothing and just take space. State the operation, not an instruction.
- **Choose a gauge, not a progress indicator, for a level.** A gauge shows a value within a fixed range that rises and falls (battery, storage used, signal, heart-rate zone) — it has no notion of "done." A progress indicator shows a one-way task advancing toward completion. Don't use a progress bar to depict a steady-state level, and don't use a gauge for a finite task.
- **Label and color a gauge for instant reading.** Mark the meaningful endpoints (min/current/max) and use color to signal state — a tint that shifts toward a warning hue as a value nears a critical threshold — but never rely on color alone. Keep the range honest so the fill maps to reality.
- **Place indicators consistently and keep them animated.** Put progress in a stable, expected spot (toolbar, sheet, inline next to the item) so people can find status reliably; a frozen spinner reads as a hung app. Offer Cancel or Pause where interruption is safe, and confirm before discarding meaningful progress.

## Platform notes

On iOS and iPadOS, inline determinate bars and the standard refresh control are the norm; in the 26 design, let progress chrome sit beneath the Liquid Glass navigation and toolbar layers rather than competing with them. On macOS, an indeterminate bar can run as a barber-pole, small spinners suit background or space-constrained work (don't label them), and long operations belong in a window toolbar, sheet, or the Dock rather than blocking the document. On watchOS, gauges and progress rings are first-class and glanceable — keep waits brief, tint to match the context, and prefer a circular ring or gauge over a long modal wait. On tvOS, indicators must read from across the room: large, focal, high-contrast. In visionOS, keep progress shallow within the window and comfortable to focus on; avoid spinners that float free in space or pull attention away from the task.

## Pitfalls

- An indeterminate spinner for a download or export that has a real, measurable percentage.
- A determinate bar faked for unknown-duration work, then stalling near the end.
- An indicator that flickers on and off for fast responses, adding noise and a sense of slowness.
- A "Loading…" or "Please wait" label that conveys nothing where a specific status would.
- A progress bar used to show a steady-state level (battery, storage), or a gauge used for a finite task.
- A gauge whose color is the only cue to a warning state, failing for color-blind users and VoiceOver.
- A long operation with no Cancel, or one that discards progress on cancel without warning.

## References

- **Human Interface Guidelines:** [Progress indicators](https://developer.apple.com/design/human-interface-guidelines/progress-indicators)
- **Human Interface Guidelines:** [Gauges](https://developer.apple.com/design/human-interface-guidelines/gauges)
- **Human Interface Guidelines:** [Loading](https://developer.apple.com/design/human-interface-guidelines/loading)
- **WWDC:** [Get to know the new design system (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/356/)
- **Documentation:** [ProgressView](https://developer.apple.com/documentation/swiftui/progressview)
- **Documentation:** [Gauge](https://developer.apple.com/documentation/swiftui/gauge)

## See also

- Implementation: the SwiftUI skill covering `ProgressView` (determinate and indeterminate) and `Gauge` with its linear, circular, and capacity styles, plus the UIKit/AppKit progress and activity indicator code skill.
- Related design skills: the loading and perceived-performance skill (skeletons versus spinners, slow and offline waits), the feedback skill (when an indicator is the right signal), the color skill (warning tints and not relying on color alone), and the accessibility foundation skill (announce progress and gauge values to VoiceOver, respect Reduce Motion).
- Apple HIG: Progress indicators, Gauges, Loading (see sources).
