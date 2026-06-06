---
name: build-variants-flavors
description: Covers Android build types, product flavors, flavor dimensions, variant-specific source sets and resources, BuildConfig fields, and manifest placeholders using AGP 9 with Kotlin DSL. Use when configuring multi-environment or multi-tier Android builds that need distinct artifacts from a single codebase.
---

## When to use

Apply this skill when an Android app needs more than one deliverable artifact: separate debug and release builds, multiple distribution tiers (free vs. paid), environment-specific endpoints (dev/staging/prod), or white-label variants. It covers the full AGP 9 Kotlin DSL configuration surface for build types, product flavors, flavor dimensions, variant-aware source sets, `BuildConfig` fields, and manifest placeholders.

## Core guidance

### Build types

- Every Android project has `debug` and `release` built in; only configure what diverges from the defaults.
- Enable `isMinifyEnabled` and `isShrinkResources` exclusively on `release`; never on `debug` (slows iteration).
- Assign a distinct `applicationIdSuffix` (e.g., `.debug`) so debug and release can coexist on the same device.
- Set `isDebuggable = false` explicitly on `release` — do not rely on the default.
- Create a `staging` build type by extending `release` with `initWith(getByName("release"))` to inherit signing and R8 settings, then override only what differs.

### Product flavors and dimensions

- Declare every dimension used by at least one flavor in `flavorDimensions`; AGP 9 enforces this at sync time.
- A variant is the Cartesian product of one flavor per dimension plus a build type — keep dimensions and flavors minimal to avoid combinatorial explosion.
- Give dimensions purpose-driven names (`tier`, `environment`, `store`) rather than arbitrary labels.
- Do not add a flavor just to toggle a single boolean; a `BuildConfig` field on a build type is simpler.

### Variant-specific source sets

- Source sets follow the naming convention `src/<variantName>/`, `src/<flavorName>/`, `src/<buildType>/`, and `src/<dimension+flavor>/`.
- Place only the files that truly differ in a flavor/build-type source set; shared code stays in `src/main/`.
- Flavor source sets can contain Kotlin/Java files, resources, `res/` directories, and `AndroidManifest.xml` fragments — AGP merges them automatically.
- Keep the variant-specific manifest fragment minimal: declare only the entries (activities, providers) that are unique to that variant.

### BuildConfig fields

- Use `buildConfigField` for values known at build time (API base URLs, feature flags, analytics keys).
- Declare fields in build types or flavors, not both, to avoid ambiguous overrides.
- Access the generated constant as `BuildConfig.MY_FIELD` — the class is generated per variant under `BuildConfig.FLAVOR` and `BuildConfig.BUILD_TYPE` companion values.
- Ensure `buildFeatures { buildConfig = true }` is set; AGP 9 defaults it to `false`.

### Manifest placeholders

- Use `manifestPlaceholders` for values injected into `AndroidManifest.xml` at merge time — deep-link host names, Firebase `google_app_id`, or custom scheme authorities.
- Declare placeholders in the flavor or build type that owns the value; the manifest merger resolves them in priority order (variant > build type > flavor > main).
- Avoid duplicating a placeholder in multiple layers; if every variant uses the same value, put it in `defaultConfig`.

```kotlin
// app/build.gradle.kts — AGP 9 Kotlin DSL example
android {
    compileSdk = 36
    buildFeatures { buildConfig = true }

    defaultConfig {
        applicationId = "com.example.app"
        minSdk = 24
        targetSdk = 36
    }

    buildTypes {
        debug {
            applicationIdSuffix = ".debug"
            isDebuggable = true
            buildConfigField("String", "API_BASE_URL", "\"https://dev.api.example.com\"")
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            isDebuggable = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        create("staging") {
            initWith(getByName("release"))
            applicationIdSuffix = ".staging"
            buildConfigField("String", "API_BASE_URL", "\"https://staging.api.example.com\"")
            matchingFallbacks += listOf("release")
        }
    }

    flavorDimensions += listOf("tier", "store")

    productFlavors {
        create("free") {
            dimension = "tier"
            applicationIdSuffix = ".free"
            buildConfigField("Boolean", "PREMIUM_ENABLED", "false")
        }
        create("paid") {
            dimension = "tier"
            buildConfigField("Boolean", "PREMIUM_ENABLED", "true")
        }
        create("google") {
            dimension = "store"
            manifestPlaceholders["deepLinkHost"] = "app.example.com"
        }
        create("amazon") {
            dimension = "store"
            manifestPlaceholders["deepLinkHost"] = "amzn.example.com"
        }
    }
}
```

