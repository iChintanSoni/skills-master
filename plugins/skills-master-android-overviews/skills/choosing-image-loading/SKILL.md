---
name: choosing-image-loading
description: Decision guide for choosing between Coil and Glide for image loading on Android in 2026. Use when starting a new Compose-first project, evaluating a library migration, or weighing tradeoffs between Kotlin/coroutine-native ergonomics and a mature, battle-tested View-oriented solution.
---

## When to use

Reach for this skill when you need to pick an image-loading library for a new Android project, decide whether to migrate an existing Glide integration to Coil, or reason about tradeoffs between the two dominant options. It is also relevant when evaluating Kotlin Multiplatform (KMP) portability requirements, Compose integration depth, or memory/performance constraints on low-end devices.

## Core guidance

### The two main contenders

**Coil** (Coroutine Image Loader) is a Kotlin-first library built on coroutines and OkHttp. It ships a dedicated `coil-compose` artifact with an `AsyncImage` composable that integrates directly into Compose's layout and rendering pipeline, respects lifecycle automatically, and produces idiomatic Kotlin API surfaces. Coil 3.x also supports Kotlin Multiplatform, making it viable beyond Android.

**Glide** is a mature, battle-tested Java/Kotlin library with years of production hardening across every Android API level and device class. Its primary API is fluent-builder style, oriented around `ImageView` targets. Glide 5.x added a Compose extension (`GlideImage` composable via `compose` artifact), but Compose is a secondary concern in its design rather than the primary target.

### Key axes of comparison

| Axis | Coil | Glide |
|---|---|---|
| Language / runtime | Kotlin-native, coroutines | Java-compatible, Kotlin optional |
| Compose integration | First-class (`AsyncImage`, palette, transitions) | Extension artifact, View-centric roots |
| KMP support | Yes (Coil 3.x) | Android only |
| API style | Kotlin DSL, suspend-friendly | Fluent builder (`.load().into()`) |
| Cache model | Two-level memory + disk, OkHttp-backed | Two-level memory + disk, custom HTTP stack |
| Ecosystem maturity | Younger, fast-moving | Older, extremely stable |
| Transformation support | Built-in + extensions | Rich built-in set, extensive third-party ecosystem |
| Animated GIF / WebP | Supported | Supported (long-standing, deeply tested) |
| Video frame decoding | Not built-in | Supported via `GlideApp` |

### Recommended default for new Compose-first projects

Coil is the natural fit for a Jetpack Compose-first app written in Kotlin 2.x in 2026. `AsyncImage` slots cleanly into any composable without ceremony, size and scale are controlled via standard `Modifier`, placeholder and error states are first-class parameters, and lifecycle handling is automatic. There is no impedance mismatch between the library's concurrency model (coroutines) and Compose's own state machinery.

```kotlin
// Coil — idiomatic AsyncImage in Compose
AsyncImage(
    model = ImageRequest.Builder(LocalContext.current)
        .data("https://example.com/photo.jpg")
        .crossfade(true)
        .build(),
    contentDescription = "Photo",
    contentScale = ContentScale.Crop,
    placeholder = painterResource(R.drawable.placeholder),
    error = painterResource(R.drawable.error),
    modifier = Modifier
        .fillMaxWidth()
        .aspectRatio(16f / 9f)
        .clip(RoundedCornerShape(12.dp))
)
```

### When Glide still wins

- **Large legacy codebases** with extensive Glide usage and custom `RequestOptions`, `Transformation`, or `Target` subclasses: migrating carries real risk for limited gain.
- **Video frame extraction** — Glide's `VideoDecoder` is a well-established, reliable path; Coil requires a third-party plugin or manual `MediaMetadataRetriever` usage.
- **Java interop requirement** — teams writing Kotlin alongside a substantial Java module that loads images will find Glide's API less friction-inducing.
- **Extreme compatibility requirements** — Glide's years of device-specific workarounds make it robust across unusual OEM forks and very old API levels within the Android 16+ floor.
- **Rich third-party transformation ecosystem** — libraries like `glide-transformations` have wide adoption; Coil's transformation ecosystem, while growing, is smaller.

### When Coil is the stronger choice

