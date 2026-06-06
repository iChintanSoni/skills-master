---
name: m3-wear
description: Design-critique guidance for Material 3 on Wear OS — glanceable round-screen layouts, M3 Expressive surface hierarchy, tile/app/notification surfaces, rotary and physical-button input, ambient mode, and battery-aware design. Use when designing or critiquing a Wear OS watch face, tile, app screen, or notification, evaluating glanceability and thumb-zone ergonomics, specifying rotary or crown input affordances, or auditing a design for ambient-mode and power constraints.
---

## When to use

- Designing or critiquing a Wear OS screen, tile, complication, or notification for glanceability and clarity.
- Evaluating whether a layout respects the round-screen canvas and safe zones.
- Specifying or reviewing rotary input, physical button (crown/side-button) affordances, and swipe gestures.
- Auditing ambient mode transitions and ensuring always-on designs stay within power budgets.
- Deciding which Wear OS surface — tile, app, or notification — is the right home for a given use case.
- Reviewing M3 Expressive typography, color, and shape choices scaled to a 40–50 mm display.

## Core guidance

### Glanceability first

- **Every screen must communicate its primary value in under two seconds without interaction.** Users raise their wrist in motion, in a social context, or under pressure. If the primary information requires scrolling, zooming, or tapping to reveal, the design has failed the glanceability test. Audit every screen by asking: "what does the user know after two seconds?" — if the answer is "not much," consolidate or prioritize.
- **Use a single dominant data point per screen.** A workout screen that simultaneously shows heart rate, pace, distance, elapsed time, and a map gives the user no dominant focal point. Choose one primary metric and treat everything else as secondary. M3 Expressive's large, bold Display and Headline type styles are designed exactly for this role on watch-sized canvases.
- **Reduce text; prefer iconography and numeric values.** Full sentences and long labels fail on a 44 mm circle. Favor icon-plus-number pairings, abbreviated units ("BPM", "km", "min"), and color-coded states over descriptive prose.
- **Avoid information-dense grids.** A layout that tries to show a six-field grid on a round screen will find the outer cells clipped, the text too small to read, and the hierarchy collapsed. Two to three elements in a clear size hierarchy is the upper bound for a single glanceable screen.

### Round-screen layout and safe zones

- **Design within the inset safe zone, not to the physical edge.** The round display clips rectangular content aggressively at the corners. Wear OS defines a safe zone (typically ~5 dp inset from the clipped edge on a round display and a smaller inset on the less-common flat-tire displays). Place any text, icon, or interactive control that must be fully visible inside this zone. ScalingLazyColumn in the Wear Compose library handles this automatically; custom layouts must account for it explicitly.
- **Center the primary content.** The optical center of a round watch face and app screen is the physical center of the circle. Anchor the most important element there and build outward — heavy bottom-loading or top-loading compositions feel visually unbalanced and push content toward the most aggressively clipped zones.
- **Exploit the curved edge for secondary affordances.** Page indicators, scroll position indicators, and animation arcs work naturally along the curve and help users understand their position in a flow without consuming central real estate. The Wear Compose PositionIndicator composable places these at the right-hand edge by convention.
- **Distinguish round and flat-tire screen shapes in your design tokens.** Flat-tire (D-shaped) displays have a slightly truncated bottom; layouts that center-align comfortably on a round watch can clip on flat-tire. Define edge-inset tokens that flex for each shape rather than hard-coding pixel values.

### M3 Expressive type scale on Wear

- **Use the Wear-specific M3 Expressive type scale, not the phone type scale.** Wear OS ships its own type scale with roles tuned for tiny, high-DPI screens viewed at arm's length. Display and Title styles are proportionally larger relative to the screen than their phone equivalents, ensuring the primary data point is legible at a glance. Body and Label styles are used sparingly — only for secondary context that supports the primary value.
- **Prefer short strings, never multi-line body text.** A three-line paragraph on a 44 mm round display is effectively illegible without scrolling. If a message, reminder, or notification requires more than one or two lines of body text, consider whether the watch is the right surface for that content at all — or whether it should link to a paired phone notification.
- **Avoid all-caps for long strings.** All-caps reads slower than mixed case at small sizes. Reserve it for single-word states ("ON", "OFF", "DONE") or units where it is conventional ("BPM", "KM/H").

