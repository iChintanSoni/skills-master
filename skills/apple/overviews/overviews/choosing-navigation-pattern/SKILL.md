---
name: choosing-navigation-pattern
description: "Decision guide for selecting a SwiftUI navigation container: TabView for peer sections, NavigationStack for push hierarchies, NavigationSplitView for multi-column iPad/Mac, and sheets or full-screen covers for modal tasks. Use when starting a new screen flow, restructuring an app's top-level shell, deciding between a stack and a split view, or unsure where modals fit — routes into deeper swiftui-navigation work."
tags: [swiftui, navigation, tabview, ipad, architecture]
x-skills-master:
  domain: apple
  class: overview
  category: overviews
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  pairs_with: []
  sources:
    - https://developer.apple.com/documentation/swiftui/migrating-to-new-navigation-types
    - https://developer.apple.com/documentation/swiftui/navigation
    - https://developer.apple.com/documentation/SwiftUI/Enhancing-your-app-content-with-tab-navigation
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

# Choosing a navigation pattern

## When to use

Reach for this when you are laying out an app's top-level shell or a new screen flow and need to pick the right container before writing destinations. It answers "tabs, stack, split, or modal?" and hands off to focused navigation work once the shape is settled. Use it whenever a flow feels like it is fighting the container — for example, a tab that keeps a stale stack, or a split view collapsing wrong on iPhone.

## Core guidance

- **Map the relationship first.** Peer, equally-important destinations a person switches among → `TabView`. A drill-down where each screen depends on the last → `NavigationStack`. A persistent list-plus-detail relationship → `NavigationSplitView`. A self-contained, interruptive task → a modal.
- **Compose, don't nest blindly.** The durable pattern is a `TabView` (or `NavigationSplitView`) at the root, with an independent `NavigationStack` *inside each tab or detail column*. Each branch owns its own path so switching tabs preserves depth.
- **Do drive pushes by value, not by Boolean.** Use `NavigationLink(value:)` plus `navigationDestination(for:)`, and bind a `[Route]` or `NavigationPath` for programmatic control, deep links, and state restoration. Avoid the legacy `NavigationView` and `isActive` links.
- **Let `NavigationSplitView` adapt.** It automatically collapses to a stack on compact widths (iPhone, narrow iPad windows). Don't hand-build separate iPhone and iPad shells; one split view covers both.
- **Don't put a `NavigationStack` around a `NavigationSplitView`** — the split view is itself a top-level container. Stacks live inside its columns, not wrapping it.
- **Use modals for focus, not for hierarchy.** `sheet` for a quick task that returns to context (add `presentationDetents` for resizable cards); `fullScreenCover` for immersive or onboarding flows that must own the screen. Always offer an explicit dismiss path.
- **One source of truth for selection.** Tab selection and stack paths should be observable state your model owns, so deep links and restoration mutate one value.

## Platform notes

- **iPadOS / macOS:** Prefer `NavigationSplitView` for content-rich apps. Set `.tabViewStyle(.sidebarAdaptable)` so a tab bar promotes to a sidebar on iPad, grouping peers with `TabSection`. On Mac, the split view's sidebar is idiomatic.
- **iOS 26 / the 26 cycle:** The Liquid Glass tab bar floats over content and a `Tab(role: .search)` is visually separated and morphs into a search field. Keep tab counts low so the bar stays legible.
- **watchOS:** Favor a vertical `TabView` or a shallow `NavigationStack`; avoid split views and deep hierarchies.
- **tvOS:** Tabs render as a top bar; keep navigation broad and shallow for focus-engine traversal.
- **visionOS:** `NavigationSplitView` and tabs (ornament-style) both adapt to windows; modals appear as separate, depth-offset planes.

## Pitfalls

- Wrapping every tab's content in one shared `NavigationStack` — switching tabs then leaks navigation depth between sections. Give each tab its own stack.
- Using `NavigationSplitView` on an iPhone-only app where a plain `NavigationStack` is simpler; the split view's collapse behavior adds nothing if there is no wide layout.
- Stacking modals on modals to fake hierarchy. If a sheet pushes another sheet pushing a third, you wanted a `NavigationStack`.
- Mixing value-based `navigationDestination` with old Boolean `NavigationLink(isActive:)` in the same flow — pick the data-driven style throughout.
- Forgetting `presentationDetents` on a sheet that only needs half the screen, leaving an oversized card that buries the underlying context.

## References

- **Documentation:** [Navigation (SwiftUI)](https://developer.apple.com/documentation/swiftui/navigation)
- **Documentation:** [Migrating to new navigation types](https://developer.apple.com/documentation/swiftui/migrating-to-new-navigation-types)
- **Documentation:** [Enhancing your app's content with tab navigation](https://developer.apple.com/documentation/SwiftUI/Enhancing-your-app-content-with-tab-navigation)
- **Documentation:** [Modal presentations](https://developer.apple.com/documentation/swiftui/modal-presentations)
- **WWDC:** [The SwiftUI cookbook for navigation (WWDC22)](https://developer.apple.com/videos/play/wwdc2022/10054/)
- **WWDC:** [Elevate your tab and sidebar experience in iPadOS (WWDC24)](https://developer.apple.com/videos/play/wwdc2024/10147/)

## See also

Once the container is chosen, hand off to *swiftui-navigation* for value-driven destinations, typed routes, and path management. For the modal mechanics — detents, dismissal, and `fullScreenCover` — see *swiftui-modal-presentation*. For adaptive iPad and Mac layouts around a split view, pair with *swiftui-adaptive-layout*, and for restoring tab selection and stack depth across launches see *swiftui-state-restoration*.
