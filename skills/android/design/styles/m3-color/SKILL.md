---
name: m3-color
description: "Design critique and guidance for the Material 3 color system on Android: tonal palettes, semantic color roles, light and dark schemes, dynamic color on Android 12+, accessible pairings, and role selection for hierarchy and emphasis. Use when designing or auditing a color palette, choosing between primary/secondary/tertiary roles, evaluating contrast in light or dark themes, or deciding whether to adopt dynamic color (Material You)."
tags: [m3, design, color, accessibility, material-you, android]
x-skills-master:
  domain: android
  class: design
  category: styles
  platforms: ["android", "large-screen"]
  pairs_with: [compose-theming]
  sources:
    - https://m3.material.io/styles/color/system/overview
    - https://developer.android.com/develop/ui/compose/designsystems/material3
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

- Defining or reviewing a brand color palette for a new Material 3 Android app.
- Auditing which color roles are mapped to which UI elements and whether the hierarchy reads correctly.
- Evaluating whether contrast is sufficient in both light and dark schemes, including with system-level accessibility settings.
- Deciding whether to adopt dynamic color (Material You) and how to blend it with a fixed brand palette.
- Reviewing how color communicates state, error, emphasis, and status without relying on hue alone.

## Core guidance

### The palette foundation

- **Start with one or two seed colors, let the system generate the rest.** The M3 color system derives five tonal palettes — primary, secondary, tertiary, neutral, and neutral-variant — from a small number of seed colors via the HCT color space. Resist the temptation to hand-pick every tone; the generated palettes maintain perceptual harmony and ensure every role (including its container and on-variants) is accessible by default.

- **Understand the 13-tone palette before overriding it.** Each palette has tones from 0 (black) to 100 (white) in named steps. Light schemes pull content colors from low tones and container colors from high tones; dark schemes invert this. Overriding individual tones without understanding this structure breaks the carefully engineered contrast relationships.

- **Keep secondary and tertiary palettes supporting, not competing.** Secondary supports primary for components like chips and filters; tertiary introduces a contrasting accent for highlights or floating elements. If all three feel equally prominent, reduce the saturation or shift the tone of secondary and tertiary.

### Semantic color roles

- **Use roles by their semantic intent, not their visual appearance.** Primary is for the most prominent interactive elements (FABs, filled buttons, active states). Secondary is for less prominent, complementary surfaces and controls. Tertiary is for accents that contrast with primary. Surface and its container hierarchy are for backgrounds and cards. Never pick a role because its generated color happens to look nice today — the scheme may shift with dynamic color or a future theme change.

- **Pair each role with its on- counterpart.** Every role has a corresponding on-role (onPrimary, onSurface, onError, and so on) guaranteed to meet contrast at the standard M3 contrast ratio. Using onPrimary text on a primaryContainer background is a common mistake: the contrast is not guaranteed. Match backgrounds to their dedicated on- color.

- **Reserve error and its variants for genuine error states only.** Error signals failure, validation problems, and destructive outcomes. Using error colors for decorative purposes or non-critical warnings trains users to ignore them. Warnings deserve a custom extension role (or the tertiary accent), not the error role.

- **Use surface containers to create depth without elevation color.** SurfaceContainer, SurfaceContainerLow, and SurfaceContainerHigh replace the M2 elevation overlay technique. Cards, bottom sheets, and dialogs step through these to signal hierarchy, while the tonal values remain cohesive within the scheme.

- **Outline and outlineVariant are not interchangeable.** Outline is for dividers and borders that need to meet minimum contrast; outlineVariant is for decorative separators on surfaces where full contrast is unnecessary. Using outlineVariant for interactive field borders can cause accessibility failures.

### Hierarchy and emphasis

- **Express hierarchy through role, not arbitrary opacity.** Resist adding alpha to primary or onSurface to create secondary labels. Use onSurfaceVariant for secondary text; it is already tuned for the right contrast step below onSurface. Arbitrary opacity layers stack unpredictably against different background tones and break in dark mode.

- **Limit the number of active roles per screen.** A typical screen should foreground one dominant role (usually primary) with supporting use of secondary or tertiary. Screens that use primary, secondary, tertiary, and error all at once at full saturation produce visual competition, not hierarchy.

- **Color alone must never be the sole indicator of state or meaning.** Status indicators, selection states, and error messages must combine color with a change in shape, label, icon, or position. Users with protanopia or deuteranopia cannot distinguish red from green; the design must work in grayscale too.

### Dynamic color and Material You

- **Treat dynamic color as the preferred default on Android 12 and later, not an opt-in premium.** When a user sets a wallpaper on a supported device, Android generates a harmonized color scheme from it. Embracing this creates a personalised experience that feels native to the platform. A fixed fallback palette is still required for older devices.

