---
name: choosing-form-factors
description: Decision router for targeting Android device form factors beyond the phone — large screens, foldables, Wear OS, TV, Automotive, ChromeOS, and XR. Use when planning which surfaces to support, estimating reach-versus-effort tradeoffs, applying the adaptive quality tiers, or sequencing multi-form-factor investment for a Kotlin/Compose app.
---

## When to use

Reach for this skill when deciding which device surfaces to support in a new or existing Android app — before committing to the engineering investment needed for each surface, or when the product team asks "should we be on tablets/foldables/TV/watch?" and needs a structured answer grounded in reach, effort, and code-sharing reality. Also use when auditing an existing phone-only app against Google Play's large-screen quality requirements.

## Core guidance

### The form-factor landscape and reach reality

Every Android form factor has a different reach-to-effort ratio. Use that ratio as the primary filter before committing engineering capacity.

| Form factor | Approx. installed base (2026) | Code-sharing with phone | Primary SDK |
|---|---|---|---|
| Phones | Baseline — 3 B+ devices | — | Android SDK / Compose |
| Large screens (tablets, foldables) | ~270 M active devices | High (same APK, adaptive layout) | `material3-adaptive`, `WindowSizeClass` |
| ChromeOS (Android apps) | Moderate | High (same APK, window resize) | Android SDK / Compose |
| Wear OS | ~100 M+ devices | Low (separate app module) | Compose for Wear OS |
| Android TV / Google TV | ~150 M+ devices | Low (separate app module) | Compose for TV |
| Automotive OS | Growing; ~30 M vehicles with Google built-in | Very low (dedicated module, strict safety rules) | Automotive OS / Car App Library |
| XR (Android XR, headsets) | Early market, rapidly expanding | Moderate for spatial UI (Compose-based) | Android XR SDK |

### Adaptive quality tiers for large screens and foldables

Google Play evaluates large-screen apps on three quality tiers. These are checkpoints, not aspirational extras — tier 1 is the minimum to avoid demotion in Play Store rankings for large-screen devices.

**Tier 1 — Large Screen Ready (minimum viable)**
The app does not crash, does not letterbox badly, and handles configuration changes (rotation, resize) correctly. The UI fills the available window at reasonable sizes. No crash on foldable fold/unfold. Achievable with relatively small layout work in an existing Compose app by using `fillMaxSize`, respecting `WindowSizeClass`, and not locking orientation.

**Tier 2 — Large Screen Optimized**
The app actively adapts its layout to use the extra space: list-detail pane on tablets, bottom navigation replaced by a rail or drawer at medium/expanded widths, keyboard and mouse input handled naturally. `NavigationSuiteScaffold` and `ListDetailPaneScaffold` from `androidx.compose.material3.adaptive` are the idiomatic paths. Camera, text input, and drag-and-drop work without degradation.

**Tier 3 — Large Screen Differentiated**
The app provides a meaningfully distinct experience: a drawing app exposes stylus pressure sensitivity, a productivity app uses multi-window drag-and-drop to exchange data with other apps, a media app renders a secondary content lane on the expanded pane. This tier requires intentional design for the large surface, not just responsive reflow.

**Strategy:** Ship Tier 1 before any store featuring; reach Tier 2 before prioritising other form factors. Tier 3 is a product differentiator, not a baseline requirement.

### Decision axes for each form factor

**Large screens and foldables — highest priority after phones**
- Reach is large and growing; Play Store actively promotes Tier 2+ apps on tablet search results.
- Code is shared in the same APK; the incremental work is layout adaptation, not a new codebase.
- Use `WindowSizeClass` (compact / medium / expanded) to branch layout logic. Never hardcode dp breakpoints.
- `ListDetailPaneScaffold` replaces custom split-pane logic for master-detail flows.
- `NavigationSuiteScaffold` automatically switches between bottom bar, navigation rail, and navigation drawer based on window width.
- Foldable posture (half-open, tabletop, book) is exposed via `FoldingFeature` in `WindowInfoTracker`; use it for camera viewfinder split, video call layouts, and reading postures.
- **Verdict:** Prioritise alongside phones for any app with a meaningful tablet or foldable user base. The marginal cost of Tier 1 is low; Tier 2 typically requires a focused sprint.

