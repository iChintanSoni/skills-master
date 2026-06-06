## Example 1: Full passkey registration flow

A user has just created an account with username and password. After the backend confirms the account, the app immediately offers to upgrade to a passkey — no separate settings screen required.

```kotlin
// Triggered right after successful password registration
class RegistrationViewModel(
    private val credentialManager: CredentialManager,
    private val authRepository: AuthRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(RegistrationUiState())
    val uiState: StateFlow<RegistrationUiState> = _uiState.asStateFlow()

    fun registerPasskey(activity: Activity, userId: String, username: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            // 1. Fetch a WebAuthn registration challenge from your server
            val registrationJson = authRepository.fetchPasskeyRegistrationChallenge(
                userId = userId,
                username = username,
            )
            // 2. Ask the system to create the passkey — shows the biometric bottom sheet
            runCatching {
                credentialManager.createCredential(
                    context = activity,
                    request = CreatePublicKeyCredentialRequest(
                        requestJson = registrationJson,
                        preferImmediatelyAvailableCredentials = false,
                    ),
                )
            }.onSuccess { result ->
                // 3. Send the attestation response to the server to finalize registration
                val json = (result as PublicKeyCredential).authenticationResponseJson
                authRepository.verifyPasskeyRegistration(json)
                _uiState.update { it.copy(isLoading = false, passkeyRegistered = true) }
            }.onFailure { e ->
                when (e) {
                    is CreateCredentialCancellationException ->
                        _uiState.update { it.copy(isLoading = false) }  // user cancelled
                    is CreatePublicKeyCredentialDomException ->
                        _uiState.update { it.copy(isLoading = false, error = "Passkey creation failed — check Digital Asset Links") }
                    else ->
                        _uiState.update { it.copy(isLoading = false, error = e.localizedMessage) }
                }
            }
        }
    }

    fun savePassword(activity: Activity, username: String, password: String) {
        viewModelScope.launch {
            // Silently offer to save the password — no result to handle
            runCatching {
                credentialManager.createCredential(
                    context = activity,
                    request = CreatePasswordRequest(id = username, password = password),
                )
            }
        }
    }
}
```

**Key judgment calls:** Fetch the challenge fresh from the server each time — never reuse a challenge. Call `savePassword` before offering the passkey upgrade so users have a fallback if they dismiss biometrics. On failure with `CreatePublicKeyCredentialDomException`, surface a diagnostic hint in debug builds since the most common cause is a missing or mismatched `assetlinks.json`.

---

## Example 2: Returning-user sign-in with layered fallbacks

A sign-in screen tries passkeys first, then saved passwords, then Google. If none are available, it routes to a manual entry form rather than showing a confusing empty sheet.

```kotlin
sealed interface SignInResult {
    data class Success(val token: String) : SignInResult
    data object NeedsRegistration : SignInResult
    data object Cancelled : SignInResult
    data class Error(val message: String) : SignInResult
}

class SignInViewModel(
    private val credentialManager: CredentialManager,
    private val authRepository: AuthRepository,
) : ViewModel() {

    fun attemptSignIn(activity: Activity) {
        viewModelScope.launch {
            val challengeJson = authRepository.fetchPasskeyChallenge()

            val request = GetCredentialRequest(
                credentialOptions = listOf(
                    // Passkeys shown first — FIDO2 authentication
                    GetPublicKeyCredentialOption(
                        requestJson = challengeJson,
                        isAutoSelectAllowed = false,
                    ),
                    // Saved passwords from any credential provider
                    GetPasswordOption(),
                    // Google accounts — returning users only
                    GetGoogleIdOption.Builder()
                        .setServerClientId(BuildConfig.GOOGLE_SERVER_CLIENT_ID)
                        .setFilterByAuthorizedAccounts(true)
                        .setAutoSelectEnabled(false)
                        .build(),
                ),
            )

            runCatching { credentialManager.getCredential(activity, request) }
                .onSuccess { result ->
                    val sessionToken = processCredential(result.credential)
                    _signInResult.emit(SignInResult.Success(sessionToken))
                }
                .onFailure { e ->
                    val mapped = when (e) {
                        is NoCredentialException -> SignInResult.NeedsRegistration
                        is GetCredentialCancellationException -> SignInResult.Cancelled
                        else -> SignInResult.Error(e.localizedMessage ?: "Unknown error")
                    }
                    _signInResult.emit(mapped)
                }
        }
    }

    private suspend fun processCredential(credential: Credential): String {
        return when (credential) {
            is PublicKeyCredential ->
                authRepository.verifyPasskeyAssertion(credential.authenticationResponseJson)
            is PasswordCredential ->
                authRepository.signInWithPassword(credential.id, credential.password)
            is CustomCredential -> {
                require(credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL)
                val googleCred = GoogleIdTokenCredential.createFrom(credential.data)
                authRepository.signInWithGoogleToken(googleCred.idToken)
            }
            else -> error("Unrecognised credential type: ${credential.type}")
        }
    }
}
```

