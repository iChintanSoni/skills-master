---
name: m3-predictive-back
description: "Design critique and guidance for Material 3 predictive back in Android apps: evaluating system back-to-home preview behavior, specifying in-app back animations and shared-element transitions, maintaining consistent back semantics, and avoiding back hijacking. Use when reviewing or designing back navigation interactions in an Android app, specifying how a screen should respond to the predictive swipe gesture, auditing whether back behavior matches user expectations, or deciding when a custom back animation adds value versus when the system default is the right answer."
---

## When to use

- Reviewing whether a screen's back behavior matches predictive back expectations: does the swipe-peek preview reveal the right destination?
- Specifying custom in-app back animations — deciding whether a container shrink, a shared-element return, or a directional slide best communicates the spatial relationship.
- Auditing back semantics across a flow to ensure back always means "undo the last navigation step" and never becomes a trap or a surprise.
- Deciding whether a screen needs a custom back animation at all, or whether the system default back-to-home preview is sufficient.
- Evaluating whether an in-app back interception (closing a drawer, dismissing a sheet, clearing a selection) is justified or constitutes back hijacking.
- Critiquing shared-element transitions for continuity on the return journey — verifying the reverse path feels as intentional as the forward path.

## Core guidance

### Respect back as a universal contract

- **Back must always mean "go to where I just came from."** Users learn this contract across every app they use. Any behavior that deviates — back closing the app when a modal is open, back navigating two levels at once, back triggering a destructive action without confirmation — breaks trust and generates support tickets. Design back semantics before implementation starts.
- **The back gesture belongs to the user, not the app.** An app may intercept back to dismiss an overlay before popping the stack, but it must do so transparently and predictably. If the user swipes back twice and is surprised both times, the design has failed regardless of how technically correct the implementation is.
- **Back is not "cancel" in most contexts.** Labeling back as a way to cancel a form without warning and losing unsaved data is a common UX failure. When back from an editing screen would destroy progress, the design must include an unsaved-changes dialog on the back gesture — not silently discard work.

### System back-to-home preview: trust it, do not fight it

- **The system back-to-home animation is a free, coherent experience — accept it for root destinations.** When the user swipes back from your app's root screen, the system renders a peek preview of the home screen or the previous app behind yours. This animation is provided by Android automatically once the app opts in. It does not require any design work and it matches the behavior of every other opted-in app on the device.
- **Do not design a custom exit animation that competes with the system preview.** A custom screen-level fade or slide on the last back gesture before home will play on top of or in place of the system animation, producing an inconsistent experience compared to other apps. Reserve custom animations for in-app transitions.
- **Opt-in to predictive back at the manifest level and design around the assumption that it is active.** When the opt-in flag (`android:enableOnBackInvokedCallback`) is absent, the predictive swipe peek does not appear. Designing for predictive back means designing with the assumption that this flag is set and that the system will render the peek.

### In-app back animations: match the spatial model

- **Choose an animation that encodes the direction of travel.** If the user navigated forward by pushing a new screen on to the stack, the back animation should pull that screen off to the right (or to the end in RTL) while the parent screen slides in from the left. The M3 shared-axis transition pattern — horizontal for forward/back navigation — is the right default. A fade-through communicates a context switch, not a back step; do not use it for hierarchical back.
- **Animate the content, not just the container.** A plain window slide communicates position but not identity. When the destination screen contains an element that was also visible on the origin screen — a thumbnail, a title, an avatar — a shared-element transition makes the spatial relationship legible at a glance. The user's eye follows the element home without needing to reorient.
- **Drive the animation from the gesture's progress, not a fixed timer.** Predictive back exposes swipe progress from 0 to 1 before the user commits. In-app animations should respond to this progress in real time: the screen should visibly start moving as the user drags, not wait for the gesture to complete and then animate. A progress-driven response reads as physically connected to the input; a deferred response reads as sluggish or unresponsive.
- **The animation should be reversible without jarring.** If the user begins a back swipe and then cancels (releases without committing), the screen must smoothly return to its resting position. Snapping instantly back to the start, or completing the animation in reverse at full speed, both feel broken. Design the cancel path as carefully as the commit path.
- **Keep in-app back animations short.** Back is a frequent interaction. A 400 ms back animation that felt delightful on the first use becomes oppressive on the hundredth. The shared-axis back transition should complete in the 200–300 ms range; shared-element transitions may run slightly longer but should still feel brisk.

