---
name: hig-apple-pay-design
description: Design critique and guidance for offering Apple Pay in apps and on the web per Apple's Human Interface Guidelines. Use when reviewing or designing a checkout, cart, product page, or payment-method screen; choosing an Apple Pay button style, caption, or placement; deciding what the payment sheet should collect; or evaluating whether a custom payment form should defer to Apple Pay. Produces UX recommendations on prominence, button correctness, streamlined sheets, and avoiding redundant data entry, not code.
---

## When to use

Use this skill when designing or critiquing any flow where someone pays — a cart, checkout, product detail page, subscription upgrade, in-app purchase of physical goods, or a payment-method picker. Reach for it when choosing an Apple Pay button style, caption, or placement; deciding what the payment sheet should request; or judging whether a hand-built billing form should be replaced or supplemented by Apple Pay. It complements, not replaces, the code skill that wires up PassKit.

## Core guidance

- **Offer Apple Pay prominently and early.** Place the button above the fold on the product, cart, and checkout pages, and in any payment-method picker. Present it as the first option, visually weighted at least as strongly as other methods — a separator line or "express checkout" grouping above manual entry signals the faster path and measurably reduces abandonment.
- **Use the system button — never recreate it.** Adopt the Apple-provided button so the caption ("Buy with Apple Pay", "Pay", "Subscribe", "Continue with Apple Pay", and similar), Apple Pay logo, font, and colors stay official, localized, and accessible. Don't draw your own, screenshot it, animate it, or stretch the logo; do tune only the corner radius and width to match your UI.
- **Pick the caption that matches the action.** Use "Order"/"Buy" for goods, "Subscribe" for recurring plans, "Donate" for nonprofits, "Set Up"/"Continue" when more steps follow. A mismatched caption ("Buy" on a screen that only collects info) erodes trust at the most sensitive moment.
- **Choose button color for contrast, not preference.** Use the dark (black) button on light or white backgrounds, the light/outline variants on dark or busy backgrounds. The goal is a clearly legible button that still reads as the standard Apple Pay control.
- **Let the payment sheet do the work.** Tapping the button should go straight to the sheet — no interstitial screens or account gates first. The sheet already gathers name, billing and shipping address, shipping method, email, and phone, so don't ask people to type those into your own form before reaching it. Request only the fields you genuinely need to fulfill the order.
- **Don't re-collect data Apple Pay returns.** After payment, populate your records from the sheet's contact and shipping details instead of routing the user to a "confirm your address" form. Re-asking for information they just authorized feels broken and invites drop-off.
- **Show real, final amounts.** Summary line items in the sheet should reflect actual prices, taxes, shipping, and any pending/estimated state honestly — use the standard summary item types rather than burying fees, and only present Apple Pay when a real device card can complete the purchase.
- **Use the mark, not the button, for "we accept" messaging.** On marketing surfaces or a list of accepted methods where no action is taken, use the Apple Pay mark; reserve the button for places that actually start a transaction.

## Platform notes

- **iOS, iPadOS:** Prime placement is the cart and checkout; favor express checkout from the product/cart page so shipping and address selection happen entirely in the sheet. The 2025-2026 dynamic payment button can adapt its caption and presentation to context — keep surrounding layout glass-aware so the button sits cleanly within Liquid Glass toolbars and sheets.
- **watchOS:** Screen space is scarce — Apple Pay is often the only sensible checkout. Lead with it, keep line items short, and rely on the sheet rather than any on-watch form entry.
- **macOS:** In apps, the button triggers confirmation via a paired iPhone or Apple Watch / Touch ID. On the web (Safari, and supported third-party browsers), follow the same prominence and button-integrity rules; style only via the supported CSS hooks.
- **All platforms:** Where regional rules require a checkbox or terms acceptance, place it before the button so the tap-to-sheet flow stays uninterrupted.

## Pitfalls

- Hiding Apple Pay below manual card fields or behind an extra "payment options" tap, so the fast path is the hard one to find.
- Building a custom button or restyling the system one beyond corner radius and width, breaking brand compliance and accessibility.
- Forcing account creation, address entry, or login before the sheet appears, when the sheet would have supplied that data.
- Showing the button when the user has no usable card or the item can't actually be purchased that way, producing a dead-end tap.
- Picking a button color that blends into the background, making the most important control hard to see.
- Misusing the button as decorative "we accept Apple Pay" signage where the mark belongs.

## References

- **Human Interface Guidelines:** [Apple Pay](https://developer.apple.com/design/human-interface-guidelines/apple-pay)
- **Human Interface Guidelines:** [Apple Pay — Buttons and marks](https://developer.apple.com/design/human-interface-guidelines/apple-pay/overview/buttons-and-marks/)
- **Human Interface Guidelines:** [Apple Pay — Checkout and payment](https://developer.apple.com/design/human-interface-guidelines/apple-pay/overview/checkout-and-payment/)
- **WWDC:** [What's new in Apple Pay (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/201/)
- **WWDC:** [What's new in Wallet and Apple Pay (WWDC24)](https://developer.apple.com/videos/play/wwdc2024/10108/)
- **Documentation:** [PKPaymentButton](https://developer.apple.com/documentation/passkit/pkpaymentbutton)

## See also

- **passkit-apple-pay** — the code skill that implements the button (PKPaymentButton / PayWithApplePayButton) and drives the payment sheet via PKPaymentAuthorizationController; use it once this critique settles the UX.
- **hig-buttons-design** — for general button hierarchy and how the Apple Pay control should sit among other actions.
- **hig-tap-to-pay-design** — when the app accepts payments on iPhone rather than making them.
- **hig-liquid-glass-foundations** — to keep the button and payment surfaces consistent with the 26-cycle glass material in toolbars and sheets.
