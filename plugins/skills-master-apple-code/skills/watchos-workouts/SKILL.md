---
name: watchos-workouts
description: Runs HealthKit workout sessions on Apple Watch — HKWorkoutSession lifecycle, HKLiveWorkoutBuilder and HKLiveWorkoutDataSource, background runtime and the workout-processing mode, live heart-rate and energy statistics, water lock, mirrored sessions on iPhone, crash recovery, and workout zones. Use when building a fitness app for the watch, starting or ending a workout session, reading live sensor statistics during a workout, or adopting the workout zone APIs.
---

## When to use

Use this skill when an Apple Watch app records activity as a real HealthKit workout: running, cycling, swimming, strength training, or anything that should tune the watch's sensors, earn background runtime, credit the Activity rings, and land in the Health app afterwards. It covers the full `HKWorkoutSession` lifecycle and the live builder that turns it into a saved `HKWorkout`.

It assumes the HealthKit basics — store setup, authorization, queries, units — from the HealthKit skill, and adds what only matters on the wrist: the session/builder/data-source triangle, the background-mode plumbing, water lock, mirroring to iPhone, recovery after a crash, and the zone APIs. Reach for it when a workout app records nothing, drains the battery, gets suspended mid-run, or needs live heart-rate zones.

## Core guidance

- **Configure once, and reuse the configuration.** Build an `HKWorkoutConfiguration` with `activityType`, `locationType`, and — for swimming — `swimmingLocationType` and `lapLength`. Pass the *same* configuration object to both `HKWorkoutSession(healthStore:configuration:)` (which throws on an invalid configuration) and `HKLiveWorkoutDataSource(healthStore:workoutConfiguration:)`, so the sensors and the calorimetry agree.
- **Wire the triangle: session → builder → data source.** Get the builder with `session.associatedWorkoutBuilder()`, assign `builder.dataSource = HKLiveWorkoutDataSource(...)`, then set `session.delegate` and `builder.delegate`. Without a live data source the builder collects nothing and you save an empty workout.
- **Follow the lifecycle in order.** Optionally `prepare()` to warm the sensors while the wearer is still choosing; then `session.startActivity(with: date)` and `builder.beginCollection(at: date)`. To finish, Apple's documented order is `session.stopActivity(with: date)`, wait for the delegate to report `HKWorkoutSessionState.stopped`, then `builder.endCollection(at:)` (sets the end date and deactivates the builder) and `builder.finishWorkout()` (saves it), and finally `session.end()`. Skipping the builder calls throws the workout away.
- **Read live numbers from the builder, not from queries.** In `workoutBuilder(_:didCollectDataOf:)`, call `builder.statistics(for:)` for each collected `HKQuantityType` to get sum/average/min/max, and read `builder.elapsedTime` for the clock. Do not spin up parallel `HKAnchoredObjectQuery` work for data the builder is already collecting.
- **Both delegates arrive off the main actor.** `HKWorkoutSessionDelegate` methods are documented as running on an anonymous serial background queue, and all of them are required. Under Swift 6, hop explicitly to `@MainActor` before touching view state and keep the model you publish `Sendable` — this is the single most common source of concurrency errors in watch fitness apps.
- **Earn background runtime the supported way.** Enable the Background Modes capability with `workout-processing` in `WKBackgroundModes`; add `audio` as well if you play coaching clips or haptics. An active session keeps the app running when the wrist drops, keeps sensor data flowing, and lets the app alert the wearer — but the system still suspends apps that burn CPU in the background, so throttle UI work and drop sub-second updates once the display dims.
- **Enable water lock for water activities, and expect to never turn it off.** `WKInterfaceDevice.current().enableWaterLock()` (watchOS 6.1+) must be called on the main thread, while the app is in the foreground with an active workout or location session, and only when `waterResistanceRating` indicates support. There is no programmatic unlock — the wearer turns the crown.
- **Recover, don't restart.** If the app crashes mid-workout, watchOS calls the delegate's `handleActiveWorkoutRecovery()` on relaunch. Call `healthStore.recoverActiveWorkoutSession()` from there, then re-attach the builder, data source, and both delegates before touching any UI.

```swift
let config = HKWorkoutConfiguration()
config.activityType = .running
config.locationType = .outdoor

let session = try HKWorkoutSession(healthStore: store, configuration: config)
let builder = session.associatedWorkoutBuilder()
builder.dataSource = HKLiveWorkoutDataSource(healthStore: store, workoutConfiguration: config)
session.delegate = self
builder.delegate = self

let start = Date()
session.startActivity(with: start)
try await builder.beginCollection(at: start)
```

### watchOS 27 (WWDC 2026)

