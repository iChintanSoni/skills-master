---
name: choosing-web-embedding
description: "Decision router for showing web content in an Apple app: the SwiftUI WebView and WebPage pair or WKWebView when you own the page, SFSafariViewController for read-only third-party browsing, ASWebAuthenticationSession for OAuth and OpenID Connect sign-in, openURL to hand off to the default browser, and universal links or App Clips when the answer is not to embed at all. Use when picking a web surface, when a sign-in flow tempts a raw web view, or when weighing the App Review risk of wrapping a website as an app."
tags: [webkit, safariservices, authenticationservices, oauth, app-review, decision]
x-skills-master:
  domain: apple
  class: overview
  category: overviews
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  pairs_with: [sign-in-with-apple]
  sources:
    - https://developer.apple.com/documentation/webkit/wkwebview
    - https://developer.apple.com/documentation/safariservices/sfsafariviewcontroller
    - https://developer.apple.com/documentation/authenticationservices/aswebauthenticationsession
  snapshot_date: "2026-08-25"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for this guide whenever a URL, an HTML document, or a sign-in flow has to
appear somewhere in an Apple app and the surface is not already settled. It also
applies when someone proposes shipping an existing website as an app — that
carries App Review consequences, not just engineering ones. It routes the
decision; it does not teach WebKit.

## Core guidance

Answer one question first: **do you own the content, and do you need to control
it?** Every branch follows from that.

### You do not own the page, and only need to show it

`SFSafariViewController` is the right default for terms of service, a help
article, an outbound link in a feed, or a partner's page. You get Safari's
engine and chrome for almost no code — Reader, AutoFill, Fraudulent Website
Warning, and the user's content blockers all work — and your app cannot observe
what happens inside. That isolation is the feature: you inherit none of the
third party's security surface and none of the responsibility for it.

- Configure it through `SFSafariViewController.Configuration`
  (`entersReaderIfAvailable`, `barCollapsingEnabled`) instead of rebuilding
  browser chrome yourself.
- It does **not** give your app access to AutoFill data, browsing history, or
  website data, and it is not a way to share a session with Safari — Apple points
  at `ASWebAuthenticationSession` for that.
- Reserve the sheet and popover presentation styles for short app-owned
  documents; full-screen is the intended style for real website content.

### You own the page and need to control it

- In the 26 cycle WebKit gained a SwiftUI-native pair: `WebView`, a view, and
  `WebPage`, an observable model you bind to it (iOS, iPadOS, macOS, and
  visionOS 26 and later). Prefer this for new SwiftUI code — navigation
  decisions, JavaScript evaluation, and page state are Swift-typed and
  observable rather than delegate-shaped.
- `WKWebView` remains correct for UIKit and AppKit hosts, for deployment floors
  below 26, and for the corners `WebPage` does not yet surface.
- Pick this branch only for content you genuinely control: bundled offline HTML,
  a document or report renderer, a hybrid screen mixing web and native chrome,
  or a page you need to script and intercept.
- Everything inside that web view runs in your app's context. Any bridge you
  expose, any script the page loads, any origin it can reach is now your
  security review. Scope it deliberately and keep third-party script out.

### The flow is sign-in

This is the branch teams most often get wrong. OAuth 2.0 and OpenID Connect
flows belong in `ASWebAuthenticationSession`, not in a `WKWebView` you present
yourself.

- The session runs in a browsing context the system owns, so your app cannot
  read what the user types. That is precisely what identity providers want, and
  many now reject embedded web views outright.
- It shares the browser's session, so a user already authenticated with the
  provider is not asked again. Set `prefersEphemeralWebBrowserSession` when you
  deliberately want a clean slate — a shared device, or an "add another account"
  flow.
- The system asks the user before starting, naming the domain, and guarantees
  the callback reaches only the app that started the session even when several
  apps claim the same scheme.
- Use `init(url:callback:completionHandler:)` with an
  `ASWebAuthenticationSession.Callback`. Prefer `.https(host:path:)` over
  `.customScheme(_:)` — a custom scheme is claimable by any app on the device,
  an https callback is bound to a domain you control. The older
  `callbackURLScheme:` initializer is deprecated.
- Before building any of it, ask whether the app needs a web sign-in at all.
  Sign in with Apple and passkeys remove the browser hop entirely.

