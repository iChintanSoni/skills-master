---
name: security-crypto
description: Covers encryption at rest on Android using the Android Keystore — generating and using AES/RSA keys, encrypting files and data, selecting algorithms, leveraging hardware-backed keys and StrongBox, and migrating away from the deprecated Jetpack Security crypto library. Use when you need to protect sensitive data stored on device or need guidance on Android cryptographic best practices.
---

## When to use

Apply this skill whenever an app needs to store sensitive data — credentials, health records, tokens, private files — on device and must ensure confidentiality even if the device is physically compromised. It also applies when you need authenticated encryption, key-wrapping for server payloads, or are removing a dependency on the now-deprecated `androidx.security:security-crypto` library.

Do **not** use Android Keystore for large-scale server-side encryption or high-throughput bulk encryption of data that never touches the device's TEE.

---

## Core guidance

### Key generation

- Use `KeyPairGenerator` or `KeyGenerator` routed through the `"AndroidKeyStore"` provider — never generate raw keys in memory and persist them yourself.
- Prefer **AES-256-GCM** for symmetric encryption at rest; it provides authenticated encryption so you get confidentiality and integrity in one pass.
- Use **RSA-OAEP-SHA256** only when you must encrypt a small payload asymmetrically (e.g., wrapping a session key) — RSA is not suitable for bulk data.
- Set `KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT` — do not grant unused purposes.
- Enable `setUserAuthenticationRequired(true)` for keys protecting highly sensitive data; pair with a `BiometricPrompt` unlock step.
- Set `.setBlockModes(KeyProperties.BLOCK_MODE_GCM)` and `.setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)` for AES-GCM — any other combo silently weakens the scheme.

### Hardware backing and StrongBox

- Check `KeyInfo.isInsideSecureHardware()` (API 23+) after key generation to confirm the key lives in the TEE.
- Opt into StrongBox (dedicated security chip, Pixel 3+) via `.setIsStrongBoxBacked(true)` inside `KeyGenParameterSpec.Builder`; catch `StrongBoxUnavailableException` and fall back to TEE-backed generation.
- StrongBox currently supports AES-128/256-GCM, HMAC-SHA256, EC P-256, and RSA-2048 — stay within this set.

### Encrypt and decrypt

- Never reuse an IV/nonce. For AES-GCM, let the `Cipher` auto-generate the IV (`cipher.iv` after `init(ENCRYPT_MODE, key)`), then prepend it to the ciphertext before storage.
- Store the IV alongside the ciphertext — it is not secret, but it is required for decryption.
- The GCM authentication tag (default 128 bits) is appended automatically; do not strip it.
- Always call `cipher.doFinal()` — partial updates via `update()` defer authentication until `doFinal()`.

### Migration from `security-crypto`

- `EncryptedSharedPreferences` and `EncryptedFile` from `androidx.security:security-crypto` are deprecated as of 2024 and should not be used in new code.
- Migration path: decrypt existing data with the old library in a one-time migration step, re-encrypt with direct Keystore + AES-GCM code, then remove the dependency.
- The old library wrapped keys in a Google Tink keyset stored in SharedPreferences — the underlying AES-256-GCM algorithm is the same, so plaintext migration is straightforward.

### Canonical snippet — symmetric encrypt/decrypt with AES-256-GCM

```kotlin
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

private const val KEY_ALIAS = "my_app_data_key"
private const val KEYSTORE_PROVIDER = "AndroidKeyStore"
private const val TRANSFORMATION = "AES/GCM/NoPadding"
private const val GCM_TAG_LENGTH = 128

fun getOrCreateKey(): SecretKey {
    val keyStore = KeyStore.getInstance(KEYSTORE_PROVIDER).apply { load(null) }
    keyStore.getKey(KEY_ALIAS, null)?.let { return it as SecretKey }

    val spec = KeyGenParameterSpec.Builder(
        KEY_ALIAS,
        KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
    )
        .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
        .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
        .setKeySize(256)
        // Uncomment to require biometric auth before each use:
        // .setUserAuthenticationRequired(true)
        // .setUserAuthenticationParameters(0, KeyProperties.AUTH_BIOMETRIC_STRONG)
        .build()

    return KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, KEYSTORE_PROVIDER)
        .apply { init(spec) }
        .generateKey()
}

/** Returns iv + ciphertext concatenated. */
fun encrypt(plaintext: ByteArray): ByteArray {
    val cipher = Cipher.getInstance(TRANSFORMATION).apply {
        init(Cipher.ENCRYPT_MODE, getOrCreateKey())
    }
    val ciphertext = cipher.doFinal(plaintext)
    // Prepend 12-byte IV so decryption is self-contained.
    return cipher.iv + ciphertext
}

/** Expects the format produced by [encrypt]. */
fun decrypt(ivAndCiphertext: ByteArray): ByteArray {
    val iv = ivAndCiphertext.copyOfRange(0, 12)
    val ciphertext = ivAndCiphertext.copyOfRange(12, ivAndCiphertext.size)
    val spec = GCMParameterSpec(GCM_TAG_LENGTH, iv)
    val cipher = Cipher.getInstance(TRANSFORMATION).apply {
        init(Cipher.DECRYPT_MODE, getOrCreateKey(), spec)
    }
    return cipher.doFinal(ciphertext)
}
```

