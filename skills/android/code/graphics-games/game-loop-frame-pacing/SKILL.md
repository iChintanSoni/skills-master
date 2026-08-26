---
name: game-loop-frame-pacing
description: "Running a real-time render loop on Android — Choreographer and vsync, Android 13 frame timelines, the AGDK Frame Pacing library (Swappy) for OpenGL ES and Vulkan, presentation timestamps, setFrameRate and adaptive refresh rate, choosing between SurfaceView, GLSurfaceView, and TextureView, frame-time budgeting, ADPF performance hints, and reading jank in Perfetto traces. Use when a game or custom renderer stutters, when porting a fixed-timestep loop to Android, when picking a render target surface, or when deciding what frame rate to request on a multi-refresh-rate display."
globs:
  - "**/*.kt"
  - "**/*.cpp"
  - "**/*.h"
tags: []
x-skills-master:
  domain: android
  class: code
  category: graphics-games
  platforms: ["android"]
  requires: { android: "24", kotlin: "2.2" }
  pairs_with: [vulkan-rendering, adpf-thermal-performance, agdk-game-activity]
  sources:
    - https://developer.android.com/games/develop/gameloops
    - https://developer.android.com/games/sdk/frame-pacing
    - https://developer.android.com/media/optimize/performance/frame-rate
  snapshot_date: "2026-08-25"
  stability: stable
  version: 1.0.0
---

## When to use

Use this skill for anything that draws continuously rather than in response to input: a game, a simulation, a video-adjacent renderer, or a live visualisation. It covers how to decide *when* to produce a frame, what surface to produce it into, and how to prove in a trace that the frames are landing on time.

It is not about app UI jank from recomposition or layout — that lives in `performance-profiling`.

## Core guidance

### The loop is time-driven, not frame-driven

The naive loop — advance one frame, render, sleep — is wrong on Android and always has been. Displays refresh at 60, 90, 120, 144 Hz and increasingly at a rate that changes mid-session. Produce frames too fast and buffers stuff up, adding latency; too slow and SurfaceFlinger re-presents the previous frame.

Two rules follow:

1. **Advance game state by elapsed time**, never by a fixed frame increment.
2. **Take that time from the vsync timestamp the system hands you**, not from `System.currentTimeMillis()` when your code happened to run.

The documented approaches, best first:

- **Android Frame Pacing library (Swappy)** — the official recommendation. It knows the swap interval, the refresh rate, and the fence state, and it paces for you.
- **`Choreographer`** — post a callback, get an accurate vsync time even if the callback ran late, use that as the clock.
- **Queue stuffing** — swap as fast as possible and let a full BufferQueue block you. Simple, works with `GLSurfaceView`, but delta times are noisy (the first few swaps against an empty queue come back near-instantly) and it costs latency.

### Choreographer

```kotlin
private class RenderLoop(private val renderer: Renderer) : Choreographer.FrameCallback {
    private var lastFrameNanos = 0L

    fun start() = Choreographer.getInstance().postFrameCallback(this)

    override fun doFrame(frameTimeNanos: Long) {
        // Re-post first: the callback fires once, not continuously.
        Choreographer.getInstance().postFrameCallback(this)

        if (lastFrameNanos != 0L) {
            val deltaSeconds = (frameTimeNanos - lastFrameNanos) / 1_000_000_000.0f
            // Bound the delta so a stall does not teleport the simulation.
            renderer.advance(deltaSeconds.coerceAtMost(0.05f))
        }
        lastFrameNanos = frameTimeNanos
        renderer.draw()
    }
}
```

- `frameTimeNanos` is on the `System.nanoTime()` timebase and marks when the frame *started*, so it stays consistent even when your callback is delivered late.
- The callback is one-shot. Re-post at the top of `doFrame`, before your own work, so a slow frame does not also delay the next request.
- Detect lateness explicitly: if the wall clock is already well past `frameTimeNanos` plus a vsync interval, skip rendering this frame and let the simulation catch up on the next one. Dropping a frame while animation keeps advancing at a constant rate is far less visible than stuttering.
- Natively: `AChoreographer_getInstance` (API 24) and `AChoreographer_postFrameCallback64` (API 29). The 32-bit `AChoreographer_postFrameCallback` is deprecated.

### Frame timelines (API 33)

From Android 13 the system offers **several** candidate presentation times per frame rather than one. Post via `Choreographer.postVsyncCallback` and read `Choreographer.FrameData`, or natively `AChoreographer_postVsyncCallback` with the `AChoreographerFrameCallbackData_*` accessors (`getFrameTimelinesLength`, `getPreferredFrameTimelineIndex`, `getFrameTimelineVsyncId`, `getFrameTimelineExpectedPresentationTimeNanos`, `getFrameTimelineDeadlineNanos`) — all API 33.

