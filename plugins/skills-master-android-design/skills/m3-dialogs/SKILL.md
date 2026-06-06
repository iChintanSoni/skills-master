---
name: m3-dialogs
description: "Design critique and recommendations for Material 3 dialogs on Android: basic dialogs, full-screen dialogs, when a modal interruption is justified, confirm/dismiss action order and labeling, destructive confirmations, focus and accessibility, and when to choose a bottom sheet or inline message instead. Use when reviewing or designing any dialog, confirmation prompt, or interruption flow in a Compose-first Android app and you need M3-grounded design judgment rather than implementation code."
---

## When to use

Reach for this skill when critiquing or designing a modal interruption on Android — the moment an app halts the user's flow to request a decision or acknowledgment. Use it to judge whether a dialog is warranted at all, choose between a basic dialog and a full-screen dialog, order and label the action buttons correctly, handle destructive confirmations safely, and recognize when a bottom sheet, snackbar, or inline message would serve the user better.

This is a design-judgment skill. It names the relevant Jetpack Compose Material 3 composables — `AlertDialog`, `BasicAlertDialog`, and the full-screen dialog pattern — in prose and hands implementation to the appropriate code skill.

## Core guidance

### Justifying the interruption

- **Reserve dialogs for decisions that cannot wait and cannot be undone.** A dialog is a hard stop: it blocks everything behind it until the user responds. Earn that cost. Appropriate uses include confirming an irreversible destructive action, surfacing a permission rationale before a system prompt, or requesting a required input before a flow can proceed. Do not use a dialog for informational toasts, tips, marketing, or any message the user can safely ignore.
- **Default to inline feedback before reaching for a dialog.** If the consequence is reversible (undo is available) or the information is non-blocking, a Snackbar, an inline validation message, or a banner communicates it without interrupting the task.
- **Ask once.** If the user has already demonstrated intent — they tapped "Delete" — a confirmation dialog adds a checkpoint. A second confirmation dialog on top of the first is almost never warranted and trains users to dismiss without reading.

### Choosing basic vs full-screen

- **Use a basic dialog (AlertDialog) for short, focused decisions.** A basic dialog contains a title, an optional supporting text region, and one to three action buttons. It suits binary choices (confirm/cancel, yes/no) and brief acknowledgments. Keep the supporting text to two or three sentences; if you need more, you have outgrown a basic dialog.
- **Use a full-screen dialog for substantial, multi-step input.** When the user must fill in a form, compose a message, configure several settings, or perform any action that itself deserves a focused context, a full-screen dialog is appropriate. It presents in the same visual weight as a destination and provides its own top app bar with an explicit close and confirm control. It is not a shortcut for a poorly-planned basic dialog.
- **Resist intermediate sizes as a proxy for one of the two types.** A dialog that is "almost full-screen" or has a scrollable body of dense content usually should be a full-screen dialog or a modal bottom sheet, not a stretched basic dialog.

### Action order, labels, and hierarchy

- **Place the confirming action on the trailing side, dismiss on the leading side.** In M3 button rows, the positive action (the one that proceeds) sits at the trailing end; Cancel or dismiss sits to its left. This matches Android platform convention and the reading direction in LTR locales. Never reverse this order.
- **Use at most two actions in a basic dialog.** A third action is a sign the dialog is carrying too much responsibility. If you genuinely need three choices, evaluate whether the interaction belongs in a bottom sheet with a richer list of options or in a dedicated screen.
- **Write action labels as specific verbs, not generic acknowledgments.** "Delete recording" and "Keep recording" are always clearer than "OK" and "Cancel" because they name the consequence. Avoid "Yes", "No", and "OK" for any choice that has real impact. Reserve "OK" for simple acknowledgments where the dialog conveys a single state and there is nothing to cancel.
- **Establish visual hierarchy between actions.** The confirming action should use a Text button or Filled button at higher prominence; a dismiss/cancel action should use a lower-prominence Text button. Do not give both actions equal visual weight — one of them should be clearly preferred.

### Destructive confirmations

- **Apply the destructive affordance explicitly.** When the confirming action destroys data, the button should carry a visual warning: in M3 this means using the error color role (typically red) on the confirming button label. Do not rely on the label alone to signal danger; color and contrast carry the message before a user reads the text.
- **Always pair a destructive confirm with a clearly labeled cancel.** A destructive dialog with no escape route — or one where "Cancel" is ambiguously labeled — is a design failure. The cancel action must be immediately visible and clearly labeled so a user who opened the dialog by accident can exit safely.
- **Never make the destructive action the default focus target.** Keyboard and assistive technology users step through focusable controls; the first focused action in a destructive dialog should be the safe/cancel path, not the destructive one. This is both an accessibility requirement and a safeguard against accidental confirmation.
- **Keep the consequence in the supporting text.** One sentence explaining what will be lost ("This will permanently delete your 12 saved photos and cannot be undone") converts a reflexive tap into a conscious choice. For low-stakes destructive actions (deleting a single draft with no cloud backup) this may be implicit; for high-stakes or irreversible data loss it is essential.

