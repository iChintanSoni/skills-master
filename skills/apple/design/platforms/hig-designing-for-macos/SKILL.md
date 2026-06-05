---
name: hig-designing-for-macos
description: "Design-critique guidance for making an app feel native to macOS under Apple's Human Interface Guidelines, covering the menu bar and full menu commands, resizable multi-window apps, pointer precision and hover, toolbars and sidebars, keyboard shortcuts, and Mac conventions in the macOS 26 Liquid Glass era. Use when reviewing or specifying a Mac app's window model, judging whether menus and shortcuts match Mac expectations, evaluating toolbar and sidebar structure, critiquing pointer and hover behavior, or deciding how a cross-platform design should adapt to the Mac. Produces design recommendations and critique, not code."
tags: [macos, hig, windows, menus, toolbars]
x-skills-master:
  domain: apple
  class: design
  category: platforms
  platforms: [macos]
  pairs_with: []
  sources:
    - https://developer.apple.com/design/human-interface-guidelines/designing-for-macos
    - https://developer.apple.com/design/human-interface-guidelines/the-menu-bar
    - https://developer.apple.com/design/human-interface-guidelines/windows
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

# HIG designing for macOS

macOS critique judges whether an app feels like it belongs on the Mac: it lives in resizable, freely placed windows; it puts its full command set in a familiar menu bar; it rewards a precise pointer with hover feedback and dense layouts; and it honors decades of keyboard and interaction conventions. The most common failure is a phone or iPad app stretched to fit a window, ignoring the menu bar, fixed in size, and unaware of the pointer. In the macOS 26 Liquid Glass era the sidebar, toolbar, and menu bar float as translucent glass over content, but the underlying Mac model is unchanged.

## When to use

- Reviewing a Mac app's overall structure: its window model, menu bar, toolbar, and sidebar working together.
- Judging whether menus, commands, and keyboard shortcuts match what Mac users already expect.
- Evaluating how a multi-window app behaves when windows are resized, repositioned, reopened, or shown side by side.
- Critiquing pointer precision, hover affordances, and right-click menus, or deciding how an iPadOS/iOS design should adapt to the Mac rather than be ported wholesale.

## Core guidance

- Put the complete command set in the menu bar, not only in the UI. Keep the standard menus (app, File, Edit, Format, View, Window, Help) in their expected order with their standard items and shortcuts, so people can discover and reach every feature from a predictable place even when a control isn't visible.
- Design for resizable, freely placed windows as the default. Let people resize from any edge or corner, define a sensible minimum size that keeps content usable, restore each window's last size and position, and support multiple windows and full screen rather than locking the app to one fixed frame.
- Treat the pointer as a first-class input: use rich hover feedback, the conventional pointer shapes (arrow, I-beam, resize, open/closed hand) in their established roles, and provide right-click (Control-click) shortcut menus that mirror the relevant menu-bar commands as a faster path, never the only path.
- Use the toolbar for frequently used, document-level actions across the top of the window; let people customize and rearrange it, and let items collapse into the system overflow menu as the window narrows instead of clipping or wrapping.
- Use a sidebar for navigation among top-level collections, not an iOS-style tab bar; if you need tabbed documents, use real window tabs as Safari and Finder do. Keep the sidebar collapsible so people can reclaim space for content.
- Provide keyboard shortcuts for common actions and full keyboard navigation through controls; a power user should rarely need the mouse for routine tasks, and standard shortcuts (Copy, Paste, Save, Print, Find) must do exactly what people expect.
- Embrace Mac density and precision rather than oversized touch targets: tighter spacing, smaller controls, and information-rich views are appropriate, but keep targets comfortably clickable and respect system spacing and alignment.

## Platform notes

- macOS 26 (Liquid Glass): The menu bar loses its solid background and floats over the desktop; sidebars and toolbars become translucent glass that reflects and refracts the content scrolling beneath them, pulling focus to content. Menus and context menus now lead with SF Symbols icons, so make sure command icons are clear and consistent. Controls gained an extra-large size for primary actions and slightly taller small/medium sizes; validate that custom UI reads well against glass and over varied wallpapers.
- Catalyst and SwiftUI ports: An app brought from iPad must still earn its place on the Mac. Add a real menu bar, enable resizing and multiple windows, wire up pointer hover and right-click menus, and replace tab bars with a sidebar; a stretched iPad layout with no menu commands reads as foreign.

## Pitfalls

- Burying commands only in on-screen controls so the menu bar is sparse and features can't be found or reached by keyboard.
- Fixed-size or single-window apps that can't be resized, won't restore their last frame, and ignore full screen and multiple windows.
- Porting an iPad tab bar to the Mac instead of using a sidebar and real window tabs.
- Renaming or reordering standard menus, or remapping well-known shortcuts to non-standard actions.
- Ignoring the pointer: no hover feedback, missing right-click menus, or wrong pointer shapes over text and resizable edges.
- Inflating every control and gap to touch size, wasting the Mac's screen density and breaking system alignment.
- Letting toolbars clip or wrap instead of customizing and collapsing items into the overflow menu.

## References

- **Human Interface Guidelines:** [Designing for macOS](https://developer.apple.com/design/human-interface-guidelines/designing-for-macos)
- **Human Interface Guidelines:** [The menu bar](https://developer.apple.com/design/human-interface-guidelines/the-menu-bar)
- **Human Interface Guidelines:** [Windows](https://developer.apple.com/design/human-interface-guidelines/windows)
- **Human Interface Guidelines:** [Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars)
- **Human Interface Guidelines:** [Sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars)
- **WWDC:** [Build an AppKit app with the new design (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/310/)

## See also

For building these structures in code, pair this with `swiftui-scenes-windows` for the multi-window and full-screen scene model, `swiftui-navigation` for sidebar-driven navigation splits, and `appkit-core` plus `appkit-swiftui-interop` for menu-bar commands, toolbars, and AppKit window behavior. For deeper coverage of the individual pieces, see `hig-pointing-devices` for pointer shapes and hover, `hig-keyboards-design` for shortcuts and full keyboard access, `hig-materials-liquid-glass` for the glass material on bars and sidebars, `hig-typography-sf-symbols` for the icons menus now lead with, and `hig-multitasking` for windows shown side by side.
