---
name: m3-chromeos-desktop
description: Design critique and guidance for Material 3 on ChromeOS and Android desktop environments, covering pointer and keyboard-first interaction, resizable free-form windows, multitasking, hover and right-click affordances, and productivity patterns on a large display. Use when designing or auditing an Android app intended to run on ChromeOS, evaluating whether a UI is appropriately calibrated for mouse and keyboard input, reviewing window resize behavior, or specifying context menus, tooltips, and drag-and-drop flows for a desktop-class experience.
---

## When to use

- Designing an Android app that will run on ChromeOS or appear in the Google Play Store for Chromebooks.
- Auditing a mobile-first UI for pointer and keyboard readiness before a large-screen release.
- Specifying hover states, right-click context menus, tooltips, and keyboard shortcuts that do not exist in a touch-only design.
- Reviewing how a layout holds up as the user resizes a free-form window from compact to very wide.
- Evaluating whether the app's navigation, density, and interaction model feel at home alongside productivity apps in a multitasking desktop environment.

## Core guidance

### Pointer-first interaction

- **Design for cursor, not thumb.** On ChromeOS, users navigate primarily with a mouse or trackpad. Touch targets that meet the 48 dp minimum for mobile are still valid, but interactive elements should not depend on large hit areas to be usable — a precise cursor can target a 24 dp icon without extra padding. Focus visual design on clear affordance rather than target inflation.
- **Hover states are not optional on desktop.** Every interactive surface — buttons, list items, cards, icon buttons, chips, navigation entries — must render a hover state (8% state-layer tint over the on-role color) to signal interactivity before the user clicks. An element with no hover state looks broken on ChromeOS; users interpret static surfaces as non-interactive.
- **Cursor shape communicates affordance.** Switch the cursor to a pointer hand over clickable elements, a text I-beam over editable fields, a resize arrow over resizable edges, and a grabbing hand during drag. These are desktop conventions that users read subconsciously; ignoring them forces users to click to discover interactivity.
- **Do not scale touch targets up arbitrarily for desktop density.** Desktop density is slightly tighter than touch density. Buttons, list rows, and form fields can be 36–40 dp tall in a desktop context (matching platform conventions) rather than the 48 dp minimum required for touch. The 48 dp rule applies to touch-primary surfaces; on desktop, prioritize visual coherence at standard density.

### Keyboard interaction

- **All interactive elements must be keyboard-reachable.** Tab order must follow the visual reading order of the layout. Every button, link, form field, selectable list item, and menu entry must be focusable and activatable via keyboard. An element that can only be clicked with a mouse is inaccessible on a desktop.
- **Focus rings must be clearly visible at desktop density.** The M3 focus ring (3 dp outline in the primary color, offset from the component boundary) that is acceptable on mobile becomes a visual statement on a large display where keyboard navigation is common. Confirm contrast against the desktop's often-lighter surface backgrounds.
- **Provide keyboard shortcuts for productivity-critical actions.** On ChromeOS, users expect standard shortcuts: Ctrl+Z for undo, Ctrl+C/V for copy/paste, Escape to dismiss dialogs and menus, Enter to confirm, arrow keys to navigate lists. Map these where they apply and document any app-specific shortcuts in a discoverable help surface.
- **Arrow-key navigation must work inside lists, grids, and tab groups.** Tab moves between logical regions; arrow keys navigate within a region. A grid of cards where Tab cycles through each card individually is exhausting; arrow keys let users navigate efficiently within the group.
- **Escape is a universal dismiss.** Menus, dropdowns, dialogs, bottom sheets promoted to dialogs, and tooltips must all close on Escape. This expectation is so ingrained in desktop behavior that any element that traps Escape will feel broken to experienced ChromeOS users.

### Right-click and context menus

- **Secondary click (right-click) must reveal a context menu on content-rich surfaces.** Items in a list, rows in a table, cards in a grid, files in a browser, and messages in a feed all benefit from a right-click menu. This is a primary discoverability mechanism for power users on desktop; surfaces that ignore secondary click feel unfinished.
- **Context menus should be scoped to the clicked element.** The menu items must be directly relevant to the item under the cursor — not a generic app-level action set. Showing "Compose new email" in the right-click menu of a received message is incorrect; showing "Reply," "Forward," "Mark as read," and "Move to" is correct.
- **Keep context menus short and flat.** Aim for five to seven entries maximum. Submenus (cascading menus) are occasionally appropriate for grouping related options (e.g., "Move to" with a submenu of folders) but should be used sparingly — they are harder to navigate with a trackpad and increase cognitive load.
- **Group related actions with dividers, not labels.** Organize context menu items into logical clusters (primary action, secondary actions, destructive action) separated by thin dividers. Avoid adding category headers inside a short menu; the visual grouping is sufficient.
- **Destructive actions belong at the bottom, separated by a divider.** "Delete," "Remove," and "Discard" should be visually distant from the primary actions at the top and separated by a divider so a misclick does not destroy data.

