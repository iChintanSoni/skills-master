---
name: swiftui-tab-views
description: "Builds SwiftUI tab navigation with the type-safe Tab API, programmatic selection, the search role, the sidebar-adaptable style, paged TabView, and reorderable tabs. Use when adding a tab bar, wiring deep links to a selected tab, supporting iPad sidebar layouts, or adopting iOS 26 tab bar minimize and bottom-accessory behavior."
globs:
  - "**/*.swift"
tags: [swiftui, tabview, navigation, ipados, liquid-glass]
x-skills-master:
  domain: apple
  class: code
  category: app-frameworks
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  requires:
    ios: "17"
    swift: "6.0"
  pairs_with: [hig-tab-bars]
  sources:
    - https://developer.apple.com/documentation/SwiftUI/TabView
    - https://developer.apple.com/documentation/SwiftUI/Enhancing-your-app-content-with-tab-navigation
    - https://developer.apple.com/documentation/SwiftUI/TabViewStyle/sidebarAdaptable
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for `TabView` when an app exposes a small, flat set of peer destinations that a person switches between freely — Home, Search, Library, Profile. It is the wrong tool for hierarchical drill-down (use `NavigationStack` inside each tab) or for a transient mode switch (use a `Picker` or segmented control). On iPad and Mac the same tab declaration can present as a sidebar, so prefer `TabView` over a hand-rolled split view when the destinations are genuinely top-level.

Use this skill when migrating older `tabItem`-based code to the value-based `Tab` API, when a tab must be selected from a deep link or notification, or when adopting the iOS 26 Liquid Glass tab bar (minimize-on-scroll, bottom accessory).

## Core guidance

- **Prefer the `Tab` builder over `.tabItem`.** On iOS 18 and later, declare each tab as `Tab("Title", systemImage:, value:) { ... }`. It is type-safe, drives selection through a stable `value`, and unlocks sidebar adaptation and customization. The `.tabItem` modifier still works but cannot participate in those features.
- **Type the selection, don't index it.** Bind `selection` to an enum or `Hashable` model id, not an `Int`. Integer indices silently break when you reorder or conditionally include tabs; a typed value stays correct.
- **Mark the search destination with `role: .search`.** A `Tab(value:, role: .search)` is positioned and styled specially by the system (separated on the tab bar, surfaced in the sidebar), so don't fake it with a plain tab plus a magnifying-glass icon.
- **Group with `TabSection` and adapt with `.sidebarAdaptable`.** Wrapping tabs in `TabSection("Header")` plus `.tabViewStyle(.sidebarAdaptable)` yields a flat tab bar on iPhone and a sectioned sidebar on iPad and Mac from one declaration.
- **Opt into reordering explicitly.** Attach `.tabViewCustomization($customization)` and persist the `TabViewCustomization` with `@AppStorage` (it is `Codable`) so user-hidden and reordered tabs survive relaunch. Customization only applies under `.sidebarAdaptable`.
- **Don't overload `.page` style.** Paged `TabView(.tabViewStyle(.page))` is for swipeable carousels (onboarding, photo galleries), not primary navigation — it has no labels and no selection affordance.
- **Embed a `NavigationStack` per tab, never around the `TabView`.** Each tab owns its navigation state; a single outer stack collapses the tabs.

```swift
enum Section: Hashable { case home, library, search }

struct RootView: View {
    @State private var selection: Section = .home

    var body: some View {
        TabView(selection: $selection) {
            Tab("Home", systemImage: "house", value: .home) { HomeView() }
            Tab("Library", systemImage: "books.vertical", value: .library) { LibraryView() }
            Tab(value: .search, role: .search) { SearchView() }
        }
        .tabViewStyle(.sidebarAdaptable)
    }
}
```

## Platform notes

- **iPadOS / macOS:** `.sidebarAdaptable` shows a floating top tab bar on iPad that promotes into a sidebar; `TabSection` headers appear only in the sidebar form. On Mac the style renders as a sidebar by default. Use `.defaultAdaptableTabBarPlacement(_:)` to nudge the initial presentation.
- **iOS 26 (Liquid Glass):** Add `.tabBarMinimizeBehavior(.onScrollDown)` to collapse the tab bar to the active tab as content scrolls. Place a persistent control (e.g., a now-playing strip) with `.tabViewBottomAccessory { ... }`, and read `tabViewBottomAccessoryPlacement` from the environment to switch between `.inline` and `.expanded` layouts.
- **watchOS / tvOS:** `TabView` defaults to a paged, vertical (watchOS) or top-aligned (tvOS) presentation; the search role and sidebar style are iOS/iPadOS/macOS concepts and are ignored elsewhere.
- **visionOS:** Tabs render as an ornament alongside the window; the same `Tab` declaration works without change.

## Pitfalls

- **Integer selection after reordering.** If `selection` is an `Int` and you let users reorder or hide tabs, the bound index points at the wrong destination. Always select by `value`.
- **Customization with no effect.** `.tabViewCustomization` does nothing unless the style is `.sidebarAdaptable` and each `Tab` has a stable `value`; an unstable value resets the saved layout on every launch.
- **Conditionally building tabs inside the closure.** Branching with `if` to add or remove tabs changes their identity and can reset selection. Prefer a stable set of tabs and toggle content, or give each a constant `value`.
- **Wrapping the whole `TabView` in one `NavigationStack`.** This breaks per-tab back stacks and state restoration.
- **Assuming `.page` shows labels.** The page style discards tab labels entirely; if you need both swiping and a visible bar, you are building two different things.
- **Forgetting `role: .search` placement.** Adding a search tab as an ordinary tab on iPhone leaves it inline instead of in the system's dedicated search position.

## References

- **Documentation:** [TabView](https://developer.apple.com/documentation/SwiftUI/TabView)
- **Documentation:** [Enhancing your app's content with tab navigation](https://developer.apple.com/documentation/SwiftUI/Enhancing-your-app-content-with-tab-navigation)
- **Documentation:** [sidebarAdaptable style](https://developer.apple.com/documentation/SwiftUI/TabViewStyle/sidebarAdaptable)
- **Documentation:** [TabViewCustomization](https://developer.apple.com/documentation/SwiftUI/TabViewCustomization)
- **Human Interface Guidelines:** [Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
- **WWDC:** [Elevate your tab and sidebar experience in iPadOS (WWDC24)](https://developer.apple.com/videos/play/wwdc2024/10147/)

## See also

Pair this with the hig-tab-bars design skill for the human-interface rules on how many tabs to show, labeling, and badging. For the navigation that lives inside each tab, see a swiftui-navigation-stack skill; for the iPad-specific split layouts that a sidebar-adaptable tab view can replace, see a swiftui-navigation-split-view skill. For adopting the broader iOS 26 visual system referenced in the platform notes, see a swiftui-liquid-glass skill.
