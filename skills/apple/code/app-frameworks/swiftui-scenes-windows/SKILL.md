---
name: swiftui-scenes-windows
description: "Structure a SwiftUI app's window and scene topology using App, Scene, WindowGroup, Window, Settings, DocumentGroup, and MenuBarExtra. Use when building multi-window experiences, opening or dismissing windows with openWindow and dismissWindow, tuning windowStyle and windowResizability, or shipping volumetric windows and immersive spaces on visionOS."
globs:
  - "**/*.swift"
tags: [swiftui, windows, scenes, multiwindow, visionos]
x-skills-master:
  domain: apple
  class: code
  category: app-frameworks
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  requires:
    ios: "17"
    swift: "6.0"
  pairs_with: []
  sources:
    - https://developer.apple.com/documentation/swiftui/windowgroup
    - https://developer.apple.com/documentation/swiftui/windowresizability
    - https://developer.apple.com/documentation/swiftui/menubarextra
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for this skill when you define the top of a SwiftUI app — the `App` type and its body of scenes — or when you add, open, or close windows at runtime. It covers picking the right scene primitive (`WindowGroup` vs `Window` vs `DocumentGroup` vs `Settings` vs `MenuBarExtra`), driving windows imperatively with `openWindow` and `dismissWindow`, and adapting layout across iPad multitasking, macOS, and the spatial scene types on visionOS.

## Core guidance

- **Pick the scene by cardinality.** Use `WindowGroup` for content the user may open many copies of (a document, a detail view, a chat). Use `Window` for a single, unique surface (an inspector, a status panel) — the system reuses one instance instead of spawning duplicates.
- **Drive value-based windows, not ad-hoc state.** Register `WindowGroup(for: ItemID.self)` and open it with `openWindow(value:)`. The value must be `Codable & Hashable` so the system can restore and de-duplicate the window. Read it inside with the binding closure, not a captured variable.
- **Use IDs for singletons, values for data.** `openWindow(id:)` targets a uniquely identified scene; `openWindow(value:)` opens or reuses a window keyed by the value. Match `dismissWindow` to whichever you opened.
- **Don't gate multi-window on hope — declare support.** iPadOS and visionOS require `UIApplicationSupportsMultipleScenes` set to `true` in Info.plist; without it `openWindow` quietly fails on those platforms.
- **Set `windowResizability` deliberately.** `.contentSize` pins the window to its view's ideal size (great for utilities and palettes); `.contentMinSize` lets users grow but not shrink below the content; `.automatic` defers to the platform.
- **Keep scene-only modifiers on scenes.** `windowStyle`, `windowResizability`, `defaultSize`, and `commands` attach to a `Scene`, not a `View`. Applying them inside a view body is a common compile-time mistake.
- **On visionOS, choose the surface to match the content.** A flat panel is a default `WindowGroup`; bounded 3D content wants `.windowStyle(.volumetric)` with a `.meters` default size; unbounded content belongs in an `ImmersiveSpace` opened via `openImmersiveSpace`.

```swift
@main
struct ShelfApp: App {
    var body: some Scene {
        WindowGroup { LibraryView() }              // many windows
        WindowGroup(for: Book.ID.self) { $id in    // value-routed
            BookDetail(id: id)
        }
        Window("Inspector", id: "inspector") {      // single instance
            InspectorView()
        }
        .windowResizability(.contentSize)
        Settings { SettingsView() }                 // macOS preferences
    }
}
```

## Platform notes

- **iOS / iPadOS:** A single `WindowGroup` is the norm on iPhone. On iPad, multiple windows and side-by-side multitasking require `UIApplicationSupportsMultipleScenes`. `Settings` and `MenuBarExtra` are macOS-only and are ignored elsewhere.
- **macOS:** `MenuBarExtra` adds a persistent menu-bar item — use `.menuBarExtraStyle(.window)` for a popover-style panel or the default for a pull-down menu. `Settings` wires up the standard app-menu Settings item automatically. `windowStyle(.hiddenTitleBar)` and `defaultPosition` refine chrome and placement.
- **visionOS:** Three scene families coexist — windows, volumes (`.windowStyle(.volumetric)`), and immersive spaces. visionOS 26 makes widgets and locked windows persist to physical rooms, lets presentations (sheets, popovers, alerts) appear within volumes, and tightens SwiftUI/RealityKit integration so views and entities move between scenes more freely.
- **watchOS / tvOS:** Scene composition is intentionally limited — typically one `WindowGroup`. Imperative window opening and the macOS/visionOS-specific styles do not apply.

## Pitfalls

- Calling `openWindow(value:)` for a value type you never registered with `WindowGroup(for:)` does nothing — there's no matching scene to route to.
- Forgetting `UIApplicationSupportsMultipleScenes` makes multi-window silently no-op on iPad and visionOS while still "working" on Mac, which hides the bug in review.
- Treating `Window` like `WindowGroup`: `Window` is a singleton, so repeated opens just refocus the existing one — don't expect a second copy.
- Expecting `.contentSize` resizability to track dynamic content — it locks to the view's ideal size at presentation, so a view that grows later may clip.
- Volumetric default sizes use physical units; passing points instead of `.meters` yields a window that is far smaller or larger than intended.

## References

- **Documentation:** [WindowGroup](https://developer.apple.com/documentation/swiftui/windowgroup)
- **Documentation:** [WindowResizability](https://developer.apple.com/documentation/swiftui/windowresizability)
- **Documentation:** [Building and customizing the menu bar with SwiftUI](https://developer.apple.com/documentation/swiftui/building-and-customizing-the-menu-bar-with-swiftui)
- **Documentation:** [Customizing window styles and state-restoration behavior in macOS](https://developer.apple.com/documentation/swiftui/customizing-window-styles-and-state-restoration-behavior-in-macos)
- **WWDC:** [Bring multiple windows to your SwiftUI app (WWDC22)](https://developer.apple.com/videos/play/wwdc2022/10061/)
- **WWDC:** [Set the scene with SwiftUI in visionOS (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/290/)

## See also

Pair this with a SwiftUI navigation skill (for `NavigationStack` and `NavigationSplitView` inside each window), a document-based apps skill that goes deep on `DocumentGroup` and the document model, a commands-and-menus skill for `CommandMenu` and keyboard shortcuts that complement `MenuBarExtra`, and a visionOS immersive-spaces skill for `ImmersiveSpace`, RealityKit content, and volumetric layout.
