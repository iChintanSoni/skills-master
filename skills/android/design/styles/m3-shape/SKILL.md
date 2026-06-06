---
name: m3-shape
description: "Design guidance for the Material 3 shape system — scale, corner families, component-to-shape assignments, using shape for emphasis and brand expression, and M3 Expressive shape morphing. Use when reviewing or designing component roundness, deciding which shape tier fits a surface or interactive element, communicating brand through corner style, or auditing shape consistency across a Compose UI."
tags: [m3, design, shape, material-you, android]
x-skills-master:
  domain: android
  class: design
  category: styles
  platforms: ["android", "large-screen"]
  pairs_with: []
  sources:
    - https://m3.material.io/styles/shape/overview-principles
    - https://developer.android.com/develop/ui/compose/designsystems/material3
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Apply this guidance when you are:

- Deciding how round (or sharp) the corners of a new component or surface should be and which tier of the shape scale to assign.
- Reviewing a design for shape consistency — ensuring that components of the same semantic weight use the same tier.
- Expressing brand personality through corner style without departing from the Material 3 system.
- Considering shape morphing (M3 Expressive) to animate a component between shape states.
- Auditing a screen for shape hierarchy — verifying that prominent elements read as primary and subsidiary elements recede.

This skill produces design judgment and recommendations. The implementing composables — including those that read from `MaterialTheme.shapes` — are handled by the compose-theming code skill.

## Core guidance

### The shape scale and its tiers

Material 3 defines seven canonical shape values: **None** (0 dp, sharp rectangular), **Extra Small**, **Small**, **Medium**, **Large**, **Extra Large**, and **Full** (fully rounded, pill or circle). Each step is a distinct visual weight; skipping tiers creates inconsistency rather than contrast.

- **Use None sparingly.** Sharp corners carry a utilitarian, high-density personality. Reserve them for data-dense surfaces like data tables or inset dividers — not interactive cards or containers that invite touch.
- **Extra Small (4 dp) through Small (8 dp)** suit compact interactive elements: chips, badges, text field indicators, snackbars. They read as precise and efficient.
- **Medium (12 dp)** is the default for mid-sized containers — cards, dialogs, menus. It is visually neutral and blends without making a statement; prefer it when the component should not distract.
- **Large (16 dp) through Extra Large (28 dp)** are expressive. They suit prominent surfaces like bottom sheets, navigation drawers, large cards, and modal containers. They signal "I am the focal point of this screen."
- **Full (50 % of the shorter dimension or a very large radius)** creates pills and circles. Use it for buttons, FABs, and icon buttons — elements meant to feel approachable and primary. Avoid it on tall containers where a pill would look like a stadium and fight the content inside.

### Corner families

M3 supports three corner families beyond the default rounded style:

- **Rounded** (the default) reads as friendly, open, and brand-neutral. Use it unless you have a deliberate reason to deviate.
- **Squared** (superellipse / squircle) reads as precise and modern. It softens corners while retaining a more geometric, technical character. Useful when a brand leans structured or app-like rather than soft.
- **Cut** (clipped diagonal) reads as bold and architectural. Reserve it for strong brand applications or hero elements; applying it system-wide creates visual noise.

When adopting a non-rounded family, apply it consistently at a system level through the shape scale rather than one-off per component — inconsistency reads as a bug, not style.

### Assigning shapes to components

Material 3 prescribes default shape tiers for each component, and these defaults encode semantic meaning. Breaking them shifts user expectation.

- **Buttons (standard, filled, tonal, outlined)** default to Full. Deviating from pill toward Medium or Large is acceptable for a more restrained brand, but never go to None — that erases the button identity.
- **FABs (small, regular, large)** default to Large or Extra Large. Their generous corner signals "primary action"; reducing roundness makes the FAB compete with cards rather than float above them.
- **Cards and containers** default to Medium. Elevating a hero card to Large or Extra Large is valid for emphasis, but using Large for every card removes the hierarchy signal.
- **Bottom sheets and navigation drawers** use Large on the exposed corners and None on the anchored edge. Respect this split: rounding the anchored edge creates an ungrounded, floating feeling.
- **Dialogs** default to Extra Large. The prominent roundness signals that this is a modal interruption separate from the page surface.
- **Chips** use Small, reinforcing that they are compact, supplementary elements.
- **Snackbars** use Extra Small — they are transient and should not demand attention through shape.

### Shape for emphasis and hierarchy

Shape size contributes to visual prominence just as color and elevation do. A design that relies only on color to create hierarchy will lose it in situations where color is unavailable (monochrome rendering, low-vision contexts). Shape provides a parallel channel:

- **Larger corner radius = higher visual prominence.** An Extra Large surface reads as a focal point even before color is perceived.
- **Use shape tiers to separate distinct elevation layers.** A full-radius FAB floating over a Medium-corner card establishes clear spatial separation without relying solely on shadow.
- **Do not mix arbitrary radii.** If three components share a semantic level, they must share a shape tier. Arbitrary differences (e.g., 14 dp, 16 dp, and 18 dp across sibling cards) create visual noise that users experience as inconsistency even if they cannot name it.