**ChromeOS**
- Android apps run in a resizable window on ChromeOS; an app that achieves Tier 2 large-screen support on tablets is usually 80% of the way to a good ChromeOS experience.
- Key delta: keyboard shortcuts (`KeyEvent` handling, `onKeyUp`), right-click context menus, and window drag-to-resize need deliberate testing.
- ChromeOS users skew toward productivity and content creation — worth targeting if the app has desktop-useful functionality (writing, coding, design, reference).
- **Verdict:** Treat as a free or near-free extension of large-screen work if the app is knowledge/productivity-oriented. Add keyboard and pointer input handling as a separate small workstream.

**Wear OS — purpose-built module, separate mental model**
- Requires a dedicated `wearApp` Gradle module and the `compose-wear-os` (Horologist, `androidx.wear.compose`) libraries. There is no shared UI code with the phone module.
- Data sharing uses the Wearable Data Layer API or Health Connect; do not design for Wear OS by resizing phone screens.
- Reach is meaningful for health, fitness, notifications, and quick-glance utility apps. Irrelevant for media-heavy, text-heavy, or complex form apps.
- Development effort is moderate: Compose for Wear OS is a distinct subset of Compose with its own scrollable columns, pickers, and curved text components.
- **Verdict:** Invest in Wear OS if health/fitness/notification is core to the product. Skip if the primary use case requires more than 2-3 seconds of focused attention at a time.

**Android TV / Google TV — separate module, D-pad-first design**
- Requires a separate `tvApp` Gradle module. `Compose for TV` (`androidx.tv:tv-compose`) is stable but less comprehensive than the phone Compose stack.
- All interaction design must work with a D-pad; touch is not available on most TV hardware. Focus management, focus order, and leanback-style browsing are design constraints, not afterthoughts.
- Reach is large in streaming/media, gaming, and fitness categories. Near-zero value for transactional, productivity, or communication apps.
- Content licensing and DRM (Widevine L1) must be verified separately for TV hardware.
- **Verdict:** Target TV if the app's core loop is consumption (video, music, games, fitness videos). Not worth the investment for utility or productivity apps.

**Automotive OS — highest effort, most constrained**
- Requires the Car App Library or full Automotive OS targeting. Neither is compatible with standard Android SDK or Compose without wrappers.
- Driver distraction guidelines (DDJG) restrict what can be shown or interacted with while moving; Google reviews and enforces these at Play submission.
- Installer, maps, media, and communication apps have the clearest path. POI, parking, EV charging apps are good fits.
- Pre-installed via partnerships in some OEMs; Play for Cars is the primary distribution channel.
- **Verdict:** Only invest in Automotive if the product is directly travel- or vehicle-adjacent and the team can commit to a sustained separate effort. Do not treat this as a tablet variant.

**Android XR — early adopter window**
- Android XR (headsets, spatial computing devices) uses a Compose-based spatial API layer. Phone and large-screen Compose composables can be hosted in flat panels inside an XR environment.
- Spatial UI primitives (3D panels, orbiter elements, subspace placement) require explicit XR SDK calls.
- Reach is currently very small but growing. Early adoption yields featured placement and Google partnership opportunities.
- XR apps share significant structure with large-screen apps if built with `WindowSizeClass` correctly; the incremental XR layer is smaller for well-adapted apps.
- **Verdict:** Explore for immersive media, spatial productivity, and education apps if the team can afford experimental investment. Not ready for mainstream product timelines.

### Prioritisation framework

For most apps, sequence investment in this order:

1. **Phones, Tier 1 large-screen compliance** — no letterboxing, no crashes on rotation or fold. Zero-cost to low-cost.
2. **Large screens + foldables to Tier 2** — adaptive navigation and list-detail layout. One focused sprint with Compose adaptive libraries.
3. **ChromeOS keyboard and pointer input** — if the app is knowledge/productivity-focused.
4. **Wear OS** — if health or quick-glance utility is a product pillar.
5. **TV** — if the app's core loop is media consumption.
6. **Automotive OS** — only for travel/vehicle-adjacent apps with a dedicated module budget.
7. **XR** — exploratory investment for spatial-native categories.

Never work backwards from "we should be on all surfaces." Work forwards from user need and reach.

## Platform notes

- `WindowSizeClass` from `androidx.window:window` is the single source of truth for breakpoints. Import it in a shared `common` module if the project is modularised so both phone and tablet layouts reference the same enum values.
- Foldable hinge data (`FoldingFeature`) is accessible only when the device has a hinge; always null-check before reading posture. Testing requires the `resizable` emulator image or a physical foldable.
- On ChromeOS, `android:resizeableActivity="true"` in the manifest (default for `targetSdk 24+`) is required for windowed multi-tasking. Also declare `android:configChanges` for `screenSize|smallestScreenSize|screenLayout|orientation` to handle resize without full Activity recreation.
- Compose for TV and Compose for Wear OS are distinct Compose forks with different component sets. Do not attempt to share composables across these modules without an abstraction layer — it will break at compile time or produce incorrect UIs.
- Google Play's large-screen dashboard (Play Console) surfaces CUJ (critical user journey) crash data split by form factor. Monitor this after every release; Tier 1 failures appear here before review guidelines trigger.

## Pitfalls

- **Locking orientation globally** — `screenOrientation="portrait"` in the manifest is the single fastest way to fail Tier 1 large-screen quality and get demoted in tablet search. Remove it for all activities that can reasonably support landscape.
- **Hardcoding dp breakpoints instead of `WindowSizeClass`** — magic numbers like `if (screenWidth > 600.dp)` diverge from Play's official tier definitions and break on foldables where the window width changes at runtime without a process restart.
- **Reusing phone composables verbatim on TV** — TV requires a focusable root and `Modifier.focusable()` / focus-aware components. A Compose screen that works on a phone will often render correctly on TV but be completely unusable with a D-pad because no element captures focus.
- **Treating Automotive as a tablet variant** — Automotive OS has distinct security, permission, and DDJG constraints. Attempting to ship a resized phone APK to Automotive will fail Play for Cars review.
- **Ignoring the Wearable Data Layer** — syncing data to Wear OS via a shared ViewModel or database query from the phone module will break: the watch runs in a separate process on a separate device. Use the Data Layer API or Health Connect as the bridge.
- **Building XR too early in a product lifecycle** — XR APIs are evolving; committing core product logic to spatial primitives before the SDK is stable creates expensive migration debt. Prefer flat-panel Compose in XR environments until the API surface solidifies.
- **Skipping the resizable emulator** — physical foldables are not universally available on developer teams. The resizable Android emulator accurately simulates fold/unfold posture transitions and window size changes; use it in CI with `WindowSizeClass` screenshot tests.

## References

- **Documentation:** [Large Screen Canonical Layouts](https://developer.android.com/guide/topics/large-screens/large-screen-canonical-layouts)
- **Documentation:** [Adaptive layouts in Compose](https://developer.android.com/develop/ui/compose/layouts/adaptive)

## See also

For hands-on implementation of `WindowSizeClass`, `NavigationSuiteScaffold`, and `ListDetailPaneScaffold`, see `android-adaptive-layouts`. For canonical navigation patterns that adapt across window sizes, see `android-navigation-architecture`. For Material 3 component guidance that underpins adaptive UI design, see `compose-material3-theming`. For the decision between Compose and Views when starting adaptive work, see `choosing-compose-or-views`.