### Color and surface hierarchy

- **OLED-first dark surfaces are both a design and a power choice.** Most Wear OS devices use OLED or AMOLED displays. Dark backgrounds — especially near-black — allow unlit pixels to save battery, which matters critically on devices charged once a day or less. Default to dark or near-black backgrounds and design light variants only when there is a strong brand reason.
- **Use color purposefully as a status or state signal.** On a tiny screen, color is the fastest pre-attentive signal. A heart rate reading turning red signals a high-intensity zone; a green checkmark signals a completed goal. Reserve color for meaningful state rather than decoration. M3 Expressive's color roles — `primary`, `error`, `tertiary` — map naturally to this use.
- **Limit the palette to two to three active colors per screen.** Multiple competing hues on a 44 mm canvas create visual noise with no hierarchy. A dark background, one primary accent color, and one semantic state color (e.g., error red or success green) is the upper bound for most designs.
- **Tonal elevation works differently on Wear.** The five-level surfaceContainer hierarchy from phone M3 is typically reduced to two or three levels on Wear to preserve contrast on the small canvas. A card or dialog sits clearly above the background without requiring intermediate elevation steps.

### Tiles: the primary glanceable surface

- **Design tiles as informational widgets, not mini apps.** A tile is seen without launching the app — it is the equivalent of a complication on a watch face. It should present the most actionable or time-sensitive information from your app in a compact, non-interactive format (with at most one primary tap target). Tiles that require scrolling or present dense interaction patterns are misusing the surface.
- **Follow the four-tile-layout archetypes: single data point, two-column split, list (up to three rows), and primary action.** Each archetype has a natural shape within the M3 Wear tile design language. Designing outside these archetypes without strong rationale produces layouts that feel inconsistent with the system.
- **Update tiles on a schedule proportionate to data freshness.** A step-count tile that updates every minute wastes battery. A weather tile that updates every 15–30 minutes is appropriate for data that changes on that cadence. Design the update strategy alongside the visual design, not after.
- **Clearly communicate stale data.** If a tile cannot refresh (no network, no data), show the time of last update or a visual stale state rather than silently displaying outdated information. A user acting on a 4-hour-old medication reminder is a safety concern, not just a UX issue.

### App screens: navigation and scroll

- **Prefer vertical scrolling via ScalingLazyColumn over horizontal pagination for content lists.** Vertical scrolling maps to rotary input (crown or bezel rotation) and to natural swipe-up. Horizontal swipe is reserved for navigating between distinct screens (pages) in a flow — mixing scroll directions on a single screen confuses spatial memory.
- **Keep navigation depth shallow — two to three levels maximum.** A deep navigation tree on a watch forces the user to tap repeatedly on a tiny screen under time pressure. If a flow requires more than three taps to complete, it belongs on the phone companion app, not the watch. Design the watch flow as a streamlined subset, not a port of the full phone app.
- **Use confirmation dialogs sparingly.** Destructive or high-stakes actions (delete, end workout, send payment) may warrant a confirmation step. For most actions on Wear, eliminate confirmation dialogs — they double the number of taps and disrupt the glanceability contract. Design for immediate undo (via the back button) instead of pre-action confirmation where possible.
- **Place the primary action in the vertical center or directly accessible from the home state.** On Wear, the center of the screen receives the most reliable touches. Primary actions (CompactChip or Button composables) positioned at mid-screen are reached more easily than those anchored to the top or bottom edge.

### Rotary and physical button input

