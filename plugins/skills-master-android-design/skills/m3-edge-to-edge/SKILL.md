---
name: m3-edge-to-edge
description: Design guidance and critique for edge-to-edge Android UI — drawing content behind the system bars, safe-area and inset handling, transparent system bars and scrims, keyboard (IME) avoidance, and immersive layouts. Use when designing or reviewing a screen that draws under the status and navigation bars, deciding how content and controls respect insets, or adopting the edge-to-edge enforcement on Android 15 and later.
---

## When to use

Use this skill when designing or critiquing how a screen relates to the system bars and the keyboard — whether content should scroll behind the status and navigation bars, how toolbars and bottom actions stay clear of system UI, how lists avoid being clipped, and how the layout reflows when the IME appears. It applies to every screen now that Android 15 and later enforce edge-to-edge by default, so treating bars as opaque chrome is no longer an option. This is design judgment; name the inset APIs in prose and hand the implementation to the `compose-window-insets` code skill.

## Core guidance

- **Design behind the bars, not around them.** Content surfaces, backgrounds, and scrolling lists should extend to the physical edges of the display and pass beneath the status and navigation bars. The bars become a translucent overlay on your content rather than a separate band the app must avoid, which makes the app feel larger and more immersive.
- **Keep interactive and critical content inside the safe areas.** Drawing *behind* the bars is for backgrounds and scrollable content — never for buttons, text the user must read, or anything tappable. Apply system-bar and display-cutout insets as padding to interactive elements so a FAB, bottom button, or toolbar action never sits under the gesture handle or a notch.
- **Let scaffolding consume insets once.** A single top-level `Scaffold` (or equivalent) should apply the system-bar insets to its bars and pass the remaining content insets inward. Double-applying insets — padding both the scaffold and an inner container — produces a visible gap; forgetting them entirely clips content. Decide one owner per inset.
- **Make system bars transparent and let content show through.** Prefer fully transparent status and navigation bars so your content defines the color. When content behind a bar would harm legibility of the bar's icons, use a subtle system-applied scrim or a translucent gradient rather than a solid bar color, and ensure the bar icon contrast (light vs dark icons) matches the content beneath.
- **Handle the keyboard as an inset, not a resize hack.** When the IME appears, the focused field and the primary action should animate up with it using the IME inset, staying visible above the keyboard. Avoid layouts that get hidden behind the keyboard or that jump abruptly; the keyboard should feel like it pushes content, smoothly and in sync.
- **Respect gesture navigation.** With gesture navigation the bottom inset is small but the gesture area is live. Keep bottom-anchored controls above the navigation-bar inset, and avoid placing horizontally-swipeable elements (carousels, sliders) in the back-gesture edge zones where they will conflict.
- **Test across bar configurations.** The same screen must hold up under 3-button navigation (a taller bottom bar), gesture navigation (a thin bar), a notch or punch-hole cutout, landscape (side cutouts and bars), and large-screen/foldable widths. A layout that only looks right on one device is not edge-to-edge done.

## Platform notes

- **Android 15+ (API 35) enforces edge-to-edge** for apps targeting that level — the system no longer reserves space for the bars, so any screen that assumed opaque bars must be audited. Treat this as the default rather than an opt-in.
- **Large screens and foldables:** insets differ per display and can change on fold/unfold and window resize; the layout must recompute rather than cache a one-time value. Side panes each manage their own content insets.
- **Cutouts:** in landscape, display cutouts intrude from the side; keep text and controls clear of the cutout safe area, while letting immersive media extend into it when appropriate.

## Pitfalls

- **Leaving a solid-colored status or navigation bar** so content stops at a band instead of flowing edge to edge — the most common sign edge-to-edge was not adopted.
- **Placing a button, FAB, or bottom bar under the gesture handle or notch** because system-bar insets were not applied to the interactive layer.
- **Double-padding insets** (scaffold plus inner content) leaving an empty strip, or consuming insets too early so nested content is clipped.
- **Content hidden behind the keyboard** because the IME inset is ignored, or janky non-animated jumps when it opens and closes.
- **Light bar icons over light content** (or the reverse) making the clock and battery unreadable because icon contrast was not matched to what scrolls beneath.
- **Testing only on one navigation mode** and shipping a layout that breaks under 3-button navigation or with a cutout.

## References

- **Documentation:** [Display content edge-to-edge](https://developer.android.com/develop/ui/views/layout/edge-to-edge)
- **Documentation:** [Window insets in Compose](https://developer.android.com/develop/ui/compose/layouts/insets)
- **Documentation:** [Android 15 behavior changes](https://developer.android.com/about/versions/15/behavior-changes-15)

## See also

The `compose-window-insets` code skill implements this guidance with `enableEdgeToEdge`, `WindowInsets`, and the inset-aware modifiers. See `m3-large-screens` for adapting these decisions across window sizes and foldable postures, `m3-layout-spacing` for the spacing system that interacts with insets, and the `edge-to-edge-compat` lang-tooling skill for the API-level behavior changes that make edge-to-edge mandatory.
