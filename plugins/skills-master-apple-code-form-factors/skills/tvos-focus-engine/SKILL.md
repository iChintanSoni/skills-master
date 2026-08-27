---
name: tvos-focus-engine
description: "Explains the UIKit focus engine and its SwiftUI surface: focusable and FocusState, focusSection and focusScope, prefersDefaultFocus and defaultFocus, resetFocus, focus effects and hoverEffect, UIFocusGuide and UIFocusSystem redirection, UIFocusDebugger, and Siri Remote directional input through onMoveCommand, onExitCommand, UIPress, and GCMicroGamepad. Use when focus lands in the wrong place, gets trapped, or refuses to move, when a custom view needs to become focusable, or when you must redirect focus across a gap in the layout."
license: MIT
metadata:
  version: "1.0.0"
  snapshot-date: "2026-08-25"
---

## When to use

Use this skill whenever indirect input drives your interface: an Apple TV screen navigated with the Siri Remote, an iPad driven by a hardware keyboard, or a visionOS view traversed without a direct pointer. It is the reference for making a custom view focusable, choosing a sensible starting focus, grouping controls so directional moves feel spatial, redirecting focus across a gap the engine will not jump, styling the focused state, and reading raw remote input when the standard model is not enough.

It is the interaction half of the tvOS pair — `tvos-app-structure` builds the screens, this skill makes them navigable.

## Core guidance

### Understand what the focus engine will and will not do

Apple's model is deliberately narrow, and most focus bugs come from fighting it:

- Exactly one item is focused at a time, and **only the focus engine sets it**. There is no API to say "focus this view" or "move focus left"; you express *preferences* and the engine resolves them.
- Directional movement is user-driven. When the user swipes, the engine searches for a focusable item in that direction. If it finds nothing, focus stays put and UIKit posts `UIFocusSystem.movementDidFailNotification` — a useful breadcrumb when a swipe seems to do nothing.
- Focus resolves down a chain of focus environments. Each environment that receives focus either keeps it or hands it to one of its `preferredFocusEnvironments`, recursing until something accepts. The window's root view controller is the first environment consulted.
- Programmatic changes are legitimate but should be rare — restoring focus after content is replaced, for instance. Ask for a re-evaluation with `setNeedsFocusUpdate()` followed by `updateFocusIfNeeded()`, or `UIFocusSystem.requestFocusUpdate(to:)`; never assume the request is honored.

### SwiftUI: make it focusable, then say where focus should start

- **Do** mark custom interactive views with `.focusable()` (tvOS 15). Standard `Button`, `NavigationLink`, `TextField`, and list rows are already focusable; a bare `HStack` with a tap gesture is not.
- **Do** use `.focusable(_:interactions:)` with `FocusInteractions` (tvOS 17) when a view is focusable for a specific reason — `.activate` for something you select, `.edit` for something you type into. `.automatic` keeps the default.
- **Do** track focus with `@FocusState` and bind it via `.focused(_:)` or `.focused(_:equals:)` (tvOS 15). Read `@Environment(\.isFocused)` inside a subview when you only need to restyle on focus and do not need to write focus back.
- **Do** declare a starting point. `.defaultFocus(_:_:priority:)` (tvOS 16) sets a focus-state value as the default for a region; pass `DefaultFocusEvaluationPriority.userInitiated` when your preference must win over whatever the engine would otherwise pick. The older, still-current pairing is `@Namespace` plus `.focusScope(_:)` and `.prefersDefaultFocus(_:in:)` (tvOS 14), which is what you want when the default is a *view*, not a state value.
- **Do** re-run default evaluation with the `resetFocus` environment action after you swap a screen's contents: `resetFocus(in: namespace)`.

```swift
struct ShelfView: View {
    @Namespace private var shelf
    @FocusState private var focused: Item.ID?
    @Environment(\.resetFocus) private var resetFocus

    var body: some View {
        ScrollView(.horizontal) {
            LazyHStack(spacing: 40) {
                ForEach(items) { item in
                    PosterButton(item)
                        .focused($focused, equals: item.id)
                        .prefersDefaultFocus(item.id == items.first?.id, in: shelf)
                }
            }
        }
        .focusScope(shelf)
        .focusSection()
        .onChange(of: items) { resetFocus(in: shelf) }
    }
}
```

### Group and redirect

- **Do** apply `.focusSection()` (tvOS 15) to a container whose *frame* should guide movement. It tells the engine to treat the container's bounds and its focusable descendants as a cohort, which is how you get a swipe up from a row of cards to reach a header button that is not directly above any single card.
- **Do** fall back to `UIFocusGuide` (tvOS 9) when SwiftUI cannot express the redirect — it is an invisible layout guide you add with `addLayoutGuide(_:)`, constrain to span the gap, and point somewhere by setting `preferredFocusEnvironments` (tvOS 10). Toggle `isEnabled` to turn a redirect off rather than tearing the guide down. Apple's own guidance is to use guides only when the built-in spatial search genuinely fails.
- **Don't** reach for `focusGroupIdentifier`. That property on `UIView` and `UIFocusEnvironment` is iOS 14, iPadOS, Mac Catalyst, and visionOS — it is **not available on tvOS**. Use `.focusSection()` or a focus guide instead.
- **Do** let collection and table views remember their place: `remembersLastFocusedIndexPath` returns focus to the row the user left rather than resetting to the first, and `UIViewController.restoresFocusAfterTransition` does the same across a push and pop.

### Show focus, and let the system do it