- Greenfield Compose-first app with no prior image-loading library dependency.
- Kotlin Multiplatform project where the same image-loading logic must run on iOS, desktop, or server (Coil 3.x targets all of these).
- Teams that want coroutine-native cancellation: image loads cancel automatically when the coroutine scope (e.g., the composable's lifecycle) ends — no manual `clear()` calls.
- Projects using OkHttp already: Coil reuses the same `OkHttpClient` instance, cache, and interceptors, avoiding a second HTTP stack.

## Platform notes

**Large screens and foldables** — Both libraries handle large images correctly, but Coil's `AsyncImage` integrates cleanly with `WindowSizeClass`-driven layout changes because it reacts to `Modifier` changes rather than imperative `into(ImageView)` calls. Resizing on configuration change is handled by the Compose recomposition cycle.

**Android TV / Automotive** — Both libraries work on TV and Automotive targets. Glide has longer production history on TV; Coil is equally functional but less battle-tested on those form factors.

**Memory pressure on low-end devices** — Both libraries implement bitmap pooling and LRU caching. Glide's pool is arguably more mature (it has handled GC pressure across a wider device range). On very constrained devices (< 1 GB RAM), benchmark both before committing.

**Adaptive image formats** — Coil's default decoder chain handles WebP, AVIF, and HEIF via Android's native `BitmapFactory`. Glide does the same. Neither requires extra configuration for modern formats as long as the API level supports the codec.

## Pitfalls

- **Using Glide's `GlideImage` in Compose without understanding recomposition** — the Glide Compose artifact is not as deeply integrated as Coil's `AsyncImage`; `GlideImage` can reissue loads on unnecessary recompositions if keys are not carefully managed.
- **Forgetting to share the OkHttpClient with Coil** — creating a default Coil singleton without supplying the app's existing `OkHttpClient` spins up a second HTTP stack, duplicating connection pools and disk cache headers.
- **Holding `ImageLoader` instances carelessly** — Coil's `ImageLoader` maintains a memory cache. Creating one per screen instead of using the singleton (`LocalContext.current.imageLoader`) causes cache fragmentation and increased memory usage.
- **Calling `Glide.with(context).clear(imageView)` from a composable** — mixing imperative Glide cancellation inside Compose violates the declarative contract; use the Glide Compose artifact's `GlideImage` instead, or switch to Coil.
- **Assuming Coil 2.x and Coil 3.x APIs are compatible** — Coil 3 introduced breaking API changes alongside KMP support. If upgrading, review the migration guide; the `ImageRequest` builder and singleton access differ.
- **Neglecting disk cache strategy** — both libraries default to caching the decoded bitmap. For apps with rapidly changing remote images, set `DiskCacheStrategy.DATA` (Glide) or `CachePolicy` (Coil) deliberately, or users will see stale images.

## Open question

**Should a new Compose-first Android project in 2026 default to Coil or Glide?**

The Android community does not have a settled consensus, and both libraries ship actively maintained Compose support.

**Arguments for Coil as the default**

Coil was designed Kotlin-first from its inception, and its coroutine model maps directly onto Compose's own concurrency model. `AsyncImage` is a genuine composable, not a composable wrapper around an imperative API; this means Compose tooling (previews, Modifier chains, semantics for accessibility) works without workarounds. Coil 3.x's KMP support means teams targeting multiple platforms can share image-loading logic. Google's own Compose documentation and codelabs increasingly demonstrate Coil as the primary example, lending implicit endorsement.

**Arguments for Glide as the default**

Glide has more cumulative production hours across more device models than any other Android image library. Its transformation pipeline, video frame support, and HTTP stack agnosticism (Volley, OkHttp, or custom) make it more versatile for complex media requirements. The `coil-compose` integration, while good, is still catching up to Glide's overall feature depth. Teams already fluent with Glide's API incur no onboarding cost, and Glide's Compose artifact is sufficient for the majority of use cases.

**The honest tension**

Coil's ergonomic advantage in a pure Compose/Kotlin context is genuine — the API friction difference is measurable when writing new screens. Glide's advantage is in breadth and battle-hardening — edge cases around memory, exotic image formats, and video thumbnails are where its maturity shows. There is no objectively wrong choice; the decision turns on whether Compose integration smoothness or media feature breadth and historical reliability is the primary constraint for your project.

## References

- **Developer Guide:** [Loading images in Compose](https://developer.android.com/develop/ui/compose/graphics/images/loading)
- **Developer Guide:** [Optimizing network transfers](https://developer.android.com/topic/performance/network-xfer)

## See also

For Compose image and graphics primitives below the library level, see `swiftui-images-symbols` as a conceptual cross-platform parallel. For network-layer configuration that underpins image loading (OkHttp client setup, caching headers), see `networking-layer`. For performance measurement to validate caching and memory choices, see `instruments-profiling` (iOS conceptual parallel) and the Android `instruments-profiling` equivalents in the lang-tooling domain.
