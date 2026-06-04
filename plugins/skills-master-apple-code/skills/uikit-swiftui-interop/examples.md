## Wrap a UIKit view with a Coordinator

```swift
struct RatingControl: UIViewRepresentable {
    @Binding var rating: Int

    func makeCoordinator() -> Coordinator { Coordinator(rating: $rating) }

    func makeUIView(context: Context) -> UIStepper {
        let stepper = UIStepper()
        stepper.maximumValue = 5
        stepper.addTarget(context.coordinator,
                          action: #selector(Coordinator.changed(_:)),
                          for: .valueChanged)
        return stepper
    }

    func updateUIView(_ stepper: UIStepper, context: Context) {
        let v = Double(rating)
        if stepper.value != v { stepper.value = v }
    }

    @MainActor final class Coordinator: NSObject {
        @Binding var rating: Int
        init(rating: Binding<Int>) { _rating = rating }
        @objc func changed(_ s: UIStepper) { rating = Int(s.value) }
    }
}
```

## Custom sizing for an intrinsic UIKit view

```swift
struct WrappedLabel: UIViewRepresentable {
    let text: String

    func makeUIView(context: Context) -> UILabel {
        let label = UILabel()
        label.numberOfLines = 0
        return label
    }

    func updateUIView(_ label: UILabel, context: Context) {
        label.text = text
    }

    func sizeThatFits(_ proposal: ProposedViewSize,
                      uiView: UILabel,
                      context: Context) -> CGSize? {
        let width = proposal.width ?? .greatestFiniteMagnitude
        return uiView.sizeThatFits(CGSize(width: width, height: .infinity))
    }
}
```

## Host SwiftUI inside a UIKit controller

```swift
final class ProfileViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        let host = UIHostingController(rootView: ProfileView())
        host.sizingOptions = .intrinsicContentSize
        addChild(host)
        host.view.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(host.view)
        NSLayoutConstraint.activate([
            host.view.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            host.view.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            host.view.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor)
        ])
        host.didMove(toParent: self)
    }
}
```

## SwiftUI in a collection view cell

```swift
let registration = UICollectionView.CellRegistration<UICollectionViewListCell, Item> {
    cell, _, item in
    cell.contentConfiguration = UIHostingConfiguration {
        HStack {
            Image(systemName: item.symbol)
            Text(item.title).font(.headline)
            Spacer()
        }
    }
    // Self-resizing is automatic; no manual height calculation needed.
}
```
