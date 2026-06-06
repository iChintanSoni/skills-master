---
name: bluetooth-ble
description: Covers Android Bluetooth Low Energy — Android 12+ runtime permissions (BLUETOOTH_SCAN/CONNECT/ADVERTISE), scanning with BluetoothLeScanner, connecting as a GATT client, discovering services and characteristics, read/write/notify, connection lifecycle and reliability patterns, and an overview of the peripheral (advertiser) role. Use when scanning for BLE peripherals, connecting to GATT servers, streaming characteristic notifications, or advertising as a BLE peripheral on Android.
---

## When to use

Reach for the Android BLE APIs whenever your app communicates directly with Bluetooth Low Energy hardware — fitness trackers, heart-rate monitors, custom sensors, beacons, smart locks, or any accessory that exposes a GATT profile. Use the **central role** (`BluetoothLeScanner` + `BluetoothGatt`) to scan for and connect to peripherals. Use the **peripheral role** (`BluetoothLeAdvertiser` + `BluetoothGattServer`) to advertise your app's own services and respond to connected centrals. For higher-level peer-to-peer data transfer between Android and iOS devices, consider the Nearby Connections API instead of raw GATT; for audio streaming, use the platform audio stack.

## Core guidance

### Permissions (Android 12+)

- Declare `BLUETOOTH_SCAN` to scan for nearby devices. If your scan does not use results to derive physical location, add `android:usesPermissionFlags="neverForLocation"` to drop the location permission requirement.
- Declare `BLUETOOTH_CONNECT` to connect to a paired or discovered device and to query `BluetoothAdapter` state.
- Declare `BLUETOOTH_ADVERTISE` only when acting as a peripheral.
- On Android 11 and earlier, the legacy permissions are `BLUETOOTH` and `BLUETOOTH_ADMIN`, plus `ACCESS_FINE_LOCATION` (required to discover devices). Handle both permission sets with a `Build.VERSION.SDK_INT` check.
- Request permissions at runtime with `ActivityResultContracts.RequestMultiplePermissions` before any BLE operation — calling scan or connect without the grant throws `SecurityException`.

### Adapter and scanner setup

- Obtain `BluetoothAdapter` via `(getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager).adapter`. Never rely on `BluetoothAdapter.getDefaultAdapter()` (deprecated).
- Check `adapter.isEnabled` before proceeding. If Bluetooth is off, prompt the user with `Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE)` rather than enabling programmatically (the programmatic API is restricted on Android 13+).
- Filter scans by service UUID using `ScanFilter` — open-ended scans miss the `neverForLocation` exemption and drain battery faster.
- Stop scanning as soon as your target is found, or after a fixed timeout (30 s is a reasonable upper bound). Never leave a scan running while the app is backgrounded without a foreground service.

### Connecting as a GATT client

- Call `device.connectGatt(context, autoConnect = false, callback, BluetoothDevice.TRANSPORT_LE)`. Pass `autoConnect = false` for immediate connection; use `true` only when you want the OS to reconnect opportunistically (slower, background-friendly).
- Always supply `TRANSPORT_LE` explicitly — omitting it on dual-mode devices can inadvertently trigger a Classic BR/EDR connection.
- Perform **all** `BluetoothGatt` operations from within `BluetoothGattCallback` methods or serialised through a single coroutine/handler. The GATT stack is not thread-safe.
- After `onConnectionStateChange(CONNECTED)`, call `gatt.discoverServices()`. Do not read or write before `onServicesDiscovered(GATT_SUCCESS)`.

### Discovering services and characteristics

- Navigate the GATT table with `gatt.getService(serviceUuid)?.getCharacteristic(charUuid)`. Cache the `BluetoothGattCharacteristic` reference — do not call `getCharacteristic` inside every operation.
- Check `characteristic.properties` with bitwise AND before attempting an operation: `PROPERTY_READ`, `PROPERTY_WRITE`, `PROPERTY_WRITE_NO_RESPONSE`, `PROPERTY_NOTIFY`, `PROPERTY_INDICATE`.

### Read, write, and notify

