---
name: webview-custom-tabs
description: Covers embedding web content in Android apps via WebView, Custom Tabs, and Trusted Web Activities — use when deciding how to display URLs, integrate a JavaScript bridge, or wrap a PWA in a native shell.
---

## When to use

Choose the right integration based on content ownership and user experience goals:

- **WebView** — use when you own the content being rendered (internal dashboards, documentation rendered from your server, hybrid app screens). You need full control over navigation, cookies, or a JavaScript bridge.
- **Custom Tabs** — use for external URLs (third-party articles, OAuth flows, share links). Keeps the user in-app with a browser-quality renderer, inherits the user's saved credentials and cookies, and requires zero maintenance of a browser security surface.
- **Trusted Web Activity (TWA)** — use when your team owns a Progressive Web App that should launch full-screen without any browser chrome. The PWA must pass Digital Asset Links verification.

Never embed external URLs in a raw WebView; doing so forces you to maintain a full browser security stack. Prefer Custom Tabs for anything you do not control.

## Core guidance

### WebView

- Enable only the `WebSettings` flags you actually need. `javaScriptEnabled` is off by default; turn it on only for your own origins.
- Set `safeBrowsingEnabled = true` (default on API 27+) and always override `onReceivedSslError` to call `handler.cancel()` — never `proceed()` — on untrusted certificates.
- Disable file access (`allowFileAccess = false`, `allowContentAccess = false`) unless the feature genuinely requires it.
- Use `WebViewAssetLoader` to serve local assets over `https://` rather than `file://` schemes to keep the Same-Origin Policy intact.
- For the JavaScript bridge, prefer `WebMessageListener` (API 24+ / AndroidX backport) over the legacy `@JavascriptInterface`. It is type-safe, sends `MessageEvent` objects, and does not expose the whole object to every frame.
- Restrict `WebMessageListener` to specific allowed origins; never pass `setAllowedOriginRules(setOf("*"))` in production.
- Call `webView.destroy()` in `onDestroy` and remove it from the view hierarchy first to avoid memory leaks.
- On large screens / foldables, listen for `WindowInfoTracker` layout changes so a full-page WebView reflows correctly when the device unfolds.

### Custom Tabs

- Check for a Custom Tabs-capable browser before launching; fall back to a plain `Intent.ACTION_VIEW` when none is installed.
- Use `CustomTabsClient.bindCustomTabsService` to warm up the browser process before the user taps a link — this cuts cold-start latency noticeably.
- Customise the toolbar color to match your `MaterialTheme` surface color for a seamless transition.
- Prefer `CustomTabsIntent.Builder().setShareState(CustomTabsIntent.SHARE_STATE_OFF)` when a share button is redundant in your UI.
- Pass `setUrlBarHidingEnabled(true)` for long-form reading contexts.
- Partial Custom Tabs (bottom-sheet mode) are available via `CustomTabsIntent.Builder().setInitialActivityHeightPx(...)` — useful for showing supplementary content without fully leaving the current screen.

### Trusted Web Activity

- Verify ownership by publishing a `/.well-known/assetlinks.json` on your domain and including the correct fingerprint in `AndroidManifest.xml` via the `asset_statements` string resource.
- Use Bubblewrap CLI or the TWA helper library to generate the manifest boilerplate; hand-rolling it is error-prone.
- TWAs inherit all Custom Tabs warm-up APIs, so pre-connect before launch.

```kotlin
// CustomTabsHelper.kt — warm-up + launch with Material 3 toolbar color
class CustomTabsHelper(private val context: Context) {

    private var client: CustomTabsClient? = null
    private var session: CustomTabsSession? = null

    fun bindAndWarmUp(packageName: String) {
        CustomTabsClient.bindCustomTabsService(
            context, packageName,
            object : CustomTabsServiceConnection() {
                override fun onCustomTabsServiceConnected(
                    name: ComponentName, c: CustomTabsClient
                ) {
                    client = c.also { it.warmup(0) }
                    session = c.newSession(null)
                    session?.mayLaunchUrl(Uri.parse("https://example.com"), null, null)
                }
                override fun onServiceDisconnected(name: ComponentName) {
                    client = null; session = null
                }
            }
        )
    }

    fun launchUrl(url: String, @ColorInt toolbarColor: Int) {
        val intent = CustomTabsIntent.Builder(session)
            .setDefaultColorSchemeParams(
                CustomTabColorSchemeParams.Builder()
                    .setToolbarColor(toolbarColor)
                    .build()
            )
            .setUrlBarHidingEnabled(true)
            .setShareState(CustomTabsIntent.SHARE_STATE_OFF)
            .build()
        intent.launchUrl(context, Uri.parse(url))
    }
}
```

