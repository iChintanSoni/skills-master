# swiftui-navigation — checklist

- [ ] Use `NavigationStack(path:)` bound to a typed `[Route]` array, or `NavigationPath` only when routes are heterogeneous.
- [ ] Make the path the single source of truth — drive pushes/pops by mutating it, not by toggling `Bool` flags.
- [ ] Register each `navigationDestination(for:)` exactly once, inside the stack and near the root (not behind an initially-false conditional).
- [ ] Use `NavigationLink(value:)`; never the deprecated closure-based `NavigationLink(destination:)`.
- [ ] Keep route values lightweight, `Hashable`, and ideally identifier-based enums rather than whole model objects.
- [ ] Pop with `path.removeLast()`, pop-to-root with `path.removeAll()` (or `path = NavigationPath()`); deep-link by assigning the whole array in one step.
- [ ] Pick the container by structure: `NavigationStack` for linear drill-down, `NavigationSplitView` for sidebar-plus-detail (it collapses to a stack in compact width).
- [ ] Put a `NavigationStack` inside the detail column when detail drills further; never nest a stack inside a stack or inside a `List` row.
- [ ] Make routes `Codable` and persist via `NavigationPath.codable` for state restoration — confirm every pushed value is `Codable`.
- [ ] Replace any remaining `NavigationView`; do not mix it with `NavigationStack`/`NavigationSplitView` in the same hierarchy.
- [ ] Manage split-view layout with `NavigationSplitViewVisibility` and size columns via `navigationSplitViewColumnWidth` instead of hardcoding frames.
- [ ] Don't switch one stack between `path` and `selection` styles, and don't hardcode bar/sidebar backgrounds that fight the 26-cycle Liquid Glass material.
- [ ] Verify deep links and back-navigation on both compact (iPhone) and regular (iPad/Mac) widths.
- [ ] Build with Swift 6 strict concurrency — keep route mutation on the main actor and avoid capturing non-`Sendable` state in destinations.
