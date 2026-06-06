## Minimal CI workflow (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, "release/**"]
  pull_request:

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 21

      - name: Cache Gradle
        uses: actions/cache@v4
        with:
          path: |
            ~/.gradle/caches
            ~/.gradle/wrapper
          key: gradle-${{ hashFiles('gradle/wrapper/gradle-wrapper.properties', 'gradle/libs.versions.toml') }}
          restore-keys: gradle-

      - name: Unit tests
        run: ./gradlew testReleaseUnitTest --no-daemon --build-cache

      - name: Enable KVM (for emulator acceleration)
        run: |
          echo 'KERNEL=="kvm", GROUP="kvm", MODE="0666", OPTIONS+="static_node=kvm"' \
            | sudo tee /etc/udev/rules.d/99-kvm4all.rules
          sudo udevadm control --reload-rules
          sudo udevadm trigger --name-match=kvm

      - name: Instrumented tests (Gradle Managed Devices)
        run: |
          ./gradlew :app:pixel6api35GroupDebugAndroidTest \
            -Pandroid.testoptions.manageddevices.emulator.gpu=swiftshader_indirect \
            --no-daemon --build-cache

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: "**/build/outputs/androidTest-results/**"
```

## Signed release build + Play upload workflow

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags: ["v*"]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 21

      - name: Cache Gradle
        uses: actions/cache@v4
        with:
          path: |
            ~/.gradle/caches
            ~/.gradle/wrapper
          key: gradle-${{ hashFiles('gradle/wrapper/gradle-wrapper.properties', 'gradle/libs.versions.toml') }}

      - name: Decode keystore
        run: echo "${{ secrets.SIGNING_KEYSTORE_BASE64 }}" | base64 --decode > "$RUNNER_TEMP/release.keystore"

      - name: Build signed AAB
        env:
          KEYSTORE_PATH: ${{ runner.temp }}/release.keystore
          SIGNING_STORE_PASSWORD: ${{ secrets.SIGNING_STORE_PASSWORD }}
          SIGNING_KEY_ALIAS: ${{ secrets.SIGNING_KEY_ALIAS }}
          SIGNING_KEY_PASSWORD: ${{ secrets.SIGNING_KEY_PASSWORD }}
        run: ./gradlew :app:bundleRelease --no-daemon --build-cache

      - name: Remove keystore
        if: always()
        run: rm -f "$RUNNER_TEMP/release.keystore"

      - name: Publish to Play internal track
        env:
          PLAY_SERVICE_ACCOUNT_JSON: ${{ secrets.PLAY_SERVICE_ACCOUNT_JSON }}
        run: |
          echo "$PLAY_SERVICE_ACCOUNT_JSON" > "$RUNNER_TEMP/play-service-account.json"
          ./gradlew :app:publishBundle \
            -Pplay.credentials="$RUNNER_TEMP/play-service-account.json" \
            --no-daemon
          rm -f "$RUNNER_TEMP/play-service-account.json"

      - name: Upload AAB artifact
        uses: actions/upload-artifact@v4
        with:
          name: release-aab
          path: app/build/outputs/bundle/release/app-release.aab
```

## Gradle Managed Devices — multi-device group

```kotlin
// app/build.gradle.kts
android {
    testOptions {
        // Enable process isolation to prevent test pollution
        execution = "ANDROIDX_TEST_ORCHESTRATOR"

        managedDevices {
            localDevices {
                create("pixel6api35") {
                    device = "Pixel 6"
                    apiLevel = 35
                    systemImageSource = "aosp_atd"   // lean ATD image for CI
                }
                create("pixelTabletApi35") {
                    device = "Pixel Tablet"
                    apiLevel = 35
                    systemImageSource = "aosp_atd"
                }
            }
            groups {
                create("allDevices") {
                    targetDevices.add(devices["pixel6api35"])
                    targetDevices.add(devices["pixelTabletApi35"])
                }
            }
        }
    }
}
```

Run the group task to execute tests on both AVDs in parallel:

```bash
./gradlew :app:allDevicesGroupDebugAndroidTest \
  -Pandroid.testoptions.manageddevices.emulator.gpu=swiftshader_indirect \
  --no-daemon --build-cache
```

## Gradle build-cache remote node setup (settings.gradle.kts)

```kotlin
// settings.gradle.kts
buildCache {
    local {
        isEnabled = true
    }
    remote<HttpBuildCache> {
        url = uri(providers.environmentVariable("GRADLE_CACHE_URL").getOrElse(""))
        isPush = providers.environmentVariable("CI").isPresent  // only push from CI
        credentials {
            username = providers.environmentVariable("GRADLE_CACHE_USER").getOrElse("")
            password = providers.environmentVariable("GRADLE_CACHE_PASSWORD").getOrElse("")
        }
    }
}
```
