## App Intents review checklist

- [ ] Each intent has a clear `title` and, where helpful, a `description`.
- [ ] `perform()` does background-safe work only and returns a meaningful `IntentResult`.
- [ ] Errors thrown from `perform()` are typed and localized for Siri/Shortcuts display.
- [ ] Every `AppEntity` is constructible from its `id` and has a `displayRepresentation`.
- [ ] Each entity has an `EntityQuery` (or enumerable query) covering `entities(for:)` and suggestions.
- [ ] Expensive or networked entity fields use `@DeferredProperty`/`@ComputedProperty` (iOS 26).
- [ ] Parameters use `@Parameter` and the intent reads naturally via `parameterSummary`.
- [ ] A single `AppShortcutsProvider` registers all zero-config shortcuts.
- [ ] Phrases include `\(.applicationName)` and several natural variants per shortcut.
- [ ] Widget/Control intents are passed to `Button`/`Toggle`/`ControlWidgetButton` and are side-effect-light.
- [ ] Configurable widgets conform to `WidgetConfigurationIntent`; Controls to `ControlConfigurationIntent`.
- [ ] In-app actions donate the matching intent so the system can predict them.
- [ ] iOS 26-only APIs are gated behind availability checks for the deployment target.
- [ ] Intent identifiers and phrase sets are kept stable to avoid breaking user automations.
- [ ] Tested on a real device through Siri, Spotlight, the Shortcuts app, and any hosting widget/Control.
