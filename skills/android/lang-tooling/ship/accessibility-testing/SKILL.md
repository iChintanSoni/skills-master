---
name: accessibility-testing
description: "Covers Android accessibility testing — Accessibility Scanner, Espresso/Compose a11y checks, TalkBack and Switch Access manual walkthroughs, contrast and touch-target audits, and gating a11y failures in CI. Use when validating that an Android app is usable by people who rely on assistive technology, auditing for WCAG contrast or touch-target failures, or adding accessibility checks to a CI pipeline."
tags: [accessibility, testing, espresso, talkback, ci]
x-skills-master:
  domain: android
  class: lang-tooling
  category: ship
  platforms: ["android"]
  requires:
    android: "16"
    kotlin: "2.2"
  pairs_with: []
  sources:
    - https://developer.android.com/guide/topics/ui/accessibility/testing
    - https://developer.android.com/develop/ui/compose/accessibility
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Apply this skill when you need to confirm that your app is usable with assistive technologies — TalkBack screen reader, Switch Access, and keyboard navigation — or when you need an auditable answer on contrast ratios and touch-target sizes. Use it before every release, after any significant UI change, and as a gate in your CI pipeline so regressions surface at pull-request time rather than in production. If you are working on Compose semantics, content descriptions, or the `Modifier.semantics` API itself, defer to the compose-accessibility skill; this skill covers the testing and auditing layer that sits on top of whatever UI toolkit you use.

## Core guidance

- **Use Accessibility Scanner first for a rapid visual audit.** Install the Accessibility Scanner app from Google Play, tap the check button, and step through the findings. It surfaces missing content descriptions, small touch targets (below 48 dp), low contrast, and unlabeled interactive controls — all without writing a single test.
- **Add automated checks to Espresso tests with `AccessibilityChecks`.** One `AccessibilityChecks.enable()` call in a `@BeforeClass` method turns every Espresso interaction into an implicit a11y check. Failures are thrown as `AccessibilityViewCheckException` and fail the test the same way an assertion failure would.
- **Scope Compose a11y checks with `ComposeTestRule.onRoot().assert(…)` and the `AccessibilityIssueHelper`.** In Compose instrumented tests, the test rule surfaces the merged semantics tree; assert on it with `hasContentDescription`, `isEnabled`, and `isFocusable` matchers. For automated a11y scanning inside a composable test, use `createAndroidComposeRule<Activity>()` and call `mainClock.autoAdvance` to settle animations before the check.
- **Never rely only on automated checks.** Tools miss contextual errors — a label that is technically present but reads as a file-name string ("ic_btn_add_24"), a focus order that technically cycles but is semantically backwards, or a gesture that works for TalkBack but not Switch Access. Manual walkthroughs catch what automation cannot.
- **TalkBack manual walkthrough checklist:** Enable TalkBack in Settings > Accessibility. Navigate every screen using only swipe-right/left (linear navigation), double-tap to activate. Verify that every interactive element has a spoken label describing its action, not its visual appearance. Verify that modal dialogs trap focus and that the back gesture dismisses them predictably.
- **Switch Access manual walkthrough checklist:** Configure Switch Access with keyboard arrows or two on-screen switches. Verify that every interactive element is reachable without gaps in the scan order, that scanning does not stop inside scroll containers, and that no action requires a gesture that Switch Access cannot express.
- **Enforce contrast and touch-target minimums.** WCAG 2.1 AA requires 4.5:1 for body text, 3:1 for large text and UI components. Touch targets must be at least 48 dp. Apply `android:minHeight="48dp"` / `android:minWidth="48dp"` as baseline, or set `Modifier.minimumInteractiveComponentSize()` in Compose. Use the Accessibility Scanner or the Layout Inspector contrast checker to confirm ratios.
- **Gate a11y checks in CI.** Include the instrumented Espresso suite (with `AccessibilityChecks.enable()`) in your CI job. Fail the build on any new a11y violation by treating the `AccessibilityViewCheckException` like any other test failure. Separate the a11y test run into its own Gradle task so it can be parallelised or run on demand without blocking unit tests.

