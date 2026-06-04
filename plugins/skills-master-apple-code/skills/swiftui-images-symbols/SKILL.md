---
name: swiftui-images-symbols
description: "Guidance for displaying images and SF Symbols in SwiftUI: sizing with resizable and scaledToFit, choosing a symbol rendering mode (monochrome, hierarchical, palette, multicolor), animating with symbolEffect, loading remote images with AsyncImage, and labeling images for VoiceOver. Use when adding photos, icons, glyphs, remote thumbnails, or animated symbols to a SwiftUI view, or when fixing image scaling, blurry assets, or missing accessibility labels."
---

## When to use

Reach for this skill whenever a SwiftUI view shows a bitmap, a vector asset, an SF Symbol, or a remotely fetched image. Typical triggers: an icon renders the wrong color, a photo ignores its frame, a downloaded thumbnail flashes or never appears, a symbol should animate on tap, or VoiceOver reads a filename instead of a description. It also applies when picking between a bundled asset and a system symbol, or deciding which rendering mode a multi-layer glyph needs.

## Core guidance

- Make bitmaps fluid before framing: call `.resizable()` first, then a fit mode. `.scaledToFit()` keeps the whole image inside its frame (letterboxing); `.scaledToFill()` covers the frame and overflows, so pair it with `.clipped()` or `.clipShape(...)`. Forgetting `resizable()` is the usual cause of an image that ignores its `frame`.
- Size SF Symbols with text, not frames. A symbol scales with `.font(...)` and `.imageScale(.large)`, and it inherits surrounding `Text` metrics. Reserve explicit frames for layout, not glyph size.
- Pick a rendering mode by layer intent: `.monochrome` (default tint), `.hierarchical` (one color at graded opacities for depth), `.palette` (you supply each layer's style), `.multicolor` (the symbol's built-in colors). Set it with `.symbolRenderingMode(_:)`; for palette, pass multiple styles to `.foregroundStyle(_:_:_:)`.
- Animate symbols with `.symbolEffect(...)`, not custom animations. Use discrete effects like `.bounce` keyed to a value, indefinite ones like `.pulse`/`.variableColor`, and `.contentTransition(.symbolEffect(.replace))` to swap one glyph for another (play/pause). Newer effects include `.wiggle`, `.breathe`, `.rotate`, and Draw.
- For remote images, apply `resizable()` and modifiers to the `Image` inside the `AsyncImage` content closure, never to `AsyncImage` itself. Handle the `.empty`, `.success`, and `.failure` phases explicitly so a failed download shows a placeholder, not blank space.
- Label every meaningful image: give functional images an `.accessibilityLabel(_:)` (or the `Image(_:label:)` initializer) and mark purely visual ones with `Image(decorative:)` so VoiceOver skips them. Never let an asset announce its raw filename.

```swift
Image(systemName: isPlaying ? "pause.fill" : "play.fill")
    .imageScale(.large)
    .symbolRenderingMode(.hierarchical)
    .foregroundStyle(.tint)
    .contentTransition(.symbolEffect(.replace))
    .symbolEffect(.bounce, value: tapCount)
    .accessibilityLabel(isPlaying ? "Pause" : "Play")
```

## Platform notes

- watchOS and tvOS favor symbols over dense photography; multicolor and hierarchical modes read well on both, but verify contrast on the dimmed tvOS focus states.
- On visionOS, symbols and images pick up the platform's vibrancy and depth automatically; avoid hard-coding colors that fight the glass material, and prefer `.foregroundStyle` over fixed `Color` values.
- macOS templates a single-color asset as a symbol-like glyph when the asset is configured as a template image; supply a multi-resolution asset to stay crisp on Retina and non-Retina displays.
- `AsyncImage` has no built-in disk cache. For lists or repeated loads on any platform, back it with `URLSession`'s cache or a dedicated image-loading layer to avoid refetching on scroll.

## Pitfalls

- Applying `.resizable()` to `AsyncImage` (or to its phase) fails to compile; it belongs on the inner `Image` in the content closure.
- Using `.foregroundColor`/`.tint` and expecting a multicolor symbol to recolor: multicolor uses fixed built-in colors and ignores your tint. Switch to palette mode to control colors.
- Calling `.scaledToFill()` without clipping lets the image bleed over neighboring views and tap targets.
- Setting `.symbolEffect(.bounce)` without a `value:` makes it fire once at appearance instead of on each change; discrete effects need a changing value to replay.
- Relying on default labels: a decorative image left unlabeled still steals VoiceOver focus and may read its filename. Mark it decorative or hide it.
- Stretching a small `@1x` raster to a large frame yields blur; ship vector (PDF/SVG) or higher-resolution assets instead.

## References

- **Documentation:** [Image](https://developer.apple.com/documentation/swiftui/image)
- **Documentation:** [SymbolRenderingMode](https://developer.apple.com/documentation/swiftui/symbolrenderingmode)
- **Documentation:** [AsyncImage](https://developer.apple.com/documentation/swiftui/asyncimage)
- **Human Interface Guidelines:** [SF Symbols](https://developer.apple.com/design/human-interface-guidelines/sf-symbols)
- **WWDC:** [What's new in SF Symbols 7 (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/337/)

## See also

Pair this with a SwiftUI layout skill when image sizing interacts with stacks and frames, and with a SwiftUI accessibility skill for deeper VoiceOver, label, and trait guidance. A skill on asset catalogs and resource management complements decisions about vector versus raster assets and template rendering. For app icons and branding symbols specifically, consult a dedicated app-icon or design-assets skill.
