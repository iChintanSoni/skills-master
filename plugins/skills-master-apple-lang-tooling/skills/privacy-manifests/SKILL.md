---
name: privacy-manifests
description: "Guidance on authoring a PrivacyInfo.xcprivacy privacy manifest: declaring collected data types, tracking and tracking domains, required-reason API entries, and signing third-party SDK manifests. Use when adding or auditing a privacy manifest, fixing ITMS-91053/ITMS-91061 App Store upload errors, integrating an SDK on Apple's required list, or reconciling the manifest with the App Store privacy nutrition label."
---

## When to use

Reach for this skill when you ship to the App Store and need a `PrivacyInfo.xcprivacy` file: declaring what data your app collects, whether it tracks, which "required reason" APIs you call, and how bundled SDKs document and sign their own manifests. It also applies when an upload bounces with an `ITMS-91053` (missing required-reason API) or `ITMS-91061` (missing SDK manifest) error, or when the App Store privacy label disagrees with what the code actually does.

It does **not** cover the App Tracking Transparency prompt flow itself or runtime permission dialogs — those are separate consent surfaces that the manifest only *describes*.

## Core guidance

- **Do** add one app-level manifest at the target root and let each privacy-impacting SDK ship its own; Xcode aggregates every manifest in the bundle when producing the privacy report. Name the file exactly `PrivacyInfo.xcprivacy` and add it to the target's "Copy Bundle Resources" build phase.
- **Do** set `NSPrivacyTracking` to true only if any data leaves the device linked to identity for tracking, and then list every domain reached for tracking in `NSPrivacyTrackingDomains`. If tracking is true, the domains array must be non-empty or ATT-gated traffic to those hosts is blocked.
- **Do** declare each collected category in `NSPrivacyCollectedDataTypes` with its `Linked`, `Tracking`, and `Purposes` flags — these feed directly into the nutrition label, so a mismatch is the most common review pushback.
- **Do** add an `NSPrivacyAccessedAPITypes` entry for every required-reason API you call (file timestamp, system boot time, disk space, active keyboard, user defaults), pairing each with an approved reason code; an undeclared call triggers `ITMS-91053`.
- **Don't** invent a reason code. Use only the approved strings (for example `CA92.1` for `UserDefaults` access from your own app) and re-check the technote each cycle, since Apple revises the approved list.
- **Don't** ship an unsigned binary SDK from the commonly-used list — Xcode validates that a new SDK version carries the same signing identity as the prior one, and the upload fails without a valid signature.
- **Prefer** generating a draft from Xcode's "App Privacy Report" rather than hand-writing the XML, then trimming entries you can prove are unused.

```xml
<key>NSPrivacyAccessedAPITypes</key>
<array>
  <dict>
    <key>NSPrivacyAccessedAPIType</key>
    <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
    <key>NSPrivacyAccessedAPITypeReasons</key>
    <array>
      <string>CA92.1</string>
    </array>
  </dict>
</array>
```

## Platform notes

- **All platforms (iOS, iPadOS, macOS, watchOS, tvOS, visionOS):** the manifest format is identical and a single file covers every embedded slice; there is no per-platform manifest.
- **App vs. SDK:** an app manifest and an SDK manifest use the same keys, but an SDK distributed as an XCFramework should carry the manifest *inside* the framework so the code signature protects it. Source/SwiftPM SDKs place the file at the package resource root.
- **Required-reason scope:** required-reason API rules apply to App Store distribution; ad-hoc, enterprise, and TestFlight builds still benefit from the same declarations because the privacy report reads them locally.

## Pitfalls

- Forgetting "Copy Bundle Resources": the file compiles but is absent at runtime, so the privacy report is silently empty.
- Treating the nutrition label and the manifest as independent — the label is now derived from aggregated manifests; editing one without the other surfaces in review.
- Declaring `NSPrivacyTracking = true` with an empty `NSPrivacyTrackingDomains` (or vice versa), which either over-reports tracking or gets domains blocked.
- Vendoring an SDK by copying its source and dropping its `.xcprivacy`, which strips both the manifest and the signature Xcode expects to validate.
- Adding required-reason entries for APIs you do not call, bloating the label and inviting questions; declare only what static analysis or the upload error actually flags.

## References

- **Documentation:** [Privacy manifest files](https://developer.apple.com/documentation/bundleresources/privacy-manifest-files)
- **Documentation:** [Adding a privacy manifest to your app or third-party SDK](https://developer.apple.com/documentation/bundleresources/adding-a-privacy-manifest-to-your-app-or-third-party-sdk)
- **Documentation:** [Describing use of required reason API](https://developer.apple.com/documentation/bundleresources/describing-use-of-required-reason-api)
- **Documentation:** [TN3183: Adding required reason API entries to your privacy manifest](https://developer.apple.com/documentation/technotes/tn3183-adding-required-reason-api-entries-to-your-privacy-manifest)
- **Documentation:** [Third-party SDK requirements](https://developer.apple.com/support/third-party-SDK-requirements/)
- **WWDC:** [Get started with privacy manifests (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10060/)
- **WWDC:** [Verify app dependencies with digital signatures (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10061/)

## See also

Pair this with a skill on the App Store submission and App Store Connect metadata flow, since the privacy nutrition label is generated from these manifests. It also complements an App Tracking Transparency skill — the manifest declares tracking that the ATT prompt gates at runtime — and a Swift Package Manager binary-dependency skill, which covers signing and distributing the XCFrameworks whose manifests this file aggregates.