The point is to let a renderer that knows it cannot make the next deadline *choose* a later timeline and tell SurfaceFlinger, instead of silently missing and being counted as jank. `AChoreographer_registerRefreshRateCallback` (API 30) notifies you when the refresh rate itself changes.

### The Frame Pacing library (Swappy)

Part of AGDK, shipped as the `games-frame-pacing` library, with an OpenGL ES variant and a Vulkan variant. It uses presentation timestamps (`EGL_ANDROID_presentation_time` on GL, `VK_GOOGLE_display_timing` on Vulkan) so frames are not presented early, and sync fences (`EGL_KHR_fence_sync`, `VkFence`) to inject waits that stop the buffer queue from stuffing. Internally it prefers the NDK Choreographer (API 24+) and falls back to the Java one.

- **GL:** initialise with `SwappyGL_init`, then swap through the library instead of calling `eglSwapBuffers` yourself; tear down with `SwappyGL_destroy`.
- **Vulkan:** include `swappy/swappyVk.h`, add the extensions the library needs with `SwappyVk_determineDeviceExtensions` *before* creating the device, then `SwappyVk_initAndGetRefreshCycleDuration`, `SwappyVk_setWindow`, `SwappyVk_setSwapIntervalNS`, and replace `vkQueuePresentKHR` with `SwappyVk_queuePresent`. Clean up with `SwappyVk_destroySwapchain` and `SwappyVk_destroyDevice`.
- Modes: fix the swap interval when you know your target rate; enable **auto swap interval** to let the library pick from measured CPU and GPU times; enable **auto pipeline mode** to switch between pipelined (CPU and GPU split across vsync boundaries — higher throughput) and non-pipelined (lower, more predictable input latency).
- `SwappyGL_enableStats` / `SwappyVk_enableStats` expose `SwappyStats` histograms — queue wait, requested-versus-actual presentation, interval between consecutive frames, and CPU-start-to-present. These are the fastest way to prove pacing works.
- Unity has had this built in since 2019.2 (*Optimized Frame Pacing* under Android player settings); Unreal and custom engines integrate manually.

### Choosing a frame rate

A device that supports 60 and 90 Hz can cleanly present 90, 60, 45, or 30 fps; add 120 Hz and 40 fps becomes available too. A title that cannot hold 60 is usually better at a rock-solid 45 than an oscillating 50.

- Tell the system your target with `Surface.setFrameRate(float, int)` / `(float, int, int)` (API 30), `ANativeWindow_setFrameRate` (API 30) or `ANativeWindow_setFrameRateWithChangeStrategy` (API 31), or `SurfaceControl.Transaction.setFrameRate`.
- Use `Surface.FRAME_RATE_COMPATIBILITY_DEFAULT` for games; `FRAME_RATE_COMPATIBILITY_FIXED_SOURCE` is for video that will pull-down. Choose `CHANGE_FRAME_RATE_ONLY_IF_SEAMLESS` unless a visible mode switch is acceptable — `CHANGE_FRAME_RATE_ALWAYS` also depends on the user's *Match content frame rate* setting.
- Call it **once**, not per frame, and pass the exact rate (29.97, not 30). The system may decline to switch; your loop must still be correct at whatever rate it gets.
- These calls do not throttle you. They only change the display mode, which in turn changes Choreographer timing and buffer-release cadence.

### Adaptive refresh rate

From Android 15 QPR1 on capable hardware, the panel rate tracks content instead of pinning to the maximum. Check with `Display.hasArrSupport()`. Views vote through `View.setRequestedFrameRate` (a float, or a `REQUESTED_FRAME_RATE_CATEGORY_*` constant) and Compose through `Modifier.preferredFrameRate` (Compose 1.9+); `Window.setFrameRateBoostOnTouchEnabled` and `Window.setFrameRatePowerSavingsBalanced` control the window-level policy. Explicit rates set on a `SurfaceView` or `TextureView` are respected. The practical consequence for a game loop: **the vsync interval is not a constant**, so derive it per frame rather than caching 16.667 ms.

### Render target

| Surface | Use it when |
|---|---|
| `SurfaceView` | Default for games and any continuous renderer |
| `GLSurfaceView` | GLES rendering where you want the EGL context, render thread, and lifecycle handled for you |
| `TextureView` | The output must be animated, rotated, alpha-blended, or transformed like a normal View |

