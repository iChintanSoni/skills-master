---
name: m3-loading-indicator
description: "Applies Material 3 Expressive design guidance to the loading indicator component — choosing it for indefinite waits instead of a linear/circular progress indicator, understanding its animated personality, sizing and placement rules, and when to prefer alternatives such as skeleton screens or determinate progress. Use when designing or reviewing any screen that shows an indefinite wait state, deciding between a loading indicator and other progress patterns, or critiquing the expressiveness and appropriateness of a wait experience in an Android app."
tags: [loading, progress, feedback, components, m3, design]
x-skills-master:
  domain: android
  class: design
  category: components
  platforms: ["android", "large-screen"]
  pairs_with: []
  sources:
    - https://m3.material.io/components/loading-indicator/overview
    - https://developer.android.com/develop/ui/compose/components
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Use this skill when deciding how to communicate an indefinite wait in an Android app — a network request where duration is unknown, a background computation with no measurable endpoint, or an authentication handshake. It is a design-judgment skill that names the relevant Jetpack Compose composable in prose and produces do/don't critique. For implementation details, hand off to the relevant Compose components code skill.

This skill applies specifically to the M3 Expressive loading indicator — the animated, personality-forward component introduced as part of Material 3 Expressive — and explains how it differs from the older circular and linear progress indicators.

## Core guidance

- **Use the loading indicator for genuinely indefinite waits, not for known progress.** The loading indicator communicates "something is happening; I can't say when it will finish." The moment you have a measurable percentage — a download, a batch import, a multi-step wizard — switch to a determinate progress indicator instead. Misusing the loading indicator for quantifiable work misleads users about how much longer they will wait.

- **Embrace the expressive animation as a communication tool.** The M3 Expressive loading indicator uses a fluid, organic animation — a set of dots or a morphing shape with playful, continuous motion — that conveys active processing rather than a static or mechanical spin. This personality is intentional: it reduces perceived wait time and signals that the system is engaged. Do not suppress or clip this animation; it is the component's primary affordance.

- **Size the indicator to match the scope of the wait.** A small inline indicator suits a row-level refresh (a chat message, a search result updating). A larger, centered indicator suits a full-screen or pane-level load where the whole content area is unavailable. Do not use a full-screen-centered loading indicator for a localized piece of UI that loads asynchronously — that overstates the disruption.

- **Pair with a brief, specific status label when context adds value.** A lone loading indicator is sufficient for most waits. When the operation is non-obvious — "Connecting to your device", "Analyzing photo" — a short label beneath the indicator reduces anxiety. Avoid generic filler like "Loading…" or "Please wait" that adds no information; if you can say nothing specific, say nothing.

- **Do not block the entire screen if only part of the content is loading.** Overlaying a full-screen loading state over a screen where most content is already rendered creates unnecessary disruption. Scope the loading indicator to the container that is actually pending. Reserve full-screen blocking loads for the very first render when nothing is available to show.

- **Prefer skeleton screens over the loading indicator for content-heavy layouts.** When the structure of the incoming content is predictable (a card feed, a list of contacts, a settings page), a skeleton placeholder communicates shape and extent better than a spinner, anchoring the user's mental model before content arrives. Use the loading indicator for unstructured or unpredictable waits where a skeleton would be misleading.

- **Do not flash the loading indicator for sub-threshold waits.** An indicator that appears and disappears in under 300 ms is visual noise that makes the app feel jittery. Introduce a small display delay (around 300–500 ms) so the indicator only becomes visible if the wait actually exceeds a perceptible threshold. This is especially important for list-item-level async operations.

- **Respect Reduce Motion and accessibility needs.** The expressive animation is a delight by default, but users who have enabled system-level reduce-motion preferences should receive a simpler, less kinetic treatment — or a static indicator with a brief opacity pulse at most. Always ensure the loading state is announced to TalkBack so that users who rely on assistive technology know the app is working. The Compose `CircularProgressIndicator` with an indeterminate state can serve as a fallback when the expressive component is not appropriate.

- **Provide a way to cancel or time out long waits where possible.** A loading indicator with no escape path is a trap. If a wait might run for more than a few seconds, expose a Cancel action or a timeout with a helpful error state. This is a product decision, but it is the designer's responsibility to plan the failure and cancellation flows alongside the happy-path loading state.

- **Use the loading indicator sparingly in navigation transitions.** If navigation between screens is fast enough (sub-300 ms), no indicator is needed. For heavier transitions, a brief loading indicator at the destination is better than blocking the navigation itself. Avoid layering a loading overlay on top of an outgoing screen, which creates a jarring double-transition.

## Platform notes

On compact phones (the default Android form factor), the loading indicator is most commonly placed centered in its container — either the full screen or a card. The indicator has enough visual weight to read clearly on a small display without requiring a large size.

On large screens and foldables, a centered loading indicator risks appearing lost in a wide pane. Scope it carefully: if only the detail pane is loading while the list pane is interactive, contain the indicator to the detail pane. Do not use a full-window overlay on a two-pane layout where the first pane is already populated and usable.

On Wear OS, the loading indicator resolves to a very compact form — the small screen means any animation must be legible at high density. Loading states on a watch face or complication should be extremely brief; long indefinite waits belong on the phone, not the wrist. On Android TV, the indicator must be large enough to read from across the room and should always be accompanied by a label because the viewing distance makes a standalone spinner ambiguous.

## Pitfalls

- Using the loading indicator when a real percentage is available — always prefer a determinate progress indicator in that case.
- Flashing the indicator for waits shorter than 300 ms, adding jitter with no informational value.
- Centering a full-screen overlay on a screen where most content is already rendered and only a fragment is pending.
- Suppressing or clipping the expressive animation, which defeats the component's primary communication value.
- Using a generic "Loading…" label when no specific status is available — say nothing rather than saying something meaningless.
- Providing no cancellation or timeout path for waits that may run indefinitely, leaving users with no recourse.
- Failing to announce the loading state to TalkBack, leaving screen reader users uninformed.
- Using the loading indicator for structured content layouts where a skeleton screen would anchor the user better.
- Applying the loading indicator at the wrong scope — using a full-screen indicator when only a single component is pending, or using an inline indicator when the whole screen is unavailable.

## References

- **Material 3 Guidelines:** [Loading indicator overview](https://m3.material.io/components/loading-indicator/overview)
- **Documentation:** [Jetpack Compose UI components](https://developer.android.com/develop/ui/compose/components)

## See also

The M3 progress indicators design skill covers the determinate linear and circular progress indicators and explains when a known percentage warrants switching away from the loading indicator. The M3 feedback and snackbar design skill covers how to pair a loading state with an error or completion message once the wait resolves. The M3 motion and animation design skill explains how to handle reduce-motion preferences across Expressive animations.

The Compose components code skill for progress and loading implements the `CircularProgressIndicator` composable (both determinate and indeterminate) and the M3 Expressive `LoadingIndicator` composable, including animation customization and accessibility semantics.
