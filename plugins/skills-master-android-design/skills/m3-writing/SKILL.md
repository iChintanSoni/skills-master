---
name: m3-writing
description: Guides designers and engineers on UX writing and content design for Material 3 Android apps. Use when crafting labels, button text, error messages, empty states, or any in-product copy to ensure clarity, consistent tone, and localization-friendly phrasing.
---

## When to use

Apply this skill whenever you are writing or reviewing any visible copy inside an Android app that follows Material 3: button labels, navigation labels, dialog titles, helper text, error messages, placeholder text, empty states, tooltips, snackbar messages, and chip labels. This skill is equally relevant when you are auditing an existing design for tonal consistency, accessibility of language, or localization readiness. It is not concerned with visual style tokens or component layout — those belong to companion design and code skills.

## Core guidance

### Case and grammar

- **Use sentence case for nearly all UI text.** Material 3 reserves title case for proper nouns and branded terms only. Navigation bar labels, dialog titles, button labels, and setting names all use sentence case ("Turn on notifications", not "Turn On Notifications"). Consistent casing reduces cognitive load and feels natural in conversational interfaces.
- **Keep titles short and descriptive, not clever.** Screen titles and section headers should tell users exactly where they are or what they are about to do. Wit is welcome in marketing copy; in-product titles must prioritize immediate comprehension.
- **Avoid ending labels with punctuation** unless the text is a complete sentence (such as a body paragraph or help description). Ellipses, colons, and periods in labels create visual noise without adding meaning.

### Button and action labels

- **Lead with a strong action verb.** Button labels should answer "what will happen?" — "Save draft", "Delete account", "Send feedback" — not "OK", "Yes", or "Confirm". Vague confirmations force users to re-read context to understand consequences.
- **Match the verb to the severity of the action.** Destructive actions (Snackbar undo, AlertDialog destructive button) should name the exact consequence: "Delete" not "Remove", "Discard" not "Cancel". This is especially important in M3 AlertDialog, where the destructive button is styled distinctly to draw attention.
- **Keep button labels to one to three words.** Longer labels break layouts at small sizes and make localization into compact scripts (German, Finnish) unpredictable. If more context is needed, add helper text near the component rather than expanding the label.
- **Do not repeat the noun from the dialog title in the button.** If the title says "Delete conversation?", the button should say "Delete", not "Delete conversation". Redundancy wastes space without adding clarity.

### Helper text and descriptions

- **Use helper text (in TextField or form fields) proactively, not reactively.** Explain constraints before the user submits: "Must be 8 or more characters" rather than revealing it only on error. This is surfaced via the supporting text slot in M3 TextField and OutlinedTextField.
- **Be specific about format requirements.** "Invalid date" is unhelpful. "Enter a date like June 15, 2025" is actionable. Specificity reduces retry attempts and frustration.
- **Limit helper text to one to two short sentences.** Supporting text below a field competes for attention; overflow should link to a longer help article rather than flood the field.

### Error messages

- **State what went wrong and what the user can do next.** Every error message should have two parts: a brief diagnosis and a concrete recovery step. "Couldn't connect. Check your internet connection and try again." is complete. "Error 503" is not.
- **Write errors in plain language.** Avoid technical identifiers, stack trace fragments, and jargon visible in the UI. If a developer error code is necessary for support, hide it behind a "Copy details" affordance rather than leading with it.
- **Avoid blame.** Phrase errors impersonally or from the system's perspective: "Something went wrong" not "You entered an invalid value." Users are already frustrated; apologetic but forward-looking language maintains trust.
- **Match error placement to the scope of the error.** Field-level errors belong in the supporting text below that specific TextField. Page-level errors belong in a Snackbar or an inline Banner. Modal dialogs should be reserved for errors that block all progress until resolved.

### Tone and terminology

- **Establish a consistent voice and apply it everywhere.** M3 apps should feel like they have a single author. If the app uses "workspace" in onboarding, do not switch to "project" in settings. Conduct a terminology audit across all surfaces before launch.
- **Be conversational but not casual.** The Material 3 design language leans toward warmth and approachability. Avoid stiff corporate language ("utilize", "leverage") and also avoid slang that may not translate or may age poorly.
- **Avoid unnecessary filler phrases.** "Please", "Simply", "Just" add length without meaning. "Please tap the button to continue" is weaker than "Tap to continue." Reserve politeness markers for genuinely sensitive contexts (permission requests, destructive confirmations).
- **Use positive framing where possible.** "Keep me signed in" is clearer than "Don't sign me out." Positive constructions are faster to parse and localize more predictably.

