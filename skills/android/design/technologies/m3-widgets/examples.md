## Scenario 1: Weather information widget across three size states

A weather app ships a widget that shows current temperature and a condition icon. The designer mocks only the 4×2 default size. At minimum (2×2), the layout collapses awkwardly — the city name, temperature, and icon stack at 14 sp type with no margin, and the condition label is clipped. At maximum (4×4), all four rows inflate the same elements to 32 sp, leaving a sea of whitespace between them.

**Well-designed version:** The minimum (2×2) state is purpose-built: a single large temperature digit and a condition icon fill the frame, city name is dropped. The default (4×2) state adds the city, a one-line condition description, and a high/low range in a two-column layout. The maximum (4×4) state reveals an hourly forecast strip using six icon-plus-temperature cells in a horizontal row — new data, not bigger data. Each state was designed in a dedicated frame before any implementation began.

**Anti-pattern:** A single layout file is referenced for all sizes. The designer trusts the system to scale. The result: the minimum size clips content and the maximum size bloats it, both failing to communicate any useful information and generating user reviews citing "broken widget."

---

## Scenario 2: Task-list collection widget with dynamic color

A productivity app ships a collection widget showing today's tasks. The widget background is hardcoded to the app's brand color — a deep indigo — with white text. On a user's dynamically-themed phone with an orange-toned wallpaper and a warm beige `colorSurface`, the indigo widget stands out as a visual intruder on the home screen. In dark mode the indigo is even more jarring against the dark wallpaper.

**Well-designed version:** The widget surface uses `colorSurface` with a very light tint from `colorPrimary`, which dynamically aligns with the user's chosen palette. Task text uses `colorOnSurface`. The checkmark icons use `colorPrimary`. In light mode this produces a soft warm surface; in dark mode it darkens automatically to a muted tone that complements the wallpaper. The brand is still present in the typeface and the app icon in the widget header, not in the background color.

**Anti-pattern:** The designer argues that the brand color is a marketing requirement. The widget ships with hardcoded hex values, passes brand review, and receives consistent one-star ratings citing "ugly home screen." Dynamic color exists precisely so widgets integrate rather than clash.

---

## Scenario 3: Picker preview for a news headline widget

A news app's widget preview shows five fully-loaded article headlines with high-resolution thumbnails, publication times, and reading-time estimates. The preview is pixel-perfect. The user places the widget, expecting to see the same five articles immediately. Instead, the widget shows a progress spinner for 8 seconds while it fetches headlines on first load, then settles into a state that shows only a headline and no thumbnail (thumbnail loading is deferred). The picker promised something the widget cannot deliver at placement time.

**Well-designed version:** The picker preview shows three headlines with a small "News" section header and a subtle "Updating..." label at the bottom. The preview accurately represents the typical loaded state — text-first, thumbnail as a secondary element — so the user's expectation matches reality. On first placement, the widget immediately shows the same text-first layout with a skeleton shimmer for thumbnails, resolving in under two seconds. The experience is coherent from picker to placement to settled state.

**Anti-pattern:** The designer generates the preview from a fully-loaded, fully-cached ideal session screenshot. Users who place the widget on a fresh install or after clearing app data see a spinner for 15 seconds, then a layout that does not match the preview. Trust is broken and the widget is removed.
