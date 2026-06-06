---
name: drag-and-drop
description: Covers drag-and-drop in Jetpack Compose using dragAndDropSource and dragAndDropTarget modifiers, DragAndDropTransferData with MIME types, cross-app drop acceptance, and visual feedback. Use when implementing drag-and-drop interactions in Compose on Android — especially on large screens, tablets, and ChromeOS where multi-window drag is common.
---

## When to use

Apply this skill when adding drag-and-drop interactions to a Jetpack Compose UI — either for reordering items within the same screen, sharing data between composables, or accepting content dragged in from another app or window. It is especially important on large-screen devices (tablets, foldables) and ChromeOS, where users expect multi-window drag-and-drop to work the same way it does on desktop. Also apply it when consuming plain text, images, or custom MIME-typed payloads dropped by other Android applications.

## Core guidance

### The two sides of a drag-and-drop interaction

Every drag-and-drop interaction has exactly two roles:

- **Source** — the composable that the user picks up and drags. Declared with `Modifier.dragAndDropSource`.
- **Target** — the composable that receives the drop. Declared with `Modifier.dragAndDropTarget`.

A single composable can be both source and target simultaneously.

### Declaring a drag source

`Modifier.dragAndDropSource` accepts a suspend lambda that calls `startTransfer` with a `DragAndDropTransferData` payload. The lambda runs inside a `DetectDragGestures`-style coroutine scope — start the transfer after detecting a long press or drag by a threshold:

```kotlin
@Composable
fun DraggableChip(label: String) {
    val clipData = ClipData.newPlainText("chip_label", label)

    Text(
        text = label,
        modifier = Modifier
            .dragAndDropSource(
                drawDragDecoration = {
                    // Optional: draw a custom shadow image during the drag
                    drawRect(color = Color(0x88000000))
                }
            ) {
                // Called when a drag gesture is detected
                startTransfer(
                    DragAndDropTransferData(
                        clipData = clipData,
                        flags = View.DRAG_FLAG_GLOBAL or
                                View.DRAG_FLAG_GLOBAL_URI_READ
                    )
                )
            }
    )
}
```

Key points:
- `ClipData` carries the payload. Use `ClipData.newPlainText`, `ClipData.newUri`, or a custom MIME type for structured data.
- `View.DRAG_FLAG_GLOBAL` is required to allow drops into other apps.
- `View.DRAG_FLAG_GLOBAL_URI_READ` grants temporary read permission for `content://` URIs dragged to another app.
- The optional `drawDragDecoration` block draws on a `DrawScope` to render the drag shadow that follows the pointer.

### Declaring a drop target

`Modifier.dragAndDropTarget` requires two arguments: a `shouldStartDragAndDrop` predicate (used to inspect the event before accepting it) and a `DragAndDropTarget` implementation with callbacks for the lifecycle events:

```kotlin
@Composable
fun DropZone(onTextDropped: (String) -> Unit) {
    var isHovered by remember { mutableStateOf(false) }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(120.dp)
            .background(
                if (isHovered) MaterialTheme.colorScheme.primaryContainer
                else MaterialTheme.colorScheme.surfaceVariant
            )
            .dragAndDropTarget(
                shouldStartDragAndDrop = { event ->
                    // Accept only plain text MIME type
                    event.mimeTypes().any { it == ClipDescription.MIMETYPE_TEXT_PLAIN }
                },
                target = object : DragAndDropTarget {
                    override fun onStarted(event: DragAndDropEvent) {
                        isHovered = true
                    }
                    override fun onEntered(event: DragAndDropEvent) {
                        isHovered = true
                    }
                    override fun onExited(event: DragAndDropEvent) {
                        isHovered = false
                    }
                    override fun onEnded(event: DragAndDropEvent) {
                        isHovered = false
                    }
                    override fun onDrop(event: DragAndDropEvent): Boolean {
                        isHovered = false
                        val item = event.toAndroidDragEvent()
                            .clipData?.getItemAt(0) ?: return false
                        onTextDropped(item.text?.toString() ?: return false)
                        return true // consume the drop
                    }
                }
            )
    ) {
        Text(
            text = if (isHovered) "Release to drop" else "Drop here",
            modifier = Modifier.align(Alignment.Center)
        )
    }
}
```

### MIME types and cross-app data

- Plain text: `ClipDescription.MIMETYPE_TEXT_PLAIN`
- HTML: `ClipDescription.MIMETYPE_TEXT_HTML`
- Images (via URI): `"image/*"` — use a wildcard to accept any image subtype
- Custom structured data: declare your own type string, e.g. `"application/vnd.myapp.widget"`

For URI-based content (images, files) from another app, grant temporary read access on the source side via `DRAG_FLAG_GLOBAL_URI_READ`, then call `context.grantUriPermission` or use `InputContentInfo` on the target side to open the stream.

### Providing visual feedback

Good drag-and-drop UX requires three feedback moments:

