---
name: m3-settings
description: "Material 3 design guidance for Android settings screens: grouping and ordering preferences, choosing between switches, checkboxes, and menus, handling destructive and account actions, adding search within settings, and establishing sensible defaults that minimize required configuration. Use when designing or critiquing a settings or preferences surface in an Android app and you need M3-grounded design judgment rather than implementation code."
---

## When to use

Reach for this skill when designing or critiquing any settings, preferences, or configuration surface in an Android app — from a simple single-screen list to a deep hierarchical preference tree. It covers how to group and sequence preferences so the most important ones surface first, which control type (switch, checkbox, radio button, dropdown menu) fits each kind of choice, how to handle destructive actions (sign out, delete account, clear data) without alarming users who are simply browsing, how to add search when the settings surface grows large, and how to choose defaults that let the majority of users never open settings at all.

This is a design-judgment skill. It names relevant Jetpack Compose Material 3 composables — including `Switch`, `Checkbox`, `RadioButton`, `DropdownMenu`, `ListItem`, and `NavigationDrawerItem` — in prose and defers implementation to the appropriate code skill.

## Core guidance

### Default before configuring

- **Design the out-of-box experience so that most users never need to open settings.** The best preference is one that does not exist because the app already chose well. Before exposing a setting, ask whether a smarter default — adaptive to context, device capability, or usage patterns — makes the option unnecessary.
- **Pre-select the option the majority of users would choose.** When a setting must exist, its default value should reflect the most common expectation. A wrong default forces every user to correct it; a right default makes the app feel tuned. Audit defaults with real usage data rather than engineering convenience.
- **Expose only preferences the user meaningfully controls.** Technical flags, debugging options, developer overrides, and internal toggles belong in a separate developer or diagnostic screen that is hidden from production users. Surfacing them in main settings dilutes signal with noise.

### Grouping and ordering

- **Group related preferences under a clear, noun-phrase header.** M3 settings typically present a `ListItem` or similar row pattern under a section label. Effective group names are short nouns ("Notifications", "Privacy", "Display") rather than verbs or questions. Avoid single-item groups — either merge the lone item into a sibling group or promote it to a standalone row without a header.
- **Order groups from most-visited to least-visited, with account and danger actions last.** Empirically, notification settings, display adjustments, and privacy controls are the most accessed. Sequencing by actual tap frequency (informed by analytics) is more honest than alphabetical ordering, which benefits no one.
- **Within a group, lead with the most impactful or most commonly changed preference.** Users who scan a long list stop at the first relevant item. If the most consequential control is buried at position eight, it will be missed.
- **Limit depth to two levels.** Top-level settings navigate to second-level screens; second-level screens contain the actual controls. A third level of nesting almost always signals that a group needs to be redesigned or split. Deeply nested settings are consistently undiscovered and unused.
- **Do not alphabetize within a group.** Alphabetization optimizes for findability only when the user already knows a setting's name. Logical or task-order sequencing matches how users think about their configuration needs.

### Choosing the right control

- **Use a `Switch` for binary on/off states that take effect immediately without a confirmation step.** A switch communicates "this is active now" versus "this is inactive now." It is appropriate for notifications on/off, dark mode, or background sync. Do not use a switch for a setting that requires a save or apply action — the toggle implies instant effect.
- **Use `Checkbox` for multi-select within a group.** When a user can independently enable or disable several items from the same set — choosing which notification categories to receive, for example — a vertical list of checkboxes makes the independent nature of each choice clear. Checkboxes signal "pick any combination" whereas radio buttons signal "pick exactly one."
- **Use `RadioButton` for mutually exclusive single-select choices when the options are few (two to five) and worth seeing together.** Showing the full option set inline helps users compare choices before committing. When options exceed five or require descriptions longer than a label, prefer a menu or a dedicated sub-screen.
- **Use a `DropdownMenu` or a sub-screen selection for longer exclusive lists.** When the set of options is large, rarely visited, or needs supplementary description, a tappable summary row that opens a full list picker is cleaner than a visible radio group. The summary row shows the current selection at a glance so the user knows the state without expanding.
- **Avoid sliders for discrete, named values.** A `Slider` is appropriate for continuous quantities (volume, brightness percentage) where the exact numeric value matters less than the direction of change. For a setting with four or five named options — "Small", "Medium", "Large" — segmented buttons or radio buttons communicate the choices more clearly because they name each state.
- **Never use a text field as a settings control unless the value is truly free-form.** Prefer pickers, menus, and segmented controls over text input. A text field in a settings screen creates a keyboard-dismissal burden and offers no discoverability of valid values.

