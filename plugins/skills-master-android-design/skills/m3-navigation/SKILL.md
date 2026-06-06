---
name: m3-navigation
description: "Material 3 design guidance for primary navigation on Android: when to use a navigation bar, navigation rail, or navigation drawer based on window size class, how to handle 3-7 top destinations, and how to design adaptive navigation that transitions across compact, medium, and expanded layouts. Use when designing or critiquing app-level navigation structure, evaluating destination count, or auditing active-state treatment and accessibility of primary nav components."
---

## When to use

Apply this skill when:

- Deciding which primary navigation surface (navigation bar, navigation rail, or navigation drawer) belongs in a given layout context.
- Setting the number and order of top-level destinations.
- Designing how navigation adapts as the screen width expands from a compact phone to a tablet, foldable, or desktop window.
- Auditing the visual treatment of the active destination: icon, label, indicator, and contrast.
- Reviewing whether navigation is accessible to assistive technologies and usable with keyboard or switch access.
- Evaluating whether secondary navigation (nested destinations, bottom sheets, tabs) is being confused with primary navigation.

This is a design-judgment skill. For implementation, hand off to the `NavigationSuiteScaffold` composable (Adaptive Navigation Suite library) and the `navigation-compose` library, both covered in the corresponding code skills.

---

## Core guidance

### Choose the right navigation surface for the window width

Material 3 ties navigation surface choice directly to window size class:

- **Navigation bar for compact width (< 600 dp).** A bottom bar with 3-5 destinations suits a phone in portrait. It keeps destinations within thumb reach and leaves the full vertical extent free for content. Do not use a navigation bar on medium or expanded widths — it wastes horizontal space that should be reserved for content.
- **Navigation rail for medium width (600-1200 dp).** A vertical rail along the leading edge works well on phones in landscape, small tablets, and foldables in book mode. It keeps destinations visible without a full drawer, and the freed horizontal space should go to content — not a wider content column with the same amount of white space.
- **Navigation drawer (modal or permanent) for expanded width (>= 1200 dp).** A permanent side drawer anchored to the leading edge suits large tablets, desktop windows, and the unfolded state of large foldables. Because screen real estate is generous, destinations can carry longer labels and a secondary-level navigation structure can sit inside the drawer without overwhelming the UI.

The `NavigationSuiteScaffold` composable automates this switch using `WindowSizeClass`, so the design contract is: define the breakpoints, not the platform-specific components.

### Limit destinations to 3-7

- **Three destinations minimum.** Fewer than three top-level destinations do not justify a persistent navigation surface — use a simpler app bar or in-page navigation instead.
- **Five destinations is the sweet spot.** Beyond five, the navigation bar becomes crowded on compact screens and the cognitive load increases. Consider whether the extra destinations are truly peer-level or whether they belong one level down.
- **Seven destinations absolute maximum.** At seven, reconsider the information architecture before adding more. Promote the most-used destinations; demote the rest to a secondary surface (a profile drawer, an overflow menu, or a settings deep-link in the toolbar).
- **Order destinations by frequency of use and logical flow.** Put the home or feed destination first. Place profile or settings last. The middle positions carry less visual weight — avoid placing high-frequency actions there unless the app's flow demands it.

### Design the active-state treatment carefully

- **Use the pill indicator.** The active destination in a navigation bar or rail shows a filled pill (indicator) behind the icon. Do not suppress or shrink it — it is the primary spatial cue that tells users where they are.
- **Show the label on the active item in a bar.** Navigation bars show labels at all times or only on the active item; never hide labels on all items simultaneously. If labels are long, prefer shorter destination names over truncation.
- **Tint the active icon with on-secondary-container.** The M3 color system assigns `secondaryContainer` for the indicator background and `onSecondaryContainer` for the active icon, keeping contrast compliant against the bar's `surface` background. Do not invert this or use `primary` tinting as a shortcut — it breaks the role separation.
- **Keep inactive icons at medium emphasis.** Inactive icons use `onSurfaceVariant`, not a disabled-looking 38% opacity. They should look available, not greyed out.

### Adaptive navigation: design the layout holistically, not just the nav component

- **Content should expand, not just reflow.** When the navigation rail appears at medium width, the content pane should use the reclaimed horizontal space meaningfully — consider a two-column list/detail layout rather than a wider single-column list with extra padding.
- **Never animate between navigation surfaces on window resize.** The switch from bar to rail to drawer should feel instantaneous and structural. Adding a cross-fade or slide makes the transition feel like a surprise rather than an expected layout adaptation.
- **Preserve navigation state across configuration changes and size transitions.** The selected destination, scroll position, and back stack should survive a fold/unfold or a split-screen resize. This is an architectural concern but the design must specify it explicitly so engineering does not treat state loss as acceptable.
- **Account for the system bars.** On compact layouts, the navigation bar sits above the gesture navigation or 3-button bar. Use `WindowInsets` padding so destinations are not clipped or obscured by the system UI. On expanded layouts, ensure the permanent drawer does not conflict with the status bar or taskbar.

### Secondary navigation does not belong in the primary nav surface

