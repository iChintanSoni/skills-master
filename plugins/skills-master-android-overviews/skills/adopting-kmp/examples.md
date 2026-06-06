## Example: Shared domain model and repository interface

A team building a finance app shares its account domain model and repository contract so both Android and iOS use the same types, validation, and coroutine-based fetch API.

```kotlin
// shared/src/commonMain/kotlin/com/example/finance/domain/Account.kt
data class Account(
    val id: String,
    val displayName: String,
    val balanceCents: Long,
    val currency: String
) {
    val isOverdrawn: Boolean get() = balanceCents < 0
}

// shared/src/commonMain/kotlin/com/example/finance/domain/AccountRepository.kt
interface AccountRepository {
    suspend fun getAccounts(): Result<List<Account>>
    suspend fun getAccount(id: String): Result<Account>
}
```

```kotlin
// shared/src/commonMain/kotlin/com/example/finance/data/AccountRepositoryImpl.kt
class AccountRepositoryImpl(
    private val api: AccountApiClient   // Ktor-based, also in commonMain
) : AccountRepository {
    override suspend fun getAccounts(): Result<List<Account>> =
        runCatching { api.fetchAccounts().map { it.toDomain() } }

    override suspend fun getAccount(id: String): Result<Account> =
        runCatching { api.fetchAccount(id).toDomain() }
}
```

**Android consumption** — Hilt provides the implementation; the ViewModel holds `AccountRepository` directly from the shared module.

```kotlin
// android/src/main/kotlin/.../AccountViewModel.kt
@HiltViewModel
class AccountViewModel @Inject constructor(
    private val repo: AccountRepository   // injected from shared module
) : ViewModel() {
    val accounts = flow { emit(repo.getAccounts()) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), Result.success(emptyList()))
}
```

**iOS consumption** — Swift calls the same `AccountRepositoryImpl` via the generated ObjC header; no duplicate network or mapping code.

```swift
// iOS/AccountViewModel.swift
@MainActor
class AccountViewModel: ObservableObject {
    @Published var accounts: [Account] = []
    private let repo: AccountRepository

    init(repo: AccountRepository) { self.repo = repo }

    func load() async {
        if let result = try? await repo.getAccounts() {
            accounts = result
        }
    }
}
```

---

## Example: Incremental rollout — Android-only first, then iOS

A team with an existing Android-only app adds a KMP `:shared:network` module and consumes it on Android before touching iOS.

**Step 1 — Add the shared module, consume on Android.**

```kotlin
// settings.gradle.kts
include(":app", ":shared:network")

// shared/network/build.gradle.kts
kotlin {
    androidTarget()
    iosArm64(); iosSimulatorArm64(); iosX64()
    sourceSets {
        commonMain.dependencies {
            implementation(libs.ktor.client.core)
            implementation(libs.kotlinx.serialization.json)
        }
        androidMain.dependencies { implementation(libs.ktor.client.okhttp) }
        iosMain.dependencies { implementation(libs.ktor.client.darwin) }
    }
}

// app/build.gradle.kts
dependencies {
    implementation(project(":shared:network"))
}
```

The Android app now compiles with the shared module. iOS is untouched; the iOS team is not blocked.

**Step 2 — Build and publish the XCFramework in CI.**

```kotlin
// shared/network/build.gradle.kts (addition)
val xcframeworkTask = tasks.register("assembleSharedNetworkXCFramework", XCFrameworkTask::class) {
    baseName = "SharedNetwork"
    from(kotlin.targets.getByName<KotlinNativeTarget>("iosArm64").binaries.getFramework("RELEASE"))
    from(kotlin.targets.getByName<KotlinNativeTarget>("iosX64").binaries.getFramework("RELEASE"))
    from(kotlin.targets.getByName<KotlinNativeTarget>("iosSimulatorArm64").binaries.getFramework("RELEASE"))
}
```

CI uploads the `.xcframework` artifact; the iOS Xcode project references it as a pre-built binary via a local SPM package, so iOS engineers never trigger a Kotlin/Native build locally.

**Step 3 — iOS team replaces one file at a time.**

The iOS network client class is deleted and replaced with calls into `SharedNetwork.framework`. The iOS team validates parity in a feature branch before merging.

---

## Example: Evaluating KMP fit — decision walkthrough

**Scenario A — Good fit.**

A travel startup has an Android app (Kotlin) and an iOS app (Swift). Both fetch the same REST API, share identical booking rules (seat availability validation, price calculation, discount stacking), and maintain separate but identical data models. The Android team finds itself copy-pasting bug fixes to the iOS team every sprint. KMP is a strong fit: share the domain models, validation logic, and API client in `commonMain`; keep all UI native.

**Scenario B — Weak fit.**

A food-delivery company has an Android "driver" app and an iOS "customer" app. The two products have completely different user flows, different backend APIs, and different release cadences managed by separate teams in different cities. There is no shared domain logic — the overlap is only "they both use HTTP and JSON." KMP adds tooling cost for no sharing benefit. Two native codebases remain the right call.

**Scenario C — Deferred fit.**

A SaaS company ships an Android tablet app and is planning an iOS iPad app. The Android app exists; the iOS app is 3 months from kickoff. A shared KMP module for domain and network makes sense, but start it now on Android alone (step 1 of the rollout), validate the architecture, then bring iOS into the module when iOS development begins. Do not wait for iOS to start the shared module; do not build the full shared layer speculatively before iOS requirements are confirmed.