### JavaScript bridge with WebMessageListener

```kotlin
// API 24+ (use AndroidX webkit:webkit for backport)
val listener = WebMessageListener { message, sourceOrigin, _, _, _ ->
    if (sourceOrigin.toString() == "https://your.domain.com") {
        handleMessage(message.data ?: return@WebMessageListener)
    }
}
if (WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
    WebViewCompat.addWebMessageListener(
        webView, "androidBridge",
        setOf("https://your.domain.com"),
        listener
    )
}
```

## Platform notes

- **Large screens / foldables** — WebView layouts should use `Modifier.fillMaxSize()` inside a Compose `AndroidView` and respond to configuration changes. Avoid hardcoded heights. Test under both folded and unfolded states.
- **API level minimums** — `WebMessageListener` backport requires `androidx.webkit:webkit:1.8+`. Custom Tabs Partial Custom Tabs require `androidx.browser:browser:1.6+`.
- **Chrome vs other browsers** — Custom Tabs is not Chrome-exclusive; Firefox, Edge, and Brave implement it. Use `CustomTabsClient.getPackageName` to select the best available provider.
- **Process isolation** — from Android 9+, WebView runs in a separate process. The `onRenderProcessGone` callback lets you recover gracefully from renderer crashes without crashing the host app.
- **Network security** — ensure your `network_security_config.xml` does not add broad `<trust-anchors>` that would weaken WebView TLS validation.

## Pitfalls

- **Enabling `setAllowUniversalAccessFromFileURLs`** — this is a critical security hole that grants any file on the device access to your app's WebView context. Never enable it.
- **Ignoring `onReceivedSslError`** — calling `handler.proceed()` silently accepts invalid certificates, making your app vulnerable to MITM attacks.
- **WebView for all links** — loading arbitrary third-party URLs in a raw WebView means you inherit every browser vulnerability without browser vendor patches. Use Custom Tabs instead.
- **Forgetting `webView.destroy()`** — WebView holds a native renderer process reference. Without explicit cleanup, it leaks memory beyond what the GC can collect.
- **Assuming Custom Tabs is always available** — some locked-down enterprise or TV devices have no browser installed. Always code the fallback.
- **`@JavascriptInterface` on the UI thread** — legacy JS interface methods are called on a background thread, not the main thread; synchronizing back to the UI requires `post` or a `Handler`. `WebMessageListener` is cleaner.
- **TWA without asset link verification** — if verification fails, Chrome shows the URL bar, breaking the full-screen illusion and eroding user trust.
- **Not pre-connecting for Custom Tabs** — launching without `warmup` results in a visible cold-start delay. Call `bindAndWarmUp` when the user is likely to tap a link.

## References

- **Documentation:** [WebView developer guide](https://developer.android.com/develop/ui/views/layout/webapps/webview)
- **Documentation:** [Custom Tabs overview](https://developer.chrome.com/docs/android/custom-tabs)
- **Library:** [AndroidX Browser (Custom Tabs)](https://developer.android.com/jetpack/androidx/releases/browser)
- **Library:** [AndroidX Webkit](https://developer.android.com/jetpack/androidx/releases/webkit)

## See also

The `choosing-web-integration` overview skill describes the decision tree for picking between WebView, Custom Tabs, and TWA at the architecture level. The `network-framework` skill covers `OkHttp`/`Ktor` patterns for APIs consumed alongside embedded web content. The `sign-in-with-apple` (web OAuth) and `navigation-architecture` skills are relevant when Custom Tabs handle OAuth redirect flows back into the app via deep links.