1. **Drag shadow** — customise via the `drawDragDecoration` lambda in `dragAndDropSource`. Draw the item's current appearance on the `DrawScope` so the shadow looks like the thing being dragged.
2. **Target highlight** — toggle a state variable in `onEntered`/`onExited` and apply a background color or border change (see the `DropZone` example above).
3. **Drop confirmation** — show a brief animation or snack bar after a successful `onDrop` to confirm the operation completed.

### Do / Don't

- **Do** filter accepted MIME types in `shouldStartDragAndDrop` — it keeps irrelevant drop events off your composable and is called before any recomposition.
- **Do** return `true` from `onDrop` when you successfully consume the data; returning `false` signals that the drop was not handled, and the system may offer a fallback.
- **Do** reset hover state in both `onExited` and `onEnded` — `onEnded` fires even when the pointer is released outside your target.
- **Do** include `DRAG_FLAG_GLOBAL` when the user might drag content to another window on large screens or ChromeOS.
- **Don't** perform heavy work inside `onDrop` synchronously — hand off the `ClipData` to a `ViewModel` or coroutine scope immediately.
- **Don't** hold a reference to the `DragAndDropEvent` after the callback returns — the event object is recycled by the system.
- **Don't** assume the drag shadow size equals the composable size — draw a representative decoration explicitly in `drawDragDecoration`.
- **Don't** skip `shouldStartDragAndDrop` — without it, your target receives all `DragAndDropEvent` calls regardless of payload type, which wastes resources.

## Platform notes

**Large screens and foldables** — Multi-window drag-and-drop (across app windows) requires `DRAG_FLAG_GLOBAL` on the source and a correctly declared target in the receiving app. Test in split-screen mode on a tablet or foldable emulator. The `shouldStartDragAndDrop` predicate runs before the layout is highlighted, so keep it fast (no I/O).

**ChromeOS** — ChromeOS treats Android apps in resizable windows. Users routinely drag files from the Files app into Android apps. Always handle `image/*` and `text/plain` drops from external sources and present appropriate empty states when the app does not accept the dragged content type.

**Minimum API level** — `Modifier.dragAndDropSource` and `Modifier.dragAndDropTarget` are available from Compose Foundation 1.7 (included in BOM 2024.09+). They delegate to the platform `View.startDragAndDrop` API (available since API 24), but the Compose modifiers themselves require no additional API-level guard when you target API 16 with the BOM wrapping compatibility.

**View interop** — When a `dragAndDropSource` composable sits inside an `AndroidView` hierarchy, the drag shadow and clip data flow through the same platform `DragEvent` system. A `View`-based drop target in the same window receives the same `DragEvent`; ensure MIME types match on both sides.

**Accessibility** — Drag-and-drop is inherently pointer-centric. Provide an alternative interaction (context menu, cut/paste, or a dedicated move action) so users relying on switch access or TalkBack can accomplish the same task.

## Pitfalls

- **Not resetting hover state on `onEnded`** — if the pointer is released outside the composable, only `onEnded` fires (not `onExited`). Forgetting to reset hover state leaves the target permanently highlighted.
- **Returning `false` from `onDrop` accidentally** — returning `false` tells the system the drop was not handled, which may trigger undesired system-level behavior. Only return `false` when you genuinely cannot process the data.
- **Missing `DRAG_FLAG_GLOBAL` for multi-window** — without this flag the drag is confined to the source app's window, silently ignoring drops on other windows.
- **Retaining the `DragAndDropEvent` reference** — the event and its underlying `DragEvent` are pooled objects. Reading `clipData` or `toAndroidDragEvent()` after the callback returns produces null or stale data.
- **Heavy work inside drop callback** — parsing large images or writing to a database synchronously in `onDrop` blocks the main thread during the drop animation, causing visible jank.
- **Accepting all MIME types blindly** — returning `true` from `shouldStartDragAndDrop` for every event causes your composable to be highlighted for drags your app cannot handle, confusing the user.
- **Custom MIME type mismatch** — if the source encodes `"application/vnd.myapp.item"` but the target checks for `"application/vnd.myapp.items"` (plural), drops silently fail; define MIME type constants in a shared module.

## References

- **Official guide (Compose):** [Drag and drop in Jetpack Compose](https://developer.android.com/develop/ui/compose/touch-input/user-interactions/drag-and-drop)
- **Official guide (View system):** [Drag and drop (View)](https://developer.android.com/develop/ui/views/touch-and-input/drag-drop)
- **API reference:** [DragAndDropTarget](https://developer.android.com/reference/kotlin/androidx/compose/ui/draganddrop/DragAndDropTarget)

## See also

The `compose-modifiers` skill covers how to chain and reason about `Modifier` ordering, which is essential for understanding where `dragAndDropSource` and `dragAndDropTarget` sit in a modifier chain. The `compose-gestures` skill covers pointer input and `detectDragGestures` for intra-composable drag behaviors that do not cross app boundaries. For list reordering with built-in drag handles see `compose-lazy-lists`. For large-screen layout patterns that motivate multi-pane drag-and-drop workflows see the `adaptive-layout` skill.
