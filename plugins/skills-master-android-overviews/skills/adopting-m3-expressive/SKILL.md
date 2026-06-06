---
name: adopting-m3-expressive
description: Decision and adoption guide for Material 3 Expressive in Jetpack Compose — covering spring motion, shape morphing, emphasized typography, and new components. Use when evaluating whether to adopt M3 Expressive, deciding which surfaces benefit from expressive treatment, or planning an incremental opt-in strategy while maintaining accessibility and performance.
---

## When to use

Reach for this skill when your team is deciding whether to enable Material 3 Expressive features, which surfaces to apply them to, and how to do so incrementally without breaking existing screens. It also applies when a design review surfaces expressive motion or morphing shapes that need an implementation strategy, or when you need to verify that new visual treatments meet accessibility and frame-rate budgets.

## Core guidance

### What changed in M3 Expressive

Material 3 Expressive is an evolution layered on top of the baseline Material 3 design system. It does not replace M3 — it extends it along four axes:

**Spring motion.** Physics-based spring animations replace or augment duration-curve easing on interactive elements. Springs feel responsive because they react to gesture velocity and can be interrupted cleanly mid-animation. The M3 motion spec now describes springs using stiffness and damping ratio instead of millisecond durations. In Compose, this maps to `spring()` specs inside `animateAsState`, `Animatable`, and `AnimatedContent` transitions.

**Shape morphing.** Component shapes can interpolate between two `Shape` values — for example a rounded rectangle morphing to a circle on press, or a FAB morphing into a dialog surface. Compose 1.7+ exposes `ShapeValueHolder` and the `Morph` API from `graphics-shapes` to drive these transitions. The design spec formalizes this as "continuous" (fully curved, squircle-like) and "expressive" contours that signal interactivity.

**Emphasized typography.** A new typescale level — Display Emphasized and Headline Emphasized — pairs high-weight variable-font rendering with tighter tracking to create focal hierarchy without added color or motion. This requires a variable font file that supports the `wght` axis and a `FontVariation.Setting` call in your `FontFamily` definition.

**New components.** The 2026 M3 Expressive component catalogue includes Loading Indicator (circular with morphing progress), Floating Toolbar (horizontally scrollable action surface), Wide FAB, Split Button, and Button Group. These ship in `androidx.compose.material3` from the BOM version aligned with Android 16 SDK availability.

### Incremental opt-in strategy

Expressive treatment is additive. You do not flip a single flag; you adopt each axis independently:

1. **Motion first.** Replace hard-coded `tween()` or `snap()` specs on your most interactive elements (primary buttons, FABs, navigation rail items) with spring specs. The risk surface is low — springs degrade gracefully and the visual diff is subtle enough to ship behind a standard release.

2. **New components second.** Adopt Loading Indicator and Wide FAB where they replace custom equivalents. These are straightforward swaps within your existing `MaterialTheme` and require no shape or font changes.

3. **Shape morphing selectively.** Apply morphing only on elements where the transition communicates state — a record button expanding to a stop icon, a search field rounding into a pill on focus. Avoid morphing on high-density list items or on content that users need to read during the transition.

4. **Emphasized typography last.** Requires asset work (adding a variable font or updating the font file). Gate this change behind a font delivery update so it does not bloat your base APK.

### Where expressive treatment helps vs hurts

| Context | Expressive treatment | Reasoning |
|---|---|---|
| Primary CTA (FAB, hero button) | Strong benefit | Motion and shape signal importance; users notice it |
| Navigation transitions | Moderate benefit | Spring motion matches gesture velocity, feels direct |
| High-density lists (feeds, settings) | Avoid | Morphing shapes and spring overshoots distract from content scanning |
| Long-form reading surfaces | Avoid | Typographic emphasis should stay in headings, not body text |
| Loading / skeleton states | Benefit | Morphing loading indicator reduces perceived wait |
| Accessibility-restricted contexts | Conditional | Respect `reduceMotion` preference (see below) |
| Dialogs and bottom sheets | Moderate benefit | Enter/exit morphing is appropriate; avoid morphing within the dialog while visible |
| Error states | Avoid spring overshoots | Errors need immediate, stable feedback — use a crisp enter transition |

### Verifying accessibility

