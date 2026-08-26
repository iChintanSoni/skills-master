---
name: watchos-app-structure
description: "Builds the skeleton of a SwiftUI watchOS app — App and scene declaration, NavigationStack and NavigationSplitView on a tiny screen, vertical-page TabView, Digital Crown input, watch toolbars, safe-area and scene-padding layout, the frontmost/Always On lifecycle, background refresh tasks, and extended runtime sessions. Use when starting an Apple Watch app, porting an iPhone screen to the wrist, wiring digitalCrownRotation, laying out for multiple watch sizes, or deciding how the app keeps running after the wrist drops."
globs:
  - "**/*.swift"
tags: [watchos, swiftui, digital-crown, always-on, extended-runtime]
x-skills-master:
  domain: apple
  class: code
  category: form-factors
  platforms: [watchos]
  requires:
    watchos: "10"
    swift: "6.0"
  pairs_with: [hig-designing-for-watchos, watchos-complications, watchos-connectivity, choosing-apple-platforms]
  sources:
    - https://developer.apple.com/documentation/watchos-apps
    - https://developer.apple.com/documentation/watchkit/using-extended-runtime-sessions
    - https://developer.apple.com/documentation/watchos-apps/designing-your-app-for-the-always-on-state
  snapshot_date: "2026-08-25"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for this skill when you are building the *app* part of a watchOS experience: the scene graph, the navigation spine, the input model, and the runtime story that keeps it alive. It covers a single-target SwiftUI watch app — the modern shape, where the old WatchKit-extension split no longer exists — plus the WatchKit pieces that still matter (app delegate, background tasks, extended runtime sessions).

Use it when starting a watch target from scratch, when compressing an iPhone screen into something that reads in two seconds, or when an app dies the moment the wrist drops and you need to know which runtime mechanism actually applies. It is *not* the place for complications (see the watch complications skill), workouts (see the watch workouts skill), or phone/watch data sync (see the watch connectivity skill).

## Core guidance

- **Declare one `App` with a `WindowGroup`, and adopt watch scenes only where they exist.** A watchOS app is ordinary SwiftUI `App`/`Scene` code. Add `WKNotificationScene(controller:category:)` when you need a custom notification interface, and attach a delegate with `@WKApplicationDelegateAdaptor` (watchOS 7+) only when you need lifecycle or background-task callbacks that SwiftUI does not surface.
- **Keep hierarchies shallow.** `NavigationStack` with value-based `navigationDestination` is the default. `NavigationSplitView` exists on watchOS 9+, but the system collapses all its columns into a single stack on the watch — use it only when you genuinely share a definition with iPad/Mac, not as a watch design choice.
- **Use `TabView` for peer screens, and pick the watch style deliberately.** `.tabViewStyle(.verticalPage)` (watchOS 10+) is the crown-driven vertical pager the modern watch UI is built around; `.page` and `.carousel` are the older horizontal/carousel styles. `Tab` value syntax is available from watchOS 11. Pair the tab and navigation surfaces with `containerBackground(_:for: .tabView)` / `.navigation` so backgrounds extend correctly behind the system chrome.
- **Wire the Digital Crown as an *additional* path, never the only one.** `digitalCrownRotation(_:)` binds a value directly; the long form takes `from:through:by:sensitivity:isContinuous:isHapticFeedbackEnabled:`, and the `onChange:`/`onIdle:` overloads hand you a `DigitalCrownEvent` with `offset` and `velocity`. Show what the crown does with `digitalCrownAccessory(_:)` or `digitalCrownAccessory(content:)` (watchOS 9+). Every crown affordance needs a tap or swipe equivalent.
- **Put actions in the toolbar, not in the content.** watchOS 10 brought `topBarLeading`, `topBarTrailing`, and `bottomBar` toolbar placements to the watch; use them for the one or two actions a screen owns instead of stealing vertical space from the content.
- **Lay out against the safe area.** SwiftUI views fill the watch safe area by default; call `scenePadding()` to align text with the status bar and navigation title margins, and reach for `ignoresSafeArea()` only for background images and fills. Ship scalable PDF assets (2x with Auto Scaling set to Automatic) instead of per-size bitmaps, and support Dynamic Type — different watch sizes start at different default sizes.
- **Assume the app is inactive most of the time.** When the wrist drops, the app becomes the *frontmost* app (roughly two minutes by default, user-configurable up to an hour) and then goes to the background and is suspended. Design every screen so it is correct after a cold relaunch, not just after a resume.
- **Support Always On rather than fighting it.** Always On is enabled by default for apps built against watchOS 8+ (`WKSupportsAlwaysOnDisplay` opts out). Drive dimmed-state updates with a `TimelineView`, branch on `TimelineView.Context.Cadence` (`.live` / `.seconds` / `.minutes`) to drop sub-second detail, and read `\.isLuminanceReduced` to simplify the frame. Mark anything private with `privacySensitive()`.
- **Choose the right runtime mechanism, then request it honestly.** Background app refresh (`.backgroundTask(.appRefresh(...))`, scheduled via `WKApplication.shared().scheduleBackgroundRefresh(withPreferredDate:userInfo:scheduledCompletion:)`) gives you seconds. A background *session* — workout, location, or audio — runs for the session's life. `WKExtendedRuntimeSession` (watchOS 6+) covers self care, mindfulness, physical therapy, and smart alarm; an app declares exactly one of those in `WKBackgroundModes` and starts the session while it is running in the foreground.

