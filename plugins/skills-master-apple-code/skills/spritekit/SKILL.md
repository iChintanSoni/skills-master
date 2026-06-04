---
name: spritekit
description: "Builds 2D games and animated graphics with SpriteKit: scene graph, the update loop, SKAction animations, physics with contact handling, particle emitters, and embedding scenes in SwiftUI via SpriteView. Use when creating sprite-based games, side-scrollers, or animated 2D effects on Apple platforms, or when integrating an SKScene into a SwiftUI app."
---

# SpriteKit 2D games

## When to use

Reach for SpriteKit when you need a retained-mode 2D scene graph: arcade and puzzle games, side-scrollers, animated overlays, or particle-driven effects. It supplies sprites, text, a built-in physics engine, frame-synced updates, and Xcode visual editors for scenes and particles. For declarative UI prefer SwiftUI and drop a single `SpriteView` where the live scene belongs. For 3D, use RealityKit instead; SpriteKit composes with it only through bridging nodes.

## Core guidance

- Model your world as a tree under one `SKScene`: add `SKSpriteNode` (images/color rects), `SKLabelNode` (text), and container `SKNode` groups with `addChild`. Position children in parent coordinates and lean on the parent/child transform rather than recomputing absolute positions.
- Drive per-frame logic in `update(_:)`; it passes the current time, so store the previous timestamp and act on the delta rather than assuming a fixed frame rate. Keep this method cheap — it runs every frame.
- Animate with `SKAction` instead of hand-written tweening. Compose `.sequence`, `.group`, and `.repeatForever`, then `node.run(_:withKey:)`; remove with `removeAction(forKey:)`. Actions are reusable value-like recipes, so build once and run on many nodes.
- For collisions, give bodies `categoryBitMask`, `collisionBitMask` (who they bounce off), and `contactTestBitMask` (which contacts notify you). Set `scene.physicsWorld.contactDelegate` and implement `didBegin(_:)` / `didEnd(_:)`. Body order in `SKPhysicsContact` is undefined — inspect both `bodyA` and `bodyB`.
- Never mutate the physics world or remove nodes inside a contact callback; the simulation is read-only there. Set a flag and apply the change in the next `update(_:)`.
- Load particle effects from `.sks` files with `SKEmitterNode(fileNamed:)` and design them in Xcode's particle editor; for one-shot bursts, add the emitter then run an action that removes it after its lifetime.
- Use `SKTexture` atlases and reuse textures across sprites to cut draw calls; round node positions and prefer `nearest` filtering for pixel art.

```swift
struct GameView: View {
    var scene: SKScene {
        let s = SKScene(size: CGSize(width: 640, height: 480))
        s.scaleMode = .aspectFit
        return s
    }
    var body: some View {
        SpriteView(scene: scene)
            .ignoresSafeArea()
    }
}
```

## Platform notes

- `SpriteView` renders an `SKScene` inside SwiftUI on iOS/iPadOS, macOS, tvOS, and visionOS; pass `isPaused`, `preferredFramesPerSecond`, `options`, and `debugOptions` (for example `.showsFPS`, `.showsNodeCount`) to control the embedded renderer.
- tvOS has no touch input — handle focus and the Siri Remote via game controller and focus APIs; design menus around `SKLabelNode` focus rather than tap targets.
- On visionOS a SpriteView appears on a 2D window or volume surface; SpriteKit content stays planar, so use it for HUDs, mini-games, and 2D panels rather than spatial scenes.
- Build the scene once and keep a stable reference (for example in an `@State` or model object); recreating the `SKScene` on every SwiftUI body evaluation resets game state and leaks work.

## Pitfalls

- Recomputing the scene inside `body` (as a computed property) restarts the game on every redraw. Hold the scene in state.
- Assuming a fixed timestep. Frame rate varies; multiply movement by the elapsed delta from `update(_:)` or objects move at different speeds across devices.
- Forgetting `contactTestBitMask`. Bodies collide physically with only `collisionBitMask` set, but `didBegin(_:)` never fires unless the contact mask matches.
- Removing or repositioning nodes inside `didBegin(_:)`, which corrupts the in-flight simulation. Defer to the next update.
- Retain cycles from action completion closures that strongly capture the scene or node. Use `[weak self]` (or `[weak node]`).
- Leaving emitters in the tree forever. Long-lived high-birth-rate emitters tank performance; cap particles and remove finished bursts.

## References

- **Documentation:** [SpriteKit](https://developer.apple.com/documentation/spritekit)
- **Documentation:** [SpriteView](https://developer.apple.com/documentation/spritekit/spriteview)
- **Documentation:** [SKPhysicsContactDelegate](https://developer.apple.com/documentation/spritekit/skphysicscontactdelegate)
- **WWDC:** [What's New in SpriteKit (WWDC16)](https://developer.apple.com/videos/play/wwdc2016/610/)
- **WWDC:** [Going Beyond 2D with SpriteKit (WWDC17)](https://developer.apple.com/videos/play/wwdc2017/609/)
- **Sample Code:** [DemoBots: Building a Cross Platform Game](https://developer.apple.com/library/archive/samplecode/DemoBots/Introduction/Intro.html)

## See also

Pair this with a SwiftUI fundamentals skill when wiring scene state into views through `SpriteView`, and with a GameController skill for hardware input on tvOS and physical controllers. For audio, a Core Haptics or AVFoundation playback skill complements gameplay feedback. When you outgrow 2D and need spatial or 3D content, move to a RealityKit skill rather than extending SpriteKit.
