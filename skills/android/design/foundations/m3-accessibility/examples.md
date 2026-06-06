## Example 1 — Error state on a form field

### Scenario

A checkout form uses a red border on invalid credit-card input to communicate the error. The label "Credit card number" turns red at the same time. No other indicator is present.

### Design assessment

This relies on color alone — a user with deuteranopia or protanopia who has difficulty distinguishing red may not notice the field has changed state. The contrast of a mid-red label on a white surface frequently fails 4.5:1 as well.

### Recommended approach

Use Material 3's TextField in its `isError` state. This surfaces a red underline stroke and error icon automatically, but the critical design addition is an inline `supportingText` that names the problem: "Card number must be 16 digits." The icon provides shape redundancy, the text provides verbal redundancy, and TalkBack announces both the error label and the supporting text. The field's stateDescription should reflect "Error" so a screen-reader user swiping through a long form knows immediately which field needs correction without activating it first.

### Anti-pattern

Dismissing the error state and restoring the default appearance after the user types one character, before validation completes. This creates a false positive for assistive technology users who cannot see the real-time visual shift and who need a stable, confirmed outcome before moving to the next field.

---

## Example 2 — Icon-only bottom navigation bar

### Scenario

A navigation bar contains five icon-only destinations with no visible labels. The designer argues labels clutter the compact bar at small screen sizes.

### Design assessment

Icon-only navigation removes text but does not remove the need for labeling from the screen reader's perspective. TalkBack will announce each destination as an unlabeled button unless content descriptions are provided. The icons themselves (a house for Home, a person for Profile) carry meaning only to users already familiar with the app's conventions.

### Recommended approach

Provide content descriptions for each NavigationBar item that name the destination, not the icon: "Home", "Search", "Messages", "Notifications", "Profile." These descriptions are silent for sighted users and fully informative for TalkBack users. Additionally, the selected destination must communicate its state — "Home, selected, tab 1 of 5" — not just its label, so the user understands where they currently are. Material 3's NavigationBar composable handles role and selection state automatically when descriptions are supplied.

### Anti-pattern

Setting the content description to the icon name: "house icon" or "person icon." These descriptions fail to convey purpose (what will happen when the user activates this item) and repeat only what TalkBack might infer from a graphic anyway.

---

## Example 3 — Animated progress indicator on a loading screen

### Scenario

A data-heavy dashboard shows a full-screen spinning progress indicator with a subtle radial pulse animation while content loads. The animation is decorative and runs continuously until loading completes.

### Design assessment

Continuous, repeating animation on a full screen can trigger vestibular discomfort for users with motion sensitivity. The Reduce Animations system setting exists precisely to address this; ignoring it here is a design failure, not merely an engineering oversight.

### Recommended approach

Design two states of the loading screen: the animated version for users who have not requested reduced motion, and a static version — a non-animated circular indicator or a simple text label "Loading…" — for users who have enabled Reduce Animations. The static version is not a degraded experience; it is a first-class path. Beyond motion, the loading state must also communicate to TalkBack that the screen is busy; a live region or screen-level `stateDescription` of "Loading, please wait" prevents users from assuming the app has frozen.

### Anti-pattern

Hiding the loading indicator from the accessibility tree entirely (marking it decorative) to avoid its interference with TalkBack, while providing no alternative feedback that loading is in progress. This leaves screen-reader users unable to distinguish between an active loading state and a crashed one.
