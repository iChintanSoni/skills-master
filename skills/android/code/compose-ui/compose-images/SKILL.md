---
name: compose-images
description: Covers the Image composable, painterResource, vector vs raster assets, ContentScale, alignment, ColorFilter, remote image loading with Coil (AsyncImage, rememberAsyncImagePainter, placeholders, crossfade), ImageBitmap, and accessibility content descriptions. Use when displaying local or remote images, tinting icons, controlling how images scale and crop, or loading network images in Jetpack Compose.
globs:
  - "**/*.kt"
tags: [compose, images, coil, asyncimage, contentscale]
x-skills-master:
  domain: android
  class: code
  category: compose-ui
  platforms: ["android", "large-screen"]
  requires: { "android": "16", "kotlin": "2.2", "compose-bom": "2026.05.00" }
  pairs_with: []
  sources:
    - https://developer.android.com/develop/ui/compose/graphics/images/loading
    - https://developer.android.com/develop/ui/compose/graphics/images/customize
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Use this skill whenever you need to display an image inside a Compose UI — whether it is a bundled drawable, a vector icon, a bitmap decoded at runtime, or a photo fetched from a URL. It covers the full path from picking the right Painter type, through controlling scale and alignment, applying tints and color filters, all the way to wiring Coil for asynchronous remote loading with placeholders and crossfade. Consult this before reaching for a raw `AndroidView`/`ImageView` in Compose.

## Core guidance

### Choosing a Painter

- **Vector drawables / ImageVector** — prefer for icons and simple artwork that must scale without loss. Load with `painterResource(R.drawable.ic_foo)` for XML vectors, or use a Material icon directly as `rememberVectorPainter(Icons.Filled.Star)`.
- **Raster drawables (PNG/JPEG/WebP)** — also loaded via `painterResource(R.drawable.photo)`. Compose wraps them in a `BitmapPainter` automatically.
- **ImageBitmap** — load a `Bitmap` at runtime (e.g. from a decoded file or camera frame) with `bitmap.asImageBitmap()`, then pass it to `Image(bitmap = …)` or `BitmapPainter(imageBitmap)`.
- Do not manually distinguish vector vs raster at call sites — `painterResource` returns the correct type. Only reach for `rememberVectorPainter` or `BitmapPainter` when you need direct control.

### The Image composable

- Always supply a non-null, non-empty `contentDescription` for decorative or informative images; set it to `null` only for purely decorative visuals where a screen reader should skip the element.
- Pass `modifier = Modifier` as the last parameter and let callers control size and padding. Never hard-code `width`/`height` inside a composable you intend to reuse — use `fillMaxSize()` or `size()` at the call site.
- `contentScale` controls how the image fills its bounds. Common choices:

| Value | Behaviour |
|---|---|
| `ContentScale.Fit` | Uniform scale to fit inside — adds letterboxing |
| `ContentScale.Crop` | Uniform scale to fill — clips edges |
| `ContentScale.FillBounds` | Non-uniform stretch — distorts aspect ratio |
| `ContentScale.Inside` | Like Fit but never upscales |
| `ContentScale.None` | No scaling |

- `alignment` works together with `contentScale`; for `ContentScale.Fit` use `Alignment.TopCenter` to pin portrait images at the top rather than centering them.

### ColorFilter and tinting

- Tint a vector icon with a single colour using `colorFilter = ColorFilter.tint(MaterialTheme.colorScheme.primary)`.
- For more complex recolouring use `ColorFilter.colorMatrix(ColorMatrix())` — e.g. greyscale: `ColorMatrix().apply { setToSaturation(0f) }`.
- Prefer `ColorFilter.tint` over setting a raw `tint` attribute in XML for Compose-owned images; the filter is evaluated during drawing and does not cause recomposition.

### Remote images with Coil

- Add `implementation("io.coil-kt.coil3:coil-compose:<version>")` and `implementation("io.coil-kt.coil3:coil-network-okhttp:<version>")` to the module's `build.gradle.kts`. Coil 3 is Kotlin Multiplatform-ready.
- Use `AsyncImage` for the simplest case; it handles loading, success, and error states internally.
- Supply a `placeholder` painter shown while loading and a `fallback` or `error` painter for failure — users should never see a blank white box.
- `crossfade(true)` on the model prevents a jarring pop when the image arrives. Use `crossfade(durationMillis)` to adjust the animation length.
- For finer control (applying transformations, inspecting state externally) use `rememberAsyncImagePainter` and pass the resulting `Painter` to a plain `Image`.
- Coil respects the composable's lifecycle automatically — it cancels in-flight requests when the composable leaves composition.

