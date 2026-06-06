---
name: gradle-kotlin-dsl
description: Covers the Android Gradle build system using the Kotlin DSL — build.gradle.kts structure, the android block, dependency configurations, plugins block, settings.gradle.kts, and where build logic belongs. Use when structuring or debugging Gradle build files for an Android project using Kotlin DSL and AGP 9+.
globs:
  - "**/*.gradle.kts"
  - "**/*.kts"
  - "**/*.toml"
tags: [gradle, build, kotlin-dsl, android, agp]
x-skills-master:
  domain: android
  class: lang-tooling
  category: build-packaging
  platforms: ["android"]
  requires: { "android": "16", "kotlin": "2.2", "agp": "9.0" }
  pairs_with: []
  sources:
    - https://developer.android.com/build
    - https://developer.android.com/build/gradle-build-overview
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Use this skill when you are setting up, restructuring, or debugging Gradle build files in an Android project — whether converting from Groovy DSL, splitting logic into convention plugins, or understanding how `settings.gradle.kts`, `build.gradle.kts`, and `libs.versions.toml` fit together. It targets AGP 9.0+ with Kotlin 2.2 and the Kotlin DSL throughout.

---

## Core guidance

### settings.gradle.kts — the root of every build

`settings.gradle.kts` is the first file Gradle evaluates. Declare all modules here; Gradle will not discover them automatically.

- **Do** set a `rootProject.name` that matches your repository name.
- **Do** use `dependencyResolutionManagement` to centralise repository declarations; it replaces per-project `repositories {}` blocks and avoids accidental repository sprawl.
- **Don't** declare dependencies or apply plugins here — those belong in build scripts or the plugins block.

### Top-level build.gradle.kts

The root build file at the project root should be minimal. Its only jobs are to apply plugins needed by all subprojects (rarely necessary with convention plugins) and to hold any shared configuration that Gradle itself requires at the project level.

- **Do** keep the root build file near-empty in a multi-module project; push all configuration down.
- **Do** use `subprojects {}` or `allprojects {}` only when there is genuinely no better option — convention plugins are almost always the right alternative.

### The android {} block

Inside an app or library module's `build.gradle.kts`, the `android {}` block configures AGP. Mandatory fields for AGP 9 are `namespace`, `compileSdk`, and `defaultConfig.minSdk`.

- `namespace` replaces the `package` attribute in `AndroidManifest.xml`; set it explicitly.
- `compileSdk` and `targetSdk` should always be set to the current stable API level.
- `buildFeatures { compose = true }` enables Compose tooling; pair it with `composeOptions` only if you are using the Compose compiler plugin explicitly (AGP 9 bundles the Kotlin Compose compiler plugin via the Kotlin Gradle Plugin).
- **Don't** set `buildToolsVersion` — AGP manages it automatically.

### Dependency configurations

| Configuration | Use for |
|---|---|
| `implementation` | Internal implementation detail — not leaked to consumers |
| `api` | Part of your module's public API — leaked to consumers |
| `compileOnly` | Needed at compile time but provided at runtime (e.g., annotation processors) |
| `runtimeOnly` | Needed at runtime but not at compile time |
| `testImplementation` | Unit test dependencies |
| `androidTestImplementation` | Instrumented test dependencies |
| `debugImplementation` / `releaseImplementation` | Build-variant-specific deps |

Prefer `implementation` everywhere unless you genuinely need to expose a type on the module's public surface. Overusing `api` bloats compile classpaths and increases build times.

### Version catalog (libs.versions.toml)

The Gradle version catalog (`gradle/libs.versions.toml`) is the standard way to declare dependency versions in one place, consumed as type-safe accessors in all build files.

- **Do** use the `[versions]`, `[libraries]`, `[plugins]`, and `[bundles]` sections consistently.
- **Do** reference the catalog as `libs.<alias>` in `.gradle.kts` files — Gradle generates type-safe accessors.
- **Don't** hard-code version strings directly in `build.gradle.kts`; keep them in the catalog to avoid divergence.

### Plugins block

The `plugins {}` block is the declarative, type-safe way to apply Gradle plugins. It must appear at the top of the file, before any other blocks.

- **Do** apply AGP and the Kotlin Android plugin by ID using the version catalog alias.
- **Do** use `alias(libs.plugins.android.application)` syntax to stay in sync with the catalog.
- **Don't** use the legacy `apply plugin: "..."` syntax — it bypasses the plugins classpath resolution and does not benefit from isolation.

### Convention plugins — where build logic belongs

