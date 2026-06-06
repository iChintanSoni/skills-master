---
name: m3-expressive
description: Design guidance for Material 3 Expressive — the evolution of Material You that adds physics-based spring motion, animated shape morphing, new and updated components, and the expressive motion scheme to the M3 design system. Use when deciding whether and how to apply expressive treatment (spring physics, shape morphing, emphasized typography, updated component variants) without sacrificing usability, clarity, or accessibility.
---

## When to use

- Deciding whether a screen, flow, or component is an appropriate candidate for expressive treatment — springs with overshoot, shape morphing, bold typography — versus standard M3 treatment.
- Evaluating a design that uses M3 Expressive components or motion and assessing whether the expressiveness serves users or merely adds noise.
- Choosing between the standard and expressive motion schemes for a particular interaction, and understanding the consequences of applying the wrong one.
- Auditing a design for consistency between expressive and standard zones — ensuring the two do not bleed into each other unintentionally.
- Understanding what M3 Expressive adds to the component library (new variants, updated defaults) and how those additions change design decisions for buttons, FABs, sheets, and navigation.

## Core guidance

### What M3 Expressive is

Material 3 Expressive is the next evolution of Material You, announced at Google I/O 2025. It extends the existing M3 design system with four primary additions: physics-based spring motion as the default animation model for expressive contexts, animated shape morphing as a first-class interaction primitive, a refreshed and expanded component library with new variants and updated defaults, and typography emphasis that gives Display and Headline roles more expressive range. These additions do not replace the existing system — they layer on top of it. Standard M3 tokens, components, and motion patterns remain valid and are still the correct choice for the majority of utility UI.

### The two motion schemes

M3 defines two coexisting motion schemes, and choosing between them is the most consequential expressive design decision.

- **The standard scheme is the default.** It governs utility UI: navigation transitions, form field states, list entries, dialogs, snackbars, and navigation bars. Standard motion uses symmetric easing, predictable durations, and critically damped springs (zero overshoot). Users interact with standard UI dozens or hundreds of times per session; motion here must be fast, predictable, and invisible in the sense that it never demands attention for its own sake.
- **The expressive scheme should be earned, not defaulted to.** It permits springs with gentle overshoot, velocity-driven personality, and physics that feel alive and tactile. Apply it to elements the user is meant to notice and feel: bottom sheets sliding up from an idle state, FAB transformations, image carousels, hero content reveals, and onboarding illustrations. The rule is: expressive motion belongs on content and interactive surfaces that reward attention; standard motion belongs on chrome and utility controls.
- **Do not mix schemes within a single interaction boundary without a clear rationale.** A bottom sheet is correctly in the expressive scheme for its slide-up gesture. The controls inside the sheet — text fields, buttons, switches — are utility elements and belong in the standard scheme. The distinction between the container (expressive) and the contents (standard) is deliberate and must be preserved.

### Physics-based spring motion

- **Spring motion is velocity-aware, duration-free.** Unlike tween-based animation, a spring settles at a rate determined by stiffness and damping rather than a fixed time. A spring launched by a fast fling settles faster; a spring launched from a calm tap settles more slowly. This automatic coupling between gesture energy and animation energy is the primary reason springs feel physical and responsive.
- **Feed gesture velocity into spring initial velocity.** When an element is dragged and released, the spring must inherit the release velocity, not restart from zero. A spring that ignores release velocity disconnects the physics from the user's physical action and destroys the tactile quality that justifies using a spring at all.
- **Overshoot is a communication tool.** A small overshoot (a bottom sheet settling 4–8 dp past its destination before snapping back) communicates mass and elasticity. Applied to a container the user frequently opens, it reinforces the sense of a real object responding to touch. Applied to a confirmation dialog or an error state, overshoot communicates the wrong thing — instability or alarm. Reserve overshoot for playful, invitation-to-interact surfaces.
- **Prevent ringing.** More than one overshoot cycle is almost never appropriate in production UI. If a spring rings (oscillates visibly more than once), increase its damping ratio. The expressive scheme does not license floppy or bouncy animations — it licenses a single, confident overshoot.
- **The standard scheme uses critically damped springs.** A damping ratio at or above 1.0 produces a spring that reaches its target without overshoot. Using a critically damped spring in the standard scheme is correct; using it in the expressive scheme is also valid when a surface is prominent but should not feel playful.

