# swiftui-navigation — examples

## Value-based stack with one destination registration

```swift
enum Route: Hashable { case detail(Product.ID), checkout }

struct ShopRoot: View {
    @State private var path: [Route] = []
    var body: some View {
        NavigationStack(path: $path) {
            ProductList { path.append(.detail($0)) }
                .navigationDestination(for: Route.self) { route in
                    switch route {
                    case .detail(let id): ProductDetail(id: id)
                    case .checkout: CheckoutView()
                    }
                }
        }
    }
}
```

## Deep link as a single array assignment

```swift
func open(_ url: URL, into path: inout [Route]) {
    // myapp://product/42 -> push list context, then the detail
    guard url.host == "product",
          let id = Int(url.lastPathComponent) else { return }
    path = [.detail(id)]   // replaces the whole stack in one step
}
```

## Split view with a stack in the detail column

```swift
struct LibraryView: View {
    @State private var selection: Genre?
    @State private var path: [Book.ID] = []
    var body: some View {
        NavigationSplitView {
            GenreSidebar(selection: $selection)
        } detail: {
            NavigationStack(path: $path) {
                BookGrid(genre: selection) { path.append($0) }
                    .navigationDestination(for: Book.ID.self) { BookDetail(id: $0) }
            }
        }
    }
}
```

## Restoring the path with SceneStorage

```swift
struct RootView: View {
    @SceneStorage("nav") private var data: Data?
    @State private var path = NavigationPath()
    var body: some View {
        NavigationStack(path: $path) { Home() }
            .onChange(of: path) { _, new in
                data = try? JSONEncoder().encode(new.codable) // requires Codable routes
            }
            .task {
                if let r = data, let c = try? JSONDecoder().decode(
                    NavigationPath.CodableRepresentation.self, from: r) {
                    path = NavigationPath(c)
                }
            }
    }
}
```
