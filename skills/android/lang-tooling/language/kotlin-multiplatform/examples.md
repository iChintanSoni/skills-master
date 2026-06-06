## Example: Shared repository with Ktor and kotlinx.serialization

A `ProductRepository` that lives entirely in `commonMain`, uses Ktor for HTTP, and returns a `Flow` of domain models. Both Android and iOS consume it without any platform-specific code in the business layer.

```kotlin
// commonMain: domain model
@Serializable
data class Product(
    val id: String,
    val name: String,
    val priceUsd: Double,
    val imageUrl: String
)

// commonMain: repository interface
interface ProductRepository {
    fun getProducts(): Flow<List<Product>>
    suspend fun getProduct(id: String): Product
}

// commonMain: Ktor-based implementation
class ProductRepositoryImpl(
    private val httpClient: HttpClient
) : ProductRepository {

    override fun getProducts(): Flow<List<Product>> = flow {
        val products: List<Product> = httpClient
            .get("https://api.example.com/products")
            .body()
        emit(products)
    }

    override suspend fun getProduct(id: String): Product =
        httpClient.get("https://api.example.com/products/$id").body()
}

// commonMain: HttpClient factory — engine injected per platform
fun createHttpClient(engine: HttpClientEngine): HttpClient = HttpClient(engine) {
    install(ContentNegotiation) {
        json(Json { ignoreUnknownKeys = true })
    }
    install(HttpTimeout) {
        requestTimeoutMillis = 30_000
    }
}

// androidMain: provide the engine
actual val platformHttpEngine: HttpClientEngine get() = OkHttp.create()

// iosMain: provide the engine
actual val platformHttpEngine: HttpClientEngine get() = Darwin.create()
```

The Android app module creates `ProductRepositoryImpl(createHttpClient(platformHttpEngine))` via Hilt; the iOS app creates the same object in a Swift factory. Neither platform needs to know about HTTP serialization details.

## Example: expect/actual for platform-specific file storage

Sharing a `FileStorage` contract in `commonMain` while each platform writes files using its native API.

```kotlin
// commonMain
expect class PlatformFileStorage {
    fun readText(fileName: String): String?
    fun writeText(fileName: String, content: String)
}

// commonMain: use-case that only sees the shared interface
class SettingsManager(private val storage: PlatformFileStorage) {
    fun saveTheme(theme: String) = storage.writeText("theme.txt", theme)
    fun loadTheme(): String = storage.readText("theme.txt") ?: "system"
}

// androidMain: actual backed by Android internal storage
actual class PlatformFileStorage(private val context: Context) {
    actual fun readText(fileName: String): String? =
        context.filesDir.resolve(fileName)
            .takeIf { it.exists() }
            ?.readText()

    actual fun writeText(fileName: String, content: String) =
        context.filesDir.resolve(fileName).writeText(content)
}

// iosMain: actual backed by iOS Documents directory
actual class PlatformFileStorage {
    private val docsDir: String
        get() = NSSearchPathForDirectoriesInDomains(
            NSDocumentDirectory, NSUserDomainMask, true
        ).first() as String

    actual fun readText(fileName: String): String? =
        NSString.stringWithContentsOfFile(
            "$docsDir/$fileName", NSUTF8StringEncoding, null
        )

    actual fun writeText(fileName: String, content: String) {
        (content as NSString).writeToFile(
            "$docsDir/$fileName", atomically = true,
            encoding = NSUTF8StringEncoding, error = null
        )
    }
}
```

## Example: Room KMP database in commonMain

Defining a `@Database` in `commonMain` so the schema is shared, with platform-specific builder provided via `expect`/`actual`.

```kotlin
// commonMain: entity and DAO
@Entity(tableName = "cached_products")
data class CachedProduct(
    @PrimaryKey val id: String,
    val name: String,
    val priceUsd: Double
)

@Dao
interface ProductDao {
    @Query("SELECT * FROM cached_products")
    fun observeAll(): Flow<List<CachedProduct>>

    @Upsert
    suspend fun upsert(products: List<CachedProduct>)
}

// commonMain: database definition
@Database(entities = [CachedProduct::class], version = 1)
abstract class AppDatabase : RoomDatabase() {
    abstract fun productDao(): ProductDao
}

// commonMain: expect builder factory
expect fun createDatabaseBuilder(name: String): RoomDatabase.Builder<AppDatabase>

// androidMain: actual builder using Android context
actual fun createDatabaseBuilder(name: String): RoomDatabase.Builder<AppDatabase> =
    Room.databaseBuilder<AppDatabase>(
        context = appContext,         // injected via Hilt before first call
        name = name
    )

// iosMain: actual builder using iOS file path
actual fun createDatabaseBuilder(name: String): RoomDatabase.Builder<AppDatabase> {
    val dbFilePath = NSHomeDirectory() + "/Documents/$name"
    return Room.databaseBuilder<AppDatabase>(name = dbFilePath)
}
```

Both platforms produce the same `AppDatabase` instance. The repository in `commonMain` depends only on `ProductDao` — platform database construction details are invisible to shared code.
