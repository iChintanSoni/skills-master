# 2026-08 staleness refresh — execution shortlists

Research date **2026-08-25**. Both domains were bulk-snapshotted before the platform
waves that followed (apple `2026-05-30`, nine days before WWDC 2026; android
`2026-06-06`, ten days before Android 17 stable). These are the ranked worklists for
PLAN.md Phases 4–6; check items off as their batch PRs merge. Every re-verified skill
bumps `snapshot_date`; MUST updates take a **minor** version bump (substantive
guidance change), SHOULD re-verifications a **patch**.

Era facts: iOS/macOS/watchOS/visionOS/tvOS **27**, Xcode 27, Swift 6.4, SF Symbols 8;
Android **17** (API 37, stable 2026-06-16), Room 3.0.1, Navigation 3 1.1, Compose 1.12
/ BOM 2026.08.00, material3 1.4.0.

---

## Android — MUST update (16)

All paths relative to `skills/android/`.

- [ ] `overviews/overviews/choosing-navigation` — recommendation is now stable
  Navigation 3 (`androidx.navigation3` 1.1.0), not Nav2.
- [ ] `code/architecture/navigation-compose` — needs Nav3 positioning: back-stack-as-
  state model, scenes, migration path.
- [ ] `lang-tooling/architecture/android-navigation-architecture` — Nav3 inverts the
  architecture (developer-owned back stack, adaptive scenes, shared elements).
- [ ] `code/data/room` — Room 3.0.1: new `androidx.room3` package, KSP mandatory,
  suspend/reactive DAO functions required.
- [ ] `overviews/overviews/choosing-storage` — route Room advice to room3 + migration
  cost.
- [ ] `code/media-camera-ml/camerax` — `CameraXViewfinder` composable replaces
  PreviewView-in-AndroidView as the recommended Compose pattern (CameraX 1.5).
- [ ] `code/media-camera-ml/media3-exoplayer` — scrubbing mode + CodecDB stable;
  Android 17 codec additions (Eclipsa Video HDR, xHE-AAC encode, H.266, RAW14).
- [ ] `code/form-factors/adaptive-window-size-classes` — API 37: orientation/
  resizability/aspect-ratio locks ignored on sw≥600dp, no opt-out.
- [ ] `code/form-factors/window-manager-foldables` — same enforcement.
- [ ] `design/platforms/m3-large-screens` — "Tier" framing obsolete; resizability now
  platform-mandated.
- [ ] `code/platform-services/runtime-permissions` — new `ACCESS_LOCAL_NETWORK`
  runtime permission (NEARBY_DEVICES group) at target 37.
- [ ] `code/platform-services/security-crypto` — Certificate Transparency enforced by
  default at target 37; ECH default + `<domainEncryption>` NSC element.
- [ ] `lang-tooling/ship/performance-profiling` — per-app RAM-based memory limits,
  `TRIGGER_TYPE_ANOMALY` heap dumps, generational CMC GC.
- [ ] `code/media-camera-ml/app-actions-assistant` — Android 17 AppFunctions (MCP-
  orchestrable app capabilities) supersede App-Actions-only guidance.
- [ ] `code/architecture/android-activities` — BAL hardening:
  `MODE_BACKGROUND_ACTIVITY_START_ALLOWED` deprecated → `..._ALLOW_IF_VISIBLE`.
- [ ] `lang-tooling/build-packaging/android-manifest` — orientation/resizeable
  attributes ignored on large screens at 37; `ACCESS_LOCAL_NETWORK` declaration.

