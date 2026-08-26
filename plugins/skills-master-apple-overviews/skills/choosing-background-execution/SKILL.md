---
name: choosing-background-execution
description: Decision router for running work outside the foreground on Apple platforms — BGAppRefreshTask versus BGProcessingTask, background URLSession transfers, the declared background modes for audio, location, and VoIP, push-triggered work, Background Assets for bulk content, and Live Activities for user-visible progress. Use when deciding how a sync, upload, export, or refresh should run while the app is not on screen, when background work is silently never executing, or when weighing a background mode against a deferred task.
license: MIT
---

## When to use

Reach for this skill when work must continue while the app is not on screen: content refresh, sync, uploads and downloads, exports, bulk content delivery, or reacting to a server event. It also applies to the diagnostic case — background code that was written correctly and simply never runs. It routes the decision; `background-tasks` and `background-assets` carry the implementation detail.

## Core guidance

Start from the constraint that invalidates most designs brought over from other platforms: **iOS gives you no guaranteed wake.** Apple is explicit that setting `earliestBeginDate` only promises a task will not start *before* that date — the system, not the app, decides when a background task actually launches, and the same holds for whether it launches the app to handle a background push. There is no "run this in fifteen minutes."

The practical consequence: design every mechanism below to tolerate "did not run today," and reschedule at the start of each handler rather than assuming a cadence. Runtime is also scarce where it exists — an app-refresh task gets on the order of thirty seconds and is terminated if it does not complete in that window, and the system ends processing tasks when the person picks the device back up.

Second constraint, easy to miss: **BackgroundTasks is not a universal framework.** Apple lists it for iOS, iPadOS, Mac Catalyst, tvOS, and visionOS — not for macOS and not for watchOS. Cross-platform background code cannot assume `BGTaskScheduler` exists.

Then ask three questions, in order:

1. **Is this a file transfer?** If yes, the answer is almost always a background `URLSession`, regardless of what triggered it.
2. **Is the work user-visible and ongoing, or invisible housekeeping?** Visible ongoing work has different mechanisms and different App Review expectations.
3. **What triggers it — a user action, a server event, or the system's convenience?**

### Routing

- **Short content refresh → `BGAppRefreshTask`.** On the order of thirty seconds to warm content ahead of the next launch. Needs the `fetch` background mode plus the identifier listed under `BGTaskSchedulerPermittedIdentifiers`. Use it to make the next launch feel instant, not to guarantee freshness.
- **Heavier deferrable maintenance → `BGProcessingTask`.** Minutes rather than seconds, and the request can require external power or network connectivity. Right for database compaction, on-device model updates, batch indexing, and cache pruning. Apple frames it as running during periods of low activity, such as overnight while charging — and the system ends it when the person starts using the device. Needs the `processing` background mode.
- **User-initiated work that must finish after they leave → `BGContinuedProcessingTask`.** Introduced in the 26 cycle and limited to iOS, iPadOS, and Mac Catalyst, so gate it with an availability check. It suits an export, an encode, or a publish. Three properties shape the design: the request must be submitted from the foreground as the result of a user action, the task must continuously report progress (the system preferentially terminates tasks showing little of it), and the progress surfaces as a **Live Activity** the person can cancel — which fires your expiration handler.
- **Any download or upload → a background `URLSession`.** `URLSessionConfiguration.background(withIdentifier:)` hands the transfer to a separate system process that continues while the app is suspended or terminated, then relaunches the app to deliver results. It is also the one mechanism here that spans every Apple platform, including macOS and watchOS, which makes it the portable choice. Constraints that bite: a background session is delegate-only, so the async/await and completion-handler transfer conveniences are unavailable; you must store and later invoke the relaunch completion handler; the delegate callback is app-delegate-only with no scene equivalent and is not called at launch for still-running transfers, so persist the identifier and recreate the session yourself; and if the *user* kills the app from the multitasking switcher the system cancels that session's transfers rather than resuming them.
- **Bulk app content rather than user files → Background Assets.** When the payload is level packs, media libraries, or model weights, `BackgroundAssets` gives download before first launch, Apple hosting, essential/prefetch/on-demand policies, and StoreKit-gated unlock of purchasable packs. The 26 cycle added a *managed* mode built on the `AssetPackManager` actor, where the system schedules the downloads and you mostly declare intent. Prefer it over hand-rolling a transfer pipeline for shippable content. Route to `background-assets`.
- **Server-driven work → background (silent) push, then hand off.** Send `apns-push-type: background` at `apns-priority: 5` with `content-available` set in the payload, and declare the `remote-notification` mode. Treat the wake as a hint, not a delivery guarantee: Apple states background notifications are low priority and delivery is not guaranteed, advises against sending more than two or three per hour, and throttles beyond that. The app gets roughly thirty seconds once woken, so the durable pattern is to enqueue a background `URLSession` transfer or schedule a task and return — never attempt an entire sync inline.
- **Continuous, user-understood activity → a declared background mode.** Audio playback, turn-by-turn location, and VoIP are the mechanisms that genuinely keep a process alive, and each comes with its own session API rather than the BackgroundTasks scheduler — an audio session, a location manager with the right authorization, PushKit for VoIP. They are also what App Review scrutinizes: declaring a mode the app does not actually use is a classic rejection.
- **Finishing cleanly when the system revokes your runtime → `ProcessInfo.performExpiringActivity(withReason:using:)`.** Widely mistaken for a Mac-only API; Apple documents it on iOS, iPadOS, tvOS, visionOS, and watchOS. It asks the system for a task assertion and calls your block again with `expired == true` when that assertion is going away. Use it to wrap work that must reach a consistent state, not to buy open-ended runtime.
- **User-visible progress → a Live Activity, which is presentation, not execution.** ActivityKit is iOS, iPadOS, and Mac Catalyst only; Live Activities reach the Apple Watch Smart Stack, the Mac menu bar, and the CarPlay Home Screen by relay from the paired iPhone rather than through a watchOS or macOS API, and visionOS does not support them at all. Crucially, an activity grants no runtime — the work still has to be performed by one of the mechanisms above or pushed from your server. Reach for it when the user should be able to watch progress without opening the app. Route to `activitykit` and `choosing-widget-tech`.

