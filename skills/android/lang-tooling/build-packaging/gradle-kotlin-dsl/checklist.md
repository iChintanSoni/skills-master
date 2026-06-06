## Gradle Kotlin DSL setup checklist

### Project initialization

- [ ] `gradle/wrapper/gradle-wrapper.properties` pins Gradle 8.11 or later
- [ ] `gradle/libs.versions.toml` created with `[versions]`, `[libraries]`, and `[plugins]` sections
- [ ] All dependency versions and plugin versions are declared only in the catalog
- [ ] `settings.gradle.kts` declares `rootProject.name`
- [ ] `settings.gradle.kts` uses `dependencyResolutionManagement` with `FAIL_ON_PROJECT_REPOS`
- [ ] No per-project `repositories {}` blocks exist in any module `build.gradle.kts`

### app/build.gradle.kts

- [ ] `plugins {}` block is first, using `alias(libs.plugins.*)` syntax only
- [ ] `namespace` is explicitly set in the `android {}` block
- [ ] `compileSdk` and `targetSdk` are at the same current stable API level
- [ ] `minSdk` is set to the minimum you genuinely support
- [ ] `compileOptions` sets `sourceCompatibility` and `targetCompatibility` to `JavaVersion.VERSION_17`
- [ ] `kotlinOptions.jvmTarget` is set to `"17"`
- [ ] `buildFeatures { compose = true }` added only when using Compose
- [ ] `buildFeatures { buildConfig = true }` added only when `BuildConfig` is read in code
- [ ] `isMinifyEnabled = true` is set in the `release` build type with a ProGuard file

### Dependencies

- [ ] Every dependency uses a catalog alias (`libs.<alias>`), not an inline string
- [ ] `implementation` is used by default; `api` only where types are genuinely part of the public module API
- [ ] Compose dependencies are managed through the Compose BOM (`platform(libs.compose.bom)`)
- [ ] Test dependencies use `testImplementation`; instrumented tests use `androidTestImplementation`

### Multi-module projects

- [ ] Shared build logic lives in a `build-logic` included build, not in `buildSrc`
- [ ] The `build-logic` project references `libs.versions.toml` via `versionCatalogs`
- [ ] Convention plugins cover repeated `android {}` configuration across modules
- [ ] Each library module declares its own `namespace`

### Configuration cache and performance

- [ ] No `project.afterEvaluate {}` calls exist in build scripts
- [ ] Tasks are registered with `tasks.register {}` (lazy), not `tasks.create {}`
- [ ] No cross-project state reads outside of convention plugins
- [ ] Configuration cache is not explicitly disabled in `gradle.properties`
