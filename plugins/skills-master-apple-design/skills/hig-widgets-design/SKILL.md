---
name: hig-widgets-design
description: "Design-review guidance for widgets on Apple platforms per the Human Interface Guidelines. Use when designing, auditing, or critiquing Home Screen, Lock Screen, StandBy, Smart Stack, or desktop widgets, choosing what content is glanceable, supporting multiple sizes (small, medium, large, extra large), ensuring legibility in accented and tinted rendering with Liquid Glass, planning tap targets and deep links, or tuning personalization. Produces UX critique and recommendations grounded in the HIG, not code. Triggers: widget design review, glanceability, widget sizes, Lock Screen widget, StandBy, Smart Stack, accented/tinted widget, deep link vs interactive, widget legibility."
---

# hig-widgets-design

## When to use

Use this skill to critique or design a widget: what single idea it surfaces, how
it reads at a glance, how it adapts across sizes and contexts (Home Screen, Lock
Screen, StandBy, Smart Stack, Mac desktop), how it stays legible in accented and
tinted appearances, and how taps map to deep links or lightweight interactions.
Reach for it during a widget design review, when a widget feels busy or
illegible, when deciding which sizes to ship, or when picking what a tap should
do. This skill produces design judgment and recommendations, not implementation.

## Core guidance

- **Surface one focused idea, glanceably.** A widget is a window into the app's
  most useful, timely content for this person right now — not a launcher or a
  mini app. Decide the single thing it answers ("next event," "today's rings,"
  "remaining balance") and design everything else in support. If a person has to
  study it, it is doing too much.
- **Earn every size; never just upscale.** Offer the sizes that genuinely add
  value, and give each its own composition. Small shows one glanceable fact and
  acts as a single deep link; medium and large can show more, group related
  items, and offer multiple tap targets. Don't pad a small layout to fill large,
  or cram a large layout into small.
- **Design for personalization and legibility first.** Widgets render in
  full-color, accented, and tinted appearances and sit on Liquid Glass with the
  person's own wallpaper behind. Verify contrast in every mode, mark only the
  elements that should carry the tint as accentable, and don't bake text into
  images — it breaks in accented/tinted rendering and at small sizes.
- **Keep content fresh and honest about time.** Show current information and,
  where relevant, when it was last updated; never present stale data as live.
  Prefer concise numbers, short labels, and SF Symbols over dense paragraphs so
  the widget reads in a literal glance.
- **Make taps purposeful with real deep links.** Every tappable region should
  land the person on the exact, relevant screen — not the app's home. Keep tap
  targets at least 44x44 pt, space them so neighbors aren't hit by accident, and
  reserve a clear region; on small widgets the whole surface is one link.
- **Add interactivity only for quick, in-place actions.** Use interactive
  controls (toggle, check off, play/pause) when the action is fast and the
  result is visible in the widget; anything requiring focus, text entry, or
  navigation should deep link into the app instead.
- **Respect the context's distance and glance budget.** StandBy is viewed across
  a room while charging on its side, so favor large type, high contrast, and
  minimal detail; Smart Stack and the Lock Screen are quick raises, not reading
  sessions. Tune density to how far away and how briefly the widget is seen.
- **Stay quiet and consistent with the system.** Match system margins, corner
  treatment, and material; let the platform draw the container. Don't add heavy
  custom chrome, faux depth, or app branding that competes with content — the
  widget should feel native to the Home Screen, not like an embedded ad.

## Platform notes

- **iOS:** Widgets live on the Home Screen, Lock Screen, StandBy, and the Smart
  Stack. Lock Screen widgets are small, monochrome, and information-dense in a
  tiny footprint — design them as compact glyph-plus-value units. StandBy
  prioritizes distance legibility; assume it's seen from a nightstand.
- **iPadOS:** Larger canvas and Lock Screen widgets too; extra-large sizes suit
  richer summaries, but keep the single-focus discipline and don't treat the
  extra room as license for clutter.
- **macOS:** Widgets appear on the desktop and in Notification Center and adopt a
  subtler, recede-into-the-wallpaper treatment when the desktop is in use.
  Design for a calm desktop presence, not a foreground alert.
- **watchOS:** Widgets surface in the Smart Stack and must read in a sub-second
  glance on a raised wrist — one metric, strong contrast, generous type, minimal
  ornament. Relevance and timeliness matter more than breadth.
- **All platforms:** The single-focus, legibility-in-all-appearances, real-time,
  and deep-link principles are constant. Adapt composition and density to the
  surface; never ship one layout everywhere.

## Pitfalls

- Treating a widget as a launcher or a shrunken screen instead of a glanceable view.
- Baking text into images, so content vanishes or smears in accented/tinted modes.
- One layout stretched across sizes, with empty large widgets and crowded small ones.
- Taps that all open the app's home screen instead of the relevant content.
- Stale data presented as current, with no sense of when it last refreshed.
- Heavy custom chrome, drop shadows, or branding that fights the system container.
- StandBy or watch widgets packed with detail no one can read at a glance.

## References

- **Human Interface Guidelines:** [Widgets](https://developer.apple.com/design/human-interface-guidelines/widgets)
- **Human Interface Guidelines:** [Live Activities](https://developer.apple.com/design/human-interface-guidelines/live-activities)
- **WWDC:** [Principles of great widgets (WWDC21)](https://developer.apple.com/videos/play/wwdc2021/10048/)
- **WWDC:** [Bring widgets to new places (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10027/)
- **WWDC:** [Bring widgets to life (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10028/)
- **Documentation:** [Optimizing your widget for accented rendering mode and Liquid Glass](https://developer.apple.com/documentation/WidgetKit/optimizing-your-widget-for-accented-rendering-mode-and-liquid-glass)

## See also

- The WidgetKit code skill that implements widget timelines, supported families,
  accented/tinted rendering, interactive controls, and deep links.
- A SwiftUI layout-and-views design skill for composing legible, adaptive widget
  content that survives every size and appearance.
- The materials and Liquid Glass foundations skill for how widgets sit on glass
  and stay legible over a person's wallpaper.
- A Live Activities and Dynamic Island design skill for ongoing, time-bound
  updates that complement (rather than duplicate) a glanceable widget.
- The SF Symbols and typography foundations skill for choosing glyphs and type
  that read at a glance and in monochrome Lock Screen contexts.
