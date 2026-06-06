---
name: m3-tv
description: "Design-critique and judgment guidance for Android TV: the 10-foot UI, D-pad focus navigation, browse and immersive-detail layout patterns, overscan-safe composition, and legibility at distance. Use when designing or reviewing an Android TV app screen, evaluating whether focus movement is logical and predictable across a D-pad, critiquing text sizes and contrast for a 10-foot viewing distance, assessing overscan margin compliance, or deciding between a browse row layout and an immersive full-screen detail experience."
---

## When to use

Reach for this skill when designing or critiquing any Android TV screen — home rows, content-detail pages, media playback surfaces, onboarding flows, or settings panels. It applies any time the display is a television, the primary input is a D-pad or remote control, and the viewer is seated roughly three meters from the screen. Use it to evaluate whether focus behavior is predictable and complete, whether type and icons are legible at a distance, whether layout respects overscan margins, and whether the app's browse-to-detail information architecture is clear. Hand implementation of the resulting composable tree to the tv-compose code skill.

## Core guidance

### The 10-foot principle

- **Design for a viewer, not a toucher.** Android TV users lean back, hold a remote, and navigate by pressing directional buttons. There is no pointer, no hover, no drag, and no pinch-to-zoom. Every interaction must be reachable and reversible by four directional keys plus Select, Back, and Home. If an action cannot be triggered without a pointer, it does not belong on a TV screen.
- **Make the currently focused element instantly obvious.** Focus is the TV equivalent of a cursor. At three meters, a subtle border or a mild tint change is invisible. The focused state must be bold — a pronounced scale change (typically 1.1× or larger), a high-contrast outline, an elevation shift, or a luminous halo — so the viewer's eye lands on it without effort. Never rely solely on color to distinguish focused from unfocused states.
- **Treat every interactive element as requiring a discrete focus stop.** If a card, button, or menu item exists, the D-pad must be able to reach it. Items that cannot receive focus are effectively invisible to non-pointer users. Audit every screen by tracing all reachable focus stops before shipping.
- **Expose all primary actions within one or two D-pad presses from the focused content.** Deep action hierarchies that require opening menus to reach common operations (play, add to watchlist, more info) frustrate the lean-back experience. Surface the two or three most frequent actions directly on the content card or beside the detail hero.

### D-pad navigation and focus order

- **Focus movement must follow the visual layout, not the DOM order.** When the user presses right, the focus should move to the element that appears visually to the right. Counterintuitive focus jumps — especially lateral jumps that skip elements or vertical drops that land on a distant row — break the user's spatial model and are the most common cause of TV UX failures.
- **Never leave a directional keypress unhandled if there is an element in that direction.** A D-pad press that does nothing feels like a broken remote. If no element exists in the pressed direction, confirm there genuinely is no content there and that the boundary makes visual sense. Edges of the screen are natural stopping points; edges in the middle of content regions are not.
- **Keep row-and-column navigation predictable.** The canonical browse pattern — horizontal rows of cards, scrollable vertically — succeeds because the mental model is simple: press left or right to browse within a row, press up or down to move between rows. Do not introduce diagonal focus paths, floating panels that intercept D-pad, or split-plane layouts where vertical movement jumps between columns unexpectedly.
- **Restore focus to its prior position when returning from a detail or a dialog.** A user who pressed Select on the third card in a row should find that card still focused when they press Back from the detail screen. Losing focus position forces the user to re-navigate from the beginning and destroys spatial memory.
- **Design explicit focus traps for modals and overlays.** When a dialog, options panel, or overlay appears, focus must move into it and must not leak back to the content behind it. The Back key closes the overlay and returns focus to the element that triggered it. An overlay that allows D-pad presses to reach content beneath it is both confusing and a potential unintended action.

### Browse and immersive-detail patterns

