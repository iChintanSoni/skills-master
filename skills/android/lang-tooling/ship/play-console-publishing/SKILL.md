---
name: play-console-publishing
description: Covers shipping Android apps through Google Play — the Play Console, release tracks (internal/closed/open/production) and staged rollouts, Android App Bundles and Play App Signing, in-app updates and in-app reviews, Play Integrity API, and store listing and policy essentials. Use when setting up a Play release pipeline, managing track promotion, integrating flexible or immediate in-app updates, verifying app integrity, or preparing a store listing for review.
tags: [android, play-console, publishing, release, ship, app-bundle]
x-skills-master:
  domain: android
  class: lang-tooling
  category: ship
  platforms: ["android"]
  requires: { "android": "16", "kotlin": "2.2" }
  pairs_with: []
  sources:
    - https://developer.android.com/studio/publish
    - https://play.google.com/console/about/
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Use this skill when you are moving an Android app from a signed build into users' hands through Google Play. It covers the full publish loop: generating an Android App Bundle (AAB), enrolling in Play App Signing, choosing and promoting release tracks, configuring staged rollouts, integrating the Play In-App Update and In-App Review APIs, protecting your app with Play Integrity, and meeting store listing and policy requirements. If you are scripting releases in CI, treat the console steps here as the contract your Gradle Play Publisher or fastlane calls must satisfy.

---

## Core guidance

### Build an Android App Bundle, not an APK

- **Do** build an AAB (`./gradlew bundleRelease`) for every Play submission. The Play Console splits the bundle into optimised APKs per device configuration (ABI, screen density, language), reducing install sizes by 15–40 %.
- **Do not** upload a fat universal APK to Play for distribution — it is larger, and Play now requires AABs for new apps.
- Keep `android.bundle.language.enableSplit`, `.density.enableSplit`, and `.abi.enableSplit` set to `true` (the defaults) unless you have a documented reason to disable them.

### Play App Signing

- **Enroll** every new app in Play App Signing. Google holds your release key; you upload builds signed with a short-lived upload key. If your upload key is lost, Google re-signs with the retained release key and you request a key reset — you never lose the app.
- For existing apps migrating to Play App Signing, export the existing keystore and upload it once in **Setup > App signing**.
- Keep the upload key password and keystore in a secrets manager (not source control). Rotate the upload key yourself if it is ever compromised — contact Play support immediately.

### Release tracks

Play exposes four tracks that form a one-way promotion funnel:

| Track | Audience | Review required | Use for |
|---|---|---|---|
| Internal testing | Up to 100 opt-in testers | No | Smoke-testing new builds within the team |
| Closed testing (alpha) | Named groups or Google Groups | No | Broader controlled beta |
| Open testing (beta) | Anyone who opts in | Yes (once) | Public beta before production |
| Production | All users | Yes | Stable release |

- **Promote** a build up the funnel from the Play Console without re-signing or rebuilding. The same AAB you tested in internal testing is the one that reaches production.
- **Never** skip internal testing for release builds; it is instant and catches signing and manifest errors before review.

### Staged rollouts

- Roll out to a percentage of production users (e.g., 10 %) and monitor crashes and ANR rates in Android Vitals before expanding.
- **Halt a rollout** the moment the crash rate exceeds your baseline. A halted rollout stops new installs but does not roll back already-updated devices.
- Expand to 100 % or complete the rollout manually once metrics stabilise — Play does not auto-expand.

### Kotlin DSL Gradle signing config

```kotlin
// app/build.gradle.kts
android {
    signingConfigs {
        create("release") {
            storeFile = file(System.getenv("KEYSTORE_PATH") ?: "upload.jks")
            storePassword = System.getenv("KEYSTORE_PASSWORD")
            keyAlias = System.getenv("KEY_ALIAS")
            keyPassword = System.getenv("KEY_PASSWORD")
        }
    }
    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
        }
    }
}
```

### In-app updates

Use the Play In-App Update API (`com.google.android.play:app-update-ktx`) to surface update prompts without leaving your app:

- **Flexible update** — downloads in the background while the user continues; install on next app restart. Use for non-critical updates.
- **Immediate update** — blocks the app with a full-screen Play dialog until the update is installed. Use only for security patches or breaking API changes that require the new version.

Check `AppUpdateInfo` at launch; cache the result for the session rather than calling `requestAppUpdateInfo()` on every screen.

### In-app reviews

Use `com.google.android.play:review-ktx` to trigger the system review sheet without redirecting users to the Play Store:

- **Do** ask for a review after a meaningful user success (completed a task, finished a level, saved a document) — not immediately on launch.
- **Do not** call `launchReviewFlow` on every session launch. Play rate-limits the sheet; calls beyond the quota silently no-op without error.
- **Do not** show a custom pre-prompt asking the user whether they like the app before calling the Play API — this is a policy violation.
- The API gives no signal about whether the sheet was shown or whether the user submitted a rating. Design your flow accordingly.

