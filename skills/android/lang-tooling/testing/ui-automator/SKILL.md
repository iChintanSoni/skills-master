---
name: ui-automator
description: Covers UI Automator for cross-app and system UI instrumented tests on Android — UiDevice setup, element selectors, cross-process interactions, and combining UI Automator with Espresso or Compose test rules for end-to-end flows. Use when writing instrumented tests that must interact with system dialogs, other apps, or the notification shade.
globs:
  - "**/*.kt"
tags: [android, testing, ui-automator, instrumented-tests, end-to-end]
x-skills-master:
  domain: android
  class: lang-tooling
  category: testing
  platforms: ["android"]
  requires: {"android": "16", "kotlin": "2.2"}
  pairs_with: []
  sources:
    - https://developer.android.com/training/testing/other-components/ui-automator
    - https://developer.android.com/training/testing/instrumented-tests
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Use this skill when an instrumented test must reach outside your app's process: accepting a runtime permission dialog, interacting with the system notification shade, deep-linking from another app, verifying a share sheet, or orchestrating a full purchase flow that transitions through a payment app. UI Automator is the right tool whenever Espresso or the Compose test rule alone cannot reach the target UI because it lives in a different process or in system chrome.

Do not reach for UI Automator to test widgets that are fully owned by your own app — Espresso and `ComposeTestRule` are faster, more stable, and give better error messages for in-process interactions. UI Automator is a supplement, not a replacement.

## Core guidance

### Dependency setup

- Add UI Automator as an `androidTestImplementation` dependency; it ships as part of AndroidX Test.
- Pair it with `androidx.test:runner` and `androidx.test:rules` so `InstrumentationRegistry` and `ActivityScenario` are available in the same test module.

```kotlin
// build.gradle.kts (app module)
androidTestImplementation("androidx.test.uiautomator:uiautomator:2.3.0")
androidTestImplementation("androidx.test:runner:1.6.2")
androidTestImplementation("androidx.test:rules:1.6.1")
androidTestImplementation("androidx.test.espresso:espresso-core:3.6.1")
```

### Acquiring UiDevice

- Obtain `UiDevice` via `UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())` — never construct it yourself.
- Call `device.pressHome()` at the start of cross-app tests to ensure a known starting state.
- Always use the `UiDevice` instance; it is the single entry point to all device-level actions (press key events, rotate, open notifications, take screenshots).

### Finding elements with selectors

- Prefer stable, semantic selectors in this priority order: resource ID (`By.res`) > content description (`By.desc`) > text (`By.text`) > class name (`By.clazz`).
- Use `By.res("com.example.app", "button_confirm")` rather than hardcoding the full string — splitting package and id makes refactoring cheaper.
- `BySelector` (the `By.*` factory) is the modern API; avoid the older `UiSelector` (used with `findObject(UiSelector(...))`) in new code unless targeting APIs below 18.
- Use `device.wait(Until.hasObject(selector), timeoutMs)` before interacting; never assume an element is immediately visible after a transition.
- For lists, use `device.findObject(By.scrollable(true))` and call `scrollUntil` or `fling` to bring off-screen items into view before asserting.

### Interacting across app boundaries

- To launch your own app, use `device.pressHome()` followed by `context.startActivity(intent)` with `FLAG_ACTIVITY_NEW_TASK` and `FLAG_ACTIVITY_CLEAR_TASK` so the back stack is clean.
- To open system settings or another package, use `device.executeShellCommand("am start -n <package>/<activity>")` or construct and fire an explicit `Intent`.
- Dismiss system permission dialogs (camera, location, notifications) by finding the "Allow" button with `By.text("Allow").pkg("com.android.permissioncontroller")` and clicking it; the permission controller package name may differ by OEM, so also consider matching by `By.textContains("Allow")` as a fallback.
- After a cross-process action, call `device.waitForIdle(idleTimeoutMs)` before asserting to let the target app settle. Keep timeouts under 5 seconds to avoid masking genuine slowness.

### Combining UI Automator with Espresso and Compose

- Use `ActivityScenario.launch()` (or `createComposeRule()`) to drive in-app interactions, and switch to `UiDevice` only when crossing process boundaries.
- A common pattern: launch your app → drive setup via Espresso/Compose → trigger an action that opens a system dialog → handle the dialog with `UiDevice` → return to your app and assert with Espresso/Compose.
- `UiDevice` and `ComposeTestRule` co-exist in the same test class with no special wiring; both talk to the same instrumented process.

```kotlin
@RunWith(AndroidJUnit4::class)
class NotificationDeepLinkTest {

    @get:Rule
    val composeRule = createAndroidComposeRule<MainActivity>()

    private val device: UiDevice by lazy {
        UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())
    }

    @Test
    fun notificationTap_navigatesToDetailScreen() {
        // 1. Trigger a notification from within the app (Compose/Espresso)
        composeRule.onNodeWithTag("send_notification_button").performClick()

        // 2. Pull down the notification shade via UiDevice
        device.openNotification()
        device.wait(Until.hasObject(By.textContains("New message")), 3_000)

        // 3. Tap the notification — crosses into system UI process
        device.findObject(By.textContains("New message")).click()

        // 4. Wait for the app to come back to foreground
        device.wait(Until.hasObject(By.pkg("com.example.app").depth(0)), 3_000)

        // 5. Assert in-app state using Compose test APIs
        composeRule.onNodeWithTag("detail_screen").assertIsDisplayed()
    }
}
```

