---
name: m3-interaction-states
description: "Design critique and guidance for Material 3 interaction states — enabled, disabled, hover, focus, pressed, dragged, and selected — including state-layer opacities, ripple feedback, and applying states consistently so every interactive element clearly communicates its status. Use when auditing interactive elements for missing or inconsistent state feedback, choosing state-layer colors, evaluating ripple placement, or reviewing touch targets for accessibility compliance."
tags: [m3, design, interaction, states, foundations, accessibility]
x-skills-master:
  domain: android
  class: design
  category: foundations
  platforms: ["android", "large-screen"]
  pairs_with: []
  sources:
    - https://m3.material.io/foundations/interaction/states/overview
    - https://developer.android.com/develop/ui/compose/touch-input
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

- Reviewing an interactive component (button, chip, card, list item, FAB, icon button) for missing or incorrect state feedback.
- Auditing a design for consistent state-layer opacity usage across light and dark themes.
- Deciding whether a custom component needs a state layer, ripple, or both.
- Evaluating disabled states to ensure they communicate non-interactivity without deceiving users about content presence.
- Assessing focus indicators for keyboard and switch-access users on large-screen and TV form factors.

## Core guidance

- **Every interactive element must surface all seven states.** The M3 state model defines enabled, disabled, hover, focus, pressed, dragged, and selected (where applicable). Omitting any state creates a gap where the UI says nothing to the user; even elements that rarely receive hover on mobile still need it for large-screen parity.

- **Use state layers, not color swaps.** M3 overlays a semi-transparent tint of the content color — not a brand-new color — on top of the component's surface at defined opacities: hover 8%, focus 12%, pressed 12%, dragged 16%. This keeps the component's identity stable while the overlay signals the interaction. Changing the surface color itself breaks the visual language.

- **Apply state-layer color from the correct role.** The state layer inherits the color of the prominent foreground element on that component, not the container: a filled button's state layer is `onPrimary`, an outlined button's is `primary`, a surface card's is `onSurface`. Using the wrong color token causes the layer to wash out or over-saturate.

- **Ripple is feedback, not decoration.** The ripple (bounded or unbounded) confirms a press at the point of contact and then fades. It should not linger, pulse, or animate on idle. Use bounded ripples for clearly contained surfaces (cards, buttons) and unbounded ripples only where the hit target extends beyond the visible element. In Compose, `Indication` via `rememberRipple` (or `ripple` in Material 3) drives this; the code skill handles the wiring.

- **Disabled states reduce opacity on the content AND the container.** M3 specifies 38% opacity on disabled content (text, icon) and 12% opacity on the disabled container. This pairing signals non-interactivity as a cohesive unit. Disabling only the text opacity — while keeping a saturated container — implies the element is interactive but blocked, which is misleading.

- **Never suppress the focus state.** Focus rings (the 3 dp outline offset from the component boundary in `primary` color, or `secondaryContainer` on dark surfaces) are the primary navigational signal for keyboard, D-pad, and switch-access users. Hiding them for aesthetic reasons fails WCAG 2.4.7 (Focus Visible) and is a hard accessibility defect.

- **Selected state stacks on top of other states.** A selected chip that is also pressed shows both the selected surface fill and the pressed state-layer overlay simultaneously. The selected fill is not a substitute for the pressed layer; both must render. A component that removes the state layer when selected loses feedback for in-state interactions.

- **Touch targets must be at least 48 × 48 dp regardless of visual size.** Small icon buttons and compact chips need invisible padding to meet the minimum. The state layer and ripple should fill the 48 dp hit area, not just the visible surface, so the feedback matches the tappable region.

- **Hover and focus are distinct, not interchangeable.** Hover is pointer-driven (8% opacity, no border); focus is keyboard/D-pad-driven (12% opacity plus the focus ring outline). Using a focus ring on hover, or suppressing the focus ring when also hovered, conflates two different input modes and confuses multi-input users.

