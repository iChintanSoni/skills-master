---
name: error-handling
description: "Guidance on Swift error handling: the Error protocol, throws/try/do-catch, typed throws, Result, rethrows, defer, and propagating errors from async code. Use when designing failable APIs, deciding throw vs Result vs optional, modeling recoverable vs programmer errors, or migrating to typed throws."
---

## When to use

Reach for this skill when an operation can fail in ways the caller should
recover from, and you need to pick a representation. Throwing is the default for
synchronous and `async` failable work; `Result` shines when you must store or
defer a success-or-failure value (for example, a captured completion-handler
outcome). Optionals fit only "absence" with no useful reason for the failure.
Use it also when migrating an API to **typed throws** or auditing how errors
flow out of `Task` and structured concurrency.

## Core guidance

- Do conform error types to `Error` — usually a frozen `enum` of cases with
  associated values that carry context (a bad URL, an HTTP status). Add
  `LocalizedError` only when a human-facing message is genuinely needed.
- Do throw for recoverable failures; do **not** throw for programmer errors
  (broken invariants, force-unwrap of a guaranteed value). Use `precondition`
  or `fatalError` there so bugs surface loudly instead of being caught.
- Do prefer `throws` over `Result` for normal control flow; `try` reads
  linearly and chains. Reserve `Result` for *storing* an outcome or bridging
  callback APIs, then call `try result.get()` to re-enter the throwing world.
- Do use **typed throws** (`throws(MyError)`) only for self-contained, fully
  exhaustive error domains, generic propagation, or Embedded Swift. Plain
  `throws` (i.e. `throws(any Error)`) stays the right default for evolvable
  library APIs — typing locks the surface and breaks source compatibility later.
- Do reach for `try?` to convert failure to `nil` when the *reason* is
  irrelevant, and `try!` only where failure is logically impossible. Don't
  pepper code with `try?` that silently swallows actionable errors.
- Do use `defer` for cleanup (close handles, balance a lock) so it runs on every
  exit path, including a thrown error mid-block — but keep defer bodies small
  and non-throwing.
- Do let `async` functions throw naturally; an awaited error propagates like any
  other and, inside a task group or `async let`, cancels sibling child tasks.

```swift
enum ImportError: Error { case empty, malformed(line: Int) }

func parse(_ data: Data) throws(ImportError) -> [Row] {
    guard !data.isEmpty else { throw ImportError.empty }
    // ...catch here is statically known to be ImportError
    return rows
}
```

## Platform notes

Error handling is a pure language feature, so behavior is identical across iOS,
iPadOS, macOS, watchOS, tvOS, and visionOS. Typed throws, `throws(Never)`, and
the refined `do`/`catch` type inference require the Swift 6 compiler (Xcode 26
ships it); guard adoption behind a tools version when a package must build on
older toolchains. Standard-library `CancellationError` is what a cancelled
`Task` throws — treat it as expected flow, not a bug. On Apple platforms,
`NSError` bridges automatically to `Error`, so Cocoa APIs surfacing
`NSError **` become ordinary `throws` functions you catch the same way.

## Pitfalls

- Assuming `throws(A | B)` works — Swift has **no** union throw syntax. If more
  than one concrete type can escape, the throw type is `any Error`.
- Catching with a bare `catch` that hides which errors are possible; prefer
  pattern-matched `catch ImportError.malformed(let line)` clauses, then a final
  catch-all only if untyped.
- Using `Result` everywhere out of habit — it adds `get()`/`switch` ceremony
  where a plain `try` call would be shorter and composable.
- Throwing for control flow that isn't an error (end-of-sequence, "not found"
  where `nil` is natural). Errors imply something went wrong.
- Forgetting that `try?` on a typed-throws call still erases the error to `nil`;
  you lose the typed information you carefully modeled.
- Letting a `defer` block throw or perform heavy work — it obscures the original
  error and complicates reasoning about exit paths.

## References

- **Documentation:** [Error Handling — The Swift Programming Language](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/errorhandling/)
- **Documentation:** [SE-0413: Typed throws](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0413-typed-throws.md)
- **Documentation:** [Result | Apple Developer Documentation](https://developer.apple.com/documentation/swift/result)
- **WWDC:** [Meet async/await in Swift (WWDC21)](https://developer.apple.com/videos/play/wwdc2021/10132/)
- **WWDC:** [Explore structured concurrency in Swift (WWDC21)](https://developer.apple.com/videos/play/wwdc2021/10134/)

## See also

Pair this with a Swift concurrency skill for how errors propagate through
`Task`, task groups, and `async let`, and with an API-design skill when deciding
whether a failure belongs in the type signature at all. A logging or
diagnostics skill complements it for what to record when you catch.
