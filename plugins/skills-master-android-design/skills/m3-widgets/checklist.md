## Widget Design Quality Checklist

### Layout and sizing
- [ ] Minimum size state has been designed explicitly — not just the default scaled down
- [ ] Default size state is the primary hero design
- [ ] Maximum size state reveals additional data rather than inflating existing elements
- [ ] All three states have been reviewed in actual launcher grids (not just design tool artboards)
- [ ] Content does not appear flush against the widget boundary — adequate internal padding present
- [ ] Design specifies `minResizeWidth` and `minResizeHeight` as the smallest viable content state, distinct from the default size
- [ ] Layout tested on a 4-column phone grid and a 6-column tablet grid

### Theming and color
- [ ] Dynamic color roles (`colorPrimary`, `colorSurface`, `colorOnSurface`, etc.) used instead of hardcoded hex values
- [ ] Light mode variant designed
- [ ] Dark mode variant designed
- [ ] WCAG AA contrast verified for all text/icon pairs against their background surfaces
- [ ] Translucent surface (if used) tested against both light and dark wallpapers for legibility
- [ ] Brand is expressed through typeface and iconography, not through hardcoded background color

### Picker preview
- [ ] Preview uses realistic, representative content — not placeholder strings or lorem ipsum
- [ ] Preview size matches the widget's declared default size
- [ ] Preview accurately represents the widget's typical loaded state, including any layout constraints (e.g., no thumbnails, text-only rows)
- [ ] If the widget has a loading or empty state, the preview includes a brief explanatory label
- [ ] Preview renders without network calls or dynamic data loading (uses `previewLayout` or static preview composable)

### Refresh and data freshness
- [ ] Refresh frequency matches the information's natural staleness window
- [ ] Event-driven updates evaluated and implemented where the data source supports push
- [ ] Stale-data state designed: a visible but non-alarming indicator communicates when data could not be refreshed
- [ ] Widget does not poll at an interval shorter than 15 minutes for non-time-critical data
- [ ] No safety-critical or urgency-critical information is surfaced as a widget feature

### Interaction and navigation
- [ ] Every tappable region deep-links to the specific content it represents in the host app (not to the launcher activity)
- [ ] Collection widget rows each have a unique tap target leading to the corresponding item
- [ ] No multi-step interactions or settings UI inside the widget frame
- [ ] Widget does not attempt to replicate in-app navigation

### Accessibility
- [ ] All interactive elements have content descriptions
- [ ] Text does not rely on color alone to convey meaning (icons, labels, or layout changes accompany color differences)
- [ ] Minimum touch target size respected for any tappable region within the widget

### Quality tier self-assessment
- [ ] Tier 1 (Functional): Correct data, correct deep links, no crashes, respects dark mode
- [ ] Tier 2 (Polished): Dynamic color, both light/dark states, realistic picker preview, all three size states designed, accessibility descriptions present
- [ ] Tier 3 (Delightful): Translucent surface integrates with wallpaper, layout adapts (not just scales) across size states, stale-data state styled appropriately, last-updated timestamp present where relevant