- Issue **one** GATT operation at a time. Queue pending operations and dequeue on each callback. Flooding operations causes `GATT_FAILURE` (133) on many stacks.
- For writes, prefer `BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT` (with response); use `WRITE_TYPE_NO_RESPONSE` only for high-frequency streaming where you accept potential packet loss.
- To enable notifications, write `BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE` (or `ENABLE_INDICATION_VALUE`) to the Client Characteristic Configuration Descriptor (UUID `00002902-...`) **after** calling `gatt.setCharacteristicNotification(characteristic, true)`. Both steps are required.
- Updates arrive in `onCharacteristicChanged`. On API 33+, use the three-argument override that receives the value directly instead of reading `characteristic.value` (deprecated).

### Connection reliability

- `onConnectionStateChange(DISCONNECTED)` fires for both intentional and unexpected disconnections. Implement exponential back-off retry with a cap (e.g. 3 attempts, delays 1 s/2 s/4 s). After the cap, surface a UI error rather than looping indefinitely.
- On `GATT_FAILURE` (status 133): close the gatt with `gatt.close()`, wait ~500 ms, then re-call `device.connectGatt(...)`. This status is a catch-all for transport errors and stack resets.
- Call `gatt.close()` on every path that ends the session — both intentional disconnect (`gatt.disconnect()` → wait for callback → `gatt.close()`) and error paths. Leaking a `BluetoothGatt` instance exhausts the hardware connection pool (usually limited to ~7 active connections).

### MTU and payload size

- Request a larger MTU early: call `gatt.requestMtu(512)` after `onServicesDiscovered`. The negotiated value arrives in `onMtuChanged`.
- Never hard-code a payload size. Split writes larger than `(mtu - 3)` bytes into sequential chunks.

```kotlin
class BleGattCallback(
    private val onConnected: (BluetoothGatt) -> Unit,
    private val onData: (ByteArray) -> Unit,
) : BluetoothGattCallback() {

    override fun onConnectionStateChange(gatt: BluetoothGatt, status: Int, newState: Int) {
        if (newState == BluetoothProfile.STATE_CONNECTED) {
            gatt.discoverServices()
        } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
            gatt.close()
        }
    }

    override fun onServicesDiscovered(gatt: BluetoothGatt, status: Int) {
        if (status != BluetoothGatt.GATT_SUCCESS) { gatt.close(); return }
        gatt.requestMtu(512)
        onConnected(gatt)
    }

    override fun onMtuChanged(gatt: BluetoothGatt, mtu: Int, status: Int) {
        // store (mtu - 3) as max write payload
    }

    @Suppress("DEPRECATION")
    override fun onCharacteristicChanged(
        gatt: BluetoothGatt,
        characteristic: BluetoothGattCharacteristic,
        value: ByteArray,             // API 33+ — value passed directly
    ) {
        onData(value)
    }
}
```

### Peripheral role

- Obtain `BluetoothLeAdvertiser` via `adapter.bluetoothLeAdvertiser` — null if the hardware does not support advertising.
- Build `AdvertiseSettings` with `ADVERTISE_MODE_LOW_LATENCY` for fast discovery, `ADVERTISE_POWER_MEDIUM` for typical range, and set `connectable = true` if you host a `BluetoothGattServer`.
- Add the service UUID to `AdvertiseData` so centrals can filter-scan for it without scanning open-endedly.
- `BluetoothGattServer` responses (`sendResponse`) must be sent on a prompt path — the central has a short ATT timeout (~30 s). For long operations, queue processing off the callback thread and call `sendResponse` immediately with a partial result if needed.

### Coroutines and Flow integration

- Wrap the callback-heavy GATT API with `callbackFlow` or `suspendCancellableCoroutine` in a repository layer so ViewModels consume clean `Flow<BleEvent>` rather than raw callbacks.
- Collect the flow in a `ViewModel` using `viewModelScope.launch`; expose `StateFlow<UiState>` to Compose.
- Use `Dispatchers.IO` for blocking channel operations inside `callbackFlow`; GATT callbacks arrive on a Binder thread pool, not the main thread — never update Compose state directly from them.