### Writing clear setting labels and descriptions

- **Write the preference label as a noun phrase that names what is being configured, not an instruction.** "Notification sound" is more scannable than "Choose a notification sound." The supporting line — which appears as secondary text below the label in an M3 `ListItem` — is the right place to explain the behavior or show the current value.
- **Keep labels under four words when possible.** Long labels force line-wrapping in compact layouts and slow reading. If a preference genuinely needs a long name to be understood, it is often a signal the feature itself needs simplification.
- **Show the current value in the summary line, not the label.** A row labeled "Ringtone" with a supporting line of "Default (Pixel)" communicates far more than a row labeled "Set your ringtone" with no indication of the current state. Users checking what is already configured should not have to open the preference.
- **Use sentence case for labels and match the capitalization style of the platform.** M3 and the Android HIG both use sentence case for UI labels, not title case. "Auto-update apps" is correct; "Auto-Update Apps" is not.

### Destructive and account actions

- **Isolate destructive actions at the bottom of the settings screen or in a clearly separated group.** Actions such as "Sign out", "Delete account", "Clear all data", and "Reset to defaults" should not appear interspersed with harmless configuration rows. Visual separation — additional spacing, a divider, or a dedicated section — prevents accidental taps and signals that these actions carry elevated weight.
- **Always require a confirmation step for irreversible destructive actions.** Tapping "Delete account" should produce a confirmation dialog (see the m3-dialogs design skill) that names the consequence explicitly — what data is lost, whether it is recoverable, and what happens to any paid content or subscriptions. The confirming button should carry the error color role to distinguish it visually from a routine affirmative.
- **Label destructive actions precisely.** "Delete account" and "Sign out" are not the same action — do not conflate them. "Sign out" ends the session and preserves data; "Delete account" ends the session and destroys data. The label must match the consequence.
- **Make reversible reset actions available inline without a deep confirmation loop.** "Reset notification settings" or "Restore defaults for this section" are low-risk undoable actions. A confirmation dialog adds friction; a Snackbar with "Undo" is a better pattern for lightweight resets.
- **Place sign-out and account removal at the end of the account or profile section, never in the general or display section.** Users who tap into display settings to adjust font size should not encounter a sign-out button in the same visual zone.

### Search within settings

- **Add search to a settings surface once it has more than approximately twenty distinct preferences.** Below that threshold, a well-organized hierarchy is faster to navigate than a search field. Above it, search dramatically reduces discovery time for infrequently visited settings.
- **Implement search as a persistent top-level entry point, not a screen-specific affordance.** A search icon in the top app bar — using the M3 `SearchBar` or `DockedSearchBar` composable — is the expected pattern on Android. Avoid per-screen search fields that only cover one section's preferences.
- **Surface results at the individual setting level, not the group level.** When a user searches "vibrate", matching rows from multiple sections should appear individually in results, with their parent group shown as secondary text for context. A result that navigates to a section screen and leaves the user to search visually defeats the purpose.
- **Highlight the matched query string in results.** Visual emphasis on the matched characters reduces cognitive load when multiple results share similar labels.
- **Preserve the search field and query string on back navigation from a result.** A user who taps a search result, changes a setting, and returns should land back on the search results list, not an empty search field.

### Empty states and disabled settings