Duplicated build logic across modules (same `android {}` configuration, same dependency groups) belongs in **convention plugins**: Kotlin files inside a `build-logic` included build that define reusable Gradle plugins.

- A convention plugin is a regular Gradle plugin applied with a short ID (`alias(libs.plugins.app.android.feature)`) that encapsulates the repetitive `android {}` and `dependencies {}` configuration.
- **Do** create a dedicated `build-logic` Gradle project included via `settings.gradle.kts` for projects with more than two modules.
- **Don't** use `buildSrc` for new projects — the `build-logic` included build pattern offers better isolation and caching.

```kotlin
// gradle/libs.versions.toml (excerpt)
[versions]
agp        = "9.0.0"
kotlin     = "2.2.0"
compose-bom = "2025.06.00"

[libraries]
compose-bom           = { group = "androidx.compose", name = "compose-bom", version.ref = "compose-bom" }
compose-ui            = { group = "androidx.compose.ui", name = "ui" }
compose-material3     = { group = "androidx.compose.material3", name = "material3" }

[plugins]
android-application   = { id = "com.android.application", version.ref = "agp" }
kotlin-android        = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }

// app/build.gradle.kts
plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace   = "com.example.myapp"
    compileSdk  = 36

    defaultConfig {
        applicationId = "com.example.myapp"
        minSdk        = 26
        targetSdk     = 36
        versionCode   = 1
        versionName   = "1.0"
    }

    buildFeatures {
        compose = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    val bom = platform(libs.compose.bom)
    implementation(bom)
    implementation(libs.compose.ui)
    implementation(libs.compose.material3)
    testImplementation(libs.junit)
}
```

---

## Platform notes

- AGP 9 requires a minimum Gradle wrapper version of 8.11. Verify `gradle/wrapper/gradle-wrapper.properties` is up to date.
- The Kotlin Compose compiler plugin is bundled with the Kotlin Gradle Plugin starting with Kotlin 2.0 / AGP 9; you no longer need to specify `kotlinCompilerExtensionVersion` in `composeOptions`.
- Configuration cache is stable and enabled by default in AGP 9. Avoid using `project.afterEvaluate {}` and imperative mutations in task actions; they break configuration cache compatibility.
- Isolated projects (the next step after configuration cache) requires that each project's build script not read the state of another project. Convention plugins with well-defined APIs are the primary enabler.
- The `android.defaults.buildfeatures.buildconfig` flag defaults to `false` in AGP 9. If your code reads `BuildConfig` fields, explicitly enable `buildFeatures { buildConfig = true }`.

---

## Pitfalls

- **Applying plugins with `apply(plugin = "...")` instead of `plugins {}`**. This older form misses build-script classpath isolation and does not support the version catalog.
- **Declaring repositories in module `build.gradle.kts` when `dependencyResolutionManagement` is active.** AGP 9 will fail the build by default if per-project repositories conflict with the centralised block.
- **Forgetting `namespace` in a library module.** Without it AGP 9 rejects the build; it can no longer be inferred from `AndroidManifest.xml`.
- **Mixing `api` and `implementation` carelessly.** Every `api` dependency widens the compile classpath of every consumer module, increasing incremental build times.
- **Mutating tasks inside `afterEvaluate {}`.** Breaks configuration cache. Prefer `tasks.register` with lazy configuration or `tasks.named`.
- **Keeping duplicate version strings.** Having the same library version declared in both `libs.versions.toml` and inline strings in `build.gradle.kts` causes divergence. The catalog is the single source of truth.
- **Using `buildSrc` for new shared build logic.** It invalidates the entire configuration cache on any change. Move to an included `build-logic` build instead.
- **Not pinning `compileSdk` and `targetSdk` to the same value.** A lower `targetSdk` disables platform behaviour changes your users will still see on newer devices.

---

## References

- **Documentation:** [Configure your build — Android Developers](https://developer.android.com/build)
- **Documentation:** [Gradle build overview — Android Developers](https://developer.android.com/build/gradle-build-overview)
- **Guide:** [Gradle's Kotlin DSL Primer](https://docs.gradle.org/current/userguide/kotlin_dsl.html)
- **Guide:** [Share build logic between subprojects — Gradle docs](https://docs.gradle.org/current/samples/sample_convention_plugins.html)

---

## See also

This skill pairs with `spm` (Swift Package Manager) for readers who also work on cross-platform tooling. For how modules are split and shared, see `modularization-local-spm` (the Android analogue covers local library modules with the same convention-plugin pattern). For managing code-signing and distribution through Gradle tasks, see `build-sign-distribute` and `ci-cd-signing`.
