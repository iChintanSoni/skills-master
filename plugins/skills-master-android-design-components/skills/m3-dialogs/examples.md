## Scenario 1: Confirming an irreversible deletion

A user taps a long-press context menu item labeled "Delete conversation" inside a messaging app. The conversation contains 47 messages and cannot be recovered.

**Why a dialog is correct here.** The action is irreversible, high-stakes, and triggered by a deliberate but quick gesture that could be accidental. The user needs one conscious checkpoint before data is lost permanently.

**Recommended design.** Present an `AlertDialog` with a clear, specific title: "Delete conversation?" and a single supporting sentence: "This will permanently delete 47 messages. You won't be able to recover them." Two actions: a Text button labeled "Cancel" on the leading side, and a filled button labeled "Delete conversation" on the trailing side using the error color role (red) to signal danger. Initial focus lands on "Cancel" so keyboard and TalkBack users arrive at the safe choice first.

**Anti-pattern.** Titling the dialog "Are you sure?" with buttons labeled "Yes" and "No" forces the user to re-read both the title and the buttons to understand what "Yes" means. Placing "Delete" on the leading side and "Cancel" on the trailing side violates Android convention and increases accidental deletion.

---

## Scenario 2: Multi-field event creation squeezed into a basic dialog

A calendar app wants users to create a new event. A designer proposes a basic `AlertDialog` containing a title field, start/end time pickers, a notes field, and a color picker.

**Why this is wrong.** A basic dialog is for short, focused decisions — not for a multi-input form. Five interactive controls crammed into a dialog produce a cluttered, hard-to-scroll surface, often with broken keyboard navigation and poor large-font behavior. The user cannot navigate away, save a draft, or use the back gesture naturally.

**Recommended design.** Route this to a full-screen dialog (a Compose scaffold with a top app bar, a close icon on the leading end, and a "Save" action on the trailing end). This gives the form the space it needs, handles the back gesture correctly (prompting "Discard changes?" if there is unsaved input), and signals to the user that this is a focused task context, not a quick confirmation.

**Anti-pattern.** Stretching the `AlertDialog` to 90% screen height with a scrollable `Column` inside it — this approximates a full-screen dialog without the top app bar, back-gesture handling, or semantic structure that makes full-screen dialogs work correctly.

---

## Scenario 3: Confirming a reversible bulk action

A file manager lets users select multiple files and tap "Move to Trash." The files will move to a system trash folder and can be recovered for 30 days.

**Why a dialog is not the right tool.** The action is reversible: items land in Trash and can be restored. A modal interruption asking "Move 8 files to Trash?" before every trash operation adds friction without meaningfully protecting the user.

**Recommended design.** Execute the action immediately and show a Snackbar with the message "8 files moved to Trash" and a single "Undo" action. The Snackbar is non-blocking, disappears on its own, and still gives the user a recovery path for several seconds. This matches the M3 snackbar pattern for recoverable actions and avoids dialog fatigue.

**Anti-pattern.** Showing a confirmation dialog for every move-to-trash that says "Are you sure? This will move 8 files." Users learn to dismiss it reflexively after the second tap, which defeats the purpose entirely and conditions them to dismiss the rare dialog that actually matters.
