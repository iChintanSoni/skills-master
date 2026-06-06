---
name: m3-sharing
description: "Design critique and guidance for Material 3 sharing patterns on Android: when to trigger the system sharesheet versus a custom share menu, how to shape shareable content, surfacing direct-share targets, and designing a well-considered receive-share entry point. Use when reviewing a share action trigger, choosing what content to expose for sharing, or evaluating whether a custom share surface is warranted instead of the Android system sharesheet."
tags: [m3, design, sharing, android, patterns, sharesheet]
x-skills-master:
  domain: android
  class: design
  category: patterns
  platforms: ["android", "large-screen"]
  pairs_with: []
  sources:
    - https://developer.android.com/training/sharing/send
    - https://developer.android.com/design/ui/mobile
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for this skill when making decisions about how users share content from or into an Android app. Common triggers include:

- Deciding where to place and how to label the share action entry point in a screen's toolbar, FAB, or contextual action menu.
- Choosing what to package as the shared payload — plain text, rich text, a URI, a file, or a combination — and whether to include a preview.
- Evaluating whether direct-share targets (ChooserTarget rows that appear at the top of the system sharesheet) are appropriate for your content type.
- Designing the receive-share experience, specifically the activity or composable that handles an incoming `ACTION_SEND` or `ACTION_SEND_MULTIPLE` intent.
- Critiquing whether a proposed custom share bottom sheet adds enough value over the system sharesheet to justify the deviation.

This is a design-judgment skill. For the implementation — constructing `Intent.ACTION_SEND`, registering `ChooserTargetService` or the `shortcuts.xml` direct-share shortcut, or building a `ShareCompat`-backed receive screen — refer to the implementation code skill.

## Core guidance

- **Default to the system sharesheet; build custom only when you have a measurable reason.** The Android system sharesheet is a deeply familiar pattern across the entire platform. Users know where to find their contacts, their saved apps, and the nearby-share entry. A custom share menu requires the user to learn a new surface, removes direct-share targets entirely, and leaves out apps you have not anticipated. Reserve custom share UIs for cases where the system sheet fundamentally cannot represent the primary sharing action — for example, sharing within a tightly integrated collaboration feature where in-app recipients are the dominant use case and a fallback "more" tap leads to the system sheet.

- **Place the share action where the content's context lives, not where it is convenient to add.** A share icon in a detail screen's top app bar is correct when the content on that screen is the thing being shared. Placing share in a bottom navigation bar or a persistent FAB suggests the entire app or session is being shared, which is almost never the intent. For multi-item selections in a list, surface share in the contextual action bar (the top app bar that replaces the standard bar during selection mode) so the scope is unambiguous.

- **Use the share icon from Material Symbols consistently.** Android's share affordance is strongly associated with the platform-standard share icon (the connected-nodes glyph in Material Symbols). Substituting an upload arrow, an export icon, or a send icon creates scanning friction; users do not immediately recognize the action as system-level sharing. Reserve send/upload glyphs for in-app sending flows (such as submitting a message) where the destination is app-internal.

- **Label the share action "Share" — do not over-specify the action.** Labels like "Share to social", "Export", or "Send link" narrow the mental model before the user has seen the sharesheet. "Share" is correct; it sets the expectation that a system chooser will appear and the user will pick the destination. In a menu item, "Share" as a noun-verb stands alone; you do not need to append the content type ("Share photo") unless the surface simultaneously exposes multiple distinct share scopes.

- **Construct the richest payload the system can carry.** A plain URL is the minimum; a URL plus a title text clip plus a thumbnail `ClipData` item produces a proper share preview card in the system sheet. The preview card is displayed at the top of the sharesheet before the app row — it significantly increases confidence that the user is sharing the right thing. Always populate the `EXTRA_TITLE` and attach at least one `ClipData` URI pointing to a content-provider-backed thumbnail when sharing links or documents. Omitting the preview leaves a blank card, which looks broken.

- **Grant URI permissions explicitly and narrowly.** When the share payload includes a content URI — a file URI from a `FileProvider`, an image from the media store, a document — attach `FLAG_GRANT_READ_URI_PERMISSION` to the intent and ensure the URI is served by a properly declared `FileProvider` authority. Do not share raw `file://` URIs; they are blocked on modern Android and a design smell that the content architecture has not been thought through. The permission scope should cover the single URI being shared, not a whole directory tree.

- **Enable direct-share targets for high-frequency social or messaging content.** Direct-share targets are the contact or conversation chips that appear in the top ranked row of the system sharesheet. They are appropriate when your app has a strong social graph — chat threads, contacts, groups — and sharing to a specific person or thread is a primary action. Implement them via the `shortcuts.xml` sharing shortcut mechanism rather than the deprecated `ChooserTargetService`. Do not add direct-share targets for utility apps (file managers, PDF viewers, note-takers) where no meaningful contact graph exists; that row will simply be empty and wastes vertical space.

