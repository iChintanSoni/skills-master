---
name: picture-in-picture
description: Covers Android Picture-in-Picture (PiP) mode using PictureInPictureParams — entering PiP on home/pause, configuring aspect ratio and source-rect hints, the Compose pipLayout Modifier, auto-enter behavior, custom remote actions, and adapting UI when the window shrinks to PiP size. Use when building video players, video calls, navigation, or any feature that should continue playing or displaying content in a floating overlay while the user switches to another app.
---

## When to use

Use this skill whenever a feature plays video, hosts a video call, or shows live navigation that should keep running in a floating overlay after the user presses Home or switches apps. Typical cases include media players, video-conferencing, live maps, and fitness-tracking UIs. It does not cover multi-window split-screen, floating windows via `WindowManager`, or Android 8 (API 26) legacy PiP on TV — those need separate treatment.

PiP is available from API 26 (Android 8.0) but the Compose `pipLayout` modifier and `addSourceRectHint` on `PictureInPictureParams` arrived in API 31+ and 32+ respectively. Use runtime checks to gate newer features.

## Core guidance

**Declaring PiP support**

- Add `android:supportsPictureInPicture="true"` to the `<activity>` element in the manifest.
- Set `android:configChanges="screenSize|smallestScreenSize|screenLayout|orientation"` on the same activity so the system does not recreate it when entering or exiting PiP — recreation causes a visible black-flash and discards player state.

**Building PictureInPictureParams**

- Always provide an explicit `setAspectRatio` with a `Rational`. The system enforces valid ranges (roughly 0.418–2.39 based on device); clamp to a safe range such as `Rational(16, 9)` for landscape video or `Rational(9, 16)` for portrait.
- Provide `setSourceRectHint(Rect)` (API 26+) — the system uses this rectangle to animate the entering and exiting transition from the video surface to the PiP window. Update it whenever the layout changes (e.g., full-screen toggle, IME shown).
- On API 31+, call `setAutoEnterEnabled(true)` so the system automatically enters PiP when the user swipes home. This eliminates the need to call `enterPictureInPictureMode` manually in `onUserLeaveHint`.
- On API 32+, call `setSeamlessResizeEnabled(false)` for non-video content (e.g., maps or calls) where seamless resize looks wrong; leave it `true` (default) for video.

**Entering PiP imperatively**

- Call `activity.enterPictureInPictureMode(params)` from `onUserLeaveHint` on API 26–30, or whenever a UI event (e.g., a "minimize" button) should trigger PiP.
- Update params at any time via `activity.setPictureInPictureParams(params)` — do this on layout changes so the source-rect hint stays accurate.

**Compose — pipLayout modifier (API 31+)**

- Apply `Modifier.pipLayout(pipParams = params, clipBounds = true)` to the composable surface (e.g., the video player container). This automatically keeps the source-rect hint synchronized with the composable's layout rect without manual coordinate translation.
- Pass the same `PictureInPictureParams` object used for `enterPictureInPictureMode`; the modifier calls `setPictureInPictureParams` internally on layout.
- Pair with `rememberUpdatedState` or `derivedStateOf` to recompute params when aspect ratio changes (e.g., video crop mode toggle).

**Remote actions**

- Supply up to three `RemoteAction` objects via `setActions(listOf(...))` on `PictureInPictureParams`. Each maps to a button rendered inside the PiP window.
- Back each action with a `PendingIntent` pointing at a `BroadcastReceiver` in the same process. Use `FLAG_IMMUTABLE` unless the receiver needs mutable extras.
- Reconstruct the params and call `setPictureInPictureParams` whenever playback state changes (e.g., play → pause) to swap the action icon and title without re-entering PiP.

**Adapting UI for PiP mode**

- Observe `Activity.isInPictureInPictureMode` or, in Compose, collect `LocalActivity.current.isInPictureInPictureMode` as a `State` using a `DisposableEffect` on `Lifecycle.Event.ON_RESUME` to recompose on transitions.
- Hide controls, overlays, and navigation chrome when `isInPictureInPicture == true`; the PiP window is tiny and tap targets are inaccessible.
- Use `Activity.onPictureInPictureModeChanged` (or override the lifecycle callback) to pause/resume UI-only work such as analytics timers, while keeping the media session alive.

