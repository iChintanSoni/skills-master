---
name: kotlin-multiplatform
description: Covers Kotlin Multiplatform (KMP) for sharing business logic across Android and iOS — source-set hierarchy, expect/actual declarations, KMP-ready libraries, and what belongs in shared vs platform-specific code. Use when setting up a KMP module, authoring shared domain or data layers, wiring expect/actual for platform APIs, or evaluating which libraries work in commonMain.
---

## When to use

Reach for this skill when building or maintaining a Kotlin Multiplatform module that shares code between Android and at least one other target (typically iOS). It covers the source-set structure, how to write platform-agnostic logic, how to break out of it cleanly with `expect`/`actual`, and which ecosystem libraries are ready for `commonMain`. It is a code-authoring reference; for the adopt-or-not tradeoffs see the `adopting-kmp` overview skill.

## Core guidance

### Source-set hierarchy

- `commonMain` is the universal shared source set. Place all business logic, domain models, repository interfaces, and use-cases here. Everything in `commonMain` compiles against the Kotlin standard library and any multiplatform-compatible dependencies only.
- `androidMain` and `iosMain` (or `appleMain`) are the platform-specific source sets. They see `commonMain` declarations and the full platform SDK. Provide `actual` implementations, platform-specific glue, and DI wiring here.
- Intermediate source sets (e.g., `nativeMain`, `appleMain`) let you share code between multiple Apple targets (iOS, macOS, watchOS) without duplicating it. Declare them in `kotlin { sourceSets { } }` and connect them with `dependsOn`.
- Keep `androidMain` thin. Android-specific boilerplate (Hilt modules, `Context` usage, `WorkManager` scheduling) lives in the Android app module, not in `androidMain` of the shared module.

### expect / actual declarations

- Use `expect` in `commonMain` to declare a contract that cannot be implemented in platform-agnostic code: a clock, a logger, a UUID generator, a file-path resolver.
- Provide an `actual` implementation in every platform source set that the `expect` declaration requires. Kotlin 2.2 enforces `actual` on every target; missing implementations are compile errors.
- Annotate `actual` declarations with `@OptIn(ExperimentalMultiplatformApi::class)` only when using experimental features — standard `expect`/`actual` no longer requires it in Kotlin 2.x.
- Keep `expect` interfaces narrow. Declare only what `commonMain` needs to call, not the full platform API surface. A large `expect` surface indicates the abstraction boundary is in the wrong place.
- Prefer `expect fun` or `expect class` over `expect object` when the implementation has state or lifecycle; `object` expect/actual are valid for stateless utilities (logging, platform info).

### What to share

| Layer | Share in commonMain? | Notes |
|---|---|---|
| Domain models (`data class`, `sealed interface`) | Yes | Pure Kotlin; no platform imports |
| Repository interfaces | Yes | Returns `Flow` or `suspend` functions |
| Repository implementations backed by network | Yes | Use Ktor + `kotlinx.serialization` |
| Repository implementations backed by local DB | Yes | Use Room KMP or SQLDelight |
| Use-cases / interactors | Yes | Orchestrate repos; depend only on interfaces |
| ViewModel / presentation | Partial | `commonMain` ViewModel with `kotlinx-coroutines`; platform-specific DI wiring in platform sets |
| UI | No | Android uses Compose; iOS uses SwiftUI |
| Platform services (camera, sensors, biometrics) | Via `expect`/`actual` | Narrow interface in common, implementation per platform |

### KMP-ready libraries

- **`kotlinx.coroutines`** — fully multiplatform; `Flow`, `StateFlow`, `Channel`, `async/await` all work in `commonMain`. Use `Dispatchers.Default` and `Dispatchers.IO` in shared code; do not reference `Dispatchers.Main` in `commonMain` (Android and iOS differ here).
- **`kotlinx.serialization`** — JSON, Protobuf, and CBOR codecs work across all targets. Annotate shared models with `@Serializable`; configure `Json { }` in `commonMain`.
- **Ktor client** — the HTTP client is multiplatform; only the engine is platform-specific. Declare the engine in each platform source set (`CIO` or `OkHttp` for Android, `Darwin` for iOS). Configure the `HttpClient` in a common factory that accepts the engine.
- **Room KMP** — Room 2.7+ ships a multiplatform artifact. Define `@Database`, `@Entity`, and `@Dao` interfaces in `commonMain`; provide a `RoomDatabase.Builder` in each platform source set using `expect`/`actual` or a constructor injection point.
- **SQLDelight** (alternative to Room KMP) — schema defined in `.sq` files, type-safe Kotlin generated for each target. Choose Room KMP if your team already uses Room on Android; choose SQLDelight for more control or when targeting non-Android JVM targets.
- **`kotlinx.datetime`** — multiplatform date/time; replaces `java.time` in `commonMain`. Do not import `java.util.Date` or `java.time.*` in `commonMain`.

### Gradle setup (Kotlin DSL)

