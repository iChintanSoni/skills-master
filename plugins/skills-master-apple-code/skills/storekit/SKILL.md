---
name: storekit
description: Use when implementing in-app purchases or auto-renewable subscriptions with StoreKit 2 — loading Product objects, calling purchase() and handling PurchaseResult, verifying VerificationResult<Transaction>, reading current entitlements and subscription status, listening to Transaction.updates for renewals and refunds, finishing transactions, and building paywalls with ProductView or SubscriptionStoreView.
---

## When to use

Reach for StoreKit 2 whenever an app sells consumables, non-consumables, or auto-renewable subscriptions directly through the App Store. The modern API is fully `async`/`await` driven and exposes cryptographically signed transactions, so you no longer parse a binary receipt by hand. Use it for the purchase flow itself, for deciding what a customer currently owns, and for keeping that decision fresh as renewals, refunds, and upgrades arrive. For the storefront UI, prefer the built-in SwiftUI views before hand-rolling a paywall.

## Core guidance

- **Load products by identifier, then keep the `Product` value.** Call `Product.products(for:)` once and hold the results; a `Product` carries the localized title, `displayPrice`, and the `purchase()` entry point.
- **Treat verification as mandatory, not optional.** `purchase()` returns `.success`, `.pending`, or `.userCancelled`. On success, unwrap the `VerificationResult` and reject anything `.unverified`; do not ship a code path that grants content from an unverified transaction.
- **Make entitlement state your single source of truth.** Compute access from `Transaction.currentEntitlements` rather than persisting a local "isPro" flag, which drifts after refunds or family-sharing changes.
- **Always start the `Transaction.updates` listener at launch.** Renewals, Ask-to-Buy approvals, and refunds surface here, including ones that happened on another device while your app was closed.
- **Finish every transaction you have processed.** Until you call `transaction.finish()`, StoreKit keeps redelivering it; finish only after content is securely granted.
- **Read subscription state from `Product.SubscriptionInfo.Status`,** which distinguishes `.subscribed`, `.inGracePeriod`, `.inBillingRetryPeriod`, and `.expired` — these are not interchangeable.
- **Don't trust the device clock for expiry;** rely on `expirationDate` from the signed transaction and the server status instead.

```swift
func unlock(_ product: Product) async throws -> Bool {
    switch try await product.purchase() {
    case .success(let verification):
        let transaction = try verification.payloadValue   // throws if .unverified
        await grantAccess(to: transaction.productID)
        await transaction.finish()
        return true
    case .pending, .userCancelled:
        return false
    @unknown default:
        return false
    }
}
```

## Platform notes

- **iOS/iPadOS 17+, macOS 14+, watchOS 10+, tvOS 17+, visionOS 1+** support the full StoreKit 2 surface, including the SwiftUI views.
- **SwiftUI storefronts:** `ProductView` merchandises a single product, `StoreView` lists several, and `SubscriptionStoreView` renders a subscription group's options and handles eligibility automatically. iOS/iPadOS 26 add `SubscriptionOfferView` for upgrade, downgrade, and crossgrade offers, plus broader offer-code support.
- **No usage-string entitlement is required**, but the app needs the In-App Purchase capability and products configured in App Store Connect. For local development, attach a StoreKit configuration file to your run scheme and use Xcode's Transaction Manager (Debug ▸ StoreKit) to simulate renewals and refunds.
- **Server side:** enable App Store Server Notifications V2 so your backend learns about renewals, refunds, and revocations independent of the client; verify the signed JWS payloads there too.

## Pitfalls

- **Skipping `finish()`** leaves transactions in the queue, so they reappear on every launch and on the `updates` stream.
- **Persisting a boolean entitlement** instead of recomputing from `currentEntitlements` causes refunded users to retain access.
- **Starting the `updates` task too late** (or in a view that gets deallocated) drops out-of-app renewals; anchor it to app lifetime.
- **Force-unwrapping the verification result** trusts a potentially forged transaction; switch on `.verified`/`.unverified` or let `payloadValue` throw.
- **Assuming `currentEntitlements` is instantly populated** at cold launch — await it, and let the `updates` listener reconcile shortly after.

## References

- **Documentation:** [StoreKit](https://developer.apple.com/documentation/storekit)
- **Documentation:** [Product.PurchaseResult](https://developer.apple.com/documentation/storekit/product/purchaseresult)
- **Documentation:** [Transaction.updates](https://developer.apple.com/documentation/storekit/transaction/updates)
- **Documentation:** [Setting up StoreKit Testing in Xcode](https://developer.apple.com/documentation/xcode/setting-up-storekit-testing-in-xcode/)
- **WWDC:** [Meet StoreKit for SwiftUI (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10013/)
- **Sample Code:** [SubscriptionStoreView](https://developer.apple.com/documentation/storekit/subscriptionstoreview)

## See also

Pair this with a server-trust skill covering App Store Server Notifications V2 and the App Store Server API for authoritative entitlement checks. The SwiftUI paywall layout benefits from a swiftui-layout skill, and securing the unlocked content alongside an app-security or keychain skill keeps grants from being trivially spoofed.
