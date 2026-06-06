## Example 1: Photo upload with known progress

A user selects 12 photos to upload to a cloud album. The upload screen shows a `LinearProgressIndicator` (determinate) running the full width of the card, with the label "Uploading 4 of 12 photos" beneath it and a Cancel button in the top-right corner of the card.

**Why this works:** The determinate bar gives an honest percentage so the user can decide whether to wait or return later. The label is specific ("4 of 12") rather than generic ("Uploading..."), which is more trustworthy and informative. The Cancel button respects the user's time without requiring them to force-quit.

**Anti-pattern:** Showing an indeterminate `CircularProgressIndicator` over the entire screen for the same upload. This blocks all other app interaction, gives no sense of remaining time, and uses a full-screen overlay for work that only affects the upload card — overstating the gravity of the operation and blocking unrelated interactions.

---

## Example 2: Feed refresh with inline indicator

A social feed pulls new posts when the user pulls to refresh. A `CircularProgressIndicator` (indeterminate) appears in the pull-to-refresh zone just above the first post, visible only during the network request. Once the request resolves, the indicator disappears and new posts animate in at the top of the list. A TalkBack live region on the feed container announces "Feed updated" when complete.

**Why this works:** The circular indicator is scoped to the exact content being refreshed (the feed), not the full screen. Duration is genuinely unknown (network latency varies), so indeterminate is correct. The live region closes the feedback loop for screen-reader users who cannot see the animation.

**Anti-pattern:** Using a `LoadingIndicator` (M3 Expressive) for this same pull-to-refresh. The `LoadingIndicator` carries dramatic visual weight appropriate for app-launch moments; repurposing it for a routine feed refresh makes the app feel as if something exceptional is happening, and repeated exposure to the animation erodes its impact.

---

## Example 3: Multi-step form submission

A checkout flow has four steps: cart review, address, payment, and confirmation. After the user taps "Place Order," a determinate `LinearProgressIndicator` (set to 0.75 — reflecting "step 3 of 4 complete") occupies the top of the confirmation screen while the payment is processed server-side. When server-side processing moves to an unpredictable phase (fraud check), the bar transitions to indeterminate. Once confirmed, the bar disappears and the success state renders.

**Why this works:** The indicator is honest — it accurately represents what the client knows (three steps done). When the client loses the ability to predict duration, it switches to indeterminate rather than stalling at 75%. The transition between modes is smooth and semantically correct, and the user is never left wondering if the app has frozen.

**Anti-pattern:** Hiding all progress feedback and relying on a "Please wait" full-screen overlay modal with no indicator whatsoever — the most common alternative — which forces the user to stare at a static screen with no assurance the operation is running and no ability to cancel.
