---
name: compose-ui-testing
description: Covers Jetpack Compose UI testing — createComposeRule, createAndroidComposeRule, semantic finders and matchers, assertions and actions, synchronization and idling, testTag, and screenshot/state testing. Use when writing instrumented or local Compose UI tests, verifying composable behavior through semantics, or diagnosing test flakiness caused by synchronization gaps.
---

## When to use

Reach for this guidance whenever you write tests that exercise Compose UI — whether a single stateless composable in a unit-style test or a full screen wired to a ViewModel in an instrumented test. It covers everything from setting up the test rule and finding nodes through the semantics tree, to asserting properties, performing actions, handling asynchronous synchronization, and capturing screenshots for visual regression.

---

## Core guidance

### Test rule selection

- Use `createComposeRule()` when your test does not need an `Activity` — it hosts the composable in a lightweight container and runs as a local (Robolectric or on-device) test without launching a real `Activity`.
- Use `createAndroidComposeRule<MyActivity>()` when you need system resources a real `Activity` provides: themes, system back, window insets, or navigation. It gives you the rule's `activity` property to call Android APIs.
- Annotate the rule with `@get:Rule` and reference it throughout the test class via the injected property.

### Setting content

Call `rule.setContent { … }` inside each test body (or in a `@Before` method when all tests share the same root composable). Pass composable lambdas directly; inject fakes for ViewModels or repositories rather than using real production dependencies.

### Finders — locating nodes in the semantics tree

- `onNode(matcher)` — single node; fails if zero or more than one node matches.
- `onNodeWithText("Label")` — shorthand for `hasText(...)`.
- `onNodeWithTag("myTag")` — preferred for nodes with no stable visible text; requires a `Modifier.testTag("myTag")` on the composable.
- `onNodeWithContentDescription("…")` — useful for icons.
- `onAllNodes(matcher)` — returns a `SemanticsNodeInteractionCollection` for multi-node assertions.
- Chain `onChildren()`, `onParent()`, `onSibling()` to navigate relative to a found node.
- Use `useUnmergedTree = true` when you need to pierce through merged semantics (e.g., inside a `Row` that merges its children into one clickable node).

### Matchers

Combine atomic matchers with `and`, `or`, `not`:

```
hasText("Submit") and hasClickAction()
hasTestTag("email_field") and !hasText("")
```

Common atomic matchers: `hasText`, `hasTestTag`, `hasContentDescription`, `hasClickAction`, `isEnabled`, `isDisplayed`, `isFocused`, `isSelected`, `isToggleable`, `hasScrollAction`, `isHeading`.

### Assertions

- `assertExists()` / `assertDoesNotExist()` — presence.
- `assertIsDisplayed()` / `assertIsNotDisplayed()` — visibility within the viewport.
- `assertIsEnabled()` / `assertIsNotEnabled()` — enabled state.
- `assertIsSelected()` / `assertIsNotSelected()` — for toggleable nodes.
- `assertTextEquals("…")` / `assertTextContains("…", substring = true)`.
- `assertContentDescriptionEquals("…")`.
- `assertCountEquals(n)` — on a collection returned by `onAllNodes`.

### Actions

- `performClick()` — fires a click on the node.
- `performTextInput("…")` — types into a text field; does not clear first. Use `performTextClearance()` before to replace existing content.
- `performTextReplacement("…")` — clear + type in one call.
- `performScrollTo()` — scrolls a lazy list until the node is visible.
- `performScrollToIndex(n)` / `performScrollToKey(key)` — on `LazyColumn`/`LazyRow`.
- `performTouchInput { swipeLeft() }` — raw gesture injection.
- `performImeAction()` — fires the keyboard action (Done, Search, Next).

### Synchronization and idling

Compose tests automatically idle-wait for pending recompositions and animations to settle before each assertion. If you have work that runs outside the Compose clock — coroutines dispatched to real threads, `Handler` posts, or animation systems Compose does not control — you need to tell the test framework about it.

- Register `IdlingResource` implementations with `rule.registerIdlingResource(…)` / `rule.unregisterIdlingResource(…)`.
- For coroutines, replace `Dispatchers.Main` and other dispatchers with a `TestCoroutineScheduler`-backed dispatcher, then call `advanceUntilIdle()` to drain pending work before asserting.
- `rule.mainClock.autoAdvance = false` lets you step the Compose clock manually with `rule.mainClock.advanceTimeBy(ms)`. This is the correct approach for testing animations or debounced interactions without real-time waiting.
- Never `Thread.sleep` in a Compose test as a synchronization mechanism; use the idling infrastructure or clock control instead.

### testTag convention

Place `Modifier.testTag("…")` on the outermost meaningful node of a composable, not deep inside implementation details. Define tag constants in a companion object or top-level object to avoid typos and keep test/source in sync:

