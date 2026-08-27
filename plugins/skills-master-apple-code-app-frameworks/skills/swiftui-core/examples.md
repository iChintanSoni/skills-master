# swiftui-core — examples

## Extracting a subview to narrow invalidation

```swift
struct OrderRow: View {
    let order: Order

    var body: some View {
        HStack {
            Text(order.name)
            Spacer()
            StatusBadge(state: order.state)   // re-renders only when state changes
        }
    }
}

struct StatusBadge: View {
    let state: OrderState
    var body: some View {
        Text(state.label)
            .padding(.horizontal, 8)
            .background(state.tint, in: .capsule)
    }
}
```

## Modifier order changes the result

```swift
// Background fills the padded (larger) area.
Text("Saved").padding(12).background(.thinMaterial, in: .rect(cornerRadius: 8))

// Background hugs the text; padding then adds clear space outside it.
Text("Saved").background(.thinMaterial, in: .rect(cornerRadius: 8)).padding(12)
```

## ViewBuilder with conditional content

```swift
struct Banner<Content: View>: View {
    let isError: Bool
    @ViewBuilder var content: () -> Content

    var body: some View {
        content()
            .padding()
            .background(isError ? .red.opacity(0.15) : .green.opacity(0.15))
            .clipShape(.rect(cornerRadius: 10))
    }
}
```

## Multiple previews for realistic coverage

```swift
#Preview("Light") {
    OrderRow(order: .sample)
}

#Preview("Dark, XXL type") {
    OrderRow(order: .sample)
        .preferredColorScheme(.dark)
        .dynamicTypeSize(.accessibility3)
}
```
