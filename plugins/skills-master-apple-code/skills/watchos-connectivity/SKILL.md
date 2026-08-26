---
name: watchos-connectivity
description: Moves data between an iPhone app and its paired watchOS app with WatchConnectivity — WCSession activation and reachability, and choosing between application context, user info, file transfer, and live messages. Use when syncing state to or from Apple Watch, debugging a WCSession that never activates or is never reachable, handling background watch-connectivity wakes, or deciding whether an independent watch app should sync via CloudKit or your own server instead.
---

## When to use

Use this skill when an iPhone app and its paired watchOS app need to exchange data directly — settings, a small state snapshot, a queued event, a recorded audio file — especially when there may be no network. WatchConnectivity is a device-to-device transport between two halves of the *same* app; it is not a general sync engine and not a substitute for a backend.

Reach for it when `WCSession` never activates, when `isReachable` is always `false`, when transfers arrive minutes later than expected, or when you need to decide whether a piece of data belongs on this transport at all. The API is old (iOS 9 / watchOS 2), essentially unchanged, and entirely delegate-and-completion-handler based — which is where most of the modern trouble comes from.

## Core guidance

- **Activate once, early, on both sides.** On iOS, guard with `WCSession.isSupported()` (it is `false` on iPads and other non-pairing devices; on the watch a session is always available). Then set `WCSession.default.delegate` *before* calling `activate()`, and check `activationState == .activated` before any transfer — calling a transfer method on an inactive session is a programmer error, not a recoverable failure.
- **Implement the delegate methods the platform requires.** `session(_:activationDidCompleteWith:error:)` is required everywhere. `sessionDidBecomeInactive(_:)` and `sessionDidDeactivate(_:)` exist only on iOS and support switching between paired watches — in `sessionDidDeactivate` you must call `activate()` again to bind to the new watch.
- **Pick the channel by delivery semantics, not by convenience.**
  - `updateApplicationContext(_:)` — *latest state wins*. It replaces whatever was queued, works while the counterpart is unreachable, and arrives via `session(_:didReceiveApplicationContext:)` (or is readable later from `receivedApplicationContext`). This is the right default for settings and small snapshots. It `throws`, so wrap it in `try`.
  - `transferUserInfo(_:)` — *guaranteed and ordered*. Dictionaries queue up and are delivered FIFO, and the transfer continues even after the sending app suspends. Use it for discrete events that must all arrive. Track `outstandingUserInfoTransfers`, and handle `session(_:didFinish:error:)`.
  - `transferFile(_:metadata:)` — for anything that is not a small property list. The system throttles for power and performance; monitor `outstandingFileTransfers` and the returned `WCSessionFileTransfer`.
  - `sendMessage(_:replyHandler:errorHandler:)` / `sendMessageData(...)` — *live only*. It requires `isReachable`, and errors immediately otherwise. Use it for interactive request/response while both apps are up.
