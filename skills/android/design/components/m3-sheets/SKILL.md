---
name: m3-sheets
description: "Design critique and guidance for Material 3 bottom sheets and side sheets on Android: choosing between modal and standard variants, setting drag handles and partial expansion, deciding when a sheet beats a dialog, and adapting to large-screen and foldable layouts with side sheets. Use when reviewing a contextual action panel, a filter drawer, a details overlay, or any surface that slides over the main content, and you need M3-grounded design recommendations rather than implementation code."
tags: [m3, design, sheets, bottom-sheets, android, side-sheets]
x-skills-master:
  domain: android
  class: design
  category: components
  platforms: ["android", "large-screen"]
  pairs_with: []
  sources:
    - https://m3.material.io/components/bottom-sheets/overview
    - https://developer.android.com/develop/ui/compose/components
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for this skill when critiquing any design moment where content or actions need to slide in from an edge without fully replacing the current screen. Common triggers include: a contextual action panel tied to a selected item, a filter or sort drawer, a details summary that the user can expand to full view, a media player mini-bar that expands to a full player, or a sharing panel.

Use this skill to decide which variant is right (modal bottom sheet, standard bottom sheet, or side sheet), whether to allow partial expansion, how the drag handle and scrim should behave, and when to promote the design to a full-screen route or a dialog instead.

Do not use it for system-level notifications (those are snackbars or notifications), for a single short confirmation (that is a dialog), or for primary navigation (that belongs in a Navigation Drawer or Navigation Bar).

## Core guidance

- **Choose modal when the task needs focus; choose standard when it is supplementary.** A modal bottom sheet — `ModalBottomSheet` in Compose — places a scrim over the main content and demands the user act or dismiss before continuing. Use it for actions or decisions that logically interrupt the flow (share, filter before a search executes, a picker). A standard bottom sheet — `BottomSheetScaffold` — coexists with the main content, which remains visible and interactive. Use it for persistent panels like a map detail card or a media player that should stay on screen while the user scrolls or taps elsewhere.

- **Partial expansion is a progressive-disclosure tool, not a default state.** When a sheet has a natural summary (three recent files, the current filter applied, the mini-player track) and a richer detail, use two states: a peek height that shows the summary and a full height that shows the detail. Do not create partial states just because the API allows it; every extra stop adds a swipe gesture the user must learn. One peak height plus full is nearly always enough.

- **Always show a drag handle when the sheet is draggable.** The drag handle — the short horizontal pill centered at the top of the sheet — is the visual affordance that tells users the surface is swipeable. Omit it only when the sheet is not swipeable and has an explicit close button. Never rely on the scrim tap alone as the only dismissal affordance; pair it with a visible handle or a close action in the sheet header.

- **Scrim opacity communicates interrupt severity.** A modal sheet should carry the standard M3 scrim (around 32–40 % black) so the main content reads as inactive. Lightening the scrim to near-transparent while using `ModalBottomSheet` sends contradictory signals: the surface looks modal but the background looks interactive. If the content truly should remain interactive, switch to a standard sheet.

- **Size the touch target for the drag handle generously, not just the visual pill.** The pill itself is small; ensure the tappable/swipeable region extends at least 48 dp vertically and spans the full sheet width so users can reliably grab it.

- **Set a max sheet width on wide screens rather than stretching edge-to-edge.** On screens wider than ~600 dp, a bottom sheet that spans the full width feels like a dialog smear. Cap the sheet width (Material guidance suggests roughly 640 dp) and center it, or migrate to a side sheet.

- **Prefer a sheet over a dialog when the content is rich or scrollable.** Dialogs are for short, discrete decisions (two or three choices, a text field). When the interaction involves a scrollable list, a map, a multi-step flow, or persistent reference content, a sheet is the better container because it supports scroll and natural dismissal by swipe.

