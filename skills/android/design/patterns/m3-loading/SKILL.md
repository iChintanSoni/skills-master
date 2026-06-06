---
name: m3-loading
description: "Material 3 design guidance for loading patterns in Android apps: choosing between skeletons, spinners, and determinate progress; managing perceived performance; avoiding layout shift; and deciding when to block versus load incrementally. Use when designing or reviewing any loading, wait, or in-progress state in a Material You app, or when auditing how asynchronous work is communicated to users across first-load, refresh, and partial-update scenarios."
tags: [m3, design, loading, patterns, perceived-performance, ux]
x-skills-master:
  domain: android
  class: design
  category: patterns
  platforms: ["android", "large-screen"]
  pairs_with: []
  sources:
    - https://m3.material.io/components/progress-indicators/overview
    - https://m3.material.io/components/loading-indicator/overview
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Use this skill when making strategic decisions about how a screen or flow communicates asynchronous work — from the very first data load, through pull-to-refresh interactions, to partial content updates that arrive while the user is already active on screen. It applies equally to whole-screen blocking loads, pane-level refreshes in adaptive layouts, and per-item async states in lists or grids.

This is a design-judgment skill. It determines which loading pattern to use and why, not how to implement it. For the `LinearProgressIndicator`, `CircularProgressIndicator`, and `LoadingIndicator` composables, defer to the m3-progress-indicators or m3-loading-indicator component design skills and their corresponding code skills.

## Core guidance

### Pattern selection

- **Prefer skeletons when content structure is predictable.** If you know the shape of incoming content — a list of cards, a settings screen, a profile layout — replace those regions with shimmering placeholder shapes before data arrives. Skeletons anchor the user's mental model to the final layout, reducing disorientation and perceived wait time compared to a centered spinner over an empty canvas. Use skeletons for content-heavy surfaces where the structure is stable across loads.

- **Use indeterminate spinners for genuinely unstructured or unpredictable content.** When you cannot know the shape, count, or arrangement of what is loading — a first-time search result, a dynamically composed recommendation feed, an AI-generated layout — a skeleton would be misleading. An indeterminate `CircularProgressIndicator` or the M3 Expressive `LoadingIndicator` is honest about uncertainty. Match the component's scale to the scope of the wait.

- **Use determinate progress whenever you can measure completion.** Any operation with a knowable percentage — a file download, a batch export, a multi-photo upload — must show a determinate `LinearProgressIndicator` or `CircularProgressIndicator` with a real value. Indeterminate indicators for known-percentage work withhold actionable information from the user and erode trust. If the final stage becomes unpredictable, switch the indicator back to indeterminate at that point rather than stalling the bar near 100%.

- **Choose circular or the M3 Expressive loading indicator for ambient or prominent indefinite waits.** A `CircularProgressIndicator` (indeterminate) suits inline, icon-scale, or embedded contexts — a row refresh, an avatar upload, a button mid-action. Reserve the M3 Expressive `LoadingIndicator` for high-attention moments where loading is the entire screen experience for a beat: an app launch placeholder, a pull-to-refresh animation with visual personality, or a first-load pane that has no skeleton to show.

- **Never present both a skeleton and a spinner simultaneously for the same region.** Choose one strategy per content zone and stay consistent. Mixing patterns in the same view implies conflicting levels of knowledge about the incoming content and creates visual inconsistency.

### Perceived performance

- **Optimistic UI is nearly always preferred over showing a loading state.** When the outcome of a user action is highly likely to succeed — a like, a toggle, a message send — update the UI immediately and reconcile quietly on confirmation. Reserve visible loading indicators for operations with meaningful failure rates or irreversible consequences (payments, destructive actions, file conversions) where premature optimism would create a worse error recovery.

- **Delay indicator appearance for sub-threshold waits.** Showing a spinner that disappears within 200–300 ms adds visual noise without informational value and makes the app feel slower than it is. Introduce a threshold delay so indicators only appear if the operation actually exceeds a perceptible pause. Cached or instant responses should never flash a loading state.

- **Layer content progressively when any part of the data arrives early.** A screen that loads in two stages — metadata first, then media — should render the text content and skeleton image slots immediately rather than holding the entire render until all data is ready. Incremental rendering reduces blank-canvas time and signals that the app is working. The key discipline is ensuring the first-render layout matches the final layout closely enough that content flowing in does not cause jarring shifts.

- **Avoid spinners that compete with interactable content.** If a section of the screen is loading while other sections are already rendered and interactive, a prominently placed full-screen spinner prevents the user from doing anything at all with what is already available. Scope the indicator tightly to the pending region and leave the rest of the screen fully interactive.

### Avoiding layout shift

- **Reserve final layout space before content arrives.** Skeleton placeholders should match the height, width, and arrangement of the real content they represent as closely as possible. When content loads in, it should occupy exactly the space the skeleton held — no reflow, no push, no pop-in. If the exact size cannot be predicted (variable text lengths, dynamic image aspect ratios), clamp to a safe minimum that the real content will always meet or exceed.

- **Do not allow newly loaded content to shift existing content.** Loading additional items above the current scroll position (pagination prepend) is one of the most jarring layout-shift patterns in mobile apps. Anchor the visible content to the user's current position and render new content outside the viewport, scrolling into view only on explicit user action.

- **Use placeholder aspect ratios for media.** Images and video thumbnails are the primary source of layout reflow in content feeds. Establish a fixed or minimum aspect ratio for image containers — even when the actual dimensions are unknown — so the container holds space and the image fills it on arrival without displacing surrounding text or actions.

