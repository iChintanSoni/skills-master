---
name: info-plist-entitlements
description: "Guidance on Info.plist keys, privacy usage strings, and the .entitlements file: which to use, how capabilities populate them, driving values from build settings, and wiring URL schemes and associated domains. Use when configuring privacy purpose strings, adding a capability, debugging a missing-key crash or rejection, setting up universal links or custom schemes, or making these files reviewable."
---

## When to use

Reach for this when you configure an app's identity and permissions: adding a privacy purpose string, enabling a capability, debugging a "this app has crashed because it attempted to access privacy-sensitive data without a usage description" log, fixing an App Store rejection for a missing key, or wiring custom URL schemes and universal links. It also applies when you want these declarations to be diff-friendly and reviewable rather than opaque binary blobs.

## Core guidance

- **Know the split.** Info.plist is *descriptive* metadata the system reads at launch (bundle id, version, supported orientations, privacy strings, URL schemes). The `.entitlements` file is a *signed grant* of capabilities (push, App Groups, iCloud, associated domains, Keychain sharing) that must match a provisioning profile and the App ID. A key in the wrong file silently does nothing.
- **Do let capabilities write entitlements for you.** Use the target's Signing & Capabilities tab; adding a capability edits the `.entitlements` file *and* enables the feature on the App ID. Don't hand-author entitlement keys you could add through that UI — drift between the file and the App ID causes provisioning failures.
- **Do supply every privacy purpose string the code path needs**, with a specific human reason ("Photos let you attach images to a note"), not "We need access." A missing `NS…UsageDescription` for an API you call is a hard crash, not a denied prompt.
- **Do drive volatile values from build settings.** Set `GENERATE_INFOPLIST_FILE = YES` and let Xcode synthesize the file from `INFOPLIST_KEY_*` settings and your source plist; reference build settings with `$(VARIABLE)` so version, name, and environment come from one place.
- **Don't hardcode the bundle version.** Use `$(MARKETING_VERSION)` / `$(CURRENT_PROJECT_VERSION)` so a single bump flows everywhere.
- **Don't ship development-only entitlements.** `get-task-allow` and `aps-environment = development` belong to debug signing; release builds must carry the production values via the correct profile.
- **Idiom:** keep one source-controlled `.entitlements` and a lean source Info.plist; let the build merge synthesized keys so reviewers see only intentional, meaningful diffs.

## Platform notes

- **iOS / iPadOS:** Custom schemes go under `CFBundleURLTypes`; universal links and shared credentials need the associated-domains entitlement plus an `apple-app-site-association` file served over HTTPS. Prefer universal links over custom schemes for web continuity.
- **macOS:** The App Sandbox and Hardened Runtime are entitlement-driven; sandboxed apps need explicit resource entitlements (e.g. file-access, network) rather than Info.plist keys.
- **watchOS / tvOS / visionOS:** Privacy strings still live in Info.plist, but available capabilities differ — only enable capabilities the target's platform actually supports, since unsupported entitlements break signing.

## Pitfalls

- Adding a privacy key as a *generic key in build settings* without the matching capability on the App ID — the prompt appears but the entitlement-backed feature fails at runtime.
- Editing the `.entitlements` file by hand and forgetting to enable the matching service on the App ID; the build signs but the capability is inert or rejected.
- Trusting that a custom URL scheme is private — schemes are first-come on a device and can be hijacked; use universal links for anything security-relevant.
- Required Reason API and privacy-manifest gaps surface only at App Store Connect upload (e.g. `ITMS-91055`), long after the build succeeds locally.

## References

- **Documentation:** [Information Property List](https://developer.apple.com/documentation/bundleresources/information-property-list)
- **Documentation:** [Managing your app's information property list values](https://developer.apple.com/documentation/BundleResources/managing-your-app-s-information-property-list)
- **Documentation:** [Entitlements](https://developer.apple.com/documentation/bundleresources/entitlements)
- **Documentation:** [Supporting associated domains](https://developer.apple.com/documentation/xcode/supporting-associated-domains)
- **Documentation:** [Privacy manifest files](https://developer.apple.com/documentation/bundleresources/privacy-manifest-files)
- **WWDC:** [Get started with privacy manifests (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10060/)

## See also

For declaring data collection and Required Reason API usage that the App Store now enforces, see a privacy-manifests skill. For the signing and provisioning-profile mechanics that make entitlements take effect, see a code-signing-and-provisioning skill. For build-setting layering with .xcconfig files that feed `$(VARIABLE)` substitution, see an xcconfig-build-settings skill.
