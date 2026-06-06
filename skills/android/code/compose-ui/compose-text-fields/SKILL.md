---
name: compose-text-fields
description: Covers TextField, OutlinedTextField, and the state-based BasicTextField with TextFieldState for user text input in Jetpack Compose. Use when building any screen that accepts typed user input, including search bars, forms, login fields, or any editable text surface.
globs:
  - "**/*.kt"
tags: [compose, text-input, forms, material3, keyboard]
x-skills-master:
  domain: android
  class: code
  category: compose-ui
  platforms: ["android", "large-screen"]
  requires: { "android": "16", "kotlin": "2.2", "compose-bom": "2026.05.00" }
  pairs_with: []
  sources:
    - https://developer.android.com/develop/ui/compose/text/user-input
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Use this skill whenever a Composable screen needs to accept keyboard input from the user — form fields, search boxes, login/signup screens, settings inputs, chat message bars, and any other editable text surface. It covers both the Material 3 decorated variants (`TextField` / `OutlinedTextField`) and the low-level `BasicTextField` with the modern `TextFieldState` API (recommended for new code from Compose Foundation 1.7+).

## Core guidance

### API choice

- **Prefer `TextFieldState` (state-based API)** for all new code. It separates concerns cleanly: state lives in a `rememberTextFieldState()` holder, mutations go through `InputTransformation`, and display goes through `OutputTransformation`.
- Use the classic `value`/`onValueChange` pair only when integrating with legacy ViewModel state that already exposes a `String`/`StateFlow<String>`.
- Use `TextField` or `OutlinedTextField` (Material 3) for standard decorated fields. Drop to `BasicTextField` when you need fully custom decoration.

### TextField vs OutlinedTextField

- `OutlinedTextField` renders the Material 3 outlined container; `TextField` renders the filled variant. Both share identical parameters.
- Always supply at least one of `label` or `placeholder` — never leave both absent.
- `label` floats above the field when focused or non-empty. `placeholder` disappears on first keystroke. Use `placeholder` for hints that describe input format, `label` for field identity.

### Keyboard behaviour

- Set `keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Next)` (or `Done`, `Search`, etc.) to match the field's semantic purpose.
- Pair with `keyboardActions = KeyboardActions(onNext = { focusManager.moveFocus(FocusDirection.Down) })` to wire up the IME action key.
- For the last field in a form use `ImeAction.Done` and call `focusManager.clearFocus()` or trigger submission in `onDone`.

### Validation and error state

- Keep validation logic in the ViewModel; pass `isError: Boolean` down as a parameter.
- Supply a `supportingText` lambda to show error messages or character counters beneath the field. Hide it (pass `null`) when there is no message to show — the field height expands only when content is present.
- Never block input mid-keystroke with a snackbar; show inline error text only after the user leaves the field (`onFocusChanged`) or attempts submission.

### InputTransformation and OutputTransformation

- `InputTransformation` intercepts and filters raw text before it enters `TextFieldState` — use it to enforce max length, strip disallowed characters, or normalise input (e.g. force uppercase).
- `OutputTransformation` applies a visual-only mapping over the committed text without altering stored state — use it to format phone numbers, credit card numbers, or mask passwords.
- Do not use `VisualTransformation` (the old API) with the new state-based `BasicTextField`; it is only compatible with the classic `value`/`onValueChange` overload.

### Canonical state-based snippet

```kotlin
@Composable
fun EmailAndPasswordForm() {
    val emailState = rememberTextFieldState()
    val passwordState = rememberTextFieldState()
    var emailError by remember { mutableStateOf<String?>(null) }
    val focusManager = LocalFocusManager.current

    OutlinedTextField(
        state = emailState,
        label = { Text("Email") },
        placeholder = { Text("you@example.com") },
        keyboardOptions = KeyboardOptions(
            keyboardType = KeyboardType.Email,
            imeAction = ImeAction.Next,
        ),
        keyboardActions = KeyboardActions(
            onNext = { focusManager.moveFocus(FocusDirection.Down) },
        ),
        isError = emailError != null,
        supportingText = emailError?.let { { Text(it) } },
        modifier = Modifier.fillMaxWidth(),
    )

    OutlinedTextField(
        state = passwordState,
        label = { Text("Password") },
        keyboardOptions = KeyboardOptions(
            keyboardType = KeyboardType.Password,
            imeAction = ImeAction.Done,
        ),
        keyboardActions = KeyboardActions(
            onDone = {
                focusManager.clearFocus()
                // trigger form submission
            },
        ),
        inputTransformation = InputTransformation.maxLength(64),
        outputTransformation = PasswordOutputTransformation(),
        modifier = Modifier.fillMaxWidth(),
    )
}
```

