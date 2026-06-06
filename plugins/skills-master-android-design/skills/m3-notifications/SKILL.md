---
name: m3-notifications
description: Design critique and recommendations for Android notifications using Material 3 principles. Use when reviewing or designing notification channels, channel importance levels, notification content and copy, rich styles (Messaging, BigText, Media), grouping strategies, or deciding whether and when an app should notify at all. Produces UX judgment grounded in M3 and Android platform conventions, not implementation code.
---

## When to use

Use this skill when evaluating or designing how an Android app notifies its users: the trigger logic, channel architecture and importance levels, notification content hierarchy and copy, rich style selection (Messaging, BigText, InboxStyle, MediaStyle), grouping and summary design, and whether a given event deserves to interrupt at all. Reach for it during a notification design review, when auditing an app that feels noisy or opaque, when writing or critiquing notification copy, or when deciding how to structure channels so users can tune their alerts without disabling everything. This skill delivers design judgment and do/don't recommendations. Hand the build to the `notifications` code skill.

## Core guidance

**Earn every interruption before you send it.**

- **Notify only when the information is timely, personally relevant, and actionable.** A message from a contact, a package on the doorstep, or an overdue reminder earns a notification. A weekly engagement ping, a "You haven't opened the app in 3 days" nudge, or a duplicate of a push already visible in-app does not. Every unwanted notification moves the user one tap closer to blocking your channel permanently.
- **Treat notification permission as a privilege granted at a moment of obvious value.** Request `POST_NOTIFICATIONS` only after demonstrating concrete benefit — inside the flow where the feature makes sense, not at cold launch. A rationale that explains what the user gains dramatically improves grant rates. Design for the denied state with the same care as the granted state.

**Design channels with the user's control in mind.**

- **Create one channel per distinct notification type, not per feature team or API endpoint.** Channels map directly to user-visible settings rows. If all notifications share one channel, the user's only recourse is to block the app entirely. Expose at least: urgent alerts (time-sensitive events), informational updates (status, activity), and — if applicable — marketing or promotional messages. The user can then silence promotions without losing delivery alerts.
- **Choose importance once, conservatively, and correctly.** `IMPORTANCE_HIGH` produces a heads-up banner and sound; reserve it for events that genuinely need immediate attention (an incoming call, a two-factor code expiring in 30 seconds, a severe weather warning). `IMPORTANCE_DEFAULT` plays a sound and appears in the shade — the right choice for most actionable alerts. `IMPORTANCE_LOW` is silent; use it for background status and progress updates. `IMPORTANCE_MIN` is shade-only with no icon in the status bar, appropriate for persistent background-service notes the user rarely checks. Once a channel is delivered to a user's device you cannot raise its importance programmatically — miscalibrating high erodes trust and leads to channel blocks.
- **Name and describe each channel in plain language.** Channel names and descriptions appear word-for-word in Settings. Write them as the user would read them ("Messages from contacts", "Order and delivery updates"), not as internal identifiers ("MSG_CH_01").

**Make the content immediately useful without opening the app.**

- **Lead with the most actionable or identifying information.** The title should identify who or what; the body should state the event. "Priya Kumar: Can we move to 3pm?" is immediately clear. "New message" and then "You have a new message from a contact" are redundant. If the user can act on the notification without tapping through, the design is succeeding.
- **Match the notification style to the content type.** `MessagingStyle` is the correct choice for any human-to-human or human-to-assistant conversation: it renders sender avatars, timestamps, and threading natively, and qualifies for Android's conversation ranking. `BigTextStyle` is right for any notification whose body exceeds a short phrase — press releases, email previews, long reminders. `InboxStyle` works for a digest of short independent items (email subjects, headlines). `MediaStyle` belongs exclusively with a `MediaSession` and transport controls. Choosing the wrong style for the content type is a common UX regression disguised as a technical choice.
- **Keep message copy sentence-case, complete, and free of the app name.** Android places the app name and icon automatically. Prefixing the message body with the app name wastes the most visible characters. Write in sentence case; avoid ALL CAPS and excessive punctuation.

**Actions should shortcut intent, not pad the notification.**

- **Include actions only when they genuinely save the user a step.** "Reply" and "Mark as read" are valuable on a message notification because they resolve the event without opening the app. "Open", "View", or "Learn more" add no value beyond tapping the notification body itself.
- **Limit to two or three actions; fewer is usually better.** The system truncates extra actions silently on some surfaces. Prioritize: the most common response first, the destructive or irreversible action last (if at all), and never more than one destructive action per notification.
- **After a direct-reply action completes, update or dismiss the notification immediately.** A spinner that keeps spinning after the user sends an inline reply signals a broken system. The `BroadcastReceiver` or service handling the reply must update the notification — replacing it with the sent state or cancelling it — as its final step.

**Group related notifications rather than flooding the shade.**

- **Assign a group key to all notifications that belong to the same logical stream.** Multiple unread messages from the same app should collapse into a summary entry ("5 new messages from 3 contacts") rather than stacking as individual rows. The summary notification is the user-facing face of the group; its text should communicate the aggregate at a glance.
- **Do not post a group summary until there are at least two individual notifications in the group.** A group of one with a summary below it is visual noise. Post the summary only after a second notification arrives.
- **Use stable, content-derived notification IDs.** Updating a notification (for example, adding a new message to an existing `MessagingStyle` notification) should replace the previous entry, not stack alongside it. Derive the ID from a stable content key — a conversation ID, an order number — so updates always hit the right slot.

