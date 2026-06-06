---
name: choosing-android-testing
description: Decision router for the Android test strategy — the test pyramid for Kotlin/Compose apps covering JVM unit tests, Robolectric, instrumented tests, Compose UI tests, Espresso/UI Automator, and screenshot tests. Use when designing a test suite from scratch, deciding which test type to add for a specific concern, or evaluating where to invest limited test effort.
tags: [testing, compose, unit-tests, instrumentation, strategy]
x-skills-master:
  domain: android
  class: overview
  category: overviews
  platforms: ["android", "large-screen"]
  requires: {android: "16", kotlin: "2.2"}
  pairs_with: []
  sources:
    - https://developer.android.com/training/testing
    - https://developer.android.com/training/testing/fundamentals
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Use this skill when starting a test suite on a new Android project, deciding what kind of test to write for a specific piece of logic or UI, or planning where to spend limited test effort. It routes to the right tier; the mechanics of authoring each test type live in the dedicated code skills referenced in "See also".

## Core guidance

Android testing maps to a well-established pyramid: a large base of fast JVM tests, a middle tier of integration tests, and a thin top layer of full UI tests. Each tier costs more to run and maintain as you move up.

### Tier 1 — JVM unit tests (widest base)

Run on the developer's machine with no device or emulator needed. Fast, deterministic, and cheap to write.

- **Pure Kotlin logic** — business rules, domain models, state machines, mappers, and anything injectable: always test here first. Use JUnit 5 (via `junit-vintage-engine` shim for JUnit 4 compatibility) and Kotlin coroutines testing (`kotlinx.coroutines.test`).
- **ViewModel** — test your ViewModel directly against a fake repository. Use `TestScope` and `runTest` to drive `StateFlow`/`SharedFlow` without a device. This is the single highest-ROI test location for a Compose app.
- **Coroutine and Flow pipelines** — use `Turbine` or `collectValues` helpers in `runTest`; test cancellation and error paths here rather than in UI tests.
- **Avoid**: anything that touches the Android framework (`Context`, `Resources`, `SharedPreferences`, `Room`) — those require Robolectric or a real device.

### Tier 2a — Robolectric (JVM + simulated framework)

Runs on the JVM but provides a simulated Android environment, including `Context`, `Resources`, and basic layout inflation.

- Best for: code that needs `Context` but has no meaningful visual output — `SharedPreferences`/`DataStore` reads, resource lookups, simple `BroadcastReceiver`/`Service` lifecycle, `Room` DAOs with an in-memory database.
- **Compose + Robolectric** — the Compose testing rule (`createComposeRule()`) works on Robolectric from `robolectric 4.12+`. Use this for Compose composable logic tests that do not require a GPU or real sensor input. Still fast enough to run in CI without an emulator.
- Avoid: anything requiring hardware access (camera, Bluetooth, accurate GPU rendering, real network). Avoid duplicating tests that already live in Tier 1; Robolectric tests are ~5–10× slower than pure JVM.

### Tier 2b — Instrumented integration tests (on device/emulator)

Run on a physical device or emulator via `androidx.test`. Use for boundaries that Robolectric simulates poorly.

- **Room database** — always test DAOs against the real SQLite engine on device; Robolectric's SQLite simulation has historically missed edge cases.
- **WorkManager** — use `TestWorker` and `WorkManagerTestInitHelper` on device; JVM mocks miss scheduling state.
- **DataStore, ContentProvider, real filesystem** — any I/O that depends on true Android sandboxing belongs here.
- Keep these tests coarse-grained: exercise a real component boundary, not every edge case (leave edge cases to Tier 1).

### Tier 2c — Compose UI tests (middle tier)

`createComposeRule()` or `createAndroidComposeRule<>()` gives a semantic testing API over the Compose node tree: `onNodeWithText`, `onNodeWithContentDescription`, `performClick`, `assertIsDisplayed`.

- **Prefer for**: verifying a single composable's interaction contract — a form that disables a Submit button until all fields are valid, a list that shows an empty-state composable when data is empty, navigation triggered by a button tap.
- **Run on Robolectric** for speed in CI (no GPU required for most semantic checks); promote to an instrumented test only if you hit Robolectric rendering limitations.
- **Do not use** to verify pixel-level appearance — that is screenshot testing's job. Compose UI tests are structural/semantic.
- Avoid end-to-end flows in Compose tests; those belong in Tier 3.

### Tier 3 — Full UI tests (Espresso / UI Automator)

Run end-to-end on a real device or emulator, crossing multiple screens, multiple activities, or system-level dialogs.

