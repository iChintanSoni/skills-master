---
name: swift-concurrency
description: Guidance for writing data-race-safe asynchronous Swift under Swift 6 strict concurrency, covering async/await, structured concurrency with async let and task groups, actors and isolation, the MainActor, Sendable, and Task cancellation. Use when adding or auditing async code, fixing strict-concurrency or Sendable diagnostics, deciding where work should run, choosing between structured and unstructured tasks, or modernizing callback-based APIs to async/await.
---

## When to use

Reach for this guidance when writing or reviewing asynchronous Swift in a module compiled under Swift 6 language mode, where the compiler enforces data-race safety at build time. It applies when resolving Sendable or actor-isolation diagnostics, deciding which actor a piece of work belongs on, structuring concurrent work that must finish together, or migrating completion-handler APIs to async/await. It is less relevant to single-threaded scripts with no shared mutable state, where the model adds ceremony without benefit.

## Core guidance

- Prefer structured concurrency. Express parallel work that the caller awaits with `async let` for a fixed set of children, or `withTaskGroup` when the count is dynamic. Both propagate cancellation and errors automatically and cannot outlive their scope, unlike a detached `Task`.
- Treat `Task { }` (unstructured) as a last resort, mainly to bridge from synchronous code into async. An unstructured task inherits the current actor and priority but is not awaited by its parent, so store its handle and cancel it when the owner deallocates.
- Isolate shared mutable state in an `actor`, not a lock. Calls into an actor from outside are `async` and serialize automatically. Keep actor methods short and avoid `await` inside critical sections, since suspension lets other calls interleave (actor reentrancy).
- Annotate UI and view-model state with `@MainActor` so the compiler guarantees main-thread access; let nonisolated background work hand results back by awaiting a main-actor method rather than dispatching manually.
- Make types crossing isolation boundaries `Sendable`. Value types of Sendable members conform automatically; reference types need immutability or internal synchronization. Audit every `@unchecked Sendable` as a manual proof obligation, not a way to silence the compiler.
- Never block an async context. Avoid `sleep`, semaphores, blocking I/O, or `DispatchQueue.sync` on a cooperative-pool thread; use `Task.sleep`, async APIs, and `await` instead.
- Honor cancellation cooperatively: check `Task.isCancelled` or call `Task.checkCancellation()` at loop boundaries, and propagate it rather than catching and ignoring `CancellationError`.

```swift
@MainActor
final class FeedModel {
    private(set) var items: [Item] = []
    private var load: Task<Void, Never>?

    func refresh(store: ItemStore) {
        load?.cancel()
        load = Task {
            let fetched = await store.latest() // store is an actor
            guard !Task.isCancelled else { return }
            items = fetched                    // back on MainActor
        }
    }
}
```

## Platform notes

Swift 6 language mode enables strict concurrency checking everywhere; modules can opt in incrementally while still on the Swift 5 mode using the per-target strict-concurrency setting. Swift 6.2 advances an "approachable concurrency" direction that reduces boilerplate for common single-threaded apps: a target can default its isolation to the main actor, and a nonisolated async function can run on the caller's actor (`nonisolated(nonsending)`) rather than always hopping to the global executor, with `@concurrent` opting back into a fresh isolation context. These are migration ergonomics rather than semantic changes to the actor model, and the same Sendable and isolation rules still hold. On Apple platforms the cooperative thread pool is shared process-wide, so blocking one thread starves unrelated async work across the app and its frameworks.

## Pitfalls

- Capturing a non-Sendable reference (a view, a context, a class without synchronization) in a `Task` or task-group closure crosses an isolation boundary and is a hard error under strict checking.
- Assuming actor methods run atomically end to end. Any `await` is a suspension point where state can change; re-read invariants after awaiting.
- Spawning a `Task` inside `deinit` or a view body, which detaches lifetime from the owner and leaks work that should have been cancelled.
- Calling `Task.detached` to "get off the main actor," which also drops the parent's priority, task-local values, and cancellation. Prefer a plain `Task` or a structured child.
- Marking a type `@unchecked Sendable` to clear a diagnostic without actually providing thread safety, which reintroduces exactly the races the compiler was preventing.
- Forgetting that `MainActor.run` and similar hops add latency; design APIs to return Sendable results and let the awaiting main-actor caller assign them.

## References

- **Documentation:** [Concurrency](https://developer.apple.com/documentation/swift/concurrency)
- **Documentation:** [Adopting strict concurrency in Swift 6 apps](https://developer.apple.com/documentation/swift/adoptingswift6)
- **Documentation:** [Swift 6 Migration Guide](https://www.swift.org/migration/documentation/migrationguide/)
- **WWDC:** [Embracing Swift concurrency (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/268/)
- **Sample Code:** [Code-along: Elevate an app with Swift concurrency](https://developer.apple.com/videos/play/wwdc2025/270/)

## See also

For threading UI state and async work through views, see `swiftui-state-management` and `swiftui-navigation`. For observable models that drive views, see `observation-observable`. For database access from async contexts, see `swiftdata-modeling`. For exercising async and isolated code in tests, see `swift-testing`.
