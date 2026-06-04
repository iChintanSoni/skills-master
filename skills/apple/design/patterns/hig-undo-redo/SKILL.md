---
name: hig-undo-redo
description: "Design guidance and critique for reversible actions on Apple platforms: shake-to-undo, the three-finger edit gestures on iPhone and iPad, undo/redo affordances and menu items on Mac, and choosing undo over confirmation for destructive operations. Use when reviewing or designing editing flows, delete/destructive actions, undo/redo buttons or alerts, or text-editing gestures, or when someone asks whether an action should be undoable or guarded by a confirmation dialog. Produces UX critique grounded in Apple's Human Interface Guidelines, not code."
tags: [hig, undo, redo, gestures, destructive, patterns]
x-skills-master:
  domain: apple
  class: design
  category: patterns
  platforms: [ios, ipados, macos, visionos]
  pairs_with: []
  sources:
    - https://developer.apple.com/design/human-interface-guidelines/undo-and-redo
    - https://developer.apple.com/design/human-interface-guidelines/inputs/touchscreen-gestures
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

# hig-undo-redo

## When to use

Use this skill when critiquing or designing any flow where people change content and might want to reverse it: text and drawing editors, list reordering, bulk edits, and especially delete or other destructive actions. Reach for it when reviewing undo/redo buttons, undo/redo alerts, the system edit gestures, or a confirmation dialog that guards a risky action. The goal is judgment about reversibility and affordance placement, not implementation.

## Core guidance

- **Favor reversibility over interrogation.** Make actions undoable rather than gating them behind an "Are you sure?" prompt. A robust undo lets people explore and recover, and removes friction from common edits. Reserve confirmation dialogs for actions that genuinely cannot be undone or carry serious consequence.
- **Lean on the standard system gestures.** On iPhone, shaking the device offers undo/redo, and a three-finger swipe (left to undo, right to redo) and three-finger tap work in editable text. Honor these everywhere editing happens instead of inventing custom gestures, so muscle memory carries across apps.
- **Add dedicated undo/redo buttons sparingly.** Providing multiple ways to do the same thing is confusing. Only surface explicit buttons when the app truly warrants them (heavy editing, no obvious gesture); when you do, use the system-standard undo/redo symbols and place them where people expect, such as the navigation bar or toolbar.
- **Write specific undo/redo labels.** The shake alert and Mac Edit menu prepend "Undo "/"Redo "; supply a short, precise continuation ("Undo Typing", "Redo Move") so people know exactly what reverses. Never leave a bare, unlabeled "Undo".
- **Keep undo scoped to the current context.** Undo and redo should affect only what is visible and active now, with an immediate, observable effect, never silently reaching into a different screen, document, or earlier state.
- **Reserve confirmation for the truly irreversible, and make the safe path obvious.** When you must confirm, name the consequence plainly ("This can't be undone"), style the destructive choice as a destructive (red) button, and let Cancel be the prominent default so an accidental tap does no harm.
- **Don't overload the shake gesture.** If shake means undo/redo, it should mean nothing else in your app; a second meaning makes behavior unpredictable.
- **Show what changed.** After an undo or redo, scroll to or highlight the affected content so the reversal is legible rather than a silent state flip people have to hunt for.

## Platform notes

- **iPhone / iPad:** Shake-to-undo and the three-finger swipe/tap edit gestures are the primary, expected affordances; iPad text views also surface undo/redo in the edit menu. With the Liquid Glass design (iOS/iPadOS 26), any explicit undo/redo buttons live in the floating navigation bar or toolbar layer above content. Keep them few so the glass capsule stays uncluttered.
- **Mac:** Undo/Redo belong in the Edit menu with their standard keyboard shortcuts, carrying descriptive action names ("Undo Move"). Mac users expect deep, multi-step undo history rather than shake; gestures are not a substitute for the menu commands.
- **visionOS / iPadOS with hardware keyboard:** Provide the standard undo/redo menu commands and shortcuts; do not rely on shake, which isn't available, and ensure pointer/keyboard users have a discoverable path.

## Pitfalls

- Guarding routine, recoverable actions with confirmation dialogs, training people to dismiss alerts reflexively.
- A destructive button styled like the safe choice, or made the default, inviting accidental data loss.
- Bare "Undo"/"Redo" with no action name, leaving people unsure what will change.
- Custom gestures that collide with the system three-finger or shake conventions.
- Undo that reaches across contexts or produces no visible result, so people can't tell it worked.
- Offering both buttons and gestures redundantly when one would be clearer.

## References

- **Human Interface Guidelines:** [Undo and redo](https://developer.apple.com/design/human-interface-guidelines/undo-and-redo)
- **Human Interface Guidelines:** [Gestures](https://developer.apple.com/design/human-interface-guidelines/inputs/touchscreen-gestures)
- **WWDC:** [Dive deeper into SwiftData (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10196/)
- **Documentation:** [UndoManager](https://developer.apple.com/documentation/foundation/undomanager)

## See also

- Pair this with the SwiftUI/UIKit code skill that wires up undo registration and the undo manager (for example a SwiftUI undo or UndoManager implementation skill) to turn these design decisions into working behavior.
- Relates to the HIG alerts and confirmation-dialog design skill for shaping the rare confirmation that an irreversible action still warrants, and to the HIG gestures and text-editing skills for the three-finger and shake interactions referenced here.
