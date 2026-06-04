---
name: background-tasks
description: "Guidance on the BackgroundTasks framework for deferred and long-running background execution: BGAppRefreshTask, BGProcessingTask, the iOS 26 BGContinuedProcessingTask for user-initiated work, and background URLSession transfers. Use when scheduling periodic refresh, running maintenance off-screen, continuing an export or upload after the user leaves, downloading large files in the background, or configuring the required BGTaskSchedulerPermittedIdentifiers and UIBackgroundModes entries."
---

## When to use

Use this skill when an app must do work while not in the foreground: refreshing content ahead of the next launch, running periodic maintenance such as cache pruning or on-device model updates, continuing a user-started export or upload after they leave, or transferring large files that should survive suspension and termination. It covers picking the right task type, registering and scheduling requests, reporting progress, and declaring the identifiers and background modes the system requires. It does not cover audio, location, or VoIP background modes, which use their own session APIs.

## Core guidance

- Match the work to a task type. `BGAppRefreshTask` gives roughly 30 seconds for lightweight content fetches; `BGProcessingTask` grants minutes for heavier maintenance and can require network or external power. The new iOS 26 `BGContinuedProcessingTask` is for user-initiated, immediate-goal work (an export, a publish) that keeps running with system UI showing progress after the app backgrounds.
- Register every handler synchronously at launch, before the launch sequence finishes, with `BGTaskScheduler.shared.register(forTaskWithIdentifier:using:launchHandler:)`. Registering later, or registering an identifier missing from `Info.plist`, traps. Schedule the next request only after you have registered.
- Do not assume a run time. `earliestBeginDate` is a floor, not a promise; the system decides actual execution from battery, thermal state, and usage patterns. Reschedule the next request at the start of each handler so the cycle continues.
- Always wire `task.expirationHandler` to cancel work and call `task.setTaskCompleted(success:)` exactly once. Treat expiration as imminent and save partial state; an unhandled expiration counts against your app and risks reduced future scheduling.
- For `BGContinuedProcessingTask`, drive `task.progress` continuously — it is mandatory and feeds the system progress UI. Submit the request from a clear user action, set `strategy` to `.queue` (default) or `.fail` when you need immediate execution, and use a wildcard identifier (for example `com.example.export.*`) registered against a prefix.
- Prefer a background `URLSession` for downloads and uploads instead of holding a task alive. Use `URLSessionConfiguration.background(withIdentifier:)`, a delegate (async/await and completion-handler transfer methods are unsupported here), and route relaunches through the app delegate.
- Honor budgets: keep handlers short, batch I/O, avoid speculative work, and respect Low Power Mode and Background App Refresh being off. Over-scheduling earns fewer opportunities, not more.

```swift
BGTaskScheduler.shared.register(
    forTaskWithIdentifier: "com.example.refresh", using: nil
) { task in
    let refresh = task as! BGAppRefreshTask
    scheduleNextRefresh()
    let work = Task { await syncFeed() }
    refresh.expirationHandler = { work.cancel() }
    Task { _ = await work.value; refresh.setTaskCompleted(success: !work.isCancelled) }
}
```

## Platform notes

- The classic `BGAppRefreshTask` and `BGProcessingTask` paths require iOS 13+/iPadOS 13+ and are available on tvOS, watchOS, and visionOS; the SwiftUI `backgroundTask(_:action:)` scene modifier (with `.appRefresh` and `.urlSession`) is the concurrency-native way to handle them from iOS 17.
- `BGContinuedProcessingTask` is new in iOS 26 and iPadOS 26 only; gate its use with availability checks and fall back to a foreground task or background `URLSession` elsewhere. It needs the continued-processing capability declared in the processing background mode.
- visionOS and tvOS schedule background work conservatively; design refresh logic to tolerate long gaps between executions rather than fixed intervals.

## Pitfalls

- Forgetting to list an identifier under `BGTaskSchedulerPermittedIdentifiers`, or enabling the wrong `UIBackgroundModes` entry, causes registration or submission to fail at runtime — `fetch` for app refresh, `processing` for processing and continued-processing tasks.
- Background sessions cannot use async/await or completion-handler download and upload calls; you must adopt the delegate and implement `urlSession(_:downloadTask:didFinishDownloadingTo:)` and `urlSessionDidFinishEvents(forBackgroundURLSession:)`.
- Dropping the stored completion handler from `application(_:handleEventsForBackgroundURLSession:completionHandler:)` leaves the UI snapshot stale; store it and call it from `urlSessionDidFinishEvents`.
- Calling `setTaskCompleted(success:)` twice, or never, are both bugs; complete exactly once per task, including from the expiration handler.
- Testing only in the simulator misleads: scheduling decisions depend on real device signals. Use the debugger's launch-simulation commands and verify on hardware.

## References

- **Documentation:** [BackgroundTasks](https://developer.apple.com/documentation/backgroundtasks)
- **Documentation:** [BGContinuedProcessingTask](https://developer.apple.com/documentation/backgroundtasks/bgcontinuedprocessingtask)
- **Documentation:** [Performing long-running tasks on iOS and iPadOS](https://developer.apple.com/documentation/backgroundtasks/performing-long-running-tasks-on-ios-and-ipados)
- **Documentation:** [Scene.backgroundTask(_:action:)](https://developer.apple.com/documentation/swiftui/scene/backgroundtask(_:action:))
- **WWDC:** [Finish tasks in the background (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/227/)
- **WWDC:** [Efficiency awaits: Background tasks in SwiftUI (WWDC22)](https://developer.apple.com/videos/play/wwdc2022/10142/)

## See also

See `concurrency` for structuring the async work a handler awaits and for cooperative cancellation tied to `expirationHandler`. See `urlsession-networking` for the foreground transfer APIs and how a background-configured session differs from a default one.