### Shared-element transitions on back

- **Design the return path explicitly, not as an afterthought.** The forward shared-element transition is usually specified in detail; the return path is often left vague. The return must visually reverse the forward journey: the element travels back to its original position and scale, the surrounding content fades back in. If the origin element is no longer visible when the user navigates back (scrolled off, removed from the list), the shared element should crossfade gracefully rather than flying to an empty position.
- **Match the element's visual state on arrival, not its visual state at departure.** If the user modified content on the detail screen — changed a title, toggled a favorite — the shared element should return in its updated state, not its pre-edit state. A stale return transition implies the change was discarded.
- **Do not force a shared-element transition when the spatial relationship is unclear.** A shared-element transition implies "this is the same object, seen in a different context." If the destination was reached by a context switch (e.g., opening a drawer item) rather than by drilling into a specific piece of content, a shared-element return misleads the user about object identity. Use a fade or a directional slide instead.
- **Test the transition on devices with the reduced-motion setting enabled.** Under reduced motion, the shared-element transition should collapse to a crossfade or an instant cut. Do not rely on the transition to convey information that must also be present in the static UI (labels, position, hierarchy).

### Defining back semantics across a flow

- **Map every back step in the navigation graph before implementation.** For each screen, explicitly specify: what does back do, what animation plays, and does the system need intercepting (for a sheet or a selection state) or is the default navigation pop correct? Leaving back semantics implicit invites inconsistent behavior.
- **Intercept back only to dismiss a layer, not to skip it.** Closing a bottom sheet on back before popping the screen is a valid and expected interception — one that users encounter in every well-designed app. Skipping from step 3 of a wizard directly to step 1 on a single back press is not. Each back press should undo exactly one navigation action.
- **Modals and overlays must always consume back before the underlying screen does.** A bottom sheet, a dialog, a snackbar action picker, or a contextual selection mode (bulk-select, text selection) must each handle back independently. The user expects back to close the topmost layer; if the sheet is open and back pops the whole screen, the experience is startling.
- **Treat contextual action modes as back-consuming layers.** When a user enters a multi-select mode (selecting list items for bulk delete, for example), the visual selection state should be treated as a layer: back clears the selection and returns to the default mode, not pops the screen. Design this state transition as a visible exit animation — the action bar returns to its default form, checkboxes fade out — so the user knows the layer closed.

### When custom back animation is not warranted

- **Do not design a custom back animation for every screen.** Predictive back with the system default is a coherent, polished experience. Custom animations add visual richness but also add engineering cost, regression surface, and the risk of feeling inconsistent with platform conventions. Reserve custom back animations for the highest-traffic, highest-identity moments: the product detail returning to the catalog, the photo expanding and contracting from a grid, the user profile sliding in from the navigation rail.
- **Utility screens — settings, permissions, confirmations — should use the default back behavior.** Applying a flashy shared-element transition to a permission rationale dialog is unnecessary and may actually slow the user down.
- **If the design cannot describe the custom animation clearly in prose, it is not ready to be built.** "It should just feel smooth" is not a spec. A custom back animation spec should name the element being shared, its start and end states, the duration, the easing, and the reduced-motion fallback.

## Platform notes

