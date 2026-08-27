## SwiftUI architecture checklist

- [ ] Domain state is modeled as `@Observable` reference types, not scattered across `@State` in views.
- [ ] Shared/scene-wide models are injected via `.environment(...)` and read with `@Environment(Model.self)`, not threaded as bindings through every level.
- [ ] A model is held in `@State` only where the view owns its lifetime; injected models are not duplicated into `@State`.
- [ ] Side effects (network, persistence, formatting) live in the model or injected services, never in `body`.
- [ ] Async work runs in `.task`/`async` methods, keeping the render path pure.
- [ ] Each per-view `ViewModel` justifies itself with real presentation logic or testable orchestration — no pass-through wrappers.
- [ ] No `@Observable` model is needlessly wrapped in a legacy `ObservableObject`/`@StateObject`.
- [ ] UI-facing models are `@MainActor` (or rely on Swift 6.2 default main-actor isolation) under strict concurrency.
- [ ] Logic is unit-tested directly (Swift Testing) without rendering UI, with services mocked.
- [ ] The MV-vs-MVVM choice is applied consistently across the codebase, and the minimum deployment target supports Observation (iOS 17+ / macOS 14+) before relying on `@Observable`.
