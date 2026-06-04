---
name: hig-color
description: "Design critique and guidance for using color in Apple apps per the Human Interface Guidelines: system/semantic colors, the app accent/tint color, sufficient contrast, never relying on color alone, vibrancy on Liquid Glass materials, light/dark adaptation, and wide-gamut consistency. Use when reviewing a color palette, picking an accent/tint, auditing contrast or dark-mode legibility, or deciding between solid colors and vibrancy on glass. Produces UX recommendations, not code."
tags: [color, accessibility, contrast, dark-mode, materials, foundations]
x-skills-master:
  domain: apple
  class: design
  category: foundations
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  pairs_with: []
  sources:
    - https://developer.apple.com/design/human-interface-guidelines/color
    - https://developer.apple.com/design/human-interface-guidelines/materials
    - https://developer.apple.com/design/human-interface-guidelines/dark-mode
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

# HIG Color

Critique and recommendations for applying color across Apple platforms in the 26 (Liquid Glass) design cycle, grounded in the Human Interface Guidelines.

## When to use

- Reviewing or defining an app's color palette, accent/tint, or brand colors.
- Auditing contrast and legibility, especially in Dark Mode or on translucent materials.
- Deciding whether color carries meaning safely (state, status, errors, charts).
- Evaluating how custom colors hold up against system semantic colors and wide-gamut displays.

## Core guidance

- **Prefer system semantic colors over hard-coded values.** Choose colors by purpose (label, secondaryLabel, separator, the layered system backgrounds and fills) so they adapt automatically to light/dark, elevated contexts, and accessibility settings. Reserve custom colors for genuine brand needs.
- **Let one accent/tint carry brand identity; don't tint everything.** Apply a single app accent (the AccentColor asset / tint) to interactive elements so users learn what is tappable. On macOS, respect the user's chosen system accent where appropriate rather than forcing your own.
- **Meet contrast minimums in both appearances.** Aim for at least 4.5:1 for body text and 3:1 for large or bold text; strive for 7:1 for small text. Re-check every color pairing in Dark Mode, not just Light, and verify with Increase Contrast enabled.
- **Never rely on color alone to convey meaning.** Pair status, selection, and error color with a text label, SF Symbol, shape, or position so colorblind and low-vision users get the same information. A red dot must also be a word or icon.
- **Use vibrancy, not solid fills, on materials.** On Liquid Glass and system materials, prefer vibrant label/fill/separator styles so foreground content stays legible as the background shifts. Solid colors over glass go muddy and unpredictable; let the material inform tint rather than fighting it.
- **Design for Dark Mode as a peer, not an afterthought.** Dark UIs lean on a darker palette plus vibrancy to lift content off the background; don't simply invert. Avoid pure-black-on-pure-white or oversaturated hues that vibrate or smear against dark surfaces.
- **Embrace wide-gamut (Display P3) but stay consistent.** Author rich colors in P3 where it adds value, and confirm they degrade gracefully on sRGB displays. Keep a hue consistent across screens, states, and platforms so the same color always means the same thing.
- **Use color sparingly and purposefully.** Too many competing colors dilute the accent and add visual noise; let neutral system backgrounds and content do most of the work, with color marking what matters.

## Platform notes

- **iOS / iPadOS:** Tint signals interactivity throughout; lean on layered system backgrounds and fills for hierarchy on Liquid Glass surfaces.
- **macOS:** Users pick a system-wide accent; honor it for standard controls and only override when brand identity truly requires it.
- **watchOS:** Color reads against mostly black backgrounds; favor bright, high-contrast accents and keep saturated text legible at small sizes.
- **tvOS:** Account for focus highlighting and overscan; ensure color still communicates state when an element is or isn't focused, viewed from across a room.
- **visionOS:** Color sits on glass over passthrough or virtual environments; rely on vibrancy and system materials so legibility holds against unpredictable real-world backdrops.

## Pitfalls

- Hard-coding hex values that look right in Light Mode but fail contrast or muddy in Dark Mode.
- Conveying success/error/selection with color only, with no label, icon, or shape backup.
- Painting solid brand colors onto translucent materials and losing legibility as content scrolls beneath.
- Tinting so many elements that users can no longer tell what is actually interactive.
- Skipping verification with Increase Contrast and Reduce Transparency accessibility settings.
- Assuming a P3 color looks identical on every display; not testing the sRGB fallback.

## References

- **Human Interface Guidelines:** [Color](https://developer.apple.com/design/human-interface-guidelines/color)
- **Human Interface Guidelines:** [Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- **Human Interface Guidelines:** [Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode)
- **WWDC:** [Meet Liquid Glass (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/219/)
- **WWDC:** [Implementing Dark Mode on iOS (WWDC19)](https://developer.apple.com/videos/play/wwdc2019/214/)
- **Documentation:** [tint(_:) modifier](https://developer.apple.com/documentation/swiftui/view/tint(_:))

## See also

- **hig-dark-mode** and **hig-materials** for deeper treatment of appearance adaptation and Liquid Glass vibrancy.
- **hig-accessibility** for the full contrast, color-differentiation, and Increase Contrast review criteria.
- **swiftui-color-and-tint** (the implementing code skill) for applying semantic colors, the AccentColor asset, the tint modifier, and Display P3 color sets in SwiftUI/UIKit.
