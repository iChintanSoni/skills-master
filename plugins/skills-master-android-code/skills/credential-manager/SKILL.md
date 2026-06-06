---
name: credential-manager
description: Covers Android Credential Manager — the unified API for passkeys, saved passwords, and Sign in with Google that replaces legacy auth stacks. Use when implementing modern sign-in flows, adopting passkeys, migrating away from SmartLock or the deprecated One Tap library, or presenting the bottom-sheet credential picker on Android 16+.
---

## When to use

Use this skill whenever an Android app needs to authenticate a user. Credential Manager is the single recommended sign-in API from Android 9 (API 28) onward, with full passkey support on Android 14+. Apply it when adding a fresh sign-in screen with passkeys, layering in password autofill, integrating "Sign in with Google" via the credential API (not the deprecated One Tap SDK directly), or migrating an existing app away from SmartLock for Passwords, One Tap, or Play Services Auth.

It is also the right reference when handling the credential provider bottom sheet, responding to `NoCredentialException` gracefully, or wiring up account creation (passkey registration) as part of an onboarding flow.

## Core guidance

**Dependency setup**

Add `androidx.credentials:credentials` and `androidx.credentials:credentials-play-services-auth` (the latter enables Google accounts on API 28–33 via Play Services).

**Getting credentials (sign-in)**

- Build a `GetCredentialRequest` that lists every acceptable credential type. Order matters — the bottom sheet surfaces options in the order they appear in the request.
- Include `GetPasswordOption` to surface saved passwords, `GetPublicKeyCredentialOption` with your RP's JSON challenge for passkeys, and `GetGoogleIdOption` for Google accounts.
- Call `credentialManager.getCredential(activity, request)` inside a coroutine. It suspends until the user picks or dismisses.
- Switch on the result type: `PublicKeyCredential` → send the JSON response to your server; `PasswordCredential` → authenticate with username/password; `CustomCredential` of type `GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL` → verify the ID token on your backend.
- Catch `NoCredentialException` to mean "no accounts available" — show a registration or alternative sign-in path rather than an error dialog.
- Catch `GetCredentialCancellationException` silently; the user dismissed the sheet intentionally.

**Creating credentials (registration)**

- For passkeys, call `credentialManager.createCredential(activity, CreatePublicKeyCredentialRequest(registrationJson))`. The JSON comes from your FIDO2/WebAuthn server.
- For passwords, call `credentialManager.createCredential(activity, CreatePasswordRequest(id, password))` immediately after a successful password-based registration so the system offers to save it.
- `CreateCredentialException` variants tell you whether the user cancelled, the provider is unavailable, or the RP ID does not match a Digital Asset Links entry.

**Digital Asset Links**

Passkeys require a `/.well-known/assetlinks.json` on your domain associating the app's SHA-256 fingerprint with the RP ID. Without it, `createCredential` fails with a security error at runtime even if the code is correct.

**Sign in with Google via Credential Manager**

Build `GetGoogleIdOption` with `filterByAuthorizedAccounts(true)` for returning users (shows a one-tap-style sheet), then fall back with `filterByAuthorizedAccounts(false)` to allow new account selection. Pass the resulting `GoogleIdTokenCredential` token to your backend rather than calling the old `GoogleSignIn` flow.

**Coroutine scope**

Run Credential Manager calls from a `ViewModel` using `viewModelScope`, not from inside a composable. Pass the `Activity` (not `ApplicationContext`) as the `context` parameter — the API needs a window to anchor the bottom sheet.

