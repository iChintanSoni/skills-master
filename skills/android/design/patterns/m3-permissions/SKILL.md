---
name: m3-permissions
description: "Design critique and recommendations for Android runtime permission UX following Material 3 principles: just-in-time requests tied to user actions, pre-permission rationale dialogs, graceful feature degradation when denied, handling permanent denial with a Settings redirect, and minimizing the permission surface of a feature. Use when reviewing or designing any permission request flow in an Android app and you need M3-grounded design judgment rather than implementation code."
tags: [m3, design, permissions, patterns, privacy, android]
x-skills-master:
  domain: android
  class: design
  category: patterns
  platforms: ["android", "large-screen"]
  pairs_with: [runtime-permissions]
  sources:
    - https://m3.material.io/foundations/overview
    - https://developer.android.com/guide/topics/permissions/overview
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for this skill when critiquing or designing any moment in an Android app where a dangerous runtime permission must be requested — camera, microphone, location, contacts, Bluetooth, media library access, or notification delivery. Use it to judge whether the timing of the request is defensible, whether the rationale UI earns the user's trust before the system dialog appears, how the app should degrade when access is denied, and how to handle the permanent-denial state without frustrating the user.

This is a design-judgment skill. It names relevant Jetpack Compose Material 3 composables — `AlertDialog`, `Snackbar`, modal bottom sheets via `ModalBottomSheet` — in prose and defers all implementation detail to the runtime-permissions code skill.

## Core guidance

### Request permissions just in time, never on launch

- **Tie every permission request to a concrete user action.** A permission prompt is justified when the user has just tapped something that genuinely cannot proceed without access — the camera shutter button, the "Find friends nearby" action, the microphone icon inside a voice note composer. Asking for camera access the moment the app opens, before the user has expressed intent, signals that the app does not trust the user to understand why it needs access. The system dialog carries no inherent explanation of purpose; the app must supply that context through timing.
- **One permission per triggering action.** If a feature genuinely needs camera and microphone together (a video call), requesting both at once is acceptable. Bundling unrelated permissions — requesting contacts and location when the user tapped "Take a photo" — reads as overreach and increases denial rates.
- **Defer until the feature is about to be used, not when it might be used someday.** Speculative permission requests ("we may need this later") are always wrong from a user-trust perspective and will frequently be denied.

### Show a pre-permission rationale before the system dialog

- **Provide in-app rationale before launching the system prompt when the reason is not self-evident.** The Android system dialog names the permission category but cannot explain why your specific feature needs it. A brief rationale — delivered as an `AlertDialog`, an in-context explanatory card, or a modal bottom sheet — bridges that gap. It should answer two questions: what feature this enables, and what the user can still do without it.
- **Keep rationale concise and specific.** One or two sentences that describe the direct benefit ("Allowing microphone access lets you record voice memos and attach them to tasks") outperform a legal-sounding paragraph. Avoid vague justifications like "for a better experience."
- **Make rationale skippable.** The user should always be able to decline the rationale and never reach the system prompt. The rational UI is an explanation, not a gate. A clear "Not now" or "Skip" action must be present and given equal visual prominence to the action that proceeds.
- **Do not repeat rationale on every trigger.** After the user has denied once and seen rationale once, showing the same rationale a second time trains reflexive dismissal. Track the request state and adapt the UI accordingly.
- **Use a non-blocking rationale surface when appropriate.** For medium-stakes permissions (notification delivery, approximate location), a Snackbar with an action ("Enable notifications") or a dismissible inline banner is often less disruptive than a modal dialog while still conveying purpose. Reserve modal rationale dialogs for high-stakes permissions (microphone, camera, precise location) where the feature genuinely cannot function without access.

### Design for graceful degradation when denied

- **Define a minimum viable experience before requesting any permission.** Every feature guarded by a permission should have a clearly designed fallback state. A map feature can offer a manual location search when precise location is denied. A contacts-backed sharing sheet can show a plain address field. Designing degradation first ensures the app remains useful to users who decline.
- **Represent the degraded state honestly and without punishment.** When a feature is unavailable due to a denied permission, communicate that clearly with a neutral explanatory label ("Location access is off — enter your address manually") rather than a broken UI, an empty state with no explanation, or worse, hiding the feature entirely without explanation. Do not guilt-trip the user for declining.
- **Never disable unrelated features.** A permission denial for camera access should not affect the notes tab. Scope degradation precisely to the features that depend on the permission.
- **Offer partial functionality where the platform supports it.** Android allows approximate location when precise is denied, selected-photos access when full media library is denied, and one-time grants for any permission. Design UI states for these partial grants rather than treating them as binary. A map that works with approximate location but surfaces an upgrade prompt at the right moment is far better than one that refuses to function at all.

### Handle permanent denial cleanly

- **Recognize when the system dialog will no longer appear.** After a user ticks "Don't ask again" (or after two denials on Android 11 and above), `shouldShowRequestPermissionRationale` returns false and launching the permission request silently does nothing. Launching the request anyway is a UX failure — the app appears broken.
- **Offer a Settings redirect, never a repeated system dialog.** When permanent denial is detected, surface a clear explanation of the situation and a single action that opens the app's system settings page directly. "Camera access is permanently turned off. Enable it in Settings to use the scanner." The Settings action should open `ACTION_APPLICATION_DETAILS_SETTINGS` deep-linked to your package — the user should land exactly where the toggle lives.
- **Present the Settings redirect in a modal dialog, not a Snackbar.** This is the one moment where a blocking dialog is justified: the user needs to leave the app to take action, and they should understand that before being redirected. The dialog should explain what was denied and what enabling it will unlock, and offer a clear cancel path so users who genuinely want the feature disabled are not harassed.
- **Do not show the Settings redirect repeatedly.** Once the user has dismissed it, respect their choice. Surface it again only if the user explicitly triggers the feature again, not on every app launch. Storing the dismissed state in a ViewModel or DataStore prevents repeated badgering.

