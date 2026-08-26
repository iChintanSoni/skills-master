---
name: swiftui-toolbars
description: "Populates and tunes SwiftUI toolbars — toolbar(content:), ToolbarItem, ToolbarItemGroup, ToolbarItemPlacement, ToolbarSpacer, DefaultToolbarItem — plus the iOS 27 overflow model of ToolbarItemVisibilityPriority, ToolbarOverflowMenu, and topBarPinnedTrailing, and scroll-driven chrome through toolbarMinimizationBehavior. Use when choosing toolbar placements, controlling which actions collapse into the overflow menu as space shrinks, pinning a critical action, minimizing the navigation bar on scroll, or adapting one toolbar declaration across iPhone, iPad, Mac, Apple Watch, Apple TV, and Vision Pro."
globs:
  - "**/*.swift"
tags: []
x-skills-master:
  domain: apple
  class: code
  category: app-frameworks
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  requires:
    ios: "27"
    swift: "6.4"
  pairs_with: [swiftui-navigation, hig-toolbars, adopting-liquid-glass]
  sources:
    - https://developer.apple.com/documentation/swiftui/toolbars
    - https://developer.apple.com/documentation/swiftui/toolbaritemvisibilitypriority
    - https://developer.apple.com/documentation/swiftui/toolbarminimizationbehavior
  snapshot_date: "2026-08-25"
  stability: emerging
  version: 1.0.0
---

## When to use

Reach for this skill when a SwiftUI screen needs a toolbar: populating `.toolbar { }` with `ToolbarItem`, `ToolbarItemGroup`, and `ToolbarSpacer`, picking a `ToolbarItemPlacement`, or deciding which actions survive as the bar runs out of room. It is the implementation counterpart to `hig-toolbars` — that skill decides which actions earn a spot on the bar, this one expresses the decision in API. It also covers the surface introduced in the 27 SDKs: the authored overflow model (`ToolbarItemVisibilityPriority`, `ToolbarOverflowMenu`, `topBarPinnedTrailing`) and scroll-driven bar minimization (`toolbarMinimizationBehavior(_:for:)`). For the stack and split-view containers the bar lives inside, see `swiftui-navigation`.

## Core guidance

### Placement is a statement of intent

- Prefer **semantic** placements — `.primaryAction`, `.secondaryAction`, `.confirmationAction`, `.cancellationAction`, `.destructiveAction`, `.principal`, `.status`, `.navigation` — over positional ones such as `.topBarLeading`, `.topBarTrailing`, and `.bottomBar`. One semantic declaration renders correctly everywhere; a positional one encodes a single platform's idea of the bar.
- `.automatic` is not neutral, it is per-platform: leading-to-trailing within the current section on macOS and Mac Catalyst, the trailing edge of the navigation bar on iOS and tvOS, the center of an iPadOS navigation bar that supports customization (otherwise trailing), and on watchOS only the first item, pinned beneath the navigation bar.
- Wrap related controls in a `ToolbarItemGroup` so spacing and layout stay correct per platform. The `init(placement:content:label:)` variant wraps the group in a `ControlGroup`, which lets the whole cluster collapse into a labelled menu as space tightens — a better degradation than items disappearing one at a time.
- Break visual clusters apart with `ToolbarSpacer(_:placement:)`. `.flexible` (the default) pushes items apart; `.fixed` inserts a system-sized gap. Under the current design system adjacent items share one glass background, so a spacer is what stops a primary and a secondary action from reading as a single blob.
- Position system-supplied items explicitly with `DefaultToolbarItem(kind:placement:)`, and remove ones you do not want with `.toolbar(removing:)` plus a `ToolbarDefaultItemKind` such as `.search`, `.title`, or `.sidebarToggle`.
- Custom title chrome goes through placements, not overlays: `.title` and `.subtitle` supersede the inline navigation title and subtitle, `.largeTitle` supersedes the out-of-line one.
- Declare what the bar is for with `.toolbarRole(_:)`. `.browser`, `.editor`, and `.navigationStack` change rendering — `.browser`, for instance, leading-aligns the title on iPadOS.

### The overflow and priority model (27 SDKs)