### Shape for brand expression

`MaterialTheme.shapes` is the single source of truth for shape in a Compose app. To inject brand personality:

- **Override only the tiers your brand requires.** Changing every tier simultaneously removes contrast; instead, shift the tiers that correspond to your most prominent surfaces (typically Medium through Extra Large) and let the others remain at their defaults.
- **Lean into corner family to establish character.** A brand that wants precision can switch the default corner family from Rounded to Squared across all tiers without changing radii. This is a lightweight but strongly felt change.
- **Avoid "shape creep."** Every designer naturally wants to push corners further for their brand. Establish maximum and minimum tier usage rules — for example, "no interactive element below Extra Small, no container above Extra Large" — and enforce them in design review.

### Shape morphing in M3 Expressive

M3 Expressive (the evolution of Material You) introduces animated shape transitions — a component can fluidly morph between two shape states on interaction or state change. For example, a FAB can expand and reshape into an extended FAB, or a button can subtly squish on press.

- **Use morphing to reinforce interaction feedback.** A shape that stretches toward a press point or contracts on tap communicates physicality and responsiveness.
- **Do not morph simply for decoration.** Every shape animation should map to a state change the user cares about (pressed, focused, loading, expanded). Decorative morphing adds distraction without meaning.
- **Ensure morph start and end states are both valid shape tier assignments.** If morphing between Full and Large, both endpoints should read correctly in isolation — the user may catch the interface mid-animation.
- **Keep morph duration brief.** Shape animations in the 150–300 ms range feel snappy; longer durations feel sluggish or showy. Coordinate with the motion design skill to align shape timing with elevation and color transitions.

## Platform notes

**Compact phones:** The prescribed shape scale works as intended at small screen sizes. Extra Large containers (bottom sheets, dialogs) benefit from generous corners because the component occupies most of the screen and the radius frames the content visually.

**Large screens and foldables:** At tablet and desktop breakpoints, cards and containers grow wider. A Medium corner on a wide card can read as barely rounded — consider stepping up to Large for hero cards on large screens to preserve the same visual impression. Bottom sheets on large screens may become side sheets; adjust so that only the exposed edge (the top, or the inner vertical edge) carries the Large radius, and the anchored edges remain None.

**Foldable inner display:** The fold hinge introduces a physical crease. Do not place round-cornered containers whose edge lands exactly on the hinge — the shape will be interrupted. Prefer layouts that treat each half as an independent panel.

**Wear OS:** Shape is limited to circles and rounded rectangles at the platform level. Use Full for tiles and interactive surfaces; non-rounded families (Cut, Squared) are rarely appropriate given the circular display context.

**Android TV:** On the 10-ft UI, shape is a secondary concern — size and color contrast dominate legibility at distance. Keep shapes in the Medium to Large range to avoid sharp corners that read as dated on a large display, but do not rely on fine shape differences for hierarchy.

## Pitfalls

- **Arbitrary radii outside the scale.** Using a 10 dp radius because "it looked right in Figma" instead of assigning the nearest tier (Extra Small at 4 dp or Small at 8 dp) breaks system coherence and makes the shape unreachable via `MaterialTheme.shapes`.
- **Rounding all corners on a grounded surface.** A bottom sheet with all four corners rounded floats off the screen edge and destroys the grounded metaphor. Always use None on the anchored edge.
- **Using Full on tall containers.** A Full-radius container that is taller than it is wide becomes a stadium pill shape. This looks unintentional and competes with the button family.
- **Ignoring the corner family.** Adopting a custom radii set in Figma but leaving the family as Rounded while the brand intended Squared means the component renders differently in the real app vs. the design file.
- **Shape without state.** Interactive components must preserve their shape across all states — default, hovered, focused, pressed, disabled. A shape that shifts accidentally between states (e.g., due to a border-radius change on focus) violates consistency.
- **Over-morphing.** Applying morph animations to every interaction makes the UI feel restless. Reserve morphing for meaningful state transitions, not idle animations.
- **Mismatched shape tiers between related components.** A dialog (Extra Large) that launches from a card (Medium) shares no shape relationship. The Extra Large dialog is correct, but a source card elevated to Large creates a smoother visual handoff.

## References

- **Material 3 Guidelines:** [Shape overview](https://m3.material.io/styles/shape/overview-principles)
- **Documentation:** [Material 3 in Compose](https://developer.android.com/develop/ui/compose/designsystems/material3)

## See also

The compose-theming code skill implements the shape scale through `MaterialTheme.shapes` and the `Shapes()` constructor — consult it for the Kotlin implementation of any shape assignment described here. For overall color and typography design judgment that pairs with shape to form a complete M3 theme, see the m3-color and m3-typography design skills (when available). For guidance on motion and how shape morphing fits into a broader animation language, see the m3-motion design skill.
