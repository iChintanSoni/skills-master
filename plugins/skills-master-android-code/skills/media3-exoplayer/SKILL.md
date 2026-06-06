---
name: media3-exoplayer
description: Media3 ExoPlayer skill for Android — Use when building video/audio playback with adaptive streaming (DASH/HLS), DRM, playlists, track selection, or player surfaces in Jetpack Compose or Views.
---

## When to use

Use this skill whenever an Android app needs to play local or remote video/audio beyond what `MediaPlayer` can handle: adaptive-bitrate streaming over HLS or DASH, multi-item playlists, Widevine/ClearKey DRM, fine-grained track selection, or a polished player UI that works equally well on phones, large-screen tablets, foldables, and Android TV. Media3 ExoPlayer is the successor to the standalone ExoPlayer library and is the recommended Jetpack solution as of 2024+.

## Core guidance

### Player construction

- Create exactly one `ExoPlayer` instance per playback context; share it across the UI via a `ViewModel` or a `MediaSessionService`.
- Use `ExoPlayer.Builder(context)` — pass a custom `TrackSelector`, `LoadControl`, or `RenderersFactory` only when you have a measured reason to deviate from defaults.
- Always call `player.release()` when the player is no longer needed; failure to do so leaks codecs and audio focus.

### MediaItem and playlists

- Prefer the `MediaItem.fromUri(uri)` factory for simple cases; use `MediaItem.Builder()` for DRM, subtitle tracks, ads, or custom metadata.
- Build playlists with `player.setMediaItems(list)` or mutate live with `addMediaItem`, `removeMediaItem`, and `moveMediaItem` — no need to recreate the player.
- Set `player.repeatMode` (`REPEAT_MODE_OFF`, `_ONE`, `_ALL`) and `player.shuffleModeEnabled` directly.

### Adaptive streaming

- For HLS use a URI ending in `.m3u8`; for DASH use `.mpd`. Media3 auto-selects the correct extractor — no explicit factory needed for standard streams.
- Tune `DefaultLoadControl` buffers only after profiling; the defaults are well-calibrated.
- Prefer `PreloadConfiguration` on ExoPlayer 1.4+ to warm the next item in a playlist before the current one finishes.

### DRM

- Specify Widevine via `MediaItem.Builder().setDrmConfiguration(DrmConfiguration.Builder(C.WIDEVINE_UUID).setLicenseUri(licenseUrl).build())`.
- Pass custom request headers with `setLicenseRequestHeaders`.
- Handle `DrmSession.DrmSessionException` in `Player.Listener.onPlayerError`; check `PlaybackException.errorCode == PlaybackException.ERROR_CODE_DRM_*`.

### Track selection

- Retrieve available tracks from `player.currentTracks`; each `Tracks.Group` exposes format metadata and the selected flag.
- Override tracks with `player.trackSelectionParameters = player.trackSelectionParameters.buildUpon().setPreferredAudioLanguage("en").build()`.
- Force a specific rendition by `setTrackTypeDisabled` or by building a `DefaultTrackSelector.Parameters` with `setMaxVideoSize`.

### Player events

- Implement `Player.Listener` and attach with `player.addListener`; remove with `removeListener` to avoid leaks.
- Use `onPlaybackStateChanged` + `onIsPlayingChanged` rather than polling; derive UI state from these.
- Collect `player.currentPosition` for progress bars only inside a `LaunchedEffect` loop — avoid frequent recomposition by throttling to ~200 ms.

### Compose surface

- Use `AndroidView { PlayerView(context) }` to host the legacy `PlayerView`, or adopt `androidx.media3:media3-ui`'s `PlayerSurface` composable (Media3 1.5+).
- Bind the player in `DisposableEffect` so it is detached when the composable leaves composition.
- On large screens / foldables, observe `WindowSizeClass` and adjust `resizeMode` on `PlayerView`.
- On Android TV use `leanback_player_view.xml` layouts or a custom `SurfaceView`/`TextureView` with `player.setVideoSurfaceView`.

### Lifecycle integration

- In a `Fragment` or `Activity`, initialize the player in `onStart` (API 24+) or `onResume` (earlier), pause in `onPause`/`onStop`, and release in `onStop`/`onDestroy`. Restore position with `player.seekTo(savedPosition)`.
- In a `ViewModel`, hold the player as a property and release in `onCleared`.

