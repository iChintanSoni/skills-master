---
name: hig-app-clips-design
description: Design-critique guidance for Apple Human Interface Guidelines App Clips, covering a fast, focused single-task slice of an app, the App Clip card (header image, title, subtitle, and action verb), avoiding mandatory account creation, deferring permission and notification prompts, using Sign in with Apple and Apple Pay to remove friction, confirming location only when needed, and a smooth, well-timed handoff to the full app. Use when reviewing or designing an App Clip experience, an App Clip card, an invocation flow (NFC tag, QR code, Maps, Safari, Messages), or the prompt to install the full app on iOS or iPadOS. Produces UX recommendations and critique, not code.
---

# HIG App Clips design

## When to use

Reach for this when critiquing or designing an App Clip: a small, fast slice of an app that lets someone accomplish a single real-world task the moment they need it, without installing anything. Use it to judge whether the experience is genuinely focused, whether the App Clip card sets the right expectation, whether sign-in and permission demands have been stripped to the minimum, and whether the nudge toward the full app is well-timed and polite. App Clips invoke from physical and digital sources (NFC tags, QR codes, Maps, Safari Smart App Banners, Messages, location suggestions), so the design must read clearly to someone who arrived with zero prior context.

## Core guidance

- Design for one task and speed above all. Strip the App Clip to the essential features that complete the immediate job (order, rent, park, pay, check in) and cut everything that belongs to the full app. If a flow needs browsing, settings, history, or account management, it does not belong in the clip.
- Treat the App Clip card as the first impression and a promise. Its header image, short title, and subtitle should make the specific task obvious before anything loads; pick the action verb that fits, View for media or informational and educational content, Play for games, Open otherwise. Don't bait people with a card that implies more than the clip delivers.
- Do not require an account to get value. Account creation is heavy friction for an ephemeral, single-use moment; let people complete the task without one, or offer to create one only after they finish. If an account is unavoidable, minimize what they type by leading with Sign in with Apple.
- Defer every permission to the exact moment its feature is used, and explain the benefit just before the system prompt. Only request notification permission, and only for the limited period the system allows, when a timely update (order ready, ride arriving) genuinely serves the task; never ask at launch.
- Lean on system capabilities to erase setup friction. Use Apple Pay so people pay without entering card or shipping details, and confirm location with the lightweight system flow rather than a custom permission wall. The fewer fields and taps, the closer the clip gets to its whole reason to exist.
- Recommend the full app only at the right moment, and never mid-task. Surface the install prompt after someone completes the task or returns repeatedly, present it politely and non-intrusively (the system overlay banner), and let people dismiss it and keep going. Repeated or interruptive install nags undermine the goodwill the clip just earned.
- Make the handoff feel continuous. When the full app is installed it replaces the clip and future invocations open the app instead, so design so any data, progress, or preferences carry forward and people resume seamlessly rather than starting over.

## Platform notes

- iOS: The primary home for App Clips. The card and the clip render in the system's sheet presentation; respect that container and let the modern Liquid Glass system chrome (toolbars, sheet, and the floating tab bar if your clip uses tabs) stay standard so the experience feels native and instantly trustworthy rather than custom-skinned.
- iPadOS: Clips invoke and run the same way; verify the focused layout reads well at larger sizes and in multitasking, and that the single-task framing still holds when there is more screen to fill, resisting the urge to add full-app surface area.

## Pitfalls

- Porting a full app's navigation, tabs, and settings into the clip instead of designing a single linear task.
- An App Clip card whose image, title, or verb misrepresents what the clip does, or that crams in marketing copy or sensitive content.
- A mandatory sign-up or login wall before the person has accomplished anything.
- Firing location, camera, or notification prompts at launch rather than at the point the feature is actually needed.
- Asking people to type card and address details when Apple Pay would complete the purchase in a tap.
- Pushing the full-app install prompt during the task, on the first invocation, or repeatedly after dismissal.
- A handoff that drops the user's progress, cart, or preferences so the full app makes them start the task again.

## References

- **Human Interface Guidelines:** [App Clips](https://developer.apple.com/design/human-interface-guidelines/app-clips)
- **Human Interface Guidelines:** [App Clips — User experience](https://developer.apple.com/design/human-interface-guidelines/app-clips/overview/experience/)
- **Human Interface Guidelines:** [App Clips — App Clip card](https://developer.apple.com/design/human-interface-guidelines/app-clips/overview/app-clip-card/)
- **Human Interface Guidelines:** [Sign in with Apple](https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple)
- **WWDC:** [Streamline your App Clip (WWDC20)](https://developer.apple.com/videos/play/wwdc2020/10120/)
- **Documentation:** [App Clips](https://developer.apple.com/documentation/appclip)

## See also

For the privacy framing behind deferred permission prompts and purpose strings, see `hig-privacy`; for the first-run principles the clip mirrors (lead with value, defer sign-in), see `hig-onboarding`; for notification timing and tone, see `hig-notifications`; and for sign-in critique, the Sign in with Apple guidance. Pair this with the SwiftUI and UIKit code skills that implement App Clip targets, App Clip card configuration, the system install-recommendation overlay, location confirmation, and Sign in with Apple and Apple Pay flows.
