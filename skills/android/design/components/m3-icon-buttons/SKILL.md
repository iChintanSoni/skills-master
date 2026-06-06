---
name: m3-icon-buttons
description: "Design guidance for Material 3 icon buttons — standard, filled, tonal, and outlined variants, toggleable states, sizing, and accessibility. Use when deciding which icon button variant fits a surface, whether an icon-only action is appropriate, and how to meet 48dp touch targets."
tags: [m3, design, icon-button, android, components, accessibility]
x-skills-master:
  domain: android
  class: design
  category: components
  platforms: ["android", "large-screen"]
  pairs_with: []
  sources:
    - https://m3.material.io/components/icon-buttons/overview
    - https://developer.android.com/develop/ui/compose/components
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Use icon buttons when a single, universally recognizable action can be conveyed without a text label — common examples include Favorite, Bookmark, Share, and Close. They belong in compact spaces where a full button would crowd the layout: app bars, cards, chat bubbles, and toolbars.

Do not reach for an icon button when:

- The action is unfamiliar or the icon alone is ambiguous to your audience.
- The action is the primary call-to-action on a screen — prefer a filled or text button with a label.
- The action has serious consequences (delete, send payment) — a labeled button reduces mis-taps.

When uncertain whether the icon reads clearly, run a quick hallway test: if users cannot name the action within two seconds, add a label and use a regular button instead.

## Core guidance

**Choose the variant that matches surface prominence and container color.**

- **Standard icon button** (no container) sits at the lowest emphasis level. Use it in app bars and toolbars where the surrounding chrome already provides context and multiple icon actions share equal weight. It uses `onSurface` / `onSurfaceVariant` coloring and disappears into the surface gracefully.
- **Filled icon button** carries the highest emphasis — it uses the `primary` container color and is visually equivalent to a filled button. Reserve it for the single most important action on a card or in a localized region. Using more than one filled icon button in close proximity dilutes its signal.
- **Filled tonal icon button** sits between standard and filled: it uses `secondaryContainer` coloring, drawing attention without the full weight of primary. Prefer it when you need moderate emphasis — for example, a "Save draft" action that matters but does not compete with a primary CTA.
- **Outlined icon button** pairs well with outlined cards and surfaces where you need a visible boundary without fill. Use it when the action needs to be discoverable but not dominant, and when the background color makes an unlabeled icon hard to distinguish.

**Match variant to toggleable vs non-toggleable intent.**

- **Non-toggle actions** (Share, Delete, Open) use the standard, filled, tonal, or outlined variants as a momentary button. The icon does not change state after the press.
- **Toggle actions** (Favorite on/off, Mute/Unmute, Bookmark) use the toggleable form of the same variants. In M3 the toggled-on state switches the container fill or icon color to communicate selection clearly — for example, a toggled-on filled-tonal icon button shifts to `secondaryContainer` with full opacity, while the off state uses a transparent or outlined treatment. Never rely solely on icon swap to communicate toggle state; the container color change is the primary affordance in M3.

**Size icon buttons to guarantee a 48dp minimum touch target.**

The visible icon button container is 40dp by default in M3. The interactive touch target must be at least 48 × 48dp to meet Android accessibility guidelines. In Compose, `IconButton` (and its siblings `FilledIconButton`, `FilledTonalIconButton`, `OutlinedIconButton`) automatically expand the touch target to 48dp via internal padding. Avoid shrinking the composable below 40dp visible size or you risk clipping the touch zone. For dense toolbars where items are naturally spaced, verify that adjacent touch targets do not overlap significantly.

**Keep icon size at 24dp inside the 40dp container.**

M3 specifies a 24dp icon within the 40dp button container, leaving 8dp padding on each side. Do not scale the icon up to fill the container — it breaks the optical balance and makes the button feel heavy. If you need a larger icon for emphasis, consider a custom FAB-style container rather than stretching the icon button.

**Provide a content description on every icon button without exception.**

An icon button with no visible label is completely silent to screen-reader users unless a content description is present. This is not optional. The description should describe the action ("Add to favorites"), not the icon ("Star"). For toggle buttons, the description must reflect the current state and the action that will occur ("Unfavorite" when the item is favorited, "Favorite" when it is not).

**Do not stack icon buttons with inconsistent variants in a single row.**