- **Tabs handle secondary navigation within a destination.** If a destination has sub-sections, use a tab row inside the destination, not extra entries in the navigation bar. Adding sub-destinations to the nav bar inflates destination count and misleads users about the app's structure.
- **Bottom sheets and dialogs are not navigation.** Avoid triggering a navigation bar item that opens a sheet rather than a destination screen — users expect a destination to be a full, persistent view, not an overlay.

### Accessibility

- **Touch targets must be at least 48 x 48 dp.** Each navigation destination item should meet this minimum even if the visual icon is smaller. Padding is part of the tap target.
- **Provide content descriptions for all icons.** Icons without visible labels must have a `contentDescription` so screen readers can announce the destination name.
- **Active state must be programmatically determinable.** The selected state must be exposed to accessibility services, not conveyed solely through color.
- **Keyboard and D-pad navigation must work.** On large-screen form factors, users may navigate with a keyboard or game controller. Ensure focus moves between destinations logically and that Enter/D-pad center activates the focused destination.

---

## Platform notes

### Compact phones (portrait, < 600 dp)

The navigation bar is the default surface. Limit labels to one or two words to prevent truncation on small screens. On phones with a notch or punch-hole camera, ensure the bar's insets account for the display cutout in landscape.

### Compact phones (landscape, < 600 dp tall)

Landscape orientation on a compact phone reduces vertical space significantly. Consider showing only icons (no labels) in the bar, or transitioning to a navigation rail. The `NavigationSuiteScaffold` does not automatically switch to a rail in compact-landscape — this is a design decision that must be explicitly specified and then implemented with a custom `WindowSizeClass` override.

### Medium-width devices (600-1200 dp): foldables in book mode, small tablets

The navigation rail should appear. The rail's floating action button (FAB) slot can be used for the screen's primary action, reducing the need for a separate FAB. Keep rail destination labels concise; the rail shows labels below icons by default.

### Expanded-width devices (>= 1200 dp): large tablets, desktop, foldables fully open

A permanent navigation drawer is the preferred surface. The drawer can carry a header (brand logo or user avatar), destination groups with section dividers, and secondary links (settings, help, feedback) below a divider near the bottom. The drawer should not be dismissible on expanded layouts — it should always be present and stable.

### Wear OS

Primary navigation on Wear OS uses a different paradigm (page-based swiping, rotary input). The M3 navigation bar and rail do not apply. Do not port phone navigation patterns to Wear.

### Android TV

TV navigation is D-pad driven. Primary navigation on TV typically uses a side panel or overlay menu activated from the D-pad. The M3 adaptive navigation components do not apply directly to TV.

---

## Pitfalls

- **Using more than five destinations on a compact navigation bar** — the bar becomes crowded, labels truncate, and the app feels overwhelming from the first screen.
- **Keeping the navigation bar on a large tablet** — a bottom bar on a 12" tablet with a rail or drawer available looks unfinished and wastes screen real estate.
- **Hiding or overriding the active indicator pill** — without the indicator, users lose their spatial sense of location in the app and cannot tell what is selected without reading every label.
- **Putting non-peer-level items in the navigation bar** — mixing top-level destinations with utility actions (compose, search, profile) in the same nav bar creates a confusing hierarchy. Use a FAB or toolbar for actions.
- **Animating the navigation bar in and out on scroll** — hiding the navigation bar when scrolling downward (common in some Material 2 patterns) is not recommended in M3. The nav bar should remain visible and stable so users can navigate at any point in a scroll session.
- **Designing navigation for a single screen size only** — failing to specify adaptive behavior means engineers will make ad-hoc decisions. Always deliver a design for all three window size classes.
- **Treating the navigation rail as a narrower drawer** — the rail is an icon-and-label surface for 3-7 top destinations, not an expandable side panel. Do not place secondary destinations or expandable groups in the rail.

---

## References

- **Material 3 Guidelines:** [Navigation bar overview](https://m3.material.io/components/navigation-bar/overview)
- **Material 3 Guidelines:** [Navigation rail](https://m3.material.io/components/navigation-rail/overview)
- **Material 3 Guidelines:** [Navigation drawer](https://m3.material.io/components/navigation-drawer/overview)
- **Documentation:** [Support different screen sizes — Adaptive layouts](https://developer.android.com/develop/ui/compose/layouts/adaptive)
- **Material 3 Guidelines:** [Understanding layout — Canonical layouts](https://developer.android.com/guide/topics/large-screens/large-screen-canonical-layouts)
- **Material 3 Guidelines:** [Color roles](https://m3.material.io/styles/color/roles)

---

## See also

The **m3-layout-design** skill covers canonical layouts (list-detail, supporting panel, feed) that pair with the navigation surfaces described here — choose the navigation surface and the content layout together.

The **m3-theming-design** skill covers the color role assignments (`secondaryContainer`, `onSecondaryContainer`, `onSurfaceVariant`) that drive correct active and inactive state tinting in navigation components.

The **navigation-suite-scaffold** and **navigation-compose** code skills implement the adaptive navigation pattern using `NavigationSuiteScaffold`, `NavHost`, and `WindowSizeClass` — hand off to those skills once the destination set, breakpoints, and active-state treatment are finalized in the design.
