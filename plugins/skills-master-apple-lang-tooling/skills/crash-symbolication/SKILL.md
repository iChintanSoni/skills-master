---
name: crash-symbolication
description: Guides diagnosing app crashes by symbolicating reports, mapping dSYMs, reading the Xcode 26 Organizer and MetricKit diagnostics, and recognizing common crash signatures. Use when a TestFlight or App Store build crashes, when reports show only hex addresses, when matching dSYM UUIDs, when wiring MXCrashDiagnostic, or when triaging force-unwrap, out-of-bounds, or threading crashes.
---

# Crash symbolication

## When to use

- A TestFlight or App Store build crashes and you need a readable backtrace, not raw addresses.
- The Crashes tab in the Xcode Organizer shows frames as hex offsets or `<redacted>` and you must symbolicate them.
- You are matching a crash to its build by dSYM UUID, or a report fails to symbolicate because the dSYM is missing.
- You want in-process diagnostics via MetricKit (`MXCrashDiagnostic`) to capture crashes your dashboard misses.
- You are triaging a recurring signature — force-unwrap, array out-of-bounds, or a threading fault — and want to read it fast.

## Core guidance

- **Keep dSYMs for every shipped build.** Set `DEBUG_INFORMATION_FORMAT = dwarf-with-dsym` for Release. With bitcode gone, the App Store recompiles nothing, so the dSYM you archive is the one you need. Save it from the Organizer or grab it later via App Store Connect.
- **Match by UUID, never by guesswork.** Each binary slice has a UUID. Compare `dwarfdump --uuid YourApp.app/YourApp` against the `binaryUUID` in the report (or `Build UUID` line). Mismatch means the dSYM is from a different compile; symbolication will silently produce wrong or blank frames.
- **Let the Organizer do the work first.** Xcode auto-downloads and symbolicates App Store and TestFlight crashes if the matching archive or dSYM is on the machine or indexed locally. Re-symbolicate from a fresh report only when frames stay opaque.
- **Read the report top-down.** `Exception Type` plus the crashed thread's frame 0 usually name the bug. Don't over-read system frames below your topmost app frame — your code is the actionable line.
- **Add MetricKit for full coverage.** Implement `MXMetricManagerSubscriber` and read `MXDiagnosticPayload.crashDiagnostics`. Payloads arrive on next launch; symbolicate their `callStackTree` offline with your dSYMs (system frames need the OS symbols for that exact build).
- **Don't ship a stripped binary you can't re-symbolicate.** Stripping is fine *if* the dSYM survives. Losing it means permanent hex-only reports.
- **Treat `Termination Reason` and watchdog/CPU exceptions as distinct** from signal crashes — they have their own Organizer panes and rarely show a classic backtrace.

```bash
# Confirm the dSYM matches the crashing build before symbolicating.
dwarfdump --uuid MyApp.app.dSYM/Contents/Resources/DWARF/MyApp
# UUID: 9F3C... (arm64) — compare against binaryUUID in the .ips report.

# Symbolicate one frame manually (load address from the report's binary image).
atos -arch arm64 -o MyApp.app.dSYM/Contents/Resources/DWARF/MyApp -l 0x1043b8000 0x1043c9a4c
```

## Platform notes

- **iOS / iPadOS / tvOS / watchOS / visionOS:** Device crashes land in Settings → Privacy & Security → Analytics & Improvements → Analytics Data as `.ips` files; share them to your Mac and open in Xcode to symbolicate. Apple Watch and Vision Pro reports flow through their paired or host device.
- **macOS:** Crashes appear in Console under Crash Reports; the same `.ips` JSON format and `atos`/Organizer workflow applies. Sandboxed and notarized apps still produce symbolicable reports when the dSYM is retained.
- **All platforms:** Reports use the `.ips` JSON format (legacy text logs are auto-translated). MetricKit is available on iOS/iPadOS/tvOS and macOS; it is the only first-party in-process source, since Apple offers no crash-handler API.

## Pitfalls

- **Blank or `<redacted>` frames** almost always mean a missing or mismatched dSYM — verify the UUID before blaming the symbolicator.
- **Symbolicating with the wrong OS symbols** yields plausible-but-wrong system frame names; system frames need symbols for the exact OS build the crash came from.
- **Assuming frame 0 is your bug** when it is a system function — walk up to your topmost frame; the real cause (a force-unwrap, a bad index) lives there.
- **Forgetting to enable dSYM upload** to your symbol service or App Store Connect; archives drop off machines and the dSYM vanishes with them.
- **Reading a thread-safety crash literally** — an `EXC_BAD_ACCESS` in `objc_release` or a collection mutation often means a data race, reproducible only under Thread Sanitizer, not at the reported line.

## References

- **Documentation:** [Diagnosing issues using crash reports and device logs](https://developer.apple.com/documentation/xcode/diagnosing-issues-using-crash-reports-and-device-logs)
- **Documentation:** [Adding identifiable symbol names to a crash report](https://developer.apple.com/documentation/xcode/adding-identifiable-symbol-names-to-a-crash-report)
- **Documentation:** [Interpreting the JSON format of a crash report](https://developer.apple.com/documentation/xcode/interpreting-the-json-format-of-a-crash-report)
- **Documentation:** [Investigating memory access crashes](https://developer.apple.com/documentation/xcode/investigating-memory-access-crashes)
- **Documentation:** [MXCrashDiagnostic](https://developer.apple.com/documentation/metrickit/mxcrashdiagnostic)
- **WWDC:** [Triage TestFlight crashes in Xcode Organizer (WWDC21)](https://developer.apple.com/videos/play/wwdc2021/10203/)
- **WWDC:** [What's new in MetricKit (WWDC20)](https://developer.apple.com/videos/play/wwdc2020/10081/)

## See also

Pair this with a release-engineering skill on archiving and uploading builds, which is where dSYM retention is won or lost, and with a concurrency-debugging skill covering Thread Sanitizer for the data-race signatures that surface as `EXC_BAD_ACCESS`. A MetricKit-metrics skill complements the diagnostics half of the same framework, covering hangs, CPU exceptions, and disk-write reports alongside crashes.
