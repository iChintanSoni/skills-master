---
name: media-projection
description: Covers screen capture with MediaProjection API — Use when building screen recording, live-streaming, or mirroring features that require capturing display output to a Surface or VirtualDisplay on Android 16+.
globs:
  - "**/*.kt"
tags: [media, screen-capture, foreground-service, virtual-display]
x-skills-master:
  domain: android
  class: code
  category: media-camera-ml
  platforms: ["android", "large-screen"]
  requires: {android: "16", kotlin: "2.2"}
  pairs_with: []
  sources:
    - https://developer.android.com/media/grow/media-projection
    - https://developer.android.com/about/versions/14/changes/fgs-types-required
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Use this skill whenever you need to capture the device screen — for screen recording to a file, live-streaming to a remote server, device mirroring over a local network, or capturing app content for accessibility or automation tools. The skill covers the full lifecycle: requesting user consent via the system dialog, launching a typed foreground service, creating a `VirtualDisplay` backed by a `Surface`, and tearing everything down cleanly when the session ends.

## Core guidance

### Permissions and manifest declarations

- Declare `FOREGROUND_SERVICE` and `FOREGROUND_SERVICE_MEDIA_PROJECTION` permissions in the manifest.
- Add `android:foregroundServiceType="mediaProjection"` to your `<service>` element — required since Android 14 (API 34); the OS refuses to start the service otherwise.
- No runtime permission for `RECORD_AUDIO` or `WRITE_EXTERNAL_STORAGE` is granted automatically — request them separately before starting capture if needed.

### Requesting capture consent

- Launch the consent dialog via `MediaProjectionManager.createScreenCaptureIntent()` and an `ActivityResultLauncher`; never call `startActivityForResult` directly.
- The result `Intent` from the consent dialog is single-use. Cache it only long enough to pass it into the foreground service; do not retain it across configuration changes or process restarts.
- On Android 14+, pass the consent `Intent` to the foreground service before calling `MediaProjectionManager.getMediaProjection()` — the service must already be running in the foreground at the moment `getMediaProjection` is called.

### Foreground service setup

- Start the service with `startForegroundService()` then immediately call `startForeground(id, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION)` inside `onStartCommand` to satisfy the five-second rule.
- Build a persistent notification with a "Stop" action so the user can always revoke capture.
- The service, not the Activity, should own the `MediaProjection` and `VirtualDisplay` references.

### Creating and using a VirtualDisplay

- Choose display metrics that match the real display — use `WindowMetrics` (not the deprecated `DisplayMetrics`) to get the current bounds on large-screen or foldable devices.
- Pass the surface from a `MediaRecorder`, `ImageReader`, or `SurfaceTexture` as the rendering target.
- Use `DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR` for mirroring; omit it for private capture where system UI should not appear.
- Register a `MediaProjection.Callback` to detect when the user revokes access from the system tile — stop the service from there.

```kotlin
class ScreenCaptureService : Service() {

    private var mediaProjection: MediaProjection? = null
    private var virtualDisplay: VirtualDisplay? = null
    private var mediaRecorder: MediaRecorder? = null

    private val projectionCallback = object : MediaProjection.Callback() {
        override fun onStop() {
            stopCapture()
            stopSelf()
        }
    }

    fun startCapture(resultCode: Int, data: Intent, metrics: DisplayMetrics) {
        val mgr = getSystemService(MediaProjectionManager::class.java)
        mediaProjection = mgr.getMediaProjection(resultCode, data).also { proj ->
            proj.registerCallback(projectionCallback, Handler(Looper.getMainLooper()))
        }

        mediaRecorder = MediaRecorder(this).apply {
            setVideoSource(MediaRecorder.VideoSource.SURFACE)
            setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
            setVideoEncoder(MediaRecorder.VideoEncoder.H264)
            setVideoSize(metrics.widthPixels, metrics.heightPixels)
            setVideoFrameRate(30)
            setOutputFile(/* file path */)
            prepare()
        }

        virtualDisplay = mediaProjection?.createVirtualDisplay(
            "ScreenCapture",
            metrics.widthPixels,
            metrics.heightPixels,
            metrics.densityDpi,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
            mediaRecorder!!.surface,
            null, null
        )

        mediaRecorder?.start()
    }

    private fun stopCapture() {
        runCatching { mediaRecorder?.stop() }
        mediaRecorder?.release()
        virtualDisplay?.release()
        mediaProjection?.unregisterCallback(projectionCallback)
        mediaProjection?.stop()
        mediaProjection = null
    }

    override fun onBind(intent: Intent?) = null
}
```