### Stability and flake reduction

- Wrap every element lookup with `device.wait(Until.hasObject(...), timeout)` and assert the return value before calling `findObject` — a `null` from `findObject` will throw an unhelpful NPE.
- Avoid fixed `Thread.sleep` calls; use `waitForIdle`, `wait(Until.*)`, or `composeRule.awaitIdle()` instead.
- When interacting with OEM-specific system UI (e.g., Pixel vs Samsung permission dialogs), use text-contains matchers (`By.textContains`) and content-description contains matchers to remain resilient to minor string differences.
- Run cross-app tests in a dedicated Gradle test variant or source set to keep CI fast; tag them with `@LargeTest` and filter with `@RequiresDevice` when emulators are unreliable for the scenario.
- Grant permissions programmatically via `GrantPermissionRule` or `UiAutomation.executeShellCommand("pm grant ...")` when the test does not specifically need to exercise the permission dialog UI.

### Accessibility and semantic IDs

- Add `testTag` or `contentDescription` to every interactive Compose element that cross-app tests must find; UI Automator respects the accessibility tree.
- In View-based UI, set `android:tag` or `contentDescription` on interactive views; avoid locating elements purely by text when the string is subject to translation.

## Platform notes

- **API level 18+** — `UiDevice` and `By`/`Until` require API 18 minimum; `BySelector` is the modern selector API introduced in API 18. The `minSdk` for UI Automator tests is independent of your app's `minSdk` because tests run on a connected device or emulator, not on production user devices.
- **API 16 minimum in requires** — the `android: "16"` requirement here refers to the app-under-test minimum; the test APK itself will always target a recent API level.
- **Multi-window / freeform** — on large-screen devices with freeform windows, element coordinates shift. Prefer selector-based interactions (`findObject(selector).click()`) over coordinate-based ones (`device.click(x, y)`) to remain window-size agnostic.
- **Instrumented vs. robolectric** — UI Automator tests are strictly instrumented; they cannot run under Robolectric. Schedule them in a separate CI step that provisions a physical device or managed emulator.
- **AndroidX Test 1.6+** — `UiDevice.getInstance()` returns the same singleton for the test process; no lifecycle management is needed beyond acquiring it once per test class via a lazy property or `@Before`.
- **UiAutomation vs UiDevice** — `UiAutomation` (from `InstrumentationRegistry.getInstrumentation().uiAutomation`) gives lower-level access (shell commands, accessibility events) when `UiDevice` does not expose what you need. Prefer `UiDevice` for element interaction; use `UiAutomation` for shell operations.

## Pitfalls

- **Missing `wait` before `findObject`** — calling `device.findObject(selector)` without first waiting for the element returns `null` on fast machines and a stale object on slow ones. Always call `device.wait(Until.hasObject(selector), timeout)`.
- **Hardcoded permission-dialog text** — strings like "Allow" differ by locale and OEM skin. Use `By.textContains` or match by resource ID where possible; for permission dialogs specifically, `GrantPermissionRule` is safer when dialog UI testing is not the goal.
- **Fixed `Thread.sleep`** — hides real latency problems and is still flaky under load. Replace with `device.waitForIdle` or `Until.*` waits.
- **Leaking `UiDevice` state between tests** — if a test opens the notification shade or navigates away, the next test starts in an unexpected state. Call `device.pressHome()` in `@Before` or `@After` to reset.
- **Co-ordinate-based clicks** — `device.click(x, y)` breaks on different screen densities and window sizes. Use selector-based `UiObject2.click()` exclusively.
- **Blocking the main thread in test setup** — `InstrumentationRegistry.getInstrumentation().runOnMainSync { }` blocks until the block completes; long operations here cause ANR-like timeouts. Offload to a coroutine or use `ActivityScenario.onActivity` with short-lived mutations.
- **Asserting immediately after `click()`** — some system transitions (e.g., opening Settings) are asynchronous. Insert a `device.wait(Until.hasObject(...), timeout)` after any action that changes the foreground app.
- **Not filtering large tests in CI** — UI Automator tests are slow (seconds each) and require a device. Running them with every unit-test suite wastes CI time. Use Gradle test filtering (`-Pandroid.testInstrumentationRunnerArguments.annotation=androidx.test.filters.LargeTest`) or a separate CI job.

## References

- **Official guide:** [UI Automator](https://developer.android.com/training/testing/other-components/ui-automator)
- **Official guide:** [Instrumented tests on Android](https://developer.android.com/training/testing/instrumented-tests)
- **API reference:** [UiDevice](https://developer.android.com/reference/androidx/test/uiautomator/UiDevice)
- **API reference:** [By selector factory](https://developer.android.com/reference/androidx/test/uiautomator/By)

## See also

The `kotlin-coroutines` skill covers async patterns that often underpin the in-app state you are asserting after cross-process flows. For pure in-app UI testing without system interactions see the Compose testing APIs covered by `compose-state`. The `unit-testing-strategy` and `testing-async-code` skills address test layering decisions that determine when UI Automator is the right choice versus a simpler test double approach.
