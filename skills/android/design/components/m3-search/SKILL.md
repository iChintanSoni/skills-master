---
name: m3-search
description: "Design guidance for Material 3 search patterns — Use when deciding between search bar and search view, placing search in navigation, handling suggestions and recent queries, supporting voice entry, and determining when search warrants a prominent surface."
tags: [m3, design, search, navigation, android]
x-skills-master:
  domain: android
  class: design
  category: components
  platforms: ["android", "large-screen"]
  pairs_with: []
  sources:
    - https://m3.material.io/components/search/overview
    - https://developer.android.com/develop/ui/compose/components
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Use M3 search guidance when your app's primary mode of navigation or content discovery is query-driven — users arrive knowing roughly what they want rather than browsing a hierarchy. Good candidates include apps with large catalogs (e-commerce, music, maps, messaging), productivity tools with many items, and any surface where filters alone do not cover the discovery space.

Avoid promoting search to a prominent, always-visible surface when most users browse rather than query. In those cases a toolbar overflow menu or a destination-scoped filter is less disruptive.

## Core guidance

### Choosing a search variant

- **Use the Search Bar (docked, persistent) when search is a top-level affordance** that users reach frequently from any screen in the app. The Search Bar lives in the top app bar region and anchors the user's mental model — it signals that search is always available, not hidden.
- **Use the Search View (full-screen or docked expansion) when the query process is immersive** — suggestions, recent queries, and results need the full viewport. The Search View expands from the Search Bar, taking over the screen while the user types, then collapses back on completion or dismissal.
- **Do not invent a third pattern** (e.g. a plain TextField in a toolbar) when M3 search components exist. The Search Bar carries elevation, rounded-pill shape, and avatar/leading-icon affordances that communicate searchability at a glance; a raw TextField does not.

### Placement and prominence

- **Place the Search Bar at the top of the screen**, either replacing or sitting below the top app bar. The pill shape at top-of-screen is now the canonical Android search affordance; burying search in a bottom sheet or side drawer trains users not to look for it.
- **When search is one of several primary actions**, the Search Bar can coexist with a top app bar — place it immediately below the bar, not inside it, to preserve the bar's navigation icons.
- **On a bottom navigation layout**, the Search Bar sits above the bottom nav bar. Do not move search into the bottom nav as a tab unless search produces a distinct destination (e.g. a Explore tab); that is a navigation pattern, not a search pattern.
- **Avoid floating the Search Bar** mid-screen or above a list without clear visual anchoring. The top edge or a card surface are the appropriate hosts.

### Suggestions and recent queries

- **Show recent queries immediately on focus**, before the user has typed anything. Recency is the highest-signal starting point; do not show a blank state on expansion.
- **Limit visible suggestions to five to seven items** without scrolling. More than that creates decision paralysis and forces users to scroll in a transient overlay, which feels unstable.
- **Distinguish suggestion types visually**: recent queries get a history icon (leading), predictive suggestions get a search icon, and entity-type suggestions (a contact, a place) get an avatar or category icon. Do not mix types without visual differentiation.
- **Prioritise relevance over recency** once the user has typed two or more characters. Before that threshold, recency wins.
- **Provide a clear affordance to delete individual recent queries** (trailing X icon). Users who see stale or sensitive suggestions they did not request will lose trust in the surface.
- **Do not auto-submit on suggestion tap unless the suggestion is an exact entity** (a contact name, a specific product). For open-ended text suggestions, populate the query field and let the user confirm — this reduces accidental navigation.

### Voice entry

- **Include a microphone icon in the Search Bar trailing slot** only when your app has integrated speech-to-text and has the RECORD_AUDIO permission justification ready. A decorative microphone that does nothing destroys trust.
- **Voice input is an enhancement, not a replacement**. The keyboard path must remain fully functional. Never hide the keyboard affordance behind a voice-first UX.
- **On activation, show a listening indicator** (animated waveform or M3-styled recording state) inside the Search View, not a modal overlay. Keep the user in context.

### States and empty results

