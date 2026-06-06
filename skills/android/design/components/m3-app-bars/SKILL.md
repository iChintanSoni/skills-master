---
name: m3-app-bars
description: "Design critique and Material 3 guidance for top app bars (small, center-aligned, medium, large) and the bottom app bar: choosing the right size, scroll behaviors, title and action placement, overflow menus, and how bars interact with FABs and navigation. Use when reviewing or designing an Android screen's top or bottom app bar, selecting between bar sizes and scroll behaviors, placing navigation icons and action items, or evaluating whether a bottom app bar is the right container for actions and a FAB."
tags: [m3, design, app-bars, navigation, android]
x-skills-master:
  domain: android
  class: design
  category: components
  platforms: ["android", "large-screen"]
  pairs_with: []
  sources:
    - https://m3.material.io/components/top-app-bar/overview
    - https://developer.android.com/develop/ui/compose/components/app-bars
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

- Selecting a top app bar variant (small, center-aligned, medium, or large) for a given screen and its content density.
- Deciding how the bar should react to scrolling — whether to stay pinned, hide, collapse, or compress a large title.
- Placing the navigation icon, headline, and trailing action items at the right prominence level.
- Evaluating whether to surface an overflow menu (three-dot) vs. promoting actions to the bar.
- Deciding between a top app bar and a bottom app bar, and whether a FAB should anchor next to or inside the bottom bar.

## Core guidance

### Top app bar size and hierarchy

- **Match bar size to the weight of the screen's content.** Use a small bar for utility or secondary screens where the content itself carries the focus; use a medium or large bar on root or category screens where orienting the user matters more than content density.
- **Center-aligned small bars belong on focused single-subject screens.** The center-aligned variant (using `CenterAlignedTopAppBar`) suits article readers, detail pages, and product screens — it frames a single subject and signals "this is a leaf." Do not use it on list screens with many items competing for attention, where a leading-aligned title reads as a section header.
- **Reserve medium and large bars for destination-level screens.** A medium bar (`MediumTopAppBar`) gives the headline moderate prominence; a large bar (`LargeTopAppBar`) gives it maximum prominence. Both are appropriate on root screens — home, inbox, gallery — where users need grounding. Avoid them on transient or deeply nested screens; a large bar on a detail nested three levels deep confuses hierarchy.
- **Never mix a long title with the small variant.** Small bars (`TopAppBar`) clip long titles with an ellipsis. If a title routinely needs more than two words, step up to medium or large, which wrap and display multi-line headlines naturally.

### Scroll behaviors

- **Pin small bars when users need persistent navigation.** A pinned small bar keeps the nav icon and primary action always accessible — good for chat screens, code editors, or any context where users need a quick back-or-menu escape. Use `TopAppBarDefaults.pinnedScrollBehavior()`.
- **Collapse medium and large bars to reveal content.** Both medium and large bars benefit from `TopAppBarDefaults.enterAlwaysScrollBehavior()` or `exitUntilCollapsedScrollBehavior()`. The "exit until collapsed" pattern is preferred: the bar compresses to a small bar on scroll-down and re-expands on scroll-up, so the title returns to large when the user is at the top. This gives context at the start of a list and maximizes reading space mid-scroll.
- **Use enter-always only when content warrants constant re-orientation.** Enter-always re-expands the bar on any upward scroll, which can feel intrusive in feeds. Reserve it for paged content (carousels, step flows) where context reset on each page-up is desirable.
- **Do not combine a collapsing large bar with a pinned FAB.** A FAB pinned in the center of the screen while a large bar collapses above it creates competing focal points. Anchor the FAB to the bottom bar or use a bottom-right fixed position and let the top bar own hierarchy at the top.

### Navigation icons and actions

- **The leading navigation icon has one job: get the user back or open the menu.** The nav icon in `TopAppBar`'s `navigationIcon` slot is either an up-arrow (back navigation) or a hamburger/rail-menu opener. Do not place a logo, search trigger, or avatar there — those belong in the title or trailing actions.
- **Limit trailing actions to two, then overflow.** Material 3 recommends at most two `IconButton` actions in the trailing area (`actions` slot). A third visible action (a search, filter, or sort) is acceptable only when all three are equally important and used frequently. Everything else goes into an overflow menu (`DropdownMenu`) triggered by a three-dot icon. Overflowing rarely used actions keeps the bar clean and reduces cognitive load.
- **Promote the most-used action, not the most powerful one.** Destructive or irreversible actions (delete, archive) belong in the overflow menu, even if they are common. Actions with immediate undo or low risk (search, share, filter) earn the primary action slots.
- **Overflow menus use `DropdownMenu`.** The overflow icon is a standard vertical three-dot `IconButton`. Menu items should be text labels, not icons alone — icons in overflow menus lose the label context that makes the choice legible.

### Titles and headlines