### Localization-friendly writing

- **Design for string expansion.** European languages typically expand English strings by 30–40%. Leave visual breathing room in component designs (chips, buttons, navigation labels) to absorb longer translations without truncation. Avoid designing layouts where labels must be an exact length.
- **Avoid idioms, metaphors, and humor tied to a single culture.** They rarely survive translation intact. Prefer concrete, literal phrasing.
- **Do not concatenate strings in logic to form sentences.** Grammatical order varies by language. Always use full template strings with named placeholders ("%s added to %s") so translators can reorder elements.
- **Test with pseudolocalization early.** Running a pseudolocalized build reveals truncation, hardcoded strings, and layout brittleness before any human translation begins.
- **Use gender-neutral language.** Many languages have grammatical gender. Designing with inclusive, neutral phrasing reduces translator burden and avoids exclusion.

## Platform notes

**Compact phones (portrait):** Space is most constrained here. Button labels and navigation labels are the highest priority for brevity. BottomNavigationBar labels truncate to one word by convention — design labels that are meaningful at a single word ("Home", "Library", "Profile"). Helper text below TextFields is visible but competes with the keyboard — keep it to one line.

**Large screens and foldables:** Wider layouts often expose more text at once (split panes, two-column forms). Greater horizontal space can tempt longer labels, but resist: consistency across breakpoints matters more than filling available width. On two-pane layouts, titles and descriptions appear simultaneously with their detail view — ensure labels remain meaningful in that wider context and do not rely on sequential flow for comprehension.

**Tablets in landscape:** NavigationRail and NavigationDrawer replace the bottom bar; labels appear beside icons and are no longer truncated to one word. Design labels that work at both lengths — a short word for phones and a short phrase for rail/drawer — so the same string reads naturally in both placements without requiring separate copy.

**Wear OS:** Extremely limited space means titles and confirmations must often fit in five to seven words maximum. Wear copy is a specialization beyond this skill's scope, but the principles of sentence case, plain language, and action verbs apply.

**TV (Android TV / Google TV):** Focus-based navigation and D-pad interaction mean confirmation dialogs and error messages must be especially clear since users cannot hover for tooltips. Tone principles apply; layout constraints differ significantly and are out of scope here.

## Pitfalls

- **Placeholder text as a substitute for labels.** Text inside an empty TextField disappears the moment the user starts typing. Never put critical instructions only in placeholder text; always use a visible label and, if needed, helper text below.
- **Truncating key action words.** If a button label must be truncated with an ellipsis, the label is too long or the component is too small. Redesign rather than truncate actions.
- **Using "click" instead of "tap."** Material 3 targets touch-first Android interfaces. Use "tap", "press", "hold", and "swipe" — not mouse-centric vocabulary. On large-screen or desktop surfaces where pointer input is common, "select" is a safe cross-input neutral.
- **Overusing ALL CAPS for emphasis.** ALL CAPS in body text reads as shouting, is harder to read, and localizes poorly. Use bold weight or M3 color roles (error, primary) to signal importance visually.
- **Writing error messages that only appear briefly in a Snackbar.** If an error requires user action to resolve, it must persist until resolved — a Snackbar that auto-dismisses in four seconds is wrong for actionable errors. Match the dismissal behavior to the urgency and required response.
- **Mixing formal and informal registers in the same flow.** An onboarding screen that says "Hey, let's get started!" followed immediately by a settings screen that says "The application requires the following permissions" creates dissonance. Audit the full user journey, not individual screens.

## References

- **Material 3 Guidelines:** [UX Writing Best Practices](https://m3.material.io/foundations/content-design/style-guide/ux-writing-best-practices)
- **Android Design:** [Design for Android Mobile](https://developer.android.com/design/ui/mobile)

## See also

The **m3-text-fields design skill** covers helper text placement, character counts, and error state layout within TextField components. The **m3-dialogs design skill** covers when to use AlertDialog versus other confirmation surfaces, including the destructive button pattern referenced above. The **m3-navigation design skill** addresses label length constraints across BottomNavigationBar, NavigationRail, and NavigationDrawer. For implementing TextField supporting text, error states, and button labels in Compose, refer to the corresponding Material 3 code skill covering forms and input components — composables such as TextField, OutlinedTextField, Button, FilledTonalButton, and Snackbar surface all the copy slots discussed here.
