---
name: m3-snackbar
description: Design critique and recommendations for Material 3 Snackbars on Android. Use when reviewing or designing brief transient feedback messages, deciding whether a snackbar is the right feedback pattern at all, choosing action label copy, timing duration, handling placement relative to a floating action button, and knowing when a dialog, banner, or inline message is a better fit. Produces UX guidance, not code.
---

## When to use

Use this skill when evaluating or designing a snackbar — the brief, transient feedback strip that appears at the bottom of the screen to confirm an action, surface a low-priority error, or offer a single reversible action. Reach for it during design review to decide whether a snackbar is warranted, how to write compact message copy, whether an action label is needed, and whether the snackbar conflicts with other surface elements such as a floating action button (FAB). This is a design-judgment skill: it gives recommendations and do/don't critique, not Compose implementation code. The relevant Compose composable is `Snackbar` (and the `SnackbarHost` plus `SnackbarHostState` coordination layer); hand the build to the code skill.

## Core guidance

- **Reserve snackbars for low-priority, informational feedback.** A snackbar confirms something just happened ("Message sent", "Item deleted") or flags a recoverable error. It does not block the UI and disappears on its own — so never use it for critical errors, required confirmations, or anything the user must act on. If ignoring the message causes data loss or a broken flow, escalate to a dialog or inline error.
- **Show one snackbar at a time.** Only one snackbar can appear at a time; new messages queue behind the current one or replace it. Design the overall feedback strategy so snackbars don't pile up. If multiple concurrent messages are possible, reconsider whether a persistent component (a banner or inline message) better handles the situation.
- **Keep the message to one or two lines.** Snackbar copy should be the shortest phrase that conveys the outcome. Aim for a single line; two lines are acceptable when the second line adds essential context. Anything longer suggests the feedback is too complex for a transient component — move it to a dialog or a dedicated status area.
- **Limit the action to one clear verb.** If a snackbar includes an action (for example "Undo" after deleting an item), it should be a single, short, affirmative verb. Never use two actions, and never duplicate the action in the message body. Reserve the action for genuinely useful quick operations — undo/redo, retry, or a shortcut to a related destination.
- **Do not pair a dismiss action with an already auto-dismissing snackbar.** Providing a "Dismiss" or "X" button on a snackbar that already vanishes on its own is redundant and wastes the single action slot. Use a dismiss control only if the content is long or the timing is extended and users genuinely need a manual exit.
- **Tune duration to content length and action.** Use the standard short duration for simple confirmations without actions. When a snackbar includes an action, use the longer duration to give users time to respond before it disappears. Never auto-dismiss a snackbar so quickly that users reading slowly miss the action.
- **Place the snackbar above the FAB.** When a floating action button is present, the snackbar must appear above it — overlapping the FAB is a hard layout violation in M3. In Compose, `SnackbarHost` inside a `Scaffold` handles this automatically; verify the relationship if the FAB position is customized or the Scaffold layout is non-standard.
- **Anchor to the correct edge on large screens.** On compact phones, the snackbar spans the full width at the bottom. On expanded-width screens (tablets, foldables in unfolded state), align the snackbar to the leading or center edge rather than stretching it across the full wide viewport, which looks awkward. Material 3 guidelines recommend left-aligned or centered placement at the bottom on large screens.
- **Never use a snackbar for marketing, upsells, or prompts.** Snackbars communicate outcomes of user actions or system events; they are not a channel for feature tips, promotional messages, or rating prompts. Misusing the pattern trains users to dismiss snackbars reflexively.
- **Ensure sufficient contrast and accessible copy.** Snackbar surfaces use the `inverseSurface` token by default in M3, creating high contrast against most backgrounds. Do not override the color in a way that reduces contrast below 4.5:1. Message text should be legible at default font sizes; do not truncate critical words.

## Platform notes

- **Compact phones (default):** The snackbar spans the full screen width at the bottom, floating above the navigation bar and FAB if present. This is the primary design target — get placement, timing, and copy right here first.
- **Large screens and foldables (expanded width):** A full-width snackbar on a 12-inch tablet looks detached and hard to read. Shift to a narrower, left-anchored or centered snackbar. If the app uses a navigation drawer or rail on the side, the snackbar should still anchor to the content area's bottom, not the full screen width including the nav rail.
- **Foldables in folded state:** Treat as compact phone. When unfolded, apply large-screen guidance.
- **Wear OS:** Snackbars are not a Wear OS pattern. The small round screen and glanceable interaction model call for confirmation dialogs or chip-based actions instead.
- **Android TV:** Snackbars do not fit the lean-back TV context. Use an overlay notification or a dedicated message component that respects D-pad navigation and large-screen readability distances.

## Pitfalls

- Using a snackbar for errors that require a mandatory user decision, such as a lost network connection that blocks the entire workflow — that is a dialog or a persistent banner.
- Stacking multiple snackbars in rapid succession after bulk operations (for example, deleting five items one by one). Batch the feedback into one message ("5 items deleted") or switch to an inline status indicator.
- Writing vague copy ("Done", "Success") that gives no meaningful confirmation of what actually happened.
- Providing two action buttons — M3 snackbars support exactly one action.
- Overlapping the FAB by placing the `SnackbarHost` outside the `Scaffold` or by positioning the FAB manually without accounting for snackbar height.
- Using a very short duration for a snackbar that contains an action — users on slow readers or with motor impairments will miss the window to tap.
- Stretching the snackbar to full width on large screens, creating awkward wide bars that feel disconnected from the content.
- Using the snackbar as a substitute for proper inline validation on forms — transient feedback disappears and cannot be referenced after dismissal.

## References

- **Material 3 Guidelines:** [Snackbar overview](https://m3.material.io/components/snackbar/overview)
- **Documentation:** [Snackbar — Jetpack Compose](https://developer.android.com/develop/ui/compose/components/snackbar)

## See also

- The Jetpack Compose code skill for snackbars implements `Snackbar`, `SnackbarHost`, and `SnackbarHostState` inside a `Scaffold`, including coroutine-based show/dismiss coordination.
- Consider the `m3-dialog` design skill when feedback requires a mandatory user response or contains more than a short phrase.
- Consider a banner or inline message pattern when feedback must persist until the user explicitly resolves it, or when it pertains to a specific section of the screen rather than a global action.
- The `m3-fab` design skill is closely related — FAB placement and snackbar placement must be coordinated; a FAB without snackbar awareness is a common layout violation.
- The `m3-progress-indicators` design skill covers loading and async feedback patterns that often sit alongside or replace snackbars for in-progress states.
