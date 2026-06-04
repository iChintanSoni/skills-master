---
name: keychain-security
description: "Stores credentials, tokens, and cryptographic keys securely using Keychain Services (SecItem APIs), accessibility levels, and SecAccessControl biometric/passcode gating. Use when persisting passwords, OAuth/session tokens, API keys, or private keys; when migrating secrets out of UserDefaults; or when sharing items across apps via keychain access groups."
globs:
  - "**/*.swift"
tags: [keychain, security, credentials, biometrics, secitem]
x-skills-master:
  domain: apple
  class: code
  category: system
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  requires:
    ios: "17"
    swift: "6.0"
  pairs_with: []
  sources:
    - https://developer.apple.com/documentation/security/keychain-services
    - https://developer.apple.com/documentation/security/keychain-items
    - https://developer.apple.com/documentation/security/secaccesscontrolcreatewithflags(_:_:_:_:)
    - https://developer.apple.com/documentation/security/sharing-access-to-keychain-items-among-a-collection-of-apps
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

# keychain-security

## When to use

Reach for the keychain whenever you persist a secret that must survive app launches: account passwords, OAuth refresh and session tokens, API keys, symmetric keys, or imported certificates and private keys. Use it when you are pulling secrets out of `UserDefaults`, plist files, or a database — none of those are encrypted at rest in a way that protects credentials. Use the access-control path when a secret should require Face ID, Touch ID, or the device passcode before it can be read, and use access groups when a secret must be shared between your app and its extensions or a suite of apps from the same team.

For passkey-based sign-in flows, prefer the `AuthenticationServices` framework over hand-rolling keychain storage; this skill covers the lower-level `SecItem` layer that still backs tokens and keys those flows do not replace.

## Core guidance

- **Never store secrets in `UserDefaults` or files.** Those stores are plaintext-readable from a backup or jailbroken device. The keychain encrypts each item with hardware-derived keys tied to device unlock state.
- **Pick the right item class.** Use `kSecClassGenericPassword` for tokens and app secrets, `kSecClassInternetPassword` when a server, protocol, and port are meaningful, and `kSecClassKey` / `kSecClassIdentity` for cryptographic material.
- **Set the tightest accessibility you can tolerate.** Default to `kSecAttrAccessibleWhenUnlockedThisDeviceOnly`; the `ThisDeviceOnly` variants block the secret from migrating to a new device via backup. Avoid `kSecAttrAccessibleAlways*` (deprecated and over-broad).
- **Define the uniqueness tuple deliberately.** For a generic password, `kSecAttrService` + `kSecAttrAccount` form the identity. Adding a duplicate returns `errSecDuplicateItem` — treat that as a signal to `SecItemUpdate`, not an error to swallow.
- **Set accessibility and access control at add time and never mutate them.** Updating protection attributes in place is unreliable; delete and re-add instead.
- **Gate high-value secrets with `SecAccessControl`.** Build flags with `SecAccessControlCreateWithFlags` (for example `.biometryCurrentSet` or `.userPresence`) and attach via `kSecAttrAccessControl`. Reads then prompt for biometrics/passcode automatically.
- **Don't query with `kSecReturnData` unless you need the secret.** Returning attributes only is cheaper and avoids triggering a biometric prompt prematurely.

```swift
func storeToken(_ token: Data, account: String) throws {
    let query: [String: Any] = [
        kSecClass as String: kSecClassGenericPassword,
        kSecAttrService as String: "com.example.api",
        kSecAttrAccount as String: account,
        kSecValueData as String: token,
        kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
    ]
    let status = SecItemAdd(query as CFDictionary, nil)
    guard status == errSecSuccess else { throw KeychainError(status) }
}
```

## Platform notes

- **iOS, iPadOS, watchOS, tvOS, visionOS:** Keychain access groups require the Keychain Sharing capability and an `keychain-access-groups` entitlement; items are scoped by your team prefix. Background reads fail if the device is locked and the item uses an `WhenUnlocked` accessibility level — use `AfterFirstUnlock*` for secrets a background task must read.
- **macOS:** A separate, file-based "login" keychain exists alongside the data-protection keychain. Pass `kSecUseDataProtectionKeychain: true` in your queries to get the same item model and behavior as iOS; without it you fall into the legacy file keychain with different semantics.
- **Biometrics:** `.biometryCurrentSet` invalidates the item if the enrolled fingerprints/faces change, which is the safer choice for credentials; `.biometryAny` survives re-enrollment. Reading an access-controlled item can run on a background thread and block, so never call it on the main thread.

## Pitfalls

- **Swallowing `errSecDuplicateItem`.** `SecItemAdd` fails on a logically identical item; your save silently no-ops. Branch to `SecItemUpdate` on that status.
- **Storing a `String` directly.** `kSecValueData` wants `Data`; encode UTF-8 deliberately and decode defensively on read.
- **Forgetting `ThisDeviceOnly` for device-bound secrets.** Without it, a token can ride an encrypted backup to a stranger's restored device.
- **Treating the keychain as a cache.** Items persist across app reinstalls on iOS; orphaned credentials linger. Clean up on logout or account removal.
- **Hardcoding the access group string.** Let the system resolve the default group rather than guessing the team-prefixed identifier, which differs between debug and release signing.
- **Privacy/permissions:** If you gate items behind biometrics, add an `NSFaceIDUsageDescription` string to `Info.plist`; iOS shows it the first time Face ID is invoked, and the prompt is rejected without it.

## References

- **Documentation:** [Keychain services](https://developer.apple.com/documentation/security/keychain-services)
- **Documentation:** [Keychain items (item classes and attribute keys)](https://developer.apple.com/documentation/security/keychain-items)
- **Documentation:** [SecAccessControlCreateWithFlags](https://developer.apple.com/documentation/security/secaccesscontrolcreatewithflags(_:_:_:_:))
- **Documentation:** [Sharing access to keychain items among a collection of apps](https://developer.apple.com/documentation/security/sharing-access-to-keychain-items-among-a-collection-of-apps)
- **WWDC:** [Streamline sign-in with passkey upgrades and credential managers (WWDC24)](https://developer.apple.com/videos/play/wwdc2024/10125/)
- **Sample Code:** [Connecting to a service with passkeys](https://developer.apple.com/documentation/AuthenticationServices/connecting-to-a-service-with-passkeys)

## See also

For password-less sign-in built on the keychain, see the authentication-services and passkeys skills, which cover `ASAuthorization` flows. For protecting reads behind Face ID/Touch ID directly via `LAContext`, see the local-authentication skill. When deriving or generating the keys you store here, see the cryptokit skill.
