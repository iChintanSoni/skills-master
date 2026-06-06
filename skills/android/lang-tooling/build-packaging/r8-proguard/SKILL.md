---
name: r8-proguard
description: Covers R8 code and resource shrinking for Android release builds — enabling minification, writing keep rules, handling reflection and serialization, debugging with mapping.txt and retrace, and avoiding over-keeping. Use when configuring shrinking for a release build, diagnosing keep-rule gaps, or reducing APK/AAB size.
globs:
  - "**/*.gradle.kts"
  - "**/*.kts"
  - "**/*.toml"
tags: [r8, proguard, shrinking, build, android, release]
x-skills-master:
  domain: android
  class: lang-tooling
  category: build-packaging
  platforms: ["android"]
  requires: {"android": "16", "kotlin": "2.2", "agp": "9.0"}
  pairs_with: []
  sources:
    - https://developer.android.com/build/shrink-code
    - https://developer.android.com/build/shrink-code#keep-code
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Apply this skill when configuring release builds to reduce APK or AAB size, when a release build crashes or misbehaves in ways the debug build does not, when adding a library that relies on reflection or code generation, or when auditing an existing rule file to remove unnecessary keep directives. It covers R8 specifically (the default shrinker since AGP 3.4) — not the legacy ProGuard tool, which is no longer supported in AGP 9.

## Core guidance

### Enabling shrinking

- Enable `minifyEnabled` and `shrinkResources` only on release builds. Enabling them on debug builds slows incremental compilation and obscures stack traces.
- Set `shrinkResources true` in the same build type as `minifyEnabled true`; resource shrinking requires code shrinking to be active.
- Point `proguardFiles` to both the default AGP rules (`getDefaultProguardFile("proguard-android-optimize.txt")`) and your own `proguard-rules.pro`. The optimize variant enables additional R8 optimizations beyond the baseline set.

```kotlin
// build.gradle.kts (app module)
android {
    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
}
```

### Keep rules — write the minimum necessary

- `-keep` preserves a class and all of its members. Prefer narrower variants:
  - `-keepclassmembers` — keeps specified members of matched classes, allows the class itself to be renamed.
  - `-keepnames` — prevents renaming but still allows removal of unused members.
  - `-keepclasseswithmembers` — keeps a class only if the specified members exist after shrinking.
- Always scope rules to the package or class that actually needs them. Wildcards like `-keep class * { *; }` defeat shrinking entirely.
- Annotate classes that must survive with `@Keep` (from `androidx.annotation`). R8 honours `@Keep` without any rule file entry, making the intent explicit at the source level.
- For Kotlin `data class` used as serialization targets, keep the `copy()` / `componentN()` members only if your serialization library inspects them via reflection; most Kotlin serialization libraries (kotlinx.serialization with the K2 plugin) generate code at compile time and need no keep rules.

### Reflection and serialization

- Libraries that use Java reflection to instantiate classes by name (Gson, Retrofit, Moshi reflect, some DI frameworks) require keep rules for the classes they instantiate. Prefer libraries with compile-time code generation (Moshi codegen, kotlinx.serialization, Hilt) to eliminate the need entirely.
- When using Gson, keep all fields of model classes: `-keepclassmembers class com.example.model.** { <fields>; }`.
- When using Retrofit with a Kotlin serialization or Moshi converter, no reflection keep rules are needed for converters — but keep the service interface if Retrofit generates a proxy at runtime.
- R8 understands `Class.forName(...)` and similar reflection calls when the string argument is a compile-time constant; it will keep those classes automatically. Dynamic class names loaded from a server require explicit rules.

### Debugging with mapping.txt and retrace

- AGP writes `build/outputs/mapping/<variant>/mapping.txt` after every shrunk build. Archive this file alongside the AAB — you need it to decode any crash report from that build.
- Use `retrace` (bundled with AGP) or the Play Console's automatic deobfuscation to recover readable stack traces: `retrace mapping.txt stacktrace.txt`.
- Upload `mapping.txt` to Play Console under the release so crashes reported via Android Vitals are automatically retraced.
- Add `-printusage build/outputs/mapping/<variant>/usage.txt` and `-printseeds build/outputs/mapping/<variant>/seeds.txt` to your rules during investigation to see exactly what was removed and what was kept.
- Use `--info` or `--debug` on the Gradle build to see which rules were applied and from which source (AAR consumer rules, local rules, or generated rules).

