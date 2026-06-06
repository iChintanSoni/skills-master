---
name: m3-splash-screen
description: "Design-critique guidance for Android splash screens under the Material 3 SplashScreen API: icon sizing, branding, background color, animated icon options, and avoiding legacy custom splash Activities. Use when reviewing or designing an Android app's launch experience; when deciding whether to add an animated icon; when choosing background color and icon treatment; when auditing for compliance with the system splash-screen contract; or when determining whether a splash screen adds value or just delays the user."
---

## When to use

- Reviewing or designing the launch experience for a new or existing Android app.
- Deciding whether to use a static adaptive icon, a branded icon, or an animated icon on the splash screen.
- Choosing the window background color, icon size, and icon background treatment.
- Auditing an app that still ships a legacy custom splash `Activity` and needs migration to the system API.
- Judging whether animation duration, complexity, or additional branding elements create delay rather than delight.
- Adapting the splash screen for large-screen form factors such as tablets and foldables.

## Core guidance

- **Let the system own the splash screen.** Android 12 and later draw the splash window automatically using the app's adaptive icon and theme colors; this guarantees a consistent, predictable launch experience across all apps. Attempting to replicate this with a custom `Activity` or a `WindowSplashScreenAnimatedIcon` workaround produces visual seams and extra latency.
- **Keep it brief — the splash screen is not a loading screen.** The purpose of the splash screen is to give the user immediate feedback that the app is launching, not to display content or acquire resources. If initialization genuinely takes time, move that work to a dedicated loading state inside the first destination, not the splash window.
- **Design the adaptive icon as the primary brand mark.** The system centers the adaptive icon in a 1:1 circle on a solid background. The icon artwork should already carry brand recognition on its own; do not treat the splash screen as a separate canvas for wordmarks, taglines, or illustrations that do not exist in the icon.
- **Choose a background color that harmonizes with the icon.** The `windowSplashScreenBackground` attribute accepts a single solid color. Match it to the icon's dominant color or to the app's `colorSurface` or `colorPrimary` so the transition into the first screen feels continuous rather than jarring. Avoid near-white or near-black backgrounds that make the icon disappear against the system status bar treatment.
- **Use the icon background circle sparingly.** The system draws an optional colored circle behind the icon when `windowSplashScreenIconBackgroundColor` is set. This is appropriate when the adaptive icon's foreground artwork was designed assuming a contrasting background — for example, a white glyph on a dark circle — but it adds a nested-circle aesthetic that can feel heavy. Prefer designing the adaptive icon foreground so it reads directly on the splash background without needing the secondary circle.
- **Animated icons should last no longer than 1 000 ms.** The system trims animated `Drawable` playback to a maximum of one second before dismissing the splash window. Design the animation to complete and settle cleanly within that window; an animation that appears cut off suggests the launch experience was not designed for the platform contract.
- **Prefer purposeful, simple animation over decorative motion.** A brief icon morph, a reveal, or a single-axis rotation that reflects the app's character is appropriate. Looping spinners, particle effects, or frame-by-frame character animations are too complex for the half-second or less of real launch time most cold starts occupy.
- **Do not recreate a branded splash screen that delays app content.** Displaying your logo for two or three seconds — common in legacy apps — trains users to expect a wait and does not build trust. The system splash screen already shows the icon for the duration of the actual cold-start latency; there is no design justification for artificially extending it.
- **Plan for dark and light themes.** The splash background and icon background color are separate from the icon artwork and can be themed. Verify that the splash screen looks intentional in both the light and dark system themes by defining both `windowSplashScreenBackground` variants in your day/night resource directories.
- **On large screens, the icon proportions stay the same.** The system uses the same 1:1 centered icon layout on tablets and foldables. The larger canvas makes the icon appear smaller relative to the screen. Design the icon to be bold and recognizable at that perceived size rather than relying on fine detail, and do not attempt to inject a wider branded layout on large screens.

## Platform notes

- **Android 12 and later (API 31+):** The `SplashScreen` API and `windowSplashScreen*` theme attributes are the canonical approach. The system handles window creation, icon centering, the exit animation, and the handoff to the first `Activity`. The `SplashScreen.OnExitAnimationListener` lets you coordinate a custom exit transition, but the icon itself must still follow the standard sizing and animation contract.
- **Android 11 and earlier via the compat library:** The `androidx.core:core-splashscreen` library backports the API surface to API 21. The visual fidelity on older OS versions is lower — animated icons are not supported before API 31 — so design with static icons as the baseline and treat animation as a progressive enhancement.
- **Foldables and multi-window:** When a foldable unfolds while the app is in the splash phase, the system handles the transition. Avoid assumptions about aspect ratio in any custom exit animation coordinated through `OnExitAnimationListener`.
- **Adaptive icon requirements:** The splash icon must be an adaptive icon (defined in `res/mipmap` with foreground and background layers) to render correctly in the system splash window. A legacy monochrome launcher icon will not produce the correct centered-circle treatment.

## Pitfalls

- **Shipping a custom splash `Activity`** that holds a full-screen branded layout and a `Handler.postDelayed` dismiss — this was acceptable before API 31 but now creates a double-splash: the system splash followed by the custom one, producing a flash and unnecessary delay.
- **Setting an animated icon that exceeds 1 000 ms** without verifying how the system clips it; the animation will appear to cut off mid-motion rather than completing gracefully.
- **Using a splash background color that clashes with the first screen's background,** creating a jarring flash on transition instead of a seamless handoff.
- **Adding wordmarks, taglines, or secondary graphics** to the splash beyond the adaptive icon; these are not part of the system splash contract and cannot be rendered by the standard API.
- **Treating the splash screen as a loading gate** by deferring the first `Activity`'s `setContentView` until network or database calls finish — this keeps the splash visible longer, but is an initialization design problem, not a splash screen design decision.
- **Ignoring the icon background circle** and placing a white or light foreground on a white splash background, making the icon invisible.
- **Not testing in dark mode,** leaving the splash background unthemed so it is always the light-mode color regardless of system setting.

## References

- **Android Documentation:** [Splash screens](https://developer.android.com/develop/ui/views/launch/splash-screen)
- **Android Design:** [Mobile design guidance](https://developer.android.com/design/ui/mobile)
- **Material 3 Guidelines:** [Communication — Launch screens](https://m3.material.io/foundations/overview)

## See also

The sibling design skill `m3-app-bar-top` covers the first destination surface that the user sees immediately after the splash handoff, and is relevant when thinking about transition continuity. The `m3-color-system` design skill governs the color roles (`colorPrimary`, `colorSurface`) that inform the best splash background choice. For implementing the `SplashScreen` API — setting `windowSplashScreen*` theme attributes, installing `SplashScreen.installSplashScreen`, and wiring `OnExitAnimationListener` — pair this design skill with the corresponding Android splash-screen code skill, which covers the `androidx.core:core-splashscreen` dependency, `AnimatedVectorDrawable` setup, and API-level compatibility handling.
