---
name: m3-dark-theme
description: Design guidance and critique for Material 3 dark theme on Android — surface tones, tonal elevation, container hierarchy, dynamic color in dark, contrast and legibility. Use when designing or reviewing a dark-theme UI, auditing tonal surface hierarchy, choosing between pure-black and M3 near-black surfaces, verifying contrast ratios in both themes, or deciding how dynamic color interacts with dark palettes.
---

## When to use

- Designing or critiquing any screen, component, or flow that must work in dark theme.
- Evaluating surface and container color choices for correct tonal hierarchy in dark mode.
- Deciding whether to support dynamic color (Material You) and what that means for your dark palette.
- Auditing contrast ratios, legibility, and elevation expression in dark mode before handoff or launch.
- Checking that custom brand colors are adapted for dark use rather than naively carried over from light.

## Core guidance

### Surface tones and the baseline dark palette

- **Start from the M3 dark baseline, not from a manually darkened light palette.** M3 generates dark color schemes from the same key color tones as light — the dark surface sits at tone 6 of the neutral palette, not at an arbitrary hex. This preserves hue relationships and ensures the 27 color roles remain harmonious. Use Material Theme Builder to generate both schemes together.
- **Use `surface`, `surfaceVariant`, and `surfaceContainerLowest` through `surfaceContainerHighest` for backgrounds.** These five container levels create a clear background hierarchy without hand-mixing grays. `surfaceContainerLowest` is the deepest level; `surfaceContainerHighest` is the most elevated. Map layout layers — screen background, cards, dialogs, bottom sheets — to the appropriate container token, not to raw hex values.
- **Never use pure black (#000000) as your surface.** Pure black destroys the tonal elevation system: raised surfaces (sheets, cards, dialogs) use a white overlay at low alpha to express elevation, and that overlay vanishes against absolute black. M3's dark `surface` (tone 6) is a near-black that retains enough lightness to allow elevation tones to read.

### Elevation expressed through tone, not shadow

- **In dark theme, elevation is communicated through surface tint, not drop shadows.** M3 applies a primary-color tint at increasing opacity as elevation rises — this is the tonal elevation system. A bottom sheet sitting over the base surface should be visibly lighter, not deeper. Design flows that rely on shadow depth in light mode may need to be re-evaluated: shadow contrast inverts poorly on dark surfaces.
- **Respect the five `surfaceContainer` levels for the full elevation range.** Do not invent intermediate grays outside the tonal palette. If a surface needs to feel higher than `surfaceContainerHighest`, reconsider the information architecture — compressing too many raised layers causes the hierarchy to collapse.
- **Dialogs, menus, and bottom sheets should land on `surfaceContainerHigh` or `surfaceContainerHighest`.** This creates a clear visual separation from the underlying screen surface without requiring hard borders or heavy shadows.

### Container and content color pairs

- **Always use a color role together with its paired on-color role.** The role `primaryContainer` is designed to be legible only with `onPrimaryContainer` content placed on top of it; mixing container backgrounds with on-colors from other roles breaks the contrast guarantees baked into the palette. In dark theme these pairs shift dramatically from their light equivalents — `primaryContainer` in dark is a deep, muted tone, not the bright filled shape it is in light.
- **Distinguish interactive containers from static surfaces.** Filled buttons and chips sit on `primary` or `secondaryContainer`; informational cards and banners sit on `surfaceContainer` variants. In dark theme the distinction matters even more because many tones converge near the dark end of the scale.

### Dynamic color in dark theme

- **Dynamic color generates both a light and a dark scheme from the wallpaper seed.** Do not assume the dark dynamic palette looks like a darkened version of the light dynamic palette — it is an independent derivation. Test dark dynamic color on real devices with a variety of wallpapers, including low-saturation ones, because the resulting palette can be very muted.
- **Verify brand identity survives dynamic color.** On Android 12+ devices, dynamic color may replace your brand colors entirely. If brand recognition is critical, consider using a secondary or tertiary slot for brand accents and occupying only the surface and container roles with dynamic tones. Communicate this tradeoff to stakeholders before committing to full dynamic color adoption.
- **Custom colors that live outside the M3 role system need explicit dark variants.** A `warning` or `success` semantic color that is defined outside the 27-role palette will not automatically shift for dark theme. Provide a deliberately chosen dark variant (typically a lighter, desaturated version of the light color) so it remains accessible over dark surfaces.

### Contrast and legibility

- **Target a minimum contrast ratio of 4.5:1 for body text and 3:1 for large text or iconography against their surface.** M3's on-color roles are calibrated to meet these ratios over their paired backgrounds, but custom colors and non-standard pairings must be verified manually.
- **Do not over-saturate colors in dark theme.** Saturated hues vibrate visually on near-black backgrounds and can be uncomfortable for extended reading. M3's dark palette naturally desaturates primary and secondary tones; brand overlays and illustration colors should follow the same principle.
- **Design for the full range of system accessibility settings.** Users may enable high-contrast mode, which shifts color roles further apart. Avoid hairline borders and low-contrast separators that only read at the default setting. Test surfaces with `surfaceVariant` dividers at minimum contrast thresholds.

### Testing both themes

- **Design in both themes from the beginning, not as a polish pass.** Color decisions that look balanced in light — large saturated fills, subtle low-contrast labels — can fail catastrophically in dark. Alternate between themes throughout design iteration rather than retrofitting at the end.
- **Use real device previews, not just design tool simulations.** OLED displays render absolute black as truly unlit pixels, exaggerating the pure-black pitfall described above. LCD panels spread dark tones more evenly. Test on both display technologies if your audience is broad.
- **Check illustrations, photography, and custom iconography separately.** These assets do not automatically adapt to dark theme. An illustration with a white background will appear as a glaring rectangle on a dark surface. Plan for asset-specific dark variants or transparent-background versions early in the design process.

## Platform notes

- **Compact phones (portrait):** The full five-level container hierarchy applies. Bottom sheets and dialogs are common elevation waypoints; verify their tonal separation from the base surface on the smallest and largest screen widths in the compact range.
- **Large screens and foldables:** With expanded layouts, more surface layers may be visible simultaneously — a list pane on `surfaceContainerLow` alongside a detail pane on `surface`. The tonal difference between adjacent panes must be sufficient to read as a boundary without a hard divider. Test inner and outer folds side by side in dark theme.
- **Wear OS:** The circular form factor and small screen push surface hierarchy toward simpler, flatter compositions. Tonal elevation still applies, but use it sparingly — one or two levels rather than five. OLED displays on Wear make pure-black backgrounds a deliberate power-saving choice that is appropriate on watches but not on phone-sized OLED panels where content density defeats the savings.
- **TV (Lean-back UI):** Dark backgrounds are the norm for video content surfaces; standard M3 dark palettes apply. Ensure that interactive surfaces (cards in focus states) use tonal elevation or focus rings with sufficient contrast for viewing distance, since shadows are imperceptible at ten feet.

## Pitfalls

- **Pure-black backgrounds** — destroy tonal elevation expression; use M3's `surface` at tone 6 instead.
- **Carrying light-mode custom colors into dark without adaptation** — saturated fills designed for white backgrounds appear harsh and fail contrast checks on near-black surfaces.
- **Pairing on-colors incorrectly** — placing `onPrimary` content over `primaryContainer` breaks the contrast guarantees; always use the matched on-color role.
- **Treating dark theme as a final-step inversion** — hierarchical decisions made only for light mode rarely survive the transition intact; design both themes in parallel.
- **Ignoring dynamic color in dark** — assuming dynamic color only affects light mode means dark-theme users on Material You devices may see untested, brand-inconsistent palettes.
- **Over-relying on shadows for elevation** — shadows become invisible on dark surfaces; surfaces must use tonal differentiation as the primary elevation signal.
- **Forgetting non-M3-role custom colors** — semantic colors like warning, success, or error extensions require explicitly designed dark variants; they will not automatically adapt.
- **Testing only on emulator or design tool** — OLED rendering on physical devices reveals pure-black issues, bloom around bright elements, and accurate dark-tone reproduction that emulators can misrepresent.

## References

- **Material 3 Guidelines:** [Color System Overview](https://m3.material.io/styles/color/system/overview)
- **Documentation:** [Dark Theme on Android](https://developer.android.com/develop/ui/views/theming/darktheme)
- **Material 3 Guidelines:** [Dark Theme Guidance](https://m3.material.io/styles/color/system/overview)
- **Tool:** [Material Theme Builder](https://material-foundation.github.io/material-theme-builder)

## See also

The m3-color-system design skill covers the full 27-role color model, tonal palettes, and how light and dark schemes are derived from a seed color — dark theme design builds directly on that foundation. The m3-typography design skill is relevant when auditing text legibility and on-surface contrast ratios. For elevation and surface layer decisions on large screens, see the m3-layout design skill. The compose-theming code skill implements dark theme support in Jetpack Compose, wiring `darkColorScheme`, `isSystemInDarkTheme`, and dynamic color — hand color implementation work there rather than here.
