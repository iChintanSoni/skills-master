---
name: hig-navigation-bars
description: "Design critique and Apple HIG guidance for navigation bars: large vs inline titles, the back affordance, leading and trailing bar buttons, integrating search, keeping the bar uncluttered, and the Liquid Glass bar treatment. Use when reviewing or designing a screen's top navigation bar, deciding between a large or inline title, placing back and bar-button items, adding a search field, or evaluating clutter and translucency on iOS, iPadOS, tvOS, watchOS, or visionOS. Produces design recommendations, not code."
---

# HIG Navigation Bars

Critique and shape the bar at the top of a navigable screen: its title, the back affordance, the items flanking the title, and how search and Liquid Glass fit in.

## When to use

- Reviewing a top navigation bar and deciding between a large and an inline (standard) title.
- Placing the back affordance and the leading/trailing bar-button items, or judging whether the bar is too crowded.
- Integrating a search field into a navigated screen and choosing where it lives.
- Evaluating the Liquid Glass / scroll-edge treatment so the bar reads as a floating layer, not a painted strip.

## Core guidance

- **Use a large title to anchor a top-level destination, then let it collapse to inline on scroll.** Large titles orient people at the root of a section and announce "where am I"; reserve inline titles for pushed detail screens where the back button already supplies context. Don't force a large title onto deep, dense, or modal screens.
- **Keep the title honest and short.** The title should name the current screen, not the app or a marketing phrase. If a good large title would wrap or truncate, that screen probably wants an inline title or no title at all.
- **Trust the system back affordance.** A chevron plus the previous screen's title is a learned, swipe-to-go-back contract. Don't relabel it "Back" generically, replace it with a custom glyph, or move it off the leading edge; doing so breaks muscle memory and the interactive pop gesture.
- **Budget the bar buttons and group by meaning.** Aim for one or two trailing controls; push the rest into an overflow menu. Group related actions in one glass container and keep a single primary action (for example Done) separate and tinted so it reads as the focal point. Don't mix a text label and a symbol in one group, or they read as a single button.
- **Let Liquid Glass and layout create separation, not borders.** Bars are now transparent and float above scrolling content, with a soft scroll-edge effect appearing only when content slides under them. Remove custom bar backgrounds, hairline dividers, and tint hacks; hierarchy should come from grouping and the material, not decoration.
- **Place search where the thumb is, and make it look like search.** Prefer a dedicated search field or search role in the bottom bar for reachability on tall phones; a search field integrated into the navigation bar inherits correct appearance and behavior. Don't disguise an action as search, and don't bury search behind an unlabeled magnifier when discovery matters.
- **Protect the safe areas and the tap targets.** Bar controls stay within the safe area and keep roughly 44pt touch targets; never crowd the title against items so tightly that labels truncate mid-word.

## Platform notes

- **iOS:** Large titles on roots, inline on detail. iOS 26 commonly surfaces search as a bottom field or a dedicated Search tab for one-handed reach; bars are translucent glass with a scroll-edge effect.
- **iPadOS:** Pair the bar with a sidebar or split view; the navigation bar belongs to the detail/content column. Avoid duplicating sidebar navigation as bar buttons.
- **tvOS:** No persistent back button (the Menu/Back remote button handles return). Keep titles minimal, focusable items large, and rely on the focus engine rather than crowded bar controls.
- **watchOS:** Space is tiny; show a short inline title, lean on the system back chevron, and move actions into the screen or a menu rather than the bar.
- **visionOS:** The bar (often an ornament near the window) uses glass and depth; keep controls sparse and let the window chrome carry navigation so content stays the focus.

## Pitfalls

- Forcing large titles everywhere, so deep screens feel heavy and titles truncate.
- Customizing the back button text or icon, breaking the swipe-back affordance and orientation.
- Cramming three-plus controls into the trailing area instead of using an overflow menu.
- Re-adding opaque bar backgrounds or dividers that fight the Liquid Glass scroll-edge effect.
- Styling a search field so it looks like an action button, or hiding search behind an unlabeled icon.
- Putting screen-specific actions in a persistent bottom bar where they read as global navigation.

## References

- **Human Interface Guidelines:** [Navigation bars](https://developer.apple.com/design/human-interface-guidelines/navigation-bars)
- **Human Interface Guidelines:** [Searching](https://developer.apple.com/design/human-interface-guidelines/searching)
- **Human Interface Guidelines:** [Search fields](https://developer.apple.com/design/human-interface-guidelines/search-fields)
- **Human Interface Guidelines:** [Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars)
- **WWDC:** [Get to know the new design system (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/356/)
- **WWDC:** [Build a SwiftUI app with the new design (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/323/)

## See also

- The SwiftUI/UIKit implementation skill for this component (navigation stacks, toolbar items, and `searchable`) translates these title, back-button, bar-item, and search decisions into code.
- The HIG tab bars design skill, for choosing between bottom-bar search and a navigation-bar search field and for the floating Liquid Glass tab bar.
- The HIG toolbars and HIG materials design skills, for grouping bar items in glass containers and for the scroll-edge and translucency treatment shared with the navigation bar.
