---
name: app-localization
description: Covers Android app localization — externalizing strings and resources, locale qualifiers, per-app language preferences via AppCompat/AndroidX, plurals and argument formatting, RTL layout support, and pseudolocale testing. Use when building or auditing a multi-language Android app to ensure correct resource resolution, proper string externalization, and reliable locale switching.
tags: [android, localization, i18n, resources, rtl, plurals]
x-skills-master:
  domain: android
  class: lang-tooling
  category: ship
  platforms: ["android"]
  requires: { "android": "16", "kotlin": "2.2" }
  pairs_with: []
  sources:
    - https://developer.android.com/guide/topics/resources/localization
    - https://developer.android.com/guide/topics/resources/app-languages
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Apply this skill when you need to ship an app in more than one language, add support for a new locale, implement per-app language preferences introduced in Android 13 (API 33), or audit an existing app for hardcoded user-visible strings. It also covers how to test localization correctness without owning translated strings.

## Core guidance

### Externalizing strings

- Place all user-visible text in `res/values/strings.xml`; never hardcode strings in Kotlin or layout files.
- Use `getString(R.string.key)` or `stringResource(R.string.key)` in Compose; pass format arguments as varargs, not through string concatenation.
- Keep keys descriptive and scoped, e.g., `onboarding_welcome_title`, `cart_item_count_label`.
- Provide a `tools:ignore="TypographyDashes"` annotation only when intentional; do not suppress `HardcodedText` warnings — fix them.

### Resource qualifiers and directory layout

- Name locale-specific directories using BCP 47 tags: `res/values-b+fr+CA/` for French (Canada), `res/values-b+zh+Hant/` for Traditional Chinese.
- The legacy two-letter qualifier (`res/values-fr/`) still works but the `b+` form is preferred for any script or region variant.
- Non-string resources (drawables, layouts, colors) follow the same qualifier system. A flipped layout for RTL goes in `res/layout-ldrtl/`, but prefer start/end attributes over mirroring entire layout files.
- The `res/values/` directory is the fallback; it must always exist and be complete — the build will fail if a locale-specific file references a string absent from the default.

### Plurals

- Use `<plurals>` instead of conditional logic in Kotlin for count-dependent strings.
- Provide all quantities your target locales need: `zero`, `one`, `two`, `few`, `many`, `other`. Arabic requires all six; English uses only `one` and `other`.
- Call `resources.getQuantityString(R.plurals.key, count, count)` — pass `count` twice: once for the quantity selector and once as the `%d` format argument.

### Argument formatting

- Prefer indexed format arguments (`%1$s`, `%2$d`) over positional ones (`%s`, `%d`) so translators can reorder words without code changes.
- Wrap currency, dates, and numbers with `NumberFormat`, `DateFormat`, or `DateTimeFormatter` using the current `Locale` — never concatenate raw values.
- Use `BidiFormatter.unicodeWrap()` when embedding a potentially RTL substring inside a sentence to prevent text rendering corruption.

### Per-app language preferences (API 33 +)

- Target API 33+ and declare supported locales in `res/xml/locales_config.xml`; reference it from `<application android:localeConfig="@xml/locales_config">`.
- Call `AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags("fr"))` to change language at runtime without restarting the process. AppCompat back-ports this to API 21 via `androidx.appcompat:appcompat:1.7+`.
- Read the current app-level locale with `AppCompatDelegate.getApplicationLocales()[0]`; do not rely on `Locale.getDefault()` in isolation — the system locale may differ from the per-app locale.
- Expose a language-picker UI in app Settings; hook it to `setApplicationLocales`. The system Settings app also surfaces this control automatically on API 33+ if `localeConfig` is declared.

### RTL support

- Set `android:supportsRtl="true"` in `<application>`; this is required, not optional.
- Use `start`/`end` attributes everywhere: `paddingStart`, `layout_marginEnd`, `drawableStart`. The `left`/`right` equivalents are not mirrored in RTL.
- Use `Arrangement.Start`/`Arrangement.End` in Compose rows and `Modifier.padding(start=…)`. Full RTL design guidance is in the `m3-rtl-internationalization` skill.

### Pseudolocale testing

- Enable pseudolocales in developer options on a physical device or emulator, or set `resConfigs "en", "en-rXA", "ar-rXB"` in your `build.gradle.kts` to include them in debug builds.
- `en-XA` adds accents and expands string length by ~30%; catches layout truncation before real translations arrive.
- `ar-XB` forces RTL and wraps text in RTL markers; catches layout alignment issues without Arabic translations.
- Run the pseudolocale build as part of CI screenshot tests to catch regressions early.

