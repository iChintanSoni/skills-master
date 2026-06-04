---
name: core-location
description: "Use when an app needs the user's geographic position, geofencing, or visit detection on Apple platforms. Triggers: requesting when-in-use vs always authorization, streaming positions with CLLocationUpdate.liveUpdates, CLServiceSession, one-shot fixes, CLMonitor geofences, significant-change or visit monitoring, reduced accuracy, and required Info.plist usage strings."
globs:
  - "**/*.swift"
tags: [corelocation, location, geofencing, authorization, privacy]
x-skills-master:
  domain: apple
  class: code
  category: app-services
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  requires:
    ios: "17"
    swift: "6.0"
  pairs_with: []
  sources:
    - https://developer.apple.com/documentation/corelocation/cllocationupdate
    - https://developer.apple.com/documentation/corelocation/clmonitor
    - https://developer.apple.com/documentation/corelocation/requesting-authorization-to-use-location-services
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for Core Location when a feature genuinely needs the device's physical position: showing the user on a map, sorting nearby results, geofencing, or detecting arrivals and departures. Prefer the modern async sequences (`CLLocationUpdate`, `CLMonitor`) for new code; fall back to `CLLocationManager` only for significant-change and visit monitoring, which have no async-sequence equivalent yet. If you only need a coarse region (weather, store locale), request reduced accuracy and never ask for `always`.

## Core guidance

- **Do** declare every usage string you reference: `NSLocationWhenInUseUsageDescription` for foreground access, and `NSLocationAlwaysAndWhenInUseUsageDescription` if you ever escalate to background. Missing keys silently suppress the prompt.
- **Do** let iteration drive authorization. Starting a `for await` loop over `liveUpdates(_:)` or `monitor.events` takes an implicit `CLServiceSession(authorization: .whenInUse)`; you often need no explicit `requestWhenInUseAuthorization()` call.
- **Don't** request `always` up front. Ask for when-in-use first; the system later offers the user a one-time upgrade prompt. Hold an explicit `CLServiceSession(authorization: .always)` only when a real background feature needs it.
- **Do** handle reduced accuracy: check `accuracyAuthorization`, and only call `requestTemporaryFullAccuracyAuthorization(withPurposeKey:)` when the user starts a task that needs precision. The key must match an entry in `NSLocationTemporaryUsageDescriptionDictionary`.
- **Don't** ignore diagnostics in the stream. Each `CLLocationUpdate` may carry `.location == nil` with flags like `.authorizationDenied`, `.locationUnavailable`, or `.accuracyLimited`; branch on them rather than force-unwrapping.
- **Do** keep a `CLBackgroundActivitySession` alive to let a when-in-use app keep receiving updates after backgrounding, and pair it with the location background mode. End it as soon as the task finishes.
- **Don't** add more than 20 `CLMonitor` conditions; extras report `.unmonitored`. Use a small radius only where Wi-Fi or cellular density makes it resolvable.

```swift
for try await update in CLLocationUpdate.liveUpdates() {
    if update.authorizationDenied { /* route to Settings */ break }
    guard let location = update.location else { continue }
    await render(location)              // ~1–2 fixes/sec in foreground
    if update.isStationary { break }    // stop when the user settles
}
```

## Platform notes

- **iOS / iPadOS / visionOS:** Full stack including `CLMonitor`, background sessions, and the temporary-full-accuracy prompt.
- **watchOS:** `liveUpdates` and one-shot fixes work; favor short sessions for battery, and prefer the workout APIs for continuous tracking.
- **macOS:** Authorization is granted per app in System Settings; there is no temporary precise-location prompt, so design around the user's standing choice.
- **tvOS:** Only coarse, when-in-use location is available; no background updates, monitoring, or visits.

## Pitfalls

- Setting `NSLocationRequireExplicitServiceSession` disables implicit sessions, so streams yield nothing until you create a `CLServiceSession` yourself. Add the key intentionally, not by habit.
- Geofence entry and exit events can be delayed or coalesced by the system; never treat a `CLMonitor` event as real-time, and always read `assuming:` correctly so the first event isn't dropped.
- `startMonitoringVisits()` is power-efficient but unpredictable; expect minutes-to-hours latency and design copy and retries accordingly.
- Reading `update.location` without checking `accuracyLimited` can surface a multi-kilometer fix as if it were precise. Gate precision-dependent UI on `accuracyAuthorization == .fullAccuracy`.
- A `CLBackgroundActivitySession` that you never invalidate keeps the status-bar indicator and drains battery; tie its lifetime to the task.

## References

- **Documentation:** [CLLocationUpdate](https://developer.apple.com/documentation/corelocation/cllocationupdate)
- **Documentation:** [CLMonitor](https://developer.apple.com/documentation/corelocation/clmonitor)
- **Documentation:** [Requesting authorization to use location services](https://developer.apple.com/documentation/corelocation/requesting-authorization-to-use-location-services)
- **WWDC:** [Discover streamlined location updates (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10180/)
- **WWDC:** [What's new in location authorization (WWDC24)](https://developer.apple.com/videos/play/wwdc2024/10212/)
- **Human Interface Guidelines:** [Privacy](https://developer.apple.com/design/human-interface-guidelines/privacy)

## See also

For drawing the resulting coordinates, pair this with a MapKit skill (annotations, camera, and user-location display). When location drives background delivery to a server, coordinate with a background-tasks skill for scheduling and a networking skill for resilient uploads. For asking nicely, a permissions-and-privacy skill covers prompt timing and pre-permission framing.
