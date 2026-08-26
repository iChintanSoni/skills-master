---
name: adpf-thermal-performance
description: Covers the Android Dynamic Performance Framework for games — reading thermal status and headroom from PowerManager, driving CPU scheduling with PerformanceHintManager hint sessions, reading CPU and GPU headroom from SystemHealthManager, honouring the Game Mode API and reporting through the Game State API with GameManager, and degrading render fidelity smoothly under thermal pressure. Use when a game throttles during long sessions, misses its frame budget on mid-tier hardware, or needs to hit the Play Console Slow Sessions bar.
---

## When to use

Reach for ADPF when a game runs *fine for five minutes and badly for thirty*: frame times that creep up as the device heats, throttling on mid-tier SoCs, battery complaints, or a Play Console Slow Sessions rate that will not come down. It is the API surface for negotiating with the platform's power and thermal governors rather than guessing at them — thermal state, CPU/GPU headroom, workload hints, and the user's chosen game mode.

This is the sustained-performance treatment. For finding where the time goes in the first place — traces, heap dumps, jank attribution, startup — use `performance-profiling`; ADPF tells you *how much budget you have*, profiling tells you *what spent it*.

## Core guidance

### Read thermal state, then act on it

Two signals, with different shapes. `PowerManager.getCurrentThermalStatus()` (API 29) returns a coarse ladder — `THERMAL_STATUS_NONE`, `LIGHT`, `MODERATE`, `SEVERE`, `CRITICAL`, `EMERGENCY`, `SHUTDOWN` — and `addThermalStatusListener(...)` / `removeThermalStatusListener(...)` push changes to you. `getThermalHeadroom(forecastSeconds)` (API 30) is the useful one: a normalized forecast where 1.0 means throttling is imminent, so you can shed load *before* the governor does it for you.

```kotlin
class ThermalGovernor(context: Context) : PowerManager.OnThermalStatusChangedListener {
    private val power = context.getSystemService(PowerManager::class.java)
    private var lastHeadroomAt = 0L
    private var headroom = Float.NaN

    fun start() = power.addThermalStatusListener(this)
    fun stop() = power.removeThermalStatusListener(this)

    override fun onThermalStatusChanged(status: Int) {
        // SEVERE and above means the governor is already cutting clocks.
        if (status >= PowerManager.THERMAL_STATUS_SEVERE) quality.dropOneStep()
    }

    // Call once per frame; the sampling gate is enforced here, not by the caller.
    fun sampleHeadroom(): Float {
        val now = SystemClock.elapsedRealtime()
        if (now - lastHeadroomAt >= 10_000) {
            lastHeadroomAt = now
            headroom = power.getThermalHeadroom(10)   // forecast 10 s ahead
        }
        return headroom
    }
}
```

Two hard rules: **do not call `getThermalHeadroom()` more than once every 10 seconds** — it returns `NaN` if you do — and **treat `NaN` as "unsupported", not as zero**. Devices without the API return `NaN` permanently, and a headroom-driven quality ladder that reads `NaN` as 0 will pin the game to maximum fidelity forever. Sample from one thread only, so the rate limit is not violated by accident. On API 35+, `getThermalHeadroomThresholds()` returns the device's own headroom-to-status mapping, which beats hardcoding your own break points. The NDK mirrors all of this as `AThermal_*` functions in `thermal.h` for native game loops.

### Hint sessions: tell the scheduler what the frame costs

`PerformanceHintManager` (API 31) lets you declare a target frame time and report the actual one, so the scheduler can place your threads on the right cores at the right clocks instead of inferring intent from utilization. This is the single highest-leverage ADPF API for a game.

```kotlin
val hints = context.getSystemService(PerformanceHintManager::class.java)
val targetNanos = 16_666_666L                                    // 60 fps budget
val session = hints?.createHintSession(
    intArrayOf(Process.myTid(), renderThreadTid),                // the threads that own the frame
    targetNanos,
)

// Once per frame, after the frame's CPU work completes:
session?.reportActualWorkDuration(frameCpuNanos)
// When the target changes (refresh-rate switch, quality change):
session?.updateTargetWorkDuration(newTargetNanos)
```

