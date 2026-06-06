---
name: play-billing
description: Covers Google Play Billing integration for Android apps — setting up the Play Billing Library, querying products, launching the purchase flow, acknowledging purchases, handling subscriptions, querying existing purchases, and verifying transactions server-side. Use when adding one-time purchases or subscriptions to an Android app, troubleshooting billing flow issues, or implementing server-side receipt validation with the Play Developer API.
---

## When to use

Apply this skill when integrating Google Play Billing into an Android app: wiring up the Play Billing Library, surfacing one-time products (OTPs) or subscription plans in your UI, launching the purchase flow, acknowledging or consuming purchases, restoring entitlements on re-install, and verifying receipts server-side. Also relevant when debugging common billing edge cases such as pending purchases, interrupted flows, or test environment setup with license testers.

## Core guidance

- **Add the dependency** via the version catalog or `libs.versions.toml`. Use `com.android.billingclient:billing-ktx` (the Kotlin extensions artifact) so the async APIs are `suspend` functions rather than callback soup.
- **Create one `BillingClient` per app process** and reuse it. Construction is cheap; teardown (`endConnection`) should only happen when the component owning it is permanently destroyed. A `BillingClientStateListener` handles reconnects — the Play connection can drop and must be re-established.
- **Always query `ProductDetails` before launching a purchase.** Product IDs are not enough; the billing flow requires a `ProductDetailsParams` built from a live `ProductDetails` object returned by `queryProductDetailsAsync`.
- **Acknowledge or consume every purchase within three days or it is refunded automatically.** One-time non-consumable entitlements use `acknowledgePurchase`; consumable products (e.g., coin packs) use `consumePurchase`, which both acknowledges and resets the product so it can be purchased again.
- **Never grant entitlements before a purchase is verified.** A purchase with `purchaseState == Purchase.PurchaseState.PURCHASED` and `isAcknowledged == true` (or freshly consumed) is the minimum bar client-side; always add server-side verification before unlocking high-value content.
- **Handle `ITEM_ALREADY_OWNED` gracefully.** This `BillingResponseCode` means the user bought but has not consumed the product. Re-query purchases via `queryPurchasesAsync`, process the pending purchase, then retry.
- **Listen for purchases outside the launch flow.** Call `queryPurchasesAsync` in `onResume` (or whenever the billing client reconnects) and in `PurchasesUpdatedListener`. Purchases can arrive from promotional codes, pending approval, or a different device without triggering your listener.
- **For subscriptions, model base plans and offers explicitly.** A `ProductDetails.SubscriptionOfferDetails` list carries pricing phases, free trial, and introductory pricing. Present the correct offer token when building `BillingFlowParams`; passing the wrong one silently charges the wrong amount.
- **Obfuscate account identifiers.** Set `obfuscatedAccountId` (and optionally `obfuscatedProfileId`) on `BillingFlowParams.Builder` — Play passes these through to the server notification, enabling you to match purchases to your users without exposing raw IDs.
- **Test with license testers, not real payments.** Add tester Google accounts in the Play Console under Setup > License Testing. License testers can complete the full billing flow without charges, and their test purchases appear in `queryPurchasesAsync` just like real ones.

```kotlin
// Minimal suspend-based billing helper (billing-ktx 7.x)
class BillingManager(context: Context) : PurchasesUpdatedListener {

    private val client = BillingClient.newBuilder(context)
        .setListener(this)
        .enablePendingPurchases(
            PendingPurchasesParams.newBuilder().enableOneTimeProducts().build()
        )
        .build()

    /** Connect (or reconnect) before any operation. */
    suspend fun ensureConnected(): Boolean {
        if (client.isReady) return true
        val result = client.startConnection()   // suspend extension from billing-ktx
        return result.responseCode == BillingResponseCode.OK
    }

    /** Fetch product details for one or more product IDs. */
    suspend fun queryProducts(productIds: List<String>): List<ProductDetails> {
        val params = QueryProductDetailsParams.newBuilder()
            .setProductList(
                productIds.map { id ->
                    QueryProductDetailsParams.Product.newBuilder()
                        .setProductId(id)
                        .setProductType(BillingClient.ProductType.INAPP)
                        .build()
                }
            ).build()
        val (billingResult, details) = client.queryProductDetails(params)
        if (billingResult.responseCode != BillingResponseCode.OK) return emptyList()
        return details ?: emptyList()
    }

    /** Launch the purchase UI from an Activity. Returns immediately; result arrives in onPurchasesUpdated. */
    fun launchPurchaseFlow(activity: Activity, details: ProductDetails) {
        val productDetailsParams = BillingFlowParams.ProductDetailsParams.newBuilder()
            .setProductDetails(details)
            .build()
        val flowParams = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(listOf(productDetailsParams))
            .setObfuscatedAccountId(yourHashedUserId())
            .build()
        client.launchBillingFlow(activity, flowParams)
    }

    /** Acknowledge a non-consumable purchase to prevent auto-refund. */
    suspend fun acknowledge(purchase: Purchase) {
        if (purchase.isAcknowledged) return
        val params = AcknowledgePurchaseParams.newBuilder()
            .setPurchaseToken(purchase.purchaseToken).build()
        client.acknowledgePurchase(params)   // suspend; check responseCode in prod
    }

    override fun onPurchasesUpdated(result: BillingResult, purchases: List<Purchase>?) {
        if (result.responseCode == BillingResponseCode.OK && purchases != null) {
            purchases.forEach { /* verify server-side, then acknowledge/consume */ }
        }
        // handle USER_CANCELED, ITEM_ALREADY_OWNED, etc.
    }
}
```