### Focus and accessibility

- **Set initial focus on the safe action.** When the dialog opens, assistive focus (TalkBack, keyboard) should land on the non-destructive choice. This prevents accidental confirmation for users navigating without a pointer.
- **Announce the dialog semantically.** The composable wrapping the dialog content should surface a role of "dialog" so TalkBack announces it as a new context. M3's `AlertDialog` handles this by default; custom `BasicAlertDialog` implementations must apply the correct `Semantics` modifier.
- **Ensure touch targets meet the 48 dp minimum.** Action buttons in dialogs are often rendered at modest sizes; confirm that the actual tappable area meets the minimum regardless of the visual label size.
- **Do not rely on color alone.** Destructive affordance, disabled state, and other semantic distinctions must be supported by label, iconography, or both — not only by hue.
- **Avoid trapping focus unexpectedly.** A dialog should capture focus while open and release it cleanly when dismissed. Dialogs that leave orphaned focus states confuse screen reader users.

### Choosing an alternative

- **Bottom sheet instead of a dialog when options outnumber two or require scrolling.** Modal bottom sheets (via `ModalBottomSheet` in Compose M3) present lists of options, share targets, or filter controls without the abruptness of a full-screen takeover. They are dismissible by swiping and feel less severe than a dialog.
- **Snackbar instead of a dialog for reversible, low-stakes outcomes.** Confirming a deletion with an "Undo" Snackbar is almost always preferable to a "Are you sure?" dialog that interrupts the flow entirely. Reserve the dialog for situations where undo is not possible.
- **Inline validation instead of a dialog for form errors.** Surface field-level errors next to the offending input rather than collecting them into a dialog at submission. Dialogs for input errors break the edit-fix loop and increase cognitive load.
- **Navigation to a new screen instead of a full-screen dialog for complex tasks.** A full-screen dialog implies the user can cancel without committing changes. If the interaction is substantial enough to deserve its own nav entry, back-stack history, and deep-link support, it should be a proper destination, not a dialog.

## Platform notes

### Compact phones
The default context for both basic and full-screen dialogs. Basic dialogs appear centered with a modal scrim; full-screen dialogs occupy the entire display. The scrim behind a basic dialog should be legible — don't over-darken it such that the user cannot recall the context behind it.

### Large screens and foldables
On tablets and foldables in expanded window configurations, basic dialogs remain center-screen at a fixed maximum width rather than stretching edge-to-edge. Full-screen dialogs similarly cap their width and may appear as a large centered card over a scrim. Avoid designing dialogs at full phone width and expecting them to stretch — M3 defines intrinsic maximum widths for dialogs in the expanded breakpoint. Also reconsider whether a full-screen dialog is warranted on a large screen: a side panel or a dedicated pane in a two-pane layout may be less disruptive.

### Wear OS
Dialog-equivalent interactions on Wear are constrained to very short prompts and one or two large touch targets. Long supporting text and multi-step forms are inappropriate on the wrist. Prefer system confirmation dialogs and keep labels to single words.

## Pitfalls

- Opening a dialog for an informational message the user cannot act on (use a Snackbar or banner instead).
- Placing the destructive/confirming action on the leading side and Cancel on the trailing side (violates Android convention).
- Using "OK" and "Cancel" for a choice that has meaningful, irreversible consequences.
- Showing three or more actions in a basic dialog instead of redesigning the interaction.
- Making the destructive action the initial focus target, exposing users to accidental confirmation via keyboard or TalkBack.
- Stretching a basic dialog to hold long-form content that belongs in a full-screen dialog or a separate screen.
- Nesting one dialog inside another — if a confirmation of a confirmation is needed, the root design has a flaw.
- Forgetting to announce the dialog role in a custom `BasicAlertDialog` implementation, leaving TalkBack users without context.
- Relying solely on color for the destructive affordance without supporting it with a clear label.

## References

- **Material 3 Guidelines:** [Dialogs overview](https://m3.material.io/components/dialogs/overview)
- **Documentation:** [Dialogs in Jetpack Compose](https://developer.android.com/develop/ui/compose/components/dialog)
- **Material 3 Guidelines:** [Bottom sheets](https://m3.material.io/components/bottom-sheets/overview)
- **Material 3 Guidelines:** [Snackbar](https://m3.material.io/components/snackbar/overview)

## See also

The Compose M3 dialogs code skill covers implementing `AlertDialog`, `BasicAlertDialog`, and full-screen dialogs in Jetpack Compose, including button roles, `DialogProperties`, and focus management. For decisions about whether to go modal at all and how bottom sheets compare, see the m3-bottom-sheets design skill. For writing clear, action-oriented button labels, the m3-writing design skill applies. For touch target sizing and TalkBack semantics in Compose, see the compose-accessibility code skill.
