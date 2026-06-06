---
name: m3-progress-indicators
description: Material 3 design guidance for progress indicators — choosing between linear and circular, determinate and indeterminate, the M3 Expressive loading indicator, and when to show no indicator at all. Use when designing or reviewing any loading state, background operation, or in-progress feedback in an Android app, or when deciding whether a LinearProgressIndicator, CircularProgressIndicator, or LoadingIndicator is the right choice for a given context.
---

## When to use

Use this skill when designing or reviewing any moment in an Android app where work is happening and the user might be waiting — a file download, a network fetch, a long computation, a form submission, or an initial data load. It applies equally to full-screen blocking waits, inline item-level progress, and background operations that run while the user continues interacting. This skill produces design judgment and critique, not Compose code; for the `LinearProgressIndicator`, `CircularProgressIndicator`, and `LoadingIndicator` composables, hand off to the compose-ui code skill.

## Core guidance

- **Choose linear when progress is spatial or sequential.** A `LinearProgressIndicator` running the width of a container maps naturally to tasks that proceed along a timeline or pipeline: file uploads, multi-step form submissions, page or media loads that fill a well-defined space. Its horizontal extent makes the proportion of remaining work immediately legible without requiring the user to decode a curved arc.

- **Choose circular when space is constrained or the indicator is embedded in content.** A `CircularProgressIndicator` occupies a square bounding box and reads well at small sizes, making it the right choice for inline-icon replacement (a refresh icon that turns into a spinner while reloading), card thumbnails, floating action button overlays, and any context where a full-width bar would look out of place.

- **Use determinate variants whenever completion is measurable.** If the work has a quantifiable percentage — bytes received, steps completed, items processed — show a determinate bar or circle so the user can gauge remaining time and decide whether to wait or come back later. Indeterminate progress is not a safe default; it forces the user to stare at motion with no signal of when it ends.

- **Reserve indeterminate variants for genuinely unknown duration.** Background syncs, search queries, server round-trips, and operations that cannot be reasonably estimated warrant indeterminate indicators. Even then, consider whether a skeleton layout or placeholder content is less disruptive than a spinner that occupies centerstage.

- **Distinguish the M3 Expressive `LoadingIndicator` from progress indicators.** The `LoadingIndicator` introduced in Material 3 Expressive is a standalone animated element intended for prominent, full-attention loading moments — an app launch screen, a first-load state, or a pull-to-refresh gesture that has a dedicated visual beat. It is not a drop-in replacement for a `CircularProgressIndicator`. Use `LoadingIndicator` when the loading state is the entire experience for a moment; use `CircularProgressIndicator` (indeterminate) for ambient or inline waits. Never use both side-by-side; the visual weight would compete.

- **Never block interaction unnecessarily.** Overlaying a spinner on top of an entire screen while background work completes is one of the most common M3 violations. If the user can still read, scroll, or interact with other parts of the UI, keep those affordances alive. Reserve full-screen blocking for operations where partial interaction would cause data corruption or a confusing state — such as finalizing a payment or committing a destructive action.

- **Place indicators close to what they represent.** A network refresh for a single list section should show an indicator within or above that section, not at the top of the unrelated navigation bar. An image that is loading should show a placeholder shimmer or spinner in the image's own bounds. Proximity reduces cognitive load and tells the user exactly what system the delay belongs to.

- **Communicate estimated completion honestly.** A determinate indicator that leaps to 90% and stalls there erodes trust faster than an indeterminate one. If the final stage is unpredictable (server-side processing after a large upload), switch back to indeterminate or show a clear transitional label. Do not fake progress.

- **Add a label or supporting text for waits longer than a few seconds.** A brief, specific description ("Uploading 3 of 7 photos") gives the user confidence that the system is working and tells them what to expect. Generic copy like "Loading…" is marginally better than nothing but adds almost no value. Avoid instructions ("Please wait") — state the operation, not a command.

