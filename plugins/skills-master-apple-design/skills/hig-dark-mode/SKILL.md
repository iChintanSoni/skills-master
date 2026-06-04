---
name: hig-dark-mode
description: "Design guidance and critique for supporting Light and Dark appearances on Apple platforms per the Human Interface Guidelines. Use when reviewing or designing an interface that must adapt across appearances, choosing semantic colors and adaptive materials, planning per-appearance assets and elevation, or fixing contrast and pure-black issues. Triggers: dark mode, light/dark, appearance, semantic colors, dynamic colors, adaptive materials, elevation, vibrancy, per-appearance assets, contrast audit."
---

# HIG Dark Mode

Critique and recommend designs that adapt cleanly across Light and Dark appearances. The goal is one design expressed through semantic, system-aware choices — not two hand-painted themes.

## When to use

- Reviewing a screen, flow, or component for correct behavior in both Light and Dark appearances.
- Choosing colors, materials, and elevation so they adapt automatically rather than via hardcoded hex values.
- Planning per-appearance asset variants (icons, illustrations, photography) and deciding what needs a dark variant.
- Auditing contrast, vibrancy, and "pure black" decisions, including how they interact with Liquid Glass on the 26 cycle.

## Core guidance

- **Design once with semantics, not two palettes.** Specify intent (label, secondary label, fill, separator, system accent) and let system semantic colors resolve per appearance. Reserve custom colors for brand moments, and always supply both a Light and a Dark variant for each.
- **Don't recolor by hand for Dark.** Avoid darkening a Light palette by lowering brightness; that flattens hierarchy and muddies hue. Map roles to the adjusted system colors, which on the 26 cycle were retuned for hue differentiation in harmony with Liquid Glass.
- **Convey depth with elevation, not heavy borders.** In Dark Mode, foreground surfaces (sheets, popovers, raised cards) should read as slightly lighter than the base, since darkness recedes. Use the system's grouped/elevated background roles rather than inventing arbitrary gray steps.
- **Avoid pure black as a background.** Reserve true black for OLED-specific intent only; default to the system's near-black backgrounds so elevation, separators, and shadows remain legible. Pure black makes raised surfaces and dividers disappear.
- **Prefer adaptive materials over flat fills for chrome.** Bars, sidebars, and overlays should sit on system materials and vibrancy so they adapt to appearance and the content behind them. On the 26 cycle, Liquid Glass continuously adapts to its backdrop — let it, rather than locking a fixed tint.
- **Keep contrast within range in both modes — test extremes.** Verify legibility against the lightest and darkest backgrounds a surface can land on. Honor Increase Contrast and Reduce Transparency: provide solid fallbacks where translucency would drop text below a usable contrast ratio.
- **Audit per-appearance assets deliberately.** Full-color icons, illustrations, and screenshots that look right in Light can glare or lose edges in Dark. Decide per asset whether it adapts automatically (template/tinted) or needs a dedicated Dark variant.

## Platform notes

- **iOS / iPadOS:** Dark Mode is a user-level, systemwide setting; respect it everywhere and offer an in-app override only with strong justification. Sheets and popovers rely on elevated backgrounds for depth.
- **macOS:** Window backgrounds, sidebars, and vibrancy carry most of the appearance work; desktop tinting and accent color interact with your palette. Validate against both standard and graphite accents.
- **tvOS:** Content sits on dark, focus-driven surfaces; ensure focus highlights and parallax art read against both appearances and from across a room.
- **visionOS:** Components use glass materials over passthrough rather than a literal "dark theme"; reason about legibility over varied real-world backdrops, not a fixed dark canvas.

## Pitfalls

- Hardcoding hex colors or `#000`/`#FFF` instead of semantic roles, so nothing flips with appearance.
- Treating Dark as a one-off skin shipped late, leaving orphaned light-only assets and contrast gaps.
- Pure-black backgrounds that erase elevation, separators, and drop shadows.
- Over-saturated brand colors that vibrate or glare on dark surfaces; desaturate slightly for the Dark variant.
- Ignoring Increase Contrast / Reduce Transparency, leaving glass-over-content text unreadable.
- Testing only in Light (or only on one device) and missing the bright/dark content extremes that flip adaptive materials.

## References

- **Human Interface Guidelines:** [Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode)
- **Human Interface Guidelines:** [Color](https://developer.apple.com/design/human-interface-guidelines/color)
- **Human Interface Guidelines:** [Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- **WWDC:** [Get to know the new design system (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/356/)
- **WWDC:** [Meet Liquid Glass (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/219/)
- **WWDC:** [Implementing Dark Mode on iOS (WWDC19)](https://developer.apple.com/videos/play/wwdc2019/214/)

## See also

- **hig-color** — broader semantic and system color guidance that Dark Mode builds on.
- **hig-materials** (or **hig-liquid-glass**) — adaptive materials, vibrancy, and Liquid Glass behavior across appearances.
- **hig-accessibility** — Increase Contrast, Reduce Transparency, and contrast-ratio expectations.
- For implementation, pair with the SwiftUI/UIKit appearance-and-color code skill that wires semantic colors, asset catalog appearances, and `preferredColorScheme`/trait overrides.
