---
name: m3-large-screens
description: Material 3 design guidance for large screens and foldables, covering window size class breakpoints, canonical multi-pane layouts, navigation rail and drawer at expanded widths, foldable postures and hinge-aware design, keyboard and pointer affordances, and the four adaptive quality tiers. Use when designing or critiquing an Android app for tablets, foldables, or ChromeOS; evaluating whether a layout earns its place on a large canvas; deciding between navigation rail and permanent drawer; specifying pointer and keyboard behavior; or auditing an app against the large-screen quality tiers before submission to the Play Store.
---

## When to use

- Critiquing a design mockup against Google Play's large-screen quality tiers before the app is submitted or featured.
- Deciding how navigation chrome — bottom bar, rail, or permanent drawer — should change as the window grows from compact through expanded.
- Designing foldable-aware layouts that respond to book posture, tabletop posture, and the hinge itself.
- Specifying keyboard shortcut surfaces, context menu affordances, and cursor/hover states for ChromeOS or tablet-with-keyboard users.
- Auditing whether an existing phone-first design earns its place on a large screen or merely stretches.
- Answering structural questions about window size class breakpoints that a code implementation skill (adaptive-window-size-classes) will need to be handed.

## Core guidance

### Window size classes and breakpoints

- **Three width classes define all adaptive decisions: compact (below 600 dp), medium (600–840 dp), and expanded (840 dp and above).** These are not device labels. A foldable is compact when folded, medium or expanded when open. A Chromebook window is compact when snapped to half-screen. Always design to the class, never to a device name.
- **Height classes are equally real and equally ignored too often.** Compact height (below 480 dp) — a phone rotated to landscape — compresses vertical breathing room dramatically. Primary actions, the navigation bar, and the page title must all survive in this space without overlap. Medium height (480–900 dp) suits most portrait tablets. Expanded height (900 dp and above) is a large landscape tablet or desktop window; secondary navigation panels and persistent toolbars earn their keep here.
- **Medium width is the hardest class to design well.** It is neither the optimized phone experience nor the full large-screen experience. The canonical guidance calls for a navigation rail and the beginning of a second pane, but many content types do not justify a split at 600 dp. Make an explicit, documented decision per screen rather than defaulting to a scaled phone or a cramped two-pane.
- **Design at the class boundaries but also at intermediate widths.** 720 dp and 1000 dp are common real-world window sizes on ChromeOS. A layout that looks correct at 600 dp and at 840 dp can still break at 680 dp. The design specification should describe the layout intent across the full range, not only at the class entry points.

### Adaptive quality tiers

Google Play and the large-screen guidelines recognize four quality levels; designs should target Tier 2 as a baseline and Tier 3 for apps where the large-screen canvas is a primary use case.

- **Tier 4 (broken):** The app is letterboxed in portrait orientation, crashes on resize, clips content behind system UI, or has interactive elements hidden by the hinge. This is an unacceptable baseline and disqualifies the app from large-screen features. The design review must flag any layout that cannot resize gracefully.
- **Tier 3 (optimized for large screens):** The design adapts meaningfully: it does not simply stretch the phone layout. Navigation chrome matches the window width (rail at medium, drawer at expanded). Content reveals or repositions rather than reflowing alone. Multi-pane appears where appropriate. The app works in any orientation and survives free-form window resizing on ChromeOS. This is the minimum target for apps that ship a tablet or foldable-specific design.
- **Tier 2 (large-screen ready):** The app runs correctly and does not feel broken, but it does not take advantage of the additional canvas. Content reflows without a second pane, navigation adapts, and the app does not crash or clip. This is an acceptable baseline for apps where the large-screen audience is secondary.
- **Tier 1 (optimized and featured):** The design is purpose-built for the large canvas — it exploits reveal, multi-pane, drag-and-drop, keyboard navigation, and pointer affordances. It earns placement in Play Store large-screen editorial. Very few apps need to target this tier immediately; it should be a deliberate product goal.

