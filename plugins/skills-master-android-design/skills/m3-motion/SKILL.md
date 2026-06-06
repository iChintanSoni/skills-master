---
name: m3-motion
description: "Design critique and guidance for Material 3 motion in Android apps: easing and duration tokens, standard vs. expressive motion schemes, physics-based spring motion, M3 transition patterns, choreography, and honoring reduce-motion. Use when reviewing or designing animations, transitions, or state changes in a Material You app, or when auditing motion for accessibility and consistency with the M3 motion system. Produces design judgment and UX recommendations, not code."
---

## When to use

- Reviewing screen transitions, in-app navigation, or shared-element flows for continuity and spatial coherence.
- Evaluating animated state changes (button press, expand/collapse, card flip, loading) for clarity and timing appropriateness.
- Deciding between the standard and expressive motion schemes, or choosing which M3 transition pattern fits a navigation model.
- Auditing choreography across simultaneous or staggered animations for visual hierarchy.
- Checking whether a design degrades gracefully when the user enables Remove Animations or disables animations at the OS level.

## Core guidance

### Motion values and intent

- **Make motion informative first.** Each animation should answer a spatial or status question — where did this element come from, where did it go, what changed? Cut any animation that does not contribute a meaningful answer. Decoration accumulates into noise.
- **Make motion focused.** One thing should lead at a time. When multiple elements change, one element should complete or lead the eye before the next responds, unless a simultaneous change is explicitly communicating they are the same thing.
- **Make motion expressive only where it earns its place.** Expressive spring motion, bouncy reveals, and elastic snapping communicate personality and delight; they are appropriate for hero content, empty-state illustrations, bottom sheets sliding up, and FAB transformations. They are inappropriate for utility actions, error states, and navigation flows that users repeat hundreds of times per session.

### Easing and duration tokens

- **Use M3 easing tokens, not hand-tuned curves.** M3 defines Emphasized easing (asymmetric: fast departure, slow arrival), Standard easing (symmetric acceleration/deceleration), and Linear easing for cases where rate-of-change must be constant (color fades, opacity). Choosing the right easing token is a design decision, not an implementation detail: Emphasized easing draws the eye to the destination and is correct for most spatial transitions; Linear easing is correct for subtle fades where a shaped curve would feel mechanical.
- **Duration tokens encode visual complexity, not aesthetic preference.** Short (100–200 ms) is for micro-interactions and simple on/off toggles. Medium (300–500 ms) is for container transforms and screen-level transitions. Long durations (500 ms+) should be rare — reserved for full-screen transitions with rich shared elements. When a transition feels slow, check duration before checking easing; reducing duration is almost always the right fix.
- **Prefer tokens over raw milliseconds.** Using the motion token system ensures the design stays coherent if the system-level timing is tuned in a future release.

### Standard vs. expressive motion schemes

- **The standard scheme** governs utility UI: navigation bars, lists scrolling, form field focus rings, dialogs appearing. It uses symmetric easing, moderate durations, and springs tuned for zero overshoot (critically damped). This scheme should be the default choice.
- **The expressive scheme** (introduced in M3 Expressive) allows springs with gentle overshoot, personality-driven velocity, and physics that feel alive. It is appropriate for bottom sheets, navigation drawers, floating action button (FAB) transformations, image carousel interactions, and any motion that is meant to delight rather than merely inform. Applying the expressive scheme to utility elements (text fields, checkboxes, navigation transitions) reads as jittery or unprofessional.
- **Do not mix schemes arbitrarily within a single interaction.** A sheet can use expressive spring physics for its slide-up; the content that fades in inside it should use the standard effects spec. Consistency within an interaction boundary is more important than variety.

### Physics-based spring motion

- **Spring motion is the default model in M3 Expressive.** Unlike tween-based motion that runs for a fixed duration, spring motion is driven by stiffness, damping, and an initial velocity drawn from the gesture that triggered it. A spring launched by a fast fling naturally feels faster than one launched from a tap; the physics do the work of matching animation to intent.
- **Gesture velocity should feed into spring initial velocity.** A card dragged and released with velocity should continue in the direction of the gesture before settling. If a spring animation ignores the gesture velocity and always starts from zero, it will feel disconnected and unresponsive.
- **Overshoot is expressive, not a bug — in context.** A bottom sheet that overshoots its resting position by a few points before settling communicates physical weight. A confirmation dialog that overshoots its final scale reads as alarming. Apply overshoot only to elements the user is expected to interact with repeatedly and that benefit from a tactile quality.
- **Avoid spring parameters that cause visible ringing.** More than one overshoot cycle is almost never appropriate in production UI. If the spring rings, increase damping.

### M3 transition patterns

M3 defines four named transition patterns. Choosing among them is a design decision based on the spatial and hierarchical relationship between origin and destination.

- **Container transform** is for transitions where the destination originates inside the origin: a card expanding to its detail view, a FAB morphing into a dialog, a list item opening a full-screen editor. The container visually expands from its source; the user understands the destination is the same object seen more fully. This is the highest-continuity transition and should be the default for content-to-detail navigation.
- **Shared axis** is for transitions that imply a spatial or sequential relationship: forward/back navigation in a wizard, horizontal swiping between tabs, vertical scrolling between steps. The direction of movement encodes the navigational metaphor (forward = left-to-right or top-to-bottom, back = reverse). Consistent axis direction is essential; switching axis within a flow breaks the spatial model.
- **Fade through** is for transitions between destinations that have no spatial relationship: switching tabs in a bottom navigation bar, changing the selected item in a navigation drawer. Content fades out first, then new content fades in, signaling a context switch rather than a spatial move. The brief intermediate empty state helps the user recognize they are in a different place.
- **Fade** is for elements that appear or disappear within the same container without any spatial implication: tooltips, snackbars, loading overlays, in-place state changes on a card. Fade should not be used for navigation because it provides no directional or hierarchical signal.
- **Do not use container transform for unrelated transitions.** If A does not contain B and B does not relate spatially to A, container transform misleads the user about object identity.

