---
name: espresso
description: Covers Espresso UI testing for Android — onView/onData, ViewMatchers, ViewActions, ViewAssertions, idling resources, and interop with Compose-first codebases. Use when writing or reviewing instrumented UI tests for View-based or mixed View/Compose screens on Android.
globs:
  - "**/*.kt"
tags: [android, testing, espresso, ui-testing, instrumentation]
x-skills-master:
  domain: android
  class: lang-tooling
  category: testing
  platforms: ["android"]
  requires: { "android": "16", "kotlin": "2.2" }
  pairs_with: []
  sources:
    - https://developer.android.com/training/testing/espresso
    - https://developer.android.com/training/testing/espresso/basics
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Use Espresso when you need instrumented UI tests that run on a real device or emulator and exercise View-based screens end-to-end. Espresso remains the right tool for legacy `View` hierarchies, `RecyclerView`/`AdapterView` interactions, WebView validation, and any screen that has not yet been migrated to Compose. In a Compose-first codebase, reach for Espresso specifically when testing interop boundaries — fragments hosting `ComposeView`, activities that mix XML layouts with embedded composables, or shared infrastructure such as navigation graphs and deep links. For screens that are purely Compose, prefer the Compose UI Testing APIs (`createComposeRule`, `onNodeWithText`) instead.

## Core guidance

### Dependency setup

- Add `espresso-core` and `espresso-contrib` (for `RecyclerViewActions`) to `androidTestImplementation` only — never to `implementation`.
- Pin `espresso-core` and `androidx.test` runner versions together; mismatches cause cryptic class-not-found crashes at runtime.
- Enable `testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"` (or a custom subclass) in `defaultConfig`.

```kotlin
// build.gradle.kts (app module)
android {
    defaultConfig {
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }
}

dependencies {
    val espressoVersion = "3.6.1"
    androidTestImplementation("androidx.test.espresso:espresso-core:$espressoVersion")
    androidTestImplementation("androidx.test.espresso:espresso-contrib:$espressoVersion")
    androidTestImplementation("androidx.test.espresso:espresso-intents:$espressoVersion")
    androidTestImplementation("androidx.test:runner:1.6.1")
    androidTestImplementation("androidx.test:rules:1.6.1")
    androidTestImplementation("androidx.test.ext:junit:1.2.1")
}
```

### Test structure

- Annotate test classes with `@RunWith(AndroidJUnit4::class)`.
- Use `ActivityScenarioRule<A>` (JUnit 4 rule) or `ActivityScenario.launch<A>()` for manual lifecycle control; avoid the deprecated `ActivityTestRule`.
- Prefer `ActivityScenario` over raw intent launching when you need to control the activity's lifecycle state (e.g., recreate on rotation, move to RESUMED/STOPPED).
- Keep each test method focused on a single user action and assertion; a test that asserts ten things is ten tests in disguise.

### onView and ViewMatchers

- Use the most specific matcher available — `withId` is preferred over `withText` when IDs exist, because text is subject to localization.
- Combine matchers with `allOf(...)` to narrow ambiguous hierarchies (e.g., a `withText` inside a specific `withId` parent).
- Use `withContentDescription` to target accessibility-labelled views without coupling tests to internal IDs.
- `isDisplayed()` asserts that the view is visible on screen; `isCompletelyDisplayed()` is stricter and fails if any pixel is clipped.

### ViewActions

- `typeText(string)` focuses and types; `replaceText(string)` replaces without focus change — prefer `replaceText` in data-driven tests to avoid IME interactions.
- Call `closeSoftKeyboard()` after text entry to avoid obscuring views in subsequent `perform` or `check` calls.
- `scrollTo()` in `perform` handles views off-screen inside a `ScrollView`; pair with `isDisplayed()` after scrolling.
- For `RecyclerView`, use `RecyclerViewActions.actionOnItemAtPosition<VH>(position, click())` or `actionOnItem(matcher, action)` from `espresso-contrib`.

### ViewAssertions

- Prefer `matches(isDisplayed())` for presence checks and `doesNotExist()` for absence — do not use `matches(not(isDisplayed()))` to assert absence because the view may still be in the hierarchy just invisible.
- Use `check(selectedDescendantsMatch(matcher, assertion))` to validate every item in a list without scrolling through all of them.

### Idling resources

- Espresso automatically synchronises with the main thread and `AsyncTask` (deprecated) queues. It does NOT synchronise automatically with Coroutines, Retrofit, OkHttp, or custom thread pools.
- Register an `IdlingResource` for any background work that must complete before assertions run: `IdlingRegistry.getInstance().register(resource)` in `@Before`, unregister in `@After`.
- Prefer `CountingIdlingResource` for simple increment/decrement patterns around async work in production code paths.
- For Coroutines, consider injecting a `TestCoroutineScheduler`/`UnconfinedTestDispatcher` in tests so that coroutines complete synchronously, eliminating the need for an idling resource altogether.
- Never leave idling resources registered across test classes — leaked registrations cause subsequent tests to time out.

### Compose interop

