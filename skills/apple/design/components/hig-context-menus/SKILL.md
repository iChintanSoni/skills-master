---
name: hig-context-menus
description: "Design critique and guidance for context menus that surface item-relevant actions via long-press or secondary-click, with optional previews, sensible grouping, destructive-item placement, and discoverability (the same actions must exist elsewhere). Use when reviewing or designing long-press/right-click menus, deciding context menu vs edit menu, choosing menu actions and previews, grouping or marking destructive commands, or auditing discoverability on iOS, iPadOS, macOS, or visionOS. Produces HIG-grounded design recommendations, not code."
tags: [hig, context-menus, menus, components, discoverability]
x-skills-master:
  domain: apple
  class: design
  category: components
  platforms: [ios, ipados, macos, visionos]
  pairs_with: []
  sources:
    - https://developer.apple.com/design/human-interface-guidelines/context-menus
    - https://developer.apple.com/design/human-interface-guidelines/edit-menus
    - https://developer.apple.com/design/human-interface-guidelines/menus-and-actions
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Use this skill to critique or design a context menu — the menu that appears when someone long-presses (iOS, iPadOS, visionOS), Control-clicks, or secondary-clicks (macOS, iPadOS) a specific onscreen item. Reach for it when deciding which actions belong in the menu, whether to show a preview, how to group commands, where destructive items go, and crucially whether those actions are discoverable elsewhere. Also use it to settle context menu vs edit menu, since they look similar under Liquid Glass but solve different problems.

## Core guidance

- **Make the menu a shortcut, not the only path.** Always expose every context-menu action somewhere visible too — a toolbar, swipe action, detail view, or main menu. A context menu accelerates frequent commands; it must never be the sole way to reach functionality, because hidden gestures aren't discoverable. Audit each item: "Where else can someone do this?"
- **Keep it relevant and short.** Include only actions that apply to the specific item under the finger or cursor, in their current state. Don't dump rarely used or app-wide settings here; curate to the handful people most likely need now. A long, generic menu signals you haven't decided what matters.
- **Group with intent and put destructive last.** Use inline sections to cluster related commands (e.g. share, organize, manage), and place destructive actions like Delete in their own trailing section, styled in red. Never make a destructive item the default or the easiest to hit by accident; for high-stakes deletes, confirm.
- **Use a preview to add confidence, not decoration.** An optional preview (a larger or richer rendering of the target) helps people confirm they're acting on the right item before choosing a command. Show one when the item is visually ambiguous or content-rich; skip it for plain rows where the menu alone is clear.
- **Pair every command with a symbol.** Include an SF Symbol or icon beside each item — it reinforces meaning and speeds scanning. Keep labels to concise verbs ("Duplicate", "Pin"), and reflect state with checkmarks or selection indicators rather than redundant rows.
- **Cap submenus at one level.** Submenus can tame complexity, but more than one nested level is hard to navigate, especially by touch. If you need deeper structure, the menu is probably trying to do too much — push secondary actions into the detail view instead.
- **Choose context menu vs edit menu deliberately.** Use an edit menu for operations on a *text or content selection* (Cut, Copy, Paste, Select, Look Up, Translate); use a context menu for actions on a *whole item* (a message, photo, file, list row). Don't reproduce selection-only commands in an item context menu, and don't bury per-item actions inside an edit menu.

## Platform notes

- **iOS, iPadOS, visionOS:** Reveal via long press; on iPadOS also Control-click or secondary-click with a trackpad/mouse. Under the Liquid Glass design (iOS 26 and later), context menus render as floating glass and expand into a single vertical, scannable list — design for top-to-bottom reading, not horizontal scrolling. In visionOS, the menu appears as a glass surface near the looked-at item; keep targets and spacing generous for gaze-plus-pinch.
- **macOS:** Reveal via Control-click or right/secondary-click. Mirror the same commands in the menu bar and, where relevant, the toolbar so keyboard- and mouse-first users find them. Respect platform conventions (Get Info, Show in Finder) when the item maps to a system concept.
- **Cross-platform:** Context menus aren't a tvOS or watchOS pattern — don't assume parity there. Keep the action set and ordering consistent across the platforms you do support so muscle memory transfers.

## Pitfalls

- Treating the context menu as the only way to delete, rename, or share — invisible to anyone who never long-presses.
- Overloading the menu with every possible action, so the one command people want is buried.
- Destructive actions placed mid-list or as the first item, inviting mis-taps.
- Two or more levels of submenu, turning a shortcut into a maze.
- Confusing edit menu and context menu — e.g. putting "Copy text" selection commands on a whole-row item menu, or hiding "Delete message" inside an edit menu.
- Text-only items with no symbols, making the menu slow to scan and visually flat against Liquid Glass.

## References

- **Human Interface Guidelines:** [Context menus](https://developer.apple.com/design/human-interface-guidelines/context-menus)
- **Human Interface Guidelines:** [Edit menus](https://developer.apple.com/design/human-interface-guidelines/edit-menus)
- **Human Interface Guidelines:** [Menus and actions](https://developer.apple.com/design/human-interface-guidelines/menus-and-actions)
- **WWDC:** [Meet Liquid Glass (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/219/)
- **WWDC:** [Get to know the new design system (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/356/)
- **WWDC:** [Design with iOS pickers, menus and actions (WWDC20)](https://developer.apple.com/videos/play/wwdc2020/10205/)
- **Documentation:** [contextMenu (SwiftUI)](https://developer.apple.com/documentation/swiftui/contextmenu)

## See also

- The SwiftUI/UIKit code skill that implements this component (context menu and `UIMenu` construction, previews, deferred items) — pair this critique with it before building.
- The menus and actions design skill for pull-down/pop-up menus and the menu bar, which share the icon-label-accessory anatomy unified under the new design system.
- The edit menus / selection-and-input design skill for text-selection commands and how they now expand into vertical menus under Liquid Glass.
- The buttons and toolbars design skill, since toolbar and swipe actions are where you guarantee the discoverability that context menus assume.
