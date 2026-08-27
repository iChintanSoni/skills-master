# swiftui-state-data-flow — examples

## Owning a model and binding into it

```swift
@Observable final class Profile {
    var displayName = ""
    var isPublic = false
}

struct ProfileScreen: View {
    @State private var profile = Profile()   // single source of truth

    var body: some View {
        @Bindable var profile = profile      // local bindings into the reference model
        Form {
            TextField("Display name", text: $profile.displayName)
            Toggle("Public", isOn: $profile.isPublic)
        }
    }
}
```

## Passing a model down vs. binding a value

```swift
struct CartScreen: View {
    @State private var cart = Cart()
    @State private var promoCode = ""

    var body: some View {
        CartSummary(cart: cart)              // plain object: read-only child
        PromoField(code: $promoCode)         // $ binding: child mutates parent value
    }
}

struct CartSummary: View { let cart: Cart; var body: some View { Text("Items: \(cart.count)") } }
struct PromoField: View { @Binding var code: String; var body: some View { TextField("Promo", text: $code) } }
```

## Dependency injection through the Environment

```swift
@Observable final class Session { var userID: String? }

struct RootView: View {
    @State private var session = Session()
    var body: some View {
        HomeView().environment(session)      // inject once at a common ancestor
    }
}

struct HomeView: View {
    @Environment(Session.self) private var session   // read back by type
    var body: some View { Text(session.userID ?? "Signed out") }
}
```

## Main-actor mutation with background work

```swift
@Observable @MainActor final class FeedModel {
    var headlines: [String] = []

    func refresh() async {
        let fetched = await Self.loadFromNetwork()  // off-main work returns values
        headlines = fetched                         // assign back on the main actor
    }

    nonisolated static func loadFromNetwork() async -> [String] { ["Story A", "Story B"] }
}
```