- **Disable — do not hide — settings that are temporarily unavailable.** A grayed row with a supporting explanation ("Unavailable when Do Not Disturb is on") teaches users the dependency and tells them how to enable the setting. A hidden row leaves users confused about where the option went.
- **Avoid large empty sections.** If filtering or a feature flag removes all items from a section, remove the section header as well. An orphaned header with nothing beneath it looks like a broken UI.

## Platform notes

### Compact phones
Settings are conventionally a vertically scrollable `LazyColumn` of `ListItem` rows. Section headers appear as small-caps or caption-style text above each group. Tappable rows that navigate to sub-screens show a trailing chevron; rows with inline controls (switches, checkboxes) do not. Swipe-to-dismiss is not a standard settings gesture — do not use it on preference rows.

### Large screens and foldables
On tablets and foldables in expanded or medium window configurations, consider a two-pane layout: a navigation pane on the left holding the top-level groups, and a detail pane on the right displaying the selected group's preferences. This matches the list-detail canonical layout and eliminates the push-pop navigation overhead of phone-style deep hierarchies. The `ListDetailPaneScaffold` adaptive scaffold implements this structure. Avoid leaving the detail pane empty — pre-select the first group when the screen first opens.

### Dark mode
Settings screens frequently contain a dark mode or theme preference toggle. Ensure the `Switch` or radio option for "Dark" mode is visible and clearly labeled in both light and dark themes; do not rely on icons alone if the system theme changes dynamically while the user has settings open.

## Pitfalls

- Exposing more than twenty preferences on a single flat list without grouping or hierarchy, turning settings into a wall of options with no navigable structure.
- Using a `Switch` for a setting that requires a save/apply action — the toggle implies instant effect, which is violated if the user must also tap a "Save" button.
- Placing destructive actions (sign out, delete account) in the same visual group as harmless display or notification preferences, with no visual separation.
- Skipping the confirmation dialog for irreversible data-deletion actions and relying solely on a clearly labeled button to prevent accidents.
- Using text input fields for settings that have a defined set of valid values — prefer menus, pickers, or radio buttons.
- Hiding unavailable settings rather than disabling them with an explanation, leaving users wondering if a feature was removed.
- Using the same label for actions with different consequences — "Sign out" and "Delete account" must remain distinct.
- Relying on alphabetical ordering instead of task- or frequency-ordered grouping, making commonly changed settings hard to find.
- Adding a search field to a short settings screen with fewer than twenty preferences — the overhead outweighs the benefit.
- Nesting settings three or more levels deep, ensuring they are never discovered by users who do not already know they exist.
- Writing preference labels as instructions ("Choose a notification sound") rather than noun phrases ("Notification sound").

## References

- **Material 3 Guidelines:** [Material 3 Foundations overview](https://m3.material.io/foundations/overview)
- **Documentation:** [Android mobile UI design](https://developer.android.com/design/ui/mobile)
- **Material 3 Guidelines:** [Lists component overview](https://m3.material.io/components/lists/overview)
- **Material 3 Guidelines:** [Switch component overview](https://m3.material.io/components/switch/overview)
- **Material 3 Guidelines:** [Checkbox component overview](https://m3.material.io/components/checkbox/overview)
- **Material 3 Guidelines:** [Radio button component overview](https://m3.material.io/components/radio-button/overview)
- **Material 3 Guidelines:** [Menus component overview](https://m3.material.io/components/menus/overview)
- **Material 3 Guidelines:** [Search component overview](https://m3.material.io/components/search/overview)
- **Material 3 Guidelines:** [Dialogs overview](https://m3.material.io/components/dialogs/overview)

## See also

For confirming destructive actions with a dialog, the m3-dialogs design skill covers confirmation patterns, destructive button styling, and action labeling in depth. For building the two-pane settings layout on large screens, the m3-canonical-layouts design skill covers list-detail structure and pane proportions. For writing clear, scannable preference labels and supporting text, the m3-writing design skill applies. For typography hierarchy within a settings screen — distinguishing section headers from row labels from supporting text — the m3-typography design skill is relevant. The Jetpack Compose Preference library and `PreferenceFragmentCompat` for implementing preference screens belong to the corresponding code skill.
