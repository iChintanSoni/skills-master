## Scenario 1: Fitness tracker — mapping brand green to M3 roles

A fitness app uses a vivid green as its core brand color. The designer seeds the M3 palette with that green, producing a primary that maps to the active-ring indicator and the filled CTA button. Secondary is seeded from a muted teal, used for chip-based workout filters. Tertiary is seeded from a warm amber — it appears only on the streak badge and the PR callout card, which need to stand apart from the green-dominant UI.

Every interactive control (buttons, FAB, toggles) uses primary or its container. Progress rings use primaryContainer as the unfilled track and primary as the filled arc, with onPrimary as the label inside the arc. Navigation bar selected indicators pull from secondaryContainer so the active tab does not visually compete with the in-content primary ring.

Error (red) appears only on overdue rest days and invalid form entries — never on pace zones or performance tiers, which use a custom extension color.

**Anti-pattern:** The designer assigns the green to both the primary role and a custom overlay on all card backgrounds, flooding the screen with the same hue. The FAB, which also uses primary, now disappears into a sea of green; users cannot locate the primary action at a glance. Hierarchy collapses because every element signals equal importance.

---

## Scenario 2: Finance app — dark scheme verification after dynamic color adoption

A banking app supports dynamic color on Android 12+. During QA, the team tests the UI against a bright purple wallpaper. The dynamic primary becomes a deep violet, which harmonizes well with the light scheme. In the dark scheme, however, the generated primaryContainer becomes an extremely dark purple indistinguishable from the surface background (tone 6), effectively hiding filled-container chip labels.

The fix is not to disable dynamic color but to verify the dark-scheme tonal pairs explicitly: onPrimaryContainer against primaryContainer must always meet 4.5:1. If the generated scheme produces a failing pair in specific hue ranges, the team adjusts the seed tone (shifting from tone 40 to tone 45 for the primary seed) to lift the container above the background in dark mode, then re-exports and re-tests.

The fixed fallback palette for Android 11 and below is also verified separately — it is not assumed to be safe simply because the brand color looked fine in Figma.

**Anti-pattern:** The team sees the QA failure and disables dynamic color entirely across all Android versions to restore predictability. Users on Android 12+ lose the personalized Material You experience, the app feels visually disconnected from the system, and the root cause (unverified dark-scheme pairings) remains unfixed and will recur if dynamic color is ever re-enabled.

---

## Scenario 3: E-commerce app — surface container hierarchy on large screen

A product-browsing app runs on a foldable in unfolded (expanded) mode with a two-pane layout: a category list pane on the left and a product grid on the right. The background uses Surface (tone 98 in light). The list pane card uses SurfaceContainerLow and the detail pane uses SurfaceContainerHigh, creating a tonal step that signals the pane boundary without a hard divider line or drop shadow.

Selected list items use secondaryContainer so they are clearly active without pulling primary — which is reserved for the Add to Cart button in the detail pane. The cart badge uses a tertiary chip, visually distinct from the navigation and content but not screaming "error."

When the device is folded back to compact mode, the same roles still work: Surface is the page background, cards are SurfaceContainerLow, and the single CTA remains primary. No role re-mapping is needed across breakpoints because the semantic choices were correct from the start.

**Anti-pattern:** The designer uses hard-coded grays (#F5F5F5 and #EEEEEE) for the two panes instead of M3 surface container tokens. The panes look fine in light mode with the initial brand palette but fail in dark mode (both grays become nearly identical against the dark surface) and completely break under dynamic color because the grays do not participate in the tonal palette and can clash with any generated hue.
