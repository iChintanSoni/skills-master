---
name: hilt-di
description: Covers Hilt dependency injection for Android — @HiltAndroidApp, @AndroidEntryPoint, @HiltViewModel, modules, scopes, qualifiers, assisted injection, EntryPoint, and testing. Use when wiring DI into an Android app with Hilt.
globs:
  - "**/*.kt"
tags: [hilt, dependency-injection, android, architecture, viewmodel, testing]
x-skills-master:
  domain: android
  class: code
  category: architecture
  platforms: ["android", "large-screen"]
  requires: { "android": "16", "kotlin": "2.2", "compose-bom": "2026.05.00" }
  pairs_with: []
  sources:
    - https://developer.android.com/training/dependency-injection/hilt-android
    - https://developer.android.com/training/dependency-injection/hilt-jetpack
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Apply this skill whenever you are setting up or extending Hilt DI in an Android project — adding a new component, scoping a dependency, wiring a ViewModel, creating a module, using assisted injection, bridging non-Hilt code via `EntryPoint`, or writing Hilt-aware instrumented tests. For the decision of whether to adopt Hilt over manual DI or Koin, see the `choosing-di` overview skill.

---

## Core guidance

### Project bootstrap

- Annotate exactly one `Application` subclass with `@HiltAndroidApp`. This triggers Hilt's code generation and creates the root application component.
- Annotate every Activity, Fragment, View, Service, or BroadcastReceiver that receives injected fields with `@AndroidEntryPoint`. The parent must also be annotated.

### Constructor injection — prefer it always

- Mark primary constructors with `@Inject` so Hilt can create instances without a module.
- Keep injected classes free of Android framework types; put framework dependencies behind an abstraction injected through the constructor.

### Modules

- Use `@Module` + `@InstallIn(SomeComponent::class)` to tell Hilt which component owns the bindings.
- Prefer `@Binds` (abstract function, zero runtime overhead) over `@Provides` when binding an interface to an implementation.
- Use `@Provides` for third-party types, builders, or any object you cannot annotate directly.
- One module per feature or logical group — avoid monolithic `AppModule` files.

### Scopes

| Scope annotation | Component | Lifecycle |
|---|---|---|
| `@Singleton` | `SingletonComponent` | App lifetime |
| `@ActivityRetainedScoped` | `ActivityRetainedComponent` | Survives config change |
| `@ViewModelScoped` | `ViewModelComponent` | ViewModel lifetime |
| `@ActivityScoped` | `ActivityComponent` | Activity lifetime |

- Only scope a binding when shared state is genuinely required; unscoped bindings are cheaper.
- Prefer `@ViewModelScoped` for repository-like objects used exclusively from a single ViewModel.

### ViewModels

- Annotate ViewModel classes with `@HiltViewModel` and inject via the constructor with `@Inject`.
- In Compose, use `hiltViewModel()` from `androidx.hilt:hilt-navigation-compose` — it respects the `NavBackStackEntry` scope.
- Pass `creationCallback` to `hiltViewModel()` when combined with assisted injection.

### Qualifiers

- Create a `@Qualifier` annotation to distinguish multiple bindings of the same type (e.g. two `OkHttpClient` instances).
- Prefer named qualifiers over wrapper types — they carry zero runtime cost.

### Assisted injection

- For objects whose parameters are only known at call-site (e.g. a `DetailViewModel` that needs a runtime `itemId`), use `@AssistedInject` on the constructor and `@AssistedFactory` on a factory interface.
- Hilt generates the factory; pass it through `hiltViewModel(creationCallback = ...)`.

### EntryPoint — escaping Hilt

- When injecting into a class Hilt cannot manage (e.g. a `ContentProvider`, a WorkManager `Worker` created externally, or a legacy class), declare an `@EntryPoint` interface and retrieve it with `EntryPointAccessors`.
- Workers created via `HiltWorkerFactory` do not need a manual `EntryPoint`.

### Testing

- Annotate instrumented test classes with `@HiltAndroidTest` and use `@get:Rule val hiltRule = HiltAndroidRule(this)`.
- Replace bindings in tests with `@UninstallModules` + a local `@TestInstallIn` module, or use `@BindValue` for a single field replacement.
- For local unit tests, construct dependencies manually — Hilt is an instrumented-only framework.

