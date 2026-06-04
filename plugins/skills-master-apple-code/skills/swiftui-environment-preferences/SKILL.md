---
name: swiftui-environment-preferences
description: Guides reading and writing SwiftUI environment values, defining custom keys with the Entry macro, injecting Observable models, and flowing data up the tree with PreferenceKey. Use when sharing implicit dependencies across views, injecting a shared model, theming, or when a child must report size, position, or anchors back to an ancestor.
---

## When to use

Reach for this skill when a value needs to travel implicitly through a view subtree (theme, locale, a shared model) instead of being threaded through every initializer, or when data must move the "wrong" way — from a child up to an ancestor that arranges the layout. The environment handles top-down implicit dependencies; preferences handle bottom-up reporting such as measured sizes, scroll offsets, or geometry anchors. If you only pass data parent-to-child explicitly, plain properties or a `Binding` are simpler and clearer.

## Core guidance

- Define custom environment values with the `@Entry` macro inside an `extension EnvironmentValues`; it synthesizes the backing key and the default, so hand-rolling an `EnvironmentKey` conformance is now legacy boilerplate. The macro generates back-deployable code, so it works even when you target OS versions older than the one that introduced it.
- Inject Observable model objects with `.environment(model)` and read them via `@Environment(MyModel.self)`. Prefer this over `@EnvironmentObject`/`ObservableObject`, which depend on `objectWillChange` and invalidate more views than the fine-grained, access-based tracking of `@Observable`.
- Set environment values as high as is correct, but no higher: scope a value to the subtree that needs it so siblings are not invalidated or accidentally reconfigured.
- Don't force-unwrap an optional environment model. Reading `@Environment(MyModel.self)` returns `nil` when nothing was injected (including some previews); inject it in the preview or provide a default.
- Use `PreferenceKey` for child-to-parent flow: children call `.preference(key:value:)`, the static `reduce` combines contributions from multiple children, and an ancestor observes with `.onPreferenceChange` or `.overlayPreferenceValue`.
- Prefer anchor preferences (`Anchor<T>` via `.anchorPreference`) over `GeometryReader` plus global frames when you need a child's bounds in another view's coordinate space; resolve the anchor with the reader's `geometry[anchor]`.
- Keep `reduce` cheap and order-independent where possible, and avoid writing back into state from `onPreferenceChange` in a way that re-triggers the same preference — that is a classic layout loop.

```swift
extension EnvironmentValues {
    @Entry var cardStyle: CardStyle = .standard
}

struct Badge: View {
    @Environment(\.cardStyle) private var style
    var body: some View {
        Text("New").padding(style.insets)
    }
}
// Apply upstream: ContentView().environment(\.cardStyle, .compact)
```

## Platform notes

- The `@Entry` macro requires Xcode 16 or newer to compile; because it generates back-deployable code it runs on earlier OS releases, so a project targeting iOS 17 can adopt it. Older code that conforms to `EnvironmentKey` directly still works and is not deprecated.
- Some environment values are platform-specific (for example pointer, focus, and window-related keys). Guard reads of platform-only keys and supply sensible defaults so watchOS and tvOS targets compile cleanly.
- On visionOS, several layout-affecting environment values (such as scene and immersion state) only change meaningfully inside the appropriate scene type; don't assume desktop-style window semantics.

## Pitfalls

- Mutating SwiftUI state inside `onPreferenceChange` (or `GeometryReader`) and feeding it back into the same view can cause an update loop or "Modifying state during view update" warnings; route the value to a stable container or debounce the write.
- `@EnvironmentObject` is a runtime contract: forgetting to inject it crashes at access time. The `@Environment(_:)` Observable form is safer because the optional read surfaces a missing dependency without a hard crash, but you must still handle `nil`.
- Setting an environment value below the view that reads it has no effect — environment flows downward only. Verify the modifier sits on a common ancestor.
- A `PreferenceKey.reduce` that ignores `nextValue` (or that depends on call order) silently drops contributions from some children; combine values intentionally (max, sum, append).
- Reading geometry with `GeometryReader` where an anchor preference would do can distort layout, since `GeometryReader` greedily fills its proposed space.

## References

- **Documentation:** [Environment](https://developer.apple.com/documentation/swiftui/environment)
- **Documentation:** [EnvironmentValues](https://developer.apple.com/documentation/swiftui/environmentvalues)
- **Documentation:** [PreferenceKey](https://developer.apple.com/documentation/swiftui/preferencekey)
- **Documentation:** [Entry() macro](https://developer.apple.com/documentation/swiftui/entry())
- **Documentation:** [Managing model data in your app](https://developer.apple.com/documentation/swiftui/managing-model-data-in-your-app)
- **WWDC:** [What's new in SwiftUI (WWDC24)](https://developer.apple.com/videos/play/wwdc2024/10144/)
- **WWDC:** [Discover Observation in SwiftUI (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10149/)

## See also

Pair this with a SwiftUI state-management skill covering `@State`, `@Binding`, and the `@Observable` macro for the parent-to-child and local-state side of data flow, and with a SwiftUI layout skill for using anchors and `GeometryReader` correctly. A skill on app architecture and dependency injection complements environment-based model sharing at the scene and `App` level.
