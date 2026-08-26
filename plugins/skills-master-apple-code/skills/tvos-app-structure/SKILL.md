---
name: tvos-app-structure
description: "Structures a tvOS app in SwiftUI: the App and scene entry point, TabView with sidebar-adaptable navigation, NavigationStack and NavigationSplitView on the big screen, safe-area and overscan discipline for the 10-foot UI, a TVServices Top Shelf extension, the layered AppIcon image stack, the TVUIKit views that still have no SwiftUI equivalent, and multi-user personalization on a shared Apple TV. Use when starting or restructuring an Apple TV target, laying out top-level navigation, shipping a Top Shelf extension, or adapting an iOS codebase to tvOS."
license: MIT
---

## When to use

Reach for this skill when you create an Apple TV target, decide how a tvOS app's top level is organized, or port an existing iPhone/iPad codebase to the living room. It covers the scene and navigation scaffolding, the layout constraints a television imposes, the Top Shelf extension that represents your app on the Home Screen, the layered app icon, the corners of TVUIKit that SwiftUI has not replaced, and per-person data on a device several people share.

It stops at the edge of interaction: how focus actually moves between the views you build belongs to `tvos-focus-engine`, and full-screen video belongs to `tvos-media-playback`.

## Core guidance

### Scene and navigation scaffold

- **Do** use a plain SwiftUI `App` with a single `WindowGroup`. tvOS shows one full-screen scene; there is no multi-window, no split view, and no size-class adaptation to design for.
- **Do** build the top level from `TabView` with the `Tab` and `TabSection` types (tvOS 18) rather than the older `tabItem` overlay. Apply `.tabViewStyle(.sidebarAdaptable)` so the same declaration renders as the top tab bar or expands into a sidebar. `TabRole.search` marks the search destination; tvOS 27 adds `TabRole.prominent` and `defaultTabBarPlacement(_:)` for pinning to `.sidebar` or `.topBar` when the system cannot adapt between both.
- **Do** put a `NavigationStack` inside each tab, not around the `TabView` — pushing a detail should not blow away the tab bar. `NavigationSplitView` (tvOS 16) is available and works for a browse-then-detail catalog, but a top tab bar plus stacks is the more conventional tvOS shape.
- **Do** attach `.searchable(text:placement:prompt:)` (tvOS 16) to the search tab's content. tvOS renders the system keyboard and dictation for you; do not build a custom on-screen keyboard.
- **Do** use `.buttonStyle(.card)` (`CardButtonStyle`, tvOS 14) for poster and artwork buttons. It adds no padding of its own and applies the system's focus treatment — on tvOS 26 and later, a Liquid Glass effect — so your artwork fills the card exactly.

```swift
@main
struct CatalogApp: App {
    @State private var selection: Section = .browse

    var body: some Scene {
        WindowGroup {
            TabView(selection: $selection) {
                Tab("Browse", systemImage: "square.grid.2x2", value: .browse) {
                    NavigationStack { BrowseView() }
                }
                Tab(value: .search, role: .search) {
                    NavigationStack { SearchView() }
                }
            }
            .tabViewStyle(.sidebarAdaptable)
        }
    }
}
```

### Laying out for a screen across the room

- **Do** keep every readable or actionable element inside the safe area. Televisions overscan, and the outer margin is not guaranteed to be visible. Apply `.ignoresSafeArea()` only to full-bleed background artwork, never to text, controls, or focusable cards.
- **Do** size everything up. Body copy that reads on a phone is illegible at three metres; prefer a few large targets over dense tables. Keep interactive elements far enough apart that a single directional swipe cannot skip past one.
- **Don't** ship pointer- or touch-only affordances — long press, swipe-to-delete, drag reordering, hover tooltips. Every action must be reachable as a focusable control.
- **Do** reach for `GlassEffectContainer` and `.glassEffect(_:in:)` (tvOS 26) for your own floating chrome so it matches the system's translucent surfaces, and keep those surfaces light so the content behind stays visible.

### Top Shelf extension

- **Do** add a Top Shelf app extension and subclass `TVTopShelfContentProvider` (tvOS 13), returning content from `loadTopShelfContent()` — an `async` variant exists alongside the completion-handler form. Call `topShelfContentDidChange()` when your data changes so the system refetches.
- **Do** pick the content shape deliberately: `TVTopShelfCarouselContent` for a large hero rotation (its `TVTopShelfCarouselItem` carries `summary`, `genre`, `duration`, plus `cinemagraphURL` and `previewVideoURL`), `TVTopShelfSectionedContent` for grouped rows, `TVTopShelfInsetContent` for a single inset banner.
- **Do** attach a `TVTopShelfAction` built from a URL to each item, and handle that URL as a deep link in the app. The extension runs whether or not your app is running.
- **Don't** do real work in the extension. Apple documents that extension memory limits are far lower than an app's and that exceeding them gets the extension terminated — precompute top-shelf payloads on your server and have the extension read a cached result.

### App icon and Top Shelf art

