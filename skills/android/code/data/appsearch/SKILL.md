---
name: appsearch
description: Covers AppSearch for on-device full-text indexing — defining a schema with @Document, building a LocalStorage or PlatformStorage session, putting and removing documents, executing structured queries with operators and ranking, and surfacing results in system search. Use when an app needs fast on-device search over its own structured content, wants to expose that content to the platform search UI, or needs to replace a manual SQLite FTS setup.
globs:
  - "**/*.kt"
tags: [appsearch, search, indexing, data, jetpack]
x-skills-master:
  domain: android
  class: code
  category: data
  platforms: ["android", "large-screen"]
  requires: { "android": "16", "kotlin": "2.2" }
  pairs_with: []
  sources:
    - https://developer.android.com/guide/topics/search/appsearch
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for AppSearch when your app manages a body of structured content — notes, messages, products, recipes, contacts — and users need to search across it quickly without a network round-trip. AppSearch provides a Jetpack-backed, on-device, full-text search engine with ranking and filtering that is far easier to maintain than rolling SQLite FTS by hand. Use `LocalAppSearchSession` when the index should be private to your app; use `PlatformAppSearchSession` when you want results to appear in the Android system search surface (available on Android 12+). If your query pattern is purely key-value or relational rather than full-text, Room or DataStore is a better fit.

## Core guidance

**Defining the schema**

- Annotate a Kotlin data class (or regular class) with `@Document` and supply a `namespace` and `id` field. Every document is identified by `(namespace, id)` — reusing the same pair replaces the existing document in the index.
- Mark searchable text fields with `@Document.StringProperty`. Control indexing behaviour with `indexingType`: `INDEXING_TYPE_PREFIXES` enables prefix matching (good for incremental search), `INDEXING_TYPE_EXACT_TERMS` saves space when only whole words matter.
- Mark numeric or date fields with `@Document.LongProperty` or `@Document.DoubleProperty` to support range filters.
- Keep `@Document` classes stable across releases; schema changes require calling `setSchemaAsync` with `setForceOverride(true)` or a migration strategy, which removes existing documents of the changed type unless migrated explicitly.

**Opening a session**

- Open a session once, hold it for the lifetime of a ViewModel or repository, and close it in a `finally` block or `use {}` lambda. Opening per-query is expensive.
- Prefer `LocalStorage` for private app content. Switch to `PlatformStorage` only when platform search integration is required — it shares the index with the system and is only available on Android 12+.
- All AppSearch operations return `ListenableFuture`; convert to coroutines with `await()` from `kotlinx-coroutines-guava` to keep your repository layer idiomatic.

**Putting and removing documents**

- Batch puts into a single `putDocumentsAsync` call where possible — each call has per-IPC overhead.
- Delete by `(namespace, id)` with `removeAsync`, by namespace with `removeByNamespaceAsync`, or by query with `removeByQueryAsync` for bulk cleanup (e.g. deleting all documents owned by a signed-out user).
- Always check the `AppSearchResult` returned per document in the `BatchResultCallback` — a single bad document does not fail the whole batch.

**Querying**

- Pass a query string to `searchAsync(query, SearchSpec)`. An empty string `""` matches all documents in the scope.
- Build a `SearchSpec` with `SearchSpec.Builder`: set `setRankingStrategy` (`RANKING_STRATEGY_RELEVANCE_SCORE` for text, `RANKING_STRATEGY_CREATION_TIMESTAMP` for recency), `addFilterSchemas` to scope to specific types, `addFilterNamespaces` to scope to a user or tenant, and `setResultCountPerPage` to page large result sets.
- Use `SearchResults.getNextPageAsync()` in a loop or a Pager to lazily load pages — materialising the entire result set up-front is both slow and memory-heavy.
- Operators in the query string: `AND`, `OR`, `NOT` for boolean logic; `propertyName:term` for field-scoped search; `"exact phrase"` for phrase matching; `term*` for prefix (only effective if `INDEXING_TYPE_PREFIXES` was set on that property).

