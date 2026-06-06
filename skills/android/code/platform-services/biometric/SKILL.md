---
name: biometric
description: Covers BiometricPrompt for fingerprint/face/device-credential authentication on Android — use when gating sensitive actions, protecting CryptoObject-bound keys, or choosing authenticator strength for your security model.
globs:
  - "**/*.kt"
tags: [biometric, security, authentication, cryptography, identity]
x-skills-master:
  domain: android
  class: code
  category: platform-services
  platforms: ["android", "large-screen"]
  requires: {android: "16", kotlin: "2.2"}
  pairs_with: []
  sources:
    - https://developer.android.com/identity/sign-in/biometric-auth
    - https://developer.android.com/training/sign-in/biometric-auth
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Use `BiometricPrompt` whenever you need the user to prove presence or identity before accessing sensitive data, performing a high-value action (payment, account deletion), or unlocking a cryptographic key stored in the Android Keystore. It is appropriate when:

- A CryptoObject-bound auth is needed to unwrap an encryption key tied to biometric enrollment.
- You want a unified prompt that supports fingerprint, face, and iris without writing per-sensor code.
- You want to offer device credential (PIN/pattern/password) as a fallback or primary method.
- You need to gate background-sensitive operations such as autofill credential reads.

Do not use it as a login mechanism for remote accounts directly — pair it with a server-side token exchange. Do not use it for non-sensitive UI navigation where a simple confirmation dialog suffices.

## Core guidance

**Setup — add the dependency**

```kotlin
// build.gradle.kts
implementation("androidx.biometric:biometric:1.2.0-alpha05")
```

Use the Jetpack `androidx.biometric` library rather than the bare platform API; it backports behavior consistently and handles the `FragmentActivity` / `Fragment` lifecycle automatically.

---

**Choose authenticator types explicitly**

Combine flags from `BiometricManager.Authenticators`:

| Constant | Meaning |
|---|---|
| `BIOMETRIC_STRONG` | Class 3 — required for CryptoObject-bound auth |
| `BIOMETRIC_WEAK` | Class 2 — face/fingerprint without crypto binding |
| `DEVICE_CREDENTIAL` | PIN, pattern, or password |

Prefer `BIOMETRIC_STRONG` for anything that touches Keystore. Combine with `DEVICE_CREDENTIAL` if you want automatic fallback: `BIOMETRIC_STRONG or DEVICE_CREDENTIAL`.

---

**Check availability before showing the prompt**

```kotlin
fun canAuthenticate(context: Context): Boolean {
    val manager = BiometricManager.from(context)
    return when (manager.canAuthenticate(BIOMETRIC_STRONG or DEVICE_CREDENTIAL)) {
        BiometricManager.BIOMETRIC_SUCCESS -> true
        BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED -> {
            // Deep-link to enrollment settings if appropriate
            false
        }
        else -> false
    }
}
```

Never skip this check — showing the prompt when hardware is absent or nothing is enrolled results in immediate failure callbacks that confuse users.

---

**Build and show a prompt (CryptoObject-bound example)**

```kotlin
class PaymentFragment : Fragment() {

    private val executor: Executor by lazy { ContextCompat.getMainExecutor(requireContext()) }

    fun authenticateAndDecrypt(cipher: Cipher) {
        val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle("Confirm payment")
            .setSubtitle("Authenticate to complete the transaction")
            // Do NOT call setNegativeButtonText when DEVICE_CREDENTIAL is included
            .setAllowedAuthenticators(BIOMETRIC_STRONG or DEVICE_CREDENTIAL)
            .setConfirmationRequired(true)
            .build()

        val biometricPrompt = BiometricPrompt(
            this,
            executor,
            object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                    val authenticatedCipher = result.cryptoObject?.cipher
                        ?: return // should not happen when you passed a CryptoObject
                    proceedWithDecryption(authenticatedCipher)
                }

                override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                    if (errorCode != BiometricPrompt.ERROR_USER_CANCELED &&
                        errorCode != BiometricPrompt.ERROR_NEGATIVE_BUTTON
                    ) {
                        showError(errString.toString())
                    }
                }

                override fun onAuthenticationFailed() {
                    // Biometric was recognized by hardware but not matched — do not act, let user retry
                }
            }
        )

        biometricPrompt.authenticate(promptInfo, BiometricPrompt.CryptoObject(cipher))
    }
}
```

---

**Key Keystore setup for CryptoObject auth**

- Create the key with `setUserAuthenticationRequired(true)`.
- Set `setUserAuthenticationParameters(timeout = 0, type = KeyProperties.AUTH_BIOMETRIC_STRONG)` — a timeout of `0` means per-use auth (strongest); any positive value is time-based.
- After biometric enrollment changes invalidate biometric-bound keys by default; set `setInvalidatedByBiometricEnrollment(false)` only if you have a fallback recovery path.

