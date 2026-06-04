---
name: choosing-ui-toolkit
description: Decision router for selecting SwiftUI versus UIKit or AppKit when building a screen, feature, or whole app in the 2026 (OS 26) cycle, including when to mix toolkits through interop. Use when starting a new app or screen and deciding the primary toolkit, when weighing a SwiftUI rewrite of UIKit or AppKit code, when an advanced or legacy requirement (deep text editing, precise scroll or collection control, document-based macOS apps, fine-grained drawing) tempts a drop to UIKit or AppKit, or when wrapping one toolkit inside another with representable types or hosting controllers.
---

## When to use

Reach for this skill when deciding which toolkit owns a new app, a single screen, or a reusable component, and the choice is not obvious. It applies when a team debates a SwiftUI rewrite of working UIKit or AppKit code, when an advanced requirement pushes toward an imperative toolkit, or when a hybrid design is on the table. It is a routing guide, not a tutorial on either framework.

## Core guidance

- Treat SwiftUI as the default for new work. Each OS 26 cycle adds platform features (Liquid Glass adoption, new layout and scene APIs) to SwiftUI first, and standard system components inherit current materials with little code, so betting against it accrues long-term cost.
- Choose UIKit or AppKit deliberately, not by habit. Justify it with a concrete gap: rich inline text editing, exact scroll and paging behavior, custom collection layouts with cell reuse at scale, document-based macOS workflows, low-level drawing, or a mature in-house component too costly to reimplement now.
- Prefer interop over an all-or-nothing rewrite. Embed SwiftUI in an existing app with a hosting controller, and wrap a UIKit or AppKit view with a representable type. Keep each boundary small and one-directional so state ownership stays clear.
- Pick one toolkit as the owner of a given screen rather than interleaving both deeply; nesting hosting controllers inside representables inside hosting controllers makes layout, focus, and lifecycle hard to reason about.
- Let data flow drive the boundary. With the Observation system now shared across SwiftUI and UIKit in OS 26, an observable model can feed both sides, so design the model first and let each view layer render it.
- Do not rewrite stable, shipping UIKit or AppKit screens purely for fashion. Migrate where SwiftUI removes real friction (new features, accessibility, multiplatform reach), and leave settled code alone until it needs to change.
- When wrapping UIKit in SwiftUI, keep the coordinator thin and avoid recreating the underlying view on every update; reconcile in the update step instead.

```swift
struct LegacyChart: UIViewRepresentable {
    var samples: [Double]

    func makeUIView(context: Context) -> ChartView { ChartView() }

    func updateUIView(_ view: ChartView, context: Context) {
        view.update(samples)   // reconcile, do not rebuild
    }
}
```

## Platform notes

- iOS and iPadOS: the richest UIKit surface and the most interop in practice; representables remain common for cameras, web content, and custom collections.
- macOS: AppKit still leads for document-based apps, complex menus, and precise window control; SwiftUI handles many utility and settings windows well and bridges through hosting and representable types.
- watchOS and tvOS: SwiftUI is the practical default; the imperative toolkits are thin or absent there, so interop is rarely the answer.
- visionOS: SwiftUI is the primary toolkit, and volumetric and immersive scenes have no UIKit equivalent; reserve drops to UIKit for embedded 2D content only.

## Pitfalls

- Choosing UIKit "for performance" by reflex. Modern SwiftUI lists and lazy stacks perform well; profile a real case before assuming the imperative path wins.
- Letting two toolkits both believe they own a piece of state, which produces flicker, double updates, or lost edits at the boundary.
- Big-bang rewrites that stall mid-flight, leaving an app split across two half-finished architectures with no shipping milestone.
- Underestimating the representable contract: forgetting to reconcile in the update step, or doing heavy work there, causes redundant rebuilds and layout churn.
- Assuming UIKit and AppKit are interchangeable; their view, control, and window models differ, so a macOS plan cannot simply copy an iOS one.

## Open question

Whether to standardize on SwiftUI now or keep significant UIKit or AppKit investment is genuinely contested. The SwiftUI-first case: it is where Apple ships new capability, it cuts boilerplate, and it unifies code across six platforms, so committing early reduces future migration debt. The counter-case: mature apps depend on UIKit and AppKit behaviors that SwiftUI still approximates or omits, declarative debugging and precise control can be harder, and rewriting stable code carries regression risk with little user-visible payoff. Team skills, app age, the platform mix, and how advanced the UI requirements are all shift the balance, and reasonable teams land differently. This skill does not prescribe a single answer; it asks the deciding engineer to name the concrete requirement that justifies whichever toolkit they choose.

## See also

See `swiftui-core` for the declarative model, state, and layout fundamentals that inform when SwiftUI is sufficient on its own.
