---
name: agdk-game-activity
description: Covers the Android Game Development Kit runtime layer for native games — GameActivity as the modern replacement for NativeActivity, the androidx.games artifacts and their prefab/CMake wiring, the android_native_app_glue command and input-buffer loop, surface and lifecycle handling, GameTextInput for soft-keyboard editing, and AGDE for Visual Studio. Use when building, wiring, or migrating a C/C++ Android game that needs an activity host, native input plumbing, or text entry from native code.
license: MIT
metadata:
  version: "1.0.0"
  snapshot-date: "2026-08-25"
---

## When to use

Reach for this skill when the game loop lives in C/C++ and you need an Android host for it: standing up a new native game, porting an engine, or migrating an existing `NativeActivity` title. It covers the AGDK runtime layer — activity hosting, the native event loop, surface lifecycle, and native text input — not rendering APIs (Vulkan/OpenGL ES) and not frame presentation (that is Frame Pacing/Swappy).

Skip it for games whose UI and logic are Kotlin/Compose or View-based; those need a normal `ComponentActivity`, not `GameActivity`.

## Core guidance

### What ships where

AGDK is a bundle, not one library. Knowing which half a piece comes from decides how you depend on it:

| Piece | Delivery |
| --- | --- |
| `GameActivity` (`androidx.games:games-activity`) | Jetpack AAR, consumed through Prefab |
| GameTextInput (`androidx.games:games-text-input`) | Jetpack AAR — already bundled inside `games-activity` |
| Game Controller / Paddleboat (`androidx.games:games-controller`) | Jetpack AAR, C API |
| Frame Pacing / Swappy (`androidx.games:games-frame-pacing`) | Jetpack AAR, C API |
| Memory Advice, Performance Tuner | Jetpack AARs |
| Oboe (audio), AGDE, Android GPU Inspector | Separate library / desktop tooling |

Latest stable at snapshot: `games-activity:4.4.2`, `games-text-input:4.3.1`, `games-controller:2.0.2`, `games-frame-pacing:2.1.3`, `games-performance-tuner:2.0.0`, `games-memory-advice:2.0.1`. Do **not** declare `games-text-input` alongside `games-activity` — the activity artifact already integrates it, and declaring both duplicates symbols.

### GameActivity versus NativeActivity

`GameActivity` is a descendant of `NativeActivity` with four differences that matter in practice:

- It renders into a `SurfaceView` inside a normal view hierarchy, so system UI, ads, IAP dialogs, and Jetpack components can sit alongside the game surface.
- It derives from `AppCompatActivity`, so `Fragment`, lifecycle, and the rest of Jetpack are available in the Java/Kotlin half.
- Input arrives through a double-buffered `android_input_buffer` you drain yourself, not through `InputQueue` callbacks.
- It ships on the Jetpack release train rather than the yearly platform release, so fixes reach you without an OS bump.

Treat `NativeActivity` as legacy. New work starts on `GameActivity`.

### Wiring it up

```kotlin
// build.gradle.kts — Prefab exposes the AAR's headers and prebuilt static libs to CMake.
android {
    buildFeatures { prefab = true }
}
dependencies {
    implementation("androidx.games:games-activity:4.4.2")
}
```

```cmake
# CMakeLists.txt — link the prebuilt static library; do not compile the library sources yourself.
find_package(game-activity REQUIRED CONFIG)
target_link_libraries(${PROJECT_NAME} PUBLIC android log game-activity::game-activity_static)
```

The Kotlin side is a thin subclass whose only job is loading the native library:

```kotlin
class MainActivity : GameActivity() {
    companion object {
        init { System.loadLibrary("mygame") }
    }
}
```

If the native library is not the default `libmain.so`, declare it so the runtime can find it:
`<meta-data android:name="android.app.lib_name" android:value="mygame" />`.

### The native loop

`android_main(android_app*)` runs on its own thread. Two independent streams reach it: lifecycle commands via the looper, and input via the swap buffers.

```cpp
void android_main(android_app* app) {
    // Both default filters drop events you almost certainly want: the key filter
    // swallows volume/camera keys, and the motion filter admits touchscreen only,
    // which silently discards every gamepad and mouse event.
    android_app_set_key_event_filter(app, nullptr);
    android_app_set_motion_event_filter(app, nullptr);

    while (!app->destroyRequested) {
        int events;
        android_poll_source* source;
        while (ALooper_pollOnce(0, nullptr, &events, (void**)&source) >= 0) {
            if (source) source->process(app, source);   // delivers APP_CMD_*
        }
        if (android_input_buffer* ib = android_app_swap_input_buffers(app)) {
            // ... consume ib->motionEvents / ib->keyEvents ...
            android_app_clear_motion_events(ib);        // must clear, or events replay
            android_app_clear_key_events(ib);
        }
        if (app->window) render_frame();                // only render with a live surface
    }
}
```

Drain the input buffers **outside** the looper poll loop, once per frame — they are not looper events.

### Surface and lifecycle

