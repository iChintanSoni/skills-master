---
name: cryptokit
description: "Use when adding hashing, HMAC, symmetric encryption (AES-GCM/ChaChaPoly), key agreement (Curve25519/P256/P384), signatures, HKDF, or Secure Enclave-backed keys to Swift code. Triggers: import CryptoKit, SymmetricKey, SHA256, AES.GCM.seal, sharedSecretFromKeyAgreement, SecureEnclave."
globs:
  - "**/*.swift"
tags: [cryptokit, security, encryption, keychain, signing]
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
    - https://developer.apple.com/documentation/cryptokit/
    - https://developer.apple.com/documentation/CryptoKit/performing-common-cryptographic-operations
    - https://developer.apple.com/documentation/cryptokit/secureenclave/p256/signing/privatekey
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for CryptoKit when you need correct, hard-to-misuse primitives: hashing
(`SHA256`/`SHA512`), message authentication (`HMAC`), authenticated symmetric
encryption (`AES.GCM`, `ChaChaPoly`), elliptic-curve signatures and key
agreement (`Curve25519`, `P256`, `P384`), key derivation (`HKDF`), and
private keys that never leave the Secure Enclave. The framework favors typed
values over loose `Data`, so the compiler steers you away from classic mistakes
like nonce reuse or non-constant-time tag comparison.

Do not hand-roll crypto, reuse nonces, or build a homemade key store. If you
need TLS, prefer URLSession/Network; CryptoKit is for application-layer
operations, not transport security.

## Core guidance

- **Use authenticated encryption only.** `AES.GCM.seal`/`open` and
  `ChaChaPoly` bundle ciphertext, nonce, and tag in a `SealedBox`. Never invent
  your own padding or CBC scheme; there is no unauthenticated cipher API on
  purpose.
- **Let the framework pick nonces.** Omit the `nonce:` argument so `seal`
  generates a fresh random nonce. Reusing a nonce with the same key breaks GCM
  catastrophically.
- **Compare digests and MACs by value, never byte-by-byte.** `Digest` and
  `MAC` types are `Equatable` and compare in constant time. Use
  `isValidAuthenticationCode(_:authenticating:using:)` to verify HMACs rather
  than `==` on raw bytes.
- **Derive keys; don't reuse a shared secret directly.** After
  `sharedSecretFromKeyAgreement(with:)`, call
  `hkdfDerivedSymmetricKey` (or `HKDF.deriveKey`) with a salt and context
  `sharedInfo` to produce the actual `SymmetricKey`.
- **Prefer Secure Enclave keys for long-lived asymmetric secrets.** Generate
  `SecureEnclave.P256.Signing.PrivateKey(accessControl:)`; the raw key material
  is non-extractable. Persist only its `dataRepresentation` (an encrypted blob)
  and gate `SecureEnclave.isAvailable` first.
- **Pick the right curve.** Use `Curve25519` for modern peers, `P256`/`P384`
  for NIST/FIPS interop, and reserve Secure Enclave for `P256` only.
- **Don't log or print key material.** Wrap secrets in
  `SymmetricKey`/`PrivateKey` and pass them around as typed values, never as
  hex strings.

```swift
import CryptoKit

let key = SymmetricKey(size: .bits256)
let sealed = try AES.GCM.seal(plaintext, using: key)          // random nonce
let restored = try AES.GCM.open(sealed.combined!.asSealedBox, using: key)

// HMAC verify in constant time
let tag = HMAC<SHA256>.authenticationCode(for: message, using: key)
let ok = HMAC<SHA256>.isValidAuthenticationCode(tag, authenticating: message, using: key)
```

## Platform notes

- CryptoKit ships on iOS/iPadOS 13+, macOS 10.15+, watchOS, tvOS, and
  visionOS; this skill targets iOS 17 / Swift 6 idioms.
- The Secure Enclave is unavailable on the Simulator and on Macs without the
  hardware; always branch on `SecureEnclave.isAvailable` and have a software
  fallback path for tests.
- For cross-platform server code, the open-source **Swift Crypto** package
  exposes the same API surface on Linux.
- Post-quantum primitives (ML-KEM, ML-DSA, and the `HPKE` hybrid suites)
  arrived in the 26 cycle; see the WWDC25 reference if you need them.

## Pitfalls

- **Nonce reuse with AES-GCM.** Passing a fixed `AES.GCM.Nonce` defeats the
  cipher. Let `seal` choose, or generate a fresh `Nonce()` each time.
- **Non-constant-time comparison.** Converting a tag to `Data`/hex and using
  `==` leaks timing. Compare the typed `MAC`/`Digest` values instead.
- **Treating `SharedSecret` as a key.** Never feed it directly into a cipher;
  always run it through HKDF with a salt and `sharedInfo`.
- **Losing access control on Secure Enclave keys.** `dataRepresentation` is the
  only thing you can persist; storing the wrong access-control flags can leave
  the key unusable after a passcode change.
- **No Info.plist string for Secure Enclave alone.** It needs no usage string,
  but if you also require biometrics via access control, present clear UI; Face
  ID prompts require `NSFaceIDUsageDescription` in Info.plist.

## References

- **Documentation:** [Apple CryptoKit](https://developer.apple.com/documentation/cryptokit/)
- **Documentation:** [Performing Common Cryptographic Operations](https://developer.apple.com/documentation/CryptoKit/performing-common-cryptographic-operations)
- **Documentation:** [SecureEnclave.P256.Signing.PrivateKey](https://developer.apple.com/documentation/cryptokit/secureenclave/p256/signing/privatekey)
- **Documentation:** [HKDF](https://developer.apple.com/documentation/cryptokit/hkdf)
- **WWDC:** [Cryptography and Your Apps (WWDC19)](https://developer.apple.com/videos/play/wwdc2019/709/)
- **WWDC:** [Get ahead with quantum-secure cryptography (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/314/)

## See also

For storing CryptoKit keys, generic secrets, or the `dataRepresentation` blob
of a Secure Enclave key, see the keychain-services skill. When you need
hardware key generation with `SecKey`-level access control flags that CryptoKit
does not expose, the security-framework skill covers the lower-level API. For
verifying signatures or digests inside an app's update or document pipeline,
pair this with the relevant data-integrity guidance.
