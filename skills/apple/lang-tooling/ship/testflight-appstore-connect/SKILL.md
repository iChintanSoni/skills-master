---
name: testflight-appstore-connect
description: "Guides shipping Apple apps through TestFlight beta testing and App Store Connect: archiving and uploading a build, internal vs external testing groups, export-compliance, metadata and versions, submitting for review, and phased release. Use when you need to distribute a beta, set up TestFlight groups, fix Missing Compliance, manage app versions, or submit a release for review."
tags: [testflight, app-store-connect, distribution, release, ship]
x-skills-master:
  domain: apple
  class: lang-tooling
  category: ship
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  requires:
    xcode: "26"
  pairs_with: []
  sources:
    - https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/
    - https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds/
    - https://developer.apple.com/help/app-store-connect/update-your-app/release-a-version-update-in-phases/
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for this skill when you are moving a build out of Xcode and into testers' or customers' hands: cutting an archive, uploading it, wiring up TestFlight groups, clearing compliance, filling in store metadata, and submitting a version for App Review. It covers the full ship loop from `Product > Archive` through phased public release, including the feedback you collect along the way. If you are scripting any of this in CI, treat the UI steps here as the contract that the API or `xcodebuild`/`altool` calls must satisfy.

## Core guidance

- **Archive a Release build, then upload from Organizer.** Run `Product > Archive` (a Generic device destination, not a simulator), open `Window > Organizer`, select the archive, click **Distribute App > App Store Connect > Upload**. The same archive can later be exported for App Store delivery without rebuilding.
- **Do answer export compliance up front.** Set `ITSAppUsesNonExemptEncryption` in `Info.plist` so builds never land on *Missing Compliance*. Use `false` only when your encryption is exempt (HTTPS, standard OS crypto); otherwise declare it and attach documentation in App Store Connect.
- **Don't conflate internal and external testers.** Internal groups (up to 100 App Store Connect users) get builds immediately with no review; external groups (up to 10,000 people) require Beta App Review on the first build of a version. You must have an internal group before creating an external one.
- **Do let processing finish before you assign a build.** After upload the build shows *Processing*; bitcode-free thinning, symbol upload, and validation run server-side. Assign to groups or attach to a version only once it flips to ready.
- **Don't expect every external build to be re-reviewed.** Only the first build per version, or builds with material changes, trigger a fresh Beta App Review. Builds expire 90 days after upload.
- **Do treat the version record and the build as separate.** Edit name, description, keywords, screenshots, and *What's New* on the App Store version; then attach a processed build, answer the App Review questions, and submit.
- **Prefer phased release for updates.** Roll a version update to automatic-update users over 7 days (1, 2, 5, 10, 20, 50, 100 percent); you can pause up to 30 days or release to 100 percent at any time.

```xml
<!-- Info.plist: declare encryption once so TestFlight skips the compliance prompt -->
<key>ITSAppUsesNonExemptEncryption</key>
<false/>
```

## Platform notes

- **watchOS / standalone apps:** Some Xcode 26 builds of standalone watchOS apps have surfaced Organizer quirks where the App Store Connect upload option is hidden; uploading the iOS app that embeds the watch app, or using `xcodebuild -exportArchive`, is the reliable path.
- **visionOS / macOS / tvOS / iPadOS:** TestFlight in-app feedback (screenshots plus the *Send Beta Feedback* sheet) works on iOS, iPadOS, macOS, and visionOS with TestFlight 2.3+; tvOS and older OSes route tester feedback to your configured email instead.
- **All platforms:** Phased release applies across iOS, iPadOS, macOS, watchOS, and tvOS. Builds from Xcode Cloud must be added to TestFlight groups manually rather than auto-distributed.

## Pitfalls

- Marking a build *TestFlight Internal Only* permanently bars it from external testing or App Store submission — pick that flag deliberately.
- Forgetting to bump `CFBundleVersion` (build number) causes an upload rejection; `CFBundleShortVersionString` is the marketing version and must increase for each new App Store version.
- Auto-managed signing can silently switch certificates in CI; pin the team and distribution profile for reproducible archives.
- A build stuck in *Processing* for an unusually long time often means an invalid binary — check the email/notification rather than re-uploading blindly.
- Enabling phased release does not delay the release itself; it only staggers automatic updates, and anyone can still grab the new version manually from the App Store.

## References

- **Documentation:** [TestFlight overview](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/)
- **Documentation:** [Upload builds](https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds/)
- **Documentation:** [Provide export compliance information for beta builds](https://developer.apple.com/help/app-store-connect/test-a-beta-version/provide-export-compliance-information-for-beta-builds/)
- **Documentation:** [Release a version update in phases](https://developer.apple.com/help/app-store-connect/update-your-app/release-a-version-update-in-phases/)
- **WWDC:** [What's new in App Store Connect (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/328/)
- **WWDC:** [What's new in App Store Connect (WWDC24)](https://developer.apple.com/videos/play/wwdc2024/10063/)

## See also

For automating these steps in CI, see the Xcode Cloud and command-line distribution skills. For getting through App Review cleanly, pair this with the App Review guidelines skill; for the metadata and screenshots themselves, see the App Store product page skill.
