---
name: uikit-auto-layout
description: "Builds robust UIKit layouts with layout anchors, constraint priorities, and stack views. Use when writing programmatic Auto Layout, fixing ambiguous or unsatisfiable constraint logs, tuning content hugging and compression resistance, or anchoring views to safe area, layout margin, and keyboard guides."
globs:
  - "**/*.swift"
tags: [uikit, autolayout, constraints, uistackview, layout-anchors]
x-skills-master:
  domain: apple
  class: code
  category: app-frameworks
  platforms: [ios, ipados, tvos, visionos]
  requires:
    ios: "17"
    swift: "6.0"
  pairs_with: []
  sources:
    - https://developer.apple.com/documentation/uikit/nslayoutconstraint
    - https://developer.apple.com/documentation/uikit/nslayoutanchor
    - https://developer.apple.com/documentation/uikit/uistackview
    - https://developer.apple.com/documentation/uikit/uilayoutguide
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for this skill when laying out UIKit views in code (or auditing storyboard
constraints) and you need predictable, adaptive results across size classes,
Dynamic Type, and rotation. It covers building constraints with layout anchors,
choosing the right guide to anchor against, balancing hugging versus compression
resistance, composing screens with `UIStackView`, and decoding the console logs
that appear when a layout is ambiguous or unsatisfiable.

If you are building with SwiftUI instead, this skill does not apply; SwiftUI uses
its own layout system rather than Auto Layout constraints.

## Core guidance

- Prefer layout anchors over the `NSLayoutConstraint` initializer or Visual Format
  Language. Anchors are type-safe (an x-anchor cannot bind to a y-anchor) and read
  top-to-bottom, which makes intent and review easier.
- Always set `translatesAutoresizingMaskIntoConstraints = false` on any view you
  constrain manually. Skipping it is the most common cause of conflicting
  constraints, because UIKit synthesizes a full set from the autoresizing mask.
- Activate constraints in a batch with `NSLayoutConstraint.activate([...])` rather
  than toggling each `isActive` individually. Batch activation is faster and keeps
  related constraints together.
- Anchor to the right guide: use `safeAreaLayoutGuide` to dodge bars, notches, and
  the home indicator; `layoutMarginsGuide` for readable inset spacing; and
  `keyboardLayoutGuide` to track the keyboard without observing notifications.
- Reach for content hugging and compression resistance before adding more
  constraints. Raise compression resistance on the label that must not truncate,
  and raise hugging on the view that should stay at its intrinsic size while a
  sibling stretches.
- Compose with `UIStackView` for linear arrangements; it manages the per-axis
  constraints for you. Pick `distribution` and `alignment` deliberately, and reach
  back to constraints only for the cross-axis or non-linear pieces.
- Give every screen a fully determined layout: enough constraints to fix position
  and size with no contradictions. Set `identifier` on constraints you expect to
  debug so console logs name them instead of printing raw addresses.

```swift
let card = UIView()
card.translatesAutoresizingMaskIntoConstraints = false
view.addSubview(card)

let margins = view.layoutMarginsGuide
let top = card.topAnchor.constraint(equalTo: margins.topAnchor, constant: 16)
top.identifier = "card.top"

NSLayoutConstraint.activate([
    card.leadingAnchor.constraint(equalTo: margins.leadingAnchor),
    card.trailingAnchor.constraint(equalTo: margins.trailingAnchor),
    top,
])
```

## Platform notes

- iOS / iPadOS: `safeAreaLayoutGuide` accounts for the status bar, navigation and
  tab bars, and the home indicator. On iPad, design for multiple window sizes and
  Stage Manager; rely on size classes and stack views rather than hardcoded
  widths.
- tvOS: there is no touch keyboard guide to track, and the focus engine drives
  navigation. Keep layouts generous, respect the overscan-safe margins, and let
  intrinsic content size plus stack views adapt to the 10-foot environment.
- visionOS: UIKit constraints render inside a window in shared space. Avoid
  pinning content edge-to-edge of the screen; use layout margins and ornaments,
  and let containers size to content so the window can resize comfortably.
- Mac Catalyst: layout margins are wider than on iPhone and pointer interactions
  expect comfortable hit targets, so verify hugging and resistance priorities hold
  up when the window is resized to large widths.

## Pitfalls

- Forgetting `translatesAutoresizingMaskIntoConstraints = false`, then seeing
  "Unable to simultaneously satisfy constraints" because the autoresizing mask
  fights your anchors.
- Creating a constraint without ever activating it (or assigning `.isActive`),
  which leaves the layout ambiguous and the view at a surprising frame.
- Pinning to the screen edge instead of `safeAreaLayoutGuide`, so content slides
  under bars or the home indicator.
- Leaving every priority at `.required` (1000). When something must give, the
  engine breaks a constraint arbitrarily; lower the priority of the constraint you
  are willing to sacrifice instead.
- Treating hugging and compression resistance as interchangeable. Hugging resists
  growing past intrinsic size; compression resistance resists shrinking below it.
- Adding a fixed width or height to a label inside a stack view, which defeats
  Dynamic Type and self-sizing. Let intrinsic content size and priorities do the
  work.
- Mutating `constant` on a constraint you no longer hold a reference to. Keep
  references to the constraints you animate, and never deactivate-then-recreate in
  a hot path.

## References

- **Documentation:** [NSLayoutConstraint](https://developer.apple.com/documentation/uikit/nslayoutconstraint)
- **Documentation:** [NSLayoutAnchor](https://developer.apple.com/documentation/uikit/nslayoutanchor)
- **Documentation:** [UIStackView](https://developer.apple.com/documentation/uikit/uistackview)
- **Documentation:** [Adjusting your layout with keyboard layout guide](https://developer.apple.com/documentation/uikit/adjusting-your-layout-with-keyboard-layout-guide)
- **WWDC:** [Mysteries of Auto Layout, Part 2 (WWDC15)](https://developer.apple.com/videos/play/wwdc2015/219/)

## See also

For declarative layout in the newer framework, see the swiftui-layout skill; the
two systems can coexist inside a UIHostingController but should not share
constraints. When self-sizing text drives your layout, pair this with the
uikit-dynamic-type skill. For scrolling content whose constraints define the
content size, see the uikit-scroll-view skill.
