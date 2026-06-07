---
name: design-system-customization
description: Guides mapping brand guidelines to Material 3 design tokens (colors, typography, shapes) and implementing custom design systems in Jetpack Compose. Use when establishing a brand theme, importing Figma design tokens, or defining custom semantic tokens.
tags: [design-system, theming, material3, brand, typography, color, shape, compose]
x-skills-master:
  domain: android
  class: design
  category: styles
  platforms: ["android", "large-screen"]
  requires:
    android: "16"
    kotlin: "2.2"
    compose-bom: "2026.05.00"
  pairs_with: [m3-color, m3-typography, compose-theming]
  sources:
    - https://developer.android.com/design/ui
    - https://m3.material.io/styles
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Apply this skill when custom brand guidelines must be mapped to Material 3 design tokens. Use this to translate brand-specific colors, custom typography scales, and geometric shapes into Jetpack Compose `MaterialTheme` components, or when creating custom design system extensions using `CompositionLocal`.

## Core guidance

### Brand mapping to M3

- **Seed Color Mapping:** Define a main brand color as the primary seed. Let the Material 3 tool chain generate the tonal palettes. For non-negotiable brand colors (e.g., a logo color), map them to custom semantic roles rather than forcing them into standard primary/secondary slots.
- **Custom Typography:** Use Google Fonts (`FontFamily` with `GoogleFont` provider) or embed local TTF/OTF files. Custom typefaces should map directly to M3 typography roles (e.g., `displayLarge`, `bodyMedium`).
- **Custom Shapes:** Map brand curves to M3 shape classes (e.g., circular for badges, medium rounded corner for cards, square for input fields).

### Compose custom theme structure

- Create a custom theme wrapper function that overrides `MaterialTheme`.
- For variables beyond Material 3 (like custom spacing, shadows, gradients), expose them using `staticCompositionLocalOf`.

```kotlin
// Define custom design system tokens
data class CustomSpacing(
    val extraSmall: Dp = 4.dp,
    val small: Dp = 8.dp,
    val medium: Dp = 16.dp,
    val large: Dp = 24.dp
)

val LocalSpacing = staticCompositionLocalOf { CustomSpacing() }

// Custom theme wrapper
@Composable
fun BrandTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) BrandDarkColorScheme else BrandLightColorScheme
    val typography = BrandTypography
    val shapes = BrandShapes
    val spacing = CustomSpacing()

    CompositionLocalProvider(
        LocalSpacing provides spacing
    ) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = typography,
            shapes = shapes,
            content = content
        )
    }
}

// Access custom tokens
object BrandTheme {
    val spacing: CustomSpacing
        @Composable
        @ReadOnlyComposable
        get() = LocalSpacing.current
}
```

## Platform notes

- **Large Screens:** Adaptive layouts may require dynamic typography scale adjustment. Set up responsive text sizes that scale depending on screen width breakpoint (e.g., using `WindowSizeClass`).
- **Dynamic Color (Android 12+):** Ensure your custom brand colors do not get fully overridden on devices supporting Material You unless dynamic theme compliance is expected. Provide a toggle in system settings.

## Pitfalls

- **Hardcoded values in composables:** Avoid using hardcoded colors (like `Color.Red`) or spacing values (`12.dp`) directly in components. Always reference the theme tokens.
- **Replacing M3 attributes completely:** Overriding `MaterialTheme` components without providing default fallbacks breaks library UI elements that rely on standard `MaterialTheme` tokens.
- **CompositionLocal memory leaks:** Avoid using dynamic `compositionLocalOf` for values that update frequently. Use `staticCompositionLocalOf` for static tokens like spacing, shape, or colors.

## References

- **Documentation:** [Design system customization guide](https://developer.android.com/develop/ui/compose/designsystems/material3)
- **Material 3 Design:** [Material 3 Customization](https://m3.material.io/styles)

## See also

See `compose-theming` for detailed color scheme class instantiations. See `m3-color` for guidelines on contrast verification and tonal palettes generation.
