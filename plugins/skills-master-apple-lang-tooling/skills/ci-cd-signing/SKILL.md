---
name: ci-cd-signing
description: "Guidance for building, testing, signing, and shipping Apple apps from CI: xcodebuild on headless runners, App Store Connect API keys, fastlane match, TestFlight upload, caching, and Xcode Cloud. Use when setting up a pipeline, fixing CI code-signing failures, automating archive/TestFlight delivery, or choosing between self-hosted CI and Xcode Cloud."
---

## When to use

Reach for this when you are wiring up continuous integration for an Apple app and need a build, test, and release pipeline that runs unattended. It covers driving `xcodebuild` on a headless macOS runner, authenticating to App Store Connect without a human at the 2FA prompt, getting signing identities onto an ephemeral machine safely, and pushing archives to TestFlight. It also helps you decide whether to host your own runners (GitHub Actions, GitLab, Bitrise, Buildkite) or hand the work to Xcode Cloud.

## Core guidance

- **Authenticate with an App Store Connect API key, never an Apple ID.** A `.p8` key plus its Key ID and Issuer ID produces a JWT and sidesteps interactive 2FA. Pass them to `xcodebuild -exportArchive` via `-authenticationKeyPath`, `-authenticationKeyID`, `-authenticationKeyIssuerID`; fastlane reads `app_store_connect_api_key`.
- **Do test and archive in separate invocations.** Build/test with `xcodebuild test` against simulators; archive with `xcodebuild archive` then `-exportArchive`. The API-key auth flow on `xcodebuild` only authorizes export and upload, not the archive build itself.
- **Don't store signing material in the repo.** Keep the `.p8`, the distribution `.p12`, and provisioning profiles as base64-encoded CI secrets. Decode at runtime, import into a fresh temporary keychain, and delete everything in an `always`/cleanup step — critical on self-hosted runners.
- **Centralize identities with fastlane match for teams.** Store encrypted certs/profiles in a private Git repo (or S3/GCS) and run `match` in `readonly` mode on CI so jobs fetch but never regenerate. Give every job its own keychain to avoid races.
- **Use managed (cloud) signing where you can.** `-allowProvisioningUpdates` with an API key lets Xcode mint and fetch profiles on demand, removing profile files from your secret set; match remains the choice when you need pinned, reviewable identities.
- **Cache aggressively but correctly.** Cache SwiftPM (`~/Library/Caches/org.swift.swiftpm`, `~/Library/Developer/Xcode/DerivedData/.../SourcePackages`) keyed on `Package.resolved`; cache CocoaPods on `Podfile.lock`. Never cache the keychain or DerivedData build artifacts blindly.
- **Pin the toolchain.** Select Xcode explicitly (`xcodes` or `sudo xcode-select -s`) so a runner image bump doesn't silently change the SDK.

```bash
# Export a signed archive on CI using an App Store Connect API key (no Apple ID, no 2FA).
xcodebuild -exportArchive \
  -archivePath "$RUNNER_TEMP/App.xcarchive" \
  -exportOptionsPlist ExportOptions.plist \
  -exportPath "$RUNNER_TEMP/export" \
  -allowProvisioningUpdates \
  -authenticationKeyPath "$RUNNER_TEMP/AuthKey.p8" \
  -authenticationKeyID "$ASC_KEY_ID" \
  -authenticationKeyIssuerID "$ASC_ISSUER_ID"
```

## Platform notes

- **iOS / iPadOS / tvOS / watchOS / visionOS:** App Store distribution flows are identical — archive the app target, export with the matching `method` (`app-store-connect`) in `ExportOptions.plist`, upload to TestFlight. watchOS and visionOS ship as part of their host or as their own archive; ensure each embedded target's profile is present.
- **macOS:** Distribution adds notarization. After export, submit the signed app or installer with `xcrun notarytool submit --wait` (it accepts the same API key trio), then `xcrun stapler staple`. Developer ID apps skip TestFlight; Mac App Store apps still go through App Store Connect.
- **Xcode Cloud:** Code signing is fully managed — you don't provision keychains or store `.p8` files in CI secrets at all. Configure workflows in App Store Connect or Xcode, and trigger or poll them programmatically via the `ciBuildRuns` endpoint of the App Store Connect API.

## Pitfalls

- **Relying on Apple-ID login.** It triggers 2FA and breaks unattended runs; always use an API key.
- **Reusing the login keychain on self-hosted runners.** Leftover identities cause "ambiguous signing identity" errors and leak secrets across jobs. Create and delete a job-scoped keychain every run.
- **Letting profiles auto-update under `match`.** In CI keep `readonly: true`; an accidental regenerate can revoke certificates other developers depend on.
- **Caching `Package.resolved` mismatch.** A stale SwiftPM cache keyed on the wrong file silently builds the wrong dependency versions; key on the resolved file and invalidate on change.
- **Forgetting notarization on macOS.** A correctly signed but un-notarized app is blocked by Gatekeeper on first launch.
- **Hard-coding a runner's Xcode.** GitHub/GitLab image updates move the default Xcode; pin it explicitly.

## References

- **Documentation:** [Creating API Keys for App Store Connect API](https://developer.apple.com/documentation/appstoreconnectapi/creating-api-keys-for-app-store-connect-api)
- **Documentation:** [Xcode Cloud](https://developer.apple.com/documentation/xcode/xcode-cloud)
- **Documentation:** [Installing an Apple certificate on macOS runners for Xcode development (GitHub)](https://docs.github.com/actions/use-cases-and-examples/deploying/installing-an-apple-certificate-on-macos-runners-for-xcode-development)
- **Documentation:** [fastlane match](https://docs.fastlane.tools/actions/match/)
- **WWDC:** [Create practical workflows in Xcode Cloud (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10278/)
- **WWDC:** [Extend your Xcode Cloud workflows (WWDC24)](https://developer.apple.com/videos/play/wwdc2024/10200/)

## See also

Pair this with a skill on TestFlight and App Store Connect release management for the distribution side, an xcodebuild and build-settings skill for tuning the test and archive invocations, and a Swift Package Manager skill for getting dependency caching keys right on CI.
