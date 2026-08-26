---
name: choosing-image-pipeline
description: "Decision router for image work on Apple platforms: SwiftUI AsyncImage and its 27-cycle caching and request support, URLSession with URLCache versus NSCache, ImageIO downsampling, Core Image versus Metal for processing, ImageRenderer for export, PhotosPicker versus PhotoKit for library access, and SF Symbols versus bitmap assets. Use when deciding how to load, cache, downsample, process, export, or source an image, when a scrolling grid blows its memory budget, or when weighing whether a third-party image loader is still justified."
tags: [images]
x-skills-master:
  domain: apple
  class: overview
  category: overviews
  platforms: [apple, watchos, tvos, visionos]
  pairs_with: [swiftui-images-symbols, core-image, photokit]
  sources:
    - https://developer.apple.com/documentation/swiftui/asyncimage
    - https://developer.apple.com/documentation/imageio
    - https://developer.apple.com/documentation/photokit
  snapshot_date: "2026-08-25"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for this guide before adding an image dependency, before hand-rolling a
cache, or when an image feature has a memory or scrolling problem whose fix is
not obvious. It routes each part of the job to the right Apple API and hands the
details to the code skills.

## Core guidance

"Image handling" is several independent questions. Most image bugs come from
answering one of them with the tool meant for another.

### Displaying a remote image

- Start with SwiftUI `AsyncImage`. In the 27 cycle it caches downloaded image
  data according to the transport protocol, backed by a default `URLCache`, so
  the old reason to reach for a third-party loader no longer holds.
- Need auth headers, a different cache policy, or a custom timeout? Use the
  `AsyncImage(request:)` initializers (iOS, iPadOS, macOS, watchOS, tvOS, and
  visionOS 27) and configure the `URLRequest`.
- Need a shared session, a delegate for certificate pinning, or an ephemeral
  configuration? Apply `.asyncImageURLSession(_:)` to the enclosing hierarchy;
  `AsyncImage` uses that session for its data tasks instead of `URLSession.shared`.
- Below the 27 floor, or in UIKit and AppKit, drive `URLSession` yourself and
  hand the result to `Image(uiImage:)` or `Image(nsImage:)`.

### Caching

- `URLCache` caches HTTP *responses* — compressed bytes keyed by request,
  honoring `Cache-Control` and validators. It answers "don't refetch," and is
  the layer `AsyncImage` and `URLSession` already use.
- `NSCache` holds *decoded* objects in memory and is purged automatically under
  pressure. It answers "don't re-decode." Set `countLimit` or `totalCostLimit`
  deliberately — unbounded, it is still a hazard in a scrolling grid.
- The two-layer design (URLCache for bytes, NSCache for decoded images keyed by
  URL *and* target size) is what third-party loaders hand you assembled. Build
  it yourself only after profiling shows the default is short.

### Downsampling before decode

A 4000x3000 photo costs roughly 48 MB decoded regardless of its file size. Handing
that to a 120-point cell pays the full cost anyway; a grid of them crashes.

- Create a `CGImageSource` over the data or URL, then call
  `CGImageSourceCreateThumbnailAtIndex` with `kCGImageSourceThumbnailMaxPixelSize`
  set to the target size in *pixels* (points times display scale) and
  `kCGImageSourceCreateThumbnailFromImageAlways` enabled. The full bitmap is
  never materialized.
- Add `kCGImageSourceShouldCacheImmediately` so the decode happens on your
  background queue instead of lazily on the first draw, mid-scroll.

```swift
// Decode to the size you will draw, not to the size of the file.
func thumbnail(from data: Data, maxPixelSize: Int) -> CGImage? {
    guard let source = CGImageSourceCreateWithData(data as CFData, nil) else { return nil }
    let options: [CFString: Any] = [
        kCGImageSourceCreateThumbnailFromImageAlways: true,
        kCGImageSourceShouldCacheImmediately: true,
        kCGImageSourceThumbnailMaxPixelSize: maxPixelSize
    ]
    return CGImageSourceCreateThumbnailAtIndex(source, 0, options as CFDictionary)
}
```

### Processing

