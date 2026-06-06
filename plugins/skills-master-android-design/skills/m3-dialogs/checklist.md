## M3 Dialogs Design Review

### Justification
- [ ] The dialog surfaces a decision or acknowledgment the user cannot reasonably defer or ignore inline.
- [ ] The underlying action is either irreversible or requires explicit user consent before proceeding.
- [ ] A Snackbar with Undo, an inline message, or a banner has been considered and ruled out as insufficient.
- [ ] The flow does not show two dialogs in sequence (confirm on confirm) — if so, the root design needs revision.

### Type selection
- [ ] A basic dialog is used only for short, focused decisions with minimal supporting text (two to three sentences maximum).
- [ ] A full-screen dialog is used when the user must complete a form, configure multiple settings, or perform a substantial input task.
- [ ] The dialog is not a stretched basic dialog serving as a proxy for a full-screen dialog or a destination screen.
- [ ] A bottom sheet has been considered for cases with more than two choices or a scrollable option list.

### Action order and labels
- [ ] The confirming/positive action is on the trailing side; Cancel/dismiss is on the leading side.
- [ ] The dialog contains at most two actions; three or more triggers a design review.
- [ ] Action labels are specific verbs naming the outcome ("Delete recording", "Discard draft") rather than "OK", "Yes", or "No" for consequential choices.
- [ ] The confirming action has higher visual prominence than the dismiss action; they do not compete equally.

### Destructive confirmations
- [ ] The destructive confirming button uses the error color role (or equivalent visual warning) in addition to its label.
- [ ] A clearly labeled Cancel action is always present and immediately visible alongside any destructive confirm.
- [ ] The destructive action is never the default focus target on dialog open.
- [ ] Supporting text states the consequence explicitly when the action is irreversible or data loss is significant.

### Focus and accessibility
- [ ] Initial focus (keyboard, TalkBack) lands on the safe/cancel action, not the destructive one.
- [ ] The dialog container announces a dialog role to TalkBack (default for AlertDialog; manual for BasicAlertDialog).
- [ ] All action buttons meet the 48 dp minimum touch target.
- [ ] Destructive affordance is communicated by label and/or icon, not by color alone.
- [ ] Focus is trapped within the dialog while open and released cleanly on dismissal.
- [ ] Supporting text and title have sufficient color contrast against the dialog surface.

### Large screen and adaptive behavior
- [ ] The basic dialog renders at a fixed maximum width on expanded breakpoints, not stretched edge-to-edge.
- [ ] A full-screen dialog on a large screen has been evaluated against a two-pane layout or side panel as a less disruptive alternative.
- [ ] The dialog content does not rely on phone-width assumptions for readability or touch target spacing.

### Content and tone
- [ ] The dialog title is specific and describes the situation or question (not "Are you sure?").
- [ ] Supporting text is present only when the title alone leaves genuine ambiguity.
- [ ] The dialog is not used for a marketing message, tip, or non-critical informational notice.
