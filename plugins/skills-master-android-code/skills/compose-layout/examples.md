## Adaptive two-pane layout with BoxWithConstraints

A detail screen that shows a list-detail side-by-side on wide screens and a stacked arrangement on compact screens.

```kotlin
@Composable
fun ListDetailScreen(
    items: List<Item>,
    selectedItem: Item?,
    onItemSelected: (Item) -> Unit,
    modifier: Modifier = Modifier,
) {
    BoxWithConstraints(modifier = modifier.fillMaxSize()) {
        val isWide = maxWidth >= 600.dp

        if (isWide) {
            Row(modifier = Modifier.fillMaxSize()) {
                ItemList(
                    items = items,
                    selectedId = selectedItem?.id,
                    onItemSelected = onItemSelected,
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxHeight(),
                )
                VerticalDivider()
                Box(
                    modifier = Modifier
                        .weight(2f)
                        .fillMaxHeight(),
                    contentAlignment = Alignment.Center,
                ) {
                    if (selectedItem != null) {
                        ItemDetail(item = selectedItem)
                    } else {
                        Text("Select an item", style = MaterialTheme.typography.bodyLarge)
                    }
                }
            }
        } else {
            if (selectedItem != null) {
                ItemDetail(
                    item = selectedItem,
                    modifier = Modifier.fillMaxSize(),
                )
            } else {
                ItemList(
                    items = items,
                    selectedId = null,
                    onItemSelected = onItemSelected,
                    modifier = Modifier.fillMaxSize(),
                )
            }
        }
    }
}
```

## Custom Layout — vertical equal-spacing grid

A custom `Layout` that places children in a two-column grid with equal widths and a consistent gap, without depending on `LazyVerticalGrid` so it can live inside a `Column` with a known height.

```kotlin
@Composable
fun TwoColumnGrid(
    modifier: Modifier = Modifier,
    gap: Dp = 8.dp,
    content: @Composable () -> Unit,
) {
    val gapPx = with(LocalDensity.current) { gap.roundToPx() }

    Layout(content = content, modifier = modifier) { measurables, constraints ->
        val columnWidth = (constraints.maxWidth - gapPx) / 2

        val childConstraints = constraints.copy(
            minWidth = columnWidth,
            maxWidth = columnWidth,
        )

        val placeables = measurables.map { it.measure(childConstraints) }

        val rows = (placeables.size + 1) / 2
        val rowHeight = placeables.maxOfOrNull { it.height } ?: 0
        val totalHeight = rows * rowHeight + (rows - 1) * gapPx

        layout(
            width = constraints.maxWidth,
            height = totalHeight.coerceIn(constraints.minHeight, constraints.maxHeight),
        ) {
            placeables.forEachIndexed { index, placeable ->
                val col = index % 2
                val row = index / 2
                val x = col * (columnWidth + gapPx)
                val y = row * (rowHeight + gapPx)
                placeable.placeRelative(x, y)
            }
        }
    }
}
```

## SubcomposeLayout — bottom-sheet with dynamic peek height

A simplified bottom sheet that measures its header content first, then uses that height as the minimum visible (peek) height for the sheet body. This is the canonical use-case for `SubcomposeLayout`.

```kotlin
enum class SheetSlot { Header, Body }

@Composable
fun PeekBottomSheet(
    header: @Composable () -> Unit,
    body: @Composable (peekHeight: Dp) -> Unit,
    modifier: Modifier = Modifier,
) {
    val density = LocalDensity.current

    SubcomposeLayout(modifier = modifier.fillMaxWidth()) { constraints ->
        // 1. Measure the header first to learn its height.
        val headerPlaceables = subcompose(SheetSlot.Header, header).map {
            it.measure(constraints)
        }
        val headerHeight = headerPlaceables.maxOfOrNull { it.height } ?: 0
        val peekDp = with(density) { headerHeight.toDp() }

        // 2. Compose the body *with* the peek height value from step 1.
        val bodyPlaceables = subcompose(SheetSlot.Body) { body(peekDp) }.map {
            it.measure(constraints)
        }
        val bodyHeight = bodyPlaceables.maxOfOrNull { it.height } ?: 0

        val totalHeight = (headerHeight + bodyHeight)
            .coerceIn(constraints.minHeight, constraints.maxHeight)

        layout(constraints.maxWidth, totalHeight) {
            headerPlaceables.forEach { it.placeRelative(0, 0) }
            bodyPlaceables.forEach { it.placeRelative(0, headerHeight) }
        }
    }
}
```

## Intrinsics — equal-height row of cards

Force a Row of cards to the same height as the tallest card, using `IntrinsicSize.Max`, without knowing card content ahead of time.

```kotlin
@Composable
fun EqualHeightCardRow(
    cards: List<CardData>,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .height(IntrinsicSize.Max),   // all children inherit the max intrinsic height
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        cards.forEach { card ->
            Card(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxHeight(),     // expand to the Row's forced height
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp),
                ) {
                    Text(card.title, style = MaterialTheme.typography.titleMedium)
                    Text(card.body, style = MaterialTheme.typography.bodySmall)
                }
            }
        }
    }
}
```
