---
name: hig-multitasking
description: "Design guidance and UX critique for iPad multitasking and the iPadOS 26 windowing system: resizable windows, full-screen vs windowed apps, Stage Manager, Split View, size classes, state preservation across configurations, and external displays. Use when reviewing or designing an iPad app's window behavior, evaluating layouts that must adapt to any window size, deciding minimum window sizes, or planning external-display support. Produces HIG-grounded recommendations, not code."
tags: [ipados, multitasking, windowing, stage-manager, layout]
x-skills-master:
  domain: apple
  class: design
  category: patterns
  platforms:
    - ipados
    - ios
  requires: { ipados: "26" }
  pairs_with: []
  sources:
    - https://developer.apple.com/design/human-interface-guidelines/multitasking
    - https://developer.apple.com/design/human-interface-guidelines/split-views
    - https://developer.apple.com/design/human-interface-guidelines/windows
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

# hig-multitasking

Critique and shape how an iPad app behaves as a window. In iPadOS 26 the windowing system is rebuilt: any app can be freely resized via a corner handle, gains macOS-style window controls (close, full-screen, minimize), and can tile into halves, thirds, or quadrants. Full-screen is no longer guaranteed, so design every screen to survive at any size.

## When to use

- Reviewing an iPad layout that must adapt across full-screen, tiled, floating, and Stage Manager configurations.
- Deciding sensible minimum/maximum window sizes and whether multiple windows add value.
- Auditing whether content and state survive resize, rotation, and being sent to an external display.
- Evaluating Split View / sidebar structure and pointer/keyboard readiness for windowed use.

## Core guidance

- **Design for a continuum of sizes, not two states.** Treat width as a spectrum and let layout respond to size classes — collapse a sidebar to a tab bar or compact navigation when narrow, expand to a multi-column split when wide. Avoid hardcoding a "phone layout" and an "iPad layout" with nothing in between.
- **Pick honest minimum sizes.** Set a minimum window size only as small as your content stays usable and legible; don't force a large minimum that blocks tiling into a third or quadrant. Never clip controls or truncate primary actions when the window shrinks.
- **Don't assume full-screen.** Avoid layouts that depend on edge-to-edge real estate, fixed pixel positions, or the device's physical orientation. Read available space from the window, and keep key actions reachable when the window floats above the wallpaper.
- **Preserve state across every configuration change.** Resizing, rotating, tiling, entering Stage Manager, or minimizing to the dock must not reset scroll position, selection, in-progress text, or navigation depth. Returning to a window should feel like nothing happened.
- **Offer multiple windows only when they help.** Support a second window for genuinely parallel work (compare two documents, reference while writing); don't spawn windows for transient or modal tasks. Make each window self-describing so users can tell them apart in the App Switcher and Stage Manager.
- **Keep Split View panes independently coherent.** Each pane should navigate, scroll, and retain state on its own; the detail side must show meaningful content (not an empty placeholder) and adapt when the split collapses to a single column.
- **Treat the external display as a peer, not a mirror.** When an app moves to a connected display, give it a layout suited to the larger canvas rather than a stretched copy, and keep the iPad usable for a companion task. Respect the system's window placement and controls.
- **Make windowed use pointer- and keyboard-first.** Provide hover states, correct cursor effects, and keyboard shortcuts; windowing invites Magic Keyboard and trackpad workflows where touch targets alone feel slow.

## Platform notes

- **iPadOS 26 windowing:** Any multitasking-capable app shows a resize handle and window controls. Window arrangements are remembered per orientation, so verify your layout reads well in both the landscape and portrait versions of a tiled set.
- **Stage Manager:** Apps appear as overlapping, resizable windows grouped into stages, optionally spanning an external display. Don't design assuming a single foreground app — background windows stay visible and should remain legible.
- **Split View and Slide Over (legacy):** Still part of the multitasking vocabulary; a side-by-side split and a narrow floating overlay impose compact widths, so confirm compact-width behavior even if you target windowing primarily.
- **iOS / iPhone:** No free windowing, but the same adaptive-layout and state-preservation discipline pays off in Slide Over-width and split contexts on iPad and in iPhone size-class transitions.

## Pitfalls

- Layouts that look correct full-screen but overflow, clip, or hide actions at one-third or quadrant width.
- State loss on resize or rotation — cleared text fields, reset scroll, dropped selection — which feels like a crash to users.
- Minimum window sizes set so large the app refuses to tile, breaking the multitasking promise.
- Empty or broken detail panes when a split collapses, or a second window that duplicates rather than complements the first.
- Stretching the iPad UI onto an external display instead of giving the larger canvas its own layout.

## References

- **Human Interface Guidelines:** [Multitasking](https://developer.apple.com/design/human-interface-guidelines/multitasking)
- **Human Interface Guidelines:** [Split views](https://developer.apple.com/design/human-interface-guidelines/split-views)
- **Human Interface Guidelines:** [Windows](https://developer.apple.com/design/human-interface-guidelines/windows)
- **Human Interface Guidelines:** [Designing for iPadOS](https://developer.apple.com/design/human-interface-guidelines/designing-for-ipados)
- **WWDC:** [Elevate the design of your iPad app (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/208/)
- **Documentation:** [Scenes (UIKit)](https://developer.apple.com/documentation/uikit/scenes) and [UISceneSizeRestrictions](https://developer.apple.com/documentation/uikit/uiscenesizerestrictions)

## See also

- Pair this critique with the SwiftUI/UIKit code skill that implements multitasking — scene and window-group configuration, size restrictions, and state restoration — to turn these recommendations into adaptive layout and scene code.
- Relates to skills covering adaptive layout and size classes, split-view navigation, and external-display support, which share the "design for any size" foundation.