```swift
@main
struct TrailApp: App {
    var body: some Scene {
        WindowGroup {
            NavigationStack {
                RouteList()
            }
        }
    }
}

struct PaceDial: View {
    @State private var pace = 8.0

    var body: some View {
        Text(pace, format: .number.precision(.fractionLength(1)))
            .font(.system(.largeTitle, design: .rounded))
            .focusable()
            .digitalCrownRotation($pace, from: 4, through: 14, by: 0.1,
                                  sensitivity: .medium, isContinuous: false)
            .digitalCrownAccessory { Text("min/mi") }
            .scenePadding(.horizontal)
    }
}
```

### watchOS 27 (WWDC 2026)

- The structural APIs above are unchanged from watchOS 26; treat watchOS 27 as a design refresh rather than a new app skeleton. Re-verify against the SDK before claiming a new scene or navigation type exists — Apple's watchOS release notes lag the API reference, and the API reference wins.

## Platform notes

- **Single-target apps.** Modern watchOS projects are one app target, not an app plus a WatchKit extension. A watch-only project still carries an inert iOS stub target that owns the root bundle identifier for Universal Purchase and device discovery; Xcode builds no iOS executable for it.
- **Independent vs dependent.** "Supports Running Without iOS App Installation" makes a companion watch app installable and usable alone. An independent app must be able to authenticate, request its own permissions, and fetch its own data — Watch Connectivity can enrich it but cannot be its primary data source. `WKCompanionAppBundleIdentifier` must match the iOS app's bundle id for a companion pair.
- **Background budget.** watchOS meters background refresh per app and throttles hard on low battery, poor conditions, or while the wearer is exercising or navigating. Historically the system only allocates background refresh time to apps with a complication on the active watch face — treat background refresh as a bonus, and always refresh on foreground launch too.
- **Overrunning a background task gets you killed** with `EXC_CRASH (SIGKILL)`. Use `withTaskCancellationHandler(operation:onCancel:)` around long `Task` work, or an `expirationHandler` on `WKRefreshBackgroundTask`, to clean up and hand long downloads to a background `URLSession`.
- **Extended runtime sessions are typed, not generic.** `start()` begins most types immediately; smart-alarm sessions use `start(at:)` up to 36 hours ahead and must play a haptic via `notifyUser(hapticType:repeatHandler:)` during the session or the system warns the wearer and offers to disable future sessions. Track `expirationDate`, and `invalidate()` as soon as you are done.
- **Screen sizes.** Series 10 and 11 are wider than earlier watches. An app built against a pre-watchOS-11 SDK is letterboxed and corner-clipped on those devices; build with the current SDK and let resizable, safe-area-respecting layouts fill the extra width instead of adding controls.

## Pitfalls

- Porting an iPhone `NavigationSplitView` and expecting columns — the watch collapses it to a stack, so the sidebar becomes a screen nobody asked for.
- Making the Digital Crown the only way to change a value, with no visible accessory and no tap alternative.
- Animating or updating sub-second content without checking `TimelineView.Context.Cadence` or `\.isLuminanceReduced`, which burns battery and looks wrong in the dimmed state.
- Treating the frontmost state as "still running": it ends after a couple of minutes, and anything not persisted is gone.
- Picking an extended runtime session type for the *runtime* it grants rather than for what the app actually does — Apple calls this out explicitly, and review does too.
- Declaring more than one extended-runtime background mode; only one is allowed (though it can coexist with `workout-processing`).
- Scheduling background refresh and assuming it fires. Design for zero background wakes and refresh on launch.
- Overriding the safe area globally with `ignoresSafeArea()` so interactive content lands under the bevel or the status bar.

## References

- **Documentation:** [watchOS apps](https://developer.apple.com/documentation/watchos-apps)
- **Documentation:** [Using extended runtime sessions](https://developer.apple.com/documentation/watchkit/using-extended-runtime-sessions)
- **Documentation:** [Designing your app for the Always On state](https://developer.apple.com/documentation/watchos-apps/designing-your-app-for-the-always-on-state)
- **Documentation:** [Using background tasks](https://developer.apple.com/documentation/watchkit/using-background-tasks)
- **Documentation:** [Supporting multiple watch sizes](https://developer.apple.com/documentation/watchos-apps/supporting-multiple-watch-sizes)
- **Documentation:** [Creating independent watchOS apps](https://developer.apple.com/documentation/watchos-apps/creating-independent-watchos-apps)
- **Human Interface Guidelines:** [Designing for watchOS](https://developer.apple.com/design/human-interface-guidelines/designing-for-watchos)

## See also

Pair this with the `hig-designing-for-watchos` design skill for what belongs on the wrist at all, the `watchos-complications` skill for the WidgetKit surfaces that most people actually interact with, and the `watchos-connectivity` skill for moving data to and from the phone. For workout-driven background runtime, use the `watchos-workouts` skill instead of an extended runtime session. Navigation and toolbar fundamentals shared with the other platforms live in the `swiftui-navigation`, `swiftui-tab-views`, and `swiftui-toolbars` skills.
