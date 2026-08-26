---
name: choosing-apple-platforms
description: Decision router for which Apple platforms a codebase should target and what each one actually costs — iPhone and iPad from one target, the three routes onto the Mac, and the separate entry costs of watchOS, tvOS, visionOS, and CarPlay. Use when scoping a new app's platform matrix, estimating the effort of a port, deciding whether a watch or TV app is worth building, planning how much of a SwiftUI core can be shared, or answering the question of what genuinely does not carry across.
---

## When to use

Reach for this skill when scoping which Apple platforms a product will ship on, when a stakeholder asks "should we build a watch app?", when estimating what a Mac or visionOS port really costs, or when structuring a codebase so that a future platform is a target rather than a rewrite. It routes the decision and hands off to the per-platform code skills; it does not teach any one platform.

## Core guidance

The question is never "one codebase or six." With SwiftUI and local Swift packages, the model, networking, persistence, and formatting layers share almost completely. What does not share is the **interaction model**, and that is where every platform's real cost sits:

| Platform | Input model | Attention span | Target shape |
|---|---|---|---|
| iPhone / iPad | Touch, pointer, keyboard, Pencil | Minutes | One target, adaptive layout |
| Mac | Pointer, keyboard, menu bar | Long, multi-window | Extra target, or Catalyst |
| watchOS | Digital Crown, tap, voice | Seconds | Separate target and app design |
| tvOS | Focus + Siri Remote, no touch | Long, lean-back | Separate target, refocused UI |
| visionOS | Gaze and pinch, spatial | Varies | Compatibility mode or native target |
| CarPlay | Templates, brief glances | Seconds, driving | A scene on the iOS app, entitlement-gated |

Price each platform by that row, not by "we already have SwiftUI." Two facts set the baseline: Xcode offers a Multiplatform app template, and Apple states plainly that SwiftUI is the preferred choice for visionOS and **required** for watchOS apps. A UIKit-centred codebase therefore starts every non-iOS conversation further back.

### Tier 0 — iPhone and iPad: one target, effectively mandatory

Same binary, same code. The cost is layout adaptation: `NavigationSplitView` and size-class branching, multitasking and window resizing, hardware keyboard and pointer support, and Apple Pencil where it fits. This is not a separate platform decision for a new iOS app; treat it as part of shipping on iOS at all.

### Tier 1 — Mac: three genuinely different routes

- **Native multiplatform target (SwiftUI).** The best result and the most shared code for a SwiftUI codebase. The added work is Mac-shaped: menu bar commands, multiple windows, a `Settings` scene, pointer hover and right-click menus, sandboxing, and notarization for direct distribution. Default choice for greenfield.
- **Mac Catalyst.** Apple frames it exactly as "a version of your iPad app that users can run on a Mac," enabled by a checkbox in the iPad target's settings. It is the pragmatic route when a large UIKit iPad codebase exists. Budget real Mac work anyway — a stretched iPad layout with no menu commands, no resizing, and no hover reads as foreign — and note that a Catalyst app can reach only the AppKit APIs explicitly marked available for Catalyst, so "drop down to AppKit" is not an unlimited escape hatch.
- **iPhone and iPad apps on Apple silicon Macs.** Not an engineering decision at all: apps are made available on the Mac App Store for Apple silicon **by default**, and you opt out in App Store Connect under Pricing and Availability. There is no porting process — the app runs against the same iOS frameworks. Correspondingly limited: reasonable as a floor for a utility, not a Mac strategy.

### Tier 2 — watchOS: a different app that shares a model

A separate target in the same project, written in SwiftUI — which is not a preference here but a requirement, since Apple states SwiftUI is required for watchOS apps. Design it for a few seconds of attention rather than as a resized phone screen. The entry costs are concrete: an app structure built around the Digital Crown, tiny navigation, and the Always On state (`watchos-app-structure`); complications and Smart Stack entries built with WidgetKit against a reload budget, since ClockKit-based complications are deprecated from watchOS 10 (`watchos-complications`); a data bridge to the phone via WatchConnectivity, because the watch is a separate device running a separate process (`watchos-connectivity`); and, for fitness products, HealthKit workout sessions, which remain the watch's route to sustained background runtime even though the API itself now also ships on iOS and iPadOS 17 and later (`watchos-workouts`).

