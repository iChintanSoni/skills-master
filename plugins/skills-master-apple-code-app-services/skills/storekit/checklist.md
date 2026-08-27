## StoreKit 2 review checklist

- [ ] Products loaded once via `Product.products(for:)` and the `Product` values reused.
- [ ] `purchase()` result handles `.success`, `.pending`, and `.userCancelled` (plus `@unknown default`).
- [ ] Verification uses `payloadValue` or a `.verified`/`.unverified` switch — never a force-unwrap.
- [ ] `transaction.finish()` is called after content is granted, on every processed transaction.
- [ ] A `Transaction.updates` listener starts at launch and lives for the app's lifetime.
- [ ] Entitlements are computed from `Transaction.currentEntitlements`, not a persisted boolean.
- [ ] Refunds/revocations are respected (`revocationDate` checked; refunded users lose access).
- [ ] Subscription state read from `Product.SubscriptionInfo.Status`, treating grace and billing-retry as active.
- [ ] A restore-purchases path is exposed (e.g. `AppStore.sync()` or the `.restorePurchases` store button).
- [ ] In-App Purchase capability enabled and products configured in App Store Connect.
- [ ] A StoreKit configuration file is attached to the run scheme for local testing.
- [ ] Renewal, refund, and Ask-to-Buy flows exercised via Xcode's Transaction Manager.
- [ ] App Store Server Notifications V2 endpoint configured and JWS payloads verified server-side.
