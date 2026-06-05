---
name: asset-catalogs
description: Organize images, colors, SF Symbols, and app icons in Xcode asset catalogs with appearance and device variants, and access them type-safely via generated ImageResource/ColorResource symbols. Use when adding image/color/symbol sets, configuring app icons, supporting dark/tinted appearances or per-device assets, replacing string-based asset lookups, or setting up On-Demand Resources.
---

## When to use

Reach for an asset catalog (`.xcassets`) whenever you bundle images, named colors,
SF Symbols, app icons, or data files that vary by appearance, device, or display
scale. The catalog handles slicing, dark-mode pairing, and per-device selection at
build and runtime so you do not hand-roll that logic. Use it to migrate
string-based `Image("name")` / `UIColor(named:)` lookups to compile-checked typed
accessors, and to host resources you stream later with On-Demand Resources.

## Core guidance

- **Prefer typed accessors over strings.** Xcode generates `ImageResource` and
  `ColorResource` symbols plus framework extensions, so write `Image(.heroBanner)`
  or `Color(.brandPrimary)` and let the compiler catch renames. Leading letters are
  lowercased even if the asset name starts uppercase.
- **Toggle generation deliberately.** `ASSETCATALOG_COMPILER_GENERATE_SWIFT_ASSET_SYMBOL_EXTENSIONS`
  controls the SwiftUI/UIKit/AppKit extensions; the per-catalog inspector lets a
  Swift package opt in. Disable per-framework extensions you do not need.
- **Model variants as appearances, not separate names.** Add a Dark (and optional
  High Contrast) appearance to one color/image set instead of `logoLight` /
  `logoDark`. The runtime picks the match for the current trait environment.
- **Let one source scale.** Ship a single-scale vector (PDF or SVG) and enable
  "Preserve Vector Data" so the asset stays crisp when scaled up in SF Symbols
  contexts or Dynamic Type; use 1x/2x/3x only when raster is unavoidable.
- **Add SF Symbols as Symbol Image Sets.** Drop exported `.svg` symbol templates in
  and reference them like any image; configure rendering (monochrome, hierarchical,
  palette, multicolor) and variable value at the call site, not in the catalog.
- **Build app icons with Icon Composer.** In Xcode 26 a single `.icon` file produces
  default, dark, tinted, and clear Liquid Glass variants across platforms; you no
  longer maintain separate icon images in the catalog.
- **Tag for On-Demand Resources, never ship everything.** Assign ODR tags in the
  Attributes inspector and request them at runtime so initial download stays small.

## Platform notes

- **iOS / iPadOS:** Device class (iPhone vs iPad), scale, and wide-gamut (sRGB vs
  Display P3) variants are honored automatically; slicing trims unused variants.
- **macOS / AppKit:** Named colors resolve to `NSColor`; use appearance variants to
  track Aqua and Dark Aqua plus accent-color tinting.
- **watchOS / tvOS:** Use device-specific variants and tvOS layered image stacks
  (parallax) where applicable; ODR is supported but storage budgets are tighter.
- **visionOS:** Symbol and color sets work as elsewhere; prefer vector and
  appearance-driven assets so they read correctly in shared and full spaces.

## Pitfalls

- Renaming a catalog asset silently breaks string lookups but not typed accessors —
  another reason to migrate off `Image("name")`.
- A missing Dark appearance does not warn; the Any/Light variant is reused, so audit
  contrast manually.
- Generated `GeneratedAssetSymbols.swift` may surface warnings under strict
  concurrency in older toolchains; keep the toolchain current.
- ODR tags only slice properly when resources live inside the asset catalog; loose
  bundle files are downloaded whole.
- Forgetting "Preserve Vector Data" makes a PDF rasterize at import scale and blur
  when enlarged.
- Single-size app icons configured in the catalog instead of Icon Composer miss the
  new tinted/clear variants on the 26 cycle.

## Core snippet

```swift
import SwiftUI

struct Badge: View {
    var body: some View {
        Label {
            Text("Verified")
        } icon: {
            Image(.checkmarkSeal)            // typed ImageResource accessor
                .symbolRenderingMode(.palette)
                .foregroundStyle(Color(.brandPrimary), .secondary)
        }
        .background(Color(.cardBackground))   // adapts per appearance automatically
    }
}
```

## References

- **Documentation:** [Managing assets with asset catalogs](https://developer.apple.com/documentation/xcode/managing-assets-with-asset-catalogs)
- **Documentation:** [Asset management](https://developer.apple.com/documentation/xcode/asset-management)
- **Documentation:** [Configuring your app icon using an asset catalog](https://developer.apple.com/documentation/xcode/configuring-your-app-icon)
- **Documentation:** [ImageResource](https://developer.apple.com/documentation/developertoolssupport/imageresource)
- **Documentation:** [Localizing assets in a catalog](https://developer.apple.com/documentation/xcode/localizing-assets-in-a-catalog)
- **Documentation:** [NSBundleResourceRequest](https://developer.apple.com/documentation/foundation/nsbundleresourcerequest)

## See also

Pair this with an SF Symbols rendering and animation skill for call-site styling,
an app-icon and Icon Composer skill for the `.icon` workflow, and a localization
skill when assets vary by language or region. A build-settings skill covers the
compiler flags that gate symbol generation.