- **Core Image** for filter graphs — color adjustment, blur, composites, RAW
  development. Build the chain lazily and render once through a long-lived
  `CIContext`; creating a context per image is the classic performance mistake.
- **Metal** when the effect cannot be expressed as a filter graph, when you need
  real-time high-resolution video, or when you already own a render pass.
  `CIContext` can render into a Metal texture, so the two compose.
- Don't reach for Metal to sharpen a thumbnail, and don't force Core Image to
  emulate a per-pixel algorithm you would rather write as a shader.

### Exporting a view as an image

`ImageRenderer` (iOS 16, macOS 13, watchOS 9 and later) turns a SwiftUI view into
a `CGImage`, a platform image, or PDF data — use it for share sheets, generated
artwork, and snapshot fixtures, and set its `scale` to the display scale.
Rendering the view is always better than screenshotting the window.

### Sourcing from the photo library

- `PhotosPicker` (PhotosUI; iOS 16, macOS 13, watchOS 9 and later) is the
  default. It is system UI rendered outside your process and returns picked
  results *without* library authorization — nothing for the user to decline.
- Drop to PhotoKit (`PHAsset`, `PHImageManager`, change observation) only when
  you need library-wide browsing, albums, or to react to edits made elsewhere.
  That path does require authorization and a usage-description string, and when
  you request an asset, ask for the size you will draw.

### Symbols versus bitmap assets

- SF Symbols (release 8 in this cycle) for iconography: vector, weight- and
  scale-matched to the surrounding text, Dynamic Type aware, and animatable with
  symbol effects. A bitmap icon set is a maintenance and accessibility liability
  by comparison, and rasterizing a symbol to PNG throws all of it away.
- Asset-catalog bitmaps for photography, illustration, and brand art. Ship the
  variants the catalog asks for and let the system choose.

### The third-party landscape

Nuke and Kingfisher are the two widely used Swift image loaders. Both still
package things the platform does not hand you assembled: prefetching ahead of a
scroll, a decoded-image cache keyed by target size, coalescing and prioritizing
in-flight requests, and progressive or animated decoding. Adopt either against a
measured problem — name the capability you are buying, or take the built-in path.

## Platform notes

- `AsyncImage(request:)` and `.asyncImageURLSession(_:)` are 27-cycle API across
  every platform. Below that floor, plan on `URLSession` plus your own cache.
- `PhotosPicker` and `PHPickerViewController` are unavailable on tvOS; there is
  no photo-library picker to present there.
- watchOS has the tightest memory budget in the family — downsampling is the
  baseline there, not an optimization. On visionOS, content is viewed at
  variable distance, so favor vector symbols and generous source resolutions
  over pixel-exact bitmaps.

## Pitfalls

- Adding an image library before checking whether the 27-cycle `AsyncImage`
  already solves the caching complaint that motivated it.
- Caching decoded full-resolution images for a thumbnail grid — the cost is
  width times height times four bytes; the file size on disk tells you nothing.
- Confusing `URLCache` with `NSCache`. Sizing one when the pressure is on the
  other produces no improvement and a lot of confusion.
- Decoding on the main thread, or creating a `CIContext` per filtered image.
- Asking for full photo-library authorization when a `PhotosPicker` would have
  done the job with no prompt at all.

## References

- **Documentation:** [AsyncImage](https://developer.apple.com/documentation/swiftui/asyncimage)
- **Documentation:** [Image I/O](https://developer.apple.com/documentation/imageio)
- **Documentation:** [ImageRenderer](https://developer.apple.com/documentation/swiftui/imagerenderer)
- **Documentation:** [PhotoKit](https://developer.apple.com/documentation/photokit)
- **Documentation:** [Core Image](https://developer.apple.com/documentation/coreimage)
- **Human Interface Guidelines:** [Images](https://developer.apple.com/design/human-interface-guidelines/images)
- **Resource:** [SF Symbols](https://developer.apple.com/sf-symbols/)

## See also

Route into the code skills once the branch is chosen: `swiftui-images-symbols`
for display, sizing, symbol rendering modes, and accessibility labels;
`core-image` for filter graphs; `metal` for custom GPU work; and `photokit` for
library access and change observation. See `choosing-graphics-tech` when the
wider question is which graphics framework owns the feature.
