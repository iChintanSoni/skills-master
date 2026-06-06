## Basic AppTheme setup with dynamic color

A minimal but production-ready theme entry point showing dynamic color, light/dark switching, and edge-to-edge status-bar wiring.

```kotlin
// ui/theme/Color.kt
val Purple80 = Color(0xFFD0BCFF)
val PurpleGrey80 = Color(0xFFCCC2DC)
val Pink80 = Color(0xFFEFB8C8)

val Purple40 = Color(0xFF6650A4)
val PurpleGrey40 = Color(0xFF625B71)
val Pink40 = Color(0xFF7D5260)

// ui/theme/Type.kt
val AppTypography = Typography(
    bodyLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = 24.sp,
        letterSpacing = 0.5.sp,
    ),
    titleLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.SemiBold,
        fontSize = 22.sp,
        lineHeight = 28.sp,
    ),
    // leave other styles at M3 defaults
)

// ui/theme/Shape.kt
val AppShapes = Shapes(
    small = RoundedCornerShape(8.dp),
    medium = RoundedCornerShape(16.dp),
    large = RoundedCornerShape(24.dp),
)

// ui/theme/Theme.kt
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
        darkTheme -> darkColorScheme(primary = Purple80, secondary = PurpleGrey80, tertiary = Pink80)
        else -> lightColorScheme(primary = Purple40, secondary = PurpleGrey40, tertiary = Pink40)
    }

    // Edge-to-edge status bar icon tint (API 23+, mandatory for API 35+)
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            WindowCompat.setDecorFitsSystemWindows(window, false)
            WindowInsetsControllerCompat(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = AppTypography,
        shapes = AppShapes,
        content = content,
    )
}
```

## Extending MaterialTheme with custom tokens via CompositionLocal

Adds a warning color and a success color that are not part of the M3 palette but follow the same dark/light branching.

```kotlin
// ui/theme/AppExtras.kt
data class AppExtras(
    val warning: Color,
    val onWarning: Color,
    val success: Color,
    val onSuccess: Color,
)

// Use staticCompositionLocalOf — design tokens don't change at runtime.
val LocalAppExtras = staticCompositionLocalOf<AppExtras> {
    error("No AppExtras provided — wrap your UI in AppTheme")
}

private val lightExtras = AppExtras(
    warning = Color(0xFFB45309),
    onWarning = Color(0xFFFFFFFF),
    success = Color(0xFF15803D),
    onSuccess = Color(0xFFFFFFFF),
)

private val darkExtras = AppExtras(
    warning = Color(0xFFFCD34D),
    onWarning = Color(0xFF000000),
    success = Color(0xFF4ADE80),
    onSuccess = Color(0xFF000000),
)

// Extension on MaterialTheme so call sites look natural
val MaterialTheme.extras: AppExtras
    @Composable get() = LocalAppExtras.current

// Updated AppTheme snippet (replace content lambda section)
@Composable
fun AppTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit,
) {
    val colorScheme = /* ... same as before ... */
        lightColorScheme(primary = Purple40)
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

// Usage in a composable
@Composable
fun WarningBanner(message: String, modifier: Modifier = Modifier) {
    Surface(
        color = MaterialTheme.extras.warning,
        contentColor = MaterialTheme.extras.onWarning,
        shape = MaterialTheme.shapes.small,
        modifier = modifier,
    ) {
        Text(
            text = message,
            style = MaterialTheme.typography.bodyMedium,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
        )
    }
}
```

## Custom FontFamily and brand typography

Shows loading a variable font from resources, declaring a `FontFamily`, and wiring it into `Typography`.

```kotlin
// res/font/inter_variable.ttf  (placed in res/font/)

// ui/theme/Type.kt
private val InterVariable = FontFamily(
    Font(R.font.inter_variable, weight = FontWeight.W100, style = FontStyle.Normal),
    Font(R.font.inter_variable, weight = FontWeight.W400, style = FontStyle.Normal),
    Font(R.font.inter_variable, weight = FontWeight.W600, style = FontStyle.Normal),
    Font(R.font.inter_variable, weight = FontWeight.W700, style = FontStyle.Normal),
)

val AppTypography = Typography(
    displayLarge = TextStyle(fontFamily = InterVariable, fontWeight = FontWeight.W700, fontSize = 57.sp, lineHeight = 64.sp),
    headlineMedium = TextStyle(fontFamily = InterVariable, fontWeight = FontWeight.W600, fontSize = 28.sp, lineHeight = 36.sp),
    bodyLarge = TextStyle(fontFamily = InterVariable, fontWeight = FontWeight.W400, fontSize = 16.sp, lineHeight = 24.sp, letterSpacing = 0.15.sp),
    labelSmall = TextStyle(fontFamily = InterVariable, fontWeight = FontWeight.W600, fontSize = 11.sp, lineHeight = 16.sp, letterSpacing = 0.5.sp),
    // other roles inherit M3 defaults with the system font; override only what you need
)
```

## Previewing light, dark, and dynamic themes in the IDE

Side-by-side previews for all theme variants without running on a device.

```kotlin
// ui/theme/ThemePreviews.kt

@Preview(name = "Light", showBackground = true)
@Preview(name = "Dark", showBackground = true, uiMode = Configuration.UI_MODE_NIGHT_YES)
annotation class ThemePreviews

// Usage — attach to any composable you want to preview in both modes
@ThemePreviews
@Composable
private fun WarningBannerPreview() {
    // Dynamic color is disabled in previews (no wallpaper engine)
    AppTheme(dynamicColor = false) {
        Surface {
            WarningBanner(
                message = "Your session expires in 5 minutes",
                modifier = Modifier.padding(16.dp),
            )
        }
    }
}

// For a quick three-up comparing light / dark / dynamic-color snapshot
@Preview(name = "Light — static", showBackground = true, widthDp = 360)
@Preview(name = "Dark — static", showBackground = true, widthDp = 360, uiMode = Configuration.UI_MODE_NIGHT_YES)
@Preview(name = "Dark — dynamic (simulated)", showBackground = true, widthDp = 360, uiMode = Configuration.UI_MODE_NIGHT_YES)
@Composable
private fun AllVariants() {
    // Use dynamicColor = false for the first two, true for the third (previews use fallback palette)
    AppTheme(dynamicColor = false) {
        Surface(modifier = Modifier.padding(16.dp)) {
            Text("Theme preview", style = MaterialTheme.typography.titleLarge)
        }
    }
}
```
