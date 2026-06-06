---
name: notifications
description: Covers Android notifications using NotificationCompat — creating channels with appropriate importance levels, requesting the POST_NOTIFICATIONS runtime permission on Android 13+, applying rich styles (BigText, Inbox, Media, Messaging), adding actions and direct-reply, grouping related notifications, and implementing conversation/bubble notifications. Use when building any feature that needs to alert the user outside the foreground, add notification actions or direct reply, group related alerts, or surface chat conversations as bubbles.
---

## When to use

Use this skill whenever a feature must alert the user while the app is in the background, deliver actionable notifications with reply or dismiss buttons, group related alerts under a summary, or surface a messaging thread as a conversation or chat bubble. It applies to both foreground-service notifications and regular user-facing alerts. It does not cover Live Activities or in-app snackbars — those are UI layer concerns.

## Core guidance

**Channels and importance**

- Create every notification channel once, idempotently, at app startup (e.g., in `Application.onCreate`). Calling `createNotificationChannel` on an already-existing channel with identical settings is a no-op; it is safe to call unconditionally.
- Choose importance conservatively. `IMPORTANCE_HIGH` produces a heads-up banner and audible alert — only use it for time-critical events. `IMPORTANCE_DEFAULT` plays a sound; `IMPORTANCE_LOW` is silent. Downgrading importance after first creation requires the user to change it manually in Settings, so get it right the first time.
- Never create channels in a `ViewModel` or composable; channel creation belongs in the app or feature initializer.

**POST_NOTIFICATIONS permission (Android 13+, API 33+)**

- Declare `<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />` in the manifest.
- Gate the `ActivityResultContracts.RequestPermission` call behind a rationale screen that explains why notifications provide value — users who understand the benefit are more likely to grant.
- Check `ContextCompat.checkSelfPermission(context, POST_NOTIFICATIONS)` before posting; on API 32 and below the permission is auto-granted.
- Do not request the permission at first launch; tie the prompt to the action that needs it (e.g., enabling a reminder toggle).

**Building notifications**

- Always use `NotificationCompat.Builder`, not the platform `Notification.Builder`, so the same code path applies from API 16 to the current release.
- Provide both a small icon (monochrome, appears in the status bar) and, for Messaging style, a large circular avatar. The small icon must be a vector or PNG with transparency only — avoid color fills, which Android replaces with white.
- Always set a `contentIntent` (`PendingIntent`) so tapping the notification does something; a notification with no tap action feels broken.
- Use `FLAG_IMMUTABLE` for `PendingIntent` on API 23+; only use `FLAG_MUTABLE` when the system needs to fill in intent extras (e.g., direct reply).

**Styles**

- `BigTextStyle` — long body text that expands in place. Prefer this over truncated one-liners for notifications with more than ~40 chars of body copy.
- `InboxStyle` — a list of short lines (e.g., email subject lines). Do not exceed 6–7 lines; the rest are silently truncated.
- `MessagingStyle` — the correct style for chat and conversation content. It renders sender avatars, timestamps, and threading automatically, and is required for conversation shortcuts and bubbles.
- `MediaStyle` — pairs with a `MediaSession` token to show transport controls (play/pause/skip) on the lock screen and in the expanded notification. Always set `setShowActionsInCompactView` to pick which three actions appear when collapsed.

**Actions and direct reply**

- Use `NotificationCompat.Action` with a `RemoteInput` for inline reply. Set `FLAG_MUTABLE` on the `PendingIntent` because the system writes the typed text into the intent extras before delivering it.
- After handling a direct reply, update or cancel the notification immediately so the progress spinner resolves. Leaving a spinner spinning is a broken UX.
- Limit actions to three per notification; the system truncates extras silently on older devices.

**Grouping**

- Assign the same `setGroup(GROUP_KEY)` string to all related notifications and post a separate summary notification with `setGroupSummary(true)`. The summary is shown on API 23 and below; on API 24+ Android collapses individual notifications automatically but still needs the summary to exist.
- Use a stable, unique `notificationId` per notification (e.g., hash of the message ID) so updates replace the right entry rather than stacking duplicates.

**Conversations and bubbles**

- For chat features, use `MessagingStyle` and attach a `ShortcutInfo` via `setShortcutId`. The shortcut must be published with `ShortcutManager.pushDynamicShortcut` or `ShareShortcutManager` before the notification is posted.
- Opt the notification into the bubble API with `NotificationCompat.BubbleMetadata`; the user must still grant the bubble permission separately — handle the case gracefully where bubbles are disabled.

