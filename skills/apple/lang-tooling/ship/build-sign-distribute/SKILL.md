---
name: build-sign-distribute
description: Best practices for building, code signing, and distributing Apple apps across the App Store, TestFlight, and Developer ID channels, covering signing identities, provisioning profiles, automatic versus manual signing, archiving and exporting, App Store Connect uploads, and Mac notarization. Use when preparing a release build, setting up signing on continuous integration, archiving and exporting an app, distributing a beta through TestFlight, notarizing a Mac app outside the App Store, or debugging certificate and provisioning failures.
tags: [signing, distribution, testflight, notarization, ci]
x-skills-master:
  domain: apple
  class: lang-tooling
  category: ship
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  requires:
    xcode: "16"
  pairs_with: []
  sources:
    - https://developer.apple.com/documentation/xcode/distributing-your-app-for-beta-testing-and-releases
    - https://developer.apple.com/documentation/security/customizing-the-notarization-workflow
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

# build-sign-distribute

## When to use

Reach for this skill when cutting a release build, wiring signing into a continuous integration pipeline, archiving and exporting through Xcode or `xcodebuild`, pushing a beta to TestFlight, notarizing a Mac app for distribution outside the App Store, or diagnosing why a certificate, profile, or entitlement mismatch breaks a build. It covers the mental model and hygiene rather than a one-time setup walkthrough.

## Core guidance

- Keep two concepts distinct: a signing **identity** (a certificate plus its private key, living in the keychain) proves who built the app, while a **provisioning profile** authorizes a specific bundle identifier, set of entitlements, and target devices. A build fails when either is missing or when they disagree about capabilities.
- Prefer **automatic signing** for local development so Xcode manages profiles and device registration. Switch to **manual signing** for release and continuous integration, where reproducibility matters more than convenience and an explicit profile prevents Xcode from silently regenerating one.
- Drive release builds through **archive then export**, not a raw build: archive captures dSYMs and a distributable bundle, and `xcodebuild -exportArchive` with an `ExportOptions.plist` produces a signed artifact non-interactively. Set the export `method` to match the channel (`app-store-connect`, `developer-id`, `ad-hoc`, or `enterprise`).
- Authenticate uploads with an **App Store Connect API key**, never an Apple ID password. Pass the key, key ID, and issuer ID to `xcodebuild` or `notarytool`, and store the `.p8` and identifiers as masked secrets, not in the repository.
- Treat the continuous integration keychain as disposable: create a dedicated keychain, import the `.p12` with `security import`, unlock it, set a long timeout, and run `security set-key-partition-list` so `codesign` can use the key without a UI prompt.
- For the **Mac outside the App Store**, sign with a Developer ID certificate, enable the hardened runtime, submit with `xcrun notarytool submit --wait`, then `xcrun stapler staple` the ticket onto the artifact so Gatekeeper validates offline.
- Validate the archive (Organizer or `-exportArchive` validation) and ship to TestFlight before App Store review; an internal tester group sees builds without external beta review, an external group requires it.

```sh
# Non-interactive notarization for a Developer ID app, then staple the ticket.
xcrun notarytool submit MyApp.zip \
  --key AuthKey.p8 --key-id "$KEY_ID" --issuer "$ISSUER" --wait
xcrun stapler staple MyApp.app
```

## Platform notes

- **iOS, iPadOS, watchOS, tvOS, visionOS**: distribution flows through App Store Connect; there is no Developer ID equivalent, so ad-hoc or App Store builds and TestFlight cover beta needs. watchOS and visionOS apps inherit signing from their host or bundle configuration and rarely need separate manual handling.
- **macOS**: supports three lanes (Mac App Store, Developer ID, and direct development). Only Developer ID distribution requires notarization and stapling; App Store submissions are notarized as part of review. Hardened runtime is mandatory for notarization and may require entitlement exceptions for plug-ins or JIT.
- **Xcode 26 and the iOS 26 SDK** are required for new App Store submissions in the 2026 cycle; build against the current SDK even when supporting older deployment targets. The legacy `altool` upload path is retired in favor of `notarytool` and the API-key uploaders.

## Pitfalls

- Committing certificates, private keys, profiles, or the App Store Connect `.p8` to the repository. Keep them in the secret store and a transient keychain.
- Relying on automatic signing in continuous integration, where Xcode may regenerate or rotate profiles unpredictably and produce non-reproducible artifacts.
- Letting the signing certificate or provisioning profiles expire silently; expired credentials surface only at build or upload time. Track expiry and rotate ahead of it.
- Mismatched entitlements between the profile and the app's enabled capabilities, the most common cause of cryptic install and validation failures.
- Skipping the staple step after notarizing a Mac app, which forces Gatekeeper to check online and blocks launch on offline machines.
- Reusing a developer's interactive keychain on a build agent, leaving it locked or prompting for key access mid-build.

## References

- **Documentation:** [Preparing your app for distribution](https://developer.apple.com/documentation/xcode/preparing-your-app-for-distribution)
- **Documentation:** [Distributing your app for beta testing and releases](https://developer.apple.com/documentation/xcode/distributing-your-app-for-beta-testing-and-releases)
- **Documentation:** [Notarizing macOS software before distribution](https://developer.apple.com/documentation/security/notarizing-macos-software-before-distribution)
- **WWDC:** [Simplify distribution in Xcode and Xcode Cloud (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10224/)

## See also

See `xcode-project-conventions` for how build settings, bundle identifiers, and configurations should be organized so that signing and export stay predictable across schemes and targets.
