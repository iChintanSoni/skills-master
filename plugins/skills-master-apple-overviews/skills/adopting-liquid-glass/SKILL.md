---
name: adopting-liquid-glass
description: Decision router for adopting the Liquid Glass design language across an existing app in the 2025-2026 OS cycle, covering what changes automatically, when to opt in versus defer, and where custom UI needs attention. Use when planning a Liquid Glass migration, recompiling an existing app against the iOS 26 SDK, deciding whether to keep the legacy appearance, or auditing custom controls and backgrounds that may not adapt cleanly to the new material.
---

# Adopting Liquid Glass

Liquid Glass is the dynamic material introduced in the 2025-2026 OS cycle (iOS, iPadOS, macOS, and visionOS "26"). It is a translucent, light-bending layer that floats above content in bars, sheets, and controls. This skill routes the adoption decision rather than teaching every API.

## When to use

- Recompiling an existing app against the iOS 26 or macOS 26 SDK and deciding whether to embrace, defer, or selectively apply the redesign.
- Auditing where standard controls adapt for free versus where custom-drawn UI, hard-coded chrome, or layered backgrounds break under the new material.
- Choosing between full adoption now and a temporary compatibility hold while the team refines the design.

## Core guidance

- Adoption is gated by the SDK, not by minimum deployment target. Apps built with an older SDK keep their prior look; the redesign activates only after linking against the new SDK and running on a "26" OS.
- Prefer standard components. Navigation stacks, tab bars, toolbars, sheets, lists, and most stock controls take on Liquid Glass automatically when relinked, so the highest-leverage move is replacing custom reimplementations of system chrome with the real thing.
- Treat the opt-out as a deadline, not a destination. Setting `UIDesignRequiresCompatibility` to `YES` in Info.plist preserves the legacy appearance, but Apple frames it as a temporary aid that a future release is expected to ignore.
- Reserve `glassEffect` for genuinely custom surfaces (floating action clusters, bespoke overlays) and never blanket-apply it. Glass over glass muddies legibility; let content and standard bars supply most of the material.
- Group adjacent glass elements in a `GlassEffectContainer` so the system can blend and morph them as one shape and render them efficiently, rather than stacking independent effects.
- Audit anything that assumed an opaque bar: content that previously sat behind a solid toolbar now shows through, so verify safe-area insets, edge-to-edge scrolling, and any manual background fills behind bars.
- Respect accessibility settings. Reduce Transparency and Increase Contrast change how glass renders; test that custom surfaces stay legible and avoid tinting text or icons against assumed translucency.

```swift
GlassEffectContainer(spacing: 12) {
    HStack(spacing: 12) {
        Button("Edit") {}
        Button("Share") {}
    }
    .glassEffect(in: .capsule)
}
```

## Platform notes

- iOS and iPadOS: tab bars and toolbars shift to floating glass; verify that content scrolls cleanly beneath them and that custom bottom bars do not double up the material.
- macOS: sidebars, the title bar region, and sheets pick up glass; check window background fills and any `NSVisualEffectView` usage that may now conflict.
- visionOS: glass aligns with the platform's existing material vocabulary, so adoption is mostly continuous, but confirm depth and ornament placement still read correctly.
- The compatibility opt-out applies only on "26" systems; earlier OS versions are unaffected and need no change.

## Pitfalls

- Assuming a recompile is risk-free. Custom backgrounds, hard-coded bar colors, and screenshot-based onboarding can look broken even though standard controls adapt.
- Over-applying `glassEffect` to ordinary content rows or cards, which reduces contrast and fights the system's own glass.
- Shipping the `UIDesignRequiresCompatibility` flag as a permanent solution and skipping the actual design review it was meant to buy time for.
- Forgetting accessibility variants, leaving translucent surfaces unreadable when Reduce Transparency is on.
- Nesting independent glass effects instead of using a container, causing visual seams and extra rendering cost.

## References

- **Documentation:** [Adopting Liquid Glass](https://developer.apple.com/documentation/technologyoverviews/adopting-liquid-glass)
- **Human Interface Guidelines:** [Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- **WWDC:** [Meet Liquid Glass (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/219/)
- **WWDC:** [Get to know the new design system (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/356/)

## See also

- See `hig-materials-liquid-glass` for the material's visual rules, layering hierarchy, and tinting guidance.
- See `swiftui-navigation` and toolbar skills for how standard chrome adopts the material without custom code.
