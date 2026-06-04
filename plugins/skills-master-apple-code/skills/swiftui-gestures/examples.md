## Tap with count and an accessible equivalent

```swift
struct LikeButton: View {
    @State private var liked = false

    var body: some View {
        Image(systemName: liked ? "heart.fill" : "heart")
            .onTapGesture(count: 2) { liked.toggle() }
            .accessibilityLabel("Like")
            .accessibilityAddTraits(.isButton)
            .accessibilityAction { liked.toggle() }
    }
}
```

## Long-press then drag (sequenced)

```swift
struct PickUpToMove: View {
    @GestureState private var lifted = false
    @State private var position = CGPoint(x: 150, y: 150)

    var body: some View {
        Circle().frame(width: 80, height: 80)
            .scaleEffect(lifted ? 1.2 : 1.0)
            .position(position)
            .gesture(
                LongPressGesture(minimumDuration: 0.3)
                    .updating($lifted) { value, state, _ in state = value }
                    .sequenced(before: DragGesture())
                    .onEnded { sequence in
                        if case .second(_, let drag?) = sequence {
                            position = drag.location
                        }
                    }
            )
    }
}
```

## Simultaneous magnify and rotate

```swift
struct PhotoManipulator: View {
    @State private var scale: CGFloat = 1
    @State private var angle: Angle = .zero

    var body: some View {
        Image("photo")
            .scaleEffect(scale)
            .rotationEffect(angle)
            .gesture(
                MagnifyGesture()
                    .onChanged { scale = $0.magnification }
                    .simultaneously(with: RotateGesture()
                        .onChanged { angle = $0.rotation })
            )
    }
}
```

## Making the full frame tappable

```swift
struct Row: View {
    let onTap: () -> Void

    var body: some View {
        HStack {
            Text("Settings")
            Spacer() // clear space is not tappable by default
        }
        .padding()
        .contentShape(.interaction, Rectangle())
        .onTapGesture(perform: onTap)
    }
}
```
