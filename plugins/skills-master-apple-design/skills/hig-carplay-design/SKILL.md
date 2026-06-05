---
name: hig-carplay-design
description: "Design-review guidance for CarPlay apps per the Human Interface Guidelines. Use when designing, auditing, or critiquing an in-car experience: choosing a supported app category (audio, communication, navigation, EV charging, fueling, parking, public safety, quick food ordering, driving task), composing the system templates (tab bar, list, grid, information, point of interest, map, now playing), keeping interactions brief and glanceable while driving, sizing touch targets, leaning on Siri/voice, or limiting menu depth. Produces UX critique grounded in the HIG, not code. Triggers: CarPlay design review, in-car UX, minimal glances, large touch targets, template depth, driver distraction, CarPlay category eligibility, Liquid Glass in the car."
---

# hig-carplay-design

## When to use

Use this skill to critique or design how an app behaves on the car's built-in
display through CarPlay: which supported category it fits, which system
templates it composes, how brief and glanceable each screen is, and how it
keeps a driver's attention on the road. Reach for it during a CarPlay design
review, when an in-car flow feels too deep or busy, when deciding what to leave
out, or when sizing targets and copy for arm's-length reading at a glance. This
skill produces design judgment, not implementation.

## Core guidance

- **Design for the road, not feature parity.** CarPlay is not a smaller mirror
  of your iPhone app. Surface only what helps a driver in motion; leave account
  management, settings, browsing, and rich editing on the phone. Every screen
  should support a brief interaction the driver can complete in a glance or two
  and never demand sustained attention.
- **Compose the provided templates — do not invent UI.** CarPlay renders a
  fixed set of system templates (tab bar, list, grid, information, point of
  interest, map, search, now playing, alert, action sheet). The system handles
  layout, type size, contrast, and touch-target sizing across every car
  display, so your job is structure and content, not pixels. Custom drawing is
  limited to map content and now-playing artwork.
- **Stay shallow.** Apple caps template depth by category (for example, audio,
  communication, navigation, EV charging, parking, and public safety apps allow
  up to five levels; fueling and voice-conversational up to three; driving-task
  and quick-food-ordering up to two). Treat the cap as a ceiling, not a target —
  fewer steps is safer. Make the most common task reachable in one step.
- **Put the essential information up top and keep it minimal.** Lead with what a
  driver needs now; keep critical content and controls in the upper area, trim
  list items and labels to the shortest clear phrase, and avoid dense screens
  that require reading or comparison while driving.
- **Lean on Siri and voice for anything beyond a tap.** Hands on the wheel, eyes
  on the road: let drivers start playback, send a message, or get directions by
  voice. Reserve on-screen taps for simple, low-stakes choices, and never
  require text entry while moving.
- **Don't push interaction back to the iPhone.** The app must work with the
  phone locked or out of reach. Report errors and confirmations inside CarPlay;
  never tell a driver to "check your phone." Auto-starting audio, modal nags, or
  iPhone-only steps break the in-car contract.
- **Design for both appearances and real lighting.** Support light and dark, let
  the system tint to the car's theme, avoid pure-black fills that blend into the
  bezel, and verify legibility under bright sun and at night, not just on a
  monitor.

## Platform notes

- **CarPlay (iOS):** The only platform — the experience runs on the car's
  screen and built-in controls, driven from an iPhone. There is no iPad, Mac, or
  Watch variant. The iOS 26 redesign brings the Liquid Glass material to CarPlay
  and CarPlay Ultra: translucent toolbars and panels, a refreshed Dashboard,
  compact "pill" call notifications instead of full-screen takeovers, and
  support for widgets and Live Activities for glanceable, real-time status.
- **CarPlay Ultra:** Extends the experience across multiple in-car displays,
  including the instrument cluster. Navigation apps can supply turn-by-turn
  metadata for the cluster and head-up display; design that content to be
  read in a fraction of a second.
- **Touchscreen vs. knob/controller cars:** Many vehicles use a rotary
  controller, not touch. Keep focus order logical and targets reachable so the
  same layout works by knob, touch, or voice without redesign.

## Pitfalls

- Porting the whole iPhone app, including settings and deep navigation, into the
  car.
- Building screens deeper than the task needs, or near the category depth cap.
- Tiny, tightly packed, or text-heavy list items that can't be parsed at a glance.
- Requiring keyboard text entry, or routing the driver back to the iPhone.
- Auto-starting audio or interrupting with modal alerts during driving.
- Custom UI that fights the templates instead of using them.

## References

- **Human Interface Guidelines:** [CarPlay](https://developer.apple.com/design/human-interface-guidelines/carplay)
- **WWDC:** [Turbocharge your app for CarPlay (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/216/)
- **WWDC:** [Accelerate your app with CarPlay (WWDC20)](https://developer.apple.com/videos/play/wwdc2020/10635/)
- **Documentation:** [CarPlay framework](https://developer.apple.com/documentation/carplay)
- **Documentation:** [CarPlay Developer Guide (PDF)](https://developer.apple.com/download/files/CarPlay-Developer-Guide.pdf)

## See also

- The CarPlay code skill that implements the scene lifecycle and templates
  (CPTemplateApplicationScene, CPInterfaceController, and the CPListTemplate /
  CPGridTemplate / CPMapTemplate family) in the CarPlay framework.
- The Liquid Glass materials design skill for how translucency, tinting, and
  glass toolbars carry into the car in iOS 26.
- The notifications design skill for keeping in-car alerts glanceable and
  non-disruptive, and a Live Activities skill for real-time status on the
  Dashboard.
- The accessibility and color design skills for contrast and legibility under
  real-world driving light.
