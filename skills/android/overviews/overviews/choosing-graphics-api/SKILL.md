---
name: choosing-graphics-api
description: "Decision router for Android graphics work — Compose drawing with Canvas and graphicsLayer, AGSL RuntimeShader effects applied through RenderEffect, the View Canvas, OpenGL ES and ANGLE, Vulkan for new native renderers, and the point where a game engine is the honest answer. Use when starting drawing, visual-effect, custom-rendering, or game work and the API is undecided, when weighing whether an effect justifies dropping to a native renderer, or when deciding what to do with an existing OpenGL ES codebase."
tags: [games]
x-skills-master:
  domain: android
  class: overview
  category: overviews
  platforms: [android]
  requires: { "android": "16", "kotlin": "2.2" }
  pairs_with: [vulkan-rendering, compose-graphics, agsl-runtime-shaders]
  sources:
    - https://developer.android.com/games/develop/vulkan/overview
    - https://developer.android.com/develop/ui/views/graphics/agsl
    - https://developer.android.com/develop/ui/compose/graphics/draw/overview
  snapshot_date: "2026-08-25"
  stability: stable
  version: 1.0.0
---

## When to use

- A screen needs drawing that standard composables cannot assemble — a chart, a gauge, a signature pad, a decorative background.
- A designer has asked for a per-pixel effect (noise, dissolve, ripple, distortion, shader-driven gradient) and the implementation route is unclear.
- The team is starting a game or a real-time renderer and must pick between raw APIs and an engine.
- An existing OpenGL ES renderer needs a decision: keep it, let ANGLE carry it, or port to Vulkan.
- Someone has proposed "we need the GPU, so we need a native renderer" and the claim deserves a challenge.

## Core guidance

Android graphics is a ladder. **Start at the highest rung that satisfies a concrete requirement and only descend when that rung provably cannot meet it.** Each step down multiplies the code you own, the devices you must test, and the ways you can ship a black screen.

### Rung 1 — Compose drawing (the default)

Most "graphics" work on Android is 2D UI drawing, and Jetpack Compose already draws it on the GPU. Use `Canvas`, `Modifier.drawBehind`, `Modifier.drawWithCache`, and `DrawScope` for paths, gradients, and strokes; use `Modifier.graphicsLayer` for transforms, alpha, clipping, and compositing. This is the right rung for charts, custom controls, progress visuals, masks, and decorative shapes.

Descend only when the effect is genuinely per-pixel, when the workload is a sustained real-time loop, or when the content is 3D. "It looks complicated" is not a reason. Route to `compose-graphics`.

### Rung 2 — AGSL shaders through RuntimeShader and RenderEffect

When the effect is a **function of pixel position plus a few uniforms** — noise, dissolve, chromatic aberration, ripple, halftone, animated backgrounds, shader-filled text — write it in AGSL and run it as a `RuntimeShader`. AGSL requires Android 13 (API 33) and above. Apply it to Compose through a `ShaderBrush` or a `graphicsLayer` render effect, and to a View through `RenderEffect` and `View.setRenderEffect`.

`RenderEffect` itself arrived earlier, in Android 12 (API 31), with blur and colour-filter variants; the shader-backed effects need `RuntimeShader`, so the practical floor for AGSL work is API 33 with a graceful fallback below it. A shader here is tens of lines and no pipeline. Route to `agsl-runtime-shaders`.

### Rung 3 — the View Canvas

Custom `View.onDraw` with the platform `Canvas` remains correct in a View-based codebase, and it is the only option inside `RemoteViews`-adjacent constraints and some legacy component hierarchies. It is not a step up in power from Compose drawing — it is the same capability in an older host. Do not migrate Compose drawing down to a custom View for performance reasons without a trace that says so.

### Rung 4 — OpenGL ES, and what ANGLE means for it

OpenGL ES is still supported on Android but is **no longer under active feature development**, and Google's stated direction is that OpenGL ES will eventually be reached only through ANGLE — a conformant GL ES implementation layered on Vulkan, shipped as an optional system layer from Android 15 onward. On Android 17 and higher an app can add a `com.android.graphics.driver.prefer_angle` meta-data flag to signal a preference for the ANGLE driver; it is a preference, not a guarantee, and the vendor GL driver is used if ANGLE cannot be.

Practical reading: **do not start new work on OpenGL ES.** Keep an existing GL renderer shipping — ANGLE is precisely the mechanism that keeps it viable and makes its behaviour more uniform across vendors — and treat a Vulkan port as a scheduled project rather than an emergency.

### Rung 5 — Vulkan

Vulkan is the primary low-level graphics API on Android and the recommended target for new native renderers. It is available from Android 7 (API 24); 64-bit devices from Android 10 (API 29) onward support Vulkan 1.1, and Google's own figure at this snapshot puts Vulkan support at roughly 85% of active devices. You get explicit control of memory, synchronisation, and command submission — and you own every bit of it, including swapchain setup, pre-rotation, and validation-layer hygiene.