**Respect the user's attention at system level.**

- **Do not re-notify the same event because the user has not responded.** People read on their own schedule. Escalating frequency until acknowledged is the fastest path to being blocked. If time-sensitivity genuinely requires re-alerting, make that explicit in the channel description at setup time so the user consents knowingly.
- **Do not send notifications whose sole purpose is re-engagement.** "You haven't used PetTracker in 5 days — your pet misses you!" is not a notification; it is an advertisement served via a trusted channel. Google Play policy prohibits this pattern, and it is one of the primary reasons users block notification channels.
- **Provide a meaningful in-app notification settings entry.** Users expect to find notification preferences inside the app as well as in system Settings. Link directly to the channel settings page with `Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)`. Giving users granular control inside the app reduces outright channel blocks.

## Platform notes

- **Compact phones:** The primary design target. Heads-up banners appear at the top of the screen; test that the content title and first body line are self-sufficient at a glance since that is all the collapsed banner shows.
- **Large screens and foldables:** The notification shade behaves identically to phones; the design considerations are the same. However, verify that `contentIntent` navigates to an appropriate two-pane destination on wide-screen layouts rather than forcing a phone-only single-pane flow. A notification opening a collapsed detail screen on a tablet is a common regression.
- **Foldables in folded state:** Treat as compact phone. Some foldables surface notifications on the cover display; ensure the title alone communicates the event without the body, since cover-display rendering is typically title-only.
- **Wear OS companion notifications:** If the app targets Wear OS or mirrors phone notifications to a paired watch, keep notification copy concise — Wear surfaces the short body in a single glance. `MessagingStyle` content renders well on Wear; custom big-picture bitmaps do not.
- **Android Auto:** Messaging notifications using `MessagingStyle` with proper `Person` objects surface natively in Android Auto's car-safe UI. Other notification types are muted or suppressed in the car context. If in-car messaging support matters, structure the notification correctly rather than retrofitting later.

## Pitfalls

- **Inflating importance to guarantee visibility.** Using `IMPORTANCE_HIGH` for every notification to ensure it appears as a heads-up banner destroys signal. When everything is urgent, nothing is urgent — and users block the channel. Calibrate by asking: would the user be upset if this arrived silently? If the honest answer is no, lower the importance.
- **One channel for all notification types.** A single "Notifications" channel gives users no surgical control. They either accept all notifications or block all. This drives higher block rates and lower permission grant rates on reinstall.
- **Notification copy that requires opening the app to understand.** "You have a new update" or "Check your account" are not notification bodies; they are teasers. Teasers erode trust and train users to ignore the shade.
- **Updating a notification's importance after first delivery.** The system locks channel importance after a user receives the first notification on a device. Attempting to re-create the channel with a higher importance has no effect. There is no design fix after the fact — importance must be correct at channel creation.
- **Posting group summaries before there are two individual notifications.** This creates a visual double-entry — the individual notification and a summary row of one — and looks like a bug.
- **Not updating the notification after direct reply is handled.** The inline-reply input spinner continues to animate indefinitely if the notification is not updated. To users, this reads as the app being broken or the reply not sending.
- **Providing a "View" or "Open" action that duplicates tapping the notification body.** Wasted action slot, and it confuses users who wonder if "View" does something different than tapping the banner.
- **Using notifications as a marketing channel without the user's explicit opt-in to that channel.** Marketing notifications should live in a distinct, clearly-named channel ("Offers and promotions") so users who want transactional alerts can keep them while opting out of promotional ones. Mixing the two into a single channel is a common cause of complete notification blocks.
- **Forgetting to handle the permission-denied state gracefully.** On Android 13+ (`POST_NOTIFICATIONS`), if the user denies permission the app should degrade silently — no crash, no persistent in-app banner demanding the user reverse the decision. Surface a gentle in-context prompt the next time the relevant feature is used, with a direct link to Settings.

## References

- **Documentation:** [Notifications overview](https://developer.android.com/develop/ui/views/notifications)
- **Documentation:** [Android mobile design](https://developer.android.com/design/ui/mobile)
- **Material 3 Guidelines:** [Notifications — M3](https://m3.material.io/foundations/content-design/notifications)

## See also

- The `notifications` code skill implements `NotificationCompat.Builder`, channel creation, `MessagingStyle`, direct reply, grouping, and the `POST_NOTIFICATIONS` runtime permission in Kotlin.
- The `m3-snackbar` design skill covers in-app transient feedback — evaluate snackbars before reaching for a notification when the user is already in the foreground.
- The `m3-dialogs` design skill applies when an event requires an explicit user decision before the app can proceed, rather than an asynchronous background alert.
- The `m3-writing` design skill provides broader copywriting principles for clarity, sentence case, and plain-language guidance that applies directly to notification titles and body text.
- The `m3-accessibility` foundations skill addresses contrast, minimum touch targets for notification actions, and TalkBack considerations relevant to the notification surface.