### Nothing needs embedding

- `openURL` — the SwiftUI environment value, or a `Link` — hands the URL to the
  user's default browser. Correct for destinations that should leave your app:
  marketing pages, external sites you have no relationship with, anything the
  user may want to keep, bookmark, or share from their own browser.
- If the destination is your own site, adopt universal links so a tapped link
  opens the matching native screen instead of a web page.
- App Clips (iOS and iPadOS 14 and later) cover "someone reached our URL and we
  want to give them a native moment" without requiring an install.
- The cheapest web view is the one you never built. If the page is a heading, a
  paragraph, and a button, build it natively — you get Dynamic Type, VoiceOver,
  dark mode, and offline behavior for free.

### The App Review angle

App Store Review Guideline 4.2, Minimum Functionality, requires that an app
offer features, content, and UI beyond a repackaged website, and 4.2.2 calls out
apps that are primarily marketing material, web clippings, content aggregators,
or a collection of links. A `WKWebView` pointed at your homepage is the
canonical rejection. The fix is real native capability — offline state,
notifications, system integrations, native navigation — not a better-disguised
web view. Read the current guidelines before submitting; they are revised
regularly.

## Platform notes

- `SFSafariViewController` exists on iOS and iPadOS (9 and later) and visionOS,
  with no native macOS counterpart. In Mac Catalyst apps, and in compatible
  iPhone and iPad apps running on visionOS, presenting it opens the default
  browser instead. On visionOS, call `openURL` rather than presenting it.
- On macOS the choice is `WebView`/`WKWebView` for owned content, or `openURL`
  to hand off to the default browser — there is no system browsing sheet.
- watchOS and tvOS have no in-app web view at all: neither `WKWebView` nor the
  SwiftUI `WebView` is available. Design any flow that requires a real web page
  to complete on a paired iPhone or another device.
- `ASWebAuthenticationSession` is the one surface that spans the whole family —
  iOS 12, macOS 10.15, tvOS 16, watchOS 6.2, and visionOS 1 and later. On macOS
  it runs in the user's default browser when that browser supports web
  authentication sessions, and Safari otherwise.

## Pitfalls

- Presenting a raw web view for an OAuth flow. It looks like it works, it breaks
  provider policy, it loses the user's existing session, and it puts your app in
  the position of being able to read credentials.
- Assuming `SFSafariViewController` shares cookies with your app, then building
  a "seamless" login on that assumption.
- Shipping a web wrapper of your site and treating Guideline 4.2 as a formality.
- Reaching for a web view to render a paragraph of markup. `AttributedString` or
  a Markdown-bearing `Text` is smaller, faster, accessible, and themable.
- Using the deprecated `callbackURLScheme:` initializer, or shipping a custom
  scheme any other app on the device can register.
- Opening third-party URLs in a `WKWebView` you own — mixed content, tracking
  script, and phishing pages all become your problem.
- Forgetting that a web-heavy screen ships an entirely separate accessibility
  tree and localization pipeline from the rest of the app.

## References

- **Documentation:** [WKWebView](https://developer.apple.com/documentation/webkit/wkwebview)
- **Documentation:** [WebView (SwiftUI, WebKit)](https://developer.apple.com/documentation/webkit/webview-swift.struct)
- **Documentation:** [SFSafariViewController](https://developer.apple.com/documentation/safariservices/sfsafariviewcontroller)
- **Documentation:** [ASWebAuthenticationSession](https://developer.apple.com/documentation/authenticationservices/aswebauthenticationsession)
- **Documentation:** [Supporting universal links in your app](https://developer.apple.com/documentation/xcode/supporting-universal-links-in-your-app)
- **Documentation:** [App Clips](https://developer.apple.com/documentation/appclip)
- **Policy:** [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

## See also

For the sign-in branch, route into `sign-in-with-apple` for the native
alternative and its token verification, and pair it with the Sign in with Apple
design guidance. This library has no dedicated WebKit code skill yet, so treat
the guidance above as self-sufficient at the decision level and go to Apple's
WebKit documentation for `WebPage` configuration, navigation policy, and script
messaging. See `choosing-ui-toolkit` when the surrounding screen's toolkit is
also in question, and `choosing-distribution` for the submission and review
process the App Review notes feed into.