```kotlin
// shared/build.gradle.kts
plugins {
    alias(libs.plugins.kotlinMultiplatform)
    alias(libs.plugins.androidLibrary)
    alias(libs.plugins.kotlinSerialization)
    alias(libs.plugins.ksp)                     // for Room KMP annotation processing
}

kotlin {
    androidTarget {
        compilations.all {
            kotlinOptions { jvmTarget = "17" }
        }
    }
    listOf(iosX64(), iosArm64(), iosSimulatorArm64()).forEach { target ->
        target.binaries.framework {
            baseName = "Shared"
            isStatic = true
        }
    }

    sourceSets {
        commonMain.dependencies {
            implementation(libs.kotlinx.coroutines.core)
            implementation(libs.kotlinx.serialization.json)
            implementation(libs.kotlinx.datetime)
            implementation(libs.ktor.client.core)
            implementation(libs.ktor.client.content.negotiation)
            implementation(libs.ktor.serialization.kotlinx.json)
            implementation(libs.room.runtime)           // Room KMP
        }
        androidMain.dependencies {
            implementation(libs.ktor.client.okhttp)     // Android engine
            implementation(libs.room.runtime.android)   // Android Room driver
        }
        iosMain.dependencies {
            implementation(libs.ktor.client.darwin)     // iOS engine
        }
    }
}
```

### expect / actual example: platform clock

```kotlin
// commonMain — narrow contract
expect fun currentEpochMillis(): Long

// androidMain — actual
actual fun currentEpochMillis(): Long = System.currentTimeMillis()

// iosMain — actual
actual fun currentEpochMillis(): Long =
    (NSDate.date().timeIntervalSince1970 * 1000).toLong()
```

## Platform notes

- **Android app module** — the Android app module depends on the shared KMP module as a regular `implementation` dependency. Hilt DI wiring, `Context`-requiring factory classes, and `WorkManager` schedules live in `:app`, not in `shared/androidMain`.
- **iOS framework** — the KMP shared module compiles to an `.xcframework` consumed by the iOS app via Swift Package Manager or CocoaPods. The `isStatic = true` setting on the framework is required for correct Swift interop when embedding into an Xcode project.
- **Kotlin 2.2 K2 compiler** — K2 is the default compiler for all targets including iOS. Multiplatform compilation is measurably faster in K2; ensure your Gradle plugin version matches (`kotlin("multiplatform") 2.2.x`).
- **`Dispatchers.Main`** — available in `commonMain` via `kotlinx-coroutines-core` on Android and via `kotlinx-coroutines-core` + the `Dispatchers.Main` polyfill on iOS (provided by the `kotlinx-coroutines-core` native artifact). Do not guard this behind `expect`/`actual` unless you have a custom main-thread concept.
- **Room KMP on iOS** — Room 2.7+ generates SQLite-backed implementations for iOS using the bundled SQLite. No additional native library linkage is needed for simulator or device targets.

## Pitfalls

- **Importing platform types in `commonMain`** — any `import android.*`, `import java.io.*`, or `import platform.UIKit.*` in `commonMain` breaks iOS compilation. Use `expect`/`actual` or a multiplatform library to abstract them.
- **Using `Dispatchers.IO` without awareness** — `Dispatchers.IO` is an Android/JVM concept; on iOS the KMP coroutine runtime provides a thread-pool dispatcher but it is not named `IO`. Code that calls `withContext(Dispatchers.IO)` in `commonMain` compiles and works on both, but it relies on the native runtime's default pool — profile if you see threading surprises on iOS.
- **Leaking `CoroutineScope` into the iOS framework API** — Swift does not understand `CoroutineScope`. Expose `commonMain` to iOS via plain callback wrappers or `async`/`Deferred` bridged through an iOS-side Swift wrapper, not raw `Flow` references.
- **Putting too much in `androidMain`** — if `androidMain` grows large it signals business logic has drifted platform-specific. Anything not needing an Android SDK type belongs in `commonMain`.
- **Not pinning the KSP version to the Kotlin version** — Room KMP uses KSP for annotation processing. KSP version must match the Kotlin version exactly (e.g., `2.2.0-1.0.x`). Mismatches produce confusing `symbol processor` errors at build time.
- **`expect class` with default constructor** — if an `expect class` has no constructor parameters and no `actual` body provides a constructor, the Kotlin compiler may generate an invisible default. Explicitly declare constructors in both `expect` and `actual` to avoid initialization surprises.
- **Forgetting `isStatic = true` on the iOS framework** — without it, the generated `.xcframework` uses dynamic linking, which requires additional Xcode embed-and-sign configuration and can cause symbol visibility issues in mixed Swift/ObjC projects.

## References

- **Documentation:** [Kotlin Multiplatform overview](https://kotlinlang.org/docs/multiplatform.html)
- **Documentation:** [Android developer guide to Kotlin Multiplatform](https://developer.android.com/kotlin/multiplatform)
- **Documentation:** [Share business logic between Android and iOS](https://kotlinlang.org/docs/multiplatform-share-on-platforms.html)
- **Documentation:** [Ktor multiplatform client](https://ktor.io/docs/client-create-multiplatform-application.html)

## See also

For structured concurrency patterns and `Flow` in shared code, see `kotlin-coroutines` and `kotlin-flow`. For Room-specific query and migration patterns (including KMP setup), see `room-database`. For the adopt-or-not decision and project structure tradeoffs, see the `adopting-kmp` overview skill. For network-layer patterns built on Ktor, see `networking-layer`.