- **Dragged state elevates the component.** Beyond the 16% state layer, a dragged item typically gains a tonal elevation bump (the surface tint intensifies) to visually lift it off the resting layer. Without the elevation signal, the dragged item appears flat and users lose spatial orientation during reordering.

- **Maintain state-layer contrast across themes.** In dark themes the same token opacities apply, but verify that the resulting composite passes 3:1 contrast against adjacent surfaces — dark surfaces can compress the effective contrast of a light state layer at 8%. Adjust the design rather than the spec opacity; if contrast fails, the surface color pairing is the root problem.

- **Prefer Compose's built-in Interaction sources.** Material 3 composables — `Button`, `FilledIconButton`, `ElevatedCard`, `FilterChip`, `ListItem`, and others — manage `InteractionSource` and `Indication` automatically. Custom components should opt into the same system rather than painting manual color overrides, ensuring states behave consistently across the app.

## Platform notes

- **Compact phones (default):** Pressed and ripple are the dominant states; hover is irrelevant on pure touch. Ensure ripple bounds are correct and touch target padding is adequate.

- **Large screens and foldables:** Hover becomes meaningful with stylus or mouse input. Every interactive component in a two-pane or desktop-like layout must render the hover state correctly. Focus states matter for keyboard-attached tablets. Confirm that state-layer opacities read against the often-lighter large-screen surface colors.

- **Foldables in table-top mode:** Drag-and-drop between panes requires the dragged state (16% layer plus elevation) to be visible across both half-panels; confirm the elevation tint does not vanish against the lighter panel background.

- **Wear OS:** States are reduced — no hover, focus is handled by the rotary crown or bezel scroll. Pressed and selected are the primary states. State layers still apply but verify legibility on the round, dark-biased display at small component sizes.

- **Android TV / Google TV:** Focus is the dominant navigation signal. Ensure the focus ring (or M3's equivalent `FocusedBorder` treatment) is highly visible from a living-room viewing distance (minimum 3 m). Pressed state is brief (D-pad confirm); hover does not apply.

## Pitfalls

- Treating state layers as optional polish and shipping components with no visual feedback on press or focus.
- Using a hardcoded semi-transparent black or white overlay instead of the on-role token, causing the layer to look wrong in dark theme.
- Applying 12% focus opacity without the focus ring outline, leaving keyboard users with only a subtle tint and no clear boundary indicator.
- Setting a disabled component to 50% or 60% opacity on a whim rather than the specified 38%/12% split, making it look dimmed rather than definitively non-interactive.
- Forgetting that selected state is additive: replacing the pressed layer with the selected fill removes pressed feedback inside a selected element.
- Clipping the ripple to the visible component bounds when the touch target extends beyond them, creating a mismatch between where the user touched and where feedback appears.
- Animating the state layer in and out with a very slow fade (> 200 ms), making the UI feel sluggish and disconnected from the input.
- Using the focused state ring color incorrectly — applying `onSurface` instead of `primary` (or `secondary` for secondary surfaces) — so the ring blends into the background.

## References

- **Material 3 Guidelines:** [Interaction States Overview](https://m3.material.io/foundations/interaction/states/overview)
- **Documentation:** [Touch Input in Compose](https://developer.android.com/develop/ui/compose/touch-input)
- **Material 3 Guidelines:** [Color Roles](https://m3.material.io/styles/color/roles)
- **Material 3 Guidelines:** [Ripple](https://m3.material.io/foundations/interaction/states/overview)

## See also

- The **m3-color-roles** design skill covers selecting the correct color tokens for container, on-container, and surface roles that state layers are drawn on top of.
- The **m3-accessibility** design skill expands on focus visibility, touch-target sizing, and contrast requirements in the context of state feedback.
- The **m3-elevation-tonal** design skill addresses how tonal elevation interacts with the dragged state and surface tint.
- The implementing code skill for Compose touch input and `InteractionSource` wiring handles the Kotlin/Compose layer for all states described here.
