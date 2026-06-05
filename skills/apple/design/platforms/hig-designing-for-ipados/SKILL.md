---
name: hig-designing-for-ipados
description: "Design guidance and critique for iPad apps under Apple's Human Interface Guidelines and the iPadOS 26 windowing model. Use when reviewing or designing iPad layouts, sidebars and multi-column navigation, pointer and keyboard support, drag and drop, or adapting an interface to resizable windows, Stage Manager, and the menu bar. Covers size classes, adaptive layout, Liquid Glass, scroll edge effects, and floating tab bars. Produces design recommendations and critique, not code."
tags: [ipados, layout, navigation, multitasking, pointer]
x-skills-master:
  domain: apple
  class: design
  category: platforms
  platforms: [ipados]
  pairs_with: []
  sources:
    - https://developer.apple.com/design/human-interface-guidelines/designing-for-ipados
    - https://developer.apple.com/design/human-interface-guidelines/multitasking
    - https://developer.apple.com/design/human-interface-guidelines/sidebars
    - https://developer.apple.com/design/human-interface-guidelines/pointing-devices
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Use this skill when designing or critiquing an iPad app: choosing a navigation structure, laying out content for a large adaptive canvas, supporting pointer and keyboard, enabling drag and drop, or adapting to the iPadOS 26 windowing and multitasking model. Apply it whenever a design must survive being resized to a small floating window, shown in Stage Manager, or driven by trackpad and Magic Keyboard. Pair the critique with the SwiftUI or UIKit code skill that implements the structure you recommend.

## Core guidance

- **Design for a continuous range of sizes, not a few fixed layouts.** In iPadOS 26 any window resizes fluidly via the bottom-right handle, so reason in terms of horizontal and vertical size classes and adapt *non-destructively* — never discard the user's scroll position, selection, or in-progress input when a window shrinks or grows.
- **Lead with a sidebar for broad, peer-level hierarchies; use a tab bar for a small, flat set of destinations.** A sidebar flattens deep structure and exposes several categories at once (Mail, Music); the floating Liquid Glass tab bar can morph into a sidebar as width increases. Don't ship a phone-style stacked navigation that wastes the iPad's width.
- **Fill the canvas with content, not chrome.** Use multi-column splits and let the primary content extend under translucent navigation, applying the scroll edge effect so material reads cleanly where content meets glass toolbars and bars. Avoid stretching a single column of controls across the full width.
- **Treat pointer and keyboard as first-class, not extras.** Provide hover feedback (the Liquid Glass highlight that materializes on controls), precise hit targets, full keyboard navigation, and meaningful shortcuts. Don't leave the trackpad to fall back on coarse touch targets or strand users with no key-command path.
- **Make drag and drop work within and across apps.** Offer drag sources and drop targets for content that users would naturally move (images, text, files), give clear drop-location feedback, and support multi-item drag. Don't make drag the *only* way to do something — pair it with a menu or button.
- **Respect window controls and the menu bar.** Wrap toolbars around the top-left window controls rather than reserving a permanent empty safe area, and keep the menu bar's app and custom menus stable: order by frequency, group related actions, attach symbols and shortcuts, and don't hide menus contextually.
- **Open documents additively.** Each document should open in its own window so users can place them side by side, and each window should carry a descriptive name that identifies it in app and window menus.

## Platform notes

iPadOS 26 replaces the older Split View and Slide Over model with freely resizable windows, macOS-style "traffic light" window controls, an optional menu bar revealed by swiping or moving the pointer to the top edge, and Stage Manager as an optional visual mode for organizing windows. Liquid Glass makes bars, sidebars, and toolbars translucent and layered, so verify legibility and contrast over both light and dark wallpapers and over busy content. Test the full size range, including a small floating window and an external display, and design for the Magic Keyboard and trackpad as a primary input mode, not an afterthought.

## Pitfalls

- Designing only for full-screen and portrait, then breaking when the app is resized to a narrow or short window.
- Hiding or reflowing controls destructively on resize so users lose state or can't find a previously visible action.
- Reserving a fixed blank region for window controls instead of flowing the toolbar around them.
- Treating drag and drop, hover, and keyboard shortcuts as optional, leaving the app feeling like a scaled-up phone app.
- Letting translucent Liquid Glass bars reduce contrast below legible levels over photos or video.
- Hiding menu bar items contextually so users can't predict where an action lives.

## References

- **Human Interface Guidelines:** [Designing for iPadOS](https://developer.apple.com/design/human-interface-guidelines/designing-for-ipados)
- **Human Interface Guidelines:** [Multitasking](https://developer.apple.com/design/human-interface-guidelines/multitasking)
- **Human Interface Guidelines:** [Sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars)
- **Human Interface Guidelines:** [Pointing devices](https://developer.apple.com/design/human-interface-guidelines/pointing-devices)
- **Human Interface Guidelines:** [Layout](https://developer.apple.com/design/human-interface-guidelines/layout)
- **WWDC:** [Elevate the design of your iPad app (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/208/)

## See also

- **hig-designing-for-ios** for shared iOS conventions and how iPad layouts diverge from iPhone.
- **hig-multitasking** and **hig-layout-and-size-classes** for the cross-platform adaptive-layout and windowing rules referenced here.
- **hig-sidebars** and **hig-tab-bars** for the navigation components and the tab-bar-to-sidebar morph in the Liquid Glass design system.
- **hig-pointing-and-keyboard** and **hig-drag-and-drop** for input-specific design critique.
- The SwiftUI navigation and split-view code skill (NavigationSplitView, size-class adaptation, scroll edge effects) and the UIKit split-view-controller skill for implementing the structures you recommend here.
