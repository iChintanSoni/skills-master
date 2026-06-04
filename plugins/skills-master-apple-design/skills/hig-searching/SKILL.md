---
name: hig-searching
description: "Design critique and recommendations for search experiences on Apple platforms, grounded in the Human Interface Guidelines. Use when reviewing or designing where and how to offer search: search field placement and prominence, scope bars, search suggestions and recent searches, search tokens, clear and empty states, and how results are presented. Triggers include search bars, scope controls, filter chips, tab-bar or toolbar search, and Spotlight indexing. Produces UX guidance, not code."
---

# HIG Searching

## When to use

Use this skill to critique or design any search experience: deciding whether search is worth surfacing at all, where the field lives, how scopes and tokens narrow results, what suggestions and recent searches appear, and how results and empty states read. Reach for it during design review of a search bar, a scope/filter control, a tab-bar or toolbar search entry point, or a "no results" screen. It guides judgment about discoverability, prominence, and clarity — not the implementing code.

## Core guidance

- **Offer search when content is large or hard to scan, and give it one obvious home.** People expect a single, clearly identified place to find an app's content. If search is central to the experience (media, photos, contacts), promote it to a primary destination such as a separate, visually distinct trailing tab; if it is a refinement, keep it local as a filter over the current list.

- **Place the field where reach and context favor it, not just the top.** On iOS the bottom toolbar or a separated search tab is now the preferred, thumb-reachable placement; a top navigation-bar entry is fine when deferring to content matters. On iPadOS and macOS, put global search at the trailing side of the toolbar, or at the top of a sidebar when filtering the sidebar itself. Pick one model and stay consistent.

- **Write placeholder text that says what is searchable, never just "Search."** Name the content — "Shows, Movies, and More" — so the scope is obvious before anyone types. Reinforce scope with a title or scope control when the field alone is ambiguous (e.g. which mailbox is being searched).

- **Default to the broadest useful scope, then let people narrow.** Use a scope bar (segmented-style) only for a few clearly distinct categories, and start global so results feel complete. Use tokens to filter by specific entities (a person, a tag, a file type) — encapsulate each as a selectable, editable chip, and pair tokens with suggestions so people learn the pattern.

- **Reduce typing with suggestions and recent searches — but respect privacy.** Show suggested terms and recents before and during typing, especially on tvOS and watchOS where text entry is costly. Don't expose search history where others can see it; let people clear it, and offer non-history ways to narrow.

- **Search as people type when results can update cheaply.** Continuous refinement feels responsive; surface the most relevant results first and group them into clear categories so people scroll less. Provide an always-available clear control that empties the field and exits search.

- **Design the empty and no-results states deliberately.** Before a query, the empty state is prime real estate for suggestions, recents, or browsable categories. For zero results, say so plainly, suggest fixes (broaden scope, check spelling), and avoid a blank screen that reads as an error.

## Platform notes

- **iOS / iPadOS:** Prefer the bottom toolbar or a separated, morphing search tab for reach; on iPad, toolbar-trailing global search suits split views. Account for fluid window resizing — relocate the field above the content column in compact widths.
- **macOS:** Toolbar-trailing search is the convention for multi-source apps; sidebar search filters navigation. Tokens and scope controls carry more weight given richer result sets.
- **tvOS:** Search lives on a dedicated keyboard screen with results below; lean hard on popular, contextual, and recent suggestions to minimize remote typing.
- **watchOS:** Tapping the field opens a full-screen text-input control; keep scopes minimal and prioritize suggestions and dictation.
- **visionOS:** Follow the standard pattern; ensure the field and results sit at a comfortable, legible depth and are reachable without strain.

## Pitfalls

- Generic "Search" placeholder that hides what can actually be found.
- Burying primary search behind a top-bar tap when it is the app's core task.
- Scope bars with too many or overlapping categories, or defaulting to a narrow scope so results look incomplete.
- Tokens introduced with no suggestions, so people never discover they exist.
- Exposing search history publicly, or offering no way to clear it.
- A blank no-results screen with no recovery path, read by users as a bug.

## References

- **Human Interface Guidelines:** [Searching](https://developer.apple.com/design/human-interface-guidelines/searching)
- **Human Interface Guidelines:** [Search fields](https://developer.apple.com/design/human-interface-guidelines/search-fields)
- **Human Interface Guidelines:** [Token fields](https://developer.apple.com/design/human-interface-guidelines/token-fields)
- **WWDC:** [Build a SwiftUI app with the new design (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/323/)
- **WWDC:** [Get to know the new design system (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/356/)
- **Documentation:** [Adding a search interface to your app](https://developer.apple.com/documentation/swiftui/adding-a-search-interface-to-your-app)

## See also

Pair this critique with the SwiftUI code skill that implements search via the `searchable` modifier, scopes, tokens, and suggestions (and the UIKit/AppKit equivalent using search controllers and search fields) to turn these recommendations into working UI. For broader structure decisions about where search sits among destinations, see the navigation and tab-bar design skills; for the results list itself, see the lists-and-tables and empty-state design skills. For systemwide discoverability, see a Spotlight indexing skill.