### Play Integrity

The Play Integrity API (`com.google.android.play:integrity`) provides a signed token that lets your backend verify that:

1. The request comes from your genuine, unmodified APK.
2. The binary runs on a certified Android device.
3. The user's Google account has a valid license for your app.

- Generate a `nonce` server-side (a base64-encoded one-time value tied to the request), pass it to `IntegrityManager.requestIntegrityToken`, send the token to your backend, and verify it using the Play Integrity API or Google's decryption keys.
- **Never** trust the verdict client-side. The token is only meaningful when verified by your server.
- Call the Integrity API only on sensitive or high-value actions (purchase, account creation, score submission) — not on every screen load. Quota limits apply.

### Store listing and policy

- Provide at least one 512 × 512 icon, a 1024 × 500 feature graphic, and phone screenshots in the required aspect ratios. Adaptive icon assets must include a foreground and background layer.
- Complete the content rating questionnaire accurately; misrepresentation results in removal. The questionnaire drives age-gating in restricted markets.
- Fill the Data safety section (`Play Console > Policy > App content > Data safety`). Every data type you collect, share, or process must be declared — reviewers cross-check with your `PrivacyInfo` (Android Privacy Manifest).
- App review typically completes in 1–3 days for production submissions. Time-sensitive releases should use an expedited review request via the Play Console if eligible.
- Target at minimum the API level required by Play's annual deadline (currently Android 14 / API 34 for existing apps; new apps must target the current year's requirement).

---

## Platform notes

- **Android 16 (API 36) requirement:** Apps targeting Android 16 must handle predictive back gestures natively. The Play Console flags apps not compliant as of the 2025 requirement deadline.
- **Play App Signing and keystore files:** The AAB upload pipeline does not accept `apk` extension files. Ensure your CI build task is `bundleRelease`, not `assembleRelease`.
- **Play Integrity vs SafetyNet:** SafetyNet Attestation was deprecated in 2024 and is fully removed. Migrate any SafetyNet calls to the Play Integrity API before submission or the app may be flagged.
- **In-App Update API on Android 5.x (API 21–22):** The API is available from API 21, but flexible update background download requires the app to be in the foreground to install on older versions. Target the current minSdk and test the update flow on emulators running your minimum supported API.

---

## Pitfalls

- **Signing the AAB with the release key directly when enrolled in Play App Signing.** You must sign with the *upload* key, not the release key. Play resigns with the release key server-side. Signing with the wrong key causes an upload rejection.
- **Calling `launchReviewFlow` on a `Context` that has been destroyed.** Always call on a live `Activity` and guard with lifecycle checks; calling after `onDestroy` silently fails or crashes.
- **Interpreting a `RESULT_OK` from `launchReviewFlow` as confirmation the user reviewed.** `RESULT_OK` means the flow completed without error, not that a review was submitted.
- **Expanding a staged rollout while Android Vitals shows a regression.** Halt first, diagnose, then re-release a fixed build. You cannot decrease a rollout percentage once expanded.
- **Hardcoding keystore credentials in `build.gradle.kts`.** Credentials committed to VCS or logged in CI will be visible in pipeline artifacts. Always read from environment variables or a secrets vault.
- **Skipping Data safety declarations for third-party SDKs.** Analytics, ad, and crash-reporting SDKs often collect data on your behalf. You are responsible for declaring all data they access, even if you do not access it directly.
- **Generating the Play Integrity nonce client-side.** A client-generated nonce can be replayed. Always generate and validate nonces server-side.
- **Uploading a new AAB to a track without incrementing `versionCode`.** Play rejects any upload where `versionCode` is less than or equal to a version already on any track. Automate version code increments in CI to prevent this.

---

## References

- **Documentation:** [Publish your app — Android Studio](https://developer.android.com/studio/publish)
- **Documentation:** [Google Play Console](https://play.google.com/console/about/)
- **Documentation:** [Android App Bundles overview](https://developer.android.com/guide/app-bundle)
- **Documentation:** [Play In-App Update API](https://developer.android.com/guide/playcore/in-app-updates)
- **Documentation:** [Play In-App Review API](https://developer.android.com/guide/playcore/in-app-review)
- **Documentation:** [Play Integrity API](https://developer.android.com/google/play/integrity)

---

## See also

Play publishing is the last step of a build-sign-distribute pipeline. Pair with `build-sign-distribute` for Gradle build configuration and signing conventions. For CI automation of the upload step, see `ci-cd-signing`. For managing dependencies on the Play libraries themselves, see `dependency-injection` for injecting the `AppUpdateManager` and `ReviewManager` as testable abstractions. For declaring data safety accurately, see `privacy-manifests`.
