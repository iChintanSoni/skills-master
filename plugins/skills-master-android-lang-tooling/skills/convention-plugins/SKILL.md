---
name: convention-plugins
description: Covers Gradle convention plugins (build-logic) for Android multi-module projects — precompiled script plugins, shared module configuration, the included build pattern, and eliminating buildscript duplication. Use when setting up or refactoring the Gradle build of a multi-module Android project to share build logic without copy-paste.
---

## When to use

Apply this skill when a project has two or more Gradle modules and you notice the same `android { }` block, plugin applications, or dependency version declarations repeated across `build.gradle.kts` files. It is the canonical solution for that duplication — extracting shared configuration into precompiled script plugins that live in a dedicated `build-logic` included build. Also apply when onboarding contributors who need to understand where build configuration lives, or when upgrading AGP and needing to change a setting in one place rather than many.

Do not apply to single-module hobby projects where the overhead of a second included build is not justified.

## Core guidance

### The build-logic included build

Create a standalone Gradle project at `build-logic/` in the repo root. Include it from the root `settings.gradle.kts` so Gradle compiles it as a separate build whose outputs (the plugins) are available to all subprojects.

- `build-logic/settings.gradle.kts` — declares the project and depends on nothing external.
- `build-logic/convention/build.gradle.kts` — applies `kotlin-dsl`, declares `compileOnly` dependencies on AGP and Kotlin Gradle Plugin so the plugin code can reference their APIs at compile time.
- Plugin source files live under `build-logic/convention/src/main/kotlin/` with a flat structure; no package nesting is required.

### Precompiled script plugins

A file ending in `.gradle.kts` under `src/main/kotlin/` is automatically compiled into a plugin whose ID equals the filename minus the extension. Name them after what they configure, not what they are:

| File | Plugin ID | Purpose |
|---|---|---|
| `android-library.gradle.kts` | `android-library` | Common Android library module settings |
| `android-application.gradle.kts` | `android-application` | Common application module settings |
| `android-compose.gradle.kts` | `android-compose` | Compose compiler + UI tooling setup |
| `kotlin-jvm.gradle.kts` | `kotlin-jvm` | Pure JVM/Kotlin modules (no Android) |

- Keep each plugin focused on one concern — resist the temptation to create a single "everything" plugin.
- Consume AGP/KGP types via the `libs` version catalog accessor inside the plugin file; this keeps version references in one place.
- Apply convention plugins in subproject `build.gradle.kts` by ID, not by class, so the coupling is loose.

### Sharing the version catalog

Declare all dependency versions in `gradle/libs.versions.toml`. Both `build-logic` and every subproject resolve versions from the same catalog — no need to hardcode strings in the plugin files.

- Reference catalog entries inside a convention plugin via `extensions.getByType<VersionCatalogsExtension>().named("libs")`.
- Do not duplicate version strings between the catalog and `build-logic/convention/build.gradle.kts`; the `compileOnly` AGP/KGP declarations in the plugin module can reference catalog versions too.

### Applying conventions in subprojects

```kotlin
// build-logic/convention/src/main/kotlin/android-library.gradle.kts
import com.android.build.gradle.LibraryExtension

plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
}

android {
    val catalog = extensions.getByType<VersionCatalogsExtension>().named("libs")
    compileSdk = catalog.findVersion("compileSdk").get().requiredVersion.toInt()

    defaultConfig {
        minSdk = catalog.findVersion("minSdk").get().requiredVersion.toInt()
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
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
    val catalog = extensions.getByType<VersionCatalogsExtension>().named("libs")
    add("testImplementation", catalog.findLibrary("junit").get())
}
```

```kotlin
// feature/home/build.gradle.kts  — consumes the convention plugin
plugins {
    id("android-library")         // from build-logic
    id("android-compose")         // stacks cleanly with other conventions
}

dependencies {
    implementation(libs.androidx.lifecycle.viewmodel)
}
```

### Root settings wiring

```kotlin
// settings.gradle.kts (root)
pluginManagement {
    includeBuild("build-logic")
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
    versionCatalogs {
        create("libs") { from(files("gradle/libs.versions.toml")) }
    }
}
```

## Platform notes

- **AGP 9.0 namespace requirement** — `namespace` must be set in each module's `android { }` block; it can no longer be derived from `AndroidManifest.xml`. Set it in the convention plugin only if your naming convention makes it deterministic (usually not — let each module declare its own).
- **Kotlin 2.2 / K2 compiler** — the K2 compiler is the default in Kotlin 2.2. Precompiled script plugins are compiled with K2 as well; if a plugin uses reflection or advanced type inference tricks that relied on K1 behavior, test after upgrade.
- **Configuration cache** — AGP 9.0 makes the Gradle configuration cache required for new projects. Convention plugins must not use `project.afterEvaluate { }` or capture mutable project state in lambdas stored past configuration time; both break configuration cache compatibility.
- **Isolated projects (preview)** — Gradle's Isolated Projects feature, now in preview, requires that each subproject's configuration is fully self-contained. Convention plugins that read properties from sibling subprojects will fail; design plugins to be stateless relative to other projects.
- **`compileOnly` vs `implementation` in build-logic** — always declare AGP and KGP as `compileOnly` in `build-logic/convention/build.gradle.kts`. Using `implementation` would bundle AGP into the classpath in a way that conflicts with the version loaded by the root build's classpath.

## Pitfalls

- **Duplicating plugin IDs as strings** — if a precompiled script plugin applies another plugin by string ID (e.g., `id("com.android.library")`), that string must match what is in the version catalog or `pluginManagement` block; mismatches cause cryptic "plugin not found" errors at sync.
- **Putting logic in `buildSrc` instead of an included build** — `buildSrc` is a legacy mechanism: it is always compiled even when unchanged, it is not cacheable across machines in the same way as an included build, and it couples all subprojects together. Prefer `build-logic` as an included build.
- **Hardcoding SDK versions in plugin files** — any magic integer in a convention plugin immediately creates a divergence from the version catalog. Always read versions from the catalog.
- **`afterEvaluate` in convention plugins** — `project.afterEvaluate { }` breaks configuration cache and Isolated Projects. Use `DomainObjectSet.configureEach { }` or lazy API (`tasks.register`) instead.
- **Using `apply(plugin = "...")` vs `plugins { }` block** — inside a precompiled script plugin, always use the `plugins { }` block at the top; the legacy `apply()` call bypasses plugin management resolution and can pick up a different version.
- **Forgetting to add the included build to `pluginManagement`** — `includeBuild("build-logic")` placed only in the `dependencyResolutionManagement` block does not make the convention plugin IDs available to subprojects; it must be in `pluginManagement { includeBuild(...) }`.
- **Version catalog not shared with build-logic** — `build-logic` has its own settings; to share the root catalog it must either reference it via a relative `from(files(...))` call or declare `dependencyResolutionManagement` pointing to the same TOML file. Omitting this means catalog accessors return absent optionals at runtime.

## References

- **Android documentation:** [Migrate build configuration to Kotlin DSL](https://developer.android.com/build/migrate-to-kotlin-dsl)
- **Gradle documentation:** [Sharing build logic between subprojects](https://docs.gradle.org/current/userguide/sharing_build_logic_between_subprojects.html)

## See also

The `spm` skill covers the analogous pattern on Apple platforms (Swift Package Manager plugins sharing build logic). For declaring and consuming versions across modules see the version catalog usage described in the `build-sign-distribute` skill. The `modularization-local-spm` skill explores modularization trade-offs that motivate extracting convention plugins in the first place.
