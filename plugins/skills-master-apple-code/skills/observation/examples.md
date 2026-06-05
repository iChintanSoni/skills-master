# observation — examples

## Observable model with ignored and derived properties

```swift
import Observation

@MainActor
@Observable
final class Cart {
    var items: [Item] = []
    @ObservationIgnored var analytics: Analytics?   // not tracked
    var subtotal: Decimal { items.reduce(0) { $0 + $1.price } }
}

struct SubtotalLabel: View {
    let cart: Cart   // plain let; still updates when subtotal changes
    var body: some View {
        Text(cart.subtotal, format: .currency(code: "USD"))
    }
}
```

## Matching the wrapper to ownership

```swift
struct EditorScreen: View {
    @State private var cart = Cart()          // view owns the instance
    var body: some View { CartForm(cart: cart) }
}

struct CartForm: View {
    @Bindable var cart: Cart                  // two-way bindings to passed-in model
    var body: some View {
        TextField("Coupon", text: $cart.coupon)
    }
}
```

## Injecting and reading via the environment

```swift
struct RootView: View {
    @State private var cart = Cart()
    var body: some View {
        StoreView().environment(cart)
    }
}

struct StoreView: View {
    @Environment(Cart.self) private var cart
    var body: some View { Text("\(cart.items.count) items") }
}
```

## Reacting outside SwiftUI with withObservationTracking

```swift
func observeCount(of cart: Cart) {
    withObservationTracking {
        _ = cart.items.count            // establishes the dependency
    } onChange: {
        print("items changed")
        Task { @MainActor in observeCount(of: cart) }  // re-register
    }
}
```
