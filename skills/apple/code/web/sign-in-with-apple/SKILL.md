---
name: sign-in-with-apple
description: "Implements Sign in with Apple using AuthenticationServices: the SwiftUI SignInWithAppleButton, ASAuthorizationAppleIDProvider requests, credential and identity-token handling, server-side token verification, and Sign in with Apple JS on the web. Use when adding Apple authentication, requesting name/email scope, validating identity tokens on a backend, handling the private relay email, or responding to account revocation and deletion."
globs:
  - "**/*.swift"
tags: [authentication, signinwithapple, authenticationservices, privacy, oauth]
x-skills-master:
  domain: apple
  class: code
  category: web
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  requires:
    ios: "17"
    swift: "6.0"
  pairs_with: []
  sources:
    - https://developer.apple.com/documentation/authenticationservices
    - https://developer.apple.com/documentation/AuthenticationServices/implementing-user-authentication-with-sign-in-with-apple
    - https://developer.apple.com/documentation/signinwithapple/verifying-a-user
    - https://developer.apple.com/documentation/signinwithapplejs
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for this skill when you want a privacy-respecting, zero-password login that ships natively on every Apple platform and works on the web. It fits apps that need a real account system, that already offer a third-party login (App Store rules require Apple as an equal option in many cases), or that want to anchor identity to a verified Apple Account without storing a password. Use it when you must verify identity tokens on a backend, react to account revocation, or extend the same login to a website with Sign in with Apple JS.

## Core guidance

- **Prefer the SwiftUI `SignInWithAppleButton`** from AuthenticationServices over hand-rolling `ASAuthorizationController`. It takes `onRequest` (set scopes) and `onCompletion` (handle the `Result`), and styles via `.signInWithAppleButtonStyle(_:)`. Drop to `ASAuthorizationController` only for UIKit/AppKit or custom flows.
- **Request `[.fullName, .email]` in `onRequest`**, but treat the returned name and email as available *only on the very first authorization*. Apple omits them on every subsequent sign-in, so persist them server-side the first time or you lose them.
- **The stable user key is `credential.user`**, an opaque, team-scoped string. Use it as your primary account identifier; never key off the email, which may be a relay address that can change.
- **Always send `credential.identityToken` to your server and verify it there.** Validate the JWT signature against Apple's public keys (`https://appleid.apple.com/auth/keys`), and check the `iss`, `aud` (your client/bundle ID), and `exp` claims. Never trust the token client-side as proof of identity.
- **Check `getCredentialState(forUserID:)` at launch** and observe `ASAuthorizationAppleIDProvider.credentialRevokedNotification` so a revoked or transferred credential signs the user out promptly.
- **Handle the private relay email** (`@privaterelay.appleid.com`): outbound mail must go through Apple's relay service configured in your Apple Developer account, or it bounces.
- **Don't re-prompt for name/email** after the first run, and don't block login if the user shares only a relay address — that is a supported, expected choice.

```swift
import AuthenticationServices
import SwiftUI

SignInWithAppleButton(.signIn) { request in
    request.requestedScopes = [.fullName, .email]
} onCompletion: { result in
    guard case let .success(auth) = result,
          let cred = auth.credential as? ASAuthorizationAppleIDCredential,
          let tokenData = cred.identityToken,
          let token = String(data: tokenData, encoding: .utf8) else { return }
    // First sign-in only: cred.fullName / cred.email may be non-nil here.
    Task { await session.verify(userID: cred.user, identityToken: token) }
}
.signInWithAppleButtonStyle(.black)
```

## Platform notes

- **iOS / iPadOS / visionOS:** Native sheet UI; `SignInWithAppleButton` adapts to the platform automatically.
- **macOS:** Same API; the button renders as an AppKit control under SwiftUI.
- **watchOS / tvOS:** Supported, but the authorization UI and available scopes differ; tvOS often hands off to a nearby device. Test the constrained flows directly.
- **Web (Sign in with Apple JS):** Load Apple's JS, configure `AppleID.auth.init` with your Services ID, redirect URI, and scope, then exchange the returned authorization code or identity token on your server. Use this to keep one account across native and web.
- **Capability:** Enable the "Sign in with Apple" capability in Signing & Capabilities; for web and server flows create a Services ID and a private key in your Apple Developer account.

## Pitfalls

- **Losing name/email forever:** they arrive only once. To re-test the first-run path, remove the app from the Apple Account's signed-in apps list (Settings) to reset authorization.
- **Trusting an unverified token:** a client-supplied identity token must have its signature, issuer, audience, and expiry validated server-side before you create or log into an account.
- **Keying accounts on email:** relay addresses and email-sharing choices make email unstable. Always use `credential.user`.
- **Ignoring deletion:** set up server-to-server notifications to learn when a user stops using Apple ID with your app or deletes their Apple Account, then clean up their data.
- **Skipping relay configuration:** transactional email to relay addresses silently fails unless your sending domain and addresses are registered with Apple's relay.
- **No usage strings needed:** Sign in with Apple itself requires no `Info.plist` permission keys; it relies on the entitlement/capability instead.

## References

- **Documentation:** [Authentication Services](https://developer.apple.com/documentation/authenticationservices)
- **Documentation:** [Implementing User Authentication with Sign in with Apple](https://developer.apple.com/documentation/AuthenticationServices/implementing-user-authentication-with-sign-in-with-apple)
- **Documentation:** [Verifying a user](https://developer.apple.com/documentation/signinwithapple/verifying-a-user)
- **Documentation:** [Sign in with Apple JS](https://developer.apple.com/documentation/signinwithapplejs)
- **Documentation:** [credentialRevokedNotification](https://developer.apple.com/documentation/authenticationservices/asauthorizationappleidprovider/credentialrevokednotification)
- **WWDC:** [Enhance your Sign in with Apple experience (WWDC22)](https://developer.apple.com/videos/play/wwdc2022/10122/)

## See also

For button placement, sizing, label wording, and dark/light styling that meets Apple's requirements, see the hig-sign-in-with-apple-design skill. Pair this with your broader account and session-management work, and with any keychain-storage skill you use to persist the credential's stable user identifier.