```kotlin
// PlayerActivity.kt — Compose + PiP wiring
class PlayerActivity : ComponentActivity() {

    private fun buildPipParams(sourceRect: Rect, isPlaying: Boolean): PictureInPictureParams {
        val actions = listOf(
            RemoteAction(
                Icon.createWithResource(this, if (isPlaying) R.drawable.ic_pause else R.drawable.ic_play),
                getString(if (isPlaying) R.string.pause else R.string.play),
                getString(if (isPlaying) R.string.pause else R.string.play),
                PendingIntent.getBroadcast(
                    this, 0,
                    Intent(ACTION_TOGGLE_PLAY).setPackage(packageName),
                    PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
                )
            )
        )
        return PictureInPictureParams.Builder()
            .setAspectRatio(Rational(16, 9))
            .setSourceRectHint(sourceRect)
            .setActions(actions)
            .apply { if (Build.VERSION.SDK_INT >= 31) setAutoEnterEnabled(true) }
            .build()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            val isInPip = rememberIsInPipMode()
            VideoPlayerScreen(
                isInPip = isInPip,
                onPipParamsReady = { rect, playing ->
                    setPictureInPictureParams(buildPipParams(rect, playing))
                }
            )
        }
    }
}

@Composable
fun rememberIsInPipMode(): Boolean {
    val activity = LocalContext.current as ComponentActivity
    var isInPip by remember { mutableStateOf(activity.isInPictureInPictureMode) }
    DisposableEffect(activity) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) {
                isInPip = activity.isInPictureInPictureMode
            }
        }
        activity.lifecycle.addObserver(observer)
        onDispose { activity.lifecycle.removeObserver(observer) }
    }
    return isInPip
}
```

## Platform notes

**Large-screen (tablets and foldables)**

- On foldables, the PiP window may move to a different display region when the device unfolds. The system handles repositioning, but update the source-rect hint in `onPictureInPictureModeChanged` so the exit animation is accurate.
- Multi-resume (API 30+) means multiple apps can be resumed simultaneously. The PiP window is always resumed; ensure the media session is correctly managed with `AudioFocus` so audio from the PiP and the foreground app do not both play.

**Android TV**

- TV does not support PiP in the same sense as phones; the TV PiP API (`PictureInPictureActivity` extension) is deprecated in favor of full multi-window. Do not rely on `enterPictureInPictureMode` on TV devices — check `PackageManager.hasSystemFeature(PackageManager.FEATURE_PICTURE_IN_PICTURE)` at runtime.

**API level matrix**

- API 26–30: Manual `enterPictureInPictureMode` in `onUserLeaveHint`; `setSourceRectHint` available.
- API 31+: `setAutoEnterEnabled(true)` removes the need for the manual call; `pipLayout` Compose modifier available.
- API 32+: `setSeamlessResizeEnabled` and `setExpandedAspectRatio` for expanded PiP available.
- API 34+: `setTitle` and `setSubtitle` available on `PictureInPictureParams` for accessibility.

## Pitfalls

- Omitting `android:configChanges` causes activity recreation on PiP transitions, which destroys and restores the player — users see a black flash and playback resets.
- Calling `enterPictureInPictureMode` without providing `PictureInPictureParams` results in a system-chosen aspect ratio that usually looks wrong for video content; always supply params.
- Providing a `sourceRectHint` in the wrong coordinate space (e.g., local composable coordinates instead of window/screen coordinates) causes a broken entry animation. The `pipLayout` modifier handles this automatically; when setting it manually, translate using `View.getLocationOnScreen` or `LayoutCoordinates.positionInWindow`.
- Leaving playback controls visible in PiP mode — the window is too small for tap targets to be useful and the controls obscure the content. Always hide overlays when `isInPictureInPictureMode` is `true`.
- Updating actions (e.g., play/pause toggle) by re-calling `enterPictureInPictureMode` — doing so re-triggers the entry animation. Use `setPictureInPictureParams` to update actions in place.
- Not handling the `onPictureInPictureModeChanged` callback to pause foreground-only work (e.g., camera preview, analytics) leads to resource waste or incorrect behavior while PiP is active.
- Providing an aspect ratio outside the system-enforced bounds silently clamps to the nearest allowed value; the resulting PiP window may not match the video content. Validate ratios before passing them.
- Using `FLAG_MUTABLE` for PiP `RemoteAction` pending intents when the receiver does not need mutable extras unnecessarily weakens security; prefer `FLAG_IMMUTABLE`.

## References

- **Documentation:** [Picture-in-Picture support](https://developer.android.com/develop/ui/views/picture-in-picture)
- **Documentation:** [Picture-in-Picture in Compose](https://developer.android.com/develop/ui/compose/system/picture-in-picture)

## See also

The `compose-window-insets` skill covers safe-area insets that affect the player layout before and after entering PiP. For media session and audio-focus management that should remain active during PiP, see the `media-player` skill. For foreground-service considerations when keeping a media service alive while in PiP, see the `foreground-services` skill. For multi-window and foldable layout adaptation that complements PiP on large screens, see the `adaptive-layouts` skill.
