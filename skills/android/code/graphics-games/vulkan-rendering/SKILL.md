---
name: vulkan-rendering
description: "Vulkan rendering on Android — why Vulkan over OpenGL ES, ANativeWindow surface and swapchain creation, pre-rotation, NDK and CMake wiring, validation layers, Android Vulkan Profiles for device reach, AHardwareBuffer interop, and profiling with Android GPU Inspector. Use when building or porting a native renderer or game engine to Vulkan on Android, deciding between Vulkan and OpenGL ES or ANGLE, debugging a swapchain or a black frame, or checking which Vulkan features your target device fleet actually supports."
license: MIT
globs:
  - "**/*.cpp"
  - "**/*.h"
  - "**/*.kt"
tags: []
x-skills-master:
  domain: android
  class: code
  category: graphics-games
  platforms: ["android"]
  requires: { android: "24", kotlin: "2.2" }
  pairs_with: [game-loop-frame-pacing, choosing-graphics-api]
  sources:
    - https://developer.android.com/games/develop/vulkan/overview
    - https://developer.android.com/ndk/guides/graphics/design-notes
    - https://developer.android.com/ndk/guides/graphics/validation-layer
  snapshot_date: "2026-08-25"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for Vulkan when you are writing a real-time renderer in C/C++ — a game, an engine backend, a 3-D viewer, or a GPU compute pipeline — and you need explicit control over command submission, memory, and synchronisation. Vulkan is also the right answer when you are porting an existing desktop or console renderer, because the object model maps directly.

Do **not** reach for Vulkan for app UI effects. Compose and the View system already render through the platform's GPU pipeline; a per-pixel effect belongs in AGSL (`agsl-runtime-shaders`), and custom 2-D drawing belongs in Compose `DrawScope` (`compose-graphics`).

## Core guidance

### Vulkan versus OpenGL ES versus ANGLE

