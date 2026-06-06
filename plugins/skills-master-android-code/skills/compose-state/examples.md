# compose-state — examples

## Hoisting state through multiple layers

A realistic search-and-filter screen where expansion state stays local but the query is hoisted to the screen composable, which delegates results to a ViewModel.

```kotlin
data class FilterChip(val label: String, val key: String)

@Composable
fun FilterBar(
    activeKey: String?,
    chips: List<FilterChip>,
    onFilterSelected: (String?) -> Unit,
    modifier: Modifier = Modifier
) {
    // Expansion of the filter row is pure UI state — not hoisted further
    var expanded by remember { mutableStateOf(false) }

    Column(modifier = modifier) {
        TextButton(onClick = { expanded = !expanded }) {
            Text(if (expanded) "Hide filters" else "Show filters")
        }
        AnimatedVisibility(visible = expanded) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                chips.forEach { chip ->
                    FilterChip(
                        selected = chip.key == activeKey,
                        onClick = {
                            onFilterSelected(if (chip.key == activeKey) null else chip.key)
                        },
                        label = { Text(chip.label) }
                    )
                }
            }
        }
    }
}

@Composable
fun ProductListScreen(viewModel: ProductViewModel = viewModel()) {
    // query survives rotation because rememberSaveable
    var query by rememberSaveable { mutableStateOf("") }
    var activeFilter by rememberSaveable { mutableStateOf<String?>(null) }

    val products by viewModel.products.collectAsStateWithLifecycle()

    // derivedStateOf: recompose only when the visible list actually changes
    val visibleProducts by remember {
        derivedStateOf {
            products
                .filter { activeFilter == null || it.category == activeFilter }
                .filter { it.name.contains(query, ignoreCase = true) }
        }
    }

    LaunchedEffect(query, activeFilter) {
        viewModel.onFilterChanged(query, activeFilter)
    }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        OutlinedTextField(
            value = query,
            onValueChange = { query = it },
            label = { Text("Search products") },
            modifier = Modifier.fillMaxWidth()
        )
        FilterBar(
            activeKey = activeFilter,
            chips = listOf(
                FilterChip("Electronics", "electronics"),
                FilterChip("Books", "books"),
                FilterChip("Clothing", "clothing")
            ),
            onFilterSelected = { activeFilter = it },
            modifier = Modifier.fillMaxWidth()
        )
        LazyColumn(modifier = Modifier.weight(1f)) {
            items(visibleProducts, key = { it.id }) { product ->
                ProductRow(product = product)
            }
        }
    }
}
```

## Custom Saver for a non-Parcelable type

Demonstrates how to keep a domain value type in `rememberSaveable` with a `listSaver`.

```kotlin
data class DateRange(val startEpochDay: Long, val endEpochDay: Long)

val DateRangeSaver = listSaver<DateRange, Long>(
    save = { listOf(it.startEpochDay, it.endEpochDay) },
    restore = { DateRange(startEpochDay = it[0], endEpochDay = it[1]) }
)

@Composable
fun DateRangePicker(
    onRangeConfirmed: (DateRange) -> Unit,
    modifier: Modifier = Modifier
) {
    val today = LocalDate.now().toEpochDay()
    var range by rememberSaveable(stateSaver = DateRangeSaver) {
        mutableStateOf(DateRange(today, today + 7))
    }

    Column(modifier = modifier) {
        Text("From day ${range.startEpochDay} to ${range.endEpochDay}")
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(onClick = { range = range.copy(startEpochDay = range.startEpochDay - 1) }) {
                Text("- Start")
            }
            Button(onClick = { range = range.copy(endEpochDay = range.endEpochDay + 1) }) {
                Text("+ End")
            }
            Button(onClick = { onRangeConfirmed(range) }) {
                Text("Confirm")
            }
        }
    }
}
```

## `mutableStateListOf` for a live checklist

Shows how to use an observable collection so individual item mutations trigger targeted recomposition.

```kotlin
data class CheckItem(val id: Int, val label: String, var checked: Boolean = false)

@Composable
fun Checklist(modifier: Modifier = Modifier) {
    // Observable collection — mutations trigger recomposition without list reassignment
    val items = remember {
        mutableStateListOf(
            CheckItem(1, "Buy groceries"),
            CheckItem(2, "Call the bank"),
            CheckItem(3, "Review pull request")
        )
    }

    val pendingCount by remember { derivedStateOf { items.count { !it.checked } } }

    Column(modifier = modifier.padding(16.dp)) {
        Text(
            text = "$pendingCount item(s) remaining",
            style = MaterialTheme.typography.titleMedium
        )
        Spacer(Modifier.height(8.dp))
        items.forEachIndexed { index, item ->
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable {
                        items[index] = item.copy(checked = !item.checked)
                    }
                    .padding(vertical = 4.dp)
            ) {
                Checkbox(
                    checked = item.checked,
                    onCheckedChange = { checked ->
                        items[index] = item.copy(checked = checked)
                    }
                )
                Text(
                    text = item.label,
                    modifier = Modifier.padding(start = 8.dp),
                    style = if (item.checked)
                        MaterialTheme.typography.bodyLarge.copy(
                            textDecoration = TextDecoration.LineThrough
                        )
                    else MaterialTheme.typography.bodyLarge
                )
            }
        }
    }
}
```

## Bridging state to a Flow with `snapshotFlow`

Shows how to observe a `State` value from a coroutine and debounce it before triggering a side effect.

```kotlin
@Composable
fun AutoSaveEditor(onSave: suspend (String) -> Unit) {
    var text by remember { mutableStateOf("") }
    var isSaving by remember { mutableStateOf(false) }

    // snapshotFlow converts a state read into a cold Flow observed in a coroutine
    LaunchedEffect(Unit) {
        snapshotFlow { text }
            .distinctUntilChanged()
            .debounce(800)
            .filter { it.isNotBlank() }
            .collect { latestText ->
                isSaving = true
                onSave(latestText)
                isSaving = false
            }
    }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        OutlinedTextField(
            value = text,
            onValueChange = { text = it },
            label = { Text("Document") },
            modifier = Modifier.fillMaxWidth().weight(1f),
            maxLines = Int.MAX_VALUE
        )
        if (isSaving) {
            LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
        } else {
            Text(
                "Auto-save on pause",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.outline
            )
        }
    }
}
```