- Register **the threads that actually produce the frame** — game thread, render thread, and any per-frame job threads. Adding unrelated worker threads dilutes the signal.
- Report **every frame**. A session that stops reporting stops helping.
- `setThreads(int[])` (API 34) replaces the thread list when you spawn render threads after session creation.
- `setPreferPowerEfficiency(true)` (API 35) tells the system these threads may be scheduled for efficiency over speed — the right call for menus, cutscenes, and idle states.
- `reportActualWorkDuration(WorkDuration)` (API 35) reports the CPU and GPU split separately instead of a single number, which lets the system distinguish a CPU-bound frame from a GPU-bound one.
- Close the session when the game stops rendering.

Native games use the NDK equivalents: `APerformanceHint_getManager`, `APerformanceHint_createSession`, `APerformanceHint_updateTargetWorkDuration`, `APerformanceHint_reportActualWorkDuration` (and `…_reportActualWorkDuration2` with an `AWorkDuration`), `APerformanceHint_setThreads`, `APerformanceHint_setPreferPowerEfficiency`, `APerformanceHint_closeSession`. Newer additions worth knowing: `APerformanceHint_createSessionUsingConfig` with an `ASessionCreationConfig` (graphics-pipeline mode, automatic timing), `APerformanceHint_notifyWorkloadIncrease` / `…Spike` / `…Reset` to warn the system before a level load or effects-heavy set piece, and `APerformanceHint_setNativeSurfaces`. Guard optional features with `APerformanceHint_isFeatureSupported`.

### CPU and GPU headroom

`SystemHealthManager.getCpuHeadroom()` and `getGpuHeadroom()` (API 36, Android 16) estimate remaining CPU and GPU capacity, and `CpuHeadroomParams` / `GpuHeadroomParams` tune the sampling window and pick average versus minimum. Use them to answer *which* resource is the bottleneck — cut draw calls and shader cost when GPU headroom is low, cut simulation and job counts when CPU headroom is low. Each call performs at least one synchronous binder transaction that can exceed 1 ms, so sample on a background thread and never on the render thread.

### Game Mode and Game State

The Game Mode API surfaces the *user's* preference. Declare the app a game and ship a config:

```xml
<application android:appCategory="game">
    <meta-data android:name="android.game_mode_config"
               android:resource="@xml/game_mode_config" />
</application>
```

```xml
<!-- res/xml/game_mode_config.xml -->
<game-mode-config xmlns:android="http://schemas.android.com/apk/res/android"
    android:supportsBatteryGameMode="true"
    android:supportsPerformanceGameMode="true" />
```

Then read `GameManager.getGameMode()` (API 31; broadly available from Android 13) and branch: `GAME_MODE_PERFORMANCE` unlocks the higher frame-rate target and richer effects, `GAME_MODE_BATTERY` caps the frame rate and trims post-processing, `GAME_MODE_STANDARD` is your default, and `GAME_MODE_UNSUPPORTED` means the device has nothing to say. Declaring support is also what keeps OEM *interventions* (resolution downscaling, FPS throttling applied to un-updated games) from being applied blind. Test each branch with `adb shell cmd game mode performance <package>`.

The Game State API runs the other direction — the game tells the system what it is doing. `GameManager.setGameState(GameState(isLoading, mode))` (API 33) with `GameState.MODE_GAMEPLAY_UNINTERRUPTIBLE` during a boss fight or online match, `MODE_GAMEPLAY_INTERRUPTIBLE` during exploration, and `MODE_NONE` in menus, plus `isLoading = true` across level loads so the platform can front-load I/O and CPU. It costs almost nothing to call and gives the scheduler information it cannot otherwise obtain.

### Degrade fidelity like an engineer, not a switch

- Build **granular, independent levers** — shadow resolution, render scale, particle budget, post-processing passes, LOD distance — not three monolithic Low/Medium/High presets. Thermal response needs half-steps.
- **Ramp over several frames.** An instant resolution drop is more noticeable than the throttling it prevents.
- Move down early and **up slowly**, with hysteresis. Oscillating between quality tiers looks worse than sitting one tier low.
- Give players an **opt-out toggle** for dynamic adjustment, and never override a manual quality choice silently.
- Frame rate is usually worth more than pixels: prefer render-scale and effect cuts over dropping the target frame rate.

### Verify against the Play bar