```kotlin
// Channel created once at app start
fun createMessagesChannel(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val channel = NotificationChannel(
        "messages",
        context.getString(R.string.channel_messages_name),
        NotificationManager.IMPORTANCE_DEFAULT
    ).apply {
        description = context.getString(R.string.channel_messages_description)
    }
    context.getSystemService(NotificationManager::class.java)
        .createNotificationChannel(channel)
}

// Posting a MessagingStyle notification with a direct-reply action
fun postMessageNotification(context: Context, thread: ChatThread) {
    val replyInput = RemoteInput.Builder("reply_text")
        .setLabel(context.getString(R.string.action_reply))
        .build()

    val replyIntent = PendingIntent.getBroadcast(
        context,
        thread.id.hashCode(),
        Intent(context, ReplyReceiver::class.java).putExtra("thread_id", thread.id),
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
    )

    val replyAction = NotificationCompat.Action.Builder(
        R.drawable.ic_reply, context.getString(R.string.action_reply), replyIntent
    ).addRemoteInput(replyInput).build()

    val style = NotificationCompat.MessagingStyle(thread.me)
        .setConversationTitle(thread.title)
    thread.messages.takeLast(6).forEach { style.addMessage(it.text, it.timestamp, it.sender) }

    val notification = NotificationCompat.Builder(context, "messages")
        .setSmallIcon(R.drawable.ic_notification)
        .setStyle(style)
        .addAction(replyAction)
        .setShortcutId(thread.shortcutId)
        .setContentIntent(
            PendingIntent.getActivity(
                context, 0,
                Intent(context, ChatActivity::class.java).putExtra("thread_id", thread.id),
                PendingIntent.FLAG_IMMUTABLE
            )
        )
        .setAutoCancel(true)
        .build()

    NotificationManagerCompat.from(context).notify(thread.id.hashCode(), notification)
}
```

## Platform notes

- Large-screen devices (tablets, foldables) display notification shade identically to phones; no API changes are needed, but ensure `contentIntent` opens the correct split-pane destination rather than always navigating to a detail screen that assumes compact layout.
- On API 26+ (Oreo and above), the `NotificationChannel` importance controls sound/vibration. The `setPriority` call on the builder is only respected on API 25 and below; always set both for backward compat.
- Foreground services on API 34+ (Android 14) require a `foregroundServiceType` in the manifest and must show their notification within a strict time window; check the updated foreground-service documentation separately.
- On API 33+ (Android 13) the `POST_NOTIFICATIONS` permission is required at runtime for all notifications including foreground service notifications. Test the denied state explicitly — the app should not crash and should degrade gracefully.
- Direct boot (device encrypted storage) notifications posted before the user unlocks the device require the `RECEIVE_BOOT_COMPLETED` permission and use `createDeviceProtectedStorageContext`.

## Pitfalls

- Posting to a channel that does not exist silently drops the notification on API 26+. Always create the channel before calling `notify`.
- Using `FLAG_IMMUTABLE` on a direct-reply `PendingIntent` — the system cannot write the typed text back into the intent, so `RemoteInput.getResultsFromIntent` always returns `null`. Use `FLAG_MUTABLE` only for direct-reply intents.
- Reusing the same `notificationId` for unrelated notifications causes one to overwrite the other. Use a stable unique integer derived from the content (e.g., `messageId.hashCode()`).
- Posting a group without a summary notification causes the group to appear as independent items on API 23 and below, and can produce duplicate entries on some OEM launchers.
- Forgetting to call `notify` again (or `cancel`) after handling a direct reply leaves a spinner animation running indefinitely — always update the notification in the reply `BroadcastReceiver`.
- Large bitmaps passed to `setLargeIcon` or style photos that are not downsampled cause `TransactionTooLargeException` when the `NotificationManager` IPC payload exceeds the Binder limit (~1 MB). Downsample bitmaps to ~256×256 px before passing them.
- `MessagingStyle` without a `ShortcutInfo` prevents the notification from being eligible for conversation ranking and the bubble feature on API 30+.

## References

- **Documentation:** [Notifications overview](https://developer.android.com/develop/ui/views/notifications)
- **Documentation:** [Create a notification](https://developer.android.com/develop/ui/views/notifications/build-notification)

## See also

For the POST_NOTIFICATIONS permission flow in a Compose UI, pair with the `compose-state` and `hilt-di` skills to manage permission state and inject the notifier. For foreground-service notifications, consult the `background-tasks` skill. For conversation shortcuts required by `MessagingStyle` bubbles, the `core-spotlight` analog on Android is handled through `ShortcutManagerCompat`. For visual design guidance on notification content and information hierarchy, see the `m3-notifications` design skill.
