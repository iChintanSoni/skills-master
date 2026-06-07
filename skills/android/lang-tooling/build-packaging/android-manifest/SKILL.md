---
name: android-manifest
description: Covers the structure, components, intent filters, deep links, permissions, and security configurations in the AndroidManifest.xml file. Use when configuring app declarations, declaring intents, setting permissions, or auditing security properties.
globs:
  - "**/AndroidManifest.xml"
tags: [manifest, security, deep-links, components, configuration, android]
x-skills-master:
  domain: android
  class: lang-tooling
  category: build-packaging
  platforms: ["android"]
  requires:
    android: "16"
  pairs_with: []
  sources:
    - https://developer.android.com/guide/topics/manifest/manifest-intro
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Apply this skill when configuring the root `AndroidManifest.xml` file or merging manifest files across library modules. Use this to declare essential app components (Activities, Services, Broadcast Receivers, Content Providers), configure permissions, define deep link intent-filters, specify hardware/software requirements, or audit manifest security flags like `exported`.

## Core guidance

### Manifest structure and merging

- Every Android app must have exactly one root `AndroidManifest.xml` in the main source set. Gradle automatically merges this manifest with manifests from imported libraries during the build.
- Resolve manifest merge conflicts using `tools:node` or `tools:replace` directives rather than altering dependencies.

### Component declarations

- All application components must be declared in the manifest. Undeclared Activities or Services will throw an `ActivityNotFoundException` or fail to start.
- Explicitly set `android:exported` on any Activity, Service, or Broadcast Receiver that has intent-filters declared (mandatory since Android 12). Set to `false` unless other apps must launch the component.
- Keep the main entry point Activity clean. Do not mix background service declarations in the same Activity XML tag.

### Intent filters and deep links

- Define intent filters to declare which actions, categories, and data types a component can handle.
- Set `android:autoVerify="true"` for HTTP/HTTPS App Links to enable automatic verification of ownership via Digital Asset Links.
- Use explicit schemes (e.g., custom schemes like `myapp://`) or verified web domains.

### Security and permissions

- Request only minimum required permissions. Prefer system pickers (e.g., Photo Picker) to avoid requesting high-level storage permissions.
- Mark custom permissions with an appropriate `protectionLevel` (usually `signature` for security across a suite of apps owned by the same publisher).

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.openxmlformats.org/markup-compatibility/2006"
    package="com.example.myapp">

    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

    <!-- Hardware requirements -->
    <uses-feature android:name="android.hardware.camera" android:required="false" />

    <application
        android:name=".MyApplication"
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:theme="@style/Theme.MyApp"
        tools:targetApi="36">

        <!-- Main entry activity -->
        <activity
            android:name=".ui.MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Deep-linked activity -->
        <activity
            android:name=".ui.DetailActivity"
            android:exported="true"
            android:launchMode="singleTop">
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="https" android:host="example.com" android:pathPrefix="/details" />
            </intent-filter>
        </activity>

    </application>
</manifest>
```

## Platform notes

- **Android 12+ exported enforcement:** Failure to specify `android:exported` on any component with an `<intent-filter>` will cause a build/install error.
- **Queries element:** If your app targets Android 11+ and needs to interact with other packages, you must declare the packages or intent filters inside a `<queries>` tag.
- **Dynamic manifest replacement:** Use Gradle manifest placeholders (e.g., `${applicationId}`) to customize values per build variant or flavor.

## Pitfalls

- **Forgetting `android:exported`:** Leading to build time and installation failures.
- **Declaring broad permissions:** Like `READ_EXTERNAL_STORAGE` when a simple photo selector picker is sufficient, causing app store review rejection.
- **Hardcoding hostnames for deep links:** Leads to merge conflicts. Use Gradle placeholders.
- **Broken App Links AutoVerify:** Not hosting the `.well-known/assetlinks.json` correctly on the target domain.

## References

- **Documentation:** [App manifest overview](https://developer.android.com/guide/topics/manifest/manifest-intro)
- **Documentation:** [Intent filters](https://developer.android.com/guide/components/intents-filters)

## See also

See the `runtime-permissions` skill for handling permissions. For build and flavor configuration, see `build-variants-flavors`.
