---
name: hig-accessibility
description: Design-critique guidance for Apple Human Interface Guidelines accessibility foundations, covering VoiceOver labels, traits, and hints, Dynamic Type and large text layouts, sufficient color contrast and never relying on color alone, Reduce Motion, adequate touch target sizes, and meaningful accessibility for custom controls. Use when reviewing or designing iOS, iPadOS, macOS, watchOS, tvOS, or visionOS interfaces for inclusive access, auditing a screen for VoiceOver and Dynamic Type support, deciding accessibility labels or traits, evaluating contrast or motion, or judging whether custom controls expose their meaning to assistive technologies.
---

# HIG accessibility foundations

## When to use

Reach for this when critiquing or designing any Apple-platform screen for inclusive access: auditing VoiceOver output, checking that text scales with Dynamic Type, evaluating color contrast, judging whether motion respects user settings, or deciding how a custom control should announce itself to assistive technologies. It frames accessibility as a baseline of the design, not a later patch.

## Core guidance

- Treat accessibility as a first-class design constraint that ships with every release. Most affordances come free from standard SwiftUI and UIKit controls, so prefer system components and only add custom accessibility when a control is bespoke.
- Write accessibility labels that name what an element *is* or *does*, not how it looks. Keep labels short, capitalized like a noun phrase, and free of the control type ("Play", not "Play button" — VoiceOver appends the role from the trait). Reserve hints for non-obvious outcomes, and apply traits so assistive tech knows an element is a button, header, image, or adjustable.
- Support Dynamic Type by using text styles (body, headline, caption) rather than fixed point sizes, and design layouts that reflow at the largest accessibility sizes without truncating or clipping. Avoid placing essential text inside fixed-height containers.
- Never encode meaning in color alone. Pair color with text, shape, an SF Symbol, or position so users with low vision or color blindness get the same signal. Aim for contrast of at least 4.5:1 for body text and 3:1 for large or bold text and meaningful glyphs.
- Honor Reduce Motion by replacing large parallax, zoom, and slide transitions with cross-fades or instant changes; gate non-essential animation behind the setting and keep any remaining motion subtle.
- Keep interactive targets at least 44 by 44 points (with appropriate platform equivalents for pointer, Digital Crown, and focus-based input), and give adjacent controls enough spacing to prevent mis-taps.

```swift
Button(action: toggleFavorite) {
    Image(systemName: isFavorite ? "heart.fill" : "heart")
}
.accessibilityLabel("Favorite")
.accessibilityValue(isFavorite ? "On" : "Off")
.accessibilityHint("Saves this item to your favorites")
```

## Platform notes

- iOS and iPadOS: VoiceOver, Dynamic Type, and 44-point targets are the primary baseline; test rotor navigation and ensure custom gestures have accessible alternatives.
- macOS: Full Keyboard Access and VoiceOver expect a logical focus order and labeled controls; pointer targets can be smaller but still need clear hit areas and focus rings.
- watchOS: Space is tight, so lean on system text styles, large-text support, and concise labels; the Digital Crown often substitutes for adjustable sliders.
- tvOS: Focus-driven navigation means every focusable element needs a label and a clear focused appearance; avoid relying on color shifts alone to show focus.
- visionOS: Eye and hand input plus VoiceOver require generous, well-separated targets and labels that make sense without visual context; respect Reduce Motion for spatial transitions.

## Pitfalls

- Labeling an icon-only button with its glyph name ("heart.fill") instead of its purpose ("Favorite").
- Decorative images that are not hidden from VoiceOver, cluttering the reading order.
- Stuffing the control's role or state into the label so VoiceOver reads "Play button button".
- Hard-coded font sizes or fixed-height text rows that truncate at large Dynamic Type settings.
- Status shown only as red versus green, or a required field marked only by color.
- Custom controls built from generic containers that expose no trait, value, or action, leaving assistive tech with a silent or meaningless element.

## See also

For type scales and symbol usage that underpin Dynamic Type and color-independent cues, see `hig-typography-sf-symbols`. Pair this critique with implementation skills covering SwiftUI accessibility modifiers and audit tooling such as the Accessibility Inspector.