---

**Do / Don't**

- Do pass the `Fragment` or `FragmentActivity` overload — not a bare `Context`.
- Do handle `ERROR_LOCKOUT` (too many failures) and `ERROR_LOCKOUT_PERMANENT` with appropriate UI rather than silently retrying.
- Do use `setConfirmationRequired(false)` only for passive biometrics (face) in low-risk flows — require explicit confirmation for payments and key operations.
- Don't call `setNegativeButtonText` and include `DEVICE_CREDENTIAL` simultaneously — the SDK throws `IllegalArgumentException`.
- Don't hold a strong reference to `BiometricPrompt` across configuration changes; recreate it using the new Fragment instance.
- Don't assume `onAuthenticationFailed` is terminal — the user still has remaining attempts; only `onAuthenticationError` is terminal for the current prompt session.
- Don't store biometric templates yourself; delegate entirely to the platform Keystore and BiometricPrompt.

## Platform notes

**Large screens and foldables** — the prompt is a system dialog and appears correctly on foldables and tablets. If your activity uses `android:windowSoftInputMode` adjustments, verify the prompt is not obscured when a keyboard is visible, especially in split-screen mode.

**API level minimums** — `BiometricPrompt` from `androidx.biometric` is available from API 16. `BIOMETRIC_STRONG` hardware is formally defined from API 30; on older devices the library maps it to the best available strong biometric. `setUserAuthenticationParameters` in `KeyGenParameterSpec` requires API 30; use the deprecated `setUserAuthenticationValidityDurationSeconds(-1)` on API 29 and below for per-use auth.

**DEVICE_CREDENTIAL only** — to allow PIN/pattern/password with no biometric option at all, use `setAllowedAuthenticators(DEVICE_CREDENTIAL)` alone. This cannot be combined with a `CryptoObject` on API 29 and below.

**Face and iris** — these are `BIOMETRIC_WEAK` on most devices unless the vendor certifies them as Class 3 (`BIOMETRIC_STRONG`). Never gate Keystore-bound operations on `BIOMETRIC_WEAK` alone.

**Background auth** — `BiometricPrompt` must be shown from a foreground Activity or Fragment. If you need to authenticate from a background service (e.g., autofill provider), surface a notification that deep-links the user back to the foreground.

**Testing** — use the Android emulator's "Enroll Fingerprint" option in Extended Controls, or a physical device. Instrumented tests can use `UiAutomator` to tap the system biometric dialog; unit tests should mock the `AuthenticationCallback` path.

## Pitfalls

- **Re-using a consumed `Cipher`** — a `Cipher` initialized for Keystore auth is single-use. After a successful `onAuthenticationSucceeded`, use it immediately; reinitializing it later requires a fresh biometric challenge.
- **Ignoring key invalidation** — if the user enrolls or removes a biometric, keys with `setInvalidatedByBiometricEnrollment(true)` become permanently invalid. Catch `KeyPermanentlyInvalidatedException` when initializing the `Cipher` and prompt re-enrollment.
- **Showing the prompt after `onStop`** — calling `authenticate()` when the Activity is not in the foreground causes an immediate `ERROR_CANCELED`. Gate the call on lifecycle state or use a `lifecycleScope` observer.
- **Confusing `onAuthenticationFailed` with an error** — this fires on each failed attempt; the session is still active. Only update retry-count UI here; do not dismiss your loading state or show a permanent error.
- **Not scoping the executor to the lifecycle** — using a long-lived executor (e.g., a global thread pool) can deliver callbacks after the Fragment is detached. Use `ContextCompat.getMainExecutor(requireContext())` or a lifecycle-aware wrapper.
- **Prompt inflation on orientation change** — the system dismisses the prompt on configuration change. Observe a `ViewModel`-held state to re-present the prompt after recreation if the operation is still pending.

## References

- **Documentation:** [Biometric authentication — identity guide](https://developer.android.com/identity/sign-in/biometric-auth)
- **Documentation:** [Show a biometric authentication dialog — training](https://developer.android.com/training/sign-in/biometric-auth)
- **API reference:** [BiometricPrompt (androidx.biometric)](https://developer.android.com/reference/androidx/biometric/BiometricPrompt)

## See also

The `keychain-security` and `cryptokit` skills cover the iOS/macOS equivalent keychain and Secure Enclave patterns. For credential-manager-based federated sign-in that can layer on top of biometric auth, see the `sign-in-with-apple` skill as a conceptual counterpart; the Android equivalent is Credential Manager (not yet a dedicated skill). The `networking-layer` skill covers securely transmitting tokens that a biometric-unlock step might produce.
