---
name: hig-sign-in-with-apple-design
description: "Design guidance and UX critique for adopting Sign in with Apple, grounded in the Human Interface Guidelines. Use when reviewing or designing a sign-in or account-creation screen that offers Sign in with Apple, choosing the official button style (black, white, white-outline), sizing and placing the button relative to other providers, respecting Hide My Email private-relay addresses, or sequencing the account flow. Covers button prominence, localization, account-deletion, and offering Apple alongside Google or email sign-in. Produces design recommendations, not code."
tags: [sign-in-with-apple, authentication, accounts, privacy, technologies]
x-skills-master:
  domain: apple
  class: design
  category: technologies
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  pairs_with: [sign-in-with-apple]
  sources:
    - https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple
    - https://developer.apple.com/design/human-interface-guidelines/managing-accounts
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

# Designing Sign in with Apple

Sign in with Apple lets people authenticate using the Apple Account they already
have, with the option to hide their real email behind a private relay address. The
design job is to present it as a first-class, trustworthy choice: the official button,
sized and placed for prominence, inside an account flow that asks for as little as
possible, as late as possible.

## When to use

- Reviewing or designing any sign-in / sign-up screen that includes Sign in with Apple.
- Choosing the button style (black, white, white-outline) for a given background.
- Deciding button size, corner radius, and order relative to Google, email, or other
  sign-in options.
- Handling Hide My Email private-relay addresses in the UI and in transactional email.
- Sequencing the account flow: guest browsing, deferred sign-in, account deletion.

## Core guidance

- **Use the official, system-provided button.** Adopt the real Sign in with Apple
  button (AuthenticationServices / `SignInWithAppleButton`) rather than a hand-rolled
  imitation. Don't alter the Apple logo, recolor it, change the wording beyond the
  approved "Sign in" / "Continue" / "Sign up" titles, or set your own font on it.
- **Pick the style for contrast, not taste.** Black on light or white backgrounds with
  enough contrast; white on dark backgrounds; white-outline (iOS, macOS, web) on light
  backgrounds where a plain white fill wouldn't separate from the page. Never place the
  black button on a dark background or a low-contrast white button on white.
- **Make it at least as prominent as every other option.** Size the button no smaller
  than your Google / email / other sign-in buttons, keep it above the fold so people
  don't scroll to find it, and don't bury or de-emphasize it. If you align provider
  logos, match the corner radius across the row so the set reads as peers.
- **Respect Hide My Email; never demand the "real" address.** Treat a
  `@privaterelay.appleid.com` address as a valid, permanent email. Don't ask people to
  re-enter or "verify" a personal address to use the app, and don't degrade the
  experience for relay users. Route transactional mail through Apple's relay.
- **Don't re-ask for data Apple already returned.** Apple provides name and email on
  first authorization only; capture them then. Avoid a second form re-collecting the
  same fields, and design for the case where a person shares only a relay email and no
  name on a later sign-in.
- **Delay sign-in until it earns its place.** Let people browse, sample, or even
  complete a guest checkout before forcing an account; offer Sign in with Apple at the
  moment it adds value (saving progress, syncing, ordering), not as a launch wall.
- **Plan for revocation and deletion.** People can disconnect your app from their Apple
  Account at any time, and apps offering account creation must offer in-app account
  deletion. Design a clear, reachable delete path and handle revoked credentials by
  signing the person out gracefully rather than erroring.
- **Localize and never truncate.** The button title varies by locale and can be longer
  than English; reserve width, keep the minimum margins around title and logo, and
  verify right-to-left layouts mirror correctly.

## Platform notes

- **iOS / iPadOS:** On Liquid Glass sign-in sheets, keep the button on a solid,
  high-contrast surface; don't float it over a busy glass-blurred background where
  contrast can't be guaranteed. Pin it within thumb reach above the fold.
- **macOS / web:** Only here can you tune corner radius (square through pill) to match
  your other buttons; keep the change consistent across the whole provider row.
- **watchOS:** Authentication typically hands off to the paired iPhone; keep the watch
  screen to a single clear prompt rather than a full provider list.
- **tvOS:** No web view for Apple's flow; the button leads to an on-device or
  handoff-to-iPhone experience. Make focus state and the default-focused button obvious.
- **visionOS:** Present the button on a legible material at a comfortable depth; don't
  let it recede behind glass that washes out the logo contrast.

## Pitfalls

- A custom "Sign in with Apple" button that recolors or distorts the logo or wording.
- Black button on a dark background, or white button on white, failing contrast.
- Making Apple smaller or lower than Google / email buttons, or hiding it below the fold.
- Treating a private-relay address as invalid, or forcing people to supply a real email.
- Re-prompting for name/email that Apple already returned on first authorization.
- A launch-time sign-in wall before the app has shown any value.
- Shipping account creation with no in-app account-deletion path.
- Truncated or clipped button titles in longer locales or RTL layouts.

## References

- **Human Interface Guidelines:** [Sign in with Apple](https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple)
- **Human Interface Guidelines:** [Managing accounts](https://developer.apple.com/design/human-interface-guidelines/managing-accounts)
- **Human Interface Guidelines:** [Privacy](https://developer.apple.com/design/human-interface-guidelines/privacy)
- **WWDC:** [Get the most out of Sign in with Apple (WWDC20)](https://developer.apple.com/videos/play/wwdc2020/10173/)
- **Documentation:** [Communicating using the private email relay service](https://developer.apple.com/documentation/signinwithapple/communicating-using-the-private-email-relay-service)
- **Documentation:** [ASAuthorizationAppleIDButton](https://developer.apple.com/documentation/authenticationservices/asauthorizationappleidbutton)

## See also

- **hig-privacy** — the foundational privacy stance that makes Sign in with Apple a
  first-class option; pair when auditing data minimization and trust.
- **hig-onboarding** — for sequencing first-run so value precedes any forced sign-in.
- The **sign-in-with-apple** code skill (AuthenticationServices and the SwiftUI
  `SignInWithAppleButton` / `ASAuthorizationAppleIDButton`) carries the implementation
  detail — credential state, nonce handling, relay configuration — that this design
  critique deliberately leaves to prose.
