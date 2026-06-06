---
name: version-catalogs
description: Guidance on Gradle version catalogs — declaring versions, libraries, bundles, and plugins in libs.versions.toml, referencing libs.* accessors in build scripts, sharing a catalog across modules, and migrating hardcoded dependency strings. Use when adding or updating dependencies in a multi-module Android project, consolidating scattered version strings, or setting up a new project with a shared dependency catalog.
---

## When to use

Use this guidance when you are starting a new Android project, adding dependencies to an existing project, or consolidating version strings that are scattered across multiple `build.gradle.kts` files. It is especially relevant for multi-module projects where several modules need to agree on the same library version, and when you want autocomplete for dependency references in Gradle Kotlin DSL.

## Core guidance

- Place the catalog at `gradle/libs.versions.toml`. Gradle auto-discovers it under that path and exposes every entry as a type-safe accessor under the `libs.*` namespace in every `build.gradle.kts` without extra wiring.
- Declare every version string that is shared across more than one library entry in the `[versions]` table. Reference it from library entries with `version.ref = "…"`. Inline `version = "x.y.z"` is fine for one-off libraries with no siblings.
- Use the `[libraries]` table for every runtime and compile-time dependency. Each entry requires at minimum a `group`, `name`, and either `version` or `version.ref`. Use kebab-case aliases; Gradle maps hyphens to dots in the generated accessor (`androidx-core-ktx` → `libs.androidx.core.ktx`).
- Use `[bundles]` to group libraries that always appear together — for example, all Compose UI libraries. Declare a bundle once and reference it with `implementation(libs.bundles.compose)` rather than repeating four lines across every feature module.
- Declare Gradle plugins in the `[plugins]` table using their plugin ID and version. Apply them in `build.gradle.kts` with `alias(libs.plugins.android.application)` or in `settings.gradle.kts` with the same syntax inside `plugins { }`.
- In a multi-module project the single `gradle/libs.versions.toml` is shared automatically; every module reads the same file without any imports or includes.

```toml
# gradle/libs.versions.toml

[versions]
agp           = "9.0.0"
kotlin        = "2.2.0"
compose-bom   = "2026.05.00"
hilt          = "2.55"
coroutines    = "1.10.1"

[libraries]
androidx-core-ktx            = { group = "androidx.core",           name = "core-ktx",                version = "1.16.0" }
compose-bom                  = { group = "androidx.compose",        name = "compose-bom",             version.ref = "compose-bom" }
compose-ui                   = { group = "androidx.compose.ui",     name = "ui" }
compose-ui-tooling-preview   = { group = "androidx.compose.ui",     name = "ui-tooling-preview" }
compose-material3            = { group = "androidx.compose.material3", name = "material3" }
hilt-android                 = { group = "com.google.dagger",       name = "hilt-android",            version.ref = "hilt" }
hilt-compiler                = { group = "com.google.dagger",       name = "hilt-android-compiler",   version.ref = "hilt" }
kotlinx-coroutines-android   = { group = "org.jetbrains.kotlinx",  name = "kotlinx-coroutines-android", version.ref = "coroutines" }

[bundles]
compose = ["compose-ui", "compose-ui-tooling-preview", "compose-material3"]

[plugins]
android-application = { id = "com.android.application",         version.ref = "agp" }
android-library     = { id = "com.android.library",             version.ref = "agp" }
kotlin-android      = { id = "org.jetbrains.kotlin.android",    version.ref = "kotlin" }
hilt                = { id = "com.google.dagger.hilt.android",  version.ref = "hilt" }
```

Referencing the catalog in a module `build.gradle.kts`:

```kotlin
plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.hilt)
}

dependencies {
    implementation(platform(libs.compose.bom))
    implementation(libs.bundles.compose)
    implementation(libs.androidx.core.ktx)
    implementation(libs.hilt.android)
    kapt(libs.hilt.compiler)
}
```

## Platform notes

- AGP 9.0 and Gradle 9.x treat version catalogs as stable, first-class API. The `libs` accessor is generated at sync time; IDE autocomplete in Android Studio works without any plugins.
- The BOM pattern and version catalogs compose naturally. Declare the BOM as a library entry with its own version, import it via `platform(libs.compose.bom)`, then list individual BOM-managed artifacts without a `version` field. Gradle resolves their versions from the BOM.
- You can define additional catalogs beyond `libs` by registering them in `settings.gradle.kts` via `dependencyResolutionManagement { versionCatalogs { create("myLibs") { from(files("…/other.toml")) } } }`. Prefer keeping a single catalog unless you are building a composite build that genuinely owns a separate artifact set.
- In composite builds or included builds, each build owns its own `gradle/libs.versions.toml`. You cannot reference a parent's catalog from an included build; use a shared convention plugin or a published platform BOM instead.

## Pitfalls

- Aliases with dots in the TOML key (e.g. `androidx.core.ktx`) are deprecated as of Gradle 8.1 and produce warnings under Gradle 9. Use hyphens (`androidx-core-ktx`) consistently; Gradle maps them to dots in the generated accessor.
- Omitting a `version` or `version.ref` from a non-BOM library entry causes a sync error that can appear far from the catalog file. Every library entry must carry a version or be governed by an imported BOM.
- Hardcoding versions directly in `build.gradle.kts` after the catalog is in place creates a split-brain state that is easy to miss during upgrades. Run `./gradlew dependencyUpdates` (Ben Manes plugin) against the TOML, not scattered inline strings.
- Bundles do not carry configuration; `implementation(libs.bundles.compose)` adds every member as `implementation`. If some members need `debugImplementation` or `kapt`, list those individually — do not fold them into the bundle.
- Version catalog aliases are resolved at configuration time, not execution time. Modifying `libs.versions.toml` without a sync leaves the build scripts referencing stale generated accessors; always sync after editing the TOML.
- The generated accessor class name is `LibrariesForLibs` by default. Do not reference it directly; always go through the `libs` provider to remain compatible with catalog API changes.

## References

- **Android developer guide:** [Migrate to version catalogs](https://developer.android.com/build/migrate-to-catalogs)
- **Gradle user manual:** [Sharing dependency versions between projects (version catalogs)](https://docs.gradle.org/current/userguide/version_catalogs.html)

## See also

See the `build-packaging` sibling skills for related Gradle topics including convention plugins and modularization patterns. When a project uses local library modules, align their plugin versions in the catalog with `[plugins]` entries to avoid version drift between the app module and library modules.
