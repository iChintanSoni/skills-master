## Examples

Minimal, original snippets contrasting the two patterns and showing the seams
that matter for testability.

### 1. MV: model in the environment, thin view

```swift
@Observable
final class CartModel {
    private(set) var items: [Item] = []
    var total: Decimal { items.reduce(0) { $0 + $1.price } }
    func add(_ item: Item) { items.append(item) }
}

struct CartView: View {
    @Environment(CartModel.self) private var cart
    var body: some View {
        VStack {
            Text(cart.total, format: .currency(code: "USD"))
            List(cart.items) { Text($0.name) }
        }
    }
}

// Injection at the root scene:
@main
struct ShopApp: App {
    @State private var cart = CartModel()
    var body: some Scene {
        WindowGroup { CartView().environment(cart) }
    }
}
```

### 2. MVVM: a ViewModel that earns its keep

Use a ViewModel when there is real orchestration to isolate and test.

```swift
@MainActor @Observable
final class SearchViewModel {
    enum State { case idle, loading, results([Item]), failed(String) }
    private(set) var state: State = .idle
    private let service: SearchService
    init(service: SearchService) { self.service = service }

    func search(_ query: String) async {
        state = .loading
        do { state = .results(try await service.find(query)) }
        catch { state = .failed(error.localizedDescription) }
    }
}
```

### 3. Testing logic without rendering UI

The same test works whether the logic lives in a model (MV) or a ViewModel.

```swift
import Testing

@Test func searchSurfacesResults() async {
    let vm = SearchViewModel(service: StubSearchService(returning: [.sample]))
    await vm.search("swift")
    guard case .results(let items) = vm.state else {
        Issue.record("expected results"); return
    }
    #expect(items.count == 1)
}
```

### 4. @Bindable for two-way editing into a shared model

```swift
struct ProfileEditor: View {
    @Bindable var profile: ProfileModel   // ProfileModel is @Observable
    var body: some View {
        Form {
            TextField("Name", text: $profile.name)
            Toggle("Public", isOn: $profile.isPublic)
        }
    }
}
```
