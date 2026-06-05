---
name: entitlements-capabilities
description: Guidance for declaring app capabilities in Xcode and the entitlements, App IDs, and provisioning profiles they generate, covering App Groups, Keychain Sharing, Push Notifications, iCloud and CloudKit, Sign in with Apple, and Associated Domains across platforms and build configurations. Use when adding a capability, debugging an entitlement or provisioning mismatch, sharing data between a host app and its extensions, splitting Debug and Release entitlements, or wiring per-platform identifiers.
---

# entitlements-capabilities

## When to use

Reach for this skill when adding a capability such as App Groups, Keychain Sharing, Push Notifications, iCloud/CloudKit, Sign in with Apple, or Associated Domains, and you need to understand what Xcode writes where. It also covers diagnosing the "entitlement not in profile" class of failures, sharing a container or keychain between an app and its extensions, separating Debug and Release entitlements, and handling identifiers that differ per platform. It is about the mental model and hygiene, not a click-by-click setup tour.

## Core guidance

- Treat the capability as the source of truth and the **`.entitlements` plist** as its generated output. Adding a capability in the **Signing & Capabilities** tab writes keys into that file; deleting the row should remove them. Edit the plist directly only for values Xcode cannot express, and never hand-edit keys that a managed capability owns.
- Understand the three layers a capability touches: the **entitlements file** (compiled into the binary's signature), the **App ID** on the developer portal (its enabled services), and the **provisioning profile** (which must carry the entitlement values to authorize install). A build that compiles but fails to install almost always means the profile lacks an entitlement the binary requests.
- Prefer **automatic signing** so Xcode reconciles all three layers: enabling a managed capability updates the App ID and regenerates the profile. With **manual signing**, you must enable the service on the portal and download a fresh profile yourself, or installs fail with a qualification error.
- Do **not** copy entitlements files between targets blindly. An app extension needs its own entitlements and its own App ID, but it must share the *same* App Group and Keychain Access Group identifiers as its host to exchange data.
- Match the entitlement value to the **build context**: push uses development vs production APS environments, and iCloud containers differ by environment. Let the profile and `aps-environment` value follow the channel rather than hardcoding production.
- Split entitlements per **build configuration** with the `CODE_SIGN_ENTITLEMENTS` build setting when Debug and Release need different containers or environments. Xcode already injects `Get Task Allow` into Debug-only via base entitlements; mirror that pattern rather than fighting it.
- Keep identifiers **stable and namespaced**: App Group IDs start with `group.`, associated-domains entries use service-qualified hosts like `applinks:example.com`, and CloudKit containers default to `iCloud.<bundle-id>`. Renaming any of these orphans existing user data.

```xml
<!-- Shared between an app and its widget/extension target. -->
<key>com.apple.security.application-groups</key>
<array>
    <string>group.com.example.notes</string>
</array>
<key>keychain-access-groups</key>
<array>
    <string>$(AppIdentifierPrefix)com.example.notes.shared</string>
</array>
```

## Platform notes

- **iOS, iPadOS, watchOS, tvOS, visionOS**: App Group identifiers use the bare `group.` prefix. Push notifications use the `aps-environment` entitlement, set to `development` or `production` to match the profile.
- **macOS**: App Groups require the team prefix, written as `$(TeamIdentifierPrefix)group.com.example.notes`, so the same logical group needs a different literal string than its iOS counterpart. Push uses `com.apple.developer.aps-environment`. Sandboxed Mac apps need the matching sandbox entitlement before many capabilities (network, files, hardware) function.
- **Cross-platform targets**: when one app ships to both iOS and macOS, drive the platform-specific group string from a build setting or per-platform entitlements file rather than a single literal. Keychain Access Groups use `$(AppIdentifierPrefix)` on both, so they port cleanly; App Groups do not.
- **Xcode 26 / 2026 cycle**: managed capabilities are reconciled at build time when signing automatically; the Capabilities tab on the portal still gates anything you sign manually.

## Pitfalls

- Enabling a capability in Xcode while signing manually, then wondering why install fails: the regenerated profile was never downloaded, so its entitlements lag the binary.
- Sharing an App Group between an app and extension but using mismatched identifier strings (or the wrong macOS team prefix), so the shared container silently resolves to different paths.
- Hand-editing the entitlements plist for a key a managed capability owns; Xcode overwrites or conflicts with it on the next capability change.
- Hardcoding `production` for `aps-environment` or a production iCloud container in Debug, so development pushes and sandbox data never reach the right environment.
- Leaving stale entitlements after removing a capability, leaving the binary requesting a service the profile no longer authorizes.
- Renaming a CloudKit container or App Group after shipping, which abandons every user's existing data behind the old identifier.

## References

- **Documentation:** [Adding capabilities to your app](https://developer.apple.com/documentation/xcode/adding-capabilities-to-your-app)
- **Documentation:** [Configuring app groups](https://developer.apple.com/documentation/xcode/configuring-app-groups)
- **Documentation:** [Configuring keychain sharing](https://developer.apple.com/documentation/xcode/configuring-keychain-sharing)
- **Documentation:** [Configuring an associated domain](https://developer.apple.com/documentation/xcode/configuring-an-associated-domain)
- **Documentation:** [Provisioning with managed capabilities](https://developer.apple.com/help/account/reference/provisioning-with-managed-capabilities/)
- **Documentation:** [App Groups entitlement reference](https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.security.application-groups)

## See also

See `build-sign-distribute` for how signing identities and profiles are produced and exported, since a capability is only as good as the profile that carries its entitlements. See `xcode-project-conventions` for organizing build configurations and the `CODE_SIGN_ENTITLEMENTS` setting so per-environment entitlements stay predictable across schemes and targets.
