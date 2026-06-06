---
name: m3-selection-controls
description: "Design critique and recommendations for Material 3 selection controls on Android: checkbox (including tri-state), radio button, and switch — when each control fits, single vs multiple selection, label placement and tap targets, and the distinction between immediate effect (switch) and deferred/confirmed effect (checkbox). Use when reviewing or specifying selection controls in a Compose-first Android app and you need M3-grounded design judgment rather than implementation code."
tags: [m3, design, selection-controls, android, components, forms]
x-skills-master:
  domain: android
  class: design
  category: components
  platforms: ["android", "large-screen"]
  pairs_with: []
  sources:
    - https://m3.material.io/components/checkbox/overview
    - https://m3.material.io/components/switch/overview
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for this skill when:

- Deciding whether a setting or option belongs on a switch, a checkbox, or a radio button, and whether that choice is contextually appropriate.
- Reviewing a form or settings screen where multiple selection controls compete for attention or where the wrong type has been applied.
- Evaluating whether a switch's immediate-effect behavior is correct for a given action, or whether the action needs deferral with an explicit save/confirm step.
- Critiquing tri-state checkbox usage for parent/child group selection and assessing whether the pattern adds clarity or confusion.
- Assessing touch target compliance and label placement for selection controls.

This is a design-judgment skill. It names the relevant Jetpack Compose Material 3 composables — `Checkbox`, `TriStateCheckbox`, `RadioButton`, and `Switch` — in prose and hands implementation details to the appropriate code skill.

## Core guidance

### Choosing the right control

- **Use a switch for binary settings that take immediate effect.** `Switch` communicates an on/off state that activates the moment the user toggles it — no save button, no confirmation. Classic examples are toggling Wi-Fi, enabling notifications, or activating a dark-mode override. If the action needs a confirmation step or a "Save" button to take effect, a switch is the wrong control; use a checkbox instead.
- **Use a checkbox for options within a form that take effect only on submission.** `Checkbox` belongs in forms, filters, and permission lists where the user reviews a collection of choices before committing. A lone checkbox outside a form context is usually a sign that a switch would serve better.
- **Use checkboxes — never switches — for multi-select lists.** When a user can pick any combination from a set (e.g., selecting which days a reminder fires), checkboxes correctly signal independent, multi-selectable options. Switches in a multi-select list look like independent toggles for features, not selections within a group.
- **Use radio buttons for mutually exclusive single-selection from a small, fixed set.** `RadioButton` enforces "pick exactly one" semantics. It is the right control when the options are all visible simultaneously and there are typically two to six choices. If the option count is large (more than about six), a dropdown menu or exposed dropdown provides a less cluttered alternative.
- **Never use checkboxes for mutually exclusive choices.** A group of checkboxes implies independent selection; using them for a single-select scenario contradicts the affordance and will confuse users who try to pick more than one.

### Tri-state checkboxes

- **Reserve `TriStateCheckbox` for a parent node that represents all children in a hierarchy.** The indeterminate state (partial fill) is only meaningful when it reflects that some — but not all — child items in a group are selected. Using indeterminate as a generic "unknown" or "not yet answered" state violates the established affordance and will be misread.
- **Always pair the parent tri-state checkbox with visible child checkboxes.** The parent's three states (checked, unchecked, indeterminate) derive their meaning from the children's states. If the children are hidden or in another view, the indeterminate state has no referent and becomes confusing.
- **Toggling an indeterminate parent should select all children.** The standard behavior is: indeterminate → checked (select all), checked → unchecked (deselect all), unchecked → checked (select all). Deviating from this pattern requires strong justification because it breaks the learned model.
- **Do not use tri-state to represent a three-way value choice.** If an option genuinely has three discrete values (e.g., None / Some / All as independent settings), use three radio buttons or a segmented button, not a tri-state checkbox.

### Immediate vs deferred effect

- **Switches must act immediately, without a confirm dialog.** If toggling a switch would trigger a potentially surprising consequence (e.g., sending a notification immediately, deleting a cache), surface a brief Snackbar with an undo option rather than gating the toggle behind a dialog. A switch that opens a confirmation dialog contradicts its own affordance.
- **Checkboxes in forms are naturally deferred.** The user's selections stay provisional until the form is submitted. This makes checkboxes appropriate for settings screens that have an explicit "Apply" or "Save" action.
- **Mixing immediate and deferred controls on the same screen requires clear visual separation.** If some controls take immediate effect (switches) and others are deferred (checkboxes in a form), separate them with a section header or a visual divider. Intermixing them without differentiation creates unpredictable behavior and erodes trust.

### Labels and tap targets

- **Every selection control must have an associated label.** An unlabeled checkbox, radio button, or switch is inaccessible and incomprehensible. The label is the primary affordance — the control's visual indicator communicates state, not meaning.
- **Place labels to the right of the control in LTR layouts.** M3 positions labels trailing the control. Leading labels (to the left) create a scanning mismatch: the eye reads the label first but the interactive indicator is to the right. Reserve leading labels only when a design system requirement demands it.
- **The entire row — control plus label — must be tappable.** Restricting the tap target to the small control indicator makes it difficult to use, especially in lists. The label text itself should expand the interactive area to at least 48 dp in height.
- **Keep labels concise and in sentence case.** A label is a noun phrase or short verb phrase, not a full sentence. Sentence case (not ALL CAPS) is the M3 standard. If a control requires a long explanation, place a brief supporting line below the label rather than in the label itself.
- **Align supporting text to the label column, not the control column.** When a row has both a label and a supporting description (e.g., "Backup photos" with "Syncs automatically over Wi-Fi" below), the supporting text should align with the label's leading edge, not with the control indicator.

