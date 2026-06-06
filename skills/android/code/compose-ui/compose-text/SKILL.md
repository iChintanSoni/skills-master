---
name: compose-text
description: Covers text display in Jetpack Compose — Text composable, MaterialTheme typography, AnnotatedString, inline content, overflow, clickable links via LinkAnnotation, font scaling, and downloadable/variable fonts. Use when building or reviewing any Compose UI that renders, styles, or interacts with text.
globs:
  - "**/*.kt"
tags: [compose, text, typography, material3, android]
x-skills-master:
  domain: android
  class: code
  category: compose-ui
  platforms: ["android", "large-screen"]
  requires: {android: "16", kotlin: "2.2", compose-bom: "2026.05.00"}
  pairs_with: []
  sources:
    - https://developer.android.com/develop/ui/compose/text
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Use this skill whenever you need to display or style text in a Jetpack Compose screen — from simple labels to rich, multi-style paragraphs with inline images or interactive links. It covers every layer: the `Text` composable, `TextStyle`, Material 3 typography tokens, `AnnotatedString`, overflow control, font scaling, and custom/downloadable fonts.

## Core guidance

### Prefer typography tokens over raw TextStyle

- Use `MaterialTheme.typography.*` slots (`bodyLarge`, `titleMedium`, etc.) as the starting point and override only what differs — this keeps the app's type scale consistent and theme-adaptive.
- Never hard-code font size in `sp` when a typography token already expresses the semantic role.
- Compose honours the system font-scale automatically when you use `sp` units; avoid `dp` for text size.

### Text composable do/don't

- **Do** supply `modifier = Modifier.semantics { ... }` or `contentDescription` when the text is purely decorative or needs an accessibility label.
- **Do** set `overflow = TextOverflow.Ellipsis` together with `maxLines` instead of letting text clip silently.
- **Don't** use `softWrap = false` unless you are certain the text fits — it causes silent truncation.
- **Don't** reach for `BasicText` unless you need total control with no opinion from Material; prefer `Text` with explicit `style` overrides.

### AnnotatedString for mixed styles

- Build with `buildAnnotatedString { ... }` rather than concatenating separate `Text` composables — this keeps the paragraph as a single layout unit, enables proper line-breaking, and allows `ParagraphStyle` per paragraph.
- Use `SpanStyle` for inline character-level decoration (colour, weight, underline).
- Use `ParagraphStyle` for block-level attributes (alignment, line height, text indent).
- Pass `inlineContent` as a `Map<String, InlineTextContent>` when embedding icons or composables inside a paragraph — use unique placeholder keys and match the `Placeholder` size exactly.

### Clickable links with LinkAnnotation

Prefer `LinkAnnotation.Url` and `LinkAnnotation.Clickable` over the deprecated `ClickableText`. Annotate a span inside `buildAnnotatedString` and set a `LinkInteractionListener` to handle navigation:

```kotlin
@Composable
fun TermsText(onTermsClick: () -> Unit) {
    val annotated = buildAnnotatedString {
        append("By continuing you agree to our ")
        withLink(
            LinkAnnotation.Clickable(
                tag = "terms",
                linkInteractionListener = { onTermsClick() }
            )
        ) {
            withStyle(SpanStyle(color = MaterialTheme.colorScheme.primary)) {
                append("Terms of Service")
            }
        }
        append(".")
    }
    Text(
        text = annotated,
        style = MaterialTheme.typography.bodyMedium,
        overflow = TextOverflow.Ellipsis,
        maxLines = 3
    )
}
```

### Overflow and clamping

- `maxLines` and `minLines` together reserve a stable height range — useful in card layouts to prevent jank when content loads.
- `TextOverflow.Clip` is the default; only choose it deliberately.
- `TextOverflow.Visible` lets text paint outside its bounds without clipping — use sparingly and clip the parent if needed.

### Font scaling and accessibility

- Always use `sp` for `fontSize`; the system font-scale multiplier applies automatically.
- If a layout genuinely cannot grow (e.g. a chip label), use `LocalDensity` to cap scale rather than locking the size outright, and verify with the largest accessibility font size.

### Downloadable and variable fonts

- Declare downloadable fonts in `res/font/` via XML font provider descriptors or via `GoogleFont` from `ui-text-google-fonts` to avoid bundling large assets.
- Variable fonts (`.ttf` with an `fvar` table) are supported — reference them normally and use `FontVariation.Setting` to drive axes at runtime.
- Preload fonts with `FontFamily.Resolver` in `Application.onCreate` to avoid first-frame fallback flicker.

## Platform notes

**Large screens / foldables** — text columns wider than ~600 dp become hard to read; use `Modifier.widthIn(max = 600.dp)` or a two-column layout rather than letting text span the full width. The Material 3 adaptive layout guidance recommends this explicitly.

**RTL** — `TextAlign.Start`/`TextAlign.End` respect layout direction automatically; avoid hard-coded `Left`/`Right`. `ParagraphStyle` alignment follows `LocalLayoutDirection`.

**API 16 minimum** — all APIs covered here are available on API 16 via the Compose runtime; `FontVariation` requires API 26 but Compose wraps it with a no-op fallback on older versions.

## Pitfalls

- **Deprecated `ClickableText`** — removed in Compose 1.7; migrate to `LinkAnnotation` inside `buildAnnotatedString`.
- **Color inside `SpanStyle` vs `TextStyle`** — a `SpanStyle` colour overrides the composable-level `color` parameter but not the `LocalContentColor`; always set span colours explicitly when mixing themed and custom colours.
- **`inlineContent` size mismatch** — if the `Placeholder` dimensions don't match the actual composable size, text baseline alignment breaks. Measure and hard-code or use a `SubcomposeLayout` wrapper.
- **Nested `AnnotatedString`** — `buildAnnotatedString` does not support recursive nesting of `ParagraphStyle` inside another `ParagraphStyle`; flatten your structure.
- **Font preloading omitted** — without an explicit preload call, downloadable fonts resolve asynchronously and the first frame may render in the fallback system font.
- **Hard-coded `sp` values for headings** — headings with fixed `sp` break at large display sizes; always ground them in a typography token and override only where semantics genuinely differ.

## References

- **Documentation:** [Text in Compose — developer.android.com](https://developer.android.com/develop/ui/compose/text)
- **API reference:** [androidx.compose.ui.text — developer.android.com](https://developer.android.com/reference/kotlin/androidx/compose/ui/text/package-summary)
- **Material 3 Typography:** [Material 3 Type scale — m3.material.io](https://m3.material.io/styles/typography/overview)

## See also

- `compose-state` — managing the state that drives dynamic text content
- `swiftui-text-input` — analogous text-input patterns on the Apple side (for cross-platform teams)
- `hig-typography-sf-symbols` — Apple HIG typography counterpart