```kotlin
// In your Espresso test module — typically in a @BeforeClass or a base test class
import androidx.test.espresso.accessibility.AccessibilityChecks
import com.google.android.apps.common.testing.accessibility.framework.AccessibilityCheckResultUtils.matchesCheckNames
import com.google.android.apps.common.testing.accessibility.framework.AccessibilityCheckResultUtils.matchesViews
import org.hamcrest.Matchers.anyOf
import org.hamcrest.Matchers.containsString

@RunWith(AndroidJUnit4::class)
class CheckoutFlowTest {

    companion object {
        @BeforeClass @JvmStatic
        fun enableA11yChecks() {
            AccessibilityChecks.enable()
                .setRunChecksFromRootView(true)  // check entire screen, not only the view under test
                // Suppress a known-outstanding finding by check name and view id
                // Remove entries as you fix them — do NOT let the suppression list grow
                .setSuppressingResultMatcher(
                    anyOf(
                        matchesCheckNames(containsString("TouchTargetSizeCheck")),
                        matchesViews(withId(R.id.legacy_chip))
                    )
                )
        }
    }

    @Test
    fun placeOrder_reachableWithTalkBack() {
        onView(withId(R.id.btn_place_order)).perform(click())  // a11y check fires here
        onView(withId(R.id.confirmation_heading)).check(matches(isDisplayed()))
    }
}
```

## Platform notes

- `AccessibilityChecks` is part of the `androidx.test.espresso:espresso-accessibility` artifact, which depends on the Accessibility Test Framework (ATF). Include both in your `androidTestImplementation` dependency block.
- On API 34+ (Android 14), the system enforces a minimum touch-target size of 48 dp for interactive elements declared with accessibility flags. Ignoring this in earlier target SDKs will surface failures immediately when users upgrade.
- Compose's semantics layer merges by default — nodes that are visually separate may be reported as a single accessibility node. Run `printToLog("MY_TAG")` on the semantics tree to understand what TalkBack actually reads before asserting on node properties.
- TalkBack and Switch Access testing requires a physical device or a fully-configured emulator with the Accessibility Suite APK installed. Many CI environments lack this; run these checks on a device farm or a designated emulator image that includes the suite.
- The Accessibility Scanner's "auto-check" feature in Android 14+ can surface issues in screenshots without user interaction, useful for embedding scan results in developer workflows.

## Pitfalls

- **Suppressing ATF findings and forgetting to fix them.** Suppression matchers are escape hatches for migration, not permanent homes. An unchecked suppression list signals that accessibility is deprioritised; track each suppression as a bug.
- **Only running automated checks and skipping manual TalkBack.** The ATF cannot detect that a content description is technically present but reads as "button button activate" or that focus jumps from step 1 to step 3 because step 2 has `importantForAccessibility="no"` for visual reasons.
- **Testing with animations enabled.** TalkBack and Switch Access interact differently with animated content; Espresso's default `STRICT` idling policy may not wait for animations before firing a11y checks, leading to intermittent results. Disable animations on the device under test, or configure `AnimationMode.Disabled` in Compose tests.
- **Forgetting to check Snackbar, Toast, and dialog content.** These are common offenders — they appear briefly, have no programmatic label, or trap focus incorrectly. TalkBack should announce them without user navigation.
- **Skipping keyboard navigation testing on large-screen and foldable form factors.** Android 16 targets tablets, foldables, and desktops where a physical keyboard is expected. Tab and arrow key navigation must work end-to-end; this is not covered by TalkBack walkthroughs alone.
- **Conflating accessible with visually obvious.** A "see image for details" button with a camera icon is visually clear but fails TalkBack. Content descriptions must describe purpose, not appearance.

## References

- **Official guide:** [Test your app's accessibility — Android Developers](https://developer.android.com/guide/topics/ui/accessibility/testing)
- **Official guide:** [Accessibility in Jetpack Compose — Android Developers](https://developer.android.com/develop/ui/compose/accessibility)

## See also

The compose-accessibility skill covers Compose-specific semantics configuration — `Modifier.semantics`, `clearAndSetSemantics`, merged vs. unmerged trees, and `SemanticsActions`. The unit-testing and ui-testing skills provide the foundational Espresso and Compose test infrastructure on which accessibility checks layer. For CI pipeline setup, the ci-cd skill covers Gradle task configuration and device-farm integration.