- **The headline is a location label, not a marketing phrase.** It should match how users refer to the screen ("Inbox," "Settings," "John's Profile") rather than brand copy. Sentence case is correct for M3; avoid ALL CAPS headlines in bars.
- **Large and medium bar headlines can wrap.** Unlike small bars, medium and large bars accommodate two-line titles. Use this intentionally for long destination names (e.g., "Privacy and Security Settings") rather than forcing a truncated single line.
- **Do not put subtitles in top app bars.** If the screen needs a subtitle, place it as a `Text` below the main content's first heading, not in the bar itself. A subtitle in the bar reduces space for actions and can crowd the nav icon.

### Bottom app bar

- **Use the bottom app bar when actions are primary and thumbs are the main input.** The `BottomAppBar` is for screens where the user's primary interaction is triggering actions — a drawing tool, a messaging composer, a document editor — not for navigation. It is not a tab bar replacement.
- **Pair a bottom app bar with a FAB by embedding the FAB in the bar's `floatingActionButton` slot.** Embedding the FAB visually groups the primary action with its supporting secondary actions and prevents the FAB from floating orphaned above the bar. When a FAB is embedded, the bar naturally notches or aligns to create one cohesive control surface.
- **Do not put navigation into a bottom app bar.** If you need a bottom-level navigation pattern, use `NavigationBar` (M3's nav bar) instead. The bottom app bar's action icons should be contextual to the current screen — they change with the content, whereas navigation items are always global.
- **Keep icon actions in the bottom bar unlabeled or provide content descriptions.** Bottom app bar icons appear in the `actions` composable slot. They should have `contentDescription` for accessibility. If three or more unlabeled icons could be ambiguous, prefer a labeled `NavigationBar` or promote one action to a labeled `TextButton` in the bar.

## Platform notes

- **Compact phones (small window class):** All four top bar variants work well. Large bars shine on root screens with scrollable lists. Bottom app bars with embedded FABs are especially effective here — the FAB is always in thumb reach without the user shifting grip.
- **Medium screens and foldables:** On medium window sizes, a navigation rail typically replaces the hamburger-menu nav icon in the top bar; the nav icon can be hidden or replaced with a rail-toggle. Large and medium bars still work for content screens in the detail pane of a two-pane layout.
- **Large screens and tablets (expanded window class):** On expanded screens, the `NavigationDrawer` is the primary navigation surface. Top app bars in the detail pane should be small or center-aligned — a large bar in a narrow detail column looks oversized. The bottom app bar is rarely appropriate on large screens because thumb-reach is not a constraint; prefer toolbar patterns embedded in the content area.
- **Wear and TV:** M3 app bars are a mobile/tablet component. Wear OS has its own `ScaffoldTop` pattern and auto-scrolling title behavior; TV has no direct equivalent — avoid mapping mobile app bar patterns to these platforms.

## Pitfalls

- Using a large top bar on deeply nested or modal screens, which misrepresents hierarchy and makes simple dialogs feel like root destinations.
- Putting more than two trailing action icons without an overflow, causing the bar to overflow or icons to become too small to tap.
- Using the bottom app bar as a tab or navigation bar — it is an action surface, not a navigation surface.
- Choosing a center-aligned bar for list or feed screens, where the title reads as a floating caption rather than a section anchor.
- Adding a subtitle or secondary label inside the bar, crowding out the action area.
- Using enter-always scroll behavior on feed or article screens, where re-expanding the bar on every minor upward scroll interrupts reading flow.
- Placing destructive actions (delete, clear all) in the primary action slots of the bar — overflow them to reduce accidental activation.
- Omitting `contentDescription` on icon-only actions, making the bar inaccessible for screen reader users.
- Floating a FAB separately when a `BottomAppBar` already exists on the screen, creating competing focal points at the bottom edge.

## References

- **Material 3 Guidelines:** [Top app bar overview](https://m3.material.io/components/top-app-bar/overview)
- **Documentation:** [App bars in Jetpack Compose](https://developer.android.com/develop/ui/compose/components/app-bars)
- **Material 3 Guidelines:** [Bottom app bar](https://m3.material.io/components/bottom-app-bar/overview)
- **Material 3 Guidelines:** [Navigation bar](https://m3.material.io/components/navigation-bar/overview)
- **Material 3 Guidelines:** [Floating action button](https://m3.material.io/components/floating-action-button/overview)

## See also

- The M3 navigation design skill covers `NavigationBar` and `NavigationRail` — use it when deciding whether bottom-edge chrome should carry navigation tabs instead of a bottom app bar.
- The M3 FAB design skill addresses FAB prominence, size variants, and extended FABs — relevant when choosing how a FAB relates to an embedded bottom app bar.
- The M3 menus design skill covers `DropdownMenu` construction and overflow-menu design, complementing the overflow guidance here.
- The `android-compose-components` code skill (or equivalent M3 Compose implementation skill) translates this guidance into `TopAppBar`, `CenterAlignedTopAppBar`, `MediumTopAppBar`, `LargeTopAppBar`, `BottomAppBar`, and their scroll behavior APIs.
