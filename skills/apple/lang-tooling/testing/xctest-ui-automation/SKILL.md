---
name: xctest-ui-automation
description: "Drives end-to-end UI tests with XCUITest — launching XCUIApplication, querying elements, waiting on expectations, asserting state, and structuring page objects. Use when writing or stabilizing automated UI tests, fixing flaky element lookups, or wiring accessibility identifiers for reliable selectors."
globs:
  - "**/*.swift"
tags: [testing, xcuitest, ui-testing, accessibility, automation]
x-skills-master:
  domain: apple
  class: lang-tooling
  category: testing
  platforms: [ios, ipados, macos, tvos, visionos]
  requires:
    xcode: "26"
  pairs_with: []
  sources:
    - https://developer.apple.com/documentation/xcuiautomation
    - https://developer.apple.com/documentation/xctest/xcuiapplication
    - https://developer.apple.com/documentation/xcuiautomation/xcuielement/waitforexistence(timeout:)
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Use when authoring or repairing end-to-end UI tests that drive a real app build through the accessibility layer — tapping, typing, scrolling, and asserting on-screen state. This is the right tool when you need to verify navigation flows, system permission prompts, or multi-screen journeys. For pure logic and unit tests, reach for Swift Testing instead; XCUITest is slower and runs the whole app.

## Core guidance

- Drive the app through an `XCUIApplication` proxy: configure `launchArguments` and `launchEnvironment` before `launch()`, then read them in the app to enable test seams (skip onboarding, point at a mock server, disable animations).
- Do find elements by stable `accessibilityIdentifier` values, not visible labels or screen position. Labels change with localization and copy edits; identifiers are invisible to users and survive both.
- Don't assert on `exists` immediately after navigation — it races animation and async loads. Wait with `waitForExistence(timeout:)`, or build an `XCTNSPredicateExpectation` and an `XCTWaiter` for richer conditions like "spinner gone."
- Prefer `.firstMatch` and a narrowly typed query (e.g. `app.buttons["save"]`) so the engine stops at the first hit instead of evaluating the whole tree — a major speed win on dense screens.
- Encapsulate each screen in a page object: a small `struct` holding the `XCUIApplication` plus typed element accessors and action methods that return the next page object, so tests read as flows and selectors live in one place.
- Keep tests independent and hermetic — relaunch per test, seed state via launch environment, and never depend on order. Disable animations and avoid `sleep`; deterministic waits are both faster and less flaky.
- Use `XCTAttachment` and the WWDC25 record-and-review tooling to capture screenshots and video for failures rather than guessing from a bare assertion message.

```swift
struct LoginScreen {
    let app: XCUIApplication
    var emailField: XCUIElement { app.textFields["login.email"] }
    var submit: XCUIElement { app.buttons["login.submit"] }

    func signIn(as email: String) -> HomeScreen {
        emailField.tap()
        emailField.typeText(email)
        submit.tap()
        return HomeScreen(app: app)
    }
}
```

## Platform notes

The UI-automation symbols (`XCUIApplication`, `XCUIElement`, `XCUIElementQuery`) live in the `XCUIAutomation` framework, split out from `XCTest` but imported the same way in a UI Test target. On macOS, `app.launch()` activates a windowed process; on iOS/tvOS/visionOS it drives the Simulator or device. The interaction API differs by platform — use `typeText` for keyboards, but expect remote-focus navigation on tvOS and gaze-plus-pinch semantics surfaced through standard taps on visionOS.

## Pitfalls

- Querying by index (`buttons.element(boundBy: 2)`) — it breaks the moment layout shifts. Add an identifier instead.
- Forgetting that broad queries like `app.descendants(matching:)` walk the entire tree on every access; scope queries and cache the element.
- Calling `tap()` on an element that exists but is off-screen or not `isHittable` — scroll it into view or assert `isHittable` first.
- Sharing state between tests through a persistent simulator, then chasing "flaky" failures that are really ordering bugs.

## References

- **Documentation:** [XCUIAutomation](https://developer.apple.com/documentation/xcuiautomation)
- **Documentation:** [XCUIApplication](https://developer.apple.com/documentation/xctest/xcuiapplication)
- **Documentation:** [waitForExistence(timeout:)](https://developer.apple.com/documentation/xcuiautomation/xcuielement/waitforexistence(timeout:))
- **WWDC:** [Record, replay, and review: UI automation with Xcode (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/344/)
- **WWDC:** [Get your test results faster (WWDC20)](https://developer.apple.com/videos/play/wwdc2020/10221/)

## See also

- The swift-testing skill, for the unit and logic tests that should cover most behavior before any UI test is written.
- Apple: XCUIAutomation and XCUIApplication reference (see sources).
