---
name: user-notifications
description: "Use when adding local or remote (push) notifications to an Apple app: requesting authorization, scheduling with calendar/time-interval triggers, building content with categories and actions, registering for APNs, handling foreground and tapped notifications, setting interruption levels or time-sensitive alerts, and writing service/content extensions or communication notifications."
---

## When to use

Reach for the User Notifications framework whenever the app must alert the
person while it is not in the foreground, or display content in the
notification list. This covers locally scheduled reminders, remote pushes
delivered through APNs, custom actions, rich attachments, time-sensitive
alerts, and messaging-style communication notifications. It does not cover
in-app banners you draw yourself or Live Activities (use ActivityKit for
those).

## Core guidance

- Do request authorization with the async `requestAuthorization(options:)`,
  not the completion-handler variant — the latter has crashed under strict
  concurrency. Ask in context, after the person understands the value, not at
  first launch.
- Do set `UNUserNotificationCenter.current().delegate` before the app
  finishes launching so early deliveries route correctly; otherwise taps land
  nowhere.
- Don't hardcode `[.badge, .sound, .alert]` everywhere. Re-check
  `getNotificationSettings()` each session because the person can change
  permissions in Settings at any time.
- Do register categories with `setNotificationCategories(_:)` once at launch,
  and reference them by identifier from local content or the push `category`
  key so action buttons appear.
- Do gate `.timeSensitive` and `.critical` interruption levels behind the
  matching capability/entitlement; misuse triggers App Review rejection. Use
  `.passive` for low-value updates.
- Don't forget the modern foreground presentation options — return
  `.banner`, `.list`, `.sound`, `.badge` from `willPresent` so notifications
  still show while the app is open.
- Do mirror local and push payloads: a `UNNotificationServiceExtension` can
  rewrite remote content only when the payload sets `mutable-content: 1`.

```swift
func userNotificationCenter(
  _ center: UNUserNotificationCenter,
  willPresent notification: UNNotification
) async -> UNNotificationPresentationOptions {
  [.banner, .sound, .list]   // show even while foregrounded
}
```

## Platform notes

- watchOS forwards delivery from a paired iPhone but can deliver
  independently; test on-device. visionOS presents notifications in the
  Shared Space.
- macOS does not call `registerForRemoteNotifications()` on `UIApplication`;
  use `NSApplication` and the App Sandbox push entitlement.
- Communication notifications require donating an `INSendMessageIntent` (or
  call intent) and calling `content.updating(from:)`; the avatar and Focus
  break-through only render after the intent is donated.
- `UNNotificationContentExtension` (UserNotificationsUI) renders a custom
  long-look UI and is iOS/iPadOS only.

## Pitfalls

- Calling `addNotificationRequest` with a `UNTimeIntervalNotificationTrigger`
  whose interval is under 60 seconds while `repeats` is true fails silently.
- Reusing the same request `identifier` replaces the pending notification
  rather than adding a second one — intentional for updates, surprising
  otherwise.
- The device token from `didRegisterForRemoteNotificationsWithDeviceToken`
  can change; always upload the latest and never cache it as permanent.
- A service extension that does not call its content handler before
  `serviceExtensionTimeWillExpire()` ships the original, unmodified payload.
- Adding `.provisional` authorization delivers quietly to the notification
  list only; people never see a permission prompt, so alerts won't appear on
  the Lock Screen until they opt in.

## References

- **Documentation:** [User Notifications](https://developer.apple.com/documentation/usernotifications)
- **Documentation:** [Asking permission to use notifications](https://developer.apple.com/documentation/usernotifications/asking-permission-to-use-notifications)
- **Documentation:** [Scheduling a notification locally from your app](https://developer.apple.com/documentation/usernotifications/scheduling-a-notification-locally-from-your-app)
- **Documentation:** [Implementing communication notifications](https://developer.apple.com/documentation/usernotifications/implementing-communication-notifications)
- **Documentation:** [UNNotificationServiceExtension](https://developer.apple.com/documentation/usernotifications/unnotificationserviceextension)
- **WWDC:** [Send communication and Time Sensitive notifications (WWDC21)](https://developer.apple.com/videos/play/wwdc2021/10091/)
- **Human Interface Guidelines:** [Managing notifications](https://developer.apple.com/design/human-interface-guidelines/managing-notifications)

## See also

For displaying ongoing, glanceable status instead of discrete alerts, see a
live-activities skill. When the push payload drives background work, pair with
a background-tasks skill. For donating the intents that power communication
notifications and Siri suggestions, see an app-intents or SiriKit skill.
