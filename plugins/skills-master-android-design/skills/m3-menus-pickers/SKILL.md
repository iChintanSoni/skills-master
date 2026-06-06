---
name: m3-menus-pickers
description: "Design critique and recommendations for Material 3 menus and pickers on Android: dropdown menus, exposed dropdown menus, context menus, date pickers (dialog vs input mode), and time pickers — when each variant fits, how to keep selection efficient, and how to adapt across screen sizes. Use when reviewing or designing any in-context option list or date/time selection flow in a Compose-first Android app and you need M3-grounded design judgment rather than implementation code."
---

## When to use

Reach for this skill when critiquing or designing any surface where the user must choose from a predefined set of values or select a date or time. The relevant Compose M3 composables span two families: menus — DropdownMenu, ExposedDropdownMenuBox with ExposedDropdownMenu, and context-menu patterns — and pickers — DatePicker, DateRangePicker, DatePickerDialog, TimePicker, and TimeInput.

Use this skill to decide which variant serves the user's task, how to structure the option list, when a picker's dialog mode is warranted versus an inline or input mode, and when a simpler control (a set of chips, a text field, radio buttons in a bottom sheet) would reduce friction instead.

This is a design-judgment skill. Implementation details belong to the corresponding code skill.

## Core guidance

### Choosing a menu variant

- **Use a dropdown menu for a compact list of actions tied to a trigger.** A dropdown menu — surfaced via DropdownMenu in Compose — floats over the UI anchored to a button or icon. It is appropriate when the option count is two to roughly eight, the options are actions or mode changes (not data values), and the selected choice does not persist visibly in the trigger itself. Sort options by recency or frequency of use when the list is long enough to warrant it, and place destructive actions (Delete, Remove) last, separated visually from the safe options.

- **Use an exposed dropdown for a persistent, visible selection of a data value.** An exposed dropdown — ExposedDropdownMenuBox wrapping a text field — keeps the currently chosen value in the field at all times. This is the right control when the user's selection matters after they move on: choosing a country, a currency, a priority level, or a category. Because the value is always visible, exposed dropdowns belong inside forms and settings panels. They are not appropriate for transient action menus.

- **Limit option count to what fits comfortably without scrolling.** Beyond about eight to ten items, a scrollable menu becomes difficult to navigate. If options exceed that threshold, consider a full-screen selection screen, a searchable list, or an autocomplete text field. A menu that requires significant scrolling is a sign the design has not organized or filtered the data well enough.

- **Never use a dropdown menu as a navigation mechanism.** Menus open temporarily and dismiss without retaining state in the UI. Navigating to a new screen from a menu item can disorient users who did not expect a destination change from a transient surface. Use navigation drawers, tabs, or bottom navigation for destination-level decisions.

- **Keep option labels concise and parallel.** All items in a menu should be approximately the same grammatical form (all verbs, all nouns, all adjectives). Mixing "Edit", "Sharing settings", and "About the app" in a single list signals a poorly organized information architecture. Refactor before shipping.

- **Use a context menu sparingly and only for actions tied to a specific target.** A context menu — triggered by a long-press on an item — should surface actions that act directly on the thing pressed, not global app actions. Limit it to three to five items; anything broader suggests the item's own detail screen would serve the user better. Always confirm that long-press is discoverable: if the interaction pattern is not hinted at elsewhere in the UI, users will miss it entirely.

- **Provide icons selectively, not universally.** Icons in a menu help recognition when they are distinct and meaningful. When every item has an icon, none stands out. Omit icons when their contribution to recognition is marginal, or use them only for the highest-frequency or highest-risk items (like a destructive action that benefits from a trash icon).

### Choosing between date picker variants

- **Use the calendar dialog for casual, one-off date selection.** The date picker dialog — DatePickerDialog in Compose — presents a full calendar grid in a modal. It is well suited to situations where the user does not know the exact date in advance and benefits from seeing the calendar context (day of week, proximity to today, blocked ranges). Booking UIs, reminders, and event scheduling all fit this pattern.

- **Use date input mode when the user already knows the exact date.** Date input mode (TimeInput / the text-entry surface of DatePicker) lets users type a date directly via the keyboard. It reduces interaction cost for power users or data-entry scenarios where the user is copying a date from another source. Always allow toggling between calendar and input modes within the same dialog; do not lock users into one path.

- **Use a date range picker for selecting an interval, not two separate date pickers.** The DateRangePicker composable surfaces a start and end date on the same calendar, highlighting the selected span. Using two independent single-date pickers for a range creates validation complexity (end must be after start) and makes the visual interval invisible. Prefer the range variant for hotel check-in/check-out, trip planning, or any filter that spans multiple days.

- **Place the date picker inline when the selection is the primary task of the screen.** A full-screen or card-embedded DatePicker without a dialog wrapper suits flows where choosing a date is the only purpose of the screen — a booking step in a wizard, a filter screen. Embedding a picker inline avoids the modal interruption entirely and works well when the selection must be reviewed alongside other contextual information.

- **Set a sensible selectable range to prevent invalid choices.** Showing years decades in the past or future for a "schedule a meeting" scenario is noise. Constrain selectableDates or the year range to the realistic domain; this also reduces scroll fatigue in the year-picker header.

### Choosing between time picker variants