### File encryption

- For large files, wrap a `CipherOutputStream` around a `FileOutputStream`; flush and close before reading back.
- Do not load entire file contents into a `ByteArray` before encrypting — stream it to avoid OOM on large-screen devices handling documents or video.
- Store the IV in a small sidecar file or as a fixed-length header (first 12 bytes) within the encrypted file.

### Algorithm selection reference

| Use case | Algorithm | Notes |
|---|---|---|
| General at-rest encryption | AES-256-GCM | Authenticated; preferred |
| Key wrapping / asymmetric | RSA-OAEP / SHA-256 | Small payloads only |
| Message authentication | HMAC-SHA256 | When separate MAC is required |
| Key agreement | ECDH P-256 | For deriving shared secrets |

---

## Platform notes

- **API 23 (Android 6.0)** introduced `KeyGenParameterSpec`; this is the minimum for the pattern shown above. The skill's `requires.android: "16"` is the project minimum but key-backed encryption should be gated at runtime.
- **API 28 (Android 9)** added StrongBox; gate with `packageManager.hasSystemFeature(PackageManager.FEATURE_STRONGBOX_KEYSTORE)`.
- **API 30+** — `KeyInfo.getSecurityLevel()` is preferred over the deprecated `isInsideSecureHardware()`; emit `KeyProperties.SECURITY_LEVEL_TRUSTED_ENVIRONMENT` or `SECURITY_LEVEL_STRONGBOX`.
- On **large-screen / multi-window** devices the app can be backgrounded mid-operation; hold the `SecretKey` reference only for the duration of a single encrypt/decrypt call, not across the lifecycle.
- **Foldables and ChromeOS** do not change the Keystore API surface, but a hardware security chip may not be present on all form factors — always handle `StrongBoxUnavailableException`.

---

## Pitfalls

- **Reusing an IV** with AES-GCM is catastrophic — two ciphertexts encrypted under the same key + IV can be combined to reveal both plaintexts. Always use the auto-generated IV from `Cipher.init`.
- **ECB mode** has no IV and produces deterministic ciphertext; never use `AES/ECB/PKCS5Padding` for anything beyond test scaffolding.
- **Catching `InvalidKeyException` silently** hides key invalidation events. When the user removes their screen lock, biometric-gated keys are permanently deleted — handle `KeyPermanentlyInvalidatedException` by regenerating the key and prompting the user to re-authenticate.
- **Storing raw keys in SharedPreferences or files** instead of the Keystore defeats the security model entirely.
- **Using `security-crypto` (`EncryptedSharedPreferences`)** in new projects pulls in a deprecated dependency and introduces indirect Tink keyset management complexity.
- **Blocking the main thread** — Keystore operations, especially on StrongBox, can take hundreds of milliseconds. Always dispatch to `Dispatchers.IO`.
- **Not verifying hardware backing** — generating a key without confirming `isInsideSecureHardware()` or `getSecurityLevel()` means you may be relying on software-only storage without knowing it.
- **Truncating the GCM tag** — the `GCMParameterSpec` tag length must be 128 bits for decryption to match encryption; mismatched tags cause `AEADBadTagException` at runtime.

---

## References

- **Documentation:** [Android Cryptography](https://developer.android.com/privacy-and-security/cryptography)
- **Documentation:** [Android Keystore System](https://developer.android.com/privacy-and-security/keystore)

---

## See also

The `keychain-security` skill (Apple) covers the analogous iOS/macOS secure enclave pattern. For secrets that must survive app reinstall or transfer between devices, pair this skill with `cloudkit` (iOS) or a server-side key management service. For biometric-gated key unlock flows, see the `sign-in-with-apple` and `healthkit` skills for examples of user-authentication-required key patterns. When encrypting network payloads rather than at-rest data, consult the `networking-layer` and `network-framework` skills instead.