### Navigation adaptation across widths

- **Bottom navigation bar at compact, navigation rail at medium, permanent navigation drawer at expanded.** This three-step pattern is the M3 canonical recommendation. At compact, the bottom bar is thumb-reachable and occupies minimal vertical space. At medium, the rail moves navigation to the left edge where it does not compete with content width. At expanded, the permanent drawer keeps destinations visible in the user's peripheral vision, eliminating repeated navigation taps.
- **The NavigationRail composable at medium should show icons with optional labels.** Hidden labels save width but reduce discoverability; show labels unless the content pane is genuinely tight. A collapsed rail (icons only) suits productivity apps with expert users. A labeled rail suits consumer apps with diverse user bases.
- **The permanent NavigationDrawer at expanded is always visible; it is not a hamburger panel.** Avoid designs that show a hamburger icon at expanded widths to toggle a drawer — the expanded canvas exists precisely to eliminate that extra step. If the content requires all available horizontal space, use a rail rather than a toggleable drawer.
- **The navigation rail and drawer sit outside the multi-pane region.** They are not part of the leading pane of a list-detail layout. The multi-pane content area begins to the right of the navigation chrome, and pane widths are calculated from that available space, not from the full window width.
- **Never show a bottom navigation bar at medium or expanded widths.** A bottom bar on a landscape tablet competes with the keyboard, is unreachable by mouse, and consumes vertical space that is already compressed in landscape. It also communicates "this is a phone app" to large-screen users.

### Canonical multi-pane layouts

- **List-detail (ListDetailPaneScaffold composable) for hierarchical collections.** The list pane holds the scannable index; the detail pane shows the selected item. The correct split is approximately one-third list to two-thirds detail. At compact the layout collapses to a standard push navigation. The detail pane must never be empty on first entry at expanded width — default to the first item or a purposeful empty state illustration.
- **Supporting pane (SupportingPaneScaffold composable) for augmenting a primary surface.** Use this when a secondary surface — comments, metadata, filters, a minimap — adds context that the user benefits from seeing alongside the primary pane continuously. The supporting pane is narrower than the primary pane; equal splits signal equal importance, which is incorrect for a supporting role.
- **Feed layout for browsable collections.** Add columns as width grows rather than stretching individual cards. A card wider than roughly 320–400 dp reads as a banner, not a card, and degrades visual hierarchy. On expanded width a four- or five-column grid at 180–240 dp per card is often correct for media-heavy content.
- **Resist three-pane layouts except in productivity or complexity-heavy apps.** Three panes — index, list, and detail — exceed the cognitive load most users are comfortable with and become extremely cramped at medium widths. Two panes is the ceiling for most consumer and utility apps.

### Foldable postures and hinge-aware design

- **Foldable devices present three distinct design states: folded (compact), open flat (medium or expanded), and partially open (tabletop or book).** Each must be designed explicitly. The folded state is a standard phone design; the open state follows the two-pane guidance above. The partially open states have unique spatial logic.
- **Book posture (fold vertical, device held like a book): use the hinge as a natural pane separator.** The physical fold creates a visual and physical discontinuity in the screen; aligning the pane boundary with the hinge avoids content being bisected by the crease. Never place primary content, form fields, or interactive controls within 8 dp of the hinge line on either side. The FoldingFeature API surfaces the hinge bounds for engineering, but the design must specify this clearance.
- **Tabletop posture (fold horizontal, device resting on a surface): top half is content, bottom half is controls.** When a foldable is partially open and resting on a table, the user views the top half and interacts with the bottom half. Passive content — a video, a recipe step, a map — belongs at the top. Active controls — playback, navigation, timers — belong at the bottom. Both halves should have visual coherence; do not simply bisect the phone layout.
- **Design tabletop posture specifically for content types that benefit from hands-free viewing.** Video playback, recipes, fitness instructions, navigation, and reading all benefit. Productivity apps that require continuous two-handed interaction (email composition, document editing) gain less from tabletop posture and can offer it as a secondary mode rather than a primary one.
- **Foldable transitions between postures should be smooth and state-preserving.** A user halfway through a form or video should not lose progress when the device is unfolded. The design must specify how scroll position, playback position, and form state are maintained across posture transitions. This is a design intent that engineering must implement, but it must be called out at design time.