- On iOS, iPadOS, and macOS the system already measures available space and pushes items that do not fit into an overflow menu. What the 27 SDKs add is authorship over *which* items go first.
- Attach `.visibilityPriority(_:)` to toolbar content — it is defined on `ToolbarContent`, with a matching overload on `CustomizableToolbarContent`. Items with **lower** priority move into the overflow menu **first**. `.automatic` is the default; `.low` suits secondary actions like archive or delete, `.high` keeps a frequently used action visible as the window shrinks.
- For finer ordering, derive values with `ToolbarItemVisibilityPriority(higherThan:)` and `(lowerThan:)`. A derived value sits strictly between adjacent system priorities and never crosses the next one, and two values derived from the same base compare equal — so they refine an order, they do not create unlimited tiers.
- `topBarPinnedTrailing` is the escape hatch for one genuinely critical action, such as share. A pinned item leaves the bar only when search is active and space still runs out.
- Two distinct overflow tools, easy to confuse: `ToolbarOverflowMenu { }` is toolbar content placed **inside** `.toolbar { }` (it conforms to both `ToolbarContent` and `CustomizableToolbarContent`), while `.toolbarOverflowMenu { }` is a view modifier taking plain views. Both mean "always in the overflow menu, regardless of toolbar mode, platform, or customizability" — reserve them for actions that should never occupy bar space.
- Priority orders collapse; it does not create capacity. If too many actions still claim `.high`, the fix is editorial, not technical — route it back through `hig-toolbars`.

### Minimizing bars on scroll (27 SDKs)

- `toolbarMinimizationBehavior(_:for:)` takes a `ToolbarMinimizationBehavior` and a variadic list of `ToolbarPlacement` values; today only `.navigationBar` is supported. Use it instead of hand-rolled scroll-offset observation.
- `.onScrollDown` minimizes as the reader moves into content and `.onScrollUp` does the inverse; `.never` opts out; `.automatic` defers to the system, which on iOS minimizes the navigation bar when the view has a `searchable` using the `toolbarPrincipal` search placement.
- Minimizing the navigation bar also minimizes an integrated top tab bar, so one modifier reshapes both pieces of chrome — check the tab bar's appearance after adopting it.
- A minimized bar restores when the user reverses scroll direction. `toolbarMinimizationRestoration(.atScrollEdge, for: .navigationBar)` defers restoration until the content reaches the scroll edge instead, which suits reading surfaces where the bar is pure chrome. It is honored only alongside `.onScrollDown` and only for the navigation bar.
- The safe area shrinks as the bar minimizes so content reflows into the vacated space. Disable that with `toolbarMinimizationSafeAreaAdjustment(_:for:)` when content must stay put — full-bleed media beneath a minimizing bar is the motivating case.
- This is the toolbar analog of `tabBarMinimizeBehavior(_:)`, not a replacement for it. They are separate modifiers over separate types; an app that wants both bars to yield sets both.

```swift
struct ArticleScreen: View {
    let article: Article

    var body: some View {
        ScrollView { ArticleBody(article) }
            .navigationTitle(article.title)
            .toolbar {
                ToolbarItem(placement: .topBarPinnedTrailing) {
                    ShareLink(item: article.url)
                }
                ToolbarItem {
                    Button("Bookmark", systemImage: "bookmark") { bookmark() }
                }
                .visibilityPriority(.high)
                ToolbarSpacer(.fixed)
                ToolbarItem {
                    Button("Archive", systemImage: "archivebox") { archive() }
                }
                .visibilityPriority(.low)
                ToolbarOverflowMenu {
                    Button("Report a Problem") { report() }
                }
            }
            .toolbarMinimizationBehavior(.onScrollDown, for: .navigationBar)
            .toolbarMinimizationRestoration(.atScrollEdge, for: .navigationBar)
    }
}
```

## Platform notes

