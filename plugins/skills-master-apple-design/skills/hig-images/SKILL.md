---
name: hig-images
description: Design-critique guidance for images in Apple interfaces under the Human Interface Guidelines, covering when to use photographs versus illustrations versus SF Symbols, resolution and scale factors, intended aspect ratio and content fit, focal points and safe areas, keeping text legible over imagery, and labeling meaningful versus decorative images for accessibility. Use when reviewing or specifying photos, illustrations, thumbnails, hero images, or symbol artwork in a screen; deciding which image style fits a context; judging crop, scale, and aspect-ratio treatment; or checking that imagery carries the right alternative text. Produces UX critique and recommendations, not code.
---

# HIG images

Image critique for Apple platforms judges whether a picture is the right kind of artwork for its job, rendered crisply at the device's resolution, cropped to keep its subject in view, and labeled so everyone — including VoiceOver users — gets the same meaning. Strong imagery feels intentional: it reads sharply at every scale, never distorts, never buries text it must support, and never leaves assistive-technology users guessing.

## When to use

- Deciding whether a context calls for a photograph, an illustration, or an SF Symbol.
- Reviewing a hero image, thumbnail, avatar, or onboarding graphic for resolution, aspect ratio, crop, and focal point.
- Judging whether text or controls placed over an image stay legible.
- Checking that meaningful images carry a description and decorative ones are hidden from VoiceOver.
- Specifying image intent for engineers before they wire up an asset catalog or image view.

## Core guidance

- Match artwork to the job: use SF Symbols for interface glyphs and inline iconography so they track text weight and scale; use illustration for branded, conceptual, or onboarding moments where a controlled style helps; use photography when authentic, specific content (a place, a product, a person) is the point. Don't render a symbol where a photo communicates and don't hand-draw a glyph that an SF Symbol already covers.
- Demand resolution that matches the display. Provide assets at the scale factors a target uses (@1x, @2x, @3x) or ship vector/PDF artwork that scales cleanly; flag any image that looks soft, blurry, or pixelated at its rendered size. Prefer scalable formats for symbol-like art so it stays crisp as Dynamic Type and layout grow.
- Always present an image at its intended aspect ratio — never stretch or squash it to fill a frame. When a slot's shape differs from the source, crop with aspect-fill or letterbox with aspect-fit rather than distorting; treat the choice as a deliberate design decision, not a default.
- Design around the focal point. Keep the subject within the safe, visible region so cropping for different shapes, masks (circular avatars), or device sizes never cuts off a face or key detail; account for overlays, bars, and the Liquid Glass control layer that may sit on top.
- Protect legibility of anything layered over imagery. Don't drop text or controls directly onto a busy photo; add a scrim, gradient, blur, or system material so contrast holds across light and dark images, and verify the worst-case photo, not the friendliest one.
- Avoid baking text into image assets. Rasterized words don't localize, don't scale with Dynamic Type, and read blurry across resolutions; render real, dynamic text on top instead so it stays sharp, translatable, and accessible.
- Label images by their role. A meaningful image (a photo, a chart, a content thumbnail) needs a concise description that conveys what it shows; a purely decorative image must be hidden from VoiceOver so it isn't announced as noise. Don't describe a decorative flourish, and don't leave a content image silent or announced as a bare filename.

## Platform notes

- iOS and iPadOS: validate crops and focal points across compact and regular widths and both orientations; thumbnails and hero images often re-crop as windows resize, so confirm the subject survives every shape.
- macOS: pointer precision and large windows expose soft assets — ship resolution that holds up when a window or image view enlarges, and prefer vector art for resizable contexts.
- watchOS: screens are tiny and varied; favor simple, high-contrast imagery and symbols over detailed photos, and confirm the subject stays centered after circular and corner cropping.
- tvOS: images are seen from across the room and can sit behind the focus/parallax layer — use high-resolution, low-clutter artwork and keep critical detail away from edges that get masked.
- visionOS: imagery is viewed against varied real-world surroundings through translucency; confirm subjects and any overlaid text stay legible against glass and changing backgrounds, and keep focal points near the comfortable center of view.

## Pitfalls

- Stretching or squashing an image to fit a frame instead of cropping or letterboxing at the correct aspect ratio.
- Shipping low-resolution assets that look blurry on high-density displays, or detailed photos where a crisp symbol or vector would scale better.
- Placing text or controls on a busy image with no scrim or material, so contrast collapses on some photos.
- Cropping that decapitates faces or cuts off the subject when a circular mask or different device shape is applied.
- Embedding localized or sizable text inside a bitmap, defeating translation, Dynamic Type, and sharpness.
- Leaving meaningful images without a description, or announcing decorative ones, so VoiceOver users get either silence or noise.

## References

- **Human Interface Guidelines:** [Images](https://developer.apple.com/design/human-interface-guidelines/images)
- **Human Interface Guidelines:** [SF Symbols](https://developer.apple.com/design/human-interface-guidelines/sf-symbols)
- **Human Interface Guidelines:** [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- **WWDC:** [Get to know the new design system (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/356/)
- **Documentation:** [Fitting images into available space](https://developer.apple.com/documentation/swiftui/fitting-images-into-available-space)

## See also

For the SwiftUI side of displaying images and symbols — resizing, rendering modes, AsyncImage, and accessibility labels — see `swiftui-images-symbols`. For symbol weight, scale, and rendering-mode discipline as it pairs with text, see `hig-typography-sf-symbols`. For contrast ratios and how imagery interacts with assistive technologies, see `hig-accessibility`. For keeping text and controls legible against translucent surfaces, see `hig-materials-liquid-glass`. When the images come from the user's photo library, the implementing skill is `photokit`.