- Workout zones are now system data rather than app math. HealthKit calculates time in zone automatically for heart-rate and cycling-power samples added to a live builder, using the wearer's preferred configuration from Health Settings — heart rate has system defaults even if the wearer never configured anything, cycling power does not.
- Read the wearer's active configuration with `store.preferredWorkoutZoneConfiguration(for:)`, receive live transitions by implementing `workoutBuilder(_:didUpdateWorkoutZone:)` and reading `HKLiveWorkoutZoneUpdate` (`previousZoneDuration`, `currentZoneDuration`, `zoneGroup`), and read completed data from `HKWorkout.zoneGroupsByType` / `zoneGroup(for:)` (also per-activity on `HKWorkoutActivity`).
- Only override with `builder.setCustomZoneConfiguration(_:for:)` — before `beginCollection` — when you genuinely implement a training model. `HKWorkoutZoneConfiguration(quantityType:zoneBoundaries:)` treats each boundary as an upper threshold, the custom config applies to that one workout only, and it is neither synced nor persisted, so store your parameters yourself. Always check `configuration.source` (`.system`, `.user`, `.app`) before comparing time-in-zone across workouts.

## Platform notes

- **Authorization.** Request share access for workout types plus whatever you read, and put `NSHealthShareUsageDescription` / `NSHealthUpdateUsageDescription` on the watch app target itself — since watchOS 6 the wearer can authorize directly on the watch, and a missing string crashes on launch. Zone data needs read access to workouts *and* to the underlying quantity type (heart rate, cycling power).
- **One session at a time.** Apple Watch runs a single workout session. If another app starts one while yours is running, your session receives an error and ends — handle `workoutSession(_:didFailWithError:)` as a real state, not an assertion.
- **Mirrored sessions (watchOS 10+).** `session.startMirroringToCompanionDevice()` launches the companion iOS app in the background and hands it the session; the iOS side must set `HKHealthStore.workoutSessionMirroringStartHandler` to receive it. Pass app-level data across with `sendToRemoteWorkoutSession(data:)` and handle `workoutSession(_:didReceiveDataFromRemoteWorkoutSession:)` and `workoutSession(_:didDisconnectFromRemoteDeviceWithError:)`.
- **iPhone and iPad can host sessions too** (from iOS 26), but with no wrist sensor: heart rate requires an external Bluetooth monitor, and the system may collect a different sample set than you asked for. Share the session code, not the assumptions.
- **Always On.** During an active session the app stays on screen in the dimmed state and can keep updating, but at a much lower rate — roughly once a second. Swap animations for static frames and drop hundredths of seconds when `\.isLuminanceReduced` is true.
- **Multi-activity workouts.** `session.beginNewActivity(configuration:date:metadata:)` / `endCurrentActivity(on:)` model triathlon-style segments; the builder reports them through `workoutBuilder(_:didBegin:)` and `workoutBuilder(_:didEnd:)`, and each activity carries its own zone data.

## Pitfalls

- Ending the session and stopping there — without `endCollection` and `finishWorkout` nothing is saved and the rings get no credit.
- Constructing a bare `HKWorkout` instead of going through the builder, which produces a workout the system does not treat as real.
- Forgetting the `workout-processing` background mode, so the app is suspended the moment the wrist drops and the session data stops flowing to your UI.
- Updating `@Published`/`@Observable` state directly from a delegate callback, which under Swift 6 is a data race and in practice a crash or a frozen UI.
- Calling `enableWaterLock()` from a background thread, outside the foreground, or without an active session — it silently does nothing.
- Treating `pause()` as a UI-only flag. The session moves to `HKWorkoutSessionState.paused` and back on `resume()`; drive the timer and stats from the session state and the builder rather than from your own boolean.
- Doing heavy work (chart re-layout, map rendering) on every `didCollectDataOf` callback and getting terminated for CPU use during the workout.
- Hand-rolling heart-rate zone math when the wearer already configured zones in Health Settings, so your zones disagree with the ones the Workout app shows them.

## References

- **Documentation:** [Running workout sessions](https://developer.apple.com/documentation/healthkit/running-workout-sessions)
- **Documentation:** [HKWorkoutSession](https://developer.apple.com/documentation/healthkit/hkworkoutsession)
- **Documentation:** [HKLiveWorkoutBuilder](https://developer.apple.com/documentation/healthkit/hkliveworkoutbuilder)
- **Documentation:** [Accessing workout zone data](https://developer.apple.com/documentation/healthkit/accessing-workout-zone-data)
- **Documentation:** [WKInterfaceDevice — water resistance and Water Lock](https://developer.apple.com/documentation/watchkit/wkinterfacedevice)
- **WWDC:** [Track workouts with HealthKit on iOS and iPadOS (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/322/)
- **Sample Code:** [Build a workout app for Apple Watch](https://developer.apple.com/documentation/healthkit/build-a-workout-app-for-apple-watch)

## See also

Pair this with the `healthkit` skill for store setup, authorization semantics, query descriptors, and background delivery — this skill assumes all of it. Use `watchos-app-structure` for the surrounding app, its lifecycle, and the Always On presentation of live metrics, and `watchos-complications` to surface today's totals on the face. For planned and structured workouts (goals, pacers, intervals) look at WorkoutKit rather than driving the session by hand, and for raw sensor streams outside a workout use Core Motion.
