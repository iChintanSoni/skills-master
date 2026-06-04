## Example: Start the transaction listener at app launch

Run this for the lifetime of the app so renewals and refunds that occur outside a purchase flow are still handled.

```swift
@main
struct ShopApp: App {
    @State private var store = Store()
    var body: some Scene {
        WindowGroup { ContentView().environment(store) }
    }
}

@MainActor @Observable final class Store {
    private var listener: Task<Void, Never>?
    init() {
        listener = Task.detached {
            for await update in Transaction.updates {
                guard let txn = try? update.payloadValue else { continue }
                await self.refreshEntitlements()
                await txn.finish()
            }
        }
    }
    deinit { listener?.cancel() }
}
```

## Example: Compute owned products from current entitlements

Recompute access on launch and after each update instead of caching a flag.

```swift
func refreshEntitlements() async -> Set<String> {
    var owned: Set<String> = []
    for await result in Transaction.currentEntitlements {
        guard case .verified(let txn) = result else { continue }
        if txn.revocationDate == nil { owned.insert(txn.productID) }
    }
    return owned
}
```

## Example: Observe subscription status for a group

Map the renewal state to a user-facing state, treating grace and retry periods as still-active.

```swift
func currentTier(for groupID: String) async -> String {
    guard let statuses = try? await Product.SubscriptionInfo.status(for: groupID) else {
        return "free"
    }
    for status in statuses {
        switch status.state {
        case .subscribed, .inGracePeriod, .inBillingRetryPeriod: return "premium"
        default: continue
        }
    }
    return "free"
}
```

## Example: A SwiftUI subscription paywall

`SubscriptionStoreView` handles eligibility and layout from a group ID.

```swift
struct Paywall: View {
    var body: some View {
        SubscriptionStoreView(groupID: "21435678") {
            VStack {
                Text("Unlock Pro").font(.largeTitle.bold())
                Text("All features, no limits.")
            }
            .padding()
        }
        .subscriptionStoreControlStyle(.prominentPicker)
        .storeButton(.visible, for: .restorePurchases)
    }
}
```
