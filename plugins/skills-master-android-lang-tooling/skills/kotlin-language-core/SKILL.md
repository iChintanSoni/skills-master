---
name: kotlin-language-core
description: Covers idiomatic Kotlin for Android development — val/var immutability, null-safety, data classes, sealed classes, when expressions, scope functions, extension functions, and collection operations. Use when writing or reviewing Kotlin code on Android to ensure correctness, expressiveness, and safety.
---

## When to use

Apply this skill whenever writing new Kotlin code for Android, reviewing a pull request for idiomatic style, migrating Java code to Kotlin, or onboarding contributors who need a concise reference for modern Kotlin patterns. It covers language-level idioms, not Compose or Coroutines specifics.

## Core guidance

### Immutability and val/var

- Prefer `val` everywhere; reach for `var` only when mutation is genuinely required.
- Use `val` for ViewModel state holders and repository results; `var` inside local builder blocks is acceptable.
- Top-level and object-level mutable state should be `private var` backed by a `val` public property.

### Null safety

- Treat `!!` as a code smell — it silences the compiler and shifts crashes to runtime. Reserve it for cases where you have already exited the null branch and the compiler cannot infer it.
- Use `?.` for safe calls and chain them; `?.let { }` to execute a block only when non-null.
- Use `?:` (Elvis) to supply a default or throw an informative exception — `?: error("Expected non-null X")`.
- Prefer safe casts (`as?`) over unchecked `as`; handle the `null` result explicitly.
- Avoid platform types leaking in from Java APIs by annotating Java code or wrapping it in null-checking extension functions.

### Data classes

- Use `data class` for value objects: DTOs, UI state snapshots, domain models that require structural equality.
- Keep data classes small — if a constructor exceeds ~5 parameters, consider splitting the model.
- Use `copy()` to produce modified instances rather than mutating fields; this integrates naturally with StateFlow and Compose recomposition.
- Do not use `data class` for entities that have identity semantics (e.g., long-lived domain objects where equality should be referential).

### Sealed classes and interfaces for state

- Model UI/domain states with `sealed interface` (preferred over `sealed class` in Kotlin 1.5+): no constructor overhead, allows implementors in the same package to be `data class` or `data object`.
- Keep the sealed hierarchy flat unless nesting genuinely reduces duplication.
- Use `data object` for singleton states (e.g., `Loading`, `Empty`) and `data class` for states carrying payload.

### when expressions

- Exhaust `sealed` hierarchies in `when` — the compiler enforces completeness when `when` is used as an expression.
- Avoid `else` branches on sealed types; adding a new subtype should produce a compile error, not silent fallthrough.
- Prefer `when` as an expression assigned to a `val` rather than a `when` statement with side-effects in each branch.

### Scope functions

| Function | Receiver | Returns | Primary use |
|---|---|---|---|
| `let` | `it` | lambda result | Null-check chain, transform a value |
| `apply` | `this` | receiver | Object initialisation / builder |
| `run` | `this` | lambda result | Compute with receiver in scope |
| `also` | `it` | receiver | Side-effects (logging, assertions) without changing the chain |
| `with` | `this` | lambda result | Group operations on an existing object (non-extension) |

- Do not nest scope functions more than two levels deep — readability collapses quickly.
- `apply` is idiomatic for configuring newly created objects; `let` for transforming nullable values.

### Extension functions

- Define extension functions in a file named after the receiver type (e.g., `StringExt.kt`, `ContextExt.kt`).
- Keep extensions focused; an extension that needs to import half the app's dependencies belongs elsewhere.
- Avoid shadowing members with extensions — the member always wins, causing confusion.

### Default and named arguments

- Use default arguments to reduce overload proliferation; a single function with defaults replaces 3–4 Java-style overloads.
- Always use named arguments when passing more than two arguments of the same type to a function — prevents transposition bugs.

### Properties with custom getters

- Use a custom `get()` for derived values to avoid storing redundant state.
- Prefer `val` with a custom getter over a no-arg function when the value semantically "belongs to" the object and has no side effects.

### Collection operations

- Prefer the standard library chain (`filter`, `map`, `flatMap`, `groupBy`, `associate`, `partition`) over manual loops.
- Use `asSequence()` when the chain has multiple intermediate steps and the collection is large (avoids intermediate list allocation).
- Prefer `firstOrNull` / `lastOrNull` / `find` over indexed access with manual bounds checks.
- Use `buildList { }` / `buildMap { }` for imperatively constructed read-only collections.

