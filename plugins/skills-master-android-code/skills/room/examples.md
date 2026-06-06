## Notes list with reactive Flow — full ViewModel + Compose screen

A notes app screen that observes all notes reactively from Room, supports creating and deleting notes, and surfaces loading/error states.

```kotlin
// --- Domain model (not the entity — keep a mapping layer) ---
data class Note(val id: Long, val title: String, val body: String, val createdAt: Instant)

// --- Repository ---
class NoteRepository @Inject constructor(private val dao: NoteDao) {
    fun observeNotes(): Flow<List<Note>> =
        dao.observeAll().map { entities -> entities.map(NoteEntity::toDomain) }

    suspend fun create(title: String, body: String) {
        dao.upsert(NoteEntity(title = title, body = body, createdAt = Instant.now()))
    }

    suspend fun delete(note: Note) {
        dao.delete(note.toEntity())
    }
}

private fun NoteEntity.toDomain() = Note(id, title, body, createdAt)
private fun Note.toEntity() = NoteEntity(id, title, body, createdAt)

// --- UiState ---
sealed interface NotesUiState {
    data object Loading : NotesUiState
    data class Success(val notes: List<Note>) : NotesUiState
    data class Error(val message: String?) : NotesUiState
}

// --- ViewModel ---
@HiltViewModel
class NotesViewModel @Inject constructor(
    private val repo: NoteRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow<NotesUiState>(NotesUiState.Loading)
    val uiState: StateFlow<NotesUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            repo.observeNotes()
                .catch { _uiState.value = NotesUiState.Error(it.message) }
                .collect { _uiState.value = NotesUiState.Success(it) }
        }
    }

    fun create(title: String, body: String) {
        viewModelScope.launch(Dispatchers.IO) { repo.create(title, body) }
    }

    fun delete(note: Note) {
        viewModelScope.launch(Dispatchers.IO) { repo.delete(note) }
    }
}

// --- Composable ---
@Composable
fun NotesScreen(vm: NotesViewModel = hiltViewModel()) {
    val uiState by vm.uiState.collectAsStateWithLifecycle()

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(onClick = { vm.create("New note", "") }) {
                Icon(Icons.Default.Add, contentDescription = "Add note")
            }
        }
    ) { padding ->
        when (val s = uiState) {
            is NotesUiState.Loading -> CircularProgressIndicator(Modifier.padding(padding))
            is NotesUiState.Error   -> Text("Error: ${s.message}", Modifier.padding(padding))
            is NotesUiState.Success -> LazyColumn(contentPadding = padding) {
                items(s.notes, key = { it.id }) { note ->
                    ListItem(
                        headlineContent = { Text(note.title) },
                        supportingContent = { Text(note.body) },
                        trailingContent = {
                            IconButton(onClick = { vm.delete(note) }) {
                                Icon(Icons.Default.Delete, contentDescription = "Delete")
                            }
                        },
                    )
                }
            }
        }
    }
}
```

## One-to-many @Relation — Author with their Books

A realistic schema with a one-to-many relation fetched as a single transactional query.

```kotlin
// --- Entities ---
@Entity(tableName = "authors")
data class AuthorEntity(
    @PrimaryKey val id: String,
    @ColumnInfo(name = "full_name") val fullName: String,
)

@Entity(
    tableName = "books",
    foreignKeys = [
        ForeignKey(
            entity = AuthorEntity::class,
            parentColumns = ["id"],
            childColumns = ["author_id"],
            onDelete = ForeignKey.CASCADE,
        )
    ],
    indices = [Index("author_id")],
)
data class BookEntity(
    @PrimaryKey val id: String,
    @ColumnInfo(name = "author_id") val authorId: String,
    @ColumnInfo(name = "title") val title: String,
    @ColumnInfo(name = "published_year") val publishedYear: Int,
)

// --- Relation POJO ---
data class AuthorWithBooks(
    @Embedded val author: AuthorEntity,
    @Relation(parentColumn = "id", entityColumn = "author_id")
    val books: List<BookEntity>,
)

// --- DAO ---
@Dao
interface LibraryDao {
    @Transaction
    @Query("SELECT * FROM authors WHERE id = :authorId")
    fun observeAuthorWithBooks(authorId: String): Flow<AuthorWithBooks?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAuthor(author: AuthorEntity)

    @Upsert
    suspend fun upsertBooks(books: List<BookEntity>)

    // Atomic: insert author + all books in one transaction
    @Transaction
    suspend fun replaceAuthorWithBooks(author: AuthorEntity, books: List<BookEntity>) {
        insertAuthor(author)
        upsertBooks(books)
    }
}

// --- Database ---
@Database(
    entities = [AuthorEntity::class, BookEntity::class],
    version = 1,
    exportSchema = true,
)
abstract class LibraryDatabase : RoomDatabase() {
    abstract fun libraryDao(): LibraryDao
}
```