- **Use a horizontal-row browse layout as the default information architecture for content-heavy apps.** Rows of horizontally scrolling cards — analogous to a streaming home screen — give users a scannable overview of content categories without requiring them to leave the screen. Each row should have a clear label (a header text set in a prominent but compact type role) and a consistent card aspect ratio within the row.
- **Differentiate card aspect ratios by content type, and keep them consistent within a category.** Landscape 16:9 cards for movies and episodes, portrait 2:3 cards for books or albums, and square cards for music artists each communicate the content type implicitly. Mixing aspect ratios within a single row creates visual noise and makes the focused card harder to identify.
- **Use an immersive full-screen detail layout for individual content items.** When the user selects a card, the detail screen should fill the display with a large hero image or video, overlay action buttons (play, resume, add to list), and surface supplementary metadata beneath or alongside the hero. The goal is to make the content feel cinematic and primary, not to reproduce a phone-style scrollable article page.
- **Limit the detail screen to the two or three most important actions in the primary action area.** Additional actions (share, rate, more info) may live in a secondary actions row beneath the primary ones. Do not crowd the hero area with more than three prominent buttons; the focused state must remain clearly distinct when multiple large buttons are adjacent.
- **Provide a top-level navigation drawer or sidebar that is accessible from any screen.** Users need a reliable way to navigate between sections (Home, Search, My Library, Settings) without repeatedly pressing Back. A navigation rail or left-edge drawer that opens with a left D-pad press from the leftmost content, and closes with a right press or Back, is the standard pattern for top-level wayfinding.

### Overscan-safe layout and composition

- **Respect the overscan-safe area with a minimum 48dp margin on all four edges.** Older televisions and some display configurations physically clip content at the screen edges. Even on modern displays, content that bleeds to the physical edge feels uncomfortably tight. Material 3 TV guidance recommends a 48dp minimum safe margin; in practice 56–64dp is more comfortable for body content. Text, interactive controls, and card edges must not enter this margin.
- **Background artwork and hero images may bleed to the true screen edge.** Full-bleed background imagery is a deliberate design choice for immersive TV layouts. The content that must stay within the safe margin is the interactive and readable layer — titles, buttons, metadata, navigation labels — not atmospheric background visuals.
- **Do not place the navigation rail or app chrome flush with the screen edge.** The leftmost edge of a navigation rail label or icon must clear the overscan margin. This is a frequent oversight when adapting a tablet navigation rail directly to TV.

### Legibility at distance

- **Use display-scale type for titles and hero text.** At three meters, body text from a phone or tablet spec is too small to read comfortably. TV-appropriate type sizes start at 24sp for supporting metadata and go to 48sp or larger for hero titles. The Leanback support library's default type scale provides a reasonable baseline; do not shrink below it.
- **Prefer bold or medium font weights for titles.** At distance, regular-weight text at smaller sizes disappears into the background. Titles and primary labels should use medium or bold weight to maintain stroke contrast against complex background imagery.
- **Ensure text-on-image meets a 4.5:1 minimum contrast ratio under real content.** Hero images on TV backgrounds are dynamic — a light image under light text will fail. Use a semi-transparent scrim or gradient beneath any text overlaying artwork, and verify the contrast with the lightest credible background, not just the design mockup's background.
- **Make card titles readable in the unfocused state.** Cards in a browse row must have legible titles before they are focused. If a title is only revealed on focus (e.g., inside a focus animation that scales the card up), users cannot scan the row without arrowing through every card. At minimum, show a truncated title beneath every card at rest.
- **Avoid fine visual details that are invisible at distance.** Hairline borders, 1dp dividers, fine iconography at 16dp or below, and small badge text are too detailed for a 10-foot experience. Every visible design element should be resolvable from the intended viewing distance without squinting.

### Focus state design

- **The focused card should scale up, not just change color.** A 1.1× scale transform combined with an elevation lift and an M3 color-system highlight creates a clear, multi-dimensional focus signal that works on varied backgrounds. Systems that rely on a single visual attribute (color only, border only, or scale only) can fail against certain background colors or ambient conditions.
- **Animation between focus states should be fast but perceptible.** A 150–200ms ease-out for the scale and elevation change gives the transition a natural feel without making navigation feel sluggish. Instant focus transitions can feel jarring; transitions longer than 250ms make D-pad navigation feel unresponsive.
- **Unfocused cards should not appear disabled.** Reduce opacity of unfocused items only modestly (to no less than 0.7–0.8 alpha) to preserve a legible browse experience. A deeply dimmed unfocused state makes the row appear inactive and discourages exploration.

