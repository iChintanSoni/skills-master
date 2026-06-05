---
name: app-lifecycle
description: "Guides the SwiftUI App/Scene lifecycle: @main entry, scenePhase transitions, delegate adaptors, launch sequence, and state restoration. Use when structuring an app's entry point, reacting to active/inactive/background changes, deciding whether you still need a UIApplicationDelegate or NSApplicationDelegate, or restoring per-scene UI state."
---

# App lifecycle

## When to use

Reach for this skill when you define an app's entry point, choose between the
SwiftUI lifecycle and a UIKit/AppKit delegate, react to foreground/background
transitions, or restore where the user left off. It applies to any app whose
top type conforms to `App` and is marked `@main`. If you are wiring push
tokens, deep links, or scene reconnection callbacks, decide here whether a
delegate adaptor is required before scattering UIKit code through the app.

## Core guidance

- **Do** declare exactly one `@main struct …: App` whose `body` returns a
  `Scene` (typically `WindowGroup`). The system instantiates the type and
  drives every transition; you never call `UIApplicationMain`.
- **Do** observe lifecycle with `@Environment(\.scenePhase)` plus
  `onChange(of:)`. The three phases are `.active`, `.inactive`, and
  `.background`; launch runs `inactive → active`, backgrounding runs
  `active → inactive → background`.
- **Do** persist on `.background` (the last reliable point before suspension)
  and refresh time-sensitive state on `.active`. Treat `.inactive` as a brief
  "pause animations / hide sensitive content" window, not a save point.
- **Do** add a delegate only when SwiftUI has no equivalent: APNs token
  registration, third-party SDK init in `didFinishLaunching`, custom
  `UISceneConfiguration`, or callbacks like `didReceiveRemoteNotification`.
  Use `@UIApplicationDelegateAdaptor` (iOS/tvOS), `@NSApplicationDelegateAdaptor`
  (macOS), or `@WKApplicationDelegateAdaptor` (watchOS).
- **Don't** reach for a delegate to detect background/foreground — `scenePhase`
  already covers it, and a multi-window app gets one delegate but many scenes.
- **Do** restore lightweight UI state with `@SceneStorage` (selected tab,
  scroll target, draft text); it is per-scene and the system saves/restores it.
  Keep model data elsewhere and rehydrate from your store, not from storage keys.
- **Don't** put heavy work or blocking calls in `didFinishLaunching`; it delays
  first frame. Prefer `.task` on a view or the `backgroundTask` scene modifier.

```swift
@main
struct ReadingApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var delegate
    @Environment(\.scenePhase) private var phase

    var body: some Scene {
        WindowGroup {
            LibraryView()
        }
        .onChange(of: phase) { _, newPhase in
            if newPhase == .background { ModelStore.shared.flush() }
        }
    }
}
```

## Platform notes

- **iOS / iPadOS / visionOS:** Multiple `WindowGroup` scenes can coexist; each
  has its own `scenePhase` and `@SceneStorage`. Adopt the delegate adaptor for
  APNs and for returning a `UISceneConfiguration` when you need a custom
  `UISceneDelegate`.
- **macOS:** Use `@NSApplicationDelegateAdaptor`; `applicationShouldTerminateAfterLastWindowClosed`
  and dock/menu behavior still live on `NSApplicationDelegate`. App phase rarely
  reaches `.background` the way iOS does.
- **watchOS:** Use `@WKApplicationDelegateAdaptor`. Background runtime is tightly
  budgeted; schedule work with `WKApplication` refresh tasks, not ad-hoc timers.
- **tvOS:** Lifecycle mirrors iOS; the top shelf and focus engine still rely on
  delegate hooks for some advanced cases.

## Pitfalls

- Observing `scenePhase` only at the `App` level when you need per-view
  reactions — read it from the `@Environment` inside the relevant view too.
- Assuming `.background` always fires before death. The system can jump straight
  to termination from the background; do not defer critical saves past it.
- Storing large or sensitive values in `@SceneStorage` — it is unencrypted and
  meant for small UI hints. Use the Keychain for secrets, your store for models.
- Forgetting the `@unknown default` case in a `scenePhase` switch; the enum can
  gain cases, and Swift 6 strict switches will warn.
- Putting two `@main` types in one target, which fails to build.

## References

- **Documentation:** [ScenePhase](https://developer.apple.com/documentation/swiftui/scenephase)
- **Documentation:** [UIApplicationDelegateAdaptor](https://developer.apple.com/documentation/swiftui/uiapplicationdelegateadaptor)
- **Documentation:** [Restoring your app's state with SwiftUI](https://developer.apple.com/documentation/swiftui/restoring-your-app-s-state-with-swiftui)
- **WWDC:** [App essentials in SwiftUI (WWDC20)](https://developer.apple.com/videos/play/wwdc2020/10037/)
- **WWDC:** [Efficiency awaits: Background tasks in SwiftUI (WWDC22)](https://developer.apple.com/videos/play/wwdc2022/10142/)
- **WWDC:** [Finish tasks in the background (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/227/)

## See also

Pair this with a scenes-and-windows skill for `WindowGroup`, `DocumentGroup`,
and multi-window management, and with a background-tasks skill for the
`backgroundTask` scene modifier and `BGTaskScheduler`. A push-notifications
skill covers the delegate callbacks that motivate the adaptor, and a
SwiftData or persistence skill covers where model state should actually live
when you flush on `.background`.