### Keyboard and pointer affordances

- **Tablet-with-keyboard and ChromeOS users expect keyboard shortcuts for primary actions.** Triggering the most common action (send, save, new item, search) with a keyboard shortcut is a Tier 1 quality signal and a significant productivity gain. Design the shortcut surface: a keyboard shortcut overlay (activated by a long press on the Ctrl or Meta key in standard Android patterns) reveals available shortcuts. Specify which actions warrant a shortcut and what the key combination is before handing to engineering.
- **Every interactive element must respond meaningfully to hover.** Mouse and trackpad users receive pointer feedback — a cursor change, a hover state, or a tooltip — when pausing over interactive elements. The M3 interaction states include a hovered state that uses a gentle tonal overlay on the element's surface. Designs that skip hover states feel unresponsive on ChromeOS and paired Bluetooth mouse setups.
- **Context menus (right-click menus) on mouse devices should surface secondary actions.** On a phone, secondary actions live in bottom sheets or overflow menus triggered by a long press. On a mouse-driven device, a right-click context menu is the expected affordance for those same actions. The design should specify which actions appear in the context menu and in what order — do not leave this entirely to engineering discretion.
- **Tab-order and keyboard focus traversal must be designed, not assumed.** The visual order of elements on screen should correspond to the logical tab order for keyboard navigation. Forms, settings screens, and data tables are particularly vulnerable: a haphazard tab order makes the screen inaccessible to keyboard-only users. Include a tab-order annotation in complex screens.
- **Drag-and-drop is a natural pointer affordance that large screens unlock.** On compact touch screens, drag-and-drop is possible but awkward; on large screens with a pointer, it is fast and expected. If the app involves reordering, moving items between lists, or file operations, specifying drag affordance (drag handle icons, drop targets with hover states, drop confirmation feedback) is part of the large-screen design.
- **Text selection and copy-paste behavior should be reviewed at large-screen sizes.** Mouse users select text by click-dragging; they expect to then right-click and see Copy, Select All, Look Up, and similar options. Designs that use custom text rendering or that prevent standard selection behavior will frustrate pointer users on ChromeOS and tablets.

### ChromeOS-specific considerations

- **ChromeOS windows are freely resizable; the design must work at any width, not only at canonical breakpoints.** A resizing window passes through every intermediate state between compact and the widest expanded size. Test the design at 500 dp, 650 dp, 720 dp, 900 dp, and 1200 dp — not only at the exact class boundaries.
- **On ChromeOS, users frequently snap windows to half-screen or one-third screen.** A window snapped to half of a 1280 dp screen is roughly 640 dp wide — medium class. The design must hold up here without looking like a broken phone layout. A navigation rail and a single content pane at 640 dp is correct; a two-pane split at 640 dp needs to be evaluated carefully for pane width adequacy.
- **System chrome on ChromeOS is different from Android phone chrome.** The taskbar, shelf, and window title bar consume screen space. The design should account for these insets, especially when specifying the minimum viable window size for the app. Apps that specify a minimum window size below 400 dp may appear cramped in ChromeOS windowed mode.
- **ChromeOS users may run the app alongside other apps simultaneously.** This means the app should not assume full-screen exclusivity for media, important notifications, or critical UI. Full-screen states (video playback, camera) should provide clean enter/exit affordances for windowed mode.

## Platform notes

