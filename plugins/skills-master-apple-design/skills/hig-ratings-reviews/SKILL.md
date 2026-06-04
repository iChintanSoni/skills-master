---
name: hig-ratings-reviews
description: Design-critique guidance for Apple Human Interface Guidelines ratings and reviews, covering when to request a rating at a natural moment of satisfaction, using the system in-app prompt within its limited budget, never blocking the app or bribing for reviews, and responding to feedback gracefully. Use when designing or reviewing a rating-request flow, deciding the trigger moment for the system prompt, auditing whether an app gates content behind a review, evaluating a custom rating UI, or planning how to respond to App Store reviews on iOS, iPadOS, macOS, or tvOS. Produces UX recommendations, not code.
---

# HIG ratings and reviews

## When to use

Reach for this when designing or critiquing how an app asks for a rating or review: choosing the moment to trigger the system prompt, judging whether a flow is nagging or coercive, evaluating a custom pre-prompt or rating UI, or planning a strategy for responding to reviews in App Store Connect. It frames the rating request as a respectful, low-friction touchpoint that protects the user's flow and the integrity of the App Store.

## Core guidance

- Ask only at a genuine moment of satisfaction — after a user completes a meaningful action, finishes a level or task, or reaches a milestone — when they are most likely to feel positive and are *not* mid-flow. Never interrupt active input, navigation, onboarding, or a task in progress.
- Use the standard system request rather than a custom rating dialog. It lets users rate and write a review without leaving the app, respects the user's global "ask to rate" setting, and is governed by Apple's display budget. Treat showing the prompt as a request, not a guarantee — the system decides whether it actually appears.
- Budget the request deliberately. The system shows the prompt at most three times per user in a 365-day period, and you should never ask about the same app version more than once. Spend that scarce budget on your highest-confidence happy moments, not on a timer or app launch.
- Never block or gate functionality, content, or progress behind rating or reviewing — that violates the App Review Guidelines. Don't bribe, reward, incentivize, or pressure users for a review, and don't try to filter out unhappy users or manipulate ratings; doing so risks removal from the Developer Program.
- Don't add a custom "Are you enjoying the app?" pre-prompt that screens for positive sentiment before showing the system request. It feels manipulative, double-prompts the user, and conflicts with the spirit of the standard request. If you want a feedback path for unhappy users, make support contact easy to find instead.
- Provide an easy, visible way to contact support inside the app and on the product page, so users who hit trouble can reach you directly instead of venting in a one-star review.
- Treat responding to reviews as part of the experience: reply concisely and respectfully, prioritize low ratings and reports of technical issues, and acknowledge fixes — replies after a major release reopen a dialogue with dissatisfied users.

## Platform notes

- iOS and iPadOS: The system in-app prompt is the primary pattern; trigger it from a clear success moment and let the OS govern frequency. Never present it during a sheet, alert, or multi-step flow the user is still completing.
- macOS: The same in-app request applies; favor a calm, non-modal moment and avoid stealing focus from the user's current document or window. Review responses appear on the Mac App Store as on iOS.
- tvOS: Requests surface in the focus-driven environment, so choose a moment when the user has paused or finished content rather than mid-playback or mid-navigation; keep the interruption minimal.
- Across platforms, your written response to a review is public on the product page and the reviewer is notified, so write for both that customer and every future shopper reading it.

## Pitfalls

- Prompting on first launch, on a timer, or before the user has done anything worth rating — the request lands before any satisfaction exists.
- Re-prompting the same person repeatedly or asking again on the same app version, burning the limited request budget and annoying users.
- Gating a feature, level, or content behind "rate us first," or rewarding a review — both are coercive and against the rules.
- Sentiment-screening pre-prompts that route only happy users to the App Store and unhappy users to a private form, skewing your rating.
- Using a fully custom rating dialog that ignores the user's system setting and can't actually post a review in place.
- Letting negative reviews sit unanswered, or replying with generic, defensive, or marketing-laden boilerplate instead of a specific, respectful response.

## References

- **Human Interface Guidelines:** [Ratings and reviews](https://developer.apple.com/design/human-interface-guidelines/ratings-and-reviews)
- **Documentation:** [Ratings, reviews, and responses (App Store)](https://developer.apple.com/app-store/ratings-and-reviews/)
- **Documentation:** [Requesting App Store reviews (StoreKit)](https://developer.apple.com/documentation/storekit/requesting-app-store-reviews)
- **Documentation:** [Respond to reviews (App Store Connect Help)](https://developer.apple.com/help/app-store-connect/monitor-ratings-and-reviews/respond-to-reviews/)
- **Documentation:** [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

## See also

For implementing the request itself — the StoreKit `requestReview` environment action in SwiftUI or `SKStoreReviewController` in UIKit, plus deep links to the write-review page — see the `storekit` code skill. For the timing and presentation of any modal or sheet you wrap around feedback, see `hig-sheets`. For onboarding moments where a premature prompt would intrude, coordinate with the relevant onboarding and patterns guidance.
