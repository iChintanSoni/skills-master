---
name: adopting-kmp
description: Decision router for adopting Kotlin Multiplatform (KMP) to share code between Android and iOS — covering what to share vs keep native, an incremental rollout path, and team/tooling considerations. Use when evaluating whether KMP is right for a project, deciding which code layers to share first, planning an incremental rollout from a single shared module, or assessing team readiness and CI impact.
---

## When to use

Reach for this skill when your team ships both an Android and iOS app and is weighing whether to share Kotlin code between them. It applies when:

- Evaluating KMP for a new or existing product that currently maintains two separate codebases.
- Deciding which layers (domain, data, network, analytics) to share versus which to leave platform-native (UI, platform sensors, system APIs).
- Planning a rollout that keeps both apps shippable at every step — no big-bang rewrites.
- Assessing what the shared module means for build pipelines, Xcode integration, and team skill requirements.

This is a routing skill. Implementation details live in the linked code skills.

## Core guidance

### Is KMP the right call?

KMP pays off when the same business rules, data models, or network contracts would otherwise be duplicated and kept in sync across two teams. It pays off least when:

- The two apps diverge significantly in behavior (not just UI), so "shared" logic quickly accumulates `expect/actual` splits that defeat the purpose.
- The team is small enough that duplication is cheap and KMP's tooling overhead exceeds the sync cost.
- One platform is a thin client or MVP that may be sunset; sharing adds permanence to code that should stay disposable.

A good heuristic: if you already copy-paste data classes, API contracts, or validation logic between your Android and iOS repos, KMP will pay its setup cost within a few months. If the platforms are architecturally different, evaluate carefully.

### What to share vs keep native

Share code that is platform-agnostic and changes together:

| Layer | Share? | Notes |
|---|---|---|
| Domain models and business logic | Yes — primary target | Pure Kotlin, no platform deps |
| Repository interfaces and use cases | Yes | Keep `expect/actual` minimal |
| Network layer (Ktor, serialization) | Yes | Ktor and kotlinx.serialization are KMP-ready |
| Local persistence (SQLDelight) | Yes | SQLDelight targets KMP natively |
| Analytics events / logging contracts | Yes | Thin event definitions share well |
| ViewModels / presentation logic | Optional | Use only if both platforms accept the same state shape |
| UI | No | Keep Jetpack Compose on Android, SwiftUI on iOS |
| Platform APIs (camera, Bluetooth, etc.) | No | Use `expect/actual` sparingly for thin platform bridges |

Keep UI native. Compose Multiplatform (CMP) exists and is production-ready for many targets, but it changes the tradeoff: it replaces SwiftUI rather than complementing it, requires iOS engineers to accept a Kotlin-rendered UI, and is its own adoption decision separate from sharing logic. Do not conflate KMP (shared logic) with CMP (shared UI) during initial evaluation.

### Incremental rollout path

1. **Create one shared module** — a standalone Kotlin Multiplatform library (`:shared` or `:core:network`) that compiles to a Kotlin library for Android and a `.xcframework` for iOS. Start with one bounded context (e.g., the network layer or domain models for a single feature).
2. **Consume on Android first** — wire the shared module into the Android app as a Gradle dependency. Keep the iOS app unchanged. This validates the shared code without touching Xcode.
3. **Generate and integrate the XCFramework** — run `./gradlew assembleXCFramework`, add the output to the Xcode project (via Swift Package Manager local reference or binary embed). Have the iOS team replace one file at a time with calls into the shared module.
4. **Expand one layer at a time** — after the first module is stable in production on both platforms, extend shared coverage to the next layer. Do not attempt to share everything up front.
5. **Harden CI** — add a single Gradle task that builds and tests the shared module on both the JVM target (fast) and the native (Kotlin/Native) target. Gate PRs on both.

```kotlin
// shared/build.gradle.kts — minimal KMP module setup
plugins {
    alias(libs.plugins.kotlin.multiplatform)
    alias(libs.plugins.android.library)
}

kotlin {
    androidTarget()
    iosArm64()
    iosX64()
    iosSimulatorArm64()

    sourceSets {
        commonMain.dependencies {
            implementation(libs.ktor.client.core)
            implementation(libs.kotlinx.serialization.json)
            implementation(libs.kotlinx.coroutines.core)
        }
        androidMain.dependencies {
            implementation(libs.ktor.client.okhttp)
        }
        iosMain.dependencies {
            implementation(libs.ktor.client.darwin)
        }
    }
}
```