- **iOS / iPadOS:** the top bar is the navigation bar. `topBarPinnedTrailing`, `ToolbarOverflowMenu`, and `toolbarOverflowMenu(content:)` arrive in 27.0 here (and on Mac Catalyst and visionOS); `bottomBar` remains the thumb-reach position on iPhone. iPadOS additionally supports user customization through `toolbar(id:content:)`, where items need stable ids and `toolbarItemHidden(_:)` controls the default set.
- **macOS:** priority shipped a cycle early — `ToolbarItemVisibilityPriority` with `.low` and `.high` is available from macOS 26.1, so Mac code can author overflow order before the iOS 27 SDK. `toolbarMinimizationBehavior(_:for:)` exists on macOS but the scroll cases (`.onScrollDown`, `.onScrollUp`, `.never`) are iOS/iPadOS/Mac Catalyst only, leaving `.automatic` as the meaningful value. `ToolbarOverflowMenu` is not available; window chrome is tuned with `windowToolbarStyle(_:)` and `ToolbarLabelStyle`.
- **watchOS:** space is the constraint — `.automatic` surfaces only the first item, and `.primaryAction` sits beneath the navigation bar where the user reveals it by scrolling. `ToolbarSpacer` and the overflow types do not exist here.
- **tvOS:** `bottomBar` applies only inside a `NavigationSplitView` sidebar and is inert elsewhere. `ToolbarSpacer` and `ToolbarOverflowMenu` are unavailable; keep the action set small and focusable.
- **visionOS:** `bottomOrnament` places items in the ornament below the window. The 27 overflow types are available, but `ToolbarSpacer` is not — express grouping with `ToolbarItemGroup` instead.

## Pitfalls

- Reaching for `.topBarLeading` or `.topBarTrailing` where a semantic placement would do, which pins the bar to one platform's layout and forfeits the system's adaptation.
- Treating `.visibilityPriority(.high)` as a guarantee of visibility. It orders collapse, it does not reserve space; only `topBarPinnedTrailing` approaches a guarantee, and even that yields when search is active.
- Expecting `ToolbarItemVisibilityPriority(higherThan: .high)` to stack into arbitrary tiers. Derived priorities stay between adjacent system values, and two derived from the same base are equal.
- Writing `toolbarMinimizeBehavior`. The SwiftUI modifier is `toolbarMinimizationBehavior(_:for:)` over `ToolbarMinimizationBehavior`; the similarly named `tabBarMinimizeBehavior(_:)` is a different API for tab bars.
- Applying `toolbarMinimizationRestoration(.atScrollEdge, …)` without `.onScrollDown`, or to a bar other than `.navigationBar` — it is simply not honored, with no diagnostic.
- Forgetting that safe-area adjustment is on by default, then debugging why full-bleed media shifts as the bar collapses instead of reaching for `toolbarMinimizationSafeAreaAdjustment(_:for:)`.
- Putting a `ToolbarItemGroup` into a customizable `toolbar(id:content:)`. It conforms to `ToolbarContent` but not `CustomizableToolbarContent`, so it cannot carry an id — `ToolbarItem`, `ToolbarSpacer`, and `ToolbarOverflowMenu` can.
- Duplicating the navigation title by adding a `.principal` or `.title` item alongside `navigationTitle(_:)`; those placements supersede the title rather than joining it.
- Painting opaque bar backgrounds that fight the current material. `toolbarBackground(_:for:)` and `toolbarBackgroundVisibility(_:for:)` exist, but they are exceptions, not defaults.

## References

- **Documentation:** [Toolbars](https://developer.apple.com/documentation/swiftui/toolbars)
- **Documentation:** [ToolbarItemPlacement](https://developer.apple.com/documentation/swiftui/toolbaritemplacement)
- **Documentation:** [ToolbarItemVisibilityPriority](https://developer.apple.com/documentation/swiftui/toolbaritemvisibilitypriority)
- **Documentation:** [ToolbarOverflowMenu](https://developer.apple.com/documentation/swiftui/toolbaroverflowmenu)
- **Documentation:** [ToolbarMinimizationBehavior](https://developer.apple.com/documentation/swiftui/toolbarminimizationbehavior)
- **Documentation:** [ToolbarSpacer](https://developer.apple.com/documentation/swiftui/toolbarspacer)
- **Human Interface Guidelines:** [Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars)
- **WWDC:** [WWDC26 SwiftUI guide](https://developer.apple.com/wwdc26/guides/swiftui/)

## See also

Pair with `swiftui-navigation` for the `NavigationStack` and `NavigationSplitView` containers whose navigation bar this toolbar populates, and whose minimization the same modifier drives. Pair with `hig-toolbars` for the design judgment upstream of the code — which actions belong on the bar, how many, and in what order they should degrade. For search that lives in the bar, treat `searchable` placement and `SearchToolbarBehavior` as a related but separate concern.