**Key judgment calls:** `isAutoSelectAllowed = false` on the passkey option prevents the system from silently authenticating without user interaction — important when a session might already be active and auto-sign-in would surprise the user. The `NeedsRegistration` result routes to a fresh account creation screen rather than leaving the user stuck.

---

## Example 3: Google sign-in with new-account fallback

A social app shows Google sign-in prominently. It first tries accounts already authorized with the app; if none exist, it re-issues the request to allow the user to pick any Google account on the device.

```kotlin
class GoogleSignInViewModel(
    private val credentialManager: CredentialManager,
    private val authRepository: AuthRepository,
) : ViewModel() {

    fun signInWithGoogle(activity: Activity) {
        viewModelScope.launch {
            // First pass: only accounts that have previously authorized this app
            val authorizedOption = GetGoogleIdOption.Builder()
                .setServerClientId(BuildConfig.GOOGLE_SERVER_CLIENT_ID)
                .setFilterByAuthorizedAccounts(true)
                .setAutoSelectEnabled(true)
                .build()

            val result = runCatching {
                credentialManager.getCredential(
                    context = activity,
                    request = GetCredentialRequest(listOf(authorizedOption)),
                )
            }

            if (result.isSuccess) {
                finalize(result.getOrThrow().credential)
                return@launch
            }

            // Second pass: allow any Google account — new user or different account
            if (result.exceptionOrNull() is NoCredentialException) {
                val allAccountsOption = GetGoogleIdOption.Builder()
                    .setServerClientId(BuildConfig.GOOGLE_SERVER_CLIENT_ID)
                    .setFilterByAuthorizedAccounts(false)
                    .setAutoSelectEnabled(false)
                    .build()

                runCatching {
                    credentialManager.getCredential(
                        context = activity,
                        request = GetCredentialRequest(listOf(allAccountsOption)),
                    )
                }.onSuccess { finalize(it.credential) }
                 .onFailure { e ->
                     if (e !is GetCredentialCancellationException) {
                         _uiState.update { it.copy(error = e.localizedMessage) }
                     }
                 }
            }
        }
    }

    private suspend fun finalize(credential: Credential) {
        require(credential is CustomCredential)
        require(credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL)
        val googleCred = GoogleIdTokenCredential.createFrom(credential.data)
        val token = authRepository.signInWithGoogleToken(googleCred.idToken)
        _uiState.update { it.copy(sessionToken = token) }
    }
}
```

**Key judgment calls:** Two-pass strategy is intentional. A single request with `filterByAuthorizedAccounts(false)` always shows the full account picker, even for users who have already authorized the app — this creates extra friction for returning users. The two-pass approach gives returning users a fast one-tap sheet while still supporting new accounts.

---

## Example 4: Sign-out that clears all credential state

Proper sign-out prevents silent re-authentication on the next app launch.

```kotlin
class SessionViewModel(
    private val credentialManager: CredentialManager,
    private val authRepository: AuthRepository,
) : ViewModel() {

    fun signOut() {
        viewModelScope.launch {
            // Clear the server-side session first
            authRepository.revokeSession()
            // Then clear Credential Manager's active session association.
            // Without this, the system may auto-select the same credential
            // next time getCredential is called without showing the picker.
            runCatching {
                credentialManager.clearCredentialState(ClearCredentialStateRequest())
            }
            _uiState.update { it.copy(isSignedIn = false) }
        }
    }
}
```

**Key judgment calls:** Always revoke the server session before clearing local state — if local clearing succeeds but the network call fails, the user is locked out of their own account. Swallow exceptions from `clearCredentialState` itself since it is best-effort; an exception here should not block the user from completing sign-out.