- **Do** rely on the system treatment first — a focused card lifts, brightens, and tilts with parallax. `.buttonStyle(.card)` (`CardButtonStyle`, tvOS 14) gives artwork buttons that behavior with no padding of its own.
- **Do** use `.hoverEffect(_:)` with `HoverEffect.lift` (tvOS 16) or `.highlight` (tvOS 17) for custom focusable content, and `UIImageView.adjustsImageWhenAncestorFocused` (with `masksFocusEffectToContents` and `focusedFrameGuide`) when bridging to UIKit. `UILabel.enablesMarqueeWhenAncestorFocused` scrolls a truncated title while its card is focused.
- **Do** turn effects off deliberately with `.focusEffectDisabled(_:)` (tvOS 17) — for a container that draws its own highlight — and check `@Environment(\.isFocusEffectEnabled)` before drawing a substitute.
- **Don't** signal focus with color alone. Combine a scale or elevation change with the color shift so the state reads from across the room.

### Reading remote input directly

- **Do** prefer the command modifiers over raw events: `.onMoveCommand(perform:)` with `MoveCommandDirection` for edge taps and arrow keys, `.onExitCommand(perform:)` for the Menu/Back button, and `.onPlayPauseCommand(perform:)` for the transport button (all tvOS 13). They only fire while the view has focus.
- **Do** drop to `UIPress` and `UIPress.PressType` in UIKit when you need button granularity — `.select`, `.menu`, `.playPause`, the four arrows, `.pageUp`/`.pageDown`, and the `.tvRemoteFourColors`/`.tvRemoteOneTwoThree` groups — and scope a recognizer with `UIGestureRecognizer.allowedPressTypes`.
- **Do** use the Game Controller framework's `GCMicroGamepad` for the Siri Remote as a controller: `dpad`, `buttonA`, `buttonX`, `buttonMenu`, plus `reportsAbsoluteDpadValues` and `allowsRotation` for games that want the touch surface as an analog pad rather than a focus driver.
- **Do** make SceneKit and SpriteKit nodes participate by setting the node's `focusBehavior` to `.focusable`.

## Platform notes

- **What is tvOS-only.** `.focusSection()`, `.focusScope(_:)`, `.prefersDefaultFocus(_:in:)`, `resetFocus`, `.onMoveCommand`, `.onExitCommand`, `.onPlayPauseCommand`, and `CardButtonStyle` are declared for tvOS (some also macOS/watchOS) and are unavailable on iOS, iPadOS, and visionOS.
- **What is shared.** `.focusable(_:)`, `.focusable(_:interactions:)`, `FocusState`, `.focused(_:equals:)`, `.defaultFocus(_:_:priority:)`, `.focusEffectDisabled(_:)`, `.hoverEffect(_:)`, `UIFocusEnvironment`, `UIFocusGuide`, `UIFocusSystem`, and `UIFocusDebugger` all exist on iOS/iPadOS and visionOS — that is what makes hardware-keyboard navigation on iPad work.
- **Deployment floors.** `UIFocusGuide` tvOS 9 (`preferredFocusEnvironments` tvOS 10), `UIFocusSystem` and `UIFocusDebugger` tvOS 11, `UIFocusMovementHint` tvOS 12, `.prefersDefaultFocus`/`CardButtonStyle` tvOS 14, `.focusable`/`FocusState`/`.focusSection()` tvOS 15, `.defaultFocus`/`HoverEffect.lift` tvOS 16, `FocusInteractions`/`.focusEffectDisabled`/`HoverEffect.highlight` tvOS 17.
- **Debugging.** `UIFocusDebugger` is a runtime tool for the LLDB console: `status()`, `checkFocusability(for:)` (which explains *why* an item is not focusable), `preferredFocusEnvironments(for:)`, and `simulateFocusUpdateRequest(from:)`. Start there before adding guides.

## Pitfalls

- A custom view with a tap gesture but no `.focusable()` — it works in a touch preview and is silently unreachable with a remote.
- Trying to set the focused item directly and treating a `@FocusState` write as a guarantee; the engine may decline, and code that assumes success desynchronizes.
- Using `focusGroupIdentifier` on tvOS. It compiles nowhere useful there and the intended grouping never happens.
- Adding a `UIFocusGuide` without activating its constraints, or without setting `preferredFocusEnvironments` — an unconstrained guide occupies no region and redirects nothing.
- Overlapping or bidirectionally inconsistent guides that bounce focus between two regions, or a guide pointing at a view that is itself unfocusable.
- Replacing a screen's content without calling `resetFocus(in:)` (or `setNeedsFocusUpdate()`), leaving focus on a view that no longer exists and no visible highlight anywhere.
- Consuming every press in a UIKit press handler, which blocks Menu from backing out of the screen.
- Layouts with diagonal or misaligned targets, where a swipe right lands somewhere unexpected because the engine searched the swipe direction and found the wrong nearest item first.

## References

- **Documentation:** [Focus (SwiftUI)](https://developer.apple.com/documentation/swiftui/focus)
- **Documentation:** [Focus-based navigation (UIKit)](https://developer.apple.com/documentation/uikit/focus-based-navigation)
- **Documentation:** [About focus interactions for Apple TV](https://developer.apple.com/documentation/uikit/about-focus-interactions-for-apple-tv)
- **Documentation:** [Creating custom navigation interactions](https://developer.apple.com/documentation/uikit/creating-custom-navigation-interactions)
- **Documentation:** [UIFocusDebugger](https://developer.apple.com/documentation/uikit/uifocusdebugger)
- **Human Interface Guidelines:** [Focus and selection](https://developer.apple.com/design/human-interface-guidelines/focus-and-selection)

## See also

- **tvos-app-structure** — the scenes, tabs, and cards whose focus behavior this skill governs.
- A SwiftUI accessibility skill for VoiceOver focus, which uses the parallel `AccessibilityFocusState` and `.accessibilityFocused(_:)` API rather than these modifiers.
- The tvOS media playback skill for focus inside the system transport bar, where the player owns focus and your overlays must stay clear of it.