## Platform notes

- **Minimum SDK** — `billing-ktx` 7.x supports Android 5.0 (API 21) at runtime but requires the Play Store app to be present. Devices without Play Services (AOSP, sideloaded APKs) will never have a working billing client; gate the entire purchase UI on `BillingClient.isReady` and a capability check.
- **Pending purchases** — Android 10+ supports buy-now-pay-later and carrier billing. Always call `enablePendingPurchases(...)` when constructing the client (required since billing library 3.x) and handle `Purchase.PurchaseState.PENDING` — do not grant entitlements for pending state.
- **Subscriptions on Android 12+** — Users can manage subscriptions directly from system settings. Your app must handle subscription status changes (downgrade, pause, cancellation) discovered via `queryPurchasesAsync` rather than assuming a subscription remains active after initial purchase.
- **Play Billing Library 7.x** — The `startConnection` suspend extension replaces the callback-based `BillingClientStateListener` for most flows. Reconnection still requires the listener for asynchronous drop events.
- **Obfuscated IDs are surfaced in RTDN** — Real-Time Developer Notifications delivered to your backend Pub/Sub topic include `obfuscatedExternalAccountId`; use them to link a Play purchase to your server-side user record without extra round-trips.

## Pitfalls

- **Granting entitlements in `onPurchasesUpdated` without server verification** — Client-side purchase tokens can be forged or replayed. Always validate the purchase token against the Play Developer API (`purchases.products.get` or `purchases.subscriptions.get`) on your backend before unlocking paid features.
- **Forgetting to acknowledge** — An unacknowledged purchase is automatically refunded after 3 days and disappears from `queryPurchasesAsync`. Missing acknowledgement is the single most common cause of mysterious purchase reversals.
- **Creating multiple `BillingClient` instances** — Each instance opens a separate service connection to the Play Store. Holding more than one is a resource leak and can cause inconsistent purchase state. Use a singleton scoped to the application.
- **Not querying purchases on app start** — Purchases made while the app was in the background (e.g., from the Play Store app, promotional codes, or family sharing) never trigger `onPurchasesUpdated`. Always call `queryPurchasesAsync` on reconnect and on `Activity.onResume`.
- **Using product IDs as entitlement keys directly** — If you ever rename or replace a product, hard-coded product ID comparisons break silently. Map product IDs to entitlement constants in one place.
- **Ignoring `BillingResponseCode.SERVICE_DISCONNECTED`** — The billing service can disconnect at any time. Wrap operations in a retry/reconnect helper; do not assume `isReady` stays true between calls.
- **Testing with real payment methods** — Charges on real accounts are hard to reverse and create support burden. Always use dedicated license tester accounts for development and QA.
- **Presenting the wrong offer token for subscriptions** — If a user is eligible for an introductory price and you pass the base plan's offer token instead, they are charged the full price immediately. Iterate `subscriptionOfferDetails` and select the token whose `pricingPhases` match the intended offer.

## References

- **Documentation:** [Google Play Billing overview](https://developer.android.com/google/play/billing)
- **Documentation:** [Integrate the Play Billing Library](https://developer.android.com/google/play/billing/integrate)

## See also

For managing in-app entitlements alongside server auth, pair this skill with the networking and dependency-injection skills. For surfacing purchase UI inside Compose screens, see the Compose state and navigation skills. For shipping the app that contains billing to production, see the build-sign-distribute and play-store-release skills.