- **Phone (compact portrait and landscape):** The predictive back swipe originates from the left or right edge. The full-screen nature of compact navigation makes the swipe preview and the in-app animation the dominant visual event; both must be polished. Ensure the back animation does not compete with system gesture navigation insets at the screen edges.
- **Large screens and tablets (medium and expanded windows):** In a two-pane list-detail layout, back from the detail pane should collapse the detail, not exit the entire screen. The back gesture in this context operates within the detail pane, not across the full window. Design the detail pane's back behavior as a pane-level operation. The system back-to-home preview applies only when the user is at the root state with no detail open.
- **Foldables:** When the device unfolds while the user is mid-flow, the back stack remains the same but the layout reflows. Back semantics must not change when the form factor changes — back from the detail pane is back from the detail pane regardless of whether it is displayed as a separate screen or as a side-by-side panel.
- **Multi-window mode:** When the app is in split-screen or freeform, back gestures are scoped to the app window. The system back-to-home preview shows correctly. Be aware that edge swipes may be ambiguous near the multi-window drag handle; in-app back interactions should not depend on edge proximity as a visual cue.

## Pitfalls

- **Treating back as a secondary consideration.** Back is one of the most-used interactions in any app. Design teams that spec only the forward journey routinely ship broken, inconsistent, or surprising back behavior.
- **Using custom animations to compensate for unclear information architecture.** A beautiful shared-element transition cannot fix a navigation structure where the user does not know where back will take them. Solve hierarchy first; animate second.
- **Animating on back commitment only, ignoring the gesture progress.** Predictive back's core value proposition is the peek: the user can see where they are going before they let go. An animation that starts only after the user releases the gesture misses this entirely and is no better than a legacy back implementation.
- **Not resetting mid-gesture state on cancel.** If the UI partially animates during a swipe that the user then cancels, the UI must return to its exact resting state. Failing to reset leaves orphaned visual states — a card partially scaled down, a shared element partially translated — that are jarring on the next render.
- **Blocking back in violation of Play policy.** Google Play requires that apps do not permanently trap users. A back handler that always intercepts without ever progressing the back stack, or that exits the app without ever returning to the home screen after repeated back presses, is a policy violation and will damage user trust.
- **Designing different back behavior depending on how the user arrived.** If screen A can be reached from B or from C, back from A should always return to where the user came from. Designs that hard-code "back from A always goes to B" regardless of the actual navigation source create dead ends for users who arrived from C.
- **Skipping the reduced-motion variant for in-app back animations.** Users who enable Remove Animations have a medical or comfort reason. A custom in-app animation that does not degrade gracefully under reduced motion will trigger complaints and accessibility failures.

## References

- **Documentation:** [Custom back navigation — Predictive back gesture](https://developer.android.com/guide/navigation/custom-back/predictive-back-gesture)
- **Documentation:** [Design for Android](https://developer.android.com/design/ui/mobile)
- **Material 3 Guidelines:** [Understanding navigation](https://m3.material.io/foundations/interaction/states)
- **Material 3 Guidelines:** [Motion — Transition patterns](https://m3.material.io/styles/motion/transitions/transition-patterns)
- **Material 3 Guidelines:** [Sheets — Back behavior](https://m3.material.io/styles/motion/overview)

## See also

- The **predictive-back** code skill implements the patterns described here using `PredictiveBackHandler`, `BackHandler`, `BackEventCompat`, `SharedTransitionLayout`, and `AnimatedContent` in Jetpack Compose.
- The **m3-motion** design skill covers the easing tokens, duration guidelines, and transition pattern vocabulary (container transform, shared axis, fade through, fade) referenced throughout this skill.
- The **m3-navigation** design skill addresses the broader navigation model — bottom bars, rails, drawers, tabs — and how each navigation pattern affects where back takes the user.
- The **m3-sheets** design skill covers bottom sheet and side sheet back-dismiss behavior and when each sheet type warrants a back interception layer.
- The **android-navigation-architecture** lang-tooling skill covers back stack management, deep links, and the Navigation component's built-in back handling that underlies most of the patterns here.
