---
name: hig-tab-bars
description: "Design critique and guidance for tab bars across iPhone, iPad, tvOS, and visionOS, grounded in Apple's Human Interface Guidelines. Use when reviewing or designing top-level navigation, deciding tabs vs sidebar vs hierarchical navigation, choosing how many tabs to show, pairing icons with labels, or adopting the iOS 26 floating Liquid Glass tab bar, the search tab role, or the iPad sidebar-adaptable pattern. Produces UX recommendations and review notes, not code."
tags: [hig, tab-bars, navigation, liquid-glass, ios, ipados]
x-skills-master:
  domain: apple
  class: design
  category: components
  platforms: [ios, ipados, tvos, visionos]
  pairs_with: [swiftui-tab-views]
  sources:
    - https://developer.apple.com/design/human-interface-guidelines/tab-bars
    - https://developer.apple.com/design/human-interface-guidelines/sidebars
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

A tab bar gives people fast, persistent access to the top-level, peer sections of an app. In the 2026 design cycle it renders as a floating, inset Liquid Glass element that lets content flow beneath it. Use this skill to critique whether a tab bar is the right navigation model, whether its contents read as destinations, and whether it adapts well across devices.

## When to use

- Reviewing or proposing the primary navigation for an app that has a small set of equally important, mutually exclusive sections.
- Deciding between a tab bar, a sidebar, and pushing/hierarchical navigation.
- Auditing tab count, icon and label clarity, or the new search tab and floating Liquid Glass behavior.
- Designing how navigation adapts between iPhone, iPad, tvOS, and visionOS, including the tab-bar-to-sidebar pattern.

## Core guidance

- **Use tabs only for top-level, peer destinations.** Each tab should be a place a person navigates to, not an action they perform. If a control creates, shares, or triggers a one-off task, it belongs in a toolbar or as a button, never as a tab.
- **Keep the set small and stable.** Aim for three to five tabs on iPhone; iPad and larger surfaces can carry a few more. Avoid a More overflow tab when you can; it hides destinations and signals the structure is too broad.
- **Always pair a clear glyph with a short label.** Use distinct, recognizable SF Symbols and concise noun labels. Don't rely on icon-only tabs, and don't let labels truncate, wrap, or shift between selected and unselected states.
- **Preserve each tab's state and selection.** Switching away and back should return people to where they were, including scroll position and in-tab navigation depth, so the bar feels like persistent context rather than a fresh start.
- **Treat the search tab as a distinct role, not a regular destination.** In iOS 26 the search tab sits visually separated at the trailing edge and can expand into a search field; reserve it for genuine search, and don't mix in primary actions that masquerade as search.
- **Design for the floating Liquid Glass bar.** The bar is inset, capsule-shaped, and translucent, and it can minimize on scroll to keep focus on content. Don't place critical content directly behind it where it could be obscured, and don't fight the system material with custom opaque backgrounds.
- **Choose tabs vs sidebar vs hierarchy deliberately.** Tabs suit a few flat sections; a sidebar suits many sections or nested groups on wide layouts; hierarchical navigation suits drilling into a single section. Don't duplicate the same destinations in both a tab bar and a sidebar at once.

## Platform notes

- **iOS / iPadOS:** The bar floats and minimizes on scroll. On iPad, prefer the sidebar-adaptable pattern so a tab bar can morph into a sidebar in landscape or wide windows and back into a tab bar in portrait or compact widths, keeping a single source of truth for sections. A bottom accessory (such as a now-playing strip) can ride above the tab bar when warranted.
- **tvOS:** The tab bar sits at the top of the screen and reveals on focus movement; keep labels legible from across the room and minimize the number of tabs so focus travel stays short.
- **visionOS:** Tabs appear in an ornament on the leading edge of the window rather than along the bottom; design glyphs that read well in depth and avoid crowding the ornament.

## Pitfalls

- Putting verbs or one-off actions (compose, add, share) in the tab bar instead of a toolbar.
- Exceeding five tabs on iPhone and relying on a More tab to absorb the rest.
- Icon-only tabs, vague or jargon labels, or labels that change wording between states.
- Treating the search tab as a generic slot for a primary action or unrelated feature.
- Hard-coding an opaque background that defeats the Liquid Glass material and the minimize-on-scroll behavior.
- Showing a tab bar and a sidebar simultaneously, or letting them present conflicting section sets.

## References

- **Human Interface Guidelines:** [Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
- **Human Interface Guidelines:** [Sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars)
- **WWDC:** [Meet Liquid Glass (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/219/)
- **WWDC:** [Elevate the design of your iPad app (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/208/)
- **Documentation:** [Elevating your iPad app with a tab bar and sidebar](https://developer.apple.com/documentation/uikit/elevating-your-ipad-app-with-a-tab-bar-and-sidebar)
- **Documentation:** [TabRole.search](https://developer.apple.com/documentation/swiftui/tabrole/search)

## See also

- **hig-sidebars** for the wide-layout navigation model the tab bar adapts into on iPad.
- **hig-toolbars** for where actions and verbs belong instead of the tab bar.
- **hig-navigation-bars** for hierarchical, drill-in navigation within a single tab.
- **swiftui-tabview** (and the UIKit `UITabBarController` code skill) for implementing the floating tab bar, the search tab role, and the sidebar-adaptable pattern.
