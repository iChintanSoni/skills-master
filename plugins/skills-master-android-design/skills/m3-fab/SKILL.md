---
name: m3-fab
description: Design guidance for Material 3 Floating Action Buttons — covers regular, small, large, and extended FAB variants, placement, insets, FAB menus, and when a FAB beats an ordinary button. Use when deciding whether a screen action deserves a FAB, which FAB variant to choose, or how to position FABs correctly across phone and large-screen layouts.
---

## When to use

A Floating Action Button (FAB) is the highest-prominence interactive element on a screen. Reach for one when:

- There is a single, clearly primary action the vast majority of users will want to take on that screen — composing an email, creating a new document, starting a navigation session.
- That action is constructive or transformative (create, add, share, navigate) rather than destructive or navigational.
- The action's frequency and importance justify stealing persistent screen real estate.

Do not reach for a FAB when the screen has no dominant action, when two actions compete equally (use buttons or a bottom app bar instead), or when the primary action is destructive (delete, archive) — the elevated prominence sends the wrong affordance signal.

## Core guidance

### Choosing the right variant

- **Regular FAB is the default.** The 56 dp regular FAB (Compose: `FloatingActionButton`) fits most phone screens where one primary action exists. Prefer it unless you have a specific reason to deviate.
- **Small FAB (40 dp) is for secondary contexts only.** Use `SmallFloatingActionButton` alongside a regular FAB when you need a clearly subordinate companion action — never as the sole FAB on a screen. Its touch target is borderline; pair it only with ample surrounding whitespace.
- **Large FAB (96 dp) commands maximum attention.** `LargeFloatingActionButton` is appropriate on content-sparse screens (an empty state, a camera viewfinder) where drawing the eye to a single action matters. Avoid it on information-dense screens where the footprint crowds content.
- **Extended FAB adds a text label.** `ExtendedFloatingActionButton` is the right choice when the icon alone is ambiguous or when the action is new to users. The label dramatically improves discoverability at the cost of horizontal footprint. Shrink it to icon-only on scroll (via `expanded` parameter) once users are oriented, but reinstate the label when scroll stops.

### Prominence and hierarchy

- **One FAB per screen is the rule.** Multiple FABs dilute hierarchy and confuse the primary action. If you feel the urge to add a second, reconsider whether the screen is doing too much or whether a FAB menu is appropriate.
- **FAB outranks everything except dialogs and sheets.** It sits above the bottom app bar in elevation (M3 tonal + shadow tokens place it at level 3). Never let cards, images, or other surface elements overlap it.
- **Tonal container color signals primary intent.** The default M3 FAB uses `primaryContainer` / `onPrimaryContainer` tokens. Resist tinting to secondary or tertiary unless the action is genuinely secondary — the color is a promise about importance.

### Placement and insets

- **Bottom-end is the canonical position for phones.** Place the FAB at the trailing bottom edge of the screen, outside the bottom app bar if one exists (the bar provides a dedicated FAB slot). For RTL locales, "trailing" flips automatically when you let Compose handle layout direction.
- **Respect window insets.** Apply `WindowInsets.safeDrawing` (or at minimum `navigationBars` + `ime`) so the FAB lifts above the navigation bar and the software keyboard. A FAB hidden behind the keyboard is a critical usability failure.
- **FAB must not occlude primary content permanently.** Use `contentPadding` on the lazy list or scrollable content beneath it so the last item can scroll clear of the FAB. Never rely on users scrolling to "find" content that is permanently covered.
- **Avoid anchoring FABs to non-sticky content.** The FAB should feel persistent. Do not hide it behind tab panes or inside scroll regions — use persistent scaffold-level placement instead.

### FAB menu (speed dial)

- **FAB menus expand into mini FABs.** When several related actions cluster under one theme (attach: photo, file, camera), a single FAB can expand into a vertical stack of small FABs — sometimes called a speed dial. Material 3 does not ship a speed dial component, so this is a custom pattern: design it to feel animated and spatial, not like a dialog.
- **Limit speed dial to 3–6 items.** Fewer than three items should be a bottom sheet or menu instead; more than six overwhelms.
- **Scrim the background on expansion.** A semi-transparent scrim behind the expanded menu reinforces that the FAB state is modal-adjacent and prevents misclicks on underlying content.
- **Collapse on outside tap or back gesture.** Follow modal dismissal conventions; the back gesture must collapse the menu, not navigate away.

