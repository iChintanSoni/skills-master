---
name: kotlin-serialization
description: Covers kotlinx.serialization for Android — @Serializable classes, Json format configuration, custom serializers, polymorphic sealed hierarchies, and Retrofit/Ktor converter integration. Use when encoding or decoding JSON (or other formats) in a Kotlin Android project without relying on Gson or Moshi.
---

## When to use

Apply this skill when you need to serialize or deserialize data in an Android Kotlin project — JSON responses from a REST API, persisting objects to disk, passing data across process boundaries, or writing integration tests that compare JSON payloads. It covers the full kotlinx.serialization workflow from annotating classes through wiring Retrofit and Ktor converters.

## Core guidance

### Setting up the plugin and dependency

kotlinx.serialization requires both a Gradle plugin (for the compiler plugin that generates serializers) and a runtime library. Add both to every module that contains `@Serializable` classes.

```kotlin
// build.gradle.kts (module level)
plugins {
    kotlin("plugin.serialization") version "2.2.0"
}

dependencies {
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.8.0")
    // Retrofit converter (pick one):
    implementation("com.jakewharton.retrofit:retrofit2-kotlinx-serialization-converter:1.0.0")
    // Ktor content negotiation:
    // implementation("io.ktor:ktor-serialization-kotlinx-json:3.1.0")
}
```

### Annotating classes

- Mark every class that participates in serialization with `@Serializable`. The compiler plugin generates a `KSerializer` for each one at compile time — no reflection at runtime.
- Use `@SerialName("snake_case_key")` to decouple the Kotlin property name from the wire key. This makes renaming safe without breaking API contracts.
- Use `@Required` on properties that must always be present in the input, overriding any default value when deserializing.
- Use `@Transient` on properties that should be excluded from serialization entirely (they must have a default value).
- Data classes are the natural fit; the compiler plugin works equally well on regular classes, objects, and enums.

### Configuring the Json instance

Create a single `Json` instance (or a small set of named instances) per app or module — it is thread-safe and heavyweight to create.

- `ignoreUnknownKeys = true` — almost always correct for API consumers; server can add new fields without breaking the client.
- `isLenient = false` — keep strict by default; opt in only when parsing non-spec JSON.
- `encodeDefaults = false` — omit properties whose value equals the declared default, keeping serialized output lean.
- `coerceInputValues = true` — converts `null` to the default value for non-nullable fields; useful when a server sends `null` for a required field.
- `explicitNulls = false` — skip null fields in the output (pairs well with `encodeDefaults = false`).
- `prettyPrint = true` is useful for debug builds; wire it behind a build flag.

```kotlin
// Shared Json instance — create once, reuse everywhere.
val AppJson = Json {
    ignoreUnknownKeys = true
    encodeDefaults = false
    explicitNulls = false
    coerceInputValues = true
}

@Serializable
data class User(
    val id: Long,
    @SerialName("display_name") val displayName: String,
    val email: String? = null,
    @Transient val isSelected: Boolean = false,
)

// Encode / decode
val json: String = AppJson.encodeToString(User(1, "Alice"))
val user: User = AppJson.decodeFromString(json)

// Collections work without extra wrappers
val users: List<User> = AppJson.decodeFromString("""[{"id":1,"display_name":"Alice"}]""")
```

### Custom serializers

Write a custom `KSerializer<T>` when the default reflection-free serializer cannot express the mapping you need (e.g., a third-party class you cannot annotate, a compact binary-in-JSON encoding, or a type with a complex invariant).

- Implement `descriptor`, `serialize`, and `deserialize`.
- Wire it via `@Serializable(with = MySerializer::class)` on the property or class, or register it on the `Json` instance via `serializersModule`.
- For wrapping primitive types (e.g., inline value classes), delegate to `PrimitiveSerialDescriptor` and the corresponding `encoder.encodeString` / `decoder.decodeString`.

### Polymorphism and sealed hierarchies

kotlinx.serialization handles sealed classes and interfaces natively with a type discriminator field.

- Annotate the sealed hierarchy root and every subtype with `@Serializable`.
- By default the discriminator key is `"type"` and the value is the fully-qualified class name. Override with `@JsonClassDiscriminator("kind")` on the base type and `@SerialName("user")` on each subtype to produce a clean wire format.
- For open polymorphism (non-sealed base types), register subtypes in a `SerializersModule` and pass it to `Json { serializersModule = … }`.

