---
name: kotlin-generics-types
description: Covers Kotlin generics and the type system for Android — declaration-site variance (in/out), use-site projections, star projection, reified type parameters with inline functions, type bounds, and nullability in generic code. Use when writing or reviewing generic Kotlin APIs, repository abstractions, sealed state containers, or utility functions that must preserve type safety across the Android codebase.
---

## When to use

Apply this skill when designing generic classes or functions, when the Kotlin compiler rejects a type argument due to variance, when you reach for `Class<T>` or reflection to recover an erased type at runtime, or when reviewing code that uses `*` projections or unchecked casts. It covers the type-system mechanics that underpin sealed state hierarchies, repository interfaces, serialization helpers, and DI bindings throughout an Android project.

## Core guidance

### Declaration-site variance

- Annotate a type parameter `out T` when the class only *produces* values of `T` (covariant). `List<out T>` means a `List<Dog>` is a subtype of `List<Animal>`.
- Annotate `in T` when the class only *consumes* values of `T` (contravariant). `Comparator<in T>` means a `Comparator<Animal>` can be used wherever `Comparator<Dog>` is expected.
- Omit both (invariant) when the class both reads and writes `T` — `MutableList<T>` is invariant because it exposes both a getter (producer) and a setter (consumer).
- Think of `out` as "I will give you T back" and `in` as "you hand T to me." A class cannot safely be both without invariance.

### Use-site projections

- When you cannot change a class declaration (e.g., a third-party type or a platform API), apply projections at the call site: `Array<out Animal>` or `Array<in Dog>`.
- Use `out` projections when you only need to *read* from the collection; use `in` projections when you only need to *write* into it.
- Projections restrict the API surface available on the projected type — `Array<out Animal>` does not expose `set()`, preventing type-safety violations.

### Star projection

- `List<*>` means "a list of some specific but unknown type." You can read elements as `Any?` but cannot write anything except `null`.
- Prefer `List<*>` over raw types (avoid raw types entirely in Kotlin) when you genuinely do not care about the element type.
- `Map<String, *>` is valid for reading keys as `String` and values as `Any?`; do not confuse it with `Map<*, *>` where even keys are unknown.
- Avoid star projections in public APIs — callers lose type information. Reserve them for internal inspection, reflection utilities, or logging helpers.

### Type bounds

- `<T : SomeType>` constrains `T` to be a subtype of `SomeType`. This is the upper bound.
- Combine multiple bounds with `where`: `fun <T> serialize(value: T) where T : Serializable, T : Comparable<T>`.
- Nullable upper bounds (`<T : Foo?>`) allow `null` as a valid argument; non-nullable upper bounds (`<T : Foo>`) do not.
- Prefer concrete bounds over wide `Any` bounds — they communicate intent and unlock the bound type's API inside the function body.

### Nullability in generic code

- A type parameter `T` without a bound defaults to `T : Any?`, so `T` itself can be `null`. Explicitly bound to `T : Any` when nulls must be rejected.
- Inside a function body, `T` without a non-null bound must be treated as nullable — calling methods on `T` requires a null-check or a non-null bound.
- `T & Any` (Kotlin 2.x definitely-non-nullable intersection type) allows a parameter to accept a nullable type argument while asserting non-nullability at a specific use site — useful in generic extension functions bridging Java APIs.

### Reified type parameters

- Mark a type parameter `reified` to retain its type at runtime. This requires the function to be `inline`.
- Use `reified` to avoid passing `Class<T>` explicitly: `inline fun <reified T : Any> Bundle.getParcelableCompat(key: String): T?` instead of `getParcelable(key, T::class.java)`.
- `reified` enables `is T`, `as T`, `T::class`, and `typeOf<T>()` inside the function body — none of these are legal with a non-reified parameter.
- Do not mark a type parameter `reified` purely for convenience if the function body does not actually use the type token — the `inline` requirement forces all lambdas to be inlined too, which affects binary size.
- `inline` + `reified` functions cannot be called from Java. Provide a non-inline overload that accepts `Class<T>` if Java interop is needed.

