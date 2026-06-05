---
name: hig-sidebars
description: "Design critique and HIG guidance for sidebars on iPad, Mac, and Vision Pro. Use when reviewing or designing top-level navigation, deciding sidebar vs. tab bar, sectioning destinations with headers, handling selection state, collapse/show behavior, or the sidebar-adaptable relationship with floating tab bars in the Liquid Glass era. Produces UX recommendations, not code."
tags: [sidebars, navigation, ipados, macos, visionos]
x-skills-master:
  domain: apple
  class: design
  category: components
  platforms: [ipados, macos, visionos]
  pairs_with: []
  sources:
    - https://developer.apple.com/design/human-interface-guidelines/sidebars
    - https://developer.apple.com/design/human-interface-guidelines/tab-bars
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Use this skill when critiquing or designing a sidebar on iPad, Mac, or Vision Pro — the leading-edge column that lets people move between an app's sections. Reach for it when deciding whether a destination belongs in a sidebar versus a tab bar, how to group and label sections, how selection should read, whether the sidebar should collapse, and how the sidebar relates to a floating tab bar under the Liquid Glass (the "26" cycle) design system. This skill produces design judgment and critique, not implementation.

## Core guidance

- **Do use a sidebar for flat, top-level navigation plus shallow hierarchy.** It excels at giving quick access to peer destinations and surfacing user collections (folders, playlists, mailboxes). Don't bury primary tasks several taps deep inside it — a sidebar is a directory, not a settings drawer.
- **Do prefer the sidebar-adaptable pattern on iPad.** Define destinations once; let the system show a floating tab bar in compact contexts and a sidebar in regular width. Don't ship a sidebar that has no tab-bar counterpart on iPad — people expect to collapse it back into the tab bar to refocus on content.
- **Do group destinations into a few short, scannable sections with clear headers.** Headers are organizational labels, not tappable rows — make that visually unambiguous. Don't over-section: many tiny groups create more scanning work than they save.
- **Do make the current selection unmistakable.** A single persistent highlight that survives scrolling tells people where they are. Don't show multiple simultaneous selections, and don't let the highlight visually compete with Liquid Glass refraction behind the column.
- **Do let content extend edge-to-edge beneath the inset, glass sidebar.** Sidebars now float as a Liquid Glass layer with content flowing behind them for an immersive feel. Don't fight this with an opaque slab or heavy borders that sever the sidebar from the content it navigates.
- **Do support collapse/show and remember the state.** Collapsing should animate the sidebar away to return focus to content; on iPad it folds back into the tab bar. Don't auto-collapse on every navigation or hide the only path to a destination behind a closed sidebar.
- **Do allow customization where it earns its keep.** Pinning, reordering, and dragging items between sidebar and tab bar reward power users. Don't make customization mandatory to reach core destinations, and keep sensible defaults for everyone else.
- **Do keep labels short and lead with recognizable symbols.** Concise nouns plus consistent SF Symbols speed scanning. Don't mix verbs and nouns, truncate long titles, or use decorative icons that don't map to a clear meaning.

## Platform notes

- **iPadOS:** The sidebar and the floating tab bar are two faces of one navigation system. In regular width the sidebar offers room for collections and customization; collapsing it returns to the tab bar over full-bleed content. Honor orientation and multitasking width changes gracefully.
- **macOS:** Sidebars are a long-standing convention for three-column and source-list layouts. People expect to toggle the sidebar from the toolbar, resize it, and find consistent selection behavior. Lean on standard sidebar item styling rather than inventing custom rows.
- **visionOS:** Top-level navigation typically lives in an ornament on the window's leading edge rather than an inline column, keeping controls off the content. Reserve a full sidebar for genuinely deep hierarchies, and respect spatial layering so the navigation never occludes content.

## Pitfalls

- Treating the sidebar as a catch-all for every feature, turning navigation into an overwhelming list.
- Shipping a sidebar with no tab-bar equivalent on iPad, so people lose the compact, content-first path.
- Section headers that look tappable, or so many sections that scanning is harder than a flat list.
- Ambiguous or duplicated selection state that leaves people unsure where they are.
- Opaque, heavily bordered sidebars that defeat the Liquid Glass intent of content flowing behind an inset column.
- Auto-collapsing aggressively or stranding a destination behind a hidden sidebar with no other route.

## References

- **Human Interface Guidelines:** [Sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars)
- **Human Interface Guidelines:** [Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
- **WWDC:** [Get to know the new design system (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/356/)
- **WWDC:** [Elevate your tab and sidebar experience in iPadOS (WWDC24)](https://developer.apple.com/videos/play/wwdc2024/10147/)
- **Documentation:** [Elevating your iPad app with a tab bar and sidebar](https://developer.apple.com/documentation/uikit/elevating-your-ipad-app-with-a-tab-bar-and-sidebar)

## See also

- **hig-tab-bars** — for the floating, glass tab bar that pairs with the sidebar in the sidebar-adaptable model; review both together when deciding where a destination lives.
- **hig-split-views** — for the multi-column layouts a sidebar most often drives on iPad and Mac.
- **hig-liquid-glass** — for the material and layering principles behind the inset, content-aware sidebar appearance.
- **swiftui-navigation** (the SwiftUI/UIKit code skill) — implements these patterns with TabView, Tab, and TabSection in SwiftUI, or UITabBarController, UITab, and UITabGroup in UIKit.
