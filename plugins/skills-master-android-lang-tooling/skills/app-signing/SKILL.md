---
name: app-signing
description: Guidance on configuring Android app signing in Gradle with Kotlin DSL — signing configs, the upload key vs app signing key distinction, Play App Signing, key rotation, and keeping keystores out of version control. Use when setting up release signing for a new app, migrating a keystore to Play App Signing, rotating a compromised key, or hardening signing secrets in CI/CD.
---

## When to use

Apply this guidance when you are wiring up release signing in a new project, migrating an existing keystore to Play App Signing, hardening signing secrets for CI/CD pipelines, or rotating a key after a security incident. It covers the full lifecycle from generating a keystore through shipping a signed AAB and keeping every secret out of version control.

## Core guidance

- Separate the **upload key** from the **app signing key**. When Play App Signing is enabled, Google manages the app signing key in a Hardware Security Module; you generate a shorter-lived upload key to authenticate bundles you submit. Google re-signs the bundle with the app signing key before distribution. Never conflate the two — if the upload key is compromised you can request a new one; if you had no Play App Signing and the app signing key is lost, you must publish a new app ID.
- Define signing configuration in `build.gradle.kts` with values read from `local.properties` or environment variables, never hard-coded literals.
- Add `local.properties`, any `*.jks`, and any `*.keystore` to `.gitignore` immediately when the project is created. Treat the keystore file itself as a secret — store it encrypted in CI secret management (GitHub Actions encrypted secrets, Google Cloud Secret Manager, etc.) and materialize it at build time.
- For local developer builds, read keystore properties from `local.properties`. For CI, read the same property names from environment variables, which keeps the `build.gradle.kts` expression identical in both contexts.
- Supply only the properties required for each build type. A `debug` signing config is auto-provided by AGP; override it only when you need a stable SHA-1 fingerprint across machines (for Maps SDK, Firebase, etc.).
- For release AABs destined for Play, prefer the `bundleRelease` task over `assembleRelease`. AABs let Play optimize APKs per device configuration and are required for new apps.
- After enrolling in Play App Signing, verify the app signing certificate fingerprint in the Play Console under **Setup > App integrity**. Use that SHA-256 for any fingerprint-dependent integrations (App Links, Firebase, Google Sign-In).

```kotlin
// build.gradle.kts (app module)
import java.util.Properties

val keystoreProps = Properties().apply {
    val f = rootProject.file("local.properties")
    if (f.exists()) load(f.inputStream())
}

android {
    signingConfigs {
        create("release") {
            storeFile = file(
                System.getenv("KEYSTORE_PATH")
                    ?: keystoreProps["storeFile"] as String
            )
            storePassword = System.getenv("KEYSTORE_PASSWORD")
                ?: keystoreProps["storePassword"] as String
            keyAlias = System.getenv("KEY_ALIAS")
                ?: keystoreProps["keyAlias"] as String
            keyPassword = System.getenv("KEY_PASSWORD")
                ?: keystoreProps["keyPassword"] as String
        }
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
}
```

**Key rotation with Play App Signing**

- To replace a compromised upload key, submit a key rotation request from the Play Console (**Setup > App integrity > Request key upgrade**). Google validates that the previous upload key signed your latest live release before issuing a new certificate.
- To rotate the *app signing key* (rare; required if Google's copy were somehow compromised), you must use the Play App Signing key rotation API introduced in 2023, which chains the new key to the old one using a `lineage` proof. AGP 8+ and the `apksig` library support generating this lineage for sideloaded APKs; for Play distribution the rotation is managed server-side in the Console.
- Keep the key lineage file (`*.lineage`) under version control — it is not a secret and must be present for every subsequent signing operation once rotation occurs.

**Generating a keystore (command line)**

```
keytool -genkeypair \
  -v \
  -keystore upload-key.jks \
  -alias upload \
  -keyalg RSA \
  -keysize 4096 \
  -validity 10000
```

Use `keysize 4096` and `validity 10000` days for the upload key. Play App Signing certificates managed by Google use 2048-bit RSA; your upload key should be at least as strong.

## Platform notes

- AGP 9.0 requires Gradle 8.11+ and Java 21. The `signingConfigs` DSL is unchanged but AGP now validates that storeFile is not null before the signing config is referenced by any build type; previously this was a runtime failure during the signing task.
- `local.properties` is generated by Android Studio and ignored by the Android Gradle Plugin itself — it is purely a convention. On machines without a GUI, populate it with a script or via environment variables using the pattern above.
- For multi-module projects, declare `signingConfigs` only in the `:app` module's `build.gradle.kts`. Library modules produce AARs, which are not signed; signing happens at APK/AAB assembly in the application module.
- When building from the command line without Android Studio, use `./gradlew bundleRelease` (AAB) or `./gradlew assembleRelease` (APK). Pass signing properties via `-P` flags or environment variables; avoid `-Dorg.gradle.project.*` JVM system properties for secrets because they may appear in process listings.
- The Android Gradle Plugin's `v1SigningEnabled` and `v2SigningEnabled` flags on `SigningConfig` have been removed. AGP 9.0 always produces APKs with both v2 (APK Signature Scheme v2) and v3 (for key rotation support); v4 signing is added automatically when the build targets API 30+ and the `--enable-v4` flag is set. You no longer need to configure this manually.

## Pitfalls

- **Committing the keystore or `local.properties` to git** is the most damaging mistake. Add both to `.gitignore` before the first commit. Leaked keystores for apps without Play App Signing cannot be revoked, forcing a new app listing.
- **Losing the upload key** is recoverable if Play App Signing is enabled, but the recovery process requires contacting Google Play support and can take days. Back up the upload keystore in at least two independent encrypted locations.
- **Using the same key as both upload and app signing key** (i.e., not enrolling in Play App Signing) removes the safety net. All new apps uploaded after August 2021 are automatically enrolled; older apps should migrate.
- **Hard-coding keystore paths** like `/home/user/...` in `build.gradle.kts` breaks CI and other contributors' machines. Always use relative paths from `rootProject.file(...)` or an environment variable.
- **Forgetting to keep the lineage file** after key rotation means every subsequent release build will fail to verify the chain of trust for sideloaded APKs. Commit it and document it.
- **Checking `signingConfig` into the release build type without verifying the config resolves** causes a confusing null-dereference at assemble time rather than a configuration-time error. Add a `check(storeFile != null)` guard if the config is conditionally populated.
- **Mixing `storePassword` and `keyPassword`** — these are distinct fields and are almost always different values. Using the same variable for both causes a `KeyStoreException` at signing time that is easy to misread as a corrupted keystore.

## References

- **Official guide:** [Sign your app — Android Developer Documentation](https://developer.android.com/studio/publish/app-signing)
- **Command-line signing:** [Build and run your app from the command line](https://developer.android.com/build/building-cmdline#sign_cmdline)

## See also

See `ci-cd-signing` for patterns that securely materialize keystores from encrypted CI secrets and wire them to Gradle without exposing values in build logs. See `build-packaging` for how signing fits into the broader release pipeline including ProGuard/R8, baseline profiles, and AAB delivery.
