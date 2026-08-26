---
name: carplay-templates
description: "Implements a CarPlay app with the CarPlay framework — CPTemplateApplicationScene plus its scene delegate, the CPInterfaceController template stack, and the system template catalog (list, grid, tab bar, now playing, point of interest, information, map, search, contact, alert, action sheet). Use when wiring the CarPlay scene manifest into Info.plist, requesting the Apple-granted CarPlay entitlement for an app category, pushing and popping templates, respecting vehicle-imposed list and tab limits, adding a Dashboard or instrument-cluster scene, or testing in the CarPlay Simulator."
license: MIT
globs:
  - "**/*.swift"
tags: [scenes, entitlements, in-car, uikit]
x-skills-master:
  domain: apple
  class: code
  category: form-factors
  platforms: [ios]
  requires:
    ios: "14"
    swift: "6.0"
  pairs_with: [hig-carplay-design, choosing-apple-platforms, now-playing]
  sources:
    - https://developer.apple.com/documentation/carplay
    - https://developer.apple.com/documentation/carplay/requesting-carplay-entitlements
    - https://developer.apple.com/documentation/carplay/displaying-content-in-carplay
  snapshot_date: "2026-08-25"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for this skill when you implement the in-car surface of an iOS app: adding a CarPlay scene to an existing target, choosing and composing `CPTemplate` subclasses, driving the template stack from a `CPInterfaceController`, or diagnosing why an app never appears on the CarPlay Home screen. It is the code counterpart to the CarPlay HIG skill — that one decides *what* the in-car experience should be, this one wires it up. A CarPlay app is not a separate target or product: it is your existing iOS app plus an extra scene, an entitlement, and a template hierarchy. Skip this skill for audio apps that only need background playback and the system Now Playing screen, which come from `MPNowPlayingInfoCenter` and the audio session rather than the CarPlay framework.

## Core guidance

- **The entitlement gates everything, and Apple grants it.** CarPlay is not a capability you check on in Xcode. Request the entitlement for your app's category on the developer site, agree to the CarPlay Entitlement Addendum, and wait for Apple to review against its published criteria. Only then does the capability appear on your App ID as a managed capability. Documented entitlement keys map one-to-one to categories: `com.apple.developer.carplay-audio`, `-communication`, `-charging`, `-maps`, `-parking`, `-quick-ordering` (plus the legacy `-messaging`). Plan for the review lead time; the framework compiles fine without the entitlement and then silently fails to launch in the car.
- **Sign explicitly, not automatically.** After the entitlement lands you must add an entitlements plist, point the target's `CODE_SIGN_ENTITLEMENTS` build setting at it, turn off automatic signing, and download the CarPlay provisioning profile. Automatic signing does not pick up managed CarPlay capabilities.
- **Declare the scene in the manifest — the class name is fixed.** Under `UIApplicationSceneManifest` → `UISceneConfigurations`, add a `CPTemplateApplicationSceneSessionRoleApplication` array whose entry sets `UISceneClassName` to `CPTemplateApplicationScene` and `UISceneDelegateClassName` to your own delegate class. You never instantiate the scene yourself. Keep `UIApplicationSupportsMultipleScenes` true so the phone UI and the car UI coexist.
- **Own the interface controller from the connect callback.** Implement `CPTemplateApplicationSceneDelegate` (it refines `UISceneDelegate` and is `@MainActor`). Store the `CPInterfaceController` handed to `templateApplicationScene(_:didConnect:)` and immediately call `setRootTemplate(_:animated:completion:)`. Release it in the matching disconnect callback so you never message a dead controller.
- **Navigation apps get a window; nobody else does.** Only apps with the maps entitlement receive the second callback shape, `templateApplicationScene(_:didConnect:to:)`, which supplies a `CPWindow`. Draw map content into that window's root view controller and nothing else — alerts, overlays, and buttons must come from templates.
- **Navigate with the controller, not with view controllers.** `pushTemplate(_:animated:completion:)` / `popTemplate(animated:completion:)` / `popToRootTemplate(animated:completion:)` / `pop(to:animated:completion:)` manage the stack; `presentTemplate(_:animated:completion:)` and `dismissTemplate(animated:completion:)` handle the single modal slot (alerts, action sheets, voice control). `showOverlayTemplate(_:animated:completion:)` is the overlay variant. Read `rootTemplate`, `topTemplate`, `templates`, and `presentedTemplate` instead of tracking stack state yourself.
- **Pick from the catalog; there is no custom drawing.** `CPListTemplate` (sections of `CPListItem` / `CPMessageListItem` / `CPListImageRowItem`), `CPGridTemplate`, `CPTabBarTemplate` as a container of other templates, `CPNowPlayingTemplate.shared` for playback, `CPPointOfInterestTemplate` and `CPInformationTemplate` for place and order detail, `CPContactTemplate` for a person or business, `CPMapTemplate` plus `CPSearchTemplate` and `CPVoiceControlTemplate` for navigation, and `CPAlertTemplate` / `CPActionSheetTemplate` for modals.
- **Treat the vehicle's limits as runtime facts.** Templates publish their caps as type properties — `CPListTemplate.maximumItemCount`, `CPListTemplate.maximumSectionCount`, `CPTabBarTemplate.maximumTabCount`, `CPAlertTemplate.maximumActionCount`, the `CPGridTemplateMaximumItems` constant. Read them rather than hard-coding numbers; the head unit can lower them further. `CPSessionConfiguration` reports the live per-vehicle picture through `limitedUserInterfaces` (a `CPLimitableUserInterface` option set covering keyboard and list-length limits) and `contentStyle`. Truncate or paginate against those values instead of assuming a fixed length.
- **Keep the Now Playing template shared and observed.** `CPNowPlayingTemplate` is a system singleton reached through `.shared`; you configure its buttons and register a `CPNowPlayingTemplateObserver`, you do not construct one.

