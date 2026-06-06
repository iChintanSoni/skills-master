## Step counter widget with periodic WorkManager refresh

A realistic home-screen widget that counts steps, stores state in DataStore Preferences, and schedules a 15-minute periodic WorkManager job to refresh data in the background. Demonstrates `SizeMode.Responsive`, `actionRunCallback`, and state update patterns.

```kotlin
// --- StepCounterWidget.kt ---

val stepKey = intPreferencesKey("steps")
val lastUpdatedKey = longPreferencesKey("last_updated_ms")

class StepCounterWidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget = StepCounterWidget()
}

class StepCounterWidget : GlanceAppWidget() {

    override val stateDefinition = PreferencesGlanceStateDefinition

    override val sizeMode = SizeMode.Responsive(
        setOf(
            DpSize(110.dp, 90.dp),   // 2x1 phone cell
            DpSize(220.dp, 90.dp),   // 4x1 phone cell
            DpSize(320.dp, 180.dp),  // wide tablet tile
        )
    )

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        provideContent {
            GlanceTheme(colors = GlanceTheme.colors) {
                val prefs = currentState<Preferences>()
                val steps = prefs[stepKey] ?: 0
                val updatedMs = prefs[lastUpdatedKey] ?: 0L
                val size = LocalSize.current
                StepWidgetContent(steps, updatedMs, compact = size.width < 200.dp)
            }
        }
    }
}

@Composable
private fun StepWidgetContent(steps: Int, lastUpdatedMs: Long, compact: Boolean) {
    Column(
        modifier = GlanceModifier
            .fillMaxSize()
            .background(GlanceTheme.colors.widgetBackground)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = NumberFormat.getNumberInstance().format(steps),
            style = TextStyle(
                fontSize = if (compact) 28.sp else 36.sp,
                fontWeight = FontWeight.Bold,
                color = GlanceTheme.colors.onSurface
            )
        )
        if (!compact) {
            Text(
                text = "steps today",
                style = TextStyle(fontSize = 13.sp, color = GlanceTheme.colors.secondary)
            )
            Spacer(modifier = GlanceModifier.height(8.dp))
        }
        Row(verticalAlignment = Alignment.CenterVertically) {
            Button(
                text = "Refresh",
                onClick = actionRunCallback<RefreshStepsCallback>(),
                style = ButtonDefaults.buttonStyle(
                    backgroundColor = ColorProvider(GlanceTheme.colors.primary)
                )
            )
            if (!compact && lastUpdatedMs > 0L) {
                Spacer(modifier = GlanceModifier.width(8.dp))
                Text(
                    text = "Updated ${formatElapsed(lastUpdatedMs)}",
                    style = TextStyle(fontSize = 11.sp, color = GlanceTheme.colors.secondaryVariant)
                )
            }
        }
    }
}

private fun formatElapsed(ms: Long): String {
    val minutes = (System.currentTimeMillis() - ms) / 60_000
    return if (minutes < 1) "just now" else "${minutes}m ago"
}

// --- RefreshStepsCallback.kt ---

class RefreshStepsCallback : ActionCallback {
    override suspend fun onAction(
        context: Context,
        glanceId: GlanceId,
        parameters: ActionParameters
    ) {
        val steps = StepRepository(context).fetchTodaySteps()
        updateAppWidgetState(context, glanceId) { prefs ->
            prefs[stepKey] = steps
            prefs[lastUpdatedKey] = System.currentTimeMillis()
        }
        StepCounterWidget().update(context, glanceId)
    }
}

// --- StepRefreshWorker.kt ---

class StepRefreshWorker(
    private val context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val manager = GlanceAppWidgetManager(context)
        val glanceIds = manager.getGlanceIds(StepCounterWidget::class.java)
        if (glanceIds.isEmpty()) return Result.success()

        val steps = StepRepository(context).fetchTodaySteps()
        glanceIds.forEach { id ->
            updateAppWidgetState(context, id) { prefs ->
                prefs[stepKey] = steps
                prefs[lastUpdatedKey] = System.currentTimeMillis()
            }
            StepCounterWidget().update(context, id)
        }
        return Result.success()
    }

    companion object {
        private const val WORK_NAME = "step_refresh_periodic"

        fun schedule(context: Context) {
            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                PeriodicWorkRequestBuilder<StepRefreshWorker>(15, TimeUnit.MINUTES)
                    .setConstraints(Constraints(requiresBatteryNotLow = true))
                    .build()
            )
        }
    }
}
```

## Weather widget with deep-link action and custom DataStore state

Shows a structured `DataStore<WeatherState>` (not just Preferences), an `actionStartActivity` deep-link tap handler, and a responsive two-breakpoint layout with a forecast row visible only in the wide configuration.