- **Do not nest scrollable content inside a modal sheet without careful gesture handling.** A vertical scroll list inside a modal sheet creates gesture ambiguity: does the drag dismiss the sheet or scroll the list? M3 resolves this with nested scroll interop — the sheet handles the drag until the list is scrolled to its top, at which point continued downward drag dismisses the sheet. Verify this behavior in design reviews; do not flatten the content to avoid the problem if the list warrants scrolling.

- **Keep actions inside the sheet when they belong to it.** Floating action buttons, bottom navigation bars, and persistent toolbars should not hover over a standard bottom sheet. If the sheet is in the peek state and the FAB overlaps meaningfully, either raise the FAB above the peek height or suppress it while the sheet is visible.

- **Use clear, action-oriented headers when the sheet's purpose is not immediately obvious.** Standard bottom sheets often omit headers; modal sheets for a non-obvious task (a filter panel, a settings sub-section) benefit from a short title and an optional close icon-button at the trailing end of the header row so users can dismiss without a swipe.

## Platform notes

**Compact phones (< 600 dp width)**
Bottom sheets are the natural choice. Modal sheets should use the full available width. Standard sheets should be designed with a meaningful peek height — roughly 56–88 dp — that does not obscure the bottom navigation bar; use `BottomSheetScaffold`'s `sheetPeekHeight` to reserve space above nav.

**Large phones and foldables (600–840 dp, unfolded inner screen)**
Bottom sheets remain valid but begin to feel wide. Cap the modal sheet width at ~640 dp and let it float centered with rounded corners on all four sides. On foldables, be aware the hinge may bisect a full-width sheet; test on both the outer and unfolded inner displays.

**Tablets and large screens (> 840 dp)**
Switch bottom sheets to side sheets when the content is persistent or supplementary. A side sheet slides in from the trailing edge, keeping the main content visible and interactive. Compose exposes side sheet behavior through `ModalNavigationDrawer` with a custom sheet-style content pane, or you can compose a `DismissibleDrawerSheet` / custom `Surface` anchored to the trailing edge. The key design rule: a side sheet on a large screen should never be so wide it crowds the main content below 320 dp.

**Wear OS**
Sheets are not a Wear pattern. Use dialogs, confirmation screens, or the Wear OS Pager for multi-page content instead.

**TV (Android TV / Google TV)**
Sheets are D-pad-hostile. Side panels implemented as overlapping composables with focus-trap logic are the TV equivalent, but this is outside standard M3 sheet guidance.

## Pitfalls

- Using a modal sheet when the content behind it needs to remain interactive — the scrim signals "not available" and users will be confused.
- Adding three or more drag stops (peek, half, full, ultra-wide) without a clear user mental model for each state.
- Omitting the drag handle entirely and expecting users to discover swipe-to-dismiss through trial and error.
- Stretching a modal bottom sheet to full screen width on a tablet — it should be capped and centered, or replaced with a dialog or side sheet.
- Nesting a sheet inside a sheet — a modal that triggers another modal bottom sheet creates deep dismissal confusion; promote to a new screen or use in-place content replacement.
- Using a sheet for a two-button confirmation when a dialog is the correct, simpler container.
- Placing destructive actions (Delete, Remove) at the top of a sheet without visual separation or a warning label; sheets lack the built-in destructive button styling that dialogs carry.
- Forgetting that the bottom navigation bar may be obscured by a peeking standard sheet — always test the peek height against nav bar height including gesture insets.

## References

- **Material 3 Guidelines:** [Bottom sheets overview](https://m3.material.io/components/bottom-sheets/overview)
- **Documentation:** [Compose UI components](https://developer.android.com/develop/ui/compose/components)

## See also

This skill covers design judgment only. For Compose implementation — `ModalBottomSheet`, `BottomSheetScaffold`, `SheetState`, nested scroll interop, and `sheetPeekHeight` — pair this with the relevant Compose components code skill. For decisions about when a bottom sheet should become a full-screen destination, see the M3 navigation design skill. For persistent side-navigation drawers (not side sheets), see the M3 navigation drawer design skill. For short two-action confirmations that belong in a dialog rather than a sheet, see the M3 dialogs design skill.