- **Reduced motion.** Check `LocalAccessibilityManager.current?.isReduceMotionEnabled` (or the platform `REDUCE_MOTION` setting via `Settings.Global`) and switch to a `snap()` or short `tween()` spec when enabled. The M3 motion spec explicitly documents reduced-motion alternatives for every spring interaction.
- **Touch target size.** New components like Wide FAB and Button Group must maintain a minimum 48 dp touch target. Verify with Layout Inspector's Show Layout Bounds overlay or the Accessibility Scanner tool.
- **Color contrast on shaped surfaces.** Expressive shape contours sometimes clip the visible area of an icon or label. Run contrast checks after applying morphed shapes, not only on flat mockups.
- **Screen reader focus.** Shape morphing does not affect semantics trees — confirm with TalkBack that `contentDescription` and role announcements remain stable during transitions.

### Verifying performance

- Spring animations running on the main thread block frame delivery. Move spring-driven values to `Animatable` calls inside a `LaunchedEffect` or to the `Transition` API so Compose can batch recomposition.
- Shape morphing via `Morph` is GPU-accelerated path interpolation. Benchmark with Android Studio's GPU profiler on a mid-range device (Pixel 6a or equivalent) — morphing more than four shapes simultaneously on a single frame is a yellow flag.
- Enable **Compose compiler metrics** (`freeCompilerArgs += ["-P", "plugin:androidx.compose.compiler.plugins.kotlin:metricsDestination=..."]`) and confirm that animated composables are not triggering unnecessary full-tree recomposition due to unstable captures inside animation specs.
- Profile with **Macrobenchmark** and Baseline Profiles after introducing spring motion; Compose's animation pipeline is more costly than `ObjectAnimator` equivalents and benefits from AOT compilation via Baseline Profiles.

## Platform notes

**Large screens and foldables.** Spring motion and shape morphing look best on screens where the user's eye has space to follow the transition. On tablets and foldables, apply expressive treatment to the detail pane's primary action area; avoid morphing within the list pane where density is higher and transitions compete with scrolling.

**Wear OS.** M3 Expressive components are not yet published for Wear. Do not import `material3` Expressive components into a Wear module; they will not render correctly and may pull in transitive dependencies that bloat the Wear APK.

**Android TV.** Spring physics on D-pad focus changes feel sluggish on TV UIs where quick directional navigation is expected. Prefer crisp `tween(150ms)` transitions for focus indicators on TV; use spring only for playback progress and hero surface entrances.

**Android 16 predictive back.** M3 Expressive motion is designed to compose with predictive back — the spring parameters for shared-element transitions and sheet dismissals are tuned to hand off correctly to the back-gesture preview. If you customize spring specs, test with predictive back enabled in developer options.

## Pitfalls

- **Applying springs everywhere.** Spring overshoots on static text or fine iconography look glitchy, not expressive. Limit spring motion to interactive elements with a clear pressed or selected state change.
- **Skipping the reduced-motion check.** Android's `REDUCE_MOTION` toggle is a hard accessibility requirement in many markets. Ship a `snap()` fallback before any expressive motion reaches production.
- **Using `infiniteRepeatable` springs.** Springs are not designed for infinite repeat — use `tween` with `RepeatMode.Reverse` for pulsing or breathing animations; springs are for single-destination transitions.
- **Morphing shapes without stable keys.** If the composable hosting a morphed shape is recreated (due to key changes in `LazyColumn` or a conditional statement), the morph restarts from the initial shape. Hoist morph state with `remember` keyed on a stable identity.
- **Font axis loading on first frame.** Variable fonts loaded from asset files incur a disk-read on first composition. Cache the `FontFamily` at the application or `CompositionLocal` level, not inside a composable that recomposes frequently.
- **Importing Expressive components without BOM alignment.** The new M3 Expressive components require a minimum `androidx.compose.material3` BOM version aligned with Android 16 APIs. Mixing a newer component artifact with an older BOM produces runtime `ClassNotFoundException` for internal APIs.
- **Ignoring the GPU cost of simultaneous morphs.** Compositing multiple morphed shapes on a single frame is expensive. Profile before shipping feature-flag-gated expressive surfaces — the overhead appears at runtime, not in design previews.

## References

- **M3 Motion Overview:** [https://m3.material.io/styles/motion/overview](https://m3.material.io/styles/motion/overview)
- **M3 Shape Principles:** [https://m3.material.io/styles/shape/overview-principles](https://m3.material.io/styles/shape/overview-principles)

## See also

For the Compose animation APIs underpinning spring motion, see `swiftui-animations-transitions` as an iOS conceptual parallel, and consult the Android-domain `compose-fundamentals` and `compose-state` skills for recomposition and state-hoisting patterns that affect animation stability. For theming and `MaterialTheme` setup that must be in place before adopting Expressive components, see `adopting-compose`. For performance profiling methodology, see `instruments-profiling` (iOS conceptual reference) and the Android `compose-performance` skill.