Choose Vulkan when you are writing a renderer, not a screen: a custom engine, a heavy particle or volumetric system, a compute-driven pipeline, or a port from another platform's explicit API. Budget for a device-reach story (Android Vulkan Profiles) and a fallback path. Route to `vulkan-rendering`, and pair it with `game-loop-frame-pacing` from day one — an explicit API does not give you a correct frame loop.

### The rung that is not on the ladder — use an engine

If the deliverable is a **game** with scenes, assets, physics, animation, and a content pipeline, the correct answer is usually a game engine rather than any raw API. Unity, Unreal Engine, Godot, Defold, and Cocos all target Vulkan on Android and all handle device allowlisting, shader variants, and asset pipelines that you would otherwise build yourself. Writing a renderer is justified when rendering *is* the product or when an existing engine cannot express the technique — not because the raw API is available.

### Decision summary

| Signal | Rung |
|---|---|
| Custom chart, control, or decorative shape | Compose drawing |
| Transform, clip, alpha, offscreen compositing | `Modifier.graphicsLayer` |
| Per-pixel effect from position and uniforms, API 33+ | AGSL + `RuntimeShader` |
| Blur or colour filter on a View | `RenderEffect` (API 31+) |
| Custom drawing inside a View hierarchy | View `Canvas` |
| Existing GL ES renderer, still shipping | Keep it; ANGLE carries it |
| New native renderer or engine port | Vulkan |
| A game with scenes, assets, and physics | Game engine |

## Platform notes

- **Device reach is the real constraint below rung 3.** AGSL cuts off at API 33 and Vulkan feature levels vary widely by chipset. Decide the fallback before writing the effect, not after a crash report.
- **Surface choice is a separate decision from API choice.** `SurfaceView` (and `GLSurfaceView`) give a dedicated composited surface suited to a render loop; `TextureView` integrates with the View hierarchy at a cost. This belongs to `game-loop-frame-pacing`, not to the API question.
- **Native hosting.** A C/C++ renderer needs an activity host: `GameActivity` from the AGDK is the modern path and supersedes `NativeActivity`. See `agdk-game-activity`.
- **Sustained load is a thermal problem, not only a graphics one.** Any renderer running for minutes needs ADPF hints and a fidelity-degradation plan — see `adpf-thermal-performance`.
- **XR and 3D UI are a different stack.** Spatial content on Android XR goes through SceneCore and ARCore, not through a hand-written Vulkan renderer. See `xr-scenecore` and `xr-arcore`.
- **Video effects are not graphics-API work.** Frame-level video processing belongs in Media3 Transformer's effect pipeline rather than a bespoke GL or Vulkan path.

## Pitfalls

- **Equating "GPU" with "native API."** Compose drawing, AGSL, `RenderEffect`, and Media3 effects are already GPU-accelerated. Dropping to Vulkan for an effect Compose can express costs weeks and buys nothing.
- **Starting a new project on OpenGL ES out of familiarity.** It is maintenance-only, and you inherit a port you will have to schedule later.
- **Treating ANGLE as a migration.** ANGLE keeps a GL ES renderer running well; it does not give it Vulkan's explicit control, and preferring it via the Android 17 manifest flag is a hint, not a contract.
- **Shipping AGSL with no path below API 33.** A `RuntimeShader` reference on an older device is a hard failure. Gate the effect and design the plain-drawing fallback first.
- **Writing an engine by accident.** Teams reach for Vulkan for a "simple" 3D feature, then discover they now own asset loading, materials, animation, and culling. Price that before committing.
- **Ignoring pre-rotation in Vulkan.** Letting the compositor rotate the swapchain image is a silent, permanent performance tax on many devices.
- **Overdraw and unnecessary layers in Compose drawing.** `graphicsLayer` forces an offscreen buffer when it needs one; applying it reflexively to "make things faster" usually does the opposite. Measure with `compose-performance` and `performance-profiling`.

## References

- **Documentation:** [Use Vulkan for graphics](https://developer.android.com/games/develop/vulkan/overview)
- **Documentation:** [AGSL](https://developer.android.com/develop/ui/views/graphics/agsl)
- **Documentation:** [Graphics in Compose](https://developer.android.com/develop/ui/compose/graphics/draw/overview)
- **Documentation:** [Game engine support for Vulkan](https://developer.android.com/games/develop/vulkan/game-engine-support)

## See also

Route into the chosen rung: `compose-graphics` for Canvas, `DrawScope`, and `graphicsLayer`; `agsl-runtime-shaders` for shader authoring and application; `vulkan-rendering` for swapchains, pre-rotation, validation layers, and device reach; `game-loop-frame-pacing` for Choreographer, Swappy, surface choice, and jank. For the surrounding game stack see `agdk-game-activity`, `game-controller-input`, `adpf-thermal-performance`, and `play-asset-delivery`. For spatial and AR content see `xr-scenecore` and `xr-arcore`. When the question is which UI toolkit owns the screen rather than how to draw inside it, see `choosing-compose-or-views`.
