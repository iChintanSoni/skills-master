---
name: hig-privacy
description: Design guidance and UX critique for privacy-respecting Apple apps, grounded in the Human Interface Guidelines. Use when reviewing or designing permission flows, just-in-time prompts, purpose strings, data-minimization decisions, App Store privacy nutrition labels, transparency about data use, or Sign in with Apple. Covers when and how to request access in context, how to justify it, and how to avoid surprising or coercing people. Produces design recommendations, not code.
---

# Designing for privacy

Privacy is a foundational expectation across Apple platforms. People trust an app
when it asks for only what it needs, explains why at the moment it matters, and is
honest about what happens to their data. Treat every permission prompt as a moment
of trust you can win or lose.

## When to use

- Reviewing or designing any flow that requests access to a protected resource
  (location, photos, contacts, calendar, camera, microphone, Bluetooth, health,
  local network, tracking).
- Deciding *when* to show a permission prompt and what its purpose string should say.
- Auditing how much personal data a feature collects, stores, or transmits.
- Preparing or critiquing App Store privacy nutrition label disclosures.
- Adding account creation or sign-in, and weighing Sign in with Apple.
- Designing onboarding that risks front-loading permission requests.

## Core guidance

- **Ask in context, just in time.** Request access only when the person takes an
  action that obviously needs it (tapping a camera shutter, attaching a photo).
  Don't fire prompts at launch or during onboarding unless the resource is essential
  to the app even functioning.
- **Justify the ask before the system prompt appears.** When the reason isn't
  self-evident, precede the OS dialog with your own lightweight explanation screen,
  then trigger the real prompt. Never trick people into tapping Allow.
- **Write purpose strings that say *why*, specifically.** A good purpose string names
  the concrete benefit ("so you can attach photos to a note"), not a vague restatement
  ("needs photo access"). The system shows it verbatim, so weak strings read as
  thoughtless and invite denial.
- **Minimize collection; prefer system pickers over full access.** Don't request the
  whole library, all contacts, or precise location when a system picker or a coarser
  scope does the job. Photos picker, contact picker, document picker, and approximate
  location let people share specific items without granting broad access at all.
- **Degrade gracefully when access is denied or limited.** Treat "Don't Allow" and
  limited-access (e.g. selected photos) as normal states. Keep the feature usable,
  explain what's reduced, and offer a path to Settings rather than nagging or blocking.
- **Be transparent and match your nutrition label.** What the app actually collects
  and shares must align with its App Store privacy disclosures. Don't promise privacy
  in marketing while quietly collecting more; inconsistency erodes trust fast.
- **Offer Sign in with Apple as a first-class option.** Where you support third-party
  sign-in, present Sign in with Apple at least as prominently, delay forced sign-in
  until it delivers clear value, and let people use it without surrendering email or
  identity they'd rather keep private.
- **Don't ask for tracking lightly.** If you present the App Tracking Transparency
  prompt, time it to a moment the request makes sense and explain the value first;
  a denied prompt is a reasonable, common outcome to design around, not to evade.

## Platform notes

- **iOS / iPadOS:** The "26" cycle continues the move toward limited and one-time
  access; design for selected-photos and approximate-location as defaults, not edge
  cases. Onboarding that demands permissions before showing value reads as a red flag.
- **macOS:** Sensitive access (screen recording, accessibility, full disk, automation)
  routes through System Settings, sometimes after a relaunch. Set expectations in your
  UI and guide people to the exact pane instead of leaving them to find it.
- **visionOS:** Spatial and sensing data (room scans, hand and eye input) are
  especially sensitive. Keep eye-tracking input on-device by design, and request
  scene understanding only for features that visibly need it.
- **watchOS / tvOS:** Constrained input makes long explanations and Settings detours
  costly. Push privacy-sensitive setup to the paired iPhone where it's clearer, and
  keep on-device prompts rare and obviously contextual.

## Pitfalls

- Bundling several permission prompts back-to-back at first launch.
- Purpose strings that restate the permission instead of the user benefit.
- Requesting full library/contacts/precise location when a picker or coarse scope works.
- Treating "Don't Allow" or limited access as a dead end that breaks the feature.
- Re-prompting or guilt-tripping after a denial instead of pointing to Settings.
- Privacy claims in marketing that contradict the actual data collected or the label.
- Burying or shrinking Sign in with Apple beneath other sign-in buttons.

## References

- **Human Interface Guidelines:** [Privacy](https://developer.apple.com/design/human-interface-guidelines/privacy)
- **Human Interface Guidelines:** [Sign in with Apple](https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple)
- **Human Interface Guidelines:** [Managing accounts](https://developer.apple.com/design/human-interface-guidelines/managing-accounts)
- **WWDC:** [Integrate privacy into your development process (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/246/)
- **Documentation:** [Requesting access to protected resources](https://developer.apple.com/documentation/uikit/requesting-access-to-protected-resources)
- **Documentation:** [App privacy details on the App Store](https://developer.apple.com/app-store/app-privacy-details/)

## See also

- **hig-onboarding** — for sequencing first-run experience so value precedes any ask.
- **hig-foundations** / **hig-accessibility** — companion foundational design skills.
- The SwiftUI/UIKit code skills that implement these flows (authorization APIs,
  PhotosPicker and other system pickers, ATT requests, and the
  AuthenticationServices Sign in with Apple button) carry the implementation detail
  this design critique deliberately leaves to prose.
