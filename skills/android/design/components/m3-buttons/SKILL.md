---
name: m3-buttons
description: "Design-critique guidance for Material 3 buttons on Android — covering the five button variants (filled, filled tonal, elevated, outlined, text), emphasis hierarchy, primary-action selection, sizing and shape including M3 Expressive morphing shapes, icons in buttons, and accessible touch targets. Use when reviewing or specifying button choices in a screen, judging whether a variant fits its emphasis level, critiquing hierarchy when multiple buttons compete, or evaluating whether an icon adds clarity or noise. Produces design recommendations and critique, not code."
tags: [m3, design, buttons, android, material-you, components]
x-skills-master:
  domain: android
  class: design
  category: components
  platforms: ["android", "large-screen"]
  pairs_with: []
  sources:
    - https://m3.material.io/components/buttons/overview
    - https://developer.android.com/develop/ui/compose/components/button
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Use this skill when:

- Choosing which of the five M3 button variants (filled, filled tonal, elevated, outlined, text) belongs in a given context, and whether their combined use creates a clear action hierarchy.
- Reviewing a screen where multiple CTAs compete for attention, or where a high-emphasis button is misused for a low-stakes action.
- Evaluating whether a leading or trailing icon belongs in a button, adds meaningful context, or introduces visual noise.
- Critiquing button sizing, shape, and touch-target compliance, including M3 Expressive morphing shape behavior.
- Assessing whether a button is the right control at all, versus a FAB, chip, icon button, or segmented button.

## Core guidance

### Emphasis hierarchy

- **Use exactly one filled button per primary action zone.** The filled button (rendered by `Button` in Compose Material 3) carries the highest visual weight; placing two filled buttons side by side collapses the hierarchy and forces the user to choose between equals.
- **Reserve filled tonal for secondary actions that still need medium prominence.** `FilledTonalButton` uses a container tinted from the secondary color role — appropriate for a second important action alongside a primary, such as "Save draft" next to "Publish."
- **Use elevated buttons sparingly and only when surface separation matters.** `ElevatedButton` gains its identity from its shadow; on already-elevated or colored surfaces it can disappear or clash. Prefer filled tonal when elevation context is ambiguous.
- **Use outlined buttons for actions that need structure without strong color fill.** `OutlinedButton` suits reversible or secondary destructive actions (e.g., "Cancel," "Remove") where you want a clear tap target without implying the action is recommended.
- **Reserve text buttons for the lowest-stakes, tertiary actions.** `TextButton` has no container and competes least for attention; ideal for "Learn more," inline navigation, or dialog secondary actions. Never use a text button as the sole CTA on a screen — it will be missed.
- **Do not mix more than three emphasis levels in a single button group.** A typical pattern is one filled (primary) + one text or outlined (secondary). Adding all five variants in one view creates noise, not clarity.

### Choosing a primary action

- **Identify the single action the screen is designed to accomplish and anchor the filled button to it.** Every other button on the same surface should be demonstrably lower in emphasis.
- **Avoid promoting utility actions to filled buttons.** "Settings," "Filters," or "Share" are rarely the screen's purpose; surfacing them at filled weight misleads the user about the interaction model.
- **Destructive primary actions (delete, sign out) deserve extra caution.** Prefer a lower-emphasis button (outlined or text) in context and escalate to a dialog with a filled destructive confirmation only at the point of no return.

### Sizing, shape, and touch targets

- **Maintain the M3 minimum touch target of 48 x 48 dp regardless of visual size.** A button container can be visually smaller (e.g., 36 dp tall for a compact inline context) as long as the system touch-target padding brings the interactive area to 48 dp.
- **Do not arbitrarily stretch button width.** Full-width buttons (`fillMaxWidth`) communicate "this is the primary next step for this screen" and work well in onboarding, checkout, and focused task flows. In content-rich screens they can feel heavy; prefer wrap-content width there.
- **Respect M3 Expressive shape morphing as a state signal, not a decoration.** In M3 Expressive (Material You), buttons can morph between their resting rounded-rectangle shape and a rounder or more dynamic shape on press, hover, and focus. This shape animation is a built-in affordance — do not override it with a static shape unless brand requirements demand it, and if you override, ensure pressed/hovered states remain perceptually distinct.
- **Apply consistent corner radius across a button group.** Mixing a fully rounded pill with a slightly rounded rectangle in the same row breaks visual cohesion. Pick one shape token from the M3 shape scale (typically ShapeKeyTokens.CornerFull for M3 Expressive buttons) and apply it consistently.
- **Group related buttons with 8 dp spacing; use 16 dp or more to separate semantically distinct actions.** Close spacing implies the actions are alternatives; wider spacing signals they operate on different parts of the screen.

### Icons in buttons