### Tooltips and progressive disclosure

- **Provide tooltips on icon-only controls.** On desktop, hovering over an icon button that has no visible label should reveal a tooltip after a short delay (approximately 500 ms). Tooltips remove the ambiguity that mobile apps accept because there is no persistent hover state on touch. This applies to toolbar icons, navigation rail items without labels, icon-only FABs, and compact segmented button segments.
- **Do not use tooltips as the primary description of a control.** A tooltip is a secondary convenience, not a substitute for a label. If a control is so obscure that it cannot be understood without a tooltip, add a visible label.
- **Keep tooltip text concise — five words or fewer.** The tooltip should name the action or element, not explain it. "Delete message" is a good tooltip; "Deletes the currently selected message and moves it to Trash" belongs in a help article.
- **Do not tooltip items that already have visible text labels.** Redundant tooltips on labeled buttons add noise without value.

### Resizable free-form windows

- **Every screen must be designed for continuous resizing, not just the three canonical breakpoints.** On ChromeOS, users drag windows to arbitrary sizes. A design that works at 600 dp and 840 dp may break at 700 dp or 920 dp. Test at non-canonical widths — 680, 760, 900, 1100, 1400 dp — and verify that the layout interpolates gracefully between pane-count changes.
- **Define minimum window dimensions for complex screens.** Some layouts — especially multi-pane editors, data tables, or media composition surfaces — have a true minimum below which they cannot function usably. Declare a minimum window size for those screens and prevent the user from resizing below it rather than silently allowing a broken layout.
- **Avoid snapping between layouts too eagerly at breakpoints.** A layout that instantly collapses a sidebar when the window crosses 840 dp can feel jarring when the user is slowly resizing. Where possible, design a gradual narrowing — reducing sidebar width before collapsing it — so the transition feels continuous rather than a hard cut.
- **Content width must have a maximum.** In a very wide window, single-column text, form fields, and media that fill the full width are uncomfortable to read and feel undesigned. Apply a maximum content width (typically 600–800 dp for text, adjustable for data-dense surfaces) and center the content with proportional margins on either side.
- **Window chrome and system UI insets change on ChromeOS.** The top system bar inset is different from the Android phone gesture navigation bar. The taskbar at the bottom of the screen creates a persistent inset. Designs must account for these platform chrome differences so that content does not hide behind the taskbar or the window title bar.

### Multitasking and desktop productivity patterns

- **Design for split-screen and small windows.** ChromeOS users routinely snap apps side by side. An app may be shown at 400–500 dp wide alongside another app. This is a compact window size; the app must not degrade to an unusable state at that width — compact phone layout rules apply.
- **Clipboard and drag-and-drop are first-class interactions.** On desktop, users expect to drag content from one app and drop it into another, to copy text from a browser and paste it into the app, and to drag files from the file manager into upload targets. Design explicit drop zones with clear affordance (highlighted border, icon, label) that appear when a drag enters the target region.
- **Selection patterns must match desktop conventions.** In a list or grid, Shift+click should extend a range selection; Ctrl+click (or Cmd+click) should add or remove individual items from a selection. Touch-style long-press to enter selection mode is acceptable as an additional entry point, but should not be the only way to select multiple items on desktop.
- **Provide a menubar or persistent toolbar for actions on expanded windows.** On compact, an overflow menu (three-dot) is the correct home for less-frequent actions. On an expanded desktop window, a persistent horizontal toolbar or top app bar with labeled icon buttons reduces the number of clicks needed to access common actions, which is the productivity expectation of desktop users.
- **Do not interrupt multitasking workflows with full-screen-takeover dialogs for minor confirmations.** On mobile, a full-screen dialog or modal bottom sheet is sometimes acceptable. On desktop, modal dialogs should be sized to their content (typically 280–560 dp wide), centered in the window, and should not block the entire display. Reserve full-window interruptions for critical flows (payment confirmation, destructive action confirmation).

### Data density and productivity layout

- **Desktop users expect higher information density.** A list row that occupies 72 dp on mobile can reasonably be 48–56 dp on desktop. A table that shows three columns on tablet should show five or six on an expanded desktop window. Do not scale down density just because the screen is large; the large screen is an opportunity to show more, not to add whitespace for its own sake.
- **Use tables for structured data instead of cards or tiles.** Card grids are appropriate for browsable, heterogeneous content. Tabular data — contacts, transactions, files, logs — belongs in a table with sortable column headers at desktop widths. Cards for tabular data on desktop force unnecessary scrolling and make comparison difficult.
- **Column headers in tables must indicate sort state.** An ascending or descending sort indicator (arrow icon) adjacent to the active column header is the standard signal. A table with no visible sort indicator forces users to experiment to understand the current order.
- **Allow column resizing and reordering in power-user tables.** For productivity-heavy apps (file managers, CRMs, analytics dashboards), the ability to resize and reorder table columns is a strong desktop expectation. This is not a universal requirement — simple data grids do not need it — but evaluate whether the target user base would miss it.