```swift
final class CarPlaySceneDelegate: UIResponder,
                                  CPTemplateApplicationSceneDelegate {
    private var interfaceController: CPInterfaceController?

    func templateApplicationScene(_ scene: CPTemplateApplicationScene,
                                  didConnect controller: CPInterfaceController) {
        interfaceController = controller
        let cap = CPListTemplate.maximumItemCount
        let rows = Library.recent.prefix(cap).map { album in
            CPListItem(text: album.title, detailText: album.artist)
        }
        let list = CPListTemplate(title: "Recent",
                                  sections: [CPListSection(items: Array(rows))])
        controller.setRootTemplate(list, animated: false, completion: nil)
    }

    func templateApplicationScene(_ scene: CPTemplateApplicationScene,
                                  didDisconnectInterfaceController
                                  controller: CPInterfaceController) {
        interfaceController = nil
    }
}
```

## Platform notes

- **iOS only.** CarPlay ships as part of iOS; the framework's iPadOS and Mac Catalyst availability exists for source compatibility, not for a real product surface. The car display is driven from the connected iPhone. Set the skill's platform expectations accordingly: there is no watchOS, tvOS, or visionOS story.
- **Availability floors.** The framework and `CPInterfaceController` date to iOS 12; `CPTemplateApplicationScene` and its delegate to iOS 13; the modern template set (`CPTabBarTemplate`, `CPNowPlayingTemplate`, `CPPointOfInterestTemplate`, `CPInformationTemplate`, `CPContactTemplate`, and the `maximumItemCount` limits) to iOS 14. Treat iOS 14 as the practical floor and use the pre-scene `CPApplicationDelegate` path only if you still support iOS 12.
- **Dashboard scene (navigation apps, iOS 13.4+).** Add `CPSupportsDashboardNavigationScene` to the scene manifest plus a `CPTemplateApplicationDashboardSceneSessionRoleApplication` configuration using `CPTemplateApplicationDashboardScene`. The session role and class names differ from the main scene — mismatching them is the usual reason the Dashboard stays empty. Set `CPDashboardController.shortcutButtons` to at most two buttons.
- **Instrument cluster (iOS 15.4+).** `CPTemplateApplicationInstrumentClusterScene` and `CPInstrumentClusterController` feed the cluster and head-up display for navigation apps, again through their own scene session role.
- **Recent additions.** iOS 18.4 brought the Now Playing mode family (`CPNowPlayingMode`, `CPNowPlayingModeSports`, `CPSportsOverlay`). iOS 26.4 added `CPPlaybackConfiguration` and `CPSessionConfiguration.supportsVideoPlayback`, so playback apps can ask whether the connected system renders video at all. The iOS 27 cycle introduces the panel family — `CPPanel`, `CPMapPanel`, `CPPanelItem`, `CPPanelSection`, and `CPPanel.maximumPanelItemsCount` — plus `CPNowPlayingTemplate.allowsMiniPlayer`, which opts playback into the compact mini-player surface rather than being a template you construct. Confirm any newly announced category or surface against the framework reference before adopting it; announcement names and symbol names do not always match, and several iOS 27 additions are still marked beta.
- **Simulator.** Build and run to the iOS simulator, then choose I/O ▸ External Displays ▸ CarPlay. The window is 800×480 at @2x. Navigation apps unlock extra size and scale options after `defaults write com.apple.iphonesimulator CarPlayExtraOptions -bool YES`. The simulator cannot exercise a locked iPhone, Siri, or audio-focus interactions — test those in a vehicle or aftermarket head unit, ideally a wireless one so you can keep the Xcode debugger attached.