Mixing filled and outlined icon buttons in the same toolbar creates false hierarchy — the filled one looks primary even when it should not be. Keep all peer actions at the same variant level and differentiate priority only when one action is genuinely more important.

**Use color and state layers, not custom tints, for pressed/focused/hovered states.**

M3 defines precise state-layer opacities (hover 8%, pressed 12%, focused 12%, dragged 16%) over the icon color. Applying custom alpha or tint values breaks the cohesive M3 interaction model. Rely on the composable's built-in state handling rather than wrapping it in a custom `Box` with manual color logic.

**Group related icon buttons with consistent spacing.**

When placing multiple icon buttons in a row (e.g., text-editor toolbar), maintain 4–8dp gaps between them so touch targets do not merge perceptually into a single blob. A gap smaller than 4dp makes it hard for users to distinguish individual targets.

## Platform notes

**Compact phones (< 600dp width):** Icon buttons are the default currency of the top app bar's trailing actions. Limit trailing actions to three icon buttons max; beyond three, move lower-priority actions into an overflow menu (three-dot). The 48dp touch target is non-negotiable on touch-first devices.

**Large screens and foldables (>= 600dp width):** With more horizontal room, consider promoting icon-only actions to icon-plus-label buttons in navigation rails or expanded top bars to improve discoverability. Icon buttons remain valid in side panels and detail panes, but the additional space allows labels that reduce ambiguity. On foldables in table-top posture, ensure icon buttons in the top half are reachable without repositioning the device — place primary actions in the lower half.

**Wear OS:** The touch target requirement is stricter on round displays and small screens — use the Wear Compose `Button` with icon content rather than the phone-form `IconButton`. Standard M3 phone icon buttons are not directly portable to Wear.

**Android TV / large-display TV:** Focus-based navigation replaces touch. Icon buttons must visibly communicate focus state (M3 focus ring via state layer). Ensure D-pad navigation order is logical; isolated icon buttons on a content card should be part of the natural focus chain.

## Pitfalls

- **Skipping content descriptions** — the single most common accessibility failure with icon buttons. Every `IconButton` call must supply a non-null, action-oriented `contentDescription`.
- **Overusing filled variant** — placing filled icon buttons on every card dilutes emphasis. If everything is high-emphasis, nothing is.
- **Relying on icon swap alone for toggles** — users who cannot distinguish colors (or who glance quickly) miss the state change. M3's container color shift is the primary signal; the icon swap is secondary reinforcement.
- **Shrinking the touch target** — wrapping `IconButton` in a `size()` modifier smaller than 40dp clips the internal padding and shrinks the interactive zone below 48dp, failing accessibility requirements.
- **Using icon buttons for destructive primary actions** — "Delete account" or "Send $500" should carry a label so the user can read before tapping. Icon-only for irreversible, high-stakes actions is a UX anti-pattern regardless of how recognizable the icon is.
- **Mixing variants with no hierarchy rationale** — do not let visual variety substitute for intentional hierarchy. Decide on variant based on prominence need, not aesthetic preference.
- **Custom disabled states** — do not manually alpha-fade an icon button to fake a disabled appearance. Use the composable's `enabled = false` parameter, which correctly applies the M3 disabled color token (onSurface at 38% opacity) and removes interactivity.

## References

- **Material 3 Guidelines:** [Icon buttons overview](https://m3.material.io/components/icon-buttons/overview)
- **Documentation:** [Compose UI components](https://developer.android.com/develop/ui/compose/components)
- **Material 3 Guidelines:** [Icon buttons specs](https://m3.material.io/components/icon-buttons/specs)
- **Material 3 Guidelines:** [Icon buttons accessibility](https://m3.material.io/components/icon-buttons/accessibility)

## See also

The companion code skill for this component covers `IconButton`, `FilledIconButton`, `FilledTonalIconButton`, and `OutlinedIconButton` composables in Jetpack Compose, including how to wire up toggle state and set content descriptions correctly — consult the m3-buttons or equivalent Compose code skill for implementation details. The m3-buttons design skill covers labeled button variants and the decision boundary between icon-only and icon-plus-label treatments. The m3-top-app-bar design skill addresses how icon buttons integrate into app bar trailing action slots and overflow menu thresholds.
