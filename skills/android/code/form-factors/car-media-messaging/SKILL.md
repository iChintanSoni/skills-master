---
name: car-media-messaging
description: Covers media and messaging apps for Android Auto and Automotive OS — MediaBrowserService for browsable audio playback, the Car App Library messaging template, notification-based messaging with CarCompatExtender reply and mark-as-read actions, and voice-first interaction patterns. Use when building an audio, podcast, or messaging app that must run on the car dashboard through Android Auto or a built-in Automotive OS head unit.
globs:
  - "**/*.kt"
tags: [android-auto, automotive-os, car-app-library, mediabrowserservice, messaging]
x-skills-master:
  domain: android
  class: code
  category: form-factors
  platforms: ["android-auto", "automotive-os"]
  requires: { "android": "16", "kotlin": "2.2", "car-app-library": "1.7" }
  pairs_with: []
  sources:
    - https://developer.android.com/training/cars/media
    - https://developer.android.com/training/cars/messaging
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Use this skill when you are building an audio streaming, podcast, radio, or messaging app that must present its UI on a car dashboard — either through the Android Auto phone projection experience or natively on an Automotive OS head unit (AAOS). It covers the two distinct integration surfaces: the media playback architecture (MediaBrowserService / MediaLibraryService browse tree and playback controls) and the notification-based or template-based messaging surface (driver-safe reply, mark-as-read, and voice dictation). Do not use this skill for general notification design or background audio on a phone; see the `notifications` and `media3-session` skills for those.

## Core guidance

### Media apps

**Architecture**

- Implement `MediaLibraryService` (Media3) or `MediaBrowserServiceCompat` (legacy). Android Auto and AAOS both connect as `MediaBrowser` clients and call your `onGetRoot` / `onLoadChildren` callbacks to populate the in-car browse UI.
- Prefer Media3 `MediaLibraryService` for new apps; it unifies the browse and playback session into a single component and interoperates with `ExoPlayer`.
- The browse tree is the primary UI — the car host renders it; your app never draws a custom layout for the playback screen.

**Browse tree structure**

- Return a root `MediaItem` with `FLAG_BROWSABLE` only. Direct children should be tabs (e.g., "Recents", "Playlists", "Artists"). Leaf playable items carry `FLAG_PLAYABLE`.
- Keep the tree shallow — three levels maximum. Deep hierarchies frustrate drivers and are limited by the host.
- Populate `MediaDescriptionCompat` with `title`, `subtitle`, `iconUri` (HTTPS or content URI), and a stable `mediaId`. The car host caches artwork; always use a consistent URI per item.
- For `MediaLibraryService`, mark each `MediaItem` with a `MediaMetadata.Builder().setIsBrowsable(true)` or `setIsPlayable(true)` flag and return it from `onGetChildren`.

**Playback metadata**

- Update `PlaybackStateCompat` (or `Player` state through `MediaSession`) promptly — the car host polls state to decide whether to show play/pause, a spinner, or an error card.
- Set `PlaybackStateCompat.Builder.setExtras` with `PLAYBACK_SPEED` when the current speed differs from 1.0 (e.g., podcast playback rate).
- Populate `MediaMetadataCompat` (or `MediaItem.mediaMetadata`) with `METADATA_KEY_TITLE`, `METADATA_KEY_ARTIST`, `METADATA_KEY_ALBUM_ART_URI`, and `METADATA_KEY_DURATION`.
- Return a meaningful `ERROR_CODE_*` state (e.g., `ERROR_CODE_NOT_SUPPORTED`, `ERROR_CODE_APP_ERROR`) in `PlaybackStateCompat` when playback fails; the car host surfaces the error message to the user.

**Automotive OS vs. Android Auto**

- Android Auto: the phone app runs the service; the car head unit projects the UI over USB or Bluetooth.
- Automotive OS: the app is installed directly on the head unit. Declare a separate Automotive OS app variant with `uses-feature android:name="android.hardware.type.automotive"` and ship it as a distinct APK or AAB split.
- For AAOS, use the Car App Library media template (`MediaTemplate`) for richer controls (queue, custom actions) that go beyond what a raw `MediaBrowserService` exposes.

**Manifest declarations**

