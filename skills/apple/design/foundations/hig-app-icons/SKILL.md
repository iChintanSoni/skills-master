---
name: hig-app-icons
description: "Design-critique guidance for Apple app icons across platforms in the 26 design cycle: the unified rounded-rectangle grid, platform shapes, and the Liquid Glass layered icon system with default, dark, clear, and tinted appearances authored in Icon Composer. Use when reviewing or designing an app icon; when judging whether artwork is simple and recognizable at small sizes; when deciding how to layer artwork for depth and translucency; when removing text, words, or photographic backgrounds; when adapting one icon to iPhone, iPad, Mac, Apple Watch, Apple TV, or Apple Vision Pro; or when verifying the icon holds up in light, dark, clear, and tinted looks. Produces design recommendations, not code."
tags: [design, hig, app-icons, liquid-glass, icon-composer, branding]
x-skills-master:
  domain: apple
  class: design
  category: foundations
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  requires:
    ios: "26"
  pairs_with: []
  sources:
    - https://developer.apple.com/design/human-interface-guidelines/app-icons
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

# HIG app icons

The app icon is the first and most repeated impression of an app: it appears on the Home Screen, in Spotlight, the App Store, Settings, and notifications. In the 26 design cycle Apple unified icons around a single rounded-rectangle grid and the Liquid Glass material, where layered artwork renders with translucency, depth, and dynamic light and produces default, dark, clear, and tinted appearances from one source. This skill is a design-critique aid for judging clarity, recognizability, layering, and cross-platform consistency. It does not cover asset pipelines or build configuration.

## When to use

- Reviewing or designing a new app icon, or modernizing an existing one for the unified grid and Liquid Glass.
- Judging whether artwork stays simple and recognizable at small sizes and against varied wallpapers.
- Deciding how to split artwork into layers for depth, and how the icon should behave in dark, clear, and tinted looks.
- Removing text, words, photographs, or screenshots from an icon.
- Adapting a single icon design across iPhone, iPad, Mac, Apple Watch, Apple TV, and Apple Vision Pro.

## Core guidance

- Build the icon around one clear, recognizable subject. A single bold shape or symbol reads instantly at small sizes; crowded, busy compositions blur into noise on the Home Screen.
- Do not put text, words, or your app's name in the icon. Type is usually too small to read, clutters the design, and the name already appears beneath the icon. Let a distinctive mark carry recognition instead.
- Avoid photographs, screenshots, and literal interface elements as artwork. They rarely scale down legibly; favor simplified, graphic forms with clean edges and bold weights.
- Design on the unified grid and let the system supply the shape. Provide full-bleed square layers so the system applies the rounded-rectangle mask on iPhone, iPad, and Mac, and the circular mask on Apple Watch, without you hard-coding corners.
- Layer the artwork for depth rather than faking it. Separate foreground, midground, and background into distinct layers so Liquid Glass can apply translucency, blur, shadow, and specular highlights; flattening everything into one image loses the lit-from-within quality.
- Prefer soft gradients to hard pure-white or pure-black fills, and keep the composition centered with comfortable margins so nothing important crowds the masked edge.
- Design once and verify every appearance. Confirm the icon stays legible and on-brand in default, dark, clear (light and dark), and tinted (light and dark) looks; tinted and clear modes derive from your layers and luminance, so check that key shapes survive when color is stripped away.
- Keep the icon visually consistent with the app's interface and the rest of the platform family, so the same brand reads across iPhone, Mac, Watch, and beyond rather than looking like several different apps.

## Platform notes

- iOS and iPadOS: Icons use the unified rounded-rectangle grid with a rounder corner radius that matches current UI and hardware. The icon responds to device motion with light moving across its edges, so design for that dynamic Liquid Glass treatment rather than a static sticker.
- macOS: Icons now share the same rounded-rectangle shape as iOS and iPadOS instead of the older free-form macOS silhouette. Reuse the same artwork and layering for a coherent cross-device identity.
- watchOS: The icon is masked to a circle. Keep the subject centered and away from edges so the circular crop never clips anything essential.
- tvOS: Layered icons elevate and sway with focus as the user navigates. Lean into layer separation and transparency so the parallax reads as deliberate depth, not drift.
- visionOS: The icon is circular and spatial, composed of a background plus one or more floating layers that gain real depth in the shared space. Author squared layers and let the system apply the circular mask and 3D treatment.

## Pitfalls

- Packing in fine detail, multiple subjects, or tiny elements that vanish at Home Screen and Spotlight sizes.
- Including the app name or other text, expecting it to be readable in the icon.
- Using a photo, screenshot, or realistic 3D scene that turns muddy when scaled down.
- Hard-coding corner shapes or baking a single appearance into a flat asset, so dark, clear, and tinted looks break.
- Flattening artwork into one layer, losing the translucency and depth that Liquid Glass is built to express.
- Shipping a different design per platform, fragmenting the brand instead of adapting one icon to each shape.

## References

- **Human Interface Guidelines:** [App icons](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- **WWDC:** [Say hello to the new look of app icons (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/220/)
- **WWDC:** [Create icons with Icon Composer (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/361/)
- **Documentation:** [Icon Composer](https://developer.apple.com/icon-composer/)
- **Documentation:** [Apple Design Resources](https://developer.apple.com/design/resources/)

## See also

See `hig-materials-liquid-glass` for the broader material system the layered icon appearances draw on, and `hig-typography-sf-symbols` for the symbol design language that informs simple, glyph-like icon artwork. For the implementation side, the app-icon asset and the `.icon` file from Icon Composer are wired up in the project's Xcode asset catalog and app configuration; pair this critique with the corresponding SwiftUI or UIKit packaging skill that handles those assets.
