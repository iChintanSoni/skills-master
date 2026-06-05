---
name: navigation-architecture
description: Guides modeling SwiftUI navigation as serializable state with value-based NavigationStack paths, a router/coordinator owning the path, type-erased vs typed routes, deep/universal link parsing, and scene restoration. Use when designing app navigation, choosing centralized vs local navigation state, building a router, handling incoming URLs, or restoring the stack after relaunch.
---

## When to use

Reach for this skill when navigation grows beyond a couple of pushes and you need it to be testable, deep-linkable, and restorable. Concretely: you are choosing between a type-erased `NavigationPath` and a typed `[Route]` array; you want a router/coordinator that views can drive without knowing destinations; you must turn an incoming URL into a stack; or you need the stack to survive a cold relaunch. If you are still on `NavigationView`, start by migrating to `NavigationStack`/`NavigationSplitView`.

## Core guidance

- **Do** model the stack as data. Hold a `@State var path` (a typed `[Route]` or `NavigationPath`) and bind it: `NavigationStack(path: $router.path)`. Mutating the array *is* navigation; popping is `path.removeLast()`.
- **Do** prefer a typed `enum Route: Hashable` over `NavigationPath` when every destination is known. The compiler then forces you to handle each case, and the path is trivially `Codable`. Use `NavigationPath` only when you must mix heterogeneous, unbounded value types.
- **Do** register destinations once, high in the hierarchy, with `navigationDestination(for:)`. Attach it *outside* lazy containers like `List`/`LazyVStack`, or scroll position can hide it.
- **Do** centralize the path in an `@Observable` router injected via `.environment`. Views call `router.go(to:)`; the router decides the view. Keep per-flow state local (sheets, a search field) unless a deep link must reach it.
- **Don't** push views by reference. Push *values* (`Route` cases) so the path stays serializable and deep links can reconstruct it; let `navigationDestination` build the view.
- **Don't** scatter `navigationDestination(for: Route.self)` across many subviews — duplicate registrations for the same type are ambiguous. One per type per stack.
- **Don't** block on link handling. Parse the URL into routes synchronously, then assign `router.path = newRoutes` to replace, or append to drill in.

```swift
@Observable final class Router {
    var path: [Route] = []
    func go(to route: Route) { path.append(route) }
    func reset(to routes: [Route] = []) { path = routes }
    func handle(_ url: URL) {        // myapp://item/42
        guard url.host == "item", let id = url.pathComponents.dropFirst().first
        else { return }
        path = [.detail(id: id)]     // replace stack to land deep-linked
    }
}
enum Route: Hashable, Codable { case detail(id: String), settings }
```

## Platform notes

- **iPad / macOS:** Prefer `NavigationSplitView` for multi-column layouts; a single `enum` selection plus a detail path composes cleanly and adapts to compact width by collapsing into a stack.
- **Universal links:** Declare an `applinks:` Associated Domains entry and host an `apple-app-site-association` file. SwiftUI delivers the URL via `.onOpenURL` (or an `onContinueUserActivity(NSUserActivityTypeBrowsingWeb)` scene phase hook) — route it through the same `Router.handle`.
- **State restoration:** Make `Route` (and `NavigationPath` via its `CodableRepresentation`) `Codable`, then persist with `@SceneStorage`. Each scene/window restores independently — store per scene, not globally. On visionOS, multiple windows each carry their own path.
- **watchOS / tvOS:** Same value-based model applies; keep route enums small and avoid deep stacks on watchOS where back-swipe ergonomics differ.

## Pitfalls

- **Mismatched value types.** A pushed value with no matching `navigationDestination(for:)` silently does nothing. Keep one registration per `Route` type.
- **Decoding stale routes.** A restored `.detail(id:)` may reference data that no longer exists. Validate during decode (e.g. `compactMap` the IDs) and drop dead entries so the stack still makes sense.
- **Two sources of truth.** Holding both a local `@State` selection and a router path for the same screen causes flicker and lost deep links. Pick one owner per screen.
- **`NavigationPath` over-erasure.** It loses type info at the call site, complicates testing, and makes inspection awkward. Default to typed arrays; reserve `NavigationPath` for genuinely heterogeneous stacks.
- **Replace vs append on links.** Appending a deep-link route onto whatever was already on screen yields surprising stacks. Decide deliberately whether a link replaces the path or drills into it.

## References

- **Documentation:** [Migrating to new navigation types](https://developer.apple.com/documentation/swiftui/migrating-to-new-navigation-types)
- **Documentation:** [NavigationPath](https://developer.apple.com/documentation/swiftui/navigationpath)
- **Documentation:** [navigationDestination(for:destination:)](https://developer.apple.com/documentation/swiftui/view/navigationdestination(for:destination:))
- **Documentation:** [Supporting universal links in your app](https://developer.apple.com/documentation/xcode/supporting-universal-links-in-your-app)
- **WWDC:** [The SwiftUI cookbook for navigation (WWDC22)](https://developer.apple.com/videos/play/wwdc2022/10054/)
- **Sample Code:** [Bringing robust navigation structure to your SwiftUI app](https://developer.apple.com/documentation/swiftui/bringing_robust_navigation_structure_to_your_swiftui_app)

## See also

Pair this with a SwiftUI state-management skill for where the router lives in the `@Observable` graph, and a deep-linking/universal-links skill for the associated-domains and AASA file setup that feeds `Router.handle`. A NavigationSplitView/adaptive-layout skill covers multi-column structure on iPad and Mac; a scene-and-window-management skill covers per-scene `@SceneStorage` restoration across multiple windows.