Android vitals defines a **slow frame** as one not presented within 50 ms of the previous frame (20 FPS), and a **slow session** as one where more than 25% of frames are slow; a second metric uses a 34 ms (30 FPS) target. Measurement comes from SurfaceFlinger, covers OpenGL and Vulkan surfaces, is games-only, and starts one minute in — which is exactly the window where thermal throttling begins. Sustained-load behaviour is therefore a distribution concern, not just a polish concern.

## Platform notes

- **API floors:** thermal status and listeners API 29; `getThermalHeadroom` API 30; fixed performance mode API 30; `PerformanceHintManager` and `GameManager.getGameMode()` API 31; `Session.setThreads` API 34; `GameManager.setGameState` API 33; `setPreferPowerEfficiency`, `reportActualWorkDuration(WorkDuration)`, and `getThermalHeadroomThresholds` API 35; `SystemHealthManager` CPU/GPU headroom API 36. Feature-detect each one; none of them are safe to assume.
- **Benchmarking:** enable fixed performance mode with `adb shell cmd power set-fixed-performance-mode-enabled true` (Android 11+) to pin clocks and get comparable runs. It sets a *sustainable* operating point, not a maximum, and does not stop the device overheating — let it cool between runs and keep watching thermal status.
- **Vendor variation is real.** Thermal curves, headroom calibration, and intervention policy differ by SoC and OEM. Validate on high-, mid-, and low-tier devices from more than one vendor, over 15+ minute sessions, not 60-second smoke tests.
- **Android 17 (API 37)** enforces RAM-based per-app memory limits; a game killed for exceeding its budget leaves no stack trace, so pair thermal work with the `ApplicationExitInfo` and `ProfilingManager` triage described in `performance-profiling`.
- **Engines:** Unity ships an Android provider for Adaptive Performance and Unreal has an ADPF plugin, both wrapping these same APIs — prefer the plugin over a bespoke JNI layer when you are on a stock engine.

## Pitfalls

- **Polling `getThermalHeadroom()` per frame.** It returns `NaN` above one call per 10 seconds; the resulting quality ladder does nothing and looks like an API bug.
- **Treating `NaN` as 0.0.** Unsupported devices return `NaN` forever; conflating it with "plenty of headroom" disables the entire mitigation path.
- **Creating a hint session and never reporting.** Without `reportActualWorkDuration` every frame the session carries no information and the scheduler ignores it.
- **Registering the wrong threads.** A session pointing at background loaders instead of the game and render threads actively misleads the scheduler.
- **Reacting only at `THERMAL_STATUS_SEVERE`.** By then clocks are already cut; use headroom to move *before* the status ladder does.
- **Three-preset quality scaling.** Presets are too coarse for thermal control — the drop from High to Medium is visible, jarring, and usually more than needed.
- **Calling `getCpuHeadroom()` / `getGpuHeadroom()` on the render thread.** The synchronous binder transaction can exceed 1 ms and costs you the frame you were trying to save.
- **Shipping without `android:appCategory="game"`.** Without it, Game Mode does not apply and OEM interventions may be applied to your game with no input from you.
- **Benchmarking on a warm device.** Two runs at different starting temperatures are not comparable; cool down, or use fixed performance mode.

## References

- **Android Developers:** [Optimize thermal and CPU performance with ADPF](https://developer.android.com/games/optimize/adpf)
- **Android Developers:** [Thermal API](https://developer.android.com/games/optimize/adpf/thermal)
- **Android Developers:** [Game Mode API](https://developer.android.com/games/optimize/adpf/gamemode/gamemode-api)
- **Android Developers:** [Game State API](https://developer.android.com/games/optimize/adpf/gamemode/gamestate-api)
- **Android NDK:** [Performance Hint Manager](https://developer.android.com/ndk/reference/group/a-performance-hint)
- **Android Developers:** [Slow Sessions in Android vitals](https://developer.android.com/games/optimize/vitals/slow-session)

## See also

`performance-profiling` is the paired skill and the other half of the workflow: it covers Perfetto traces, the Studio profiler, Macrobenchmark, and Android 17 memory-limit triage — use it to find the hotspot, then use ADPF to decide how much budget the frame is allowed. For native game loops that consume these APIs through the NDK, `agdk-game-activity` covers the runtime the hint session's threads belong to, and `game-controller-input` covers the input path whose latency thermal throttling degrades first.
