---
name: m3-carousel
description: "Design judgment and critique for Material 3 carousels on Android: choosing among multi-browse, uncontained, hero, and full-screen layouts, sizing items for clarity and touch, using parallax and peek to signal scrollability, and ensuring accessible scroll experiences. Use when deciding whether a carousel is the right pattern for a content row, when selecting a carousel variant, or when reviewing an existing carousel design for visual hierarchy, item density, and scroll accessibility."
---

## When to use

Reach for a carousel when:

- A content row holds peer items — media, products, articles — that benefit from progressive disclosure rather than a flat grid or list.
- The surface area per item warrants a large touch target and rich visual preview, more than a chip row or compact list can offer.
- The number of items is open-ended or large enough that a fully expanded grid would overwhelm the screen.
- Scroll motion itself communicates there is more content just off-screen (browsability is a first-class intent).

Do not use a carousel when items have strict comparison requirements (a table or grid with labeled columns is better), when there are fewer than three items (display them inline), or when every item must be equally visible without horizontal scroll (use a grid or vertical list).

The Material 3 `HorizontalMultiBrowseCarousel`, `HorizontalUncontainedCarousel`, `HorizontalHeroCarousel`, and their vertical counterparts, paired with `CarouselItemScope` composables, are the Compose implementations of these layouts. Implementation detail is left to the companion code skill.

## Core guidance

### Choose the right variant

- **Multi-browse carousel:** Show several partially visible items at once. Use this for browsing a moderate-to-large collection (music albums, app grid, product tiles) where each item is roughly equal in importance. The leftmost item is fully visible; trailing items are progressively clipped to signal scrollability.
- **Uncontained carousel:** Items have consistent full widths but do not snap or resize. Use when items should feel like a natural, flowing content band — news stories, photos in a reel — rather than a curated selection. Avoid using this for short lists where the open-ended feel misleads users about collection depth.
- **Hero carousel:** One large focal item occupies most of the viewport, flanked by smaller peek items. Use this when a single piece of content deserves dominant attention — a featured article, a highlighted product, a daily challenge. The asymmetry communicates "this item is selected/primary."
- **Full-screen carousel:** Each item fills the entire viewport and the user pages between them. Reserve this for immersive, self-contained content: onboarding steps, photo viewers, story cards. Because navigation context disappears, always pair with explicit page indicators and a visible exit path.

### Item sizing and visual hierarchy

- **Target touch area:** Every tappable item must be at least 48×48 dp. For hero items aim for a minimum height of 160 dp; for multi-browse items a minimum of 80 dp preserves readability. Smaller items make tap accuracy poor and text illegible.
- **Clip to signal more:** In multi-browse and hero variants, allow the last visible item to clip at the edge. A clear clip — 40–60 dp of the next item visible — signals horizontal scroll far more reliably than a scroll indicator alone. Do not fully clip items to zero; a sliver is a cue, not a surprise.
- **Text on images:** When item cards overlay a title or label on a photograph, use a scrim or frosted surface beneath the text rather than relying on image contrast alone. Dynamic content will defeat fixed-color overlays.
- **Consistent item aspect ratio:** Within a single carousel, keep all items the same aspect ratio. Mixing portrait and landscape cards in the same row breaks visual rhythm and makes the scroll feel unstable.
- **Limit information density per card:** A carousel card should carry one primary piece of information (image + title, or image + price). Move secondary metadata to a detail screen, not the card itself. Overcrowded cards degrade as items scale down on smaller screens.

### Parallax

- Parallax — shifting the card's background image at a slower rate than the card itself scrolls — adds depth and signals scrollability. Use it on media-rich carousels (hero, full-screen) where visual richness is a goal.
- Keep parallax subtle: an offset ratio of 20–30 % of the card width is effective. Larger ratios can cause motion sickness on vestibular-sensitive users or look broken.
- Do not apply parallax to text-heavy or data-heavy cards. The motion distracts from legibility and adds complexity without payoff.
- Always respect the system's "Reduce Motion" accessibility preference: when it is on, fall back to a static card with no parallax transform.

### Scroll accessibility

