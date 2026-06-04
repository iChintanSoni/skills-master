---
name: passkit-apple-pay
description: "Use when integrating Apple Pay checkout or Wallet passes in an Apple app: configuring the merchant ID and in-app-payments entitlement, building a PKPaymentRequest, presenting PKPaymentAuthorizationController or the SwiftUI PayWithApplePayButton, handling authorization callbacks and payment tokens, and adding PKPass objects to Wallet."
globs:
  - "**/*.swift"
tags: [apple-pay, passkit, wallet, payments, swiftui]
x-skills-master:
  domain: apple
  class: code
  category: app-services
  platforms: [ios, ipados, macos, watchos]
  requires:
    ios: "17"
    swift: "6.0"
  pairs_with: []
  sources:
    - https://developer.apple.com/documentation/passkit/offering-apple-pay-in-your-app
    - https://developer.apple.com/documentation/passkit/pkpaymentauthorizationcontroller
    - https://developer.apple.com/documentation/passkit/paywithapplepaybutton
    - https://developer.apple.com/documentation/passkit/pkpasslibrary/1617093-addpasses
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for this skill when your app needs to collect a payment with Apple Pay
for physical goods, services, donations, or subscriptions, or when you must let
people add a signed pass (loyalty card, boarding pass, ticket, coupon) to
Wallet. It covers the merchant configuration, the in-app payment flow, and the
add-to-Wallet flow. It is not for App Store digital content — that requires
StoreKit and in-app purchase instead.

## Core guidance

- **Register a merchant ID and enable the entitlement.** Create a merchant
  identifier on the developer portal, add the Apple Pay capability in Xcode (it
  writes the `com.apple.developer.in-app-payments` entitlement), and list every
  merchant ID you use. The `merchantIdentifier` on the request must match one in
  the entitlement or presentation fails silently.
- **Gate the UI on capability, not assumptions.** Check
  `PKPaymentAuthorizationController.canMakePayments()` before showing a button,
  and the network-aware overload before claiming a card type is supported. Hide
  the button rather than presenting a sheet that cannot succeed.
- **Build the request completely.** Set `merchantCapabilities`, `countryCode`,
  `currencyCode`, `supportedNetworks`, and a `paymentSummaryItems` array whose
  final item is the grand total. Use a `.pending` total only for amounts you
  cannot yet compute (for example, a metered ride).
- **Prefer `PayWithApplePayButton` in SwiftUI.** It renders the approved button
  and drives the controller for you; respond through `onPaymentAuthorizationChange`
  and supply a `fallback` view for unsupported contexts. Drop to
  `PKPaymentAuthorizationController` only when you need fine-grained delegate control.
- **Treat the token as opaque and finish promptly.** Forward
  `payment.token.paymentData` to your processor, then call the completion handler
  with `.success` or `.failure` so the sheet dismisses. Never inspect or persist
  raw card data; it is not there to read.
- **Don't let the controller deallocate mid-flow.** Hold a strong reference for
  the lifetime of the sheet, or delegate callbacks stop arriving and the UI hangs.
- **For Wallet, verify support then present.** Confirm with
  `PKAddPassesViewController.canAddPasses()`, build `PKPass` from signed `.pkpass`
  data, and let the user approve; add many at once via `PKPassLibrary.addPasses(_:)`.

```swift
let controller = PKPaymentAuthorizationController(paymentRequest: request)
controller.delegate = self            // keep a strong reference to `controller`
guard await controller.present() else {
    return                            // capability or configuration problem
}
// In paymentAuthorizationController(_:didAuthorizePayment:handler:):
let result = await processor.charge(payment.token.paymentData)
return PKPaymentAuthorizationResult(status: result ? .success : .failure,
                                    errors: nil)
```

## Platform notes

- **iOS / iPadOS:** Full in-app and Wallet support; the canonical surface for
  the payment sheet and add-to-Wallet flow.
- **watchOS:** Payments are supported, but the watch cannot present add-to-Wallet
  UI — provision passes from the paired iPhone.
- **macOS:** Apple Pay works for apps and on the web; the sheet authorizes on a
  Touch ID Mac or by handing off to a nearby iPhone or Apple Watch.
- **visionOS:** Apple Pay is available; confirm capability at runtime as you do
  elsewhere rather than assuming a fixed network list.
- **Entitlement is mandatory:** Without the in-app-payments entitlement and a
  matching merchant ID, `canMakePayments()` can pass yet presentation will fail.
  Wallet passes additionally need correctly signed `.pkpass` packages.

## Pitfalls

- Mismatched or missing `merchantIdentifier` versus the entitlement — the most
  common cause of a sheet that never appears.
- Forgetting that the last `paymentSummaryItems` entry is the total shown to the
  user; an out-of-order array displays a wrong grand total.
- Letting the controller (or its owner) go out of scope, which silently drops
  authorization callbacks.
- Calling the authorization completion handler late or not at all, leaving the
  sheet spinning until it times out.
- Assuming `canMakePayments()` implies a usable card; use the
  network-aware check before relying on a specific scheme.
- Shipping a custom-drawn pay button — Apple requires the system button styles
  for legitimacy and approval.

## References

- **Documentation:** [Offering Apple Pay in your app](https://developer.apple.com/documentation/passkit/offering-apple-pay-in-your-app)
- **Documentation:** [PKPaymentAuthorizationController](https://developer.apple.com/documentation/passkit/pkpaymentauthorizationcontroller)
- **Documentation:** [PayWithApplePayButton](https://developer.apple.com/documentation/passkit/paywithapplepaybutton)
- **Documentation:** [PKPassLibrary.addPasses(_:withCompletionHandler:)](https://developer.apple.com/documentation/passkit/pkpasslibrary/1617093-addpasses)
- **WWDC:** [What's new in Wallet and Apple Pay (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10114/)
- **WWDC:** [What's new in Wallet and Apple Pay (WWDC21)](https://developer.apple.com/videos/play/wwdc2021/10092/)
- **Human Interface Guidelines:** [Apple Pay](https://developer.apple.com/design/human-interface-guidelines/apple-pay)

## See also

For the visual and interaction rules behind the pay button, mark placement, and
sheet content, pair this with the hig-apple-pay-design skill. When the payment
is for digital content delivered inside the app, use the StoreKit in-app purchase
skill instead of Apple Pay.
