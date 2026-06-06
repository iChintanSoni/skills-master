---
name: media3-session
description: Covers Media3 MediaSession and MediaController for exposing playback to the system. Use when building background audio/video playback, media notification controls, or browsable media libraries with MediaSessionService or MediaLibraryService.
---

## When to use

Use this skill whenever you need:

- Audio or video playback that continues when the user leaves the app (background playback).
- System media controls — lock-screen notification, Now Playing widget, Bluetooth headset buttons, Android Auto, or Wear OS integration.
- A browsable media catalogue exposed to assistant, Android Auto, or TV (MediaLibraryService).
- A client UI that controls a remote player running in a separate process or service via MediaController.

Do not use the legacy `MediaSessionCompat` API; Media3's `MediaSession` supersedes it and interoperates directly with `ExoPlayer`.

## Core guidance

**Architecture overview**

- `ExoPlayer` is the `Player` implementation — own it in the service, never in a Fragment/Activity.
- `MediaSession` wraps the player and connects it to the Android media framework.
- `MediaSessionService` (or `MediaLibraryService`) is a bound + started `Service` that hosts both.
- UI binds to the service through a `MediaController` built from a `SessionToken`.

**Service setup**

- Extend `MediaSessionService`, not a plain `Service`.
- Override `onGetSession()` to return the single `MediaSession` owned by the service.
- Release both the player and session in `onDestroy()`.
- Declare the service in the manifest with `FOREGROUND_SERVICE` permission, the `MEDIA_PLAYBACK` foreground-service type (Android 14+), and the `MediaLibraryService` action if you expose a browse tree.

**MediaSession creation**

- Build once with `MediaSession.Builder(context, player).build()`.
- Set a `MediaSession.Callback` to intercept `onAddMediaItems` — this is where you resolve `MediaItem` URIs that arrive from external controllers (Auto, assistant).
- Use `setSessionActivity(PendingIntent)` to point back to your player UI.

**Media notification**

- `DefaultMediaNotificationProvider` is applied automatically when you use `MediaSessionService`; it reads `MediaMetadata` fields from each `MediaItem`.
- Populate `MediaItem.mediaMetadata` with `title`, `artist`, `artworkUri`, and `mediaId` before adding items to the player.
- To customise the notification (channels, extra actions), implement `MediaNotification.Provider`.

**MediaController in the UI**

- Build with `MediaController.Builder(context, token).buildAsync()` on the main thread; the returned `ListenableFuture` delivers the controller on the main thread.
- Treat the controller as a `Player` — call `play()`, `pause()`, `seekTo()` directly on it.
- Release with `controller.release()` in `onStop()` or `onDestroy()`; the service lifecycle is independent.

**MediaLibraryService for browsable content**

- Extend `MediaLibraryService` instead of `MediaSessionService`.
- Override `onGetLibraryRoot()`, `onGetChildren()`, and `onGetItem()` to expose your content tree.
- Return `LibraryResult.ofItemList(items, params)` from each callback.
- Mark the root `MediaItem` with `browsable = true` and `playable = false`; leaf items with `playable = true`.

```kotlin
// Minimal MediaSessionService wiring
class PlaybackService : MediaSessionService() {

    private lateinit var player: ExoPlayer
    private lateinit var mediaSession: MediaSession

    override fun onCreate() {
        super.onCreate()
        player = ExoPlayer.Builder(this).build()
        mediaSession = MediaSession.Builder(this, player)
            .setCallback(object : MediaSession.Callback {
                override fun onAddMediaItems(
                    mediaSession: MediaSession,
                    controller: MediaSession.ControllerInfo,
                    mediaItems: List<MediaItem>
                ): ListenableFuture<List<MediaItem>> {
                    // Resolve URIs from external controllers
                    val resolved = mediaItems.map { item ->
                        item.buildUpon()
                            .setUri(resolveUri(item.mediaId))
                            .build()
                    }
                    return Futures.immediateFuture(resolved)
                }
            })
            .build()
    }

    override fun onGetSession(controllerInfo: MediaSession.ControllerInfo) = mediaSession

    override fun onDestroy() {
        mediaSession.release()
        player.release()
        super.onDestroy()
    }

    private fun resolveUri(mediaId: String): Uri =
        Uri.parse("https://cdn.example.com/audio/$mediaId.mp3")
}
```

**Connecting from a Compose UI**

- Obtain the `SessionToken` from `SessionToken.createSessionToken(context, ComponentName(..., PlaybackService::class.java))`.
- Hold the `MediaController` in a `ViewModel`, build it with `MediaController.Builder(...).buildAsync()`, and expose it as `StateFlow<Player?>`.
- Collect the flow in the composable, then read player state with `remember { derivedStateOf { ... } }` combined with `Player.Listener` updates to trigger recomposition.

**Android TV / Large screen**

- On TV, `MediaLibraryService` enables the Leanback / TvProvider browse experience; return proper content hierarchy from `onGetChildren`.
- On large screens (foldables, tablets), a single controller can drive a full-screen video pane alongside a playlist — the service architecture requires no change.

## Platform notes

- **Android 14+ (API 34):** `foregroundServiceType="mediaPlayback"` is mandatory in the manifest or the service will crash on start.
- **Android 13 (API 33):** `POST_NOTIFICATIONS` runtime permission is required to show the media notification.
- **Android Auto:** your service must declare `<meta-data android:name="com.google.android.gms.car.application" ...>` and an automotive app description XML. `onAddMediaItems` must resolve IDs synchronously-enough — use `Futures.immediateFuture` where possible.
- **Wear OS:** Use `MediaController` over the Wear data layer; the session service runs on the phone.
- **Background restrictions:** Starting from API 31, the system may limit wake-locks. Keep the foreground service alive during active playback; release promptly when playback ends by calling `stopSelf()` in a `Player.Listener.onPlaybackStateChanged` when state is `STATE_ENDED` and you have no queued items.

## Pitfalls

- **Creating ExoPlayer in an Activity/Fragment** — the player is destroyed with the UI. Always own the player in the service.
- **Forgetting `onAddMediaItems`** — external controllers (Auto, assistant) send `MediaItem`s with no local URI. Without this callback override the items play silently or throw.
- **Not releasing the controller** — each `MediaController.buildAsync()` call opens a binder connection. Leaking controllers exhausts binder threads.
- **Blocking `onGetChildren`** — `MediaLibraryService` callbacks run on the main thread; delegate to a coroutine scope (`serviceScope.async { ... }.asListenableFuture()`) for any I/O.
- **Wrong notification channel** — the default channel is created lazily. Override `DefaultMediaNotificationProvider` to set an appropriate channel name/importance before Android O+ users see the default "Other" bucket.
- **Duplicate sessions** — call `onGetSession()` returning `null` for untrusted controllers you want to reject; never build a new `MediaSession` inside `onGetSession`.
- **Missing `setSessionActivity`** — without this, tapping the notification does nothing on some OEM launchers.

## References

- **Documentation:** [Media3 MediaSession overview](https://developer.android.com/media/media3)
- **Documentation:** [Background playback with MediaSessionService](https://developer.android.com/media/media3/session/background-playback)
- **API reference:** [androidx.media3.session](https://developer.android.com/reference/androidx/media3/session/package-summary)

## See also

Pair with **avfoundation-playback** concepts when porting from iOS. For the player layer beneath the session, see the ExoPlayer configuration patterns. For Compose UI integration and state hoisting, see **swiftui-state-data-flow** mental models applied to Android's `ViewModel`-plus-`StateFlow` pattern. For foreground service constraints and battery optimisation, see **background-tasks**.
