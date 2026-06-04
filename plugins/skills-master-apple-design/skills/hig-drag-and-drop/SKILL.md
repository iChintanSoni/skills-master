---
name: hig-drag-and-drop
description: Applies Apple Human Interface Guidelines to drag and drop — drag affordances, drop-target feedback, multi-item and cross-app drags, spring-loading, and accessible alternatives. Use when designing or reviewing a drag-and-drop interaction, deciding what should be draggable, critiquing drag previews or drop highlighting, or planning accessible and keyboard fallbacks. Produces design critique and recommendations, not code.
---

## When to use

Use when designing or reviewing a drag-and-drop interaction — deciding what content should be draggable, how to signal valid drop destinations, what the drag preview communicates, and how multi-item or cross-app drops behave. This is a design-judgment skill: it produces recommendations and do/don't critique, not Swift code. For implementation, hand off to the SwiftUI or UIKit drag-and-drop code skill.

## Core guidance

- Treat drag and drop as an **enhancement, never the only path.** Anything draggable must also be reachable through an ordinary control — a menu, button, or copy/paste — so the interaction stays optional and discoverable.
- Make draggable content **feel grabbable on contact.** Lift the item under the finger or pointer as a translucent preview that clearly represents what's moving, and keep the original visible so people can tell the drag is in progress, not destructive.
- **Signal valid destinations only while content hovers over them.** Highlight the container, show an insertion point, or animate a gap — then remove the cue the instant the drag moves away. Don't light up every possible target at once; reveal acceptance in context.
- Communicate the **effect of the drop before release** — move versus copy, and where the item will land. If a destination can't accept the content, show a no-drop state rather than failing silently after release.
- Support **multiple items in one drag.** Let people add to a drag in progress, badge the stack with a count, and design destinations to accept a set, not just a single item. Offer multiple representations of dragged content, highest fidelity first, so each destination takes the best form it can use.
- Consider **spring-loading** for navigation during a drag: pausing over a tab, folder, or disclosure control should open it so people can drill in without dropping. Make it an undiscoverable-optional embellishment — never the sole way to activate a control.
- Plan for **cross-app drops** on iPad and Mac. Vend content other apps can use (standard types, file URLs, text) and accept common types on arrival; degrade gracefully when an app offers something you don't recognize.
- Provide an **accessible alternative.** Expose drag sources and drop points to VoiceOver so assistive-tech users can pick up and place items without a continuous gesture, and ensure a non-drag route (menu command, keyboard) achieves the same outcome.

## Platform notes

On iPhone, drag and drop works within an app and shines in reordering and into compose fields; it isn't a cross-app multitasking mechanism the way it is on larger displays. On iPad, drag between apps in Split View, Slide Over, and the same app's multiple windows is a headline interaction — design previews and drop zones expecting inter-app transfers and multi-item stacks. On Mac, support both pointer drags and the Finder/desktop as a drop source and destination, and respect spring-loaded folders and toolbar items. In visionOS, drags are driven by eye-and-pinch; give generous, clearly highlighted drop targets since precise placement is harder, and keep previews legible at a distance.

## Pitfalls

- Making drag the only way to perform an action, leaving no menu, button, or copy/paste fallback.
- Highlighting all potential destinations up front, or leaving highlight stuck after the drag leaves the target.
- A vague or empty drag preview that doesn't show what's being moved, or hiding the source so it looks deleted mid-drag.
- Treating spring-loading as a primary control rather than a discovered shortcut.
- Shipping without VoiceOver drag sources/drop points or any keyboard-reachable equivalent.

## References

- **Human Interface Guidelines:** [Drag and drop](https://developer.apple.com/design/human-interface-guidelines/drag-and-drop)
- **WWDC:** [Accessible Drag and Drop (WWDC18)](https://developer.apple.com/videos/play/wwdc2018/241/)
- **WWDC:** [Meet Transferable (WWDC22)](https://developer.apple.com/videos/play/wwdc2022/10062/)
- **Documentation:** [Adopting drag and drop using SwiftUI](https://developer.apple.com/documentation/SwiftUI/Adopting-drag-and-drop-using-SwiftUI)
- **Documentation:** [Adopting drag and drop in a custom view (UIKit)](https://developer.apple.com/documentation/uikit/drag_and_drop/adopting_drag_and_drop_in_a_custom_view)

## See also

- Implementation: the SwiftUI drag-and-drop code skill (`draggable`/`dropDestination`, `Transferable`) and the UIKit drag-and-drop interaction skill implement this pattern.
- Related design skills: HIG accessibility (for VoiceOver drag sources, keyboard equivalents) and HIG layout (for insertion points and drop-zone affordances).
- Apple HIG: Drag and drop (see sources).
