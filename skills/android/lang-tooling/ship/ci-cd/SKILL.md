---
name: ci-cd
description: Covers continuous integration and delivery for Android — building and testing from the command line with Gradle, Gradle Managed Devices for instrumented tests in CI, build caching, secure signing in CI, and automating Play Store uploads. Use when setting up or improving a CI/CD pipeline for an Android project.
tags: [ci-cd, gradle, testing, signing, android]
x-skills-master:
  domain: android
  class: lang-tooling
  category: ship
  platforms: ["android"]
  requires: { "android": "16", "kotlin": "2.2" }
  pairs_with: []
  sources:
    - https://developer.android.com/build/building-cmdline
    - https://developer.android.com/studio/test/gradle-managed-devices
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Use this skill when you are wiring up or hardening a CI/CD pipeline for an Android project. It covers invoking Gradle from the command line on headless runners, running instrumented tests without physical devices using Gradle Managed Devices, tuning the Gradle build cache and daemon for repeatable fast builds, storing signing credentials safely as CI secrets, and pushing release artifacts to Google Play automatically.

---

## Core guidance

### Build from the command line with Gradle

Always use the Gradle wrapper (`./gradlew`) so the runner builds with the pinned Gradle version rather than whatever happens to be installed on the host.

- **Do** pass `--no-daemon` on ephemeral CI runners (containers, one-shot VMs) to avoid zombie daemon processes and stale caches.
- **Do** add `--build-cache` to every invocation to reuse task outputs across pipeline runs.
- **Do** set `org.gradle.jvmargs=-Xmx4g -XX:+UseParallelGC` in `gradle.properties` to avoid out-of-memory failures on CI.
- **Don't** call `gradle` (system installation) — always use `./gradlew` so the version is reproducible.
- **Do** fail fast with `--continue` omitted by default; add it only when you need all test failures surfaced in one run.

Common build invocations:

```bash
# Assemble release APK/AAB
./gradlew :app:bundleRelease --no-daemon --build-cache

# Run unit tests for all modules
./gradlew testReleaseUnitTest --no-daemon --build-cache

# Run instrumented tests on Gradle Managed Devices (see below)
./gradlew :app:pixel6api35GroupDebugAndroidTest \
  -Pandroid.testoptions.manageddevices.emulator.gpu=swiftshader_indirect \
  --no-daemon --build-cache
```

### Gradle Managed Devices for instrumented tests

Gradle Managed Devices (GMD) let you declare the AVD in `build.gradle.kts` and let Gradle spin up, run, and tear down the emulator automatically — no manual emulator management on the runner.

```kotlin
// app/build.gradle.kts
android {
    testOptions {
        managedDevices {
            localDevices {
                create("pixel6api35") {
                    device = "Pixel 6"
                    apiLevel = 35
                    systemImageSource = "aosp"
                }
            }
            groups {
                create("phone") {
                    targetDevices.add(devices["pixel6api35"])
                }
            }
        }
    }
}
```

The generated task is `<device><variant>AndroidTest`, e.g. `pixel6api35DebugAndroidTest`. Group tasks such as `phoneGroupDebugAndroidTest` run all devices in the group in parallel.

- **Do** set `systemImageSource = "aosp"` (or `"aosp_atd"` for automated test devices) rather than `"google"` on CI — Google-image emulators require Play authentication that headless runners cannot provide.
- **Do** use ATD (Automated Test Device) images (`aosp_atd`) on CI for a leaner image that boots faster; reserve full images for local debugging.
- **Do** pass `-Pandroid.testoptions.manageddevices.emulator.gpu=swiftshader_indirect` when the runner has no GPU.
- **Don't** leave emulators running between jobs on self-hosted runners — GMD handles lifecycle automatically, but verify no stale AVDs remain if a job is killed mid-run.

### Build caching

- Enable the Gradle remote build cache by pointing `settings.gradle.kts` at a shared cache node (Develocity, Gradle Enterprise, or a self-hosted HTTP cache) and setting `buildCache.remote.isPush = true` only on the CI writer role.
- Key the local cache correctly: restore and save `~/.gradle/caches` and `~/.gradle/wrapper` keyed on Gradle wrapper checksum + `gradle/libs.versions.toml` hash.
- Never cache the `build/` output directories directly — they are not cache-key-safe across machines; let Gradle's own cache do the work.
- Use `--configuration-cache` once all plugins in the project support it; it cuts configuration time significantly on large multi-module builds.

### Signing securely in CI

Never store keystore files or passwords in version control. The standard pattern is base64-encoding the keystore and storing it as a CI secret, then decoding at build time.

```bash
# Decode the keystore from a CI secret and run the signed build
echo "$SIGNING_KEYSTORE_BASE64" | base64 --decode > "$RUNNER_TEMP/release.keystore"

./gradlew :app:bundleRelease \
  -Pandroid.injected.signing.store.file="$RUNNER_TEMP/release.keystore" \
  -Pandroid.injected.signing.store.password="$SIGNING_STORE_PASSWORD" \
  -Pandroid.injected.signing.key.alias="$SIGNING_KEY_ALIAS" \
  -Pandroid.injected.signing.key.password="$SIGNING_KEY_PASSWORD" \
  --no-daemon --build-cache

rm -f "$RUNNER_TEMP/release.keystore"
```

