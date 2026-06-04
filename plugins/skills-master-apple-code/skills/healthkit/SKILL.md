---
name: healthkit
description: Guidance for reading and writing Health data with HealthKit using modern async query descriptors, authorization, and background delivery. Use when an app requests Health permissions, queries samples or statistics, writes workouts, observes background updates, or runs watchOS/iOS workout sessions.
---

## When to use

Reach for this skill when your app stores or reads personal health and fitness data through the system Health database. Typical cases: charting daily step or energy totals, logging a workout, mirroring sensor data from external devices, keeping a local copy in sync as the user records data elsewhere, or driving a watchOS activity session. HealthKit is unavailable on Mac (outside Mac Catalyst with Apple silicon) and absent on iPad before recent releases, so always feature-detect rather than assuming a single store exists.

## Core guidance

- **Do** gate everything on availability: call `HKHealthStore.isHealthDataAvailable()` before constructing a store. Create exactly one `HKHealthStore` and keep it alive for the app's lifetime.
- **Do** request authorization with the async `requestAuthorization(toShare:read:)`. Pass complete `Set<HKSampleType>` values; request only what you use, and re-request when adding new types since the sheet appears once per type.
- **Don't** treat a granted prompt as read access. For privacy, the API never reveals whether a read was denied — a denied read type returns the same empty results as a type with no data. Design queries to tolerate emptiness instead of probing authorization. `authorizationStatus(for:)` reflects only *write* (share) state.
- **Do** prefer the descriptor query family over legacy `HK*Query` callbacks: `HKSampleQueryDescriptor` for raw samples, `HKStatisticsCollectionQueryDescriptor` for bucketed sums/averages, and `HKAnchoredObjectQueryDescriptor` whose `results(for:)` yields a long-lived `AsyncSequence` of incremental adds/deletes.
- **Do** build predicates with the type-safe `HKQuery.predicateForSamples(...)` / `HKSamplePredicate` helpers and wrap mutations in `try await store.save(_:)`. Quantities carry an explicit `HKUnit`; never assume a default unit.
- **Don't** poll. For live sync, persist the anchor returned by the anchored query and resume from it; for wake-from-background, pair an `HKObserverQuery` with `enableBackgroundDelivery(for:frequency:)` and call its completion handler or HealthKit backs off and stops delivering.
- **Do** save workouts through `HKWorkoutBuilder` (or `HKLiveWorkoutBuilder` on watchOS) so Activity rings update correctly; don't construct bare `HKWorkout` objects.

```swift
let steps = HKQuantityType(.stepCount)
let predicate = HKSamplePredicate.quantitySample(
    type: steps,
    predicate: HKQuery.predicateForSamples(withStart: start, end: end))
let descriptor = HKStatisticsCollectionQueryDescriptor(
    predicate: predicate, options: .cumulativeSum,
    anchorDate: start, intervalComponents: DateComponents(day: 1))
let collection = try await descriptor.result(for: store)   // bucketed daily totals
```

## Platform notes

- **iOS / iPadOS:** Add the HealthKit capability (`com.apple.developer.healthkit`) plus the `NSHealthShareUsageDescription` (read) and `NSHealthUpdateUsageDescription` (write) Info.plist strings; a missing string for a requested direction crashes on launch. Clinical record reads need the separate access entitlement. As of WWDC25, full workout sessions run on iPhone and iPad with code shared from watchOS.
- **watchOS:** Run an `HKWorkoutSession` with `HKLiveWorkoutBuilder` and an `HKLiveWorkoutDataSource` to collect sensor data and earn background runtime for the session's duration.
- **visionOS:** HealthKit reads/writes are supported but there are no on-device sensors; data originates from paired sources. Background delivery and workout sessions are not available.
- **Background delivery** requires the `com.apple.developer.healthkit.background-delivery` entitlement in addition to the base capability.

## Pitfalls

- Assuming empty results mean "no permission" — they may mean denied, undetermined, or genuinely no data. Re-prompting is harmless and is the only recovery path; deep-link to Settings for user-managed changes.
- Forgetting to call the observer-query completion handler, which throttles and then disables background delivery after repeated misses.
- Hardcoding units (e.g., reading a body-mass sample as kilograms when the user logged pounds); always convert via `HKUnit`.
- Requesting authorization for a type not declared, or writing without `NSHealthUpdateUsageDescription` present.
- Cross-actor misuse: mark Health-touching managers `@MainActor` or isolate the store, since callbacks and `Sendable` requirements bite under Swift 6 strict concurrency.

## References

- **Documentation:** [Setting up HealthKit](https://developer.apple.com/documentation/healthkit/setting-up-healthkit)
- **Documentation:** [HKSampleQueryDescriptor](https://developer.apple.com/documentation/healthkit/hksamplequerydescriptor)
- **Documentation:** [HKAnchoredObjectQueryDescriptor](https://developer.apple.com/documentation/healthkit/hkanchoredobjectquerydescriptor)
- **Documentation:** [HKWorkoutSession](https://developer.apple.com/documentation/healthkit/hkworkoutsession)
- **WWDC:** [Track workouts with HealthKit on iOS and iPadOS (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/322/)
- **Sample Code:** [Build a workout app for Apple Watch (SpeedySloth)](https://developer.apple.com/documentation/healthkit/workouts_and_activity_rings/speedysloth_creating_a_workout)

## See also

For collecting movement and orientation directly from device sensors rather than the Health database, pair this with a Core Motion skill. For surfacing health summaries on the home screen, combine with a WidgetKit skill (note widgets cannot prompt for Health authorization). For Swift 6 actor isolation and `Sendable` concerns that surface around the shared store, consult a Swift concurrency skill.
