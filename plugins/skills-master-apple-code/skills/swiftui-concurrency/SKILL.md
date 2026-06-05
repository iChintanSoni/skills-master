---
name: swiftui-concurrency
description: Guides view-scoped async work in SwiftUI using the task and task(id:) modifiers, refreshable and searchable async closures, and main-actor state updates. Use when wiring async loads, async sequences, pull-to-refresh, or live search into a view, when a task must cancel on disappear or restart on an id change, or when updating Observable or State models from background work without data races.
---

## When to use

Reach for these patterns when an async operation should be owned by a view: fetching data on appear, consuming an async sequence, restarting work when an input changes, or driving pull-to-refresh and live search. The `.task` family ties the work's lifetime to the view, so cancellation and restart come for free instead of through hand-rolled `Task {}` bookkeeping.

Skip this skill for fire-and-forget work that outlives the view, or for the deeper mechanics of actors, task groups, `Sendable`, and isolation domains — those belong to the swift-concurrency skill. This skill stays at the SwiftUI surface: which modifier to use, where the work runs, and how to keep state updates race-free.

## Core guidance

- **Prefer `.task` over `onAppear { Task { … } }`.** The modifier starts work when the view appears and cancels it on disappear, matching the view's lifetime so you never leak an orphaned task or update a gone view.
- **Use `task(id:)` to restart, not to loop.** When an `Equatable` id changes, SwiftUI cancels the running task and starts a fresh one. This is the idiom for "reload when the selected item changes" and for debounced search bound to query text.
- **Honor cooperative cancellation.** SwiftUI signals cancellation; it cannot force-stop your code. Call `try Task.checkCancellation()` (or check `Task.isCancelled`) at loop boundaries and after each `await`, and let `CancellationError` propagate rather than swallowing it.
- **Stay on the main actor for UI state.** The `View` protocol is `@MainActor`-isolated, and `.task` closures inherit that isolation, so assigning to `@State` or an `@Observable` model from within `.task` is already safe — no manual hop required.
- **Push heavy work off the main actor explicitly.** Run CPU- or IO-bound work in a `nonisolated` async function or on a background actor, then `await` the result back; do not block the main actor with a long synchronous body just because the closure starts there.
- **Parallelize independent fetches with `async let`.** Bind concurrent calls, then `await` both at the use site to overlap latency; sequence them only when one truly depends on the other.
- **Don't capture and mutate shared non-`Sendable` state across the boundary.** Pass copies into off-actor work and return values back; let the compiler's data-race checking guide you instead of reaching for locks.

```swift
struct ArticleView: View {
    let id: Article.ID
    @State private var model = ArticleModel()

    var body: some View {
        ArticleBody(model: model)
            .task(id: id) {        // cancels + restarts when id changes
                do {
                    model.article = try await ArticleStore.load(id)
                } catch is CancellationError {
                    // expected on restart or disappear — ignore
                } catch {
                    model.error = error
                }
            }
    }
}
```

## Platform notes

- **iOS / iPadOS / macOS / tvOS / visionOS:** `.task`, `task(id:)`, and `refreshable` behave consistently. `searchable` adapts its presentation per platform, but the async pattern (`task(id: query)`) is identical everywhere.
- **watchOS:** `refreshable` is unavailable on most watch layouts; trigger reloads from `.task(id:)` or an explicit control instead of pull-to-refresh.
- **Xcode 26 / Swift 6.2:** newer `task` overloads accept an executor preference and a task name (`task(id:name:executorPreference:priority:_:)`), useful for steering work off the main actor and for labeling tasks in Instruments. The classic `task(priority:_:)` and `task(id:priority:_:)` remain the baseline back to iOS 17.

## Pitfalls

- **Spawning a detached `Task {}` inside `.task`.** A detached or unstructured child started this way escapes the view's cancellation, defeating the whole point. Keep the async work structured inside the modifier closure.
- **Treating `task(id:)` as a `for` loop.** It runs once per distinct id value, not once per render. Recomputing the id each frame to an unequal value restarts the task constantly and thrashes.
- **Swallowing `CancellationError` as a generic failure.** Showing an error banner when the user simply navigated away or retyped a search term is a common UX bug; branch on cancellation first.
- **Forgetting cancellation checks in long bodies.** Without `Task.checkCancellation()`, a slow request keeps running after the view disappears, wasting work and possibly racing a later restart.
- **Blocking the main actor.** Doing parsing or hashing directly in the `.task` body stalls the UI because the closure starts main-actor-isolated. Move it off-actor and await it.
- **Marking a model `@MainActor` then awaiting it from a `nonisolated` context.** This forces hops and can deadlock-feel slow; keep the isolation boundary deliberate and minimal.

## References

- **Documentation:** [task(priority:_:)](https://developer.apple.com/documentation/swiftui/view)
- **Documentation:** [task(id:priority:_:)](https://developer.apple.com/documentation/swiftui/view)
- **Documentation:** [refreshable(action:)](https://developer.apple.com/documentation/swiftui/view/refreshable(action:))
- **Documentation:** [Search modifiers](https://developer.apple.com/documentation/swiftui/view-search)
- **WWDC:** [Explore concurrency in SwiftUI (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/266/)
- **WWDC:** [Discover concurrency in SwiftUI (WWDC21)](https://developer.apple.com/videos/play/wwdc2021/10019/)

## See also

Defer actors, task groups, `Sendable`, and isolation reasoning to the swift-concurrency skill. For modeling the state these tasks mutate, see the observable-state skill (the `@Observable` macro and `@State` ownership). For threading reloads into list and search UI, see the swiftui-lists and swiftui-navigation skills.
