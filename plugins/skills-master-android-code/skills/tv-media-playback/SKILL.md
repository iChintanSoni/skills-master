---
name: tv-media-playback
description: Media3 ExoPlayer player UI for Android TV — Use when building a living-room video playback experience with D-pad-driven controls, remote-friendly overlays, background/resume behaviour, and TV audio/display considerations using Media3 ExoPlayer and TV Compose.
---

## When to use

Use this skill when building video or audio playback screens for Android TV where:

- The primary input device is a D-pad or TV remote — touch is unavailable or secondary.
- The player UI must be navigable entirely via hardware keys (play/pause, seek, track selection, back).
- You need a polished 10-foot UI: large controls, focus rings, safe-zone insets, and overlay auto-hide.
- Background playback, resume-on-return, and audio/display fidelity (passthrough audio, HDR, frame-rate matching) are required.
- You are using `androidx.tv:tv-compose` for the shell UI and Media3 ExoPlayer for the player engine.

Do not use the deprecated `PlaybackGlue` / `PlaybackSupportFragment` Leanback APIs for new screens; the TV Compose approach described here is the current recommendation.

## Core guidance

### Player lifecycle on TV

- Own `ExoPlayer` in a `ViewModel` (or a `MediaSessionService` for background audio) — never in an Activity or Composable directly.
- Call `player.prepare()` once after `setMediaItem`; call `player.play()` when the Activity window is visible.
- Pause in `onPause` / `onStop`; release in `ViewModel.onCleared()`. On TV, `onStop` fires whenever another app or the system overlay takes focus, so save position there.
- Persist the last playback position and `mediaId` in `DataStore` or a database; restore with `player.seekTo(savedWindowIndex, savedPosition)` before calling `play()`.

### D-pad and remote control

- Override `onKeyDown` in your Activity (or handle `KeyEvent` in Compose via `Modifier.onKeyEvent`) for media keys: `KEYCODE_MEDIA_PLAY_PAUSE`, `KEYCODE_MEDIA_FAST_FORWARD`, `KEYCODE_MEDIA_REWIND`, `KEYCODE_MEDIA_NEXT`, `KEYCODE_MEDIA_PREVIOUS`.
- Map `KEYCODE_DPAD_CENTER` / `KEYCODE_ENTER` to play/pause when the controls overlay is hidden.
- Use `KEYCODE_DPAD_LEFT` / `DPAD_RIGHT` for seek (e.g. 10-second jumps) when no focusable control is focused.
- Ensure every interactive control in the overlay has a defined `focusRequester` and participates in a clear focus path — TV users cannot tap a misfocused button.
- Do not rely on mouse-mode or touchpad gestures as the primary interaction; always provide key-event fallbacks.

### Player overlay UI with TV Compose

- Build the controls overlay as a `Box` with the `PlayerSurface` (or `AndroidView { PlayerView }`) beneath and an overlay `Column`/`Row` above.
- Hide the overlay after ~3 seconds of inactivity using a `LaunchedEffect` that resets on any key event; set `LocalFocusManager.current.clearFocus()` when hiding so key events fall through to the Activity.
- Use `androidx.tv.compose` `Button` and `IconButton` for controls so focus styling (scale, border) applies automatically.
- Expose seek position to the UI with a `LinearProgressIndicator` or a custom `Slider`; collect progress in a `LaunchedEffect` loop throttled to ~250 ms (use `delay(250)` in a `while(true)` loop).

### Audio considerations

- Call `player.setAudioAttributes(AudioAttributes.Builder().setUsage(C.USAGE_MEDIA).setContentType(C.AUDIO_CONTENT_TYPE_MOVIE).build(), true)` so ExoPlayer manages audio focus automatically.
- For surround passthrough (Dolby, DTS) do not force audio to stereo; leave `DefaultTrackSelector` to select the highest-channel format the sink reports as supported.
- Query `AudioManager.isOffloadedPlaybackSupported` (API 29+) if you want energy-efficient audio offload for music; for video it is rarely needed.

### Display considerations

- For HDR content, declare `<uses-feature android:name="android.hardware.screen.hdr" android:required="false" />` and query `Display.getHdrCapabilities()` at runtime — do not assume HDR.
- Enable frame-rate matching by calling `player.setVideoFrameMetadataListener` or by declaring `android:preferMinimalPostProcessing="true"` on the Activity to reduce display latency.
- Respect the TV safe area: wrap your overlay content in `Modifier.padding(WindowInsets.safeContent.asPaddingValues())` or apply a minimum 5% margin on all sides.
- Use `SurfaceView` (the default in `PlayerView`) for best HDR and power efficiency; never force `TextureView` on TV.

### Background and resume

- If the content should continue playing when the user presses Home (e.g. music, live TV), host the player in a `MediaSessionService` and issue a foreground notification.
- For VOD where pause-on-background is acceptable, simply pause in `onPause` and resume in `onResume`.
- Always write the playback position to persistent storage in `onPause`; TV processes may be killed quickly after the user switches apps.
- Implement a "Resume Watching" card on the content detail screen using the saved position — read it from the same `DataStore` key.

