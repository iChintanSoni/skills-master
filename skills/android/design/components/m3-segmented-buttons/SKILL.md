---
name: m3-segmented-buttons
description: "Design judgment and critique for Material 3 segmented buttons — a compact row of connected options for single-select or multi-select choices within a view. Use when designing or reviewing a segmented button group, deciding between segmented buttons and tabs, chips, or radio buttons, judging correct item counts, and evaluating label and icon clarity on Android."
tags: [m3, design, segmented-buttons, selection, components, android]
x-skills-master:
  domain: android
  class: design
  category: components
  platforms: ["android", "large-screen"]
  pairs_with: []
  sources:
    - https://m3.material.io/components/segmented-buttons/overview
    - https://developer.android.com/develop/ui/compose/components
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Use this skill when designing or reviewing a compact selection control inside a view — filtering a list by a mode, toggling between two or three mutually exclusive views, or enabling any combination of a small set of options at once. It also helps you decide whether segmented buttons are the right tool over tabs, chips, radio buttons, or a menu, and whether your item count, label copy, and icon usage are sound M3 choices.

## Core guidance

- **Single-select for mutually exclusive states, multi-select for independent toggles.** Use a single-select segmented button group when only one option can be active at a time (for example, a sort order or a view mode). Use a multi-select group when several options can be active simultaneously and are independent (for example, enabling Bold, Italic, and Underline together). Do not mix semantics — a group should be entirely single-select or entirely multi-select, never a hybrid.

- **Limit the group to two to five segments.** Material 3 recommends two to five items. Fewer than two renders the control meaningless. More than five makes the segments so narrow on compact screens that they become illegible or untappable. When your option set is larger or can grow, a chip group or dropdown menu is the better pattern.

- **Prefer segmented buttons over radio buttons for compact, persistent in-view filtering.** Radio buttons in a vertical list suit forms where only one value is chosen from a longer set, often in a modal or settings screen. Segmented buttons suit persistent, immediately visible mode-switching inside the content area itself, where every option needs to be simultaneously scannable at a glance.

- **Prefer tabs when switching top-level content, not segmented buttons.** Tabs are a navigation pattern that swap out entire content regions; segmented buttons filter or reformat content that stays on the same screen. If selecting an option would push a new destination or fully replace the screen, reach for a top navigation component like NavigationBar or TabRow in Compose.

- **Prefer chip groups when the set is larger, dismissible, or contextual.** FilterChip and ToggleChip components in Compose handle scrollable, dynamic, or user-generated filter sets. Use chips when items might wrap, when count is unknown, or when items can be added or removed. Segmented buttons work only for a fixed, short, non-dismissible set.

- **Use labels, icons, or labels-with-icons — but be consistent within the group.** Do not mix label-only segments with icon-only segments in the same group, as this produces visual imbalance. When icons accompany text, they reinforce meaning but must not be decorative. Icon-only segments are acceptable for universally recognized symbols (play, pause, bold, align-left), but require content descriptions for accessibility. Multi-select segments always show a checkmark icon when selected, which overlays the segment icon; account for this by not designing icons that compete visually with the checkmark.

- **Ensure minimum 48dp touch targets per segment.** Each segment must be tall enough to register accurately, and wide enough that label text is not truncated. Design labels to the longest word in the set, verify they survive localization, and test at large font sizes. If any segment must be shorter than the recommended touch target height to fit your layout, the control is too cramped and an alternative component is warranted.

- **Active segment state must be visually unambiguous.** The selected segment uses the SecondaryContainer color token in M3, with a contrasting content color. Do not override these with brand colors that reduce contrast below 3:1, as state legibility is a functional requirement. Multi-select groups should show the checkmark on each active segment so users understand the multi-select model without reading instructions.

- **Do not use segmented buttons for actions.** Each segment represents a persistent state toggle, not a one-time command. If tapping a segment would trigger an action (download, submit, share) rather than activating a mode, use a Button or IconButton instead.

- **Place segmented buttons near the content they control.** Proximity communicates scope. A segmented button group that filters a list should sit directly above or within the same visual block as that list, not in a toolbar that seems to control the entire screen.

## Platform notes

**Compact phones (320–599dp):** The primary challenge on compact screens is segment width. With five segments, each segment can be as narrow as 60dp or less; test all strings at their translated lengths. Consider reducing the group to three items or offering an alternative control (such as a FilterChip row or a bottom sheet menu) if content cannot fit without truncation or below-minimum touch targets.

**Large screens and foldables (600dp and up):** Segmented buttons do not need to span the full width on large screens. Constrain the group's max width so segments are not disproportionately wide and the control appears anchored to the content it governs rather than floating across the canvas. On foldable devices in tabletop posture, segmented buttons near the hinge should be in the interactive half of the screen.

**Landscape on phones:** In landscape orientation, the vertical real estate is reduced and content is wider. This is often an opportunity to display segmented buttons alongside content in a side-by-side layout rather than stacked above it, which can improve scannability.

**Wear OS and TV:** Segmented buttons are not part of the Wear OS or Android TV Material 3 component sets. Do not attempt to adapt this component to those form factors; use platform-appropriate selection patterns instead.

## Pitfalls

- More than five segments causing truncated labels, sub-minimum touch targets, or an illegible row on compact screens.
- Using segmented buttons for top-level navigation (a tab bar pattern), which creates a navigation inconsistency with M3 NavigationBar expectations.
- Mixing icon-only and label-only segments within the same group, producing visual imbalance.
- Designing icon-only segments without accessibility content descriptions, leaving the control unusable for screen reader users.
- Triggering actions (not state toggles) from segments, which misleads users about what the control does and breaks the expected mental model.
- Overriding the M3 selected-state color tokens with low-contrast brand colors, making the active segment indistinguishable.
- Placing the control far from the content it affects, making the relationship opaque to users.
- Using a single-select group where multi-select semantics are actually needed (or vice versa), and not communicating the difference visually.

## References

- **Material 3 Guidelines:** [Segmented buttons overview](https://m3.material.io/components/segmented-buttons/overview)
- **Material 3 Guidelines:** [Segmented buttons specs](https://m3.material.io/components/segmented-buttons/specs)
- **Material 3 Guidelines:** [Chips](https://m3.material.io/components/chips/overview)
- **Material 3 Guidelines:** [Navigation bar](https://m3.material.io/components/navigation-bar/overview)
- **Material 3 Guidelines:** [Radio button](https://m3.material.io/components/radio-button/overview)
- **Documentation:** [Compose components](https://developer.android.com/develop/ui/compose/components)

## See also

The Compose M3 code skill for segmented buttons implements this guidance using `SingleChoiceSegmentedButtonRow` and `MultiChoiceSegmentedButtonRow` composables from the `androidx.compose.material3` library — hand implementation there after design review. For cases where item count exceeds five or the set is dynamic, the M3 chips design skill covers FilterChip and ToggleChip patterns. For top-level view switching, the M3 navigation bar and tab row design skills govern the correct pattern. For form-based single selection in settings or onboarding flows, see the M3 radio button design skill.
