## Examples

### Login form: filled fields on a neutral surface

A sign-in screen with a white background contains two filled text fields (`TextField`): Email and Password. The email field has a leading envelope icon and no trailing icon. The password field has no leading icon and a trailing visibility-toggle icon (eye/eye-off) that shows or hides the password text. Both fields use the same filled variant. Supporting text is absent by default; when the user submits with an incorrect password, the password field transitions to the error state with the message "Incorrect password. Try again or reset your password." The email field does not enter an error state because the server error is specific to the credential combination, not the email format. On the next attempt, the error clears the moment the user modifies the password field.

**What this gets right:** consistent variant, a purposeful trailing icon (interactive, not decorative), an actionable error message scoped to the correct field, and a clear recovery path.

---

### Account-creation form: real-time vs deferred validation

A registration form has three filled text fields: Username, Email, and Password. Username shows real-time *positive* validation — a green check in the trailing slot appears when the username is available and valid (minimum 3 characters, no spaces). Email validates on focus-out: when the user tabs away, if the format is invalid the field transitions to error state with "Enter a valid email address (e.g. you@example.com)". Password has a strength indicator in the supporting text region ("Weak", "Fair", "Strong") that updates on every keystroke, turning to error only on form submission if the minimum requirements are not met.

**What this gets right:** real-time feedback is positive for username (no anxiety), format-level feedback for email triggers on blur (complete input), and password strength feedback is graduated and informative rather than binary and punishing.

---

### Search field: recognizing the wrong component

A product catalog screen places a `TextField` in the top bar with a magnifying glass leading icon and a placeholder "Search products…". The label is removed because the icon implies search context. When the user taps the field, there are no suggestions, no search history, and no clear-all button.

**What this gets wrong:** a `SearchBar` or `DockedSearchBar` is the correct M3 component for this pattern. It provides search-scoped focus behavior, a built-in leading search icon slot, a clear button, and a suggestions surface. A raw text field pressed into service as a search bar loses all of these affordances and is a known M3 antipattern. The absence of a label is also fragile — TalkBack would only read the placeholder, which is not a label and will not be re-announced after the user has begun typing.

---

### Character counter: when it earns its place

A social-profile bio field accepts up to 160 characters. The supporting text shows "Add a short bio" as a prompt. When the user has typed 128 characters (80% of capacity), the character counter appears in the trailing corner of the supporting text region: "128/160". At 150 characters the counter turns to the M3 warning-adjacent tint to signal proximity to the limit. At 160 characters the counter shows "160/160" in the error color and further typing is blocked (the `maxLines` and `maxLength` constraints are set). The supporting text "Add a short bio" is replaced by "Character limit reached" in the error color.

**What this gets right:** the counter appears progressively rather than always, it escalates visually before the hard stop, and the error state accurately reflects a real constraint rather than a soft warning.

---

### Date input: replacing a text field with a picker

A travel-booking form originally had a text field labeled "Departure date" with placeholder "DD/MM/YYYY" and a calendar icon in the trailing slot. Users were submitting malformed dates (wrong separator, wrong field order by locale) causing validation errors at the server.

The redesign makes the field non-editable: it is displayed as a read-only outlined text field showing the selected date in a locale-appropriate format, with a calendar trailing icon that opens M3's `DatePickerDialog`. The label "Departure date" floats above the selected value. Supporting text reads "Tap to choose a date".

**What this gets right:** the date picker eliminates the entire class of format validation errors, the outlined variant signals a non-editable-but-interactive field (distinct from free-text input), and the calendar icon is interactive and leads to a concrete action rather than being decorative.
