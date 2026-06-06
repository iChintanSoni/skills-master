## Example: Minimal single-module app

A single-module Android app with Compose and version catalog from scratch.

### gradle/libs.versions.toml

```toml
[versions]
agp          = "9.0.0"
kotlin       = "2.2.0"
compose-bom  = "2025.06.00"
junit        = "4.13.2"
androidx-test-ext = "1.2.1"

[libraries]
compose-bom             = { group = "androidx.compose", name = "compose-bom", version.ref = "compose-bom" }
compose-ui              = { group = "androidx.compose.ui", name = "ui" }
compose-ui-tooling      = { group = "androidx.compose.ui", name = "ui-tooling" }
compose-material3       = { group = "androidx.compose.material3", name = "material3" }
junit                   = { group = "junit", name = "junit", version.ref = "junit" }
androidx-junit          = { group = "androidx.test.ext", name = "junit", version.ref = "androidx-test-ext" }

[plugins]
android-application     = { id = "com.android.application", version.ref = "agp" }
kotlin-android          = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
```

### settings.gradle.kts

```kotlin
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "MyApp"
include(":app")
```

### app/build.gradle.kts

```kotlin
plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace  = "com.example.myapp"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.example.myapp"
        minSdk        = 26
        targetSdk     = 36
        versionCode   = 1
        versionName   = "1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    buildFeatures {
        compose = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    val bom = platform(libs.compose.bom)
    implementation(bom)
    implementation(libs.compose.ui)
    implementation(libs.compose.material3)
    debugImplementation(libs.compose.ui.tooling)

    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
}
```

---

## Example: Multi-module project with convention plugins

A project with `:app`, `:feature:home`, and `:core:network` modules sharing build logic via a `build-logic` included build.

### settings.gradle.kts (root)

```kotlin
pluginManagement {
    includeBuild("build-logic")   // include the convention plugin build
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "MyApp"
include(":app")
include(":feature:home")
include(":core:network")
```

### build-logic/settings.gradle.kts

```kotlin
dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
    }
    versionCatalogs {
        create("libs") { from(files("../gradle/libs.versions.toml")) }
    }
}
rootProject.name = "build-logic"
```

### build-logic/convention/build.gradle.kts

```kotlin
plugins {
    `kotlin-dsl`
}

dependencies {
    compileOnly(libs.android.gradlePlugin)
    compileOnly(libs.kotlin.gradlePlugin)
}
```

### build-logic/convention/src/main/kotlin/AndroidLibraryConventionPlugin.kt

```kotlin
import com.android.build.gradle.LibraryExtension
import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.kotlin.dsl.configure

class AndroidLibraryConventionPlugin : Plugin<Project> {
    override fun apply(target: Project) {
        with(target) {
            pluginManager.apply("com.android.library")
            pluginManager.apply("org.jetbrains.kotlin.android")

            extensions.configure<LibraryExtension> {
                compileSdk = 36
                defaultConfig.minSdk = 26
                compileOptions {
                    sourceCompatibility = JavaVersion.VERSION_17
                    targetCompatibility = JavaVersion.VERSION_17
                }
            }
        }
    }
}
```

### core/network/build.gradle.kts

```kotlin
plugins {
    alias(libs.plugins.myapp.android.library)   // the convention plugin
}

android {
    namespace = "com.example.core.network"
}

dependencies {
    implementation(libs.kotlinx.coroutines.android)
    implementation(libs.retrofit)
}
```
