// ===== EXAMPLE 1: Three-tier module graph =====
// settings.gradle.kts — declare all modules

rootProject.name = "MyApp"

// build-logic is an included build; provides convention plugins
includeBuild("build-logic")

include(":app")

// Core modules — no dependency on :feature or :app
include(":core:network")
include(":core:database")
include(":core:ui")
include(":core:model")

// Feature modules — depend on :core, never on each other's impl
include(":feature:home")
include(":feature:profile")
include(":feature:settings")

// Feature -api artifacts — thin public contracts for cross-feature navigation
include(":feature:profile-api")

// ===== EXAMPLE 2: :core:model — leaf module with no Android deps =====
// :core:model/build.gradle.kts

plugins {
    id("convention.kotlin.library")   // JVM-only, no AGP needed
}

// :core:model/src/main/kotlin/com/example/model/User.kt
data class User(
    val id: Long,
    val displayName: String,
    val avatarUrl: String?,
)

sealed interface Result<out T> {
    data class Success<T>(val data: T) : Result<T>
    data class Error(val exception: Throwable) : Result<Nothing>
    data object Loading : Result<Nothing>
}

// ===== EXAMPLE 3: :feature:profile-api — thin public contract =====
// :feature:profile-api/build.gradle.kts

plugins {
    id("convention.android.library")
}
dependencies {
    api(project(":core:model"))   // api: callers need User type from model
}

// :feature:profile-api/src/main/kotlin/com/example/profile/api/ProfileNavigator.kt
interface ProfileNavigator {
    fun navigateToProfile(userId: Long)
}

// ===== EXAMPLE 4: :feature:profile — full implementation =====
// :feature:profile/build.gradle.kts

plugins {
    id("convention.android.library")
    id("convention.android.compose")
    id("convention.hilt")
}
dependencies {
    api(project(":feature:profile-api"))  // expose the contract
    implementation(project(":core:network"))
    implementation(project(":core:ui"))
    // :feature:home NOT imported here — no cross-feature impl dep
}

// ===== EXAMPLE 5: :app — thin wiring layer =====
// :app/build.gradle.kts

plugins {
    id("convention.android.application")
    id("convention.hilt")
}
dependencies {
    implementation(project(":feature:home"))
    implementation(project(":feature:profile"))
    implementation(project(":feature:settings"))
    // :core modules only needed if :app itself uses them directly
}

// ===== EXAMPLE 6: Convention plugin for Android Library =====
// build-logic/convention/src/main/kotlin/AndroidLibraryConventionPlugin.kt

import com.android.build.gradle.LibraryExtension
import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.kotlin.dsl.configure
import org.gradle.kotlin.dsl.dependencies

class AndroidLibraryConventionPlugin : Plugin<Project> {
    override fun apply(target: Project) = with(target) {
        with(pluginManager) {
            apply("com.android.library")
            apply("org.jetbrains.kotlin.android")
            apply("org.jetbrains.kotlin.plugin.serialization")
        }
        extensions.configure<LibraryExtension> {
            compileSdk = 36
            defaultConfig.minSdk = 26
            compileOptions {
                sourceCompatibility = JavaVersion.VERSION_17
                targetCompatibility = JavaVersion.VERSION_17
            }
        }
        dependencies {
            "implementation"(libs.findLibrary("kotlin-stdlib").get())
        }
    }
}

// build-logic/convention/src/main/kotlin/ComposeConventionPlugin.kt

import com.android.build.gradle.LibraryExtension
import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.kotlin.dsl.configure
import org.gradle.kotlin.dsl.dependencies

class ComposeConventionPlugin : Plugin<Project> {
    override fun apply(target: Project) = with(target) {
        extensions.configure<LibraryExtension> {
            buildFeatures.compose = true
        }
        dependencies {
            val bom = libs.findLibrary("compose-bom").get()
            "implementation"(platform(bom))
            "implementation"(libs.findLibrary("compose-ui").get())
            "implementation"(libs.findLibrary("compose-material3").get())
            "debugImplementation"(libs.findLibrary("compose-ui-tooling").get())
        }
    }
}
