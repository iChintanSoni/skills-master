## SwiftUI List and Table review checklist

### Identity and data
- [ ] Every row model conforms to `Identifiable`, or the `id:` key path is unique and stable.
- [ ] No iteration over array indices or `id: \.self` on mutable values.
- [ ] The displayed collection is derived from search text when `searchable` is present.

### Editing and selection
- [ ] `onDelete` / `onMove` are attached to the `ForEach`, and each mutates the source collection exactly once.
- [ ] `List(selection:)` binds to the element `ID` type (single or `Set`).
- [ ] An `EditButton` (or `editActions:` initializer) is provided wherever move/delete is expected.
- [ ] Destructive swipe actions use `role: .destructive`; full swipe is only enabled where it's intuitive.

### Async and refresh
- [ ] `refreshable` performs real async work and returns when the data is updated.
- [ ] Refresh and search are placed on the `List` or an ancestor in the navigation stack.

### Table specifics
- [ ] Column count fits iPad width; the iPhone single-column fallback is acceptable.
- [ ] `sortOrder` binds to `KeyPathComparator` and data re-sorts on change.
- [ ] User column customization (Mac) is persisted if exposed.

### Performance and platform
- [ ] Row `body` is cheap; heavy work is hoisted out or cached.
- [ ] Lists are not wrapped in a `ScrollView` that defeats lazy row creation.
- [ ] Liquid Glass / system list styling is left to the framework rather than hardcoded backgrounds.
- [ ] Behavior verified on each targeted platform (especially watchOS/tvOS fallbacks).