- **Design every scrollable screen to respond to rotary input.** The rotating crown, bezel, or side-button is Wear OS's primary precision input. Any screen with a scrollable list, a slider, or a picker must respond to rotary events. Never design a scrollable surface and assume only swipe — rotary is often the first interaction a user attempts.
- **Provide rotary affordances for value pickers.** Volume controls, time pickers, and numeric inputs are natural candidates for rotary input. Pair the visual component (a circular slider arc or a number carousel) with a rotary event handler. The visual should animate in direct response to rotation — lag or quantized jumps break the mechanical feel.
- **Assign the hardware button to a contextually meaningful shortcut, not only back.** The physical side button typically triggers the app launcher, but some apps can assign it contextual meaning during active sessions — pausing a workout, snoozing an alarm, triggering an SOS. Design for this affordance explicitly in flows where quick, glove-or-wet-hand input is needed.
- **Swipe-to-dismiss is the system back gesture on Wear OS.** A left-to-right swipe on the screen dismisses the current screen or closes the app. Do not intercept or override this gesture for in-app horizontal navigation — it will break the system back behavior and disorient users. Use vertical or non-directional gestures for in-app controls.

### Ambient mode and always-on design

- **Design an ambient (always-on) variant for any screen that users may leave active.** Watch faces, active workout screens, and turn-by-turn navigation are the primary candidates. Ambient mode must reduce battery draw to a minimum, which imposes hard constraints: no animations, reduced update frequency (typically once per minute), and a dramatically reduced lit pixel count.
- **In ambient mode, use thin outlines, sparse layouts, and minimal lit pixels.** Solid filled shapes and bright backgrounds are the primary battery consumers on OLED. Replace filled buttons with outlined ones, replace color fills with stroke-only indicators, and shift to a grayscale or near-black palette in ambient. The user's eye has adapted to low light; high-contrast simple shapes — a time display, a single metric — are still highly legible.
- **Never animate in ambient mode.** Animated transitions, pulsing effects, and live-updating progress arcs must be disabled when the display enters ambient. Even low-frame-rate animations consume GPU and OLED refresh cycles that matter over hours of continuous display.
- **Design the ambient and interactive states as a matching pair.** A user who glances at the ambient display and then raises their wrist to interact should perceive a smooth logical connection between the two states — same layout region, same primary data, just richer in the interactive state. A dramatic layout change between ambient and interactive breaks spatial continuity.
- **Plan for a one-minute update budget in ambient.** If the primary data changes more frequently than once per minute (e.g., heart rate), decide deliberately whether to freeze the value between updates or show a staleness indicator. Silently showing a one-minute-old reading without marking it may be appropriate for step count but inappropriate for real-time health data during an active session.

### Battery-aware design

- **Treat battery budget as a first-class design constraint, not an engineering afterthought.** Features that look elegant in a Figma file — continuous GPS display, ambient heart-rate animation, full-color always-on — can drain a watch battery in hours. Collaborate with engineers early on power budgets per feature.
- **Default experiences should consume significantly less than premium or active-workout modes.** Design tiered feature sets: a low-power default mode, a normal interactive mode, and an optional high-accuracy or high-refresh mode the user consciously activates. Make the power tradeoff explicit in the UI ("Extended battery mode").
- **Avoid continuous background interactions on the display layer.** Tiles that fetch data every few minutes, wake animations triggered by wrist gestures, and always-on color renders each subtract from the daily battery budget. Evaluate every background visual behavior against the question: "does the user notice this when the watch is on their wrist?"

### Notifications on Wear

- **A Wear notification is a companion to the phone notification, not a duplicate.** Strip the notification to its single most important sentence and one or two quick actions (e.g., Reply, Dismiss, Snooze). Do not push every action from the phone notification to the watch — choose only the most time-sensitive ones that benefit from wrist-level access.
- **Action labels must be extremely short.** "Reply", "Done", "Snooze", "Call" — one or two words that are scannable in the notification band. Long button labels clip immediately and force the user to read rather than recognize.
- **Include inline reply only when voice or canned responses are sufficient.** Wear OS supports voice input and canned-response quick replies. Design the reply flow around these inputs — do not assume users will hand-type on a watch.