- **Use a leading icon only when it meaningfully disambiguates the action.** A camera icon on "Take photo" adds recognition; a generic arrow on "Continue" adds nothing and clutters the label.
- **Do not combine two icons in one button.** One leading icon is the limit; trailing icons reserved for explicit navigation conventions (e.g., dropdown arrow) should be avoided in standard action buttons.
- **Icon-only buttons must use `IconButton` or `FilledIconButton`, not a button variant with a blank label.** The dedicated icon button composables carry the correct semantics and sizing; text button variants without labels break accessibility.
- **Match icon weight and style to the label's type scale.** An outlined icon next to a medium-weight label looks mismatched; prefer filled icons at the same optical weight as the label.
- **Ensure every icon button has a `contentDescription`.** Without it, TalkBack announces nothing useful. On standard labeled buttons, the icon is decorative and the label is sufficient — pass `null` for the icon's content description in that case.

### States and accessibility

- **All five button variants must express enabled, disabled, hovered, focused, and pressed states.** M3 provides state-layer overlays for these automatically; if you override the button's colors or shape, verify all states remain visually distinguishable.
- **Disabled buttons should not be the primary communication mechanism.** If a button is disabled, explain why in proximity (helper text, inline error). A greyed-out button with no explanation is a dead end.
- **Color alone must not be the only differentiator between button types.** In high-contrast mode or colorblind scenarios, the filled button's container and the text button's lack of container must still be distinct. M3's shape and elevation differences help; do not flatten these in a custom theme.
- **Button labels follow sentence case in M3 (not ALL CAPS from M2).** All-caps labels are a legacy M2 pattern; switching to title or sentence case improves readability and aligns with M3 type guidance.

## Platform notes

**Compact phones (default):** Buttons frequently span full width in single-column layouts, especially at the bottom of task flows. Floating button bars at the bottom of the screen should sit above the navigation bar inset and respect edge-to-edge padding.

**Large screens and foldables:** Full-width buttons in a wide two-pane or expanded layout look visually unmoored. Constrain button widths (e.g., max 320 dp) or align them to the content column rather than the window edge. Consider placing primary and secondary buttons side by side in a `Row` rather than stacking them, using the filled + outlined or filled + text pairing.

**Tablets in landscape:** Bottom-anchored button bars should shift to the trailing edge of the content pane in a list-detail layout, not float across the full screen width, to keep the CTA spatially linked to the active content.

**Wear OS:** Standard M3 button composables do not apply to Wear; use the Wear Compose `Button` and `CompactButton` from the Horologist or Wear Compose libraries. Shape, sizing, and emphasis rules differ significantly on the round display constraint.

**Android TV:** Focus-driven navigation replaces touch. Button emphasis still matters for visual hierarchy, but ensure that focused state is highly visible (M3 focus indicators may need to be amplified beyond phone defaults). Avoid text buttons as sole CTAs because they may be difficult to distinguish as focusable at TV viewing distance.

## Pitfalls

- **Two or more filled buttons in one action zone.** This is the most common hierarchy mistake and leaves users unsure which action is intended.
- **Using a filled button for a destructive action without a confirmation step.** "Delete account" as a filled button with no confirmation is both a UX and trust failure.
- **Ignoring the touch-target floor.** Compact inline buttons that shrink below 48 dp interactive area fail accessibility and produce miss-taps.
- **Overriding M3 Expressive shape morphing with a flat static shape.** The morph is a key tactile affordance; removing it makes the button feel unresponsive compared to the rest of the system.
- **Icon-only interactive elements using a text button variant with no label.** Results in an unlabeled, incorrectly sized tap target that TalkBack cannot describe.
- **All-caps labels carried over from M2 themes.** They conflict with M3 typography tokens and require explicit theme overrides that break system coherence.
- **Disabled buttons with no explanation.** Users cannot understand why the action is unavailable, leading to frustration or repeated tapping.
- **Mixing pill-shaped and slightly-rounded buttons in the same group.** Inconsistent shape application signals inconsistency in the design system, not intentional differentiation.
- **Full-width buttons on expanded screens.** Stretching a button across a 900 dp tablet layout looks undesigned and breaks the visual connection to its content context.

## References

- **Material 3 Guidelines:** [Buttons overview](https://m3.material.io/components/buttons/overview)
- **Documentation:** [Buttons in Jetpack Compose](https://developer.android.com/develop/ui/compose/components/button)

## See also

This skill covers design judgment for all five standard button variants. For implementing `Button`, `FilledTonalButton`, `ElevatedButton`, `OutlinedButton`, and `TextButton` in Jetpack Compose — including theming tokens, state handling, and icon slot usage — see the compose-foundation and compose-theming code skills. For floating action buttons (FAB, extended FAB, small FAB), which occupy a separate emphasis tier above filled buttons, see the FAB component design skill. For icon-only interactive controls, see the icon button and segmented button design skills. For chip-based multi-select or filter interactions that are sometimes confused with button groups, see the chips design skill.