### Minimize what you ask for

- **Request the narrowest permission that satisfies the use case.** If a feature needs to know whether the user is near a store, approximate location (COARSE) is sufficient; requesting precise location (FINE) when you do not need it signals data over-collection and erodes trust. Similarly, if users are selecting photos to attach, use the Android photo picker — which requires no permission at all on Android 13 and above — rather than requesting READ_MEDIA_IMAGES.
- **Audit permission requests before every major release.** Permissions that were added for a removed feature, or that duplicate the capability of a platform API that no longer needs them, should be removed from the manifest. Each declared permission is a statement of intent that users and app store reviewers evaluate.
- **Do not request permissions as part of onboarding unless the feature is core.** A photo-editing app where every workflow involves the camera or photo library may reasonably introduce those permissions early. A productivity app that happens to have a profile photo feature should not request photo library access during onboarding — wait until the user taps the profile photo for the first time.
- **Group related permissions and explain the group together.** If a video recording feature needs camera and microphone, explain both in a single rationale UI rather than firing two separate system dialogs in rapid succession. Sequential dialogs with no shared context feel like an interrogation.

## Platform notes

### Compact phones
The primary context for runtime permission UX. System dialogs appear as bottom-anchored sheets on Android 12 and above. Pre-permission rationale dialogs should use `AlertDialog` with concise supporting text. In-context rationale can use a Snackbar with a single action or a small card below the triggering UI element.

### Large screens and foldables
On tablets and foldables in multi-window mode, the system permission dialog may appear anchored to the pane that triggered it rather than the full screen. Pre-permission rationale dialogs rendered as `AlertDialog` appear center-screen at a capped maximum width — they do not stretch. If the feature lives in a detail pane of a two-pane layout, ensure the rationale and degraded-state messaging appear within that pane rather than overlaying an unrelated part of the screen.

### Android version considerations
Permission behavior has changed substantially across versions. One-time grants arrived in Android 11; the "Don't ask again" flow changed to auto-deny after two consecutive denials in Android 11; photo/video granular permissions split in Android 13; the photo picker became available as a system component in Android 13. Design must account for these behavioral differences — a single permission UI that treats all Android versions as identical will produce confusing flows on specific OS versions. Coordinate with the runtime-permissions code skill to understand which API level behaviors affect each permission category.

### Notification permissions
`POST_NOTIFICATIONS` became a runtime permission on Android 13. Because notification delivery is valuable but not always core to an app's identity, the timing and rationale design here matters enormously. Never request notification permission on first launch. Wait until the user engages with a feature that produces notifications — a messaging thread, a reminder, a delivery status — and present rationale that explains what specific notifications they will receive, not a generic "stay informed" plea.

## Pitfalls

- Requesting any dangerous permission on app launch before the user has taken an action that requires it.
- Showing the system permission dialog with no preceding in-app context, leaving the user unable to assess whether to grant.
- Bundling unrelated permissions into a single rationale and requesting them sequentially without explaining the connection.
- Repeating the same rationale dialog every time the user triggers a feature after having denied it once.
- Silently re-launching the system permission request after permanent denial, causing an apparent no-op that looks like a bug.
- Hiding or crashing features entirely when a permission is denied rather than rendering a legible degraded state.
- Using guilt or consequence language in rationale ("Without location access, you will get a worse experience") rather than value-positive framing.
- Requesting precise location when approximate location would satisfy the use case.
- Requesting photo library access when the Android photo picker could accomplish the same task with no permission.
- Treating the Settings redirect as a Snackbar action rather than a modal dialog, causing users to miss it or not understand they must leave the app.
- Showing the Settings redirect repeatedly after the user has already dismissed it.

## References

- **Material 3 Guidelines:** [Foundations overview](https://m3.material.io/foundations/overview)
- **Documentation:** [Permissions on Android — overview](https://developer.android.com/guide/topics/permissions/overview)
- **Material 3 Guidelines:** [Dialogs overview](https://m3.material.io/components/dialogs/overview)
- **Material 3 Guidelines:** [Snackbar](https://m3.material.io/components/snackbar/overview)
- **Material 3 Guidelines:** [Bottom sheets](https://m3.material.io/components/bottom-sheets/overview)

## See also

The runtime-permissions code skill covers the implementation of `rememberLauncherForActivityResult`, `ActivityResultContracts.RequestPermission` and `RequestMultiplePermissions`, checking `shouldShowRequestPermissionRationale`, and navigating to `ACTION_APPLICATION_DETAILS_SETTINGS` for permanent-denial flows. For designing the dialog used as a rationale surface or Settings redirect prompt, see the m3-dialogs design skill. For writing permission rationale copy that is clear and value-positive without being manipulative, see the m3-writing design skill. For onboarding flows where permission timing intersects with first-run design, consider the overall app launch experience patterns.
