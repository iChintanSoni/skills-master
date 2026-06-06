---
name: m3-onboarding
description: "Design critique and recommendations for Material 3 onboarding on Android: first-run education, value-first screens, progressive disclosure vs upfront tours, sign-in and permission timing, skippability, and not blocking the user from the core task. Use when reviewing or designing a first-run experience, onboarding flow, sign-in wall, or permission-request timing in a Compose-first Android app and you need M3-grounded design judgment rather than implementation code."
---

## When to use

Reach for this skill when critiquing or designing how new users first encounter an Android app: the initial screen, any feature tour or walkthrough, sign-in prompts, permission requests, and the framing of the app's value proposition. Use it to judge whether the first-run experience delivers value immediately, whether setup friction is justified, and whether users can reach the core task without being gated, lectured, or asked for information prematurely.

This is a design-judgment skill. It names relevant Jetpack Compose Material 3 composables — such as `Scaffold`, `ModalBottomSheet`, and `AlertDialog` — in prose and hands implementation to the appropriate code skill.

## Core guidance

### Lead with value, not gates

- **Show what the app does before asking for anything.** The first screen should demonstrate the app's core purpose — real content, a usable interface, or an immediate task — not a marketing hero image or a welcome paragraph. Users decide whether to continue within seconds; earn their trust with utility, not words about utility.
- **Never open with a mandatory account wall.** Requiring sign-in before a user has experienced any value is one of the highest drop-off triggers in onboarding. Let people explore, browse, or interact with the app's core loop first. Defer account creation to the moment it unlocks something meaningful (saving, syncing, purchasing) and offer guest or preview modes wherever practical.
- **Avoid splash screens that serve only as logo reveals.** A brief loading transition is acceptable; a branded intro animation that adds latency without adding information is not. The app should feel instantly ready.

### Progressive disclosure over upfront tours

- **If the interface explains itself, skip the tutorial entirely.** The best onboarding teaches nothing because it needs to teach nothing — the UI is clear enough on first contact. Evaluate whether a proposed feature tour actually compensates for a confusing interface rather than fixing it.
- **When education is needed, deliver it contextually at the moment of first use.** A tooltip, a coach mark surfaced via `TooltipBox`, or a single inline callout at the relevant feature is far more effective than a four-screen carousel seen before any feature is encountered. The user has context in the moment; they have none at launch.
- **Keep any upfront flow to a maximum of two or three screens.** If the minimum viable orientation requires more than that, the product is asking for more trust than it has earned. Prioritize ruthlessly — one strong value statement and one actionable next step beat five informational slides.
- **Always make onboarding skippable.** Every screen in a multi-step intro must carry a clear, accessible skip or "Get started" control that bypasses remaining steps. A user who ignores the tutorial should arrive at a fully functional app, not a broken state.

### Sign-in timing and friction

- **Defer sign-in until an action genuinely requires an account.** When that moment arrives, surface it with a brief contextual explanation of what the account unlocks ("Sign in to save your progress across devices") rather than a generic wall. The justification should arrive one step before the prompt, not inside it.
- **Minimize sign-in form friction.** Offer Google Sign-In via the Credential Manager API or one-tap flows so the credential step is two taps, not a typed email and password. Where email/password is required, support autofill and show the password toggle immediately. A painful sign-in form after a value-demonstrating first run can still lose the user.
- **Distinguish authentication from account creation.** Returning users and new users have different needs at the sign-in screen. A tab or toggle between "Sign in" and "Create account" is clearer than a single form that guesses intent or buries one path under another.

### Permission timing and rationale

- **Request each permission only at the point of use, never at launch.** Firing a camera, location, notification, or contacts prompt at app start — before any feature that requires it has been touched — signals that the app does not respect the user's data. Grant rates for upfront permission requests are measurably lower than for contextual ones.
- **Provide a brief, benefit-focused rationale just before the system prompt.** One sentence in your own UI explaining why the permission is needed and what it enables ("Allow access to your camera to scan a barcode") prepares the user for the system dialog and converts a suspicious prompt into an expected one. This rationale must arrive immediately before the system dialog, not buried in an earlier onboarding screen.
- **Design gracefully for denial.** The app must remain usable — or at least navigable — if a permission is denied. Offer a path to the relevant feature later (a contextual nudge when the user reaches the feature naturally) and do not immediately re-prompt. A denied permission should not strand the user on an error screen.
- **Notifications deserve special care.** Android 13 and later require explicit notification permission. Request it after demonstrating a specific, concrete notification the user would find valuable — not in the first session unless the app's core loop is notification-driven. Explain the exact benefit in your rationale screen.

### Skippability and progressive trust

