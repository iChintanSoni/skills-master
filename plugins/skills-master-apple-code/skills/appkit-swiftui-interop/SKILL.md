---
name: appkit-swiftui-interop
description: Bridges AppKit and SwiftUI on macOS with NSViewRepresentable, NSViewControllerRepresentable, NSHostingController, and NSHostingView, plus menu and toolbar wiring. Use when embedding a SwiftUI view inside an AppKit window or vice versa, hosting an NSView/NSViewController in SwiftUI, sizing hosted content, or sharing menus, commands, and the responder chain across the two frameworks.
---

## When to use

Reach for this skill when an AppKit Mac app needs to render SwiftUI, or a SwiftUI app must drop down to an existing `NSView` or `NSViewController`. Typical triggers: wrapping `NSTextView`, a scroll view, a web view, or a Metal layer for SwiftUI; placing a SwiftUI inspector or sidebar inside an `NSSplitViewController`; sizing hosted content so Auto Layout and SwiftUI agree; and sharing menu bar commands, toolbars, and the responder chain between the two worlds. It applies to incremental migrations in both directions, not greenfield SwiftUI-only apps.

## Core guidance

- **SwiftUI into AppKit:** wrap a SwiftUI root in `NSHostingController` to use it as a view controller (split items, sheets, popovers), or `NSHostingView` to drop it into a plain `NSView` hierarchy. Both keep the SwiftUI environment alive and update reactively.
- **AppKit into SwiftUI:** implement `NSViewRepresentable` for a bare view or `NSViewControllerRepresentable` for a controller. Do creation in `makeNSView`/`makeNSViewController` once; push state in `updateNSView`/`updateNSViewController` every invalidation. Never store SwiftUI state on the representable struct expecting it to persist.
- **Use the Coordinator for callbacks:** delegates, targets, KVO, and `NSNotification` observers belong on the `Coordinator`, which lives for the view's lifetime. Send events back to SwiftUI through bindings or closures captured by the coordinator, not by reaching back into the value-type representable.
- **Control sizing deliberately:** tune `sizingOptions` (`NSHostingSizingOptions`) on the hosting view or controller so it only emits the Auto Layout constraints you want. Disable `intrinsicContentSize` when the surrounding AppKit layout already pins the frame, to avoid conflicts and layout thrash.
- **Bridge the window and chrome:** set `sceneBridgingOptions` on a hosting view/controller to let SwiftUI `.navigationTitle`, `.toolbar`, and `.toolbarRole` populate the enclosing `NSWindow`. On macOS 15+, build menus from SwiftUI with `NSHostingMenu` so one declaration drives both an AppKit `NSMenu` and SwiftUI menus.
- **Share menu commands through focus:** mark the active SwiftUI scene's model with `focusedSceneValue`, and route AppKit menu actions into SwiftUI by handling the matching selectors in the responder chain rather than duplicating logic.
- **Don't do heavy work in update:** `updateNSView` runs often; diff against the prior value and apply only real deltas. Avoid reloading data sources or resetting scroll position on every pass.

```swift
struct CodeEditor: NSViewRepresentable {
    @Binding var text: String

    func makeCoordinator() -> Coordinator { Coordinator(text: $text) }

    func makeNSView(context: Context) -> NSTextView {
        let view = NSTextView()
        view.delegate = context.coordinator
        return view
    }

    func updateNSView(_ view: NSTextView, context: Context) {
        if view.string != text { view.string = text } // guard against churn
    }
}
```

## Platform notes

- **macOS only.** AppKit interop has no iOS equivalent; the iOS analogues are `UIViewRepresentable`, `UIHostingController`, and `UIHostingConfiguration`. Keep bridging code in macOS-conditional targets.
- `NSHostingSizingOptions` and the constraint-customization APIs require macOS 13+. `sceneBridgingOptions` and `NSHostingSceneBridgingOptions` need macOS 14+ (Sonoma), matching this skill's baseline.
- `NSHostingMenu` and `NSGestureRecognizerRepresentable` are macOS 15+ (Sequoia). Gate them with `if #available(macOS 15, *)` and fall back to a hand-built `NSMenu` or SwiftUI gestures when targeting earlier systems.
- Under the macOS 26 Liquid Glass design, hosted SwiftUI content adopts the new material automatically; verify toolbar and sidebar chrome that straddles both frameworks so glass effects and concentricity stay consistent across the boundary.

## Pitfalls

- **Treating the representable as long-lived state.** SwiftUI can recreate the struct at any time. Persist mutable state in the `Coordinator` or an external observable model, never in stored properties of the representable itself.
- **Updating SwiftUI state synchronously from update.** Writing to an `@State`/`@Binding` directly inside `updateNSView` can trigger a re-entrant update loop. Defer such writes (for example, dispatch asynchronously) or move them into delegate callbacks on the coordinator.
- **Double constraints.** Leaving default `NSHostingSizingOptions` on while also pinning the hosting view with explicit Auto Layout produces unsatisfiable-constraint warnings. Pick one source of truth for size.
- **Lost responder chain and shortcuts.** A hosted SwiftUI editor that does not participate in focus will silently miss menu bar commands. Wire `focusedSceneValue` and ensure the hosting view becomes first responder.
- **Frame-driven AppKit views in a SwiftUI layout.** Older `NSView` subclasses that rely on autoresizing masks can fight SwiftUI's layout; give them a sensible `intrinsicContentSize` or constrain them inside `makeNSView`.

## References

- **Documentation:** [NSViewRepresentable](https://developer.apple.com/documentation/swiftui/nsviewrepresentable)
- **Documentation:** [NSHostingController](https://developer.apple.com/documentation/swiftui/nshostingcontroller)
- **Documentation:** [NSHostingSceneBridgingOptions](https://developer.apple.com/documentation/swiftui/nshostingscenebridgingoptions)
- **Documentation:** [Building and customizing the menu bar with SwiftUI](https://developer.apple.com/documentation/swiftui/building-and-customizing-the-menu-bar-with-swiftui)
- **WWDC:** [Use SwiftUI with AppKit (WWDC22)](https://developer.apple.com/videos/play/wwdc2022/10075/)

## See also

Pair this with a dedicated SwiftUI data-flow skill when deciding where shared state lives across the bridge, and with a macOS windowing or menu-bar skill for scene and command plumbing. For the iOS direction, see the companion UIKit/SwiftUI interop skill covering `UIViewRepresentable` and `UIHostingController`. A Liquid Glass design skill helps keep chrome consistent where AppKit and SwiftUI surfaces meet.