```kotlin
// Demonstrates: out variance, type bounds, reified, nullability, and star projection.

// 1. Covariant result wrapper — only produces T, never consumes it.
sealed interface Result<out T> {
    data class Success<T>(val value: T) : Result<T>
    data class Failure(val error: Throwable) : Result<Nothing>
}

// 2. Bounded type parameter + nullability: T must be non-null Parcelable.
fun <T : android.os.Parcelable> android.os.Bundle.typedParcelable(key: String): T? =
    @Suppress("DEPRECATION") getParcelable(key) as? T

// 3. Reified — retain type at runtime without passing Class<T>.
inline fun <reified T : Any> android.os.Bundle.getCompat(key: String): T? = when (T::class) {
    String::class -> getString(key) as? T
    Int::class    -> getInt(key) as? T
    else          -> @Suppress("DEPRECATION") getParcelable(key) as? T
}

// 4. Multiple bounds via where clause.
fun <T> encode(value: T): String
        where T : java.io.Serializable, T : Comparable<T> =
    value.toString()   // both Serializable and Comparable APIs available

// 5. Star projection for a generic inspector — reads only, type unknown.
fun logBundle(extras: Map<String, *>) {
    extras.forEach { (k, v) -> println("$k = $v") }
}

// 6. T & Any — definitely-non-nullable bound from a nullable type argument.
fun <T : Any?> requireValue(value: T & Any): T & Any = value  // T itself may be nullable, but at this call site it is asserted non-null
```

## Platform notes

- **Type erasure on Android** — the JVM erases generic type arguments at runtime. Reflection-based APIs such as Gson's `TypeToken` work around this by capturing the type in an anonymous subclass; prefer `kotlinx.serialization` with `@Serializable` + `serializer<T>()` (which uses `reified`) for a Kotlin-idiomatic alternative.
- **Parcelable generics** — `getParcelable(key, T::class.java)` (API 33+) is the preferred non-deprecated form; pair it with a `reified` inline wrapper to keep call sites clean across API levels.
- **R8/ProGuard** — `reified` functions are inlined at the call site, so the type literal is embedded directly; no keep rules are needed. Generic class metadata (for reflection) may be stripped — guard with `-keep class com.example.MyGeneric { *; }` if you rely on runtime generic inspection.
- **Kotlin 2.2 / K2** — the K2 compiler tightens type-inference around generic lambdas and improves error messages for variance violations. `T & Any` definitely-non-nullable types are fully stable; use them to bridge `@Nullable` Java return types into Kotlin generic functions cleanly.
- **Android API surface** — many Jetpack APIs use `Class<T>` parameters inherited from Java. Prefer `reified` wrappers (e.g., `ViewModelProvider.get<MyViewModel>()`, `Bundle.getParcelableCompat<T>()`) over passing `.java` class literals at every call site.

## Pitfalls

- **Invariance surprise** — `MutableList<Dog>` is not a subtype of `MutableList<Animal>` even though `Dog : Animal`. Assigning it would allow a caller to insert a `Cat`, corrupting the list. Model read-only views with `List<out Animal>` instead.
- **Unchecked casts from star projections** — casting `List<*>` to `List<String>` silently passes at compile time but fails at the first element access if the element is not a `String`. Use `filterIsInstance<String>()` to safely narrow the type.
- **Forgetting `inline` for `reified`** — `reified` type parameters require the function to be `inline`. Omitting `inline` is a compile error; adding it unnecessarily (without `reified` or noinline lambdas) increases binary size.
- **`Nothing` misunderstood** — `Result<Nothing>` as used for `Failure` is intentional: `Nothing` is a subtype of every type, so `Result<Nothing>` is a subtype of `Result<T>` for any `T` (covariance applies). Returning `Result<Nothing>` from a function that is declared `Result<String>` is valid and expected.
- **`T : Any?` vs `T : Any`** — the default upper bound is `Any?`, meaning callers may pass `null`. If your function calls any member on `T`, declare `T : Any` to reject nulls at the call site rather than crashing inside.
- **Variance on mutable interfaces** — adding `out` to a mutable container causes the compiler to forbid all write operations, which may surprise contributors. Document the variance annotation and, if writes are needed in some contexts, expose a separate mutable interface without the annotation.
- **Java interop with `in` parameters** — `Consumer<in Dog>` in Kotlin maps to a wildcard `Consumer<? super Dog>` in Java, which some Java frameworks cannot handle. Provide `@JvmOverloads` or non-variant Java-facing wrappers when the API crosses the language boundary.

## References

- **Documentation:** [Kotlin Generics](https://kotlinlang.org/docs/generics.html)
- **Documentation:** [Kotlin Inline Functions and Reified Type Parameters](https://kotlinlang.org/docs/inline-functions.html)

## See also

The `kotlin-language-core` skill covers the broader Kotlin idioms (sealed classes, null safety, scope functions) that frequently combine with generic containers. The `kotlin-coroutines` skill introduces `Flow<T>`, whose variance and operator signatures rely heavily on the concepts described here. For generic ViewModels and state hoisting patterns in Compose see `compose-state` and `swiftui-app-architecture` (for conceptual analogues).
