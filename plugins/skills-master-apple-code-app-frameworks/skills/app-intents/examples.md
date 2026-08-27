## Define an AppEntity with a query

```swift
struct TaskEntity: AppEntity {
  static let typeDisplayRepresentation: TypeDisplayRepresentation = "Task"
  static let defaultQuery = TaskQuery()

  let id: UUID
  let name: String

  var displayRepresentation: DisplayRepresentation {
    DisplayRepresentation(title: "\(name)")
  }
}

struct TaskQuery: EntityQuery {
  func entities(for ids: [UUID]) async throws -> [TaskEntity] {
    await TaskStore.shared.tasks(matching: ids)
  }

  func suggestedEntities() async throws -> [TaskEntity] {
    await TaskStore.shared.recentTasks()
  }
}
```

## Expose an App Shortcut with phrases

```swift
struct TaskShortcuts: AppShortcutsProvider {
  static var appShortcuts: [AppShortcut] {
    AppShortcut(
      intent: CompleteTaskIntent(),
      phrases: [
        "Complete a task in \(.applicationName)",
        "Mark a \(.applicationName) task done"
      ],
      shortTitle: "Complete Task",
      systemImageName: "checkmark.circle"
    )
  }
}
```

## Run an intent from an interactive widget

```swift
struct ToggleFavoriteIntent: AppIntent {
  static let title: LocalizedStringResource = "Toggle Favorite"

  @Parameter(title: "Task") var task: TaskEntity

  func perform() async throws -> some IntentResult {
    await TaskStore.shared.toggleFavorite(id: task.id)
    return .result()
  }
}

// Inside the widget's SwiftUI view:
Button(intent: ToggleFavoriteIntent(task: task)) {
  Image(systemName: task.isFavorite ? "star.fill" : "star")
}
```

## Custom resolution with disambiguation

```swift
struct OpenProjectIntent: AppIntent {
  static let title: LocalizedStringResource = "Open Project"

  @Parameter(title: "Project") var project: ProjectEntity

  func perform() async throws -> some IntentResult & OpensIntent {
    guard await ProjectStore.shared.exists(project.id) else {
      throw $project.needsValueError("Which project?")
    }
    return .result(opensIntent: ShowProjectIntent(id: project.id))
  }
}
```