`SurfaceView` gets its own layer composited by SurfaceFlinger rather than by the app, which is why it can be driven from a separate thread, uses less power on many devices, gives more accurate frame timing, and is the path for HDR and DRM-protected output. `TextureView` buys better alpha and rotation handling at the cost of going through the app's own rendering. Whichever you pick, **render on a dedicated thread** — never the UI thread.

### Budget and headroom

16 ms at 60 Hz, 11 ms at 90, 8 ms at 120 — and that budget covers your CPU frame *and* the GPU work it queues. Feed the scheduler with ADPF: `PerformanceHintManager.createHintSession` (API 31) for your render and game threads, `updateTargetWorkDuration` for the budget, `reportActualWorkDuration` every frame, and `setPreferPowerEfficiency` (Android 15) on threads that do not need boost. Watch thermals with `getThermalHeadroom` and `addThermalStatusListener` and shed work — resolution, effects, target rate — before the system throttles you.

## Platform notes

- **Lifecycle.** Stop the loop in `onPause`, remove the Choreographer callback, and drop the surface. `Surface` is destroyed and recreated across pause/resume and configuration changes; resuming into a stale surface is a classic black-frame bug.
- **Android vitals blind spot.** Apps rendering through Vulkan, OpenGL, Unity, or Unreal may not report frame-time statistics to Android vitals. Check what the platform sees with `adb shell dumpsys gfxinfo <package>` and instrument your own metrics.
- **Jank thresholds.** The platform classifies 16–700 ms as a slow frame, 700 ms–5 s as a frozen frame, and beyond 5 s as an ANR. No frame should ever exceed 700 ms.
- **Reading a trace.** Use Perfetto's FrameTimeline data source: it names the frame that missed and attributes the miss to the app, the RenderThread, or SurfaceFlinger. Raw `Choreographer` slices only tell you when your callback ran, not whether the frame landed.
- **Native entry point.** `GameActivity` (`androidx.games:games-activity`) is the recommended host for a native loop: it renders into a `SurfaceView`, extends `AppCompatActivity`, and delivers input through `android_input_buffer` rather than `InputQueue`.

## Pitfalls

- **Using wall-clock time instead of `frameTimeNanos`.** Jitter in callback delivery becomes jitter in the simulation, which is visible even when no frame is dropped.
- **Unbounded delta time.** A GC pause or a resume produces a huge delta that teleports physics through walls. Clamp it.
- **Re-posting the Choreographer callback at the end of `doFrame`.** A slow frame then also delays the request for the next one, compounding the stall.
- **Hardcoding 16.667 ms.** Wrong on 90/120 Hz panels and wrong again under adaptive refresh rate. Read the actual interval.
- **Calling `setFrameRate` every frame.** It is a mode-change request, not a throttle. Call it when your target changes.
- **Assuming the requested rate was granted.** The system may refuse. Keep the loop correct at any rate.
- **`Thread.sleep` as the pacing mechanism.** Sleep resolution drifts and varies with the device's power state. Pace against vsync.
- **Rendering on the UI thread.** Any View work — even in another part of the app — then delays your frames.
- **Shipping without frame statistics.** Pacing bugs are invisible in averages. Look at the histogram or the FrameTimeline track, not the mean frame time.

## References

- **Documentation:** [Learn about rendering in game loops](https://developer.android.com/games/develop/gameloops)
- **Documentation:** [Frame Pacing library](https://developer.android.com/games/sdk/frame-pacing)
- **Documentation:** [Frame rate — setFrameRate API](https://developer.android.com/media/optimize/performance/frame-rate)
- **Documentation:** [Optimize frame rate with adaptive refresh rate](https://developer.android.com/develop/ui/views/animations/adaptive-refresh-rate)
- **Documentation:** [Android Dynamic Performance Framework](https://developer.android.com/games/optimize/adpf)
- **API Reference:** [Choreographer](https://developer.android.com/reference/android/view/Choreographer)
- **API Reference:** [NDK Choreographer](https://developer.android.com/ndk/reference/group/choreographer)
- **AOSP:** [SurfaceView and GLSurfaceView](https://source.android.com/docs/core/graphics/arch-sv-glsv)

## See also

- `vulkan-rendering` for the renderer this loop drives, including the swapchain that `SwappyVk_queuePresent` replaces `vkQueuePresentKHR` for.
- `performance-profiling` for capturing and reading the Perfetto traces referenced above, and for jank that originates in app UI rather than the render loop.
- `compose-graphics` when the "loop" is really an animated composable and Compose's own frame clock is sufficient.
