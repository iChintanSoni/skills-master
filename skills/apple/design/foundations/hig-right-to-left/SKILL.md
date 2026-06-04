---
name: hig-right-to-left
description: "Design critique and guidance for right-to-left (RTL) layouts on Apple platforms per the Human Interface Guidelines. Use when reviewing or designing for Arabic, Hebrew, Farsi, or Urdu localizations, when deciding what to mirror vs. keep fixed (navigation, sliders, media controls, numerals), when aligning text or handling bidirectional content, or when a team still reasons in left/right instead of leading/trailing. Produces UX recommendations, not code."
tags: [rtl, localization, layout, accessibility, foundations]
x-skills-master:
  domain: apple
  class: design
  category: foundations
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  pairs_with: []
  sources:
    - https://developer.apple.com/design/human-interface-guidelines/right-to-left
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

# Right to Left (RTL) Layout

## When to use

Use this skill when designing, localizing, or critiquing an interface that must work in right-to-left languages such as Arabic, Hebrew, Farsi, or Urdu. Reach for it when deciding which elements mirror and which stay fixed, when text alignment or bidirectional content looks wrong, when reviewing icon and control direction, or when the team still describes layout in absolute left/right terms instead of leading/trailing. This is a design-review skill; it shapes layout decisions and acceptance criteria rather than producing implementation code.

## Core guidance

- **Reason in leading/trailing, not left/right.** Default every horizontal relationship to leading (where reading starts) and trailing (where it ends) so the full layout mirrors automatically in RTL. Reserve absolute left/right only for elements tied to physical space or world direction.
- **Mirror the overall flow: layout, navigation, and reading order.** Back buttons, disclosure chevrons, navigation pushes, and list affordances should flow from the trailing edge inward. Primary content and primary actions belong on the leading (right) side in RTL.
- **Flip controls that imply forward progress, and flip their glyphs with them.** Sliders, progress bars representing task completion, page indicators, and "next/previous" arrows track the reading direction, so increasing value moves leftward in RTL. Reverse the start/end glyphs to match, or the control reads backward.
- **Do not mirror media playback or time-based transport.** Play, fast-forward, and rewind point to the direction of the media itself, not the reading direction, so keep them fixed. Likewise leave clocks, timelines anchored to wall-clock time, and similar physical-direction elements unmirrored.
- **Never reverse numbers, numerals, or number-bearing content.** Digits, phone numbers, and figures stay left-to-right even inside RTL text. Localize the numeral system (Western vs. Eastern Arabic-Indic) rather than flipping the digits, and make sure numbers inside icons or badges are localized too.
- **Use natural text alignment and trust bidirectional layout.** Body and label text should align to the natural (trailing-in-RTL) edge automatically. Bidirectional runs (Latin words, URLs, code, or numbers inside Arabic) keep their own direction; design with breathing room so mixed-direction strings do not collide or get clipped.
- **Distinguish directional icons from absolute ones.** "Forward/backward" semantics should flip; "left/right" semantics (turn-by-turn arrows, a hardware-mapped control) should not. Audit each glyph for which meaning it carries before approving mirroring.
- **Review with pseudolocalization, not just English.** Critique the screen in an RTL pseudolanguage and a real Arabic or Hebrew build, checking edge cases: truncation, asymmetric padding, custom-drawn views, and any control that a designer hardcoded to one side.

## Platform notes

- **iOS, iPadOS, visionOS:** System navigation, tab bars, sidebars, and Liquid Glass functional controls mirror automatically when leading/trailing is used. Verify custom and full-screen layouts (onboarding, media players, games) where automatic mirroring is most often missed.
- **macOS:** Window chrome, toolbars, and sidebars mirror; toolbar item order reverses. Confirm any custom AppKit view that opts out of mirroring still reads correctly, especially media transport bars.
- **watchOS:** Limited space makes mixed-direction strings (numbers, units, complications) prone to clipping. Reserve room for localized numerals that may render wider.
- **tvOS:** Focus-driven navigation should follow reading direction; some stacked layouts do not mirror by default, so explicitly review focus order and arrow semantics in RTL.

## Pitfalls

- Mirroring a media play/transport control or a clock, so it points the wrong way.
- Flipping the slider track but forgetting to reverse its min/max glyphs, making it read backward.
- Reversing digits or phone numbers instead of localizing the numeral system.
- Hardcoding an icon or padding to the left/right edge, breaking the mirror for one stubborn element.
- Treating a "forward/backward" arrow as absolute (or a "left/right" arrow as directional) and flipping the wrong one.
- Signing off on RTL from a screenshot of English text right-aligned, without a real bidirectional build.

## References

- **Human Interface Guidelines:** [Right to left](https://developer.apple.com/design/human-interface-guidelines/right-to-left)
- **WWDC:** [Get it right (to left) (WWDC22)](https://developer.apple.com/videos/play/wwdc2022/10107/)
- **WWDC:** [Build global apps: Localization by example (WWDC22)](https://developer.apple.com/videos/play/wwdc2022/10110/)
- **Documentation:** [LayoutDirectionBehavior](https://developer.apple.com/documentation/swiftui/layoutdirectionbehavior)

## See also

- The SwiftUI/UIKit skill that implements mirroring and localized formatting in code (leading/trailing anchors, `environment(\.layoutDirection:)`, semantic content attribute, and `String(localized:)` number formatting).
- The HIG typography and the HIG inclusion/accessibility foundations skills, which inform text alignment and bidirectional content decisions alongside this one.
