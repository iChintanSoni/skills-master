---
name: m3-app-icons
description: Design guidance and critique for Android app icons in Material 3 — adaptive icon layers and the safe zone, themed (monochrome) icon design, masking across launcher shapes, and the Play Store icon. Use when designing a new app icon, auditing an existing icon for safe-zone compliance, ensuring the monochrome layer reads correctly for themed icons, evaluating how an icon survives aggressive masking on third-party launchers, or preparing final icon assets for a Play Store listing.
---

## When to use

- Designing a new app icon or refreshing an existing one for an Android app targeting API 26 (Android 8.0) or later.
- Auditing whether an icon's key artwork falls inside the safe zone and will survive masking on all supported launchers.
- Deciding how to design the monochrome (themed) icon layer so it reads correctly against system-assigned tinted backgrounds.
- Evaluating whether foreground and background layers are visually balanced and compose well under any mask shape (circle, squircle, rounded square, teardrop, and others).
- Preparing the full set of icon assets — adaptive XML, legacy PNG fallbacks, and the Play Store graphic — for a production release.

## Core guidance

### The adaptive icon format

- **Adaptive icons are defined by two drawable layers, not a single image.** The foreground layer carries the primary mark (logo, wordmark, or illustration); the background layer fills the shape behind it. Both are 108 × 108 dp, and the system clips them together using a path mask chosen by the launcher. Never collapse both into a single flat PNG at this size — you lose the masking and animation behaviors the system relies on.
- **The safe zone is a centered 66 × 66 dp circle.** All recognizable, load-bearing artwork must fit inside this circle. Anything outside may be clipped by the most aggressive mask shape — a circle — used by many launchers including Pixel. Elements like brand color fills and soft gradients that can be cropped without losing meaning are fine to extend beyond it; letterforms, logos, and identifying marks are not.
- **Design the foreground layer with generous breathing room.** A mark centered in the 66 dp circle with roughly 4–8 dp of internal padding looks balanced; a mark that fills the circle edge-to-edge reads as cramped after masking. At production size, this translates to placing critical artwork within a 58 dp effective area at the visual center of the 108 dp canvas.
- **Keep the background layer free of detail.** Its role is to carry the brand color, gradient, or texture that fills the masked shape. Any text or detailed illustration placed in the background layer will be partially clipped by most masks and will look wrong. Treat it as a purely tonal surface.
- **Avoid hard, high-contrast edges positioned near the safe-zone boundary.** A stroke or shape edge that sits right at 66 dp will be bisected by some mask shapes and intact in others, producing an inconsistent, unfinished look across devices.

### Themed (monochrome) icons

- **The themed icon layer is a single-color silhouette, not a full-color reproduction.** Android 13 (API 33) introduced the monochrome adaptive icon attribute. The system takes this grayscale or black-and-white drawable and tints it using the user's dynamic color (Material You) palette — typically the primary container color. Your design must work as a silhouette: distinct recognizable shape, no reliance on internal color differences.
- **Design the monochrome layer for the silhouette read at a glance.** The mark should be unambiguous even when stripped of color. If the brand icon depends on two differently-colored regions to be recognizable, rethink the silhouette — consider a bolder simplified shape, or add an outline treatment so the separation reads without color.
- **Ensure sufficient negative space inside the silhouette.** Compact marks with filled interiors (a dark blob) lose legibility when tinted against similarly-toned backgrounds. Open letterforms, marks with cutouts, or marks with clear outer/inner distinction (a "donut" shape) survive theming better than fully-filled circles or squares.
- **Test the monochrome layer against a range of tint colors and backgrounds.** The tint is drawn from the user's wallpaper-derived palette; it might be warm orange, cool blue, desaturated green, or neutral gray. A single sample does not validate the design. The icon must read as distinctly your app's identity across at least six to eight representative system palette scenarios.
- **Do not treat the monochrome layer as optional polish.** On Android 13+ with Material You enabled, launchers display themed icons in a unified grid. An app without a monochrome layer is shown as a plain un-tinted icon sitting among tinted neighbors, which looks visually discordant and signals lack of platform care to users who have opted into theming.

### Masking across launcher shapes

- **Test under at minimum five mask shapes.** The Android documentation lists circle, squircle, rounded square, teardrop, and square variants used by major launchers. Each clips a different region of the 108 dp canvas. A design that looks great as a circle may look cropped or spatially unbalanced as a teardrop. Evaluate the mask set before sign-off, not after engineering has shipped.
- **Avoid placing visual weight asymmetrically.** Marks that are center-heavy look good under all shapes; marks that use the upper-left or lower-right quadrant for key detail may appear partially cut off under shapes that clip corners aggressively. Center-aligned, vertically balanced marks are the safest composition for adaptive icons.
- **Account for parallax and animation.** The foreground and background layers can move independently in response to device motion. If the foreground mark is close to the background color at its edges, gentle parallax will look like content bleeding in from nowhere. Ensure the foreground mark has sufficient contrast with the background layer color at its outermost visible points.
- **Legacy PNG fallback is still required for API 25 and below.** On devices running Android 7.1 or earlier, the system uses the `android:icon` drawable directly, which should be a 48 dp PNG cropped to the icon shape expected by the launcher (no masking is applied). Design this as a contained, rounded composition — the de-facto standard for legacy icons is a rounded rectangle at roughly the squircle curvature, so a plain square or a sharp-cornered design looks out of place. Keep it visually consistent with the adaptive version.

