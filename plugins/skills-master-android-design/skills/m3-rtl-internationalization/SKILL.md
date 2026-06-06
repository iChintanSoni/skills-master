---
name: m3-rtl-internationalization
description: Design critique and guidance for right-to-left and internationalized layouts on Android using Material 3. Use when reviewing or designing for Arabic, Hebrew, Farsi, Urdu, or other RTL localizations, when deciding which icons to mirror vs. keep fixed, when handling text expansion and truncation across locales, or when the team still reasons in left/right terms instead of start/end. Produces UX recommendations, not implementation code.
---

## When to use

Use this skill when designing, reviewing, or localizing a Material 3 Android interface that must work in right-to-left languages such as Arabic, Hebrew, Farsi, or Urdu, or when internationalizing a layout for any locale. Reach for it when deciding which elements should mirror and which must stay fixed, when text expansion or truncation causes layout breakage, when locale-aware number and date formatting is in question, or when the team describes layout in absolute left/right terms instead of the language-neutral start/end. This is a design-review skill; it shapes layout decisions and acceptance criteria rather than producing resource files or Compose code.

## Core guidance

- **Reason in start/end, never left/right.** Every horizontal spatial relationship in a Material 3 layout should be expressed in terms of its leading (start) and trailing (end) edges so the full layout mirrors automatically in RTL. Reserve absolute directional references only for elements that represent physical world direction (a map compass rose, a panoramic camera swipe indicator).

- **Mirror the reading flow: navigation, hierarchy, and progress.** Back affordances, disclosure chevrons, drawer handles, navigation rail leading icons, and list-item trailing actions all follow reading direction and must mirror. In RTL, the primary action or content origin is at the right edge; navigation advances leftward. The Material 3 NavigationDrawer, NavigationBar, and NavigationRail composables mirror automatically when the locale is RTL, provided the layout uses start/end semantics throughout.

- **Mirror directional icons; leave orientation-neutral icons alone.** An icon whose meaning is "move forward" or "move backward" (a forward arrow, a send icon pointing right, a "skip next" chevron) should flip in RTL. An icon whose shape is not directional (a camera lens, a star, a trash can, a heart) must not flip. Physically directional icons that represent a real-world object in a fixed orientation (a clock face, a hand holding a phone, a steering wheel) must also stay fixed. Audit each icon before approving mirroring; an incorrectly mirrored icon is more disorienting than a wrongly fixed one.

- **Do not mirror media transport or time-based controls.** Play, pause, fast-forward, rewind, and seek bar direction are tied to the media timeline, not reading direction. The scrubber always advances left to right in the physical sense of "time moving forward." Mirroring these controls for RTL is a bug, not a feature, and contradicts user expectations from global media apps.

- **Never reverse digits or numerals; localize the numeral system instead.** Phone numbers, prices, distances, and percentages remain in left-to-right order even inside RTL text runs. When a locale uses Eastern Arabic-Indic digits (Arabic, Persian), the numeral characters themselves are localized — the direction they read is not reversed. Confirm that number-bearing icons and badges draw from the locale's numeral system rather than always using Western ASCII digits.

- **Budget for text expansion in every language.** German, Finnish, and many other languages expand English strings by 30–40%. Arabic and Thai may render shorter but require more vertical space for diacritics and script complexity. Design every text container with graceful truncation behavior (an ellipsis that respects start vs. end, never a hard clip), and test the layout at 150% of the base string length to catch overflow before localization QA. Material 3 composables such as Text, Button, Chip, and ListItem truncate at the trailing edge by default; verify this behavior is semantically correct for your content.

- **Align body text to the natural (locale) edge; never force alignment.** Text in an RTL locale should align to the right (its natural leading edge) by default. Hardcoding a text composable to left-align is almost always wrong in a localized layout. Centered text is usually safe across both directions. Numeric content in a table or data list may legitimately require end-alignment regardless of locale.

