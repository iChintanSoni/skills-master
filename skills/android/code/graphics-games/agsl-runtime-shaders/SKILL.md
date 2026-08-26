---
name: agsl-runtime-shaders
description: "Writing Android Graphics Shading Language (AGSL) fragment shaders and running them through RuntimeShader — uniforms, input shaders, color management, the AGSL/GLSL differences, applying a shader to a View with RenderEffect and to Compose with ShaderBrush or a graphicsLayer render effect. Use when adding a per-pixel effect such as noise, dissolve, distortion, gradient mesh, or a shader-driven tint to Android UI on API 33 and above, or when deciding whether an effect belongs in AGSL rather than a full OpenGL ES or Vulkan pipeline."
license: MIT
globs:
  - "**/*.kt"
tags: []
x-skills-master:
  domain: android
  class: code
  category: graphics-games
  platforms: ["android"]
  requires: { android: "33", kotlin: "2.2", compose-bom: "2026.08.00" }
  pairs_with: [compose-graphics, choosing-graphics-api]
  sources:
    - https://developer.android.com/develop/ui/views/graphics/agsl
    - https://developer.android.com/develop/ui/views/graphics/agsl/using-agsl
    - https://developer.android.com/develop/ui/views/graphics/agsl/agsl-quick-reference
  snapshot_date: "2026-08-25"
  stability: stable
  version: 1.0.0
---

## When to use

Use AGSL when the effect you want is a **function of pixel position and a handful of uniforms**: procedural gradients and noise, dissolve and wipe transitions, chromatic aberration, ripple and distortion, halftone and posterise filters, shader-driven text fills, or animated backgrounds. AGSL is Android 13 (API 33) and higher.

Do not use AGSL when you need geometry, multiple passes, custom render targets, or GPU compute — that is `vulkan-rendering` territory. Do not use it when a `Brush` gradient, a `BlendMode`, or `RenderEffect.createBlurEffect` already produces the result; those are cheaper and go further back. This skill is the **shader-language** layer; `compose-graphics` covers the drawing commands you attach the shader to.

## Core guidance

### What AGSL actually is

AGSL is Android's public dialect of Skia's SkSL, and Skia is what draws `Canvas`, the View hierarchy, and Compose. Your shader does not run as a standalone program — it is compiled into **one function inside a single combined GPU fragment shader** that also contains geometry coverage, clipping, the `Paint` shader tree, the color filter, the blend mode, and Android's color-space conversion. That framing explains most of the constraints below.

Its feature set is deliberately pinned at GLSL ES 1.0 so that it runs on essentially every Android 13+ GPU.

### Language shape

- The only entry point is `half4 main(float2 fragCoord)`. It returns the pixel colour directly; there is no `gl_FragColor`.
- **The origin is the upper left**, matching `Canvas` — not GLSL's lower-left `gl_FragCoord`. If you are porting a Shadertoy-style shader, either flip `y` in the shader or flip it on the outside with `Shader.setLocalMatrix` (`postScale(1f, -1f)` then `postTranslate(0f, height)`).
- `fragCoord` is in the shader's **local** coordinate space, not screen space. Pass the drawing area's size in as a uniform and normalise.
- Types: `float`, `float2`…`float4`, `half`, `half2`…`half4`, `int`, `short`, and matrices as `mat2`/`mat3`/`mat4` or `float2x2`/`float3x3`/`float4x4`. GLSL spellings (`vec2`, `bvec4`, `mat3`) are accepted as aliases. Prefer `half` for colour maths — it is the medium-precision type and is cheaper on mobile.
- Uniforms may also be of type `shader`, `colorFilter`, or `blender`. A `shader` uniform is sampled with `.eval(coord)`, which is how you read the content you are filtering.
- Restrictions to design around: **no preprocessor directives** (use `const` — the compiler folds constants and eliminates dead branches), no recursion, no `discard`, and `for` loops must be unrollable at compile time.

### Uniforms and colour management

Declare a colour uniform as `layout(color) uniform half4 iColor;` and set it with `setColorUniform`. The `layout(color)` marker is what makes Android convert the value into the shader's working colour space; a plain `uniform half4` is passed through raw and will be wrong on a wide-gamut display. Non-colour values (resolution, time, radius) are plain uniforms set with `setFloatUniform` / `setIntUniform`.

Inside the shader, `toLinearSrgb(half3)` and `fromLinearSrgb(half3)` convert between the working space and linear extended sRGB — wrap any maths that must be done in linear light (physically-based blending, gamma-correct mixing) in that pair.

`RuntimeShader`'s setters are:

| Setter | Accepts |
|---|---|
| `setFloatUniform(name, …)` | 1–4 floats, or a `float[]` |
| `setIntUniform(name, …)` | 1–4 ints, or an `int[]` |
| `setColorUniform(name, …)` | a packed colour `int`, a `Color`, or r/g/b/a floats |
| `setInputShader(name, shader)` | any `Shader` bound to a `shader` uniform |
| `setInputBuffer(name, bitmapShader)` | a `BitmapShader` sampled as raw, unmanaged data |

### Applying the shader

`RuntimeShader` extends `Shader`, so the simplest path is a `Paint`:

```kotlin
private const val SRC = """
  uniform float2  uSize;
  uniform float   uTime;
  layout(color) uniform half4 uTint;

  half4 main(float2 fragCoord) {
      float2 uv = fragCoord / uSize;           // 0..1, origin top-left
      float  wave = 0.5 + 0.5 * sin(uv.x * 12.0 + uTime * 3.0);
      return half4(uTint.rgb * wave, uTint.a);
  }
"""

// Create once; mutate uniforms per frame.
val shader = remember { RuntimeShader(SRC) }
val brush  = remember(shader) { ShaderBrush(shader) }

Canvas(Modifier.fillMaxSize()) {
    shader.setFloatUniform("uSize", size.width, size.height)
    shader.setFloatUniform("uTime", elapsedSeconds)
    shader.setColorUniform("uTint", Color.Cyan.toArgb())
    drawRect(brush = brush)
}
```

Three ways to attach it:

- **Canvas / `Paint`** — assign to `paint.shader` and use any draw call (`drawPaint`, `drawRect`, `drawText`). In Compose, wrap it in `ShaderBrush` and pass it as the `brush` argument to a `DrawScope` primitive. This *generates* pixels.
- **Views** — `view.setRenderEffect(RenderEffect.createRuntimeShaderEffect(shader, "background"))`. The named `uniform shader` receives everything the view and its children rendered; sample it with `background.eval(fragCoord)`. This *filters* pixels. `View.setRenderEffect` is API 31; `createRuntimeShaderEffect` is API 33.
- **Compose layers** — build the platform `android.graphics.RenderEffect` the same way and convert it with `asComposeRenderEffect()` before assigning it to `renderEffect` inside `Modifier.graphicsLayer { }`. That gives you a filter over an arbitrary composable subtree, which `ShaderBrush` cannot do.

Choose by intent: a `Brush`/`Paint` shader when you are painting something new, a `RenderEffect` when you are transforming content that already exists.

### Where AGSL stops

AGSL has no vertex stage, no compute, no framebuffer of its own, no multi-pass, and no arbitrary texture binding beyond input shaders. The moment you need any of those — a mesh, a simulation, shadow maps, a post-processing chain with intermediate targets — move to `vulkan-rendering` and a dedicated `SurfaceView`. The cost is real: a separate surface, its own lifecycle, and no participation in the Compose layout or the View hierarchy's compositing.

## Platform notes

- **API 33 floor.** `RuntimeShader` with AGSL is Android 13 and higher. Gate with `Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU` and ship a static fallback (a `Brush.linearGradient`, a pre-rendered asset) for older devices.
- **`RenderEffect` is API 31**, but `createRuntimeShaderEffect` is API 33, so a shader-based render effect carries the AGSL floor, not the `RenderEffect` floor.
- **Hardware acceleration is required.** A software `Canvas` — a `Bitmap`-backed canvas, some print and PDF paths, `View.setLayerType(LAYER_TYPE_SOFTWARE, …)` — cannot run an AGSL shader.
- **Wide gamut and HDR.** Because Android converts `layout(color)` uniforms and applies colour management around your function, an AGSL effect composes correctly with the Display P3 / HDR pipeline. Raw `half4` maths on non-`layout(color)` uniforms does not.
- **Compose interop** goes through `androidx.compose.ui.graphics`: `ShaderBrush` for painting, `asComposeRenderEffect()` for filtering. `RuntimeShader` itself stays a platform type.

## Pitfalls

- **Constructing `RuntimeShader` inside a draw lambda.** Compilation is not free and the object is allocated every frame. `remember` it (Compose) or hold it as a field (View), and only mutate uniforms per frame.
- **Forgetting to pass the size.** There is no built-in resolution. Without a size uniform your shader silently works only at whatever dimensions you tested.
- **Assuming GLSL's y-axis.** A ported shader that looks vertically mirrored is almost always this.
- **Plain `uniform half4` for a colour.** Skipping `layout(color)` skips colour-space conversion; the result drifts on P3 and HDR displays.
- **Porting a Shadertoy loop.** Non-unrollable `for` loops, `#define`, and `discard` are all rejected. Convert defines to `const` and bound your loops with compile-time constants.
- **Reusing one `RuntimeShader` across two concurrently drawn targets.** Uniforms are mutable state on the object; two draws that set different values race. Use one instance per target.
- **Reaching for AGSL to do a blur.** `RenderEffect.createBlurEffect` is API 31, hardware-optimised, and far cheaper than a hand-written kernel that samples an input shader dozens of times.
- **No profiling.** The shader runs once per pixel, so a fullscreen effect on a 1440p panel is millions of invocations per frame. Measure on a mid-range device before shipping.

## References

- **Documentation:** [Android Graphics Shading Language (AGSL)](https://developer.android.com/develop/ui/views/graphics/agsl)
- **Documentation:** [Using AGSL in your Android app](https://developer.android.com/develop/ui/views/graphics/agsl/using-agsl)
- **Documentation:** [AGSL quick reference](https://developer.android.com/develop/ui/views/graphics/agsl/agsl-quick-reference)
- **Documentation:** [AGSL versus GLSL](https://developer.android.com/develop/ui/views/graphics/agsl/agsl-vs-glsl)
- **API Reference:** [RuntimeShader](https://developer.android.com/reference/android/graphics/RuntimeShader)
- **API Reference:** [RenderEffect](https://developer.android.com/reference/android/graphics/RenderEffect)
- **Documentation:** [Migrate from RenderScript](https://developer.android.com/guide/topics/renderscript/migrate)

## See also

- `compose-graphics` for the `DrawScope`, `Brush`, and `Modifier.graphicsLayer` layer that an AGSL shader plugs into.
- `vulkan-rendering` when the effect outgrows a single fragment function and needs geometry, multiple passes, or compute.
- `compose-animations-transitions` for driving a time uniform from an `Animatable` or an infinite transition instead of a manual frame counter.
