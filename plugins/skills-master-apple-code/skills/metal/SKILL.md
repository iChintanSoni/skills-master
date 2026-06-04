---
name: metal
description: Guidance on Metal for GPU rendering and compute, covering MTLDevice, command queues, command buffers, render and compute encoders, Metal Shading Language vertex and fragment functions, MetalKit MTKView and drawables, buffers and textures, and MetalFX upscaling. Use when building a custom renderer, writing GPU shaders, running data-parallel compute on the GPU, drawing into an MTKView, deciding between Metal and a higher-level framework like SwiftUI Canvas or RealityKit, or adding MetalFX upscaling to a real-time scene.
---

## When to use

Use this skill when you need direct GPU control that higher-level frameworks cannot provide: a custom real-time renderer, hand-written shaders, or data-parallel compute such as image processing, simulation, or ML kernels. It applies when configuring an `MTLDevice` and command pipeline, authoring Metal Shading Language functions, drawing into a MetalKit `MTKView`, managing buffers and textures, or wiring MetalFX upscaling into a render loop. Reach for SwiftUI, Core Image, RealityKit, or SpriteKit first; choose Metal only when their abstractions are too coarse or too slow for your workload.

## Core guidance

- Create one `MTLDevice` (via `MTLCreateSystemDefaultDevice()`) and one long-lived `MTLCommandQueue` at startup; never recreate them per frame. Build pipeline states, libraries, buffers, and textures once and reuse them.
- Per frame, get a `MTLCommandBuffer` from the queue, encode work with a `MTLRenderCommandEncoder` (graphics) or `MTLComputeCommandEncoder` (compute), call `endEncoding()`, then `commit()`. Use one encoder per render pass.
- Compile shaders ahead of time: load functions from `device.makeDefaultLibrary()` and build a `MTLRenderPipelineState` or `MTLComputePipelineState` once. Do not create pipeline states inside `draw(in:)`.
- For on-screen drawing, let `MTKView` own the `CAMetalLayer`. Acquire `view.currentDrawable` and `currentRenderPassDescriptor` late in the frame, and `present(_:)` the drawable on the command buffer rather than synchronously.
- Pass small, frequently changing data with `setVertexBytes`/`setFragmentBytes`; use `MTLBuffer` for larger or reused data. Match Swift and MSL struct layouts exactly and share a header where possible.
- Don't block the CPU on `waitUntilCompleted()` in the render loop; use completion handlers and a small semaphore to bound in-flight frames (typically triple buffering).
- Prefer MetalFX temporal upscaling to render at a lower resolution and upscale, feeding it color, motion vectors, and depth for the best quality-to-cost ratio.

```swift
guard let drawable = view.currentDrawable,
      let pass = view.currentRenderPassDescriptor,
      let buffer = queue.makeCommandBuffer(),
      let encoder = buffer.makeRenderCommandEncoder(descriptor: pass) else { return }
encoder.setRenderPipelineState(pipelineState)
encoder.setVertexBuffer(vertexBuffer, offset: 0, index: 0)
encoder.drawPrimitives(type: .triangle, vertexStart: 0, vertexCount: 3)
encoder.endEncoding()
buffer.present(drawable)
buffer.commit()
```

## Platform notes

- Metal and MetalKit are available across iOS, iPadOS, macOS, tvOS, and visionOS; the Simulator supports a useful subset, but profile GPU work on real hardware. Use Xcode's Metal frame capture and Metal Shader Debugger to inspect draws and shaders.
- MetalFX upscaling (spatial and temporal) targets devices with capable GPUs; query support at runtime (for example via `MTLFXTemporalScalerDescriptor.supportsDevice(_:)`) and fall back to native-resolution rendering when unavailable. Newer Metal releases add dynamically sized temporal inputs.
- On visionOS, fully immersive Metal rendering goes through Compositor Services and a layer renderer rather than `MTKView`; the device, queues, encoders, and shaders carry over unchanged.
- Metal needs no Info.plist usage strings. If you read camera or microphone frames into textures, the underlying capture APIs still require their own privacy permissions and usage descriptions.

## Pitfalls

- Recreating the device, command queue, or pipeline state every frame causes severe stalls. Build them once and keep them alive for the app's lifetime.
- Acquiring `currentDrawable` too early or holding it too long starves the drawable pool and drops frames. Get it late, present it, and release it promptly.
- Mismatched memory layout between a Swift struct and its MSL counterpart yields garbled geometry or colors. Verify alignment and field order; SIMD types help.
- Forgetting `endEncoding()` before starting another encoder or committing the buffer triggers a runtime error. Always pair each encoder with `endEncoding()`.
- Submitting GPU work from multiple threads onto shared resources without synchronization corrupts state; encode per-frame work on one queue and bound in-flight frames with a semaphore.
- Reaching for Metal when Core Image, SwiftUI shaders, or RealityKit would suffice adds large maintenance cost for little gain. Validate that a higher-level path is genuinely insufficient first.

## References

- **Documentation:** [Metal](https://developer.apple.com/documentation/metal)
- **Documentation:** [MTKView](https://developer.apple.com/documentation/metalkit/mtkview)
- **Documentation:** [MetalFX](https://developer.apple.com/documentation/metalfx)
- **Documentation:** [Performing calculations on a GPU](https://developer.apple.com/documentation/metal/performing-calculations-on-a-gpu)
- **WWDC:** [Boost performance with MetalFX Upscaling (WWDC22)](https://developer.apple.com/videos/play/wwdc2022/10103/)
- **WWDC:** [Go further with Metal 4 games (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/211/)
- **Sample Code:** [Metal Sample Code](https://developer.apple.com/metal/sample-code/)

## See also

See `choosing-ui-toolkit` when deciding whether a custom Metal renderer is warranted over SwiftUI or UIKit drawing, and the Swift concurrency skill (`swift-concurrency`) for coordinating GPU completion handlers and in-flight frame limits with async code and actors.