Worth it when the product has a genuine wrist moment — health and fitness, notifications, quick capture, timers, transit. Not worth it for reading, browsing, long forms, or anything needing sustained attention.

### Tier 3 — tvOS: rebuild the interaction, keep the model

A separate target whose UI must be rethought around **focus**, not touch. Apple is unambiguous: on Apple TV the interface is controlled indirectly by a remote, and UIKit there supports focus-based interfaces only. Two consequences that surprise people porting a phone screen — exactly one item can be focused at a time, and there is no API to set focus directly or push it in a direction; you can only shape what the focus engine chooses (`tvos-focus-engine`). Layout follows 10-foot-UI and overscan rules, and the app gets a layered icon and a Top Shelf extension (`tvos-app-structure`). If the product is video, most of the payoff is in the system player and its tvOS-only transport surface (`tvos-media-playback`).

Worth it for media consumption, games, and fitness video. Close to worthless for productivity, transactional, and communication apps.

### Tier 4 — visionOS: a checkbox and a discipline, not one thing

Two very different levels. A **compatible** iPhone or iPad app links against the iOS SDK and runs on visionOS in a flat window with essentially no engineering — Xcode adds a "Designed for iPad" runtime destination automatically, and the App Store makes such apps available by default. That is a distribution outcome, not a spatial product, and it comes with real gaps: Core Motion, most location services, HealthKit data, and camera capture are unavailable in compatible mode, so an app that depends on them may be broken rather than merely flat.

A **native** visionOS app is a design discipline: bounded windows and volumes via `.windowStyle(.volumetric)` with physical sizing, ornaments, and glass backgrounds under the Shared Space rules (`visionos-windows-volumes`), plus `ImmersiveSpace` scenes in mixed, progressive, and full styles when the experience should leave the window — only one immersive space can be open at a time (`visionos-immersive-spaces`). Gaze-and-pinch input, depth, and comfort constraints have no 2D equivalent.

Worth native investment for spatial-native categories. Do not mistake compatibility mode for having shipped on visionOS.

### CarPlay: not a platform, but the most gated surface

CarPlay is an extra scene on your existing iOS app, not a separate product. The blocker is administrative: **Apple grants the CarPlay entitlement per app category, and it is not a capability you check on in Xcode.** You request it on the developer site, agree to the CarPlay Entitlement Addendum, and Apple reviews the request against predefined criteria before adding it to your account as a managed capability — after which you must turn automatic signing off and manage an entitlements file by hand. The framework compiles fine without the entitlement, and the app then simply never appears in the car.

Eligibility is category-based (audio, communication, navigation, EV charging, parking, and quick food ordering carry documented entitlement keys; Apple lists several further categories, including fueling, driving task, and public safety). An app that fits no supported category cannot ship a CarPlay experience at all — check this before estimating anything. Once granted, the UI is composed from system templates rather than your own views; only navigation apps get a drawable window, and even they must render map content there and everything else as templates (`carplay-templates`, `hig-carplay-design`). Note the common false start: an audio app that only wants background playback and the system Now Playing screen needs no CarPlay entitlement.

### What genuinely does not port