## Manual migration — adding a column and backfilling data

Version 2 adds a `summary` column to the `notes` table and backfills it from the `body` column.

```kotlin
val MIGRATION_1_2 = object : Migration(1, 2) {
    override fun migrate(db: SupportSQLiteDatabase) {
        // 1. Add the column with a NOT NULL default so existing rows are valid immediately.
        db.execSQL("ALTER TABLE notes ADD COLUMN summary TEXT NOT NULL DEFAULT ''")
        // 2. Backfill: copy first 100 chars of body into summary.
        db.execSQL(
            "UPDATE notes SET summary = SUBSTR(body, 1, 100) WHERE summary = ''"
        )
    }
}

// In the Hilt module:
Room.databaseBuilder(ctx, AppDatabase::class.java, "app.db")
    .addMigrations(MIGRATION_1_2)
    .build()

// Migration test (androidTest source set):
class MigrationTest {
    @get:Rule
    val helper = MigrationTestHelper(
        InstrumentationRegistry.getInstrumentation(),
        AppDatabase::class.java,
    )

    @Test
    fun migrate1To2() {
        // Create version-1 schema and insert a row.
        helper.createDatabase("test-db", 1).apply {
            execSQL("INSERT INTO notes (title, body, created_at) VALUES ('T', 'Hello World', 0)")
            close()
        }
        // Run the migration and validate the resulting schema.
        val db = helper.runMigrationsAndValidate("test-db", 2, true, MIGRATION_1_2)
        val cursor = db.query("SELECT summary FROM notes WHERE title = 'T'")
        cursor.moveToFirst()
        assert(cursor.getString(0) == "Hello World")
        cursor.close()
    }
}
```

## Room KMP — shared database in commonMain

Declares the database and DAOs in `commonMain` and provides the builder via `expect/actual`.

```kotlin
// commonMain — entity and DAO
@Entity(tableName = "tasks")
data class TaskEntity(
    @PrimaryKey val id: String,
    @ColumnInfo(name = "label") val label: String,
    @ColumnInfo(name = "done") val done: Boolean = false,
)

@Dao
interface TaskDao {
    @Query("SELECT * FROM tasks")
    fun observeAll(): Flow<List<TaskEntity>>

    @Upsert
    suspend fun upsert(task: TaskEntity)
}

@Database(entities = [TaskEntity::class], version = 1, exportSchema = true)
abstract class TaskDatabase : RoomDatabase() {
    abstract fun taskDao(): TaskDao
}

// commonMain — expect factory
expect fun createTaskDatabase(): TaskDatabase

// androidMain — actual factory
actual fun createTaskDatabase(): TaskDatabase {
    val ctx = applicationContext()   // supplied via a platform DI binding
    return Room.databaseBuilder<TaskDatabase>(
        context = ctx,
        name = ctx.getDatabasePath("tasks.db").absolutePath,
    ).build()
}

// nativeMain (iOS) — actual factory using NativeSQLiteDriver
actual fun createTaskDatabase(): TaskDatabase {
    val driver = NativeSQLiteDriver(TaskDatabase.Schema, "tasks.db")
    return TaskDatabase(driver)
}
```
