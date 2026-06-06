# m3-buttons — design scenarios

## Scenario 1: Checkout confirmation flow

**Context:** A three-step checkout screen on a compact phone. Step 3 shows an order summary with a "Place order" CTA and a "Back" link.

**Good design:** A single `Button` (filled) labeled "Place order" spans full width at the bottom, pinned above the navigation bar inset. A `TextButton` labeled "Back" sits above it or in the top-left toolbar area. The hierarchy is unambiguous — the filled button communicates "this is the irreversible, primary action," and the text button recedes appropriately. The label uses sentence case per M3 convention.

**Why it works:** One primary action per zone, emphasis gap between filled and text is large, full-width treatment signals "next step" in a focused task flow, and the spatial separation (bottom vs. toolbar) means the two buttons do not compete visually.

**Anti-pattern:** A filled "Place order" button paired with a `FilledTonalButton` "Edit cart" placed directly beside it at the same height. Now both buttons carry significant visual weight and users must read both labels to determine which is the recommended action. The medium emphasis of filled tonal inappropriately elevates a utility action into competition with the primary CTA.

---

## Scenario 2: Document editing toolbar on a tablet

**Context:** A two-pane document editor in landscape on a large-screen device. The trailing pane is a formatting sidebar with "Apply style" and "Reset to default" as actions.

**Good design:** "Apply style" is a `FilledTonalButton` (medium emphasis, since applying is the positive forward action but not the screen's singular purpose — the document content is). "Reset to default" is an `OutlinedButton` (structured but clearly secondary). Both buttons are constrained to the width of the sidebar pane (not stretched full tablet width), arranged side by side with 8 dp spacing. Leading icons (a checkmark for Apply, a refresh symbol for Reset) are used because the actions are short and the icon aids quick scanning in a dense toolbar.

**Why it works:** Neither button reaches for filled weight (the main editing area owns that), the pair uses two adjacent emphasis levels with a clear directionality, the icon-plus-label pattern speeds recognition, and the constrained width keeps both buttons spatially grounded in the sidebar pane.

**Anti-pattern:** Both buttons rendered as `TextButton` to keep the sidebar "light." Text buttons without container boundaries disappear in a content-dense sidebar — users have difficulty identifying them as interactive. The lack of a container also makes the minimum-touch-target contract harder to honor visually.

---

## Scenario 3: Destructive confirmation dialog

**Context:** A dialog asking the user to confirm deleting a saved project.

**Good design:** The dialog presents the destructive action "Delete" as a `TextButton` styled with the M3 error color role (no filled container), and "Cancel" as a `TextButton` with default (non-error) styling. The error tint draws attention to the risk without giving the destructive action a dominant filled container that implies it is recommended. "Cancel" is positioned on the left (or first in reading order) so the safe action is encountered first.

**Why it works:** Dialogs in M3 conventionally use text buttons for both actions to keep the dialog lightweight and non-alarming. The error color alone signals risk; a filled "Delete" button would over-index on prominence for an action the system should not appear to recommend. The Cancel-first ordering matches the M3 dialog pattern and helps users who tap reflexively.

**Anti-pattern:** A filled button with an error container color for "Delete" and a text button for "Cancel." While technically creating emphasis hierarchy, a filled destructive button feels alarmingly assertive — it implies the system endorses the deletion. M3 guidelines specifically call for text buttons inside dialogs; a filled button breaks that convention and amplifies anxiety rather than informing the decision.