```kotlin
// TV player screen: ExoPlayer in ViewModel + D-pad key handling + overlay auto-hide
class TvPlayerViewModel(app: Application) : AndroidViewModel(app) {
    val player: ExoPlayer = ExoPlayer.Builder(app)
        .build()
        .also { p ->
            p.setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(C.USAGE_MEDIA)
                    .setContentType(C.AUDIO_CONTENT_TYPE_MOVIE)
                    .build(),
                /* handleAudioFocus = */ true
            )
        }

    fun load(uri: Uri, resumePosition: Long = 0L) {
        player.setMediaItem(MediaItem.fromUri(uri))
        player.prepare()
        if (resumePosition > 0L) player.seekTo(resumePosition)
        player.playWhenReady = true
    }

    override fun onCleared() = player.release()
}

@Composable
fun TvPlayerScreen(viewModel: TvPlayerViewModel = viewModel()) {
    val player = viewModel.player
    var overlayVisible by remember { mutableStateOf(true) }
    val focusRequester = remember { FocusRequester() }

    // Auto-hide overlay after 3 s
    LaunchedEffect(overlayVisible) {
        if (overlayVisible) {
            delay(3_000)
            overlayVisible = false
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
            .onKeyEvent { event ->
                if (event.type == KeyEventType.KeyDown) {
                    overlayVisible = true
                    when (event.key) {
                        Key.MediaPlayPause, Key.DirectionCenter ->
                            if (player.isPlaying) player.pause() else player.play()
                        Key.DirectionRight -> player.seekTo(player.currentPosition + 10_000)
                        Key.DirectionLeft  -> player.seekTo(player.currentPosition - 10_000)
                        else -> return@onKeyEvent false
                    }
                    true
                } else false
            }
    ) {
        // Video surface
        AndroidView(
            factory = { ctx ->
                PlayerView(ctx).apply {
                    this.player = player
                    useController = false          // custom overlay handles controls
                }
            },
            modifier = Modifier.fillMaxSize()
        )

        // Controls overlay
        AnimatedVisibility(
            visible = overlayVisible,
            enter = fadeIn(),
            exit = fadeOut()
        ) {
            TvPlayerControls(
                player = player,
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(horizontal = 48.dp, vertical = 32.dp)
            )
        }
    }
}
```

## Platform notes

**API levels**
- Target `minSdk 21` for TV (most current Android TV and Google TV devices run API 23+, but API 21 is the TV baseline).
- Frame-rate matching via `Display.getSupportedModes()` is available from API 23; gate the call accordingly.
- HDR capability queries require API 26+; use `Build.VERSION.SDK_INT` guards.

**Google TV vs Android TV**
- Google TV (Android 10+) surfaces "Resume Watching" rows from the TvProvider `WatchNextPrograms` table; write an entry with `WatchNextPrograms.TYPE_CONTINUE` and the resume position when the user leaves mid-way.
- On older Android TV boxes the `TvInputService` / channel APIs may be absent — check with `PackageManager.hasSystemFeature(PackageManager.FEATURE_LIVE_TV)`.

**Remote / input devices**
- Fire TV remotes send `KEYCODE_MEDIA_FAST_FORWARD` and `KEYCODE_MEDIA_REWIND` natively — handle these explicitly rather than relying on `PlayerView`'s built-in bindings.
- Some OEM remotes send `KEYCODE_DPAD_CENTER` for confirm; others send `KEYCODE_ENTER` — handle both.

**Audio output**
- TV devices commonly have HDMI ARC/eARC: do not down-mix to stereo prematurely; let ExoPlayer pass through encoded audio and let the AVR decode.
- If you absolutely must constrain audio, use `DefaultTrackSelector.Parameters.buildUpon().setMaxAudioChannelCount(2).build()`.

**Leanback interop**
- If the app still ships Leanback `BrowseSupportFragment` screens, the `PlaybackSupportFragment` + `PlaybackGlue` layer can be replaced screen-by-screen with the TV Compose approach without rewriting the browse UI.

## Pitfalls

- **No key-event fallback** — hiding the overlay without handling key events on the root composable or Activity leaves the user unable to control playback; always keep a key-event interceptor active at the Activity level.
- **Requesting focus in composition** — calling `focusRequester.requestFocus()` during composition instead of inside `LaunchedEffect` causes `IllegalStateException`; always defer focus requests to an effect.
- **Blocking the main thread on seek** — calling `player.seekTo` in a tight `onKeyEvent` loop (e.g. held D-pad) queues many seek operations; debounce or clamp seeks to fire at most once per 500 ms.
- **Ignoring safe-zone insets** — placing controls flush against the screen edge causes them to be clipped on TVs with overscan; always apply at least a 48 dp horizontal and 32 dp vertical inset.
- **Using TextureView for HDR** — `TextureView` does not support HDR tone-mapping on most TV SoCs; stick to `SurfaceView`.
- **Creating the player in the Composable** — TV Activities are recreated on configuration changes (e.g. HDMI resolution switch); player instances must survive this inside a `ViewModel`.
- **Forgetting to persist position** — on TV, pressing the Home button may kill the process within seconds; do not wait for `onDestroy` to save position — write it in `onPause`.
- **Missing `useController = false`** — when building a custom overlay, set `useController = false` on `PlayerView` or `PlayerSurface` to prevent the built-in controller from appearing on top of your UI and stealing focus.

## References

- **Documentation:** [TV Playback guide](https://developer.android.com/training/tv/playback)
- **Documentation:** [Media3 ExoPlayer guide](https://developer.android.com/media/media3/exoplayer)

## See also

For the foundational ExoPlayer configuration — DRM, track selection, adaptive streaming, and playlist management — see the `media3-exoplayer` sibling skill. For background playback architecture using `MediaSessionService` and system media controls, see `media3-session`. For TV browse and navigation shell built with `androidx.tv:tv-compose`, see the `tv-compose` skill when available.
