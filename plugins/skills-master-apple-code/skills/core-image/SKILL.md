---
name: core-image
description: "Guidance for processing images with Core Image: building lazy CIImage filter graphs, applying typed CIFilter.* effects, rendering with a Metal-backed CIContext, and bridging to CGImage, UIImage, and SwiftUI. Use when applying photo or video filters, chaining effects, writing custom kernels, or rendering CIImage output to the screen."
---

## When to use

Reach for Core Image when you need to apply or compose image effects: color grading, blurs, convolutions, generators (QR codes, gradients), transitions, or detector-style processing. A `CIImage` is a deferred recipe rather than a bitmap, so Core Image excels at chaining many operations that the GPU fuses into one pass at render time. Use it for one-shot photo edits and for real-time video, where it integrates cleanly with `MTKView`, `AVPlayerView`, and SwiftUI.

If you only need to display a static asset, prefer plain `Image` or `UIImageView`. If you need pixel-level shaders unrelated to an image pipeline, use Metal directly.

## Core guidance

- Build the graph lazily. Each `CIFilter` produces a new `CIImage` that records intent; nothing executes until you render. Chain freely without intermediate cost.
- Prefer the typed API. `import CoreImage.CIFilterBuiltins` gives strongly typed factories like `CIFilter.gaussianBlur()` with real properties (`filter.radius`) instead of stringly-typed `setValue(_:forKey:)`. Reserve `CIFilter(name:)` for filters without a typed wrapper.
- Create the `CIContext` once and reuse it. Contexts are expensive; one long-lived, Metal-backed context should serve the whole app. Do not allocate one per frame or per render.
- Back the context with Metal: `CIContext(mtlDevice:)`. For video set `.cacheIntermediates` to `false` to control memory; the JIT compiler fuses the chain into a single GPU shader.
- Mind the coordinate system. Core Image is bottom-left origin and its filter outputs often have infinite or shifted `extent`. Clamp, crop, or compute the correct `extent` before creating a `CGImage`.
- Bridge once, at the edge. Convert to `CGImage`/`UIImage` only for final display; passing `CIImage` between filters avoids needless rasterization.
- Write custom effects as `CIColorKernel`/`CIKernel` in Metal Shading Language, compiled via Xcode's CI kernel build rule, not at runtime.

```swift
import CoreImage.CIFilterBuiltins

let context = CIContext(mtlDevice: MTLCreateSystemDefaultDevice()!)

func sepia(_ input: CIImage, intensity: Float) -> CGImage? {
    let filter = CIFilter.sepiaTone()
    filter.inputImage = input
    filter.intensity = intensity            // lazy: no pixels yet
    guard let output = filter.outputImage else { return nil }
    return context.createCGImage(output, from: output.extent)
}
```

## Platform notes

- iOS/iPadOS/tvOS/visionOS: render to an `MTKView` for live previews; set `framebufferOnly = false` so Core Image can use Metal compute. On visionOS, composite results into RealityKit or SwiftUI rather than assuming a full-screen Metal layer.
- macOS: for HDR/EDR output set the view's `colorPixelFormat` to `rgba16Float` and `wantsExtendedDynamicRangeContent = true`; over 150 built-in filters are EDR-aware.
- Color management is automatic. Core Image works in a linear working space and applies the source/destination color spaces; pass an explicit `colorSpace` to `createCGImage(_:from:colorSpace:)` when you need a specific output profile.
- No special `Info.plist` usage strings are required by Core Image itself. Permissions apply only to upstream sources: camera capture needs `NSCameraUsageDescription` and reading the library needs `NSPhotoLibraryUsageDescription`.

## Pitfalls

- Recreating `CIContext` per render tanks performance and spikes memory. Hoist it to a stored property.
- Using `output.extent` blindly: many generators (gradients, tile/affine clamp) return `CGRect.infinite`. Always crop or supply a finite rect before rasterizing, or you risk a failed or huge allocation.
- Forgetting Core Image's flipped Y axis when overlaying or compositing, causing upside-down results.
- Assuming `outputImage` is non-nil. Missing inputs yield `nil`; unwrap defensively.
- Calling `createCGImage` on the main thread in a tight loop. Render off the main actor and hand only the finished image back to the UI.
- Mixing `UIImage.ciImage` and `UIImage.cgImage` assumptions: a `UIImage` may be backed by either, so construct `CIImage(image:)` explicitly when you need a recipe.

## References

- **Documentation:** [Core Image](https://developer.apple.com/documentation/coreimage)
- **Documentation:** [CIFilter](https://developer.apple.com/documentation/coreimage/cifilter)
- **Documentation:** [CIContext](https://developer.apple.com/documentation/coreimage/cicontext)
- **WWDC:** [Optimize the Core Image pipeline for your video app (WWDC20)](https://developer.apple.com/videos/play/wwdc2020/10008/)
- **WWDC:** [Display EDR content with Core Image, Metal, and SwiftUI (WWDC22)](https://developer.apple.com/videos/play/wwdc2022/10114/)
- **WWDC:** [Advances in Core Image: Filters, Metal, Vision, and More (WWDC17)](https://developer.apple.com/videos/play/wwdc2017/510/)

## See also

For driving custom Metal kernels and render passes beyond the built-in filter set, see a Metal rendering skill. When the image source is the camera or photo library, pair this with a camera-capture or PhotosPicker skill to obtain pixels and the matching privacy usage strings. For presenting the rendered output, a SwiftUI image-display skill covers wrapping results back into a `View`.
