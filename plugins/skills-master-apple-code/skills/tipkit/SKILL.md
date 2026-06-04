---
name: tipkit
description: Guidance for surfacing contextual feature-discovery tips with TipKit. Use when defining a Tip, gating it with parameter- or event-based rules, presenting via popoverTip or TipView, grouping tips, or syncing tip status across devices with CloudKit.
---

## When to use

Reach for TipKit when you want to teach people about a feature they may not have
noticed, at the moment it becomes relevant. It fits non-blocking onboarding,
contextual hints near a control, and progressive disclosure of related features.
Skip it for required setup, errors, or anything the user must act on now — use an
alert, sheet, or inline state for those.

## Core guidance

- Do call `Tips.configure([...])` once at launch (App init or `applicationDidFinishLaunching`) before any tip can display; set `displayFrequency` and `datastoreLocation` there.
- Do conform a value type to `Tip`, returning `Text` for `title`, optional `Text?` for `message`, and optional `Image?` for `image`. Keep copy short and benefit-oriented.
- Do gate visibility with the `#Rule` macro: parameter rules read app state; event rules check `donations.count` after you `await event.donate()`. Combine several rules — all must pass.
- Do prefer inline `TipView(tip)` over `popoverTip(tip)`; a popover obscures the very UI it points at, so reserve it for controls with no room for an inline card.
- Do `invalidate(reason: .actionPerformed)` the moment the user adopts the feature, so the tip never reappears after it has served its purpose.
- Don't show many tips at once — wrap related ones in a `TipGroup(.ordered)` to teach in sequence, or `.firstAvailable` to show whichever unrelated tip currently qualifies (iOS 18+).
- Don't ship without testing display logic; call `Tips.resetDatastore()` (or set `.datastoreLocation(.disabled)`) during development so tips show every run.

```swift
struct AddToFavoritesTip: Tip {
    static let didBrowse = Tips.Event(id: "didBrowse")
    var title: Text { Text("Save Favorites") }
    var message: Text? { Text("Tap the star to keep this item handy.") }
    var image: Image? { Image(systemName: "star") }
    var rules: [Rule] {
        #Rule(Self.didBrowse) { $0.donations.count >= 3 }
    }
    var options: [Option] { [MaxDisplayCount(1)] }
}
```

## Platform notes

- Available on iOS/iPadOS 17, macOS 14, watchOS 10, tvOS 17, and visionOS 1; `TipGroup` and `MaxDisplayDuration` require the 18/15/26-era OS releases (iOS 18+).
- Presentation differs by platform: `popoverTip` renders as a popover on iOS/iPadOS/macOS, while `TipView` is the portable inline form that works everywhere, including watchOS where space is tight.
- CloudKit sync needs an iCloud-capable target: enable the iCloud capability with a CloudKit container, add the Background Modes → Remote notifications capability, then pass `.cloudKitContainer(.named("iCloud.com.example.app.tips"))` to `Tips.configure`. No Info.plist usage string is required, but the user must be signed into iCloud for status to propagate.

## Pitfalls

- Forgetting `Tips.configure` before a tip is referenced silently prevents display; configure first, in `do/catch`, since it throws.
- Event donations are async — donate from a `Task`/async context, and remember each donation only counts once it completes, so a rule may lag a rapid tap.
- Each tip's identity defaults to its type name; reusing one struct for many items requires a custom `id` (e.g. include a model id) or all instances share one status.
- `options` such as `MaxDisplayCount` take priority over `rules`: once the cap is hit the tip stays hidden even if rules still pass.
- Tip state persists across launches; if tips "won't show" again it is usually leftover datastore state — reset it rather than tweaking rules blindly.

## References

- **Documentation:** [TipKit](https://developer.apple.com/documentation/tipkit)
- **Documentation:** [Highlighting app features with TipKit](https://developer.apple.com/documentation/tipkit/highlighting-app-features-with-tipkit)
- **WWDC:** [Make features discoverable with TipKit (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10229/)
- **WWDC:** [Customize feature discovery with TipKit (WWDC24)](https://developer.apple.com/videos/play/wwdc2024/10070/)
- **Human Interface Guidelines:** [Offering help](https://developer.apple.com/design/human-interface-guidelines/offering-help)

## See also

Pair this with an onboarding-flow skill for first-run experiences that TipKit
deliberately avoids, and with a SwiftData skill when you reason about where tip
status is persisted. For the CloudKit container setup that backs cross-device
sync, see a CloudKit configuration skill.
