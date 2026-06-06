---
name: dependency-injection-patterns
description: Covers dependency injection approaches in Android — manual DI/service locator, Hilt, Koin, and compile-time alternatives (Metro/kotlin-inject) — with tradeoffs on compile safety, scoping, and testability. Use when choosing or evaluating a DI strategy, wiring services across Compose screens, or making code testable without a specific framework commitment.
---

## When to use

Apply this skill when selecting a dependency injection strategy for a new Android project, evaluating whether to migrate away from an existing approach, or designing how services (repositories, use cases, analytics, network clients) reach their consumers. It also applies when testability is suffering because concrete types are constructed internally rather than injected, or when scoping issues are causing memory leaks or unintended state sharing.

This skill frames the *choice* between approaches. It intentionally defers Hilt-specific wiring details (modules, component hierarchy, `@InstallIn`) to a dedicated Hilt skill.

## Core guidance

### What DI gives you

- Replace `SomeService()` calls inside business logic with constructor or property parameters.
- Depend on interfaces/abstractions, not concrete implementations — lets tests supply fakes without touching production code.
- Scope instances to the right lifetime (singleton, activity, screen/route) so state is neither leaked nor recreated unnecessarily.

### Manual DI

- Build a composition root — a plain class (often called `AppContainer`) that constructs the full object graph: `val httpClient = OkHttpClient(...)`, `val repo = UserRepository(httpClient)`, and so on.
- Attach a container to `Application.onCreate`; create screen-scoped sub-containers in the Activity/Fragment/NavHost entry point and clear them on exit.
- Returns the full power of the Kotlin type system: all wiring is visible, refactors are compile-checked, no annotation processing, no classpath magic.
- Scales well to ~2–3 feature modules; beyond that, the boilerplate of recreating the graph in every test or feature entry point becomes a drag.

```kotlin
// AppContainer.kt — plain composition root, no framework
class AppContainer(context: Context) {
    private val okHttp = OkHttpClient.Builder()
        .callTimeout(30, TimeUnit.SECONDS)
        .build()

    private val retrofit = Retrofit.Builder()
        .baseUrl("https://api.example.com/")
        .client(okHttp)
        .addConverterFactory(Json.asConverterFactory("application/json".toMediaType()))
        .build()

    // Singletons — one instance for the app lifetime
    val userRepository: UserRepository =
        UserRepositoryImpl(retrofit.create(UserApi::class.java))

    val analyticsService: AnalyticsService = FirebaseAnalyticsService(context)
}

// MyApp.kt
class MyApp : Application() {
    val container by lazy { AppContainer(this) }
}

// Usage in a Compose NavHost entry point
val repo = (application as MyApp).container.userRepository
val viewModel: UserViewModel = viewModel { UserViewModel(repo) }
```

### Hilt (compile-time, annotation-driven)

- Hilt generates the object graph at compile time via KAPT or KSP. Mistakes (missing bindings, wrong scope) are caught before the APK ships.
- Integrates directly with `ViewModel`, `WorkManager`, and `Navigation` through official Jetpack extensions.
- Annotation overhead (`@HiltViewModel`, `@Inject`, `@Module`, `@InstallIn`) increases build complexity but is hidden from feature code once infrastructure is set up.
- Best fit for apps with many modules, a dedicated platform team, and teams already familiar with Dagger concepts.
- See the dedicated Hilt skill for module setup, component hierarchy, and scoping annotations.

### Koin (runtime, DSL-based)

- Koin resolves the graph at runtime using a Kotlin DSL (`module { single { ... } factory { ... } }`). No annotation processing; easy to read and modify.
- Shorter build times than Hilt (no KAPT/KSP graph generation). Works well in KMP (Kotlin Multiplatform) projects since it has no Android-specific compile step.
- Binding errors surface at runtime rather than at compile time — an unregistered definition crashes the app on first use, not during `./gradlew build`.
- Koin 4.x introduced compile-time verification via `@KoinExperimentalAPI` checks, narrowing (but not eliminating) the runtime-error gap.

### Metro / kotlin-inject (compile-time, KSP-based)

- Metro (by Slack) and kotlin-inject are KSP-only, annotation-driven DI frameworks with Dagger-style compile-time safety but without the Dagger/Hilt classpath weight.
- Metro targets KMP and multi-module graphs; kotlin-inject is simpler and works well in single-platform projects.
- Both are production-ready but have smaller ecosystems and fewer Jetpack integrations than Hilt. You own the ViewModel factory wiring yourself.
- Choose these when you want compile-time guarantees, KSP speed, no Dagger learning curve, and are willing to handle Jetpack integration manually.

### Common rules regardless of framework

