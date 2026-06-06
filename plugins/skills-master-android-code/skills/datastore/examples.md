## Preferences DataStore with Hilt — full wiring

A complete setup showing the Hilt module, repository, ViewModel, and Composable for a settings screen that persists theme and notification preferences.

```kotlin
// di/DataStoreModule.kt
@Module
@InstallIn(SingletonComponent::class)
object DataStoreModule {

    @Provides
    @Singleton
    fun providePreferencesDataStore(
        @ApplicationContext context: Context
    ): DataStore<Preferences> = context.appDataStore
}

// data/AppDataStore.kt — single delegate for the whole app
val Context.appDataStore: DataStore<Preferences>
    by preferencesDataStore(name = "app_prefs")

// data/AppPreferencesKeys.kt
object AppPreferencesKeys {
    val THEME               = stringPreferencesKey("theme")
    val NOTIFICATIONS       = booleanPreferencesKey("notifications_enabled")
    val LAST_SYNC_EPOCH_MS  = longPreferencesKey("last_sync_epoch_ms")
}

// data/AppPreferencesRepository.kt
class AppPreferencesRepository @Inject constructor(
    private val dataStore: DataStore<Preferences>
) {
    private fun Flow<Preferences>.safeData(): Flow<Preferences> =
        catch { cause ->
            if (cause is IOException) emit(emptyPreferences()) else throw cause
        }

    val theme: Flow<String> = dataStore.data
        .safeData()
        .map { it[AppPreferencesKeys.THEME] ?: "system" }

    val notificationsEnabled: Flow<Boolean> = dataStore.data
        .safeData()
        .map { it[AppPreferencesKeys.NOTIFICATIONS] ?: true }

    suspend fun setTheme(theme: String) {
        dataStore.edit { it[AppPreferencesKeys.THEME] = theme }
    }

    suspend fun setNotificationsEnabled(enabled: Boolean) {
        dataStore.edit { it[AppPreferencesKeys.NOTIFICATIONS] = enabled }
    }

    suspend fun recordSyncTime() {
        dataStore.edit {
            it[AppPreferencesKeys.LAST_SYNC_EPOCH_MS] = System.currentTimeMillis()
        }
    }
}

// ui/settings/SettingsViewModel.kt
@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val prefs: AppPreferencesRepository,
) : ViewModel() {

    data class SettingsUiState(
        val theme: String = "system",
        val notificationsEnabled: Boolean = true,
    )

    val uiState: StateFlow<SettingsUiState> = combine(
        prefs.theme,
        prefs.notificationsEnabled,
    ) { theme, notifications ->
        SettingsUiState(theme = theme, notificationsEnabled = notifications)
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = SettingsUiState(),
    )

    fun onThemeChanged(theme: String) {
        viewModelScope.launch { prefs.setTheme(theme) }
    }

    fun onNotificationsToggled(enabled: Boolean) {
        viewModelScope.launch { prefs.setNotificationsEnabled(enabled) }
    }
}

// ui/settings/SettingsScreen.kt
@Composable
fun SettingsScreen(
    viewModel: SettingsViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text("Settings", style = MaterialTheme.typography.headlineMedium)

        // Theme selector
        val themes = listOf("system", "light", "dark")
        Text("Theme", style = MaterialTheme.typography.labelLarge)
        themes.forEach { theme ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .selectable(
                        selected = state.theme == theme,
                        onClick = { viewModel.onThemeChanged(theme) },
                        role = Role.RadioButton,
                    )
                    .padding(vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                RadioButton(
                    selected = state.theme == theme,
                    onClick = null,
                )
                Text(
                    text = theme.replaceFirstChar { it.uppercase() },
                    modifier = Modifier.padding(start = 8.dp),
                )
            }
        }

        HorizontalDivider()

        // Notifications toggle
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("Push notifications", style = MaterialTheme.typography.bodyLarge)
            Switch(
                checked = state.notificationsEnabled,
                onCheckedChange = viewModel::onNotificationsToggled,
            )
        }
    }
}
```

---

## Proto DataStore — typed schema with versioning

Demonstrates defining a `.proto` schema, writing a `Serializer`, and performing an atomic update with a migration from an older proto version.

