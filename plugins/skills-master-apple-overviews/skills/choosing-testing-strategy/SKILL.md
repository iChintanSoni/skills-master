---
name: choosing-testing-strategy
description: Helps pick an Apple testing strategy — Swift Testing vs XCTest for new and existing code, plus the right mix of unit, integration, UI, and snapshot tests and how much to invest at each level. Use when starting a test suite, deciding which framework to adopt, planning a migration, or routing into specific testing skills.
---

## When to use

Use at the start of a test suite, when deciding which framework to adopt, or when planning where to spend test effort. This skill routes a decision; the mechanics of writing tests live in the per-framework code skills (for example `swift-testing`).

## Core guidance

Pick the framework per layer, then size the suite to the risk it covers:

- **Default new unit and integration tests to Swift Testing.** As of the Xcode 26 / Swift 6.x cycle it is the modern default: `@Test`/`#expect`/`#require` macros, parallel execution, parameterized cases, and traits give less boilerplate and clearer failures than `XCTAssert`.
- **Keep XCTest for what Swift Testing does not cover.** UI automation (`XCUIApplication`/XCUIAutomation) and `measure {}` performance baselines are still XCTest-only. Don't try to force these into Swift Testing.
- **Don't rewrite working XCTest unit tests on a schedule.** The two frameworks coexist in one target — even one file. Migrate opportunistically when you touch a suite, not as a standalone project.
- **Shape the suite as a pyramid.** Many fast unit tests, fewer integration tests across real boundaries, a thin layer of UI smoke tests. Heavy UI suites are slow and flaky; lean on them only for critical end-to-end flows.
- **Test behavior at the lowest level that exercises it.** Push logic into pure, injectable types so a unit test suffices; reserve integration tests for wiring (persistence, networking, concurrency) and UI tests for the screens that lose money if they break.
- **Treat snapshot tests as a focused tool, not a tier.** They guard rendered layout and design-system regressions cheaply, but reference images drift across OS/device, so scope them tightly and review diffs deliberately.
- **Invest proportional to blast radius.** Spend most effort where a bug is expensive and hard to catch by inspection; don't chase coverage on trivial glue.

A practical default for a greenfield app: Swift Testing for all unit/integration tests, XCTest UI tests for two or three key journeys, optional snapshot tests on shared components.

## Platform notes

Swift Testing ships in the Xcode 26 toolchain and runs on every Apple platform plus Linux and Windows, which helps shared packages. XCUITest UI automation targets the Apple platforms only. Performance measurement and UI recording remain XCTest features. Parameterized Swift Testing cases run in parallel by default, so guard shared mutable state with the `.serialized` trait when needed.

## Pitfalls

- Stalling new work on a big-bang XCTest-to-Swift-Testing rewrite instead of migrating incrementally.
- Expecting Swift Testing to drive the UI or set performance baselines — those stay in XCTest.
- Inverting the pyramid: a slow, flaky UI suite standing in for missing unit tests.
- Letting parallel parameterized tests share mutable state and produce nondeterministic failures.
- Treating snapshot images as permanent truth and rubber-stamping diffs.

## References

- **Documentation:** [Swift Testing overview](https://developer.apple.com/xcode/swift-testing/)
- **Documentation:** [Migrating a test from XCTest](https://developer.apple.com/documentation/testing/migratingfromxctest)
- **Documentation:** [XCTest](https://developer.apple.com/documentation/xctest)
- **Documentation:** [XCUIAutomation](https://developer.apple.com/documentation/xcuiautomation)
- **WWDC:** [Meet Swift Testing (WWDC24)](https://developer.apple.com/videos/play/wwdc2024/10179/)
- **WWDC:** [What's new in Swift (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/245/)

## See also

- Implementation: `swift-testing` for authoring tests with the modern framework.
- Apple: XCTest and XCUIAutomation framework references for UI and performance tests (see sources).
