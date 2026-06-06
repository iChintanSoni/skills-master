---
name: choosing-di
description: Decision guide for selecting a dependency injection strategy on Android in 2026. Use when starting a new Android app or module, evaluating whether to adopt Hilt, or weighing compile-time annotation processing against runtime container approaches.
tags: [dependency-injection, hilt, koin, architecture, testing]
x-skills-master:
  domain: android
  class: overview
  category: overviews
  platforms: ["android", "large-screen"]
  requires: {android: "16", kotlin: "2.2"}
  pairs_with: [hilt-di]
  sources:
    - https://developer.android.com/training/dependency-injection
    - https://developer.android.com/training/dependency-injection/hilt-android
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for this skill when you need to decide how a module or app will wire its dependencies — at project start, when a library module needs to stay DI-framework-agnostic, when build times or binary size are a concern, or when a team is evaluating whether to migrate from one DI approach to another. Also useful when onboarding a team that is mixing constructor injection with a runtime container and wants to establish clear conventions.

## Core guidance

### The axes that matter

| Axis | Manual/constructor DI | Hilt | Koin | kotlin-inject / Metro |
|---|---|---|---|---|
| Wiring errors caught | At compile time (by you) | Compile time (kapt/KSP) | Runtime | Compile time (KSP) |
| Scoping to Android lifecycle | Manual, error-prone | Built-in (`@ActivityScoped`, `@ViewModelScoped`, …) | Supported but manual | Supported, less opinionated |
| Boilerplate | High as graph grows | Low after setup | Low | Low-medium |
| Build-time overhead | None | Moderate (KSP); high (kapt) | Minimal | Low (KSP) |
| ViewModel integration | Manual `ViewModelProvider.Factory` | `@HiltViewModel` + `hiltViewModel()` | `koinViewModel()` | Manual or adapter |
| Testability | Excellent (just pass fakes) | Excellent (`@UninstallModules`, `HiltAndroidRule`) | Good (`startKoin` per test) | Good |
| Library module suitability | Excellent | Poor (leaks framework dependency) | Poor | Poor |
| Community/tooling support | N/A | First-party, official | Large, active | Smaller, growing |

### Hilt — the recommended default

Use Hilt for any app-level module in a production Android app. It is Google's official answer to DI on Android and integrates directly with `ViewModel`, `WorkManager`, `Navigation`, `HiltTestRule`, and Compose's `hiltViewModel()`. The compile-time graph verification means binding mismatches surface as build errors, not crashes on a user's device.

Switch from `kapt` to `ksp` (`com.google.dagger:hilt-android-compiler` via KSP) to keep incremental build times acceptable — KSP is measurably faster on large graphs and is the direction Dagger/Hilt development is now focused on.

```kotlin
// Module declaration — wires a real implementation
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    @Provides
    @Singleton
    fun provideOkHttpClient(): OkHttpClient = OkHttpClient.Builder().build()

    @Provides
    @Singleton
    fun provideAnalyticsApi(client: OkHttpClient): AnalyticsApi =
        Retrofit.Builder().client(client).baseUrl("https://api.example.com/").build()
            .create(AnalyticsApi::class.java)
}

// ViewModel — injected automatically in Compose via hiltViewModel()
@HiltViewModel
class HomeViewModel @Inject constructor(
    private val analyticsApi: AnalyticsApi
) : ViewModel()
```

### Manual / constructor DI — the right tool for libraries and small apps

If you are building a standalone library module that will be consumed by apps, do not reach for any DI framework. Constructor injection keeps the library free of framework dependencies; the app can wire the library through whatever container it chooses. This is not a limitation — it is correct layering. For very small apps (single-screen utilities, internal tooling) where the dependency graph fits in one file, manual wiring in `Application.onCreate()` is entirely legitimate and avoids tooling overhead.

Manual DI also provides a useful baseline when teaching new hires: understanding what Hilt generates is easier once you have written a factory by hand.

### Koin — when runtime ergonomics outweigh compile-time safety

Koin is a pure-Kotlin, reflection-light service locator with DI ergonomics. It starts faster than Hilt at configuration time and requires no annotation processing, making it attractive for Kotlin Multiplatform projects that share a DI graph across Android and other targets (iOS via kotlin-inject bridge, desktop, server). In a pure-Android context, the trade-off is real: binding errors surface at runtime rather than build time. For a team shipping production software at scale, that trade-off is usually not worth it.

Choose Koin when: the project is Kotlin Multiplatform and sharing DI logic across targets, or a small-to-medium team finds the runtime flexibility genuinely valuable and has sufficient test coverage to catch wiring errors early.

### kotlin-inject / Metro — compile-time alternatives without Dagger

`kotlin-inject` (and its spiritual successor Metro, also KSP-based) offer Dagger-style compile-time guarantees with lighter syntax and better KMP support. They are reasonable choices when you want compile-time safety but find Dagger/Hilt's annotation surface heavy, or when targeting non-Android JVM/native targets. In 2026 they remain smaller ecosystems with less first-party Android integration than Hilt — `@HiltViewModel`, `HiltAndroidRule`, and `@UninstallModules` have no direct equivalents, so ViewModel and test wiring requires more manual glue.

