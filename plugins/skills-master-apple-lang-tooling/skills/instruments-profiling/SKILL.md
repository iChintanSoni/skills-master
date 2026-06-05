---
name: instruments-profiling
description: Guides profiling Apple apps with Instruments 26 — Time Profiler and CPU Profiler, Allocations and Leaks, the SwiftUI and Hangs and Hitches instruments, and OSSignposter points of interest. Use when an app is slow, janky, hangs, or grows in memory, when reading an Instruments timeline or call tree, or when adding signposts to measure and confirm a performance fix.
---

## When to use

Reach for Instruments when an app feels slow, drops frames, freezes, drains battery, or grows in memory — and you need data instead of guesses. Profile to *locate* a cost before changing code, then profile again to *confirm* the change actually moved the number. Use it after a UI or model refactor, before shipping a performance-sensitive feature, or when a user report ("scrolling stutters", "the app beachballs on launch") needs a reproducible measurement.

Do not use Instruments to micro-tune code you have not first measured, and prefer XCTest performance tests (or `XCTMetric`) when you want a *regression gate* rather than a one-off investigation.

## Core guidance

- **Measure a Release build on a real device.** The Simulator and Debug builds have different optimization and timing; profile the configuration you ship. Launch from Xcode via Product > Profile (Cmd-I) so dSYMs symbolicate the trace.
- **Pick the right instrument for the symptom.** Stutter or jank in animation/scrolling → Hangs and Hitches plus SwiftUI; a busy or blocked main thread → Time Profiler or CPU Profiler; rising footprint → Allocations; an object never freed → Leaks. Don't open Time Profiler for a memory bug.
- **Prefer CPU Profiler over Time Profiler for CPU optimization.** Time Profiler samples on a fixed timer and can alias with periodic work, over-weighting some frames; CPU Profiler samples per-core by clock and weights cost more fairly. Use Time Profiler for a quick "what's hot right now" pass.
- **Read the timeline top-down, then drill the call tree.** Select a span in the track, then in the detail pane invert the call tree and check *Hide System Libraries* to surface your own heavy frames; right-click > *Charge to caller* to fold noise.
- **Find abandoned memory with generations, not just Leaks.** A leak has no remaining reference; abandoned memory is still referenced but never released. In Allocations, mark a generation, exercise the flow, mark again — persistent growth between marks is your suspect.
- **Add signposts for *your* intervals.** Drop an `OSSignposter` on the `.pointsOfInterest` log to name and time operations; they appear as labeled regions on the Points of Interest track and let you correlate your work with samples.
- **Confirm the fix.** Re-record the same scenario, compare against the saved baseline `.trace`, and verify the hot frame, hitch, or growth is gone — a fix unconfirmed by a second trace is a hypothesis.

```swift
import OSLog

let signposter = OSSignposter(
    subsystem: "com.example.feed", category: .pointsOfInterest)

func loadFeed() {
    let id = signposter.makeSignpostID()
    let state = signposter.beginInterval("load feed", id: id)
    defer { signposter.endInterval("load feed", state) }
    decodePayload()
    signposter.emitEvent("decoded", id: id)   // single point in time
    renderCells()
}
```

## Platform notes

- **iOS / iPadOS / watchOS / tvOS / visionOS:** Always profile on hardware over Wi-Fi or cable; thermal state and slower I/O change results versus a Mac. Hitches matter most where displays run at 120 Hz ProMotion — a frame budget can be ~8 ms.
- **macOS:** A "spinning wheel" maps to a main-thread hang; the Hangs instrument and a blocked-thread Time Profiler sample together explain it. Mac apps can hit much larger heaps, so watch Allocations for unbounded caches.
- **SwiftUI everywhere:** The SwiftUI instrument's *Update Groups*, *Long View Body Updates*, and *Long Representable Updates* lanes color long updates orange→red; start with red. Pair it with Time Profiler to see whether the cost is in `body` evaluation or in work `body` triggers (e.g. date formatters).
- **Signpost availability:** `OSSignposter` is available across all current Apple platforms; signposts on the `.pointsOfInterest` category survive Release builds with low overhead, so they are safe to leave in.

## Pitfalls

- **Profiling Debug, or the Simulator.** Unoptimized code and host-CPU timings produce misleading hot spots; people "fix" phantom costs that vanish in Release.
- **Trusting an inverted tree without hiding system frames.** Foundation/UIKit internals dominate the top and bury your code; without *Hide System Libraries* you chase the framework, not your call site.
- **Re-creating a formatter or `OSSignposter`/`Logger` per call.** Allocating these in a tight loop adds the very cost you are hunting; create them once and reuse.
- **Calling `endInterval` with the wrong state.** The state returned by `beginInterval` ties the begin/end pair; reusing or losing it yields broken or unmatched intervals on the track.
- **Declaring victory from one run.** Timing varies; record several passes (or use a performance test baseline) before claiming a regression or a win.
- **Ignoring deferred mode for heavy recordings.** Live graphing perturbs timing — switch the recording to Deferred Mode when overhead matters, especially for CPU Profiler in tests.

## References

- **Documentation:** [Profiling apps using Instruments](https://developer.apple.com/tutorials/instruments)
- **Documentation:** [Identifying a hang](https://developer.apple.com/tutorials/instruments/identifying-a-hang)
- **Documentation:** [OSSignposter](https://developer.apple.com/documentation/os/ossignposter)
- **Documentation:** [Recording performance data](https://developer.apple.com/documentation/os/recording-performance-data)
- **WWDC:** [Optimize SwiftUI performance with Instruments (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/306/)
- **WWDC:** [Optimize CPU performance with Instruments (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/308/)
- **WWDC:** [Analyze hangs with Instruments (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10248/)
- **WWDC:** [Analyze heap memory (WWDC24)](https://developer.apple.com/videos/play/wwdc2024/10173/)

## See also

Pair this with a SwiftUI performance skill for fixing the long view-body updates the SwiftUI instrument surfaces, and with a concurrency skill for moving blocking work off the main actor once you have proven a busy or blocked main thread. A unified-logging skill complements signposts when you also need durable `Logger` diagnostics, and an XCTest performance-testing skill turns a confirmed fix into a regression gate.