- **Test both dynamic and fixed palettes across multiple wallpaper hues.** Dynamic generation can produce a primary that clashes with brand imagery or makes text on photos difficult to read. Evaluate the scheme against purple, orange, green, and cool-blue wallpapers — the widest trouble cases.

- **Harmonize brand-specific non-M3 colors against the dynamic scheme.** If the app has a persistent brand element (a logo chip, a status badge) with a fixed hue, use the HCT-based harmonization utility to shift that fixed color closer to the dynamic primary without fully replacing it. This prevents jarring hue contrast between brand and system-derived colors.

- **Do not disable dynamic color solely to preserve brand color.** An exact brand color should live in brand imagery, illustrations, or a logo — not in every interactive control. The app can coexist with dynamic color while keeping brand identity in surfaces and illustrations that are explicitly brand-owned.

### Light and dark schemes

- **Design for dark as a parallel effort, not an inversion.** Dark schemes swap which tones are used from each palette; they do not simply invert the light scheme. Dark backgrounds pull from low tones while on-colors pull from high tones. Colors that feel muted in light mode will feel vivid in dark; verify every role pair rather than assuming automatic inversion.

- **Avoid pure black (#000000) backgrounds in dark mode.** The M3 dark surface is tone 6, not 0. Pure black next to colored elements creates harsh halation and makes the palette feel disconnected from the tonal system. SurfaceDim (tone 6) and SurfaceContainerLowest provide deep backgrounds without pure black.

- **Recheck container roles in dark mode.** PrimaryContainer in dark mode is a low-tone (deep) color, not the light pastel from the light scheme. On-text and icons inside containers must still use onPrimaryContainer, which shifts to a high tone in dark. Hardcoding colors for one appearance will fail in the other.

## Platform notes

- **Compact phones (the baseline form factor):** Color hierarchy does its heaviest lifting here because screen real estate is limited and visual scanning is fast. Primary should mark the single most important action; surface container hierarchy should separate cards from the background without heavy shadow.

- **Large screens and foldables:** Expanded layouts introduce multi-pane UIs where more than one primary region competes. Consider using SurfaceContainerLow for the list pane and SurfaceContainerHigh for the detail pane to create spatial separation through tonal step rather than a hard dividing line. Primary should still point to one dominant action per logical region.

- **Wear OS:** The always-on display and small circular canvas demand very high contrast ratios. Dark-mode-like schemes dominate; containers with low-tone backgrounds and high-tone on-colors work best. Dynamic color is not available on Wear OS; use a carefully tuned fixed palette.

- **Android TV / Google TV:** Color roles must survive at viewing distance and under varying room lighting. Avoid relying on subtle tonal differences (e.g., SurfaceContainerLow vs SurfaceContainer) for structural cues — the difference may be imperceptible on TV panels. Use bolder tonal steps and ensure focus-ring color (typically primary or its container) has very high contrast against content backgrounds.

## Pitfalls

- Using an on- color on the wrong container background (e.g., onPrimary on primaryContainer) and assuming it will be accessible — it is not guaranteed.
- Picking a seed color that generates a primary too close in hue to the error red, causing users to perceive normal UI as warning states.
- Applying a fixed fallback palette on Android 12+ devices and never testing with dynamic color enabled.
- Overriding SurfaceContainer roles with arbitrary grays and losing the tonal relationship that creates perceived depth without shadows.
- Using transparency on onSurface instead of onSurfaceVariant to create secondary labels, causing unpredictable results across surface container tones.
- Shipping only a light-mode palette and auto-inverting for dark mode in code rather than defining a proper dark scheme.
- Using error colors for warnings, low-battery notices, or promotional banners, which desensitizes users to genuine errors.
- Assuming WCAG 2.1 AA compliance at the seed level; contrast must be verified at the exact tone pair used in the generated scheme, especially after any custom overrides.

## References

- **Material 3 Guidelines:** [Color system overview](https://m3.material.io/styles/color/system/overview)
- **Documentation:** [Material 3 in Jetpack Compose](https://developer.android.com/develop/ui/compose/designsystems/material3)
- **Material 3 Guidelines:** [Color roles](https://m3.material.io/styles/color/roles)
- **Material 3 Guidelines:** [Dynamic color](https://m3.material.io/styles/color/dynamic)
- **Material 3 Guidelines:** [Dark theme](https://m3.material.io/styles/color/system/overview)
- **Material 3 Guidelines:** [Accessibility — Color and contrast](https://m3.material.io/foundations/overview)

## See also

- The **compose-theming** code skill implements MaterialTheme.colorScheme, dynamic color setup, light/dark scheme switching, and custom color extension via CompositionLocal.
- The **m3-typography** design skill covers type scale roles and how they interact with color for legibility and hierarchy.
- The **m3-accessibility** design skill covers contrast auditing, color-alone restrictions, and large-text minimum ratios in the context of M3 components.
