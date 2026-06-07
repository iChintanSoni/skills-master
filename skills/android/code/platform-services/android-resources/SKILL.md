---
name: android-resources
description: Covers organizing project resources, configuration qualifiers, alternative resources selection, and resource compilation in Android projects. Use when organizing layouts, drawables, localized assets, values, or managing resource conflicts.
globs:
  - "**/src/main/res/**/*"
tags: [resources, configurations, localization, drawables, layouts, android]
x-skills-master:
  domain: android
  class: code
  category: platform-services
  platforms: ["android"]
  requires:
    android: "16"
  pairs_with: []
  sources:
    - https://developer.android.com/guide/topics/resources/providing-resources
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Apply this skill when structuring the `res/` directory of an Android application or library. Use this to handle configuration qualifiers (density, language, screen width, orientation), provide alternative resources, optimize assets, or troubleshoot resource-matching issues.

## Core guidance

### Resource directories

Organize assets into subdirectories of `res/` with proper resource types:
- `drawable/` — bitmap graphics (PNG, JPEG), vector graphics (XML).
- `layout/` — UI screen structures (for Views/XML).
- `values/` — strings, dimensions, colors, styles.
- `mipmap/` — launcher icons of different density qualifiers.

### Configuration qualifiers

Specify alternative resources by appending dashes and qualifiers to the resource directory name:
- **Language/Region:** `values-fr`, `values-en-rUS`
- **Screen Width:** `layout-w600dp` (applies if screen width is at least 600dp)
- **Orientation:** `layout-land`
- **Night Mode:** `values-night`
- **SDK Level:** `values-v33`

### Selection rules

- **Qualifiers follow a strict order** defined by the Android OS (e.g., Mobile Country Code, Language, Layout Direction, Screen Width, Orientation, Night Mode, Screen Density).
- If qualifiers are in the wrong order in a directory name (e.g., `values-land-night` instead of `values-night-land`), the resource compiler will throw an error.
- **Resource Matching Algorithm:** The OS matches the current system configuration with the available directories, eliminating qualifiers that don't match, and picking the folder with the highest precedence matching qualifiers.

```xml
<!-- res/values/strings.xml -->
<resources>
    <string name="welcome_message">Welcome!</string>
</resources>

<!-- res/values-fr/strings.xml (French translation) -->
<resources>
    <string name="welcome_message">Bienvenue !</string>
</resources>

<!-- res/values-night/colors.xml (Dark Mode Colors) -->
<resources>
    <color name="background">#121212</color>
</resources>
```

## Platform notes

- **Vector Drawables:** Use XML-based VectorDrawables (`vector` tag) instead of density-specific PNGs wherever possible to reduce APK sizes and ensure crisp scaling across all screen sizes.
- **App Bundles Optimization:** Google Play splits resource APKs using configurations; users only download the resources matching their device's language and density, decreasing download sizes.

## Pitfalls

- **Qualifiers out of order:** Directory name `values-land-fr` is invalid and fails compilation. It must be `values-fr-land`.
- **Resource merging collisions:** Multiple modules containing the same resource name (e.g., `button_ok.xml`) will collide and override each other silently during resource merging. Prefix all feature-module resources with the module name (e.g., `profile_button_ok.xml`).
- **Missing default resource:** If you provide `layout-land/main_activity.xml` but omit `layout/main_activity.xml` (default), the app will crash at runtime on portrait devices.

## References

- **Documentation:** [Providing resources guide](https://developer.android.com/guide/topics/resources/providing-resources)
- **Documentation:** [App resources overview](https://developer.android.com/guide/topics/resources/overview)

## See also

See the `app-localization` skill for multi-language string resource organization. For design token resources, see `compose-theming`.
