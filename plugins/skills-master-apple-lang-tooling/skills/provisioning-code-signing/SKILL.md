---
name: provisioning-code-signing
description: "Guides Apple code signing and provisioning: signing identities and certificates, development vs distribution provisioning profiles, automatic vs manual signing, the App ID and entitlements relationship, and diagnosing signing errors. Use when configuring a target's Signing & Capabilities, fixing build errors like no profiles found or profile doesn't include signing certificate, or setting up signing on CI."
---

# Provisioning and code signing

## When to use

Reach for this when you set up a target's **Signing & Capabilities** tab, hit a build failure such as "No profiles for '<bundle id>' were found" or "Provisioning profile doesn't include signing certificate", onboard a teammate who cannot build to a device, or wire signing into a CI pipeline. The four moving parts — a **signing identity** (certificate + private key), an **App ID**, a **provisioning profile**, and the app's **entitlements** — must agree, and most errors trace back to one of them being missing, mismatched, or expired.

## Core guidance

- **Know the three artifacts.** A certificate proves *who* signed (Apple Development or Apple Distribution). An App ID + entitlements declare *what* the app may do. A provisioning profile ties them together: it embeds one App ID, the authorized certificate(s), the granted entitlements, and — for development and ad hoc — a device list. The signature on disk only stays valid while all three still match.
- **Prefer automatic signing for app targets.** Enable "Automatically manage signing", pick a Team, and let Xcode register the App ID, request the certificate, and regenerate the profile when you add a capability or device. It is the right default for most teams and matches the recommended distribution flow.
- **Switch to manual signing when control matters.** Choose manual for shared CI machines, locked-down enterprise rules, or when you must pin an exact profile per configuration. Then you own creating the App ID, the distribution certificate, and the profile in the Developer portal, and selecting them per build configuration.
- **Match the profile type to the job.** *Development* runs on registered devices and debugs; *Ad Hoc* installs on a fixed device list without the App Store; *App Store* uploads for TestFlight and release; *Developer ID* (macOS) ships outside the Mac App Store and feeds notarization. Don't sign a release with a development profile or vice versa.
- **Keep entitlements and the App ID in lockstep.** Every capability in the `.entitlements` file (App Groups, Push, iCloud, Sign in with Apple) must be enabled on the App ID *and* present in the profile. Adding an entitlement that the profile doesn't grant is the classic source of an unsigned or rejected build.
- **Don't commit secrets or chase the wrong fix.** Never check the `.p12` private key into the repo. Don't bump the bundle ID to dodge an error; fix the actual mismatch. Avoid blindly deleting all keychain certificates — export them first so you don't orphan a private key.
- **On CI, install identities into a dedicated keychain.** Import the `.p12` and profile into a throwaway keychain you create per run, or adopt cloud signing so the build machine never holds a long-lived key.

```bash
# Inspect what a profile actually grants before debugging a mismatch.
security cms -D -i MyApp.mobileprovision > profile.plist
/usr/libexec/PlistBuddy -c "Print :Entitlements" profile.plist
/usr/libexec/PlistBuddy -c "Print :ExpirationDate" profile.plist
# Verify the signed app's identity and embedded entitlements.
codesign -dvvv --entitlements :- MyApp.app
```

## Platform notes

- **iOS / iPadOS / watchOS / tvOS / visionOS:** A unified **Apple Development** / **Apple Distribution** certificate signs across these platforms. Devices must be registered in the profile to run development or ad hoc builds; watchOS and visionOS app targets inherit the parent app's signing relationship.
- **macOS:** Beyond App Store distribution, **Developer ID Application** signing plus **notarization** is required for software distributed directly to users; Gatekeeper checks the notarization ticket on first launch. A separate **Developer ID Installer** certificate signs `.pkg` installers.
- **App extensions and clips:** Each embedded target needs its own App ID and profile whose bundle ID is prefixed by the host app's (for example `com.example.app.widget`), and shared capabilities like App Groups must be enabled on every participating App ID.

## Pitfalls

- **"Doesn't include signing certificate":** the profile was generated before your current certificate existed, or you're signing with a different identity than the profile authorizes. Regenerate the profile (or, on automatic signing, let Xcode refresh it).
- **Missing private key:** a certificate imported from another Mac without its `.p12` shows in the portal but can't sign. Export the identity (cert + key) from the original machine, or revoke and reissue.
- **Wildcard App ID with restricted entitlements:** App Groups, Push, and iCloud need an *explicit* App ID; a wildcard (`*`) silently can't carry them.
- **Expired profile or certificate:** profiles and certificates have hard expiry dates. CI fails abruptly on the day they lapse — track expiry and rotate ahead of time.
- **Bundle ID drift:** the target's bundle identifier must match the profile's App ID exactly, including case and configuration-specific suffixes.

## References

- **Documentation:** [TN3125: Inside Code Signing — Provisioning Profiles](https://developer.apple.com/documentation/technotes/tn3125-inside-code-signing-provisioning-profiles)
- **Documentation:** [TN3127: Inside Code Signing — Requirements](https://developer.apple.com/documentation/technotes/tn3127-inside-code-signing-requirements)
- **Documentation:** [Certificates — Apple Developer Support](https://developer.apple.com/support/certificates/)
- **Documentation:** [Create a development provisioning profile](https://developer.apple.com/help/account/provisioning-profiles/create-a-development-provisioning-profile/)
- **Documentation:** [Create an App Store provisioning profile](https://developer.apple.com/help/account/provisioning-profiles/create-an-app-store-provisioning-profile/)
- **WWDC:** [Simplify distribution in Xcode and Xcode Cloud (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10224/)
- **WWDC:** [Distribute apps in Xcode with cloud signing (WWDC21)](https://developer.apple.com/videos/play/wwdc2021/10204/)

## See also

For declaring and wiring up the entitlements that a profile must grant, see a skill on **entitlements and capabilities**. For the upload, TestFlight, and review steps that follow distribution signing, see a skill on **app distribution and App Store Connect**. For macOS direct distribution, pair this with a **notarization** skill.
