---
name: appkit-core
description: "Use when building or maintaining a native Mac app in AppKit, or deciding AppKit vs SwiftUI on macOS. Covers NSApplication, NSWindow, NSWindowController, NSViewController, the menu bar and NSMenu, NSToolbar, target-action and the responder chain, document-based apps, and Mac idioms like resizable windows, keyboard handling, and multiple windows."
globs:
  - "**/*.swift"
tags: [appkit, macos, nswindow, nsdocument, responder-chain]
x-skills-master:
  domain: apple
  class: code
  category: app-frameworks
  platforms: [macos]
  requires:
    macos: "14"
    swift: "6.0"
  pairs_with: []
  sources:
    - https://developer.apple.com/documentation/appkit
    - https://developer.apple.com/documentation/appkit/nsapplication
    - https://developer.apple.com/documentation/appkit/nswindow
    - https://developer.apple.com/documentation/appkit/nsresponder
    - https://developer.apple.com/documentation/appkit/nsdocument
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for AppKit when you need deep control over Mac-specific behavior: precise window management, custom toolbars, rich text or tables (NSTableView/NSOutlineView), document-based apps with autosave and versions, or fine-grained event and pasteboard handling. AppKit is also the right choice when maintaining an existing Cocoa codebase or when a SwiftUI feature has gaps on macOS.

Prefer SwiftUI for new apps when its controls cover your needs; it is faster to build and adopts the new Mac design automatically. The two compose well: host SwiftUI inside AppKit with `NSHostingController`/`NSHostingView`, and embed AppKit inside SwiftUI with `NSViewRepresentable`/`NSViewControllerRepresentable`. Mix at the screen or pane boundary, not control by control.

## Core guidance

- Do build the spine as `NSApplication` -> `NSWindow` -> `NSWindowController` -> `contentViewController`. Let view controllers own view trees; reserve window controllers for window-level concerns (frame autosave, title, toolbar).
- Don't hardcode menus or wire actions to concrete objects. Send actions to `nil` so they travel the responder chain (first responder -> view controllers -> window -> app delegate), and gate items via `validateUserInterfaceItem(_:)`.
- Do drive enablement through validation, not manual toggling. Returning `false` greys the menu item or toolbar control automatically and keeps state in one place.
- Don't fight Mac window idioms. Set a `frameAutosaveName` so size and position persist, keep `.resizable` in the style mask, and support full-screen and multiple windows rather than a single fixed frame.
- Do use `NSToolbarDelegate` for toolbars: declare item identifiers, build items lazily, and let users customize. Use `NSMenuToolbarItem`/`NSMenuItem` for pull-downs instead of bespoke popovers.
- Do adopt document-based architecture (`NSDocument` + `NSDocumentController`) when your app opens, edits, and saves files; you get Open Recent, autosave, versions, and `NSWindowRestoration` largely for free.
- Don't block the main thread. AppKit is main-actor bound under Swift 6; isolate UI types to `@MainActor` and hand long work to background tasks, then hop back.

```swift
@MainActor
final class EditorViewController: NSViewController {
    @IBAction func reload(_ sender: Any?) { /* refresh content */ }

    // Drives both menu items and toolbar items targeting this action.
    func validateUserInterfaceItem(_ item: any NSValidatedUserInterfaceItem) -> Bool {
        if item.action == #selector(reload(_:)) { return isDocumentLoaded }
        return true
    }
}
```

## Platform notes

- macOS 26 (Xcode 26) applies the new Mac design with Liquid Glass to standard toolbars and sidebars when you rebuild. Extend content edge-to-edge so the floating glass toolbar layers correctly; group custom controls with `NSGlassEffectContainerView` rather than stacking separate glass surfaces.
- Menus were re-implemented on Cocoa in recent releases, lowering memory and CPU; you can conditionally hide toolbar items via `isHidden` instead of rebuilding the toolbar.
- View controllers join the responder chain (since macOS 10.10), so `@IBAction` methods placed on an `NSViewController` are reachable for menu validation and dispatch without manual wiring.
- For SwiftUI menus inside AppKit, `NSHostingMenu` lets you express menu content in SwiftUI and surface it through `NSMenu`.

## Pitfalls

- Forgetting `frameAutosaveName` leaves windows reopening at a default frame; users expect remembered geometry.
- Targeting a control's action at a specific object breaks the responder chain and disables validation; use `target = nil`.
- Treating the app delegate as a dumping ground for actions instead of placing them on the relevant view controller, which makes validation and reuse harder.
- Assuming SwiftUI inside `NSHostingView` lays out and routes events identically to a native `NSView`; verify coordinate transforms and hit-testing for overlaid hosting views.
- Mutating AppKit objects off the main actor; Swift 6 concurrency will flag it, and races cause subtle UI corruption.

## References

- **Documentation:** [AppKit](https://developer.apple.com/documentation/appkit)
- **Documentation:** [NSResponder (responder chain and target-action)](https://developer.apple.com/documentation/appkit/nsresponder)
- **Documentation:** [NSDocument](https://developer.apple.com/documentation/appkit/nsdocument)
- **Human Interface Guidelines:** [Designing for macOS](https://developer.apple.com/design/human-interface-guidelines/designing-for-macos)
- **WWDC:** [Build an AppKit app with the new design (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/310/)
- **WWDC:** [Use SwiftUI with AppKit (WWDC22)](https://developer.apple.com/videos/play/wwdc2022/10075/)

## See also

For embedding SwiftUI screens inside an AppKit shell or hosting AppKit views in SwiftUI, see a SwiftUI-AppKit interoperability skill. For adopting the macOS 26 visual style across toolbars and sidebars, pair with a Liquid Glass adoption skill. For document UI patterns and file coordination, see a document-based apps skill.
