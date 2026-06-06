---
name: autofill
description: Guides Android developers on optimizing app fields for the Autofill framework using autofill hints and proper view structure. Use when implementing login forms, address inputs, or payment fields to ensure compatibility with password managers and the system autofill service, or when building a custom autofill service.
---

## When to use

Apply this skill whenever your app contains any form of user input that a password manager or the Android Autofill framework could fill — login screens, registration flows, address entry, credit card forms, OTP fields, or any Compose/View-based field where the system should suggest saved data. Also apply it when building a custom `AutofillService` to feed credentials from your own vault into other apps.

## Core guidance

**Declare autofill hints on every fillable field.** Autofill hints are the primary signal the framework uses. Without them the system guesses or ignores fields entirely.

- In View/XML: set `android:autofillHints` to one or more `View.AUTOFILL_HINT_*` constants or the W3C token strings.
- In Compose: apply `Modifier.semantics { contentType = ContentType.Username }` (API 26+) or use `ExperimentalComposeUiApi`'s `autofill` modifier. Prefer the `semantics`-based approach for forward compatibility.
- Common hint values: `AUTOFILL_HINT_USERNAME`, `AUTOFILL_HINT_PASSWORD`, `AUTOFILL_HINT_EMAIL_ADDRESS`, `AUTOFILL_HINT_PHONE`, `AUTOFILL_HINT_POSTAL_ADDRESS`, `AUTOFILL_HINT_CREDIT_CARD_NUMBER`, `AUTOFILL_HINT_CREDIT_CARD_EXPIRATION_DATE`.

**Structure the view hierarchy logically.** The Autofill framework partitions a screen into autofill contexts by traversing the window's `AssistStructure`. Group related fields inside a single `ViewGroup` or Compose layout node so the framework can correlate them (e.g., username + password must be siblings in the same logical form).

**Set the correct `importantForAutofill` value.**
- `IMPORTANT_FOR_AUTOFILL_YES` (default for most views) — participate in autofill.
- `IMPORTANT_FOR_AUTOFILL_NO` — exclude a field (e.g., a search box or OTP display).
- `IMPORTANT_FOR_AUTOFILL_NO_EXCLUDE_DESCENDANTS` — exclude an entire subtree (e.g., a custom keyboard overlay). Prefer this over looping over children.

**Commit the autofill session at the right moment.**
- Call `AutofillManager.commit()` on successful login/sign-up so the system can prompt to save.
- Call `AutofillManager.cancel()` when the user dismisses the form without completing it — prevents spurious save prompts.
- Never call `commit()` speculatively; only after your own validation confirms the data is correct.

**Trigger a re-layout notification when field values change programmatically.** If code (not the user) fills a field, call `AutofillManager.notifyValueChanged(view)` so the framework tracks the current state.

**For Compose fields use `BasicTextField` or `TextField` with `keyboardOptions` and Modifier semantics.**

```kotlin
@OptIn(ExperimentalComposeUiApi::class)
@Composable
fun LoginForm(onLogin: (String, String) -> Unit) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }

    Column(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Email") },
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Email,
                imeAction = ImeAction.Next
            ),
            modifier = Modifier
                .fillMaxWidth()
                .semantics {
                    contentType = ContentType.EmailAddress
                }
        )

        Spacer(modifier = Modifier.height(8.dp))

        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password") },
            visualTransformation = PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Password,
                imeAction = ImeAction.Done
            ),
            modifier = Modifier
                .fillMaxWidth()
                .semantics {
                    contentType = ContentType.Password
                }
        )

        Button(
            onClick = { onLogin(email, password) },
            modifier = Modifier.fillMaxWidth().padding(top = 16.dp)
        ) {
            Text("Sign in")
        }
    }
}
```

**Disable autofill only when appropriate.** OTP entry, CAPTCHA, and one-time fields should set `importantForAutofill` to `NO`. Do not globally disable autofill for your app with `NO_EXCLUDE_DESCENDANTS` on the root — this breaks password manager integration.

**Support save callbacks.** Implement `AutofillManager.AutofillCallback` or observe `FLAG_SAVE_ON_ALL_VIEWS_INVISIBLE` to know when the framework intends to save. If your app uses a custom authentication flow, handle `SAVE_DATA_TYPE_USERNAME_AND_PASSWORD` in a custom `AutofillService` and persist securely.

**Building a custom `AutofillService`.**
- Declare `<service android:permission="android.permission.BIND_AUTOFILL_SERVICE">` in the manifest.
- Implement `onFillRequest` — parse `AssistStructure` to find fillable fields, then build `FillResponse` with `Dataset` objects.
- Implement `onSaveRequest` — extract and securely store the user's values when they confirm saving.
- Use `RemoteViews` for the picker UI presented in the autofill dropdown.
- Never store plaintext credentials; encrypt with `EncryptedSharedPreferences` or `Keystore`.

## Platform notes

**API levels:**
- Autofill framework: API 26 (Android 8.0). For API 16-25 the framework is absent; hints are silently ignored, which is safe.
- `View.AUTOFILL_HINT_*` constants: available from API 26.
- Inline suggestions (autofill inside IME): API 30+ via `InlineSuggestionsRequest`.

**Large-screen / foldable devices:** Multi-pane layouts can display login and content simultaneously. Ensure each pane's form has its own isolated autofill context; avoid placing the username field in one pane and the password in another since the framework may not correlate them across independent `Fragment`/`NavHost` instances.

**Compose vs. View:**
- Compose's `TextField` honors `semantics { contentType }` on API 26+.
- For interop (Compose hosting a legacy `EditText` via `AndroidView`), set `android:autofillHints` on the `EditText` as usual.

**Credential Manager (API 34+):** For passkey and federated identity flows prefer `androidx.credentials.CredentialManager` over raw autofill APIs. Autofill hints for passwords still apply when Credential Manager falls back to passwords.

## Pitfalls

- **Omitting hints on dynamically-added views** — views inflated or added after the window is shown must still declare hints; the framework re-traverses on focus but requires hints to be set before the field receives focus.
- **Calling `commit()` too early** — committing before server validation passes can prompt the user to save incorrect or partial credentials, degrading trust in the password manager.
- **Reusing view IDs across screens** — the framework uses the view ID as a stable identifier. If you reuse the same `R.id.*` for different semantic fields across fragments, the framework may fill the wrong value. Give each logical field a unique ID.
- **Blocking the autofill thread** — `onFillRequest` and `onSaveRequest` in a custom service run on a background thread but must reply via `callback` within a framework timeout (~5 s). Perform I/O asynchronously using coroutines and call `callback.onSuccess()` or `callback.onFailure()` on completion.
- **Using `View.IMPORTANT_FOR_AUTOFILL_NO` on a password field** — easy to introduce accidentally when disabling autofill for a confirmation field. Always audit fields before shipping.
- **Ignoring `autofillHints` on custom views** — custom `View` subclasses must override `getAutofillType()` and `getAutofillValue()` / `autofill(AutofillValue)`, otherwise the framework cannot fill them even when hints are declared.

## References

- **Documentation:** [Autofill framework overview](https://developer.android.com/guide/topics/text/autofill)
- **Documentation:** [Optimize your app for autofill](https://developer.android.com/guide/topics/text/autofill-optimize)

## See also

The `sign-in-with-apple` skill covers federated identity patterns for cross-platform apps. For secure credential storage back-end concerns see the `keychain-security` skill (iOS) and Android's `EncryptedSharedPreferences` via the `cryptokit` equivalent in Android Keystore. The `swiftui-forms-controls` and `uikit-core` skills document the iOS counterparts to the patterns described here.
