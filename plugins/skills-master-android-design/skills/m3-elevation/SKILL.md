---
name: m3-elevation
description: "Design critique and guidance for Material 3 elevation: when to use tonal elevation vs shadow elevation, the five elevation levels, how surface tint encodes depth via container roles, and how the system adapts on dark theme. Use when reviewing surface hierarchy, deciding whether to elevate a component, auditing how depth reads on light vs dark themes, or contrasting M3 with M2 shadow-only depth. Produces UX recommendations, not code."
---

## When to use

- Reviewing whether a card, sheet, dialog, or navigation surface has the right visual prominence relative to its context.
- Deciding whether a component should use a raised surface or stay flush with the page.
- Auditing how depth hierarchy holds up when the app switches to dark theme.
- Contrasting M3 elevation behavior with a legacy M2 design that relied on drop shadows alone.
- Choosing between the five standard elevation levels for a custom or third-party component.

## Core guidance

- **Understand the two axes: tonal tint and shadow.** M3 elevation combines a color overlay (surface tint) with a drop shadow. On most components the tint does the primary work; shadow is a secondary signal and is often absent or subtle at lower levels. This is a deliberate departure from M2, which used shadow depth as the only cue.

- **Use tonal elevation as the default depth signal.** Surface containers at higher elevation levels receive progressively more of the primary-color tint mixed into their background. The tint amount is prescribed per level — resist applying arbitrary tint percentages. The five levels are Level 0 (no tint, base surface), Level 1, Level 2, Level 3, Level 4, and Level 5 (most prominent). Use these levels consistently so users develop a reliable mental model of depth.

- **Match the elevation level to the component's architectural role, not its visual weight.** Navigation Drawer and Modal Bottom Sheet sit at Level 1, cards at Level 1, FAB at Level 3, dialogs at Level 3, menus at Level 2, top app bars when scrolled at Level 2. Elevating a component higher than its architectural role suggests it is more temporary or modal than it actually is, misleading users.

- **Tonal elevation is not a substitute for color.** Do not swap meaningful color (status, brand) with tinted surfaces purely to signal depth. The tint is a structural cue; semantic color should come from the container role (error, tertiary, etc.) separately.

- **On dark theme, tonal elevation is essential — shadows nearly disappear.** Dark theme suppresses visible shadows because dark surfaces cannot cast clearly visible dark shadows without heavy alpha values that look muddy. The tint overlay becomes the primary and often only perceptible depth signal. This means dark-theme hierarchy depends almost entirely on tonal elevation being correctly applied; audit dark-theme surfaces independently from light theme.

- **Prefer surface container roles over raw surface for elevated content.** The M3 color system provides surfaceContainerLowest, surfaceContainerLow, surfaceContainer, surfaceContainerHigh, and surfaceContainerHighest tokens. These map naturally to the elevation levels and adapt their tint automatically. Using these tokens — rather than manually adjusting alpha or tint — keeps the hierarchy semantically correct and theme-safe. In Jetpack Compose, Surface and Card composables accept a tonalElevation parameter that drives this mapping.

- **Reserve Level 4 and Level 5 for transient, blocking, or highly prominent surfaces.** Dialogs, full-screen modals, and side sheets that temporarily take over interaction should reach Level 3 or higher. Persistent, ambient UI (persistent bottom bars, standard cards in a feed) should stay at Level 1 or Level 2 to avoid elevation inflation where everything looks equally prominent.

- **Shadow still matters for scrim-free floating elements.** FABs, menus, and tooltips that appear above other surfaces without a scrim benefit from a subtle drop shadow in addition to tonal tint, because shadow confirms they float over content. On components that sit inside a defined container (cards, list items), omitting the shadow is usually correct at Level 1–2.

- **Do not stack tonal elevation in nested surfaces.** If a card already uses surface container at Level 1, content inside the card does not need an additional elevated sub-surface unless there is a clear interactive reason (an embedded chip group or an expandable detail section). Unnecessary nesting creates muddy, visually heavy UIs.

- **Ensure interactive elevation changes are perceptible, not jarring.** Buttons and FABs get a small tonal shift on hover and pressed states. The delta between rest and pressed should be sufficient to confirm the state change — typically one elevation level step — without a dramatic visual jump. This is especially important for accessibility: do not rely solely on shadow change to communicate press state; pair it with ripple or shape feedback.

- **Accessibility note: never use elevation alone to convey interactive affordance.** Elevated surfaces are not inherently interactive. Tonal tint signals depth, not tappability. Buttons, FABs, and cards must communicate their interactivity through shape, label, icon, or explicit role — not elevation alone.

## Platform notes

- **Compact phone:** The full five-level elevation system applies. Navigation surfaces (nav bar, nav drawer) and sheets follow prescribed levels directly. Because screen real estate is limited, avoid overusing elevated cards — too many Level 1 cards in a feed creates a uniform gray field with no clear hierarchy.

- **Large screen and foldable:** Two-pane and list-detail layouts introduce situations where a secondary pane sits alongside primary content. Use elevation to differentiate the active pane from the passive one, not just to decorate. A persistent navigation rail or navigation drawer on large screens typically appears at a slightly elevated surface container to visually separate it from the content region.

- **Tablet/foldable modal-to-persistent transitions:** Components like nav drawer shift from modal (elevated, Level 1+, with scrim) to persistent (flat, embedded) at wider breakpoints. When persistent, remove the elevated surface or drop it to Level 0 so it no longer competes with content.

- **Wear OS:** Elevation is largely irrelevant on circular, dense watch UI. The watch design system has its own surface model; do not port M3 phone elevation levels directly.

- **Android TV:** Distance viewing makes tonal tint differences subtle. Rely on focus highlight and shape rather than tonal elevation for depth communication at TV scale.

## Pitfalls

- Applying M2-style shadow-only depth cues and ignoring tonal tint, causing the hierarchy to collapse on dark theme where shadows are imperceptible.
- Using Level 3–5 elevation for non-transient, persistent surfaces, inflating the perceived importance of everyday UI.
- Manually overriding the tint percentage with arbitrary alpha values instead of using prescribed surface container tokens, breaking the semantic relationship between level and color.
- Nesting multiple elevated surfaces inside each other without reason, producing visually heavy, cluttered screens.
- Forgetting to audit elevation hierarchy in dark theme independently — a palette that reads clearly in light theme may become a uniform gray slab in dark theme if tonal elevation is missing.
- Assuming that elevation communicates tappability to users; elevated surfaces are depth cues, not interaction affordances.
- Applying shadows to surfaces that are embedded in containers (cards inside a page) where the shadow bleeds visually through the container edge and looks unintended.

## References

- **Material 3 Guidelines:** [Elevation Overview](https://m3.material.io/styles/elevation/overview)
- **Documentation:** [Material 3 in Compose](https://developer.android.com/develop/ui/compose/designsystems/material3)
- **Material 3 Guidelines:** [Color System — Surface Roles](https://m3.material.io/styles/color/roles)
- **Material 3 Guidelines:** [Dark Theme](https://m3.material.io/styles/color/system/overview)

## See also

- The **m3-color-system** design skill for the surface container role tokens that back tonal elevation, and how primary-color tinting slots into the broader M3 palette.
- The **m3-dark-theme** design skill for a focused audit of how dark theme shifts the perception of elevation across the entire component set.
- The **m3-surfaces** design skill for shape, container hierarchy, and the relationship between surface roles and layout regions.
- The **compose-material3-foundations** code skill implements tonal elevation via the `Surface` and `Card` composables' `tonalElevation` parameter, and maps surface container tokens into the `MaterialTheme.colorScheme`.
