---
name: m3-drag-drop
description: Material 3 design guidance for drag-and-drop interactions on Android — drag affordances, drag-state visual feedback, valid drop-target signaling, cross-app drops on large screens and ChromeOS, list reordering, and accessible alternatives to dragging. Use when designing or critiquing a drag-and-drop interaction, deciding what should be draggable, evaluating drag previews or drop-zone feedback, planning large-screen or multi-window drag behavior, or specifying non-drag fallbacks for accessibility.
---

## When to use

Use this skill when designing or reviewing any interaction where a user picks up content and deposits it elsewhere — reordering list items, moving cards between columns, dragging a file into a compose field, or transferring data from one app window to another. It applies equally to intra-screen reordering on a compact phone and to cross-app multi-window drags on a tablet or ChromeOS window. This is a design-judgment skill: it produces recommendations and do/don't critique, not Kotlin or Compose code. Hand implementation details to the drag-and-drop code skill.

## Core guidance

- **Treat drag as a shortcut, never the only path.** Every action accessible via drag must also be reachable through a menu command, a button press, or copy-and-paste. Drag-and-drop is a power-user accelerator; it should not be the sole mechanism for reordering, moving, or transferring content. Users who rely on switch access, TalkBack, or keyboard navigation must never find themselves blocked by the absence of drag.

- **Signal draggability before the gesture begins.** An element that can be dragged must visually communicate that affordance in its resting state. For list items, a dedicated drag handle icon (the standard vertical-dots or grip-lines icon drawn in `onSurface` at medium emphasis) anchored to one side of the row is the clearest and most universally understood signal. For cards and freely placed objects, a subtle elevation difference or a drag-cursor change on pointer devices communicates draggability without adding a visible handle. Do not rely on a long-press alone as the only affordance hint — it is invisible to first-time users.

