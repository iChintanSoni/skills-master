## Sections, selection, and edit actions

```swift
struct Reminder: Identifiable {
    let id = UUID()
    var title: String
    var done: Bool
}

struct ReminderList: View {
    @State private var reminders: [Reminder]
    @State private var selection: Set<Reminder.ID> = []

    var body: some View {
        List(selection: $selection) {
            Section("Active") {
                ForEach($reminders) { $reminder in
                    Toggle(reminder.title, isOn: $reminder.done)
                }
                .onDelete { reminders.remove(atOffsets: $0) }
                .onMove { reminders.move(fromOffsets: $0, toOffset: $1) }
            }
        }
        .toolbar { EditButton() }
    }
}
```

## Searchable, filtered list

```swift
struct ContactsView: View {
    let contacts: [Contact]
    @State private var query = ""

    private var results: [Contact] {
        query.isEmpty ? contacts
            : contacts.filter { $0.name.localizedCaseInsensitiveContains(query) }
    }

    var body: some View {
        List(results) { contact in
            Text(contact.name)
        }
        .searchable(text: $query, prompt: "Search contacts")
    }
}
```

## Multi-column Table with sorting

```swift
struct FileTable: View {
    @State private var files: [FileRow]
    @State private var order = [KeyPathComparator(\FileRow.name)]
    @State private var selection: Set<FileRow.ID> = []

    var body: some View {
        Table(files, selection: $selection, sortOrder: $order) {
            TableColumn("Name", value: \.name)
            TableColumn("Size", value: \.size) { Text($0.formattedSize) }
            TableColumn("Modified", value: \.modified) { Text($0.modified, style: .date) }
        }
        .onChange(of: order) { _, newOrder in files.sort(using: newOrder) }
    }
}
```

## Custom swipe actions with full swipe

```swift
List(messages) { message in
    MessageRow(message)
        .swipeActions(edge: .leading) {
            Button { toggleFlag(message) } label: {
                Label("Flag", systemImage: "flag")
            }
            .tint(.orange)
        }
        .swipeActions(edge: .trailing, allowsFullSwipe: true) {
            Button(role: .destructive) { archive(message) } label: {
                Label("Archive", systemImage: "archivebox")
            }
        }
}
```