```kotlin
// Typical wiring: interface, impl, module, ViewModel, and Compose entry point

// 1. Domain interface — no Android imports
interface UserRepository {
    suspend fun getUser(id: String): User
}

// 2. Implementation — constructor-injected
class UserRepositoryImpl @Inject constructor(
    private val api: UserApi,
    private val db: UserDao,
) : UserRepository {
    override suspend fun getUser(id: String) = api.fetchUser(id)
}

// 3. Module — binds interface to impl, lives in SingletonComponent
@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {
    @Binds
    @Singleton
    abstract fun bindUserRepository(impl: UserRepositoryImpl): UserRepository
}

// 4. ViewModel — scoped to ViewModel, hiltViewModel() resolves it in Compose
@HiltViewModel
class UserViewModel @Inject constructor(
    private val repo: UserRepository,
) : ViewModel() {
    val user = savedStateHandle.getStateFlow<User?>("user", null)
}

// 5. Compose screen
@Composable
fun UserScreen(vm: UserViewModel = hiltViewModel()) {
    val user by vm.user.collectAsStateWithLifecycle()
    // ...
}
```

---

## Platform notes

**Large-screen / multi-Activity apps**
- Each Activity gets its own `ActivityComponent` and `ActivityRetainedComponent`. Shared state across Activities must live in `SingletonComponent`.
- Avoid `@ActivityScoped` bindings that hold large bitmaps or context-heavy objects — they will not be released until the Activity is destroyed, which on large screens can be much later than expected.

**Compose Navigation**
- `hiltViewModel()` called inside a `NavHost` destination composable automatically ties the ViewModel to the back-stack entry, not the host Activity. This is the correct scoping for destination-level state.

**WorkManager**
- Add `HiltWorkerFactory` to WorkManager's configuration and use `@HiltWorker` + `@AssistedInject` on `CoroutineWorker` subclasses — no `EntryPoint` boilerplate needed.

---

## Pitfalls

- **Injecting into a non-`@AndroidEntryPoint` class** — Hilt silently skips field injection; dependencies remain null. Always check the full hierarchy is annotated.
- **Forgetting `@InstallIn`** — the module compiles but is ignored at runtime, causing `UnsatisfiedDependencyException`. Every `@Module` needs `@InstallIn`.
- **Over-scoping with `@Singleton`** — makes objects live for the entire app lifetime and blocks garbage collection. Default to unscoped; add `@Singleton` only when shared mutable state or expensive initialisation justifies it.
- **Using `@ActivityScoped` for ViewModels** — the correct scope is `@ViewModelScoped` (or `@HiltViewModel` for the ViewModel itself). `@ActivityScoped` does not survive configuration changes.
- **Mixing `hiltViewModel()` with manual `ViewModelProvider`** — bypasses Hilt's injection; the ViewModel's `@Inject` constructor will not be called and you will get an `InstantiationException`.
- **Circular dependencies** — Hilt detects these at compile time. Break cycles with a lazy `Provider<T>` parameter or by extracting a shared dependency.
- **`@BindValue` field must be `lateinit var` or nullable** — trying to use a `val` with `@BindValue` in a test causes a compile error.
- **EntryPoint interface in wrong component** — `EntryPointAccessors.fromApplication()` requires `@InstallIn(SingletonComponent::class)`; using `ActivityComponent` throws at runtime.

---

## References

- **Documentation:** [Dependency injection with Hilt](https://developer.android.com/training/dependency-injection/hilt-android)
- **Documentation:** [Hilt and Jetpack integrations](https://developer.android.com/training/dependency-injection/hilt-jetpack)
- **API reference:** [Hilt annotations — developer.android.com](https://developer.android.com/training/dependency-injection/hilt-testing)

---

## See also

For choosing between Hilt, Koin, and manual DI see `choosing-di`. For ViewModel state management patterns that complement Hilt-injected ViewModels see `compose-state` and `swiftui-state-data-flow` (iOS analogue for cross-platform teams). For background work wired through Hilt see the WorkManager integration covered in `background-tasks`.
