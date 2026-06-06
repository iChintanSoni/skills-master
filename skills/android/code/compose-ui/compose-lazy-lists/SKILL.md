---
name: compose-lazy-lists
description: Covers lazy scrolling containers in Jetpack Compose — LazyColumn, LazyRow, LazyVerticalGrid, LazyVerticalStaggeredGrid, item keys/contentType, sticky headers, LazyListState, programmatic scrolling, item placement animations, and Paging integration. Use when building any scrollable list, feed, grid, or paginated data surface in a Compose-first Android app.
globs:
  - "**/*.kt"
tags: [compose, lazy-list, recycler, paging, android]
x-skills-master:
  domain: android
  class: code
  category: compose-ui
  platforms: ["android", "large-screen"]
  requires: { "android": "16", "kotlin": "2.2", "compose-bom": "2026.05.00" }
  pairs_with: [m3-lists]
  sources:
    - https://developer.android.com/develop/ui/compose/lists
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Use this skill whenever you need a scrollable container that composes only the visible items — replacing RecyclerView for standard lists, horizontal carousels, multi-column grids, or masonry/staggered layouts. Also applies when wiring a Paging 3 data source into a Compose surface or when you need scroll-aware UI behaviour (scroll-to-top buttons, collapsing headers).

## Core guidance

### Choosing the right container

- `LazyColumn` — vertical list (most common case).
- `LazyRow` — horizontal carousel or tag strip.
- `LazyVerticalGrid(columns = Fixed(n))` or `Adaptive(minSize)` — regular N-column grid; use `Adaptive` on large screens so column count scales automatically.
- `LazyVerticalStaggeredGrid` — variable-height cards (photo feeds, article cards). Prefer it over manual column splitting.

### Items DSL

- `item { }` — single slot (e.g. header, footer, loading indicator).
- `items(list, key = { it.id }) { }` — most common; always provide a **stable, unique key**.
- `itemsIndexed(list, key = { _, item -> item.id }) { index, item -> }` — when you need the index too.
- `contentType` — supply a value when your list mixes visually distinct item shapes (e.g. ads vs. content rows). Compose reuses composition nodes only within the same `contentType`, improving performance.

### Stable keys

Keys MUST be stable (primitive, `String`, or data class with stable equals). Never use list index as key — it breaks animations and causes unnecessary recomposition on insert/remove.

### Sticky headers

Use the experimental `stickyHeader` block. Wrap in an opt-in annotation; guard with a feature flag or suppress carefully — the API has been stable in practice for several releases.

### LazyListState

- Obtain via `rememberLazyListState()` and pass it to the `state` parameter.
- `state.firstVisibleItemIndex` / `state.firstVisibleItemScrollOffset` — current viewport position.
- Derive scroll-dependent values with `derivedStateOf { }` to avoid recomposing on every pixel:
  ```kotlin
  val showScrollToTop by remember {
      derivedStateOf { state.firstVisibleItemIndex > 0 }
  }
  ```
- Programmatic scroll:
  - `state.animateScrollToItem(index)` — smooth animated scroll (suspend, call from a coroutine scope).
  - `state.scrollToItem(index)` — instant jump (suspend).

### Item placement animations

Apply `Modifier.animateItem()` (stable since Compose 1.7 / BOM 2024.09) to the root composable of each item. It animates insertions, removals, and reorderings automatically when items are added or removed from the list — no additional setup needed. Avoid applying heavy modifiers inside `animateItem` — keep the target composable lightweight.

### Large-screen considerations

- Use `LazyVerticalGrid(columns = Adaptive(minSize = 180.dp))` so column count responds to window width class.
- Apply `contentPadding` and `horizontalArrangement` / `verticalArrangement` instead of padding inside each item to avoid doubled spacing.
- On foldables, observe `WindowSizeClass` and switch between a single-column `LazyColumn` and a two-pane layout rather than cramming everything into one grid.

### Paging 3 integration

Add `androidx.paging:paging-compose` from the BOM. Collect the `Flow<PagingData<T>>` with `collectAsLazyPagingItems()`, then use `items(pagingItems, key = { it.id })`. Check `loadState` to show loading spinners or error placeholders.

### Short reference snippet

```kotlin
@OptIn(ExperimentalFoundationApi::class)
@Composable
fun NewsFeed(
    items: List<NewsItem>,
    onItemClick: (NewsItem) -> Unit,
) {
    val state = rememberLazyListState()
    val coroutineScope = rememberCoroutineScope()
    val showFab by remember { derivedStateOf { state.firstVisibleItemIndex > 2 } }

    Box {
        LazyColumn(
            state = state,
            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            stickyHeader { SectionHeader(text = "Top Stories") }

            items(
                items = items,
                key = { it.id },
                contentType = { if (it.isFeatured) "featured" else "standard" },
            ) { item ->
                NewsCard(
                    item = item,
                    onClick = { onItemClick(item) },
                    modifier = Modifier.animateItem(),
                )
            }
        }

        if (showFab) {
            FloatingActionButton(
                onClick = { coroutineScope.launch { state.animateScrollToItem(0) } },
                modifier = Modifier.align(Alignment.BottomEnd).padding(16.dp),
            ) { Icon(Icons.Filled.ArrowUpward, contentDescription = "Scroll to top") }
        }
    }
}
```

## Platform notes

**Android (phones):** `LazyColumn`/`LazyRow` cover most cases. On API 16+ all lazy list APIs are available.

**Large screens / tablets:** Use `Adaptive` column counts in `LazyVerticalGrid`. Pair with `NavigationRail` or a two-pane scaffold so the list does not stretch uncomfortably on wide displays. On foldables, switch layout in response to the `FoldingFeature`.

**Wear OS / TV:** These platforms use their own specialized lazy containers (`ScalingLazyColumn`, `TvLazyColumn`) — do not use this skill for those surfaces.

## Pitfalls

- **Index as key** — causes wrong animations and recomposition storms on list mutations. Always use a stable domain ID.
- **Heavy work inside item lambda** — item lambdas run during composition; defer expensive computation with `remember` or push it to a `ViewModel`.
- **Nested scrollable containers in the same direction** — putting a `LazyColumn` inside a `Column` with `verticalScroll` will crash at runtime. Use a single `LazyColumn` with `item {}` blocks for non-list sections.
- **Forgetting `contentPadding` vs. item padding** — adding horizontal padding inside each item doubles spacing at the edges and breaks `overscroll` edge effects. Use `contentPadding` on the list.
- **`derivedStateOf` missing `remember`** — always wrap `derivedStateOf` in `remember { }`, otherwise a new derived state is created on every recomposition.
- **Ignoring `loadState` with Paging** — not handling `loadState.append` or `loadState.refresh` leads to silently swallowed errors and invisible loading indicators.
- **`stickyHeader` without `@OptIn`** — will produce a compile error; add `@OptIn(ExperimentalFoundationApi::class)` until it graduates.

## References

- **Documentation:** [Lists and grids — Jetpack Compose](https://developer.android.com/develop/ui/compose/lists)
- **API Reference:** [LazyListState](https://developer.android.com/reference/kotlin/androidx/compose/foundation/lazy/LazyListState)
- **Paging 3 + Compose:** [Paging with Jetpack Compose](https://developer.android.com/topic/libraries/architecture/paging/v3-overview)

## See also

Pair this skill with `compose-state` for managing list data in a `ViewModel`, `swiftui-lists-tables` if you maintain cross-platform context, and `paging3-android` for deeper pagination patterns. For grid layout decisions on large screens, also see `adaptive-layouts-android`.