### Shape morphing

M3 Expressive promotes shape morphing from a novelty to a first-class interaction primitive. A component can animate between two valid shape states — for example, a FAB morphing from a circle to an extended pill, a button that squishes slightly on press, or a chip that expands to a full selection surface.

- **Every morph must map to a user-observable state change.** Pressed, focused, loading, selected, expanded — each has a clear meaning. A shape that morphs without a triggering state change is decoration, and decoration accumulates into restlessness. If you cannot name the state transition, remove the morph.
- **Both the start and end shape states must be independently legible.** The user may arrive mid-morph, especially under slow hardware or reduced-motion conditions. Verify that the intermediate shape values between the start and end states do not produce unrecognizable or confusing outlines.
- **Morph duration belongs in the 150–300 ms range.** Shorter morphs feel crisp; longer ones feel sluggish. Coordinate shape morph timing with any concurrent color, elevation, or opacity transitions so that all channels change together and reinforce the same state transition.
- **Do not morph every component.** Shape morphing applied throughout a screen makes the UI feel restless and expensive. Reserve it for the one or two components per screen that serve as primary interactive anchors: the FAB, a prominent card's selection state, or a key navigation element.

### New and updated components

M3 Expressive refreshes several components and introduces new ones. Each change encodes a design intent.

- **Buttons gain new variants** (split buttons, button groups) that allow related actions to share a container without requiring separate tap targets. Use button groups when actions are semantically paired and should be evaluated together; do not use them as a density trick to fit more buttons on screen.
- **The floating action button (FAB) family expands.** The FAB is the most expressive element in a standard M3 layout and the primary candidate for spring motion and shape morphing. M3 Expressive leans into this: the FAB is expected to animate its entry, respond physically to scroll direction (hiding on scroll-down, revealing on scroll-up with a spring), and morph between icon-only and extended states.
- **Bottom sheets receive expressive spring defaults.** The drag-to-dismiss gesture and the initial slide-up are the natural home for spring physics; M3 Expressive formalizes this. The settled sheet state should still feel stable and grounded, not restless.
- **Navigation components gain smoother transitions.** Navigation bar item selection, navigation drawer reveals, and navigation rail focus animations become spring-driven in the expressive scheme, reducing the mechanical feel of abrupt cuts and linear slides.
- **Loading indicators introduce new motion patterns.** M3 Expressive brings a refreshed circular progress indicator with spring-influenced arc expansion and a new indeterminate pattern. The design intent is to make loading feel active and in-progress rather than mechanical.

### Typography emphasis in expressive contexts

M3 Expressive gives Display and Headline roles broader authority in hero, onboarding, and editorial contexts. Variable font axes (weight, width, optical size) become more actively expressive tools.

- **Use Display and Headline roles at their full expressive range on hero screens.** An onboarding screen, a home screen hero card, or an achievement moment can use Display Large at maximum weight or width without apology. This is the intended use. The same Display role on a settings screen header is overscaled.
- **Weight and width animation can reinforce state transitions.** An element that increases in font weight on selection communicates focus; an element that animates its width axis on press communicates physicality. These effects should be subtle — a single weight step or a modest width change — not theatrical.
- **Type animation must never harm readability.** If a font-weight or size transition makes text temporarily harder to parse, the transition is too dramatic. Animate on axes that do not compromise legibility mid-transition.

### When not to apply expressive treatment

Expressive treatment is earned, not given. Apply it where it creates delight and reinforces product personality; withhold it everywhere else.

- **Utility controls (checkboxes, radio buttons, switches, text fields, sliders, steppers)** belong in the standard scheme. Users interact with these constantly; any expressive friction is pure cost.
- **Error states and destructive actions** should not use overshoot or playful morphing. The communication must be clear and serious; expressive physics introduce tonal incongruence.
- **Repetitive navigation interactions** should be standard. A spring-loaded tab-switch transition feels novel on the first press and annoying by the fiftieth. Expressive motion that the user must sit through dozens of times per session needs to be as fast and frictionless as standard motion.
- **Dense information surfaces (data tables, long lists, dashboards)** are not candidates for expressive treatment. The cognitive work is in reading content, not in experiencing the interface's personality.

## Platform notes

