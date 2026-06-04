# Apple skill taxonomy & coverage

Target catalog for the `apple` domain, tracked across authoring waves. `[x]` = authored, `[ ]` = planned. Run `pnpm exec tsx scripts/crawl/bin.ts` for live per-class counts. Platform support is per-skill frontmatter, not folders.

## code/app-frameworks

- [x] observation · swiftdata-modeling · swiftdata-queries-migration
- [x] swiftui-core · swiftui-navigation · swiftui-sheets · swiftui-state-data-flow
- [ ] swiftui-lists-tables · swiftui-grids · swiftui-animations-transitions · swiftui-gestures · swiftui-charts · swiftui-forms-controls · swiftui-text-input · swiftui-scenes-windows · swiftui-scrollview · swiftui-custom-layout · swiftui-drawing-canvas · swiftui-images-symbols · swiftui-accessibility · swiftui-concurrency · swiftui-focus · swiftui-environment-preferences · swiftui-tab-views
- [ ] uikit-core · uikit-auto-layout · uikit-collection-views · uikit-swiftui-interop
- [ ] appkit-core · appkit-swiftui-interop
- [ ] widgetkit · app-intents · activitykit · controls-widgets

## code/app-services

- [ ] cloudkit · core-data · storekit · healthkit · core-ml · vision · natural-language · speech · mapkit · core-location · weatherkit · user-notifications · tipkit · core-spotlight · passkit-apple-pay · eventkit

## code/graphics-games

- [ ] realitykit · arkit · metal · core-image · spritekit · scenekit · pencilkit · gamekit

## code/media

- [ ] avfoundation-playback · avfoundation-capture · photokit · musickit · screencapturekit

## code/system

- [ ] cryptokit · keychain-security · network-framework · core-bluetooth · os-logging · background-tasks

## code/web

- [ ] app-store-connect-api · sign-in-with-apple

## design/foundations

- [x] hig-accessibility · hig-layout · hig-materials-liquid-glass · hig-typography-sf-symbols
- [ ] hig-color · hig-dark-mode · hig-app-icons · hig-motion · hig-images · hig-writing · hig-right-to-left · hig-privacy

## design/patterns

- [ ] hig-onboarding · hig-searching · hig-settings · hig-feedback · hig-loading · hig-modality · hig-drag-and-drop · hig-undo-redo · hig-entering-data · hig-notifications · hig-ratings-reviews · hig-multitasking

## design/components

- [x] hig-sheets
- [ ] hig-buttons · hig-menus · hig-toolbars · hig-tab-bars · hig-sidebars · hig-navigation-bars · hig-lists-tables · hig-text-fields · hig-pickers · hig-sliders-steppers · hig-toggles · hig-alerts · hig-action-sheets · hig-popovers · hig-context-menus · hig-progress-indicators · hig-search-fields · hig-segmented-controls · hig-charts

## design/inputs

- [ ] hig-gestures-design · hig-apple-pencil · hig-digital-crown · hig-keyboards-design · hig-pointing-devices · hig-action-button

## design/platforms

- [ ] hig-designing-for-ios · hig-designing-for-ipados · hig-designing-for-macos · hig-designing-for-watchos · hig-designing-for-tvos · hig-designing-for-visionos

## design/technologies

- [ ] hig-widgets-design · hig-live-activities-design · hig-app-clips-design · hig-apple-pay-design · hig-carplay-design · hig-sign-in-with-apple-design

## lang-tooling/language

- [x] swift-concurrency
- [ ] swift-language-core · swift-generics-protocols · swift-macros · result-builders · property-wrappers · error-handling · swift-performance-memory · codable-serialization · regex-strings · swift-6-migration

## lang-tooling/architecture

- [ ] swiftui-app-architecture · dependency-injection · app-lifecycle · modularization-local-spm · networking-layer · navigation-architecture

## lang-tooling/testing

- [x] swift-testing
- [ ] xctest-ui-automation · unit-testing-strategy · testing-async-code · snapshot-testing

## lang-tooling/build-packaging

- [x] spm · xcode-project-conventions
- [ ] asset-catalogs · info-plist-entitlements · swift-package-plugins

## lang-tooling/ship

- [x] build-sign-distribute
- [ ] entitlements-capabilities · provisioning-code-signing · testflight-appstore-connect · app-review-guidelines · privacy-manifests · localization · instruments-profiling · crash-symbolication · ci-cd-signing

## overviews

- [x] adopting-liquid-glass · choosing-ml-approach · choosing-persistence · choosing-ui-toolkit
- [ ] choosing-async-pattern · choosing-graphics-tech · choosing-widget-tech · choosing-distribution · choosing-testing-strategy · choosing-networking · adopting-app-intents · adopting-swift-6-concurrency · choosing-navigation-pattern

## Code↔design pairs (bidirectional `pairs_with`)

hig-sheets↔swiftui-sheets · hig-lists-tables↔swiftui-lists-tables · hig-tab-bars↔swiftui-tab-views · hig-text-fields↔swiftui-text-input · hig-gestures-design↔swiftui-gestures · hig-charts↔swiftui-charts · hig-widgets-design↔widgetkit · hig-live-activities-design↔activitykit · hig-apple-pay-design↔passkit-apple-pay · hig-sign-in-with-apple-design↔sign-in-with-apple · hig-apple-pencil↔pencilkit
