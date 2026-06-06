---
name: m3-accessibility
description: "Design critique and judgment for Material 3 accessibility foundations: color contrast ratios, 48dp touch targets, scalable text, content descriptions, TalkBack traversal order, never-color-alone signaling, and motion sensitivity. Use when reviewing or designing Android UIs for inclusive access, auditing a screen for TalkBack and dynamic font support, evaluating contrast or touch-target adequacy, or deciding how custom components should communicate state to assistive technologies."
---

## When to use

Reach for this skill when critiquing or designing any Android screen for inclusive access: checking that interactive controls meet the 48dp touch-target minimum, evaluating color contrast in both light and dark themes, auditing TalkBack reading order and content descriptions, deciding whether a status indicator relies on color alone, or assessing whether motion animations respect user sensitivity preferences. Accessibility is a design baseline in Material 3 — not a final-pass concern — so this guidance applies from the earliest wireframe through component review and QA sign-off.

## Core guidance

- **Treat accessibility as a design constraint, not a checklist.** Material 3 standard components — Button, NavigationBar, Checkbox, Switch, and their kin in Jetpack Compose Material 3 — provide baseline accessibility behaviors out of the box. Prefer them over custom compositions, and only extend semantics when a component is genuinely bespoke.

- **Enforce the 4.5:1 contrast ratio for text, 3:1 for non-text.** Body text and interactive labels must clear 4.5:1 against their background; large or bold text (18sp+ regular, 14sp+ bold) and meaningful graphical elements must meet 3:1. Check both the default and dynamic-color (Material You) variations of your palette, because user-generated color schemes can produce unexpected low-contrast pairings. Aim for 7:1 where possible to support users with low vision.

- **Size every interactive target to at least 48 x 48dp.** A tappable icon, chip, or list-row action that is visually smaller than 48dp must have its touch area padded to that minimum. Compose Material 3 composables apply `minimumInteractiveComponentSize` automatically; custom composables must replicate this. Ensure adjacent targets are separated by at least 8dp of non-interactive space to prevent mis-taps.

- **Never convey meaning through color alone.** A red error badge, a green success bar, or a blue selected tab must pair its color signal with a text label, icon, shape change, or position. Users with color-blindness or monochromatic displays must receive the same information. Error states in TextField and status rows are prime candidates for this check.

- **Provide complete, purposeful content descriptions.** Interactive elements without visible text — icon buttons, FABs carrying only an icon, image thumbnails — require a content description that names their action or subject, not their visual appearance. Decorative elements should be hidden from the accessibility tree entirely. Content descriptions must be localized string resources, not hard-coded English.

- **Define a logical TalkBack traversal order.** TalkBack reads left-to-right, top-to-bottom by default, which can be non-linear on card-dense or two-pane layouts. Review the reading path in TalkBack exploration mode; if reading jumps between unrelated regions mid-flow, restructure the layout or designate traversal boundaries so each region is finished before TalkBack moves on.

- **Expose state changes through descriptions, not just visuals.** Transient states — loading, selected, expanded, 3 of 5 — need semantic state descriptions alongside the element's base label. A toggle that changes its icon when activated must also report its new state to assistive technology; relying solely on the visual icon swap leaves screen-reader users in the dark.

- **Support dynamic font scaling without breaking layouts.** Compose Material 3 text styles use sp units and Material's type scale roles (displayLarge through labelSmall). Never constrain text containers to fixed heights or clip overflow; design layouts that reflow or truncate gracefully at the largest system font size. Verify at 200% font scale as a minimum audit point.

- **Respect motion sensitivity preferences.** Avoid continuous or large-displacement animations on screens where they are not essential. When the system's Reduce Animations setting is active, replace slide and zoom transitions with cross-fades or instant changes. The Compose animation APIs expose `LocalReduceMotionEnabled` to gate non-essential motion programmatically; design the reduced-motion path as a first-class experience.

- **Assign semantic roles to custom interactive components.** If a composable behaves as a button, radio button, or toggle but is built from generic containers, its role must be declared explicitly so TalkBack announces it correctly and users know how to interact with it.

## Platform notes

**Compact phones (the primary baseline):** TalkBack touch exploration, swipe navigation, and the keyboard shortcut rotor are the main interaction modes. Every guideline above applies here without adjustment.

**Large screen and foldable devices:** Two-pane layouts and multi-column grids frequently produce non-linear spatial arrangements. Designate each pane or logical content group as a traversal boundary so TalkBack completes one region before crossing to the next. Touch targets retain their 48dp minimum regardless of the increased display real estate.

**Wear OS:** Screen space is extremely limited, so content descriptions must be concise. Rotary input via the Digital Crown substitutes for scroll and slider gestures; interactive elements that users would scroll or drag need a rotary-compatible interaction path. High-contrast themes are common on watches; verify contrast at the watch-specific system-theme variants.

**Android TV:** Navigation is entirely focus-driven via D-pad or remote; there is no touch. Every focusable element needs a clear focused visual state and a content description. Verify that focus never traps inside a non-scrolling region and that the focus order follows the natural reading flow of the screen.

## Pitfalls

- **Relying on placeholder gray text alone for error states.** A dimmed input with no icon or label fails both the color-alone rule and often fails contrast; pair the visual with an inline error message using Material 3's TextField error support.

- **Setting content descriptions that echo the visible label redundantly.** TalkBack will read the visible text of a `Text` composable and then a matching `contentDescription`, producing double-reading. Descriptions are for elements without sufficient visible text, not for elements that already carry it.

- **Using opacity or saturation shifts as the only selected-state indicator.** A chip that becomes 30% opaque when deselected conveys selection purely through color (luminance). Add a checkmark, a border, or a label change.

- **Hard-coding touch targets smaller than 48dp in tight layouts.** Dense lists, compact toolbars, and icon rows are common offenders. Audit every interactive element at 1x density with developer options Show Tap Areas enabled.

- **Skipping contrast audits on Material You dynamic color themes.** The system generates color roles from the user's wallpaper; your design cannot control the exact hue. Verify that your chosen role pairings (e.g., onSurface on surface) satisfy contrast across a representative range of wallpaper-derived palettes.

- **Ignoring the reduced-motion experience.** Designing only the full-animation path and planning to "disable it later" typically results in a jarring flash or invisible transition that confuses users. Design the reduced-motion variant alongside the default.

- **Collapsing entire scrollable regions into a single accessibility node.** Merging a card list's children into one node removes per-item actions from assistive technology. Only merge leaf-level card groups where individual children carry no independent interactive meaning.

- **Omitting heading semantics on section titles.** Without heading designation, TalkBack users cannot use heading-jump shortcuts to skim a long screen. Sections marked visually with a large type style should also be marked semantically as headings.

## References

- **Material 3 Guidelines:** [Foundations Overview](https://m3.material.io/foundations/overview)
- **Documentation:** [Accessibility in Compose](https://developer.android.com/develop/ui/compose/accessibility)

## See also

The `compose-accessibility` code skill implements the semantics modifier, `contentDescription`, `mergeDescendants`, `stateDescription`, `Role`, traversal index, and touch-target helpers that realize these design principles in Jetpack Compose. For type-scale roles and sp sizing that underpin dynamic font guidance, see the compose-theming code skill. For color contrast and dynamic-color palette review, see the m3-color design skill.
