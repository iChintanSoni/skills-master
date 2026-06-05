---
name: swift-performance-memory
description: "Guides Swift performance and memory work: value semantics and copy-on-write, ARC and reference cycles, weak/unowned capture lists, inout, the borrowing/consuming ownership keywords, and Span. Use when a profile shows retain/release or allocation hotspots, when designing hot-path data structures, when fixing leaks or retain cycles, or when reaching for unsafe pointers."
globs:
  - "**/*.swift"
tags: [swift, performance, memory, arc, ownership]
x-skills-master:
  domain: apple
  class: lang-tooling
  category: language
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  requires:
    swift: "6.0"
  pairs_with: []
  sources:
    - https://developer.apple.com/documentation/swift/span
    - https://docs.swift.org/swift-book/documentation/the-swift-programming-language/automaticreferencecounting/
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for this when measurement points at memory or copy overhead — not before. Typical triggers: Instruments shows `swift_retain`/`swift_release` or `swift_weakLoadStrong` near the top of a Time Profiler trace; the Allocations instrument reports millions of short-lived heap objects; a leak or unbounded growth traces back to a retain cycle; you are writing a tight parsing or numeric loop; or you are tempted to drop down to `UnsafeBufferPointer`. It also applies when choosing struct vs. class for a hot type.

## Core guidance

- **Profile first, then change one thing.** Use the Time Profiler and Allocations instruments to find the real hotspot. "Faster" code that the optimizer already handled is wasted effort and lost clarity.
- **Prefer value types for data.** Structs and enums get value semantics and often live on the stack or inline, avoiding ARC entirely. Reach for a class only when you need identity or shared mutable state.
- **Trust copy-on-write, don't fight it.** Standard collections (`Array`, `Dictionary`, `String`) share a buffer until first mutation. A "copy" is cheap; the allocation happens on write. Avoid forcing copies in loops and watch for unintended sharing of a `mutating` buffer.
- **Break every reference cycle deliberately.** Two classes that strong-reference each other, or a closure capturing `self` strongly, leak. Use `weak` when the referent may outlive you (optional, auto-niled); use `unowned` only when the referent provably outlives the reference (non-optional, traps if wrong).
- **Write capture lists explicitly in escaping closures.** `[weak self]` then `guard let self else { return }` is the safe default; `[unowned self]` only with a proven lifetime. Capturing a `let` value copies it; that is usually what you want.
- **Use ownership keywords to remove copies, not as decoration.** `borrowing` takes a read-only view without a retain; `consuming` takes ownership and ends the caller's use. `inout` mutates in place via exclusive access. These pay off most on noncopyable (`~Copyable`) types and hot paths.
- **Reach for `Span` instead of unsafe pointers.** `Span` (Swift 6.2) is a borrowed, bounds-checked, non-escapable view over contiguous storage — the memory-safe replacement for `UnsafeBufferPointer` in performance-critical loops. Pair with `InlineArray<N, T>` for fixed-size inline storage.

```swift
final class Downloader {
    var onDone: (() -> Void)?
    func start() {
        fetch { [weak self] data in
            guard let self else { return }   // no cycle, safe if self is gone
            self.handle(data)
        }
    }
    func handle(_ data: Data) { /* ... */ }
}
```

## Platform notes

- ARC behavior is identical across iOS, iPadOS, macOS, watchOS, tvOS, and visionOS; the runtime functions and Instruments templates are the same everywhere.
- `Span`, `MutableSpan`, `RawSpan`, and `InlineArray` require the Swift 6.2 standard library (Xcode 26 toolchain). They have no Objective-C bridge — keep them off API boundaries that cross into Cocoa.
- Bridging `Array`/`String`/`Data` to and from Objective-C and C can force allocations and copies; on memory-constrained targets like watchOS, prefer pure-Swift contiguous types in hot paths.

## Pitfalls

- **`unowned` after the referent is freed traps (or reads garbage).** Only use it for relationships where the lifetime is structurally guaranteed; otherwise use `weak`.
- **Capturing `self` implicitly in an escaping closure creates a cycle.** The compiler now warns, but `[weak self]` is still on you to add.
- **A `weak` self check that does nothing on `nil` can silently swallow work** — decide whether `return` or a fallback is correct.
- **Micro-optimizing copyable collections rarely helps.** COW already makes most copies cheap; chasing them obscures the genuine hotspot.
- **`Span` is non-escapable by design.** You cannot store it in a property or return it past the lifetime of its source; the compiler enforces this. Don't try to defeat it with unsafe escape hatches.
- **`consuming` ends the caller's access.** Using a value after passing it `consuming` is a compile error for `~Copyable` types — restructure rather than copying around the constraint.

## References

- **Documentation:** [Automatic Reference Counting (The Swift Programming Language)](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/automaticreferencecounting/)
- **Documentation:** [Span (Swift Standard Library)](https://developer.apple.com/documentation/swift/span)
- **Documentation:** [MutableSpan (Swift Standard Library)](https://developer.apple.com/documentation/swift/mutablespan)
- **WWDC:** [Explore Swift performance (WWDC24)](https://developer.apple.com/videos/play/wwdc2024/10217/)
- **WWDC:** [Consume noncopyable types in Swift (WWDC24)](https://developer.apple.com/videos/play/wwdc2024/10170/)
- **WWDC:** [Improve memory usage and performance with Swift (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/312/)

## See also

Lean on a Swift concurrency skill for actor isolation and `Sendable` reference handling, and an Instruments-and-profiling skill for driving the Time Profiler and Allocations templates that justify any change here. A Swift macros or generics skill helps when abstraction cost (witness tables, specialization) is the bottleneck rather than allocation.