```kotlin
// Minimal ViewModel-scoped player with a Compose surface
class VideoViewModel(application: Application) : AndroidViewModel(application) {

    val player: ExoPlayer = ExoPlayer.Builder(application).build().apply {
        playWhenReady = true
        repeatMode = Player.REPEAT_MODE_OFF
    }

    fun load(uri: Uri, drmLicenseUrl: String? = null) {
        val item = MediaItem.Builder()
            .setUri(uri)
            .apply {
                if (drmLicenseUrl != null) {
                    setDrmConfiguration(
                        DrmConfiguration.Builder(C.WIDEVINE_UUID)
                            .setLicenseUri(drmLicenseUrl)
                            .build()
                    )
                }
            }
            .build()
        player.setMediaItem(item)
        player.prepare()
    }

    override fun onCleared() {
        player.release()
    }
}

@Composable
fun VideoPlayer(player: ExoPlayer, modifier: Modifier = Modifier) {
    DisposableEffect(player) {
        onDispose { /* player lifecycle managed by ViewModel */ }
    }
    AndroidView(
        factory = { ctx ->
            PlayerView(ctx).apply {
                this.player = player
                useController = true
            }
        },
        modifier = modifier.fillMaxWidth().aspectRatio(16f / 9f)
    )
}
```

## Platform notes

**Phones / general Android**
- Request audio focus via `AudioFocusRequest` or let `ExoPlayer`'s built-in `AudioFocusManager` handle it (enabled by default when `setAudioAttributes` is set with `handleAudioFocus = true`).
- Support background audio with a `MediaSessionService` and a foreground notification; do not keep the player alive in a plain `Service` without a notification.

**Large screens and foldables**
- Listen for `WindowInfoTracker` posture changes; on `FLAT` posture restore a wider aspect, on `HALF_OPENED` consider picture-in-picture.
- Declare `android:resizeableActivity="true"` and handle multi-window; the player must pause when it loses window focus.

**Android TV**
- All D-pad events must be reachable without touch; ensure `PlayerControlView` or a custom overlay intercepts D-pad via `onKeyDown`.
- Use `ExoPlayer` with `leanback` extensions or a custom `PlayerAdapter` for the `PlaybackGlue` architecture if integrating with Leanback fragments.
- Target `API 21+` for TV; ClearKey and Widevine are both supported on TV devices that declare the feature.

## Pitfalls

- **Leaking the player** — never hold `ExoPlayer` in a plain `companion object` or `object`; it must be tied to a lifecycle-aware owner that calls `release()`.
- **Calling `prepare()` multiple times** — calling `prepare()` when the player is already prepared resets buffered data; only call it once after `setMediaItem(s)`.
- **TextureView vs SurfaceView** — `SurfaceView` has better power efficiency and HDR support; `TextureView` allows transformations but costs a GPU copy. Default to `SurfaceView`.
- **Main-thread seek storms** — calling `seekTo` on every scroll event causes excessive decoder flushes; debounce or use `seekToDefaultPosition` for playlist navigation.
- **Ignoring `PlaybackException.errorCode`** — catching the generic `onPlayerError` without inspecting `errorCode` obscures whether the failure is DRM, network, or format; log and surface error codes.
- **Mixing Media3 and legacy ExoPlayer** — do not mix `com.google.android.exoplayer2` and `androidx.media3` dependencies; they are incompatible and will cause duplicate class errors.
- **Not removing listeners** — `player.addListener` does not use `WeakReference`; always pair with `removeListener` or use a `DisposableEffect` / `onCleared` teardown.
- **Forgetting `setAudioAttributes`** — omitting this means the player won't participate in audio focus, causing it to continue playing when another app (e.g. phone call) takes audio.

## References

- **Documentation:** [Media3 ExoPlayer guide](https://developer.android.com/media/media3/exoplayer)
- **Documentation:** [Media3 overview](https://developer.android.com/media/media3)
- **API reference:** [ExoPlayer JavaDoc](https://developer.android.com/reference/androidx/media3/exoplayer/ExoPlayer)

## See also

Pair this skill with `avfoundation-playback` when targeting Apple platforms for feature parity. For background audio sessions and media-session controls on Android, see the `background-tasks` and `user-notifications` sibling skills. For recording and camera integration alongside playback, see `avfoundation-capture`.
