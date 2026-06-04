---
name: hig-layout
description: Design-critique guidance for Apple Human Interface Guidelines layout foundations across iOS, iPadOS, macOS, and visionOS, covering safe areas and layout margins, Dynamic Type, size classes and resizable windows, alignment and consistent spacing, and edge-to-edge content under Liquid Glass. Use when critiquing or specifying a screen layout, reviewing whether a design respects safe areas and margins, evaluating how a UI adapts across device sizes, multitasking windows, or orientations, or judging spacing, alignment, and edge-to-edge content treatment for an Apple platform interface.
---

# HIG layout foundations

Layout critique for Apple platforms judges whether content stays readable, reachable, and well-aligned as the environment changes underneath it: a different device, a resized window, a rotated screen, a larger text size, or a translucent control floating overhead. A strong layout looks deliberate at every size rather than stretched or cramped at the extremes.

## When to use

- Reviewing a mockup or shipped screen for safe-area, margin, and spacing correctness.
- Critiquing how a layout adapts across compact and regular width, multitasking windows, and orientation.
- Judging Dynamic Type behavior, alignment discipline, or edge-to-edge content treatment under Liquid Glass.
- Specifying layout intent for engineers before implementation, without writing the implementation.

## Core guidance

- Anchor primary content and interactive controls inside the safe area, and reserve standard layout margins (about 16 pt at compact width, 20 pt at regular width on iOS and iPadOS) as breathing room rather than usable canvas. Never let tappable targets or essential text crowd the very edges.
- Let background materials, images, and scrolling content extend edge to edge beneath bars and the Liquid Glass control layer, but keep the meaningful payload clear of where translucent toolbars, sidebars, or the home indicator sit.
- Treat Dynamic Type as a first-class layout variable: critique a design at the largest accessibility sizes, prefer text that wraps and reflows over truncation, and flag fixed-height rows or side-by-side labels that collapse when type grows.
- Adapt to available space by size class and window dimensions, not by hardcoded device models. The same view should hold up in a narrow multitasking window, a freely resized iPad window, Split View, and full screen; reflow columns and reveal or hide a sidebar based on width.
- Keep spacing on a consistent rhythm and align elements to shared edges and baselines so the eye reads clean vertical and horizontal lines; inconsistent gaps and one-off insets read as accidental.
- Honor concentric corners so nested shapes echo the curvature of their container and the device, and mirror layout for right-to-left languages so leading and trailing edges, not literal left and right, drive the arrangement.

## Platform notes

- iOS: Optimize for one-handed reach by keeping the most frequent actions toward the lower portion of the screen, and validate both portrait and landscape plus the home-indicator inset.
- iPadOS: Designs must survive arbitrary window sizes in the windowing system, tiling, and the resizable Slide Over window; avoid assuming a fixed canvas, and adopt sidebar and column layouts that adapt as the window narrows toward compact width.
- macOS: Respect denser spacing conventions, resizable windows with sensible minimum sizes, and pointer precision; content should grow gracefully as the window enlarges rather than centering a fixed block in empty space.
- visionOS: Compose within depth and ergonomic comfort, keep primary content near the center of the field of view, size targets generously for indirect gaze and pinch input, and let ornaments and glass surfaces frame rather than obscure content.

## Pitfalls

- Pinning content to absolute coordinates or specific device dimensions instead of safe areas, margins, and size classes.
- Designing only at the default text size, then truncating or clipping when Dynamic Type scales up.
- Pushing controls under the Liquid Glass bar or behind the home indicator so they appear obscured or unreachable.
- Using ad hoc, uneven spacing and misaligned edges that make an otherwise polished screen feel unfinished.
- Assuming left-to-right reading order and breaking when the interface mirrors for right-to-left locales.

## References

- **Human Interface Guidelines:** [Layout](https://developer.apple.com/design/human-interface-guidelines/layout)
- **Documentation:** [Layout adjustments](https://developer.apple.com/documentation/swiftui/layout-adjustments)
- **Documentation:** [SafeAreaRegions](https://developer.apple.com/documentation/swiftui/safearearegions)
- **WWDC:** [Compose custom layouts with SwiftUI (WWDC22)](https://developer.apple.com/videos/play/wwdc2022/10056/)

## See also

For type scale, weight, and symbol pairing that ride on this layout grid, see `hig-typography-sf-symbols`.