- Always inject through the constructor (or, for `ViewModel`, through `SavedStateHandle` + constructor). Avoid field injection except where the framework forces it.
- Use `interface` types for injected dependencies — tests replace implementations without touching production wiring.
- Never reach into a service locator (`get<MyService>()` or `(application as MyApp).container.something`) from inside a ViewModel or use-case — that couples business logic to the DI mechanism.
- Keep scopes as narrow as possible: prefer `@ViewModelScoped` over `@ActivityScoped` over `@Singleton`.

## Platform notes

- **Compose + ViewModel:** `hiltViewModel()` (Hilt) and `koinViewModel()` (Koin) both delegate to the Jetpack `ViewModelStoreOwner` — the scope is the NavBackStackEntry when inside a `NavHost`, giving you route-level scoping for free.
- **KMP/shared modules:** Hilt does not cross the Android boundary; Koin and kotlin-inject support KMP. Manual DI with `expect`/`actual` composition roots is also viable.
- **KSP vs KAPT:** As of AGP 8.x, Hilt supports KSP (incremental, faster). Prefer `ksp` over `kapt` in new projects — KAPT is in maintenance mode.
- **Testing:** All approaches support replacing the graph in tests. Hilt provides `@HiltAndroidTest` with test components; Koin provides `startKoin { modules(...) }` in a `@Before` block; manual DI just constructs the graph directly in the test.
- **ProGuard/R8:** Hilt-generated components and Koin's reflection are handled by their respective consumer rules. Verify with a release build that no `ClassNotFoundException` occurs in the DI bootstrap path.

## Pitfalls

- **Runtime crashes from unregistered Koin definitions.** Always test the full DI graph with an instrumented `checkModules()` verification test so missing bindings are found in CI, not in production.
- **Overusing `@Singleton` scope.** Scoping everything as a singleton leaks memory and causes state bleeding between test runs. Audit scope annotations the way you audit `static` fields in Java.
- **Service locator anti-pattern.** Calling `get<SomeService>()` (Koin) or `EntryPointAccessors.fromApplication(...)` (Hilt) deep inside a domain class couples it to the DI framework and makes it untestable without starting the container.
- **Fat composition roots.** A manual `AppContainer` that constructs 30 singletons in one class becomes its own maintenance burden. Split into sub-containers or feature-scoped containers as the app grows.
- **Circular dependencies.** All frameworks fail in different ways on circular graphs. Manual DI makes the cycle obvious at authoring time; Hilt fails at compile time with a clear error; Koin fails at runtime with a `StackOverflowError`.
- **Leaking Activity context into singleton scope.** Injecting `Activity` or a `Context` that wraps an `Activity` into a `@Singleton`-scoped dependency causes memory leaks. Use `@ApplicationContext` in Hilt, or pass `application.applicationContext` explicitly in manual DI.
- **Ignoring incremental build impact.** KAPT-based Hilt adds significant incremental build cost in large projects. Migrating to KSP noticeably reduces this; measure with `--profile` before dismissing the concern.

## Open question

**Should you use compile-time DI (Hilt, Metro, kotlin-inject) or runtime DI (Koin, manual)?**

The core tradeoff has genuine merit on both sides and the Android community has not converged on a single answer.

Compile-time DI (Hilt being the Google-recommended option) catches missing bindings, wrong scopes, and cycle errors during `./gradlew build`. In large multi-module codebases this turns runtime mysteries into clear compiler errors and reduces on-call incidents from DI misconfiguration. The cost is annotation-processing build time, a steeper learning curve (especially Hilt's Dagger component hierarchy), and an Android-only boundary that complicates KMP.

Runtime DI (Koin being the most widely adopted) trades the compile-time safety net for dramatically simpler setup, idiomatic Kotlin DSLs, and KMP compatibility. Teams moving fast on greenfield projects often find Koin's lower ceremony more important than its deferred error detection, especially when `checkModules()` tests are part of the CI pipeline.

Manual DI (a plain composition root) offers full compile-time safety without any framework at all, at the cost of boilerplate that grows super-linearly with graph size. It is often the right answer for libraries, small apps, or codebases where "no external DI framework" is a constraint.

Neither option is universally correct. The decision depends on: team familiarity with Dagger, whether the project targets KMP, the size and modularity of the codebase, and how much build-time cost is acceptable. Google's official documentation recommends Hilt for most apps; this skill presents the tradeoffs rather than echoing that recommendation uncritically.

## References

- **Documentation:** [Dependency injection on Android](https://developer.android.com/training/dependency-injection)
- **Documentation:** [Manual dependency injection](https://developer.android.com/training/dependency-injection/manual)

## See also

For the concrete mechanics of Hilt modules, component scopes, `@Provides`, and `@Binds`, see a dedicated Hilt skill. For how injected ViewModels connect to Compose screens and how `SavedStateHandle` participates in the graph, see a Compose architecture or ViewModel scoping skill. For modular project structure that shapes where composition roots live, see a modularization skill.
