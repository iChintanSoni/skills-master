---
name: hig-menus
description: Design critique and guidance for menus on Apple platforms following the Human Interface Guidelines. Use when designing or reviewing pull-down menus, pop-up buttons, submenus, or menu items; deciding between a menu, action sheet, or context menu; ordering and grouping commands; styling destructive items; or judging whether a menu is too deep. Produces HIG-grounded UX recommendations and critique, not code.
---

## When to use

Use this skill to critique or design menus that reveal commands or options on tap. Reach for it when choosing between a pull-down menu, a pop-up button, a submenu, an action sheet, or a context menu; when ordering and grouping items; when styling destructive actions; or when a menu has grown too long or too deep to scan. This skill gives design judgment grounded in the HIG, not implementation code.

## Core guidance

- **Pull-down vs pop-up — pick by intent.** Use a pull-down menu for a set of commands or actions related to a button's purpose (it keeps no selection). Use a pop-up button for a flat list of mutually exclusive options or states, where the control reflects the current selection after a choice. Don't use a pop-up button to fire commands.
- **Keep menus shallow.** Prefer a single flat list. Limit submenus to one level deep — deeper nesting is hard to navigate and forgettable. Reserve a submenu for a tight cluster of closely related commands, and give it a title that predicts its contents without opening it.
- **Group and order for scanning.** Put the most common and likely items near the top. Group related actions and separate groups with dividers; in practice aim for no more than about three groups so the menu stays scannable. Order items consistently across screens so people build muscle memory.
- **Make destructive items obvious and recoverable.** Place destructive commands (Delete, Remove) at the end, visually separated, and render them in the system's destructive (red) style. For irreversible or high-stakes actions, confirm the intent with an action sheet (iOS/iPadOS) or alert rather than acting immediately.
- **Use symbols to aid recognition, not decorate.** Add a leading SF Symbol only when it speeds recognition and stays consistent across the menu; mixing some items with icons and others without looks unfinished. Don't restate the symbol in the label.
- **Write short, action-led labels.** Start command labels with a verb, use title-style capitalization, and keep them to a few words. Show state with a checkmark or selected style rather than a second, redundant item.
- **Menu vs action sheet vs context menu.** Use a menu to surface commands from a visible button. Use an action sheet for a short set of choices in response to an action — especially a destructive one needing confirmation. Use a context menu for actions tied to a specific element, surfaced by long-press or right-click; don't hide a primary action only there.

## Platform notes

- **iOS / iPadOS:** Menus and toolbar buttons sit in the Liquid Glass layer; a menu opening from a glass toolbar button morphs into a thicker, more refractive glass surface that floats above content. Keep menus brief so they don't overwhelm the screen. Reserve action sheets for confirmations.
- **macOS:** The menu bar is the comprehensive home for commands — every action should be reachable there, even when also offered in a pull-down or context menu. Honor standard menu titles, ordering, and keyboard shortcuts; pop-up and pull-down buttons follow the same intent split.
- **visionOS:** Menus appear on glass and respond to eye and hand input; keep targets generously sized and lists short to reduce dwell and scrolling in space.
- **watchOS:** Favor a few large, tappable actions over long menus; lean on context (Digital Crown, swipe) instead of deep nesting.
- **tvOS:** Menus are focus-driven; keep them short and linear so users can traverse them quickly with the remote, and avoid submenus where possible.

## Pitfalls

- Burying frequent or primary actions inside a submenu or context menu where people won't discover them.
- Long, ungrouped menus with no separators that force people to read every line.
- A destructive item placed mid-list, not styled red, or fired with no confirmation.
- Using a pop-up button for commands, or a pull-down menu for mutually exclusive choices.
- Inconsistent item order or icon usage across similar menus, breaking learned patterns.
- More than one level of submenu, or menus so deep they become a navigation maze.

## References

- **Human Interface Guidelines:** [Menus and actions](https://developer.apple.com/design/human-interface-guidelines/menus-and-actions)
- **Human Interface Guidelines:** [Pull-down buttons](https://developer.apple.com/design/human-interface-guidelines/pull-down-buttons)
- **Human Interface Guidelines:** [Pop-up buttons](https://developer.apple.com/design/human-interface-guidelines/pop-up-buttons)
- **Human Interface Guidelines:** [Context menus](https://developer.apple.com/design/human-interface-guidelines/context-menus)
- **WWDC:** [Design with iOS pickers, menus and actions (WWDC20)](https://developer.apple.com/videos/play/wwdc2020/10205/)
- **WWDC:** [Meet Liquid Glass (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/219/)

## See also

- Pair this with the SwiftUI/UIKit code skill that implements menus (Menu, pull-down and pop-up button styles, and the context-menu modifier) when you move from critique to build.
- For confirmation flows, see the action-sheets and alerts design skills.
- For element-specific actions surfaced by long-press or right-click, see the context-menus design skill.
- For destructive-action wording and recovery, see the writing/alerts design guidance.