- **Design the empty-query state, the no-results state, and the error state as first-class screens**, not afterthoughts. No-results should offer spelling correction, related queries, or a path to browse — a blank white screen teaches users your search is broken.
- **Show progressive disclosure of results** as the query changes rather than waiting for submit. Users expect live filtering in M3 experiences.
- **Use a loading indicator (LinearProgressIndicator inside the Search View) for latency above ~300 ms**. Silent waiting is mistaken for a broken state.

### Accessibility

- **The Search Bar must have a meaningful contentDescription** on the clickable surface (e.g. "Search music"). The placeholder text is not announced as a label in all accessibility modes.
- **Suggestions must be individually focusable** with descriptive labels that include both the suggestion text and its type (e.g. "Recent search: jazz piano").
- **Ensure minimum touch targets of 48 × 48 dp** on the delete-recent and voice icons, even when they appear inside the compact bar.

## Platform notes

### Compact phones (< 600 dp wide)
The Search Bar occupies the full width with standard 16 dp horizontal padding. The Search View expands to fill the entire screen. Keep suggestion rows to a single line; truncate with ellipsis rather than wrapping.

### Large screens and foldables (≥ 600 dp wide)
On a two-pane layout (list-detail), anchor the Search Bar to the list pane, not the detail pane. The Search View should expand within the list pane or as a centered modal card (max-width ~600 dp) rather than taking over the full tablet viewport. Full-screen search on a 12-inch tablet is spatially wasteful and feels like a phone pattern forced onto a larger canvas.

On foldables in table-top or book mode, the Search Bar should remain in the top half (the active content area) and never be clipped by the hinge.

### Wear OS
Search on Wear is typically voice-first. A persistent Search Bar is not appropriate — use a dedicated search action in the app's menu or a Complications shortcut. Defer entirely to the Wear OS voice-input APIs.

### Android TV
Search on TV uses the system-level voice search leanback pattern. Do not implement a custom Search Bar on TV surfaces.

## Pitfalls

- **Replacing top navigation with search prematurely.** If fewer than 30–40 % of user sessions begin with a query, a prominent persistent Search Bar competes with browsing navigation for no benefit.
- **Opening the Search View without animating from the bar.** A jarring cut-to-fullscreen breaks spatial continuity. M3's SearchBar composable provides the correct expand animation — do not suppress it.
- **Persisting search state across unrelated app sections.** A query entered in one tab should not populate the Search Bar when the user switches to a structurally different tab. Clear or namespace search state per destination.
- **Mixing Search Bar and a separate Filter button as peers.** Filters refine results; they belong inside the Search View or as chips beneath it, not as equal siblings at the top level. Parallel affordances split the user's mental model.
- **Using the Search Bar solely as a decorative top-of-screen element** that navigates to a separate search screen on tap, with no expand animation. This pattern is acceptable only for apps that cannot deliver live suggestions; make the affordance clearly tappable (not keyboard-focused) in that case and document the deliberate decision.
- **Forgetting voice permission rationale in the Play Store listing.** If the microphone icon is visible, the permission must be justified; omitting this causes review delays and user confusion.

## References

- **Material 3 Guidelines:** [Search Overview](https://m3.material.io/components/search/overview)
- **Documentation:** [Compose UI Components](https://developer.android.com/develop/ui/compose/components)
- **Material 3 Guidelines:** [Search — Anatomy](https://m3.material.io/components/search/overview)
- **Material 3 Guidelines:** [Search — Specs](https://m3.material.io/components/search/specs)
- **Material 3 Guidelines:** [Search — Accessibility](https://m3.material.io/components/search/accessibility)

## See also

The **m3-top-app-bar design skill** covers how the Search Bar interacts with and can replace the standard top app bar. The **m3-navigation design skill** addresses when search belongs in bottom navigation versus a persistent top surface. The **m3-chips design skill** is relevant when combining filter chips with a search surface. For implementation, the Compose Material 3 code skill for components covers `SearchBar` and `DockedSearchBar` composables, query state hoisting, and suggestion list integration.
