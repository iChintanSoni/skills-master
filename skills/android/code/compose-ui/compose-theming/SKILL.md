---
name: compose-theming
description: Covers Material 3 theming in Jetpack Compose — building ColorScheme (light/dark/dynamic), Typography, and Shapes, wiring MaterialTheme in the app root, accessing theme tokens inside composables, and extending the system with CompositionLocal for custom design tokens. Use when setting up or customising an app-wide theme, implementing dark-mode support, adopting Android 12+ dynamic color, or building a shared design-system layer on top of Material 3.
globs:
  - "**/*.kt"
tags: [compose, material3, theming, design-system, dark-mode]
x-skills-master:
  domain: android
  class: code
  category: compose-ui
  platforms: ["android", "large-screen"]
  requires: { "android": "16", "kotlin": "2.2", "compose-bom": "2026.05.00" }
  pairs_with: []
  sources:
    - https://developer.android.com/develop/ui/compose/designsystems/material3
    - https://developer.android.com/develop/ui/compose/designsystems/custom
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Apply this guidance when you need to wire up a consistent visual identity across an app: choosing colors, type scale, and shapes from a central place, supporting light/dark mode without per-composable `if (darkTheme)` branches, adopting wallpaper-derived dynamic color on Android 12+, or creating a layered design system that adds custom tokens on top of Material 3. It is the natural next step after understanding `compose-fundamentals` and the right starting point before building any production UI.

## Core guidance

### Wiring MaterialTheme

- Wrap the root `@Composable` entry point (the composable passed to `setContent`) in your own `AppTheme` composable that delegates to `MaterialTheme`. Never call `MaterialTheme` from individual screens — that scatters overrides and makes future token changes painful.
- Pass distinct `lightColorScheme()` and `darkColorScheme()` calls to `MaterialTheme`; toggle between them with `isSystemInDarkTheme()` so the system handles the switch automatically.
- Adopt **dynamic color** (Android 12+) via `dynamicLightColorScheme(context)` / `dynamicDarkColorScheme(context)`. Guard with `Build.VERSION.SDK_INT >= Build.VERSION_CODES.S` and fall back to your hand-crafted scheme on older APIs.

### ColorScheme

