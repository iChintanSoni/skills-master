---
name: controls-widgets
description: Build iOS 18+ control widgets that surface app actions in Control Center, the Lock Screen, and the Action button using ControlWidget with ControlWidgetButton/Toggle and App Intents. Use when adding a control, exposing a quick toggle or button outside the app, wiring a control to an App Intent, or driving control state with a value provider.
---

## When to use

Reach for a control widget when you want a single tap of your app's functionality available without opening the app: a flashlight-style toggle, a "start timer" button, a "new note" shortcut. Controls live in Control Center, on the Lock Screen, and can be bound to the Action button on supported hardware. They ship from your widget extension and run their work through App Intents, so they reuse the same intents that already power your interactive widgets, Shortcuts, and Siri.

Do not use a control for multi-step flows or anything needing on-screen UI. A control performs one action or reflects one boolean-ish state; route richer interactions back into the app with an `OpenIntent`.

## Core guidance

- **Pick the right template.** Use `ControlWidgetButton` for a fire-and-forget action and `ControlWidgetToggle` for state that is clearly on/off. Both are returned from a `ControlWidget`'s configuration body; do not hand-roll a `Button` or `Toggle`.
- **Choose static vs. configurable.** `StaticControlConfiguration` covers a fixed control; `AppIntentControlConfiguration` lets the user parameterize it (which timer, which room) via a `ControlConfigurationIntent`. Add configuration only when users genuinely need choices.
- **Do the work in an App Intent.** A control's action is an `AppIntent`. Set the intent's Target Membership to both the app and the widget extension so it resolves in either process. To launch your app at a destination, adopt `OpenIntent` (it implies `openAppWhenRun`).
- **Drive toggle state with a value provider.** Conform to `ControlValueProvider` (or `AppIntentControlValueProvider`): `currentValue()` is `async` and may fetch from a store, server, or App Group and may throw to ask for a later reload; `previewValue` is instant and should equal your off state for the gallery, Lock Screen editor, and Action button settings.
- **Don't block in `previewValue`.** It renders before the control is even added, so return a constant. Reserve I/O for `currentValue()`.
- **Label every state.** Provide an SF Symbol plus a short title; for toggles, vary the label/symbol by `isOn`. The system tints and styles controls for you, so design within the monochrome, system-driven appearance rather than fighting it.
- **Reload on change.** After the underlying state changes in-app, call `ControlCenter.shared.reloadControls(ofKind:)` so the control's value provider re-runs and the displayed state stays truthful.

```swift
struct FocusToggleControl: ControlWidget {
    var body: some ControlWidgetConfiguration {
        StaticControlConfiguration(kind: "com.example.focus") {
            ControlWidgetToggle(
                "Deep Focus",
                isOn: FocusState.isActive,
                action: SetFocusIntent()
            ) { isOn in
                Label(isOn ? "On" : "Off",
                      systemImage: isOn ? "moon.fill" : "moon")
            }
        }
    }
}
```

## Platform notes

- **iOS / iPadOS 18+ only.** Controls are unavailable on macOS, watchOS, tvOS, and visionOS; guard any shared code by availability and platform.
- **Lock Screen and Action button.** The same control surfaces in Control Center, as a Lock Screen control, and as an Action button assignment. The intent may run while the device is locked, so don't assume an unlocked, foregrounded app or access to protected data.
- **Action button is hardware-gated.** It exists only on iPhone 15 Pro and later (and Apple Watch Ultra, which controls do not target); never make your control's value depend on that binding existing.
- **State sharing.** The widget extension is a separate process. Persist shared state in an App Group (or a server) so `currentValue()` and your app agree.

## Pitfalls

- **Intent missing from the extension target.** If the action intent isn't a member of the widget extension, the control fails to perform or launch the app. Add both memberships.
- **Trying to open with a custom URL scheme.** For `OpenIntent`-style launches the URL representation must be a universal link; a custom scheme won't open the app from a control.
- **Stale toggles.** Forgetting to call `reloadControls(ofKind:)` after an in-app state change leaves the control showing the wrong on/off value until the next system refresh.
- **Heavy `currentValue()`.** Slow or frequently-throwing providers get reloaded less aggressively; keep the async fetch lean and let throwing signal a genuine "try again later," not routine latency.
- **Expecting custom colors or rich layout.** The system enforces a compact, tinted appearance; complex SwiftUI inside a control template is ignored or clipped.

## References

- **Documentation:** [Creating controls to perform actions across the system](https://developer.apple.com/documentation/widgetkit/creating-controls-to-perform-actions-across-the-system)
- **Documentation:** [ControlWidget](https://developer.apple.com/documentation/swiftui/controlwidget)
- **Documentation:** [Adding refinements and configuration to controls](https://developer.apple.com/documentation/widgetkit/adding-refinements-and-configuration-to-controls)
- **Documentation:** [ControlValueProvider](https://developer.apple.com/documentation/widgetkit/controlvalueprovider)
- **WWDC:** [Extend your app's controls across the system (WWDC24)](https://developer.apple.com/videos/play/wwdc2024/10157/)

## See also

For the intents that power a control's action and launching, see the app-intents-fundamentals skill (and its OpenIntent guidance for deep-linking into your app). For interactive home-screen and Lock Screen timeline widgets that share the same App Intents, see the widgetkit-widgets skill. For binding a control to physical activation, pair this with an action-button skill if present.
