---
name: m3-cards
description: "Design guidance and critique for Material 3 cards on Android: choosing between elevated, filled, and outlined card variants, deciding when a card beats a list item or plain surface, clickable vs container cards, sizing and touch targets, and grouping related content and actions. Use when designing or reviewing any card-based layout, content groupings, feed items, dashboard tiles, or deciding between a card and a list row in Compose-first Android UI."
tags: [cards, containers, m3, design, layout, android]
x-skills-master:
  domain: android
  class: design
  category: components
  platforms: ["android", "large-screen"]
  pairs_with: []
  sources:
    - https://m3.material.io/components/cards/overview
    - https://developer.android.com/develop/ui/compose/components/card
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Use this skill when designing or critiquing any surface that groups related content — product tiles, article previews, dashboard statistics, media thumbnails with metadata, or interactive feed items. It helps you choose between the three M3 card variants (elevated, filled, outlined), decide whether a card or a list item is the right container, set correct touch targets on clickable cards, handle states and accessibility, and adapt card layouts across compact phones and large screens. This is design judgment; composable names are mentioned in prose and implementation is left to the code skill.

## Core guidance

- **Choose the variant that matches the visual weight you need.** Elevated cards use a drop shadow and the surface color to lift content off the background — use them when the card needs to stand clearly separate from its surroundings, such as a hero tile or a prominent dashboard widget. Filled cards carry a tonal surface color (typically surface-variant) with no shadow, sitting at the same visual plane as adjacent UI; prefer them in dense feeds and grids where shadow stacking would create visual noise. Outlined cards use a border stroke and no shadow or fill, lending a lightweight contained feel; reach for outlined when you want containment without elevation contrast, such as a secondary information panel or a settings-page card alongside other stroked containers. In Compose, these map to `ElevatedCard`, `Card` (filled), and `OutlinedCard`.

- **Use a card when content has multiple heterogeneous parts that belong together.** A card earns its place when the grouped items — headline, supporting text, thumbnail, action buttons — cannot be meaningfully understood in isolation. If the row contains only a title and a trailing icon, a standard `ListItem` is lighter, more scannable, and easier for users to read down. Reserve cards for when the visual container itself communicates meaningful grouping.

- **Limit interactive regions and clarify the primary action.** A card can be entirely tappable (the full surface is a click target), partially interactive (discrete buttons inside a container surface), or non-interactive (purely informational). Entirely clickable cards must have a clear destination or outcome; do not make a card tappable and then do nothing meaningful. When a card contains both a global tap target and internal action buttons — such as a product card with a full-surface tap to a detail page and a separate "Add to cart" button — ensure the two actions are visually and spatially distinct to avoid accidental taps.

- **Maintain a minimum 48dp touch target on every interactive element.** The card surface itself, if clickable, typically spans wider than 48dp and is fine, but embedded icon buttons, chip-style labels, and trailing controls inside the card must still meet the 48dp minimum. Do not compress internal actions just because the card surface provides some touch forgiveness.

- **Match card elevation to the layer model, and never stack shadows.** Material 3 uses five elevation tones to signal layer depth; cards live at tonal level 1 (filled/outlined) or level 2 (elevated). Placing an elevated card inside another elevated container competes for visual depth and makes the hierarchy unreadable. Keep cards at the same elevation level within a list or grid; reserve a different level exclusively for a selected or dragged card state.

- **Keep content density appropriate to the card's function.** Cards are not mini-screens. Limit a standard card to one primary topic, one supporting line or image, and at most two action buttons. Overloaded cards — multiple headlines, long body text, many chips — erode the "at a glance" value of the container. If content keeps expanding, consider a dedicated detail screen rather than growing the card.

- **Use state layers to communicate interactivity.** M3 cards express hover, pressed, focused, and dragged states through a semi-transparent overlay drawn at the on-surface color. Do not invent custom pressed colors or suppress state layers to achieve a "flat" look — the state layer is the system's affordance signal and its absence confuses users about whether a card is tappable. Disabled cards should reduce container and content opacity and remove interactivity without hiding the content entirely.