## Platform notes

- **Android 12 (API 31):** `BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT`, and `BLUETOOTH_ADVERTISE` became mandatory runtime permissions. Apps targeting API 31+ that request only the legacy `BLUETOOTH`/`ACCESS_FINE_LOCATION` permissions will be denied by the permission checker.
- **Android 13 (API 33):** `BluetoothGattCallback.onCharacteristicChanged` gains a three-argument override receiving `value: ByteArray` directly, making the old `characteristic.value` field access obsolete. Target this override to avoid the deprecation.
- **Android 14+ (API 34):** Companion Device Manager associations can gate `BLUETOOTH_CONNECT` grants, enabling self-managed BLE connections that do not require the full permission and do not show a permission dialog for known companion devices.
- **Large-screen / foldables:** BLE is a radio capability independent of window size, but UX matters — scanning and pairing flows should use bottom sheets or dialogs sized for the expanded window class, not full-screen modals. Avoid starting scans from a composable that recomposes on orientation change; anchor the scan lifecycle in a ViewModel.
- **Background scanning:** requires a foreground service with `foregroundServiceType="connectedDevice"` on Android 10+. Without it, scans are batched or stopped when the app moves to background. Consider WorkManager with a periodic worker for low-frequency background checks instead of a persistent foreground service.

## Pitfalls

- **Status 133 (GATT_ERROR) on connect** — a catch-all transport error, usually triggered by a bonding cache mismatch or a prior `BluetoothGatt` instance that was not closed. Always call `gatt.close()` on every disconnect path and wait before reconnecting.
- **Missing CCD descriptor write** — calling `setCharacteristicNotification` alone does not enable notifications. You must also write `ENABLE_NOTIFICATION_VALUE` to the descriptor; skipping this step results in `onCharacteristicChanged` never firing.
- **Operations on the main thread** — `BluetoothGatt` operations are synchronous API calls that trigger asynchronous callbacks. Calling `gatt.readCharacteristic` on the main thread does not block, but issuing the next operation before the callback returns causes queue overflow. Serialise with a `Channel` or a coroutine `Mutex`.
- **Not closing gatt after disconnect** — each un-closed `BluetoothGatt` consumes one slot in the hardware connection pool. On devices with a pool of 7 or fewer, leaked instances silently prevent future connections system-wide.
- **Assuming `characteristic.value` is stable** — the field is overwritten on each callback. Copy the `ByteArray` before storing or processing it; do not hold a reference to `characteristic.value`.
- **Scanning without a ScanFilter** — open-ended scans on Android 8+ are rate-limited (five 30-second scan windows per 30-minute period) and trigger `SCAN_FAILED_APPLICATION_REGISTRATION_FAILED` (error 2) when the quota is exceeded. Always use `ScanFilter`.
- **Targeting `autoConnect = true` for initial connection** — the OS reconnect path is opportunistic and very slow (minutes, not seconds). Use `autoConnect = false` for the initial connect; switch to a reconnect strategy in `onConnectionStateChange` after the first successful session.
- **Requesting BLE permissions without checking Android version** — requesting `BLUETOOTH_SCAN`/`BLUETOOTH_CONNECT` on API < 31 returns `PERMISSION_DENIED` immediately. Guard permission requests with `if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S)`.

## References

- **Documentation:** [BLE overview — developer.android.com](https://developer.android.com/develop/connectivity/bluetooth/ble/ble-overview)
- **Documentation:** [Connect to a GATT server — developer.android.com](https://developer.android.com/develop/connectivity/bluetooth/ble/connect-gatt-server)
- **API reference:** [BluetoothGatt — developer.android.com](https://developer.android.com/reference/android/bluetooth/BluetoothGatt)

## See also

For wrapping callback-heavy APIs with coroutines and `callbackFlow`, see `kotlin-coroutines` and `kotlin-flow`. For managing BLE connection state in a Compose-aware ViewModel, see `viewmodel` and `state-flow`. For background BLE work that needs a foreground service, see `background-tasks`. For the companion device association flow that can reduce permission prompts on Android 14+, see `companion-device-manager`.
