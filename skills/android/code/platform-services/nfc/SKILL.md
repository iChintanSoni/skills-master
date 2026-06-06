---
name: nfc
description: Covers NFC tag reading and writing, NDEF data handling, the tag dispatch system, foreground dispatch, and Host Card Emulation (HCE) basics for Android apps. Use when building features that read or write NFC tags, emulate smart cards, or need to intercept NFC intents in the foreground.
globs:
  - "**/*.kt"
tags: [nfc, ndef, hce, connectivity, platform-services]
x-skills-master:
  domain: android
  class: code
  category: platform-services
  platforms: ["android", "large-screen"]
  requires: {android: "16", kotlin: "2.2"}
  pairs_with: []
  sources:
    - https://developer.android.com/develop/connectivity/nfc
    - https://developer.android.com/develop/connectivity/nfc/nfc
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Apply this skill when your app needs to:

- Read NDEF-formatted data from NFC tags (URL, text, MIME type records).
- Write NDEF records back to a writable tag.
- Intercept NFC intents while your activity is in the foreground, preventing the system from launching another app.
- Emulate an NFC smart card so a reader terminal can communicate with your app via Host Card Emulation (HCE).

## Core guidance

### Manifest setup

Declare the `NFC` permission and the `<uses-feature>` element. Mark the feature as required only when your app truly cannot function without NFC hardware.

```xml
<uses-permission android:name="android.permission.NFC" />
<uses-feature android:name="android.hardware.nfc" android:required="false" />
```

Filter intents in your activity (or use foreground dispatch instead):

```xml
<intent-filter>
    <action android:name="android.nfc.action.NDEF_DISCOVERED" />
    <category android:name="android.intent.category.DEFAULT" />
    <data android:scheme="https" android:host="example.com" />
</intent-filter>
```

Priority order the system applies: `NDEF_DISCOVERED` > `TECH_DISCOVERED` > `TAG_DISCOVERED`.

### Runtime guard

```kotlin
val nfcAdapter: NfcAdapter? = NfcAdapter.getDefaultAdapter(context)

fun isNfcAvailable(): Boolean = nfcAdapter != null
fun isNfcEnabled(): Boolean = nfcAdapter?.isEnabled == true
```

Always handle `null` (device has no NFC) and `isEnabled == false` (user disabled NFC) as distinct cases and guide the user to Settings when appropriate.

### Foreground dispatch

Foreground dispatch lets your foreground activity claim NFC intents before the tag dispatch system routes them elsewhere. Register in `onResume`, unregister in `onPause` — never in `onCreate`/`onDestroy`.

```kotlin
class NfcActivity : AppCompatActivity() {
    private lateinit var nfcAdapter: NfcAdapter
    private lateinit var pendingIntent: PendingIntent
    private lateinit var intentFilters: Array<IntentFilter>

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        nfcAdapter = NfcAdapter.getDefaultAdapter(this)
            ?: return  // no NFC hardware

        val intent = Intent(this, javaClass).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
        pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_MUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        intentFilters = arrayOf(IntentFilter(NfcAdapter.ACTION_NDEF_DISCOVERED))
    }

    override fun onResume() {
        super.onResume()
        nfcAdapter.enableForegroundDispatch(this, pendingIntent, intentFilters, null)
    }

    override fun onPause() {
        super.onPause()
        nfcAdapter.disableForegroundDispatch(this)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        if (intent.action == NfcAdapter.ACTION_NDEF_DISCOVERED) {
            handleNdefIntent(intent)
        }
    }
}
```

### Reading NDEF tags

```kotlin
fun handleNdefIntent(intent: Intent) {
    val rawMessages = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        intent.getParcelableArrayExtra(NfcAdapter.EXTRA_NDEF_MESSAGES, NdefMessage::class.java)
    } else {
        @Suppress("DEPRECATION")
        intent.getParcelableArrayExtra(NfcAdapter.EXTRA_NDEF_MESSAGES)
            ?.map { it as NdefMessage }?.toTypedArray()
    } ?: return

    for (message in rawMessages) {
        for (record in message.records) {
            val payload = record.payload
            // TNF_WELL_KNOWN + RTD_TEXT: first byte is status, rest is text
            if (record.tnf == NdefRecord.TNF_WELL_KNOWN &&
                record.type.contentEquals(NdefRecord.RTD_TEXT)
            ) {
                val langCodeLen = payload[0].toInt() and 0x3F
                val text = String(payload, 1 + langCodeLen, payload.size - 1 - langCodeLen, Charsets.UTF_8)
                // use text …
            }
        }
    }
}
```

### Writing NDEF tags

Always write on a background coroutine — I/O operations on NFC tags block the calling thread.

```kotlin
suspend fun writeTextToTag(tag: Tag, text: String) = withContext(Dispatchers.IO) {
    val record = NdefRecord.createTextRecord("en", text)
    val message = NdefMessage(record)
    val ndef = Ndef.get(tag) ?: error("Tag does not support NDEF")
    ndef.connect()
    try {
        check(ndef.isWritable) { "Tag is read-only" }
        check(ndef.maxSize >= message.byteArrayLength) { "Tag too small" }
        ndef.writeNdefMessage(message)
    } finally {
        ndef.close()
    }
}
```