- Declare the `MediaBrowserService` / `MediaLibraryService` with `android.media.browse.MediaBrowserService` intent action so Android Auto discovers it.
- Add `<meta-data android:name="com.google.android.gms.car.application" android:resource="@xml/automotive_app_desc" />` in `AndroidManifest.xml`.
- Create `res/xml/automotive_app_desc.xml` declaring `<uses name="media" />`.
- For AAOS-native builds, add `<uses name="media" />` inside the `<automotive-app>` element.

```kotlin
// Media3 MediaLibraryService — browse + playback for Android Auto / AAOS
class CarPlaybackService : MediaLibraryService() {

    private lateinit var player: ExoPlayer
    private lateinit var session: MediaLibrarySession

    override fun onCreate() {
        super.onCreate()
        player = ExoPlayer.Builder(this).build()
        session = MediaLibrarySession.Builder(this, player, object : MediaLibrarySession.Callback {

            override fun onGetLibraryRoot(
                session: MediaLibrarySession,
                browser: MediaSession.ControllerInfo,
                params: LibraryParams?
            ): ListenableFuture<LibraryResult<MediaItem>> {
                val root = MediaItem.Builder()
                    .setMediaId("root")
                    .setMediaMetadata(
                        MediaMetadata.Builder()
                            .setIsBrowsable(true)
                            .setIsPlayable(false)
                            .setTitle("Root")
                            .build()
                    ).build()
                return Futures.immediateFuture(LibraryResult.ofItem(root, params))
            }

            override fun onGetChildren(
                session: MediaLibrarySession,
                browser: MediaSession.ControllerInfo,
                parentId: String,
                page: Int,
                pageSize: Int,
                params: LibraryParams?
            ): ListenableFuture<LibraryResult<ImmutableList<MediaItem>>> {
                val children = buildBrowseChildren(parentId)
                return Futures.immediateFuture(LibraryResult.ofItemList(children, params))
            }

            override fun onAddMediaItems(
                mediaSession: MediaSession,
                controller: MediaSession.ControllerInfo,
                mediaItems: List<MediaItem>
            ): ListenableFuture<List<MediaItem>> {
                val resolved = mediaItems.map { item ->
                    item.buildUpon().setUri(resolveStreamUri(item.mediaId)).build()
                }
                return Futures.immediateFuture(resolved)
            }
        }).build()
    }

    override fun onGetSession(controllerInfo: MediaSession.ControllerInfo) = session

    override fun onDestroy() {
        session.release()
        player.release()
        super.onDestroy()
    }

    private fun buildBrowseChildren(parentId: String): ImmutableList<MediaItem> = TODO()
    private fun resolveStreamUri(mediaId: String): Uri = TODO()
}
```

---

### Messaging apps

**Integration model**

- Messaging apps do NOT draw a custom UI in the car. Instead, the car head unit reads incoming-message notifications that carry `CarCompatExtender`-annotated actions, and the host renders a standardised driver-safe UI.
- For AAOS apps using the Car App Library 1.7+, you can additionally implement `ConversationTemplate` for a richer threading experience; the notification path still works on Android Auto.

**Incoming message notification**

- Build notifications with `NotificationCompat.Builder` and attach a `CarCompatExtender` (from `androidx.car.app:app`) to the builder.
- Inside `CarCompatExtender.Builder`, add a reply action and a mark-as-read action.
- The reply `RemoteInput` result arrives in your `BroadcastReceiver`; send it to the backend and update/cancel the notification.
- Use `NotificationCompat.MessagingStyle` as the base style so the system shows a conversation thread on phones while the car host reads the `CarCompatExtender` for the in-car view.

**Reply and mark-as-read actions**

- Reply action: `CarCompatExtender.Builder.setReplyAction(replyPendingIntent, RemoteInput)` — the remote input label should be short ("Reply") because voice dictation uses it as the prompt.
- Mark-as-read action: `CarCompatExtender.Builder.setUnreadConversation(unreadConversation)` is deprecated; instead, add a conventional `NotificationCompat.Action` with the semantic action `ACTION_MARK_AS_READ` and include it in the `CarCompatExtender` via `addAction`.
- Cancel or update the notification in both the reply and mark-as-read receivers immediately after handling — do not leave stale notifications.

**Voice-first interaction**

- Set a concise `contentTitle` on the notification — this is the sender name the TTS engine reads.
- Keep message text to the last one or two messages; the car reads all messages aloud and very long threads are fatiguing.
- Avoid media-heavy content in the message body (URLs, HTML tags); strip to plain text before putting it into `MessagingStyle.Message`.