### Resource shrinking and strict mode

- Resource shrinking uses a static analysis pass; it cannot remove resources referenced through `Resources.getIdentifier(name, ...)` with dynamic string arguments. Declare those explicitly in `res/raw/keep.xml` using `tools:keep`.
- Use strict mode to find more unused resources: add `tools:shrinkMode="strict"` in `keep.xml`. Test thoroughly — strict mode occasionally removes resources accessed only via reflection or dynamic identifiers.
- Vector drawables and animated vectors referenced only from Compose code via `painterResource(R.drawable.*)` are tracked correctly in AGP 9; no special workarounds needed.

### Avoiding over-keeping

- Do not copy keep rules blindly from Stack Overflow. Each rule has a cost: it widens the reachability graph and reduces the benefit of whole-program optimisation.
- Audit rules periodically with `-printusage` to identify classes that R8 was already keeping through normal reachability — your explicit rule may be redundant.
- Prefer AAR-level consumer rules (`consumerProguardFiles`) for library modules so rules travel with the code that needs them rather than living in the app module.
- Remove or scope down rules after removing a dependency; stale rules silently keep classes from other libraries.

## Platform notes

- **AGP 9 / R8 full mode** — AGP 9 defaults to R8 "full mode" (`r8FullMode = true` is the new default). Full mode applies more aggressive inlining and class merging. It also changes how default interface methods and certain Kotlin-generated constructs are handled. Test release builds on a physical device or emulator before shipping.
- **Baseline profiles** — shrinking and Baseline Profiles are complementary. Shrinking reduces binary size; Baseline Profiles reduce startup JIT time. Both should be active in production.
- **Library modules** — library modules should never set `isMinifyEnabled = true` themselves; shrinking is applied once at the app level. Library modules use `consumerProguardFiles` to ship rules that AGP merges automatically.
- **Kotlin 2.2 + K2** — the K2 compiler emits more precise metadata, which allows R8 to remove more Kotlin-specific boilerplate (companion object accessors, `$default` synthetic methods). Verify that no rules were written to work around K1 artefacts that K2 no longer emits.

## Pitfalls

- **Enabling shrinking on debug builds** — slows builds significantly and produces obfuscated crash logs during development. Always gate `isMinifyEnabled` to release (or a dedicated `releaseDebug` variant).
- **Not archiving mapping.txt** — a crash from a production build without the matching `mapping.txt` is nearly unreadable. Automate upload to Play Console or your crash reporting backend in CI.
- **Wildcard keep rules from library READMEs** — many older library docs recommend `-keep class com.library.** { *; }`. Prefer the library's own consumer rules (shipped in the AAR) or switch to a codegen-based variant.
- **Forgetting `@Keep` on classes loaded via `Class.forName`** — R8 can only auto-keep reflection targets when the class name is a string literal. Dynamic names require an explicit rule or `@Keep` annotation.
- **Removing rules after confirming a build works in debug** — debug builds skip shrinking; a rule gap only surfaces in the release build. Always validate release builds before shipping.
- **Resource shrinking removing locale-specific strings** — if your app loads locale configs from a server, add them to `keep.xml` to prevent over-aggressive removal.
- **Stale consumer rules in library modules** — consumer rules from removed dependencies linger in the merged rule set unless explicitly cleaned up; they silently keep unrelated classes.

## References

- **Android Docs:** [Shrink, obfuscate, and optimize your app](https://developer.android.com/build/shrink-code)
- **Android Docs:** [Customize which code is kept](https://developer.android.com/build/shrink-code#keep-code)

## See also

The `build-sign-distribute` skill covers the full release build pipeline that wraps the shrinking step. For managing dependencies that ship their own consumer rules, see the `spm` skill's conceptual equivalent for Android — Gradle module configuration is covered in `modularization-local-spm`. For CI automation of release builds including mapping file archival, see the `ci-cd-signing` skill.
