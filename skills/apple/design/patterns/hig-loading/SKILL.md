---
name: hig-loading
description: "Applies Apple Human Interface Guidelines to loading states and perceived performance — showing UI immediately, placeholders and skeletons versus spinners, determinate versus indeterminate progress, incremental loading, and slow or offline networks. Use when designing or reviewing a loading experience, a blank-while-fetching screen, a progress indicator, or pull-to-refresh, or critiquing how an app feels during waits. Produces design critique and recommendations, not code."
tags: [hig, design, loading, progress, performance, patterns]
x-skills-master:
  domain: apple
  class: design
  category: patterns
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  pairs_with: []
  sources:
    - https://developer.apple.com/design/human-interface-guidelines/loading
    - https://developer.apple.com/design/human-interface-guidelines/progress-indicators
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Use when designing or reviewing how an app behaves while it fetches or computes content: the first frame after launch or navigation, a spinner-on-blank screen, a progress bar, pull-to-refresh, or recovery from a slow or dropped connection. This is a design-judgment skill — it produces do/don't critique and recommendations, not Swift. For the implementation, hand off to the SwiftUI skill that covers progress views and redaction.

## Core guidance

- **Show the screen immediately.** Never block a whole view behind a fetch. Render the layout — navigation bar, structure, known content — at once, and mark only the not-yet-loaded regions as pending. A blank or static screen reads as frozen and pushes people to leave.
- **Prefer skeletons/placeholders over a centered spinner for content.** A redacted placeholder that mirrors the real layout (rows, cards, avatars) sets accurate expectations and makes the swap-in feel instant. Reserve a bare activity indicator for short, shapeless waits where you can't preview structure.
- **Pick the indicator that matches what you know.** Use a determinate progress bar only when the task is quantifiable (download, export, conversion) so people can decide whether to wait. Use an indeterminate activity indicator for unquantifiable work (syncing, searching). Don't fake a progress bar for unknown durations.
- **Report progress honestly.** Don't inch a bar forward just to look busy, and don't let it stall at 99%. If a step's length is unknown, switch to an indeterminate indicator rather than inventing numbers.
- **Load incrementally and prioritize what's visible.** Stream content in as it arrives instead of waiting for everything; fill above-the-fold and on-screen items first, and preload likely-next content in the background during animations or idle moments.
- **Design the slow and offline cases deliberately.** Keep the UI responsive and interactive while data loads, surface cached content when you have it, and on failure give a clear, recoverable empty/error state with a retry — not an endless spinner. Tell people when something is loading and let them cancel long operations.
- **Don't over-animate the wait.** Spinners and shimmer should feel calm and secondary; avoid flashing a loader for sub-second fetches (which causes a jarring flicker) and avoid full-screen takeovers for minor updates.

## Platform notes

On iPhone and iPad, pull-to-refresh and inline skeletons are the norm; in the iOS/iPadOS 26 design, let loading chrome sit beneath the Liquid Glass navigation and toolbar layers rather than competing with them, and keep refresh affordances within the standard control. On macOS, a determinate bar can also run indeterminate (barber-pole) and progress often belongs in a window toolbar, sheet, or the Dock rather than blocking the document. On watchOS, keep waits brief and glanceable — a small ring or inline indicator, never a long modal wait. On tvOS, loading must read from across the room: large, focal placeholders and clear focus. In visionOS, keep loading indicators shallow and comfortable within the window, avoiding spinners that float in space or pull focus.

## Pitfalls

- A full-screen spinner over an otherwise-renderable layout, when a skeleton would let the UI appear instantly.
- An indeterminate spinner for a download or export that has a measurable percentage.
- A progress bar that lies — padded to look busy, or frozen near the end.
- No offline or error path: a spinner that runs forever with no cached fallback, message, or retry.
- Loading the entire dataset before showing anything, instead of streaming visible content first.
- A loader that flickers on for fast responses, creating visual noise.

## References

- **Human Interface Guidelines:** [Loading](https://developer.apple.com/design/human-interface-guidelines/loading)
- **Human Interface Guidelines:** [Progress indicators](https://developer.apple.com/design/human-interface-guidelines/progress-indicators)
- **WWDC:** [Ultimate application performance survival guide (WWDC21)](https://developer.apple.com/videos/play/wwdc2021/10181/)
- **WWDC:** [Get to know the new design system (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/356/)
- **Documentation:** [Improving app responsiveness](https://developer.apple.com/documentation/xcode/improving-app-responsiveness)

## See also

- Implementation: the SwiftUI skill covering `ProgressView`, `.redacted(reason:)` skeletons, and `.refreshable`, plus the empty/error-state code skill for `ContentUnavailableView`.
- Related design skills: the empty-states pattern skill, the materials and Liquid Glass foundation skill, and the accessibility foundation skill (announce loading and progress to VoiceOver, respect Reduce Motion).
- Apple HIG: Loading, Progress indicators (see sources).
