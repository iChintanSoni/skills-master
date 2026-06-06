## Scenario 1: Card-to-detail navigation in a content feed

A news app shows a vertical list of article cards. Tapping a card navigates to the full article. The designer chooses a container transform because the card visually contains the article — same headline, same hero image. The card's bounds expand to fill the screen while the hero image and headline carry across seamlessly, establishing that the detail is the same object seen more fully.

**Good design choices:**
The card uses a medium duration container transform with Emphasized easing: fast acceleration away from the list, slow deceleration as it settles into the full-screen reading view. The hero image uses a shared element that maintains its aspect ratio and position during the transform, communicating visual continuity. The body text of the article fades in after the container transform is 60% complete, so the transition has landed before new content appears — a focused, leading choreography choice.

**Anti-pattern:**
The designer instead uses a horizontal slide (shared axis) for this transition because "slide looks modern." The result misleads the user: the card and the detail screen appear to be two different destinations in a sequential flow, not the same object in expanded form. When the user taps back, the reverse slide implies they are moving to a previous step, not collapsing back to the card. After several navigation cycles, users become uncertain whether their back tap will return to the list or to some earlier state in a sequence that does not exist.

---

## Scenario 2: Bottom navigation tab switching

An app has five destinations in a bottom navigation bar: Home, Explore, Library, Create, and Profile. Switching between these destinations uses fade through: the current destination fades out, the screen holds empty for a brief moment (less than 50 ms), then the new destination fades in.

**Good design choices:**
Fade through is correct here because these five destinations have no spatial relationship to each other. The brief emptiness signals to the user that they are entering a genuinely different context, not moving forward or backward in a flow. The duration is short — around 300 ms total — so switching tabs feels instantaneous even though the transition softens the hard cut. The bottom navigation bar itself does not animate; only the content area transitions. This keeps the navigation chrome stable as an anchor while the content changes.

**Anti-pattern:**
The designer applies a left-to-right slide transition between tab destinations, reasoning that it matches the visual left-to-right order of the tab icons. The result creates a misleading spatial model: users begin to expect that tapping the leftmost tab from any screen will slide content from the right, implying the destinations exist in a horizontal carousel. When the user cycles back from the rightmost tab to the leftmost, the slide direction reversal (now right-to-left) is either confusing if reversed or contradicts the metaphor if not. Fade through avoids this entirely by making no spatial claim.

---

## Scenario 3: FAB expansion into a creation dialog (expressive motion)

A creative app has a floating action button (FAB) with a plus icon. Tapping it should expand into a full-screen new-project creation dialog. The designer chooses a container transform with expressive spring physics: the FAB's circular container expands from its screen position, overshooting its final bounds slightly before settling, while the dialog content fades in over the last third of the expansion.

**Good design choices:**
The expressive scheme is appropriate here because this is a high-intent, high-visibility interaction the user performs deliberately, not a utility micro-interaction. The small overshoot (the dialog briefly scales to 102% before settling at 100%) communicates physical presence and weight — the dialog feels like it has mass. The spring's initial velocity is matched to the tap, so a confident fast tap produces a slightly more energetic expansion than a hesitant slow tap.

For reduced-motion: the designer specifies that when Remove Animations is enabled, the FAB transforms instantly to the full-screen dialog with no expansion animation. The dialog appears with a simple fade of 150 ms — short enough to not be jarring, long enough to prevent a hard cut that could startle. The plus icon still morphs to an X icon in the dialog to confirm the user is in the creation context, because this icon change is a functional state signal, not decorative animation.

**Anti-pattern:**
Encouraged by the expressive spring's success on the FAB, the designer applies the same bouncy spring physics to the dialog's dismiss animation (tapping the X or pressing Back). The dialog shrinks back toward the FAB position with a visible overshoot in the shrinking direction — it briefly gets smaller than the FAB before snapping back. This creates a disorienting "hiccup" that reads as a glitch rather than intentional physics. Exits should use the standard scheme: a fast, critically-damped retreat that returns the user to the list without fanfare. Overshoot belongs to entrances that invite the user in; exits should be clean and unobtrusive.
