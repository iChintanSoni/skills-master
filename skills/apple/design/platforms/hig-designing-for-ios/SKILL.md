---
name: hig-designing-for-ios
description: "Design critique and guidance for iPhone apps grounded in Apple's Human Interface Guidelines and the iOS 26 Liquid Glass design system. Use when reviewing or designing an iOS layout, navigation, gestures, or touch ergonomics; when deciding between tab bars and navigation stacks; when checking reachability, the home indicator, system gestures, Dynamic Type, or dark mode; or when adopting floating Liquid Glass tab bars and glass toolbars. Produces UX recommendations and review notes, not code."
tags: [ios, hig, navigation, accessibility, liquid-glass]
x-skills-master:
  domain: apple
  class: design
  category: platforms
  platforms: [ios]
  pairs_with: []
  sources:
    - https://developer.apple.com/design/human-interface-guidelines/designing-for-ios
    - https://developer.apple.com/design/human-interface-guidelines/tab-bars
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Use this skill to critique or shape an iPhone interface against the HIG and the iOS 26 "Liquid Glass" design cycle. It applies when:

- Reviewing a screen for touch ergonomics, reachability, and one-handed use.
- Choosing a top-level navigation model (tab bar vs. navigation stack vs. modal).
- Auditing how the design respects system gestures and the home indicator.
- Verifying Dynamic Type, dark mode, and safe-area behavior.
- Adopting floating Liquid Glass tab bars, glass toolbars, and bottom accessories.

This skill yields design judgment and review notes. It does not produce SwiftUI/UIKit code — name the implementing component in prose instead.

## Core guidance

- **Design for the thumb, top-down.** Put primary, frequent actions in the lower, reachable zone and reserve the top for titles and infrequent controls. Don't bury a key action in a far top corner where one-handed users can't reach it.
- **Respect the touch budget.** Keep tappable targets at least 44×44 pt with comfortable spacing; don't crowd small controls or place them flush against screen edges where the system claims the gesture.
- **Defer to system gestures and the home indicator.** Don't override edge swipes (back, Control Center, App Switcher) except in rare immersive cases like games; never hide, recolor, or place interactive controls under the home indicator.
- **Pick navigation by intent.** Use a tab bar only for persistent, peer top-level sections; use a navigation stack for drilling into a hierarchy; use modals for focused, self-contained tasks. Don't stuff settings or one-off destinations into tabs.
- **Let content lead and Liquid Glass float.** Treat the floating, translucent tab bar and glass toolbars as a navigation layer that sits above content, not as chrome that boxes it in. Let it minimize on scroll so content gets full focus, and don't fight the material with opaque custom backgrounds.
- **Earn hierarchy through depth, not just contrast.** The new system signals importance via translucency, layering, and a single prominent accent. Avoid stacking many tinted glass surfaces, which muddies legibility — keep one clear focal control per context.
- **Make every text style Dynamic Type-ready.** Design layouts that reflow and grow at the largest accessibility sizes without truncation or clipping; don't lock text to fixed point sizes or assume a single line.
- **Honor light and dark.** Use semantic system colors and materials so surfaces, separators, and glass adapt automatically; don't hardcode hex values that break contrast or vibrancy when the appearance flips.

## Platform notes

- **iOS 26 / Liquid Glass:** Tab bars are now capsule-shaped, inset from the edges, and float over scrolling content; they can compact to just the active tab on scroll and re-expand on scroll-up. A bottom accessory (a "shelf" above the tab bar, e.g. a now-playing strip) can persist across tabs and blends into the bar when it minimizes.
- **Toolbars and nav bars** are transparent with glass buttons, ceding more room to content. Group related toolbar items and avoid overloading a single bar.
- **Devices and safe areas:** Account for the Dynamic Island / sensor housing and the home indicator via safe areas; never draw essential content or controls into those regions.
- **Search** has a defined home on iPhone (often a bottom-aligned field in the new design) — follow the platform placement rather than inventing a custom search affordance.

## Pitfalls

- Treating the floating tab bar as a container and pinning custom backgrounds or borders behind it, defeating the glass effect.
- Using a tab bar with too many items or with non-peer destinations (settings, profile detail) that belong in a stack or menu.
- Custom edge-swipe gestures that collide with system back/Control Center, frustrating navigation.
- Fixed-size text and tight rows that clip or truncate at large Dynamic Type sizes.
- Hardcoded colors that fail contrast or lose vibrancy in dark mode.
- Stacking multiple translucent/tinted layers so foreground controls lose legibility.

## References

- **Human Interface Guidelines:** [Designing for iOS](https://developer.apple.com/design/human-interface-guidelines/designing-for-ios)
- **Human Interface Guidelines:** [Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
- **Human Interface Guidelines:** [Liquid Glass](https://developer.apple.com/design/human-interface-guidelines/materials)
- **WWDC:** [Get to know the new design system (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/356/)
- **WWDC:** [Meet Liquid Glass (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/219/)
- **Documentation:** [Adopting Liquid Glass](https://developer.apple.com/documentation/TechnologyOverviews/adopting-liquid-glass)

## See also

- **hig-tab-bars** and **hig-navigation-and-search** for deeper navigation-pattern critique that pairs with the iOS-level choices here.
- **hig-liquid-glass-foundations** for the cross-platform material rules behind floating bars and glass toolbars.
- **hig-typography-and-dynamic-type** and **hig-color-and-dark-mode** for the accessibility and appearance details referenced above.
- **swiftui-tab-views** (and the UIKit tab bar / toolbar code skills) for the SwiftUI/UIKit components that implement floating tab bars, bottom accessories, and glass toolbars.
- **hig-designing-for-ipados** to contrast iPhone ergonomics with the larger, pointer-and-keyboard iPad canvas.