- Google's position is explicit: **use Vulkan for new projects**. OpenGL ES is still supported on every device but is no longer under active feature development.
- Vulkan gives lower driver CPU overhead, explicit multi-threaded command recording, and features GLES never got (bindless descriptors, ray tracing on capable hardware).
- [ANGLE](https://github.com/google/angle) is a conformant GLES implementation layered on Vulkan. Android 15 and higher ship it as an optional GL driver; the long-term direction is that OpenGL ES is delivered *through* ANGLE rather than through each vendor's GLES driver. Treat it as a compatibility and consistency story for **existing** GLES titles, not a reason to write new GLES code.
- Test an existing GLES game against ANGLE with `adb shell settings put global angle_gl_driver_selection_pkgs <package>` plus `angle_gl_driver_selection_values angle`. From Android 17 an app can *request* ANGLE with an `application` manifest entry named `com.android.graphics.driver.prefer_angle` set to `true` — a preference, not a guarantee; the vendor driver is used if ANGLE cannot be.

### Device reach

- Vulkan needs Android 7.0 (API 24) at minimum, but target **API 29 and Vulkan 1.1** as the practical floor: all 64-bit devices on Android 10 and higher support Vulkan 1.1.
- Devices that *launch* with Android 16 or higher must support Vulkan 1.4 (Android 13 and higher required 1.3). Older hardware in the field lags far behind that, so branch on capability, never on `Build.VERSION.SDK_INT`.
- Declare intent with the `android.hardware.vulkan.version` / `android.hardware.vulkan.level` / `android.hardware.vulkan.compute` system features so Play filters unsupported devices, and query the same features at runtime.
- **Android Vulkan Profiles** (AVP, formerly Android Baseline Profiles) bundle the extensions, features, formats and limits found on the vast majority of active devices for a given year. AVP 2021 is the widest, AVP 2022 adds full Vulkan 1.1, `shaderInt16`, `VK_ANDROID_external_memory_android_hardware_buffer`, `VK_KHR_driver_properties` and `VK_KHR_create_renderpass2`; AVP 2025 adds `VK_KHR_vulkan_memory_model`, `VK_KHR_shader_float_controls`, `VK_EXT_host_query_reset` and a wider pixel-format set. Pick a profile as your baseline and treat everything beyond it as an opt-in path.
- Detect software rasterisers: `vkGetPhysicalDeviceProperties` returning `VK_PHYSICAL_DEVICE_TYPE_CPU` means an emulated implementation. A performance-sensitive title should fall back to GLES rather than render through it.

### Surface and swapchain

The only Android-specific piece of window-system integration is surface creation. Everything downstream is stock Vulkan.

```cpp
// window comes from GameActivity (android_app->window) or from a Kotlin-owned
// SurfaceView via ANativeWindow_fromSurface() in <android/native_window_jni.h>.
VkAndroidSurfaceCreateInfoKHR ci{};
ci.sType  = VK_STRUCTURE_TYPE_ANDROID_SURFACE_CREATE_INFO_KHR;
ci.window = window;

VkSurfaceKHR surface = VK_NULL_HANDLE;
vkCreateAndroidSurfaceKHR(instance, &ci, nullptr, &surface);

VkSurfaceCapabilitiesKHR caps{};
vkGetPhysicalDeviceSurfaceCapabilitiesKHR(gpu, surface, &caps);

// Render pre-rotated, then tell the compositor you already did it.
VkSwapchainCreateInfoKHR sc{};
sc.surface      = surface;
sc.preTransform = caps.currentTransform;   // not IDENTITY_BIT_KHR
```

- **Pre-rotation is the single biggest Android-specific win.** `VkSurfaceCapabilitiesKHR::currentTransform` tells you the rotation the compositor would otherwise apply. Bake that rotation into your projection matrix and report it back through `VkSwapchainCreateInfoKHR::preTransform`; letting the compositor rotate costs measurable power on every frame.
- Recreate the swapchain on `VK_ERROR_OUT_OF_DATE_KHR`/`VK_SUBOPTIMAL_KHR` **and** whenever the surface is destroyed and re-created across a lifecycle pause. `currentTransform` changes on device rotation, so re-read it every time.
- Enable `VK_KHR_android_surface` (instance extension, API 24+). `VK_GOOGLE_display_timing`, `VK_KHR_incremental_present`, `VK_KHR_shared_presentable_image`, `VK_KHR_get_surface_capabilities2`, `VK_EXT_hdr_metadata` and `VK_EXT_swapchain_colorspace` are available from API 26 where the driver exposes them.

### Tile-based GPU discipline

Every Android GPU is tile-based. The guidance that follows is not micro-optimisation; it is the difference between shipping and thermal throttling.

- Minimise render passes. Starting and ending a pass flushes tile memory. Merge work into as few passes as possible and use subpasses for dependent stages.
- Set attachment ops honestly: `VK_ATTACHMENT_LOAD_OP_CLEAR` or `..._DONT_CARE` instead of `..._LOAD`, and `VK_ATTACHMENT_STORE_OP_DONT_CARE` when the contents are not needed after the pass. Depth/stencil that never leaves the tile should use `VK_IMAGE_USAGE_TRANSIENT_ATTACHMENT_BIT`.
- Choose memory types from `VkPhysicalDeviceMemoryProperties::memoryTypes` rather than assuming a discrete-GPU layout. Mobile SoCs share memory, so `VK_MEMORY_PROPERTY_DEVICE_LOCAL_BIT` is far less meaningful than on desktop.
- Group descriptor sets by update frequency — per-scene, per-material, per-instance — and push the highest-frequency data through push constants.

### Interop with the rest of Android

`VK_ANDROID_external_memory_android_hardware_buffer` (in AVP 2022, so broadly available) imports an `AHardwareBuffer` as Vulkan device memory and an image. That is the supported route for zero-copy sharing with `ImageReader`, `MediaCodec`, `Camera2`/CameraX, and GLES. Query the buffer's Android format properties before allocating, and pair the import with an imported semaphore or fence — the sharing is memory-level, not synchronisation-level.

### Build wiring

- Link the platform loader: `target_link_libraries(mygame vulkan)`. The NDK ships the `libvulkan.so` stub plus headers (NDK r25 and later carry Vulkan 1.3 headers).
- Prefer a meta-loader such as [volk](https://github.com/zeux/volk) over the stub for production: it resolves function pointers directly, skipping a dispatch hop and giving clean access to extension entry points.
- Compile GLSL to SPIR-V **offline** with [shaderc](https://github.com/google/shaderc) (shipped in the NDK) or HLSL with DXC. Compiling at runtime costs startup time on every launch.
- Use `GameActivity` from AGDK (`androidx.games:games-activity`) rather than `NativeActivity` for new native projects: it renders into a `SurfaceView`, extends `AppCompatActivity` so Jetpack components work, replaces `InputQueue` with `android_input_buffer`, and ships on the Jetpack release cadence.

### Validation and debugging

- Ship `VK_LAYER_KHRONOS_validation` in debug builds by dropping `libVkLayer_khronos_validation.so` into `src/main/jniLibs/<abi>/`, then naming it in `VkInstanceCreateInfo::ppEnabledLayerNames`. Never enable it in release.
- To inject layers without rebuilding, push the `.so` to the app's data dir and set the global settings `enable_gpu_debug_layers`, `gpu_debug_app`, `gpu_debug_layers` and `gpu_debug_layer_app`; `adb shell setprop debug.vulkan.layers VK_LAYER_KHRONOS_validation` is the reboot-clearing equivalent. External layer loading needs a debuggable app, a `userdebug` build with root, or — from Android 11 — a manifest `meta-data` entry named `com.android.graphics.injectLayers.enable` set to `true`.
- Route messages yourself with `VK_EXT_debug_utils` and a `VkDebugUtilsMessengerCreateInfoEXT` callback so VUID failures land in your own log with context; the default sink is logcat.
- Profile with [Android GPU Inspector](https://developer.android.com/agi): *system profiling* correlates GPU counters with CPU, memory and battery, and *frame profiling* breaks a single captured frame down to render passes, vertex formats, shaders and API calls for both Vulkan and OpenGL ES. It supports Adreno, Mali and PowerVR and requires a debuggable app. RenderDoc remains useful for frame capture where AGI lacks device support.

## Platform notes

- **Emulator** — the Android Emulator can expose a software Vulkan implementation. Correctness testing is fine there; every performance number must come from real hardware, ideally your lowest-tier target device.
- **Lifecycle** — `ANativeWindow` is destroyed and re-created around `onPause`/`onResume` and on configuration changes. Vulkan objects that reference the surface (swapchain, image views, framebuffers) must be torn down and rebuilt; device, queues and pipelines survive.
- **Foldables and multi-window** — surface size changes without a rotation. Drive swapchain recreation from surface events, not from orientation callbacks.
- **Frame pacing** — Vulkan gives you no pacing for free. Integrate the AGDK Frame Pacing library (`SwappyVk_*`) or drive presentation yourself; see `game-loop-frame-pacing`.
- **Android vitals** — apps that render through Vulkan may not report frame-time statistics to Android vitals. Verify what the platform sees with `adb shell dumpsys gfxinfo <package>` and instrument your own frame metrics.

## Pitfalls

- **Ignoring pre-rotation.** The frame still looks correct because the compositor fixes it, so this bug is invisible until you measure power and GPU time. Always honour `currentTransform`.
- **Branching on API level instead of capability.** A device on a recent Android release may still expose an old driver, and an old device may have a good one. Enumerate extensions, features and limits.
- **Assuming a desktop memory model.** Allocating everything `DEVICE_LOCAL` and staging through host-visible buffers wastes bandwidth on a unified-memory SoC.
- **Leaving validation layers on in release.** They are a large per-call cost and inflate the APK. Gate them behind a build variant.
- **Runtime shader compilation.** Compiling GLSL to SPIR-V during load adds seconds to cold start. Do it in the build.
- **Presenting without recreating on `VK_SUBOPTIMAL_KHR`.** Treating it as success leaves you rendering to a stale-geometry swapchain after a rotation or fold.
- **One giant descriptor set rebound per draw.** Descriptor churn is a top CPU cost on mobile; split by update frequency.
- **Choosing Vulkan for a UI effect.** A blur or gradient does not justify an NDK renderer, a second surface, and a lifecycle problem. Use AGSL.

## References

- **Documentation:** [Use Vulkan for graphics](https://developer.android.com/games/develop/vulkan/overview)
- **Documentation:** [Vulkan design guidelines](https://developer.android.com/ndk/guides/graphics/design-notes)
- **Documentation:** [Vulkan validation layers on Android](https://developer.android.com/ndk/guides/graphics/validation-layer)
- **Documentation:** [Android Vulkan Profiles](https://developer.android.com/ndk/guides/graphics/android-baseline-profile)
- **Documentation:** [Vulkan extensions on Android](https://developer.android.com/ndk/guides/graphics/extensions)
- **Documentation:** [Android GPU Inspector](https://developer.android.com/agi)
- **AOSP:** [Implement Vulkan](https://source.android.com/docs/core/graphics/implement-vulkan)
- **Sample Code:** [android/games-samples — AGDKTunnel](https://github.com/android/games-samples/tree/main/agdk/agdktunnel)

## See also

- `game-loop-frame-pacing` for driving presentation, choosing a refresh rate, and integrating `SwappyVk_*` on top of the swapchain built here.
- `agsl-runtime-shaders` when the effect you want is a fragment shader over existing UI content rather than a renderer.
- `compose-graphics` for 2-D custom drawing that never needs an explicit GPU API.
- `performance-profiling` for the Perfetto and Android Studio side of a GPU investigation that AGI does not cover.
