---
name: uikit-core
description: "Covers UIKit fundamentals: the UIViewController lifecycle (viewDidLoad, viewIsAppearing, viewWillAppear, layoutSubviews), view controller containment with addChild and didMove, the UIView hierarchy and responder chain, the scene-based lifecycle with UIWindowScene and a scene delegate, trait collections and registerForTraitChanges, and when UIKit still fits versus SwiftUI. Use when building or maintaining a UIKit screen, debugging when lifecycle or layout code runs, embedding a child view controller, migrating to the scene lifecycle, reacting to trait or size-class changes, or routing events through the responder chain."
globs:
  - "**/*.swift"
tags: [uikit, viewcontroller, lifecycle, scene, traits]
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
    - https://developer.apple.com/documentation/uikit/uiviewcontroller
    - https://developer.apple.com/documentation/uikit/uiwindowscene
    - https://developer.apple.com/documentation/uikit/uitraitchangeobservable
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for this skill when writing or maintaining UIKit screens: deciding which lifecycle method should hold setup, layout, or appearance work; embedding one view controller inside another; reasoning about how a touch or action travels up the responder chain; adopting or migrating to the scene-based lifecycle; or adapting layout to trait and size-class changes. It also helps when judging whether a given screen belongs in UIKit at all. It does not teach SwiftUI composition or SwiftUI-UIKit interop mechanics; route those to the skills named below.

## Core guidance

- Match work to the right lifecycle stage. Do one-time setup in `viewDidLoad`; put per-appearance work that needs valid bounds and traits in `viewIsAppearing` (iOS 17+), not in `viewWillAppear`; keep `layoutSubviews` and `updateProperties` cheap because they run repeatedly.
- Drive appearance from state, not from imperative pokes scattered across callbacks. On iOS 26 UIKit automatically tracks `@Observable` reads inside `layoutSubviews` and the new `updateProperties()`, so reading a model there re-runs that method when the value changes.
- Establish containment in full. Call `addChild`, add the child's view, then `didMove(toParent:)`; to remove, call `willMove(toParent: nil)`, remove the view, then `removeFromParent`. Skipping a step leaves the child detached from forwarding, traits, and rotation.
- Let the responder chain do the routing. Send `nil`-targeted actions (`sendAction(_:to:nil:for:)`) and override `UIResponder` event methods rather than wiring every control to one controller; first responder, then up through views, view controllers, window, and application.
- Adopt the scene lifecycle now. Put window and UI setup in a scene delegate's `scene(_:willConnectTo:options:)` and reserve the app delegate for process-level events; the release after iOS 26 requires the scene manifest or the app will not launch.
- Observe traits surgically with `registerForTraitChanges(_:handler:)`; `traitCollectionDidChange()` is deprecated. Register only the traits you depend on, and set initial state yourself since the handler does not fire on first load.
- Choose UIKit deliberately for rich text editing, precise scroll and collection control, or mature in-house components; default new screens to SwiftUI and bridge with a hosting controller.

```swift
final class DetailViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        registerForTraitChanges([UITraitVerticalSizeClass.self]) { (self: Self, _) in
            self.applyLayoutForCurrentSizeClass()
        }
        applyLayoutForCurrentSizeClass() // handler is not called on first load
    }
}
```

## Platform notes

- iPadOS: expect multiple concurrent scenes and split-view layouts; per-scene state lives in the scene delegate, and the new menu-bar and `UISplitViewController` inspector column are iPad-relevant surfaces.
- tvOS: the focus engine drives navigation, so design around focusable views and focus guides rather than touch-first responder assumptions.
- visionOS: UIKit runs in windowed contexts only; volumetric and immersive presentation has no UIKit equivalent, and scene `destructionConditions` govern how windows persist.
- iOS 26 Liquid Glass: standard bars, controls, and presentations pick up the new material automatically when built against the current SDK; avoid hardcoding opaque backgrounds that fight the system glass.

## Pitfalls

- Reading `view.bounds` or trait-dependent geometry in `viewDidLoad` or `viewWillAppear`, where values are not yet final; use `viewIsAppearing` or `viewDidLayoutSubviews`.
- Half-wired containment, where the child's view is added but `addChild`/`didMove` are skipped, breaking appearance callbacks, trait propagation, and event forwarding.
- Heavy work in `layoutSubviews`, `updateProperties`, or a trait-change handler, which runs far more often than developers expect and stutters scrolling and rotation.
- Leaving UI setup in the app delegate after scene adoption; on the post-iOS-26 SDK a missing scene manifest is a hard launch failure, not a warning.
- Overriding the deprecated `traitCollectionDidChange()` or registering for every trait, causing redundant relayout when an unrelated trait changes.
- Forcing the responder chain by capturing strong references to controllers from deep views instead of letting `nil`-targeted actions resolve the handler.

## References

- **Documentation:** [UIViewController](https://developer.apple.com/documentation/uikit/uiviewcontroller)
- **Documentation:** [UIWindowScene](https://developer.apple.com/documentation/uikit/uiwindowscene)
- **Documentation:** [registerForTraitChanges(_:handler:)](https://developer.apple.com/documentation/uikit/uitraitchangeobservable-67e94/registerfortraitchanges(_:handler:))
- **Documentation:** [TN3187: Migrating to the UIKit scene-based life cycle](https://developer.apple.com/documentation/technotes/tn3187-migrating-to-the-uikit-scene-based-life-cycle)
- **WWDC:** [What's new in UIKit (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/243/)
- **WWDC:** [Unleash the UIKit trait system (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10057/)

## See also

For deciding whether a screen belongs in UIKit at all, see `choosing-ui-toolkit`. For wrapping UIKit views inside SwiftUI or hosting SwiftUI in a UIKit app, see `swiftui-core` and the interop guidance it references. For the observable model layer that now feeds both UIKit and SwiftUI, see `swiftui-state-flow`.
