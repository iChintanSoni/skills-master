---
name: m3-tabs
description: "Design critique and guidance for Material 3 tabs on Android, covering primary vs secondary tabs, fixed vs scrollable layout, when tabs complement or replace a navigation bar, label and icon conventions, and content-switching expectations. Use when reviewing or designing in-page navigation, choosing between primary and secondary tab styles, deciding on fixed vs scrollable tab layout, or determining whether tabs are the right component for a given navigational context."
tags: [m3, design, tabs, navigation, android, material-you]
x-skills-master:
  domain: android
  class: design
  category: components
  platforms: ["android", "large-screen"]
  pairs_with: []
  sources:
    - https://m3.material.io/components/tabs/overview
    - https://developer.android.com/develop/ui/compose/components
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

- Reviewing or proposing in-page navigation where content divides into a small number of related, peer groups (for example: All / Unread / Starred).
- Deciding between primary tabs and secondary tabs, and when tabs should appear alongside or instead of a bottom navigation bar.
- Auditing whether a tab bar has the right number of tabs, clear labels, appropriate icons, and whether content switching feels responsive.
- Designing how tabs adapt from compact phones to large screens and foldables.

## Core guidance

- **Reserve tabs for content filtering or sectioning within a single screen.** Tabs are not top-level navigation. If a tab switches the user to a wholly different section of the app, a navigation bar or navigation drawer is more appropriate. Tabs should feel like choosing a view of the same underlying content.

- **Choose primary tabs for top-of-screen, page-level sections.** Primary tabs sit directly below the app bar and use a prominent bottom-indicator to show the active tab. They set the visual hierarchy for the entire screen content area. Use the Compose `TabRow` or `ScrollableTabRow` composable with `Tab` children for this pattern.

- **Use secondary tabs only for sub-sections beneath primary tabs.** Secondary tabs are smaller, lighter-weight, and use a filled pill indicator instead of a line. They are designed to nest beneath a primary tab row when content has a two-level hierarchy. Avoid placing secondary tabs at the top of a screen without a primary row above them — they lack the visual weight to anchor a full screen.

- **Prefer fixed tabs when you have two to four short labels.** Fixed tabs divide available width equally and keep all options visible without scrolling. They require every label to be concise — long labels in a fixed row compress awkwardly and may truncate on smaller phones. If any single tab label would wrap or clip, switch to scrollable.

- **Switch to scrollable tabs when labels are long or there are more than four tabs.** Scrollable tabs let each tab take the width its label needs, and users can swipe horizontally to reveal more. Start the row scrolled so the first tab is visible at the leading edge. Never use more tabs than a user can meaningfully distinguish — if you have more than seven or eight, consider a different navigational pattern such as a chip filter row.

- **Combine icons with labels or use labels alone; avoid icon-only tabs.** Icons reinforce meaning but the label is the primary identification mechanism. Icon-only tabs omit critical context and create accessibility gaps. When using both icon and label, keep them vertically stacked and ensure the icon is a recognizable symbol for the content — not a generic shape chosen for aesthetic reasons.

- **Highlight the active tab with the indicator, not by changing the icon or label.** Only the indicator and the text/icon color should differ between selected and unselected states. Changing icon shape, label wording, or weight between states is confusing and inconsistent with M3 expectations.

- **Tabs and a navigation bar can coexist, but the combination needs clear separation of purpose.** The navigation bar navigates between top-level destinations; the tab row filters or sections content within one of those destinations. Both should never perform the same kind of navigational role on the same screen. If the tab row would simply duplicate what the navigation bar already segments, remove the tab row.

- **Switch content immediately and without full-screen transitions.** When a user taps a tab, the content area beneath should update instantly or with a subtle cross-fade. Long loading states that appear after a tab tap erode trust in the component's responsiveness. If content for a tab must be fetched, show a placeholder or skeleton inline rather than blocking the tab tap.

- **Provide adequate touch targets.** Each tab should be at least 48 dp tall. In fixed layouts, ensure no tab is narrower than 90 dp. Tabs that are too narrow or too short create difficult tap targets, especially for users with motor impairments.

- **Maintain tab state across interactions where meaningful.** If a user taps a tab, scrolls the content, taps a different tab, and returns, the scroll position in the first tab should be preserved. Discarding in-tab state causes disorientation and unnecessary repeated effort.

- **Surface the most important or default tab first.** Left-to-right reading order means the leading tab receives the most attention. For left-to-right locales place the default or most-used category at position one. Mirror this appropriately for right-to-left locales.

## Platform notes

- **Compact phones:** Fixed tabs work well for two to three short labels filling the screen width. Scrollable tabs handle longer or more numerous labels — set the initial scroll offset so the first tab is fully visible and partially reveal the second to signal scrollability. Do not crowd the row; a clipped fourth tab peeking into the viewport is a useful affordance but a fully hidden tab with no visual hint is a usability failure.

- **Large screens and foldables (expanded width):** On screens wider than roughly 840 dp, fixed tabs should not stretch indefinitely. Tabs in an expanded layout should be left-aligned or constrained to a maximum-width container rather than spanning the full window width, which would produce excessively wide tap zones and visual imbalance. Consider whether a persistent navigation rail or drawer serves the same role with better ergonomics on a large screen, relegating tabs to sub-section filtering only.

- **Foldables in table-top / book posture:** The top half of the screen may act as a header area. Placing a tab row at the fold boundary or directly above it aligns with where the thumb naturally rests, but verify that the content area below the fold is tall enough to render meaningful content for each tab.

- **Wear OS:** The tabs component is not used on Wear OS. Paged layouts or a vertical scrollable list are preferred. Do not carry phone tab patterns to watch faces.

- **Android TV:** Tabs are rarely appropriate on TV. Focus-based navigation favors row/column grids. If section switching is needed, consider a top-level focused header row rather than a Material tab row.

## Pitfalls

- Using tabs as top-level navigation when a navigation bar or drawer is the correct component.
- Placing secondary tabs at the top of a screen without a primary row above them — they lack the visual weight to anchor a page.
- Icon-only tabs that omit labels, creating accessibility and comprehension gaps.
- Choosing fixed layout with long or numerous labels, causing truncation or extreme compression.
- More than seven or eight tabs in a scrollable row — the component becomes a search problem, not a navigation aid.
- Blocking the content area with a full-screen loading state after a tab tap instead of showing inline placeholders.
- Stretching fixed tabs across the full width of a large-screen expanded layout.
- Duplicating the purpose of the navigation bar with tabs on the same screen — both sectioning the same level of the information hierarchy.
- Changing icon shape or label wording between selected and unselected states instead of relying solely on the indicator and color change.
- Discarding scroll position and in-tab navigation state when a user switches tabs and returns.

## References

- **Material 3 Guidelines:** [Tabs overview](https://m3.material.io/components/tabs/overview)
- **Documentation:** [Jetpack Compose UI components](https://developer.android.com/develop/ui/compose/components)

## See also

The m3-navigation-bar design skill covers when a bottom navigation bar is more appropriate than tabs for top-level destination switching. The m3-navigation-drawer design skill addresses wide-layout navigation alternatives. For chip-based filtering that can replace a short tab row when options are more dynamic, see the m3-chips design skill. The Jetpack Compose code skill for Material 3 components covers implementing `TabRow`, `ScrollableTabRow`, and `Tab` composables, including state hoisting and pager integration.
