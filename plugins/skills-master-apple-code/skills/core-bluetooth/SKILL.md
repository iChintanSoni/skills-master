---
name: core-bluetooth
description: "Guidance for Bluetooth Low Energy with Core Bluetooth: CBCentralManager scanning and connecting, service/characteristic discovery, read/write/notify, the CBPeripheralManager peripheral role, and background state restoration. Use when scanning for or connecting to BLE devices, building a GATT peripheral, streaming notifications, running Bluetooth in the background, or fixing missing Bluetooth permission prompts."
---

## When to use

Reach for Core Bluetooth when your app talks directly to Bluetooth Low Energy (BLE) hardware: heart-rate straps, sensors, beacons, custom accessories, or another iPhone acting as a peripheral. Use the **central** role to scan, connect, and consume a remote device's GATT services. Use the **peripheral** role (`CBPeripheralManager`) to publish your own services and serve data to connected centrals. If you only need pairing-free proximity ranging, prefer Nearby Interaction instead; for streaming audio, use the standard system audio routes rather than raw GATT.

## Core guidance

- **Do** check `centralManager.state == .poweredOn` before any operation. The manager starts in `.unknown`; act only after `centralManagerDidUpdateState(_:)` reports `.poweredOn`, and handle `.unauthorized` / `.poweredOff` gracefully.
- **Do** filter scans by service UUID — pass an explicit array to `scanForPeripherals(withServices:options:)` and stop scanning the moment you find your target. Open-ended scans drain the battery and need the device on screen.
- **Do** hold a strong reference to every `CBPeripheral` you intend to connect; the central manager keeps only weak references, so an unretained peripheral is silently deallocated and the connection drops.
- **Don't** assume discovery is synchronous. `discoverServices(_:)` → `discoverCharacteristics(_:for:)` → read/write each completes via delegate callbacks; chain them, never poll.
- **Don't** flood `writeValue(_:for:type:)` with `.withResponse` writes — pace them on `peripheral(_:didWriteValueFor:error:)`. For `.withoutResponse`, wait for `peripheralIsReady(toSendWriteWithoutResponse:)` to avoid dropping packets.
- **Prefer** `setNotifyValue(true, for:)` over polling for changing values; updates arrive in `peripheral(_:didUpdateValueFor:error:)`.
- **Always** add the `NSBluetoothAlwaysUsageDescription` Info.plist string — the first BLE call triggers the permission prompt, and a missing key crashes the app.

```swift
func centralManager(_ central: CBCentralManager,
                    didDiscover peripheral: CBPeripheral,
                    advertisementData: [String: Any], rssi RSSI: NSNumber) {
    discovered = peripheral          // retain before connecting
    peripheral.delegate = self
    central.stopScan()
    central.connect(peripheral, options: nil)
}
```

## Platform notes

- **Background:** add `bluetooth-central` and/or `bluetooth-peripheral` to `UIBackgroundModes`. For relaunch after termination, opt into state restoration by passing `CBCentralManagerOptionRestoreIdentifierKey` (a stable string) at init and implementing `centralManager(_:willRestoreState:)`. Backgrounded scans are throttled, coalesced, and ignore the `CBCentralManagerScanOptionAllowDuplicatesKey` option.
- **watchOS:** background BLE wake-ups (notifications, background scans for complication updates) require Apple Watch Series 6 or later; design around short, session-based bursts since you get only a brief window to finish work.
- **macOS / Mac Catalyst:** sandboxed Mac apps must enable the Bluetooth capability entitlement in addition to the usage string.
- **visionOS / tvOS:** the central role is supported; the peripheral role and accessory-pairing UX differ, so verify availability of advertising APIs on your target.

## Pitfalls

- **Missing usage string** → immediate crash on the first manager method. Set `NSBluetoothAlwaysUsageDescription` even for the central-only role.
- **UUID surprises:** iOS does not expose a device's MAC address; the `CBPeripheral.identifier` is a per-app, per-device UUID and changes if the app reinstalls or moves to another device.
- **Restoration without re-init:** on relaunch you must recreate the manager with the *same* restore identifier before the system can hand back the restored state, otherwise restoration never fires.
- **MTU assumptions:** never hard-code payload size. Read `maximumWriteValueLength(for:)` and chunk larger transfers; the negotiated ATT MTU varies by device.
- **Duplicate connect calls:** calling `connect` on an already-connecting peripheral can leave it stuck. Track state and cancel with `cancelPeripheralConnection(_:)` before retrying.

## References

- **Documentation:** [Core Bluetooth](https://developer.apple.com/documentation/corebluetooth)
- **Documentation:** [CBCentralManager](https://developer.apple.com/documentation/corebluetooth/cbcentralmanager)
- **Documentation:** [CBPeripheralManager](https://developer.apple.com/documentation/corebluetooth/cbperipheralmanager)
- **Documentation:** [NSBluetoothAlwaysUsageDescription](https://developer.apple.com/documentation/BundleResources/Information-Property-List/NSBluetoothAlwaysUsageDescription)
- **WWDC:** [Get timely alerts from Bluetooth devices on watchOS (WWDC22)](https://developer.apple.com/videos/play/wwdc2022/10135/)
- **Sample Code:** [Transferring Data Between Bluetooth Low Energy Devices](https://developer.apple.com/documentation/corebluetooth/transferring-data-between-bluetooth-low-energy-devices)

## See also

For pairing-free, ranging-style proximity between nearby devices, see a **nearby-interaction** skill rather than raw GATT. When surfacing background BLE events to the user, pair this with a **user-notifications** skill to post local alerts on wake-up, and a **swiftui-concurrency** skill to bridge delegate callbacks into async streams for your view models. For accessory setup flows on iOS, a **accessory-setup-kit** skill covers the modern pairing UI.