Gate all GPU work on the window commands. `APP_CMD_INIT_WINDOW` hands you a live `ANativeWindow` in `android_app::window`; create swapchain/EGL surface there. `APP_CMD_TERM_WINDOW` means the surface is going away — destroy the swapchain synchronously before returning, because `window` is nulled afterwards. `APP_CMD_WINDOW_RESIZED` and `APP_CMD_WINDOW_REDRAW_NEEDED` require a resize and a redraw; `APP_CMD_CONTENT_RECT_CHANGED` fires when the soft keyboard opens, so read `android_app::contentRect` rather than assuming the full window is visible. `APP_CMD_WINDOW_INSETS_CHANGED` is where you re-read cutout and system-bar insets. Stop simulating on `APP_CMD_PAUSE`/`APP_CMD_LOST_FOCUS`; persist to `savedState` (malloc'd, with `savedStateSize` set) on `APP_CMD_SAVE_STATE`.

### Text input

GameTextInput exists so a native game never has to hand-roll an `EditText`. `GameActivity_showSoftInput()` / `GameActivity_hideSoftInput()` raise and dismiss the IME, `GameActivity_setImeEditorInfo()` configures the editor (input type, action button), and `GameTextInput_setState()` pushes text in. Changes come back through the state callback as a `GameTextInputState` carrying `text_UTF8` plus selection and composing regions — honour the composing region so CJK and other multi-key IMEs compose correctly instead of emitting garbage. GameTextInput used standalone and GameTextInput used through `GameActivity` are mutually exclusive; on `GameActivity`, use the `GameActivity_*` entry points.

### AGDE for Visual Studio

The Android Game Development Extension keeps an MSBuild/Visual Studio C++ codebase as the source of truth while Gradle assembles the APK — the practical choice for cross-platform engines already building on Windows. It is current: version 26.1.102 (January 2026), with installers for Visual Studio 2022 and Visual Studio 2026. Studio remains the better host for a Gradle-native project; AGDE is for teams who cannot move the build.

## Platform notes

- **API floor:** GameActivity is deliberately backward compatible — the AGDK guides cite API 19 (get-started) and API 16 (migration guide). It is not a modern-API gate; set `minSdk` from your renderer and toolchain needs, not from AGDK.
- **`games-activity` 4.0.0 was a breaking change.** The AAR now ships prebuilt static libraries; application code includes headers (`GameActivity.h`, `android_native_app_glue.h` from the `game-activity/native_app_glue/` prefix) instead of adding `GameActivity.cpp`, `GameTextInput.cpp`, and `android_native_app_glue.c` to the target. Ports of pre-4.0 samples fail to link until you delete those source entries.
- **16 KB page sizes** are supported by default from `games-activity` 4.3.0-alpha01 and `games-controller` 2.3.0-alpha01. Rebuild native dependencies against a matching toolchain; a stale prebuilt `.so` is the usual culprit when a device with 16 KB pages refuses to load the library.
- **Mouse support** for GameActivity landed in 4.3.0-alpha01 — relevant for ChromeOS, desktop-class windows, and Play Games on PC.
- **Android 17 (API 37)** ignores orientation, aspect-ratio, and resizability locks on `sw >= 600dp` displays once you target 37, so a native game must survive arbitrary window resizes. Handle `APP_CMD_WINDOW_RESIZED` by recreating the swapchain rather than assuming a fixed backbuffer.
- **Frame presentation is a separate concern.** Pair `GameActivity` with `games-frame-pacing` (Swappy) for pacing against the display's refresh rate; `GameActivity` itself does not schedule frames.

## Pitfalls

- **Leaving the default motion event filter in place.** It admits touchscreen events only and drops every gamepad event — the single most common "my controller does nothing" bug in a GameActivity port.
- **Declaring `games-text-input` next to `games-activity`.** The activity artifact bundles it; declaring both is a duplicate-symbol link error waiting to happen.
- **Forgetting `buildFeatures.prefab = true`.** `find_package(game-activity …)` then fails with a config-not-found error that reads like a CMake bug rather than a missing Gradle flag.
- **Not clearing the input buffers.** `android_app_clear_motion_events` / `android_app_clear_key_events` are mandatory after draining; skip them and last frame's input replays forever.
- **Using `activity->clazz` after migrating.** The Java object is `android_app::activity->javaGameActivity` on GameActivity; the old field yields a wrong or null JNI reference.
- **Rendering after `APP_CMD_TERM_WINDOW`.** The surface is destroyed the moment you return from that command; late GPU submission is a hard crash, not a dropped frame.
- **Missing the JNI entry-point retention flag.** If the linker garbage-collects `Java_com_google_androidgamesdk_GameActivity_initializeNativeCode`, launch fails with `UnsatisfiedLinkError`; keep it with a `-u` linker flag.
- **Assuming NativeActivity samples port unchanged.** The `AInputEvent` callback model does not exist here; every input path must be rewritten around the swap buffers.

## References

- **Android Developers:** [GameActivity overview](https://developer.android.com/games/agdk/game-activity)
- **Android Developers:** [Get started with GameActivity](https://developer.android.com/games/agdk/game-activity/get-started)
- **Android Developers:** [Migrate from NativeActivity](https://developer.android.com/games/agdk/game-activity/migrate-native-activity)
- **Android Developers:** [AGDK libraries overview](https://developer.android.com/games/agdk/libraries-overview)
- **Android Developers:** [Android Game Development Extension](https://developer.android.com/games/agde)

## See also

`game-controller-input` is the natural companion — once the motion event filter is cleared, gamepad events arrive in the same input buffers, and the Game Controller (Paddleboat) library sits on top of this runtime. For sustained frame rates under thermal load, `adpf-thermal-performance` covers hint sessions and thermal-driven fidelity scaling. For trace-level investigation of a native game loop, `performance-profiling` covers Perfetto and the Studio profiler.
