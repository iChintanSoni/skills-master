## Feedback surface selection
- [ ] The feedback mechanism matches the consequence weight: snackbar for transient confirmations, inline message for field-level errors, banner for persistent system conditions, dialog only for decisions or acknowledgments that cannot be deferred.
- [ ] No system Toast is used for in-app feedback; `Snackbar` / `SnackbarHost` is the delivery channel instead.
- [ ] Only one snackbar is displayed at a time; additional messages are queued, not stacked.
- [ ] Banners include at most two actions and are dismissible by the user.
- [ ] A dialog has been evaluated against snackbar-with-undo, banner, and inline message alternatives before being chosen.

## Confirmation and undo
- [ ] Reversible actions (move to trash, archive, clear) execute immediately and offer a timed "Undo" snackbar rather than a pre-action confirmation dialog.
- [ ] The snackbar message is written in past tense ("3 items moved to Trash") to confirm what happened, not future tense.
- [ ] The undo window is at least 4 seconds; larger or more consequential reversals use up to 10 seconds.
- [ ] The "Undo" label is brief and specific; no redundant qualifiers are added when the message body already states the action.
- [ ] Irreversible, high-stakes actions (permanent deletion, payment confirmation) use a confirmation dialog with the confirming action on the trailing side, labeled with a specific verb, and styled with the error color role if destructive.
- [ ] No "confirm within a confirm" pattern exists (two sequential dialogs for the same action).

## Empty states
- [ ] Every empty state has been intentionally designed — it is not a blank screen or an absent component.
- [ ] Empty states distinguish between "nothing yet" (onboarding context) and "nothing found" (zero-result context) with different copy and CTAs.
- [ ] The empty state does not appear while data is still loading; it only renders after the request returns with zero content.
- [ ] A single, clearly primary action button is present and labels the specific thing the user should do next.
- [ ] Secondary options (if any) have reduced visual prominence relative to the primary CTA.

## Loading states
- [ ] Skeleton screens are used for layouts with known content structure; spinners are used for unstructured or unpredictable waits.
- [ ] A determinate `LinearProgressIndicator` or `CircularProgressIndicator` is used whenever a real percentage is available (download, batch upload, multi-step task).
- [ ] Indeterminate indicators are reserved for genuinely unknown-duration waits.
- [ ] A display delay prevents the indicator from flashing for operations that frequently complete in under 300 ms.
- [ ] The full screen is not blocked while only a portion of the content is loading; the rest of the UI remains interactive.
- [ ] Every blocking wait of more than a few seconds includes a visible Cancel action.

## Error states
- [ ] Every error state contains: plain-language explanation of what went wrong, whether the user can act on it, and a clear next step.
- [ ] Network errors, permission errors, and content errors are designed separately with distinct copy and CTAs.
- [ ] The error color role (error/onError/errorContainer/onErrorContainer) appears exclusively on genuine error states — never on warnings, promotions, or informational messages.
- [ ] Retry buttons are labeled with what they will retry ("Retry upload") and enter a loading state while the retry is in flight.
- [ ] Partial load failures show what succeeded inline and indicate only the failed component — no full-screen error overlay for a partial failure.

## Background work acknowledgment
- [ ] Long-running background tasks confirm start with a non-blocking snackbar and deliver completion via system notification.
- [ ] No persistent foreground progress bar is shown for background tasks the user does not need to supervise.
- [ ] Background task failures are stored and surfaced when the user returns to the relevant screen, not as a mid-flow dialog that interrupts an unrelated foreground task.
- [ ] If a background task may complete while the app is in the background, a system notification is planned for that completion.

## Accessibility and color
- [ ] Error states are communicated by label and/or icon in addition to the error color role — color alone is not the sole indicator.
- [ ] Progress indicators that complete silently announce the change to TalkBack via a live region or semantic update.
- [ ] Loading and error states have meaningful `contentDescription` or semantic labels on their containers so TalkBack users understand the current state.
- [ ] All message text in snackbars, banners, and error states meets color contrast minimums against their respective backgrounds in both light and dark themes.

## Large screen and adaptive behavior
- [ ] Snackbars are width-constrained on expanded breakpoints; they do not stretch edge-to-edge.
- [ ] In two-pane layouts, feedback for the detail pane appears within that pane — not as a global app-level snackbar.
- [ ] Empty states and error screens constrain their content column width (approximately 360–600 dp) rather than expanding to fill the entire window.
