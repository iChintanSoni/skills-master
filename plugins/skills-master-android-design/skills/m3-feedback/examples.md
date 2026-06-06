## Scenario 1: Bulk deletion in a notes app

A user long-presses several notes in a list view, selects 12, and taps the trash icon in the contextual action bar. The notes are moved to a recoverable Trash folder with a 30-day retention window.

**Why this is a snackbar-with-undo moment, not a dialog.** The deletion is reversible — the notes land in Trash and can be restored. Interrupting a deliberate, multi-step selection flow with "Are you sure you want to delete 12 notes?" creates friction after the user has already expressed intent twice (long-press, then tap trash). The modal interruption offers no real protection: a user who dismisses reflexively has the same outcome as one who did not see the dialog at all.

**Recommended design.** Execute the deletion immediately. Dismiss the selection mode. Show a snackbar anchored above the navigation bar with the message "12 notes moved to Trash" and a single "Undo" action. Allow 8–10 seconds for undo since this is a larger batch and the user may need a moment to register what was deleted. On undo, restore all 12 notes to their original positions and dismiss the snackbar. No animation flourish is needed on restore — simply returning the items is the confirmation.

The "Trash" destination in the navigation drawer should always be accessible for users who miss the undo window, so that recovery remains possible beyond the snackbar lifetime.

**Anti-pattern.** A designer adds a confirmation dialog: "Delete 12 notes? This will move them to Trash." Users who perform this action regularly will learn to dismiss the dialog without reading it within their first week of use. This habituates them to tapping through dialogs reflexively — including future dialogs that guard genuinely irreversible actions. The undo mechanism, which provides real protection, has been bypassed in favor of a dialog that provides none.

---

## Scenario 2: A network error state in a feed app

A social-style feed app makes a network request on launch. The request fails because the user has no connectivity. The designer must decide how to present the failure.

**Why the error state needs to be actionable, not just informational.** Displaying "No internet connection" in plain text with no affordance leaves the user wondering what to do. They may know to check their connection, but they have no way to tell the app they have fixed it — forcing them to close and reopen. That is unnecessary friction.

**Recommended design.** Replace the skeleton loading state (which should not persist indefinitely on failure) with a centered, full-screen error state within the feed area. The illustration should be minimal and non-dramatic — this is a temporary state, not a catastrophe. The headline should use `titleLarge` and read "Can't connect right now". A single supporting sentence reads "Check your connection and try again." A prominent `FilledButton` labeled "Try again" triggers a fresh network request. While the retry is in flight, the button enters a loading state (a brief inline `CircularProgressIndicator` replacing the label, or the button becoming disabled) so the user knows their tap registered. If the retry succeeds, the feed loads normally. If it fails again, the error state returns — do not silently swallow a second failure.

The navigation bar and top app bar remain visible and interactive during the error state so the user can navigate to other sections that may not require network access (for example, a local "Saved" section).

**Anti-pattern.** A dialog pops up over the empty feed reading "Network error. Please check your internet connection and retry." with a single "OK" button. The user taps OK, the dialog dismisses, and they are left on an empty feed with no path to retry except closing and reopening the app. The dialog blocked the UI momentarily, announced bad news, provided no resolution path, and disappeared — leaving the user worse off than a well-designed inline error state would have.

---

## Scenario 3: Acknowledging a long-running PDF export

A document app lets users export a multi-chapter document as a PDF. The export takes 15–40 seconds depending on document length and runs in the background so the user can continue reading or editing.

**Why continuous foreground progress indication is wrong here.** If the user initiates the export and then navigates away — which the app should support — a persistent progress bar in the top app bar or a pinned snackbar gives them no useful information and clutters every screen they visit during the wait. Worse, if the user leaves the app entirely, an in-app indicator is invisible.

**Recommended design.** When the export is triggered, immediately show a non-blocking snackbar: "Exporting PDF — we'll notify you when it's ready." No progress bar in the foreground; the task runs in a background coroutine. When the export completes (regardless of whether the app is in the foreground), issue a system notification: "PDF ready — tap to share." If the user is in the foreground when it completes, also show a snackbar: "PDF exported successfully" with a "Share" action, so they get immediate feedback without requiring them to navigate to the notification shade.

If the export fails partway through, a system notification delivers the failure: "Export failed — tap to try again." If the user is in the foreground, a snackbar with "Export failed" and a "Retry" action appears. Storing the failure in an in-app status surface (an "Exports" section in the document's overflow menu, for example) ensures the user can retry even if they miss both the notification and the snackbar.

**Anti-pattern.** The app shows a full-screen modal progress overlay for the entire 15–40 second export duration, blocking all navigation and interaction. Users cannot continue reading the document, cannot switch to another document, and cannot use any other part of the app until the export resolves. If the export fails at the 35-second mark, they have lost that time entirely and are presented with a dialog: "Export failed. Try again?" — a frustrating experience that could have been avoided entirely by treating a background-friendly task as background work.