- Generate a baseline scheme at [material-foundation.github.io/material-theme-builder](https://material-foundation.github.io/material-theme-builder) and export the Compose snippet; do not hand-code the 27-role palette.
- Reference tokens via `MaterialTheme.colorScheme.primary`, `.surface`, `.onSurface`, etc. Avoid hard-coded `Color(0xFF...)` literals in individual composables — they bypass the theme and break dark mode.
- For roles not covered by M3 (e.g. a custom `warning` color), add them via a `CompositionLocal` extension rather than injecting raw colors into component parameters (see "Extending the theme" below).

### Typography

- Pass a `Typography` instance to `MaterialTheme` with only the styles you override; unset styles inherit sensible M3 defaults.
- Access type in composables via `MaterialTheme.typography.bodyLarge`, `.titleMedium`, etc. Bind them to `Text(style = ...)` rather than specifying `fontSize` inline.
- Prefer custom `FontFamily` objects declared at file scope with `Font()` resource references; declare them once and reference them inside the `Typography` block.

### Shapes

- `MaterialTheme.shapes` exposes `extraSmall` through `extraLarge`. Assign custom `RoundedCornerShape` values to the `Shapes()` constructor and let components pick up the right tier automatically (a `Card` uses `medium`, a `Button` uses `full`, etc.).
- Override only the tiers that deviate from M3 defaults; leave the rest at `RoundedCornerShape(x.dp)` defaults.

### Extending the theme with CompositionLocal

- Define extra tokens as a `data class`; provide them via a `staticCompositionLocalOf` or `compositionLocalOf` (use `staticCompositionLocalOf` when the value rarely or never changes — it avoids tree invalidation).
- Expose the value on `MaterialTheme` via an extension property so callers use the familiar `MaterialTheme.extras.warningColor` pattern.
- Provide the local in your `AppTheme` composable alongside `MaterialTheme`; the two are independent nodes in the composition tree, so order them with your `LocalExtras` inside `MaterialTheme`'s `content`.

### Edge-to-edge and dark theme wiring

- With the edge-to-edge API (mandatory from Android 15 / API 35), set `WindowCompat.setDecorFitsSystemWindows(window, false)` in `Activity.onCreate`. The system bar colors are transparent by default; do not override them with a solid theme color.
- For the status bar icon tint, rely on `WindowInsetsControllerCompat(window, view).isAppearanceLightStatusBars = !darkTheme` or the equivalent effect in a Compose side-effect rather than setting `statusBarColor` on the window.

```kotlin
// AppTheme.kt — canonical setup for Material 3 + dynamic color + dark mode
@Composable
fun AppTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit,
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val ctx = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(ctx) else dynamicLightColorScheme(ctx)
        }
        darkTheme -> darkColorScheme(
            primary = Purple80,
            secondary = PurpleGrey80,
            tertiary = Pink80,
        )
        else -> lightColorScheme(
            primary = Purple40,
            secondary = PurpleGrey40,
            tertiary = Pink40,
        )
    }

    // Custom extra tokens provided alongside MaterialTheme
    val extras = if (darkTheme) darkExtras else lightExtras
    CompositionLocalProvider(LocalAppExtras provides extras) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = AppTypography,
            shapes = AppShapes,
            content = content,
        )
    }
}

// Extension to access extras via the familiar MaterialTheme object
val MaterialTheme.extras: AppExtras
    @Composable get() = LocalAppExtras.current
```

## Platform notes

- **Large screens:** The same `AppTheme` applies across handset and tablet. For layout-specific behaviour (rail vs. bottom nav, two-pane content) see `adaptive-layout`, but theme tokens are shared.
- **Dynamic color** is only available on Pixel and OEM devices running Android 12+ (API 31 / `S`). Always provide a hand-crafted fallback; roughly 40–50 % of the Android install base is below API 31 as of 2025.
- **Android 15+ (API 35):** Edge-to-edge is enforced by default; setting a solid status-bar color via `WindowInsetsControllerCompat` will be silently ignored. Use the `WindowInsetsController` appearance flags or `Modifier.systemBarsPadding()` instead.
- Previews: pass `uiMode = Configuration.UI_MODE_NIGHT_YES` to `@Preview` to exercise the dark-theme branch in the IDE without a device.

## Pitfalls

- Calling `MaterialTheme` in multiple places (e.g. inside each screen composable) instead of once at the root — nested `MaterialTheme` calls override all tokens, causing inconsistent colors/typography between screens.
- Hard-coding `Color(0xFF...)` literals inside composable bodies instead of reading `MaterialTheme.colorScheme` — these survive dark mode and dynamic color silently and are hard to find at scale.
- Using `compositionLocalOf` for values that never change at runtime — this causes the entire subtree to invalidate on every recomposition even when the value is the same. Prefer `staticCompositionLocalOf` for design tokens.
- Forgetting the `Build.VERSION.SDK_INT >= Build.VERSION_CODES.S` guard for dynamic color — `dynamicLightColorScheme` crashes below API 31.
- Neglecting to call `WindowCompat.setDecorFitsSystemWindows(window, false)` before edge-to-edge layouts — without it, the system draws colored status/nav bars that clash with the theme and the UI is visually cropped.
- Defining `Typography` with raw `sp` literals per-text instead of a shared `Typography` instance — prevents consistent type-scale control and breaks accessibility font-size scaling.
- Generating the color palette by hand instead of using Material Theme Builder — hand-crafted palettes often violate the tonal relationship rules that ensure accessible contrast ratios across all 27 roles.

## References

- **Documentation:** [Material 3 in Compose](https://developer.android.com/develop/ui/compose/designsystems/material3)
- **Documentation:** [Custom design systems in Compose](https://developer.android.com/develop/ui/compose/designsystems/custom)
- **Documentation:** [CompositionLocal](https://developer.android.com/develop/ui/compose/compositionlocal)

## See also

For understanding when composables recompose and how state flows down the tree, see `compose-fundamentals`. For performance implications of `CompositionLocal` reads and stable types, see `compose-performance`. For applying theme tokens to adaptive layouts on large screens, see `adaptive-layout`. For building widgets that respect the app theme, see `compose-state`.
