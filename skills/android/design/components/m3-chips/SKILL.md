---
name: m3-chips
description: "Design judgment and critique for Material 3 chips on Android — covering the four chip types (assist, filter, input, suggestion), chip group layout, selection state, and when chips outperform buttons, menus, or segmented buttons. Use when choosing the right chip type for a context, reviewing filter or tag patterns, evaluating chip group density and wrapping behavior, or deciding whether chips are the appropriate control at all."
tags: [m3, design, chips, selection, components, android]
x-skills-master:
  domain: android
  class: design
  category: components
  platforms: ["android", "large-screen"]
  pairs_with: []
  sources:
    - https://m3.material.io/components/chips/overview
    - https://developer.android.com/develop/ui/compose/components
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Use this skill when:

- Selecting among the four M3 chip types — assist, filter, input, and suggestion — and verifying each is used for its intended purpose.
- Reviewing a filter bar, tag list, or autocomplete suggestion row and judging whether the chip type, grouping, selection model, and truncation behavior are sound M3 choices.
- Deciding whether chips are the right control over buttons, a menu, segmented buttons, or radio buttons for a given interaction.
- Evaluating chip group layout, scrollability, and wrapping behavior on compact and large-screen breakpoints.
- Critiquing selection state clarity, dismissibility, and leading/trailing icon usage in any chip variant.

## Core guidance

### Choosing the right chip type

- **Use assist chips for contextual smart actions tied to the current content.** Assist chips (rendered in Compose Material 3 as `AssistChip`) surface shortcuts the system infers from context — for example, "Add to calendar" extracted from a message thread or "Set reminder" suggested from a task. They are never persistent toggles; each tap triggers a one-time action. Do not use assist chips as a substitute for a button group when the actions are not contextually derived.

- **Use filter chips for persistent, multi-select filtering of content on the same screen.** Filter chips (`FilterChip` in Compose) represent on/off states within a category — genre, status, price range — and multiple can be active simultaneously. Their selected state must be visually unambiguous via the M3 checkmark icon and the SecondaryContainer token; never suppress the checkmark as a style choice. Filter chip groups should sit directly above or adjacent to the content they affect — distant placement severs the cause-and-effect relationship for users.

- **Use input chips to represent user-entered values in a composed field.** Input chips (`InputChip` in Compose) appear inside an input area — an email recipient field, a multi-value tag editor — as compact representations of items the user has explicitly added. They are dismissible by design; every input chip must carry a trailing close icon so users can remove the value without navigating away. Do not use input chips as read-only tags; if values cannot be removed, represent them as static text or a different component.

- **Use suggestion chips for single-tap completions surfaced beneath a text input.** Suggestion chips (`SuggestionChip` in Compose) offer predicted values — recent searches, spelling completions, quick replies — that populate a field or send a response in one gesture. They are ephemeral: once an option is tapped or the session changes, the set refreshes. Never mix suggestion chips with filter chips in the same row, as their interaction models (one-time completion vs. persistent toggle) conflict semantically.

- **Do not use multiple chip types in the same visual group.** Mixing assist and filter chips in a single horizontal row — even if they are styled identically — creates ambiguous affordances. Users cannot reliably distinguish which chips toggle state and which trigger actions. Keep each chip group homogeneous in type.

### Chip groups and layout

- **Prefer a scrollable horizontal row when the chip set is fixed and short (up to approximately eight items).** A single non-wrapping row keeps the layout stable and avoids reflow as chips are selected. Use a `LazyRow` or a horizontally scrolling `Row` in Compose; never truncate chip labels to force chips into a fixed-width container.

- **Allow wrapping to multiple rows only when the full set must be visible at a glance.** A wrapping chip group (a `FlowRow` or similar in Compose) is appropriate for an expanded filter panel where scanning the entire set is the goal — for example, a search filter sheet. In a surface's main content area, a wrapping group that grows unpredictably shifts content below it, which is disruptive. In that case, prefer a scrollable row with a "See all" control.