```kotlin
// src/main/proto/user_settings.proto
// syntax = "proto3";
// option java_package = "com.example.app.data";
// option java_multiple_files = true;
// message UserSettings {
//   string locale         = 1;
//   bool   analytics_opt_in = 2;
//   int32  font_size_sp   = 3;
// }

// data/UserSettingsSerializer.kt
object UserSettingsSerializer : Serializer<UserSettings> {
    override val defaultValue: UserSettings =
        UserSettings.newBuilder()
            .setLocale("en")
            .setAnalyticsOptIn(false)
            .setFontSizeSp(16)
            .build()

    override suspend fun readFrom(input: InputStream): UserSettings =
        try {
            UserSettings.parseFrom(input)
        } catch (e: InvalidProtocolBufferException) {
            throw CorruptionException("Cannot read proto UserSettings", e)
        }

    override suspend fun writeTo(t: UserSettings, output: OutputStream) =
        t.writeTo(output)
}

// data/UserSettingsDataStore.kt
val Context.userSettingsDataStore: DataStore<UserSettings>
    by dataStore(
        fileName = "user_settings.pb",
        serializer = UserSettingsSerializer,
    )

// data/UserSettingsRepository.kt
class UserSettingsRepository @Inject constructor(
    private val dataStore: DataStore<UserSettings>
) {
    val settings: Flow<UserSettings> = dataStore.data
        .catch { cause ->
            if (cause is IOException) emit(UserSettingsSerializer.defaultValue)
            else throw cause
        }

    val locale: Flow<String>  = settings.map { it.locale }
    val fontSizeSp: Flow<Int> = settings.map { it.fontSizeSp }

    // Atomic update — returns the new snapshot
    suspend fun setLocale(locale: String): UserSettings =
        dataStore.updateData { current ->
            current.toBuilder().setLocale(locale).build()
        }

    suspend fun setFontSize(sp: Int): UserSettings =
        dataStore.updateData { current ->
            current.toBuilder().setFontSizeSp(sp.coerceIn(12, 32)).build()
        }

    suspend fun optInToAnalytics(): UserSettings =
        dataStore.updateData { current ->
            current.toBuilder().setAnalyticsOptIn(true).build()
        }
}

// ViewModel collecting proto flow
@HiltViewModel
class TypographyViewModel @Inject constructor(
    private val repo: UserSettingsRepository,
) : ViewModel() {

    val fontSizeSp: StateFlow<Int> = repo.fontSizeSp
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), 16)

    fun increaseFont() {
        viewModelScope.launch { repo.setFontSize(fontSizeSp.value + 2) }
    }

    fun decreaseFont() {
        viewModelScope.launch { repo.setFontSize(fontSizeSp.value - 2) }
    }
}
```

---

## Migrating from SharedPreferences

Shows a Preferences DataStore that automatically imports legacy SharedPreferences values on the first read.

```kotlin
// data/MigratedPreferencesDataStore.kt
private const val LEGACY_PREFS_NAME = "my_app_prefs"

val Context.migratedDataStore: DataStore<Preferences>
    by preferencesDataStore(
        name = "app_prefs_v2",
        produceMigrations = { context ->
            listOf(
                SharedPreferencesMigration(
                    context = context,
                    sharedPreferencesName = LEGACY_PREFS_NAME,
                    // Only migrate these specific keys; all others are dropped.
                    keysToMigrate = setOf("user_theme", "first_launch_done"),
                )
            )
        }
    )

// repository/OnboardingRepository.kt
class OnboardingRepository @Inject constructor(
    private val dataStore: DataStore<Preferences>
) {
    private val FIRST_LAUNCH_DONE = booleanPreferencesKey("first_launch_done")
    private val USER_THEME        = stringPreferencesKey("user_theme")

    // On first access, migration runs before this Flow emits.
    // Existing SharedPreferences values are automatically mapped.
    val isOnboardingComplete: Flow<Boolean> = dataStore.data
        .catch { if (it is IOException) emit(emptyPreferences()) else throw it }
        .map { it[FIRST_LAUNCH_DONE] ?: false }

    val theme: Flow<String> = dataStore.data
        .catch { if (it is IOException) emit(emptyPreferences()) else throw it }
        .map { it[USER_THEME] ?: "system" }

    suspend fun completeOnboarding() {
        dataStore.edit { it[FIRST_LAUNCH_DONE] = true }
    }

    // After full migration, remove the legacy file from the old location.
    fun deleteLegacyPreferences(context: Context) {
        val legacyFile = File(
            context.filesDir.parent,
            "shared_prefs/$LEGACY_PREFS_NAME.xml"
        )
        if (legacyFile.exists()) legacyFile.delete()
    }
}
```

---

## Unit testing DataStore with in-memory storage

Demonstrates how to test a repository without touching the real filesystem, using `PreferenceDataStoreFactory` with a temporary directory.

```kotlin
// test/AppPreferencesRepositoryTest.kt
@OptIn(ExperimentalCoroutinesApi::class)
class AppPreferencesRepositoryTest {

    private val testDispatcher = UnconfinedTestDispatcher()

    // Create a fresh in-memory-style DataStore per test via a temp file
    private val testDataStore: DataStore<Preferences> =
        PreferenceDataStoreFactory.create(
            scope = CoroutineScope(testDispatcher + Job()),
            produceFile = {
                // Use a unique temp file so tests are isolated
                File.createTempFile("test_prefs", ".preferences_pb").also {
                    it.deleteOnExit()
                }
            }
        )

    private val repository = AppPreferencesRepository(testDataStore)

    @Test
    fun `default theme is system`() = runTest(testDispatcher) {
        val theme = repository.theme.first()
        assertEquals("system", theme)
    }

    @Test
    fun `setTheme persists and emits new value`() = runTest(testDispatcher) {
        repository.setTheme("dark")
        val theme = repository.theme.first()
        assertEquals("dark", theme)
    }

    @Test
    fun `setNotificationsEnabled persists false`() = runTest(testDispatcher) {
        repository.setNotificationsEnabled(false)
        assertFalse(repository.notificationsEnabled.first())
    }

    @Test
    fun `edit is atomic — interleaved reads return consistent state`() = runTest(testDispatcher) {
        val results = mutableListOf<String>()
        val job = launch {
            repository.theme
                .take(3)
                .toList(results)
        }
        repository.setTheme("light")
        repository.setTheme("dark")
        job.join()
        // Results contain "system", "light", "dark" in order — no torn reads
        assertEquals(listOf("system", "light", "dark"), results)
    }
}
```