- **Do** keep tvOS icons in an asset catalog. Icon Composer covers iOS, iPadOS, macOS, watchOS, and the App Store; tvOS and visionOS targets still use an `AppIcon` image stack. The tvOS asset catalog exposes an "App Icon & Top Shelf Image" group holding the icon and launch image sets.
- **Do** build the stack as separate layers rendered back-to-front — tvOS supports up to five (visionOS caps at three) — so the system can drive the parallax tilt on focus. Leave a safe margin inside every layer so the foreground is not clipped as it shifts, and keep the back layer opaque.
- **Do** author and preview those layers with Parallax Previewer or the Parallax Exporter plug-in, importing `.lsr` files into the catalog. Check the icon's Attributes inspector for whether the tvOS entry is set to Single Size or All Sizes and supply assets to match — Apple's own guidance reads both ways here, so confirm against the catalog rather than assuming.

### TVUIKit and multi-user

- **Do** stay in SwiftUI, and drop into TVUIKit (tvOS 12) via `UIViewRepresentable`/`UIViewControllerRepresentable` only for the pieces with no SwiftUI counterpart: `TVDigitEntryViewController` for PIN and passcode entry, and `TVCollectionViewFullScreenLayout` with `TVCollectionViewFullScreenCell` for edge-to-edge paging galleries. `TVLockupView`, `TVPosterView`, `TVCardView`, `TVCaptionButtonView`, and `TVMonogramView` exist but a SwiftUI card with `.buttonStyle(.card)` covers the same ground with less bridging.
- **Do** decide the sharing model early. Enabling the `Runs as Current User` privilege in the `com.apple.developer.user-management` capability gives your app the current Apple TV account's keychain, preferences, iCloud, and Game Center data; without it the app always runs as the default user. Save state in `applicationWillResignActive(_:)` and `applicationWillTerminate(_:)` because a user switch can happen while you are foregrounded.
- **Do** use `TVUserManager` (tvOS 13) only for `shouldStorePreferencesForCurrentUser` — most of the older profile-mapping surface on that class is deprecated. If your service has its own in-app profiles rather than separate accounts, map those to Apple TV users instead of adopting Runs as Current User.

## Platform notes

- **tvOS only.** Nothing here transfers to iOS or macOS. `CardButtonStyle`, TVServices, and TVUIKit are tvOS-exclusive; `Tab`/`TabSection`/`.sidebarAdaptable` are cross-platform but render as a top bar or sidebar here rather than a bottom bar.
- **Deployment floors worth guarding.** `Tab`, `TabSection`, `TabRole`, and `.sidebarAdaptable` need tvOS 18; `TabRole.prominent` and `defaultTabBarPlacement(_:)` need tvOS 27. `NavigationStack`, `NavigationSplitView`, and `.searchable` land at tvOS 16; `CardButtonStyle` and `WindowGroup` at tvOS 14; Liquid Glass at tvOS 26.
- **Liquid Glass is hardware-tiered.** The full material needs newer Apple TV hardware; verify the layout still reads on older models that fall back to flatter surfaces.
- **TVMLKit** (tvOS 9) still exists for client-server apps whose UI is delivered as TVML and JavaScript. It is a separate architecture, not a supplement to a SwiftUI app — pick one.

## Pitfalls

- Shipping an iOS layout unchanged: small type, dense grids, bottom tab bars, and tap-only controls all break at ten feet.
- Wrapping the `TabView` in a `NavigationStack` instead of the reverse, so every push replaces the whole app chrome.
- Applying `.ignoresSafeArea()` to a content container rather than a background, letting overscan crop titles and buttons on real televisions.
- Doing network or image work inside the Top Shelf extension and getting terminated for memory — the tight extension budget is documented, not incidental.
- A flat, single-layer app icon: with one layer there is no parallax, and content pushed to a layer's edge clips during the tilt.
- Assuming Icon Composer covers tvOS, then finding the target has no icon because the `AppIcon` asset catalog was removed.
- Persisting user data without deciding on the multi-user model, so two people in a household overwrite each other's watch history.

## References

- **Documentation:** [TV Services](https://developer.apple.com/documentation/tvservices)
- **Documentation:** [TVUIKit](https://developer.apple.com/documentation/tvuikit)
- **Documentation:** [Personalizing your app for each user on Apple TV](https://developer.apple.com/documentation/tvservices/personalizing-your-app-for-each-user-on-apple-tv)
- **Documentation:** [Configuring your app icon using an asset catalog](https://developer.apple.com/documentation/xcode/configuring-your-app-icon)
- **Documentation:** [TabView](https://developer.apple.com/documentation/swiftui/tabview)
- **Human Interface Guidelines:** [Designing for tvOS](https://developer.apple.com/design/human-interface-guidelines/designing-for-tvos)

## See also

- **hig-designing-for-tvos** — the design-side counterpart: 10-foot layout judgment, imagery, and Top Shelf art direction.
- **tvos-focus-engine** — how focus reaches and moves between the views this skill lays out.
- **tvos-media-playback** — the full-screen player a catalog app pushes to from these screens.
- A SwiftUI navigation skill for `NavigationStack` paths and deep links, which behave the same on tvOS as elsewhere.
