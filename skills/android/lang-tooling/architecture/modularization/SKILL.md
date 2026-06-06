---
name: modularization
description: Guides splitting an Android app into :app, :feature, and :core Gradle modules with clean dependency boundaries, cycle-free graphs, and shared convention plugins. Use when extracting features into dedicated modules, designing api vs implementation dependency scopes, speeding up build and test cycles, or reducing coupling in a growing monolithic app.
globs:
  - "**/*.kt"
tags: [modularization, architecture, gradle, build-speed, android]
x-skills-master:
  domain: android
  class: lang-tooling
  category: architecture
  platforms: ["android"]
  requires: {android: "16", kotlin: "2.2"}
  pairs_with: []
  sources:
    - https://developer.android.com/topic/modularization
    - https://developer.android.com/topic/modularization/patterns
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Apply this skill when a single-module app is growing slow to build, hard to test in isolation, or difficult to own across multiple teams. Modularization earns its overhead when parallel feature development, strict ownership boundaries, or Gradle build caching become real needs. If the app is small and builds in seconds, stay in one module — added `build.gradle.kts` files and inter-module wiring add ceremony that only pays off at scale.

## Core guidance

- **Layer by dependency direction.** Organise into three tiers: leaf `:core` modules (network, database, design system, models), `:feature` modules that depend on `:core`, and a thin `:app` module that wires everything together and owns the manifest. Dependencies always flow inward — a `:core` module must never import a `:feature`.
- **Keep `:app` thin.** The app module should set up dependency injection, wire navigation, and delegate everything else to features. A thin app target compiles in seconds and improves iteration speed.
- **Use `api` sparingly; prefer `implementation`.** Expose a dependency transitively via `api` only when callers genuinely need its types. Over-using `api` leaks your module's internal dependencies and inflates consumers' compile classpaths.
- **Split each feature's public contract into an `-api` artifact.** When feature A needs to navigate to feature B, depend on `:feature:b-api` (interfaces, route descriptors, plain types) rather than `:feature:b`. This keeps the build graph wide and parallel and prevents rebuild cascades when B's internals change.
- **Avoid dependency cycles.** Gradle does not permit circular dependencies between project modules; design boundaries before the cycle forms. If two modules need each other's types, extract the shared types into a third `:core` module.
- **Write tests inside the module.** Each module gets its own `test` and `androidTest` source sets, so logic is verified without running the full app — fast, hermetic, and CI-cache-friendly.
- **Use convention plugins for shared config.** A `build-logic` included build exposes reusable `Convention` plugins (e.g., `AndroidLibraryConventionPlugin`, `ComposeConventionPlugin`) that apply AGP, Kotlin, and lint config once and are consumed by every module's `build.gradle.kts`.
- **Do not over-modularize.** Dozens of micro-modules multiply configuration files, slow Gradle configuration phase, and create fragile dependency graphs. Start with coarse modules and split when a real boundary hurts.

```kotlin
// build-logic/convention/src/main/kotlin/AndroidLibraryConventionPlugin.kt
// A convention plugin shared by all :core and :feature library modules.

import com.android.build.gradle.LibraryExtension
import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.kotlin.dsl.configure

class AndroidLibraryConventionPlugin : Plugin<Project> {
    override fun apply(target: Project) = with(target) {
        with(pluginManager) {
            apply("com.android.library")
            apply("org.jetbrains.kotlin.android")
        }
        extensions.configure<LibraryExtension> {
            compileSdk = 36
            defaultConfig.minSdk = 26
            compileOptions {
                sourceCompatibility = JavaVersion.VERSION_17
                targetCompatibility = JavaVersion.VERSION_17
            }
        }
    }
}

// :feature:profile:build.gradle.kts  — consume the convention plugin
plugins {
    id("convention.android.library")   // applies AGP + Kotlin from build-logic
    id("convention.android.compose")   // adds Compose compiler + dependencies
}

dependencies {
    implementation(project(":core:network"))
    implementation(project(":core:ui"))
    // api NOT used — callers of :feature:profile don't need :core:network types
}
```

## Platform notes

- **Gradle configuration cache.** Convention plugins that are cache-compatible (no `Project` references at execution time) maximise the benefit of Gradle's configuration cache. Use `providers` and `extensions` rather than accessing `project` inside task actions.
- **AGP `namespace` vs `applicationId`.** Every library module needs a unique `namespace` in its `build.gradle.kts`; only `:app` sets `applicationId`. Forgetting `namespace` in AGP 8+ is a build error.
- **Resource merging.** Duplicate resource names across modules cause a merge conflict at the app level. Prefix resources with the module name (e.g., `profile_` for `:feature:profile`) to avoid collisions.
- **BuildConfig per module.** Each library module generates its own `BuildConfig` class. Avoid putting app-level flags in library `BuildConfig`; pass them in via constructor/DI instead.
- **Dynamic Feature Modules.** If targeting Play's on-demand delivery, `:feature` modules become `:dynamic-feature` modules that depend on `:app` in reverse. This inverts the typical graph and requires the `SplitInstallManager` API; only adopt it when you need on-demand install, not for ordinary modularization.

## Pitfalls

- **Cycle via shared state.** Placing a shared singleton or `EventBus` in `:feature:a` and importing it from `:feature:b` introduces a hidden cycle. Move shared state upward into `:core`.
- **Over-using `api` dependencies.** Every `api` declaration leaks transitive classpath entries; callers recompile when those transitive dependencies change. Default to `implementation`; use `api` only for types that appear in the module's own public API surface.
- **Skipping the `-api` split for features.** Without a separate `-api` artifact, changing any internal class in `:feature:b` triggers recompilation of every module that imports `:feature:b` — including `:app`. The split is extra structure but recovers build time at scale.
- **Inconsistent minSdk / compileSdk across modules.** Each module compiles independently; a library targeting a higher `minSdk` than `:app` causes lint errors or runtime crashes on lower-API devices. Centralise SDK versions in `libs.versions.toml`.
- **Large modules with no clear owner.** A `:core:utils` dumping ground grows without bound and becomes a source of hidden coupling. Prefer focused `:core:network`, `:core:database`, `:core:ui` modules with explicit owners.
- **Missing `testFixtures`.** Sharing test fakes across modules requires the `java-test-fixtures` plugin; copying fakes leads to drift. Enable `android { testFixtures { enable = true } }` in shared core modules to expose a stable fake API for consumers.
- **Convention plugin misconfiguration.** A convention plugin that uses `project.dependencies.add` at configuration time breaks the configuration cache. Wrap deferred work in `afterEvaluate` only as a last resort; prefer lazy APIs like `withPlugin`.

## References

- **Documentation:** [Guide to Android app modularization](https://developer.android.com/topic/modularization)
- **Documentation:** [Common modularization patterns](https://developer.android.com/topic/modularization/patterns)

## See also

The `android-navigation-architecture` skill complements this one — once features are separate modules, a type-safe navigation graph connects them without creating direct feature-to-feature imports. The `dependency-injection` skill (Hilt/Koin) explains how to scope DI components per module and wire the dependency graph across module boundaries. For build configuration details, the `build-sign-distribute` skill covers AGP configuration, signing, and release pipelines that operate across a multi-module project.
