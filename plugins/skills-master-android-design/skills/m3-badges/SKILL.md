---
name: m3-badges
description: "Design guidance and critique for Material 3 badges on Android: choosing between small dot badges and large numbered badges, placement on navigation and icon targets, count formatting, and accessible labeling. Use when designing or reviewing notification counts, unread indicators, status dots, or any badge overlaid on a navigation item or action icon in a Compose-first Android UI."
---

## When to use

Use this skill when designing or critiquing indicators that overlay an icon or navigation destination to signal pending attention: unread message counts, notification totals, new-content dots, or status flags. It covers the two M3 badge variants — the small dot badge and the large numbered badge — their correct placement on navigation rails, navigation bars, and action icons, count truncation, and accessible content descriptions. This is design judgment; hand implementation to the code skill.

## Core guidance

- **Choose dot vs. numbered badge by information value.** Use the small dot badge (no text) when the mere presence of new content is enough — for example, "something is new here" without needing a count. Use the large badge when the count itself drives urgency or helps the user decide where to go first, such as "47 unread" on an inbox icon. Never use a numbered badge where the count is always 0 or will remain static.

- **Anchor the badge to the icon, never to the label.** Badges sit in the upper-right corner of the icon container, slightly overlapping its edge. Attaching to the text label is a common misplacement and breaks the visual relationship between count and icon.

- **Cap counts at 999+, not at an arbitrary number.** M3 defines 999+ as the display maximum for large badges. Displaying four-digit or five-digit raw numbers breaks the badge shape and reads as data rather than a notification signal. For counts above 999, always render "999+" rather than the raw integer.

- **Suppress the badge entirely instead of showing zero.** A badge reading "0" communicates nothing and adds visual noise. Remove the badge composable from the layout — specifically the BadgedBox wrapper with a Badge containing no content — when the count reaches zero rather than hiding it with opacity or rendering an empty container.

- **Reserve badges for asynchronous, user-generated events.** Badges communicate that something happened without the user's attention — new messages, pending tasks, unread alerts. Do not badge purely system or progress states (for example, "downloading"), and avoid badging items the user can never act on.

- **Use one badge per destination, not per icon variant.** Each navigation destination should carry at most one badge. If an icon has sub-categories that each generate counts, surface only the sum at the top-level navigation item and drill into specifics on the destination screen.

- **Maintain contrast between the badge and its host icon.** M3 badges default to the error color (a high-contrast red from the color scheme) with on-error text. If the host icon or container shares a similar hue, verify the badge still reads clearly at small sizes. Do not override the badge color with a low-contrast tint just to match a custom brand palette — the badge must stand out.

- **Size touch targets for the icon, not the badge.** The badge is decorative; the tap target belongs to the icon or navigation item beneath it. Never make the badge itself independently tappable. Ensure the underlying icon meets the 48 dp minimum touch target recommended by M3, which incidentally gives the badge room to appear without overlapping adjacent elements.

- **Write meaningful content descriptions.** Screen readers announce navigation items; without an explicit content description update, a sighted label like "Chat" becomes meaningless to a blind user who needs to know about the 12 unread messages. Compose the count into the content description, for example "Chat, 12 unread messages" or "Notifications, new items" for the dot variant. Keep descriptions concise and actionable.

- **Do not animate the badge value continuously.** Smoothly counting up a badge in real-time (e.g., ticking from 5 to 6 to 7) creates distracting motion in the navigation layer. Update the badge value discretely on screen entry or on a reasonable polling interval; use a brief fade or scale if you animate the appearance of a new badge, but do not animate number changes.

## Platform notes

- **Compact phones (portrait):** Badges appear on the bottom Navigation Bar, which holds 3–5 destinations. At this density a dot badge is unambiguous; large numbered badges need adequate icon padding so the badge does not visually merge with adjacent destination labels. Ensure the navigation bar height accommodates the badge overflow above the icon bounds.

- **Large screens and foldables:** Navigation shifts to a Navigation Rail or Navigation Drawer. On a rail, icon targets are taller and more separated, giving the badge more breathing room. Numbered badges on rails are more legible because of the larger icon area. On a drawer with visible labels, the badge still anchors to the icon, not the row text, to preserve scanning rhythm. Confirm that unfolded layouts do not collapse rail and bar simultaneously in a way that duplicates badge rendering.

- **Navigation Drawer (modal and permanent):** Badges are supported on drawer items; the same placement, count, and accessibility rules apply. In a permanent drawer with wide list rows, a badge in the icon column is preferred over inline count text in the label column, which belongs to a different component pattern (a list item trailing element).

- **Wear OS:** Navigation paradigms differ significantly. Badges are generally not used on Wear OS watch faces or navigation; avoid applying phone badge patterns there.

- **TV:** Navigation on Android TV uses D-pad focus; badging is not a standard pattern and should be avoided.

## Pitfalls

- Showing "0" in a numbered badge instead of removing the badge entirely.
- Attaching the badge to the destination label text rather than the icon.
- Using raw counts above 999 instead of capping at "999+".
- Choosing a badge color that does not contrast with the underlying icon surface.
- Making the badge itself a tap target separate from its host icon.
- Badging purely system/progress states that users cannot act on.
- Omitting an updated content description so screen readers announce the icon name without the count.
- Animating the numeric value tick-by-tick in real time, creating persistent motion distraction in the navigation layer.
- Placing more than one badge on a single navigation destination icon.

## References

- **Material 3 Guidelines:** [Badges overview](https://m3.material.io/components/badges/overview)
- **Documentation:** [Jetpack Compose UI components](https://developer.android.com/develop/ui/compose/components)
- **Material 3 Guidelines:** [Navigation bar](https://m3.material.io/components/navigation-bar/overview)
- **Material 3 Guidelines:** [Navigation rail](https://m3.material.io/components/navigation-rail/overview)
- **Material 3 Guidelines:** [Navigation drawer](https://m3.material.io/components/navigation-drawer/overview)
- **Material 3 Guidelines:** [Color system](https://m3.material.io/styles/color/overview)

## See also

- The M3 navigation bar and navigation rail design skills cover the host destinations on which badges most commonly appear; badge design decisions are tightly coupled to how those navigation components lay out icon and label targets.
- The M3 color system design skill explains the error color role that badges use by default and how to evaluate contrast when customizing badge color.
- The M3 accessibility design skill covers content description patterns and the broader Android accessibility guidance that informs badge labeling for screen readers.
- The Compose Material 3 code skill implements this guidance using the BadgedBox and Badge composables from the `androidx.compose.material3` library; pair this critique skill with it when moving from design review to implementation.