## Platform notes

- **ChromeOS supports Android apps natively.** The app runs in an Activity resizable window, receives pointer events (`MotionEvent` with pointer tool type), and can declare keyboard shortcuts via `KeyboardShortcutGroup`. The design must account for all three modes: touch-only (tablet-mode Chromebook), keyboard+trackpad (laptop-mode), and keyboard+mouse (external mouse attached).
- **ChromeOS taskbar inset.** The system taskbar sits at the bottom of the ChromeOS desktop, similar to Windows. Unlike Android phone gesture navigation, it is always persistent and opaque. Content in a maximized window must not render beneath it; the system enforces insets, but designs must not assume the full display height is available.
- **Window close/minimize/maximize buttons are provided by the system.** Do not replicate window controls inside the app's own UI. The system title bar and its controls are ChromeOS chrome, not the app's concern.
- **Large-screen and desktop form factors share the expanded window class** (840 dp and above), but ChromeOS introduces free-form resizing, a persistent taskbar, and desktop input modes that tablets running Android do not have. A design validated on a tablet emulator may still need ChromeOS-specific review.
- **Stylus input on ChromeOS Chromebooks with touchscreens.** Some Chromebooks include a USI stylus. Pressure sensitivity, hover proximity detection (hovering a stylus above the screen triggers hover events), and palm rejection all apply. PencilKit patterns do not transfer; the M3 interaction states model and `PointerIcon` handling govern stylus behavior.

## Pitfalls

- **Shipping a mobile layout unchanged on ChromeOS.** A bottom navigation bar, oversized touch targets, full-screen modals, and the absence of hover/right-click feedback mark an app as a phone port and erode user trust on a desktop platform.
- **Treating hover as purely cosmetic.** Hover is a primary input signal on desktop. Omitting it means interactive elements are invisible until clicked, which creates a guessing game and increases misclicks.
- **Implementing right-click as a duplicate of long-press.** Long-press on touch surfaces often triggers a selection or contextual mode. Right-click on desktop expects a context menu. Mapping them to the same behavior can produce unexpected results; design them as distinct triggers even if the menu content overlaps.
- **Ignoring continuous resize between breakpoints.** A layout that looks correct at 600 dp and 840 dp can break visually at 720 dp if panes collide or overflow. Breakpoints govern structural changes; the layout between breakpoints must still render correctly.
- **Allowing content to fill an unbounded wide window.** A 1400 dp wide window with text stretched edge to edge is a typographic failure. Apply max-width constraints and center the content.
- **Keyboard traps.** Any modal or overlay that cannot be dismissed with Escape or Tab-navigated out of creates a keyboard trap. This is both an accessibility failure and an experience failure for keyboard-primary desktop users.
- **No visible drag-and-drop affordance.** Drag targets that have no visual drop-zone state (highlight border, icon change, label) are invisible to users who drag from external apps. Design the "drag active" and "drag hover" states explicitly.
- **Using long-press as the only multi-selection entry point.** Desktop users do not long-press; they Ctrl+click. An app that requires a touch gesture to enter selection mode is inaccessible to keyboard-and-mouse users.
- **Opening full-window interruptions for trivial confirmations.** Confirming a minor action with a full-screen overlay blocks the entire desktop session and feels hostile to multitasking users. Right-size dialogs to their content.
- **Designing a static layout that does not declare a minimum window size.** A complex layout forced into 200 dp is unlikely to be usable. Declare a sensible minimum so the system can prevent over-shrinking.

## References

- **Material 3 Guidelines:** [Design for desktop](https://developer.android.com/design/ui/desktop)
- **Documentation:** [Build adaptive layouts in Compose](https://developer.android.com/develop/ui/compose/layouts/adaptive)

## See also

The m3-adaptive-layout skill covers window size classes, breakpoints, and the reflow/reposition/reveal strategies that underpin desktop window resizing. The m3-canonical-layouts skill addresses list-detail, supporting pane, and feed patterns that map directly to productive desktop multi-pane arrangements. The m3-interaction-states skill details hover, focus, pressed, and dragged state-layer opacities that must be implemented for pointer-capable input. The m3-navigation skill covers the shift from bottom bar to rail to drawer that frames desktop layouts at expanded window widths. Implementation of pointer events, `PointerIcon`, `KeyboardShortcutGroup`, context-menu composables, drag-and-drop receivers, and `WindowSizeClass` detection belongs with the adaptive-layout and desktop-interaction code skills.