- **Stabilize list item heights before the list renders.** A list that jumps from short skeleton rows to taller real rows after load is visually disruptive. If skeleton rows cannot match real row height exactly, err on the side of being slightly taller rather than shorter, so content arrival compresses rather than expands the item.

### Blocking versus incremental loading

- **Block the entire screen only when nothing useful can be shown and partial interaction would create a corrupted or confusing state.** Genuine full-screen block situations are rare: the very first render of a screen with zero locally cached data, a payment confirmation flow where premature interaction risks double submission, or a destructive operation where interruption could corrupt data. Everything else should attempt incremental or partial rendering.

- **Prefer cached or stale data over a blank screen.** Showing last-known data with a subtle refresh indicator — a slim `LinearProgressIndicator` beneath the app bar, a pull-to-refresh affordance — is nearly always better than erasing the screen to show a spinner while fresh data loads. Stale data gives the user something to act on while the system updates in the background.

- **Use pull-to-refresh for explicit user-initiated refreshes, not as the primary loading pattern.** `PullRefreshIndicator` (or the `SwipeRefresh`-equivalent in Compose Material) is an opt-in mechanism for users who want to force a sync. It is not a substitute for initial load states, and it should not be the only way to refresh content — background polling or push updates should keep data fresh without requiring user effort.

- **Design the empty state, the error state, and the loading state as a family.** A screen that can load should always have a defined appearance for all three conditions. The loading state, the error state, and the empty-success state share visual space and should use consistent placement, illustration style, and action affordances so they feel like a coherent system rather than three independently designed fallbacks.

- **Time-box long operations and offer escape paths.** Any operation that takes more than a few seconds and holds a loading state should include a visible cancel action and a defined timeout behavior (an error state with a retry action). A loading indicator with no escape is a trap that destroys user trust regardless of how well-designed the spinner is.

## Platform notes

On compact phones, a full-width `LinearProgressIndicator` beneath the app bar is the standard pattern for background refreshes that span the whole screen. Skeleton rows in lists should occupy the full column width with breathing room that matches the real list item density.

On large screens and foldables, two-pane layouts introduce a critical scoping discipline: each pane carries its own independent loading state. A loading indicator in the detail pane must never obscure or affect the list pane. Full-window overlays are almost never appropriate on large screens because at least one pane is typically already populated. Skeleton placeholders benefit especially from adaptive sizing — skeleton card dimensions should respond to the available column width using the same grid system as real cards.

On large screens, progressive disclosure patterns become more viable: a list pane can render immediately from a fast first-fetch while the detail pane loads a heavier content type in parallel, giving the user something actionable within milliseconds of screen entry.

## Pitfalls

- Showing a full-screen spinner when most of the screen content is already renderable from local cache or an earlier fetch.
- Using a skeleton layout whose row heights, column counts, or card shapes do not match the real content, causing a jarring swap on load.
- Applying an indeterminate spinner to a download or export operation that has a real, measurable percentage.
- Faking determinate progress for an unknown-duration task, then stalling the indicator near 100% while the server-side work continues.
- Flashing a loading indicator for operations that frequently complete in under 200–300 ms, making the app appear slower than it is.
- Allowing new content to load above the current scroll position and push the visible content downward without warning.
- Treating the loading state as a happy-path concern and leaving the error and empty states underdesigned or inconsistent with the loading treatment.
- Using a `LoadingIndicator` (M3 Expressive) in an inline or ambient context where its visual weight overpowers surrounding content.
- Providing no cancellation or timeout path for multi-second blocking operations, trapping the user without recourse.
- Failing to announce loading and completion state changes to TalkBack, leaving screen-reader users without feedback about system activity.
- Using optimistic UI for high-consequence or high-failure-rate operations where silent failure would create a worse recovery experience.
- Neglecting reduce-motion preferences: skeleton shimmer and spinner animations should either pause or simplify for users who have enabled the system reduce-motion setting.

## References

- **Material 3 Guidelines:** [Progress indicators overview](https://m3.material.io/components/progress-indicators/overview)
- **Material 3 Guidelines:** [Loading indicator overview](https://m3.material.io/components/loading-indicator/overview)
- **Material 3 Guidelines:** [Progress indicators specs](https://m3.material.io/components/progress-indicators/specs)
- **Material 3 Guidelines:** [Progress indicators accessibility](https://m3.material.io/components/progress-indicators/accessibility)
- **Material 3 Guidelines:** [Motion overview](https://m3.material.io/styles/motion/overview)

## See also

The m3-progress-indicators design skill covers component-level choices between `LinearProgressIndicator`, `CircularProgressIndicator`, and the M3 Expressive `LoadingIndicator`, including determinate versus indeterminate selection and color system rules for track and active indicator tints. The m3-loading-indicator design skill focuses specifically on the M3 Expressive `LoadingIndicator` component's animated personality, sizing, and placement rules.

The m3-motion design skill explains the easing and duration tokens that inform how skeletons shimmer, how indicators appear and disappear, and how reduce-motion preferences should affect all animated loading states.

The m3-interaction-states design skill covers how enabled, disabled, and loading states relate within a single interactive element — useful when designing a button or input that enters a loading state mid-interaction.

For implementation, the compose-ui code skills for progress indicators and loading cover the `LinearProgressIndicator`, `CircularProgressIndicator`, and `LoadingIndicator` composables including threshold delay logic, animated visibility, and accessibility semantics via content descriptions and semantic live regions.
