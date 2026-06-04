---
name: hig-materials-liquid-glass
description: Design-critique guidance for Apple's system materials, vibrancy, and the Liquid Glass design language across iOS, iPadOS, macOS, and visionOS. Use when reviewing or designing translucent surfaces, navigation bars, toolbars, sheets, sidebars, or floating controls; when deciding whether a surface should be glass or opaque; when judging legibility and contrast over busy or changing backgrounds; when tinting glass controls; or when adapting a refreshed interface to light and dark appearances for the 26 release cycle.
tags: [design, hig, materials, liquid-glass, accessibility]
x-skills-master:
  domain: apple
  class: design
  category: foundations
  platforms: [ios, ipados, macos, visionos]
  requires:
    ios: "26"
  pairs_with: []
  sources:
    - https://developer.apple.com/design/human-interface-guidelines/materials
    - https://developer.apple.com/documentation/TechnologyOverviews/liquid-glass
  snapshot_date: "2026-05-30"
  stability: emerging
  version: 1.0.0
---

# HIG materials and Liquid Glass

Liquid Glass is the unified material introduced across Apple platforms in the 26 release cycle. It is a translucent, dynamic surface that refracts and reflects nearby content, floats above an app's content layer, and reacts to motion with specular highlights. This skill is a design-critique aid: it helps evaluate whether materials are used with restraint, remain legible, and adapt correctly to context. It does not cover implementation.

## When to use

- Critiquing navigation bars, toolbars, tab bars, sidebars, sheets, or floating controls that adopt translucent treatments.
- Deciding whether a given surface should be Liquid Glass or a solid, opaque background.
- Judging text and symbol legibility where foreground content sits over a material with shifting backgrounds beneath it.
- Reviewing tint, color, and vibrancy choices on glass controls.
- Verifying that a refreshed interface holds up in both light and dark appearances and under accessibility settings.

## Core guidance

- Reserve Liquid Glass for the navigation and control layer that floats above content. Keep the content layer itself on opaque or standard backgrounds, so glass reads as a thin, distinct overlay rather than wallpaper.
- Do not stack glass on glass. Layering translucent surfaces over one another muddies depth cues and erodes contrast. Let one floating layer sit above an opaque base.
- Prefer system materials and the platform's vibrancy hierarchy for foreground content. Vibrant labels, fills, and separators pull color forward from behind the material and stay legible as the backdrop changes, whereas hand-picked colors can drift toward illegibility.
- Choose a material by semantic role and required contrast, not by the apparent color it produces. Thicker materials give finer text and glyphs more contrast; thinner ones admit more of the background and suit small, transient overlays.
- Tint glass controls sparingly and only to signal meaning, such as a prominent or destructive action. Use the system tinting path so the material's legibility behavior is preserved; avoid saturating large surfaces.
- Treat glass as accent, not theme. A few floating controls feel vital; covering most of the screen in translucency flattens hierarchy and tires the eye.
- Never bake the material's look into a static asset. The surface adapts to appearance, wallpaper, motion, and accessibility settings, so verify behavior live rather than against a single snapshot.

## Platform notes

- iOS and iPadOS: Tab bars, toolbars, and navigation bars float as glass over scrolling content. Confirm controls remain readable as varied content scrolls beneath them, and that the bar's separation from content is clear at rest and in motion.
- macOS: Sidebars, toolbars, and inspectors carry the material at larger scale. Watch contrast where dense text meets translucency, and respect the menu bar and window chrome conventions.
- visionOS: Glass is the native idiom; surfaces already render with depth and specular response. Avoid heavy custom tints that fight the environment lighting behind the surface.
- All platforms: Honor Reduce Transparency and Increase Contrast. Under these settings the system substitutes more opaque, higher-contrast surfaces, and any custom treatment must degrade gracefully to match.

## Pitfalls

- Placing primary reading content on glass, forcing users to parse text against a moving, low-contrast backdrop.
- Overusing translucency until everything floats and nothing anchors the hierarchy.
- Picking a material for the gray it appears to add, then finding it shifts under a different wallpaper or appearance.
- Applying strong custom tints or opacity to large glass areas, defeating the system's legibility tuning.
- Validating only in light mode on a calm background, missing failures in dark mode, over photos, or with accessibility settings on.

## See also

See `adopting-liquid-glass` for the SwiftUI implementation of these surfaces, including the glass effect and grouping of floating controls. See `hig-layout` for how floating glass elements interact with safe areas, margins, and the underlying content layout.