The snippet produces eight variants: `freeGoogleDebug`, `freeGoogleRelease`, `freeGoogleStaging`, `paidGoogleDebug`, `paidAmazonRelease`, etc.

### Selecting variants for CI

- Use `./gradlew assemble<Variant>` or `bundle<Variant>` to build a specific artifact in CI, for example `assemblePaidGoogleRelease`.
- Filter variants in the module to skip combinations that are never shipped using `variantFilter { ignore = (name == "freeAmazonStaging") }`.

## Platform notes

- **AGP 9 requirement** — `flavorDimensions` is a `MutableList<String>` in Kotlin DSL (`flavorDimensions += listOf(…)`); the deprecated `flavorDimensions("…")` call-style is removed.
- **`matchingFallbacks`** — when a library module does not publish a custom build type (e.g., `staging`), list the fallback name so the dependency graph resolves correctly.
- **Resource merging priority** — for a `freeGoogleDebug` variant, AGP merges resources in ascending priority: `main` < `free` < `google` < `debug` < `freeGoogle` < `freeGoogleDebug`. Higher-priority sources win on conflicts.
- **`google-services.json` per flavor** — place environment-specific JSON files at `src/<flavorName>/google-services.json`; the Google Services plugin selects the correct file per variant automatically.
- **`BuildConfig` in library modules** — library modules generate their own `BuildConfig` class but it does not include `APPLICATION_ID`; use `context.packageName` at runtime if you need the host app's ID.
- **Kotlin 2.2 / K2** — K2 incremental compilation interacts cleanly with variant-specific source sets; no special configuration is required, but ensure `kotlin.incremental=true` remains set in `gradle.properties`.

## Pitfalls

- **Forgetting `flavorDimensions`** — declaring a flavor without listing its dimension in `flavorDimensions` causes a sync error; add the dimension before defining any flavor that uses it.
- **Dimension order matters** — the variant name concatenates dimensions in the order they appear in `flavorDimensions`; reordering dimensions renames all variants and can break CI scripts and Play tracks.
- **Hardcoding secrets in `buildConfigField`** — secrets committed to `build.gradle.kts` are in version control. Read sensitive values from `local.properties` or environment variables and inject them via `providers.environmentVariable("KEY").orElse("default")`.
- **Over-proliferating variants** — each extra dimension doubles the number of variants and compile tasks. Prefer feature flags delivered at runtime (Firebase Remote Config, feature toggles) over build-time dimensions when variants exceed ~8.
- **Missing `initWith` on custom build types** — a `staging` build type created with `create("staging") { … }` without `initWith` inherits `debug` defaults (debuggable, no minification); always call `initWith(getByName("release"))` for production-like build types.
- **Conflicting `applicationIdSuffix` stacking** — both build type and flavor can append suffixes; the final `applicationId` is `defaultConfig.applicationId + flavor.suffix + buildType.suffix`. Verify the combined ID with `./gradlew dependencies --configuration <variant>RuntimeClasspath` or check the merged manifest.
- **Stale `BuildConfig` after flavor change** — if generated `BuildConfig` fields seem wrong, run `./gradlew clean` to force regeneration; incremental builds occasionally miss field-only changes.

## References

- **Documentation:** [Configure build variants](https://developer.android.com/build/build-variants)
- **Documentation:** [Create product flavors](https://developer.android.com/build/build-variants#product-flavors)

## See also

The `gradle-build-optimization` skill covers incremental build tuning and configuration cache — relevant once flavor count grows. The `build-sign-distribute` skill covers signing configurations for release variants and Play Console upload. The `ci-cd-signing` skill explains how to inject signing credentials and select the correct variant in automated pipelines.
