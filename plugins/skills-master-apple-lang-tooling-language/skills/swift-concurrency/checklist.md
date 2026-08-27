# swift-concurrency — checklist

- [ ] Build the module under the Swift 6 language mode so the compiler enforces data-race safety; if migrating, enable strict concurrency per-target incrementally rather than silencing it.
- [ ] Default to structured concurrency: use `async let` for a fixed set of children and `withTaskGroup` / `withThrowingTaskGroup` when the count is dynamic, so cancellation and errors propagate automatically.
- [ ] Reserve unstructured `Task { }` for bridging sync into async; store the handle and `cancel()` it when the owner deallocates.
- [ ] Never call `Task.detached` just to "leave" an actor — it drops priority, task-local values, and cancellation; prefer a plain `Task` or a structured child.
- [ ] Put shared mutable state in an `actor`, not a lock; keep actor methods short and re-check invariants after every `await`, since suspension allows reentrant interleaving.
- [ ] Annotate UI and view-model state with `@MainActor`; let background work return Sendable results and have the awaiting main-actor caller assign them instead of hopping with `MainActor.run`.
- [ ] Make every type that crosses an isolation boundary `Sendable`; confirm reference types are immutable or internally synchronized.
- [ ] Treat each `@unchecked Sendable` as a written proof of thread safety, not a way to clear a diagnostic.
- [ ] Verify no non-Sendable reference (view, model context, unsynchronized class) is captured in a `Task` or task-group closure.
- [ ] Never block a cooperative-pool thread: replace `Thread.sleep`, semaphores, blocking I/O, and `DispatchQueue.sync` with `Task.sleep` and `await`.
- [ ] Honor cancellation cooperatively: call `Task.checkCancellation()` or test `Task.isCancelled` at loop boundaries, and propagate `CancellationError` rather than swallowing it.
- [ ] Do not spawn a `Task` inside `deinit` or a SwiftUI view `body`; tie async work to an owner that can cancel it.
- [ ] When adopting Swift 6.2 "approachable concurrency" (default main-actor isolation, `nonisolated(nonsending)`, `@concurrent`), confirm the same Sendable and isolation rules still hold — these are ergonomics, not semantic exceptions.
- [ ] Migrate completion-handler APIs to `async`/`await` (e.g. `withCheckedThrowingContinuation`), resuming the continuation exactly once on every path.