```kotlin
object TestTags {
    const val LOGIN_BUTTON = "login_button"
    const val EMAIL_FIELD  = "email_field"
    const val ERROR_BANNER = "error_banner"
}
```

Apply in production code (`Modifier.testTag(TestTags.LOGIN_BUTTON)`) and reference in tests (`onNodeWithTag(TestTags.LOGIN_BUTTON)`).

### Screenshot and state testing

- For screenshot/golden tests, use the `androidx.test.screenshot` library or a third-party harness (Paparazzi, Roborazzi). Call `rule.onRoot().captureToImage()` to obtain a `Bitmap` for comparison.
- Paparazzi runs entirely on the JVM (no device required) and integrates with Gradle; Roborazzi provides Robolectric-based screenshots with Compose support. Choose based on whether you need pixel-perfect device rendering.
- Test meaningful states — empty, loading, error, populated — rather than a single "happy path" screenshot. Pass different constructor arguments or ViewModel fakes to drive each state.

```kotlin
@get:Rule
val composeRule = createComposeRule()

@Test
fun loginScreen_invalidEmail_showsError() {
    composeRule.setContent {
        LoginScreen(
            viewModel = FakeLoginViewModel(initialState = LoginUiState.Idle)
        )
    }

    composeRule
        .onNodeWithTag(TestTags.EMAIL_FIELD)
        .performTextInput("not-an-email")

    composeRule
        .onNodeWithTag(TestTags.LOGIN_BUTTON)
        .performClick()

    composeRule
        .onNodeWithTag(TestTags.ERROR_BANNER)
        .assertIsDisplayed()
        .assertTextContains("valid email", substring = true)
}
```

---

## Platform notes

- `createComposeRule()` runs on both Robolectric (local JVM) and real/emulated devices; `createAndroidComposeRule` requires a device or emulator.
- Material 3 components merge their semantics by default. When a `Button` contains an `Icon` and a `Text`, the tree exposes a single merged node with the text as the accessible label. Use `useUnmergedTree = true` only when you specifically need to inspect the internal structure.
- On API 26+ `captureToImage()` is supported; on older APIs it falls back or throws. Target at least API 26 in your test variant if you need screenshot assertions.
- Compose tests respect `@UiThreadTest` where needed, but most Compose test APIs already marshal correctly — prefer letting the rule handle threading rather than annotating tests manually.
- With Android 16 (API 36) predictive back gestures are enabled by default; if your tests exercise back navigation via `performClick()` on a nav-up button, verify the target composable is actually showing the back button rather than relying on the gesture.

---

## Pitfalls

- **Not placing `testTag` before writing tests.** Attempting to find nodes by dynamic text that can change breaks tests on localization. Assign stable `testTag` values at authoring time.
- **Using `assertIsDisplayed()` on a node inside a `LazyColumn` before scrolling to it.** A node can exist in the semantics tree but be out of the viewport; call `performScrollTo()` first or use `assertExists()` when presence (not visibility) is what you mean.
- **Asserting immediately after a state change that triggers a coroutine.** If the UI update is driven by a real dispatcher, the Compose clock may have settled but the coroutine has not yet delivered results. Inject a `TestDispatcher` and call `advanceUntilIdle()` before asserting.
- **Calling `performTextInput` without clearing first.** It appends to existing text. Use `performTextReplacement` or prefix with `performTextClearance()` when the field may not be empty.
- **Sharing mutable state between tests.** `setContent` reinstalls a fresh composition, but if a ViewModel singleton or object holds state, tests can bleed into each other. Always provide fresh fakes or reset state in `@Before`/`@After`.
- **Using `Thread.sleep` for synchronization.** This makes tests slow and non-deterministic. Use `mainClock.autoAdvance`, `IdlingResource`, or `advanceUntilIdle()` instead.
- **Testing internal implementation details through `useUnmergedTree`.** Tests that depend on the internal node hierarchy are brittle — they break when the composable's internal structure changes even if behavior is unchanged. Prefer behavioral assertions through the merged public semantics.
- **Forgetting to unregister `IdlingResource` in `@After`.** Leaked idling resources can cause subsequent tests in the suite to timeout waiting for a resource that will never become idle.

---

## References

- **Documentation:** [Testing your Compose layout — Android Developers](https://developer.android.com/develop/ui/compose/testing)
- **Documentation:** [Compose testing cheatsheet — Android Developers](https://developer.android.com/develop/ui/compose/testing/testing-cheatsheet)

---

## See also

For testing asynchronous coroutine-driven state changes in ViewModels, see `testing-async-code`. For structuring test doubles, fakes, and dependency injection in Android tests, see `hilt-di`. For state management patterns that make composables easier to test (stateless composables, hoisted state), see `compose-state`. For screenshot/golden testing tooling specifics, see `snapshot-testing`.