- **The imperative toolkits.** AppKit is macOS-only; UIKit does not exist on macOS except through Catalyst, and watchOS has no UIKit at all. A UIKit-heavy codebase shares less than a SwiftUI one.
- **Input assumptions.** Touch does not exist on tvOS or the Mac; hover and right-click do not exist on iOS; the Digital Crown and gaze have no counterpart anywhere else. Gesture code is rarely portable.
- **Specific frameworks, unevenly.** Web content is the sharpest edge: WebKit and `WKWebView` exist on iOS, iPadOS, macOS, and visionOS but on neither watchOS nor tvOS, so any feature built on an embedded web view simply cannot travel there. ARKit is iOS, iPadOS, and visionOS only. RealityKit is absent from watchOS and only reached tvOS in the 26 cycle. HealthKit and WidgetKit have no tvOS. `PHPickerViewController` is absent from watchOS and tvOS, and `MKMapView` is absent from watchOS even though MapKit itself is present — SwiftUI's `Map` is the watch path. WatchConnectivity has no macOS or tvOS. StoreKit and Core Bluetooth, by contrast, are available across all six.
- **Dense UI.** Deep hierarchies, long forms, wide tables, and keyboard-heavy flows do not survive the trip to the watch, the TV, or the car regardless of framework support.

Check the availability line on every framework a shared layer imports before promising a target will build; the list above is the shape of the problem, not a substitute for that check.

### Structure so that platforms stay cheap

Push the model, networking, persistence, and formatting into local Swift packages and keep each platform target thin (`modularization-local-spm`). Branch with `#if os(...)` at the leaves — a view, an input handler — never through the middle of business logic. A codebase organized this way turns a new platform into a UI project; one organized around a single app target turns it into a rewrite.

## Platform notes

- Sequence investment rather than declaring a matrix: iPhone and iPad first, then the Mac if the product has a desk-bound use, then exactly one of watch, TV, or vision based on the product's actual moment. Every additional platform multiplies QA, localization, release management, and App Review surface.
- watchOS, tvOS, and visionOS targets ship inside the same app record for distribution purposes, but they are separately designed products; staffing them as "a sprint of porting" is the most common estimation error.
- Design guidance is platform-specific and worth reading before committing engineering: `hig-designing-for-ios`, `hig-designing-for-ipados`, `hig-designing-for-macos`, `hig-designing-for-watchos`, `hig-designing-for-tvos`, and `hig-designing-for-visionos`.

## Pitfalls

- **Shipping a resized phone UI to the watch or the TV.** It will compile, render, and be unusable — on tvOS because nothing takes focus, on watchOS because the interaction is too long.
- **Building CarPlay before requesting the entitlement,** then discovering a months-long gate or that the app fits no supported category.
- **Treating the visionOS compatibility checkbox as a visionOS launch,** and reporting platform coverage you have not earned.
- **`#if os(...)` forests inside shared view code,** which produce a file that is harder to reason about than two clean per-platform views.
- **Assuming a framework is everywhere.** A shared package that imports something unavailable on watchOS or tvOS fails at build time on the target you added last, usually late.
- **Counting platforms instead of users.** Reach and product fit justify a platform; a complete-looking matrix does not.

## References

- **Documentation:** [SwiftUI technology overview](https://developer.apple.com/documentation/technologyoverviews/swiftui)
- **Documentation:** [Mac Catalyst](https://developer.apple.com/documentation/uikit/mac-catalyst)
- **Documentation:** [Making your app compatible with visionOS](https://developer.apple.com/documentation/visionos/making-your-app-compatible-with-visionos)
- **Documentation:** [watchOS apps](https://developer.apple.com/documentation/watchos-apps)
- **Documentation:** [Requesting CarPlay entitlements](https://developer.apple.com/documentation/carplay/requesting-carplay-entitlements)
- **App Store Connect:** [iPhone and iPad apps on Macs with Apple silicon](https://developer.apple.com/help/app-store-connect/manage-your-apps-availability/manage-availability-of-iphone-and-ipad-apps-on-macs-with-apple-silicon/)
- **Human Interface Guidelines:** [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)

## See also

- watchOS: `watchos-app-structure`, `watchos-complications`, `watchos-connectivity`, `watchos-workouts`
- tvOS: `tvos-app-structure`, `tvos-focus-engine`, `tvos-media-playback`
- visionOS: `visionos-windows-volumes`, `visionos-immersive-spaces`
- CarPlay: `carplay-templates` and `hig-carplay-design`
- Structure and toolkit: `modularization-local-spm` for the shared core, and `choosing-ui-toolkit` for how much SwiftUI versus UIKit or AppKit affects what shares.