- **Rank and keep direct-share targets fresh.** The system uses usage frequency and recency to rank direct-share entries, but your app can influence the initial ranking by assigning a rank value in the shortcut definition. Update sharing shortcuts when conversations are opened or when the social graph changes — stale shortcuts showing archived or deleted contacts erode trust in the feature.

- **Design the receive-share entry point as a focused task screen, not a full app launch.** When another app shares content into yours, the user's mental context is "I am in another app; I want to drop this content somewhere." The receive activity should confirm what is being received (show the payload preview), provide a clear primary action (Save, Post, Add to …), and offer an obvious exit that returns the user to the originating app. Do not launch the full home screen of your app or force a sign-in flow before the content can be accepted — that abandonment rate will be high.

- **Handle unexpected MIME types gracefully in receive-share flows.** If your app declares an intent filter that matches `*/*` to be permissive, you will receive content you cannot render. Show a clear error state with the content type labeled and an exit action rather than crashing or silently dropping the content.

- **Do not block sharing behind paywalls or sign-in walls without disclosure.** If receiving or sending shared content requires authentication, show the sign-in prompt immediately when the user taps share or arrives via a share intent — do not let them proceed partway through the flow before hitting a gate. Gating share on a subscription tier should be communicated before the user taps the share icon, not after the sharesheet dismisses.

- **Test the sharesheet trigger at both compact and expanded window sizes.** On a foldable or tablet in multi-window mode, the system sharesheet appears as a dialog anchored near the share trigger point rather than as a full-width bottom sheet. Ensure the trigger is reachable and that the sheet does not open off-screen or at an illegible size.

## Platform notes

**Compact phones (< 600 dp width)**
The system sharesheet presents as a bottom sheet that expands from the bottom of the screen. Place the share action in the top app bar trailing slot or as a menu item in the overflow menu — not in the bottom bar, where it would be far from where the sharesheet emerges.

**Large phones, foldables, and tablets (≥ 600 dp width)**
The system sharesheet presents as a dialog positioned contextually near the triggering element. On large screens, a share icon in the top app bar or a floating toolbar remains correct. In multi-column canonical layouts (list-detail), the share action should appear in the detail pane's app bar, scoped to the selected item, not in the list pane. Test that the sharesheet dialog does not overlap critical content in split-screen or multi-window configurations.

**Wear OS**
Sharing is generally not a Wear pattern. The Watch is a consumption and glance device; initiating a share requires text entry or complex selection that is not natural on a small round screen. If your app has a Watch companion, omit the share action there and let the user share from the phone.

**Android TV / Google TV**
The system sharesheet is not present on TV. Sharing is not a TV UX pattern; design any content-export or send-to-device flow as an explicit, D-pad-navigable in-app screen rather than delegating to a system chooser.

**Android Auto**
Share actions are not appropriate while driving. Do not surface share entry points in your Auto app projection.

## Pitfalls

- Building a custom share bottom sheet when the system sharesheet meets all user needs, adding implementation cost and reducing capability (no direct-share, no nearby targets, no full app list).
- Sharing a bare URL with no title and no thumbnail, resulting in a blank preview card in the system sheet that makes the user unsure what they are about to share.
- Using a `file://` URI in the share intent rather than a content URI from `FileProvider`, causing the share to silently fail or crash on the receiving app.
- Placing the share action in the bottom navigation bar, where it implies sharing the entire app experience rather than the focused piece of content.
- Adding direct-share shortcuts for a utility app with no social graph — the empty direct-share row just adds visual noise.
- Letting stale direct-share shortcuts (for deleted contacts or closed conversations) persist indefinitely, degrading user trust in the feature.
- Launching the full app home screen in the receive-share activity instead of a focused accept/drop screen, forcing users to navigate to the right destination themselves.
- Gating share behind authentication mid-flow; if a login is required, surface it the moment the receive intent is opened, before the user invests in the task.
- Neglecting to handle the `ACTION_SEND_MULTIPLE` case in the receive flow, causing a crash or silent drop when the user shares several images from the gallery.
- Over-specifying the share action label ("Share to Instagram", "Post to feed") — this narrows the mental model and confuses users who want to share to a different destination.

## References

- **Material 3 Guidelines:** [Sharing patterns overview](https://m3.material.io/foundations/interaction/gestures)
- **Material 3 Guidelines:** [Top app bar](https://m3.material.io/components/top-app-bar/overview)
- **Material 3 Guidelines:** [Contextual action bar](https://m3.material.io/components/menus/overview)
- **Documentation:** [Sending simple data to other apps](https://developer.android.com/training/sharing/send)
- **Documentation:** [Android Mobile Design](https://developer.android.com/design/ui/mobile)

## See also

This skill covers design judgment only. For Compose and Android implementation — constructing `Intent.ACTION_SEND`, configuring `FileProvider` authorities, building `shortcuts.xml` sharing shortcuts, and wiring a receive-share activity — pair with the relevant Android sharing code skill. For contextual action bar design when the share is triggered from a multi-select list, see the M3 app bars design skill. For icon selection and label conventions, see the M3 icons design skill. For decisions about modal share panels or custom bottom sheets that wrap a share flow, see the M3 sheets design skill.