### Decision routing

```
Is this a library module (no Application class)?
    Yes  → Constructor DI only. Stop.
    No   → Continue.

Is the project Kotlin Multiplatform with shared DI graph?
    Yes  → Koin or kotlin-inject. Evaluate KMP story per framework.
    No   → Continue.

Do you want compile-time graph verification and first-party Android lifecycle scoping?
    Yes  → Hilt (default). Use KSP, not kapt.
    No, runtime simplicity is acceptable → Koin.
```

## Platform notes

**Large screens / foldables** — DI choice does not affect adaptive layout, but Hilt's `@ActivityRetainedScoped` and `@ViewModelScoped` work correctly across configuration changes triggered by window size transitions. Ensure ViewModels are injected at the correct scope rather than recreated on each `Activity` restart.

**Compose** — `hiltViewModel()` from `androidx.hilt:hilt-navigation-compose` resolves a `@HiltViewModel` and ties its lifecycle to the `NavBackStackEntry`. This is the canonical pattern in Compose-first apps; Koin offers `koinViewModel()` with comparable ergonomics. Both are preferable to calling `viewModel()` and passing a custom factory manually.

**WorkManager** — `@HiltWorker` and `HiltWorkerFactory` are the only first-party path for injecting into `Worker` classes. If using Koin or manual DI, you must implement a custom `WorkerFactory` and register it in `WorkManager` configuration yourself.

**Baseline Profiles and binary size** — Hilt's generated code adds to APK size (typically 50–200 KB depending on graph size) and benefits from Baseline Profiles covering the component initialization path. Koin's runtime is lighter on generated code but still adds its own artefact. For size-constrained builds (Instant Apps, minimal APKs), profile before assuming either is a problem.

**Testing** — Hilt provides `@HiltAndroidTest`, `HiltAndroidRule`, and `@UninstallModules` / `@BindValue` for replacing real bindings with fakes in instrumented tests. For unit tests, constructor injection means you pass fakes directly — no framework involvement. This combination (Hilt for integration/UI tests, plain constructor injection for unit tests) is the cleanest testing architecture regardless of which DI approach you use at the app level.

## Pitfalls

- **Using Hilt in a library module** — `@InstallIn(SingletonComponent::class)` ties the library to an `Application` that hosts a Hilt component. Consumers without Hilt cannot use the library, and the binding leaks the library's internal implementation details. Libraries must use constructor injection.
- **Staying on `kapt` in 2026** — `kapt` runs on the JVM and is not incremental in the same way KSP is. Large Hilt graphs on `kapt` produce multi-second annotation processing steps. Migrate to KSP: replace `kapt("com.google.dagger:hilt-android-compiler:…")` with `ksp("com.google.dagger:hilt-android-compiler:…")` and add the KSP Gradle plugin.
- **`@Singleton` vs `@ActivityRetainedScoped` confusion** — injecting an object that holds UI state or a `Context` reference into `SingletonComponent` outlives the `Activity`. Use `@ActivityRetainedScoped` for ViewModel-adjacent objects that should survive configuration changes but not the full process lifetime.
- **Service locator anti-pattern inside ViewModels** — calling `EntryPoints.get(…)` or `GlobalContext.get()` (Koin) inside a `ViewModel` or business-logic class defeats testability. Dependencies should always arrive through the constructor.
- **Forgetting `@AndroidEntryPoint` on Fragments** — a `Fragment` that uses `@Inject` fields but is not annotated with `@AndroidEntryPoint` (or whose parent `Activity` is not) will compile but throw `IllegalStateException` at runtime. Annotate the entire chain: `Application`, `Activity`, `Fragment`.
- **Scoping objects too broadly for performance** — `@Singleton` objects are never garbage collected for the process lifetime. Holding large caches or bitmaps in singleton scope causes memory pressure. Prefer narrower scopes (`@ViewModelScoped`) and lazy initialization for heavy objects.
- **Mixing Hilt and Koin in one app** — while technically possible, running two DI containers simultaneously doubles initialization cost, creates two sources of truth for the same abstractions, and confuses contributors. Pick one framework per app and migrate fully rather than running them in parallel.

## References

- **Official Guide:** [Dependency Injection on Android](https://developer.android.com/training/dependency-injection)
- **Hilt Guide:** [Dependency Injection with Hilt](https://developer.android.com/training/dependency-injection/hilt-android)

## See also

For ViewModel wiring patterns that complement any DI approach, see `swiftui-state-data-flow` as a conceptual parallel for state isolation, and within the Android skill set see `navigation-architecture` for how `hiltViewModel()` interacts with the Compose `NavHost`. For testing strategies that rely on constructor injection, see `unit-testing-strategy` and `testing-async-code`. For modular app structures where the library vs app DI boundary is most important, see `modularization-local-spm` for structural parallels from the Apple ecosystem, or the Android `modularization` code skill for direct guidance.
