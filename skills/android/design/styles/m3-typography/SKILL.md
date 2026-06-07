---
name: m3-typography
description: "Critiques typography choices against Material 3 design principles, covering the five type-role families (display, headline, title, body, label) at large/medium/small, mapping those roles to visual hierarchy, variable font usage, readable line lengths, and honoring the user's font-size preference. Use when reviewing a screen's text hierarchy, evaluating whether type roles are applied semantically, deciding between competing type roles, assessing readability at different densities, or auditing a layout for respect of system font-scale settings."
tags: [m3, design, typography, material-you, android]
x-skills-master:
  domain: android
  class: design
  category: styles
  platforms: ["android", "large-screen"]
  pairs_with: [design-system-customization]
  sources:
    - https://m3.material.io/styles/typography/overview
    - https://developer.android.com/develop/ui/compose/designsystems/material3
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for this skill when assessing a screen's type treatment: whether headings, body copy, and supporting labels form a clear, intentional hierarchy; whether the chosen type roles match their semantic purpose; or whether long-form text will remain readable across compact and expanded layouts. It is a design-review lens, not an implementation guide. Pair it with the M3 color design skill for contrast evaluation and the M3 layout design skill for line-length and spacing decisions. Implementation lives in the `MaterialTheme.typography` token system accessed via Compose's `Text` composable and typed slot APIs — hand specifics to the code skill.

## Core guidance

- **Use the five role families as a semantic vocabulary, not a size ladder.** Display, headline, title, body, and label each carry a communicative purpose: display for expressive hero moments, headline for screen-level section titles, title for card or list-item prominence, body for sustained reading, and label for compact UI chrome like buttons and captions. Choosing a role because it happens to be the right pixel size — rather than because it fits the content's purpose — undermines the system.

- **Lean on role size variants (large / medium / small) to tune density without abandoning the role.** A dense information list may call for Body Small rather than Body Large, but it should still use Body rather than Label. Reserve Label roles for non-reading contexts: button text, tab labels, metadata chips, form field hints.

- **Build hierarchy in layers, not with arbitrary custom sizes.** A well-composed screen typically needs no more than three or four distinct type roles visible simultaneously. Resist the urge to introduce bespoke sizes between roles; instead, reinforce hierarchy through the role combination, weight, color emphasis (on-surface vs on-surface-variant), and whitespace.

- **Treat Display roles as accents, not defaults.** Display Large, Medium, and Small are expressive and large-scale — appropriate for splash screens, large editorial headers, and hero numbers. Overusing them throughout a standard app screen reads as shouting; they lose impact and compete with actual content.

- **Respect the user's font-scale preference unconditionally.** Android's system font-size setting scales type across all apps; layouts must accommodate these changes gracefully. Text must reflow and containers must expand rather than clip or overlap. Never cap text size programmatically to preserve a fixed layout — redesign the layout to be flexible instead.

- **Variable font axis choices follow role intent.** M3's reference typeface (Roboto Flex) exposes weight, width, and optical-size axes. Optical size should track the rendered size of the role: smaller roles benefit from slightly wider letterforms and increased spacing for legibility, larger display roles can afford tighter, narrower settings. Avoid applying maximum width compression to body copy — it trades readability for density.

- **Line length directly affects reading comfort for Body roles.** For sustained reading (Body Large and Body Medium), target 50–75 characters per line (roughly 40–80 sp column width on a standard density screen). Lines that are too long force tiring eye travel; lines that are too short fragment meaning. Label and title roles used in single-line or short contexts are less sensitive to this constraint.

- **Pair type roles with appropriate line-height and letter-spacing values from the M3 scale.** The type scale ships with tuned line-height and tracking for each role. Overriding these (for example, tightening line-height on Body to save space) degrades readability and creates inconsistency with system components. If space is the concern, reconsider the layout density or switch to a smaller size variant.

- **Do not use type-role size as a substitute for semantic structure.** A section title should use a Headline or Title role because it is structurally a header, not merely because it should be bigger than body text. This semantic alignment matters for accessibility services that infer document structure from visual prominence.

- **Ensure sufficient contrast for all type roles.** Body and Label roles at small sizes are most vulnerable. On-surface and on-surface-variant tokens are the correct pairings for most text; ensure any custom color applied to text meets WCAG AA (4.5:1 for small text, 3:1 for large text as defined by WCAG).

- **Avoid using weight alone to create the entire hierarchy.** Bold-everything patterns desensitize the eye. Weight differentiation has impact only when most text is regular or medium weight. Reserve Bold and ExtraBold for the single most prominent element in a section.

## Platform notes

**Compact phones (the baseline):** The type scale is designed for this form factor. Layout columns are narrow, so line-length discipline for Body roles is critical. Font-scale accessibility testing must be done on the smallest target device at the largest accessible font size.

**Large screens and foldables (expanded and medium window-size classes):** Wider columns demand active line-length management — multi-column layouts or constrained content widths for reading surfaces. Display roles have more room to breathe and can be used more generously for editorial moments. Headline and Title roles may be promoted in hierarchy as navigation surfaces (sidebars, navigation rails) become visible and consume some of the vertical prominence they would occupy on compact.

**Tablets in landscape:** Watch for text that was acceptable at one column width becoming too long at expanded width. Adaptive layouts should clamp reading columns rather than stretching type full-bleed across a 12-column grid.

**Wear OS:** M3 Wear has a separate, more constrained type scale. Display roles are not applicable; short, bold, glanceable text at Title or Body medium-small is the norm. Line length is rarely a concern but single-line truncation discipline is essential.

**TV (large distance viewing):** Text must be larger and heavier than standard M3 defaults to remain legible from the couch. Display and Headline roles become the working baseline; Body Small and Label roles are generally inappropriate for primary content.

## Pitfalls

- Picking a type role because it matches a desired pixel size rather than its semantic function, resulting in Body-sized Headline text or Headline-sized Label text.
- Using Display roles throughout a standard information screen, inflating visual noise and depleting their expressive impact.
- Overriding line-height or letter-spacing to reclaim space, silently breaking the readability and rhythmic consistency the scale provides.
- Capping or ignoring the system font-scale preference, locking users who depend on larger text out of readable content.
- Applying more than four or five distinct type roles on a single screen, producing a visually chaotic hierarchy with no clear entry point.
- Choosing type color purely for aesthetics without verifying contrast ratios against the background surface token.
- Using weight variation as the only differentiator, especially when most text is bold, eliminating the signal weight is meant to carry.
- Failing to test line length at expanded window sizes, allowing body copy to span uncomfortably wide on tablets and foldables in landscape.

## References

- **Material 3 Guidelines:** [Typography Overview](https://m3.material.io/styles/typography/overview)
- **Documentation:** [Material 3 in Jetpack Compose](https://developer.android.com/develop/ui/compose/designsystems/material3)

## See also

For how type tokens surface through the Compose design system — accessing `MaterialTheme.typography` slots, applying roles via `Text`, and customizing the type scale in a `MaterialTheme` wrapper — see the corresponding Android code skill. For color pairings that ensure legible contrast on M3 surfaces, see the M3 color design skill. For layout grid decisions that directly affect reading line length and typographic rhythm, see the M3 layout design skill.
