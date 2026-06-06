---
name: m3-icons
description: "Design-critique guidance for Material Symbols iconography in Material 3 Android apps: the variable font axes (weight, fill, grade, optical size), sizing and touch-target alignment, filled vs outlined usage conventions, iconographic consistency, and accessibility labeling for actionable icons. Use when choosing between filled and outlined icon variants; when calibrating icon size, visual weight, or optical size for body text, headlines, or toolbar contexts; when ensuring icon state changes communicate correctly without color alone; when auditing icon set consistency across an app; or when reviewing whether interactive icons carry accessible labels."
---

## When to use

- Selecting or auditing icons for a new screen, component, or design system token set.
- Deciding between filled and outlined variants for a navigation destination, toolbar action, or content label.
- Calibrating the four variable font axes so icons harmonize with adjacent text styles and UI density.
- Confirming that icon-based state changes (selected/unselected, active/inactive) communicate through shape or fill rather than color alone.
- Reviewing touch-target compliance and accessible content-description coverage for all interactive icons.
- Adapting icon sizing and weight across compact phone layouts, tablet split-screens, and foldable inner displays.

## Core guidance

### The four axes

- **Weight controls stroke thickness.** The scale runs from 100 (hairline) to 700 (heavy). Match weight loosely to nearby text weight: a body-text label at Regular (400) pairs with Weight 400 icons; a bold heading or an icon standing alone at large size reads better at 500–600. Avoid extremes (100 or 700) in dense UI — they either disappear or overpower.
- **Fill controls the solid vs hollow interior.** Fill 0 is the outlined variant; Fill 1 is the filled variant. Use fill as a binary state signal: filled = selected or active, outlined = unselected or default. Because fill is a continuous axis (0–1), animated transitions between states look intentional and polished rather than a jarring swap between two separate glyphs.
- **Grade adds optical emphasis without changing stroke weight.** Negative grade (down to -25) recedes the icon — appropriate in low-emphasis secondary contexts or on dark surfaces where unmodified strokes can bloom. Positive grade (up to 200) reinforces the icon on light surfaces or for accessibility at small sizes. Grade is the fine-tuning knob, not the primary weight controller.
- **Optical size aligns glyph design to physical size.** Optical size 20 is designed for icons rendered at 20 dp; optical size 48 is designed for 48 dp. At small sizes the design opens up strokes and enlarges detail to stay legible; at large display sizes it tightens detail for precision. Always set optical size to match the dp rendering size rather than leaving it at a default that mismatches the context.

### Filled vs outlined

- **Use outlined icons as the default resting state** for navigation, toolbar actions, and content labels. Outlined icons are lighter and create less visual noise when repeated across a surface.
- **Use filled icons to signal selection, activation, or current location.** The canonical example is a bottom navigation bar: the active destination carries a filled icon, inactive destinations carry outlined icons. This convention is load-bearing — violating it requires an equally legible alternative state signal (indicator chip, badge, typographic label) or users lose spatial orientation.
- **Avoid mixing filled and outlined icons at the same hierarchy level for non-state reasons.** A toolbar where half the icons are filled and half are outlined for stylistic reasons reads as inconsistent, implying a state difference that does not exist.
- **Choose one style family and maintain it.** Material Symbols ships rounded, sharp, and outlined families. Pick rounded (the Material 3 default and the most approachable) or sharp and commit; mixing families across a single app is almost always wrong.

### Sizing and touch targets

- **Standard icon rendering size is 24 dp.** This is the design baseline for most toolbar, list, and inline use. Pair it with optical size 24 (or the nearest available step: 20 or 24).
- **Minimum touch target for interactive icons is 48 × 48 dp**, regardless of how the icon glyph is rendered. `IconButton` in Compose enforces this automatically; verify that custom placements still satisfy it. Never reduce the tap area to match a visually small icon.
- **Small inline icons (16–20 dp)** are acceptable when non-interactive (decorative or label-adjacent). Drop to optical size 20 and consider a weight of 300–400 so fine strokes stay crisp rather than filling in. Never place a 16 dp icon in an interactive role without an invisible hit-area expansion.
- **Display or hero icons (36–48 dp+)** call for optical size 48, weight 400 or lighter, and potentially a negative grade to prevent visual heaviness. At these sizes outlined variants often read with more sophistication than filled variants.

### Color and state

