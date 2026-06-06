## KMP adoption decision checklist

### Fit assessment

- [ ] Both apps share non-trivial business logic or data models that change together (not just HTTP + JSON).
- [ ] The platforms behave similarly enough that shared logic does not require heavy `expect/actual` branching.
- [ ] The team has at least one engineer comfortable with Kotlin Multiplatform project structure and Gradle multiplatform setup.
- [ ] The iOS team has agreed to the integration model (binary XCFramework via SPM or direct Gradle build).

### Scope decision — what to share

- [ ] Domain models and business logic are identified as the primary sharing target.
- [ ] The network layer uses (or will adopt) Ktor and kotlinx.serialization, both of which have KMP artifacts.
- [ ] Persistence is evaluated: SQLDelight (KMP-native) vs. platform-specific stores (Room on Android, Core Data / SwiftData on iOS).
- [ ] ViewModels and presentation state are explicitly excluded from the first shared module unless the team has confirmed both platforms accept the same state shape.
- [ ] UI is confirmed as platform-native (Compose on Android, SwiftUI on iOS); Compose Multiplatform is treated as a separate future decision.

### Rollout planning

- [ ] A single bounded context (one feature or one layer) is chosen for the first shared module, not the entire codebase.
- [ ] The rollout plan keeps both apps shippable at the end of each increment — no shared-module branch that blocks either platform.
- [ ] Android consumption of the shared module is validated in production before the iOS integration begins.
- [ ] The XCFramework build is integrated into CI (not into local iOS developer builds) to avoid blocking iOS engineers on Kotlin/Native compile times.
- [ ] The CI pipeline builds and tests the shared module on both the JVM target and the Kotlin/Native iOS target.

### Dependency and API hygiene

- [ ] Every library added to `commonMain` has a published KMP artifact (verified on Maven Central or the library's KMP support page).
- [ ] No JVM-only libraries are referenced in `commonMain`.
- [ ] Public API surfaces exposed to Swift are reviewed for ergonomics — generic sealed classes and suspend functions are wrapped or annotated with `@ObjCName` where needed.
- [ ] `expect/actual` usage is minimal and documented; each `actual` declaration has a clear reason for platform divergence.

### Team readiness

- [ ] Ownership of the shared module is assigned: who reviews PRs, who is on-call for Kotlin/Native build failures.
- [ ] The iOS team has completed a short onboarding to distinguish Kotlin shared-module bugs from Swift integration bugs.
- [ ] The Kotlin plugin version (2.2+) and Kotlin Multiplatform plugin are pinned in `libs.versions.toml`.
- [ ] A decision log entry records why KMP was adopted (or deferred), what is shared, and the date — so it can be revisited as tooling matures.
