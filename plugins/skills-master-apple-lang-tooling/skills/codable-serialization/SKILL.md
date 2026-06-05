---
name: codable-serialization
description: "Guidance for serializing Swift types with Codable: conforming to Encodable/Decodable, CodingKeys, JSONEncoder/JSONDecoder strategies, custom encode(to:)/init(from:), nested and dynamic keys, optional/missing fields, property lists, and robust decoding of imperfect JSON. Use when modeling API responses, persisting data, parsing JSON or plists, mapping snake_case keys, decoding dates, or hardening a decoder against malformed input."
---

## When to use

Reach for this skill when a Swift type needs to cross a boundary as JSON or a property list: decoding API responses, persisting documents, writing user defaults payloads, or round-tripping fixtures in tests. It applies whenever you write a `CodingKeys` enum, configure a `JSONDecoder`, hand-roll `init(from:)`, or need a model to survive JSON that omits fields, renames keys, or mixes types.

## Core guidance

- Prefer synthesized conformance: declare stored properties and add `: Codable`. The compiler generates `CodingKeys`, `encode(to:)`, and `init(from:)` only when every member already conforms.
- Set strategies on the coder, not per-property. Use `keyDecodingStrategy = .convertFromSnakeCase` and a single `dateDecodingStrategy` (usually `.iso8601`) so models stay free of naming and date boilerplate.
- Declare a full `CodingKeys` case set when you customize even one key. Omitting a property's case excludes it from coding entirely — a silent way to drop fields you meant to keep.
- Model genuinely-absent fields as `Optional`. A missing key decodes to `nil` automatically, but a present `null` also yields `nil`; if you must tell them apart, decode with `decodeIfPresent` in a custom initializer.
- Don't reach for custom `init(from:)` until the synthesized one fails you. When you do, validate inputs there — synthesized decoders only check type and nullability, not ranges, enums, or invariants.
- Use `nestedContainer(keyedBy:forKey:)` to flatten one JSON layer into a flat model, and a string-backed `CodingKey` struct for dynamic dictionaries whose keys are data.
- Make decoding total: give defaults via `??`, map unknown enum cases to a fallback, and never assume array elements are uniform. Wrap fragile elements so one bad record doesn't fail the whole payload.

```swift
struct Article: Decodable {
    let id: Int
    let title: String
    let tags: [String]
    let publishedAt: Date?

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(Int.self, forKey: .id)
        title = try c.decode(String.self, forKey: .title)
        tags = try c.decodeIfPresent([String].self, forKey: .tags) ?? []
        publishedAt = try c.decodeIfPresent(Date.self, forKey: .publishedAt)
    }
    enum CodingKeys: String, CodingKey { case id, title, tags, publishedAt }
}
```

## Platform notes

- `JSONEncoder`/`JSONDecoder` and `PropertyListEncoder`/`PropertyListDecoder` ship in Foundation on every Apple platform; the Codable protocols live in the standard library, so they work in pure-Swift packages without Foundation.
- For plists, choose `PropertyListEncoder().outputFormat = .xml` for human-diffable files or `.binary` for compact storage; decoding auto-detects the format unless you pass one explicitly.
- Under Swift 6 strict concurrency, configure a coder on the actor or thread that uses it. Encoders and decoders are not `Sendable`; create a fresh instance per use rather than sharing one across tasks.
- `JSONDecoder` accepts JSON5 via `allowsJSON5 = true` when you must read config files with comments or trailing commas; keep it off for untrusted network input.

## Pitfalls

- Setting `.convertFromSnakeCase` and also declaring snake_case raw values in `CodingKeys` double-converts and fails to match. Pick one mechanism per model.
- Returning `try?` around a whole `decode` call swallows the `DecodingError` and hides exactly which key or type broke. Catch and log the error during development instead.
- Floating-point money and large integers lose precision through `Double`. Decode such fields as `String` or `Decimal` from the raw JSON text.
- A non-optional property with no matching key throws `keyNotFound`, aborting the entire object. Audit which fields the server may omit before shipping.
- Custom `encode(to:)` without a matching `init(from:)` (or vice versa) drifts silently; keep the two in sync so round-trips are lossless.

## References

- **Documentation:** [Encoding and Decoding Custom Types](https://developer.apple.com/documentation/foundation/encoding-and-decoding-custom-types)
- **Documentation:** [Codable](https://developer.apple.com/documentation/swift/codable)
- **Documentation:** [JSONDecoder.KeyDecodingStrategy](https://developer.apple.com/documentation/foundation/jsondecoder/keydecodingstrategy-swift.enum)
- **Documentation:** [JSONDecoder.DateDecodingStrategy](https://developer.apple.com/documentation/foundation/jsondecoder/datedecodingstrategy-swift.enum)
- **Documentation:** [PropertyListDecoder](https://developer.apple.com/documentation/foundation/propertylistdecoder)
- **WWDC:** [Data You Can Trust (WWDC18)](https://developer.apple.com/videos/play/wwdc2018/222/)

## See also

Pair this with a networking skill for end-to-end request-to-model decoding, and with a SwiftData or file-persistence skill when serialized payloads become the on-disk storage format. For shaping API types that survive schema evolution, see guidance on versioning and optional field design.
