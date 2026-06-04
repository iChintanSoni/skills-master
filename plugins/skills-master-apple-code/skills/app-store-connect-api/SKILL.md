---
name: app-store-connect-api
description: "Guides REST automation against the App Store Connect API: signing ES256 JWT bearer tokens from an API key, navigating the apps/builds/versions/TestFlight/users/sales-reports resource model, handling pagination and rate limits, and generating a client from the published OpenAPI spec. Use when scripting CI uploads, managing TestFlight beta groups or testers, pulling sales or finance reports, or building tooling that talks to api.appstoreconnect.apple.com."
---

## When to use

Reach for the App Store Connect API whenever you need to drive App Store Connect from outside the web UI: uploading and submitting builds in CI, wiring up TestFlight beta groups and testers, flipping app version metadata, provisioning team members, or downloading sales and finance reports on a schedule. It is a plain JSON:API-style REST surface consumed over HTTPS from tooling in any language — there is no client framework to import into your app. Skip it for runtime in-app work like receipt validation or transaction lookups, which belong to the separate App Store Server API.

## Core guidance

- **Do** create the API key under **Users and Access → Integrations → App Store Connect API** in the web UI. You download the `.p8` private key exactly once; store it as a secret and record the Key ID and Issuer ID alongside it.
- **Do** sign a fresh ES256 JWT per short burst of calls. The header carries `alg: "ES256"`, `kid: <Key ID>`, `typ: "JWT"`; the payload carries `iss: <Issuer ID>`, `iat`, `exp`, and `aud: "appstoreconnect-v1"`. Send it as `Authorization: Bearer <jwt>`.
- **Don't** set `exp` more than 20 minutes ahead — longer windows are rejected with `401`. Regenerate rather than reuse stale tokens; the token is cheap to mint and need not be cached across jobs.
- **Do** scope keys to the least role that works (Developer, App Manager, Finance) and use a team-key Issuer ID, not your personal login.
- **Don't** hand-build URLs with `offset`. Page by following the `links.next` URL in each response until it is absent, and cap page size with `limit` (commonly up to 200). Expand related data with `include=` and trim payloads with `fields[type]=`.
- **Do** read the `x-rate-limit` response header (e.g. `user-hour-lim:3600;user-hour-rem:…`) and back off on `429`; treat the hourly budget as shared across all keys for the team.
- **Do** generate a typed client from Apple's published OpenAPI spec instead of hand-rolling models — feed it to Swift OpenAPI Generator or any OpenAPI tool so resource shapes stay current.

```swift
import Crypto, Foundation   // swift-crypto provides P256 signing

func bearerToken(keyID: String, issuerID: String, p8: P256.Signing.PrivateKey) throws -> String {
    let header = ["alg": "ES256", "kid": keyID, "typ": "JWT"]
    let now = Int(Date().timeIntervalSince1970)
    let claims = ["iss": issuerID, "iat": now, "exp": now + 1140, // <= 20 min
                  "aud": "appstoreconnect-v1"] as [String: Any]
    let signingInput = try b64(header) + "." + b64(claims)
    let sig = try p8.signature(for: Data(signingInput.utf8)).rawRepresentation
    return signingInput + "." + sig.base64URLEncodedString()
}
```

## Platform notes

The API is platform-agnostic: it is consumed over HTTPS from CI runners, servers, scripts, or local tooling on macOS, Linux, or Windows, and the data it returns spans every app platform (iOS, iPadOS, macOS, watchOS, tvOS, visionOS). The base URL is `https://api.appstoreconnect.apple.com/v1`; report and binary-upload endpoints differ in content type but share the same auth. There is no Info.plist or device permission to declare — credentials are the `.p8` key plus Key ID and Issuer ID, which must live in your secret store (CI secrets, Keychain, or a vault), never in the repo. For CI build uploads, the App Store Connect API now exposes a Build Upload flow alongside `xcrun altool`/Transporter, and TestFlight, build, and feedback events can be delivered to your server via the Webhooks API rather than polled.

## Pitfalls

- Setting `exp` beyond 20 minutes, or letting clock skew push it past the window, yields a silent `401`; sync the runner clock and keep the window short.
- Forgetting that the `.p8` download is one-time — losing it means revoking and reissuing the key, which breaks every pipeline using it.
- Assuming `offset` paging is stable; large collections can shift between pages, so prefer following `links.next` and avoid resuming from a saved offset.
- Hammering endpoints in tight loops trips the per-hour and an undocumented per-minute limit; honor `429`/`Retry` signals instead of retrying immediately.
- Confusing the App Store Connect API with the App Store Server API — different hosts, audiences, and use cases; do not reuse one key or token shape for the other.
- Sales and finance report endpoints return gzipped TSV, not JSON, and require exact `filter[frequency]`/`filter[reportDate]` parameters — a wrong combination returns an empty 200 rather than an error.

## References

- **Documentation:** [App Store Connect API](https://developer.apple.com/documentation/appstoreconnectapi)
- **Documentation:** [Creating API Keys for App Store Connect API](https://developer.apple.com/documentation/appstoreconnectapi/creating-api-keys-for-app-store-connect-api)
- **Documentation:** [Generating Tokens for API Requests](https://developer.apple.com/documentation/appstoreconnectapi/generating-tokens-for-api-requests)
- **Documentation:** [Identifying Rate Limits](https://developer.apple.com/documentation/appstoreconnectapi/identifying-rate-limits)
- **Documentation:** [Large Data Sets (paging)](https://developer.apple.com/documentation/appstoreconnectapi/large-data-sets)
- **WWDC:** [Automate your development process with the App Store Connect API (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/324/)
- **WWDC:** [Expanding automation with the App Store Connect API (WWDC20)](https://developer.apple.com/videos/play/wwdc2020/10004/)

## See also

Pair this with a Fastlane or CI-pipeline skill when the goal is automated uploads and TestFlight distribution, and with an App Store Server API skill when you need in-app purchase and transaction verification at runtime — the two Apple HTTP APIs share JWT/ES256 mechanics but serve different jobs. A Swift OpenAPI Generator skill complements this one for turning Apple's published spec into a typed client.