- **Compact phone (portrait), the design baseline:** Spring motion and shape morphing were designed for this form factor. The screen is small enough that an animated bottom sheet, FAB morph, or hero card entrance fills enough of the viewport to feel meaningful. Standard durations and spring parameters are calibrated for this context.
- **Large screen and foldable (expanded window size class):** Expressive motion needs recalibration on large screens. An animation that fills 80 percent of a compact phone screen fills only 30 percent of a tablet; the same spring that felt weighty on a phone may feel timid at tablet scale. Hero content entrances may need to be larger or more visually prominent to carry the same weight. Avoid spring animations that cross pane boundaries in split-pane layouts — the two-pane structure implies separate spatial regions, and physics that span them feel uncanny.
- **Foldable fold/unfold posture change:** The fold event is a layout adaptation, not a navigation event. It should not trigger expressive transition animations. Use a brief, non-directional fade or scale to signal reflow rather than a spring-driven entrance.
- **Wear OS:** The circular display and extremely short interaction windows are incompatible with the expressive scheme. Springs with overshoot feel wrong in a small circular context; use critically damped springs (standard scheme) for all Wear OS motion.
- **Android TV:** Expressiveness on TV is communicated through scale transitions on focus gain and through bold visual design, not through spring physics. FAB-style components are not present in TV UI; shape morphing is rarely appropriate. Stay within the standard scheme and ensure all focus and selection states have clear, immediate visual feedback legible from 10 feet.

## Pitfalls

- **Applying the expressive motion scheme to utility controls** — text fields, checkboxes, navigation bars — where bouncy springs read as jitteriness and unprofessionalism rather than delight.
- **Ignoring gesture velocity when configuring spring animations,** producing motion that starts from zero regardless of how quickly the user flicked or dragged, breaking the physical coupling that makes spring motion feel real.
- **Using overshoot on error states, confirmation dialogs, or destructive action confirmations,** where the playful tonal signal contradicts the seriousness of the content.
- **Morphing shapes without a triggering state change,** turning a semantic primitive into ambient decoration and making the UI feel restless.
- **Applying expressive treatment to every component on a screen,** which exhausts the user's attention budget and leaves no expressive contrast for the elements that genuinely warrant it.
- **Using long morph durations (400 ms+) on shapes the user interacts with repeatedly,** converting a delightful detail into an obstacle.
- **Failing to design a reduced-motion fallback for expressive spring animations.** When the user enables Remove Animations in Android accessibility settings, springs with overshoot must be replaced with instant cuts or short opacity crossfades — not left running at full motion. The expressive scheme is not an accessibility exception.
- **Mixing the standard and expressive schemes arbitrarily within a single interaction flow,** for example applying expressive spring physics to a navigation transition (correctly in the standard scheme) just because the destination screen contains expressive content.
- **Treating M3 Expressive as requiring expressive treatment everywhere.** Adopting M3 Expressive as the design system does not obligate expressive motion or shape morphing across the entire UI. The standard scheme and utility-first components remain the majority of a well-designed M3 Expressive app.

## References

- **Material 3 Guidelines:** [Motion overview](https://m3.material.io/styles/motion/overview)
- **Material 3 Guidelines:** [Shape overview and principles](https://m3.material.io/styles/shape/overview-principles)
- **Material 3 Guidelines:** [Motion easing and duration tokens](https://m3.material.io/styles/motion/easing-and-duration/tokens-specs)
- **Material 3 Guidelines:** [Transition patterns](https://m3.material.io/styles/motion/transitions/transition-patterns)
- **Material 3 Guidelines:** [Shape morphing](https://m3.material.io/styles/shape/overview-principles)
- **Material 3 Guidelines:** [M3 Expressive component updates](https://m3.material.io/components)

## See also

The m3-motion design skill covers the full M3 motion system in depth, including all four named transition patterns, choreography, duration tokens, and reduce-motion design. The m3-shape design skill covers the shape scale, corner families, component-to-shape assignments, and shape-as-hierarchy principles that underpin the shape morphing guidance here. The m3-typography design skill covers the five type-role families and variable font axes that expressive typography builds on. For the implementation side — configuring spring specs via `MaterialTheme.motionScheme`, using `ShapeKeyframe` and `MorphingShape` for shape morphing, and applying `AnimatedContent` or `AnimatedVisibility` with expressive spring parameters in Jetpack Compose — consult the compose-animation code skill.