**Manifest and permissions**

- Declare `android.permission.RECEIVE_BOOT_COMPLETED` if you restore pending notification state on reboot.
- Add `<meta-data android:name="com.google.android.gms.car.application" android:resource="@xml/automotive_app_desc" />`.
- Create `res/xml/automotive_app_desc.xml` declaring `<uses name="notification" />` for messaging apps.
- For AAOS native messaging apps, also add `android.car.permission.TEMPLATE_RENDERER` if using `ConversationTemplate`.

---

## Platform notes

- **Android Auto (phone projection):** The phone runs all services; the car host is a dumb renderer. Network and CPU run on the phone. Latency in `onLoadChildren` is visible to the driver — keep I/O off the main thread and respond within ~2 seconds or the host shows a loading spinner.
- **Automotive OS (built-in):** The app runs natively on the head unit. The Car App Library `Session` and `Screen` model replaces Activity-based navigation. For media, `MediaLibraryService` is still the correct surface — the system media app calls into it via the standard browser protocol.
- **Car App Library 1.7 (API level 7):** Introduces `ConversationTemplate` for structured in-car messaging threads and updated `NavigationTemplate` APIs. Minimum host API level must be declared in the manifest with `<meta-data android:name="androidx.car.app.minCarApiLevel" android:value="1" />`.
- **Certification:** Android Auto media and messaging apps require submission to the Google Play Console "Android Auto" section. Apps are reviewed for driver distraction guidelines (DDG) compliance before they appear in the car launcher. AAOS apps have a separate review track.
- **Audio focus:** Always request `AudioFocus` via `AudioManager.requestAudioFocus` before starting playback; surrender it promptly in `onAudioFocusChange(AUDIOFOCUS_LOSS)`. The car head unit arbitrates focus between navigation, phone calls, and media.
- **Background restrictions:** On AAOS, the head unit may restrict background execution; keep the `MediaLibraryService` as a foreground service with a visible notification (`foregroundServiceType="mediaPlayback"` on API 34+).

## Pitfalls

- **Blocking `onLoadChildren` / `onGetChildren` on the main thread** — both callbacks are invoked on the main thread. Any I/O (database, network) must be dispatched to a coroutine scope (`lifecycleScope.async { }.asListenableFuture()`) and the `ListenableFuture` returned immediately.
- **Returning items without a stable `mediaId`** — if `mediaId` changes between browse sessions, the car host cannot match artwork cache entries and shows blank tiles. Generate IDs from stable content identifiers (e.g., track database ID), never from list position.
- **Missing `automotive_app_desc.xml`** — without this file the Android Auto app validator rejects the APK and the app never appears in the car launcher.
- **Not handling playback errors with a meaningful `PlaybackStateCompat` error code** — a silent error state causes the host to show a generic spinner indefinitely. Always call `setState(STATE_ERROR, ...)` with a user-visible error message.
- **Using `FLAG_IMMUTABLE` on the reply `PendingIntent`** — the car host (and the notification system) must write the `RemoteInput` result into the intent. Use `FLAG_MUTABLE` for reply intents only.
- **Posting large artwork bitmaps inline** — bitmaps in notifications cross a Binder IPC boundary. Always provide an `iconUri` pointing to a remotely fetchable image rather than embedding a `Bitmap`. On AAOS the host fetches the URI itself.
- **Forgetting to cancel or update the notification after handling a reply** — the driver sees a spinner on the reply button indefinitely, which is a DDG violation and causes certification failure.
- **Not stripping HTML from message text** — `MessagingStyle.Message` text rendered by TTS on the head unit reads HTML tags aloud. Sanitise to plain text before adding messages.
- **Skipping audio focus management** — without proper focus handling, your audio can overlap navigation prompts or phone calls, which is both a bad experience and a DDG violation.

## References

- **Documentation:** [Build media apps for cars](https://developer.android.com/training/cars/media)
- **Documentation:** [Enable messaging apps for cars](https://developer.android.com/training/cars/messaging)

## See also

For the underlying Media3 session and `ExoPlayer` wiring, see the **media3-session** skill. For phone-side notification construction with `MessagingStyle` and direct-reply actions, see the **notifications** skill. For foreground service lifecycle and battery-aware execution on AAOS, see the **background-tasks** skill. For the Car App Library `Screen`/`Session` model used in navigation or point-of-interest apps, consult the Car App Library navigation template documentation alongside this skill.
