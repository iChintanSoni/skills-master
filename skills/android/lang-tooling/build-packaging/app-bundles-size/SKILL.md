---
name: app-bundles-size
description: Guidance on building Android App Bundles (AAB), configuring per-device split APKs, structuring Play Feature Delivery for install-time and on-demand dynamic modules, adopting Play Asset Delivery, and measuring or reducing download size. Use when packaging a release build with AGP 9+, adding dynamic feature modules, optimising download size, or investigating why an AAB or APK is larger than expected.
globs:
  - "**/*.gradle.kts"
  - "**/*.kts"
  - "**/*.toml"
tags: [android, build-packaging, app-bundle, size-optimisation, dynamic-delivery]
x-skills-master:
  domain: android
  class: lang-tooling
  category: build-packaging
  platforms: ["android"]
  requires:
    android: "16"
    kotlin: "2.2"
    agp: "9.0"
  pairs_with: []
  sources:
    - https://developer.android.com/guide/app-bundle
    - https://developer.android.com/topic/performance/reduce-apk-size
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Apply this guidance when building a release AAB for the Play Store, splitting a large application into dynamic feature modules, configuring Play Asset Delivery for heavyweight assets, or diagnosing an unexpectedly large download size. The advice targets AGP 9.0 with the Kotlin DSL and a `libs.versions.toml` version catalogue.

## Core guidance

**Building an AAB**

- Set `android.bundle {}` in your app module to enable (it is the default for release) and never publish a universal APK unless side-loading demands it — the Play Store generates optimised split APKs from the bundle.
- Enable resource and dex splitting via bundle configuration so Play can strip resources that do not match the device locale, screen density, or ABI.
- Run `./gradlew :app:bundleRelease` to produce the AAB; validate the split strategy with `bundletool build-apks` against a connected device before upload.

**Split APKs by configuration**

- Per-config splits are produced automatically from an AAB. You do not declare ABI or density splits manually in the Kotlin DSL — the bundle format handles them. However, you can suppress splits for a dimension if your QA process makes the overhead unjustifiable:

```kotlin
// app/build.gradle.kts
android {
    bundle {
        abi { enableSplit = true }
        density { enableSplit = true }
        language { enableSplit = true }
        texture { enableSplit = false } // disable TCIF splits if not needed
        deviceTier { enableSplit = false }
    }
    buildTypes {
        release {
            isShrinkResources = true
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
}
```

**Play Feature Delivery**

- Model each large or rarely-used area as a `:feature:xyz` Gradle module with `com.android.dynamic-feature` plugin. The base app declares the feature modules in `android.dynamicFeatures`; feature modules declare a reverse dependency on `:app` through the `implementation` configuration.
- Choose a delivery mode in each feature module's manifest `<dist:module>` element:
  - `install-time` — downloaded at install, accessible immediately, behaves like static code.
  - `on-demand` — downloaded at runtime via the Play Core `SplitInstallManager` API (now part of Play Feature Delivery library).
  - `fast-follow` — installed automatically just after install but before first launch.
- Guard on-demand feature access with `SplitInstallManager.installedModules` before referencing any class in the module; the class will be missing if the split has not arrived.
- For emulator testing, use bundletool's `install-apks` or the Play Core `FakeSplitInstallManagerFactory` to simulate on-demand delivery without uploading to Play.

**Play Asset Delivery**

- For asset packs exceeding ~150 MB, create an asset pack Gradle module (`com.android.asset-pack` plugin) and reference it from the app module's `assetPacks` list.
- Choose delivery mode per pack (`install-time`, `fast-follow`, or `on-demand`) in the pack's `build.gradle.kts`. On-demand packs are fetched via `AssetPackManager` and accessed through `AssetPackManager.getPackLocation()`.
- Compress text-heavy assets (JSON, shader source) but leave video and audio uncompressed — Play compresses the bundle before delivery, double-compressing media increases size and CPU cost on device.

**Measuring and reducing download size**

- Use `bundletool get-size total --apks=release.apks` to measure estimated download size per device configuration before uploading.
- Enable R8 full mode in `gradle.properties` (`android.enableR8.fullMode=true`) — it applies more aggressive dead-code and reflection stripping than the default compatible mode.
- Run `./gradlew :app:bundleRelease` then open the AAB in Android Studio's **App Bundle Explorer** to identify unexpectedly large resource or dex contributors.
- Audit native libraries: strip debug symbols at package time with `android { packagingOptions { jniLibs { useLegacyPackaging = false } } }` and rely on symbol upload for crash symbolisation.
- Remove unused alternative resources with `resConfigs` to cap the set of locales and densities included in the base split:

```kotlin
defaultConfig {
    resConfigs("en", "fr", "de", "ja", "zh-rCN", "xxhdpi", "xxxhdpi")
}
```

- Keep `isShrinkResources = true` paired with `isMinifyEnabled = true`; shrinking alone without minification is unsupported.
- Prefer vector drawables over multiple density PNGs for UI icons; use WebP for photos.

## Platform notes

- AGP 9.0 requires `compileSdk 36`; new bundle config options (device tier targeting, country targeting) are gated on newer `compileSdk` values, not `minSdk`.
- On-demand feature delivery requires `minSdk 21`; devices below that receive a single APK generated from the base split only.
- Large download requests (on-demand packs > ~50 MB) may trigger a user confirmation dialog on Android 12 and earlier; handle `SplitInstallErrorCode.ACCESS_DENIED` gracefully.
- Instant apps backed by feature modules require `dist:instant="true"` and a module size under the Play-enforced instant limit (currently 10 MB per module, 15 MB total).
- The `AssetPackManager` API is available from `play.core` 1.8+; add it via `implementation(libs.play.asset.delivery)` in the version catalogue — do not use the deprecated `com.google.android.play:core` monolith.

## Pitfalls

- Publishing a universal APK instead of an AAB bypasses all split and shrinking benefits; the Play Console warns about this but does not block it.
- Referencing a class from an on-demand feature module without first checking that the split is installed causes `ClassNotFoundException` at runtime — there is no compile-time safety net.
- Setting `isShrinkResources = true` without `isMinifyEnabled = true` produces a build error; always pair them.
- Forgetting to upload a mapping file after enabling R8 full mode means production crashes cannot be symbolised; automate upload with the AGP `uploadCrashlyticsMappingFile` or equivalent task.
- Adding an asset pack to `assetPacks` but omitting it from Play Console's release track causes 404 errors when the app tries to download the pack on device.
- Leaving `enableSplit = true` for a dimension (e.g. `language`) when the app bundles its own string loading outside the Android resource system causes empty-string bugs because Play strips the resource strings that are never referenced.
- Using `android.defaultConfig.resConfigs` without `"en"` as a fallback locale means devices with unsupported locales get no strings at all.

## References

- **Android Developers — App Bundle guide:** https://developer.android.com/guide/app-bundle
- **Android Developers — Reduce APK size:** https://developer.android.com/topic/performance/reduce-apk-size

## See also

See `build-sign-distribute` for signing configurations, build variants, and release pipeline setup. See `ci-cd-signing` for automating AAB signing in CI and uploading the bundle to Play via the App Distribution or Publishing API.