## Platform notes

- **Round vs. flat-tire screens:** All layout insets and safe-zone decisions must account for both form factors. The flat-tire's truncated bottom edge clips layouts anchored to the center-bottom. Test both geometries for every screen.
- **Screen size range (40–50 mm case / 384–480 px diameter):** Wear OS devices span roughly 40 mm (smaller / feminine sizing) to 50 mm (larger) case sizes. Design at the smaller size as your baseline — text and touch targets that are legible and reachable at 40 mm will scale up gracefully; the reverse is not true.
- **Display technology:** Nearly all current Wear OS devices use OLED or AMOLED. Design for dark-by-default; assume that bright, fully-lit screens will be conspicuous in low-light social environments and costly in battery.
- **Input modalities by device:** Not all Wear OS devices have a rotating crown bezel. Some use only a flat side button and touch. Design rotary-enhanced interactions as a layered improvement over touch, not as the sole input path for a feature.
- **Companion app relationship:** Wear OS apps nearly always pair with an Android phone app. Design the watch as the glanceable action layer — timely alerts, quick actions, fitness tracking — and the phone as the setup, history, and configuration layer. Avoid reproducing complex settings or detailed history on the watch.

## Pitfalls

- **Porting a phone screen unchanged to Wear.** A phone card or list screen resized to a 44 mm circle will clip text, crowd controls, and offer no glanceability. Wear screens must be purpose-designed from scratch, not adapted.
- **Centering nothing.** A layout where every element hugs an edge leaves the visual center empty and makes the screen feel unanchored. The central zone is the most legible and most-touched area — anchor the primary element there.
- **Exceeding safe-zone boundaries.** Placing interactive controls or critical text in the outer 10% of a round display guarantees clipping on some devices and difficult tap targets near the bezel. Every interactive element must clear the safe-zone inset.
- **Ignoring rotary input.** Designing a scrollable list or a value picker without accounting for crown rotation produces a first interaction that feels broken to watch users.
- **Overriding swipe-to-dismiss.** Capturing the horizontal swipe for in-app navigation removes the system's primary back mechanism and traps the user. Reserve left swipe for the system.
- **Full-color, high-brightness ambient mode.** Bright ambient modes light up the room when the watch is on a bedside table and drain battery in hours. Ambient must be near-black with sparse lit pixels.
- **Deep navigation hierarchies.** Flows requiring four or more taps to complete on a watch belong on the companion phone app. Trim watch flows to their essential subset.
- **Tile designs that scroll.** A tile that requires vertical scrolling to read all its content is an app screen masquerading as a tile. Tiles must communicate in a single glance.
- **No stale-data handling.** Displaying outdated information silently — especially health, safety, or time-sensitive data — is a trust and potentially a safety failure. Always mark or degrade stale states visually.

## References

- **Material 3 Guidelines / Documentation:** [Design for Wear OS](https://developer.android.com/design/ui/wear)
- **Documentation:** [Build Wear OS apps with Compose](https://developer.android.com/training/wearables/compose)

## See also

The m3-typography design skill covers the full M3 Expressive type scale; on Wear the same roles apply at a reduced but proportionally larger scale than phone. The m3-dark-theme design skill explains OLED surface hierarchy and near-black background rationale that underpins Wear's battery-aware color strategy. The m3-accessibility design skill informs minimum touch-target sizing and contrast requirements that apply with even less margin for error on a 44 mm canvas. For navigation pattern decisions — when the watch flow should defer to the phone companion app — see the m3-navigation design skill. All Wear OS implementation work — ScalingLazyColumn, PositionIndicator, CompactChip, rotary event handling, tile layout builders, and ambient mode lifecycle — belongs in the wear-compose code skill; hand every implementation question there.