- **Maintain 8 dp horizontal spacing between chips and at least 4 dp vertical spacing when chips wrap.** Chips set too close together on touch screens produce accidental taps on adjacent items; chips set too far apart look disconnected and waste horizontal space.

- **Provide a clear visual affordance for horizontal scrollability when chips overflow.** A fade or clipping gradient at the trailing edge signals that the row continues. A chip row that simply ends at the screen edge without visual indication causes users to miss available options.

- **Never stack chips vertically as the primary layout in the main content flow.** A vertical list of toggleable chips is visually indistinguishable from a checkbox list. Use checkboxes with labels in that case; they are semantically and visually clearer.

### Selection state and dismissibility

- **Selected filter chips must show the M3 checkmark.** The checkmark is the primary state indicator and must not be removed to save horizontal space. If chip labels are so long that the checkmark plus label exceeds the available width, shorten the labels — do not drop the checkmark.

- **Group filter chips by category when the full set covers multiple dimensions.** A single flat row of filter chips combining "Category," "Price," and "Rating" filters forces users to parse all three dimensions at once. Grouping chips by dimension — either with section labels or in separate rows — reduces cognitive load and makes it clear which selections are independent of one another.

- **Input chips must always be dismissible.** A trailing close icon (`Icons.Default.Close` or the M3 close symbol) is non-negotiable for input chips. Keyboard users must also be able to select and delete them. Do not style input chips to look undismissible (e.g., by hiding the trailing icon on focus).

- **Assist and suggestion chips must not express a selected or toggled state.** They represent transient actions, not toggleable modes. Applying a filled or checked visual to an assist chip after it is tapped misleads users into thinking a state is now active that can be reversed. If a stateful toggle is the intent, use a filter chip instead.

### Chips vs. alternative controls

- **Prefer chips over a dropdown menu when visibility of all options simultaneously is valuable.** A menu hides its options until opened and suits long, categorical lists. Chips keep all options visible at once and suit short, frequently-changed filter sets where scanning is the workflow. If the option count exceeds approximately eight to ten, a menu or bottom sheet becomes more practical.

- **Prefer chips over segmented buttons when the set can grow, wrap, or vary by context.** Segmented buttons are a fixed-width, fixed-count connected control for two to five items. Chips are individually sized, can be added or removed dynamically, and scroll or wrap gracefully. Choose chips any time the item count is not firmly bounded or items could be user-generated.

- **Prefer chips over standalone buttons when multiple simultaneous selections from a category are the core interaction.** A row of action buttons implies independent commands. A row of filter chips implies a multi-select state model. Using buttons where chips are semantically correct misrepresents the interaction model and drops the built-in selected-state communication.

- **Prefer radio buttons or a single-select segmented button when exactly one option must always be active.** Filter chips can technically implement single-select behavior, but they allow a zero-selected state by default. If the design requirement is that at least one option is always selected (a required filter dimension, a sort order), a segmented button or radio group communicates this constraint more clearly and enforces it in the control's visual model.

### Icons in chips

- **Use a leading icon in assist or suggestion chips only when it meaningfully disambiguates the action.** A calendar icon on "Add to calendar" adds recognition; a generic star on "Bookmark" adds little over the label alone in a chip context. Apply the same test as for button icons — does the icon reduce ambiguity or merely decorate?

- **Leading icons must be 18 dp in chips, not 24 dp.** Chips are compact components; standard 24 dp icons crowd the label and push the chip height beyond the M3 specification. Using the correct icon size ensures the chip height remains within the 32 dp default (compact) or 40 dp (comfortable) M3 token range.

- **Avatar images in input chips must be circular and clipped, not raw rectangles.** When an input chip represents a person (an email recipient, a tagged contact), the leading avatar must follow the M3 circular avatar treatment. A square or rounded-rectangle image in a chip slot is a specification error.

- **Do not add both a leading icon and a trailing close icon to filter chips.** Filter chips in M3 use the leading slot for an optional icon and the trailing slot for the checkmark when selected. Adding a separate trailing close icon to a filter chip conflates filter and input chip semantics; use an input chip variant if dismissibility is the requirement.