```kotlin
@Document
data class Note(
    @Document.Namespace val namespace: String,
    @Document.Id val id: String,
    @Document.CreationTimestampMillis val createdAt: Long = System.currentTimeMillis(),
    @Document.Score val score: Int = 0,
    @Document.StringProperty(indexingType = StringPropertyConfig.INDEXING_TYPE_PREFIXES)
    val title: String,
    @Document.StringProperty(indexingType = StringPropertyConfig.INDEXING_TYPE_PREFIXES)
    val body: String,
    @Document.StringProperty val tag: String = "",
)

class NoteSearchRepository(context: Context) {
    private val sessionFuture: ListenableFuture<AppSearchSession> =
        LocalStorage.createSearchSessionAsync(
            LocalStorage.SearchContext.Builder(context, "notes-db").build()
        )

    suspend fun setup() {
        val session = sessionFuture.await()
        val schema = SetSchemaRequest.Builder().addDocumentClasses(Note::class.java).build()
        session.setSchemaAsync(schema).await()
    }

    suspend fun index(notes: List<Note>) {
        val session = sessionFuture.await()
        val request = PutDocumentsRequest.Builder().addDocuments(notes).build()
        session.putAsync(request).await()
    }

    suspend fun search(query: String, namespace: String): List<Note> {
        val session = sessionFuture.await()
        val spec = SearchSpec.Builder()
            .addFilterNamespaces(namespace)
            .setRankingStrategy(SearchSpec.RANKING_STRATEGY_RELEVANCE_SCORE)
            .setResultCountPerPage(30)
            .build()
        val results = session.search(query, spec)
        return results.getNextPageAsync().await().mapNotNull {
            it.getDocument(Note::class.java)
        }
    }

    fun close() {
        sessionFuture.addListener({ sessionFuture.get().close() }, Runnable::run)
    }
}
```

**Surfacing results in system search**

- Use `PlatformAppSearchSession` and set `setSchemaTypeVisibilityForPackage` or `setPubliclyVisibleSchema` in `SetSchemaRequest` so the Android system search can read your documents. Without visibility grants, platform search cannot see the content even if you used `PlatformStorage`.
- Annotate properties that should map to well-known semantic meanings (such as `SCHEMA_TYPE_BUILTIN_PERSON_NAME`) using `@Document.StringProperty` with the appropriate `name` override so the platform can render rich snippets.

## Platform notes

- **API 31 (Android 12):** `PlatformAppSearchSession` becomes available. On earlier API levels, only `LocalAppSearchSession` is available; gate the platform storage path with `Build.VERSION.SDK_INT >= Build.VERSION_CODES.S`.
- **Large-screen:** AppSearch is a pure data layer with no UI coupling — the same session and query logic works across phone, tablet, and foldable without change. Pair with an adaptive list-detail layout to show search results alongside detail content.
- **Jetpack dependency:** Use `androidx.appsearch:appsearch`, `androidx.appsearch:appsearch-local-storage`, and `androidx.appsearch:appsearch-ktx`. The KTX artifact provides the `getDocument(KClass)` extension used above. Add `kotlinx-coroutines-guava` for `await()` on `ListenableFuture`.

## Pitfalls

- Opening a new session for every query — sessions are expensive to initialise and should be long-lived (scoped to a ViewModel or a singleton repository).
- Ignoring per-document errors in `BatchResultCallback` — a malformed document silently fails while others succeed, causing silent data loss in the index.
- Calling `setForceOverride(true)` in production without a migration — this silently wipes all existing documents of the changed type; implement a versioned migration with `setMigrator` instead.
- Prefix searching when `INDEXING_TYPE_PREFIXES` was not set on the property — queries like `"no*"` return no results; the indexing type must be set at schema definition time, not query time.
- Holding a reference to the `AppSearchSession` across process death — sessions are in-process resources; re-open from your `LocalStorage` builder on each process start.
- Materialising all results from `SearchResults` at once with repeated `getNextPageAsync` calls in a tight loop — this blocks the calling coroutine and produces large allocations; page lazily in a `Flow` or Paging 3 source.
- Using `namespace` as a free-form label without a consistent scheme — namespaces are the primary way to scope queries and bulk-delete per user or per data source; agree on a stable naming convention (e.g. `"user:${userId}"`) before shipping.

## References

- **Documentation:** [AppSearch overview](https://developer.android.com/guide/topics/search/appsearch)

## See also

For persisting structured relational data that AppSearch results link to, see the `room` skill. For exposing search results to the system assistant via structured intents, consider the `app-actions` skill. When full-text search is needed alongside relational queries in an existing Room database, Room's built-in FTS4/FTS5 support may be preferable to a separate AppSearch index — evaluate both before committing.