```kotlin
@Serializable
@JsonClassDiscriminator("kind")
sealed interface ApiEvent

@Serializable
@SerialName("message")
data class MessageEvent(val text: String, val authorId: Long) : ApiEvent

@Serializable
@SerialName("reaction")
data class ReactionEvent(val emoji: String, val targetId: Long) : ApiEvent

// Decoding a polymorphic value:
val event: ApiEvent = AppJson.decodeFromString(
    """{"kind":"message","text":"hello","authorId":42}"""
)
```

For open hierarchies where subtypes come from other modules:

```kotlin
val module = SerializersModule {
    polymorphic(ApiEvent::class) {
        subclass(MessageEvent::class)
        subclass(ReactionEvent::class)
    }
}
val json = Json { serializersModule = module; ignoreUnknownKeys = true }
```

### Retrofit integration

Use `retrofit2-kotlinx-serialization-converter` by Jake Wharton or the official `kotlinx-serialization` converter if your Retrofit version bundles one.

```kotlin
val retrofit = Retrofit.Builder()
    .baseUrl("https://api.example.com/")
    .addConverterFactory(AppJson.asConverterFactory("application/json".toMediaType()))
    .build()
```

Return types of `@GET`/`@POST` etc. map directly to `@Serializable` types — no extra wrapper needed. Suspend functions work naturally.

### Ktor integration

```kotlin
install(ContentNegotiation) {
    json(AppJson)
}
```

All `setBody(…)` and `body<T>()` calls then use the shared `AppJson` instance transparently.

## Platform notes

- **R8/ProGuard** — the compiler plugin generates serializers at compile time, so no keep rules are required for the serialized classes themselves. If you use `serializersModule` with string-based lookups (`serializerByTypeToken`), add a keep rule for those classes.
- **Kotlin 2.2 + K2** — the serialization plugin is fully compatible with K2. Annotation processing via KAPT is no longer involved; the plugin is a pure compiler extension.
- **Value classes** — `@JvmInline value class` participates in serialization; it serializes as its underlying type by default. Override with a custom serializer if the wire representation should differ.
- **Multiplatform** — kotlinx.serialization is KMP-ready. The same annotated classes and `Json` instance work on Android, iOS (via Kotlin/Native), and server targets without modification.

## Pitfalls

- **Forgetting the Gradle plugin** — adding only the runtime dependency produces a `SerializationException` at runtime because no `KSerializer` was generated. Always apply `kotlin("plugin.serialization")`.
- **Creating a new `Json` instance per call** — `Json { … }` is expensive. Instantiate once and share; inject via DI or a top-level `val`.
- **Using `@Serializable` on a class with a non-serializable property** — the compiler will error unless you mark the property `@Transient` (with a default value) or provide a custom serializer via `@Serializable(with = …)`.
- **Missing `@SerialName` on sealed subtypes** — the default discriminator value is the fully-qualified class name. Obfuscation with R8 will rename it, breaking deserialization at runtime. Always specify `@SerialName` on every subtype.
- **Treating `ignoreUnknownKeys` as the default** — it is `false` by default. Without it, receiving a new field from the server crashes the app. Enable it explicitly on your shared instance.
- **Mutable collections in `@Serializable` data classes** — a deserialized `List` is read-only by default. If you assign it to a `MutableList` field, you may get a `ClassCastException` at runtime; use `toMutableList()` after decoding or model the property as `List`.
- **Polymorphism without `@SerialName`** — omitting `@SerialName` on a subtype encodes the fully-qualified class name as the discriminator, which is fragile under R8 and refactoring.

## References

- **Documentation:** [kotlinx.serialization — Kotlin](https://kotlinlang.org/docs/serialization.html)
- **API Reference:** [kotlinx.serialization API](https://kotlinlang.org/api/kotlinx.serialization/)
- **Library:** [retrofit2-kotlinx-serialization-converter](https://github.com/JakeWharton/retrofit2-kotlinx-serialization-converter)

## See also

The `kotlin-language-core` skill covers the data class and sealed interface foundations that `@Serializable` builds on. For networking layer setup where serialization is wired into Retrofit or Ktor clients, see `networking-layer`. For passing serialized data in navigation arguments, see `android-navigation-architecture`. For persisting serialized objects to local storage, see the `kotlin-coroutines` skill's IO dispatcher guidance alongside any persistence skill.
