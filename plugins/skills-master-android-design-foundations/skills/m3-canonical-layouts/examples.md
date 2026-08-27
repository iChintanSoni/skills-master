## Scenario 1: Email client adopting list-detail

An email app currently shows a single-pane inbox list on all devices. On a Pixel Fold unfolded (expanded width), the entire screen is a scrollable message list — the extra horizontal space is wasted.

**Design decision:** Apply list-detail. The list pane (roughly one third of width) shows the inbox, with sender, subject preview, and timestamp. The detail pane (two thirds) shows the full message body, reply controls, and attachment previews. On compact, the layout reverts to a single-pane stack: tapping a message pushes the detail screen onto the back stack with a predictable back gesture to return to the list.

**Key judgment calls:** The list pane should remain highlighted on the selected item when the detail is shown — this tells the user where they are in the list without them having to remember. The detail pane should hold all reply and archive actions rather than surfacing them in the list row, keeping the list scannable. Top-level navigation (Inbox, Sent, Drafts) belongs in the navigation rail outside the two-pane region, not inside either pane.

**Anti-pattern:** Keeping the full list highlighted (no selected-item state) and displaying a placeholder "Select a message" illustration in the detail pane on expanded width. This wastes the large-screen canvas and gives the app a desktop-app feel that is incongruent with Material 3's continuous adaptive model. Always default to showing the first item selected when the pane layout first appears.

---

## Scenario 2: Document editor using supporting pane

A collaborative writing app wants to surface inline comments. Currently comments are tucked into a modal bottom sheet that the user opens and closes manually. On tablets and foldables, this forces the user to keep toggling the sheet while editing.

**Design decision:** Apply the supporting pane pattern on medium and expanded windows. The primary pane holds the document canvas — it gets the larger share of width (roughly two thirds to three fifths). The supporting pane shows threaded comments anchored to the current paragraph or selection. The supporting pane is visually subordinate: a slightly recessed surface color distinguishes it from the document without using a heavy border.

On compact, the supporting pane collapses back into a bottom sheet triggered by a Comments button in the toolbar. The content in the sheet is identical to the pane, not a separate design. This means the component is designed once (comments thread) and placed into two different containers depending on window size.

**Key judgment calls:** The supporting pane should not have its own scroll position that is independent of the document — when the user scrolls to a new section, the comment pane should auto-scroll to comments relevant to that section. This keeps the two panes contextually linked, which is the whole point of the pattern.

**Anti-pattern:** Making the supporting pane equal in width to the primary pane at expanded width. Equal splits communicate equal importance. Comments are secondary to the document; giving them equal visual weight makes the app feel like a split-screen comment manager rather than a document editor with commentary. Keep the supporting pane narrower.

---

## Scenario 3: Photo gallery using feed layout

A gallery app shows photos in a single-column list on phones. On a large tablet this produces enormous portrait-oriented cards with no information density benefit.

**Design decision:** Apply the feed canonical layout. On compact (portrait phone), show a two-column staggered grid. On medium (phone landscape, small tablet), show three columns. On expanded (large tablet, ChromeOS), show four or five columns depending on the target card width — aim for 180–240 dp per card so thumbnails are legible without becoming poster-sized.

Cards do not stretch to fill column width beyond ~320 dp. If the five-column layout at a very wide expanded window would produce cards larger than 320 dp, add a sixth column rather than widening existing cards. This keeps the visual rhythm consistent and prevents the gallery from feeling like a mood board rather than a photo browser.

Tapping a photo opens a full-screen detail view with a shared element transition (the thumbnail expands into the full-screen image). This is not a list-detail pattern — the detail is ephemeral and covers the entire window rather than sitting in a persistent second pane, because photo viewing is an immersive act, not a side-by-side comparison task.

**Anti-pattern:** Adding a persistent right-side detail pane to the gallery that shows photo metadata (date, location, camera settings) whenever a photo is selected. This seems like a productivity improvement but degrades the experience because no photo is selected most of the time, leaving the detail pane showing a blank or placeholder state. Feed layouts do not have persistent selection — opening detail as a full-screen overlay is the correct pattern here.
