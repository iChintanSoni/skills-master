---
name: m3-gestures
description: "Material 3 design judgment for gesture interactions on Android: standard gesture vocabulary (tap, swipe, long-press, drag, pinch), affordance and discoverability design, avoiding conflicts with Android system edge gestures and scroll containers, and ensuring every gesture-driven action has a non-gesture alternative for accessibility. Use when designing or critiquing touchscreen interactions, auditing a screen for gesture conflicts or discoverability gaps, or deciding how to surface hidden swipe actions and drag handles."
tags: [m3, design, gestures, interaction, touch]
x-skills-master:
  domain: android
  class: design
  category: patterns
  platforms: ["android", "large-screen"]
  pairs_with: []
  sources:
    - https://developer.android.com/develop/ui/compose/touch-input/pointer-input
    - https://m3.material.io/foundations/overview
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for this skill whenever you are designing or critiquing touch interactions on Android: adding a swipe-to-dismiss action to a list item, deciding whether a long-press context menu is the right pattern, evaluating whether a custom drag interaction conflicts with system edge gestures, or auditing a screen for gesture discoverability and accessibility gaps. Material 3 treats gestures as enhancements to the primary UI — not as the primary means of access — so this skill applies from early interaction design through component review and QA sign-off. Hand the Jetpack Compose implementation (including `Modifier.pointerInput`, `detectDragGestures`, and `AnchoredDraggable`) to the compose-gestures code skill.

## Core guidance

### Standard gesture vocabulary

- **Reserve tap as the primary, universal action trigger.** The single tap is Android's canonical "activate" gesture. Every interactive control must respond to a deliberate tap; do not require two-finger taps, double-taps, or long-presses as the only activation path for any primary action. Material 3 buttons, chips, list items, cards, and navigation elements are all designed around single-tap activation.

- **Use swipe for progressive, spatially coherent dismissal or navigation.** Horizontal swipe on list items expresses "remove" or "file" contextually (swipe right may mean archive; swipe left may mean delete). Vertical swipe on bottom sheets and modals collapses them. The direction must align with the spatial metaphor: swiping content in the direction it will disappear to, not against it. Avoid assigning swipe to an action that is irreversible without confirmation when the gesture is ambiguous with scrolling.

- **Treat long-press as a context-menu and multi-select entry point, not a primary action.** Long-press is hidden and slow; users who discover it feel rewarded with a contextual shortcut, not confused. Never place a destructive action exclusively behind a long-press. In list and grid contexts, long-press conventionally enters multi-select mode — do not repurpose it for something unrelated, because users carry that expectation from the OS and other Material apps.

- **Use drag as explicit repositioning or reordering.** Drag-to-reorder in lists, drag-to-resize panels, and drag-handle interactions are meaningful when the element is explicitly a movable object. A visible drag handle (the three-line grip icon from Material icons) signals draggability; without a handle, users have no way to discover that an element is draggable. Reserve drag for objects that are semantically repositionable — do not use drag as a shortcut for an action that a button could express more clearly.

- **Limit pinch-to-zoom to genuinely scalable content.** Maps, images, documents, and media players are canonical use cases. Pinch on a fixed UI layout or inside a scrollable list creates ambiguity about what is being scaled. Never use pinch as the only way to reveal content that is relevant to all users; it is inherently explorative and non-discoverable.

### Discoverability and affordances

- **Make gesture entry points visible.** Any gesture that is the primary or only path to a feature must have a visible affordance. A bottom sheet with no drag handle, a swipeable card with no directional hint, or a draggable list item with no grip icon will be missed by the majority of users. Use Material 3 standard affordances — the bottom sheet drag indicator line, the SwipeToDismissBox directional icon reveal, the reorder handle — rather than inventing new ones.

- **Use animation to teach gestures in context.** When a gesture-driven pattern appears for the first time in a session, a brief entry animation that partially reveals the gesture affordance (a card peeking from the edge, a drag handle bouncing) is more effective than an explicit tutorial. Teach through motion rather than instructions.

- **Do not bury primary actions behind gestures.** Gesture-only actions are appropriate for shortcuts and power-user efficiency but never for actions critical to task completion. A user who cannot discover the gesture must still be able to accomplish the task through visible, tappable controls. This is both a usability and an accessibility requirement.

- **Respect gesture conventions established by the OS and platform apps.** Users arrive with expectations from Gmail, Google Photos, and system drawers. Assigning the right-edge swipe to a custom "next page" action when Android's system back gesture already claims that edge will produce unintended exits. Match, don't compete with, established conventions.

### System gesture conflicts

- **Treat the left and right screen edges as system-reserved territory.** Android's edge-back gesture is claimed by the OS in gesture-navigation mode. Do not place swipeable panels, carousels, or drawers that initiate from the left or right edge without explicitly requesting gesture exclusion zones — and request those zones only for content like canvas editors and games where edge interaction is genuinely essential.

- **Do not conflict with vertical scroll in scrollable containers.** A horizontal swipe-to-dismiss inside a vertically scrollable list is acceptable because the axes are orthogonal; a vertically swipeable card inside a vertical scroll container creates gesture collision that the system cannot always resolve correctly. Design horizontal gestures for horizontal containers and vertical gestures for vertical containers unless the interaction model explicitly requires otherwise.

- **Account for the bottom navigation gesture zone.** On devices using gesture navigation, the bottom area is claimed by the system home and app-switcher gestures. Interactive elements near the very bottom of the screen that rely on upward drags (like a draggable bottom sheet handle positioned too low) will compete with the system home gesture. Keep gesture-sensitive controls above the bottom system bar inset.

