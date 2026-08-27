## Color role assignment
- [ ] Primary is used only for the most prominent interactive elements (FAB, filled buttons, active selection indicators) — not for decorative fills or informational content.
- [ ] Secondary and tertiary are supporting roles; no screen has all three competing at full saturation for visual dominance.
- [ ] Error and its container/on-variants are used exclusively for genuine error states, not for warnings, promotions, or decoration.
- [ ] Every background color is paired with its designated on- role (e.g., primaryContainer with onPrimaryContainer, not with onPrimary).
- [ ] Surface container tones (SurfaceContainerLowest through SurfaceContainerHighest) are used for depth hierarchy rather than arbitrary grays or custom alpha overlays.
- [ ] OutlineVariant is used only for decorative separators; Outline is used wherever a divider or border must meet contrast minimums.

## Tonal palette and seeding
- [ ] The palette is generated from a deliberate seed color, not assembled by hand-picking individual HEX values.
- [ ] The seed color for primary is sufficiently distant in hue from the M3 error red so that primary elements are not perceived as warning states.
- [ ] Secondary and tertiary seed colors feel harmonious with primary and do not create hue clashes at any generated tone.
- [ ] Any brand-specific fixed colors that appear alongside dynamic color are harmonized toward the dynamic primary using HCT-based harmonization.

## Light and dark schemes
- [ ] A full dark scheme is explicitly defined — not derived by inverting the light scheme.
- [ ] PrimaryContainer, SecondaryContainer, and TertiaryContainer tones are verified in dark mode; they shift to low (deep) tones and must remain distinguishable from the dark surface background.
- [ ] OnContainer colors are verified against their containers in dark mode at the correct tone pairs.
- [ ] Pure black (#000000) is not used as the dark surface; the M3 dark surface tone (approximately tone 6) is respected.
- [ ] Every color pairing is re-verified in dark mode, not assumed to be safe from light-mode testing.

## Dynamic color (Material You)
- [ ] Dynamic color is enabled for Android 12+ (API 31+) as the default experience; a fixed fallback palette covers older API levels.
- [ ] The UI is tested against at least four wallpaper hue extremes: red/orange, blue/violet, green, and neutral/gray.
- [ ] The dark scheme is verified under dynamic color, not only the light scheme.
- [ ] Brand-fixed elements (logo chips, illustrative accents) use harmonized colors, not raw fixed HEX values, to avoid clashing with the dynamic scheme.

## Contrast and accessibility
- [ ] All body and UI text color pairs meet 4.5:1 contrast ratio in both light and dark schemes.
- [ ] Large or bold text (18sp+ or 14sp+ bold) meets at least 3:1 contrast.
- [ ] OnSurfaceVariant is used for secondary text rather than applying alpha transparency to onSurface.
- [ ] No state, error, or status information is conveyed by color alone; every color cue has a paired icon, label, or shape change.
- [ ] Contrast ratios are verified with system-level accessibility settings enabled (large text, high contrast mode).
- [ ] The UI is reviewed in a grayscale simulation to confirm all hierarchy and state cues survive without color.

## Large screen and platform
- [ ] On large-screen / foldable layouts, surface container steps are used to separate panes; primary is not duplicated across regions to avoid competing focal points.
- [ ] If the app targets Wear OS, a dark-biased fixed palette with high-contrast on-colors is defined separately from the phone palette.
- [ ] If the app targets TV, tonal differences used for structural separation are large enough to be distinguishable at viewing distance.

## General hygiene
- [ ] No hard-coded hex or rgba values appear in component design tokens; all colors reference named roles from the color scheme.
- [ ] The color scheme is documented so developers can map each design token to its MaterialTheme.colorScheme property.
- [ ] Custom extension colors (e.g., warning, success) follow the same container/on-container pairing convention as M3 roles.
