## Open, read, and persist a user-chosen PDF

```kotlin
// ViewModel holds the persisted Uri and exposes it as State
class DocumentViewModel(private val app: Application) : AndroidViewModel(app) {

    private val prefs = app.getSharedPreferences("docs", Context.MODE_PRIVATE)

    private val _documentUri = MutableStateFlow<Uri?>(
        prefs.getString("last_doc_uri", null)?.let(Uri::parse)
    )
    val documentUri: StateFlow<Uri?> = _documentUri.asStateFlow()

    fun onDocumentPicked(uri: Uri) {
        // Persist both the URI and its permission grant
        val flags = Intent.FLAG_GRANT_READ_URI_PERMISSION
        app.contentResolver.takePersistableUriPermission(uri, flags)
        prefs.edit { putString("last_doc_uri", uri.toString()) }
        _documentUri.value = uri
    }

    fun readDocument(uri: Uri): Flow<String> = flow {
        app.contentResolver.openInputStream(uri)?.use { stream ->
            emit(stream.bufferedReader().readText())
        }
    }.flowOn(Dispatchers.IO)
}

// Composable screen
@Composable
fun DocumentScreen(viewModel: DocumentViewModel = viewModel()) {
    val context = LocalContext.current
    val documentUri by viewModel.documentUri.collectAsState()
    var content by remember { mutableStateOf("") }

    val launcher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenDocument()
    ) { uri: Uri? ->
        uri?.let { viewModel.onDocumentPicked(it) }
    }

    LaunchedEffect(documentUri) {
        documentUri?.let { uri ->
            viewModel.readDocument(uri).collect { text -> content = text }
        }
    }

    Column(modifier = Modifier.padding(16.dp)) {
        Button(onClick = { launcher.launch(arrayOf("application/pdf")) }) {
            Text("Open PDF")
        }
        if (content.isNotEmpty()) {
            Text(content, modifier = Modifier.verticalScroll(rememberScrollState()))
        }
    }
}
```

## Share a private file via FileProvider

```xml
<!-- AndroidManifest.xml -->
<provider
    android:name="androidx.core.content.FileProvider"
    android:authorities="${applicationId}.fileprovider"
    android:exported="false"
    android:grantUriPermissions="true">
    <meta-data
        android:name="android.support.FILE_PROVIDER_PATHS"
        android:resource="@xml/file_paths" />
</provider>
```

```xml
<!-- res/xml/file_paths.xml -->
<paths>
    <cache-path name="shared_cache" path="share/" />
    <files-path name="shared_files" path="exports/" />
</paths>
```

```kotlin
// Write a report into the cache share dir, then fire a chooser
suspend fun shareReport(context: Context, reportText: String) = withContext(Dispatchers.IO) {
    val shareDir = File(context.cacheDir, "share").also { it.mkdirs() }
    val reportFile = File(shareDir, "report.txt").also { it.writeText(reportText) }

    val uri = FileProvider.getUriForFile(
        context,
        "${context.packageName}.fileprovider",
        reportFile
    )

    val shareIntent = Intent(Intent.ACTION_SEND).apply {
        type = "text/plain"
        putExtra(Intent.EXTRA_STREAM, uri)
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
    }
    context.startActivity(Intent.createChooser(shareIntent, "Share Report"))
}
```

## Save a document to a user-chosen location

```kotlin
@Composable
fun ExportScreen() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    val createDocument = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.CreateDocument("text/csv")
    ) { uri: Uri? ->
        uri ?: return@rememberLauncherForActivityResult
        scope.launch(Dispatchers.IO) {
            context.contentResolver.openOutputStream(uri)?.bufferedWriter()?.use { writer ->
                writer.write("name,value\n")
                writer.write("alpha,1\n")
                writer.write("beta,2\n")
            }
        }
    }

    Button(onClick = { createDocument.launch("export.csv") }) {
        Text("Export CSV")
    }
}
```

## Traverse a user-chosen directory tree

```kotlin
// ViewModel function — runs entirely on IO dispatcher
fun listFilesInTree(context: Context, treeUri: Uri): Flow<List<String>> = flow {
    val docTree = DocumentFile.fromTreeUri(context, treeUri)
        ?: return@flow
    val names = mutableListOf<String>()
    collectDocumentFiles(docTree, names)
    emit(names)
}.flowOn(Dispatchers.IO)

private fun collectDocumentFiles(dir: DocumentFile, names: MutableList<String>) {
    for (doc in dir.listFiles()) {
        if (doc.isDirectory) {
            collectDocumentFiles(doc, names)
        } else {
            doc.name?.let { names.add(it) }
        }
    }
}

// Composable — launches tree picker and requests persistent permission
@Composable
fun TreePickerScreen(viewModel: MyViewModel = viewModel()) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var fileNames by remember { mutableStateOf(emptyList<String>()) }

    val treeLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenDocumentTree()
    ) { uri: Uri? ->
        uri ?: return@rememberLauncherForActivityResult
        val flags = Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION
        context.contentResolver.takePersistableUriPermission(uri, flags)
        scope.launch {
            viewModel.listFilesInTree(context, uri).collect { names ->
                fileNames = names
            }
        }
    }

    Column(modifier = Modifier.padding(16.dp)) {
        Button(onClick = { treeLauncher.launch(null) }) {
            Text("Choose Folder")
        }
        LazyColumn {
            items(fileNames) { name -> Text(name) }
        }
    }
}
```