- **Always provide a way to cancel long, blocking operations.** Any wait that lasts more than a few seconds and blocks the user's primary task should include a visible Cancel action. Warn before discarding irreversible progress.

- **Meet touch-target and accessibility minimums.** Progress indicators are presentational and do not receive focus, but they must be properly described to TalkBack. Set a meaningful `contentDescription` on the container or the triggering action so screen-reader users understand the current state. When progress completes, announce the change with a live region or a semantic update — do not rely on visual-only feedback.

- **Do not flash an indicator for sub-200ms operations.** Showing and immediately hiding a spinner adds visual noise and makes the app feel slow. Introduce a short threshold delay so the indicator only appears if the operation actually exceeds a perceptible pause. This is especially important for cached responses, optimistic UI updates, and operations that sometimes complete instantly.

- **Respect the M3 color system for track and active indicator colors.** By default, a `LinearProgressIndicator` uses the `primary` color for the active track and `surfaceVariant` for the background track. Only override these when there is a genuine semantic reason — such as an error state turning the active track to `error` — and verify that the contrast between active and background tracks is sufficient at both light and dark system themes.

## Platform notes

On compact phones (the default Android form factor), linear progress indicators typically span the full width of the screen or their parent container, appearing beneath navigation bars or app bars. Avoid placing them inside dense list items where there is insufficient vertical breathing room; prefer a circular indicator in that context.

On large screens and foldables, a full-width `LinearProgressIndicator` can span an uncomfortably wide distance and look visually thin relative to the canvas. Constrain it to a maximum width (typically the width of the content column, not the entire window) or switch to a circular indicator anchored near the relevant content. On two-pane layouts, each pane may carry its own independent indicator — do not use a single top-level indicator for a load that only affects one panel.

Wear OS has its own circular progress pattern designed for the round watch face; M3 phone indicators do not translate directly. TV (Android TV / Google TV) users interact from a distance and cannot perceive thin progress bars — use sufficiently thick or large indicators, or rely on loading skeleton states that fill visible cards rather than a thin line.

## Pitfalls

- Using an indeterminate indicator for a download or conversion that has a real, known percentage — a missed opportunity to give users actionable information.
- Faking determinate progress for an unknown-duration task, letting the bar stall near 100% and destroying trust.
- Overlaying a full-screen spinner on content the user could still interact with, unnecessarily blocking the UI.
- Using `LoadingIndicator` (M3 Expressive) as a generic replacement for `CircularProgressIndicator`, making low-stakes ambient loads feel overly dramatic.
- Using both `LoadingIndicator` and `CircularProgressIndicator` in the same view, creating competing visual weight.
- Flashing a spinner for sub-200ms operations that frequently complete instantly, making the app feel jittery.
- Placing a top-level progress indicator for work that only affects a subsection of the screen, misleading users about what is loading.
- Relying solely on the indicator's animation to communicate state — no label, no accessible live region, no announcement when complete.
- Leaving no Cancel affordance on a blocking multi-second wait.
- Using progress indicators as decorative loading chrome that is always visible, rather than tied to actual asynchronous work.

## References

- **Material 3 Guidelines:** [Progress indicators overview](https://m3.material.io/components/progress-indicators/overview)
- **Documentation:** [Progress indicators in Jetpack Compose](https://developer.android.com/develop/ui/compose/components/progress)
- **Material 3 Guidelines:** [Progress indicators specs](https://m3.material.io/components/progress-indicators/specs)
- **Material 3 Guidelines:** [Progress indicators accessibility](https://m3.material.io/components/progress-indicators/accessibility)

## See also

The `LinearProgressIndicator`, `CircularProgressIndicator`, and `LoadingIndicator` composables in Jetpack Compose implement this guidance — see the compose-ui code skill for parameter details, track/color overrides, and state hoisting patterns. For skeleton and shimmer loading states that replace progress indicators in content-rich UIs, see the m3-loading-states design skill. For motion and animation principles that inform how indicators should feel, see the m3-motion design skill. For color system rules that govern track and indicator tint choices, see the m3-color-system design skill.
