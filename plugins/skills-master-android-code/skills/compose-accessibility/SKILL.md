---
name: compose-accessibility
description: Covers Compose accessibility APIs — semantics modifier, contentDescription, mergeDescendants, stateDescription, Role, heading, custom actions, traversal order, touch-target sizing, and testTag. Use when building or auditing Compose UIs for TalkBack, Switch Access, or any assistive technology.
---

## When to use

Apply this skill whenever you add interactive or informational composables that must be usable with TalkBack, Switch Access, keyboard navigation, or any other assistive technology. Also use it when reviewing existing Compose code for accessibility regressions, sizing touch targets, writing semantics-based UI tests, or supporting large-screen / foldable layouts where focus order can become non-linear.

## Core guidance

### Semantics modifier

Every composable exposes an accessibility node via `Modifier.semantics { … }`. Compose built-ins (Button, Text, Checkbox …) already populate most properties; use the modifier when you need to override, extend, or merge them.

```kotlin
@Composable
fun ArticleCard(
    title: String,
    author: String,
    isSaved: Boolean,
    onSave: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .semantics(mergeDescendants = true) {          // (1)
                contentDescription = "$title by $author"   // (2)
                stateDescription = if (isSaved) "Saved" else "Not saved" // (3)
                heading()                                   // (4)
            }
            .clickable(onClickLabel = "Save article", onClick = onSave)
            .padding(16.dp)
            .sizeIn(minWidth = 48.dp, minHeight = 48.dp),  // (5)
    ) {
        Text(title, style = MaterialTheme.typography.titleMedium)
        Text(author, style = MaterialTheme.typography.bodySmall)
        Icon(
            imageVector = if (isSaved) Icons.Filled.Bookmark else Icons.Outlined.Bookmark,
            contentDescription = null,                     // (6) — parent handles it
        )
    }
}
```

Key points from the snippet:

1. **mergeDescendants = true** — collapses the entire subtree into one TalkBack node, reducing swipe noise when the individual children carry no independent meaning.
2. **contentDescription** — replaces synthesised text for the merged node. Use a locale-appropriate, action-free label (not "Click to …").
3. **stateDescription** — describes transient state (checked, loading, 3 of 5) separately from the label, so TalkBack reads "ArticleCard, Not saved" rather than forcing a fresh contentDescription string per state.
4. **heading()** — marks screen-section headings so users can jump between them with TalkBack's heading shortcut.
5. **sizeIn(minWidth = 48.dp, minHeight = 48.dp)** — enforces the WCAG / Material 3 minimum 48 × 48 dp touch target. Use `minimumInteractiveComponentSize()` modifier (available from Compose 1.5) as a convenient alternative.
6. Decorative icons nested inside a merged parent should set `contentDescription = null` to stay invisible to the semantics tree.

### Role

Assign `role` when a composable looks different from its semantic function:

```kotlin
Box(
    modifier = Modifier.semantics { role = Role.Button }
        .clickable { … }
)
```

Built-in Compose components set their own roles. Override only for custom interactives or when wrapping non-interactive layouts to behave as controls.

### clearAndSetSemantics

Use `Modifier.clearAndSetSemantics { … }` when you want to wipe all descendant semantics and supply exactly what you declare — no merging, no inheritance. Useful for complex data-viz composables or animated counters where generated descriptions are meaningless.

### Custom accessibility actions

Expose non-touch actions (e.g., swipe-to-dismiss, long-press menus) that assistive tech cannot discover from the visual UI:

```kotlin
Modifier.semantics {
    customActions = listOf(
        CustomAccessibilityAction("Delete item") { onDelete(); true },
        CustomAccessibilityAction("Archive item") { onArchive(); true },
    )
}
```

TalkBack surfaces custom actions in its local-context menu (three-finger-tap). Return `true` from the lambda if the action was handled.

### Traversal order

TalkBack reads nodes top-to-bottom, left-to-right by default. Override with `isTraversalGroup` and `traversalIndex`:

```kotlin
// Force a floating FAB to be read last on the screen
FloatingActionButton(
    onClick = { … },
    modifier = Modifier.semantics { traversalIndex = 1f }
)
// Default traversal index is 0f; lower values are read first
```

Mark a container as a traversal boundary with `isTraversalGroup = true` so TalkBack finishes all children inside it before moving out.

### testTag

Tag composables for semantics-based UI tests with `Modifier.testTag("my_tag")`. The tag does not affect TalkBack but is essential for `composeTestRule.onNodeWithTag(…)` selectors. Avoid leaking test tags into production builds using a wrapper that no-ops in release:

```kotlin
fun Modifier.testTagIfDebug(tag: String) =
    if (BuildConfig.DEBUG) testTag(tag) else this
```

## Platform notes

- **Large screen / foldable** — When content reflows into a two-pane layout, explicitly set `isTraversalGroup = true` on each pane so TalkBack does not jump between panes mid-content.
- **Android 16 (API 36)** — No breaking semantics API changes in the 2026.05.00 BOM. The `minimumInteractiveComponentSize` modifier remains the preferred touch-target helper over raw `sizeIn`.
- **Compose Multiplatform** — Semantics APIs share the same surface on Compose for Android and iOS (via skip.tools or CMP), but Role values and TalkBack behaviors are Android-specific; screen readers on other platforms interpret a subset.

## Pitfalls

- **Duplicate contentDescription and visible text** — If a `Text` is already read by TalkBack, adding an identical `contentDescription` causes double-reading. Let `Text` be read naturally; use `contentDescription` only when the visual label is absent or insufficient.
- **mergeDescendants on scrollable containers** — Merging a `LazyColumn` row into one node hides individual item controls from assistive tech. Only merge leaf-level card groups, not containers with multiple interactive children.
- **Invisible tap targets** — A 24 dp icon wrapped in a 24 dp `IconButton` fails the 48 dp minimum. Material 3's `IconButton` adds internal padding by default; custom icon wrappers must add it explicitly.
- **Forgetting stateDescription for toggles** — Without it, a custom toggle reads only its label; users cannot tell whether it is on or off without activating it.
- **clearAndSetSemantics on interactive children** — This silences all child actions too. If a subtree contains a Button, its click action is erased. Use with caution and verify with TalkBack.
- **Hard-coded English contentDescription strings** — Always pull descriptions from string resources with proper `stringResource(R.string.…)` calls so they are translatable.
- **traversalIndex with negative values** — While negative floats work, stick to 0f … n to keep ordering explicit and reviewable.

## References

- **Documentation:** [Accessibility in Compose](https://developer.android.com/develop/ui/compose/accessibility)
- **Documentation:** [Semantics in Compose](https://developer.android.com/develop/ui/compose/semantics)
- **Guide:** [Build accessible apps](https://developer.android.com/guide/topics/ui/accessibility/apps)

## See also

Pair with `compose-testing` for writing semantics-driven UI tests using `onNodeWithTag` and `onNodeWithContentDescription`. See `compose-gestures` for ensuring custom gesture handlers expose fallback accessibility actions. For Material 3 component defaults and touch-target specs, see `material3-components`.