On compact phones the large-screen design guidance does not apply — design for vertical single-column layout, thumb-reachable actions, and gesture navigation insets. The transition out of compact into medium is where large-screen design intent begins.

On medium-width devices (large phones in landscape, foldables in portrait, small tablets) the navigation rail appears and one additional pane may appear, but many content types stay single-pane. Medium is a transition zone; designs that attempt to fit all of expanded-screen richness at 600 dp typically produce cramped layouts. Make an explicit choice and document it.

On expanded-width devices (tablets, foldables fully open, ChromeOS) the permanent navigation drawer is available, multi-pane is the default expectation, and pointer/keyboard affordances become relevant. This is where the most design investment is required and where large-screen quality tiers are evaluated.

Wear OS and Android TV are not addressed by these guidelines. Wear uses a tile-and-card model; TV uses a D-pad-driven leanback model. Neither responds to window size class breakpoints.

## Pitfalls

- **Shipping a letterboxed phone layout on tablets.** This is the single most common and most damaging large-screen failure. A phone layout centered in a tablet window surrounded by black bars is immediately recognizable and drives users to competitors. It also prevents the app from being featured in Play Store large-screen collections.
- **Treating medium width as a second phone rather than a first tablet.** At 600 dp the navigation rail should already be present and a second pane may appear. Keeping the bottom bar and single-column layout at medium is visually and ergonomically incorrect.
- **Ignoring the hinge clearance zone on foldables.** Interactive controls or focal content placed within 8 dp of the hinge line on either side may be obscured by the fold crease or become inaccessible in partially open postures.
- **Designing tabletop posture only for landscape apps.** Tabletop posture is available on any app that runs on a foldable. Even portrait-primary apps (recipe apps, reading apps) should specify a tabletop state if the content type benefits from hands-free viewing.
- **Omitting hover states and assuming touch-only interaction.** On ChromeOS and tablets with a Bluetooth mouse, hover-less UI feels unresponsive. Every tappable element should have a hover state defined.
- **Forgetting context menus for right-click.** Secondary actions accessible via long-press on touch should be surfaced in a right-click context menu on pointer devices. Leaving this undesigned means the behavior will be undefined or inconsistent in the engineering implementation.
- **Assuming the app owns the full screen on ChromeOS.** Windowed mode means other apps are visible simultaneously. Full-screen takeovers should have explicit dismiss affordances; critical alerts should not assume they will be seen immediately.
- **Neglecting keyboard tab order on complex screens.** Forms, data tables, and settings screens with many interactive elements must have a logical tab order. A visually beautiful design that cannot be navigated by keyboard is inaccessible and fails large-screen quality requirements.
- **Targeting only the boundary widths in design review.** 600 dp and 840 dp are entry points, not the only widths users see. Intermediate widths like 700 dp or 960 dp can expose awkward transitions, cramped panes, or collisions between navigation chrome and content.
- **Empty detail pane on first entry.** A list-detail layout whose detail pane shows a blank or "nothing selected" placeholder on launch wastes the large-screen canvas and feels unfinished. Default to the first item or a purposeful welcome state.

## References

- **Material 3 Guidelines:** [Large screen canonical layouts](https://developer.android.com/guide/topics/large-screens/large-screen-canonical-layouts)
- **Documentation:** [Build adaptive layouts in Compose](https://developer.android.com/develop/ui/compose/layouts/adaptive)

## See also

The m3-adaptive-layout skill covers the foundational breakpoint theory, margin scaling, and reflow/reposition/reveal strategy decisions that underpin the guidance here. The m3-canonical-layouts skill covers in detail the three canonical layout patterns — list-detail, supporting pane, and feed — including pane proportions and content design within each pane. For implementation, hand all window size class detection, WindowSizeClass API usage, ListDetailPaneScaffold wiring, and FoldingFeature integration to the adaptive-window-size-classes code skill. The m3-navigation skill covers the NavigationBar, NavigationRail, and NavigationDrawer component decisions in detail.