Alternatively, configure signing in `build.gradle.kts` reading from environment variables:

```kotlin
android {
    signingConfigs {
        create("release") {
            storeFile = file(System.getenv("KEYSTORE_PATH") ?: "debug.keystore")
            storePassword = System.getenv("SIGNING_STORE_PASSWORD")
            keyAlias = System.getenv("SIGNING_KEY_ALIAS")
            keyPassword = System.getenv("SIGNING_KEY_PASSWORD")
        }
    }
    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
        }
    }
}
```

- **Do** delete the decoded keystore in a cleanup/`always` step — critical on self-hosted runners.
- **Do** use Google Play App Signing so you can rotate the upload key independently of the in-app signing key.
- **Don't** fall back to `signingConfig = signingConfigs.getByName("debug")` if env vars are absent and then accidentally ship that build.

### Automating Play Store uploads

Use the [Gradle Play Publisher](https://github.com/Triple-T/gradle-play-publisher) plugin or the [Fastlane Supply](https://docs.fastlane.tools/actions/supply/) action to push AABs to Google Play.

For the Gradle Play Publisher approach, authenticate with a Google Play service account JSON key stored as a CI secret:

```kotlin
// build.gradle.kts
plugins {
    id("com.github.triplet.play") version "3.10.1"
}

play {
    serviceAccountCredentials.set(
        file(System.getenv("PLAY_SERVICE_ACCOUNT_JSON") ?: "service-account.json")
    )
    track.set("internal")        // "alpha", "beta", or "production"
    releaseStatus.set(ReleaseStatus.DRAFT)
}
```

Then publish with:

```bash
./gradlew :app:publishBundle --no-daemon
```

- **Do** target the `internal` track first; promote to `alpha`/`beta`/`production` via the Play Console or API once QA is satisfied.
- **Do** scope the service account to only the necessary Play Developer API permissions (APKs and AABs, releases).
- **Don't** use your personal Google account credentials — service account JSON is revocable without touching your account.

---

## Platform notes

- **API level pinning.** GMD `apiLevel` is a hard pin. When a new API level ships, update the managed device declaration deliberately rather than relying on a moving target.
- **Android Test Orchestrator.** For instrumented test runs that need full process isolation between test cases, enable `testOptions.execution = "ANDROIDX_TEST_ORCHESTRATOR"`. It increases total run time but prevents test pollution from leaked static state.
- **Large screens and form factors.** Add a second GMD entry (e.g., a tablet at apiLevel 35) to the group when your app targets large screens; running both in parallel costs little extra on CI.
- **Emulator snapshot pre-warming.** GMD supports `enableEmulatorDisplay = false` (headless) by default. On self-hosted Linux runners, set `ANDROID_EMULATOR_USE_SYSTEM_LIBS=1` and ensure KVM is enabled for hardware acceleration.
- **App Bundle vs APK.** Prefer AAB (`bundleRelease`) for Play Store uploads; APKs (`assembleRelease`) remain useful for direct distribution (Firebase App Distribution, internal test channels).

---

## Pitfalls

- **Running the Gradle daemon on ephemeral runners.** Daemons started in a container are killed when the container exits but may interfere if the runner is reused. Always pass `--no-daemon` unless you are explicitly managing a persistent build agent with a warm daemon.
- **Storing the keystore in version control.** Even a "debug" keystore should not be committed; an accidentally committed release keystore is a permanent credential leak.
- **Using `google` system image source on CI.** Google-signed images require Play sign-in at boot and will stall or fail on headless runners. Use `aosp` or `aosp_atd`.
- **Not cleaning up the decoded keystore.** On self-hosted runners a failed job may leave the keystore on disk indefinitely. Use a `try/finally` script pattern or runner cleanup hooks.
- **Caching `~/.gradle/caches` without a good cache key.** A stale Gradle cache keyed only on the branch name can pull in wrong artifact versions silently. Key on `gradle-wrapper.properties` + `libs.versions.toml` (or `build.gradle.kts` hashes for simpler setups).
- **Ignoring configuration cache incompatibilities.** Not all Gradle plugins support `--configuration-cache`; an incompatible plugin will throw and fail the build. Enable it per-module incrementally, or omit for now and revisit after upgrading plugins.
- **Publishing to `production` from a feature branch.** Guard the publish task with a branch or tag condition at the CI pipeline level, not just in Gradle.
- **Skipping Play App Signing enrollment.** Once enrolled, the upload key is separate from the signing key; losing the upload key is recoverable. Without enrollment, losing the keystore means you cannot publish updates to an existing app.

---

## References

- **Documentation:** [Build your app from the command line — Android Developers](https://developer.android.com/build/building-cmdline)
- **Documentation:** [Gradle Managed Devices — Android Developers](https://developer.android.com/studio/test/gradle-managed-devices)

---

## See also

The `build-sign-distribute` skill covers release build types, ProGuard/R8 configuration, and artifact packaging in more depth. The `unit-testing-strategy` and `testing-async-code` skills explain what to run in the unit-test phase before invoking instrumented tests. The `dependency-injection` skill is relevant when wiring test doubles into instrumented tests run on managed devices. For Play Store release management and staged rollouts, see the `testflight-appstore-connect` counterpart once the Android equivalent is available.
