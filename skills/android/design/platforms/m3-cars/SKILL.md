---
name: m3-cars
description: "Design guidance and critique for Android Auto and Automotive OS in-vehicle UIs — distraction-optimized templates, voice-first interaction, large touch targets, driving vs parked experiences, and platform differences. Use when designing, reviewing, or critiquing a car app UI, evaluating whether a flow is safe for eyes-on-road operation, choosing between Auto and Automotive OS templates, or deciding which interactions require parked mode."
tags: [m3, design, cars, android-auto, automotive-os]
x-skills-master:
  domain: android
  class: design
  category: platforms
  platforms: ["android-auto", "automotive-os"]
  pairs_with: [car-app-library]
  sources:
    - https://developer.android.com/design/ui/cars
    - https://developer.android.com/training/cars
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

- Designing any in-vehicle UI for Android Auto or Automotive OS, whether navigation, media, messaging, or point-of-interest apps.
- Evaluating whether a proposed screen, flow, or interaction is safe for use while driving, or whether it should be restricted to parked mode.
- Deciding between Android Auto (phone-projection) and Automotive OS (native, embedded) as target platforms and understanding how that choice shapes design constraints.
- Auditing touch target sizes, content density, and glance-readability of a car UI before developer handoff.
- Determining which templates are appropriate for a given app category and why freeform layout is not available while the vehicle is in motion.

## Core guidance

### Template-first design: accept the constraint, shape the content

- **Design within Car App Library templates, not around them.** The template system — ListTemplate, PlaceListMapTemplate, MessageTemplate, GridTemplate, NavigationTemplate, and others — exists to enforce distraction guidelines that vary by region and OEM. Unlike phone design, you cannot freely arrange UI components on the screen. Your design work is choosing the right template for each screen and then crafting the content, labels, icons, and actions that populate it.
- **Use the fewest templates per flow that still accomplish the task.** The Car App Library imposes step limits per interaction (typically four steps back to the root, with exceptions). Design flows that reach the user's goal in two or three screens whenever possible. Resist the instinct to add confirmation screens, filter pages, or detail overlays that would fit naturally on phone but exceed driving-safe step counts.
- **Reserve GridTemplate for browsable category entry-points, not for detail or action screens.** Grids work well for music genres, POI categories, or contact group lists where the user is identifying an area of interest. They perform poorly when each item requires reading to distinguish — use ListTemplate with subtitles and secondary actions for those cases.
- **Treat the content area as scannable, not readable.** A driver glancing at the screen for one to two seconds should be able to identify their target without reading. Use short primary labels (under four words where practical), clear icons that reinforce the label meaning, and avoid metadata-heavy subtitles for items that will be tapped in motion.

### Voice-first interaction

- **Design every critical task to be completable by voice without looking at the screen.** Voice queries, navigation commands, media playback controls, and message replies should be expressible in natural language. Treat the visual UI as confirmation and disambiguation, not as the primary input channel.
- **Pair every interactive action with a voice shortcut where the Car App Library supports it.** Semantic actions (play, call, navigate to) that the platform can fulfil via voice should not require the user to tap. Design the visual affordance as a fallback, not the canonical path.
- **Design voice error states that are minimal and non-distracting.** When voice recognition fails or a query is ambiguous, the screen should show a short disambiguation list or a brief error notice — never a full-page error flow requiring reading. Keep fallback text under ten words.
- **Avoid interactions that require precise voice dictation while driving.** Composing a free-text message, entering a search query character by character, or spelling a destination are all high-cognitive-load tasks. Default to reply suggestions, smart reply lists, and recent-destination lists to reduce dictation requirements.

### Touch targets and visual hierarchy

- **Use only the touch target sizes mandated by the platform template.** Car App Library templates render list rows, grid cells, and action buttons at sizes calibrated for OEM hardware with gloves. Do not request smaller items, denser grids, or custom compact layouts — they will not be approved by Google's review process and undermine safety.
- **Limit the number of primary actions visible at any one time to two or three.** When a screen offers many actions, the driver must scan and choose under time pressure. Templates constrain this by design — respect the action limits rather than trying to surface secondary actions as primary ones.
- **Apply strong visual contrast between interactive and non-interactive elements.** In a car environment, ambient light varies from direct sunlight to night driving. Active controls must be clearly distinguishable from labels and status text even in high-glare conditions. Use filled action buttons and clear icon affordances; avoid subtle ghost buttons or icon-only controls without a visible tap area.
- **Ensure icons are instantly recognizable at arm's length.** Car screens may be eight to twelve inches from the driver. Icons should use simple, solid shapes drawn at 24 dp or larger filled equivalents — outline icons and detailed glyphs lose fidelity at distance. Use system icons from the Car App Library's approved set before introducing custom icons.

### Driving vs parked experiences

- **Categorize every feature as driving-safe, driving-accessible, or park-only before designing the flow.** Driving-safe features are those executable by voice or a single tap with no reading required. Driving-accessible features require one to two taps and minimal reading. Park-only features — account setup, preference editing, complex search, map drawing — must be blocked or deferred when the vehicle is in motion.
- **Design the parked-mode entry point as a natural continuation, not a mode switch.** When the vehicle stops, additional content or settings can surface without jarring the user. Use progressive disclosure: show the essential driving-safe UI always, and reveal richer controls or longer lists only in parked state.
- **Never design misleading disabled states for parked-only features.** If a feature is unavailable while driving, either hide it entirely from the template or show a clear "available when parked" label. Showing a greyed-out button with no explanation causes confusion and tempts the driver to investigate why it is inactive.
- **Test the transition both ways.** Verify that the UI gracefully degrades back to the driving-safe state when the vehicle starts moving again. Features that linger past the safe threshold — such as a long-form settings form staying visible — are a safety risk and a platform violation.

