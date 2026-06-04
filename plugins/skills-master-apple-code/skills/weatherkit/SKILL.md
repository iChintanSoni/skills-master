---
name: weatherkit
description: Fetch current conditions, hourly and daily forecasts, severe weather alerts, and next-hour minute precipitation from Apple WeatherKit on Apple platforms or via the REST API. Use when an app shows weather data, when wiring WeatherService.shared, when required Apple Weather attribution and legal links are missing, or when a server needs signed JWT REST access.
---

## When to use

Reach for WeatherKit when an app or service needs Apple-sourced weather: current conditions, up to 10-day daily and hourly forecasts, next-hour minute precipitation, and severe weather alerts. On Apple platforms use the native `WeatherService` Swift API; on a server or non-Apple client use the REST API with a signed token. Skip it when you only need a static climate average or already have a contracted provider with different attribution terms.

## Core guidance

- Do request only the datasets you render. Use a `weather(for:including:)` overload (e.g. `.current`, `.daily`) instead of fetching the full `Weather` bundle, which lowers cost against your 500,000 calls/month allotment.
- Do enable the WeatherKit capability so the `com.apple.developer.weatherkit` entitlement is added, and register the service identifier in your Apple Developer account before building.
- Do display attribution wherever weather data appears: the Apple Weather mark plus a tappable legal link to the data-source page. Read `serviceName`, `legalPageURL`, and the mark URLs from `WeatherService.shared.attribution`; never hardcode them.
- Don't poll on a tight timer. Cache responses and refresh on a sensible cadence (minute precipitation ages fastest, daily forecasts slowest) to stay within quota.
- Don't assume `minuteForecast` or `weatherAlerts` exist; both are regional and optional, so unwrap before use.
- Do treat all calls as throwing and async; wrap network and decoding failures and surface a retry path.

```swift
import WeatherKit
import CoreLocation

let service = WeatherService.shared
let loc = CLLocation(latitude: 37.33, longitude: -122.03)

let (current, daily) = try await service.weather(for: loc, including: .current, .daily)
print(current.temperature, daily.forecast.count)

let credit = service.attribution
// Render credit.squareMarkURL and link credit.legalPageURL.
```

## Platform notes

- Available on iOS/iPadOS 16, macOS 13, watchOS 9, tvOS 16, and visionOS 1 and later; the Swift API ships in the WeatherKit framework on every Apple platform.
- WeatherKit needs a device location, not a Location Services authorization of its own, but obtaining `CLLocation` from the user's position requires a `NSLocationWhenInUseUsageDescription` Info.plist string and `CLLocationManager` authorization. A geocoded or user-entered coordinate avoids that prompt.
- For servers and Android/web clients, use the REST API at `https://weatherkit.apple.com/api/v1/`. Sign an ES256 JWT with a WeatherKit private key, set the `kid` header to the key ID and `sub`/`id` to `TEAMID.serviceID`, and send it as `Authorization: Bearer <token>`. The `/availability` endpoint reports which datasets a coordinate supports.
- Attribution duty applies identically on REST: fetch the localized marks and legal URL from the attribution endpoint and display them in your UI.

## Pitfalls

- Shipping without attribution violates the WeatherKit terms; reviewers reject apps missing the Apple Weather mark or the legal link.
- Requesting the full forecast every refresh burns quota fast; the per-membership limit is monthly, and overage is billed.
- Hourly and daily forecasts return fixed-length windows beginning at the current period, so index defensively rather than assuming an exact count.
- Building the REST JWT with `HS256` or an Apple Push key fails auth; WeatherKit requires a dedicated WeatherKit key and `ES256`.
- Treating `condition` or `symbolName` strings as stable identifiers across OS releases can break UI mapping; map from the documented condition set.

## References

- **Documentation:** [WeatherKit](https://developer.apple.com/documentation/weatherkit)
- **Documentation:** [WeatherService](https://developer.apple.com/documentation/weatherkit/weatherservice)
- **Documentation:** [WeatherKit REST API](https://developer.apple.com/documentation/weatherkitrestapi)
- **Documentation:** [Request authentication for WeatherKit REST API](https://developer.apple.com/documentation/weatherkitrestapi/request-authentication-for-weatherkit-rest-api)
- **WWDC:** [Meet WeatherKit (WWDC22)](https://developer.apple.com/videos/play/wwdc2022/10003/)
- **Documentation:** [WeatherKit data source attribution](https://developer.apple.com/weatherkit/data-source-attribution/)

## See also

- Pair with a Core Location skill to resolve a `CLLocation` before calling `weather(for:)`, and a SwiftUI data-loading skill to drive the async fetch and render the attribution mark.
- For background refresh of cached forecasts, see a Background Tasks skill; for charting hourly trends, see a Swift Charts skill.