- When testing an activity that hosts a `ComposeView` inside a `Fragment` or XML layout, Espresso handles the outer View shell; switch to Compose semantics nodes inside the composable using the `composeTestRule` companion.
- Add `androidx.compose.ui:ui-test-junit4` alongside Espresso for mixed screens; `createAndroidComposeRule<MyActivity>()` gives access to both the `ActivityScenario` and Compose's `onNode` API from the same test class.
- Use Espresso for the surrounding chrome (toolbar buttons, navigation drawer, bottom bar) and Compose test APIs for content inside `ComposeView` boundaries — mixing them in one test is valid and common.

### Full example

```kotlin
@RunWith(AndroidJUnit4::class)
class LoginScreenTest {

    @get:Rule
    val activityRule = ActivityScenarioRule(LoginActivity::class.java)

    private val loadingIdlingResource = CountingIdlingResource("network")

    @Before
    fun setUp() {
        IdlingRegistry.getInstance().register(loadingIdlingResource)
    }

    @After
    fun tearDown() {
        IdlingRegistry.getInstance().unregister(loadingIdlingResource)
    }

    @Test
    fun validCredentials_navigatesToHome() {
        onView(withId(R.id.emailField))
            .perform(replaceText("user@example.com"), closeSoftKeyboard())

        onView(withId(R.id.passwordField))
            .perform(replaceText("secret"), closeSoftKeyboard())

        onView(allOf(withId(R.id.loginButton), isDisplayed()))
            .perform(click())

        // Espresso waits for loadingIdlingResource to reach zero before asserting
        onView(withId(R.id.homeTitle))
            .check(matches(isDisplayed()))
    }

    @Test
    fun emptyPassword_showsValidationError() {
        onView(withId(R.id.emailField))
            .perform(replaceText("user@example.com"), closeSoftKeyboard())

        onView(withId(R.id.loginButton)).perform(click())

        onView(withText(R.string.error_password_required))
            .check(matches(isDisplayed()))
    }
}
```

## Platform notes

- **API 16+ requirement** — Espresso 3.x requires `minSdk 16`; the skill's `requires.android` is set to 16 accordingly. In practice all production apps target far higher, so this is never a constraint.
- **Animation disabling** — Espresso is sensitive to system animations. Disable Window Animation Scale, Transition Animation Scale, and Animator Duration Scale to "0x" on the test device/emulator, or apply `DisableAnimationsRule` from `androidx.test.espresso:espresso-device` for programmatic control.
- **Hilt in tests** — when using Hilt, replace `ActivityScenarioRule` with `HiltAndroidRule` plus `@HiltAndroidTest` to inject test fakes before the activity launches. Call `hiltRule.inject()` in `@Before` before launching the activity.
- **Screenshot on failure** — integrate `FailureHandler` or the `TestStorageProvider` API to capture screenshots on failure in CI pipelines; useful for debugging flaky tests without re-running locally.
- **Kotlin 2.2 / K2** — Espresso test classes compile cleanly under K2. No special compiler flags are needed. Coroutine-based fake dispatchers in test companions benefit from the improved type inference in K2.

## Pitfalls

- **No automatic Coroutine synchronisation** — the most common source of flakiness. If a button tap triggers a coroutine that updates the UI, Espresso does not wait for it unless you inject a synchronous dispatcher or register an idling resource.
- **`isDisplayed()` vs `doesNotExist()`** — views can be GONE or INVISIBLE while still present in the hierarchy. `matches(not(isDisplayed()))` passes for GONE views but `doesNotExist()` fails — choose based on intent.
- **Ambiguous view matchers** — a bare `withText("OK")` often matches multiple views (dialog buttons, snackbars, etc.). Always scope with `allOf(withText("OK"), isDisplayed())` or an ancestor matcher.
- **Leaked idling resources** — forgetting to unregister in `@After` causes subsequent test classes to hang at the idling barrier until timeout. Use try/finally in teardown.
- **RecyclerView scrolling** — `onView(withId(R.id.list)).perform(scrollTo())` does not work on `RecyclerView`; use `RecyclerViewActions.scrollToPosition` or `scrollTo(matcher)` from `espresso-contrib` instead.
- **`ActivityTestRule` still in tutorials** — it is deprecated. Migrate to `ActivityScenarioRule` or `ActivityScenario` for lifecycle-aware test setup and hermetic test isolation.
- **Hard-coded delays (`Thread.sleep`)** — never use `sleep` to wait for async operations. Every `sleep` is a race condition with a timeout. Use idling resources or a synchronous test dispatcher instead.
- **Testing Compose views with Espresso matchers** — Compose does not render into the traditional View hierarchy that Espresso's `ViewMatchers` traverse. Attempting `withText` on composable text will find nothing; use Compose's `onNodeWithText` API for that subtree.

## References

- **Official guide:** [Espresso — Test UI interactions](https://developer.android.com/training/testing/espresso)
- **Official guide:** [Espresso basics](https://developer.android.com/training/testing/espresso/basics)

## See also

The `kotlin-coroutines` skill explains structured concurrency patterns that interact with Espresso's idling resource model — especially the `TestCoroutineScheduler` alternative. For pure-Compose screens where Espresso is not the right tool, see the `compose-ui-testing` skill (Compose test APIs). For higher-level test strategy decisions — unit vs integration vs UI test pyramid — see the `unit-testing-strategy` and `testing-async-code` skills.
