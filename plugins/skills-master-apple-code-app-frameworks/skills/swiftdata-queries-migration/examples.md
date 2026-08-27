# swiftdata-queries-migration — examples

## Live view read with Query and Predicate

```swift
struct ActiveTasksView: View {
    @Query(
        filter: #Predicate<Task> { !$0.isDone },
        sort: \Task.dueDate,
        order: .forward
    ) private var tasks: [Task]

    var body: some View {
        List(tasks) { task in
            Text(task.title)
        }
    }
}
```

## Paged imperative fetch off the main actor

```swift
@ModelActor
actor TaskStore {
    func page(_ index: Int, size: Int = 50) throws -> [Task] {
        var descriptor = FetchDescriptor<Task>(
            predicate: #Predicate { !$0.isArchived },
            sortBy: [SortDescriptor(\.dueDate)]
        )
        descriptor.fetchOffset = index * size
        descriptor.fetchLimit = size
        return try modelContext.fetch(descriptor)
    }
}
```

## Counting without loading rows

```swift
func openCount(in context: ModelContext) throws -> Int {
    let descriptor = FetchDescriptor<Task>(
        predicate: #Predicate { !$0.isDone }
    )
    return try context.fetchCount(descriptor)
}
```

## Custom migration stage that backfills a value

```swift
static let v1ToV2 = MigrationStage.custom(
    fromVersion: SchemaV1.self,
    toVersion: SchemaV2.self,
    willMigrate: { context in
        for task in try context.fetch(FetchDescriptor<SchemaV1.Task>()) {
            task.priority = task.isUrgent ? 2 : 0
        }
        try context.save()
    },
    didMigrate: nil
)
```