- **Place action buttons at the card bottom and use text or icon buttons, not full-width buttons.** Embedded actions belong at the trailing or bottom of the card using text button or icon button weight — not a full-width filled button, which would overpower the card's hierarchy and compete with page-level CTAs. Group at most two actions; if more are needed, surface a bottom sheet or detail page.

- **Align typography to the M3 role scale, not arbitrary sizes.** A card headline typically uses `titleMedium` or `titleSmall`; supporting body text uses `bodyMedium` or `bodySmall`; metadata or timestamps use `labelSmall`. Avoid mixing more than three type scale steps within a single card, which creates typographic noise rather than hierarchy.

- **Don't rely on the card outline or shadow alone to convey selection or error state.** When a card represents a selectable item (such as a multi-select grid), use an explicit checkmark overlay and a changed container color at elevation level 2, not just a thicker border. Error states need an icon and accessible text label, not just a red outline.

## Platform notes

- **Compact phones (portrait):** Cards typically span the full content width minus standard horizontal padding (16dp on each side). Vertical rhythm between cards should be at least 8dp to maintain visual separation. Avoid cramming more than two action rows inside a card at this width.

- **Tablets and foldables (expanded/medium window size classes):** Cards work well in two- or three-column grids. Use a `LazyVerticalGrid` or adaptive grid rather than a single column list to take advantage of available width. Card widths of 150–300dp are comfortable for content tiles; wider than ~360dp and a card starts to feel like a panel, at which point a detail pane or two-pane layout is more appropriate. On foldables, ensure cards reflow gracefully across the fold crease — avoid a single card spanning the seam.

- **Large screens (desktop-like window widths):** Elevated cards are effective as discrete dashboard tiles in a grid. Outlined cards work well for settings panels and side-by-side information groups. Reduce drop shadow intensity compared to phone; large screens have higher ambient light contexts that make heavy shadows feel dated.

- **Wear and TV:** Cards as M3 describes them are not native patterns on Wear OS (which favors full-screen tiles) or on TV (which uses Focus-aware carousels with distinct focus elevation). Do not transplant phone card patterns to these surfaces without significant rethinking.

## Pitfalls

- Using elevated cards inside other elevated surfaces, stacking shadows and flattening depth hierarchy.
- Making a card entirely clickable with no visible indication it is interactive — the state layer on press is not a substitute for an affordance users can see before touching.
- Placing a full-width filled `Button` inside a card, competing with page-level primary actions.
- Overloading a card with too many type scales, images, chips, and action buttons when a detail screen would serve better.
- Choosing a card when a `ListItem` would suffice — adding card chrome to simple single-attribute rows adds visual weight without communicating any grouping.
- Suppressing state layers for aesthetic reasons, removing the system's interactivity signal.
- Mixing card variants (elevated and outlined) in the same grid or feed without a clear rationale — variant inconsistency reads as incomplete design rather than intentional hierarchy.
- Ignoring the 48dp touch target for embedded action controls like icon buttons inside the card.
- Designing cards with fixed pixel heights instead of letting content size them — text truncation and clipping break at larger font scales and in languages with longer strings.

## References

- **Material 3 Guidelines:** [Cards overview](https://m3.material.io/components/cards/overview)
- **Documentation:** [Card | Jetpack Compose](https://developer.android.com/develop/ui/compose/components/card)
- **Material 3 Guidelines:** [Elevation](https://m3.material.io/styles/elevation/overview)
- **Material 3 Guidelines:** [Interaction states](https://m3.material.io/foundations/interaction/states/overview)

## See also

- The Jetpack Compose Material 3 card code skill covers `ElevatedCard`, `Card`, and `OutlinedCard` composables, `CardDefaults`, click modifiers, and state layer customization — pair this design skill with it when moving from critique to implementation.
- The M3 lists design skill covers when a `ListItem` is the right alternative to a card for simpler single-row content.
- The M3 elevation and color design skills explain the tonal surface system and how container colors map to the five elevation levels that govern card variant choice.
- The M3 layout and adaptive design skill covers grid patterns for cards on tablets, foldables, and large-screen window size classes.