```kotlin
// Demonstrates: sealed interface, data object/class, when-expression,
// scope functions, null-safety, and collection idioms together.

sealed interface UiState<out T> {
    data object Loading : UiState<Nothing>
    data object Empty : UiState<Nothing>
    data class Success<T>(val data: T) : UiState<T>
    data class Error(val message: String, val cause: Throwable? = null) : UiState<Nothing>
}

data class User(val id: Long, val name: String, val email: String?)

fun processUsers(raw: List<User?>): UiState<List<User>> {
    val valid = raw
        .asSequence()
        .filterNotNull()
        .filter { it.name.isNotBlank() }
        .map { user ->
            // named copy — never mutate the original
            user.email?.let { user } ?: user.copy(email = "unknown@example.com")
        }
        .toList()

    return when {
        valid.isEmpty() -> UiState.Empty
        else -> UiState.Success(valid)
    }
}

fun renderState(state: UiState<List<User>>): String = when (state) {
    UiState.Loading -> "Loading…"
    UiState.Empty   -> "No users found."
    is UiState.Success -> "Users: ${state.data.size}"
    is UiState.Error   -> "Error — ${state.message}"
    // No `else` needed: compiler enforces exhaustiveness on sealed types
}
```

## Platform notes

- **Android SDK Java interop** — many Android APIs return platform types. Annotate Java code with `@Nullable`/`@NonNull` or wrap calls so Kotlin's null-safety is not bypassed silently.
- **Proguard/R8** — data class `copy()`, `componentN()`, and `toString()` are generated; keep rules are rarely needed in modern AGP, but verify with `--print-usage` if shrinking aggressively.
- **Kotlin 2.2 specifics** — K2 compiler is now stable and default; compile times improve significantly. The new `when` exhaustiveness rules are stricter in K2: sealed hierarchies imported from another module also require exhaustive `when` expressions.
- **`data object` serialization** — when using `kotlinx.serialization`, annotate `data object` states with `@Serializable` explicitly if they participate in a serialized sealed hierarchy.

## Pitfalls

- **Overusing `!!`** — every `!!` is a deferred `NullPointerException`. Replace with safe calls, Elvis, or a `checkNotNull` with a descriptive message.
- **Mutable backing properties leaked** — exposing `_mutableList` as `val items get() = _mutableList` still exposes the same mutable reference; cast to `List<T>` in the getter.
- **Scope function nesting** — two or more nested `let`/`run`/`apply` blocks obscure the receiver; name intermediate results with local `val`s instead.
- **`else` branch on sealed `when`** — adding a new subtype becomes a silent runtime bug; always omit `else` on sealed hierarchies when `when` is an expression.
- **`data class` with mutable fields** — a `data class` with a `var` field or a mutable collection property breaks structural-equality expectations and causes subtle bugs in StateFlow / SnapshotState comparisons.
- **Extension functions on broad receivers** — extension functions on `Any` or `Context` pollute every call site in the project; scope them narrowly.
- **Sequence vs List confusion** — sequences are lazy; calling `toList()` materializes them. Forgetting to terminate a sequence chain with a terminal operation (or calling `count()` on an infinite sequence) hangs the app.

## References

- **Documentation:** [Kotlin Basic Syntax](https://kotlinlang.org/docs/basic-syntax.html)
- **Documentation:** [Kotlin for Android](https://developer.android.com/kotlin)
- **Documentation:** [Kotlin Scope Functions](https://kotlinlang.org/docs/scope-functions.html)
- **Documentation:** [Sealed Classes and Interfaces](https://kotlinlang.org/docs/sealed-classes.html)
- **Documentation:** [Collections Overview](https://kotlinlang.org/docs/collections-overview.html)

## See also

Concurrency patterns build directly on these language fundamentals — see `swift-concurrency` for the analogous mental model, or the Android-specific `kotlin-coroutines` skill for `suspend`, `Flow`, and structured concurrency. For modelling navigation state with sealed types see `swiftui-navigation` (conceptually similar) or the Android `android-navigation-architecture` skill. For applying these idioms inside Compose UI code see `compose-state`.
