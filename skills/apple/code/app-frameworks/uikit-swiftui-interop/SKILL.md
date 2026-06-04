---
name: uikit-swiftui-interop
description: "Bridges UIKit and SwiftUI in both directions using representables, UIHostingController, and UIHostingConfiguration. Use when embedding a UIView or UIViewController in SwiftUI, hosting SwiftUI inside UIKit cells or controllers, wiring a Coordinator, or passing bindings across the boundary."
globs:
  - "**/*.swift"
tags: [uikit, swiftui, interop, representable, hosting]
x-skills-master:
  domain: apple
  class: code
  category: app-frameworks
  platforms: [ios, ipados, tvos, visionos]
  requires:
    ios: "17"
    swift: "6.0"
  pairs_with: []
  sources:
    - https://developer.apple.com/documentation/swiftui/uiviewrepresentable
    - https://developer.apple.com/documentation/swiftui/uiviewcontrollerrepresentable
    - https://developer.apple.com/documentation/swiftui/uihostingcontroller
    - https://developer.apple.com/documentation/swiftui/uihostingconfiguration
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for interop when one framework lacks a capability the other already provides. Wrap a UIKit view in SwiftUI when you need a control SwiftUI does not expose natively (a tuned `UITextView`, `MKMapView`, a camera preview layer, `PencilKit`) or a third-party UIKit component. Go the other direction with `UIHostingController` to drop a SwiftUI screen into an existing UIKit navigation stack, or `UIHostingConfiguration` to render SwiftUI inside collection and table view cells without an extra controller.

Prefer a native SwiftUI equivalent when one exists. Interop adds a layout-coordination seam, a second update lifecycle, and a place for retain cycles and stale state to hide. Bridge the smallest surface that does the job.

## Core guidance

- Use `UIViewRepresentable` for a self-contained view and `UIViewControllerRepresentable` when the UIKit object owns presentation, lifecycle, or a delegate that expects a controller. `make...` builds once; `update...` runs on every relevant SwiftUI state change, so make it idempotent.
- Route all delegate, target/action, and callback traffic through the `Coordinator`. Create it in `makeCoordinator()`, store the SwiftUI `@Binding`s or a parent reference on it, and write SwiftUI state back from there — never mutate SwiftUI state directly inside `update...`.
- Treat `update...` as a diffing function: read current values and apply only what changed. Setting properties unconditionally on every pass causes redundant work, layout thrash, and feedback loops.
- Implement `sizeThatFits(_:uiView:context:)` to participate in SwiftUI layout precisely; otherwise the wrapper fills the proposed size, which often over- or under-sizes intrinsic content like text.
- For SwiftUI in UIKit, set `UIHostingController.sizingOptions` to `.intrinsicContentSize` (and/or `.preferredContentSize`) so the host resizes as SwiftUI content changes; manually pin `view` constraints when you add it as a child.
- In cells, prefer `UIHostingConfiguration` over a hosting controller — it is the supported path, gets self-resizing for free, and adds no view controller. Note the SwiftUI `.toolbar` modifier does not work inside it because there is no connected controller hierarchy.
- Avoid retain cycles: the Coordinator referencing the parent struct is fine (it is a value type), but a captured `self` in a closure stored on a long-lived UIKit object is not. Clean up timers, observers, and KVO in `dismantleUIView(_:coordinator:)`.

```swift
struct SearchField: UIViewRepresentable {
    @Binding var text: String

    func makeCoordinator() -> Coordinator { Coordinator(text: $text) }

    func makeUIView(context: Context) -> UISearchBar {
        let bar = UISearchBar()
        bar.delegate = context.coordinator
        return bar
    }

    func updateUIView(_ bar: UISearchBar, context: Context) {
        if bar.text != text { bar.text = text }   // diff before writing
    }

    final class Coordinator: NSObject, UISearchBarDelegate {
        @Binding var text: String
        init(text: Binding<String>) { _text = text }
        func searchBar(_ b: UISearchBar, textDidChange t: String) { text = t }
    }
}
```

## Platform notes

- iOS/iPadOS/tvOS/visionOS: the same `UIViewRepresentable`, `UIViewControllerRepresentable`, `UIHostingController`, and `UIHostingConfiguration` APIs apply; the underlying UIKit objects differ per platform (focus engine on tvOS, ornaments and hover on visionOS).
- macOS uses `NSViewRepresentable`, `NSViewControllerRepresentable`, and `NSHostingController`/`NSHostingView`; the shapes mirror these but live in a separate skill — do not assume drop-in parity.
- Swift 6: representables and their coordinators run on the main actor. Mark NSObject delegate conformances accordingly and keep cross-actor work off the bridge; pass values, not unsynchronized references.
- As of the 26 cycle, scene bridging lets UIKit-lifecycle apps host full SwiftUI scenes via `UIHostingSceneDelegate`, useful for adopting SwiftUI-only scene types (immersive spaces, volumes) incrementally.

## Pitfalls

- Doing work in `update...` that triggers another SwiftUI update (writing a binding, calling `objectWillChange`) creates an infinite update loop or a runtime "modifying state during view update" warning.
- Recreating the UIKit object inside `update...` instead of `make...` discards state and scroll position and tanks performance.
- Forgetting to clear delegates/observers in `dismantle...`, leaving the Coordinator or UIKit view leaked after the SwiftUI view disappears.
- Putting a `UIHostingController` inside a cell without managing it as a child controller — it loses appearance callbacks and the `.toolbar`/safe-area behavior breaks. Use `UIHostingConfiguration` instead.
- Relying on a sized `UIHostingController` without setting `sizingOptions`, then wondering why a popover or sheet does not grow to fit its SwiftUI content.

## References

- **Documentation:** [UIViewRepresentable](https://developer.apple.com/documentation/swiftui/uiviewrepresentable)
- **Documentation:** [UIViewControllerRepresentable](https://developer.apple.com/documentation/swiftui/uiviewcontrollerrepresentable)
- **Documentation:** [UIHostingController](https://developer.apple.com/documentation/swiftui/uihostingcontroller)
- **Documentation:** [UIHostingConfiguration](https://developer.apple.com/documentation/swiftui/uihostingconfiguration)
- **WWDC:** [Use SwiftUI with UIKit (WWDC22)](https://developer.apple.com/videos/play/wwdc2022/10072/)
- **WWDC:** [What's new in UIKit (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/243/)

## See also

Pair this with a dedicated UIHostingConfiguration cells skill for collection/table layouts, an AppKit-SwiftUI interop skill for the macOS equivalents (NSViewRepresentable and NSHostingController), and a SwiftUI data-flow skill covering bindings, Observable, and Environment so state crossing the bridge stays single-source-of-truth.
