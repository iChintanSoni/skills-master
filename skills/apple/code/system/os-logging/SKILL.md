---
name: os-logging
description: "Guidance for unified logging and performance tracing on Apple platforms with the Logger (OSLog) and OSSignposter APIs. Use when adding diagnostic logging, choosing log levels, redacting sensitive data with privacy annotations, picking subsystems/categories, reading logs in Console or via the log command, or measuring durations with signposts in Instruments."
globs:
  - "**/*.swift"
tags: [logging, oslog, signposts, instruments, diagnostics, privacy]
x-skills-master:
  domain: apple
  class: code
  category: system
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  requires:
    ios: "17"
    swift: "6.0"
  pairs_with: []
  sources:
    - https://developer.apple.com/documentation/os/logger
    - https://developer.apple.com/documentation/os/oslogprivacy
    - https://developer.apple.com/documentation/os/ossignposter
    - https://developer.apple.com/documentation/os/generating-log-messages-from-your-code
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

# os-logging

## When to use

Reach for this skill whenever you need durable, structured diagnostics instead of `print`. Use the `Logger` API for application and framework logging across iOS, iPadOS, macOS, watchOS, tvOS, and visionOS, and `OSSignposter` when you want to measure how long an operation takes and inspect it on a timeline in Instruments. The unified logging system is built into every Apple platform, has a very low runtime cost, and survives into sysdiagnose archives that you can pull from a user's device after a hard-to-reproduce bug.

Skip it for one-off scratch debugging where a breakpoint is faster, and prefer signposts over manual timestamp math whenever you care about wall-clock duration.

## Core guidance

- Do create one `Logger` per area of concern: `let log = Logger(subsystem: "com.acme.app", category: "networking")`. Use your reverse-DNS bundle identifier as the subsystem and a short noun for the category so Console filters cleanly.
- Do match the level to the message. `debug`/`info` are not persisted to disk and only surface while something is actively capturing; `notice` (also `log`) is the default persisted level; `error` flags a recoverable problem; `fault` marks a bug or broken assumption. Reserve the noisy levels for development.
- Don't assume interpolated values are visible. Every dynamic value is redacted to `<private>` by default off-device. Mark non-sensitive values explicitly with `\(value, privacy: .public)`; never make passwords, tokens, or PII public.
- Do use `.private(mask: .hash)` when you need to correlate a value across messages without exposing it — identical inputs produce a stable hash while staying redacted.
- Don't build strings yourself or use string interpolation that defeats the format pipeline. Pass the value directly so the system can store it efficiently and apply formatting like `\(count, format: .decimal)` or `\(bytes, format: .byteCount)`.
- Do declare `Logger` instances as `static let` or module-level constants; they are cheap, `Sendable`, and safe to share under Swift 6 strict concurrency.
- Don't ship `print` to production. It has no levels, no privacy, no categories, and is invisible in Console and sysdiagnose.

```swift
import os

let log = Logger(subsystem: "com.acme.app", category: "auth")

func signIn(_ user: String) {
    // user is redacted off-device; the result is safe to expose.
    log.notice("Sign-in for \(user, privacy: .private(mask: .hash))")
    log.error("Token refresh failed: \(errorCode, privacy: .public)")
}
```

For timing, create an `OSSignposter` (from a `Logger` or a subsystem/category), begin an interval, and end it with the returned state token. Interval names must be `StaticString`.

```swift
let signposter = OSSignposter(logger: log)
let id = signposter.makeSignpostID()
let state = signposter.beginInterval("Load Feed", id: id)
defer { signposter.endInterval("Load Feed", state) }
// ... work to measure ...
```

## Platform notes

- The `Logger` struct and `OSSignposter` live in the `os` module and are available on iOS 14+/macOS 11+; this skill targets iOS 17 and Swift 6. `OSLogStore`, for reading your own entries back at runtime, is reliable from iOS 15/macOS 12 onward and works in the Simulator and on device without special entitlements.
- View logs live with **Console.app** (select your device or Mac, then filter by subsystem/category), or stream from Terminal with `log stream --predicate 'subsystem == "com.acme.app"'`. Capture a snapshot with `log collect`, which produces a `.logarchive` you can reopen in Console.
- For signposts, run your app under the **Instruments** "os_signpost" instrument (or a Time Profiler/CPU template); intervals with the same name are grouped so you can see min/max/average durations. On watchOS keep logging light, since capture and storage budgets are tighter.
- No `Info.plist` usage strings are required — unified logging touches no protected resource. The privacy concern is the reverse: avoid logging user data, and treat the redaction defaults as a safety net, not a license to interpolate secrets.

## Pitfalls

- Marking sensitive data `.public` leaks it into persisted logs and sysdiagnose archives that users may share. When unsure, leave it private.
- Expecting `debug`/`info` to appear in a collected sysdiagnose: they don't persist by default. Use `notice` or higher for anything you need after the fact.
- Passing a runtime `String` where a `StaticString` is required (log/signpost message literals) — the message must be a compile-time literal; interpolate values into it, don't construct it dynamically.
- Forgetting to end an interval (e.g., on an early return or thrown error) leaves a dangling signpost. Pair `beginInterval`/`endInterval` with `defer`.
- Creating a new `Logger` on every call is wasteful and fragments your Console filters; hoist it to a constant.

## References

- **Documentation:** [Logger](https://developer.apple.com/documentation/os/logger)
- **Documentation:** [OSLogPrivacy](https://developer.apple.com/documentation/os/oslogprivacy)
- **Documentation:** [OSSignposter](https://developer.apple.com/documentation/os/ossignposter)
- **Documentation:** [Generating Log Messages from Your Code](https://developer.apple.com/documentation/os/generating-log-messages-from-your-code)
- **WWDC:** [Explore logging in Swift (WWDC20)](https://developer.apple.com/videos/play/wwdc2020/10168/)
- **WWDC:** [Optimize CPU performance with Instruments (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/308/)

## See also

For surfacing diagnostics during development, pair this with a SwiftUI previews or debugging skill. For error handling that decides *what* to log at `error`/`fault` level, see a Swift error-handling skill. For deeper performance work that signposts feed into, see an Instruments profiling or Swift concurrency skill.
