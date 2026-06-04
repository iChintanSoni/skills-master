---
name: hig-typography-sf-symbols
description: Critiques typography and SF Symbols usage against Apple's Human Interface Guidelines, covering built-in text styles for Dynamic Type, weight and size hierarchy, legibility, and consistent symbol rendering modes, weights, scales, and variants. Use when reviewing a screen's text hierarchy, evaluating whether type respects Dynamic Type and accessibility sizes, deciding font weights or styles, picking SF Symbol rendering modes, or checking that symbols visually match adjacent text.
tags: [hig, typography, sf-symbols, dynamic-type, design]
x-skills-master:
  domain: apple
  class: design
  category: foundations
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  pairs_with: []
  sources:
    - https://developer.apple.com/design/human-interface-guidelines/typography
    - https://developer.apple.com/design/human-interface-guidelines/sf-symbols
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for this skill when critiquing a screen's text and icon treatment: judging whether headings, body, and captions form a clear hierarchy; checking that text scales with Dynamic Type instead of using fixed point sizes; choosing or questioning font weights; or evaluating SF Symbols for rendering mode, weight, scale, and variant consistency. It is a design-review lens, not an implementation guide. Pair it with `hig-layout` for spacing and `hig-accessibility` for contrast and reader-mode behavior.

## Core guidance

- Prefer the built-in text styles (large title, title, headline, subheadline, body, callout, footnote, caption) over hard-coded sizes. They carry tuned size, weight, and leading, scale automatically with Dynamic Type, and keep hierarchy consistent across the system.
- Build hierarchy primarily through the semantic styles, then weight, then color or opacity — not by inventing arbitrary point sizes. Reserve the heaviest weights for short, high-priority text; long passages read better at regular or medium.
- Treat Dynamic Type as a requirement, not an option. Layouts must survive the accessibility sizes: text should reflow and truncate gracefully, never clip, and never be capped at a fixed maximum that defeats the user's setting.
- Protect legibility: keep ample contrast, avoid setting body copy in light or thin weights at small sizes, give lines room to breathe, and do not stretch, condense, or tint text in ways that fight readability.
- Match each SF Symbol to the weight and optical size of its adjacent text so glyph and label share one visual rhythm; a symbol beside body text should not look bolder or heavier than the words.
- Pick a rendering mode deliberately and apply it consistently. Monochrome reads as neutral and typographic; hierarchical adds depth in a single hue; palette uses two or more deliberate colors; multicolor preserves a symbol's intrinsic colors. Mixing modes arbitrarily across one screen looks unintentional.
- Use the system's symbol variants (outline versus fill, slash, enclosures) to signal state and selection, and align scale (small, medium, large) with surrounding type rather than resizing by hand.

## Platform notes

- iOS and iPadOS: text styles and Dynamic Type are the baseline expectation; verify the largest accessibility sizes on the smallest target. SF Symbols are first-class and should track the label font.
- macOS: hierarchy leans on weight and the system's smaller metrics; Dynamic Type is more limited, so contrast and weight discipline carry more of the load.
- watchOS: space is scarce — favor the compact text styles, lean on bold weight for glanceability, and keep symbols simple at small scale.
- tvOS: type is read at a distance, so prefer larger styles and heavier weight; thin weights and tight tracking fail across the room.
- visionOS: vibrancy and depth affect perceived contrast; confirm text and symbols stay legible against translucent and Liquid Glass surfaces in varied surroundings.

## Pitfalls

- Hard-coding point sizes (or capping Dynamic Type) so text cannot grow for users who need it.
- Faking hierarchy with many bespoke sizes instead of the semantic styles, producing an inconsistent, noisy scale.
- Over-using bold or black weights until nothing reads as emphasized.
- Symbols whose weight or scale clashes with the text beside them, looking pasted on.
- Switching rendering modes inconsistently, or choosing multicolor or palette where a neutral monochrome symbol was intended.
- Low-contrast text on busy or translucent backgrounds, especially light weights at small sizes.

## See also

For spacing, margins, and how type blocks sit within a layout grid, see `hig-layout`. For contrast ratios, Bold Text and Increase Contrast settings, and how typography choices interact with assistive technologies, see `hig-accessibility`.
