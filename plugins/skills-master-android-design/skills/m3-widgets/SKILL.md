---
name: m3-widgets
description: Material 3 design guidance for Android app widgets, covering canonical layout tiers, responsive grid sizing, dynamic color and theming, picker preview content, refresh cadence decisions, and quality bar for production. Use when designing, critiquing, or specifying an Android home-screen or lock-screen widget — evaluating whether it scales gracefully across widget sizes, whether its theming respects user dynamic color, whether preview content sets realistic expectations in the picker, or whether its update cadence is appropriate for its information type.
---

## When to use

- Designing a new app widget and deciding which canonical layout tier (information, collection, or hybrid) best fits the content.
- Critiquing an existing widget for how it looks and functions across minimum, default, and maximum sizes on the home-screen grid.
- Evaluating whether a widget's theming participates correctly in dynamic color and dark mode.
- Specifying what the widget preview should show in the widget picker so users can make an informed placement decision.
- Deciding how often a widget should refresh its content — balancing freshness against battery and data cost.
- Assessing a widget against the quality checklist before shipping: accessibility, sizing behavior, theming, and picker representation.

## Core guidance

### Canonical layout tiers

- **Choose "information" widgets for single-value or single-action content.** A clock, a weather summary, a battery percentage, a quick-compose action — these present one focused piece of information or one primary tap target. Information widgets typically occupy a small footprint (2×2 to 4×2 cells) and should not try to summarize multiple data streams on the same surface. When the content naturally expands to multiple items, step up to a collection widget.
- **Choose "collection" widgets for scrollable lists or grids of homogeneous items.** A calendar agenda, a task list, a playlist, or a photo reel belong here. Collection widgets support vertical scrolling inside the widget frame, giving users access to more items without leaving the home screen. The key design constraint: every row or cell in the collection must follow the same template and respond to tap with a consistent behavior — deep-linking to the full item in the host app.
- **Choose "hybrid" widgets when a summary header and a collection are equally important.** A mail widget that shows the unread count above an inbox list, or a fitness widget that shows today's ring progress above a recent activity log, fits the hybrid tier. The header should not grow large enough to crowd the collection; treat it as a compact hero row rather than a miniature screen.
- **Avoid the "shortcut" anti-pattern.** Placing multiple launchers or unrelated actions in a single widget dilutes focus and produces a confusing visual hierarchy. Each widget should have one dominant purpose; additional entry points are acceptable only when they are closely related (e.g., a music widget where pause, skip back, and skip forward are all part of the same playback context).

### Responsive sizing across the grid

- **Design for three explicit size states: minimum, default, and maximum.** Minimum is the smallest size a user can resize the widget to — design this state with the single most important piece of information and one tap target. Default is the size the widget snaps to when first placed — this is the "hero" design. Maximum is what the widget shows when stretched to its largest configured bound. Do not assume the user will always see the default size.
- **Use `minResizeWidth` and `minResizeHeight` as hard lower bounds, not as the default size.** Setting the minimum resize boundary to match the full design collapses the widget's flexibility and frustrates users who want a compact home screen. Set the minimum to the smallest viable content state — usually just an icon, a key metric, and a label.
- **Let content scale up gracefully, not just fill space.** At maximum size, reveal additional detail rather than inflating text or icon sizes. A weather widget at 4×2 might show temperature and condition; at 4×4 it can reveal hourly forecast tiles. Scaling typography or icons up without revealing content produces an empty, wasteful feel.
- **Respect the grid cell unit.** Launcher grids vary by device and launcher, but Material guidelines suggest targeting whole-cell increments. Design compositions that look intentional at 2, 3, 4, and 5 columns wide rather than compositions that require fractional cells to work.
- **Account for edge insets and system decorations.** Widget frames have padding applied by the launcher. Leave adequate visual breathing room inside the widget boundary — do not place content flush against the declared widget size.

### Theming and dynamic color

- **Apply dynamic color as the default theming story.** Widgets that ignore dynamic color look alien on a home screen personalized by the user. Use `colorPrimary`, `colorSecondary`, and `colorSurface` from the user's dynamically generated M3 palette for backgrounds, text, and icon tints. Avoid hardcoded hex values for brand-adjacent surfaces.
- **Support both light and dark widget states explicitly.** The home screen can be in dark mode independently of the device wallpaper brightness. Design both a light and a dark surface variant; rely on system color role mappings rather than manually shifting colors — `Surface` becomes `Surface` in dark mode with the correct contrast automatically when using the dynamic color system.
- **Use translucent or scrim surfaces to integrate with the wallpaper.** Material 3 encourages widgets to feel "of the wallpaper" rather than opaque blocks on top of it. A semi-transparent surface tinted by `colorSurface` at partial alpha allows wallpaper texture to contribute to the widget's visual character. Test this at multiple wallpaper brightness levels — a surface that looks elegant on a light wallpaper can become illegible on a dark one if the scrim is too thin.
- **Maintain WCAG AA contrast for all text against all surfaces.** Dynamic color is designed to pass contrast thresholds, but verify at both extremes of the generated palette — some dynamic seeds produce edge cases. Text on translucent surfaces is especially vulnerable.
- **Do not rely solely on color to convey state.** A widget is viewed at a glance; use iconography, labels, and layout changes alongside color to communicate status, not color alone.

### Preview content in the widget picker

