---
name: m3-adaptive-layout
description: Design-critique guidance for Material 3 adaptive and responsive layout, covering window size classes and breakpoints, scaling margins and spacing, reflow vs reposition vs reveal strategies, multi-pane layout, and designing one UI that flexes across phones, foldables, tablets, and desktop. Use when critiquing or specifying a screen layout for Android, evaluating whether a design adapts gracefully across compact, medium, and expanded window sizes, deciding between a single-pane and list-detail arrangement, or reviewing how margins and spacing scale with available width.
---

## When to use

- Critiquing a mockup for how it behaves outside its original design size.
- Specifying breakpoints and pane strategy for a screen before engineers build it.
- Reviewing whether margins and spacing feel calibrated at compact, medium, and expanded widths.
- Deciding whether to reflow, reposition, or reveal content as width grows.
- Evaluating a foldable or tablet design for appropriate multi-pane use.

## Core guidance

### Window size classes and breakpoints

- **Treat compact, medium, and expanded as distinct layout intents, not just stretched versions of one design.** Compact (below 600 dp wide) is a single-column, thumb-friendly phone layout. Medium (600–840 dp) is an in-between state — a large phone in landscape, a small tablet, or a foldable half-open — where a second column or a persistent navigation rail starts to earn its place. Expanded (840 dp and above) is a two-pane or multi-column environment where a persistent drawer or a side-by-side list-detail becomes the expected pattern.
- **Never hardcode device names or screen inches as breakpoints.** The dp breakpoints are the contract. A foldable can be compact when folded and expanded when open; design both states explicitly.
- **Design for height, not just width.** Compact height (below 480 dp) — common when a phone rotates to landscape — collapses vertical breathing room. Keep primary actions reachable and avoid layouts that push the main content off screen.

### Scaling margins and spacing

- **Use the M3 canonical margin scale: 16 dp at compact, 24 dp at medium, 24 dp at expanded.** These figures are starting points, not caps; body content inside a wide expanded window should constrain to a max-width rather than stretching infinitely.
- **Let content columns breathe at wider sizes.** A single-column text article should cap at a comfortable reading width (roughly 600–700 dp) and center in the expanded canvas; do not force it to fill 1200 dp.
- **Spacing between components should increase modestly as width grows.** A list row's internal padding can stay stable, but section spacing and the gap between a sidebar and main pane may grow by 4–8 dp per breakpoint step to reflect the larger visual field.

### Reflow, reposition, and reveal

- **Reflow** — wrapping or stacking content — is appropriate when the same information belongs in the same relative position but the container shrinks. Use reflow to keep a card's title and metadata stacked vertically at compact rather than side-by-side, and to wrap a chip group instead of clipping it.
- **Reposition** — moving elements to a different location in the hierarchy — is appropriate when the larger canvas affords a fundamentally better home. Navigation that lives in a bottom bar at compact (BottomNavigationBar / NavigationBar composable) should move to a navigation rail at medium and a permanent NavigationDrawer at expanded. This is not merely cosmetic; it changes reach and discoverability.
- **Reveal** — making content visible that was hidden — is the most powerful adaptive technique. A detail pane that required a full-screen push in compact appears alongside the list at expanded; a filter sidebar that lived behind a modal sheet at compact is always visible at expanded. Reveal eliminates round trips and gives power users faster access to depth.
- **Do not mix strategies arbitrarily.** Decide per screen which strategy is primary. Mixing reflow and reveal on the same pane can produce layouts that feel unpredictable as the window resizes.

### Multi-pane strategy

- **Adopt a list-detail pattern when content is hierarchical and the expanded canvas allows it.** The Material 3 canonical two-pane layout (ListDetailPaneScaffold composable) shows the list and the detail side by side at medium and expanded widths; at compact it behaves as a normal push-based navigation. Design both the side-by-side state and the stacked state; do not ship a tablet layout that leaves the detail pane empty on load.
- **Give each pane a clear primary role.** The leading pane (list, index, or filters) drives selection; the trailing pane (detail, preview, or editor) responds. Avoid bidirectional coupling where both panes initiate navigation — it confuses the spatial model.
- **Size panes intentionally.** A 1:2 split (roughly 33/67 percent) works well when the trailing pane contains rich content. A 1:1 split suits forms or settings flows. Avoid panes below 240 dp wide — they become cramped even with well-scaled content.
- **Use supporting panes sparingly.** A three-pane layout (index, list, detail) is justified in complex productivity apps, but on most screens a two-pane layout is the right ceiling. More panes increase cognitive load and break down badly at medium widths.

