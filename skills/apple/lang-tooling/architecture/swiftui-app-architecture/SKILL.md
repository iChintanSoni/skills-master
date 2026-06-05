---
name: swiftui-app-architecture
description: "Guides choosing and applying SwiftUI app architecture: the MV pattern (Observable models in the environment) versus MVVM (one ViewModel per view), where state and business logic belong, and how to keep views thin and testable. Use when structuring a new SwiftUI app, deciding whether a view needs a ViewModel, refactoring fat views, placing shared model state, or debating MV vs MVVM in code review."
globs:
  - "**/*.swift"
tags: [swiftui, architecture, observable, mvvm, state]
x-skills-master:
  domain: apple
  class: lang-tooling
  category: architecture
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  requires:
    swift: "6.0"
  pairs_with: []
  sources:
    - https://developer.apple.com/documentation/swiftui/managing-model-data-in-your-app
    - https://developer.apple.com/documentation/swiftui/migrating-from-the-observable-object-protocol-to-the-observable-macro
    - https://developer.apple.com/documentation/Observation
  snapshot_date: "2026-05-30"
  stability: contested
  version: 1.0.0
---

## When to use

Reach for this skill when you are starting a SwiftUI app and must decide how to
organize state and logic, when a pull request adds a `ViewModel` per screen and
you want to weigh that choice, when a view has grown fat with networking and
formatting, or when you need to make app logic unit-testable without rendering
UI. It covers the long-running community debate between **MV** (Model-View, where
`@Observable` models live in the environment) and **MVVM** (one observable
ViewModel bound to each view), and how to keep views thin under Swift 6.

## Core guidance

- **Do** model your domain as plain `@Observable` reference types and let views
  read them via `@State`, `@Environment`, and `@Bindable`. SwiftUI already
  diffs structs and tracks property access, so a thin presentation layer is
  often enough — this is the MV stance.
- **Do** push side effects (networking, persistence, formatting) into injected
  services or the model, not into the view body. The split that matters is
  *view vs. logic*, not *view vs. ViewModel* — both patterns can achieve it.
- **Do** add a per-view ViewModel when a screen owns genuinely non-trivial
  presentation state or orchestration you want to test in isolation. Don't add
  one reflexively to every view; a pass-through ViewModel is pure ceremony.
- **Don't** wrap an `@Observable` model in a `@StateObject`/`ObservableObject`
  ViewModel out of habit — that reintroduces Combine plumbing the Observation
  framework removed and can fight SwiftUI's fine-grained invalidation.
- **Don't** put navigation, theming, or shared session state in a single view;
  hoist it into an environment-injected model so deep children read it directly
  instead of threading bindings through every level.
- **Idiom:** own a model at the root with `@State`, inject with
  `.environment(model)`, read in children with `@Environment(Model.self)`, and
  use `@Bindable` only where a child needs two-way bindings into it.

```swift
@Observable
final class LibraryModel {
    var books: [Book] = []
    private let service: BookService
    init(service: BookService) { self.service = service }
    func load() async { books = await service.fetchAll() }
}

struct LibraryView: View {
    @Environment(LibraryModel.self) private var model
    var body: some View {
        List(model.books) { BookRow(book: $0) }
            .task { await model.load() }
    }
}
```

## Platform notes

- The Observation framework is available from iOS 17 / macOS 14 onward; on older
  deployment targets you must keep `ObservableObject` and `@Published`, which
  nudges teams toward classic MVVM. Confirm your minimum target before choosing.
- Under Swift 6 strict concurrency, UI-facing models are typically `@MainActor`.
  With Swift 6.2 approachable concurrency, main-actor isolation is often the
  default, so explicit `@MainActor` annotations on view models can shrink.
- The same patterns apply across iOS, macOS, watchOS, tvOS, and visionOS. On
  macOS and visionOS, multi-window and multi-scene apps make environment-scoped
  models especially valuable, since each scene can own its own model instance.
- SwiftData `@Model` types are themselves observable; querying with `@Query` in
  the view often removes the need for a ViewModel layer over persistence.

## Pitfalls

- Treating MVVM as mandatory: a `ViewModel` that only forwards model properties
  adds an indirection layer without improving testability or clarity.
- Storing an injected, externally-owned model in `@State` (it should be `@State`
  only where the view *owns* its lifetime; otherwise inject via `@Environment`).
- Leaving blocking or async work in the `body` — move it into `.task`, the
  model, or a service so the render path stays pure.
- Over-centralizing into one "god" app model that every view depends on; scope
  models to the feature or scene that needs them.
- Assuming view structs are untestable and therefore everything must move to a
  ViewModel — extract *logic*, and test that logic directly regardless of where
  it lives.

## Open question

There is no settled answer to **MV vs. MVVM for SwiftUI**, and reasonable teams
disagree.

- **MV camp:** SwiftUI's view is already a value-type projection of state with
  built-in dependency tracking, so a separate ViewModel per view is redundant
  boilerplate that fights the framework. Models in the environment plus injected
  services keep things lean and align with Apple's own samples.
- **MVVM camp:** an explicit ViewModel gives a named, framework-independent seam
  for unit tests, makes complex presentation state and orchestration legible,
  and eases onboarding for teams coming from UIKit/MVVM or other platforms.
- **Pragmatic middle:** prefer MV by default; introduce a per-view ViewModel
  only when a screen's presentation logic is complex enough to earn an isolated,
  testable unit. The decisive question is not the label but *where logic lives
  and whether it is testable without rendering UI* — both patterns can satisfy
  that, and consistency within a codebase matters more than the choice itself.

## References

- **Documentation:** [Managing model data in your app](https://developer.apple.com/documentation/swiftui/managing-model-data-in-your-app)
- **Documentation:** [Migrating from the Observable Object protocol to the Observable macro](https://developer.apple.com/documentation/swiftui/migrating-from-the-observable-object-protocol-to-the-observable-macro)
- **Documentation:** [Observation framework](https://developer.apple.com/documentation/Observation)
- **WWDC:** [Discover Observation in SwiftUI (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10149/)
- **WWDC:** [Demystify SwiftUI performance (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10160/)
- **Sample Code:** [Backyard Birds: Building an app with SwiftData and widgets](https://developer.apple.com/documentation/swiftui/backyard-birds-sample)

## See also

Pair this with a dedicated skill on the Observation framework and `@Observable`
for the mechanics of fine-grained invalidation, with a SwiftData modeling skill
when persistence removes the need for a ViewModel layer, with a Swift concurrency
skill for `@MainActor` isolation of UI models, and with a SwiftUI dependency
injection skill for wiring services and environment values into models.