- **Provide a content description on each item.** A visually rich card with no semantic label is opaque to TalkBack users. Every item composable must expose a meaningful `contentDescription` that identifies the item by its content (title, artist, or equivalent) — not just "Image" or "Card."
- **Do not rely on swipe-to-scroll alone.** Screen reader users navigate carousels with linear focus traversal. Each item must be individually focusable and activatable; the carousel must not trap focus.
- **Scroll indicators are optional but helpful.** Dot indicators or a page count label ("3 of 12") reduce uncertainty about collection size. For very long collections a dot row becomes unwieldy — use a counter label instead.
- **Keyboard and D-pad navigation (large screen, TV):** Carousel items must be reachable via arrow keys or D-pad. Verify that focus visibly highlights the active item and that pressing Enter/Select triggers the expected action.
- **Announce state changes.** When the hero or full-screen carousel auto-advances, announce the new item to accessibility services so screen reader users are not surprised by a content change they did not initiate.

### Motion and snap behavior

- **Snap to item boundaries** in hero and full-screen variants to prevent cards from resting mid-swipe. A card half-revealed at the edge is disorienting and implies broken layout.
- Multi-browse carousels can use fling without mandatory snap; the open browsing metaphor accommodates mid-item stopping.
- Fling velocity should feel proportional — fast flings scroll further. Artificially slowing flings frustrates power users skimming large collections.

## Platform notes

**Compact phones:** Carousels are designed primarily for compact horizontal layouts. On a phone in portrait orientation, a multi-browse carousel with three partial items at ~140 dp each typically works well. Hero carousels should occupy 60–80 % of the screen height for impact without crowding other content.

**Large screens and foldables:** On tablets and unfolded foldables, a single-column carousel can appear underutilized when viewport width exceeds ~840 dp. Consider switching to a grid at that breakpoint rather than stretching cards to unreasonably wide proportions. If you keep the carousel, increase item peek so more items are visible, reinforcing the browsing metaphor. Verify that D-pad and pointer (mouse/trackpad) navigation works correctly — pointer devices generate hover states that carousels should reflect.

**Landscape orientation:** Carousels shrink in available height. Test hero and full-screen variants in landscape to ensure the focal item retains sufficient height for readability and that the page indicator does not obscure content.

**Wear OS and TV:** Standard Material 3 carousels are not defined for Wear OS — use WearCompose patterns instead. On TV, full-screen and hero variants are natural fits for a 10-foot UI; ensure focus ring visibility and D-pad fling behavior are tested with a real remote.

## Pitfalls

- **Carousel inside a scroll container:** Nesting a horizontal carousel inside a vertically scrolling screen is fine. Nesting it inside another horizontal scroll container, or stacking two carousels with the same scroll axis, creates conflicting gesture recognition and confuses users.
- **Too many carousels on one screen:** More than two or three carousels on a single screen (as in some media home screens) risks a wall of undifferentiated horizontal scroll rows. Differentiate them clearly with section headers and alternate at least one row with a different layout type.
- **Auto-advance without control:** Automatically advancing carousel items without user input is an accessibility violation and an annoyance. If auto-advance is required (e.g., a promotional banner), provide a visible pause control and respect "Reduce Motion."
- **Relying on edge fade alone:** A subtle gradient fade at the edge is not a reliable scroll affordance for all users. Pair it with a visible clip of the next item.
- **Empty state:** Define an explicit empty state composable for when the collection has zero items. An empty carousel row with no content or label is confusing.
- **Hard-coded item widths:** Defining item widths in pixels rather than dp causes correct-looking designs to break on high-density screens or when the user adjusts display size in system settings.

## References

- **Material 3 Guidelines:** [Carousel overview](https://m3.material.io/components/carousel/overview)
- **Documentation:** [Compose components](https://developer.android.com/develop/ui/compose/components)

## See also

The `compose-lazy-lists` code skill covers the `LazyRow` and `LazyColumn` primitives that underlie custom scroll containers; use it when none of the four carousel variants fits the content's shape. The `compose-theming` code skill governs the color tokens and shape values that style carousel card surfaces. For accessibility wiring — content descriptions, focus semantics, and `Reduce Motion` checks — see the `compose-accessibility` code skill. On large screens, `adaptive-layout` provides guidance on switching carousels to grids at wide-screen breakpoints.
