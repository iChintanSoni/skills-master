## Explicit spring on a scoped state change

Animate only the mutation you intend, with a tuned spring preset.

```swift
@State private var liked = false

Button {
    withAnimation(.bouncy) { liked.toggle() }
} label: {
    Image(systemName: liked ? "heart.fill" : "heart")
        .foregroundStyle(liked ? .pink : .secondary)
        .scaleEffect(liked ? 1.25 : 1.0)
}
```

## Asymmetric insertion and removal transition

Different motion for entering versus leaving, driven by an identity change.

```swift
@State private var showBanner = false

VStack {
    if showBanner {
        Text("Saved")
            .padding()
            .transition(.asymmetric(insertion: .push(from: .top),
                                    removal: .opacity))
    }
    Button("Toggle") { withAnimation(.snappy) { showBanner.toggle() } }
}
```

## PhaseAnimator attention pulse

A self-running, multi-step loop with per-phase animation timing.

```swift
Image(systemName: "bell.fill")
    .phaseAnimator([1.0, 1.3, 1.0]) { icon, scale in
        icon.scaleEffect(scale)
    } animation: { _ in
        .easeInOut(duration: 0.4)
    }
```

## Custom Animatable shape

Expose `animatableData` so SwiftUI can interpolate a value it cannot animate by default.

```swift
struct Arc: Shape {
    var endAngle: Double
    var animatableData: Double {
        get { endAngle }
        set { endAngle = newValue }
    }
    func path(in rect: CGRect) -> Path {
        Path { p in
            p.addArc(center: CGPoint(x: rect.midX, y: rect.midY),
                     radius: rect.width / 2,
                     startAngle: .degrees(0),
                     endAngle: .degrees(endAngle),
                     clockwise: false)
        }
    }
}
```
