## Kotlin Multiplatform review checklist

- [ ] No `import android.*`, `import java.io.*`, or `import platform.*` appears in any `commonMain` source file.
- [ ] `expect` declarations in `commonMain` are narrow — they declare only what shared code calls, not the full platform API surface.
- [ ] Every `expect` declaration has a matching `actual` in all required platform source sets; the project builds cleanly for both `androidMain` and `iosMain`.
- [ ] Platform engines for Ktor (`OkHttp` for Android, `Darwin` for iOS) are declared in platform source sets, not in `commonMain`.
- [ ] `kotlinx.datetime` is used in `commonMain` instead of `java.time.*` or `java.util.Date`.
- [ ] `kotlinx.serialization` annotations (`@Serializable`) are applied to all shared data models that cross network or database boundaries.
- [ ] `HttpClient` is configured in a `commonMain` factory function that accepts a `HttpClientEngine` parameter; the engine is provided per platform.
- [ ] Room KMP `@Database`, `@Entity`, and `@Dao` are in `commonMain`; the `RoomDatabase.Builder` is created via `expect`/`actual` in platform source sets.
- [ ] KSP version in `libs.versions.toml` matches the Kotlin version exactly (e.g., `ksp = "2.2.0-1.0.x"`).
- [ ] The iOS framework target declares `isStatic = true` in the Gradle `binaries.framework { }` block.
- [ ] `androidMain` contains no business logic — only DI wiring, context-requiring factories, and `actual` implementations.
- [ ] `Dispatchers.Main` usage in `commonMain` is intentional; `Dispatchers.IO` is used only for blocking I/O understood to run on a thread pool on both platforms.
- [ ] Shared `Flow`-returning APIs are not directly exposed to Swift; iOS callers use a wrapper layer that converts `Flow` to Swift Combine publishers or callbacks.
- [ ] Room KMP schema version and migration strategy (`AutoMigrationSpec` or manual `Migration`) is defined before the first production release to avoid destructive drops on upgrade.
- [ ] The shared module publishes a stable API surface; breaking changes to `commonMain` interfaces go through a deprecation cycle rather than direct removal.
- [ ] Gradle `androidTarget { }` sets `jvmTarget = "17"` (or the project's consistent JVM target) to avoid mixed-JVM-target warnings.
- [ ] Intermediate source sets (`appleMain`, `nativeMain`) are introduced only when two or more targets genuinely share platform-specific (but not Android) code, to avoid unnecessary hierarchy complexity.
