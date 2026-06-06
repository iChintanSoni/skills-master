## Scenario 1: News reader app graduating from phone to tablet

A news reader ships on phones with a single-column article list. When the team decides to support tablets, the first instinct is to simply use a larger font and wider row. This is a missed opportunity.

The right design uses a list-detail reveal: at compact, the article list fills the screen and tapping an article pushes a full-screen reader. At medium (600–840 dp), a split begins to make sense — but 600 dp is tight for two panes, so the design holds the single-pane behavior until 720 dp, giving both panes a comfortable 300+ dp minimum. At expanded (840 dp and above), the list sits in a 360 dp leading pane and the article reader fills the remainder, defaulting to the first item on first launch rather than leaving the detail pane blank.

The navigation bar migrates too: bottom bar at compact, a navigation rail at medium (with labels hidden to save width), and a permanent navigation drawer at expanded that also exposes section filters previously hidden in a modal bottom sheet.

**Anti-pattern:** The team instead scales the font from 16 sp to 20 sp, increases list row padding from 16 dp to 32 dp, and calls it a tablet layout. The result is a single column of huge rows with enormous whitespace to either side. Users on tablets recognize immediately that the app was not designed for them.

---

## Scenario 2: Settings screen that misuses reveal

A settings screen at compact is a single scrolling list of preference rows. At expanded widths, the designer decides to use a two-pane layout: categories on the left, settings rows on the right. The design looks clean in Figma at 1024 dp.

The mistake is choosing reveal at medium (680 dp) before the panes have room to breathe. The category pane is only 200 dp wide and clips category labels; the settings pane is 480 dp but its form controls stretch to fill the full width, making text fields uncomfortably wide. Tapping a category also leaves the right pane in an undefined state at first launch.

The corrected design delays the two-pane split to the expanded breakpoint (840 dp), gives the category pane a fixed 280 dp width, constrains form fields to a max of 560 dp within the detail pane, and pre-selects the first category so the detail pane is never empty on entry.

**Anti-pattern:** The team ships the 680 dp split as-is and justifies it by saying "it fits." Fit is not sufficient — the panes must each have enough room to present their content at appropriate density, and neither pane should fall below 240 dp.

---

## Scenario 3: Foldable tabletop posture for a recipe app

A recipe app shows an ingredient list and step-by-step instructions. On a phone, both live on the same scrolling screen. On a fully open foldable in landscape, a two-pane layout shows ingredients on the left and steps on the right.

The design team adds a third state: tabletop posture, where the foldable is partially open and resting on a surface, the screen bent at roughly 90 degrees. In this posture the top half of the screen faces the cook and the bottom half is used for controls. The design places the current step and a large image in the top half and navigation controls (previous step, next step, a timer) in the bottom half — ergonomic, hands-free, readable from a meter away.

The design also flags that the hinge bisects the two halves: no text, image focal point, or interactive target is placed within 8 dp of the hinge line on either side.

**Anti-pattern:** The design team ignores tabletop posture entirely. The recipe app in tabletop mode shows the standard landscape two-pane layout, which the hinge now cuts through the middle of. The ingredient pane is folded toward the user at an unreadable angle. Users prop their phone against something instead, which means the foldable's key feature is useless for this app.