- **Never rely on color alone to communicate state.** Fill axis change (outlined → filled) provides a shape-based state signal that works for users who cannot distinguish hue. Color (tonal or semantic) is additive, not the sole carrier.
- **Tonal icon colors (on-surface-variant for inactive, on-secondary-container for active indicator) are the M3 defaults.** Match icon color to the container semantics — an icon inside a `FilledIconButton` inherits the button's content color token; an icon inline with body text should use `onSurface` or `onSurfaceVariant`.
- **Disabled icons use on-surface at 38% opacity.** This is a token-level decision, not a manual color pick; verify designs reference the system token rather than a hard-coded hex.

### Accessibility

- **Every interactive icon must have a content description.** Purely decorative inline icons (next to a visible text label covering the same meaning) should be explicitly marked decorative so screen readers skip them. In Compose, `Icon` with `contentDescription = null` is the signal; `IconButton` with a non-null description reads the action aloud.
- **Content descriptions should name the action, not the glyph.** "Delete" not "trash can icon". "Play" not "triangle icon". Describe what happens, not what is drawn.
- **Icon-only buttons without adjacent visible labels are high-risk for discoverability.** Prefer pairing icons with a visible label in unfamiliar contexts. In persistent navigation (bottom bar, rail) icon-only is acceptable because the labels are reinforced by location and repetition.

## Platform notes

- **Compact phones (portrait):** 24 dp icons at Weight 400, optical size 24 is the safe baseline throughout. Bottom navigation bar enforces the filled/outlined active state convention most visibly here. Toolbar icon density should be limited to three or fewer actions to prevent crowding.
- **Large screens and foldables (expanded width):** Navigation moves to a `NavigationRail` or `NavigationDrawer`. Rail icons sit at 24 dp with a label; drawer icons are accompanied by full-width labels, so the active-state fill signal matters less than on a bar — but maintain it for consistency. Hero sections or adaptive panels may call for 36–48 dp display icons with optical size 48.
- **Tablets in landscape:** Two-pane layouts often place an icon-heavy action bar in a persistent panel. Revisit Weight here: heavier panels can absorb slightly heavier Weight (500) without feeling cramped, while lightweight content panes should stay at 400.
- **Wear OS:** Icons are used sparingly given the tiny canvas. Favor filled variants for clarity at small sizes; optical size 20 is the appropriate design intent. Avoid icon-only interactive controls without haptic or voice label support.
- **Android TV:** Icons appear at television viewing distances. Use larger rendering sizes (36–48 dp) with optical size 48, Weight 400–500. Ensure focused state is unambiguous — TV relies on focus ring + fill change, not hover.

## Pitfalls

- **Mixing the rounded and sharp symbol families** in the same app, creating a jarring inconsistency that implies different design provenance for different screens.
- **Setting optical size to a fixed value (e.g., always 48)** regardless of rendered dp size, so small icons appear as cramped, fine-stroked shapes and large icons look over-simplified.
- **Using filled icons for all icons at rest** with no outlined variant available for the selected state — the active/inactive distinction collapses and navigation loses its landmark signal.
- **Relying on color alone for state**, so the filled/outlined axis change is omitted and colorblind users or high-contrast mode users cannot distinguish active from inactive.
- **Touch targets smaller than 48 × 48 dp** on custom icon placements that skip `IconButton` and draw raw `Icon` composables with no hit-area padding, creating chronic accessibility failures.
- **Content descriptions that describe the glyph** ("circle with an arrow") rather than the action ("refresh"), reducing screen reader usefulness.
- **Weight extremes in dense UI** — Weight 100 icons vanish against light surfaces in small sizes; Weight 700 icons overpower adjacent text and fight for hierarchy they should not own.
- **Animating fill without easing** produces an abrupt snap that reads as a glitch; a short spring or linear interpolation across the fill axis (0 → 1 over ~150–200 ms) reads as intentional feedback.

## References

- **Material 3 Guidelines:** [Icons overview](https://m3.material.io/styles/icons/overview)
- **Documentation:** [Material 3 in Jetpack Compose](https://developer.android.com/develop/ui/compose/designsystems/material3)
- **Material 3 Guidelines:** [Icons — applying icons](https://m3.material.io/styles/icons/applying-icons)
- **Material 3 Guidelines:** [Icons — designing icons](https://m3.material.io/styles/icons/designing-icons)

## See also

The `m3-color` design skill covers how icon tonal color tokens (on-surface, on-surface-variant, on-secondary-container) fit into the broader M3 color system. The `m3-typography` design skill is the counterpart for pairing text scale with icon weight and size decisions. For navigation-specific icon state conventions (active destination, badge), see the `m3-navigation` design skill. On the implementation side, the Material 3 Compose code skill covers wiring `Icon`, `IconButton`, `FilledIconButton`, `OutlinedIconButton`, and `IconToggleButton`, setting the `Icons` object families, and applying `LocalContentColor` tokens.