- **Show realistic representative content in the preview, not placeholder text.** "Task name" or "Username" in a preview is less persuasive than "Buy groceries" or "Alex M." Users choose widgets based on how they will look in daily use. Mock believable data that represents the widget's typical state.
- **The preview must accurately reflect what the user will see after placement.** A preview that shows a full-screen illustration of data that is only visible after sign-in and several minutes of sync is misleading. If the widget has a loading or empty state, consider showing that state in the preview with a short supporting label explaining what the widget will show once data is available.
- **Use the `previewLayout` attribute (XML widget) or the Glance preview composable to produce a static preview.** Avoid dynamic loading in the preview path — the picker should render instantly and never show a spinner.
- **Size the preview image or layout to match the declared default size.** A preview that shows a 4×4 layout for a widget that defaults to 2×2 creates a bait-and-switch perception after placement.

### Refresh cadence

- **Match refresh frequency to the information's natural staleness window.** A live sports score may warrant a one-minute periodic check; a daily step count summary needs at most one update per hour; a quote-of-the-day widget should update once a day. Over-refreshing drains battery and may trigger Android's background restriction mechanisms.
- **Prefer event-driven updates over polling wherever possible.** A messaging widget should update when a new message arrives (via a push notification or WorkManager trigger), not on a fixed 15-minute interval. Polling is a fallback when push is architecturally unavailable.
- **Design the stale-data state explicitly.** If the widget's data could not be refreshed — no network, background restrictions, or an expired token — design a visible but non-alarming indicator (a subtle "last updated" timestamp, a muted tint on the metric, or a small refresh icon). Do not silently show stale data as if it were current.
- **Do not design critical, time-sensitive information as a widget feature.** Widgets are surface-level glances; they are not guaranteed to update on a precise schedule. Safety-critical or urgency-critical information (medication alarms, emergency contacts) belongs in a notification or a persistent foreground service, not a widget.

### Quality tiers

- **Tier 1 — Functional:** Correct data, taps launch the correct deep link in the host app, widget does not crash or show error states to the user, respects system dark mode. This is the minimum acceptable bar.
- **Tier 2 — Polished:** Dynamic color applied, light and dark states designed, picker preview uses realistic content, all three size states (minimum, default, maximum) have been designed explicitly, accessibility content descriptions present on all interactive elements.
- **Tier 3 — Delightful:** Transitions between data states use subtle animation where the Glance `GlanceAppWidget` API permits, translucent surface integrates with the wallpaper, widget adapts layout (not just scales content) across size states, last-updated timestamp is present and styled appropriately.

## Platform notes

- **Phones:** The home-screen grid is typically 4 or 5 columns. Most users have multiple apps and widgets competing for space; keep even the maximum-size widget focused. Prioritize designs that look polished at 4×2 (wide, short) since this is the most common widget footprint.
- **Tablets and large screens:** Home-screen grids on tablets can be 6–8 columns wide. Widgets can expand horizontally without looking stretched if the design uses the additional width to reveal more data columns or context. Test layouts at 6-cell and 8-cell widths explicitly; a 4×2 widget on an 8-column grid will appear as a small island — ensure it still reads clearly at that relative scale.
- **Lock screen widgets (Android 13+):** Lock screen placements have additional constraints: no scrollable collections, reduced tap-action surface, and a narrower height budget. Design a lock-screen variant separately if the feature is required rather than reusing the home-screen layout.
- **Foldables:** When the device unfolds, the launcher may reflow widgets. Test in both folded (compact) and unfolded (medium/expanded) states; avoid designs that only work at one screen configuration.

## Pitfalls

- **Designing only the default size.** The minimum size state is the one users squeeze widgets to after a few weeks; if it is never designed it becomes an embarrassing truncated layout.
- **Static theming that ignores dynamic color.** A hardcoded brand-blue background stands out as a sore thumb on a dynamically-themed home screen and reduces the perceived quality of the widget.
- **Picker previews that show ideal states impossible without data.** Users place the widget expecting what they saw in the picker; if the first few minutes show a spinner or empty list, trust is broken immediately.
- **Aggressive polling cadence.** Widgets that refresh every few minutes for non-time-sensitive data will be flagged by Android battery optimization, may be placed in the "restricted" background bucket, and ultimately update less reliably than a well-designed event-driven approach.
- **Tapping the widget opens the app's launcher activity, not the relevant content.** A calendar widget that taps to the app home screen instead of the selected event is a frequent and frustrating failure. Every tappable element in a widget should deep-link directly to the content it represents.
- **Missing content descriptions on interactive elements.** Widgets live on the home screen and must be fully accessible. A widget button with no content description is invisible to accessibility services.
- **Showing stale data silently.** If the widget cannot refresh, showing outdated numbers as if they are current erodes trust. Communicate staleness gracefully.
- **Treating a widget as a mini-app.** Widgets are a glance surface, not a second UI. Putting settings, navigation tabs, or multi-step interactions in a widget overloads the format and produces a confusing experience.

## References

- **Material 3 Guidelines:** [App widgets design](https://developer.android.com/design/ui/widget)
- **Material 3 Guidelines:** [Foundations overview](https://m3.material.io/foundations/overview)
- **Material 3 Guidelines:** [Dynamic color](https://m3.material.io/styles/color/system/overview)
- **Material 3 Guidelines:** [Color roles](https://m3.material.io/styles/color/roles)

## See also

For hands-on implementation of these widget layouts using the Jetpack Glance API — `GlanceAppWidget`, `GlanceStateDefinition`, `SizeMode`, and `ActionCallback` — hand all code work to the app-widgets-glance code skill. For responsive layout decisions that affect widget sizing on tablets and large-screen home screens, see the m3-adaptive-layout skill. For dynamic color token decisions that apply inside widget surfaces, see the m3-color skill. For icon and illustration asset choices within widget surfaces, see the m3-icons skill.
