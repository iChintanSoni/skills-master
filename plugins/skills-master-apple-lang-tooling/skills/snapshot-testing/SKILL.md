---
name: snapshot-testing
description: Guidance on snapshot (approval) testing for SwiftUI and UIKit/AppKit UI — capturing reference images or serialized text, judging when they add value, keeping them stable across devices and OS versions, reviewing diffs, and pairing them with unit tests. Use when adding visual regression coverage, debugging flaky or device-dependent snapshots, deciding image-vs-text strategies, wiring snapshots into Swift Testing, or reviewing recorded reference changes in a PR.
---

## When to use

Reach for snapshot testing when a component's *rendered output* is the contract: a card layout, a custom control, a formatted label, or a navigation chrome that is tedious to assert property-by-property. A single snapshot captures dozens of layout, color, and typography decisions at once, and fails loudly when any of them drift.

It earns its keep for visual regression on stable design-system pieces and for serializing complex value trees (view-model state, generated JSON, accessibility trees) into reviewable text. It is a poor fit for logic, async flows, or anything where a precise `#expect` reads better than a pixel diff.

There is no first-party snapshot API; the community standard is Point-Free's `swift-snapshot-testing`, which works under both XCTest and Swift Testing.

## Core guidance

- **Prefer text snapshots over image snapshots when you can.** Serializing a struct, an Accessibility hierarchy, or SwiftUI's `description` produces diffs that are diffable in code review and immune to GPU/font-rendering drift. Reserve pixel images for genuinely visual components.
- **Pin the rendering environment.** Render against a fixed size, `colorScheme`, `dynamicTypeSize`, and locale. A snapshot taken on a simulator with different fonts or scale will mismatch byte-for-byte; lock one canonical device/OS and run reference captures only there.
- **Do treat reference files as reviewed source.** Commit them, diff them in PRs, and scrutinize a changed `.png` the way you would changed code — an unexplained reference update is how real regressions get rubber-stamped.
- **Don't leave record mode on.** `record: true` (or `withSnapshotTesting(record: .all)`) overwrites references and makes every test pass. Record deliberately, revert the flag, and re-run to confirm the new baseline actually holds.
- **Keep snapshots small and deterministic.** Inject fixed dates, seeded data, and stubbed images. Animations, blinking cursors, and "now" timestamps are the top cause of flaky diffs.
- **Layer, don't replace.** Snapshots guard appearance; unit tests guard behavior. Cover formatting logic with `#expect` and the assembled view with one snapshot — not the view with twenty pixel tests.
- Use a per-strategy precision threshold (`precision`, `perceptualPrecision`) only as a last resort for unavoidable antialiasing noise; loose thresholds hide regressions.

```swift
import Testing
import SnapshotTesting
import SwiftUI

@MainActor @Test
func badgeMatchesReference() {
    let view = PriceBadge(amount: 19.99, currency: "USD")
        .environment(\.locale, Locale(identifier: "en_US"))
        .frame(width: 200, height: 80)

    // Text strategy: reviewable, device-stable.
    assertSnapshot(of: PriceBadge(amount: 19.99, currency: "USD"), as: .dump)

    // Image strategy: pin size + scheme for reproducibility.
    assertSnapshot(of: view, as: .image(layout: .fixed(width: 200, height: 80)))
}
```

## Platform notes

- **iOS / iPadOS / tvOS:** image strategies render through UIKit hosting; fix `traits` (scale, user interface idiom) and a single simulator model so captures reproduce. tvOS focus state changes appearance — snapshot a defined focus condition.
- **macOS:** AppKit rendering and window scale differ from iOS; never share reference images across platforms. Run macOS references on the same OS minor version to avoid system-font shifts.
- **visionOS:** depth, glass materials, and dynamic lighting make full-fidelity image snapshots fragile. Favor structural/text snapshots of view content over pixel captures of rendered glass.
- **Swift Testing + Xcode 26:** with Swift 6.2, attach failing renders to results via `Attachment.record(_:named:)` so reviewers see baseline/current/diff in the report navigator without leaving Xcode.

## Pitfalls

- **CI captures differ from local.** Reference images recorded on your Mac fail in CI because of a different simulator runtime or font. Record references *in CI* (or a pinned container) and download them, rather than committing local captures.
- **Silent record mode.** A leftover `record: true` makes the suite green forever. Add a lint/check that fails the build if record mode is enabled.
- **Over-snapshotting whole screens.** Large composite snapshots fail for unrelated reasons and produce noisy diffs nobody reads. Snapshot leaf components; assemble with logic tests.
- **Non-deterministic content.** Live dates, random IDs, network images, and incomplete async loads cause intermittent failures. Freeze every input.
- **Trusting a loose precision.** Lowering `perceptualPrecision` to silence flakiness also blinds the test to small but real visual regressions.

## References

- **Documentation:** [Swift Testing](https://developer.apple.com/documentation/testing)
- **Documentation:** [Attachments — Swift Testing](https://developer.apple.com/documentation/testing/attachments)
- **Documentation:** [Swift Testing — Xcode](https://developer.apple.com/xcode/swift-testing/)
- **WWDC:** [Meet Swift Testing (WWDC24)](https://developer.apple.com/videos/play/wwdc2024/10179/)
- **WWDC:** [Go further with Swift Testing (WWDC24)](https://developer.apple.com/videos/play/wwdc2024/10195/)

## See also

Pair this with a general unit-testing skill for behavior coverage and with a UI-testing skill for end-to-end flows that snapshots intentionally avoid. For organizing snapshot cases by trait and tag, lean on the broader Swift Testing skill; for the design contract your image snapshots enforce, cross-reference the relevant Human Interface Guidelines layout skill.
