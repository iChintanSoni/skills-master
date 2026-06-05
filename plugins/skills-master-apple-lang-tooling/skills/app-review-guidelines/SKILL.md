---
name: app-review-guidelines
description: "Guidance for passing Apple App Review: the top rejection reasons (crashes, incomplete info, privacy, misleading metadata), in-app purchase and account-deletion rules, permission and privacy requirements, and how to prepare a submission or respond to a rejection. Use when preparing an App Store Connect submission, planning a paywall or login, adding account deletion, writing purpose strings or metadata, or replying to an App Review rejection."
---

This is engineering guidance, not legal advice. The guidelines change often, so treat the linked Apple pages as the authority and re-check them before each submission.

## When to use

- You are about to submit a build to App Store Connect and want to avoid a predictable rejection.
- You are designing a paywall, subscription, or login flow and need to know what Review expects.
- You are adding the required in-app account-deletion path, or writing purpose strings and metadata.
- A submission came back **Rejected** or **Metadata Rejected** and you need to respond or appeal.

## Core guidance

- **Ship a final, tested build.** The most common bounce is a crash or broken flow under Guideline 2.1 (App Completeness). Test on-device, not just the simulator; scrub placeholder text and dead URLs before you submit.
- **Give reviewers a way in.** If your app has a login, supply a working demo account (or a demo mode) and confirm the back end is live during review. A reviewer who cannot get past the sign-in screen will reject.
- **Match metadata to reality.** Screenshots, description, keywords, and the preview must show actual functionality (2.3). Do not reference other platforms, name competitors, or imply features you do not ship.
- **Route digital goods through In-App Purchase.** Unlocking features, subscriptions, or premium content must use StoreKit (3.1.1); do not link out to external payment for digital goods except where a specific exception applies. Show full price, renewal terms, and how to cancel before purchase.
- **Offer account deletion in-app.** Any app that creates accounts — including guest accounts — must let users *delete* (not merely deactivate) the account and its data from inside the app (5.1.1(v)). Put it in account settings; do not require a phone call or email unless you are a regulated industry under 5.1.1(ix).
- **Ask only for data you need, and say why.** Request permissions in context and write a clear, specific purpose string for each. Vague strings like "We need this to improve your experience" get rejected (5.1.1, 5.1.2). Keep `NSPrivacyTracking` and the Privacy Nutrition Label honest.
- **Don't pad the binary or hide behavior.** Avoid placeholder features, hidden/undocumented functionality, and "we'll fix it after launch" promises. Reviewers test what is in the build.

A purpose string is just an Info.plist key whose value the user reads verbatim in the system prompt:

```xml
<key>NSCameraUsageDescription</key>
<string>Scan a receipt to attach it to an expense. Photos stay on your device.</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>Show nearby stores so you can pick up your order. We never track you in the background.</string>
```

## Platform notes

- **All platforms** share one guidelines document, but design and capability rules differ. watchOS, tvOS, and visionOS apps still need their own complete, tested experience — a thin companion or placeholder fails 4.2 (Minimum Functionality).
- **macOS** apps may distribute outside the App Store via Notarization, which uses a narrower Notarization Review; App Store builds still follow the full guidelines.
- **visionOS** submissions are held to spatial-design expectations; reused iPad layouts with no spatial consideration draw design feedback.
- **EU / alternative distribution:** Notarization and external-purchase entitlements change the payment rules in some regions. Confirm current terms in App Store Connect rather than assuming worldwide IAP-only.

## Pitfalls

- Submitting with the back end in a staging or "off" state so the reviewer's demo login fails.
- Treating "deactivate account" as compliant — Review requires true deletion of the account and its data.
- Steering users to a website or another payment method to buy digital content (3.1.1).
- Copy-pasting one generic purpose string across every permission, or requesting location/contacts up front before the feature that needs them.
- Crash-only-on-reviewer's-region/locale bugs; test other languages and an empty-state first launch.
- Assuming an appeal is faster than a fix — re-reading the cited guideline and resubmitting is usually quicker.

## References

- **Documentation:** [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- **Documentation:** [Offering account deletion in your app](https://developer.apple.com/support/offering-account-deletion-in-your-app/)
- **Documentation:** [Reply to App Review messages](https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/reply-to-app-review-messages)
- **Documentation:** [Preparing your app for submission](https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-for-review)
- **Human Interface Guidelines:** [Privacy](https://developer.apple.com/design/human-interface-guidelines/privacy)

## See also

- The privacy-manifests skill for building an accurate Privacy Nutrition Label and required-reason API declarations that back up your purpose strings.
- The storekit / in-app-purchase skill for implementing compliant paywalls and subscription terms referenced under 3.1.1.
- The sign-in-with-apple skill, which intersects 4.8 login-service rules when you offer third-party social login.
