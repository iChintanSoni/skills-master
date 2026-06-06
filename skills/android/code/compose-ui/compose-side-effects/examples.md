## LaunchedEffect with debounced search

A real-world search bar that debounces user input before hitting a repository, then cancels the in-flight request when the query changes again.

```kotlin
@Composable
fun SearchBar(
    repository: SearchRepository,
    modifier: Modifier = Modifier
) {
    var query by remember { mutableStateOf("") }
    var results by remember { mutableStateOf<List<SearchResult>>(emptyList()) }
    var isLoading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    // LaunchedEffect restarts on each `query` change, cancelling the previous job.
    // delay(300) acts as a debounce — fast typing skips stale searches.
    LaunchedEffect(query) {
        if (query.isBlank()) {
            results = emptyList()
            return@LaunchedEffect
        }
        delay(300)
        isLoading = true
        error = null
        try {
            results = repository.search(query)
        } catch (e: IOException) {
            error = e.localizedMessage
        } finally {
            isLoading = false
        }
    }

    Column(modifier = modifier) {
        OutlinedTextField(
            value = query,
            onValueChange = { query = it },
            label = { Text("Search") },
            trailingIcon = if (isLoading) {
                { CircularProgressIndicator(Modifier.size(18.dp)) }
            } else null,
            modifier = Modifier.fillMaxWidth()
        )
        error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        LazyColumn {
            items(results) { SearchResultRow(it) }
        }
    }
}
```

## DisposableEffect for sensor subscription

A composable that subscribes to the device accelerometer and exposes readings as state, cleaning up the listener on leave.

```kotlin
@Composable
fun AccelerometerReading(): Triple<Float, Float, Float> {
    val context = LocalContext.current
    var reading by remember { mutableStateOf(Triple(0f, 0f, 0f)) }

    DisposableEffect(context) {
        val manager = context.getSystemService(SensorManager::class.java)
        val sensor = manager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
        val listener = object : SensorEventListener {
            override fun onSensorChanged(event: SensorEvent) {
                reading = Triple(event.values[0], event.values[1], event.values[2])
            }
            override fun onAccuracyChanged(sensor: Sensor, accuracy: Int) = Unit
        }
        manager.registerListener(listener, sensor, SensorManager.SENSOR_DELAY_UI)
        onDispose {
            manager.unregisterListener(listener)   // always runs on leave or key change
        }
    }
    return reading
}

@Composable
fun AccelerometerScreen() {
    val (x, y, z) = AccelerometerReading()
    Column(Modifier.padding(16.dp)) {
        Text("X: ${"%.2f".format(x)}")
        Text("Y: ${"%.2f".format(y)}")
        Text("Z: ${"%.2f".format(z)}")
    }
}
```

## produceState converting a callback API to State

A helper that wraps a legacy callback-based location provider into a Compose `State<Location?>`, using `awaitDispose` to clean up the subscription.

```kotlin
@Composable
fun rememberCurrentLocation(provider: LocationProvider): State<Location?> =
    produceState<Location?>(initialValue = null) {
        val callback = LocationCallback { location -> value = location }
        provider.startUpdates(callback)
        awaitDispose { provider.stopUpdates(callback) }
    }

@Composable
fun LocationScreen(provider: LocationProvider) {
    val location by rememberCurrentLocation(provider)
    if (location == null) {
        CircularProgressIndicator()
    } else {
        Text("Lat ${location!!.latitude}, Lon ${location!!.longitude}")
    }
}
```

## snapshotFlow driving analytics from scroll position

Using `snapshotFlow` inside a `LaunchedEffect` to debounce-log which item is visible at the top of a `LazyColumn`.

```kotlin
@Composable
fun FeedScreen(items: List<FeedItem>, analytics: Analytics) {
    val listState = rememberLazyListState()

    // Convert Compose scroll state → Flow, debounce, then log.
    LaunchedEffect(listState, analytics) {
        snapshotFlow { listState.firstVisibleItemIndex }
            .distinctUntilChanged()
            .debounce(500)
            .drop(1)              // skip the initial zero on first composition
            .collect { index ->
                analytics.logImpression(itemId = items.getOrNull(index)?.id)
            }
    }

    LazyColumn(state = listState) {
        items(items, key = { it.id }) { FeedRow(it) }
    }
}
```
