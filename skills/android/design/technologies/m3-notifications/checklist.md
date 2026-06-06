## M3 Notifications Design Review

### Notification justification
- [ ] The event is timely, personally relevant, and actionable for this specific user right now.
- [ ] The notification is not a re-engagement prompt, marketing message, or duplicate of content already visible in-app.
- [ ] The denied-permission state is handled gracefully — the app degrades silently rather than crashing or persisting a nag banner.
- [ ] The `POST_NOTIFICATIONS` permission request is tied to a concrete feature moment, not cold launch.

### Channel architecture
- [ ] There is at least one channel per distinct notification type (transactional vs. promotional, messages vs. activity updates).
- [ ] Every channel has a plain-language name and description as the user will read them in Settings.
- [ ] Channel importance is calibrated correctly: `IMPORTANCE_HIGH` only for genuinely time-sensitive events; `IMPORTANCE_DEFAULT` for standard actionable alerts; `IMPORTANCE_LOW` for silent informational updates.
- [ ] Channel importance has been reviewed as a one-way door: it cannot be raised after first delivery to a device, so the initial choice must be correct.
- [ ] The app provides an in-app notification settings entry that links directly to the channel settings page.

### Content and copy
- [ ] The notification title identifies who or what without requiring the app name (the system shows it automatically).
- [ ] The notification body states the event in plain language; it does not tease the user into opening the app to find out what happened.
- [ ] Copy is sentence-case, uses complete phrasing, and avoids ALL CAPS and excessive punctuation.
- [ ] The most actionable or time-relevant information appears first in the title or body, not buried in trailing text.

### Style selection
- [ ] `MessagingStyle` is used for all human-to-human or human-to-assistant conversations (not generic `BigTextStyle`).
- [ ] `BigTextStyle` is applied when body text exceeds approximately one short sentence.
- [ ] `InboxStyle` is used for digests of short independent items (email subjects, headlines), not for conversations.
- [ ] `MediaStyle` is only used when paired with an active `MediaSession` and transport controls.
- [ ] The chosen style matches the content type — no `BigTextStyle` on chat threads, no `MessagingStyle` on non-conversation content.

### Actions
- [ ] Actions shortcut a real user intent; no action is a duplicate of tapping the notification body (no "Open" or "View" actions).
- [ ] There are at most three actions; fewer is preferred.
- [ ] A destructive action (delete, cancel, decline) appears last and is clearly labeled with the outcome.
- [ ] If a direct-reply action is present, the `BroadcastReceiver` or handler updates or cancels the notification on completion to clear the spinner.

### Grouping
- [ ] Related notifications from the same app share a group key.
- [ ] A summary notification is posted only when two or more individual notifications exist in the group.
- [ ] Summary copy states the aggregate at a glance ("5 new messages from 3 contacts").
- [ ] Notification IDs are stable and content-derived so updates replace the correct existing entry rather than stacking duplicates.

### Re-notification and frequency
- [ ] The app does not re-notify the same event because the user has not responded.
- [ ] There is no escalation logic that increases notification frequency over time until acknowledged.
- [ ] Marketing or promotional notifications are in a clearly labeled, separate channel from transactional notifications.

### Large screen and adaptive behavior
- [ ] The `contentIntent` navigates to an appropriate two-pane or detail destination on wide-screen layouts, not a phone-only single-pane screen.
- [ ] Notification copy is self-sufficient from the title alone for surfaces that show only the title (cover displays, Wear OS short-look).
- [ ] If Android Auto support is desired, `MessagingStyle` with proper `Person` objects is used for messaging notifications.