```kotlin
// --- WeatherState.kt (DataStore model) ---

@Serializable
data class WeatherState(
    val cityName: String = "",
    val tempC: Int = 0,
    val conditionIcon: String = "☀️",
    val forecast: List<ForecastDay> = emptyList(),
    val fetchedAtMs: Long = 0L
)

@Serializable
data class ForecastDay(val label: String, val highC: Int, val lowC: Int)

object WeatherStateDefinition : GlanceStateDefinition<WeatherState> {
    private val Context.dataStore by dataStore("widget_weather.json", WeatherStateSerializer)

    override suspend fun getDataStore(context: Context, fileKey: String) =
        context.dataStore

    override fun getLocation(context: Context, fileKey: String): File =
        File(context.filesDir, "datastore/widget_weather.json")
}

// --- WeatherWidget.kt ---

class WeatherWidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget = WeatherWidget()
}

class WeatherWidget : GlanceAppWidget() {

    override val stateDefinition = WeatherStateDefinition

    override val sizeMode = SizeMode.Responsive(
        setOf(DpSize(150.dp, 100.dp), DpSize(300.dp, 100.dp))
    )

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        provideContent {
            GlanceTheme(colors = GlanceTheme.colors) {
                val state = currentState<WeatherState>()
                val size = LocalSize.current
                WeatherContent(state, wide = size.width >= 280.dp)
            }
        }
    }
}

@Composable
private fun WeatherContent(state: WeatherState, wide: Boolean) {
    val openApp = actionStartActivity<WeatherActivity>(
        actionParametersOf(WeatherActivity.PARAM_CITY to state.cityName)
    )
    Row(
        modifier = GlanceModifier
            .fillMaxSize()
            .clickable(openApp)
            .background(GlanceTheme.colors.widgetBackground)
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = GlanceModifier.defaultWeight()) {
            Text(state.conditionIcon, style = TextStyle(fontSize = 32.sp))
            Text(
                "${state.tempC}°",
                style = TextStyle(fontSize = 24.sp, fontWeight = FontWeight.Bold)
            )
            Text(state.cityName, style = TextStyle(fontSize = 12.sp))
        }
        if (wide && state.forecast.isNotEmpty()) {
            Spacer(modifier = GlanceModifier.width(12.dp))
            state.forecast.take(3).forEach { day ->
                Column(
                    modifier = GlanceModifier.width(56.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(day.label, style = TextStyle(fontSize = 11.sp))
                    Text("${day.highC}°", style = TextStyle(fontSize = 13.sp, fontWeight = FontWeight.Medium))
                    Text("${day.lowC}°", style = TextStyle(fontSize = 11.sp))
                }
            }
        }
    }
}

// --- WeatherRefreshWorker.kt ---

class WeatherRefreshWorker(context: Context, params: WorkerParameters) :
    CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val newState = WeatherRepository(applicationContext).fetchCurrent()
        GlanceAppWidgetManager(applicationContext)
            .getGlanceIds(WeatherWidget::class.java)
            .forEach { id ->
                updateAppWidgetState(applicationContext, WeatherStateDefinition, id) { newState }
                WeatherWidget().update(applicationContext, id)
            }
        return Result.success()
    }
}
```

## Notes widget with item list and LazyColumn equivalent

Illustrates how to render a scrollable list of items inside a widget using Glance's `LazyColumn` (available in `androidx.glance.appwidget.lazy`), per-item tap callbacks that pass an item ID as an `ActionParameters` value, and graceful empty-state handling.

```kotlin
val NOTE_ID_KEY = ActionParameters.Key<String>("note_id")

@Composable
fun NotesWidgetContent(notes: List<NoteItem>) {
    Column(
        modifier = GlanceModifier
            .fillMaxSize()
            .background(GlanceTheme.colors.widgetBackground)
    ) {
        // Header bar
        Row(
            modifier = GlanceModifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                "Notes",
                modifier = GlanceModifier.defaultWeight(),
                style = TextStyle(fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
            )
            Image(
                provider = ImageProvider(R.drawable.ic_add),
                contentDescription = "Add note",
                modifier = GlanceModifier
                    .size(24.dp)
                    .clickable(actionStartActivity<NewNoteActivity>())
            )
        }
        if (notes.isEmpty()) {
            Box(
                modifier = GlanceModifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Text("No notes yet", style = TextStyle(fontSize = 14.sp))
            }
        } else {
            LazyColumn {
                items(notes, itemId = { it.id.hashCode().toLong() }) { note ->
                    Row(
                        modifier = GlanceModifier
                            .fillMaxWidth()
                            .padding(horizontal = 12.dp, vertical = 6.dp)
                            .clickable(
                                actionRunCallback<OpenNoteCallback>(
                                    actionParametersOf(NOTE_ID_KEY to note.id)
                                )
                            )
                    ) {
                        Text(
                            note.title,
                            style = TextStyle(fontSize = 14.sp),
                            maxLines = 1
                        )
                    }
                }
            }
        }
    }
}

class OpenNoteCallback : ActionCallback {
    override suspend fun onAction(
        context: Context,
        glanceId: GlanceId,
        parameters: ActionParameters
    ) {
        val noteId = parameters[NOTE_ID_KEY] ?: return
        val intent = Intent(context, NoteDetailActivity::class.java).apply {
            putExtra("note_id", noteId)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
    }
}
```