### Grouping and visual hierarchy

- **Group related controls under a section header, not just by proximity.** A list of ten switches with no grouping reads as a flat, undifferentiated mass. Organize by topic (e.g., "Privacy," "Notifications") with M3 list section headers to help users scan to the setting they need.
- **Separate radio button groups visually from each other.** Two sets of radio buttons on the same screen without clear delimiters will appear to be one group, leading to the appearance that selecting from the second group deselects from the first — which may or may not be true.
- **Avoid stacking checkboxes and radio buttons in the same group.** A single selection group should use one control type consistently. Mixing types implies different selection semantics and forces users to reason about the difference.
- **Do not use selection controls to trigger navigation or perform actions.** A checkbox that opens a new screen when checked, or a radio button that submits a form on selection, subverts the control's affordance. Checkboxes and radio buttons set state; buttons and links trigger actions.

## Platform notes

**Compact phones:** Selection controls in vertically scrolling lists work well. Keep rows consistent in height and avoid wrapping labels across more than two lines, which makes the list hard to scan quickly. The 48 dp touch-target rule is especially critical on phones where finger precision is limited.

**Large screens and foldables:** Settings screens on tablets often use a two-pane layout (category list on the left, controls on the right). Selection controls in the detail pane should not stretch to fill the full expanded width; constrain content to a readable column width (typically 600 dp maximum) to avoid excessively wide rows where the label and control are far apart.

**Landscape orientation:** On phones in landscape, a single-column settings list becomes cramped vertically. Consider grouping controls more tightly under section headers, or allowing the layout to reflow into two columns if the window width exceeds the medium breakpoint (600 dp).

**Right-to-left (RTL) locales:** M3 Compose handles control mirroring automatically; the control moves to the right and the label to the left in RTL. Verify that custom row layouts using explicit `start`/`end` padding also mirror correctly, since absolute `left`/`right` padding does not adapt.

**Wear OS:** Selection controls on Wear are constrained by the small, round display. Single-toggle settings use a Wear-specific chip or toggle chip rather than the phone `Switch` composable. Multi-select and radio patterns are generally avoided on Wear in favor of paged single-option confirmation screens.

## Pitfalls

- **Switch with a confirm dialog.** A switch that requires confirmation before activating contradicts the immediate-effect affordance. Restructure as a checkbox in a form, or use a switch with a brief undo Snackbar.
- **Checkbox for a mutually exclusive choice.** Using checkboxes where only one selection is valid misleads users into thinking they can pick multiple options.
- **Tri-state checkbox without visible child controls.** The indeterminate state is meaningless without a visible group of children from which it derives its partial state.
- **Unlabeled controls.** A bare checkbox, radio button, or switch without a text label is inaccessible to TalkBack and incomprehensible to sighted users.
- **Tap target limited to the indicator widget.** Restricting taps to the small checkbox square or radio circle, instead of the full row, causes missed taps and fails accessibility requirements.
- **Mixing checkbox and radio semantics in the same group.** Each group should use one control type; mixing types implies different selection rules and produces cognitive friction.
- **Long, sentence-like labels on controls.** If the label requires a full sentence, the UI is trying to do too much inline. Move explanation to supporting text below the label.
- **Selection controls that trigger navigation or side-effects.** Controls that do something other than set a state when toggled break the affordance and surprise users.
- **Ignoring RTL mirroring in custom row layouts.** Explicit pixel-based left/right offsets do not mirror; always use start/end semantics in Compose layout modifiers.
- **Switching between switch and checkbox styles inconsistently.** If some settings use a switch for immediate effect and others use checkboxes for deferred effect, mixing them without clear sectioning or labels erodes the user's mental model of when changes take effect.

## References

- **Material 3 Guidelines:** [Checkbox overview](https://m3.material.io/components/checkbox/overview)
- **Material 3 Guidelines:** [Switch overview](https://m3.material.io/components/switch/overview)
- **Material 3 Guidelines:** [Radio button overview](https://m3.material.io/components/radio-button/overview)
- **Material 3 Guidelines:** [Lists overview](https://m3.material.io/components/lists/overview)

## See also

The Compose M3 selection controls code skill covers implementing `Checkbox`, `TriStateCheckbox`, `RadioButton`, and `Switch` in Jetpack Compose, including state hoisting, `ToggleableState`, and semantics modifiers. For settings screens that host selection controls, the m3-lists design skill covers row structure, supporting text, and section headers. For forms containing checkboxes that are submitted with an action, the m3-dialogs and m3-buttons design skills address confirmation patterns and action hierarchy. For accessible touch targets and TalkBack content descriptions, see the compose-accessibility code skill.