- **Design for bidirectional strings.** RTL layouts regularly contain embedded LTR fragments — Latin-script brand names, URLs, inline code, and numbers. These runs keep their own direction inside the surrounding RTL paragraph. Leave enough horizontal padding and word-wrap room so mixed-direction strings do not collide with neighboring elements or get clipped at one end. Avoid placing action buttons immediately after a text label that may include a bidirectional run, since the button's position relative to the text end is unpredictable at design-time.

- **Use locale-aware formatting for dates, times, and measurements.** The date "6/6/26" means different things in the US and UK. Currency symbols position differently by locale. Distance units, measurement conventions, and even paragraph direction cues all vary. Design should flag these as locale-sensitive placeholders and confirm that the composable or formatting layer will resolve them at runtime rather than hardcoding a format.

- **Validate with pseudo-locales before real-locale QA.** The Android pseudo-locales (en-XA for character expansion, ar-XB for RTL bidirectionality) surface layout problems without requiring translated strings. Designs should be reviewed against pseudo-locale screenshots to catch truncated labels, clipped icons, and misaligned hit targets before strings are sent for translation.

## Platform notes

**Compact phones (standard portrait):** The narrowest form factor is where text expansion causes the most damage. Button labels, navigation item labels, and chip text are the first to overflow. Truncation and wrapping behavior must be explicitly designed, not left to runtime defaults. Confirm that critical information is never lost to truncation on a 360 dp wide screen.

**Large screens and foldables:** Adaptive layouts using the Material 3 canonical patterns (list-detail, supporting pane, feed) must ensure that both panes mirror correctly in RTL and that the reading order across panes is logical — typically the primary/list pane remains at the start edge in both LTR and RTL. The `NavigationSuiteScaffold` composable from material3-adaptive mirrors its rail/drawer affordances correctly; verify that content pane start/end relationships also mirror consistently.

**Split-screen and windowed modes:** On large screens, apps may appear side-by-side with a fixed physical screen edge. Layout direction is still governed by the app's locale, not screen position, so start/end semantics remain correct and must be applied consistently.

**Wear OS:** Very limited space makes bidirectional string collisions especially problematic. Single-line composables on Wear should be reviewed with the longest expected localized string, including RTL locales, to ensure readability on the round display.

**Android TV:** Focus-based directional navigation must follow the reading direction. D-pad left in RTL means "move toward start," which may advance rather than retreat in a list. Confirm that focus traversal order is tested in RTL to avoid counter-intuitive navigation.

## Pitfalls

- Mirroring a media playback control (play, rewind, seek bar) so it points the wrong direction relative to the media timeline.
- Flipping a slider track or progress indicator but forgetting to mirror its min/max icon glyphs, producing a contradiction where the icon and value advance in opposite directions.
- Reversing the order of digits in a phone number, price, or date by applying RTL text direction to a number-only string.
- Hardcoding text alignment or icon position to a physical edge ("left-pad this icon 16 dp") instead of the start/end semantic equivalent, leaving one locale broken.
- Mirroring an orientation-neutral icon (camera, trash, heart) because "all icons mirror in RTL" — this is a common over-application of the mirroring rule.
- Signing off RTL review from right-aligned English text screenshots rather than building against ar-XB or a real Arabic locale, which reveals bidirectional string and icon issues that alignment alone cannot catch.
- Designing text containers that clip rather than truncate, losing meaningful content at the non-visible edge.
- Ignoring text expansion in non-RTL locales (German, Finnish) because the visual design was only reviewed in English.

## References

- **Material 3 Guidelines:** [Foundations overview](https://m3.material.io/foundations/overview)
- **Developer Guide:** [Localization and resources](https://developer.android.com/guide/topics/resources/localization)

## See also

The Compose layout code skill covers the implementation of start/end padding, `CompositionLocalProvider` for `LocalLayoutDirection`, and `Modifier.mirroring` for icon composables. The Compose theming code skill covers locale-aware typography and `MaterialTheme` configuration. The Material 3 accessibility design skill addresses how reading order and focus traversal intersect with RTL layout, complementing the directional decisions described here.
