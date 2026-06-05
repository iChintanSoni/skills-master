---
name: localization
description: Internationalize and localize Apple apps with String Catalogs (.xcstrings), modern String(localized:)/LocalizedStringResource APIs, locale-aware formatting, and RTL layout. Use when adding languages, migrating from .strings/.stringsdict, handling plurals or format arguments, formatting dates/numbers/measurements per locale, or exchanging files with translators.
---

# Localization

## When to use

Reach for this skill when shipping an app in more than one language or region, or when preparing a single-language app so that adding languages later is cheap. Concretely: adopting String Catalogs, migrating away from `Localizable.strings`/`.stringsdict`, wiring up plurals and interpolated arguments, formatting dates, numbers, currencies, and measurements for the user's locale, supporting right-to-left scripts, or producing/consuming files for outside translators.

## Core guidance

- **Do** make a String Catalog (`.xcstrings`) the source of truth. Right-click a legacy `Localizable.strings` and choose *Migrate to String Catalog*; Xcode 26 uses format 1.1 and lowers back to `.strings`/`.stringsdict` at build time, so adoption is risk-free.
- **Do** localize text through `Text("…")`, `LocalizedStringResource`, or `String(localized:)` — never `String(format:)` with a hand-built key. Pass a `comment:` so translators get context; Xcode 26 can also auto-generate context comments on device.
- **Do** keep keys as readable English source strings, and add a *comment* rather than overloading the key. Use one catalog per module, and reference module bundles with the `#bundle` macro in frameworks and Swift packages.
- **Do** vary plurals and device width in the catalog (Vary by Plural / Vary by Device) instead of `if` chains. Let interpolation carry arguments: `Text("\(count) items")` exposes `%lld` for translators to pluralize.
- **Don't** concatenate localized fragments or build sentences from pieces — word order differs across languages. Localize the whole sentence and interpolate values into it.
- **Don't** hardcode formats. Use `value.formatted(...)` / `FormatStyle` for dates, numbers, currency, lists, and `Measurement` so output follows the locale's calendar, separators, and unit system automatically.
- **Don't** assume left-to-right. Use `.leading`/`.trailing` (not `.left`/`.right`), let SwiftUI mirror layout, and test with `.environment(\.layoutDirection, .rightToLeft)` and a pseudolanguage.

```swift
// One sentence, interpolated args → translators pluralize via the catalog.
Text("^[\(unread) message](inflect: true) unread")

// Locale-aware formatting; no manual format strings.
let price = amount.formatted(.currency(code: "EUR"))
let when = date.formatted(.dateTime.weekday().day().month())
let dist = Measurement(value: 5, unit: UnitLength.kilometers)
    .formatted(.measurement(width: .abbreviated))
```

## Platform notes

- **All platforms:** `String Catalog` symbol generation (Xcode 26) yields type-safe `LocalizedStringResource` constants with autocompletion — prefer these over stringly-typed keys in shared code.
- **watchOS / tvOS:** screen real estate varies; use *Vary by Device* in the catalog to provide shorter strings rather than truncating at runtime.
- **macOS / iPadOS:** menu and keyboard-shortcut titles localize too; verify mnemonics and that nothing clips after pseudolocalization (longer German, expanded strings).
- **visionOS:** ornaments and windows mirror under RTL like other SwiftUI layout; confirm depth-based affordances still read correctly.

## Pitfalls

- Treating the catalog's *state* column as cosmetic: stale or needs-review entries ship untranslated. Resolve every warning before release.
- Forgetting `#bundle` (or `Bundle.module`) in packages — strings silently fall back to the development language because lookup hits the wrong bundle.
- Pluralizing in code (`count == 1 ? "item" : "items"`) — this only works for English; move the rule into the catalog so each language supplies its own categories (zero/one/two/few/many/other).
- Using `String(format:)` with `%@`/`%d` and losing positional reordering; localized format strings need positional specifiers, which the catalog manages for you.
- Manually formatting currency or dates with `NumberFormatter`/`DateFormatter` singletons and caching the wrong locale; `FormatStyle` is locale-aware and cheaper to reason about.

## References

- **Documentation:** [Localizing and varying text with a string catalog](https://developer.apple.com/documentation/xcode/localizing-and-varying-text-with-a-string-catalog)
- **Documentation:** [Exporting localizations](https://developer.apple.com/documentation/xcode/exporting-localizations)
- **Documentation:** [LocalizedStringResource](https://developer.apple.com/documentation/foundation/localizedstringresource)
- **WWDC:** [Code-along: Explore localization with Xcode (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/225/)
- **WWDC:** [Discover String Catalogs (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10155/)
- **Human Interface Guidelines:** [Right to left](https://developer.apple.com/design/human-interface-guidelines/right-to-left)

## See also

Pair this with the SwiftUI text and typography skills for how `Text` renders Markdown and dynamic type alongside localized content, and with the Foundation formatting skill for deeper `FormatStyle` customization. For market readiness, the app distribution skill covers per-language App Store metadata and screenshots.
