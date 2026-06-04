<!-- BEGIN skills-master:swiftui-navigation v1.0.0 -->
### Swiftui Navigation

## When to use

Reach for this guidance when a SwiftUI view drives push-style navigation, multi-column layouts, or programmatic destinations. It applies whenever code needs to model the navigation stack as data, support deep links that jump several levels deep, persist and restore where the user was, or replace the deprecated `NavigationView` with `NavigationStack` and `NavigationSplitView`. It is the starting point before reaching for any third-party router.

## Core guidance

- Prefer a value-based stack: bind `NavigationStack(path:)` to a typed array (such as `[Route]`) or to `NavigationPath` for heterogeneous routes, and register each `navigationDestination(for:)` once near the root. This makes the path the single source of truth.
- Use `NavigationLink(value:)`, never the deprecated closure-based `NavigationLink(destination:)`, so links push data rather than eagerly constructing views. The nearest enclosing `navigationDestination(for:)` resolves the type.
- Drive navigation by mutating the path: `path.append(route)` to push, `path.removeLast()` to pop, and `path = []` (or `path.removeLast(path.count)`) to pop to root. Deep links become an array assignment in one step.
- Choose the container by structure, not platform: `NavigationStack` for linear drill-down, `NavigationSplitView` for sidebar-plus-detail. Split views collapse to a stack automatically in compact width, so they cover iPhone too.
- Embed a `NavigationStack` inside the detail column of a `NavigationSplitView` when detail content drills further; do not nest stacks inside stacks.
- Keep route values lightweight and `Hashable` (ideally an enum of identifiers, not whole model objects). Make the route `Codable` to enable `NavigationPath` state restoration via its codable representation.
- Do not switch a single `NavigationStack` between `path` and `selection` styles, and avoid putting a stack inside a `List` row.

```swift
enum Route: Hashable { case detail(Item.ID), settings }

struct RootView: View {
    @State private var path: [Route] = []
    var body: some View {
        NavigationStack(path: $path) {
            Catalog(onOpen: { path.append(.detail($0)) })
                .navigationDestination(for: Route.self) { route in
                    switch route {
                    case .detail(let id): DetailView(id: id)
                    case .settings: SettingsView()
                    }
                }
        }
    }
}
```

## Platform notes

- iPhone and Apple Watch: a `NavigationStack` is the common shape; a `NavigationSplitView` automatically collapses into one in the compact horizontal size class.
- iPad and Mac: `NavigationSplitView` with two or three columns is idiomatic; manage layout with `NavigationSplitViewVisibility` and tune column widths via `navigationSplitViewColumnWidth`.
- visionOS: navigation containers participate in the layered, depth-aware presentation; keep destinations content-focused and let the system supply ornaments and window chrome.
- All platforms: in the iOS, iPadOS, macOS, and visionOS 26 cycle, bars and sidebars adopt the Liquid Glass material automatically; avoid hardcoding bar backgrounds that fight it.
- tvOS: favor focus-driven `NavigationLink(value:)` within a stack; programmatic deep links still work through the bound path.

## Pitfalls

- Defining the same `navigationDestination(for:)` type twice in one stack: the innermost wins and the outer one silently stops resolving. Register each type once.
- Placing `navigationDestination` outside the `NavigationStack` (or behind a conditional that is initially false) so the modifier is absent when a link fires, which drops the navigation.
- Storing large or reference-type values in the path, then mutating them out of band; the stack compares hashes, so identity drift causes stale or duplicated screens.
- Assuming `NavigationView` still behaves the same. It is deprecated, mixes poorly with the new types, and should not be combined with `NavigationStack` in the same hierarchy.
- Forgetting that `NavigationPath` only restores when every pushed value is `Codable`; a single non-codable route breaks the saved representation.

## See also

See `swiftui-core` for view composition, state, and the Observation model that backs navigation state. See `hig-navigation` and `hig-layout` for the platform conventions on sidebars, hierarchy depth, and adaptive layout that inform whether a stack or split view is appropriate. For routes that present sheets or full-screen covers instead of pushing, pair this with a dedicated presentation skill rather than overloading the path.
<!-- END skills-master:swiftui-navigation -->