## Platform notes

**Compact phones (320–599 dp):** Horizontal chip rows are the default layout. Test all chip labels at their translated lengths and at large dynamic type sizes. A chip label that truncates with an ellipsis loses its meaning; if truncation is unavoidable, shorten the source copy. Wrapping chip groups used in filter sheets should be contained in a bottom sheet or dialog, not embedded in the main scroll view, to avoid unpredictable content shifting.

**Large screens and foldables (600 dp and up):** Filter chip groups in a side panel or expanded two-pane layout can afford wrapping behavior that would be disruptive on compact screens. Constrain chip group width to the panel width, not the full window width, so chips remain spatially associated with the content they filter. On foldable devices in book posture, chip groups should remain entirely within one pane — do not allow a chip group to span the hinge.

**Landscape on phones:** The reduced vertical space in landscape makes wrapping chip groups especially problematic. Prefer a horizontally scrollable single row for filter chips in landscape, and move complex filter interactions into a modal sheet.

**Wear OS and TV:** M3 chip components do not have direct equivalents in the Wear Compose or TV Compose libraries. Do not port phone chip groups to these form factors; use platform-appropriate selection patterns (Wear pickers, TV focus-managed lists).

## Pitfalls

- **Mixing chip types in a single group.** Placing filter chips and assist chips in the same row creates ambiguous affordances — users cannot tell which chips toggle state and which trigger actions.
- **Suppressing the filter chip checkmark.** Removing the M3 checkmark icon from selected filter chips to save space eliminates the primary selected-state signal, leaving users uncertain about what is active.
- **Input chips without a dismiss control.** An input chip the user cannot remove traps a value and breaks the expected mental model of the component.
- **Using filter chips for single-select-always contexts.** Filter chips allow zero selections; they are wrong for situations where at least one option must always be active. Use a segmented button or radio group instead.
- **Chip labels that truncate.** Long labels that end in an ellipsis make the option unreadable. Shorten copy or widen the chip; never rely on truncation as a layout solution.
- **Assist or suggestion chips styled with a selected state.** These types are action triggers, not toggles. A filled or checked style after tap misleads users into thinking a persistent mode is active.
- **Chip group placed far from the content it controls.** Proximity communicates scope; a filter chip group separated from its list by unrelated content severs the relationship and forces users to infer the connection.
- **Too many chips in a non-scrollable wrapping group in the main content flow.** Wrapping chips push down content below them in unpredictable ways as selections change chip widths; this layout instability is disruptive mid-task.
- **Using 24 dp icons instead of the 18 dp chip-scale icon.** Oversized leading icons push chip height out of spec and create visual imbalance with the label.
- **Chips used as navigation.** Tapping a chip should filter, complete, add, or trigger a contextual action — not navigate to a new destination. Navigation belongs to NavigationBar, TabRow, or explicit button controls.

## References

- **Material 3 Guidelines:** [Chips overview](https://m3.material.io/components/chips/overview)
- **Material 3 Guidelines:** [Chips guidelines](https://m3.material.io/components/chips/guidelines)
- **Material 3 Guidelines:** [Chips specs](https://m3.material.io/components/chips/specs)
- **Documentation:** [Compose components](https://developer.android.com/develop/ui/compose/components)

## See also

The Compose M3 code skill for chips implements this guidance using `AssistChip`, `FilterChip`, `InputChip`, and `SuggestionChip` composables from `androidx.compose.material3` — hand implementation there after design review. For compact fixed-count single-select or multi-select controls, the M3 segmented buttons design skill covers `SingleChoiceSegmentedButtonRow` and `MultiChoiceSegmentedButtonRow`. For action controls that trigger commands rather than toggle state, the M3 buttons design skill and the M3 icon buttons design skill apply. For top-level navigation between content regions, the M3 navigation bar and M3 tabs design skills govern the correct patterns.