```kotlin
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.ColorMatrix
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import coil3.compose.AsyncImage
import coil3.request.ImageRequest
import coil3.request.crossfade

// Local raster image with greyscale filter
@Composable
fun ArticleThumb(modifier: Modifier = Modifier) {
    Image(
        painter = painterResource(R.drawable.article_hero),
        contentDescription = "Article hero image",
        contentScale = ContentScale.Crop,
        alignment = Alignment.TopCenter,
        colorFilter = ColorFilter.colorMatrix(
            ColorMatrix().apply { setToSaturation(0f) }
        ),
        modifier = modifier
            .fillMaxWidth()
            .aspectRatio(16f / 9f)
    )
}

// Remote image via Coil — placeholder + crossfade
@Composable
fun RemotePhoto(url: String, description: String, modifier: Modifier = Modifier) {
    AsyncImage(
        model = ImageRequest.Builder(LocalContext.current)
            .data(url)
            .crossfade(true)
            .build(),
        contentDescription = description,
        placeholder = painterResource(R.drawable.ic_image_placeholder),
        error = painterResource(R.drawable.ic_broken_image),
        contentScale = ContentScale.Crop,
        modifier = modifier
            .fillMaxWidth()
            .aspectRatio(4f / 3f)
    )
}
```

## Platform notes

- **Large screens / tablets** — images in adaptive layouts should use `fillMaxSize()` or weight-based sizing rather than fixed `dp` values so they expand naturally in multi-pane layouts. Test `ContentScale.Crop` vs `ContentScale.Fit` at wider aspect ratios.
- **Dark mode** — vector icons tinted via `ColorFilter.tint(MaterialTheme.colorScheme.onSurface)` adapt automatically. Raster images with embedded colour do not; consider providing `-night` variants in your drawable resources for hero imagery.
- **Right-to-left** — `Image` does not auto-mirror. For icons that are directionally meaningful (arrows, logos), add `Modifier.scale(scaleX = if (LocalLayoutDirection.current == LayoutDirection.Rtl) -1f else 1f, scaleY = 1f)` or use a mirrored vector variant.
- **Accessibility** — `contentDescription = null` correctly hides decorative images from TalkBack. For complex images (charts, maps) prefer a longer description or `Modifier.semantics { contentDescription = "…" }` on a wrapping box.

## Pitfalls

- Setting `contentDescription = ""` instead of `null` for decorative images — TalkBack reads the empty string as "unlabeled image", which is confusing. Always use `null` for elements that convey no information.
- Forgetting to constrain the composable's size before calling `AsyncImage` — if the parent provides unbounded constraints the image requests an arbitrarily large decode, wasting memory. Always apply a `size`, `fillMaxWidth`, or `aspectRatio` modifier before loading.
- Using `painterResource` inside a `LaunchedEffect` or background coroutine — `painterResource` must be called on the main thread during composition, not inside an effect. For off-thread bitmap decoding use `ImageDecoder` or Coil directly.
- Applying `colorFilter` on an `AsyncImage` for a loading placeholder tint — the filter applies to the decoded image, not the placeholder painter. Wrap the placeholder in a separate `Image` with its own filter if the two colours differ.
- Not providing a `fallback`/`error` painter to `AsyncImage` in production — network failures leave a blank space that breaks the visual layout. Always supply at minimum an `error` painter.
- Calling `bitmap.asImageBitmap()` on every recomposition — wrap it in `remember(bitmap) { bitmap.asImageBitmap() }` so the conversion runs only when the bitmap reference changes.
- Passing a `String` URL as the `model` parameter of `AsyncImage` without an `ImageRequest` builder — while Coil accepts bare strings, the builder form is required to attach transformations, cache policies, and lifecycle-aware cancellation.

## References

- **Documentation:** [Load and display images in Compose](https://developer.android.com/develop/ui/compose/graphics/images/loading)
- **Documentation:** [Customise images in Compose](https://developer.android.com/develop/ui/compose/graphics/images/customize)
- **Library:** [Coil — Compose integration](https://coil-kt.github.io/coil/compose/)

## See also

For the fundamentals of how composables recompose and when to use `remember`, see `compose-fundamentals`. For `Modifier.drawBehind` and custom canvas painting that goes beyond images, see `compose-drawing-canvas` (when available). For icon usage within buttons and chips, see `compose-forms-controls`.
