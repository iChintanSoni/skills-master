## Modularization checklist

### Module structure
- [ ] App is split into at least three layers: `:app`, `:feature:*`, `:core:*`
- [ ] `:app` module is thin — it wires DI, navigation, and the manifest; no business logic
- [ ] `:core` modules contain no references to `:feature` or `:app`
- [ ] `:feature` modules do not import each other's implementation modules
- [ ] Cross-feature navigation uses a `:feature:x-api` contract module, not direct imports

### Dependency graph
- [ ] No circular dependencies between modules (`./gradlew :module:dependencies` runs clean)
- [ ] `api` scope is used only when a module's public API surface directly exposes the dependency's types
- [ ] `implementation` is the default dependency scope for all internal wiring
- [ ] SDK versions (`compileSdk`, `minSdk`) are centralised in `libs.versions.toml`, not duplicated per module

### Build configuration
- [ ] A `build-logic` included build exists with at least one `Convention` plugin
- [ ] Every Android library module applies a convention plugin instead of repeating AGP configuration
- [ ] Each library module declares a unique `namespace` in its `build.gradle.kts`
- [ ] Resources in each module are prefixed with the module name to avoid merge conflicts

### Testing
- [ ] Each module has its own `test` source set with unit tests runnable without the full app
- [ ] Shared test fakes are exposed via `testFixtures` rather than copied across modules
- [ ] CI runs per-module test tasks and leverages Gradle build cache for incremental runs

### Ownership and hygiene
- [ ] Each module has a designated owner (team or individual) documented in CODEOWNERS
- [ ] No `:core:utils` / `:common` dumping-ground module; shared code is in focused, named core modules
- [ ] Module count is justified — no micro-modules split before a real boundary pain was felt
- [ ] BuildConfig flags are not placed in library modules; they are injected via DI or passed at construction
