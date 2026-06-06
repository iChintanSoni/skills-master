## Scenario 1: Messaging app with collapsing group notifications

A messaging app posts one notification per incoming message. A user receives six messages from three different contacts in quick succession, resulting in six separate entries stacked in the notification shade.

**Why this is wrong.** Six independent notification rows overwhelm the shade, push other apps' notifications off-screen, and force the user to dismiss six entries individually. The failure is a grouping design decision, not a code bug.

**Recommended design.** Use `MessagingStyle` and update a single per-conversation notification each time a new message arrives, appending messages with `addMessage`. When messages arrive from multiple conversations simultaneously, assign a shared group key (for example, the app's package-scoped "messages" group) and post a summary notification stating "6 new messages from 3 contacts." Individual conversation notifications collapse under the summary in the shade. The user can expand the group to read each thread or tap a specific conversation to open it directly. Each conversation notification includes a direct-reply action so the user can respond without leaving the shade.

The channel for direct messages should use `IMPORTANCE_DEFAULT` — sound on arrival, no heads-up banner — because messages from contacts are important but not urgent enough to overlay whatever the user is currently doing. A separate channel for calls or audio messages can use `IMPORTANCE_HIGH` where the real-time nature justifies a banner.

**Anti-pattern.** Posting a new notification ID per message with no group key and no summary. After five messages, the shade is a wall of identical-looking rows, each with the same sender avatar and similar copy, and the user must tap each one to clear them.

---

## Scenario 2: E-commerce app mixing order updates and promotional offers

A shopping app uses a single "Notifications" channel for both transactional events (order shipped, delivery arriving today, refund processed) and marketing messages (flash sale ending soon, new arrivals in your size, "We miss you — here's 10% off").

**Why this is wrong.** Transactional events are high-value and expected; users want them. Promotional messages are interruptive by nature; users vary widely in tolerance. Mixing them in one channel gives the user no surgical control. If the promotions become annoying, the only option is to block the entire channel — including the delivery notification the user actually wants. This is the primary driver of notification channel blocks in commerce apps.

**Recommended design.** Create two channels at minimum. An "Order updates" channel at `IMPORTANCE_DEFAULT` covers order confirmation, shipping, delivery, and refund events — copy that reads "Your order #4821 shipped — arrives Monday" with a "Track order" action. A separate "Offers and promotions" channel at `IMPORTANCE_LOW` (silent, shade-only) covers sales and re-engagement messages. Name the channels in plain language exactly as they appear in Settings. During onboarding or at first purchase, explain the two channels and their purpose; do not auto-subscribe users to promotional notifications without a clear opt-in moment.

The "Order updates" channel should use `BigTextStyle` when the body exceeds one line (for example, a delivery confirmation listing items), and a bare builder with title and body for shorter events (order confirmed, refund processed).

**Anti-pattern.** Adding a third "Personalized recommendations" channel but routing promotions through "Order updates" anyway because the team knows users are less likely to block a channel named after order status. This is deceptive channel labeling and violates Google Play policy.

---

## Scenario 3: Fitness app notifying workout completion with a stale spinner

A fitness tracking app posts a notification when a background workout-analysis job finishes: "Your run analysis is ready — view your pace breakdown." The notification includes a "Reply with a note" inline action that lets the user annotate the workout. After the user sends a note via direct reply, the notification continues to display the loading spinner indefinitely. The user tries tapping the notification again — the app opens to the dashboard, not the workout detail.

**Why both behaviors are wrong.** The persistent spinner signals a broken reply — the user cannot tell whether the note was saved. The generic `contentIntent` opening the dashboard instead of the workout detail ignores the context the notification established. Both failures erode trust in the notification surface and train the user to not bother with inline actions.

**Recommended design.** After the `BroadcastReceiver` or `Service` handling the direct reply saves the note, it must immediately update the notification. The updated notification should remove the reply action, display "Note saved" as new `MessagingStyle` message text (or update the `BigTextStyle` body to include the annotation), and either auto-cancel after two seconds or present a "View workout" action. The `contentIntent` should carry the workout ID as an extra and navigate directly to the workout detail screen — not the home dashboard.

The channel for workout analysis results belongs at `IMPORTANCE_DEFAULT`. The job is not time-sensitive; a sound on completion is appropriate, but a heads-up banner is not. If the analysis takes more than a few seconds, consider a silent `IMPORTANCE_LOW` progress notification during the job (updated with `setProgress`) that upgrades to `IMPORTANCE_DEFAULT` only on completion, so the user gets one alert rather than a mid-job banner and a completion banner.

**Anti-pattern.** Cancelling the notification entirely after the direct reply is handled, with no visual confirmation that the note was saved. To the user, the disappearance of the notification without any confirmation looks like the reply failed or was silently dropped.