### Additional do/don't bullets

- **Do** hoist `TextFieldState` into the ViewModel when the value must survive recomposition or be validated asynchronously.
- **Do** use `Modifier.semantics { contentDescription = "..." }` on fields whose purpose is not obvious from the label alone (improves accessibility and autofill).
- **Do** declare `autofillHints` (e.g. `AutofillType.EmailAddress`) so the system autofill framework can populate the field.
- **Don't** recreate `TextFieldState` inside a `LaunchedEffect` or on each recomposition — always use `rememberTextFieldState()` or store it in a stable holder.
- **Don't** use `remember { mutableStateOf("") }` plus `onValueChange` for new forms — this pattern forces you to manually reconcile cursor position and selection on every edit.
- **Don't** apply both `InputTransformation.maxLength(n)` and a manual character count check in `onValueChange` — pick one layer.

## Platform notes

**Large screen / foldable:** On large-screen layouts (two-pane or expanded window class) the soft keyboard does not always overlay the field. Use `WindowInsets.ime` with `imePadding()` on your form's scroll container to guarantee the focused field remains visible regardless of keyboard mode (docked, floating, or absent).

**Tablet / physical keyboard:** When a hardware keyboard is connected, `ImeAction` keys are not displayed; ensure form submission is also reachable via a button so the flow is not keyboard-only.

**RTL languages:** `TextField` inherits layout direction from `CompositionLocal`. No extra work is needed for label/placeholder mirroring, but custom `OutputTransformation` implementations must account for BiDi text ordering.

## Pitfalls

- **Stale cursor after programmatic text update:** If you write directly to `TextFieldState.edit { replace(...) }`, do it inside the `edit` block so the cursor is repositioned atomically; never set `TextFieldState.text` from outside the block.
- **IME flicker on navigation:** If a field gains focus immediately when a screen enters the composition, the keyboard may animate in then out during transition. Delay `requestFocus()` with a short `LaunchedEffect` or use `FocusRequester.createRefs()` and request focus only after the transition is complete.
- **Supporting text layout jump:** Toggling `supportingText` between `null` and a lambda causes the field's total height to change. Reserve the height with a fixed `minHeight` modifier on the parent if layout stability matters.
- **VisualTransformation on new API:** Passing a `VisualTransformation` to the state-based `BasicTextField` overload is a compile error — use `OutputTransformation` instead.
- **Classic API with TextFieldState:** The `value: String` / `onValueChange` overloads and the `state: TextFieldState` overloads are separate function signatures; they are not interchangeable at the call site.

## References

- **Documentation:** [User input — Jetpack Compose](https://developer.android.com/develop/ui/compose/text/user-input)
- **API Reference:** [TextFieldState — androidx.compose.foundation.text](https://developer.android.com/reference/kotlin/androidx/compose/foundation/text/input/TextFieldState)
- **API Reference:** [InputTransformation](https://developer.android.com/reference/kotlin/androidx/compose/foundation/text/input/InputTransformation)
- **API Reference:** [OutputTransformation](https://developer.android.com/reference/kotlin/androidx/compose/foundation/text/input/OutputTransformation)

## See also

- See `compose-state` for how to hoist `TextFieldState` into a ViewModel using `snapshotFlow`.
- See `compose-forms-validation` for full form-level validation patterns and multi-field submission logic.
- See `compose-accessibility` for autofill, content descriptions, and IME semantics requirements.
- See `compose-focus` for `FocusRequester`, `FocusManager`, and programmatic focus traversal across multiple fields.