### At a glance

| Need | Mechanism | Survives app termination |
|---|---|---|
| Warm content for next launch | `BGAppRefreshTask` | Rescheduled, not resumed |
| Deferrable maintenance | `BGProcessingTask` | Rescheduled, not resumed |
| Finish a user-started job | `BGContinuedProcessingTask` | Yes, with system progress UI |
| Download or upload files | Background `URLSession` | Yes, relaunches the app |
| Ship bulk app content | Background Assets | Yes, system-managed |
| React to a server event | Background push, then hand off | Not guaranteed to be delivered |
| Keep playing or navigating | Declared background mode | Process stays alive while the session runs |

**Default:** if it moves bytes, use a background `URLSession`; if it is housekeeping, use `BGProcessingTask`; if it is neither, question whether it needs to run in the background at all.

## Platform notes

- **iOS and iPadOS** are the restrictive case and the one every rule above is written for. `BGContinuedProcessingTask` is available only here (plus Mac Catalyst) and only from the 26 cycle.
- **macOS** has no BackgroundTasks framework. It is also far more permissive — apps are not routinely suspended — so the design problem shifts from "will I get to run" to "finish cleanly when told to." Background `URLSession` is available and remains the right answer for transfers.
- **watchOS** likewise has no BackgroundTasks framework. Sustained runtime there comes from purpose-built sessions: a HealthKit workout session under the `workout-processing` background mode for fitness apps (`watchos-workouts`), and extended runtime sessions for a narrow set of categories. Background `URLSession` works on the watch.
- **tvOS and visionOS** do have BackgroundTasks, but schedule sparingly. Design refresh logic to tolerate long, irregular gaps rather than expecting an interval. Background Assets arrived later on these platforms than on iOS, so check the deployment floor before relying on it.
- **Background modes are not uniform across platforms.** `location` is not a tvOS or visionOS mode, `workout-processing` is watchOS-only, and several others are iOS/iPadOS-only. Verify each mode against the platforms you ship rather than copying an `Info.plist`.
- **Testing on the simulator misleads.** Scheduling depends on real device signals; use the debugger's launch-simulation commands and confirm on hardware before believing any cadence.

## Pitfalls

- **Assuming a schedule.** Treating `earliestBeginDate` as a timer produces features that work on a developer's charging device and fail for everyone else.
- **Registering task handlers late.** Every handler must be registered before `application(_:didFinishLaunchingWithOptions:)` returns; registering an identifier twice terminates the app, and an identifier missing from `BGTaskSchedulerPermittedIdentifiers` makes registration fail.
- **Declaring a background mode to buy runtime.** Using the audio or location mode for work that is neither is the most reliable way to fail App Review, and it drains batteries in the meantime.
- **Doing the whole sync inside a background push handler,** rather than waking, enqueuing durable work, and returning within the short window you get.
- **Using async/await on a background `URLSession`,** or dropping the relaunch completion handler — both look correct locally and break only in the background path.
- **Expecting a user-killed app to resume its transfers.** System termination is recoverable; a swipe away in the app switcher cancels the session's transfers, and it also cancels continued-processing tasks with no callback.
- **Completing a task zero times or twice.** `setTaskCompleted(success:)` must be called exactly once, including from the expiration handler.
- **Confusing a Live Activity with background execution.** The activity will sit there showing stale state if nothing is actually running to update it.
- **Assuming a cross-platform background design.** Code that reaches for `BGTaskScheduler` will not compile for macOS or watchOS, and ActivityKit is absent on visionOS.
- **Ignoring the user's switches.** Background App Refresh turned off and Low Power Mode turned on are normal states, not error conditions; the app must still be correct.

## References

- **Documentation:** [BackgroundTasks](https://developer.apple.com/documentation/backgroundtasks)
- **Documentation:** [Performing long-running tasks on iOS and iPadOS](https://developer.apple.com/documentation/backgroundtasks/performing-long-running-tasks-on-ios-and-ipados)
- **Documentation:** [Background Assets](https://developer.apple.com/documentation/backgroundassets)
- **Documentation:** [ActivityKit](https://developer.apple.com/documentation/activitykit)
- **WWDC:** [Finish tasks in the background (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/227/)

## See also

- Implementation depth: `background-tasks` for the scheduler, task types, and background transfers; `background-assets` for asset packs and hosting.
- `activitykit` and `choosing-widget-tech` for surfacing progress the user can watch.
- `user-notifications` for the push side, and `network-framework` or the networking overview for the transport itself.
- `watchos-workouts` for the watch's sustained-runtime path, and `swift-concurrency` for structuring the async work a handler awaits and cancelling it on expiration.