### States and animation

- **Entrance animation is load-bearing.** The FAB should animate in slightly after the screen's primary content settles — a brief scale + fade — so it does not compete with the initial content load. Do not show it instantly at zero elevation.
- **Pressed state uses state-layer, not position shift.** M3 ripple and state-layer tokens communicate press; avoid the older "push-down" shadow illusion.
- **Hide FABs gracefully on scroll when needed.** If content density warrants hiding the FAB on downward scroll, use an animated exit (scale-out or slide-out) and restore it on upward scroll. A snap-disappear without animation feels broken.
- **Extended FAB label collapse must be smooth.** Animating from extended to icon-only should use a horizontal size animation, not a crossfade or instant swap.

### Accessibility

- **Every FAB needs a content description.** Icon-only FABs (regular, small, large) are meaningless to TalkBack without a label. Pass a meaningful `contentDescription` string — "Compose new email," not "FAB" or "Button."
- **Extended FAB inherits its text label** for accessibility automatically, but confirm the label is self-explanatory out of context (TalkBack reads it without surrounding visual context).
- **Minimum touch target is 48 dp.** The small FAB's visual size is 40 dp; ensure Compose's minimum touch target modifier brings it to 48 dp. The regular and large variants already exceed the minimum.

## Platform notes

### Compact phones (typical Android)

The standard bottom-end placement inside a `Scaffold` with a `bottomBar` is the reference implementation. The `Scaffold` FAB slot handles elevation and positioning relative to the bottom app bar automatically. Do not manually position the FAB in this layout.

### Large screens and foldables

On screens wider than 600 dp (medium/expanded window size class), a FAB at the bottom-end corner can feel stranded. Prefer one of two patterns:

- **Navigation rail + FAB above the rail:** Place the FAB above the navigation rail items on the leading edge. This groups the primary action with navigation and keeps the main content unobstructed.
- **Extended FAB in a side panel:** On pane-based layouts (two-pane detail/list), anchor the extended FAB to the relevant pane's bottom edge rather than the full screen bottom.

Avoid placing a large FAB on a large-screen layout — at 96 dp it consumes disproportionate space where real estate is abundant enough for labeled extended FABs or toolbar actions.

### Wear OS

Wear OS uses its own action-button conventions (curved menu, rotating side button). Do not use the standard M3 FAB on Wear; the Horologist or Wear Compose libraries have appropriate equivalents.

### TV

FABs are not appropriate on TV. D-pad navigation and the lean-back context call for row-based focus items, not floating elements.

## Pitfalls

- **Two FABs on one screen** — immediately raises the question of which action is primary. If you have two, the answer is neither, and both should probably be buttons or a bottom sheet.
- **FAB for destructive actions** — deleting something with a FAB trains users to fear the most-prominent button. Reserve it for creation and navigation.
- **FAB obscuring list tails** — the last list item hidden under the FAB is one of the most common Material UI bugs. Always add scroll padding equal to FAB height plus margin.
- **Ignoring insets on edge-to-edge** — once edge-to-edge is enforced (mandatory in Android 15+), any FAB not using `WindowInsets.safeDrawing` will be clipped or overlapped by the navigation bar.
- **Static FAB on a keyboard-heavy screen** — on forms and chat screens, the FAB must lift with the keyboard or be hidden. A FAB behind the IME is unreachable.
- **Overusing the large variant** — a 96 dp button on a content-rich screen is a visual wrecking ball. Reserve it for sparse, focused moments.
- **No animation on extended/collapsed transition** — snapping between icon-only and labeled states without animation looks like a bug.

## References

- **Material 3 Guidelines:** [Floating Action Button — Overview](https://m3.material.io/components/floating-action-button/overview)
- **Jetpack Compose Documentation:** [FAB in Compose](https://developer.android.com/develop/ui/compose/components/fab)

## See also

The m3-buttons design skill covers the full spectrum of button types and when to reach for a contained, filled-tonal, outlined, or text button instead of a FAB. The m3-bottom-app-bar design skill explains how the bottom app bar's FAB slot interacts with placement. For large-screen layout patterns that affect FAB positioning, see the m3-navigation-rail and m3-adaptive-layout design skills. The companion code skill for implementing `FloatingActionButton`, `SmallFloatingActionButton`, `LargeFloatingActionButton`, and `ExtendedFloatingActionButton` in Jetpack Compose lives in the android-compose-fabs code skill.