Use `NdefFormatable.get(tag)` for unformatted tags that support NDEF formatting before writing for the first time.

### Host Card Emulation (HCE)

HCE lets your app respond to NFC readers as if it were a contactless smart card without needing a secure element.

1. Extend `HostApduService` and declare it in the manifest:

```xml
<service
    android:name=".MyHceService"
    android:exported="true"
    android:permission="android.permission.BIND_NFC_SERVICE">
    <intent-filter>
        <action android:name="android.nfc.cardemulation.action.HOST_APDU_SERVICE" />
        <category android:name="android.intent.category.DEFAULT" />
    </intent-filter>
    <meta-data
        android:name="android.nfc.cardemulation.host_apdu_service"
        android:resource="@xml/apduservice" />
</service>
```

2. Provide the AID list in `res/xml/apduservice.xml`:

```xml
<host-apdu-service xmlns:android="http://schemas.android.com/apk/res/android"
    android:description="@string/hce_service_description"
    android:requireDeviceUnlock="false">
    <aid-group android:description="@string/hce_aid_group" android:category="other">
        <aid-filter android:name="F0010203040506" />
    </aid-group>
</host-apdu-service>
```

3. Implement the service:

```kotlin
class MyHceService : HostApduService() {
    override fun processCommandApdu(apdu: ByteArray, extras: Bundle?): ByteArray {
        // SELECT AID command: return a success response
        return byteArrayOf(0x90.toByte(), 0x00)
    }

    override fun onDeactivated(reason: Int) {
        // reason: DEACTIVATION_LINK_LOSS or DEACTIVATION_DESELECTED
    }
}
```

### Do / Don't

- **Do** check `NfcAdapter.getDefaultAdapter(context) != null` before any NFC usage.
- **Do** use foreground dispatch when the tag interaction is tied to a specific screen.
- **Do** offload all tag I/O to `Dispatchers.IO`.
- **Do** close the `Ndef` connection in a `finally` block.
- **Don't** register foreground dispatch in `onStart`/`onStop`; the window must match the visible lifecycle precisely.
- **Don't** assume the tag is writable; check `ndef.isWritable` before calling `writeNdefMessage`.
- **Don't** use `FLAG_IMMUTABLE` on the `PendingIntent` passed to `enableForegroundDispatch` — the system must mutate it.
- **Don't** expose HCE services without declaring a sensible AID group; overlapping AIDs with payment apps will cause conflicts.

## Platform notes

- **Large screens / foldables** — NFC hardware is typically present but the antenna may be located on the hinge side of the device. When the device is fully unfolded (display-fold open), advise users to tap on the rear center. Foreground dispatch behaves identically across form factors.
- **Android 14+** — Use the typed `getParcelableArrayExtra(key, Class)` overload to avoid deprecation warnings. The older untyped overload still works but emits lint warnings.
- **Android 13 (API 33)+** — `PendingIntent.FLAG_MUTABLE` is required for intents passed to `enableForegroundDispatch`; include it explicitly.
- **NFC Reader Mode** (`enableReaderMode`) — an alternative to foreground dispatch that is better for reading tags in a polling loop or dedicated reader UI. It suspends the tag dispatch system entirely and delivers tags directly to a callback on a background thread.
- **Secure Element vs HCE** — HCE is software-only and suitable for loyalty, access, or custom protocols. Payment AIDs (e.g., Visa, Mastercard) require device certification and cannot be emulated by third-party apps using HCE.

## Pitfalls

- **Forgetting to unregister foreground dispatch** — leaks cause tags to be delivered to a paused activity and can crash the app when the activity is not in a resumed state.
- **Blocking the main thread** — NFC tag operations (connect, read, write) throw `IOException` and block. Move all tag I/O off the main thread.
- **Treating all tags as NDEF** — raw `Tag` objects delivered via `TAG_DISCOVERED` may not carry NDEF data. Always null-check `Ndef.get(tag)` before proceeding.
- **Writing to read-only or undersized tags** — check `ndef.isWritable` and compare `message.byteArrayLength` with `ndef.maxSize` before writing, or handle `TagLostException` gracefully.
- **AID conflicts in HCE** — if multiple installed apps register the same AID, the OS prompts the user to choose. Use uncommon proprietary AIDs for non-payment use cases.
- **NFC disabled at runtime** — the user can toggle NFC in Quick Settings at any time. Register a `BroadcastReceiver` for `NfcAdapter.ACTION_ADAPTER_STATE_CHANGED` to reactively update your UI.
- **Missing `BIND_NFC_SERVICE` permission on HCE service** — without this, the system will not bind to the service, and card emulation silently fails.

## References

- **Documentation:** [NFC overview](https://developer.android.com/develop/connectivity/nfc)
- **Documentation:** [NFC basics — NDEF and tag dispatch](https://developer.android.com/develop/connectivity/nfc/nfc)

## See also

Pair this skill with `bluetooth-le` for proximity-triggered workflows that combine short-range radio technologies. For credential and payment flows, see `security-crypto` for protecting data before writing it to a tag or exchanging it over HCE. For Compose UI integration around NFC scan results, see `swiftui-state-data-flow` equivalent patterns in `state-hoisting` or `viewmodel-stateflow`.