```kotlin
// Per-app language preference — switch to French, back-ported to API 21
import androidx.appcompat.app.AppCompatDelegate
import androidx.core.os.LocaleListCompat

// In your SettingsViewModel or language-picker handler:
fun setAppLanguage(bcp47Tag: String) {
    val locales = if (bcp47Tag.isEmpty()) {
        LocaleListCompat.getEmptyLocaleList() // revert to system locale
    } else {
        LocaleListCompat.forLanguageTags(bcp47Tag)
    }
    AppCompatDelegate.setApplicationLocales(locales)
    // AppCompat recreates the Activity automatically on API < 33.
    // On API 33+ the system handles the switch; no manual recreate() needed.
}

// Reading current app locale (e.g., to highlight active choice in the picker):
fun currentLanguageTag(): String {
    val localeList = AppCompatDelegate.getApplicationLocales()
    return if (localeList.isEmpty) "" else localeList[0]!!.toLanguageTag()
}

// Plural string with indexed argument (strings.xml):
// <plurals name="cart_item_count">
//   <item quantity="one">%1$d item in cart</item>
//   <item quantity="other">%1$d items in cart</item>
// </plurals>
fun cartLabel(count: Int): String =
    resources.getQuantityString(R.plurals.cart_item_count, count, count)
```

## Platform notes

- **`locales_config.xml` is mandatory on API 33+** for the system Settings language picker to list your app's supported locales. Without it the picker shows nothing even if `setApplicationLocales` works in-app.
- **AppCompat 1.7+ required** for `setApplicationLocales` back-compat. Earlier AppCompat versions silently ignore the call on pre-33 devices.
- **Activity recreation** — on API 21–32, AppCompat calls `recreate()` automatically after `setApplicationLocales`. Ensure your Activity saves and restores state with `onSaveInstanceState` or a ViewModel so users do not lose progress.
- **Compose `stringResource`** reads from the composition's current `LocalContext`, which reflects the per-app locale after recreation. No extra work is needed in Compose beyond using `stringResource` instead of hardcoded strings.
- **Resource shrinking** — if you enable `shrinkResources`, add explicit `resConfigs` for the locales you ship to prevent AGP from stripping needed translation files during release builds.
- **Number and date formatting** — `Locale.getDefault(Locale.Category.FORMAT)` is the correct locale for formatting on API 24+; it can differ from the display locale when the user's format region differs from their language.

## Pitfalls

- **Hardcoded strings in Kotlin or Compose** — `Text("Welcome")` is not translatable. Lint's `HardcodedText` check surfaces these; enable it in CI.
- **Missing default resource** — a string present in `values-fr/strings.xml` but absent from `values/strings.xml` compiles successfully but crashes at runtime on any non-French device. The default directory must be the superset.
- **Positional format arguments** — `"Hello, %s %s"` forces word order; translators cannot reorder without code changes. Switch to `"Hello, %1$s %2$s"` with named or role-described parameters in translator comments.
- **`Locale.getDefault()` for per-app locale** — after calling `setApplicationLocales`, `Locale.getDefault()` may still return the system locale on API 21–32 until the Activity recreates. Use `AppCompatDelegate.getApplicationLocales()` instead.
- **Ignoring plural rules** — using a ternary `if (count == 1) … else …` silently breaks for languages with more than two plural forms. Always use `<plurals>` resources.
- **Forgetting `supportsRtl="true"`** — the attribute defaults to `false` before API 17; without it, `start`/`end` attributes are not mirrored and Arabic/Hebrew layouts are broken.
- **Layout truncation hidden by default locale** — English strings are often the shortest. Pseudolocale `en-XA` exposes truncation that becomes visible only after translation.
- **`resConfigs` stripping translations in release** — specifying `resConfigs "en"` without listing all supported locales removes every other language from the APK/bundle. List each locale you ship.

## References

- **Android Docs:** [Localize your app](https://developer.android.com/guide/topics/resources/localization)
- **Android Docs:** [Per-app language preferences](https://developer.android.com/guide/topics/resources/app-languages)
- **Unicode CLDR:** [Plural rules per locale](https://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html)

## See also

For RTL layout design decisions, mirrored icons, and Material 3 bidirectional patterns see the `m3-rtl-internationalization` skill. For declaring capabilities and permissions that interact with locale in the manifest see `info-plist-entitlements` (Android equivalent concepts). For automating screenshot tests that catch locale regressions see `snapshot-testing`.