Primary sources: [Android 17 behavior changes](https://developer.android.com/about/versions/17/behavior-changes-17),
[Android 17 is here](https://android-developers.googleblog.com/2026/06/Android-17.html),
[Nav3 stable](https://android-developers.googleblog.com/2025/11/jetpack-navigation-3-is-stable.html),
[Room 3.0](https://android-developers.googleblog.com/2026/03/room-30-modernizing-room.html),
[Premium experiences at I/O '26](https://android-developers.googleblog.com/2026/06/building-premium-android-experiences-google-io-26.html),
[Memory efficiency](https://android-developers.googleblog.com/2026/06/prioritizing-memory-efficiency-steps-for-android-17.html).

## Android — SHOULD re-verify (batched by driver)

- [ ] **Compose 1.12 / BOM 2026.08.00 wave** — all `code/compose-ui/*` pinned to BOM
  2026.05.00; notable: `compose-side-effects` (SideEffect key args),
  `compose-text-fields`/`compose-text` (rich-text BasicTextField, SelectionState,
  Credential Manager), `compose-graphics` (mesh gradients, P3/HDR),
  `compose-animation` (DeferredTargetAnimation stable), `compose-performance`,
  `compose-layout`/`compose-custom-layouts` (Grid 2D), `lang-tooling/testing/compose-ui-testing`
  (new test APIs). Breaking floor: compileSdk 37 + AGP 9.1.1.
- [ ] **material3 1.4.0 stable** — remove "experimental" caveats:
  `overviews/adopting-m3-expressive`, `design/technologies/m3-expressive`,
  `design/components/m3-{app-bars,buttons,button-groups,loading-indicator,progress-indicators,search,menus-pickers}`.
- [ ] **Compose-first / Material Views maintenance** — `overviews/choosing-compose-or-views`,
  `overviews/adopting-compose`, `code/compose-ui/{android-views-interop,compose-view-interop}`.
- [ ] **Behavior-changes ripple** — `lang-tooling/architecture/networking-data-layer`,
  `code/platform-services/{retrofit-okhttp,ktor-client,bluetooth-ble,broadcasts,autofill,credential-manager,notifications,foreground-services,alarms-scheduling}`,
  `code/data/content-providers`, `lang-tooling/testing/{unit-testing,robolectric}`,
  `overviews/choosing-concurrency-pattern`, `code/form-factors/keyboard-mouse-stylus`,
  `code/media-camera-ml/media3-session`.
- [ ] **Adaptive-mandate ripple** — `design/foundations/{m3-adaptive-layout,m3-canonical-layouts}`,
  `overviews/choosing-form-factors`.
- [ ] **Memory/perf ripple** — `lang-tooling/ship/crash-anr-vitals`,
  `lang-tooling/testing/macrobenchmark-baseline-profiles`.
- [ ] **WorkManager 2.12 (at stable)** — `code/platform-services/workmanager`,
  `overviews/choosing-background-work`.
- [ ] **XR DP4 wave** — `code/form-factors/xr-{scenecore,arcore,compose-spatial,glimmer-glasses}`,
  `design/platforms/m3-ai-glasses`.
- [ ] **ML/agents** — `code/media-camera-ml/{gemini-nano-aicore,ml-kit}`,
  `overviews/choosing-ml`, `lang-tooling/ship/ci-cd`,
  `lang-tooling/build-packaging/gradle-kotlin-dsl` (Android CLI 1.0, AGP floor).

## Android — NEW skills (7)

- [ ] `navigation3` → `code/architecture/` (NavDisplay/NavEntry, back stack as state,
  scene strategies; pairs_with navigation-compose, choosing-navigation)
- [ ] `app-functions` → `code/platform-services/` (Android 17 AppFunctions / MCP tools)
- [ ] `media3-ai-effects` → `code/media-camera-ml/`
- [ ] `media3-transformer` → `code/media-camera-ml/` (multi-asset editing + CodecDB)
- [ ] `android-cli` → `lang-tooling/build-packaging/` (agent-facing toolchain)
- [ ] `compose-grids` → `code/compose-ui/` (or fold into compose-layout — decide at
  authoring; still experimental)
- [ ] `local-network-access` → `code/platform-services/` (or fold into
  runtime-permissions — decide at authoring)

---

## Apple — MUST update (31)

All paths relative to `skills/apple/`. Sources: the
[WWDC26 guides](https://developer.apple.com/wwdc26/guides/) per-topic pages plus the
write-ups cited in each line of the research (kept in the PR descriptions).

SwiftUI surface:
- [ ] `code/app-frameworks/swiftui-lists-tables` — `.reorderable()`,
  `.reorderContainer(for:isEnabled:move:)`, `ReorderDifference`; swipe actions beyond
  List.
- [ ] `code/app-frameworks/swiftui-sheets` — `alert(error:actions:message:)` binding,
  `.alert(_:item:)` / `.confirmationDialog(_:item:)`.
- [ ] `code/app-frameworks/swiftui-navigation` — `navigationTransition(.crossFade)`,
  `toolbarMinimizeBehavior(_:for:)`.
- [ ] `code/app-frameworks/swiftui-images-symbols` — AsyncImage default HTTP caching,
  `AsyncImage(request:)`, `.asyncImageURLSession(_:)`; SF Symbols 8.
- [ ] `code/app-frameworks/swiftui-state-data-flow` — `@State` as macro, lazy
  `@Observable` defaults.
- [ ] `code/app-frameworks/swiftui-tab-views` — `Tab(role: .prominent)`, iPhone
  sidebar tab bars.
- [ ] `code/app-frameworks/swiftui-scrollview` — `.swipeActionsContainer()`, subview
  prefetch.
- [ ] `code/app-frameworks/swiftui-scenes-windows` — resizable iPhone apps,
  `UIHostingSceneDelegate`, `appearsActive`, `DocumentGroupLaunchScene`.

UIKit / lifecycle:
- [ ] `code/app-frameworks/uikit-core` — UIScene lifecycle **required**; `UIScreen.main`
  off-limits; scene-scoped display link; TextKit 2 additions fold in here.
- [ ] `lang-tooling/architecture/app-lifecycle` — UIScene mandatory;
  orientation-delegate deprecation.

Data / intents:
- [ ] `code/app-frameworks/swiftdata-modeling` — `@Attribute(.codable)`, enum
  predicates.
- [ ] `code/app-frameworks/swiftdata-queries-migration` — `@Query(sectionBy:)`,
  `ResultsObserver`, `HistoryObserver`.
- [ ] `code/app-frameworks/app-intents` — App Schemas, View Annotations,
  `SyncableEntity`, AppIntentsTesting.
- [ ] `overviews/overviews/adopting-app-intents` — schema-era adoption path.
- [ ] `code/app-services/core-spotlight` — entity schemas feed semantic index.
- [ ] `code/app-frameworks/widgetkit` — App Intents-driven customization,
  `systemExtraLargePortrait`.

Language / tooling:
- [ ] `lang-tooling/language/swift-concurrency` — Swift 6.4 async `defer`; Concurrency
  instrument.
- [ ] `lang-tooling/language/swift-language-core` — `anyAppleOS`, `@diagnose`,
  noncopyable iteration.
- [ ] `lang-tooling/testing/swift-testing` — XCTest interop migration path.
- [ ] `lang-tooling/ship/instruments-profiling` — Concurrency instrument, run
  comparisons, Device Hub.

Design system:
- [ ] `design/components/hig-toolbars` — overflow model (`ToolbarOverflowMenu`,
  `.visibilityPriority`, auto-minimize).
- [ ] `design/components/hig-tab-bars` — prominent tab, iPhone sidebars.
- [ ] `design/components/hig-navigation-bars` — bar minimization APIs.
- [ ] `design/foundations/hig-app-icons` — Icon Composer layered format.
- [ ] `design/foundations/hig-typography-sf-symbols` — SF Symbols 8.
- [ ] `design/foundations/hig-materials-liquid-glass` +
  `overviews/overviews/adopting-liquid-glass` — year-2 automatic adoption.

Frameworks:
- [ ] `code/graphics-games/realitykit` — projective textures, cloth sim, Gaussian
  splats.
- [ ] `code/graphics-games/arkit` — enhanced object tracking, 90 Hz spatial
  accessories.
- [ ] `code/app-services/healthkit` — workout zones, menopause APIs.
- [ ] `code/app-services/storekit` — commitment subscriptions, volume subscriptions,
  Background Assets tie-in.
- [ ] `overviews/overviews/choosing-ml-approach` — Core AI framework + Foundation
  Models expansion reshape the tree.
- [ ] `design/technologies/hig-carplay-design` — video browsing, MiniPlayer template.

## Apple — SHOULD re-verify (batched by driver)

- [ ] **SwiftUI ripple** — `swiftui-core` (ContentBuilder), `swiftui-grids`,
  `swiftui-custom-layout` (reordering reach), `swiftui-animations-transitions`,
  `swiftui-drawing-canvas` (.crossFade, graphics composition), `swiftui-gestures`
  (GestureInputKinds, lazy drag), `swiftui-environment-preferences` (appearsActive),
  `swiftui-app-architecture`, `observation` (lazy @State), `swiftui-concurrency`
  (AsyncImage), `property-wrappers`, `result-builders`, `error-handling`
  (alert(error:)), `uikit-swiftui-interop` (UIHostingSceneDelegate).
- [ ] **UIKit/AppKit ripple** — `uikit-collection-views`, `uikit-auto-layout`,
  `appkit-core`, `choosing-ui-toolkit`.
- [ ] **Swift 6.4 ripple** — `swift-6-migration`, `adopting-swift-6-concurrency`,
  `swift-performance-memory`.
- [ ] **Testing ripple** — `choosing-testing-strategy`, `unit-testing-strategy`,
  `xctest-ui-automation`.
- [ ] **Xcode 27 ripple** — `localization` (agent-driven), `xcode-project-conventions`.
- [ ] **Widgets/activities** — `controls-widgets`, `hig-widgets-design`,
  `choosing-widget-tech`, `activitykit`, `hig-live-activities-design`.
- [ ] **HIG ripple** — `hig-sidebars`, `hig-lists-tables`, `hig-menus`,
  `hig-searching`, `hig-search-fields`, `hig-designing-for-{ios,ipados,macos,tvos,visionos}`,
  `hig-multitasking`, `hig-accessibility`, `swiftui-accessibility`.
- [ ] **Services/media** — `passkit-apple-pay`, `hig-apple-pay-design`,
  `testflight-appstore-connect`, `app-store-connect-api`, `avfoundation-playback`,
  `avfoundation-capture`, `core-image`, `musickit`, `metal`, `gamekit`, `vision`,
  `core-ml`, `natural-language`, `background-tasks`, `choosing-persistence`.

## Apple — NEW skills (10 + 2 optional)

- [ ] `swiftui-documents` → `code/app-frameworks` (WritableDocument/DocumentWriter,
  ReadableDocument/DocumentReader, DocumentCreationSource, DocumentGroupLaunchScene)
- [ ] `swiftui-toolbars` → `code/app-frameworks` (ToolbarOverflowMenu,
  visibilityPriority, minimize behavior)
- [ ] `foundation-models` → `code/app-services` (shipping since iOS 26; multimodal,
  Dynamic Profiles, PCC, third-party providers)
- [ ] `core-ai` → `code/app-services` (on-device model loading/specialization, AOT)
- [ ] `background-assets` → `code/system` (200GB hosted packs, StoreKit unlock)
- [ ] `music-understanding` → `code/media`
- [ ] `now-playing` → `code/media`
- [ ] `hig-siri-design` → `design/technologies` (new HIG section)
- [ ] `hig-snippets` → `design/components` (new HIG section)
- [ ] `xcode-coding-agents` → `lang-tooling/build-packaging`
- [ ] Optional: `spatial-preview`, `foveated-streaming` → `code/graphics-games`

---

## Batch plan (each batch = one stacked-PR chain)

1. **A1** Android behavior-changes-17 cluster (7 MUST skills, one source page)
2. **A2** Android Nav3 + Room 3 (5 MUST + `navigation3` NEW — the coverage bugs)
3. **A3** Android media/agents (camerax, media3-exoplayer, app-actions + NEW
   app-functions, media3-ai-effects, media3-transformer)
4. **A4** Android SHOULD waves (Compose 1.12, material3 1.4, ripples)
5. **P1** Apple SwiftUI MUST cluster (8 skills)
6. **P2** Apple UIKit/lifecycle + data/intents MUST (8 skills)
7. **P3** Apple language/tooling + design MUST (10 skills)
8. **P4** Apple frameworks MUST (6 skills) + NEW skills in category batches
9. **P5** Apple SHOULD waves
10. Remaining NEW-skill batches (Phase 5/6 of PLAN.md)