- **Lift the item into the dragged state using the M3 dragged interaction layer.** When a drag begins, the element should visibly separate from the surface: apply the M3 dragged-state overlay (16% tonal color on top of the element's surface) and increase the element's tonal elevation so the tint intensifies, making it appear to float above the resting layer. This elevation shift is the primary spatial signal that content is in motion. Without it, the drag preview looks flat and indistinguishable from the original in-place element, causing spatial confusion.

- **The drag shadow should faithfully represent the content being moved.** The drag preview (the image that travels with the pointer or finger) should show a legible, correctly scaled version of the item — not a blank rectangle or a generic icon. If multiple items are selected for a single drag, badge the stack with a count indicator so the user knows they are moving more than one piece of content. A preview that does not represent what is moving breaks trust and causes hesitation at the drop moment.

- **Keep the original position visually present during drag.** Show a placeholder or a ghost at the item's source position while it is being dragged. The placeholder communicates that the item has not been deleted, reduces spatial disorientation, and gives the user a clear reference for cancelling and returning the item to its origin. The placeholder should be visually muted — a low-opacity version of the item's outline or a simple row-height blank in the list — not an identical copy that competes with the drag preview.

- **Highlight drop targets in context, not all at once.** Valid drop destinations should only reveal their acceptance state when the drag payload enters or hovers over them. Lighting up every possible target at the start of the drag overwhelms the user with information and adds visual noise across the entire screen. When the drag payload enters a valid target, show a clear but contained signal: a tonal fill on the drop zone surface, an animated insertion-point line between list items, or a bordered highlight on a receiving card. Remove the highlight immediately when the payload exits.

- **Communicate the drop outcome before the user releases.** The drop target feedback should disambiguate the action that will occur: whether the item will move or copy, where it will land in a list, and whether the destination accepts this specific content type. For reordering lists, animate a gap between items that shifts as the drag position moves, showing exactly where the item will be inserted. For copy-versus-move distinctions (common in cross-app drag), use a badge on the drag preview or a label near the drop target. If a destination cannot accept the payload, show a clear rejection state — a dim overlay or a "not allowed" indicator — rather than failing silently after release.

- **Confirm the drop with a brief, purposeful animation.** After the user releases the item on a valid target, animate the item settling into its new position rather than snapping it there instantly. Use M3 standard easing (emphasized decelerate curve) for the landing so the motion reads as intentional placement. A very brief haptic confirmation (if the platform allows) reinforces the moment. For list reordering, the list items that moved to accommodate the drop should animate into their new positions simultaneously using the same easing. This choreography makes the outcome legible and satisfying.

- **Animate a clear cancellation when the drop is invalid.** If the user releases the item over a non-accepting area, animate the item returning to its original position using M3 standard easing (emphasized decelerate back to origin). The cancellation must feel deliberate — not a crash or disappearance. The animation should be fast (under 300 ms) and unambiguous so the user understands their action was safely reversed.

- **Design list reordering with drag handles on one side, drag activation on long press.** In a vertically scrollable list, a visible drag handle anchored to the leading or trailing edge prevents conflicts with other gestures — scroll, swipe-to-dismiss, tap-to-select. Long-press anywhere on the row is acceptable as an additional activation method, but the handle should always be present for discoverability. The handle should meet the 48 × 48 dp minimum touch target requirement even if the visual icon is smaller.

- **On large screens and ChromeOS, design for cross-app and cross-window drag.** When the user drags from one app window to another, the dragged item crosses a system-managed boundary. The drag preview continues to travel with the pointer across window boundaries — the design must ensure the preview is legible and correctly scaled at any point on the screen, not only within the source window. Receiving drop targets in the destination app should highlight with the same in-context feedback used for intra-app drops, without knowing in advance what the source looks like.

- **Accept common data types gracefully as a drop target, and offer common types as a source.** Cross-app drag works through typed payloads: plain text, image URIs, and structured MIME-typed data. A design that only works with the app's own data type will reject valid drops from the system Files app, a browser, or a productivity suite. Define which external types the app accepts — at minimum plain text and image — and design appropriate empty states and confirmation feedback for each accepted type.

- **Provide an accessible non-drag alternative for every drag-enabled action.** For list reordering, expose move-up / move-down actions through a context menu or a dedicated edit mode. For cross-screen transfers, expose cut / copy / paste or a share sheet. For drop targets, ensure keyboard focus can navigate to the target and activate a paste or drop command. Name the drag source and drop target semantically so TalkBack users know what is being moved and where it can go. These alternatives should be first-class paths, not afterthoughts.

## Platform notes

**Compact phones (touch-only):** Drag-and-drop is genuinely useful for in-app reordering and targeted transfers (dragging an image into a compose field), but users discover it only through explicit handles or onboarding. Prioritize the drag-handle affordance and provide a visible non-drag fallback (edit mode, context menu) for all reordering. Cross-app drag to another app window is not meaningful on compact phones because there is no multi-window surface.

**Large screens, foldables, and ChromeOS (expanded width):** Cross-app and cross-window drag-and-drop is a headline interaction and a key large-screen quality signal. In split-screen or free-form windowed mode, users routinely drag images from a gallery app into a document editor, text from a browser into a note-taking app, or files between the system Files app and the current app. Designing for this means specifying generous, clearly bounded drop targets (not just subtle container outlines), drag previews that remain clear at arm's reach on a tablet, and explicit rejection states when the content type cannot be accepted. The drag preview travels across the window boundary — design it to be self-contained and legible without the source app's surrounding context.

**Foldables in book posture:** The hinge creates a physical boundary between left and right half-panels. Dragging content across the hinge to the opposite panel is a powerful and natural gesture on a half-open foldable. Design the receiving pane with a clearly highlighted drop zone on its outer half (away from the hinge) and ensure the drag preview does not disappear into the hinge crease. Keep interactive drop targets at least 8 dp from the hinge line on either side.

**Pointer (mouse / trackpad) users on ChromeOS and tablets:** Hover state on draggable items and drop targets is required. A drag handle icon should appear on hover (if not always visible) and the cursor should change to a grab cursor when hovering over a draggable region. Drag initiates on a simple click-hold-drag rather than requiring a long press. Drop target highlighting should update continuously as the pointer moves, since pointer precision is higher than touch and users will notice lag or jumpy highlights.

**Accessibility:** TalkBack exposes drag sources and drop targets through accessibility actions. The design must ensure every draggable element has a semantic label and at least one alternative action exposed as an accessibility action (Move up, Move down, Move to, or similar). Drop targets must be reachable by keyboard focus and activatable by Enter or Space. Do not expose drag handles as the only focusable element on a list row — the row itself should be focusable and its label should communicate both its content and its draggable status.

## Pitfalls

- **Making drag the only path.** Omitting a menu, button, or edit-mode alternative locks out users who cannot or do not discover the drag gesture, including users with motor impairments and all TalkBack users.

- **No visible affordance in the resting state.** An item with no drag handle and no visible cue for draggability is invisible to first-time users. Long-press-only activation is especially problematic on ChromeOS where long-press is rare and unexpected.

- **A drag preview that does not represent the content.** A generic placeholder, blank rectangle, or icon-only preview disconnects the drag from the item being moved, causing users to hesitate before releasing.

- **Hiding the source location during drag.** Removing the item from its origin without a placeholder makes the drag feel destructive mid-gesture. Users who started an accidental drag have no reference point for cancelling.

- **Lighting up all possible targets at the start of the drag.** Pre-highlighting every drop zone before the payload reaches any of them turns the screen into a visual distraction and removes the contextual discovery that makes drag-and-drop feel natural.

- **Silent failure on invalid drops.** Dropping on a non-accepting target with no feedback — no animation back to origin, no error state, no indication that the drop was rejected — leaves the user uncertain whether the item was lost, moved somewhere unexpected, or simply not handled.

- **Ignoring cross-app drops on large screens.** On tablets and ChromeOS, users expect to drag common content types (images, text, files) between apps. A receiving app that ignores all incoming drag events, or that only accepts its own payload type, fails a large-screen quality expectation and frustrates users who rely on cross-app productivity flows.

- **Drop targets that are too small or too close together.** On a touch screen a drop zone must be large enough to hit with a finger that is simultaneously steadying a drag gesture. On a pointer device, targets can be smaller, but insertion-point lines between list items must be tall enough to be reliably selectable. A minimum 48 dp height for any distinct drop zone is a safe baseline on touch.

- **Skipping the settling animation on successful drop.** Snapping an item instantly to its new position after release — especially in a reordering list — is visually jarring and makes it hard to trace where the item landed. Even a 200 ms eased placement animation is sufficient to orient the user.

- **Drag handles that do not meet the 48 × 48 dp touch target minimum.** A small grip icon rendered at 16 × 16 dp is invisible at a glance and nearly impossible to tap reliably. The invisible tappable area around the icon must still be 48 × 48 dp.

- **No accessible alternative for reordering.** A list that can only be reordered by drag provides no path for TalkBack users, keyboard users, or users with motor impairments. An edit mode with up/down buttons, or accessibility actions exposed on each row, is required alongside the drag interaction.

## References

- **Documentation:** [Drag and drop in Jetpack Compose](https://developer.android.com/develop/ui/compose/touch-input/user-interactions/drag-and-drop)
- **Material 3 Guidelines:** [Interaction States Overview](https://m3.material.io/foundations/interaction/states/overview)
- **Material 3 Guidelines:** [Motion — Easing and duration](https://m3.material.io/styles/motion/easing-and-duration/applying-easing-and-duration)
- **Material 3 Guidelines:** [Accessibility — Touch targets](https://m3.material.io/foundations/overview)

## See also

The m3-interaction-states design skill covers the dragged-state interaction layer (16% tonal overlay) and elevation shift that give a dragged element its lifted appearance, and is the essential companion for specifying correct drag feedback. The m3-large-screens design skill addresses the multi-window and pointer affordances on expanded-width devices that make cross-app drag-and-drop a priority interaction. The m3-accessibility design skill covers TalkBack drag sources, accessibility actions as drag alternatives, and focus-traversal requirements for drop targets. The m3-motion design skill provides the easing curves and duration guidance for drag-initiation lift, drop-settlement, and cancellation-return animations. For implementation in Jetpack Compose — including `Modifier.dragAndDropSource`, `Modifier.dragAndDropTarget`, `DragAndDropTransferData`, MIME-type filtering, and `drawDragDecoration` — hand off to the drag-and-drop code skill.
