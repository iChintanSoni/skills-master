---
name: m3-feedback
description: "Design critique and guidance for Material 3 feedback and status patterns on Android: choosing among snackbar, dialog, inline message, and banner; designing empty, loading, and error states; confirming actions and offering undo; and acknowledging long-running work without blocking. Use when reviewing or designing any moment where the app must communicate outcome, status, or system state to the user — from a reversible deletion to a multi-minute background export — and you need M3-grounded design judgment rather than implementation code."
---

## When to use

Reach for this skill whenever an Android UI must tell the user something has happened, is happening, or went wrong. It covers the full feedback vocabulary — choosing the right container for a message, deciding how intrusive to be, designing states for empty screens and errors, and deciding how to acknowledge background work without blocking the foreground. This skill produces design judgment and do/don't critique. It names the relevant Jetpack Compose composables — `Snackbar`, `SnackbarHost`, `AlertDialog`, `LinearProgressIndicator`, `CircularProgressIndicator`, `LoadingIndicator` — in prose and hands implementation to the relevant code skills.

Specific contexts where this skill applies:

- Selecting the right feedback surface (snackbar, dialog, inline message, banner, toast equivalent) for a given outcome.
- Designing undo affordances for reversible, low-stakes actions.
- Designing empty states, skeleton loading states, and inline error states.
- Deciding when to block the user with a modal vs. communicate asynchronously.
- Auditing whether long-running background work is surfaced appropriately without hijacking foreground focus.

## Core guidance

### Picking the right feedback surface

- **Match interruption weight to the consequence.** The four main feedback surfaces span a wide range of intrusiveness. Snackbars are ephemeral and non-blocking; inline messages appear within content without interrupting flow; banners persist across an action but do not block; dialogs halt everything. Always start at the least intrusive option that still adequately informs the user.

- **Snackbar: use for transient, non-critical confirmations with an optional action.** The `Snackbar` component is the M3 default for acknowledging actions the user just took — "Message deleted", "Photo saved", "Item added to cart". A snackbar disappears on its own after 4–10 seconds and should contain at most one brief action. It must not be used for errors that require the user to do something before the flow can continue, for persistent system status, or for marketing messages. One snackbar at a time; queue additional messages rather than stacking.

- **Inline message: use for field-level errors and contextual status.** When feedback is directly tied to a specific piece of content — a form field that failed validation, a list item whose sync failed, a card whose image could not load — surface the message inline, adjacent to the element it describes. Inline error text beneath a `TextField` (the M3 `supportingText` slot) is far less disruptive than a dialog and keeps the edit-fix loop tight. Use `errorText` styling (the error color role) only for genuine failures, not for informational notes.

- **Banner: use for persistent, actionable, low-severity alerts.** A banner (an in-app notification strip at the top of the content area, below the top app bar) suits system-level conditions that persist until the user acts — offline mode, an expiring session, a required app update that is not immediately blocking. A banner must offer at most two actions and must be dismissible. If the situation is severe enough that the user cannot use the app without addressing it, escalate to a dialog or a blocking error screen, not a banner.

- **Dialog: use only when a decision or acknowledgment cannot be deferred.** An `AlertDialog` stops the user in their tracks. Reserve it for irreversible actions, required consent, and genuine system conditions the user must resolve before continuing. For anything recoverable or informational, a snackbar, banner, or inline message is almost always more appropriate. See the m3-dialogs design skill for detailed guidance.

- **Never use system Toast as a general feedback mechanism.** Android system Toasts appear outside the app window, cannot carry an action, and are not accessible to TalkBack in consistent ways. All new app feedback should use the in-app `Snackbar` pattern.

### Confirming actions and offering undo

- **Prefer immediate action plus undo over a confirmation dialog for reversible outcomes.** When the user deletes an item, archives a message, or clears a draft that can be recovered, execute the action immediately and offer a time-limited "Undo" action in a snackbar. This removes a modal interruption from every routine use and makes the undo the safety net rather than the checkpoint. The undo window should be long enough to read (at least 4 seconds, up to 10 seconds for consequential reversals).

- **Label the snackbar message with what was done, not what will happen.** Write "Draft deleted" rather than "Deleting draft…". Write "3 items moved to Trash" rather than "Move 3 items to Trash?" The action already happened; the snackbar confirms it and offers recovery. Past tense anchors the user's model correctly.

- **Size the undo action label to the action.** "Undo" is correct for almost all cases; resist adding qualifiers like "Undo delete" which are redundant when the message body already states the action. Keep the label short enough that it does not crowd the message text, especially at small screen widths.

- **Reserve confirmation dialogs for genuinely irreversible, high-stakes actions.** Permanent account deletion, payment confirmation, and overwriting server-side data with no recovery path are the right bar. For anything with a trash folder, version history, or undo stack, the dialog is not earning its interruption cost. See the m3-dialogs skill for destructive-confirm button order, error color usage, and label guidance.