- **Use the dial time picker for discovery; use the time input for precision.** The dial variant (TimePicker with clock face) is visually immediate and familiar for casual time setting — alarms, reminders. It degrades in efficiency when the user needs to enter an exact minute value that is not at a 5-minute increment. The time input mode (TimeInput with hour and minute fields) is faster for keyboard users and for precise times. Follow the same toggle-between-modes principle as the date picker.

- **Default to 12-hour or 24-hour format based on locale, not personal preference.** The picker should derive its hour format from the device locale. Hardcoding 24-hour format for a US audience, or 12-hour for a European one, frustrates users and signals a locale-unaware design. Confirm this is a data-driven decision in design review, not an arbitrary one.

- **Pair a time picker with a date picker in a single confirmation step when both are needed.** Do not require the user to confirm date and time in separate dialogs sequentially. Either present both in-line on the same screen, or collect both in a single dialog with sections for each. Two back-to-back modal dialogs for a single logical task ("schedule at a specific date and time") is excessive friction.

### Structuring selection for efficiency

- **Prefer chips or radio buttons when the option count is three to five and values are always visible.** When a user can see all options simultaneously without opening a menu, selection is faster and the current state is always legible. Hidden menus add the cost of opening, scanning, and closing. Use an exposed dropdown or a menu only when the option count genuinely exceeds what inline controls can display without crowding.

- **Surface the most frequent or default value first.** In dropdowns, list the most common option at the top. In exposed dropdowns, pre-populate the field with the system or user default. A blank or placeholder-only state ("Select one") forces an unnecessary tap even when the default would satisfy most users.

- **Do not use menus to replace toggle switches, sliders, or steppers.** A dropdown with two items — "On" and "Off" — is almost always worse than a Switch. A dropdown with "Small", "Medium", and "Large" may be better replaced by a Slider or a set of Segmented Buttons when the values form a linear spectrum.

## Platform notes

### Compact phones
Dropdown menus appear as floating surfaces anchored to the trigger and must not extend beyond screen edges. M3 handles edge clamping automatically; ensure the trigger element is not positioned so close to a screen edge that the menu clips important items. Date picker dialogs occupy most of the screen width and feel natural in portrait. Time picker dials also work well on compact displays.

### Large screens and foldables
On tablets or foldables in expanded window configurations, avoid full-width menus that stretch edge-to-edge — they should be constrained to a natural content width. Date pickers embedded inline (not in a dialog) are especially well-suited to large screens where the calendar does not feel oversized. For two-pane layouts, consider embedding a date picker in the detail pane rather than overlaying a dialog on the list pane. Context menus on large screens may also appear as right-click popovers when a pointer device is connected.

### Keyboard and pointer
On devices with a hardware keyboard or mouse, exposed dropdowns should support arrow-key navigation within the open menu. Date and time input modes become significantly more efficient and should be the default or promoted toggle option when physical keyboard use is detected. Context menus triggered by right-click rather than long-press require no extra design work in M3 but should be considered in usability reviews for devices with pointer input.

## Pitfalls

- Using a dropdown menu for navigation to new destinations, causing disorientation when the menu closes and the screen changes.
- Presenting more than eight to ten options in a menu without a search or filter affordance; long menus cause scroll fatigue and selection errors.
- Using two separate single-date pickers for a date range instead of a DateRangePicker, creating validation and comprehension problems.
- Locking the date or time picker to a single mode (calendar only, dial only) without a toggle to switch to text input, penalizing keyboard users and copy-paste workflows.
- Mixing action types (navigation, data mutation, settings) in the same dropdown without visual grouping or dividers.
- Defaulting to a blank "Select one" placeholder in an exposed dropdown when a sensible default exists, forcing an unnecessary interaction.
- Showing a destructive action (Delete, Remove) at the top of a dropdown menu where it can be triggered accidentally before the user has read the list.
- Replacing a Switch or Slider with a two-item or linear-scale dropdown, adding unnecessary interaction cost.
- Using a context menu as the only path to important actions, making them invisible to users who do not know to long-press.
- Ignoring locale when setting 12-hour vs 24-hour format in the time picker, delivering the wrong format to a significant user segment.
- Presenting a date picker and time picker in two sequential modal dialogs when both are needed for a single logical task.

## References

- **Material 3 Guidelines:** [Menus overview](https://m3.material.io/components/menus/overview)
- **Material 3 Guidelines:** [Date pickers overview](https://m3.material.io/components/date-pickers/overview)
- **Material 3 Guidelines:** [Time pickers](https://m3.material.io/components/time-pickers/overview)
- **Material 3 Guidelines:** [Chips](https://m3.material.io/components/chips/overview)
- **Material 3 Guidelines:** [Segmented buttons](https://m3.material.io/components/segmented-buttons/overview)

## See also

The corresponding Compose M3 code skill covers implementing DropdownMenu, ExposedDropdownMenuBox, DatePickerDialog, DateRangePicker, TimePicker, and TimeInput, including state hoisting, selectableDates constraints, and locale-driven hour format. For situations where a menu's option list has grown large enough to need its own screen, see the m3-navigation design skill and the m3-lists design skill. For confirming a date or time selection in a modal, see the m3-dialogs design skill on action ordering and labeling. For filter controls that sit persistently in a header rather than in a transient menu, see the m3-search and m3-segmented-buttons design skills.
