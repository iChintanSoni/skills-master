---
name: hig-notifications
description: "Design-review guidance for app notifications on Apple platforms per the Human Interface Guidelines. Use when designing, auditing, or critiquing push/local notifications, choosing interruption levels (passive, active, time-sensitive, critical), writing notification copy, grouping or threading alerts, adding notification actions, or deciding how alerts behave under Focus and user settings. Produces UX critique and recommendations grounded in the HIG, not code. Triggers: notification design review, alert copy, interruption level choice, time-sensitive vs passive, over-notifying, notification fatigue, Focus and notification settings."
---

# hig-notifications

## When to use

Use this skill to critique or design how an app notifies people: the trigger,
the interruption level, the copy, the actions, grouping, and how alerts behave
under Focus. Reach for it during a notification design review, when deciding
whether something deserves to interrupt, when an app feels noisy, or when
writing or auditing notification copy. This skill produces design judgment and
recommendations, not implementation.

## Core guidance

- **Earn every interruption.** Send notifications only when the information is
  timely, relevant, and high-value to this person right now. If a person would
  not miss it, it should not interrupt. Notifications are a privilege people
  grant and can revoke at any time.
- **Match the interruption level to real urgency.** Use *passive* for
  ambient, no-rush updates (a recommendation, a finished background task);
  *active* (the default) for standard alerts; *time-sensitive* only for things
  needing prompt attention that justify breaking through Focus and scheduled
  summaries (security codes, package out for delivery, ride arriving);
  *critical* only for genuine safety alerts under an approved entitlement.
  Inflating urgency erodes trust and gets notifications muted.
- **Don't over-notify or duplicate.** Never send multiple notifications for the
  same event because the person hasn't responded yet — people attend on their
  own schedule. Batch related updates, and prefer one clear notification over a
  stream that floods Notification Center and pushes people toward turning you
  off entirely.
- **Write the whole message, in plain language.** Use complete sentences,
  sentence case, and proper punctuation; lead with the most useful information
  so it reads at a glance. Don't truncate — the system does that if needed. Omit
  your app name and icon; the system shows them automatically.
- **Group so related alerts stay legible.** Thread related notifications (by
  conversation, topic, or activity) so they collapse cleanly in Notification
  Center and the summary rather than appearing as a scattered pile.
- **Make actions purposeful, not just taps.** Offer a few clear, beneficial
  actions in the expanded view with short, title-case labels that state the
  outcome; avoid destructive actions, and if one is unavoidable give enough
  context to prevent regret (it appears in red).
- **Respect Focus, summaries, and settings as the person's choice, not a bug.**
  Most notifications should yield to Focus and scheduled delivery. Don't design
  around these controls or treat being silenced as a failure to escalate.
  Provide meaningful notification categories so people can tune what they
  receive without disabling everything.
- **Use sound and badges to supplement, never to carry meaning.** People can
  disable both, so don't hide essential information in a badge or rely on a
  sound to convey content. Keep badge counts accurate and clear them promptly
  once the person has seen the item.

## Platform notes

- **iOS / iPadOS:** The richest surface — banners, grouped threads, the
  scheduled summary, and Focus all apply. Communication notifications (messages,
  calls) get prominent avatars; reserve that treatment for genuine
  person-to-person contact.
- **watchOS:** Notifications mirror from iPhone and surface as short-look then
  long-look. Front-load the essential information; design for a glance and a
  raised wrist, not reading.
- **macOS:** Alerts appear as banners (auto-dismiss) or alerts (persist until
  dismissed); choose persistence by importance and keep actions minimal.
- **visionOS:** Notifications appear within the Shared Space and should feel
  unobtrusive in a person's surroundings; avoid pulling focus from an immersive
  experience unless truly time-sensitive.
- **All platforms:** Interruption levels, Focus behavior, and the no-duplicate
  rule are consistent. Tailor presentation density to the device, not the
  underlying judgment about whether to interrupt.

## Pitfalls

- Marketing or re-engagement pings disguised as time-sensitive — the fastest
  route to being muted or reported.
- Repeating the same alert until acknowledged.
- Cryptic copy ("New activity"), or stuffing the app name into the message.
- Treating Focus or the scheduled summary as an obstacle to bypass.
- Relying on a badge count or a custom sound to convey something the person
  must not miss.
- Overloading a notification with too many actions instead of a clear few.

## References

- **Human Interface Guidelines:** [Notifications](https://developer.apple.com/design/human-interface-guidelines/notifications)
- **Human Interface Guidelines:** [Managing notifications](https://developer.apple.com/design/human-interface-guidelines/managing-notifications)
- **WWDC:** [Designing Notifications (WWDC18)](https://developer.apple.com/videos/play/wwdc2018/806/)
- **WWDC:** [Send communication and Time Sensitive notifications (WWDC21)](https://developer.apple.com/videos/play/wwdc2021/10091/)
- **WWDC:** [Meet Focus filters (WWDC22)](https://developer.apple.com/videos/play/wwdc2022/10121/)
- **Documentation:** [UNNotificationInterruptionLevel](https://developer.apple.com/documentation/usernotifications/unnotificationinterruptionlevel)

## See also

- The User Notifications code skill that implements scheduling, interruption
  levels, categories, and notification actions in UNUserNotificationCenter.
- A Focus and Live Activities skill for designing glanceable, ongoing updates
  that complement (rather than spam) one-shot notifications.
- An app-onboarding or permissions design skill for requesting notification
  authorization in context, after the value is clear.