### Stopping cleanly

- Always call `VirtualDisplay.release()` before `MediaProjection.stop()` to avoid encoder errors.
- Wrap `MediaRecorder.stop()` in `runCatching` — it throws if no frames were recorded.
- Remove the `MediaProjection.Callback` before calling `stop()` to prevent a recursive stop loop.
- Call `stopForeground(STOP_FOREGROUND_REMOVE)` and `stopSelf()` from the service after releasing resources.

### Large-screen and foldable considerations

- Re-create the `VirtualDisplay` when the fold state or display configuration changes; subscribe to `Activity.onConfigurationChanged` or use a `WindowInfoTracker` flow and send an updated size to the service via a bound service or broadcast.
- On secondary displays, use the specific `Display` id from `DisplayManager` rather than assuming `Display.DEFAULT_DISPLAY`.

## Platform notes

- **API 34+ (Android 14):** `FOREGROUND_SERVICE_MEDIA_PROJECTION` is enforced at runtime — missing the manifest permission or wrong service type causes an immediate `SecurityException`.
- **API 35+ (Android 15):** The partial-screen capture variant (capturing a single window rather than the whole display) was promoted from experimental; use `MediaProjectionManager.createScreenCaptureIntent(MediaProjectionConfig)` with `MediaProjectionConfig.createConfigForUserChoice()` to let the user choose scope.
- **API 16 (Android 16, minimum for this skill):** No additional breaking changes beyond the API 35 surface; the above guidance applies in full.
- On foldable devices, the reported display size can change mid-session without a traditional configuration change — always use `WindowMetrics` from `WindowManager` inside the service context, not values captured at consent time.

## Pitfalls

- **Single-use consent intent:** Reusing the `Intent` from the consent result across sessions causes a `SecurityException`. Request a fresh consent dialog for every new capture session.
- **Missing foreground type:** Omitting `android:foregroundServiceType="mediaProjection"` in the manifest silently fails on older APIs and crashes hard on API 34+.
- **Calling `getMediaProjection` before the service is in the foreground:** The service must have called `startForeground` with the correct type before `getMediaProjection` is invoked; reverse order causes an `IllegalStateException`.
- **Leaking the MediaProjection in the Activity:** Holding `MediaProjection` in a `ViewModel` or `Activity` field leads to leaks on rotation; the service is the correct owner.
- **No callback for user revocation:** Without registering `MediaProjection.Callback`, the `VirtualDisplay` silently stops receiving frames when the user taps "Stop" in the system notification shade or quick-tile, leaving the service running indefinitely.
- **Encoding errors on zero-frame stop:** Calling `MediaRecorder.stop()` immediately after `start()` with no recorded frames throws; guard with a frame-count check or `runCatching`.
- **Wrong density on foldables:** Passing a stale density value from before a fold event produces a stretched or blurry virtual display; re-query `WindowMetrics` on every configuration change.

## References

- **Documentation:** [MediaProjection guide](https://developer.android.com/media/grow/media-projection)
- **Documentation:** [Foreground service types (Android 14 changes)](https://developer.android.com/about/versions/14/changes/fgs-types-required)

## See also

The `avfoundation-capture` skill covers the iOS analogue for screen and camera capture. For encoding recorded output, see the `core-image` skill for GPU-accelerated frame processing. If the capture feeds a machine-learning pipeline, the `core-ml` skill describes inference integration patterns. For notification construction required by the foreground service, consult the `user-notifications` skill.
