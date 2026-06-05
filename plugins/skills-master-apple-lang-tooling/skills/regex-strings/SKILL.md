---
name: regex-strings
description: Guidance for Swift string processing with the Regex type, covering regex literals, the RegexBuilder DSL, Capture and TryCapture, matching/replacing/splitting, Unicode-correct grapheme handling, and localized comparison. Use when parsing or validating text, extracting structured fields, choosing between a regex and plain String APIs, fixing emoji or accent mismatches, or porting NSRegularExpression to Swift Regex.
---

## When to use

Reach for this guidance when text has internal structure worth parsing: log lines, dates, currency, identifiers, or fields you must validate or extract. Swift's `Regex` type (Swift 5.7+, fully available on the current toolchain) gives compile-time-checked literals, a readable builder DSL, and typed captures, replacing stringly-typed `NSRegularExpression`. Skip it when a plain `String` method already answers the question — `hasPrefix`, `contains`, `split(separator:)`, or `Substring` slicing are clearer and faster than a pattern. It is also the wrong tool for deeply nested or recursive grammars; prefer a real parser there.

## Core guidance

- Prefer a regex literal `/.../` for fixed patterns: the compiler parses it, infers the typed output, and flags syntax errors at build time. Build `Regex` from a runtime string only when the pattern itself is dynamic, and handle the `try` it throws.
- Reach for the `RegexBuilder` DSL when a pattern grows past a line or needs typed transforms; `import RegexBuilder` and compose `Regex`, `OneOrMore`, `Optionally`, and `ChoiceOf`. It compiles to the same engine, so readability costs nothing at runtime.
- Use `Capture` to pull out a substring and `TryCapture` to capture *and* convert in one step — its `transform` returning `nil` makes the whole match fail and backtrack, so an `Int.init` or date parse doubles as validation.
- Pick the matching verb deliberately: `wholeMatch(of:)` for validating an entire field, `firstMatch(of:)` to find one occurrence, `matches(of:)` to iterate all, and the regex overloads of `replacing`, `split`, `trimmingPrefix`, and `contains` for transforms.
- Default grapheme-cluster semantics make `.` and `\w` match user-perceived characters, so emoji and combining marks behave; drop to `.matchingSemantics(.unicodeScalar)` only when you deliberately need scalar-level matching, and expect non-Character-aligned indices.
- Set behavior explicitly rather than relying on inline flags: `.ignoresCase()`, `.dotMatchesNewlines()`, and `.anchorsMatchLineEndings()` read clearly and apply to a whole `Regex`.
- For human-facing sorting and equality, do not regex it — use `localizedStandardCompare(_:)` or `compare(_:options:)` so accents, case, and locale collation are handled correctly.

```swift
import RegexBuilder

let entry = Regex {
    "["
    Capture { OneOrMore(.digit) } transform: { Int($0) }   // status code
    "] "
    Capture(/[^ ]+/)                                        // path
}
if let m = "[404] /missing".firstMatch(of: entry) {
    let (_, code, path) = m.output   // code: Int?, path: Substring
    print(code ?? -1, path)
}
```

## Platform notes

`Regex` and `RegexBuilder` ship in the Swift standard library, so they work on every Apple platform plus Linux and Windows with no `import Foundation`. The literal syntax and the typed-output inference need Swift 5.7 or later; under Swift 6 language mode a `Regex` value is `Sendable`, so it is safe to build once and share across actors. Foundation adds bridges worth knowing: `Date`, `Decimal`, and `URL` expose parse-strategy `RegexComponent`s (for example `One(.iso8601)` or `.localizedCurrency(code:)`), letting you embed locale-aware parsing directly inside a builder. The older `NSRegularExpression` remains for ICU-syntax compatibility, but new code should prefer `Regex`. Capturing into a typed tuple has no platform caveats; named captures via `Reference` work identically everywhere.

## Pitfalls

- Building `try Regex(userInput)` from untrusted text invites both injection and catastrophic backtracking; validate or constrain the source, and prefer a fixed literal whenever the shape is known.
- Forgetting that `firstMatch` searches anywhere while `wholeMatch` requires the entire input — using `firstMatch` for validation accepts strings with extra trailing junk.
- Comparing or de-duplicating user text with `==` or a regex instead of a localized comparison: `"café"` written with a precomposed é versus a combining accent are equal as `String` but differ scalar-by-scalar.
- Assuming `.` skips newlines or `^`/`$` match line boundaries by default; they do not until you add `.dotMatchesNewlines()` or `.anchorsMatchLineEndings()`.
- Reaching for `.unicodeScalar` semantics and then slicing the original `String` with the resulting indices — they may land inside a grapheme cluster and trap.
- Reusing a regex literal where a one-line `String` API suffices: `text.contains("error")` beats `text.contains(/error/)` in clarity and speed.

## References

- **Documentation:** [Regex](https://developer.apple.com/documentation/swift/regex)
- **Documentation:** [RegexBuilder](https://developer.apple.com/documentation/regexbuilder)
- **Documentation:** [TryCapture](https://developer.apple.com/documentation/regexbuilder/trycapture)
- **Documentation:** [Regex.matchingSemantics(_:)](https://developer.apple.com/documentation/swift/regex/matchingsemantics(_:))
- **WWDC:** [Meet Swift Regex (WWDC22)](https://developer.apple.com/videos/play/wwdc2022/110357/)
- **WWDC:** [Swift Regex: Beyond the basics (WWDC22)](https://developer.apple.com/videos/play/wwdc2022/110358/)

## See also

For the Unicode-correctness mindset behind grapheme-cluster matching and localized comparison, pair this with broader Swift string and collection idioms. When a regex starts standing in for a grammar, step up to a dedicated parser instead. Validation logic extracted via `TryCapture` often feeds model types covered by the Swift concurrency and value-type modeling skills.