### Choreography

- **Lead with the most important element.** In a staggered entrance, the primary content (headline, hero image, primary action) enters before supporting content. Reversing this forces the user to wait for noise before the signal.
- **Stagger sparingly.** A 30–50 ms stagger between adjacent list items creates a sense of flow. A 150 ms stagger across eight list items is a 1.2-second wall the user must watch before interacting. Stagger three to five items maximum; beyond that, enter the group simultaneously.
- **Keep simultaneous animations semantically related.** If two elements animate at exactly the same time and in the same direction, the user reads them as one object. Use this intentionally; avoid it accidentally.
- **Enter and exit animations should be asymmetric in duration.** Exits can be 20–30% shorter than entrances because the user's attention is already leaving. A slow exit holds attention hostage.

### Reduce-motion and accessibility

- **Treat reduced-motion as a design requirement, not a fallback.** When the user has enabled Remove Animations in Android accessibility settings, the intent is to remove vestibular-triggering motion, not to destroy all visual feedback. Design a reduced-motion version for every meaningful transition: replace container transforms with a crossfade or instant cut; replace sliding shared axes with opacity transitions; keep micro-interactions that confirm input (ripple, toggle state change) unless they cause discomfort.
- **Never use animation as the only signal for a state change.** If a form field turns green and pulses once to indicate success, the user who missed the animation gets no feedback. Pair animation with a persistent visual, label, or haptic.
- **Avoid continuous looping animations in default UI.** Looping shimmer, pulsing indicators, and animated backgrounds can trigger photosensitivity or sustained visual discomfort. If a looping animation serves a function (loading indicator), ensure it stops when loading completes; do not leave it running as ambient decoration.
- **Check that animations do not obscure interactive targets during playback.** A button that is mid-transition may not register taps correctly; ensure interaction targets are available throughout or clearly disabled during the transition.

## Platform notes

- **Compact phone (portrait):** Full-screen container transforms, bottom-sheet springs, and directional shared-axis transitions work well here. Duration tokens at the lower end of their ranges keep the UI feeling snappy on smaller screens where transitions dominate the full viewport.
- **Large screen and foldable (expanded/medium window size class):** Pane-level transitions should be shorter than equivalent phone transitions; the user's eye covers more distance and a long animation across a 12-inch display feels slower. Split-pane navigation (list-detail) should avoid container transforms that animate across pane boundaries; prefer a fade-through or fade for the detail pane while the list remains stable. Shared-element transitions that cross pane boundaries require special care to avoid clipping.
- **Foldable fold/unfold:** The posture change (folded to unfolded) is not a navigation event and should not trigger a full navigation transition. Content should reflow with a short, non-directional animation (fade or scale) that signals adaptation rather than navigation.
- **Wear OS:** Motion should be extremely brief (under 200 ms for almost everything). Spring physics with overshoot are rarely appropriate given the small screen area and short interaction windows. Prioritize instant legibility over expressive transitions.
- **Android TV:** Focus-driven motion (scale on focus gain, scale-down on focus loss) is the primary motion language. Transitions between screens should be fast; the user's attention is on content, not navigation chrome. Avoid slide animations that move content away from center where a large group is watching.

## Pitfalls

- Using container transform for navigation between unrelated screens, which implies a false object-identity relationship and confuses the user about back-navigation expectations.
- Applying the expressive spring scheme to utility UI (settings toggles, form fields, navigation) where the bouncy physics reads as jittery and unprofessional.
- Ignoring gesture velocity when launching spring animations, resulting in motion that disconnects from the user's physical intent.
- Staggering too many list items with too long a delay, creating a wall of animation the user must wait through before the UI becomes interactive.
- Using fade-through for content-detail navigation (where container transform is correct) or container transform for tab switching (where fade-through is correct).
- Relying on animation as the sole signal for a status change (success, error, completion) with no persistent visual backup.
- Leaving looping animations running indefinitely as ambient decoration, which triggers fatigue and accessibility complaints.
- Treating reduced-motion as a global off switch rather than designing a meaningful reduced-motion variant for each key transition.
- Using long durations (400 ms+) on frequent, repetitive interactions — by the tenth repeat, the animation is pure delay.

## References

- **Material 3 Guidelines:** [Motion overview](https://m3.material.io/styles/motion/overview)
- **Material 3 Guidelines:** [Easing and duration tokens](https://m3.material.io/styles/motion/easing-and-duration/tokens-specs)
- **Material 3 Guidelines:** [Transition patterns](https://m3.material.io/styles/motion/transitions/transition-patterns)
- **Material 3 Guidelines:** [M3 Expressive motion](https://m3.material.io/blog/building-with-m3-expressive)
- **Documentation:** [Animation in Jetpack Compose — Introduction](https://developer.android.com/develop/ui/compose/animation/introduction)

## See also

- The **compose-animation** code skill implements the motion patterns described here using `AnimatedContent`, `AnimatedVisibility`, `animate*AsState`, `SharedTransitionLayout`, `updateTransition`, spring specs via `MaterialTheme.motionScheme`, and `Animatable` for gesture-driven physics.
- The **m3-theming** design skill covers how color and typography tokens complement motion tokens to create a coherent Material You identity.
- The **m3-accessibility** design skill extends the reduce-motion guidance here into a full accessibility audit framework including color contrast, touch targets, and screen-reader semantics.
