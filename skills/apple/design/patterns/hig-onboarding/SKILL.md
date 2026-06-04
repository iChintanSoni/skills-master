---
name: hig-onboarding
description: "Design-critique guidance for Apple Human Interface Guidelines onboarding and launching, covering a fast content-first first run, getting users to value quickly, avoiding long tutorials and walkthroughs, deferring sign-in and permission prompts until contextually needed, progressive disclosure, sourcing setup from device defaults, and restoring state. Use when reviewing or designing a first-run experience, onboarding flow, launch screen, sign-in wall, or permission-request timing on iOS, iPadOS, macOS, watchOS, tvOS, or visionOS, or when auditing whether new users reach value without friction. Produces UX recommendations, not code."
tags: [onboarding, launching, first-run, permissions, hig, design]
x-skills-master:
  domain: apple
  class: design
  category: patterns
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  pairs_with: []
  sources:
    - https://developer.apple.com/design/human-interface-guidelines/onboarding
    - https://developer.apple.com/design/human-interface-guidelines/launching
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

# HIG onboarding and launching

## When to use

Reach for this when critiquing or designing how people first meet an app or game: the launch screen, the very first interactive screen, any onboarding or tutorial flow, sign-in walls, and the timing of permission prompts. Use it to judge whether new users reach real value quickly, whether setup friction is justified, and whether the experience respects returning users. It frames the first run as a chance to deliver value, not to collect information or lecture.

## Core guidance

- Lead with content and value, not gates. Let people see and touch what makes the app worthwhile the moment it opens, so they succeed before being asked for anything. A demanding first run (account, survey, permissions) is the fastest way to lose someone.
- Treat the launch screen as a perception-of-speed device, not a moment for branding. It should closely match the first real screen (minus interactive elements) so the app feels instantly ready; never use it as a splash screen, logo reveal, or onboarding slide.
- Make onboarding fast, optional, and skippable, and never show it to returning users. If people can figure the interface out by using it, skip onboarding entirely; the best instruction is an interface that needs none.
- Teach by doing, layered into real tasks, instead of front-loading walkthrough screens. Use brief, contextual coaching at the moment a feature is first relevant rather than a carousel of screenshots that look interactive but are not.
- Defer sign-in until an action genuinely requires an account, and let people explore (and even create or save locally) first. Offer Sign in with Apple and pre-fill from existing device data so the account step is a few taps, not a form.
- Request each permission only at the moment its feature is used, with a short in-context explanation of the benefit just before the system prompt. Requesting camera, location, contacts, or notifications at launch reads as intrusive and tanks grant rates.
- Source setup from what the device already knows. Pull from system settings, defaults, and iCloud, and design sensible defaults for the majority so most people never see a setup step; reserve customization for Settings.
- Restore state on every return so people resume exactly where they left off, and avoid re-running any first-run flow, license agreement, or rating prompt for users who have already started.

## Platform notes

- iOS and iPadOS: The system shows a launch screen automatically; keep it near-identical to the first screen and launch in the current orientation. Defer permission and sign-in prompts; lean on Sign in with Apple and AutoFill to remove setup friction.
- macOS: Apps can open straight to a usable document or window; avoid modal welcome panels. Honor restorable state and reopen prior windows and documents so people continue their session.
- watchOS: First run must be near-instant and glanceable. Push any meaningful setup to the paired iPhone app rather than asking people to configure on the watch.
- tvOS: Onboarding competes with the desire to start watching or playing; keep it to a screen or two, make it focus-navigable, and offer sign-in via a nearby device or QR-style handoff instead of on-screen typing.
- visionOS: Introduce spatial interactions gently and in context; do not block the shared or immersive space behind a long intro. Request world-sensing and other sensitive permissions only when an experience needs them.

## Pitfalls

- A splash or logo screen that lingers, or a launch screen styled as marketing, making the app feel slow.
- A mandatory account wall before anyone has seen any value.
- A multi-screen tutorial carousel with no skip control, or one re-shown to returning users.
- Firing camera, location, contacts, or notification prompts at launch instead of at point of use.
- Asking for setup information up front that could be inferred from device settings, defaults, or iCloud.
- Showing an in-app license agreement, or prompting for a rating, within the first session.
- Losing the user's place on relaunch so they must retrace steps.

## References

- **Human Interface Guidelines:** [Onboarding](https://developer.apple.com/design/human-interface-guidelines/onboarding)
- **Human Interface Guidelines:** [Launching](https://developer.apple.com/design/human-interface-guidelines/launching)
- **Human Interface Guidelines:** [Privacy](https://developer.apple.com/design/human-interface-guidelines/privacy)
- **WWDC:** [Love at First Launch (WWDC17)](https://developer.apple.com/videos/play/wwdc2017/816/)
- **WWDC:** [Making a Great First Impression with Strong Onboarding Design (WWDC14)](https://developer.apple.com/videos/play/wwdc2014/230/)
- **Documentation:** [Sign in with Apple](https://developer.apple.com/documentation/sign_in_with_apple)

## See also

For the privacy framing behind permission timing and purpose strings, see `hig-privacy`; for sign-in and account-flow critique, see `hig-authentication`. Pair this with the SwiftUI and UIKit code skills that implement launch screens, state restoration via scene configuration, and just-in-time authorization requests for camera, location, notifications, and other protected resources.