- **Never block the core task.** Whatever a user came to do — read articles, listen to music, track a workout — they should be able to do it without completing any onboarding. Setup, personalization, and account prompts should layer on top of a working experience, not gate it.
- **Allow personalization to emerge from behavior.** Asking a new user about their preferences in a setup wizard produces noisy data and adds friction. Prefer inferring preferences from early interactions and offering explicit controls in settings once the user has a reason to care.
- **Respect returning users.** Never show a first-run flow to a user returning from a background state, an app update, or a device transfer. Restore their last-used state and context. An app that makes a seasoned user re-do onboarding after an update loses credibility immediately.
- **Celebrate first completion, not first launch.** Positive reinforcement — a brief confirmation or a congratulatory moment in an M3 `AlertDialog` or a `Snackbar` — lands better when it follows an actual accomplishment rather than welcoming someone who has not yet done anything.

### Visual language and tone

- **Use M3 surface hierarchy to keep onboarding uncluttered.** Onboarding screens should use generous surface-level spacing and restraint: one primary action per screen, one idea per screen. M3's `FilledButton` for the primary CTA and a `TextButton` for skip or secondary paths establishes clear hierarchy without visual noise.
- **Illustrations and graphics should complement, not replace, clarity.** A well-chosen image can convey the app's character faster than a headline, but decorative imagery that does not reinforce the benefit on screen is wasted space. On compact phones, ensure illustrations do not push the primary CTA below the fold.
- **Apply motion purposefully and proportionally.** Transitions between onboarding steps should feel lightweight and directional, not theatrical. M3 motion tokens (emphasize, standard) exist for this reason. Autoplay animations that loop indefinitely and delay reading are distracting.

## Platform notes

### Compact phones
The primary context for Android onboarding. Screens are single-column; every onboarding screen must work at the smallest supported width. The primary CTA should always be visible without scrolling. Avoid full-screen hero images that require the user to scroll to find the action.

### Large screens and foldables
On tablets and foldables in expanded window configurations, a multi-step onboarding flow may benefit from a two-column layout: illustration or feature callout on one side, text and action on the other. This avoids the awkward wide-single-column stretch that a phone-native onboarding layout produces at tablet width. Do not force the compact phone layout to fill an expanded window — reflow content using Material 3 adaptive layout guidance.

### Large-screen-specific sign-in
Credential pickers and Google Sign-In dialogs on large screens appear as centered modals. Ensure your rationale UI is also appropriately sized and centered rather than stretching edge-to-edge in a dialog that was designed for phone dimensions.

### Accessibility in onboarding
Ensure skip controls and navigation indicators (step dots) have explicit content descriptions for TalkBack users. Coach marks and overlays must be focusable and dismissible from the keyboard. Do not rely on color alone to indicate which step is active in a progress indicator.

## Pitfalls

- Gating the core task behind account creation before any value has been shown.
- Showing a four-or-more-screen feature carousel with no skip control, or re-showing it to returning users.
- Requesting camera, location, notifications, or contacts permissions at app launch rather than at the point of first use.
- Omitting a benefit-focused rationale screen before a sensitive permission prompt.
- Making the app non-functional or showing an error state when a permission is denied.
- A multi-question preference survey in a setup wizard that asks for data the app could infer from behavior.
- A branded splash animation that adds perceived latency without adding information.
- Onboarding screens that render as wide, awkward single columns on tablets because they were only designed for compact width.
- Personalization or account setup screens that appear again after an app update or device restore.
- An illustration or hero image that pushes the primary call-to-action below the fold on a compact device.

## References

- **Material 3 Guidelines:** [Foundations overview](https://m3.material.io/foundations/overview)
- **Documentation:** [Android mobile UI design](https://developer.android.com/design/ui/mobile)
- **Material 3 Guidelines:** [Motion — transitions](https://m3.material.io/styles/motion/transitions/transition-patterns)
- **Material 3 Guidelines:** [Adaptive design layouts](https://m3.material.io/foundations/overview)
- **Material 3 Guidelines:** [Communication — writing](https://m3.material.io/foundations/content-design/style-guide/ux-writing-best-practices)

## See also

For the permission-rationale pattern and runtime permission UX critique, see the m3-privacy design skill. For sign-in and authentication UI critique including Credential Manager flows, see the m3-sign-in design skill. For guidance on when a modal bottom sheet is a better onboarding surface than a full-screen step, see the m3-bottom-sheets design skill. For touch target sizing and TalkBack semantic requirements on onboarding overlays and coach marks, see the compose-accessibility code skill. The implementing Compose code skill handles `TooltipBox`, `ModalBottomSheet`, `AlertDialog`, Credential Manager integration, and adaptive layout scaffolding for onboarding screens.