### Navigation adaptation

- **Bottom navigation bar at compact, navigation rail at medium, navigation drawer at expanded.** This three-step pattern is a direct M3 recommendation and matches user expectations on each form factor. A bottom bar at tablet scale wastes vertical space and is harder to reach on landscape tablets.
- **Persistent navigation reduces the number of taps.** At expanded widths, the navigation drawer can remain always-visible rather than toggling, keeping the destination list in the user's peripheral vision.

### Touch targets and density

- **Maintain a minimum 48 dp touch target at all widths.** Larger canvases do not mean smaller targets; they mean more whitespace between targets. Avoid resizing tap surfaces smaller just because the layout has room to breathe.
- **Do not over-pad at expanded widths.** Adding large amounts of empty space between elements to "fill the screen" results in a layout that feels airy rather than purposeful. Use that space to reveal content or to improve readability through better column widths.

## Platform notes

- **Phones (compact):** Optimize for one-handed thumb reach — place primary actions and navigation in the bottom half of the screen. Validate both portrait and landscape, and account for gesture navigation insets consuming the bottom edge.
- **Foldables (compact folded, medium or expanded unfolded):** Design the fold state explicitly. The hinge area is off-limits for interactive controls and primary content. When the device is in tabletop posture (partially folded), consider placing controls in the lower half and content in the upper half.
- **Tablets (medium and expanded):** Use the additional canvas for reveal and multi-pane, not for scaled-up phone layouts. A phone layout blown up to fill a 12-inch tablet screen is the most common and most criticized adaptive failure.
- **Chromebook and desktop (expanded, resizable windows):** Designs must hold up as the window is freely resized from compact to very wide. Test at non-canonical widths — 720 dp, 900 dp, 1200 dp — not just at the class boundaries.
- **Wear and TV:** Adaptive layout breakpoints do not apply to Wear OS (always compact, circular canvas) or Android TV (always expanded, non-touch, 10-foot experience). These platforms require separate design treatment.

## Pitfalls

- **Designing at one size only, then stretching.** A phone layout stretched to a tablet is immediately recognizable and consistently disappoints users. The adaptive spec must be authored alongside the compact design, not after.
- **Using reveal at medium width prematurely.** Medium is a transitional size; a detail pane that opens alongside a list at 600 dp leaves both panes too narrow to be comfortable. Reveal typically becomes appropriate at 840 dp and above, though some content types can go lower.
- **Leaving the trailing detail pane empty at launch.** In a list-detail layout, the expanded canvas should display a placeholder, a default selection, or the first item — never a blank white pane.
- **Treating bottom navigation as a universal pattern.** A bottom navigation bar on a landscape tablet in a resizable window is displaced from content, thumb-unreachable, and wastes screen height. Use the navigation rail at medium and the drawer at expanded.
- **Ignoring the hinge on foldables.** Placing the focal content or a form input directly over the hinge makes it inaccessible when the device is partially folded and may cause content to be obscured by the device crease.
- **Max-width neglect.** At very wide expanded windows, content that fills the full width — especially text, form fields, and media — becomes uncomfortable to scan. Apply a max-width constraint and center the content column.
- **Inconsistent spacing jumps.** Large sudden changes in margin at a breakpoint feel jarring if animated and broken if not. Prefer gradual scaling where possible; reserve sharp jumps for structural changes like revealing a pane.

## References

- **Material 3 Guidelines:** [Understanding layout](https://developer.android.com/guide/topics/large-screens/support-different-screen-sizes)
- **Documentation:** [Build adaptive layouts in Compose](https://developer.android.com/develop/ui/compose/layouts/adaptive)

## See also

For navigation component decisions that accompany layout changes — bottom bar vs rail vs drawer — see the m3-navigation-design skill when available. For token-level spacing and the M3 type scale that rides on this grid, see the m3-typography skill when available. The adaptive-window-size-classes code skill implements the breakpoint detection, WindowSizeClass API, and ListDetailPaneScaffold wiring described here; hand all implementation work there.
