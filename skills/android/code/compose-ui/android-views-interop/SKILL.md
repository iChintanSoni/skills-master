---
name: android-views-interop
description: Covers traditional View-based XML layouts, custom View drawing, lifecycle interactions, and two-way interoperability between traditional Views and Jetpack Compose. Use when working with legacy layouts, custom canvas Views, or embedding Views/Compose in each other.
globs:
  - "**/*.kt"
  - "**/layout/*.xml"
tags: [views, xml, compose, interop, custom-view, canvas, android]
x-skills-master:
  domain: android
  class: code
  category: compose-ui
  platforms: ["android"]
  requires:
    android: "16"
    kotlin: "2.2"
    compose-bom: "2026.05.00"
  pairs_with: [adopting-compose]
  sources:
    - https://developer.android.com/develop/ui
    - https://developer.android.com/develop/ui/compose/migrate/interoperability-apis
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Apply this skill when working with traditional View-based layout XMLs, custom subclassed Views (overriding `onMeasure`, `onLayout`, `onDraw`), or integrating traditional View elements (such as `MapView`, `WebView`, or legacy custom controls) into a Jetpack Compose UI (or vice-versa).

## Core guidance

### Views in Compose (AndroidView)

- Use the `AndroidView` composable to instantiate and control legacy views.
- Provide a `factory` lambda to create the view (called exactly once on the UI thread).
- Provide an `update` lambda to synchronize Compose state with the view properties (called on recomposition).

### Compose in Views (ComposeView)

- Embed Compose screens or widgets in traditional XML layouts using the `<androidx.compose.ui.platform.ComposeView>` tag.
- In your Activity/Fragment, resolve the View and call `setViewContent` with your Composable content.
- Set the correct `CompositionLocalProvider` parent context if needed (e.g. for ViewModel scoping).

### Custom Views & Drawing

- Subclass `View` to create custom graphics or interactions.
- Override `onMeasure` to set size parameters. Override `onDraw(canvas: Canvas)` to execute pixel painting.
- Keep calculations out of `onDraw` to avoid memory allocations during frame render passes.

```kotlin
// AndroidView (Embedding a legacy View inside Jetpack Compose)
@Composable
fun LegacyCustomViewWrapper(
    url: String,
    modifier: Modifier = Modifier
) {
    AndroidView(
        factory = { context ->
            WebView(context).apply {
                webViewClient = WebViewClient()
            }
        },
        update = { webView ->
            webView.loadUrl(url)
        },
        modifier = modifier
    )
}
```

```xml
<!-- ComposeView (Embedding Compose in XML layout) -->
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_match"
    android:layout_height="match_parent"
    android:orientation="vertical">

    <TextView
        android:id="@+id/legacy_title"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Legacy Title" />

    <androidx.compose.ui.platform.ComposeView
        android:id="@+id/compose_view"
        android:layout_width="match_parent"
        android:layout_height="wrap_content" />
</LinearLayout>
```

```kotlin
// Binding Composable inside Fragment/Activity layout
class MyFragment : Fragment() {
    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        val view = inflater.inflate(R.layout.my_layout, container, false)
        val composeView = view.findViewById<ComposeView>(R.id.compose_view)
        
        composeView.setContent {
            MaterialTheme {
                Text(text = "Hello from Jetpack Compose!")
            }
        }
        return view
    }
}
```

## Platform notes

- **Lifecycle and Disposal:** Views embedded via `AndroidView` are automatically recycled or detached when the hosting composable leaves composition. Ensure you clean up resources like listeners or web states inside the `onReset` lambda of `AndroidView`.
- **View Binding:** In multi-module projects or complex XML setups, use the `AndroidViewBinding` API (`androidx.compose.ui:ui-viewbinding`) to load XML layouts type-safely using generated binding classes.

## Pitfalls

- **State Sync Lag:** Reading legacy View states directly in Compose can break Unidirectional Data Flow (UDF). Expose state changes from the View via callbacks (`onValueChanged`), update your State Holder, and feed the new state back into the `update` block.
- **Heavy Allocations in Custom Views:** Calling `Paint()` or creating objects inside `onDraw` causes garbage collection pauses and frames dropping. Initialize resources in the View constructor.
- **Ignoring Composition Strategy:** When hosting `ComposeView` inside a `RecyclerView`, you must set a proper `ViewCompositionStrategy` (like `DisposeOnViewTreeLifecycleDestroyed`) to prevent Compose contexts from leaking.

## References

- **Documentation:** [Compose Interoperability APIs](https://developer.android.com/develop/ui/compose/migrate/interoperability-apis)
- **Documentation:** [Custom View components](https://developer.android.com/guide/topics/ui/custom-components)

## See also

See the `adopting-compose` overview skill for migration strategy guidelines. See the `lifecycle` skill for managing coroutine collections within legacy Activities/Fragments.