## Pitfalls

- Building and shipping against the framework without the granted entitlement: everything compiles, and the app simply never appears in the car.
- Leaving automatic signing on after adding the entitlement, so the CarPlay capability is never embedded in the profile.
- Typing the session role or scene class name by hand and getting the Dashboard or cluster variant wrong — the app silently omits that surface with no diagnostic.
- Drawing anything but map content into the navigation `CPWindow`; overlays and alerts drawn there are a review rejection, not a rendering bug.
- Hard-coding list lengths instead of reading `CPListTemplate.maximumItemCount` and `CPSessionConfiguration.limitedUserInterfaces`, which produces truncated or rejected templates on stricter vehicles.
- Constructing a `CPNowPlayingTemplate` instead of using `.shared`, or forgetting to remove a `CPNowPlayingTemplateObserver` on disconnect.
- Not retaining the `CPInterfaceController` from the connect callback, or retaining it past disconnect and messaging it later.
- Requiring keyboard text entry in a flow that must work while driving — `CPLimitableUserInterface` exists precisely because many vehicles disallow it.
- Treating the CarPlay scene like the phone scene and sharing view-controller state across both; the two scenes have independent lifecycles and can connect and disconnect in any order.
- Testing only in the simulator and never with a locked phone, so the "unlock your iPhone to continue" path ships.

## References

- **Documentation:** [CarPlay](https://developer.apple.com/documentation/carplay)
- **Documentation:** [Requesting CarPlay Entitlements](https://developer.apple.com/documentation/carplay/requesting-carplay-entitlements)
- **Documentation:** [Displaying Content in CarPlay](https://developer.apple.com/documentation/carplay/displaying-content-in-carplay)
- **Documentation:** [Using the CarPlay Simulator](https://developer.apple.com/documentation/carplay/using-the-carplay-simulator)
- **Documentation:** [CPTemplateApplicationScene](https://developer.apple.com/documentation/carplay/cptemplateapplicationscene)
- **Human Interface Guidelines:** [CarPlay](https://developer.apple.com/design/human-interface-guidelines/carplay)
- **WWDC:** [Turbocharge your app for CarPlay (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/216/)

## See also

Pair this with the CarPlay design skill for category eligibility, template depth caps, and glanceability critique before you write any scene code. For audio apps, combine it with a media-playback skill covering `AVAudioSession`, background modes, and `MPNowPlayingInfoCenter`, since the shared Now Playing template reflects that state rather than owning it. For navigation apps, a MapKit or map-rendering skill covers what you actually draw into the `CPWindow`. A scene-lifecycle skill for UIKit explains the `UISceneDelegate` machinery that the CarPlay scene delegate refines.