### Play Store icon

- **The Play Store icon is a separate 512 × 512 px PNG, not generated from the adaptive XML.** It must be a standalone, full-bleed illustration with no transparency, sized and optimized for 512 × 512 without relying on adaptive masking. The Play Store itself applies a rounded-rectangle mask (roughly 20% corner radius relative to the icon size) when displaying it, but the full square is stored and may appear unmasked in promotional surfaces.
- **Match the Play Store icon to the adaptive icon's visual identity, but design it for a larger canvas.** At 512 px you can introduce richer detail, subtle shadows, and tighter gradients that would be illegible at 48–108 dp. The overall composition, color palette, and recognizable mark should feel like the same brand at a higher fidelity, not a different design entirely.
- **Do not simply scale up the adaptive icon foreground layer.** A mark designed for 66 dp at 108 dp total canvas looks thin and lonely in 512 px. Rethink padding, weight, and surface treatment for the larger context. This is a design artifact in its own right.

## Platform notes

- **Compact phones:** The icon grid on the default Android launcher typically displays icons at roughly 48–56 dp. The safe zone rule is calibrated for this baseline; the main risk is clipping on non-Pixel launchers that apply custom mask shapes (Samsung's One UI historically used a squircle that clips more of the 108 dp canvas than a Pixel circle does). Validate on at least two launcher-shape systems.
- **Large screens and foldables:** App icons appear on the home screen, in the taskbar, and in the App Drawer. The displayed size can be slightly larger on tablets (some launchers render at 72+ dp), but the 108 × 108 dp adaptive canvas and 66 dp safe zone remain unchanged. The additional screen real estate does not change icon design requirements — it only increases how clearly errors in safe-zone compliance are visible.
- **Android TV:** The TV home screen uses a rectangular banner graphic (320 × 180 px by convention), not the square adaptive icon. The adaptive icon still appears in the settings and app info screens. Design the banner separately; do not attempt to adapt the square icon into a banner by letterboxing.
- **Wear OS:** Wear uses its own circular icon crop. A well-centered adaptive icon composes cleanly in the Wear round face, but verify the silhouette reads at the very small canvas size the watch home screen renders. Monochrome theming is supported on Wear for watch faces and complications; test the monochrome layer on a round crop.

## Pitfalls

- **Placing critical artwork outside the 66 dp safe zone.** Brand text, taglines, or distinguishing mark details outside this circle will be clipped by circular launchers. The safe zone is non-negotiable, not a suggestion.
- **Designing both layers as a single flat composition with the split made arbitrarily.** If the foreground and background layers are designed as separate concerns from the start, parallax and masking look intentional; if the split is made post-design by copying layers from a single flat file, the parallax looks random and elements misalign under motion.
- **Skipping the themed icon layer on a new project.** Omitting the monochrome drawable on a new app targeting Android 13+ immediately signals an unfinished app to users on devices with Material You theming enabled.
- **Designing the monochrome layer by converting a full-color icon to grayscale.** Grayscale conversion preserves luminance differences between hues but does not produce a clean silhouette. The system applies a flat tint — it does not preserve relative lightness across the grayscale range. Convert to a true binary (solid + cutout) silhouette instead.
- **Reusing the Play Store icon as the adaptive foreground layer.** The Play Store icon is 512 px with detail and padding calibrated for a large display context; the foreground adaptive layer is 108 dp with a 66 dp safe zone. These are different design problems, and the same file serves neither well.
- **Not testing on Samsung/One UI launchers.** Samsung's mask shape and icon scaling differ from AOSP. Icons that look polished on a Pixel may clip unexpectedly or look padded on Samsung devices, which collectively represent a large share of the Android install base.
- **Using a fully transparent background layer.** While technically valid, a transparent background falls back to white or black depending on the launcher, producing unexpected results. Design an explicit background color or gradient rather than relying on the system default.
- **Ignoring icon animation behaviors.** Android launchers can animate the foreground layer independently (shake, bob, squish) in response to long-press or launch gestures. Foreground elements that extend very close to the safe-zone boundary can be clipped during these animations on some launchers, even if they look fine in static composition.

## References

- **Documentation:** [Adaptive icons — Android Developers](https://developer.android.com/about/versions/oreo/android-8.0)
- **Material 3 Guidelines:** [Icons overview](https://m3.material.io/styles/icons/overview)
- **Material 3 Guidelines:** [Icons — designing icons](https://m3.material.io/styles/icons/designing-icons)
- **Material 3 Guidelines:** [Icons — applying icons](https://m3.material.io/styles/icons/applying-icons)

## See also

The `m3-icons` design skill covers Material Symbols iconography used inside the app (navigation, toolbar, and inline icons) — a distinct concern from the launcher app icon. For the broader shape and corner-radius system that informs how icons relate to the squircle-adjacent forms in Material 3, see the `m3-shape` design skill. For color palette decisions that feed the background layer and monochrome tint context, see the `m3-color` design skill. On the implementation side, the asset-catalogs and build-sign-distribute lang-tooling skills cover generating and embedding adaptive icon drawable XML, mipmap density buckets, and Play Store asset submission.