- **Do not ask for confirmation of a confirmation.** If the app already showed a dialog, the user's tap is a deliberate act. A second dialog asking "Are you really sure?" adds friction and habituates users to dismissing dialogs reflexively, including the rare one that matters.

### Designing empty states

- **Treat empty states as purposeful screens, not error conditions.** A list with no items, a search that returned zero results, and a feed with no new content are not failures — they are valid application states that deserve intentional design. An empty state should explain the situation in one brief sentence, optionally illustrate it with a low-key illustration, and offer a clear primary action to resolve the emptiness or continue.

- **Distinguish between "nothing yet" and "nothing found".** A first-launch empty screen ("You have no saved recipes yet — add one to get started") is an onboarding moment. A zero-result search screen ("No results for 'avocado toast'") is a navigation dead end. The tone, illustration, and CTA differ significantly. Design each explicitly.

- **Do not display an empty state while data is still loading.** An empty state that flickers in during the loading phase and disappears when data arrives creates a false signal. Show the loading state first; transition to empty only after the request has completed and definitively returned no content.

- **Keep empty state CTAs actionable and singular.** One primary action button is ideal. Avoid offering multiple equally-weighted options (an "Add item" button, a "Browse suggestions" button, and a "Watch tutorial" button at the same visual prominence) — the user cannot tell where to go first. If there are secondary paths, reduce their visual weight or surface them in a supporting link.

### Loading states and progress communication

- **Use skeleton screens for structured content; use progress indicators for unstructured waits.** When the shape of the incoming content is known — a list of cards, a profile page, a message feed — a skeleton placeholder preserves the user's spatial mental model and signals approximately how long the wait will be. Use a `CircularProgressIndicator` or `LoadingIndicator` (M3 Expressive) only when the content shape is unpredictable or the wait is for a single operation without a content scaffold to represent.

- **Do not block the entire screen while only part of the content is loading.** If the navigation chrome, a side panel, or a list pane is already visible, leave it interactive. Reserve full-screen blocking loads for the first render when nothing at all is available to show.

- **Show a determinate progress indicator whenever a percentage is knowable.** A download, a batch import, a photo upload, a multi-step task with discrete stages — all have a measurable fraction complete. Show a `LinearProgressIndicator` with a real value so the user can gauge whether to wait or come back. Indeterminate indicators are not a safe default for operations that have real progress.

- **Introduce a display delay to suppress flicker on fast operations.** If an operation frequently completes in under 300 ms, a spinner that appears and vanishes before the user can register it is pure noise. Introduce a threshold so the indicator only becomes visible when the wait actually exceeds a perceptible pause. This is especially important at the item level in lists and grids.

- **Pair every long wait with a cancel path.** Any blocking wait of more than a few seconds must include a visible Cancel action. The designer is responsible for planning this alongside the loading state — it is not a backend concern to solve later. A loading spinner with no escape route is a trap.

### Error states

- **Make every error actionable.** A screen that shows "Something went wrong" with no further guidance is worse than useless — it raises anxiety without providing a path forward. Every error state must contain at minimum: what went wrong (in plain language, not an error code), whether the user can do anything about it, and the action to take next ("Try again", "Go back", "Check your connection").

- **Distinguish network errors, permission errors, and content errors.** These have different resolutions and different user emotions. A network error ("No connection — check your Wi-Fi and try again") calls for a retry. A permission error ("Calendar access is required — go to Settings to allow it") calls for a navigation to Settings. A content error ("This item was removed") may call for a back-navigation. Do not conflate them with a single generic error screen.

- **Use the error color role (error/onError/errorContainer/onErrorContainer) consistently and exclusively.** Error-role color should appear on field-level error text, error icons, error banners, and destructive button labels. It must not appear on warnings, promotions, alerts, or any non-error state. Inconsistent use trains users to ignore error-colored UI or, worse, to treat normal UI as a warning.

- **Design the retry interaction, not just the error screen.** When a retry is possible, the button should say what it will retry ("Retry upload", not "Retry") and it should be prominent — at least a `FilledButton` or `OutlinedButton`. After a failed retry, provide feedback that the retry ran (a brief indicator during the attempt) so users know their tap registered.

- **Plan graceful degradation for partial failures.** When part of a screen loads and part fails, show what is available and indicate inline which parts failed. A full-screen error overlay for a side-panel load is disproportionate and hides the content the user did get.

### Acknowledging long-running background work

- **Confirm start and completion, not continuous progress, for background tasks.** When the user kicks off a background export, a large sync, or a background analysis that will run while they continue using the app, confirm that the task has started ("Export started — you'll be notified when it's ready") and notify them on completion via a snackbar or a notification. Do not litter the foreground UI with progress bars for background work the user does not need to supervise.