```kotlin
// ViewModel — sign-in attempt combining passkeys, passwords, and Google
class SignInViewModel(
    private val credentialManager: CredentialManager,
    private val rpId: String,
) : ViewModel() {

    fun signIn(activity: Activity, challengeJson: String) {
        viewModelScope.launch {
            val request = GetCredentialRequest(
                listOf(
                    GetPublicKeyCredentialOption(challengeJson),
                    GetPasswordOption(),
                    GetGoogleIdOption.Builder()
                        .setServerClientId(BuildConfig.GOOGLE_CLIENT_ID)
                        .setFilterByAuthorizedAccounts(true)
                        .build(),
                )
            )
            runCatching { credentialManager.getCredential(activity, request) }
                .onSuccess { result -> handleCredential(result.credential) }
                .onFailure { e ->
                    when (e) {
                        is NoCredentialException -> _uiState.update { it.copy(showRegistration = true) }
                        is GetCredentialCancellationException -> Unit // user dismissed
                        else -> _uiState.update { it.copy(error = e.localizedMessage) }
                    }
                }
        }
    }

    private fun handleCredential(credential: Credential) {
        when (credential) {
            is PublicKeyCredential -> sendToServer(credential.authenticationResponseJson)
            is PasswordCredential -> authenticateWithPassword(credential.id, credential.password)
            is CustomCredential -> {
                if (credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
                    val googleCred = GoogleIdTokenCredential.createFrom(credential.data)
                    verifyGoogleToken(googleCred.idToken)
                }
            }
        }
    }
}
```

**Clearing credentials (sign-out)**

Call `credentialManager.clearCredentialState(ClearCredentialStateRequest())` on sign-out so the system removes the active session association. This is especially important for passkeys and Google accounts — omitting it can cause the bottom sheet to skip the picker and silently re-sign-in the user.

**Large-screen and foldable considerations**

The Credential Manager bottom sheet is a system-owned UI; it adapts to window size automatically. Pass the foreground `Activity` (not a detached Fragment context) so the sheet anchors to the correct window on multi-window and foldable split-screen configurations.

## Platform notes

- **API 28–33:** Passkeys are unavailable; only passwords and Google credentials are surfaced. The same `getCredential` call works — the system silently omits passkey options on older versions if you include `GetPublicKeyCredentialOption` with `isAutoSelectAllowed = false`.
- **API 34+ (Android 14):** Full passkey support including cross-device flows via QR code. Hardware security key support is included.
- **API 35+ (Android 15):** Password managers can offer passkey upgrade suggestions in the bottom sheet automatically.
- **Google Play Services requirement:** On devices without Play Services (AOSP, some enterprise devices), `GetGoogleIdOption` silently produces no candidates. Structure the UI to show Google sign-in as one option rather than the only path.
- **Jetpack Compose:** There is no Compose-specific API for Credential Manager. Call from the ViewModel and pass `LocalActivity.current` via a lambda to the ViewModel call site; never pass `LocalContext.current` when an `Activity` is required.

## Pitfalls

- Passing `applicationContext` instead of the `Activity` context — the bottom sheet cannot attach to a window and throws `GetCredentialException` with a confusing message.
- Forgetting `clearCredentialState` on sign-out — returning users skip the picker on the next launch, making "switch account" impossible without uninstalling the app.
- Calling `getCredential` on the main thread without a coroutine scope — it suspends and will ANR if run synchronously on the UI thread.
- Not implementing Digital Asset Links before testing passkey registration — the failure is a runtime security error, not a compile error, and it surfaces only on a real device or emulator with a rooted trust anchor.
- Using `filterByAuthorizedAccounts(true)` without a `filterByAuthorizedAccounts(false)` fallback — new users never see the Google account chooser.
- Swallowing all `GetCredentialException` subtypes with a generic error message — users who intentionally cancel see a confusing "sign-in failed" toast.
- Showing the credential sheet from a `Service` or `BroadcastReceiver` — the API requires an `Activity` with a foreground window.
- Hardcoding the FIDO2 challenge in the app instead of fetching it from the server — challenges must be server-generated, single-use, and cryptographically random; a static challenge is rejected by compliant authenticators.

## References

- **Documentation:** [Credential Manager overview](https://developer.android.com/identity/sign-in/credential-manager)
- **Documentation:** [Sign in with passkeys using Credential Manager](https://developer.android.com/training/sign-in/passkeys)
- **Documentation:** [androidx.credentials API reference](https://developer.android.com/reference/androidx/credentials/package-summary)

## See also

The `sign-in-with-apple` Apple skill covers the conceptually parallel pattern on iOS. For securely storing tokens returned after authentication, see `keychain-security` on Apple or the Android Keystore system. For wiring the sign-in result into app state, see `viewmodel` and `state-flow`. For displaying the sign-in screen itself in Compose, see `compose-fundamentals` and `compose-forms-controls`.
