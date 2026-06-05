---
name: hig-search-fields
description: "Design critique and recommendations for the search field component on Apple platforms, grounded in the Human Interface Guidelines. Use when reviewing or designing a search field itself: its placement and prominence (toolbar, navigation bar, or search tab), scope bars, search tokens, suggestions and recent searches, the clear affordance, and how the field sits inside Liquid Glass toolbar and tab patterns. Triggers include search bar, scope control, filter chips, search tokens, search-role tab, and the iOS 26 bottom-toolbar search field. Produces UX guidance, not code."
---

## When to use

Use this skill to critique or design the search field component specifically: where it sits and how prominent it is, whether to attach a scope bar, how tokens behave, what suggestions and recents fill it, and how the clear control reads. Reach for it when reviewing a search bar in a toolbar, navigation bar, or dedicated search tab; a scope/filter control; a token chip; or how the field collapses and expands inside a Liquid Glass bar. For the broader question of *whether* and *how* to surface search across the app (entry points, result presentation, empty/no-results states), defer to the searching experience skill.

## Core guidance

- **Give the field one home and match its prominence to how central search is.** Promote it to a dedicated, trailing search-role tab (which morphs from icon to field) when search is a core task; keep it as a local filter over the current list when it merely refines content. Don't scatter multiple search affordances across one screen.
- **Place the field for reach, not reflex.** On iPhone in iOS 26 the field belongs in the bottom toolbar or a separated search tab so it is thumb-reachable; let it minimize to a button when other toolbar items compete. On iPad/Mac put global search at the trailing edge of the toolbar, or at the top of a sidebar when it filters the sidebar itself. Pick one model and hold it.
- **Write placeholder text that names what is searchable.** Use "Shows, Movies, and More" rather than a bare "Search" so scope is clear before anyone types. Reinforce scope with a title or scope control when the field alone is ambiguous (which mailbox, which library).
- **Add a scope bar only for a few clearly distinct categories, and default to the broadest useful scope.** A segmented scope control under the field suits two-to-four non-overlapping buckets; more than that belongs in a filter UI. Starting global keeps results feeling complete; let people narrow deliberately.
- **Use tokens for entity filters, and always pair them with suggestions.** Encapsulate a person, tag, date, or file type as a selectable, editable chip inside the field, deletable with one action. Tokens are invisible unless suggestions teach them — surface suggested tokens as people type so the pattern is discoverable.
- **Reduce typing with suggestions and recents, and respect privacy.** Fill the field's empty state with recents and suggested terms, especially on tvOS and watchOS where input is costly. Don't expose search history where others can see it, let people clear it, and offer non-history ways to narrow.
- **Keep the clear affordance always available and unambiguous.** The clear control empties the field; a separate cancel exits search and restores prior context. Don't conflate the two, and don't hide clear once text exists.
- **Let the field breathe inside Liquid Glass.** The search bar rides a glass container that floats over scrolling content and minimizes on scroll; don't fight that by pinning a heavy opaque bar or stacking custom chrome that defeats the glass material's legibility.

## Platform notes

- **iOS / iPadOS:** Prefer the bottom toolbar or a separated, morphing search tab on iPhone for reach; on iPad use toolbar-trailing global search for split views, and relocate the field above the content column in compact widths as windows resize fluidly.
- **macOS:** Toolbar-trailing search is the convention for multi-source apps; sidebar search filters navigation. Tokens and scope controls carry more weight given richer result sets and a pointer.
- **tvOS:** The field opens a dedicated keyboard screen with results below; lean hard on popular, contextual, and recent suggestions to minimize remote typing.
- **watchOS:** Tapping the field opens a full-screen text-input control; keep scopes minimal and prioritize suggestions and dictation.
- **visionOS:** Follow the standard pattern; place the field and its suggestions at a comfortable, legible depth and within easy reach.

## Pitfalls

- A bare "Search" placeholder that hides what can actually be found.
- A top navigation-bar search that should be a bottom-toolbar or search-tab field given how central the task is.
- Scope bars with too many or overlapping categories, or defaulting to a narrow scope so results read as incomplete.
- Tokens with no suggestions, so people never discover they can filter by entity.
- Merging clear and cancel into one control, or hiding clear while text remains.
- A heavy opaque custom search bar that fights the Liquid Glass material and floating-toolbar behavior.

## References

- **Human Interface Guidelines:** [Search fields](https://developer.apple.com/design/human-interface-guidelines/search-fields)
- **Human Interface Guidelines:** [Searching](https://developer.apple.com/design/human-interface-guidelines/searching)
- **Human Interface Guidelines:** [Token fields](https://developer.apple.com/design/human-interface-guidelines/token-fields)
- **Human Interface Guidelines:** [Navigation and search](https://developer.apple.com/design/human-interface-guidelines/navigation-and-search)
- **WWDC:** [Get to know the new design system (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/356/)
- **WWDC:** [Build a SwiftUI app with the new design (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/323/)
- **Documentation:** [Adding a search interface to your app](https://developer.apple.com/documentation/swiftui/adding-a-search-interface-to-your-app)

## See also

For the broader search *experience* — entry points, result presentation, and empty/no-results states — see the searching design skill; this skill stays on the field component itself. Hand the recommendations to the SwiftUI code skill that implements the field via the `searchable` modifier (with scopes, tokens, and suggestions) or the UIKit/AppKit search-controller and search-field skill. For where the field lives among destinations, see the tab-bar and navigation design skills; for the chips inside it, see the token-fields design skill; and for the toolbar material it rides on, see the Liquid Glass toolbars design skill.
