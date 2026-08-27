## Scenario 1: Productivity app auditing against large-screen quality tiers

A note-taking app ships on phones with a list of notes, a full-screen editor, and a bottom navigation bar (Notes, Notebooks, Search, Settings). The product team wants to submit to the Play Store large-screen program and needs to know what tier the current design is at and what changes are required to reach Tier 3.

**Tier assessment of the current design:** The bottom navigation bar appearing on an expanded-width tablet is a Tier 3 disqualifier. The single-pane layout that fills a 1200 dp wide window with a scrolling note list is a letterboxed experience in intent if not in appearance — no multi-pane, no sidebar, no use of the additional canvas. The design is currently at Tier 2: it does not crash and content is accessible, but it takes no advantage of the canvas.

**Changes required for Tier 3:**
- Replace the bottom navigation bar with a NavigationRail at medium widths and a permanent NavigationDrawer at expanded widths. The drawer at expanded should always be visible — it should not require a hamburger toggle.
- At medium width (600–840 dp), keep the single-pane editor but surface the NavigationRail so orientation is clear. The list of notes can appear in a leading pane at medium if pane widths are comfortable (at least 280 dp each); otherwise stay single-pane at medium and reveal the second pane at expanded only.
- At expanded width (840 dp and above), show the notes list in a leading pane (approximately one-third of the content area, to the right of the NavigationDrawer) and the note editor in the trailing pane (approximately two-thirds). Default to the most recently edited note open on first launch — never leave the trailing pane blank.
- Add hover states to all interactive elements: note rows should show a tonal hover overlay; toolbar icons should show the M3 hovered state with a tooltip on sustained hover.
- Define a keyboard shortcut for New Note (Command+N or Ctrl+N) and for Search (Command+F or Ctrl+F). Include these in a keyboard shortcut overlay discoverable by holding the Ctrl key.

**Anti-pattern:** The team adds a two-pane layout at medium width (640 dp) immediately, producing a 220 dp note list pane alongside a 420 dp editor pane. The 220 dp list pane clips note titles and makes the list unreadable. Because the pane is below the 280 dp minimum, the layout is worse than the single-pane design it replaced. The correct correction is to delay the two-pane split to expanded (840 dp) or to use a wider medium threshold (for example, only show two panes when the content area exceeds 720 dp).

---

## Scenario 2: Foldable design for a recipe app with tabletop posture

A cooking app shows a recipe detail screen with a header image, ingredient list, and step-by-step instructions in a single scrolling column. It works well on phones. The design team is adding foldable support for a Pixel Fold launch.

**Open flat (expanded width, book posture):** The recipe is shown in a two-pane layout. The leading pane (roughly one-third) shows the ingredient list — quantities, items, a toggle for each ingredient to mark it as gathered. The trailing pane (two-thirds) shows the current step with a large illustrative image, the step text, a Previous Step and Next Step control, and a running timer. The hinge runs vertically; the pane boundary is aligned with the hinge, leaving 8 dp of clearance on each side. No interactive element, no image focal point, and no text baseline straddles or approaches the hinge clearance zone.

**Tabletop posture (fold horizontal, resting on counter):** The top half shows the current step image and step text at a scale readable from arm's length — large type (at least 22 sp), generous line height, and no small detail. The bottom half shows the navigation controls (large Previous Step and Next Step buttons, each at least 64 dp tall), the running timer, and a scrollable ingredient checklist. The fold runs horizontally; the boundary between content area and control area aligns with the hinge, with 8 dp clearance on each side.

**State preservation across posture transitions:** When the user folds from open-flat to tabletop, the current step number and timer state are preserved. The step does not reset. The ingredient checklist state (which items are ticked) carries over. This is a design requirement that must be communicated explicitly to engineering.

**Anti-pattern:** The design team handles only the open-flat state and treats the tabletop posture as an edge case to handle later. On launch, the tabletop posture shows the standard landscape two-pane layout, which the horizontal hinge bisects through the middle of the ingredient pane. Ingredients in the lower portion of the ingredient pane are behind the fold crease and are inaccessible. Users rest the device in tabletop posture expecting a viewing-optimized layout and instead see their ingredients folded away. The app earns negative reviews from Pixel Fold users during launch week.

---

## Scenario 3: ChromeOS window management for a file manager app

A file management app designed for phones shows a folder tree accessible via a hamburger drawer, a file list in the main pane, and a floating action button for creating new folders. The team is preparing a ChromeOS release.

**Issues identified in design review:**
- The hamburger drawer at all widths is incorrect on ChromeOS. At expanded windows (the most common ChromeOS window size), the navigation drawer should be permanent and always visible — the folder tree belongs in a persistent left panel, not behind a toggle.
- The floating action button for "New Folder" should be accompanied by a keyboard shortcut (Shift+Command+N or Shift+Ctrl+N). The FAB alone is sufficient on touch; on ChromeOS the shortcut is expected for a primary creation action.
- File rows have no right-click context menu. On ChromeOS, right-clicking a file should show: Open, Rename, Move to, Copy, Delete. These same actions exist in the overflow menu (three-dot icon), but pointer users expect them at right-click.
- Drag-and-drop between panes is expected on ChromeOS. Files should be draggable from the list pane to folder items in the navigation pane, with a drag handle affordance on hover and a highlighted drop target when hovering over a destination folder.
- The design does not specify a minimum window size. At 350 dp width (a narrow snap window on ChromeOS), the two-pane layout breaks. The minimum window size should be set to 400 dp, and the layout at that size should collapse the navigation pane into a compact rail of folder icons or a modal drawer.

**Anti-pattern:** The team deploys the phone APK to ChromeOS without a ChromeOS-specific design review, reasoning that "it works." The app opens in a portrait-phone-sized window in the center of the ChromeOS desktop. The hamburger drawer toggles a modal panel that covers the file list. There are no keyboard shortcuts. Right-clicking shows no context menu. Dragging a file does nothing. ChromeOS users rate the app one star and describe it as "clearly not built for desktop." The app is excluded from the Play Store large-screen editorial collections.