- **Understand what `isReachable` actually means.** From the watch it means the iPhone is in range and the counterpart can be woken. From iPhone it means a paired watch is in range *and* the watch app is already running in the foreground or with high priority (during a workout, or while a complication loads its initial timeline). Consequently `sendMessage` from the watch wakes the iOS app in the background; `sendMessage` from iOS does **not** wake the watch app. Never design a phone-initiated live handshake.
- **Move a received file synchronously or lose it.** `session(_:didReceive:)` hands you a `WCSessionFile` on a background thread, and the system deletes the file the moment your implementation returns. Copy or move it inside the method — do not dispatch the move onto another queue.
- **Handle the background wake properly.** A background transfer relaunches the watch app with a watch-connectivity background task (`WKWatchConnectivityRefreshBackgroundTask`, or SwiftUI's `.backgroundTask(.watchConnectivity)`). Activate the session, let the delegate deliver everything, and only mark the task complete once `hasContentPending` is `false` — finishing early drops the pending payload.
- **Send property-list types and keep payloads small.** Non-property-list values fail with `WCError.Code.payloadUnsupportedTypes`; oversized ones fail with `payloadTooLarge`. Encode your model to `Data` (Codable → JSON) and put that under one key rather than shipping a deep dictionary.
- **Bridge to Swift concurrency at the boundary.** There are no `async` variants. Wrap the session in a single small `@MainActor` (or actor-isolated) coordinator, keep the transferred model `Sendable`, and hop from the background delegate callbacks into it — do not scatter `WCSession.default` calls across view code.

```swift
final class WatchLink: NSObject, WCSessionDelegate {
    static let shared = WatchLink()

    func start() {
        guard WCSession.isSupported() else { return }
        let session = WCSession.default
        session.delegate = self
        session.activate()
    }

    func push(_ snapshot: Snapshot) throws {
        let payload = ["snapshot": try JSONEncoder().encode(snapshot)]
        try WCSession.default.updateApplicationContext(payload)   // latest wins
    }

    func session(_ session: WCSession, didReceiveApplicationContext context: [String: Any]) {
        guard let data = context["snapshot"] as? Data else { return }
        Task { @MainActor in await Store.shared.apply(data) }
    }

    func session(_ s: WCSession, activationDidCompleteWith state: WCSessionActivationState,
                 error: (any Error)?) {}
#if os(iOS)
    func sessionDidBecomeInactive(_ session: WCSession) {}
    func sessionDidDeactivate(_ session: WCSession) { session.activate() }  // rebind new watch
#endif
}
```

## Platform notes

- **iOS-side state you should branch on:** `isPaired`, `isWatchAppInstalled`, `isComplicationEnabled`, `watchDirectoryURL`, and `iOSDeviceNeedsUnlockAfterRebootForReachability`. Watch for changes via `sessionWatchStateDidChange(_:)`. On watchOS the mirror is `isCompanionAppInstalled` plus `sessionCompanionAppInstalledDidChange(_:)`.
- **Complication pushes are an iOS-only channel.** `transferCurrentComplicationUserInfo(_:)` exists only on iOS; you get 50 per day while your complication is on the active watch face (`remainingComplicationUserInfoTransfers`), and once that hits zero further calls silently degrade to an ordinary `transferUserInfo`.
- **Errors are a real API surface.** `WCError.Code` distinguishes `notReachable`, `deviceNotPaired`, `watchAppNotInstalled`, `companionAppNotInstalled`, `watchOnlyApp`, `sessionNotActivated`, `sessionInactive`, `messageReplyTimedOut`, `deliveryFailed`, `insufficientSpace`, and more. Branch on them instead of showing one generic failure.
- **Simulator does not implement the background transports.** `transferUserInfo`, `transferFile`, and the file-receipt delegate callback do not work there — test on a paired iPhone and Apple Watch, every time.
- **Independent watch apps must not depend on this.** Apple is explicit: an app that can install and run without its iPhone counterpart cannot use WatchConnectivity as its main data source. Sync through CloudKit or your own server, authenticate on the watch, and use push notifications directly to the watch. WatchConnectivity is then an optimization for when the phone happens to be nearby — never the only path.
- **Pairing setup.** A companion pair requires the watch target's `WKCompanionAppBundleIdentifier` to match the iOS app's bundle identifier, and the watch app and its widget extension to sit under that identifier. Share data onward to a complication through an App Group, not through another `WCSession`.

## Pitfalls

- Calling `activate()` before assigning the delegate, so the activation callback and any queued content are missed.
- Assuming `sendMessage` from iOS will wake the watch app. It will not — use `updateApplicationContext` or `transferUserInfo` for phone-initiated updates.
- Using `updateApplicationContext` for a stream of events: each call overwrites the last, so intermediate updates vanish. Use `transferUserInfo` when every item matters.
- Using `transferUserInfo` for high-frequency state: the FIFO queue backs up and the counterpart replays a long history on wake.
- Returning from `session(_:didReceive:)` before moving the file, and then wondering why the URL is dead.
- Calling `setTaskCompleted()` on the watch-connectivity background task before `hasContentPending` is `false`.
- Putting non-property-list values (custom classes, `Date` inside nested structures you did not check, `nil`) in a payload dictionary and getting `payloadUnsupportedTypes`.
- Forgetting `sessionDidDeactivate` → `activate()` on iOS, so the app stops talking to the watch after the wearer switches devices.
- Treating WatchConnectivity as a sync engine: it has no conflict resolution, no ordering guarantee across channels, and no history. Model your own idempotent merge.

## References

- **Documentation:** [Watch Connectivity](https://developer.apple.com/documentation/watchconnectivity)
- **Documentation:** [WCSession](https://developer.apple.com/documentation/watchconnectivity/wcsession)
- **Documentation:** [WCSessionDelegate](https://developer.apple.com/documentation/watchconnectivity/wcsessiondelegate)
- **Documentation:** [Creating independent watchOS apps](https://developer.apple.com/documentation/watchos-apps/creating-independent-watchos-apps)
- **Documentation:** [Background execution on watchOS](https://developer.apple.com/documentation/watchkit/background-execution)
- **Sample Code:** [Transferring data with Watch Connectivity](https://developer.apple.com/documentation/watchconnectivity/transferring-data-with-watch-connectivity)

## See also

Pair this with `watchos-app-structure` for the watch app's lifecycle, background tasks, and the independent-vs-companion decision this transport hinges on. When the watch app should own its own data, use the `cloudkit` skill or the `networking-layer` architecture skill instead of widening the WatchConnectivity payload. For pushing fresh values onto the watch face, combine with `watchos-complications`, and for the actor isolation the delegate callbacks force on you, see the `swift-concurrency` skill.