- **Test in gesture-navigation mode, not just three-button mode.** Gesture navigation is the default on most Android 10+ devices. A design that works in three-button mode may have completely broken edge interactions in gesture mode. Always validate gesture designs in the gesture-navigation system setting.

### Non-gesture alternatives for accessibility

- **Every gesture must have an equivalent, visible non-gesture path.** A swipe-to-delete list item must also expose a "Delete" button in a long-press context menu or an overflow menu on the item itself. A drag-to-reorder list must also provide explicit up/down move controls when TalkBack is active. Accessibility services intercept raw touch events, making gestures unreliable when an assistive technology is running.

- **Expose swipe actions as accessibility actions, not just touch gestures.** When a list item supports swipe-to-archive, that action must be surfaced as a labeled accessibility action (archive, delete, flag) so TalkBack users can activate it through the actions menu. A gesture that is visually intuitive but absent from the accessibility API is invisible to screen-reader users.

- **Provide keyboard and D-pad equivalents on large screens.** ChromeOS and foldables with keyboard attachments require all interactive paths to be reachable without touch. Drag-to-reorder requires a keyboard shortcut (or at minimum a context menu with move actions). Pinch-to-zoom requires plus/minus controls or a zoom slider. Treat keyboard interaction parity as a design requirement, not a developer afterthought.

- **Design gesture interactions to tolerate imprecise input.** Larger hit areas, generous swipe thresholds, and forgiving velocity detection benefit users with motor impairments who have difficulty producing precise swipe trajectories. A dismiss gesture that requires a very fast, straight, full-width swipe will fail many users who swipe more slowly or at a slight diagonal.

## Platform notes

**Compact phones (baseline):** System edge gestures are most aggressive here and the screen is smallest, making gesture conflicts most likely. Design horizontal swipe actions conservatively — prefer explicit action buttons revealed by swipe rather than instant destructive actions. Bottom sheets are a primary gesture surface; ensure drag handles are visible and meet the 48dp touch-target minimum.

**Large-screen devices and foldables (unfolded):** The additional screen width makes edge conflicts less severe (percentage-wise) but mouse and stylus inputs become relevant. Drag interactions should respond to both touch and pointer-drag events. Pinch-to-zoom may need a zoom control fallback for mouse-only users on ChromeOS. Multi-touch gestures like pinch are not reliable from a trackpad and should never be the only path to a feature on ChromeOS-optimized apps.

**Foldables in tabletop posture:** The bottom half is a natural interaction surface for drag and swipe controls; the top half is for passive viewing. Gesture affordances — drag handles, swipe indicators — belong in the bottom pane where the hands naturally rest.

**Wear OS:** The gesture vocabulary is constrained to tap, swipe left/right (navigation), and swipe down (back). Long-press is used for contextual menus on some watch faces. Drag, pinch, and multi-touch gestures do not apply. Design for the Digital Crown (rotary) as the primary scroll mechanism; swipe is supplementary.

**Android TV:** There is no touch at all; the D-pad and voice are the only inputs. None of the touch gestures in this skill apply. All interactive paths must be reachable via D-pad navigation and the select key.

## Pitfalls

- **Placing a swipeable component flush against the screen edge without a gesture exclusion zone.** A left-edge swipe panel on a device in gesture-navigation mode will almost always be intercepted as a system back gesture before your composable sees it.

- **Using long-press as the entry point for a primary or safety-critical action.** Long-press is invisible, slow, and inaccessible to users of TalkBack or Switch Access. It is appropriate only for shortcuts and selection modes that also have a visible alternative.

- **Designing swipe-to-dismiss without a confirmation step for irreversible destructive actions.** A swipe-to-delete that immediately destroys data with no undo Snackbar will generate user complaints. At minimum, provide an undo action via Snackbar (following Material 3's Snackbar guidance) or require a confirmation for permanent actions.

- **Forgetting to expose swipe actions as accessibility custom actions.** A swipe-to-archive that is not registered as an accessibility action is completely hidden from TalkBack users. Gesture affordances and accessibility actions must be registered in parallel.

- **Requiring simultaneous multi-touch in standard UI contexts.** Two-finger taps, three-finger swipes, and other multi-touch combinations are not standard Material patterns outside of maps and drawing canvases. Introducing them in a standard list or navigation context will confuse users and fail anyone using a stylus or Switch Access.

- **Inventing new gesture shapes that conflict with platform conventions.** A "twist" gesture for rotation or a "Z-stroke" for undo are learnable only with a tutorial and forgotten between sessions. Prefer standard patterns (pinch for scale, standard undo via shake or overflow menu) unless the app's context makes a novel gesture genuinely obvious and worthwhile.

- **Making drag the only way to reorder or organize content.** Drag is physically demanding for users with limited dexterity. Always pair a drag-reorder with an explicit move action accessible from the item's overflow or long-press menu.

- **Failing to test gesture interactions in both gesture-navigation and three-button navigation modes.** The system back gesture and edge swipe behaviors differ significantly; a design validated only in three-button mode may break entirely when the user switches to gesture navigation.

## References

- **Material 3 Guidelines:** [Foundations Overview](https://m3.material.io/foundations/overview)
- **Documentation:** [Pointer input in Jetpack Compose](https://developer.android.com/develop/ui/compose/touch-input/pointer-input)

## See also

The compose-gestures code skill implements the patterns described here using `Modifier.pointerInput`, `detectTapGestures`, `detectDragGestures`, `AnchoredDraggable`, and `SwipeToDismissBox` in Jetpack Compose. For accessibility action registration that pairs with gesture surfaces, see the m3-accessibility design skill and the compose-accessibility code skill. For motion design principles governing the animations that teach and confirm gestures, see the m3-motion design skill. For bottom sheet gesture design in particular, see the m3-sheets design skill.
