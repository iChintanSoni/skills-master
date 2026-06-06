---
name: navigation-deep-links
description: Covers deep links in Navigation Compose — declaring navDeepLink on destinations, handling incoming intents in Activities, and verifying Android App Links with Digital Asset Links. Use when adding implicit or explicit deep links to a NavHost destination, wiring intent handling in a Compose-first Activity, or testing that a URI correctly opens the right screen.
---

## When to use

Reach for this guidance when wiring deep links into a Jetpack Compose navigation graph — whether you need to open a specific screen from a notification, share link, widget, or external app URL. It covers implicit deep links (custom schemes and HTTPS URLs), explicit deep links constructed by your own code (such as `PendingIntent`-based notification taps), Android App Links that claim an HTTPS domain without a disambiguation dialog, and how to test all of the above. Server-side Digital Asset Links file hosting and domain verification tooling are out of scope; see `app-links-verification` for that.

## Core guidance

### Declare deep links on NavHost destinations

- Add `navDeepLink { uriPattern = "..." }` to any composable destination. The pattern supports path segments and query parameters with `{argName}` placeholders that map directly to the destination's named arguments.
- Prefer HTTPS URI patterns over custom schemes. HTTPS patterns are the foundation for Android App Links and work without a disambiguation chooser when the domain is verified.
- Repeat `navDeepLink { }` blocks on the same destination to accept multiple URI shapes — for example, both a versioned path and a legacy custom scheme.
- Arguments declared in the URI pattern must also be declared in `arguments` with the matching `NavType`; Navigation Compose extracts and type-converts them automatically.

```kotlin
composable(
    route = "product/{productId}",
    arguments = listOf(
        navArgument("productId") { type = NavType.StringType }
    ),
    deepLinks = listOf(
        navDeepLink {
            uriPattern = "https://shop.example.com/product/{productId}"
        },
        navDeepLink {
            uriPattern = "example-shop://product/{productId}"
        }
    )
) { backStackEntry ->
    val productId = backStackEntry.arguments?.getString("productId") ?: return@composable
    ProductDetailScreen(productId = productId)
}
```

### Handle the incoming intent in the Activity

- A `NavHost` picks up the intent automatically when `NavHostController` is created with `rememberNavController()` inside the Activity's `setContent` block, because `NavController` reads `LocalActivity.current.intent` by default.
- When the Activity receives a new intent while already running (single-task or single-top launch mode), override `onNewIntent` and call `navController.handleDeepLink(intent)`. Without this call, deep links sent to a running Activity are silently ignored.
- For Activities declared `android:launchMode="singleTop"`, also set `android:taskAffinity` deliberately — deep links from external sources open in the caller's task by default unless the `Intent.FLAG_ACTIVITY_NEW_TASK` flag is present.

```kotlin
class MainActivity : ComponentActivity() {

    private lateinit var navController: NavHostController

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            navController = rememberNavController()
            AppNavHost(navController = navController)
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        navController.handleDeepLink(intent)
    }
}
```

### Declare intent filters in the manifest

- Every URI pattern you register with `navDeepLink` needs a matching `<intent-filter>` in `AndroidManifest.xml`. Navigation does not inject filters automatically.
- For HTTPS App Links, add `android:autoVerify="true"` to the filter so Android attempts domain verification at install time. Omitting this attribute means the link always shows a disambig chooser.
- Keep `<data android:scheme="https" android:host="shop.example.com" />` precise. Wildcards in the host field disable automatic verification.

```xml
<activity android:name=".MainActivity" android:launchMode="singleTop">
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="https"
              android:host="shop.example.com"
              android:pathPrefix="/product/" />
    </intent-filter>
</activity>
```

### Build explicit deep links for notifications and shortcuts

- Use `NavDeepLinkBuilder` (or the Compose-friendly `createDeepLink()` extension on `NavController`) to build a `PendingIntent` that back-stacks the deep-link destination correctly.
- Pass `setGraph` and `setDestination` to `NavDeepLinkBuilder` so it synthesises the correct back stack for the target destination; this avoids the user pressing Back and landing in an empty Activity.
- Provide arguments with `setArguments(bundleOf("productId" to id))` — the same keys the destination declares in its `arguments` list.

### Test deep links

- Use `adb` to fire intents during development: `adb shell am start -a android.intent.action.VIEW -d "https://shop.example.com/product/42" com.example.app`.
- For App Links specifically, check verification status with `adb shell pm get-app-links com.example.app`; look for `VERIFIED` per domain. A `NONE` or `FAILED` status means the `assetlinks.json` file is unreachable or malformed — out of scope here, but note the diagnostic.
- Write `NavController`-based instrumented tests using `TestNavHostController`; navigate to the deep-link URI and assert `currentDestination?.route`.
- Verify back-stack correctness after a deep link: pressing Back should land on the screen that `NavDeepLinkBuilder` synthesised, not exit the app cold.

## Platform notes

- On large-screen devices and ChromeOS, an activity may be side-by-side with the originating browser. Set `android:resizeableActivity="true"` and test the deep link flow in split-screen so you can confirm the Task is set up correctly.
- Android 12 (API 31) tightened App Links verification: unverified HTTPS links always go to the browser or a chooser. Apps targeting API 31+ with `autoVerify` will also face stricter server-side checks — the `assetlinks.json` file must be reachable over HTTPS without redirects.
- Android 16 (API 36) does not change the deep link API surface, but enforces stricter intent mutability rules (`PendingIntent.FLAG_IMMUTABLE` is mandatory). `NavDeepLinkBuilder` already applies this flag on API 23+.

## Pitfalls

- **Missing `onNewIntent` override** — the most common bug. If the Activity is already in the back stack when the deep link fires, the new intent is delivered via `onNewIntent`, not `onCreate`. Without forwarding it to `navController.handleDeepLink`, the screen does not navigate.
- **URI pattern and intent filter mismatch** — if `navDeepLink { uriPattern = "..." }` uses a path that your `<intent-filter>` does not match (wrong prefix, missing segment), the system resolves the link but Navigation never triggers the destination.
- **Forgetting `android:autoVerify="true"`** — results in a disambiguation chooser every time, even if your `assetlinks.json` is correctly hosted. The attribute must be on the `<intent-filter>` element, not the `<activity>`.
- **Back-stack not synthesised** — constructing a raw `Intent` and calling `startActivity` directly bypasses `NavDeepLinkBuilder`'s back-stack synthesis. The user presses Back and exits the app rather than reaching the home screen or parent destination.
- **Nullable argument crashes** — when a URI matches but the expected path segment is absent, Navigation passes `null` for the argument. Always provide a `defaultValue` in `navArgument` or guard with an early return in the composable body.
- **Custom scheme only** — relying solely on a custom `example-app://` scheme means the link requires your app to be installed and shows a chooser on some devices. Pair it with an HTTPS pattern so web fallbacks and verified App Links work.

## References

- **Developer Guide:** [Deep links overview](https://developer.android.com/guide/navigation/design/deep-link)
- **Developer Guide:** [Android App Links](https://developer.android.com/training/app-links)

## See also

See `app-links-verification` for the server-side Digital Asset Links file setup and domain verification tooling that completes the App Links flow. For the broader Navigation Compose graph structure, destination arguments, and nested graphs, see the `navigation-architecture` skill. For constructing `PendingIntent` deep links from notification builders, see the `user-notifications` skill.
