---
name: choosing-distribution
description: "Decision guide for picking an Apple app distribution channel — App Store, TestFlight, Ad Hoc, Custom/Unlisted apps, the Enterprise Program, and notarized Developer ID for Mac. Use when shipping a build to users, choosing a delivery channel, planning beta testing, deciding between public and private release, or distributing a Mac app outside the Mac App Store."
tags: [distribution, app-store, testflight, notarization, enterprise]
x-skills-master:
  domain: apple
  class: overview
  category: overviews
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  pairs_with: []
  sources:
    - https://developer.apple.com/help/app-store-connect/manage-your-apps-availability/set-distribution-methods/
    - https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/
    - https://developer.apple.com/documentation/security/notarizing-macos-software-before-distribution
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

# Choosing a distribution method

## When to use

Reach for this guide when you need to get a build into someone's hands and must decide *how*: a public launch, a closed beta, a quick install on a test phone, a private app for one company, or a Mac app shipped from your own website. The right channel depends on your audience size, whether the app is public or internal, the platform, and how much review friction you can tolerate. Pick the channel before you configure signing — the distribution method determines the certificate and provisioning profile you need.

## Core guidance

- **Default to the App Store.** Public, Unlisted, and Custom apps all flow through App Store Connect and App Review, get cloud-managed signing, automatic updates, and work on every platform. Most apps belong here.
- **Use TestFlight for all pre-release testing**, not Ad Hoc. Internal testers (up to 100 App Store Connect users) install immediately; external testers (up to 10,000, via email or a public link) require a one-time App Review of the first build. Builds expire after 90 days.
- **Reserve Ad Hoc for tiny, device-pinned tests** when App Store Connect is not an option — up to 100 devices *per device type per year*, each added by UDID. It is fiddly and does not auto-update; prefer TestFlight whenever you can.
- **Pick Unlisted for a public-but-undiscoverable app** (reachable only by direct link, e.g. for conference or training apps) and **Custom apps** for private distribution to specific organizations through Apple Business Manager or Apple School Manager. Both ship via App Store Connect.
- **Avoid the Apple Developer Enterprise Program** unless you genuinely cannot use App Store, Custom apps, Ad Hoc, or TestFlight. It costs 299 USD/year, requires 100+ employees, and is strictly for proprietary internal apps distributed only to your own employees — misuse gets credentials revoked.
- **On the Mac, you have a fifth option:** sign with a Developer ID certificate, notarize with the Apple notary service, and staple the ticket — then distribute the app yourself (website, MDM, installer). This is the standard path for Mac apps outside the Mac App Store.
- **Don't conflate enrollment programs.** The 99 USD/year Apple Developer Program covers everything except in-house Enterprise distribution; the 299 USD Enterprise Program covers *only* internal apps and cannot publish to the App Store.

## Platform notes

- **iOS/iPadOS/tvOS/watchOS/visionOS:** App Store, TestFlight, Ad Hoc, Custom, and Unlisted are available. There is no notarized direct-install path; sideloading exceptions (EU alternative marketplaces, Web Distribution) are separate, jurisdiction-specific programs.
- **macOS:** Adds Developer ID + notarization for direct distribution. Notarization is mandatory for software distributed outside the Mac App Store on macOS 10.15+; Gatekeeper blocks unnotarized apps.
- **visionOS / watchOS:** Distribute through the same App Store Connect record as the host app; TestFlight covers betas.
- **Custom apps** require a managed organization in Apple Business Manager or Apple School Manager on the receiving end.

## Pitfalls

- **Ad Hoc's "100 devices" is per device type, resets yearly, and devices can't be removed mid-cycle** — burning slots on throwaway test devices is permanent until renewal.
- **Switching distribution method after approval is largely one-way.** Public can become Unlisted, but moving between public and private means creating a new app record and resubmitting.
- **TestFlight external builds need App Review;** budget a day or two for the first build of a beta group, even though later builds usually clear faster.
- **Using the Enterprise Program for public or consumer apps violates the agreement** and is a fast route to revoked certificates that brick every installed app.
- **Forgetting to staple the notarization ticket** means offline Macs can't verify the app; always run `xcrun stapler staple` after notarizing.

```bash
# Notarize a Mac app for Developer ID distribution, then staple the ticket.
xcrun notarytool submit MyApp.zip \
  --keychain-profile "AC_NOTARY" --wait
xcrun stapler staple "MyApp.app"
spctl --assess --type execute --verbose "MyApp.app"  # expect: accepted, Notarized Developer ID
```

## References

- **Documentation:** [Set distribution methods (App Store Connect)](https://developer.apple.com/help/app-store-connect/manage-your-apps-availability/set-distribution-methods/)
- **Documentation:** [TestFlight overview](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/)
- **Documentation:** [Notarizing macOS software before distribution](https://developer.apple.com/documentation/security/notarizing-macos-software-before-distribution)
- **Documentation:** [Unlisted app distribution](https://developer.apple.com/support/unlisted-app-distribution/)
- **Documentation:** [Apple Developer Enterprise Program](https://developer.apple.com/programs/enterprise/)
- **WWDC:** [Custom app distribution with Apple Business Manager (WWDC20)](https://developer.apple.com/videos/play/wwdc2020/10667/)

## See also

For the signing certificates and provisioning profiles each channel requires, see a code-signing skill. For automating uploads and notarization in CI, see a build-and-release or fastlane-style automation skill. For preparing metadata and screenshots, see an App Store submission skill, and for managed deployment to organization devices, see an MDM / Apple Business Manager skill.
