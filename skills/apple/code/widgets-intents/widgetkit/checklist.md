## WidgetKit review checklist

- [ ] Chose `StaticConfiguration` vs `AppIntentConfiguration` deliberately (App Intents for any user-configurable widget).
- [ ] Declared `supportedFamilies(...)` and implemented a correct layout for every listed family.
- [ ] Every root view applies `containerBackground(for: .widget)`; nothing draws to the bleeding edges.
- [ ] `placeholder` and `snapshot` are instant and side-effect free (no network, no secrets).
- [ ] Timeline returns an appropriate `TimelineReloadPolicy` (`.atEnd` / `.after` / `.never`) and treats reloads as budgeted, not guaranteed real-time.
- [ ] Used `.never` only when paired with explicit `WidgetCenter.reloadTimelines(ofKind:)` or push updates.
- [ ] Interactive controls are limited to `Button`/`Toggle` initialized with an `AppIntent`; `perform()` is fast and writes shared state.
- [ ] App and widget extension share an App Group and the entitlement is present on both targets.
- [ ] Handled `\.widgetRenderingMode` for accented/tinted/desaturated contexts and redacted sensitive data on Lock Screen / StandBy.
- [ ] watchOS: added `RelevanceConfiguration` / `WidgetRelevance` so the widget surfaces in the Smart Stack when relevant.
- [ ] For server-driven or cross-device freshness, adopted `WidgetPushHandler` + `pushHandler` and added the push entitlement to the extension.
- [ ] Verified previews for each family and configuration in Xcode (widget gallery and on-device).
