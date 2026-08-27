<!-- BEGIN skills-master:swiftui-navigation v1.1.1 -->
### SwiftUI Navigation

Guidance for modern SwiftUI navigation using NavigationStack with a value-based path, navigationDestination(for:), and NavigationSplitView for multi-column layouts. Use when building navigation hierarchies, adding programmatic or deep-link navigation, choosing between stack and split layouts for iPhone, iPad, Mac, or visionOS, restoring navigation state, or migrating away from the deprecated NavigationView.

#### Core guidance

- Prefer a value-based stack: bind `NavigationStack(path:)` to a typed array (such as `[Route]`) or to `NavigationPath` for heterogeneous routes, and register each `navigationDestination(for:)` once near the root. This makes the path the single source of truth.
- Use `NavigationLink(value:)`, never the deprecated closure-based `NavigationLink(destination:)`, so links push data rather than eagerly constructing views. The nearest enclosing `navigationDestination(for:)` resolves the type.
- Drive navigation by mutating the path: `path.append(route)` to push, `path.removeLast()` to pop, and `path = []` (or `path.removeLast(path.count)`) to pop to root. Deep links become an array assignment in one step.
- Choose the container by structure, not platform: `NavigationStack` for linear drill-down, `NavigationSplitView` for sidebar-plus-detail. Split views collapse to a stack automatically in compact width, so they cover iPhone too.
- Embed a `NavigationStack` inside the detail column of a `NavigationSplitView` when detail content drills further; do not nest stacks inside stacks.
- Keep route values lightweight and `Hashable` (ideally an enum of identifiers, not whole model objects). Make the route `Codable` to enable `NavigationPath` state restoration via its codable representation.

#### Pitfalls

- Defining the same `navigationDestination(for:)` type twice in one stack: the innermost wins and the outer one silently stops resolving. Register each type once.
- Placing `navigationDestination` outside the `NavigationStack` (or behind a conditional that is initially false) so the modifier is absent when a link fires, which drops the navigation.
- Storing large or reference-type values in the path, then mutating them out of band; the stack compares hashes, so identity drift causes stale or duplicated screens.

> Digest only — the complete skill (full guidance, examples, references) ships with the Claude Code, Cursor, and Copilot projections, or via `skills-master view swiftui-navigation`.
<!-- END skills-master:swiftui-navigation -->