### Team and tooling considerations

- **Kotlin/Native compilation is slower** than JVM. Build times for the iOS target can be 2–4× the Android build. Mitigate by building the `.xcframework` only in CI and caching it, not on every local iOS build.
- **Swift interop has limits.** Kotlin generics, sealed classes with generic parameters, and suspension functions require care to surface cleanly in Swift. Use the `@ObjCName` annotation and design public API boundaries with Swift ergonomics in mind. The Kotlin-Swift interoperability roadmap (direct interop, not ObjC bridge) is landing in Kotlin 2.x and improves this significantly.
- **iOS team skill gap.** Android engineers own the shared module; iOS engineers call into it. Define ownership clearly. iOS engineers need to understand when to file a Kotlin bug vs. a Swift-integration bug. Plan a short onboarding session before the first iOS integration.
- **Dependency hygiene.** Only libraries that publish KMP artifacts belong in `commonMain`. Check `search.maven.org` or the library's KMP compatibility table before adding a dependency. Wrapping a JVM-only library in `expect/actual` for every platform is usually a sign the abstraction should live in platform-specific code.
- **Xcode integration options:** Swift Package Manager local package reference is the least-friction approach for teams using modern Xcode. CocoaPods is legacy; prefer SPM for new integrations.

## Platform notes

- **Android** consumes the shared module as a regular Gradle library artifact — no special configuration once the `:shared` module is on the `androidTarget()`. Use it exactly like any other module.
- **Large-screen / ChromeOS** — KMP shared modules are unaffected by form factor; the Android consumption layer still adapts UI per window size class independently.
- **iOS** targets `iosArm64`, `iosX64` (for Intel CI machines), and `iosSimulatorArm64`. All three are required for a universal XCFramework that works on physical devices and simulators. If your CI is Apple Silicon only, dropping `iosX64` is acceptable but document the decision.
- **Kotlin/Native memory manager** — the new default memory manager (shipped since Kotlin 1.7.20) makes coroutines and shared mutable state far more predictable on iOS. Kotlin 2.2 uses it exclusively; there is no need to configure or opt in.

## Pitfalls

- **Sharing too much too soon.** Trying to share ViewModels, presentation state, and UI logic in the first module adds `expect/actual` complexity before the team understands where the natural seams are. Start with pure domain and data layers.
- **Conflating KMP (shared logic) with Compose Multiplatform (shared UI).** These are separate decisions. CMP on iOS means iOS engineers use a Kotlin/Compose UI, which requires buy-in from product, design, and the iOS team — not just the Android team.
- **Blocking iOS builds on Kotlin/Native compilation.** If the Xcode build triggers a Gradle KMP build on every run, compile times become a pain point. Pre-build the XCFramework in CI and consume it as a binary in Xcode for day-to-day iOS development.
- **Ignoring Swift API ergonomics.** Sealed classes surface in Swift as abstract classes with subclasses — usable but not idiomatic. Design public shared API surfaces with a Swift caller in mind, or add a Swift wrapper layer for complex types.
- **Using JVM-only libraries in `commonMain`.** A dependency that does not publish a KMP artifact will cause a compilation error for the iOS target at build time — often discovered only after the library is already wired into the architecture.
- **Letting `expect/actual` sprawl.** If `actual` implementations diverge significantly between platforms, the shared module is doing more harm than good. Reconsider the boundary.

## References

- **Documentation:** [Kotlin Multiplatform — Android Developer](https://developer.android.com/kotlin/multiplatform)
- **Documentation:** [Kotlin Multiplatform — kotlinlang.org](https://kotlinlang.org/docs/multiplatform.html)

## See also

For structuring the Android side of a shared module into clean layers, see `navigation-architecture` and `dependency-injection`. For persistence in shared code, see SQLDelight (covered under the persistence decision skill). For the Ktor HTTP client used in `commonMain`, see `networking-layer`.