- **Espresso** — preferred for in-app flows where your app owns all the UI. Integrates with `ActivityScenario`, handles idling automatically with `IdlingRegistry`.
- **UI Automator** — use when the test must interact with system UI (permission dialogs, notifications, the status bar, launcher) or with another app.
- Keep this tier thin: two to five critical user journeys per major feature (sign-in, checkout, media playback). Anything more creates a slow, flaky suite.
- Invest in a stable test harness (fake/stub network, deterministic clock) before expanding this tier; flakiness here costs more to debug than the value it provides.

### Screenshot tests — a focused cross-tier tool

Screenshot testing captures rendered output as reference images and fails on pixel or structural diff. It is not a tier of its own — it augments the pyramid at the Composable level.

- **When to use**: shared design-system components, themed composables, complex conditional layouts, dark/light mode correctness.
- **Robolectric screenshot tests** (Paparazzi or `screenshotTest` in AGP 8.3+) run off-device and are fast enough for CI.
- Keep the scope tight. Reference images are fragile across font-scaling, OS versions, and emulator GPU differences. Scope to components that break silently and are expensive to review visually.
- Never use screenshot tests as the primary regression safety net — they are a narrow complement, not a substitute for semantic tests.

### Routing summary

| What you are testing | Start here |
|---|---|
| Pure logic, mapper, domain model | JVM unit test |
| ViewModel / StateFlow pipeline | JVM unit test + `runTest` |
| Code that needs `Context` or resources | Robolectric |
| Compose composable interaction | Compose UI test (Robolectric-backed) |
| Room DAO, DataStore, real I/O | Instrumented integration test |
| Full user journey across screens | Espresso (in-app) / UI Automator (system) |
| Design-system component appearance | Paparazzi / AGP screenshotTest |

**Practical default for a Compose-first app**: heavy JVM unit test base covering ViewModels and domain; Compose UI tests for component contracts (Robolectric-backed); one to three Espresso journeys for the flows that directly generate revenue or lose users if broken; screenshot tests on shared design-system composables only.

## Platform notes

- **Large-screen and foldable** — `WindowSizeClass` branching logic should be unit-tested with fake size inputs; adaptive navigation scaffolds (`NavigationSuiteScaffold`, `ListDetailPaneScaffold`) can be covered with Compose UI tests using `createComposeRule` with explicit window size constraints.
- **AGP 8.3+ `screenshotTest` DSL** — the Gradle plugin provides a first-party screenshot test task that runs on Robolectric. It replaces ad-hoc Paparazzi setups for new projects; Paparazzi remains valid for teams that need its additional configuration surface.
- **Compose `1.7+`**  — the `IdlingResource` bridge between Compose and Espresso stabilised; mixed Compose/View screens can use Espresso + `ComposeTestRule` together when needed.
- **CI cost** — instrumented tests on managed devices (Gradle Managed Devices) add emulator spin-up overhead. Prefer Robolectric for everything that it can simulate faithfully, and confine instrumented tests to a dedicated slow CI lane.

## Pitfalls

- Inverting the pyramid: a large Espresso suite standing in for missing unit and Compose UI tests. Espresso tests are 20–100× slower and far more flaky.
- Testing implementation detail rather than behavior — asserting that a private method was called instead of testing that the correct state is emitted.
- Using `Thread.sleep` instead of `runTest`, `IdlingResource`, or `awaitIdle` to wait for async work in tests; this causes both false positives and slow suite times.
- Putting all Room tests in Robolectric; the simulated SQLite engine has diverged from real SQLite in edge cases (FTS, WAL mode, triggers). Use an in-memory real Room database on device for DAO tests.
- Treating Compose UI tests as screenshot tests — they verify structure and semantics, not pixels. Pixel assertions belong in Paparazzi/screenshotTest.
- Letting screenshot reference images silently drift by auto-accepting diffs without review.
- Skipping a test harness (fake server, deterministic time) before expanding the Espresso tier; flakiness compounds with suite size.

## References

- **Developer Guide:** [Test your app](https://developer.android.com/training/testing)
- **Developer Guide:** [Fundamentals of testing Android apps](https://developer.android.com/training/testing/fundamentals)
- **Developer Guide:** [Test Compose layouts](https://developer.android.com/develop/ui/compose/testing)
- **Developer Guide:** [Espresso](https://developer.android.com/training/testing/espresso)
- **Developer Guide:** [UI Automator](https://developer.android.com/training/testing/ui-automator)
- **Developer Guide:** [Robolectric integration](https://developer.android.com/training/testing/local-tests/robolectric)
- **Developer Guide:** [Screenshot testing with AGP](https://developer.android.com/studio/preview/compose-screenshot-testing)

## See also

For writing coroutine and Flow tests, see `swift-concurrency` as a conceptual parallel or the Android `testing-async-code` skill. For ViewModel architecture that makes unit testing straightforward, see `swiftui-app-architecture` as a structural reference and the Android `navigation-architecture` skill. For Compose UI patterns that affect how composables are structured for testability, see `swiftui-core` for parallel iOS concepts.