## Platform notes

- **Android TV vs. Google TV:** Google TV (the launcher that ships on most current devices) places the app in a window within its home experience rather than owning the full display. Design the app's internal navigation and layout for the full-screen context; the Google TV launcher handles the surrounding shell. Focus behavior and overscan rules are the same on both platforms.
- **Remote controls vary by manufacturer.** Some remotes include a touchpad or directional pointer; most do not. Design for D-pad only as the baseline and treat pointer input as an optional enhancement. Never require pointer precision for a core user journey.
- **Game controllers are a valid input method.** The left analog stick and D-pad on a connected controller must replicate D-pad behavior. Avoid designing interactions that only work with the remote's unique keys (e.g., a color button on the remote) without a secondary path reachable from a standard controller.
- **Audio-only environments are real.** Some users have the TV audio on but are not looking at the screen during browse. Design visual feedback that does not rely on sound, and do not use audio cues as the primary signal for focus changes or action confirmations.
- **Landscape is the only orientation.** Android TV displays are always landscape. There is no portrait mode, no rotation, and no need to design for anything other than a 16:9 or similar widescreen aspect ratio. All layout work happens within this fixed orientation.

## Pitfalls

- **Adapting a phone or tablet layout directly to TV.** Small touch targets, dense lists with 48dp row heights, and navigation patterns that rely on swipes or long-presses produce TV screens that look wrong, feel cluttered, and cannot be navigated by D-pad. TV design must be authored for TV from the start, not retrofitted.
- **Assuming focus order follows source order.** Compose and View-based layouts do not automatically route D-pad focus along the visual path. Without explicit focus traversal configuration (via `FocusRequester`, `focusProperties`, or Leanback's `FocusHighlight` equivalents), focus can jump unpredictably across the screen.
- **Forgetting to handle the Back key at every screen depth.** TV users rely on Back as their primary escape mechanism. A screen with no defined Back behavior is a dead end. Every modal, overlay, sidebar, and detail screen must return focus to a sensible prior location on Back press.
- **Placing interactive elements inside the overscan margin.** Buttons or card edges that are partially clipped on older screens are untappable and unreadable. Audit every screen at the minimum safe margins before sign-off.
- **Relying on hover-reveal patterns.** TV has no hover state. Information or actions that appear only on hover — a play button that appears when a cursor rests on a card — must be made persistently visible or triggered by focus instead.
- **Using type sizes from the phone M3 scale without adjustment.** displaySmall (36sp) is the practical floor for hero titles on TV; bodyLarge (16sp) is too small for comfortable reading at three meters. Every type decision must be validated at the actual viewing distance with the actual display.
- **Designing an empty detail pane default.** When a user enters a browse screen or a list-detail layout, a content item should be pre-selected or a meaningful placeholder should appear in the detail area. A blank right half of the screen on a TV feels unfinished and wastes the display.
- **Neglecting search UX.** TV search requires navigating to an on-screen keyboard via D-pad, which is slow. Provide voice search as a primary input method (accessible via a dedicated button in the navigation chrome) and design the search results page to be D-pad browsable in the same row-based format as the main browse screen.

## References

- **Material 3 Guidelines / Documentation:** [Design for Android TV](https://developer.android.com/design/ui/tv)
- **Documentation:** [Building TV apps](https://developer.android.com/training/tv)

## See also

For the foundational adaptive layout breakpoints and multi-pane patterns that inform how a TV app structures its information architecture, see the m3-adaptive-layout and m3-canonical-layouts design skills — while TV does not use the standard window-size-class breakpoints, the browse-and-detail pane concept is directly analogous to the list-detail canonical layout. For focus-state visual design — the scale, elevation, and color-system tokens that power the highlighted focused card — see the m3-interaction-states design skill. For type scale decisions and contrasting text against background imagery, see the m3-typography design skill. All Compose for TV composable wiring — `TvLazyRow`, `TvLazyColumn`, `ImmersiveList`, `NavigationDrawer`, `FocusRequester`, and Leanback interop — belongs in the tv-compose code skill.
