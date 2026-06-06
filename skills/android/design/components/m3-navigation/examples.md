## Scenario 1: A five-destination productivity app adapting from phone to tablet

A task-management app has five top-level destinations: Today, Projects, Inbox, Search, and Profile.

On a compact phone in portrait, a navigation bar appears at the bottom with all five destinations. Each item shows its icon at all times, and the label appears only on the active item to keep the bar uncluttered at narrow widths. The active destination — say, Today — shows the filled pill indicator behind its icon, with the icon tinted in `onSecondaryContainer` and the pill filled in `secondaryContainer`. The inactive icons use `onSurfaceVariant` at full opacity so they read as available, not disabled.

When the user opens the app on a medium-width foldable in book mode (~840 dp), the navigation bar disappears and a navigation rail appears on the leading edge. The five destinations shift to the rail as icon-and-label pairs stacked vertically. The content pane widens to fill the freed horizontal space. In this layout the Today destination shows a list-detail split: the task list occupies the left two-thirds of the content area and an open task's detail fills the right third, because the design specifies this canonical layout at medium width.

On a large tablet at expanded width (~1280 dp), the navigation rail upgrades to a permanent drawer. The drawer carries a small app logo header, the five destinations with their labels, and a divider followed by a Settings link near the bottom. The content area fills the remaining space with the same list-detail split, now with more generous proportions.

Anti-pattern: Do not keep the navigation bar at all widths. Showing a bottom bar on a 12-inch tablet looks unfinished, wastes the leading 20% of horizontal space, and signals to users that the tablet layout was not designed intentionally.

---

## Scenario 2: A streaming app reconsidering its destination count

A video streaming app currently has seven navigation bar destinations: Home, Discover, Live, Downloads, My List, Search, and Profile. During a design review it becomes clear that Downloads and My List are closely related — both are about a user's saved content. Users in research sessions frequently confuse the two and tap the wrong one.

The recommendation: merge Downloads and My List into a single Library destination. This reduces the bar to six items, which is still one over the comfortable maximum of five. A second pass promotes the four highest-frequency destinations — Home, Discover, Search, and Library — and demotes Live to a prominent card or banner on the Home destination (since it is a contextual, time-limited feature rather than a persistent peer destination). The resulting four-item bar feels spacious, each destination is unambiguous, and the Live content is still discoverable without occupying a permanent slot.

Anti-pattern: Do not add an overflow or "More" item to handle extra destinations on a navigation bar. An overflow item at the end of a navigation bar is a strong signal that the information architecture needs restructuring. Users cannot predict what is hidden behind "More," and it breaks the promise that the bar shows the app's complete top-level structure.

---

## Scenario 3: Auditing the active-state treatment in a custom design

A designer delivers a navigation bar mockup where the active destination icon is filled with the app's primary brand color (a vivid teal), the indicator pill is absent, and the inactive icons are at 30% opacity to make the active state pop.

The critique identifies three problems. First, removing the pill indicator eliminates the primary spatial affordance that tells users where they are. Color alone is insufficient — the indicator's shape and fill provide a stable, scannable location cue that works even when colors are hard to distinguish. Second, using `primary` for the active icon color breaks the M3 color role contract. The navigation bar's active state is designed around `secondaryContainer` and `onSecondaryContainer` precisely so that the primary color remains available for the most prominent action on the screen (typically a FAB or call-to-action button) without competition. Third, 30% opacity on inactive icons makes them look disabled or unavailable. The correct treatment is `onSurfaceVariant` at full opacity — muted enough to recede, but clearly tappable.

The corrected design reinstates the pill indicator, switches the active icon tint to `onSecondaryContainer` over a `secondaryContainer` pill, and restores inactive icons to full-opacity `onSurfaceVariant`. The brand identity is preserved in the app bar's logo and the primary color's use in interactive controls, not in the navigation state.

Anti-pattern: Do not use the navigation bar as a branding surface. Overriding M3 color roles to place brand colors in navigation active states introduces contrast failures, visual competition with primary actions, and inconsistency for users who have enabled dynamic color (Material You), where the color scheme adapts to their wallpaper.
