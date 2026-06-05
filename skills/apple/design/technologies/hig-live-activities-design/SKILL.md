---
name: hig-live-activities-design
description: "Design guidance and critique for Live Activities and the Dynamic Island on iOS and iPadOS, grounded in Apple's Human Interface Guidelines. Use when reviewing or designing glanceable progress for a defined-duration task or live event: compact, minimal, and expanded Dynamic Island presentations, the Lock Screen banner layout, update cadence and alerting, and ending the activity gracefully. Produces design recommendations and review notes, not code. Triggers: Live Activity, Dynamic Island, ActivityKit UX, glanceable progress, lock-screen activity, Smart Stack, CarPlay Live Activity, delivery or sports score tracker design."
tags: [live-activities, dynamic-island, glanceable, lock-screen, activitykit]
x-skills-master:
  domain: apple
  class: design
  category: technologies
  platforms: [ios, ipados]
  pairs_with: [activitykit]
  sources:
    - https://developer.apple.com/design/human-interface-guidelines/live-activities
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Use this skill to critique or design a Live Activity and its Dynamic Island presentations: tracking a food-delivery ETA, a ride, a sports score, a workout, a timer, or a multi-step task that has a clear beginning and end. Reach for it during design review when someone proposes "put it in the Dynamic Island," when deciding what to show in each presentation, when judging update frequency, or when an activity lingers after completion. Not for ambient/always-running status (that is widgets) or for tasks without a foreseeable end.

## Core guidance

- **Offer one only for a bounded, live task.** Live Activities fit events and tasks with a defined start and end and frequently-changing data. Do not use one for an open-ended status or anything expected to run beyond roughly eight hours — after that the system stops updates and the activity reads as stale.
- **Show only the single most essential, glanceable fact per presentation.** People read these in under a second. Lead with the one number or state that answers "how is it going right now" (minutes away, score, step N of M); push everything else to the expanded view or your app.
- **Treat the compact pair as one thought split by the camera.** The leading and trailing compact regions sit either side of the TrueDepth sensor; design them to read as a single piece of information (e.g. icon leading, ETA trailing), keep both narrow, and have either side tap to the same screen.
- **Use minimal for "there are others."** When multiple activities are live the system shows yours as a tiny attached or detached circle — pick one tiny glyph or value that survives at that size; never cram two facts in.
- **Make expanded richer, not just bigger.** On touch-and-hold, fill the four regions (leading, trailing, center, bottom) with your app's personality, a clear progress indicator, and at most one or two essential controls — favor concentric, rounded layouts that nest within the island shape; do not duplicate the whole app screen.
- **Design the Lock Screen banner as its own graphic layout, not a notification clone.** Give it a distinct, branded look with comfortable margins, a progress element, and a consistent visual language shared with the expanded view so people recognize it across surfaces. Keep tap targets large and obvious.
- **Update on meaningful change, and alert only when it needs attention.** Push updates when the state genuinely moves (new score, ETA shift, status change), not on a fixed clock. Reserve an alerting update — which lights the screen and plays a sound — for moments the person must not miss (order arriving, your turn); over-alerting trains people to dismiss you.
- **End it the instant the task completes, then leave a short, final resolved state.** Don't let a delivered order or finished game keep occupying the island and Lock Screen; transition to a clear "done/arrived/final" state and dismiss promptly so the surface returns to the system.

## Platform notes

- **iOS:** Full surface set — Dynamic Island compact/minimal/expanded on supported iPhones, plus the Lock Screen banner on every iPhone. StandBy scales the Lock Screen layout up for ambient viewing, so verify legibility and contrast at large size and in night mode.
- **iPadOS:** No Dynamic Island; the Lock Screen presentation is the primary surface, so the banner layout carries the experience — invest there.
- **Apple Watch:** On supported pairings your iOS Live Activity surfaces automatically in the Smart Stack using the small activity family (the same compact content). Tailor that small layout for the wrist, account for Always On (reduced luminance), and keep it readable at a glance.
- **CarPlay (incl. CarPlay Ultra):** Live Activities appear on the CarPlay Dashboard or as notifications using the small activity family. Keep glances driver-safe: minimal text, high contrast, no fine detail that demands attention.
- **Liquid Glass (the 26 cycle):** The Dynamic Island and these system surfaces render in the system's Liquid Glass material. Don't fight it with heavy opaque backgrounds or your own faux-glass — supply clean content and let the platform material, blur, and concentric shapes do the framing.

## Pitfalls

- Cramming a dashboard into compact or minimal — at those sizes only one fact survives; everything else is noise.
- Leaving the activity up after it finishes, so a "delivered" order or final score squats on the Lock Screen and island.
- Alerting on every routine update; the sound-and-light treatment should be rare and consequential.
- Making the Lock Screen banner look like a plain notification instead of a branded, graphic layout.
- Inconsistent design between Lock Screen and expanded presentations, so people can't tell it's the same activity.
- Using a Live Activity for an always-on or indefinite status — that is a widget's job, not this surface.
- Tiny or ambiguous tap targets, or leading/trailing taps that go to different places.

## References

- **Human Interface Guidelines:** [Live Activities](https://developer.apple.com/design/human-interface-guidelines/live-activities)
- **WWDC:** [Design dynamic Live Activities (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10194/)
- **WWDC:** [Bring your Live Activity to Apple Watch (WWDC24)](https://developer.apple.com/videos/play/wwdc2024/10068/)
- **Documentation:** [ActivityKit](https://developer.apple.com/documentation/ActivityKit/)
- **Documentation:** [Displaying live data with Live Activities](https://developer.apple.com/documentation/activitykit/displaying-live-data-with-live-activities)

## See also

- The **activitykit** code skill implements these presentations and the update/end lifecycle in SwiftUI and WidgetKit — pair this critique with it when moving from design to build.
- **hig-widgets-design** for the related question of when ambient, always-available status belongs in a widget rather than a Live Activity.
- **hig-notifications-design** for getting the alerting decision right, since an alerting Live Activity update behaves like a notification.
- **hig-liquid-glass-foundations** for how the system material, concentricity, and contrast rules shape what you place in the island and banner.
