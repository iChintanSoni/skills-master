## Motion intent and purpose
- [ ] Every animation communicates spatial origin, destination, hierarchy, or state change — no purely decorative motion is present.
- [ ] Motion that serves no informational purpose has been cut or significantly reduced in prominence.
- [ ] Animations that repeat frequently (list scrolling, tab switching, form field focus) use shorter durations than hero or first-time transitions.

## Transition pattern selection
- [ ] Container transform is used only when the destination visually originates inside the origin element (card-to-detail, FAB-to-dialog, thumbnail-to-player).
- [ ] Shared axis is used only for transitions that express a real spatial or sequential relationship (wizard steps, horizontal tab swipe, back/forward navigation).
- [ ] Fade through is used for top-level destination switching with no spatial relationship (bottom nav tabs, navigation drawer items).
- [ ] Fade is used only for in-place appearance/disappearance (tooltips, overlays, in-place state changes), not for navigation.
- [ ] No container transform is applied between unrelated screens where no object-identity relationship exists.

## Motion scheme and easing
- [ ] Standard scheme (critically-damped springs, symmetric easing) governs utility and navigational motion.
- [ ] Expressive scheme (bouncy springs, personality-driven physics) is reserved for high-intent, non-repetitive interactions (FAB, hero reveals, bottom sheet).
- [ ] Expressive springs are not applied to utility UI: form fields, checkboxes, settings toggles, navigation transitions.
- [ ] M3 easing tokens (Emphasized, Standard, Linear) are specified by name, not replaced with hand-tuned cubic-bezier values.
- [ ] Emphasized easing is used for most spatial transitions (fast out, slow into destination).
- [ ] Linear easing is used only for opacity and color fades where a shaped curve would feel mechanical.

## Duration and timing
- [ ] Micro-interactions and on/off state changes use short durations (100–200 ms).
- [ ] Container transforms and screen transitions use medium durations (300–500 ms).
- [ ] Durations longer than 500 ms are used only for richly choreographed full-screen transitions and are rare.
- [ ] Exit animations are 20–30% shorter than corresponding enter animations.

## Spring physics
- [ ] Spring animations connected to gestures receive the gesture release velocity as initial velocity; they do not start from zero.
- [ ] Springs that overshoot do not ring more than one cycle before settling.
- [ ] Spring damping is sufficient to avoid a visible jitter on repeated interactions.
- [ ] Overshoot is present only on enter; exit animations use critically-damped springs.

## Choreography
- [ ] Primary content (headline, hero, primary action) enters before supporting content in staggered sequences.
- [ ] Stagger delay is applied to no more than 3–5 items; larger lists enter as a group.
- [ ] Stagger offset between items is 30–50 ms; larger stagger values have been reviewed for total wall-time.
- [ ] Simultaneous animations are intentionally semantically related; accidental co-timing has been reviewed and justified.

## Large screen and foldable
- [ ] Pane-level transitions on large screens use shorter durations than equivalent phone transitions.
- [ ] Shared-element transitions that would cross pane boundaries have been replaced with fade or fade-through to avoid clipping.
- [ ] Fold/unfold posture changes use a brief, non-directional adaptation animation, not a navigation transition.
- [ ] List-detail layouts keep the list pane stable during detail pane transitions.

## Reduced motion and accessibility
- [ ] A reduced-motion design variant exists for every significant transition; it is not simply "animation off."
- [ ] Reduced-motion variants use cross-fade or instant cut, preserving all functional signals the animation carried.
- [ ] No state change (success, error, completion, loading done) relies solely on animation — each has a persistent visual, label, or haptic companion.
- [ ] Looping animations (shimmer, pulse, spinner) stop when the condition they represent resolves.
- [ ] Interactive targets remain tappable (or are clearly disabled) throughout animation playback.
- [ ] No continuously looping ambient animation runs in the background while the user is interacting with content.