- **Use system notifications for completions that span sessions.** If a background task may finish while the app is in the background, a system notification is the correct delivery channel for the completion message. An in-app snackbar at re-launch confirming the completed work can supplement but not replace the notification.

- **Reserve in-app progress indication for work the user initiated and is actively waiting on.** A visible `LinearProgressIndicator` in the content area is appropriate when the user is watching an upload complete, monitoring a scan, or waiting for a report to generate — because they chose to stay on that screen. For tasks running behind the scenes, do not pull the user's attention to a progress bar they did not ask to supervise.

- **Surface errors from background tasks at the moment the user returns, not mid-task.** If a background sync fails while the user is on a different screen, store the error and surface it as a non-blocking banner or an inbox-style notification when they return to the relevant screen. Do not interrupt an unrelated foreground task with a mid-flow error dialog about something that happened in the background.

## Platform notes

**Compact phones (the default form factor):** Snackbars anchor to the bottom of the screen above the navigation bar; on phones with gesture navigation this means they must clear the gesture zone with appropriate inset. The `SnackbarHost` in Compose M3 handles this with scaffold padding automatically. Inline error text under form fields must remain visible when the software keyboard is open — verify that fields scroll into view rather than hiding behind the keyboard.

**Large screens and foldables:** On expanded layouts, a snackbar should not stretch edge-to-edge; M3 limits its width and anchors it to one side or bottom center. Empty states and full-screen error screens should constrain their content to a readable column width (typically 360–600 dp) rather than expanding to fill the entire pane. In two-pane layouts, feedback for the detail pane should appear within that pane — not as an app-level snackbar that implies a global problem.

**Wear OS:** Feedback on the wrist is extremely constrained. Snackbars do not exist on Wear in the phone sense; outcomes are communicated via haptic feedback, brief dismissible cards, or system confirmations. Error states must be extremely terse — single sentence, single action. Long-running work must never block the watch face; completion feedback belongs on the phone.

**Android TV:** Error states and empty states must be legible from three meters. Use large type scale (`headlineSmall` or above), minimal text, and a single large-touch-target action. Progress indicators must be sufficiently thick to read across the room. Snackbar-equivalent messages on TV should appear as overlay cards with a generous display duration, since remote-control users cannot glance and respond as quickly.

## Pitfalls

- Using a confirmation dialog for reversible actions (delete to trash, archive, move) when a snackbar with Undo would eliminate the interruption entirely.
- Using "OK" and "Cancel" as dialog action labels for choices with real consequences, instead of specific verbs like "Delete" and "Keep".
- Showing a full-screen error overlay for a partial load failure that only affected one component, hiding content that is available.
- Using the error color role for warnings, promotions, or non-error status indicators, eroding the semantic signal.
- Displaying an empty state while data is still in flight, creating a false "no results" impression before the response arrives.
- Using indeterminate progress for a download or conversion that has a real measurable percentage.
- Showing a snackbar for an error that requires immediate user action — if they miss the snackbar's auto-dismiss window, the error silently disappears.
- Stacking multiple snackbars simultaneously instead of queuing them, causing them to overlap or fight for space.
- Providing no cancel or timeout mechanism for blocking waits longer than a few seconds.
- Surfacing background-task errors via a modal dialog that interrupts an unrelated foreground task.
- Flashing a loading indicator for sub-300 ms operations, making the app feel jittery and unpredictable.
- Writing error messages with technical language or error codes rather than plain-language explanations and actionable next steps.

## References

- **Material 3 Guidelines:** [Snackbar overview](https://m3.material.io/components/snackbar/overview)
- **Material 3 Guidelines:** [Progress indicators overview](https://m3.material.io/components/progress-indicators/overview)
- **Material 3 Guidelines:** [Dialogs overview](https://m3.material.io/components/dialogs/overview)
- **Material 3 Guidelines:** [Empty states](https://m3.material.io/components/dialogs/overview)
- **Material 3 Guidelines:** [Communication patterns](https://developer.android.com/design/ui/mobile)

## See also

The m3-dialogs design skill goes deep on confirmation patterns, destructive action design, dialog type selection, and action button order. The m3-progress-indicators design skill covers the choice between linear and circular indicators, determinate vs. indeterminate, and the M3 Expressive `LoadingIndicator`. The m3-loading-indicator design skill addresses the Expressive loading indicator in detail. For color role usage — particularly the error/onError/errorContainer set — see the m3-color design skill.

On the implementation side, the Compose M3 components code skill covers `Snackbar`, `SnackbarHost`, `SnackbarHostState`, `LinearProgressIndicator`, `CircularProgressIndicator`, and `LoadingIndicator`, including state hoisting, queue management, and accessibility semantics. For form field error text using `TextField`'s `isError` and `supportingText` parameters, see the compose-forms-controls code skill.