### Android Auto vs Automotive OS differences

- **On Android Auto, your UI runs projected from the user's phone.** The host app on the phone renders into the Auto template shell. Design cannot assume persistent background state or always-on connectivity — the phone may lose signal or the connection may drop. Flows must tolerate interrupted sessions and restart cleanly.
- **On Automotive OS, your app runs natively on the embedded system.** The app can persist state across sessions, access vehicle sensors directly, and use a larger, more capable display. Design can lean into always-on experiences, ambient now-playing screens, and home-screen widgets — none of which are available on Auto.
- **Design for the display aspect ratio and resolution of the target vehicle, not of a phone screen.** Automotive OS displays are typically landscape, ranging from 8-inch HD panels to 15-inch+ 4K screens. Android Auto projects to a fixed template shell whose dimensions are controlled by the head unit manufacturer. Do not assume your designs will be cropped or letterboxed the same way on every head unit.
- **The color scheme and typography in Auto are controlled by the head unit, not your app.** Your content populates the template, but colors, font rendering, and day/night switching are applied by the host. Automotive OS grants more theming latitude, but OEM customization still restricts what Material 3 color roles your app can override. Design with conservative palette assumptions and verify against actual head unit renderings.
- **Map and navigation overlays behave differently across platforms.** On Auto, the NavigationTemplate hands control of the map surface to a navigation app and only allows a narrow action strip for your app. On Automotive OS, split-screen or overlay arrangements may be possible depending on OEM configuration. Design navigation-adjacent features expecting the most constrained arrangement and treat wider layouts as progressive enhancements.

### Information architecture in a vehicle context

- **Flatten hierarchies to match the step limit.** Information architectures designed for phone — with category pages, sub-category pages, filter pages, and detail pages — must be collapsed for car. Reconsider whether filters, sorts, and search are driving-safe; if not, offer a small set of curated lists rather than freeform exploration.
- **Surface the user's most likely action first, without requiring navigation.** Use recents, recommendations, and smart defaults to frontload common tasks. A media app should default to the most recently played; a navigation app should offer frequent destinations on the first screen. Reducing the taps-to-action is the car-specific analogue of conversion optimization.
- **Limit list length while driving.** Long scrollable lists require visual scanning that is unsafe in motion. Design lists that surface the top five to eight relevant items for driving contexts. Offer "see more" as a park-only entry point rather than an infinitely scrollable screen.

## Platform notes

- **Android Auto (phone projection):** Display size and resolution are determined by the head unit and are outside your control. Templates are strictly enforced; any deviation from supported template types causes the app to fail Auto review. Day and night mode switching is automatic. App color theming is minimal — the shell chrome is owned by the host.
- **Automotive OS (embedded native):** Larger, higher-resolution displays are common. More theming latitude exists, but OEM overlays still apply. System-level widgets, background services, and ambient mode screens are available. Vehicle API access (fuel level, range, speed) can inform the UI but must be used responsibly — displaying speed prominently while driving can distract.
- **Regional distraction guidelines vary.** Europe, North America, and other markets each have regulatory frameworks governing what content may appear on a moving vehicle's screen. The Car App Library enforces a baseline, but some regions require stricter limits. Verify your design against the most restrictive target market.
- **Day/night mode is system-controlled.** Design both light (day) and dark (night) versions of all content. The switch happens automatically based on vehicle light sensors and cannot be overridden by the app. Ensure icon fills and label contrast meet minimum thresholds in both modes independently.

## Pitfalls

- **Designing phone flows and adapting them to car** — the template constraints expose this approach immediately; start from the task and the template, then design the content, rather than adapting an existing phone IA.
- **Exceeding the template step limit** — confirmation screens, intermediate filter pages, and nested detail views that feel essential on phone become safety violations in the car context; collapse them aggressively.
- **Ignoring voice as a primary modality** — an app designed only for touch is incomplete; every core user goal must have a voice path, even if the visual UI exists for confirmation.
- **Using icon-only action buttons without size enforcement** — custom compact icon buttons that feel elegant on phone will be unreadable and untappable in a car; rely on the template's action strip and its enforced sizing.
- **Assuming parked-mode features are always available** — park detection can be unreliable or absent on some head units; never design a flow that assumes the vehicle will stop before the user reaches a critical action.
- **Treating Android Auto and Automotive OS as identical targets** — projection versus native execution, display sizing, theming latitude, and available platform APIs differ substantially; a single design does not serve both without explicit adaptation.
- **Surfacing raw data streams as UI elements** — vehicle sensor data (speed, fuel, range) must be presented with care; displaying distracting or alarming values prominently while driving shifts driver attention away from the road.
- **Neglecting day/night contrast** — a color scheme that passes contrast checks in one mode may fail in the other; verify both independently rather than assuming system mode-switching is sufficient.

## References

- **Material 3 Guidelines / Documentation:** [Designing for Cars — Android Design](https://developer.android.com/design/ui/cars)
- **Documentation:** [Build Car Apps — Android Training](https://developer.android.com/training/cars)

## See also

The m3-adaptive-layout design skill covers responsive layout principles for screens of varying sizes and densities, which inform how content is structured within Automotive OS's larger displays. The m3-accessibility design skill provides contrast, target size, and legibility guidance that is foundational to distraction-optimized car UI. The m3-navigation design skill addresses information architecture patterns — understanding how deep hierarchies are structured on phone clarifies why they must be collapsed for vehicle contexts. For implementation, hand all Car App Library template wiring, voice action registration, and parked-mode detection to the car-app-library code skill rather than attempting to address those in design documentation.
